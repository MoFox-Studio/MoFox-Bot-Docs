<template>
  <Teleport to="body">
    <Transition name="bottom-input-slide">
      <div
        v-if="mounted && !isOpen"
        class="bottom-input-container"
      >
        <div
          class="bottom-input-bar"
          :class="{ 'focused': isFocused, 'has-content': inputValue.length > 0 }"
        >
          <!-- Left icon -->
          <svg
            class="input-prefix-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>

          <input
            ref="inputRef"
            v-model="inputValue"
            type="text"
            class="bottom-input-field"
            placeholder="向 AI 提问…"
            autocomplete="off"
            @keydown.enter="handleSubmit"
            @focus="isFocused = true"
            @blur="isFocused = false"
          />

          <!-- Send button, fades in when there's content -->
          <Transition name="send-btn-fade">
            <button
              v-if="inputValue.trim()"
              class="bottom-send-btn"
              @click="handleSubmit"
              title="发送"
              aria-label="发送消息"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </Transition>

          <!-- Open chat button when input is empty -->
          <Transition name="send-btn-fade">
            <button
              v-if="!inputValue.trim()"
              class="bottom-open-btn"
              @click="openChat"
              title="打开 AI 助手"
              aria-label="打开 AI 助手"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </Transition>
        </div>

        <!-- Subtle hint text -->
        <div class="bottom-input-hint">
          <span>按 <kbd>Enter</kbd> 发送</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useChatState } from './useChatState'

const { isOpen, open } = useChatState()

const inputValue = ref('')
const isFocused = ref(false)
const mounted = ref(false)
const inputRef = ref(null)

onMounted(() => {
  mounted.value = true
})

function handleSubmit() {
  const msg = inputValue.value.trim()
  if (msg) {
    open(msg)
    inputValue.value = ''
  } else {
    open()
  }
}

function openChat() {
  open()
}
</script>

<style scoped>
/* ── Container ─────────────────────────────────────────────── */
.bottom-input-container {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
}

/* ── Bar ───────────────────────────────────────────────────── */
.bottom-input-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 480px;
  max-width: calc(100vw - 48px);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 0 0 0 transparent;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    background 0.25s ease;
  cursor: text;
}

/* Hover lift */
.bottom-input-bar:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.12),
    0 0 0 3px var(--vp-c-brand-soft);
  transform: translateY(-3px);
}

/* Focus glow */
.bottom-input-bar.focused {
  border-color: var(--vp-c-brand-1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.14),
    0 0 0 3px var(--vp-c-brand-soft);
  transform: translateY(-4px);
}

/* ── Prefix icon ───────────────────────────────────────────── */
.input-prefix-icon {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  transition: color 0.22s ease;
}

.bottom-input-bar:hover .input-prefix-icon,
.bottom-input-bar.focused .input-prefix-icon {
  color: var(--vp-c-brand-1);
}

/* ── Input field ───────────────────────────────────────────── */
.bottom-input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-base);
  line-height: 1.5;
  min-width: 0;
}

.bottom-input-field::placeholder {
  color: var(--vp-c-text-3);
  transition: color 0.22s ease;
}

.bottom-input-bar:hover .bottom-input-field::placeholder,
.bottom-input-bar.focused .bottom-input-field::placeholder {
  color: var(--vp-c-text-2);
}

/* ── Send button ───────────────────────────────────────────── */
.bottom-send-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.18s ease,
    box-shadow 0.2s ease;
}

.bottom-send-btn:hover {
  background: var(--vp-c-brand-2);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.bottom-send-btn:active {
  transform: scale(0.96);
}

/* ── Open button (shown when no content) ───────────────────── */
.bottom-open-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.18s ease;
  opacity: 0;
}

.bottom-input-bar:hover .bottom-open-btn,
.bottom-input-bar.focused .bottom-open-btn {
  opacity: 1;
}

.bottom-open-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  transform: translateX(2px);
}

/* ── Hint text ─────────────────────────────────────────────── */
.bottom-input-hint {
  font-size: 11px;
  color: var(--vp-c-text-3);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
  pointer-events: none;
  user-select: none;
}

.bottom-input-container:hover .bottom-input-hint,
.bottom-input-bar.focused ~ .bottom-input-hint {
  opacity: 1;
  transform: translateY(0);
}

.bottom-input-hint kbd {
  display: inline-block;
  padding: 1px 5px;
  font-size: 10px;
  font-family: var(--vp-font-family-mono);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

/* ── Slide-in / slide-out transition ──────────────────────── */
.bottom-input-slide-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bottom-input-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.bottom-input-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
.bottom-input-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* ── Send-btn fade ─────────────────────────────────────────── */
.send-btn-fade-enter-active,
.send-btn-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.send-btn-fade-enter-from,
.send-btn-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* ── Dark mode tweaks ──────────────────────────────────────── */
:global(.dark) .bottom-input-bar {
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.3),
    0 0 0 0 transparent;
}
:global(.dark) .bottom-input-bar:hover {
  box-shadow:
    0 6px 28px rgba(0, 0, 0, 0.45),
    0 0 0 3px var(--vp-c-brand-soft);
}
:global(.dark) .bottom-input-bar.focused {
  box-shadow:
    0 8px 36px rgba(0, 0, 0, 0.5),
    0 0 0 3px var(--vp-c-brand-soft);
}

/* ── Mobile ────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .bottom-input-container {
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100vw - 32px);
  }
  .bottom-input-bar {
    width: 100%;
    max-width: 100%;
  }
  .bottom-input-slide-enter-from,
  .bottom-input-slide-leave-to {
    transform: translateX(-50%) translateY(16px);
  }
}
</style>
