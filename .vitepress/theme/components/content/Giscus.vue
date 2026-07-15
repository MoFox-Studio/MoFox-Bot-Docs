<template>
  <div class="giscus-container">
    <div class="giscus"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, onUnmounted } from 'vue';
import { useData, useRoute } from 'vitepress';

const { isDark } = useData();
const route = useRoute();

let giscusScriptLoaded = false;
let pendingTheme: string | null = null;
let observer: MutationObserver | null = null;

function getTheme(): string {
  return isDark.value ? 'noborder_dark' : 'noborder_light';
}

function buildAttributes(): Record<string, string> {
  return {
    "src": "https://giscus.app/client.js",
    "data-repo": "MoFox-Studio/MoFox-Bot-Docs", // 替换为你的仓库
    "data-repo-id": "R_kgDOPmLudA", // 替换为你的仓库 ID
    "data-category": "Announcements", // 替换为你的分类
    "data-category-id": "DIC_kwDOPmLudM4Cvo_u", // 替换为你的分类 ID
    "data-mapping": "pathname",
    "data-strict": "0",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "0",
    "data-input-position": "bottom",
    "data-theme": getTheme(),
    "data-lang": "zh-CN",
    "crossorigin": "anonymous",
    "async": ""
  };
}

function clearContainer(): void {
  const existingContainer = document.querySelector('.giscus');
  if (existingContainer) {
    while (existingContainer.firstChild) {
      existingContainer.removeChild(existingContainer.firstChild);
    }
  }
}

function loadGiscus(): void {
  // 如果脚本已经加载过，则先移除旧的
  if (giscusScriptLoaded) {
    clearContainer();
  }

  // 创建并加载 Giscus 脚本
  const script = document.createElement('script');
  Object.entries(buildAttributes()).forEach(([key, value]) => {
    script.setAttribute(key, value);
  });
  const container = document.querySelector('.giscus');
  container?.appendChild(script);
  giscusScriptLoaded = true;
  pendingTheme = null;
}

function postTheme(theme: string): boolean {
  const iframe = document.querySelector('.giscus-frame') as HTMLIFrameElement | null;
  const contentWindow = iframe?.contentWindow;
  if (!contentWindow) return false;
  contentWindow.postMessage(
    { giscus: { setConfig: { theme } } },
    'https://giscus.app'
  );
  return true;
}

function applyTheme(theme: string): void {
  if (postTheme(theme)) {
    pendingTheme = null;
  } else {
    // iframe 还未加载出来，记录待应用的 theme，等 iframe 加载后应用
    pendingTheme = theme;
  }
}

function tryApplyPendingTheme(): void {
  if (!pendingTheme) return;
  const iframe = document.querySelector('.giscus-frame') as HTMLIFrameElement | null;
  if (!iframe) return;
  // iframe 刚出现，等加载完成后再 post，确保 Giscus 已就绪
  const apply = (): void => {
    if (pendingTheme && postTheme(pendingTheme)) {
      pendingTheme = null;
    }
  };
  iframe.addEventListener('load', apply, { once: true });
  // 兜底：load 可能已经触发
  setTimeout(apply, 0);
}

onMounted(() => {
  loadGiscus();

  // 监听路由变化
  watch(() => route.path, () => {
    loadGiscus();
  });

  watch(isDark, (dark: boolean) => {
    applyTheme(dark ? 'noborder_dark' : 'noborder_light');
  });

  // 监听 giscus 容器子节点变化，iframe 加载出来后应用待定的 theme
  const container = document.querySelector('.giscus');
  if (container) {
    observer = new MutationObserver(tryApplyPendingTheme);
    observer.observe(container, { childList: true, subtree: true });
  }

  // 在组件卸载前移除监听
  onUnmounted(() => {
    observer?.disconnect();
    clearContainer();
    giscusScriptLoaded = false;
    pendingTheme = null;
  });
});
</script>

<style scoped>
.giscus-container {
  margin-top: 2rem;
}
</style>
