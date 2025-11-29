<template>
  <div class="NotFound" :class="{ 'self-destruct': isDestructing }">
    <canvas ref="matrixCanvas" class="matrix-canvas"></canvas>
    
    <Teleport to="body">
      <div v-if="showOverlay" class="destruct-overlay" :class="{ 'crt-off': isFinished }">
        <div class="warning-container" v-if="!isFinished">
          <div class="warning-sign">⚠️</div>
          <div class="warning-title">SYSTEM FAILURE</div>
          <div class="countdown">{{ countdown }}</div>
          <div class="warning-msg">CRITICAL ERROR: REALITY COLLAPSE IMMINENT</div>
        </div>
      </div>

      <div v-if="showFakeError" class="fake-error-screen">
        <div class="error-content">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" width="72" height="72" fill="#9aa0a6">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16zM11 15h2v2h-2zm0-8h2v6h-2z"/>
            </svg>
          </div>
          <h2>嗯… 无法访问此页面</h2>
          <p><strong>{{ hostname }}</strong> 拒绝了我们的连接请求。</p>
          <p>请尝试：</p>
          <ul class="suggestion-list">
            <li>检查连接</li>
            <li>检查代理和防火墙</li>
            <li>运行 Windows 网络诊断</li>
          </ul>
          <p class="error-code">ERR_CONNECTION_REFUSED</p>
          <button @click="reloadPage" class="reload-button">刷新</button>
        </div>
      </div>
    </Teleport>

    <div class="content" v-show="!showOverlay && !showFakeError">
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
import { useRouter } from 'vitepress';

const router = useRouter();
const issuesUrl = 'https://github.com/MoFox-Studio/MoFox-Bot-Docs/issues';
const clickCount = ref(0);
const showSecretButton = ref(false);
const isDestructing = ref(false);
const matrixCanvas = ref(null);
const matrixColor = ref('var(--vp-c-brand-1)');
const showOverlay = ref(false);
const showFakeError = ref(false);
const countdown = ref(3);
const isFinished = ref(false);
const hostname = ref('');
let animationFrameId;

const handleTitleClick = () => {
  clickCount.value++;
  if (clickCount.value >= 5) {
    showSecretButton.value = true;
  }
};

const reloadPage = () => {
  router.go('/');
};

const activateSelfDestruct = () => {
  isDestructing.value = true;
  showSecretButton.value = false;
  matrixColor.value = '#ff3333';
  console.log('%c[SYSTEM] Self-destruct sequence initiated.', 'color: red; font-size: 16px; font-weight: bold;');
  
  setTimeout(() => {
    showOverlay.value = true;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value < 0) {
        clearInterval(timer);
        // 直接切换到错误页面，跳过 CRT 关机动画
        showOverlay.value = false;
        showFakeError.value = true;
        isDestructing.value = false;
      }
    }, 1000);
  }, 500);
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    hostname.value = window.location.hostname;
  }
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
    ctx.fillStyle = matrixColor.value;
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
  background-clip: text;
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

.destruct-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  background: radial-gradient(circle, rgba(40, 0, 0, 0.95) 0%, rgba(0, 0, 0, 1) 100%);
  backdrop-filter: blur(5px);
  animation: pulse-bg 0.5s infinite alternate;
  overflow: hidden;
}

.destruct-overlay::before {
  content: " ";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  z-index: 2;
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
}

.destruct-overlay.crt-off {
  animation: turn-off 0.55s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  background-color: #000;
}

@keyframes turn-off {
  0% {
    transform: scale(1, 1.3) translate3d(0, 0, 0);
    filter: brightness(1);
    opacity: 1;
  }
  60% {
    transform: scale(1, 0.001) translate3d(0, 0, 0);
    filter: brightness(10);
  }
  100% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: scale(0, 0.0001) translate3d(0, 0, 0);
    filter: brightness(50);
    opacity: 0;
  }
}

.warning-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ff3333;
  font-family: 'Courier New', Courier, monospace;
  text-align: center;
  border: 4px solid #ff3333;
  padding: 3rem;
  background: rgba(0, 0, 0, 0.9);
  box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
  transform: scale(1);
  animation: shake-hard 0.2s infinite;
}

.warning-sign {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.warning-title {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.5rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 0px #000;
}

.countdown {
  font-size: 8rem;
  font-weight: bold;
  line-height: 1;
  margin: 1rem 0;
  color: #fff;
  text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000;
}

.warning-msg {
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  animation: blink-text 0.1s infinite;
}

@keyframes pulse-bg {
  from { background: rgba(20, 0, 0, 0.85); }
  to { background: rgba(60, 0, 0, 0.9); }
}

@keyframes shake-hard {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-5px, 5px) rotate(-1deg); }
  50% { transform: translate(5px, -5px) rotate(1deg); }
  75% { transform: translate(-5px, -5px) rotate(-1deg); }
  100% { transform: translate(5px, 5px) rotate(1deg); }
}

@keyframes blink-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.fake-error-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #2b2b2b;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2147483647;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.error-content {
  text-align: left;
  max-width: 600px;
  padding: 20px;
}

.error-icon {
  margin-bottom: 24px;
}

.fake-error-screen h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #ffffff;
}

.fake-error-screen p {
  font-size: 15px;
  margin-bottom: 12px;
  line-height: 1.5;
  color: #aeb2b5;
}

.suggestion-list {
  margin: 0 0 24px 0;
  padding-left: 24px;
  color: #aeb2b5;
  font-size: 15px;
  text-align: left;
}

.suggestion-list li {
  margin-bottom: 8px;
}

.error-code {
  color: #8a8a8a;
  font-family: monospace;
  margin-bottom: 32px;
  font-size: 13px;
}

.reload-button {
  background-color: #0078d4;
  color: #ffffff;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reload-button:hover {
  background-color: #106ebe;
}
</style>