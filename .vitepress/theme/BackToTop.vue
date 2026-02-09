<template>
  <div v-if="!isHomePage" class="back-to-top-container">
    <div v-if="showTop" class="back-to-top" @click="scrollToTop">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
    </div>
    <div v-if="showBottom" class="back-to-bottom" @click="scrollToBottom">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useData } from 'vitepress';

const { frontmatter } = useData();

// 判断是否为主页
const isHomePage = computed(() => frontmatter.value?.layout === 'home');

const showTop = ref(false);
const showBottom = ref(false);

const handleScroll = () => {
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  showTop.value = scrollTop > 200;
  showBottom.value = scrollTop + windowHeight < documentHeight - 200;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

const scrollToBottom = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.back-to-top-container {
  position: fixed;
  bottom: 6rem; /* Raised to avoid overlapping with ChatWidget button */
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.back-to-top,
.back-to-bottom {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: var(--vp-c-bg-soft);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s, background-color 0.3s;
}

.back-to-top:hover,
.back-to-bottom:hover {
  background-color: var(--vp-c-bg-mute);
}

.back-to-top svg,
.back-to-bottom svg {
  fill: var(--vp-c-text-1);
}
</style>