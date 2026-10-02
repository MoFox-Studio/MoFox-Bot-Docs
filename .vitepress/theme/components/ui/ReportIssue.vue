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
    <!-- 报告问题（bug）图标 -->
    <iconify-icon icon="mdi:bug-outline" aria-hidden="true"></iconify-icon>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import { useIssueUrl } from '../../utils/reportIssue';

const { frontmatter } = useData();
const issueUrl = useIssueUrl();

// 首页与显式关闭（frontmatter: feedback: false）时不显示
const show = computed(() => {
  const fm = frontmatter.value as Record<string, unknown> | undefined;
  return fm?.layout !== 'home' && fm?.feedback !== false;
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

.report-issue-button iconify-icon {
  font-size: 1.25rem;
  color: currentColor;
}
</style>
