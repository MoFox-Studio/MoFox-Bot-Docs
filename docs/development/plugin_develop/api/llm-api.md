# LLM API

`src.app.plugin_system.api.llm_api` 提供 LLM 请求创建、模型集获取、工具注册表管理、工具调用执行与 LLM 统计查询。

## 导入

```python
from src.app.plugin_system.api.llm_api import (
    create_llm_request,
    create_embedding_request,
    create_rerank_request,
    get_model_set_by_task,
    get_model_set_by_name,
    create_tool_registry,
    get_llm_stats_summary,
    get_llm_stats_by_model,
    get_llm_stats_by_request_name,
    get_llm_stats_by_stream,
    get_llm_cache_hit_rate,
    get_recent_llm_requests,
    exec_llm_usable,
    run_tool_call,
)
```

## 函数

### 请求创建

#### `create_llm_request(model_set: ModelSet, request_name: str = "", context_manager: LLMContextManager | None = None, with_reminder: str | SystemReminderBucket | None = None) -> LLMRequest`

创建 LLM 请求实例。这是发起 LLM 调用的核心入口。

- `model_set`: 模型集，可通过 [`get_model_set_by_task`](#get_model_set_by_taskname-str---modelset) 或 [`get_model_set_by_name`](#get_model_set_by_namemodel_name-str---temperature-float--none--max_tokens-int--none---modelset) 获取
- `request_name`: 请求名称，用于统计和日志
- `context_manager`: 可选的上下文管理器
- `with_reminder`: 注入系统提醒，不能与自定义 `context_manager` 同时使用

::: warning with_reminder 约束
`with_reminder` 不能与自定义 `context_manager` 同时使用。如需自定义 `context_manager`，请在构造时直接配置 `ReminderSourceSpec`。
:::

```python
model_set = get_model_set_by_task("actor")
request = create_llm_request(model_set, "chat_reply")
response = await request.send(messages=[...])
```

#### `create_embedding_request(model_set: ModelSet, request_name: str = "", inputs: list[str] | None = None) -> EmbeddingRequest`

创建嵌入向量请求。

#### `create_rerank_request(model_set: ModelSet, request_name: str = "", query: str = "", documents: list[Any] | None = None, top_n: int | None = None) -> RerankRequest`

创建文档重排序请求。

### 模型集获取

#### `get_model_set_by_task(name: str) -> ModelSet`

根据任务名称（如 `"actor"`、`"utils_small"`）获取对应模型集。

#### `get_model_set_by_name(model_name: str, *, temperature: float | None = None, max_tokens: int | None = None) -> ModelSet`

通过模型内部标识符直接获取可用于 LLMRequest 的 ModelSet，无需预先配置任务。

- `model_name`: 模型名称（`config/model.toml` 中 `models` 列表里的 `name`）
- `temperature`: 温度参数，`None` 时使用默认值 `0.7`
- `max_tokens`: 最大输出 token 数，`None` 时使用默认值 `800`

```python
from src.app.plugin_system.api import llm_api

model_set = llm_api.get_model_set_by_name("gpt-4", temperature=0.5)
request = llm_api.create_llm_request(model_set, request_name="chat")
```

### 工具注册与执行

#### `create_tool_registry(tools: list[type[LLMUsable]] | None = None) -> ToolRegistry`

创建工具注册表实例，用于将 Action/Tool/Agent 注册为 LLM 可调用的工具。

```python
registry = create_tool_registry(tools=action_instances)
```

#### `exec_llm_usable(usable_cls: type[LLMUsable], *, plugin: BasePlugin, stream_id: str | None = None, message: Message | None = None, kwargs: dict[str, Any] | None = None, task_observer: Callable[[asyncio.Task[None]], None] | None = None) -> tuple[bool, object]`

执行单个 [`LLMUsable`](../../components/llm-usable.md) 组件并规范化返回结果。此函数为**异步函数**。

- `usable_cls`: 要执行的 Tool、Action 或 Agent 类
- `plugin`: 组件所属插件实例
- `stream_id`: 当前对话流 ID（可选）
- `message`: 触发本次调用的消息（可选）
- `kwargs`: 传给 `execute` 的参数字典（可选）
- `task_observer`: 任务观察回调（可选）
- 返回: `(是否执行成功, 结果内容)`

```python
from src.app.plugin_system.api.llm_api import exec_llm_usable

success, result = await exec_llm_usable(
    MyAction,
    plugin=my_plugin,
    stream_id=stream_id,
    message=msg,
    kwargs={"content": "Hello"},
)
```

#### `run_tool_call(*, calls: Sequence[ToolCall], response: ToolResultReceiver, usable_map: ToolRegistry, trigger_msg: Message | None, plugin: BasePlugin, stream_id: str | None = None, resolve_component_plugin: Callable[[str | None], BasePlugin] | None = None, logger_name: str = "chatter", display_name: str = "", task_observer: Callable[[asyncio.Task[None]], None] | None = None) -> list[tuple[bool, bool]]`

执行一次 LLM 响应中的全部普通 tool calls，结果按原始 `calls` 顺序写回 `response` 的 `TOOL_RESULT` payload，避免上下文顺序漂移。此函数为**异步函数**。

- `calls`: 本次 LLM 响应返回的 tool call 列表
- `response`: 当前响应对象；会被追加 `TOOL_RESULT` payload
- `usable_map`: 可调用组件注册表，用 call name 查找组件类
- `trigger_msg`: 触发本轮对话的消息；为 `None` 时会跳过实际执行
- `plugin`: 默认插件实例；无法解析组件归属插件时使用
- `stream_id`: 当前对话流 ID（可选）
- `resolve_component_plugin`: 根据组件签名解析其所属插件的回调（可选）
- `logger_name`: 写日志时使用的 logger 名称，默认 `"chatter"`
- `display_name`: 日志前缀中显示的 chatter 名称，默认 `""`
- `task_observer`: 任务观察回调（可选）
- 返回: 与 `calls` 顺序一致的结果列表，每项为 `(是否已写回 TOOL_RESULT, execute 是否成功)`

### LLM 统计查询

以下统计函数均为**异步函数**：

| 函数 | 说明 |
|------|------|
| `get_llm_stats_summary() -> dict[str, Any]` | 获取 LLM 统计摘要 |
| `get_llm_stats_by_model() -> list[dict[str, Any]]` | 获取按模型分组的 LLM 统计 |
| `get_llm_stats_by_request_name() -> list[dict[str, Any]]` | 获取按 `request_name` 分组的 LLM 统计 |
| `get_llm_stats_by_stream() -> list[dict[str, Any]]` | 获取按聊天流分组的 LLM 统计 |
| `get_llm_cache_hit_rate(stream_id: str | None = None) -> dict[str, Any]` | 获取全局或指定聊天流的缓存命中率 |
| `get_recent_llm_requests(limit: int = 100, offset: int = 0) -> list[dict[str, Any]]` | 获取近期 LLM 请求统计明细 |

## 相关文档

- [模型配置指南](../../../guides/model_configuration_guide.md)
- [Action API](./action-api.md)
- [Agent API](./agent-api.md)
