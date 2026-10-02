<script setup>
import { computed, inject, onMounted, provide, ref, watch } from "vue";

/**
 * 通用多维度切换器（文档内按"用户使用的工具/方式"区分内容）。
 *
 * 用法（markdown 中，组件标签之间必须保留空行）：
 *
 * <MethodTabs dimension="update" :options="[
 *   { value: 'launcher', label: '启动器', icon: 'mdi:application' },
 *   { value: 'docker', label: 'Docker', icon: 'mdi:docker' },
 * ]">
 *
 * <MethodTab value="launcher">…</MethodTab>
 *
 * <MethodTab value="docker">…</MethodTab>
 *
 * </MethodTabs>
 *
 * - dimension：同一维度的选择在所有页面之间共享记忆
 * - 选择持久化在 localStorage（mofox-method:<dimension>）
 * - URL 同步 ?<dimension>=<value>，便于分享指定选择的链接
 */
const props = defineProps({
  /** 维度名，例如 update / config / channel */
  dimension: { type: String, required: true },
  /** 选项数组：{ value, label, icon?, desc? } */
  options: { type: Array, required: true },
});

const STORAGE_PREFIX = "mofox-method:";
const storageKey = STORAGE_PREFIX + props.dimension;

const active = ref(props.options[0]?.value ?? "");
const hydrated = ref(false);

function isValid(value) {
  return props.options.some((option) => option.value === value);
}

onMounted(() => {
  // URL 参数优先（便于分享），其次本地记忆
  let query = null;
  try {
    query = new URLSearchParams(window.location.search).get(props.dimension);
  } catch {}
  if (isValid(query)) {
    active.value = query;
  } else {
    try {
      const stored = localStorage.getItem(storageKey);
      if (isValid(stored)) active.value = stored;
    } catch {}
  }
  hydrated.value = true;
});

watch(active, (value) => {
  if (!hydrated.value) return;
  try {
    localStorage.setItem(storageKey, value);
  } catch {}
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(props.dimension, value);
    window.history.replaceState(null, "", url);
  } catch {}
});

function select(value) {
  active.value = value;
}

provide("mofoxMethodTabsActive", active);

const activeDesc = computed(
  () => props.options.find((option) => option.value === active.value)?.desc ?? "",
);
</script>

<template>
  <div class="method-tabs">
    <div class="method-tabs-bar" role="tablist">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="tab"
        class="method-tabs-btn"
        :class="{ active: option.value === active }"
        :aria-selected="option.value === active"
        @click="select(option.value)"
      >
        <iconify-icon
          v-if="option.icon"
          :icon="option.icon"
          width="17"
          height="17"
          aria-hidden="true"
        />
        <span>{{ option.label }}</span>
      </button>
    </div>
    <p v-if="activeDesc" class="method-tabs-desc">{{ activeDesc }}</p>
    <div class="method-tabs-panels">
      <slot />
    </div>
  </div>
</template>

<style>
.method-tabs {
  margin: 16px 0;
}
.method-tabs-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  width: fit-content;
  max-width: 100%;
}
.method-tabs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  transition:
    color 0.2s,
    background-color 0.2s,
    border-color 0.2s;
}
.method-tabs-btn:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}
.method-tabs-btn.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  border-color: var(--vp-c-brand-1);
}
.method-tabs-desc {
  margin: 10px 2px 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.method-tabs-panels {
  margin-top: 12px;
}
.method-tab-panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 4px 20px 8px;
  background: var(--vp-c-bg);
}
.method-tab-panel .method-tabs {
  margin: 8px 0;
}
@media (max-width: 640px) {
  .method-tabs-bar {
    width: 100%;
  }
  .method-tabs-btn {
    flex: 1 1 auto;
  }
}
</style>
