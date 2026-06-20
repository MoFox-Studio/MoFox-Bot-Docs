<template>
  <div class="giscus-container">
    <div class="giscus"></div>
  </div>
</template>

<script setup>
import { onMounted, watch, onUnmounted } from 'vue';
import { useData, useRoute } from 'vitepress';

const { isDark } = useData();
const route = useRoute();

const giscusAttributes = {
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
  "data-theme": isDark.value ? "noborder_dark" : "noborder_light",
  "data-lang": "zh-CN",
  "crossorigin": "anonymous",
  "async": ""
};

let giscusScriptLoaded = false;

function loadGiscus() {
  // 如果脚本已经加载过，则先移除旧的
  if (giscusScriptLoaded) {
    const existingContainer = document.querySelector('.giscus');
    if (existingContainer) {
      // 清空容器
      while (existingContainer.firstChild) {
        existingContainer.removeChild(existingContainer.firstChild);
      }
    }
  }

  // 创建并加载 Giscus 脚本
  const script = document.createElement('script');
  Object.entries(giscusAttributes).forEach(([key, value]) => {
    script.setAttribute(key, value);
  });
  document.querySelector('.giscus').appendChild(script);
  giscusScriptLoaded = true;
}

onMounted(() => {
  loadGiscus();

  // 监听路由变化
  watch(() => route.path, () => {
    loadGiscus();
  });

  watch(isDark, (dark) => {
    const iframe = document.querySelector('.giscus-frame');
    if (iframe) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: dark ? 'noborder_dark' : 'noborder_light' } } },
        'https://giscus.app'
      );
    }
  });

  // 在组件卸载前移除监听
  onUnmounted(() => {
    const existingContainer = document.querySelector('.giscus');
    if (existingContainer) {
      // 清空容器以移除 Giscus 的 iframe
      while (existingContainer.firstChild) {
        existingContainer.removeChild(existingContainer.firstChild);
      }
    }
    giscusScriptLoaded = false;
  });
});
</script>

<style scoped>
.giscus-container {
  margin-top: 2rem;
}
</style>