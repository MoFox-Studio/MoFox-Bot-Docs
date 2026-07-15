<template>
  <div v-if="readingTimeText || wordCountText" class="reading-info-container">
    <div class="reading-info">
      <span v-if="readingTimeText">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8"/><path fill="currentColor" d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4a1 1 0 0 0 0-2h-3V7a1 1 0 0 0-1-1"/></svg>
        {{ readingTimeText }}
      </span>
      <span v-if="wordCountText" class="separator">|</span>
      <span v-if="wordCountText">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M19.59 6.41L14 12l5.59 5.59L21 16.17l-4.17-4.17l4.17-4.17zM2.41 6.41L8 12l-5.59 5.59L1 16.17l4.17-4.17L1 7.83z"/><path fill="currentColor" d="M9.41 4.41L12 7l2.59-2.59L16 5.83l-2.59 2.59L16 11l-1.41 1.41L12 9.83l-2.59 2.58L8 11l2.59-2.59L8 5.83z"/></svg>
        {{ wordCountText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useData } from 'vitepress';
import { getReadingTime } from '../../utils/readingTime';

const { page } = useData();
const readingTimeText = ref('');
const wordCountText = ref('');
let observer: MutationObserver | null = null;

const calculateReadingTime = () => {
  nextTick(() => {
    const content = document.querySelector('.vp-doc') as HTMLElement | null;
    if (content && content.innerText.length > 0) {
      const { readingTime, wordCount } = getReadingTime(content.innerText);
      readingTimeText.value = readingTime;
      wordCountText.value = wordCount;
    } else {
      readingTimeText.value = '';
      wordCountText.value = '';
    }
  });
};

onMounted(() => {
  calculateReadingTime();
  watch(() => page.value.relativePath, calculateReadingTime, { immediate: true });

  const targetNode = document.querySelector('.vp-doc');
  if (targetNode) {
    observer = new MutationObserver(calculateReadingTime);
    observer.observe(targetNode, { childList: true, subtree: true });
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.reading-info-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5em;
  padding: 0.5em 1em;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reading-info {
  display: flex;
  align-items: center;
  color: var(--vp-c-text-2);
  font-size: 0.95em;
  font-weight: 500;
}

.reading-info span {
  display: flex;
  align-items: center;
  gap: 0.4em;
}

.reading-info svg {
  color: var(--vp-c-brand);
}

.separator {
  margin: 0 0.8em;
  color: var(--vp-c-divider);
}
</style>