<script setup>
import { computed, inject } from "vue";

/**
 * MethodTabs 的内容块。只有 value 与当前选中项一致时显示。
 * 独立使用（没有 MethodTabs 父级）时始终显示。
 */
const props = defineProps({
  /** 对应 MethodTabs options 中某一选项的 value */
  value: { type: String, required: true },
});

const active = inject("mofoxMethodTabsActive", null);
const visible = computed(() => (active ? active.value === props.value : true));
</script>

<template>
  <!-- 用 v-if 而非 v-show：未选中的面板不进入 DOM，
       侧栏大纲（按 DOM 提取标题）就只列出当前面板的标题，切换时实时更新 -->
  <div
    v-if="visible"
    class="method-tab-panel"
    role="tabpanel"
    :data-method="value"
  >
    <slot />
  </div>
</template>
