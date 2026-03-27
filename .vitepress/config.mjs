import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import {
  GitChangelog,
  GitChangelogMarkdownSection,
} from "@nolebase/vitepress-plugin-git-changelog/vite";
import { InlineLinkPreviewElementTransform } from "@nolebase/vitepress-plugin-inline-link-preview/markdown-it";
import taskLists from "markdown-it-task-lists";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// ── 从 sidebar 配置中递归提取所有页面链接 ────────────────────────
function extractLinksFromSidebar(sidebar) {
  const links = [];

  function walk(items) {
    if (!items) return;
    if (Array.isArray(items)) {
      for (const item of items) walk(item);
      return;
    }
    if (typeof items === "object") {
      if (items.link) {
        links.push({ title: items.text || items.link, path: items.link });
      }
      if (items.items) walk(items.items);
    }
  }

  if (Array.isArray(sidebar)) {
    walk(sidebar);
  } else if (typeof sidebar === "object") {
    for (const key of Object.keys(sidebar)) {
      walk(sidebar[key]);
    }
  }

  return links;
}

const devSidebar = [
  {
    text: "开发",
    collapsed: false,
    items: [{ text: "开发主页", link: "/docs/development/" }],
  },
  {
    text: "贡献指南和开发帮助",
    collapsed: false,
    items: [
      { text: "参与项目贡献", link: "/docs/development/guidelines/CONTRIBUTE" },
      {
        text: "开发准则",
        link: "/docs/development/guidelines/development_guidelines",
      },
    ],
  },
  {
    text: "插件开发",
    collapsed: false,
    items: [
      { text: "插件开发概述", link: "/docs/development/plugin_develop/" },
      {
        text: "插件机制原理",
        link: "/docs/development/plugin_develop/guide/mechanism",
      },
      {
        text: "插件结构与最佳实践",
        link: "/docs/development/plugin_develop/structure",
      },
      {
        text: "manifest.json 格式说明",
        link: "/docs/development/plugin_develop/manifest",
      },
      { text: "进阶开发", link: "/docs/development/plugin_develop/advanced" },
      {
        text: "插件编写指南",
        collapsed: false,
        items: [
          {
            text: "1. 写在前面",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/1-introduction",
          },
          {
            text: "2. 最小概念",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/2-minimal-concept",
          },
          {
            text: "3. 第一个插件",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/3-first-plugin",
          },
          {
            text: "4. 运行机制",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/4-how-it-works",
          },
          {
            text: "5. 插件结构",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/5-structure",
          },
          {
            text: "6. 配置系统",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/6-config",
          },
          {
            text: "7. Command 与 Service",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/7-command-and-service",
          },
          {
            text: "8. 第一个 Tool",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/8-first-tool",
          },
          {
            text: "9. Prompt API",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/9-prompt-api",
          },
          {
            text: "10. LLM API",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/10-llm-api",
          },
          {
            text: "11. Tool 与 LLM",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/11-tool-llm",
          },
          {
            text: "12. Default Chatter 与 FSM",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/12-default-chatter-fsm",
          },
          {
            text: "13. Agent 编排",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/13-agent-orchestration",
          },
          {
            text: "14. Action 组件",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/14-action",
          },
          {
            text: "15. 事件系统",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/15-event-system",
          },
          {
            text: "16. Chatter 组件",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/16-chatter",
          },
          {
            text: "17. Router 组件",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/17-router",
          },
          {
            text: "18. Adapter 组件",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/18-adapter",
          },
          {
            text: "19. 消息模型",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/19-message-model",
          },
          {
            text: "20. 总览与下一步",
            link: "/docs/development/plugin_develop/guide/plugin-authoring/20-overview-and-next",
          },
        ],
      },
      {
        text: "插件组件",
        collapsed: false,
        items: [
          {
            text: "组件总览",
            link: "/docs/development/plugin_develop/components/",
          },
          {
            text: "Plugin — 插件根组件",
            link: "/docs/development/plugin_develop/components/plugin",
          },
          {
            text: "Action — 动作组件",
            link: "/docs/development/plugin_develop/components/action",
          },
          {
            text: "Adapter — 适配器组件",
            link: "/docs/development/plugin_develop/components/adapter",
          },
          {
            text: "agent — 协助者组件",
            link: "/docs/development/plugin_develop/components/agent",
          },
          {
            text: "Chatter — 聊天器组件",
            link: "/docs/development/plugin_develop/components/chatter",
          },
          {
            text: "Collection — 集合组件",
            link: "/docs/development/plugin_develop/components/collection",
          },
          {
            text: "Command — 命令组件",
            link: "/docs/development/plugin_develop/components/command",
          },
          {
            text: "Config — 配置组件",
            link: "/docs/development/plugin_develop/components/config",
          },
          {
            text: "EventHandler — 事件处理器组件",
            link: "/docs/development/plugin_develop/components/event-handler",
          },
          {
            text: "Router — 路由组件",
            link: "/docs/development/plugin_develop/components/router",
          },
          {
            text: "Service — 服务组件",
            link: "/docs/development/plugin_develop/components/service",
          },
          {
            text: "Tool — 工具组件",
            link: "/docs/development/plugin_develop/components/tool",
          },
        ],
      },
      {
        text: "MPDT 开发工具",
        collapsed: false,
        items: [
          { text: "MPDT 概述", link: "/docs/development/mpdt/" },
          { text: "安装指南", link: "/docs/development/mpdt/installation" },
          { text: "AI Skill 安装指南", link: "/docs/development/mpdt/skill-guide" },
          {
            text: "命令参考",
            collapsed: false,
            items: [
              {
                text: "mpdt init",
                link: "/docs/development/mpdt/commands/init",
              },
              {
                text: "mpdt generate",
                link: "/docs/development/mpdt/commands/generate",
              },
              {
                text: "mpdt check",
                link: "/docs/development/mpdt/commands/check",
              },
              {
                text: "mpdt build",
                link: "/docs/development/mpdt/commands/build",
              },
              { text: "mpdt dev", link: "/docs/development/mpdt/commands/dev" },
              {
                text: "mpdt config",
                link: "/docs/development/mpdt/commands/config",
              },
            ],
          },
        ],
      },
      {
        text: "插件 API",
        collapsed: false,
        items: [
          {
            text: "API 文档总览",
            link: "/docs/development/plugin_develop/api/",
          },
          {
            text: "Action API",
            link: "/docs/development/plugin_develop/api/action-api",
          },
          {
            text: "Adapter API",
            link: "/docs/development/plugin_develop/api/adapter-api",
          },
          {
            text: "Chat API",
            link: "/docs/development/plugin_develop/api/chat-api",
          },
          {
            text: "Command API",
            link: "/docs/development/plugin_develop/api/command-api",
          },
          {
            text: "Config API",
            link: "/docs/development/plugin_develop/api/config-api",
          },
          {
            text: "数据库 API",
            link: "/docs/development/plugin_develop/api/database-api",
          },
          {
            text: "事件 API",
            link: "/docs/development/plugin_develop/api/event-api",
          },
          {
            text: "LLM API",
            link: "/docs/development/plugin_develop/api/llm-api",
          },
          {
            text: "日志 API",
            link: "/docs/development/plugin_develop/api/log-api",
          },
          {
            text: "Media API",
            link: "/docs/development/plugin_develop/api/media-api",
          },
          {
            text: "消息查询 API",
            link: "/docs/development/plugin_develop/api/message-api",
          },
          {
            text: "Permission API",
            link: "/docs/development/plugin_develop/api/permission-api",
          },
          {
            text: "Plugin API",
            link: "/docs/development/plugin_develop/api/plugin-api",
          },
          {
            text: "Prompt API",
            link: "/docs/development/plugin_develop/api/prompt-api",
          },
          {
            text: "Router API",
            link: "/docs/development/plugin_develop/api/router-api",
          },
          {
            text: "消息发送 API",
            link: "/docs/development/plugin_develop/api/send-api",
          },
          {
            text: "Service API",
            link: "/docs/development/plugin_develop/api/service-api",
          },
          {
            text: "Storage API",
            link: "/docs/development/plugin_develop/api/storage-api",
          },
          {
            text: "Stream API",
            link: "/docs/development/plugin_develop/api/stream-api",
          },
        ],
      },
    ],
  },
];
// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    // ── 构建结束后自动生成 catalog.json ──────────────────────────
    async buildEnd(siteConfig) {
      const sidebar = siteConfig.site.themeConfig.sidebar || {};
      const catalog = extractLinksFromSidebar(sidebar);

      const outDir = siteConfig.outDir;
      const catalogPath = resolve(outDir, "catalog.json");

      mkdirSync(outDir, { recursive: true });
      writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf-8");

      console.log(
        `✅ catalog.json generated with ${catalog.length} pages → ${catalogPath}`,
      );
    },
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            return tag.startsWith("iconify-icon");
          },
        },
      },
    },
    markdown: {
      config(md) {
        // other markdown-it configurations...
        md.use(InlineLinkPreviewElementTransform);
        md.use(taskLists, { enabled: false });
      },
    },
    vite: {
      plugins: [
        GitChangelog({
          // Fill in your repository URL here
          repoURL: () => "https://github.com/MoFox-Studio/MoFox-Bot-Docs",
        }),
        GitChangelogMarkdownSection(),
      ],
      optimizeDeps: {
        exclude: [
          "@nolebase/vitepress-plugin-inline-link-preview/client",
          "@nolebase/vitepress-plugin-enhanced-readabilities/client",
          "vitepress",
          "@nolebase/ui",
        ],
      },
      ssr: {
        noExternal: [
          // If there are other packages that need to be processed by Vite, you can add them here.
          "@nolebase/vitepress-plugin-inline-link-preview",
          "@nolebase/vitepress-plugin-enhanced-readabilities",
          "@nolebase/ui",
        ],
      },
    },
    locales: {
      root: {
        label: "Chinese",
        lang: "zh-CN",
      },
    },
    ignoreDeadLinks: true,
    title: "Neo-MoFox",
    description:
      "现代化多平台 AI 聊天机器人框架，支持插件化、适配器、Agent 编排等功能。",
    head: [["link", { rel: "icon", href: "/logos/logo-3.png" }]],
    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "主页", link: "/" },
        { text: "指南", link: "/docs/guides/" },
        { text: "开发", link: "/docs/development/" },
        {
          text: "相关链接",
          items: [
            { text: "MoFox-Studio", link: "https://github.com/MoFox-Studio" },
            {
              text: "Neo-MoFox",
              link: "https://github.com/MoFox-Studio/Neo-MoFox",
            },
            {
              text: "Neo-MoFox Docs",
              link: "https://github.com/MoFox-Studio/MoFox-Bot-Docs",
            },
            {
              text: "Neo-MoFox-Bot-QQ群",
              link: "https://qm.qq.com/q/jfeu7Dq7VS",
            },
          ],
        },
      ],

      sidebar: {
        "/docs/guides/": [
          {
            text: "开始",
            items: [{ text: "指南主页", link: "/docs/guides/" }],
          },
          {
            text: "部署指南",
            collapsed: false,
            items: [
              {
                text: "Launcher 部署指南",
                link: "/docs/guides/launcher_deployment_guide",
              },
              {
                text: "Windows部署指南",
                link: "/docs/guides/deployment_guide",
              },
              { text: "Linux部署指南", link: "/docs/guides/mmc_deploy_linux" },
              {
                text: "Docker部署指南",
                link: "/docs/guides/mmc_deploy_docker",
              },
              {
                text: "Android部署指南",
                link: "/docs/guides/mmc_deploy_android",
              },
              {
                text: "社区安装方式",
                collapsed: true,
                items: [
                  {
                    text: "社区部署方式介绍",
                    link: "/docs/guides/community_way/",
                  },
                  {
                    text: "MoFox-Community 安装器",
                    link: "/docs/guides/community_way/mofox-community-installer",
                  },
                ],
              },
            ],
          },
          {
            text: "配置指南",
            collapsed: false,
            items: [
              {
                text: "模型配置快速上手",
                link: "/docs/guides/quick_start_model_config",
              },
              {
                text: "Bot配置文件指南",
                link: "/docs/guides/bot_config_guide",
              },
              {
                text: "模型配置指南(进阶)",
                link: "/docs/guides/model_configuration_guide",
              },
            ],
          },
          {
            text: "常见问题与帮助",
            collapsed: false,
            items: [
              { text: "模型配置FAQ", link: "/docs/guides/model_config_faq" },
              { text: "如何更换端口", link: "/docs/guides/how_to_change_port" },
              { text: "维护指南", link: "/docs/guides/maintenance_guide" },
            ],
          },
          {
            text: "功能使用",
            collapsed: false,
            items: [
              {
                text: "插件安装指南",
                link: "/docs/guides/plugin-installation-guide",
              },
              {
                text: "内置插件使用指南",
                link: "/docs/guides/built_in_plugins_guide",
              },
              { text: "指令权限系统", link: "/docs/guides/permission_usage" },
              { text: "WebUI 使用指南", link: "/docs/guides/webui_guide" },
              {
                text: "记忆系统介绍",
                link: "/docs/guides/memory_system_guide",
              },
            ],
          },
          {
            text: "适配器",
            collapsed: false,
            items: [
              { text: "适配器介绍", link: "/docs/guides/adapter_list" },
              {
                text: "OneBot/Napcat 适配器(内置版)",
                link: "/docs/guides/adapter_list/onebot_v11_config",
              },
              {
                text: "OneBot/Napcat 适配器(独立版)",
                link: "/docs/guides/adapter_list/napcat_adapter",
              },
            ],
          },
          {
            text: "其他",
            collapsed: false,
            items: [
              { text: "最终用户许可协议", link: "/docs/guides/eula" },
              {
                text: "如何高效提问",
                link: "/docs/guides/how-to-ask-questions-efficiently",
              },
              {
                text: "提问的智慧(精简版)",
                link: "/docs/guides/how-to-ask-questions-the-smart-way",
              },
            ],
          },
        ],
        "/docs/development/": devSidebar,
      },

      editLink: {
        pattern:
          "https://github.com/MoFox-Studio/MoFox-Bot-Docs/edit/master/:path",
        text: "在 GitHub 上编辑此页",
      },

      socialLinks: [
        { icon: "github", link: "https://github.com/MoFox-Studio/Neo-MoFox" },
      ],

      lastUpdated: true,

      search: {
        provider: "local",
      },
      footer: {
        message: "Released under the GPL-3.0 License.",
        copyright: "Copyright © 2025 MoFox Studio",
      },
      docFooter: {
        prev: "← 上一页",
        next: "下一页 →",
      },
      backToTop: true,
    },
  }),
);
