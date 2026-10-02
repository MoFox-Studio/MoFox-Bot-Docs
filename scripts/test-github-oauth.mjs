import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { afterEach, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';

// 直接编译实际前端模块；只注入 Vite 构建环境与浏览器网络，不安装测试依赖。
const require = createRequire(import.meta.url);
const vueUrl = pathToFileURL(require.resolve('vue')).href;
const oauthSource = await readFile(new URL('../.vitepress/theme/utils/oauth.ts', import.meta.url), 'utf8');
const draftSource = await readFile(new URL('../.vitepress/theme/utils/reportIssue.ts', import.meta.url), 'utf8');
const repo = JSON.parse(draftSource.match(/export const ISSUE_REPO = ("[^"]+");/)[1]);
let moduleId = 0;

async function loadAuth(env = {}) {
  const configured = { VITE_GH_CLIENT_ID: 'mock-client', VITE_GH_TOKEN_URL: '/mock-token', DEV: true, ...env };
  const source = oauthSource
    .replace('from "vue"', `from ${JSON.stringify(vueUrl)}`)
    .replace('import { ISSUE_REPO } from "./reportIssue";', `const ISSUE_REPO = ${JSON.stringify(repo)};`)
    .replaceAll('import.meta.env', `(${JSON.stringify(configured)})`);
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  // 每个测试使用独立模块，避免共享登录状态影响结果。
  return import(`data:text/javascript;base64,${Buffer.from(compiled + `\n// isolated-module-${++moduleId}`).toString('base64')}`);
}

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function browser(fetch = async () => { throw new Error('禁止真实网络请求'); }) {
  const assigned = [];
  const fake = {
    sessionStorage: new MemoryStorage(),
    location: { origin: 'http://localhost:5173', href: 'http://localhost:5173/docs/example?tab=1#step', assign: (value) => assigned.push(value) },
    crypto: webcrypto,
    fetch,
    setTimeout,
    clearTimeout,
  };
  globalThis.window = fake;
  return { ...fake, assigned };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function pending(auth, storage, state = 'test-state', created = Date.now()) {
  storage.setItem(auth.OAUTH_STATE_KEY, state);
  storage.setItem(auth.OAUTH_RETURN_KEY, 'http://localhost:5173/docs/example?tab=1#step');
  storage.setItem(auth.OAUTH_CREATED_KEY, created);
}

afterEach(() => { delete globalThis.window; });

test('来源地址限制同源并排除回调别名，正常页面保留参数与锚点', async () => {
  const auth = await loadAuth();
  const origin = 'http://localhost:5173';
  for (const value of ['https://outside.invalid/', 'javascript:alert(1)', 'http://name@localhost:5173/', '/docs/feedback/callback/', '/docs/feedback/callback.html', '/docs/feedback/callback/index.html']) {
    assert.equal(auth.safeReturnUrl(value, origin), origin + '/');
  }
  assert.equal(auth.safeReturnUrl('/docs/example?tab=1#step', origin), origin + '/docs/example?tab=1#step');
});

test('授权仅请求public_repo，使用新随机state和本地回调地址', async () => {
  const auth = await loadAuth();
  const fake = browser();
  auth.beginGitHubLogin();
  const first = new URL(fake.assigned[0]);
  assert.equal(first.origin, 'https://github.com');
  assert.equal(first.searchParams.get('scope'), 'public_repo');
  assert.equal(first.searchParams.get('redirect_uri'), 'http://localhost:5173/docs/feedback/callback/');
  assert.match(first.searchParams.get('state'), /^[a-f0-9]{64}$/);
  assert.equal(fake.sessionStorage.getItem(auth.OAUTH_STATE_KEY), first.searchParams.get('state'));
  assert.equal(fake.sessionStorage.getItem(auth.OAUTH_RETURN_KEY), fake.location.href);
  auth.beginGitHubLogin();
  assert.notEqual(new URL(fake.assigned[1]).searchParams.get('state'), first.searchParams.get('state'));
});

test('生产授权使用固定正式回调地址', async () => {
  const auth = await loadAuth({ DEV: false });
  const fake = browser();
  auth.beginGitHubLogin();
  assert.equal(new URL(fake.assigned[0]).searchParams.get('redirect_uri'), 'https://docs.mofox.chat/docs/feedback/callback/');
});

test('配置缺失或存储不可写时不发起授权', async () => {
  const empty = await loadAuth({ VITE_GH_CLIENT_ID: '' });
  const fake = browser();
  assert.throws(() => empty.beginGitHubLogin(), /尚未配置/);
  const auth = await loadAuth();
  fake.sessionStorage.setItem = () => { throw new Error('blocked'); };
  assert.throws(() => auth.beginGitHubLogin(), /安全登录状态/);
  assert.deepEqual(fake.assigned, []);
});

test('合法回调一次性消费，重复使用与state不匹配均拒绝', async () => {
  const auth = await loadAuth();
  const fake = browser();
  pending(auth, fake.sessionStorage);
  const params = new URLSearchParams({ state: 'test-state', code: 'mock-code' });
  assert.equal(auth.consumeOAuthCallback(params).returnUrl, fake.location.href);
  assert.equal(fake.sessionStorage.getItem(auth.OAUTH_STATE_KEY), null);
  assert.throws(() => auth.consumeOAuthCallback(params), /安全校验失败/);
  pending(auth, fake.sessionStorage);
  assert.throws(() => auth.consumeOAuthCallback(new URLSearchParams({ state: 'other', code: 'mock-code' })), /安全校验失败/);
  assert.equal(fake.sessionStorage.getItem(auth.OAUTH_RETURN_KEY), null);
});

test('拒绝过期、未来时间、授权取消和缺少code的回调', async () => {
  const auth = await loadAuth();
  const fake = browser();
  for (const created of [Date.now() - 11 * 60 * 1000, Date.now() + 60 * 1000]) {
    pending(auth, fake.sessionStorage, 'test-state', created);
    assert.throws(() => auth.consumeOAuthCallback(new URLSearchParams({ state: 'test-state', code: 'mock-code' })), /已过期/);
  }
  pending(auth, fake.sessionStorage);
  assert.throws(() => auth.consumeOAuthCallback(new URLSearchParams({ state: 'test-state', error: 'access_denied' })), /取消/);
  pending(auth, fake.sessionStorage);
  assert.throws(() => auth.consumeOAuthCallback(new URLSearchParams({ state: 'test-state' })), /缺少授权码/);
});

test('换码期间退出登录，迟到的成功响应不能恢复会话', async () => {
  const auth = await loadAuth();
  const exchange = deferred();
  const fake = browser(async () => exchange.promise);
  const login = auth.completeGitHubLogin('mock-code');
  auth.logoutGitHub();
  exchange.resolve(json({ access_token: 'mock-session' }));
  await assert.rejects(login, /已取消/);
  assert.equal(auth.useGitHubAuth().token.value, '');
  assert.equal(fake.sessionStorage.getItem(auth.GITHUB_TOKEN_KEY), null);
});

test('离开回调页时abort，即使网络mock晚返回也不保存token', async () => {
  const auth = await loadAuth();
  const exchange = deferred();
  const fake = browser(async () => exchange.promise);
  const controller = new AbortController();
  const login = auth.completeGitHubLogin('mock-code', controller.signal);
  controller.abort();
  exchange.resolve(json({ access_token: 'mock-session' }));
  await assert.rejects(login, /已取消/);
  assert.equal(fake.sessionStorage.getItem(auth.GITHUB_TOKEN_KEY), null);
});

test('GitHub用户校验401时不保存无效凭证', async () => {
  const auth = await loadAuth();
  const fake = browser(async (url) => url === '/mock-token' ? json({ access_token: 'mock-invalid' }) : json({}, 401));
  await assert.rejects(auth.completeGitHubLogin('mock-code'), /登录已失效/);
  assert.equal(fake.sessionStorage.getItem(auth.GITHUB_TOKEN_KEY), null);
  assert.equal(auth.useGitHubAuth().token.value, '');
});

test('旧Issue请求的401不能清掉之后新登录的凭证', async () => {
  const auth = await loadAuth();
  const issue = deferred();
  let logins = 0;
  const fake = browser(async (url, options) => {
    if (url === '/mock-token') return json({ access_token: `mock-session-${++logins}` });
    if (url === 'https://api.github.com/user') return json({ login: 'mock-user', avatar_url: 'https://avatars.githubusercontent.com/u/1' });
    assert.equal(options.headers.Authorization, 'Bearer mock-session-1');
    return issue.promise;
  });
  await auth.completeGitHubLogin('first-code');
  const submission = auth.createGitHubIssue('标题', '正文');
  await auth.completeGitHubLogin('second-code');
  issue.resolve(json({}, 401));
  await assert.rejects(submission, /登录已失效/);
  assert.equal(auth.useGitHubAuth().token.value, 'mock-session-2');
  assert.equal(fake.sessionStorage.getItem(auth.GITHUB_TOKEN_KEY), 'mock-session-2');
});

test('当前Issue请求401清除会话，其他API失败不丢会话', async () => {
  const auth = await loadAuth();
  let issueStatus = 422;
  const fake = browser(async (url) => {
    if (url === '/mock-token') return json({ access_token: 'mock-session' });
    if (url === 'https://api.github.com/user') return json({ login: 'mock-user' });
    return json({}, issueStatus);
  });
  await auth.completeGitHubLogin('mock-code');
  await assert.rejects(auth.createGitHubIssue('标题', '正文'), /未接受表单/);
  assert.equal(fake.sessionStorage.getItem(auth.GITHUB_TOKEN_KEY), 'mock-session');
  issueStatus = 401;
  await assert.rejects(auth.createGitHubIssue('标题', '正文'), /登录已失效/);
  assert.equal(fake.sessionStorage.getItem(auth.GITHUB_TOKEN_KEY), null);
});

test('Worker不可达和限流均转为中文错误，不透露上游信息', async () => {
  const auth = await loadAuth();
  browser(async () => { throw new Error('private-upstream-detail'); });
  await assert.rejects(auth.completeGitHubLogin('mock-code'), /无法连接授权服务/);
  browser(async () => json({ error: 'private-upstream-detail' }, 429));
  await assert.rejects(auth.completeGitHubLogin('mock-code'), /过于频繁/);
});
