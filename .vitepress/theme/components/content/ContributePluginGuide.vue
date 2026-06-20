<template>
  <div class="contribute-plugin-guide-wrapper">
    <div class="main-card">
      <div class="card-header">
        <span class="icon">
          <iconify-icon icon="mdi:creation"></iconify-icon>
        </span>
        <span>插件贡献助手</span>
      </div>

      <div class="form-section">
        <div class="input-group">
          <label for="github-user">您的 GitHub 用户名</label>
          <input id="github-user" v-model="githubUser" type="text" placeholder="例如：MoFox-Studio" />
        </div>
        <div class="input-group">
          <label for="repo-name">您的插件仓库名</label>
          <input id="repo-name" v-model="repoName" type="text" placeholder="例如：My-Awesome-Plugin" />
        </div>
      </div>

      <div class="preview-section">
        <div class="preview-header">
          <h4>生成内容预览</h4>
          <button @click.stop.prevent="copyContent" class="copy-button">
            <span class="icon">
              <iconify-icon :icon="copyIcon"></iconify-icon>
            </span>
            <span>复制完整内容</span>
          </button>
        </div>
        <div class="code-preview-wrapper">
          <pre><code>{{ generatedContent }}</code></pre>
          <div v-if="loading" class="loading-overlay">
            正在从插件仓库拉取最新数据...
          </div>
        </div>
        <p class="tip">
            <strong>使用方法：</strong> 点击上方按钮复制全部内容，然后直接覆盖您 Fork 的仓库中的 `plugins.json` 文件即可。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const mirrorUrls = [
  'https://cdn.jsdelivr.net/gh/MoFox-Studio/MoFox-Plugin-Repo@main/plugins.json',
  'https://ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/main/plugins.json',
  'https://mirror.ghproxy.com/https://raw.githubusercontent.com/MoFox-Studio/MoFox-Plugin-Repo/main/plugins.json',
];

const githubUser = ref('');
const repoName = ref('');
const originalPlugins = ref([]);
const loading = ref(true);
const copyIcon = ref('mdi:content-copy');

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
    originalPlugins.value = await fetchFromMirrors();
  } catch (error) {
    console.error(error.message);
    originalPlugins.value = [{ error: "获取插件列表失败，请检查网络或稍后再试。" }];
  } finally {
    loading.value = false;
  }
});

const generatedContent = computed(() => {
  if (loading.value) {
    return '正在加载...';
  }
  
  const newUserPlugin = {
    id: `${githubUser.value || 'your-github-username'}.${repoName.value || 'your-plugin-repo-name'}`,
    repositoryUrl: `https://github.com/${githubUser.value || 'YOUR-USERNAME'}/${repoName.value || 'YOUR-PLUGIN-REPO'}`
  };

  // 避免重复添加
  const existingIds = new Set(originalPlugins.value.map(p => p.id));
  let updatedPlugins = [...originalPlugins.value];
  if (githubUser.value && repoName.value && !existingIds.has(newUserPlugin.id)) {
     updatedPlugins.push(newUserPlugin);
  } else if (!githubUser.value && !repoName.value) {
    updatedPlugins.push(newUserPlugin);
  }

  return JSON.stringify(updatedPlugins, null, 2);
});

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(generatedContent.value);
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
</script>

<style scoped>
.contribute-plugin-guide-wrapper {
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
  margin-bottom: 20px;
}
.card-header .icon {
  font-size: 1.5rem;
  margin-right: 12px;
}
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.input-group {
  display: flex;
  flex-direction: column;
}
.input-group label {
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
.input-group input {
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
  font-size: 1rem;
  transition: border-color 0.25s;
}
.input-group input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
.preview-section {
    border-top: 1px solid var(--vp-c-divider);
    padding-top: 20px;
}
.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}
.preview-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--vp-c-text-1);
}
.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--vp-c-brand-1);
  background-color: transparent;
  color: var(--vp-c-brand-1);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s, color 0.25s;
  font-weight: 600;
}
.copy-button:hover {
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg-soft);
}
.copy-button .icon {
  font-size: 1.2rem;
}
.code-preview-wrapper {
  position: relative;
  background-color: var(--vp-c-bg-mute);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  max-height: 400px;
  overflow-y: auto;
}
.code-preview-wrapper pre {
  margin: 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-all;
}
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(var(--vp-c-bg-mute-rgb), 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--vp-c-text-2);
    font-weight: 500;
    border-radius: 8px;
}
.tip {
    margin-top: 16px;
    font-size: 0.9rem;
    color: var(--vp-c-text-2);
    background-color: var(--vp-c-bg-mute);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--vp-c-divider);
}
.tip strong {
    color: var(--vp-c-text-1);
}
</style>