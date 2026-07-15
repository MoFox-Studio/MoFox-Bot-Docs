# 插件编写指南

这份指南是一份循序渐进的 Neo-MoFox 插件开发教程。它围绕同一个示例插件（`echo_demo`）从最小可运行版本逐步演化到包含多组件、能调用 LLM、能查发消息、能持久化存储的完整实现。

指南不假设你已经熟悉 Bot 框架、组件化设计或事件驱动系统——所有概念都会在第一次用到时引入。但你需要具备基础的 Python 能力（类、函数、异步、导入）。

::: tip 阅读方式
建议**顺序阅读**，因为后续章节会沿用前面章节的代码与概念。如果你想直接跳到某一章，请至少先读完 [第 1 章](./1-introduction) 和 [第 3 章](./3-first-plugin)，确保环境与最小插件结构已建立。
:::

## 指南地图

整份指南可以粗略压成六个阶段。每一步都建立在前一步的基础上：

```text
第一阶段  最小落地       让插件真的能跑起来
   │
第二阶段  配置与组件     给插件加上 Config / Command / Service / Tool
   │
第三阶段  LLM 调用链     把 prompt 组织好，真正调模型
   │
第四阶段  对话与编排     用 Chatter / Agent / Action / EventHandler 组织完整流程
   │
第五阶段  系统入口与消息 Router / Adapter / MessageEnvelope 接通外部
   │
第六阶段  公共入口层     plugin_system.api：适配器命令、存储、消息 API
```

下面按阶段列出全部章节。每章都附了一句话摘要，方便你按需回查。

---

## 第一阶段 · 最小落地

> 目标：理解插件是什么，写出一个能被系统识别和加载的最小插件。

| 章节 | 标题 | 摘要 |
|------|------|------|
| [1](./1-introduction) | 写在前面 | 这份指南为谁而写、需要什么基础、读完后能做什么 |
| [2](./2-minimal-concept) | 最小概念 | 一个 Neo-MoFox 插件最少需要哪些东西 |
| [3](./3-first-plugin) | 第一个插件 | 把 `echo_demo` 真正跑起来 |
| [4](./4-how-it-works) | 运行机制 | 系统是怎么发现、加载、注册插件的 |
| [5](./5-structure) | 插件结构 | 规范的目录组织与文件分工 |

## 第二阶段 · 配置与第一组组件

> 目标：给插件接上 Config / Command / Service / Tool，理解“组件边界”这件事。

| 章节 | 标题 | 摘要 |
|------|------|------|
| [6](./6-config) | 配置系统 | `BaseConfig` / `Field` / TOML 配置与热重载 |
| [7](./7-command-and-service) | Command 与 Service | 命令路由 + 跨组件复用的服务层 |
| [8](./8-first-tool) | 第一个 Tool | 让 LLM 能调用的查询工具 |

## 第三阶段 · LLM 调用链

> 目标：从“组织 prompt”到“真正调一次模型”，把请求链跑通。

| 章节 | 标题 | 摘要 |
|------|------|------|
| [9](./9-prompt-api) | Prompt API | `PromptTemplate` 注册、渲染、system reminder |
| [10](./10-llm-api) | LLM API | 模型集合、`LLMPayload`、请求对象、非流式调用 |
| [11](./11-tool-llm) | Tool 与 LLM | 让模型在对话中真正调用你的 Tool |

## 第四阶段 · 对话与编排

> 目标：理解完整对话是怎么被组织出来的，以及各类组件在这一流程里的分工。

| 章节 | 标题 | 摘要 |
|------|------|------|
| [12](./12-default-chatter-fsm) | Default Chatter 与 FSM | 内置 Chatter 的有限状态机模型 |
| [13](./13-agent-orchestration) | Agent 编排 | Agent 怎样用私有工具集做局部任务 |
| [14](./14-action) | Action 组件 | LLM 调用的“主动作”，负责执行有副作用的操作 |
| [15](./15-event-system) | 事件系统 | EventHandler 在系统时刻介入，拦截或扩展流程 |
| [15.5](./15.5-built-in-events) | 内置事件参考 | 所有系统事件的 `params` 字段与可回写字段速查 |
| [16](./16-chatter) | Chatter 组件 | 自己写一个完整对话器（生成器模式） |
| [16.5](./16.5-stream) | Stream（聊天流） | 聊天流是什么：`stream_id` / `ChatStream` / `StreamContext` 四层概念与可读字段 |

## 第五阶段 · 系统入口与消息链路

> 目标：把插件和外部世界接通——HTTP 入口、平台桥接、统一消息模型。

| 章节 | 标题 | 摘要 |
|------|------|------|
| [17](./17-router) | Router 组件 | 给插件开一个 FastAPI HTTP 子应用 |
| [18](./18-adapter) | Adapter 组件 | 平台与核心之间的双向翻译层 |
| [19](./19-message-model) | 消息模型 | `MessageEnvelope` / `message_info` / `message_segment` 三层 |

## 第六阶段 · 公共入口层

> 目标：从“认识组件”转向“插件作者真正日常使用的公共入口”——`plugin_system.api`。

| 章节 | 标题 | 摘要 |
|------|------|------|
| [20](./20-overview-and-next) | 总览与下一步 | 回溯前面走过的路，引出 `base / api / types` 公共入口 |
| [21](./21-adapter-commands) | 适配器命令 | `adapter_api`：生命周期管理 + `send_adapter_command` 请求/响应机制 |
| [22](./22-storage-framework) | 存储框架 | `storage_api`：JSON 存储 + `PluginDatabase`（独立 SQLite + CRUD/QueryBuilder） |
| [23](./23-message-api) | 消息 API | `message_api` 查历史消息 + `send_api` 发送新消息 |
| [24](./24-stream-api) | Stream API | `stream_api`：聊天流的创建、查询、上下文加载与清空 |

---

## 三层公共入口速览

第六阶段会反复用到下面三层入口。如果你只想快速记住“东西从哪里拿”，可以直接看这张表：

| 入口 | 路径 | 角色 |
|------|------|------|
| `plugin_system.base` | `src.app.plugin_system.base` | 组件骨架基类（`BasePlugin` / `BaseTool` / `BaseChatter` 等） |
| `plugin_system.api` | `src.app.plugin_system.api` | 运行时能力入口（`adapter_api` / `storage_api` / `message_api` / `send_api` / `prompt_api` / `llm_api` 等） |
| `plugin_system.types` | `src.app.plugin_system.types` | 常用公共类型（`Message` / `MessageType` / `PromptTemplate` / `LLMPayload` / `TaskType` 等） |

聚合入口：

```python
from src.app.plugin_system import api, base, types
```

## 一条贯穿全指南的学习线

如果你把整份指南压成一条主线，它大致是这样的：

1. **让插件能跑起来**（第 1–5 章）
2. **给插件加上组件**（第 6–8 章）
3. **接上模型**（第 9–11 章）
4. **组织完整对话**（第 12–16 章）
5. **接通外部**（第 17–19 章）
6. **回到日常入口**（第 20–24 章）

走到第 6 阶段，你已经能独立写出：查历史消息 → 组织上下文 → 调模型 → 把结果发回去 → 顺便调平台 API → 把状态存进自己的 SQLite → 按需清空聊天流上下文 的完整插件。

## 下一步去哪

读完本指南后，推荐继续看以下内容：

- **[组件总览](../components/)** —— 各组件的基类方法与属性详解，适合作为写代码时的查阅手册
- **[manifest.json 格式说明](../manifest)** —— 插件清单的完整字段参考
- **[插件机制原理](./mechanism)** —— 系统发现、加载、生命周期管理的底层机制
- **[插件结构与最佳实践](../structure)** —— 工程化、目录规范、多插件项目的组织建议
- **[进阶开发](../advanced/)** —— 跨插件通信、热重载、LLM 高级用法

如果在阅读过程中遇到问题，可以先回到对应阶段的总览表，确认自己处在学习路径的哪个位置，再决定是继续往下读还是回头补基础。
