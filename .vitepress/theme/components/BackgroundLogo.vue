<script setup>
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
  z-index: 10; /* Ensure it is above content as a watermark */
  opacity: 0.05; /* Very subtle opacity */
  pointer-events: none;
  width: 250px; /* Significantly reduced size */
  max-width: 30vw;
  display: flex;
  justify-content: center;
  align-items: center;
}

.background-logo img {
  width: 100%;
  height: auto;
}

/* Optional: Hide on very small screens if needed, or adjust size */
@media (max-width: 768px) {
  .background-logo {
    width: 80%;
  }
}
</style>
