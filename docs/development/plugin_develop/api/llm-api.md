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

#### `exec_llm_usable(...) -> tuple[bool, Any]`

执行单个 [`LLMUsable`](../../components/llm-usable.md) 组件。此函数为**异步函数**。

#### `run_tool_call(...) -> list`

执行一次响应中的一批工具调用，并保持 `TOOL_RESULT` 写回顺序。此函数为**异步函数**。

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
