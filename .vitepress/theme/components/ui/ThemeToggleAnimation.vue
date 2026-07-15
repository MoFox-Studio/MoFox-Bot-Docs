<template>
  <!-- 无视觉输出；仅拦截 VitePress 的主题切换 -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useData } from 'vitepress';

const { isDark } = useData();

let toggleEls: Element[] = [];

// 为 Document 上的 View Transition API 补充类型定义，因为库的类型声明中未包含
interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
}
type VTCallback = () => Promise<void> | void;

const onClick = async (e: Event) => {
  const mouseEvent = e as MouseEvent;
  const vt = (document as Document & { startViewTransition?: (cb: VTCallback) => ViewTransition });

  // 当 API 不支持或用户请求减少动画时优雅降级
  if (
    !vt.startViewTransition ||
    !window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  ) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  // 圆形揭示动画的起点：点击位置，
  // 回退到切换按钮的中心点。
  let x: number;
  let y: number;
  if (mouseEvent.clientX !== 0 || mouseEvent.clientY !== 0) {
    x = mouseEvent.clientX;
    y = mouseEvent.clientY;
  } else {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = vt.startViewTransition(() => {
    isDark.value = !isDark.value;
  });

  await transition.ready;

  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: 450,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      pseudoElement: '::view-transition-new(root)',
    }
  );
};

const bind = (el: Element) => {
  if (toggleEls.includes(el)) return;
  el.addEventListener('click', onClick, true);
  toggleEls.push(el);
};

const findAndBind = () => {
  // VitePress 切换按钮（桌面端导航栏 + 移动端屏幕菜单）
  const candidates = document.querySelectorAll(
    '.VPNavBarAppearance .VPSwitch, .VPNavBarAppearance button, .VPSidebar .VPSwitch, .VPNavScreenAppearance .VPSwitch, .VPNavScreenAppearance button'
  );
  candidates.forEach(bind);
};

let observer: MutationObserver | null = null;

onMounted(() => {
  findAndBind();

  // 切换按钮可能异步渲染，监听它们的出现。
  observer = new MutationObserver(() => {
    findAndBind();
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

onUnmounted(() => {
  toggleEls.forEach((el) => el.removeEventListener('click', onClick, true));
  toggleEls = [];
  observer?.disconnect();
  observer = null;
});
</script>

<style>
/*
  禁用默认的交叉淡入，改由我们的圆形 clip-path 来驱动揭示效果。
  保留两个快照上下叠放，并使用正常的混合模式。
*/
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* 让旧（切换前）快照位于新快照之下 */
::view-transition-old(root) {
  z-index: 1;
}
::view-transition-new(root) {
  z-index: 9999;
}

/* 尊重偏好减少动画的用户 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
    mix-blend-mode: normal;
  }
}
</style>
