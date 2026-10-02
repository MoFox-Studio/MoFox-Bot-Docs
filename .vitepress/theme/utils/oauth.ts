import { readonly, ref } from "vue";
import { ISSUE_REPO } from "./reportIssue";

// 此处只有 Client ID（公开值）；Client Secret 仅存 Cloudflare Worker secret。
// GitHub Pages 构建时注入这两个 VITE_ 公开配置，不要使用 VITE_ 前缀保存 Secret。
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GH_CLIENT_ID || "";
export const GITHUB_TOKEN_URL =
  import.meta.env.VITE_GH_TOKEN_URL ||
  (import.meta.env.DEV ? "/__github-oauth/token" : "");
export const CALLBACK_PATH = "/docs/feedback/callback/";
export const GITHUB_TOKEN_KEY = "gh_issue_token";
export const OAUTH_STATE_KEY = "gh_issue_oauth_state";
export const OAUTH_RETURN_KEY = "gh_issue_return_url";
export const OAUTH_CREATED_KEY = "gh_issue_oauth_created";
const STATE_LIFETIME_MS = 10 * 60 * 1000;

export interface GitHubUser {
  login: string;
  avatarUrl: string;
}

const token = ref("");
const user = ref<GitHubUser | null>(null);
const loading = ref(false);
const authMessage = ref("");
let initialized = false;
let authGeneration = 0;

export class GitHubAuthError extends Error {}

function storage(): Storage {
  if (typeof window === "undefined") {
    throw new GitHubAuthError("请在浏览器中进行 GitHub 登录。");
  }
  try {
    return window.sessionStorage;
  } catch {
    throw new GitHubAuthError("浏览器禁止了会话存储，无法安全登录。请允许本站使用会话存储，或直接前往 GitHub 提交。");
  }
}

/** 防止被修改的会话数据把回调引向外站或重新进入回调页。 */
export function safeReturnUrl(value: string | null, origin: string): string {
  try {
    const url = new URL(value || "/", origin);
    if (
      url.origin === origin &&
      !url.username &&
      !url.password &&
      !/^\/docs\/feedback\/callback(?:\.html|\/index\.html|\/)?$/.test(url.pathname)
    ) {
      return url.href;
    }
  } catch {
    // 来源损坏时返回同源首页。
  }
  return new URL("/", origin).href;
}

function clearPendingAuth(session: Storage) {
  session.removeItem(OAUTH_STATE_KEY);
  session.removeItem(OAUTH_RETURN_KEY);
  session.removeItem(OAUTH_CREATED_KEY);
}

/** 发起授权前验证配置与存储；失败时由界面显示中文提示和 GitHub 兜底链接。 */
export function beginGitHubLogin(returnUrl?: string): void {
  if (typeof window === "undefined") return;
  if (!GITHUB_CLIENT_ID || !GITHUB_TOKEN_URL) {
    throw new GitHubAuthError("本站尚未配置 GitHub 站内登录。你仍可通过下方链接直接去 GitHub 提交反馈。");
  }
  const session = storage();
  let state: string;
  try {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    state = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    session.setItem(OAUTH_STATE_KEY, state);
    session.setItem(OAUTH_RETURN_KEY, safeReturnUrl(returnUrl || window.location.href, window.location.origin));
    session.setItem(OAUTH_CREATED_KEY, String(Date.now()));
  } catch {
    try { clearPendingAuth(session); } catch { /* 存储不可写时不能继续授权。 */ }
    throw new GitHubAuthError("无法保存安全登录状态。请检查浏览器的会话存储设置，或直接前往 GitHub 提交。");
  }
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", GITHUB_CLIENT_ID);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("redirect_uri", import.meta.env.DEV
    ? new URL(CALLBACK_PATH, window.location.origin).href
    : `https://docs.mofox.chat${CALLBACK_PATH}`);
  window.location.assign(authorize.href);
}

/** 回调状态只能消费一次，且必须来自同一标签页中的近期授权请求。 */
export function consumeOAuthCallback(params: URLSearchParams): { code: string; returnUrl: string } {
  if (typeof window === "undefined") throw new GitHubAuthError("请在浏览器中完成授权。");
  const session = storage();
  const expectedState = session.getItem(OAUTH_STATE_KEY);
  const created = Number(session.getItem(OAUTH_CREATED_KEY));
  const returnUrl = safeReturnUrl(session.getItem(OAUTH_RETURN_KEY), window.location.origin);
  clearPendingAuth(session);
  if (!expectedState || !params.get("state") || params.get("state") !== expectedState) {
    throw new GitHubAuthError("登录安全校验失败。请从原文档页面重新点击 GitHub 登录，不要重复使用授权链接。");
  }
  if (!created || Date.now() - created > STATE_LIFETIME_MS || created > Date.now()) {
    throw new GitHubAuthError("本次授权已过期。请重新登录后再提交反馈。");
  }
  if (params.has("error")) {
    throw new GitHubAuthError(params.get("error") === "access_denied"
      ? "你取消了 GitHub 授权。可以重新登录，或直接前往 GitHub 提交反馈。"
      : "GitHub 未能完成授权。请重新登录，或直接前往 GitHub 提交反馈。");
  }
  const code = params.get("code");
  if (!code) throw new GitHubAuthError("回调地址缺少授权码。请从文档页面重新登录。");
  return { code, returnUrl };
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  if (typeof window === "undefined") throw new GitHubAuthError("请在浏览器中操作。");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  else init.signal?.addEventListener("abort", cancel, { once: true });
  const timer = window.setTimeout(() => controller.abort(), 15000);
  try {
    return await window.fetch(url, { ...init, signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
  } finally {
    window.clearTimeout(timer);
    init.signal?.removeEventListener("abort", cancel);
  }
}

function apiHeaders(accessToken: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function fetchUser(accessToken: string, signal?: AbortSignal): Promise<GitHubUser> {
  const response = await fetchWithTimeout("https://api.github.com/user", { headers: apiHeaders(accessToken), signal });
  if (response.status === 401) throw new GitHubAuthError("GitHub 登录已失效，请重新登录。");
  if (!response.ok) throw new GitHubAuthError("暂时无法读取 GitHub 用户信息，请稍后重试。");
  const result = await response.json() as { login?: string; avatar_url?: string };
  if (!result.login || typeof result.login !== "string") throw new GitHubAuthError("GitHub 未返回有效的用户信息，请重新登录。");
  let avatarUrl = "";
  if (typeof result.avatar_url === "string") {
    try {
      const avatar = new URL(result.avatar_url);
      if (avatar.protocol === "https:" && avatar.hostname === "avatars.githubusercontent.com") avatarUrl = avatar.href;
    } catch { /* 无效头像使用本地 GitHub 图标。 */ }
  }
  return { login: result.login, avatarUrl };
}

export async function completeGitHubLogin(code: string, signal?: AbortSignal): Promise<void> {
  if (!GITHUB_TOKEN_URL) throw new GitHubAuthError("本站尚未配置授权服务。请直接前往 GitHub 提交反馈。");
  const generation = ++authGeneration;
  const checkCurrent = () => {
    if (generation !== authGeneration || signal?.aborted) {
      throw new GitHubAuthError("登录流程已取消，请重新登录。");
    }
  };
  let response: Response;
  try {
    response = await fetchWithTimeout(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal,
    });
  } catch {
    throw new GitHubAuthError("无法连接授权服务，或请求已超时。请稍后重新登录，也可以直接前往 GitHub 提交。");
  }
  if (!response.ok) {
    if (response.status === 429) throw new GitHubAuthError("登录请求过于频繁，请一小时后重试，或直接前往 GitHub 提交。");
    throw new GitHubAuthError("授权服务未能完成登录。授权码可能已过期，请重新登录或直接前往 GitHub 提交。");
  }
  const result = await response.json() as { access_token?: unknown };
  if (typeof result.access_token !== "string" || !result.access_token) {
    throw new GitHubAuthError("授权服务未返回有效凭证，请重新登录。");
  }
  checkCurrent();
  let profile: GitHubUser | null = null;
  let profileMessage = "";
  try {
    profile = await fetchUser(result.access_token, signal);
  } catch (error) {
    checkCurrent();
    if (error instanceof GitHubAuthError && error.message.includes("已失效")) {
      logoutGitHub();
      throw error;
    }
    profileMessage = error instanceof GitHubAuthError ? error.message : "暂时无法读取 GitHub 用户信息，请检查网络后刷新页面。";
  }
  // 离开回调页面或退出登录后，迟到的异步结果不能恢复会话。
  checkCurrent();
  const session = storage();
  try {
    session.setItem(GITHUB_TOKEN_KEY, result.access_token);
  } catch {
    throw new GitHubAuthError("浏览器无法保存登录凭证。请允许会话存储，或直接前往 GitHub 提交。");
  }
  token.value = result.access_token;
  user.value = profile;
  initialized = true;
  // 用户信息暂时不可用时仍保留有效 token，回到来源页可继续站内反馈。
  authMessage.value = profileMessage;
}

export function logoutGitHub(): void {
  ++authGeneration;
  token.value = "";
  user.value = null;
  loading.value = false;
  authMessage.value = "";
  if (typeof window === "undefined") return;
  try {
    const session = storage();
    session.removeItem(GITHUB_TOKEN_KEY);
    clearPendingAuth(session);
  } catch {
    authMessage.value = "已退出当前页面的登录；浏览器无法清理会话存储，请关闭此标签页以清除凭证。";
  }
}

async function initializeGitHubAuth(): Promise<void> {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  let saved: string | null;
  try {
    saved = storage().getItem(GITHUB_TOKEN_KEY);
  } catch (error) {
    authMessage.value = error instanceof GitHubAuthError ? error.message : "无法读取登录状态，请直接前往 GitHub 提交。";
    return;
  }
  if (!saved) return;
  token.value = saved;
  loading.value = true;
  const generation = ++authGeneration;
  try {
    const profile = await fetchUser(saved);
    if (generation === authGeneration) user.value = profile;
  } catch (error) {
    if (generation === authGeneration) {
      if (error instanceof GitHubAuthError && error.message.includes("已失效")) logoutGitHub();
      authMessage.value = error instanceof GitHubAuthError ? error.message : "暂时无法验证 GitHub 登录，请检查网络后刷新页面。";
    }
  } finally {
    if (generation === authGeneration) loading.value = false;
  }
}

export function useGitHubAuth() {
  return {
    token: readonly(token),
    user: readonly(user),
    loading: readonly(loading),
    message: readonly(authMessage),
    initialize: initializeGitHubAuth,
    logout: logoutGitHub,
  };
}

export async function createGitHubIssue(title: string, body: string): Promise<{ url: string; number: number }> {
  if (!token.value) throw new GitHubAuthError("请先登录 GitHub，或通过下方链接直接提交。");
  const submittedToken = token.value;
  const generation = authGeneration;
  let response: Response;
  try {
    response = await fetchWithTimeout(`https://api.github.com/repos/${ISSUE_REPO}/issues`, {
      method: "POST",
      headers: { ...apiHeaders(submittedToken), "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body }),
    });
  } catch {
    throw new GitHubAuthError("无法连接 GitHub，或请求已超时。提交可能已被接收，请先查看仓库的 Issue 列表，避免重复提交。");
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "GitHub 登录已失效。请先复制填写的内容再重新登录，或通过下方链接带着当前草稿去 GitHub 提交。",
      403: "GitHub 拒绝了提交。请检查授权是否包含 public_repo，或稍后重试。",
      404: "无法访问反馈仓库，请通过下方 GitHub 链接确认仓库状态。",
      410: "仓库暂时关闭了 Issue 功能，请稍后重试。",
      422: "GitHub 未接受表单。请检查标题和正文，避免重复或过于频繁地提交。",
      429: "GitHub 请求过于频繁，请稍后再提交。",
    };
    if (response.status === 401 && token.value === submittedToken && authGeneration === generation) logoutGitHub();
    throw new GitHubAuthError(messages[response.status] || "GitHub 暂时无法创建 Issue，请稍后重试或使用下方链接提交。");
  }
  const result = await response.json() as { html_url?: unknown; number?: unknown };
  if (typeof result.number !== "number" || !Number.isSafeInteger(result.number) || result.number <= 0 ||
      result.html_url !== `https://github.com/${ISSUE_REPO}/issues/${result.number}`) {
    throw new GitHubAuthError("GitHub 返回了无法识别的结果。请先查看仓库的 Issue 列表，确认反馈是否已创建。");
  }
  return { url: result.html_url, number: result.number };
}
