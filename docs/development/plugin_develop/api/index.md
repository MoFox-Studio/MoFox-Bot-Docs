# API 文档

Neo-MoFox 为插件开发者提供了一套完整的 API 接口，涵盖消息收发、LLM 调用、数据库操作、事件系统、日志记录等核心功能。

::: info 设计理念
所有 API 都采用**扁平化设计**，函数命名清晰直观，支持**关键字参数**调用，提供开箱即用的类型提示。
:::

## API 模块总览

| 模块 | 说明 | 主要功能 |
| --- | --- | --- |
| [Action API](./action-api) | Action 组件查询与使用 | 获取 Action、过滤、注册为 LLM 工具 |
| [Adapter API](./adapter-api) | 适配器管理 | 启动/停止适配器、调用适配器命令 |
| [Chat API](./chat-api) | Chatter 组件查询与管理 | 获取 Chatter、创建聊天实例 |
| [Command API](./command-api) | 命令查询与执行 | 命令匹配、权限检查、执行命令 |
| [Config API](./config-api) | 配置加载与管理 | 加载配置、重载配置、查询配置 |
| [消息发送 API](./send-api) | 主动向会话发送各类消息 | 文本、图片、语音、视频、文件、批量发送 |
| [消息查询 API](./message-api) | 历史消息检索与统计 | 时间范围查询、用户过滤、可读格式化 |
| [LLM API](./llm-api) | LLM 请求构建与调用 | 模型选择、请求创建、Embedding、Rerank |
| [数据库 API](./database-api) | 数据持久化操作 | CRUD、查询构建、聚合统计、分页迭代 |
| [事件 API](./event-api) | 事件发布与订阅 | 发布事件、注册处理器、订阅管理 |
| [日志 API](./log-api) | 结构化日志记录 | Logger 获取、颜色配置、事件广播 |
| [Media API](./media-api) | 媒体识别与管理 | 图片识别、表情识别、批量识别 |
| [Permission API](./permission-api) | 权限管理 | 用户权限、命令权限、封禁管理 |
| [Plugin API](./plugin-api) | 插件加载与管理 | 加载/卸载插件、查询插件状态 |
| [Prompt API](./prompt-api) | Prompt 模板管理 | 注册模板、渲染模板、System Reminder |
| [Router API](./router-api) | 路由管理 | 挂载路由、查询路由、FastAPI 集成 |
| [Service API](./service-api) | Service 组件查询 | 获取 Service 实例、跨插件调用 |
| [Storage API](./storage-api) | 数据存储 | JSON 存储、插件数据库、持久化 |
| [Stream API](./stream-api) | 聊天流管理 | 创建流、查询流、消息历史管理 |

## 通用约定

### 参数传递风格

推荐使用**关键字参数**方式调用所有 API 函数，以提高代码可读性和可维护性：

```python
# ✅ 推荐
await send_text(
    stream_id=self.stream_id,
    platform=self.platform,
    content="Hello"
)

# ❌ 不推荐（虽然支持）
await send_text(self.stream_id, self.platform, "Hello")
```
### 异步调用

所有涉及 I/O 操作的 API 都是**异步函数**，必须使用 `await` 调用：

```python
# ✅ 正确
messages = await get_recent_messages(stream_id=self.stream_id, hours=1.0)

# ❌ 错误
messages = get_recent_messages(stream_id=self.stream_id, hours=1.0)  # 返回的是 coroutine 对象
```

### 类型提示

所有 API 函数都提供完整的类型注解，建议在开发时启用类型检查工具（如 Pylance、mypy）以获得更好的开发体验。

## 详细文档

点击下方链接查看各模块的详细 API 文档：

### 组件管理 API
- **[Action API](./action-api)** — Action 组件的查询、过滤与 LLM 工具注册
- **[Adapter API](./adapter-api)** — 适配器的启动、停止与命令调用
- **[Chat API](./chat-api)** — Chatter 组件的查询与聊天会话管理
- **[Command API](./command-api)** — 命令的匹配、权限检查与执行
- **[Plugin API](./plugin-api)** — 插件的加载、卸载与状态查询
- **[Router API](./router-api)** — FastAPI 路由的挂载与管理
- **[Service API](./service-api)** — Service 组件的获取与跨插件调用

### 配置与存储 API
- **[Config API](./config-api)** — 插件配置的加载、重载与查询
- **[Storage API](./storage-api)** — JSON 存储与插件数据库
- **[数据库 API](./database-api)** — 主数据库的 CRUD 与查询操作

### 消息与会话 API
- **[消息发送 API](./send-api)** — 向会话发送文本、图片、语音、视频等消息
- **[消息查询 API](./message-api)** — 检索历史消息、统计消息数量、格式化展示
- **[Stream API](./stream-api)** — 聊天流的创建、查询与消息历史管理
- **[Media API](./media-api)** — 图片与表情的识别、批量识别与缓存管理

### AI 与权限 API
- **[LLM API](./llm-api)** — 创建 LLM 请求、配置模型、调用 AI 能力
- **[Prompt API](./prompt-api)** — Prompt 模板的注册、渲染与 System Reminder
- **[Permission API](./permission-api)** — 用户权限管理、命令权限与封禁

### 系统与工具 API
- **[事件 API](./event-api)** — 发布事件、注册处理器、管理订阅
- **[日志 API](./log-api)** — 获取 Logger、配置颜色、广播日志事件

## 最佳实践

### 错误处理

在调用 API 时应当妥善处理可能的异常：

```python
try:
    await send_text(
        stream_id=self.stream_id,
        platform=self.platform,
        content="Hello"
    )
except Exception as e:
    logger.error(f"发送消息失败: {e}", exc_info=True)
```

### 资源管理

对于需要清理的资源（如数据库连接），建议使用上下文管理器：

```python
async with database_session() as session:
    # 执行数据库操作
    pass
```

## 相关章节

- [组件基类](../components/index.md) — 了解各组件基类的生命周期方法
- [进阶开发](../advanced) — 跨插件通信、热重载、高级 LLM 用法
- [插件结构](../structure) — 规范的插件目录组织
