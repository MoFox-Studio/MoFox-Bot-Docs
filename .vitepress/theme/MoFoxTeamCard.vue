<template>
  <div class="team-card-container" :class="containerClass">
    <div v-for="member in members" :key="member.name" class="team-card" :class="cardClass">
      <div class="fox-bg">🦊</div>
      <div class="card-content">
        <div class="avatar-section">
          <img :src="member.avatar" :alt="member.name" class="avatar" />
        </div>
        <div class="info-section">
          <h3 class="name">{{ member.name }}</h3>
          <div class="description" v-html="renderMarkdown(member.title)"></div>
        </div>
        <div class="links-section">
          <a v-for="link in member.links" :key="link.link" :href="link.link" target="_blank" rel="noopener noreferrer" class="link-icon" :aria-label="link.icon">
            <svg v-if="link.icon === 'github'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.89 1.53 2.34 1.09 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.95c0-1.1.39-1.99 1.03-2.69c-.1-.25-.45-1.27.1-2.65c0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8a9.56 9.56 0 0 1 2.5-.34c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.38.2 2.4.1 2.65c.64.7 1.03 1.6 1.03 2.69c0 3.85-2.34 4.7-4.57 4.95c.36.31.68.92.68 1.85v2.73c0 .27.18.58.69.48A10 10 0 0 0 22 12A10 10 0 0 0 12 2"/></svg>
            <img v-else-if="link.icon === 'mihuashi'" src="/mihuashi.png" alt="米画师" style="width: 20px; height: 20px; object-fit: contain;" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps({
  members: Array,
  size: {
    type: String,
    default: 'medium', // large | medium | small
  },
});

const md = new MarkdownIt({ html: true });

const renderMarkdown = (content) => {
  return md.render(content);
};

const containerClass = computed(() => {
  return `container-${props.size}`;
});

const cardClass = computed(() => {
  return `size-${props.size}`;
});
</script>

<style scoped>
.team-card-container {
  display: grid;
  gap: 1rem;
}

/* Default (Medium) */
.container-medium {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
@media (min-width: 768px) {
  .container-medium {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Small */
.container-small {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
@media (min-width: 960px) {
    .container-small {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Large */
.container-large {
    grid-template-columns: 1fr;
}

.team-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.team-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.fox-bg {
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 100px;
  z-index: 0;
  pointer-events: none;
  opacity: 0.05;
  transform: rotate(-15deg);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--vp-c-brand-light);
  object-fit: cover;
}

.info-section {
  flex-grow: 1;
}

.name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.description {
  margin-top: 0.5rem;
  color: var(--vp-c-text-2);
}

.description > :first-child {
    margin-top: 0;
}

.description > :last-child {
    margin-bottom: 0;
}

.links-section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.link-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: background 0.3s ease;
}

.link-icon:hover {
  background: var(--vp-c-brand-soft);
}

/* --- Size Variations --- */

/* Small */
.size-small {
    padding: 1rem;
}
.size-small .card-content {
    gap: 1rem;
}
.size-small .avatar {
    width: 60px;
    height: 60px;
}
.size-small .name {
    font-size: 1.2rem;
}
.size-small .description {
    font-size: 0.875rem;
    margin-top: 0.25rem;
}
.size-small .link-icon {
    width: 32px;
    height: 32px;
}

/* Large */
.size-large {
    padding: 2rem;
}
.size-large .avatar {
    width: 96px;
    height: 96px;
}
.size-large .name {
    font-size: 1.8rem;
}
.size-large .description {
    font-size: 1.1rem;
    margin-top: 0.75rem;
}
.size-large .link-icon {
    width: 40px;
    height: 40px;
}
</style>