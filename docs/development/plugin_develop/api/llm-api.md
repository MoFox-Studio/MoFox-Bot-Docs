# LLM API

`src.app.plugin_system.api.llm_api` 提供 LLM 请求创建、模型集获取与工具注册表管理。

## 导入

```python
from src.app.plugin_system.api.llm_api import (
    create_llm_request,
    create_embedding_request,
    create_rerank_request,
    get_model_set_by_task,
    get_model_set_by_name,
    create_tool_registry,
)
```

## 函数

### `create_llm_request(model_set: ModelSet, request_name: str, context_manager: LLMContextManager | None = None, with_reminder: str | SystemReminderBucket | None = None) -> LLMRequest`

创建 LLM 请求实例。这是发起 LLM 调用的核心入口。

- `model_set`: 模型集，可通过 `get_model_set_by_task` 或 `get_model_set_by_name` 获取
- `request_name`: 请求名称，用于统计和日志
- `context_manager`: 可选的上下文管理器
- `with_reminder`: 注入系统提醒

```python
model_set = get_model_set_by_task("actor")
request = create_llm_request(model_set, "chat_reply")
response = await request.send(messages=[...])
```

### `create_embedding_request(model_set: ModelSet, request_name: str, inputs: list[str] | None = None) -> EmbeddingRequest`

创建嵌入向量请求。

### `create_rerank_request(model_set: ModelSet, request_name: str, query: str, documents: list[Any] | None = None, top_n: int | None = None) -> RerankRequest`

创建文档重排序请求。

### `get_model_set_by_task(name: str) -> ModelSet`

根据任务名称（如 `"actor"`、`"utils_small"`）获取对应模型集。

### `get_model_set_by_name(model_name: str) -> ModelSet`

根据模型名称获取模型集。

### `create_tool_registry(tools: list[type[LLMUsable]] | None = None) -> ToolRegistry`

创建工具注册表实例，用于将 Action/Tool/Agent 注册为 LLM 可调用的工具。

```python
registry = create_tool_registry(tools=action_instances)
```

## 相关文档

- [模型配置指南](../../../guides/model_configuration_guide.md)
- [Action API](./action-api.md)
- [Agent API](./agent-api.md)
