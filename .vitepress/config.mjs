import { defineConfig } from 'vitepress'

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
      { text: '权限系统', link: '/docs/development/architecture/PERMISSION_SYSTEM' },
      { text: '技术栈与聊天流分析', link: '/docs/development/architecture/tech_stack_and_chat_flow' }
    ]
  },
  {
    text: '贡献指南和开发帮助',
    items: [
      { text: '贡献指南', link: '/docs/development/CONTRIBUTE' },
      { text: '开发准则', link: '/docs/development/development_guidelines' },
      { text: '向量数据库使用指南', link: '/docs/development/vector_db_usage_guide' },
      { text: '添加新的向量数据库', link: '/docs/development/add_new_vector_db_guide' }
    ]
  },
  {
    text: '插件',
    items: [
      { text: '插件概述', link: '/docs/development/plugins/' },
      { text: '快速开始', link: '/docs/development/plugins/quick-start' },
      { text: '插件清单指南', link: '/docs/development/plugins/manifest-guide' },
      { text: '依赖管理', link: '/docs/development/plugins/dependency-management' },
      { text: '事件系统', link: '/docs/development/plugins/event-system-guide' },
      { text: '配置指南', link: '/docs/development/plugins/configuration-guide' },
      { text: '工具指南', link: '/docs/development/plugins/tool_guide' },
      { text: '命令指南', link: '/docs/development/plugins/PLUS_COMMAND_GUIDE' },
      { text: '可用范围控制', link: '/docs/development/plugins/command-scope' },
      { text: 'Action Components', link: '/docs/development/plugins/action-components' },
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
          { text: 'Tool API', link: '/docs/development/plugins/api/tool-api' }
        ]
      }
    ]
  }
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/MoFox-Bot-Docs/",
  ignoreDeadLinks: true,
  title: "MoFox_Bot",
  description: "🚀 基于 MaiCore 的增强版智能体，提供更完善的功能和更好的使用体验",
  head: [
    ['link', { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌟</text></svg>' }]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '指南', link: '/docs/guides/deployment_guide' },
      { text: '开发', link: '/docs/development/' },
      {
        text: '相关链接',
        items: [
          { text: 'MoFox-Studio', link: 'https://github.com/MoFox-Studio' },
          { text: 'MoFox_Bot', link: 'https://github.com/MoFox-Studio/MoFox_Bot' },
          { text: 'MoFox_Docs', link: 'https://github.com/MoFox-Studio/MoFox-Bot-Docs' }
        ]
      }
    ],

    sidebar: {
      '/docs/guides/': [
        {
          text: '指南',
          items: [
            { text: 'Windows部署指南', link: '/docs/guides/deployment_guide' },
            { text: '模型配置快速上手', link: '/docs/guides/quick_start_model_config' },
            { text: 'Bot配置文件指南', link: '/docs/guides/bot_config_guide' },
            { text: '模型配置指南(进阶)', link: '/docs/guides/model_configuration_guide' },
            {
              text: '常见问题',
              items: [
                { text: '提问的智慧(精简版)', link: '/docs/guides/how-to-ask-questions-the-smart-way' },
                { text: '如何高效提问', link: '/docs/guides/how-to-ask-questions-efficiently' }
              ]
            }
          ]
        }
      ],
      '/docs/development/': devSidebar,
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/MoFox-Studio/MoFox_Bot' }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Released under the GPL-3.0 License.',
      copyright: 'Copyright © 2025 MoFox Studio'
    }
  }
})
