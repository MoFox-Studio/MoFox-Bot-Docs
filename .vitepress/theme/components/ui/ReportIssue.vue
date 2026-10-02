<template>
  <a
    v-if="show"
    class="report-issue-button"
    :href="issueUrl"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="在本页开 Issue"
    title="在本页开 Issue（自动附带当前页面信息）"
  >
    <!-- GitHub issue-opened 图标 -->
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path fill="currentColor" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path
        fill="currentColor"
        d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"
      />
    </svg>
  </a>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useData, useRoute } from 'vitepress';

// Issue 提交目标仓库
const REPO = 'MoFox-Studio/MoFox-Bot-Docs';

const { page, frontmatter, isDark } = useData();
const route = useRoute();

// 首页与显式关闭（frontmatter: feedback: false）时不显示
const show = computed(() => {
  const fm = frontmatter.value as Record<string, unknown> | undefined;
  return fm?.layout !== 'home' && fm?.feedback !== false;
});

// 兜底地址：未挂载（SSR）时只有仓库地址，挂载后替换为带预填内容的地址
const issueUrl = ref(`https://github.com/${REPO}/issues/new`);

function buildIssueUrl(): string {
  if (typeof window === 'undefined') return issueUrl.value;

  const pageTitle = page.value.title || route.path;
  const filePath = page.value.filePath || page.value.relativePath || '';

  const title = `[文档反馈] ${pageTitle}`;
  const body = [
    '### 页面信息',
    `- 标题：${pageTitle}`,
    `- 地址：${window.location.href}`,
    filePath ? `- 源文件：\`${filePath}\`` : '',
    `- 浏览器：\`${navigator.userAgent}\``,
    `- 视口：${window.innerWidth}×${window.innerHeight}`,
    `- 语言：${navigator.language}`,
    `- 主题：${isDark.value ? '深色' : '浅色'}`,
    '',
    '### 问题描述',
    '<!-- 请描述你遇到的问题或想提出的建议 -->',
    '',
    '### 复现步骤',
    '1. ',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

function updateUrl() {
  // 等路由与页面数据更新完成后再取值
  nextTick(() => {
    issueUrl.value = buildIssueUrl();
  });
}

onMounted(() => {
  updateUrl();
  watch(() => route.path, updateUrl);
});
</script>

<style scoped>
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

.report-issue-button svg {
  width: 1.1rem;
  height: 1.1rem;
  fill: currentColor;
}
</style>
