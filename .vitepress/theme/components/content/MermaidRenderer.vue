<!--
  MermaidRenderer.vue — 客户端 Mermaid 渲染初始化组件。

  该组件在 VitePress 布局中挂载后，动态导入 mermaid 并渲染页面中所有
  pre.mermaid 元素。同时监听 VitePress 路由切换，
  在每次页面跳转后重新渲染新页面中的 mermaid 图表。
  支持暗色主题自动切换。
-->
<template>
  <div style="display: none"></div>
</template>

<script setup>
import { onMounted, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vitepress";

const route = useRoute();

let mermaidInstance = null;

/**
 * 动态导入 mermaid 并渲染当前页面中的所有 mermaid 图表。
 */
async function renderAllMermaid() {
  if (typeof document === "undefined") return;

  // 动态导入 mermaid，仅在客户端执行
  if (!mermaidInstance) {
    try {
      const mermaidModule = await import("mermaid");
      mermaidInstance = mermaidModule.default;
      mermaidInstance.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
      });
    } catch (e) {
      console.error("Failed to load mermaid:", e);
      return;
    }
  }

  // 查找所有尚未渲染的 mermaid 容器
  const elements = document.querySelectorAll("pre.mermaid");
  if (elements.length === 0) return;

  for (const el of elements) {
    if (el.getAttribute("data-processed")) continue;

    const code = el.textContent;
    const id = `mermaid-svg-${Math.random().toString(36).substring(2, 11)}`;

    try {
      const { svg } = await mermaidInstance.render(id, code);
      el.innerHTML = svg;
      el.setAttribute("data-processed", "true");
      el.classList.remove("mermaid");
    } catch (e) {
      console.error("Mermaid rendering error:", e);
      el.innerHTML = `<p style="color: red;">Mermaid 渲染错误: ${e.message || "语法无效"}</p>`;
      el.setAttribute("data-processed", "true");
    }
  }
}

onMounted(() => {
  renderAllMermaid();

  // 监听路由变化，页面切换后重新渲染
  watch(
    () => route.path,
    () => {
      // 使用 nextTick 确保 DOM 已更新
      setTimeout(renderAllMermaid, 100);
    }
  );
});
</script>
