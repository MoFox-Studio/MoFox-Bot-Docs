# 内置插件

Neo-MoFox 内置了一系列官方插件，提供核心功能和扩展能力。

## 可用插件

| 插件 | 说明 | 文档 |
|------|------|------|
| **Neo-MoFox-WebUI** (Plugin UI) | 插件自定义界面系统，允许任何插件在 WebUI 中注册管理页面 | [查看文档](./plugin-ui/) |
| **Booku 记忆** (booku_memory) | 长期记忆系统，提供语义检索与记忆沉淀能力 | [查看文档](./booku/) |
| **权限管理** (perm_plugin) | 聊天内 `/perm` 命令，查询和修改用户权限 | [查看文档](./perm/) |
| **OneBot 适配器** (onebot_adapter) | OneBot 11 协议适配器，接入 QQ 等平台 | [查看文档](./onebot/) |
| **Skill 管理器** (skill_manager) | 技能索引与按需加载，LLM 可调用外部程序 | [查看文档](./skill/) |
| **表情插件** (emoji_like / emoji_sender) | 智能贴表情回应与表情包收藏发送 | [查看文档](./emoji/) |
| **默认聊天器** (default_chatter / DFC) | 默认聊天执行核心，可复用的会话引擎 | [查看文档](./dfc/) |
| **实用命令** (utility_commands) | 常用运维命令集合，如 `/清空上下文` | [查看文档](./ut/) |


## 概述

内置插件随 Neo-MoFox 主程序一同分发，无需额外安装。它们通过 Neo-MoFox 的插件系统注册，享受与第三方插件相同的生命周期和 API 能力。

如果你正在开发自己的插件，可以参考内置插件的实现方式。详见 [插件开发](/docs/development/plugin_develop/)。
