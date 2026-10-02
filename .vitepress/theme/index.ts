import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style/custom.css";
import "./style/sidebar.css";
import "./style/link.scss";

// UI 增强组件
import BackToTop from "./components/ui/BackToTop.vue";
import BackgroundLogo from "./components/ui/BackgroundLogo.vue";
import ReadingProgress from "./components/ui/ReadingProgress.vue";
import CodeCopyEnhancer from "./components/ui/CodeCopyEnhancer.vue";
import ThemeToggleAnimation from "./components/ui/ThemeToggleAnimation.vue";
import AiAssistant from "./components/ui/AiAssistant.vue";
import ReportIssue from "./components/ui/ReportIssue.vue";

// 内容/功能组件
import MethodTabs from "./components/content/MethodTabs.vue";
import MethodTab from "./components/content/MethodTab.vue";
import MermaidRenderer from "./components/content/MermaidRenderer.vue";
import Giscus from "./components/content/Giscus.vue";
import GuideCards from "./components/content/GuideCards.vue";
import BibleDisplay from "./components/content/BibleDisplay.vue";
import MoFoxTeamCard from "./components/content/MoFoxTeamCard.vue";
import PluginStats from "./components/content/PluginStats.vue";
import ContributePluginGuide from "./components/content/ContributePluginGuide.vue";
import ReadingTime from "./components/content/ReadingTime.vue";
import DocButtons from "./components/content/DocButtons.vue";

// 页面级组件
import NotFound from "./components/pages/NotFound.vue";
import GitHubCallback from "./components/pages/GitHubCallback.vue";

import { h } from "vue";
import {
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
  NolebaseEnhancedReadabilitiesPlugin,
} from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";
import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";
import { NolebaseInlineLinkPreviewPlugin } from "@nolebase/vitepress-plugin-inline-link-preview/client";

import "@nolebase/vitepress-plugin-inline-link-preview/client/style.css";

const theme: Theme = {
  ...DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "not-found": () => h(NotFound),
      "doc-before": () => h(ReadingTime),
      "doc-after": () => [h(MermaidRenderer), h(Giscus)],
      "nav-bar-content-after": () => [
        h(NolebaseEnhancedReadabilitiesMenu),
        h(ReportIssue),
      ],
      "nav-screen-content-after": () =>
        h(NolebaseEnhancedReadabilitiesScreenMenu),
      "layout-bottom": () => [
        h(BackToTop),
        h(BackgroundLogo),
        h(ReadingProgress),
        h(CodeCopyEnhancer),
        h(ThemeToggleAnimation),
        h(AiAssistant),
      ],
    });
  },
  enhanceApp({ app }) {
    if (!import.meta.env.SSR) {
      const iconifyScript = document.createElement("script");
      iconifyScript.src =
        "https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js";
      document.head.appendChild(iconifyScript);
    }
    app.use(NolebaseEnhancedReadabilitiesPlugin, {
      layoutSwitch: {
        disableAnimation: true,
      },
    });
    app.use(NolebaseGitChangelogPlugin);
    app.component("GuideCards", GuideCards);
    app.component("BibleDisplay", BibleDisplay);
    app.component("MethodTabs", MethodTabs);
    app.component("MethodTab", MethodTab);
    app.component("ReadingTime", ReadingTime);
    app.component("PluginStats", PluginStats);
    app.component("MoFoxTeamCard", MoFoxTeamCard);
    app.component("ContributePluginGuide", ContributePluginGuide);
    app.component("BackToTop", BackToTop);
    app.component("BackgroundLogo", BackgroundLogo);
    app.component("ReportIssue", ReportIssue);
    app.component("GitHubCallback", GitHubCallback);
    app.component("DocButtons", DocButtons);
    app.use(NolebaseInlineLinkPreviewPlugin);
  },
};

export default theme;
