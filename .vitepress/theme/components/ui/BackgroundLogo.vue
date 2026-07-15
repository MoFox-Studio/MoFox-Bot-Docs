<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter } = useData()
</script>

<template>
  <div v-if="!frontmatter.home && frontmatter.layout !== 'home'" class="background-logo">
    <img src="/logos/logo-backup.png" alt="Background Logo" />
  </div>
</template>

<style scoped>
.background-logo {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10; /* 确保作为水印浮于内容之上 */
  opacity: 0.05; /* 非常微弱的透明度 */
  pointer-events: none;
  width: 250px; /* 显著缩小的尺寸 */
  max-width: 30vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

.background-logo img {
  width: 100%;
  height: auto;
}

/* 可选：在极小屏幕上隐藏或调整大小 */
@media (max-width: 768px) {
  .background-logo {
    width: 80%;
  }
}
</style>
