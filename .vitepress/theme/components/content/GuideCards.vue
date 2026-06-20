<template>
  <div class="guide-cards-container">
    <a v-for="guide in guides" :key="guide.name" :href="guide.link" class="card-link">
      <div class="card">
        <div class="card-icon" v-html="guide.avatar"></div>
        <div class="card-content">
          <h3 class="card-title">{{ guide.name }}</h3>
          <p class="card-details">{{ guide.title }}</p>
        </div>
      </div>
    </a>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  guides: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.guide-cards-container {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

.card {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  height: 100%;
  transition: border-color 0.25s, background-color 0.25s;
}

.card:hover {
  border-color: var(--vp-c-brand-1);
}

.card-icon {
  font-size: 2.5rem;
  margin-right: 20px;
  line-height: 1;
  margin-top: -2px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}

.card-details {
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
</style>