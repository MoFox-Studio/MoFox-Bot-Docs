<template>
  <div
    v-if="show || auth.token.value"
    class="report-issue"
  >
    <div v-if="auth.token.value" class="github-account" @keydown.esc="accountOpen = false">
      <button
        type="button"
        class="github-user"
        :aria-label="`GitHub 账号 ${auth.user.value?.login || '已登录'}，点击查看退出登录`"
        :aria-expanded="accountOpen"
        title="查看 GitHub 登录状态"
        @click="accountOpen = !accountOpen"
      >
        <img v-if="auth.user.value?.avatarUrl" :src="auth.user.value.avatarUrl" alt="" width="20" height="20" referrerpolicy="no-referrer" />
        <iconify-icon v-else icon="mdi:github" aria-hidden="true"></iconify-icon>
        <span class="github-username">{{ auth.user.value?.login || (auth.loading.value ? '加载中…' : '已登录') }}</span>
      </button>
      <div class="github-menu" :class="{ 'is-open': accountOpen }">
        <button type="button" @click="logout">退出登录</button>
      </div>
    </div>
    <button
      v-if="show"
      type="button"
      class="report-issue-button"
      :aria-label="auth.token.value ? '在本页开 Issue' : '登录 GitHub 并反馈本页'"
      :title="auth.token.value ? '在本页开 Issue（自动附带当前页面信息）' : '登录 GitHub 并反馈本页'"
      @click="openFeedback"
    >
      <iconify-icon icon="mdi:bug-outline" aria-hidden="true"></iconify-icon>
    </button>
    <IssueModal
      :open="modalOpen"
      :initial-title="draft.title.value"
      :initial-body="draft.body.value"
      :fallback-url="draft.issueUrl.value"
      :login-message="loginError || auth.message.value"
      @close="modalOpen = false"
      @login="login"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useData, useRoute } from 'vitepress';
import { useIssueDraft } from '../../utils/reportIssue';
import { beginGitHubLogin, GitHubAuthError, useGitHubAuth } from '../../utils/oauth';
import IssueModal from './IssueModal.vue';

const { frontmatter } = useData();
const route = useRoute();
const draft = useIssueDraft();
const auth = useGitHubAuth();
const modalOpen = ref(false);
const accountOpen = ref(false);
const loginError = ref('');

onMounted(auth.initialize);
watch(() => route.path, () => { modalOpen.value = false; accountOpen.value = false; });

function login() {
  loginError.value = '';
  try {
    beginGitHubLogin();
  } catch (error) {
    loginError.value = error instanceof GitHubAuthError ? error.message : '暂时无法登录 GitHub，请直接使用下方链接提交反馈。';
    modalOpen.value = true;
  }
}

async function openFeedback() {
  await draft.refresh();
  accountOpen.value = false;
  // 未登录时先授权；配置或存储不可用时，站内弹窗提供原有的 GitHub 预填跳转兜底。
  if (!auth.token.value) login();
  else modalOpen.value = true;
}

function logout() {
  auth.logout();
  accountOpen.value = false;
  loginError.value = '';
}

// 首页与显式关闭（frontmatter: feedback: false）时隐藏反馈按钮；登录状态仍可查看与退出。
const show = computed(() => {
  const fm = frontmatter.value as Record<string, unknown> | undefined;
  return fm?.layout !== 'home' && fm?.feedback !== false;
});
</script>

<style scoped>
.report-issue { display: flex; align-items: center; gap: 4px; }
.github-account { position: relative; }
.github-user { display: flex; align-items: center; gap: 6px; max-width: 150px; padding: 4px 6px; border-radius: 8px; color: var(--vp-c-text-2); font-size: 12px; }
.github-user img { flex: none; border-radius: 50%; }
.github-user iconify-icon { font-size: 20px; }
.github-username { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.github-menu { position: absolute; right: 0; top: 100%; z-index: 30; display: none; min-width: 110px; padding-top: 8px; }
.github-menu button { width: 100%; padding: 10px 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-elv); color: var(--vp-c-text-1); box-shadow: var(--vp-shadow-2); font-size: 13px; }
.github-menu.is-open, .github-account:hover .github-menu, .github-account:focus-within .github-menu { display: block; }
.github-user:hover, .github-menu button:hover { color: var(--vp-c-brand-1); background: var(--vp-c-bg-soft); }
button:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
@media (max-width: 767px) { .github-user { max-width: 86px; } .github-username { max-width: 54px; } }
.report-issue-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin-left: 8px;
  border-radius: 8px;
  color: var(--vp-c-text-1);
  transition: color 0.25s, background-color 0.25s;
}

.report-issue-button:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

.report-issue-button iconify-icon {
  font-size: 1.25rem;
  color: currentColor;
}
</style>
