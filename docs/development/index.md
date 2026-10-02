# Neo-MoFox 开发指南

这里汇集插件开发、代码贡献与文档站维护的入口。先按要完成的工作选择一组资料，再进入具体教程。

<script setup>
const pluginGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:extension"></iconify-icon>',
    name: '插件开发概览',
    title: '了解开发准备、目录结构与插件加载方式。',
    link: './plugin_develop/'
  },
  {
    avatar: '<iconify-icon icon="mdi:book-open-page-variant"></iconify-icon>',
    name: '插件编写教程',
    title: '从第一个插件开始，逐步学习组件与常用 API。',
    link: './plugin_develop/guide/plugin-authoring/'
  },
  {
    avatar: '<iconify-icon icon="mdi:view-grid-outline"></iconify-icon>',
    name: '组件与 API',
    title: '按组件类型查找用途，再查对应 API 的用法。',
    link: './plugin_develop/components/'
  },
  {
    avatar: '<iconify-icon icon="mdi:console"></iconify-icon>',
    name: 'MPDT 插件开发工具',
    title: '使用命令行工具创建、检查、调试和打包插件。',
    link: './mpdt/'
  },
  {
    avatar: '<iconify-icon icon="mdi:store-outline"></iconify-icon>',
    name: '发布到插件市场',
    title: '准备插件信息与文件，并按发布流程提交。',
    link: './plugin_develop/contributing-to-market'
  }
]

const contributionGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:handshake"></iconify-icon>',
    name: '贡献指南',
    title: '了解代码贡献与 Pull Request 的提交流程。',
    link: './guidelines/CONTRIBUTE'
  },
  {
    avatar: '<iconify-icon icon="mdi:clipboard-check-outline"></iconify-icon>',
    name: '开发准则',
    title: '了解测试、代码审查、分支与模块组织约定。',
    link: './guidelines/development_guidelines'
  }
]

const siteGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:edit-document"></iconify-icon>',
    name: '文档编辑指南',
    title: '准备本地环境，编辑 Markdown，预览并配置导航。',
    link: './docs-editing/'
  },
  {
    avatar: '<iconify-icon icon="mdi:github"></iconify-icon>',
    name: 'GitHub 登录与反馈维护',
    title: '配置 OAuth App、Worker 与文档站，测试登录和 Issue 提交。',
    link: './github-feedback'
  },
  {
    avatar: '<iconify-icon icon="mdi:code-json"></iconify-icon>',
    name: '文档 JSON API',
    title: '获取文档索引与正文，用于检索或外部程序接入。',
    link: './docs-api'
  }
]
</script>

## 开发插件

第一次写插件，可以先把 [Neo-MoFox 运行起来](../guides/manual)，再从 [插件编写教程](./plugin_develop/guide/plugin-authoring/) 开始。需要查询具体接口时，查 [API 索引](./plugin_develop/api/)；需要理解加载与注册过程时，读 [插件机制原理](./plugin_develop/guide/mechanism)。

<GuideCards :guides="pluginGuides" />

## 参与代码贡献

动手之前，先查看目标仓库的贡献要求与分支约定。完成修改后，验证实际行为，再提交便于审查的 Pull Request。

<GuideCards :guides="contributionGuides" />

## 编辑与维护文档站

修正文案或补充操作截图，从文档编辑指南开始；维护站内 GitHub 反馈服务，查看 OAuth 与 Worker 配置文档。

<GuideCards :guides="siteGuides" />

## 加入社区

遇到问题可以在 QQ 群（169850076）或对应项目的 GitHub Issues 中讨论。反馈时附上使用版本、复现步骤与必要的报错信息；文档问题也可以通过页面右上角的反馈按钮提交。
