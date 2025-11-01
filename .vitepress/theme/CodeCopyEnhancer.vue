<template>
  <div></div>
</template>

<script setup>
import { onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vitepress';

const route = useRoute();
let observer = null;

const addCopyButtons = () => {
  nextTick(() => {
    const codeBlocks = document.querySelectorAll('div[class*="language-"]:not(.code-copy-enhanced)');
    
    codeBlocks.forEach((block) => {
      block.classList.add('code-copy-enhanced');
      
      // 检查是否已经有复制按钮
      if (block.querySelector('.copy-code-button')) {
        return;
      }
      
      // 创建复制按钮
      const button = document.createElement('button');
      button.className = 'copy-code-button';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
        </svg>
        <span class="button-text">复制</span>
      `;
      
      button.addEventListener('click', async () => {
        const code = block.querySelector('code');
        if (!code) return;
        
        const text = code.innerText;
        
        try {
          await navigator.clipboard.writeText(text);
          
          // 显示成功状态
          button.classList.add('copied');
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19L21 7l-1.41-1.41z"/>
            </svg>
            <span class="button-text">已复制!</span>
          `;
          
          // 2秒后恢复原状
          setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
              </svg>
              <span class="button-text">复制</span>
            `;
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
          button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M13 13h-2V7h2m0 10h-2v-2h2M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/>
            </svg>
            <span class="button-text">失败</span>
          `;
          setTimeout(() => {
            button.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
              </svg>
              <span class="button-text">复制</span>
            `;
          }, 2000);
        }
      });
      
      block.style.position = 'relative';
      block.appendChild(button);
    });
  });
};

onMounted(() => {
  addCopyButtons();
  
  // 监听路由变化
  const unwatch = route.path && (() => {
    setTimeout(addCopyButtons, 100);
  });
  
  // 监听DOM变化
  const targetNode = document.querySelector('.vp-doc') || document.body;
  observer = new MutationObserver(() => {
    addCopyButtons();
  });
  
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style>
.copy-code-button {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  opacity: 0.7;
  z-index: 10;
}

.copy-code-button:hover {
  opacity: 1;
  background-color: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.copy-code-button.copied {
  background-color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
  opacity: 1;
}

.copy-code-button svg {
  flex-shrink: 0;
}

.copy-code-button .button-text {
  white-space: nowrap;
}

/* 响应式：小屏幕只显示图标 */
@media (max-width: 640px) {
  .copy-code-button .button-text {
    display: none;
  }
  
  .copy-code-button {
    padding: 6px 8px;
  }
}

/* 确保代码块有足够的空间给按钮 */
div[class*="language-"] {
  position: relative;
  padding-top: 2.5rem;
}

div[class*="language-"] > span.lang {
  top: 8px;
  right: auto;
  left: 12px;
}
</style>

