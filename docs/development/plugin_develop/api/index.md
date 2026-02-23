# API 文档

Neo-MoFox 为插件开发者提供了一套完整的 API 接口，涵盖消息收发、LLM 调用、数据库操作、事件系统、日志记录等核心功能。

::: info 设计理念
所有 API 都采用**扁平化设计**，函数命名清晰直观，支持**关键字参数**调用，提供开箱即用的类型提示。
:::

## API 模块总览

| 模块 | 说明 | 主要功能 |
| --- | --- | --- |
| [消息发送 API](./send-api) | 主动向会话发送各类消息 | 文本、图片、语音、视频、文件、批量发送 |
| [消息查询 API](./message-api) | 历史消息检索与统计 | 时间范围查询、用户过滤、可读格式化 |
| [LLM API](./llm-api) | LLM 请求构建与调用 | 模型选择、请求创建、Embedding、Rerank |
| [数据库 API](./database-api) | 数据持久化操作 | CRUD、查询构建、聚合统计、分页迭代 |
| [事件 API](./event-api) | 事件发布与订阅 | 发布事件、注册处理器、订阅管理 |
| [日志 API](./log-api) | 结构化日志记录 | Logger 获取、颜色配置、事件广播 |

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

- **[消息发送 API](./send-api)** — 向会话发送文本、图片、语音、视频等消息
- **[消息查询 API](./message-api)** — 检索历史消息、统计消息数量、格式化展示
- **[LLM API](./llm-api)** — 创建 LLM 请求、配置模型、调用 AI 能力
- **[数据库 API](./database-api)** — 数据持久化、查询构建、聚合操作
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
