import { nextTick, onMounted, ref, watch } from "vue";
import { useData, useRoute } from "vitepress";

// Issue 提交目标仓库
const REPO = "MoFox-Studio/MoFox-Bot-Docs";

/**
 * 「在本页开 Issue」的预填链接。
 *
 * SSR / 未挂载时返回仓库 Issue 兜底地址；
 * 挂载后替换为带预填内容（页面标题、地址、源文件、浏览器信息等）的地址，
 * 并在路由变化时自动更新。供导航栏 ReportIssue 按钮与文档内 DocButtons 组件共用。
 */
export function useIssueUrl() {
  const { page, isDark } = useData();
  const route = useRoute();

  const issueUrl = ref(`https://github.com/${REPO}/issues/new`);

  function buildIssueUrl(): string {
    if (typeof window === "undefined") return issueUrl.value;

    const pageTitle = page.value.title || route.path;
    const filePath = page.value.filePath || page.value.relativePath || "";

    const title = `[文档反馈] ${pageTitle}`;
    const body = [
      "### 页面信息",
      `- 标题：${pageTitle}`,
      `- 地址：${window.location.href}`,
      filePath ? `- 源文件：\`${filePath}\`` : "",
      `- 浏览器：\`${navigator.userAgent}\``,
      `- 视口：${window.innerWidth}×${window.innerHeight}`,
      `- 语言：${navigator.language}`,
      `- 主题：${isDark.value ? "深色" : "浅色"}`,
      "",
      "### 问题描述",
      "<!-- 请描述你遇到的问题或想提出的建议 -->",
      "",
      "### 复现步骤",
      "1. ",
    ]
      .filter(Boolean)
      .join("\n");

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

  return issueUrl;
}
