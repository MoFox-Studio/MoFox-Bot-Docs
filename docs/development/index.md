# Neo-MoFox 开发指南

欢迎来到 Neo-MoFox 的开发文档。无论你是想贡献代码、开发插件，还是了解框架内部机制，这里都有你需要的资料。

## 快速导航

<script setup>
const devGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:build"></iconify-icon>',
    name: '环境搭建',
    title: '配置本地开发环境，让 Neo-MoFox 运行起来。',
    link: '../guides/index'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:handshake"></iconify-icon>',
    name: '贡献指南',
    title: '代码风格、行为准则以及 Pull Request 流程。',
    link: './guidelines/CONTRIBUTE'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:extension"></iconify-icon>',
    name: '插件开发',
    title: '从零开始，创造属于你自己的插件。',
    link: './plugin_develop'
  }
]
</script>

<GuideCards :guides="devGuides" />

## 加入社区

遇到问题可以在 QQ 群（169850076）或 GitHub Issues 中讨论。欢迎贡献代码、文档或插件。
