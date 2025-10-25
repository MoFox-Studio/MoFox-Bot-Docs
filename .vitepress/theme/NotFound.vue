<template>
  <div class="NotFound" :class="{ 'self-destruct': isDestructing }">
    <canvas ref="matrixCanvas" class="matrix-canvas"></canvas>
    <div class="content">
      <h1 @click="handleTitleClick" class="glitch" data-text="404">404</h1>
      <p>哎呀，看起来你好像迷路了。</p>
      <p>不过，别担心，这里也许藏着一个“秘密”……</p>
      <blockquote>
        如果你是在正常浏览文档时来到这里的，那说明你可能发现了一个“时空裂缝”（也就是 bug）。
        请不要犹豫，立刻前往我们的 <a :href="issuesUrl" target="_blank" rel="noopener noreferrer">GitHub Issues</a> 页面，告诉我们你是如何“闯入”这个地方的。
        作为回报，说不定会有神秘奖励哦？
      </blockquote>
      <div class="actions">
        <a :href="issuesUrl" target="_blank" rel="noopener noreferrer" class="button brand">报告 Bug</a>
        <a href="/" class="button">返回主页</a>
      </div>
      <button v-if="showSecretButton" @click="activateSelfDestruct" class="button secret-button">启动自毁程序</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const issuesUrl = 'https://github.com/MoFox-Studio/MoFox-Bot-Docs/issues';
const clickCount = ref(0);
const showSecretButton = ref(false);
const isDestructing = ref(false);
const matrixCanvas = ref(null);
let animationFrameId;

const handleTitleClick = () => {
  clickCount.value++;
  if (clickCount.value >= 5) {
    showSecretButton.value = true;
  }
};

const activateSelfDestruct = () => {
  isDestructing.value = true;
  console.log('%c[SYSTEM] Self-destruct sequence initiated. Say goodbye.', 'color: red; font-size: 16px; font-weight: bold;');
  setTimeout(() => {
    console.log('%c[SYSTEM] Self-destruct complete. Returning to home...', 'color: green; font-size: 14px;');
    // 直接跳转到首页，这样顶部栏会正常显示
    window.location.href = '/';
  }, 3000);
};

onMounted(() => {
  console.log('%cYou found a secret place... or a bug. Probably a bug.', 'color: #4A90E2; font-size: 18px; background: #222; padding: 8px;');

  const canvas = matrixCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const columns = Math.floor(width / 20);
  const drops = Array(columns).fill(1);
  const chars = 'モフォックススタジオ'.split(''); // MoFox Studio in Katakana

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'var(--vp-c-brand-1)';
    ctx.font = '15px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * 20, drops[i] * 20);
      if (drops[i] * 20 > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  function animate() {
    draw();
    animationFrameId = requestAnimationFrame(animate);
  }

  const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', handleResize);
  animate();

  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('resize', handleResize);
  });
});
</script>

<style scoped>
.NotFound {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: calc(100vh - 64px); /* 减去顶部栏高度 */
  padding: 2rem;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  transition: opacity 0.5s ease;
  overflow: hidden; /* Prevent scrollbars from appearing during shake */
}

.matrix-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  opacity: 0.2;
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  max-width: 600px;
  border: 1px solid rgba(0,0,0,0.1);
}

.dark .content {
    background-color: rgba(30, 30, 30, 0.8);
    border: 1px solid rgba(255,255,255,0.1);
}

h1 {
  font-size: 6rem;
  font-weight: 900;
  cursor: pointer;
  user-select: none;
  margin: 0;
  line-height: 1;
  background: -webkit-linear-gradient(120deg, var(--vp-c-brand-1) 20%, var(--vp-c-text-2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  font-size: 1.2rem;
  margin: 1rem 0;
}

blockquote {
  margin: 1.5rem 0;
  padding: 1rem;
  border-left: 4px solid var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  text-align: left;
}

.actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.button.brand {
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.button:hover {
  background-color: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-white);
}

.secret-button {
  margin-top: 1.5rem;
  border-color: #ff4d4d;
  color: #ff4d4d;
  animation: pulse 1.5s infinite;
}

.secret-button:hover {
    background-color: #ff4d4d;
    border-color: #ff4d4d;
    color: var(--vp-c-white);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 10px 20px rgba(255, 77, 77, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 77, 77, 0);
  }
}

/* Self-destruct animation */
.self-destruct {
  animation: flicker 0.1s infinite, screen-shake 0.5s infinite;
}

.self-destruct .content {
    animation: fade-out 3s forwards;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes screen-shake {
  0%, 100% { transform: translate(0, 0); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 2px); }
  20%, 40%, 60%, 80% { transform: translate(2px, -2px); }
}

@keyframes fade-out {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.8); }
}

/* Glitch effect for 404 text */
.glitch {
  position: relative;
  animation: glitch-anim 2.5s infinite linear alternate-reverse;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--vp-c-bg);
  overflow: hidden;
}

.glitch::before {
  left: 2px;
  text-shadow: -2px 0 var(--vp-c-brand-2);
  animation: glitch-anim-2 2.5s infinite linear alternate-reverse;
}

.glitch::after {
  left: -2px;
  text-shadow: -2px 0 var(--vp-c-brand-3), 2px 2px var(--vp-c-brand-2);
  animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
  100% { transform: translate(0); }
}

@keyframes glitch-anim-1 {
  0% { clip-path: polygon(0 2%, 100% 2%, 100% 98%, 0 98%); }
  25% { clip-path: polygon(0 75%, 100% 75%, 100% 100%, 0 100%); }
  50% { clip-path: polygon(0 25%, 100% 25%, 100% 35%, 0 35%); }
  75% { clip-path: polygon(0 80%, 100% 80%, 100% 70%, 0 70%); }
  100% { clip-path: polygon(0 50%, 100% 50%, 100% 60%, 0 60%); }
}

@keyframes glitch-anim-2 {
  0% { clip-path: polygon(0 50%, 100% 50%, 100% 60%, 0 60%); }
  25% { clip-path: polygon(0 15%, 100% 15%, 100% 25%, 0 25%); }
  50% { clip-path: polygon(0 90%, 100% 90%, 100% 80%, 0 80%); }
  75% { clip-path: polygon(0 40%, 100% 40%, 100% 30%, 0 30%); }
  100% { clip-path: polygon(0 5%, 100% 5%, 100% 15%, 0 15%); }
}
</style>