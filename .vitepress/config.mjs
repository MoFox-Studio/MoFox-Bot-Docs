import { defineConfig } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";
import { 
  GitChangelog, 
  GitChangelogMarkdownSection, 
} from '@nolebase/vitepress-plugin-git-changelog/vite'
import { 
  InlineLinkPreviewElementTransform 
} from '@nolebase/vitepress-plugin-inline-link-preview/markdown-it'

const devSidebar = [
  {
    text: '开发',
    items: [
      { text: '开发主页', link: '/docs/development/' },
    ]
  },
  {
    text: '架构',
    items: [
      { text: '技术栈与聊天流分析', link: '/docs/development/architecture/tech_stack_and_chat_flow' }
    ]
  },
  {
    text: '贡献指南和开发帮助',
    items: [
      { text: '贡献指南', link: '/docs/development/CONTRIBUTE' },
      { text: '开发准则', link: '/docs/development/development_guidelines' },
      { text: '添加/使用新的向量数据库', link: '/docs/development/add_or_use_new_vector_db_guide' }
    ]
  },
  {
    text: '插件',
    items: [
      { text: '插件概述', link: '/docs/development/plugins/' },
      { text: '快速开始', link: '/docs/development/plugins/quick-start' },
      { text: '元数据指南', link: '/docs/development/plugins/metadata-guide' },
      { text: '依赖管理', link: '/docs/development/plugins/dependency-management' },
      { text: '配置指南', link: '/docs/development/plugins/configuration-guide' },
      { text: '权限系统', link: '/docs/development/plugins/PERMISSION_GUIDE' },
      { text: '可用范围控制', link: '/docs/development/plugins/command-scope' },
      { text: '插件可用组件',
        items: [
          { text: 'Chatter指南', link: '/docs/development/plugins/chatter-components' },
          { text: 'Action指南', link: '/docs/development/plugins/action-components' },
          { text: 'Prompt指南', link: '/docs/development/plugins/prompt-components' },
          { text: '工具指南', link: '/docs/development/plugins/tool_guide' },
          { text: '命令指南', link: '/docs/development/plugins/PLUS_COMMAND_GUIDE' },
          { text: '事件系统', link: '/docs/development/plugins/event-system-guide' },
        ]
      },
      {
        text: '插件 API',
        items: [
          { text: 'Adapter Command API', link: '/docs/development/plugins/api/adapter-command-api' },
          { text: 'Chat API', link: '/docs/development/plugins/api/chat-api' },
          { text: 'Component Manage API', link: '/docs/development/plugins/api/component-manage-api' },
          { text: 'Config API', link: '/docs/development/plugins/api/config-api' },
          { text: 'Database API', link: '/docs/development/plugins/api/database-api' },
          { text: 'Emoji API', link: '/docs/development/plugins/api/emoji-api' },
          { text: 'Generator API', link: '/docs/development/plugins/api/generator-api' },
          { text: 'LLM API', link: '/docs/development/plugins/api/llm-api' },
          { text: 'Logging API', link: '/docs/development/plugins/api/logging-api' },
          { text: 'Message API', link: '/docs/development/plugins/api/message-api' },
          { text: 'Person API', link: '/docs/development/plugins/api/person-api' },
          { text: 'Plugin Manage API', link: '/docs/development/plugins/api/plugin-manage-api' },
          { text: 'Send API', link: '/docs/development/plugins/api/send-api' },
          { text: 'Schedule API', link: '/docs/development/plugins/api/schedule-api' },
          { text: 'Storage API', link: '/docs/development/plugins/api/storage-api' },
          { text: 'Tool API', link: '/docs/development/plugins/api/tool-api' }
        ]
      }
    ]
  }
];

// https://vitepress.dev/reference/site-config
export default withMermaid(defineConfig({
  markdown: {
      config(md) {
        // other markdown-it configurations...
        md.use(InlineLinkPreviewElementTransform)
      }
    },
  vite: {
    plugins: [
      GitChangelog({
        // Fill in your repository URL here
        repoURL: () => 'https://github.com/MoFox-Studio/MoFox-Bot-Docs', 
      }), 
      GitChangelogMarkdownSection(), 
    ],
    optimizeDeps: {
      exclude: [
        '@nolebase/vitepress-plugin-inline-link-preview/client', 
        '@nolebase/vitepress-plugin-enhanced-readabilities/client',
        'vitepress',
        '@nolebase/ui',
      ],
    },
    ssr: {
      noExternal: [
        // If there are other packages that need to be processed by Vite, you can add them here.
        '@nolebase/vitepress-plugin-inline-link-preview',
        '@nolebase/vitepress-plugin-enhanced-readabilities',
        '@nolebase/ui',
      ],
    },
    }, 
  locales: {
    root: {
      label: 'Chinese',
      lang: 'zh-CN'
    },
  },
  ignoreDeadLinks: true,
  title: "MoFox_Bot",
  description: "🚀 基于 MaiCore 的增强版智能体，提供更完善的功能和更好的使用体验",
  head: [
    ['link', { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦊</text></svg>' }]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '指南', link: '/docs/guides/' },
      { text: '开发', link: '/docs/development/' },
      {
        text: '相关链接',
        items: [
          { text: 'MoFox-Studio', link: 'https://github.com/MoFox-Studio' },
          { text: 'MoFox_Bot', link: 'https://github.com/MoFox-Studio/MoFox_Bot' },
          { text: 'MoFox_Docs', link: 'https://github.com/MoFox-Studio/MoFox-Bot-Docs' },
          { text: 'MoFox-Bot-QQ群', link: 'https://qm.qq.com/q/jfeu7Dq7VS'},
        ]
      }
    ],

    sidebar: {
      '/docs/guides/': [
        {
          text: '指南',
          items: [
            { text: '部署相关',
              items:[
                { text: '部署指南主页', link: '/docs/guides/' },
                { text: 'Windows部署指南', link: '/docs/guides/deployment_guide' },
                { text: 'Linux部署指南', link: '/docs/guides/mmc_deploy_linux' },
                { text: 'android部署指南', link: '/docs/guides/mmc_deploy_android' },
                { text: 'docker部署指南', link: '/docs/guides/mmc_deploy_docker' },
              ]
             },
             { text: '最终用户许可协议', link: '/docs/guides/eula' },
            { text: "适配器列表", 
              items: [
                { text: '适配器介绍/列表总览', link: '/docs/guides/adapter_list' },
                { text: 'OneBot/Napcat 适配器(内置版)', link: '/docs/guides/adapter_list/onebot_v11_config' },
                { text: 'OneBot/Napcat 适配器(独立版)', link: '/docs/guides/adapter_list/napcat_adapter' },
              ]
            },
            {
              text: '配置文件教程',
              items: [
                { text: '模型配置快速上手', link: '/docs/guides/quick_start_model_config' },
                { text: 'Bot配置文件指南', link: '/docs/guides/bot_config_guide' },
                { text: '模型配置指南(进-阶)', link: '/docs/guides/model_configuration_guide' },
              ]
            },
            {
              text: '功能使用',
              items: [
                { text: '指令权限系统使用教程', link: '/docs/guides/permission_usage' },
                { text: '视频识别功能', link: '/docs/guides/video_recognition' },
                { text: '计划系统介绍', link: '/docs/guides/schedule_and_planning_guide' },
                { text: '主动思考器介绍', link: '/docs/guides/proactive_thinker_guide' },
                { text: '记忆系统介绍', link: '/docs/guides/memory_system_guide' },
                { text: 'LPMM 知识库指南', link: '/docs/guides/lpmm_guide' },
              ]
            },
            {
              text: '常见问题',
              items: [
                { text: '提问的智慧(精简版)', link: '/docs/guides/how-to-ask-questions-the-smart-way' },
                { text: '如何高效提问', link: '/docs/guides/how-to-ask-questions-efficiently' },
                { text: '模型配置FAQ', link: '/docs/guides/model_config_faq' },
                { text: '如何更换端口', link: '/docs/guides/how_to_change_port' },
                { text: '维护指南', link: '/docs/guides/maintenance_guide' },
              ]
            }
          ]
        }
      ],
      '/docs/development/': devSidebar,
    },

    editLink: {
      pattern: 'https://github.com/MoFox-Studio/MoFox-Bot-Docs/edit/master/:path',
      text: '在 GitHub 上编辑此页'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/MoFox-Studio/MoFox_Bot' },
    ],

    lastUpdated: true,

    search: {
      provider: 'local'
    },
    footer: {
      message: 'Released under the GPL-3.0 License.',
      copyright: 'Copyright © 2025 MoFox Studio'
    },
    docFooter: {
      prev: '← 上一页',
      next: '下一页 →'
    },
    backToTop: true
  },
}));
