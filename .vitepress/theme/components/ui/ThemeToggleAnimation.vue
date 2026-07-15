<template>
  <!-- No visual output; only intercepts the VitePress theme toggle -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useData } from 'vitepress';

const { isDark } = useData();

let toggleEls: Element[] = [];

// Type the View Transition API on Document since lib typings don't include it
interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
}
type VTCallback = () => Promise<void> | void;

const onClick = async (e: Event) => {
  const mouseEvent = e as MouseEvent;
  const vt = (document as Document & { startViewTransition?: (cb: VTCallback) => ViewTransition });

  // Gracefully degrade when the API is unsupported or reduced motion is requested
  if (
    !vt.startViewTransition ||
    !window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  ) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  // Starting point of the circular reveal: the click position,
  // falling back to the center of the toggle button.
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
  // VitePress toggle buttons (desktop navbar + mobile screen menu)
  const candidates = document.querySelectorAll(
    '.VPNavBarAppearance .VPSwitch, .VPNavBarAppearance button, .VPSidebar .VPSwitch, .VPNavScreenAppearance .VPSwitch, .VPNavScreenAppearance button'
  );
  candidates.forEach(bind);
};

let observer: MutationObserver | null = null;

onMounted(() => {
  findAndBind();

  // Toggle buttons may be rendered asynchronously, watch for them.
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
  Disable the default cross-fade so our circular clip-path drives the reveal.
  Keep both snapshots on top of each other with normal blending.
*/
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* Keep the old (pre-toggle) snapshot below the new one */
::view-transition-old(root) {
  z-index: 1;
}
::view-transition-new(root) {
  z-index: 9999;
}

/* Respect users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
    mix-blend-mode: normal;
  }
}
</style>
