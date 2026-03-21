<template>
  <button
    class="nav-ask-ai-btn"
    :class="{ active: isOpen }"
    @click="toggle"
    title="Ask AI"
    aria-label="打开 AI 助手"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="nav-ask-ai-icon"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span class="nav-ask-ai-label">Ask AI</span>
  </button>
</template>

<script setup>
import { useChatState } from './useChatState'

const { isOpen, toggle } = useChatState()
</script>

<style scoped>
.nav-ask-ai-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 13px;
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-family: var(--vp-font-family-base);
  line-height: 1;
  margin-right: 6px;
  white-space: nowrap;
  user-select: none;
  height: 34px;
  box-sizing: border-box;
  vertical-align: middle;
}

.nav-ask-ai-btn:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.nav-ask-ai-btn.active {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
}

.nav-ask-ai-icon {
  flex-shrink: 0;
  transition: transform 0.22s ease;
}

.nav-ask-ai-btn:hover .nav-ask-ai-icon {
  transform: scale(1.12);
}

.nav-ask-ai-btn.active .nav-ask-ai-icon {
  transform: scale(1.08);
}

/* Hide label on very small screens, keep icon */
@media (max-width: 420px) {
  .nav-ask-ai-label {
    display: none;
  }
  .nav-ask-ai-btn {
    padding: 5px 9px;
    gap: 0;
  }
}
</style>
