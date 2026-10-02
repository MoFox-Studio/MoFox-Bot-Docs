import { nextTick, onMounted, ref, watch } from "vue";
import { useData, useRoute } from "vitepress";

export const ISSUE_REPO = "MoFox-Studio/MoFox-Bot-Docs";

/**
 * 两种反馈入口共用同一份页面信息：登录后用于站内表单，未登录时用于 GitHub 预填链接。
 * 只在客户端读取浏览器信息，并保留路由变化后更新预填内容的行为。
 */
export function useIssueDraft() {
  const { page, isDark } = useData();
  const route = useRoute();

  const title = ref("[文档反馈]");
  const body = ref("");
  const issueUrl = ref(`https://github.com/${ISSUE_REPO}/issues/new`);

  async function refresh() {
    if (typeof window === "undefined") return;
    // 等路由与页面数据更新完成后再取值。
    await nextTick();
    const pageTitle = page.value.title || route.path;
    const filePath = page.value.filePath || page.value.relativePath || "";

    title.value = `[文档反馈] ${pageTitle}`;
    body.value = [
      "### 页面信息",
      `- 标题：${pageTitle}`,
      `- 地址：${window.location.href}`,
      ...(filePath ? [`- 源文件：\`${filePath}\``] : []),
      `- 浏览器：\`${window.navigator.userAgent}\``,
      `- 视口：${window.innerWidth}×${window.innerHeight}`,
      `- 语言：${window.navigator.language}`,
      `- 主题：${isDark.value ? "深色" : "浅色"}`,
      "",
      "### 问题描述",
      "<!-- 请描述你遇到的问题或想提出的建议 -->",
      "",
      "### 复现步骤",
      "1. ",
    ].join("\n");
    issueUrl.value = `https://github.com/${ISSUE_REPO}/issues/new?title=${encodeURIComponent(title.value)}&body=${encodeURIComponent(body.value)}`;
  }

  onMounted(refresh);
  watch(() => route.path, refresh);
  return { title, body, issueUrl, refresh };
}

/** 保留文档内 DocButtons 等现有组件使用的 GitHub 预填跳转接口。 */
export function useIssueUrl() {
  return useIssueDraft().issueUrl;
}
