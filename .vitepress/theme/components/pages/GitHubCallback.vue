<template>
  <section class="github-callback" aria-labelledby="github-callback-title">
    <iconify-icon :icon="error ? 'mdi:alert-circle-outline' : 'mdi:github'" aria-hidden="true"></iconify-icon>
    <h1 id="github-callback-title">{{ error ? 'GitHub 登录未完成' : '正在完成 GitHub 登录' }}</h1>
    <p :role="error ? 'alert' : 'status'">{{ error || '正在验证授权并返回刚才的文档页面，请稍候…' }}</p>
    <div v-if="error" class="callback-actions">
      <button type="button" @click="retryLogin">重新登录 GitHub</button>
      <a :href="returnUrl">返回文档</a>
      <a :href="fallbackUrl" target="_blank" rel="noopener noreferrer">不登录，直接去 GitHub 提交</a>
    </div>
    <p v-if="error" class="callback-hint">登录需要在发起授权的同一标签页完成。关闭标签页后，登录凭证会失效。</p>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import {
  beginGitHubLogin,
  completeGitHubLogin,
  consumeOAuthCallback,
  GitHubAuthError,
  OAUTH_RETURN_KEY,
  safeReturnUrl,
} from '../../utils/oauth';
import { ISSUE_REPO } from '../../utils/reportIssue';

const error = ref('');
const returnUrl = ref('/');
const fallbackUrl = ref(`https://github.com/${ISSUE_REPO}/issues/new`);
let loginController: AbortController | null = null;

onMounted(async () => {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  // 授权码只使用一次；立即清理地址栏，避免复制链接时带出授权信息。
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
  try {
    returnUrl.value = safeReturnUrl(window.sessionStorage.getItem(OAUTH_RETURN_KEY), window.location.origin);
    fallbackUrl.value = `https://github.com/${ISSUE_REPO}/issues/new?title=${encodeURIComponent('[文档反馈] GitHub 登录遇到问题')}&body=${encodeURIComponent(`### 来源页面\n${returnUrl.value}\n\n### 问题描述\n<!-- 请描述登录时遇到的问题 -->`)}`;
    const callback = consumeOAuthCallback(params);
    returnUrl.value = callback.returnUrl;
    loginController = new AbortController();
    await completeGitHubLogin(callback.code, loginController.signal);
    // 只允许回到本标签页授权前记录的同源文档地址。
    window.location.replace(returnUrl.value);
  } catch (failure) {
    error.value = failure instanceof GitHubAuthError ? failure.message : '登录未能完成。请检查网络与浏览器会话存储设置，然后重新登录，或直接去 GitHub 提交反馈。';
  }
});

onBeforeUnmount(() => loginController?.abort());

function retryLogin() {
  try {
    beginGitHubLogin(returnUrl.value);
  } catch (failure) {
    error.value = failure instanceof GitHubAuthError ? failure.message : '暂时无法登录，请直接前往 GitHub 提交反馈。';
  }
}
</script>

<style scoped>
.github-callback { max-width: 640px; margin: 64px auto; padding: 32px 24px; color: var(--vp-c-text-1); text-align: center; }
.github-callback > iconify-icon { font-size: 48px; color: var(--vp-c-brand-1); }
.github-callback h1 { margin: 20px 0; font-size: 26px; font-weight: 600; }
.github-callback p { color: var(--vp-c-text-2); line-height: 1.8; }
.callback-actions { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 16px; margin: 24px 0; font-size: 14px; }
.callback-actions button { padding: 10px 16px; border-radius: 8px; background: var(--vp-button-brand-bg); color: var(--vp-button-brand-text); font-weight: 600; }
.callback-actions button:hover { background: var(--vp-button-brand-hover-bg); }
.callback-actions a { color: var(--vp-c-brand-1); text-decoration: underline; text-underline-offset: 3px; }
.callback-hint { margin-top: 24px; font-size: 13px; }
button:focus-visible, a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
</style>
