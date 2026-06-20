<template>
  <div class="reading-progress-bar" :style="{ width: progress + '%' }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const progress = ref(0);

const updateProgress = () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  
  const scrollableHeight = documentHeight - windowHeight;
  const scrollPercentage = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
  
  progress.value = Math.min(100, Math.max(0, scrollPercentage));
};

onMounted(() => {
  window.addEventListener('scroll', updateProgress);
  window.addEventListener('resize', updateProgress);
  updateProgress(); // 初始化
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress);
  window.removeEventListener('resize', updateProgress);
});
</script>

<style scoped>
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  z-index: 9999;
  transition: width 0.2s ease-out;
  box-shadow: 0 2px 4px rgba(54, 123, 240, 0.3);
}

.dark .reading-progress-bar {
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.4);
}
</style>

