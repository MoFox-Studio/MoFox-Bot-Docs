<template>
  <!-- This component doesn't render anything visible itself, it manipulates the DOM -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const copyToClipboard = async (text, button) => {
  try {
    await navigator.clipboard.writeText(text);
    button.classList.add('copied');
    setTimeout(() => {
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    button.classList.add('failed');
    setTimeout(() => {
      button.classList.remove('failed');
    }, 2000);
  }
};

const addCopyButtons = () => {
  const blocks = document.querySelectorAll('div[class*="language-"]');
  
  blocks.forEach((block) => {
    if (block.querySelector('.copy-button')) return;

    const button = document.createElement('button');
    button.className = 'copy-button';
    button.innerHTML = '<span class="icon">📋</span>';
    button.title = 'Copy code';
    
    button.addEventListener('click', () => {
      const code = block.querySelector('code');
      if (code) {
        copyToClipboard(code.innerText, button);
      }
    });

    block.appendChild(button);
  });
};

let observer;

onMounted(() => {
  addCopyButtons();
  
  observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldUpdate = true;
      }
    });
    if (shouldUpdate) {
      addCopyButtons();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style>
/* Global styles for the copy button injected by this component */
div[class*="language-"] {
  position: relative;
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0; /* Hidden by default */
}

div[class*="language-"]:hover .copy-button {
  opacity: 1;
}

.copy-button:hover {
  background-color: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand);
}

.copy-button.copied {
  border-color: var(--vp-c-green);
  color: var(--vp-c-green);
}

.copy-button.copied::after {
  content: "Copied!";
  position: absolute;
  top: -30px;
  right: 0;
  background: var(--vp-c-bg-mute);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.copy-button .icon {
  font-size: 16px;
}
</style>
