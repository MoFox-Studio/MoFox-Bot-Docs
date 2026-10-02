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
  <div
    v-show="visible"
    class="method-tab-panel"
    role="tabpanel"
    :data-method="value"
  >
    <slot />
  </div>
</template>
