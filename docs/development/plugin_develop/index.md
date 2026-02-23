# 插件开发概览

Neo-MoFox 插件系统为开发者提供了一套灵活、类型安全的组件模型，支持从目录、ZIP 压缩包或 `.mfp` 格式加载插件。

::: info 源码对齐说明
本章 API 与行为说明按当前 Neo-MoFox 实现对齐（`CORE_VERSION = 1.0.0`）。
:::

::: tip 前置知识
如果你还不了解 Neo-MoFox 插件系统的工作原理，建议先阅读 [插件机制原理](./guide/mechanism.md)。
:::

## 开发前准备

### 环境依赖

```bash
# 安装项目依赖
uv sync

# 运行测试确认环境正常
pytest

# 运行代码检查
ruff check src/
```

### 插件放置位置

插件应放置在项目根目录的 `plugins/` 文件夹中：

```
Neo-MoFox/
└── plugins/
    └── your_plugin/          # 目录形式
        ├── manifest.json
        └── plugin.py
```

框架也支持：
- **ZIP 压缩包**：`plugins/your_plugin.zip`
- **MFP 包**：`plugins/your_plugin.mfp`（本质上是特殊后缀的 ZIP）

## 开始开发

<script setup>
const pluginGuides = [
  {
    avatar: '<iconify-icon icon="material-symbols:folder-open"></iconify-icon>',
    name: '插件结构',
    title: '了解规范的插件目录组织。',
    link: './structure'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:description"></iconify-icon>',
    name: 'manifest.json 格式',
    title: '声明插件元数据与依赖。',
    link: './manifest'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:extension"></iconify-icon>',
    name: '组件总览',
    title: '了解所有组件类型的作用与选择。',
    link: './components/index.md'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:menu-book"></iconify-icon>',
    name: '组件 API',
    title: '各组件的基类方法与属性详解。',
    link: './api/index.md'
  },
  {
    avatar: '<iconify-icon icon="material-symbols:rocket-launch"></iconify-icon>',
    name: '进阶开发',
    title: '跨插件通信、热重载、LLM 高级用法。',
    link: './advanced'
  }
]
</script>

<GuideCards :guides="pluginGuides" />
