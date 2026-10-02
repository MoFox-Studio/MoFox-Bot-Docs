<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import {
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
} from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import { useIssueUrl } from "../../utils/reportIssue";

/**
 * 文档内嵌的「真按钮」演示区（文档使用指南页使用）。
 *
 * 渲染与文档站顶栏功能完全一致的按钮，点击即真实生效：
 * - search       唤起顶栏的 Algolia 搜索弹窗
 * - theme        切换浅色 / 深色主题
 * - readability  原装的阅读增强菜单（布局切换、聚光灯）
 * - github       打开 Neo-MoFox 仓库
 * - issue        在本页开 Issue（自动附带页面信息）
 *
 * 用法（markdown 中）：<DocButtons :items="['search']" /> 或 <DocButtons /> 显示全部。
 */
const props = defineProps({
  /** 要展示的按钮 key 列表，缺省展示全部 */
  items: { type: Array<String>, default: () => ["search", "theme", "readability", "github", "issue"] },
});

const { isDark } = useData();
const issueUrl = useIssueUrl();

const GITHUB_URL = "https://github.com/MoFox-Studio/Neo-MoFox";

const show = (key: string) => (props.items as string[]).includes(key);

function toggleTheme() {
  isDark.value = !isDark.value;
}

function openSearch() {
  // 顶栏的 DocSearch 按钮（自定义 VPAlgoliaSearchBox 挂载在 #docsearch 容器里）
  const button = document.querySelector<HTMLElement>("#docsearch .DocSearch-Button")
    ?? document.querySelector<HTMLElement>(".DocSearch-Button");
  button?.click();
}
</script>

<template>
  <div class="doc-buttons">
    <!-- 搜索 -->
    <button
      v-if="show('search')"
      type="button"
      class="doc-btn"
      title="唤起搜索弹窗（快捷键 Ctrl K）"
      @click="openSearch"
    >
      <iconify-icon icon="mdi:magnify" width="20" height="20" aria-hidden="true" />
      <span class="doc-btn-label">搜索</span>
      <kbd class="doc-btn-kbd">Ctrl K</kbd>
    </button>

    <!-- 深色模式 -->
    <button
      v-if="show('theme')"
      type="button"
      class="doc-btn"
      :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      @click="toggleTheme"
    >
      <iconify-icon
        :icon="isDark ? 'mdi:weather-sunny' : 'mdi:weather-night'"
        width="20"
        height="20"
        aria-hidden="true"
      />
      <span class="doc-btn-label">{{ isDark ? "切回浅色模式" : "切到深色模式" }}</span>
    </button>

    <!-- 阅读增强：原装菜单，功能真实生效 -->
    <div v-if="show('readability')" class="doc-btn-panel" title="阅读增强菜单（布局切换、聚光灯）">
      <!-- 桌面端：与顶栏一致的飞出式菜单按钮 -->
      <div class="doc-btn doc-btn-desktop">
        <div class="doc-btn-menu">
          <NolebaseEnhancedReadabilitiesMenu />
        </div>
        <span class="doc-btn-label">阅读增强菜单</span>
      </div>
      <!-- 移动端：移动版菜单（与移动端导航里的一致，内联展开） -->
      <div class="doc-btn-screen-menu">
        <NolebaseEnhancedReadabilitiesScreenMenu />
      </div>
    </div>

    <!-- GitHub -->
    <a
      v-if="show('github')"
      class="doc-btn"
      :href="GITHUB_URL"
      target="_blank"
      rel="noopener noreferrer"
      title="打开 Neo-MoFox 的 GitHub 仓库"
    >
      <iconify-icon icon="mdi:github" width="20" height="20" aria-hidden="true" />
      <span class="doc-btn-label">GitHub 仓库</span>
    </a>

    <!-- 报告问题 -->
    <a
      v-if="show('issue')"
      class="doc-btn"
      :href="issueUrl"
      target="_blank"
      rel="noopener noreferrer"
      title="在本页开 Issue（自动附带当前页面信息）"
    >
      <iconify-icon icon="mdi:bug-outline" width="20" height="20" aria-hidden="true" />
      <span class="doc-btn-label">报告本页问题</span>
    </a>
  </div>
</template>

<style>
.doc-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 16px 0;
  padding: 14px;
  background: var(--vp-c-bg-soft);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}

.doc-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  text-decoration: none;
  transition:
    color 0.2s,
    border-color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;
}

.doc-btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.doc-buttons a.doc-btn,
.doc-buttons a.doc-btn:hover {
  /* 覆盖 .vp-doc a 的正文链接样式（下划线 + 品牌色），让链接型按钮与按钮型一致 */
  color: var(--vp-c-text-1);
  text-decoration: none;
  opacity: 1;
}

.doc-buttons a.doc-btn:hover {
  color: var(--vp-c-brand-1);
}

.doc-btn:active {
  transform: translateY(1px);
}

.doc-btn-label {
  white-space: nowrap;
}

.doc-btn-kbd {
  padding: 1px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}

/* 阅读增强原装菜单：
   1) 桌面端用飞出式菜单（.doc-btn-desktop），移动端（<768px，与导航栏切换断点一致）
      换成移动版菜单 NolebaseEnhancedReadabilitiesScreenMenu 内联展开；
   2) 桌面端外层 .doc-btn 充当按钮外观，原装按钮只剩图标，并修正其继承的
      64px 导航行高（否则图标和文字会错位）；
   3) 弹层改为「向下、与按钮左对齐」展开，避免按 VPFlyout 默认行为向左钻到
      侧边栏（z-index: var(--vp-z-index-sidebar)）底下；
   4) 容器 z-index 抬到侧边栏之上，保证弹层完整可见。 */
.doc-btn-panel {
  position: relative;
  z-index: calc(var(--vp-z-index-sidebar, 30) + 15);
}

.doc-btn-screen-menu {
  display: none;
}

@media (max-width: 767px) {
  .doc-btn-desktop {
    display: none;
  }

  .doc-btn-screen-menu {
    display: block;
  }
}

.doc-btn-menu {
  display: flex;
  align-items: center;
}

/* 原组件默认在小屏隐藏（导航栏场景由 ScreenMenu 接管），内嵌到正文需要一直显示 */
.doc-btn-menu .VPNolebaseEnhancedReadabilitiesMenu {
  display: block !important;
}

.doc-btn-menu .VPFlyout {
  height: auto;
  line-height: normal;
}

/* VPFlyout 的 ::before 是导航栏里衔接按钮与弹层的悬停桥，占 24px 文档流高度，
   内嵌到正文时会把图标往下顶，移除之（点击开合不受影响） */
.doc-btn-menu .VPFlyout::before {
  display: none;
}

.doc-btn-menu .VPFlyout .button {
  height: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: inherit;
  line-height: normal;
}

.doc-btn-menu .VPFlyout .button:hover {
  color: inherit;
  background: transparent;
}

.doc-btn-menu .VPFlyout .text {
  line-height: normal;
}

.doc-btn-menu .menu {
  top: calc(100% + 10px) !important;
  left: 0 !important;
  right: auto !important;
}
</style>
