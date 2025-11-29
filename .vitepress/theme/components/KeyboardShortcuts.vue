<template>
  <Teleport to="body">
    <div v-if="showHelp" class="keyboard-shortcuts-modal" @click="showHelp = false">
      <div class="modal-content" @click.stop>
        <h3>⌨️ 键盘快捷键</h3>
        <div class="shortcut-list">
          <div class="shortcut-item">
            <span class="key">?</span>
            <span class="desc">显示/隐藏此帮助</span>
          </div>
          <div class="shortcut-item">
            <span class="key">t</span>
            <span class="desc">回到顶部</span>
          </div>
          <div class="shortcut-item">
            <span class="key">b</span>
            <span class="desc">去到底部</span>
          </div>
          <div class="shortcut-item">
            <span class="key">Esc</span>
            <span class="desc">关闭弹窗</span>
          </div>
        </div>
        <button class="close-btn" @click="showHelp = false">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const showHelp = ref(false);

const handleKeydown = (e) => {
  // Ignore if user is typing in an input or textarea
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
    return;
  }

  if (e.key === '?' && e.shiftKey) {
    showHelp.value = !showHelp.value;
  } else if (e.key === 'Escape') {
    showHelp.value = false;
  } else if (!showHelp.value) {
    // Only handle navigation shortcuts if modal is closed
    if (e.key === 't') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.key === 'b') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.keyboard-shortcuts-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--vp-c-bg);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  min-width: 300px;
  border: 1px solid var(--vp-c-divider);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  color: var(--vp-c-text-1);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.key {
  background: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 8px;
  font-family: monospace;
  font-weight: bold;
  color: var(--vp-c-text-1);
  min-width: 30px;
  text-align: center;
  box-shadow: 0 2px 0 var(--vp-c-divider);
}

.desc {
  color: var(--vp-c-text-2);
}

.close-btn {
  margin-top: 24px;
  width: 100%;
  padding: 8px;
  background: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--vp-c-brand-dark);
}
</style>
