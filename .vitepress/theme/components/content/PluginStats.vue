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
        <a :href="pluginMarketUrl" target="_blank" rel="noopener noreferrer" class="repo-url-link">
          {{ pluginMarketUrl }}
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
            <iconify-icon icon="mdi:download"></iconify-icon>
          </span>
          <span v-if="loading">正在加载...</span>
          <span v-else>总下载量: <strong>{{ totalDownloads }}</strong></span>
        </div>
        <div class="stat-item">
          <span class="icon">
            <iconify-icon icon="mdi:account-group"></iconify-icon>
          </span>
          <span v-if="loading">正在加载...</span>
          <span v-else>开发者: <strong>{{ totalAuthors }}</strong></span>
        </div>
        <div class="stat-item">
          <span class="icon">
            <iconify-icon icon="mdi:heart"></iconify-icon>
          </span>
          <span v-if="loading">正在加载...</span>
          <span v-else>总点赞: <strong>{{ totalLikes }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineCustomElement } from 'vue';

/** 新插件市场地址 */
const pluginMarketUrl = 'https://39.96.71.162/';

/** 新插件市场 API 基地址 */
const marketApiBase = 'https://39.96.71.162/api/v1';

const totalPlugins = ref(0);
const totalDownloads = ref(0);
const totalAuthors = ref(0);
const totalLikes = ref(0);
const copyIcon = ref('mdi:content-copy');
const loading = ref(true);

/** 复制市场地址到剪贴板 */
const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(pluginMarketUrl);
    copyIcon.value = 'mdi:check';
    setTimeout(() => {
      copyIcon.value = 'mdi:content-copy';
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
    copyIcon.value = 'mdi:alert-circle-outline';
    setTimeout(() => {
      copyIcon.value = 'mdi:content-copy';
    }, 2000);
  }
};

/** 从新插件市场 API 获取统计数据 */
const fetchMarketStats = async () => {
  const response = await fetch(`${marketApiBase}/market/stats`);
  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }
  return response.json();
};

onMounted(async () => {
  loading.value = true;
  try {
    const stats = await fetchMarketStats();
    totalPlugins.value = stats.plugins_total ?? 0;
    totalDownloads.value = stats.downloads_total ?? 0;
    totalAuthors.value = stats.authors_total ?? 0;
    totalLikes.value = stats.likes_total ?? 0;
  } catch (error) {
    console.error('获取插件市场统计信息失败:', error.message);
    totalPlugins.value = '—';
    totalDownloads.value = '—';
    totalAuthors.value = '—';
    totalLikes.value = '—';
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
