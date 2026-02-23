---
layout: home

hero:
  name: Neo-MoFox
  text: 现代化多平台 AI 聊天机器人框架
  tagline: 严格三层架构 · 灵活插件系统 · LLM 原生支持
  image:
    src: /logos/logo.png
    alt: MoFox-Core Logo
    width: 700
    height: 700
  actions:
    - theme: brand
      text: 快速开始
      link: /docs/guides/
    - theme: alt
      text: 插件开发
      link: /docs/development/plugin_develop/
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/MoFox-Studio/MoFox-Core

features:
  - icon: 🧩
    title: 插件驱动
    details: 一切功能皆插件。通过声明式组件系统，按需组合 Action、Tool、Chatter、Adapter 等组件，无需修改核心代码。
  - icon: 🤖
    title: LLM 原生
    details: 内置多厂商 LLM 支持，Action 与 Tool 自动生成 Schema，Chatter 使用生成器模式实现流式对话，无缝接入 AI 能力。
  - icon: 🔌
    title: 多平台适配
    details: 基于 mofox-wire 标准通信协议，通过 Adapter 组件适配 QQ、Telegram、Discord 等任意平台，一套逻辑多端运行。
  - icon: 🏗️
    title: 严格三层架构
    details: kernel（技术基础）→ core（领域逻辑）→ app（装配运行），清晰的分层边界确保代码可维护性与可扩展性。
  - icon: ⚙️
    title: 类型安全配置
    details: 基于 Pydantic + TOML 的配置系统，自动验证、自动补全、自动生成默认配置文件，告别配置混乱。
  - icon: 🚀
    title: 异步并发
    details: 全面异步架构，TaskManager 统一管理并发任务，WatchDog 监控任务健康，稳定运行企业级工作负载。
---
