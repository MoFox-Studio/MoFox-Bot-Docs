<template>
  <Teleport to="body">
    <div v-if="open" class="issue-overlay" @click.self="emit('close')">
      <section
        ref="dialog"
        class="issue-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-dialog-title"
        aria-describedby="issue-dialog-description"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header class="issue-header">
          <h2 id="issue-dialog-title">反馈文档问题</h2>
          <button type="button" class="issue-close" aria-label="关闭反馈弹窗" @click="emit('close')">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <p id="issue-dialog-description" class="issue-description">
          反馈将发布到公开的 GitHub 仓库。请检查自动附带的页面信息，避免填写密码、密钥等私人内容。
        </p>

        <div v-if="created" class="issue-success" role="status">
          <iconify-icon icon="mdi:check-circle-outline" aria-hidden="true"></iconify-icon>
          <h3>反馈已提交，谢谢你的帮助！</h3>
          <a :href="created.url" target="_blank" rel="noopener noreferrer">查看 Issue #{{ created.number }}</a>
          <button type="button" class="issue-secondary" @click="resetDraft">继续提交其他反馈</button>
        </div>

        <form v-else @submit.prevent="submit">
          <p v-if="error || loginMessage" class="issue-error" role="alert">{{ error || loginMessage }}</p>
          <label class="issue-label" for="issue-title">标题</label>
          <input id="issue-title" ref="titleInput" v-model="title" class="issue-input" required maxlength="256" :disabled="submitting" />
          <label class="issue-label" for="issue-body">正文</label>
          <textarea id="issue-body" v-model="body" class="issue-input issue-body" required :disabled="submitting" rows="12"></textarea>
          <div class="issue-actions">
            <p class="issue-session">登录仅保存在当前标签页，关闭后失效。</p>
            <button v-if="auth.token.value" type="submit" class="issue-primary" :disabled="submitting || !title.trim() || !body.trim()">
              {{ submitting ? '正在提交…' : '提交 Issue' }}
            </button>
            <button v-else type="button" class="issue-primary" @click="emit('login')">
              <iconify-icon icon="mdi:github" aria-hidden="true"></iconify-icon>
              登录 GitHub 后提交
            </button>
          </div>
        </form>
        <footer class="issue-footer">
          <a :href="githubFallbackUrl" target="_blank" rel="noopener noreferrer">不登录，直接去 GitHub 提交</a>
          <a :href="`https://github.com/${ISSUE_REPO}/issues`" target="_blank" rel="noopener noreferrer">查看已有反馈</a>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { createGitHubIssue, GitHubAuthError, useGitHubAuth } from '../../utils/oauth';
import { ISSUE_REPO } from '../../utils/reportIssue';

const props = defineProps<{
  open: boolean;
  initialTitle: string;
  initialBody: string;
  fallbackUrl: string;
  loginMessage?: string;
}>();
const emit = defineEmits<{ close: []; login: [] }>();
const auth = useGitHubAuth();
const dialog = ref<HTMLElement>();
const titleInput = ref<HTMLInputElement>();
const title = ref('');
const body = ref('');
const error = ref('');
const submitting = ref(false);
const created = ref<{ url: string; number: number } | null>(null);
// 兜底链接保留用户在弹窗中的编辑，授权失效时也能带着草稿去 GitHub 提交。
const githubFallbackUrl = computed(() => title.value && body.value
  ? `https://github.com/${ISSUE_REPO}/issues/new?title=${encodeURIComponent(title.value)}&body=${encodeURIComponent(body.value)}`
  : props.fallbackUrl);
let context = '';
let previousFocus: HTMLElement | null = null;
let previousOverflow: string | null = null;

function resetDraft() {
  title.value = props.initialTitle;
  body.value = props.initialBody;
  error.value = '';
  created.value = null;
  context = props.initialBody;
  nextTick(() => titleInput.value?.focus());
}

function releaseDialog() {
  if (typeof window === 'undefined') return;
  if (previousOverflow !== null) {
    window.document.body.style.overflow = previousOverflow;
    previousOverflow = null;
  }
  previousFocus?.focus();
  previousFocus = null;
}

watch(() => props.open, async (open) => {
  if (typeof window === 'undefined') return;
  if (!open) {
    releaseDialog();
    return;
  }
  if (context !== props.initialBody && !submitting.value) resetDraft();
  previousFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
  previousOverflow = window.document.body.style.overflow;
  window.document.body.style.overflow = 'hidden';
  await nextTick();
  (created.value ? dialog.value : titleInput.value)?.focus();
});

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  }
  if (event.key !== 'Tab' || !dialog.value) return;
  const focusable = Array.from(dialog.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])'));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last || typeof window === 'undefined') return;
  if (event.shiftKey && (window.document.activeElement === first || window.document.activeElement === dialog.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (window.document.activeElement === last || window.document.activeElement === dialog.value)) {
    event.preventDefault();
    first.focus();
  }
}

async function submit() {
  if (submitting.value || !title.value.trim() || !body.value.trim()) return;
  submitting.value = true;
  error.value = '';
  try {
    created.value = await createGitHubIssue(title.value, body.value);
    await nextTick();
    dialog.value?.focus();
  } catch (failure) {
    error.value = failure instanceof GitHubAuthError ? failure.message : '提交结果无法确认，请先查看已有反馈，再决定是否重试。';
  } finally {
    submitting.value = false;
  }
}

onBeforeUnmount(releaseDialog);
</script>

<style scoped>
.issue-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 24px; background: var(--vp-backdrop-bg-color, rgba(0, 0, 0, .6)); }
.issue-dialog { width: min(100%, 680px); max-height: calc(100dvh - 48px); overflow-y: auto; padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 16px; background: var(--vp-c-bg); color: var(--vp-c-text-1); box-shadow: var(--vp-shadow-5); }
.issue-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.issue-header h2 { margin: 0; font-size: 22px; font-weight: 600; }
.issue-close { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 8px; color: var(--vp-c-text-2); }
.issue-close:hover { background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); }
.issue-close span { font-size: 24px; line-height: 1; }
.issue-description, .issue-session { color: var(--vp-c-text-2); font-size: 13px; line-height: 1.7; }
.issue-description { margin: 14px 0 20px; }
.issue-label { display: block; margin: 14px 0 7px; font-size: 14px; font-weight: 600; }
.issue-input { display: block; width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font: inherit; font-size: 14px; line-height: 1.6; }
.issue-input:focus { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
.issue-body { min-height: 190px; resize: vertical; }
.issue-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 18px; }
.issue-primary, .issue-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex: none; padding: 9px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; }
.issue-primary { background: var(--vp-button-brand-bg); color: var(--vp-button-brand-text); }
.issue-primary:hover { background: var(--vp-button-brand-hover-bg); }
.issue-primary:disabled { cursor: wait; opacity: .6; }
.issue-secondary { background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); }
.issue-error { margin: 12px 0; padding: 12px; border-radius: 8px; background: var(--vp-c-danger-soft); color: var(--vp-c-danger-1); font-size: 14px; line-height: 1.7; }
.issue-footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-top: 18px; margin-top: 20px; border-top: 1px solid var(--vp-c-divider); font-size: 13px; }
.issue-footer a, .issue-success a { color: var(--vp-c-brand-1); text-decoration: underline; text-underline-offset: 3px; }
.issue-success { display: grid; justify-items: center; gap: 16px; padding: 24px 0; text-align: center; }
.issue-success iconify-icon { font-size: 40px; color: var(--vp-c-brand-1); }
.issue-success h3 { font-weight: 600; }
button:focus-visible, a:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
@media (max-width: 600px) { .issue-overlay { padding: 12px; } .issue-dialog { padding: 18px; max-height: calc(100dvh - 24px); } .issue-actions { flex-direction: column; align-items: stretch; gap: 10px; } .issue-header h2 { font-size: 20px; } }
</style>
