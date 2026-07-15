# API 文档

Neo-MoFox 为插件开发者提供了一套完整的 API 接口，涵盖消息收发、LLM 调用、数据库操作、事件系统、日志记录等核心功能。

::: info 设计理念
所有 API 都采用**扁平化设计**，函数命名清晰直观，支持**关键字参数**调用，提供开箱即用的类型提示。
:::

## API 模块总览

| 模块 | 说明 |
| --- | --- |
| [Action API](./action-api) | Action 组件查询、Schema 获取、执行与缓存管理 |
| [Adapter API](./adapter-api) | 适配器启动、停止、重启、查询与命令调用 |
| [Agent API](./agent-api) | Agent 组件查询、执行与可用工具管理 |
| [Chat API](./chat-api) | Chatter 组件查询、实例管理与流绑定 |
| [Command API](./command-api) | 命令匹配、注册、执行与帮助信息 |
| [Config API](./config-api) | 插件配置的加载与重载 |
| [Database API](./database-api) | CRUD、查询构建、聚合统计、分页、批量迭代 |
| [Event API](./event-api) | 事件发布、处理器注册与临时监听器 |
| [LLM API](./llm-api) | LLM 请求创建、模型集获取、工具注册与统计查询 |
| [Log API](./log-api) | 日志记录器创建 |
| [Media API](./media-api) | 图片/表情识别与信息管理 |
| [Message API](./message-api) | 消息查询、计数与可读格式化 |
| [Permission API](./permission-api) | 用户身份标识生成与权限管理 |
| [Plugin API](./plugin-api) | 插件加载、卸载、重载与查询 |
| [Prompt API](./prompt-api) | 提示词模板注册与系统提醒（含流隔离） |
| [Router API](./router-api) | HTTP Router 查询、挂载与卸载 |
| [Send API](./send-api) | 文本、图片、表情、语音、视频、文件发送与广播 |
| [Service API](./service-api) | Service 组件查询 |
| [Storage API](./storage-api) | JSON 存储与 PluginDatabase（SQLite） |
| [Stream API](./stream-api) | 聊天流创建、查询、消息管理与上下文操作 |

## 通用约定

### 异步调用

所有涉及 I/O 操作的 API 都是**异步函数**，必须使用 `await` 调用：

```python
# ✅ 正确
messages = await get_recent_messages(stream_id=stream_id)

# ❌ 错误：返回 coroutine 对象
messages = get_recent_messages(stream_id=stream_id)
```

### 类型提示

所有 API 函数都提供完整的类型注解，建议启用类型检查工具（Pylance、mypy）。

### 错误处理

```python
try:
    await send_text(stream_id=stream_id, platform=platform, content="Hello")
except Exception as e:
    logger.error(f"发送失败: {e}")
```

## 相关章节

- [组件基类](../components/index.md) — 了解各组件基类的生命周期方法
- [进阶开发](../advanced) — 跨插件通信、热重载、高级 LLM 用法
- [插件结构](../structure) — 规范的插件目录组织
