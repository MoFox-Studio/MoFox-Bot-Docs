<template>
  <div class="plugin-stats-wrapper">
    <div class="main-card">
      <div class="card-header">
        <span class="icon">
          <iconify-icon icon="mdi:store"></iconify-icon>
        </span>
        <span>插件市场</span>
      </div>
      <div class="repo-url-container">
        <a :href="pluginRepoUrl" target="_blank" rel="noopener noreferrer" class="repo-url-link">
          {{ pluginRepoUrl }}
        </a>
        <button @click.stop.prevent="copyUrl" class="copy-button">
          <span class="icon">
            <iconify-icon :icon="copyIcon"></iconify-icon>
          </span>
        </button>
      </div>
      <div class="stats-footer">
        <div class="stat-item">
          <span class="icon">
            <iconify-icon icon="mdi:package-variant-closed"></iconify-icon>
          </span>
          <span v-if="loading">正在加载...</span>
          <span v-else>插件总数: <strong>{{ totalPlugins }}</strong></span>
        </div>
        <div class="stat-item">
          <span class="icon">
            <iconify-icon icon="mdi:new-box"></iconify-icon>
          </span>
          <span v-if="loading">正在加载...</span>
          <span v-else>今日新增: <strong>{{ newToday }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineCustomElement } from 'vue';

// 镜像站列表，哼，我就不信你们还能全都挂掉！
const mirrorUrls = [
  'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/refs/heads/main/plugin_details.json',
  'https://ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/refs/heads/main/plugin_details.json',
  'https://mirror.ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/refs/heads/main/plugin_details.json',
  'https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/refs/heads/main/plugin_details.json',
];
const pluginRepoUrl = 'https://plugin.mofox-sama.com/';

const totalPlugins = ref(0);
const newToday = ref(0);
const copyIcon = ref('mdi:content-copy');
const loading = ref(true);

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(pluginRepoUrl);
    copyIcon.value = 'mdi:check';
    setTimeout(() => {
      copyIcon.value = 'mdi:content-copy';
    }, 2000);
  } catch (err) {
    console.error('主人，复制失败了，呜呜呜...', err);
    copyIcon.value = 'mdi:alert-circle-outline';
     setTimeout(() => {
      copyIcon.value = 'mdi:content-copy';
    }, 2000);
  }
};

// 轮流尝试所有镜像站
const fetchFromMirrors = async () => {
  for (const url of mirrorUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      console.warn(`主人，镜像站 ${url} 好像也挂了...`);
    } catch (error) {
      console.error(`主人，访问镜像站 ${url} 时出错了:`, error);
    }
  }
  throw new Error('主人，所有的镜像站都阵亡了，我也没办法了...');
};


onMounted(async () => {
  loading.value = true;
  try {
    const plugins = await fetchFromMirrors();
    totalPlugins.value = plugins.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    newToday.value = plugins.filter(plugin => {
      const createdAt = new Date(plugin.createdAt);
      return createdAt >= today;
    }).length;

  } catch (error) {
    console.error(error.message);
    totalPlugins.value = '获取插件信息失败';
    newToday.value = '获取插件信息失败';
  } finally {
    loading.value = false;
  }
});

if (typeof window !== 'undefined') {
  const IconifyIcon = defineCustomElement({
    template: '<span><slot></slot></span>',
  });
  if (!customElements.get('iconify-icon')) {
    customElements.define('iconify-icon', IconifyIcon);
  }
}
</script>

<style scoped>
.plugin-stats-wrapper {
  margin-top: 24px;
}

.main-card {
  padding: 24px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  transition: border-color 0.25s, background-color 0.25s;
}

.main-card:hover {
  border-color: var(--vp-c-brand-1);
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.card-header .icon {
  font-size: 1.5rem;
  margin-right: 12px;
}

.repo-url-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 1rem;
  background-color: var(--vp-c-bg-mute);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin-bottom: 16px;
}

.repo-url-link {
  color: var(--vp-c-text-2);
  text-decoration: none;
  word-break: break-all;
  transition: color 0.25s;
}

.repo-url-link:hover {
  color: var(--vp-c-brand-1);
}

.copy-button {
  padding: 0 0 0 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.copy-button .icon {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
  transition: color 0.25s;
}

.copy-button:hover .icon {
  color: var(--vp-c-text-1);
}

.stats-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
}

.stat-item .icon {
  font-size: 1.2rem;
  margin-right: 8px;
  color: var(--vp-c-brand-1);
}

.stat-item strong {
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-left: 4px;
}
</style>