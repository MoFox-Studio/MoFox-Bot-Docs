# Agent API

`src.app.plugin_system.api.agent_api` 提供 Agent 组件的查询、Schema 获取与可用工具管理。

Agent 是一种特殊的 LLMUsable 组件，拥有自己私有的工具集（usables），可用于构建多步骤任务编排。

## 导入

```python
from src.app.plugin_system.api.agent_api import (
    get_all_agents,
    get_agents_for_plugin,
    get_agents_for_chat,
    get_agent_class,
    get_agent_schema,
    get_agent_schemas,
    get_agent_usables,
    get_agent_usable_schemas,
)
```

## 函数

### `get_all_agents() -> dict[str, type[BaseAgent]]`

获取所有已注册的 Agent 组件。

### `get_agents_for_plugin(plugin_name: str) -> dict[str, type[BaseAgent]]`

获取指定插件的所有 Agent。

### `get_agents_for_chat(chat_type: ChatType | str = ChatType.ALL, chatter_name: str = "", platform: str = "") -> list[type[LLMUsable]]`

获取适用于特定聊天上下文的 Agent 列表。

### `get_agent_class(signature: str) -> type[BaseAgent] | None`

通过签名获取 Agent 类。

### `get_agent_schema(signature: str) -> dict[str, Any] | None`

获取单个 Agent 的 Tool Schema。

### `get_agent_schemas(chat_type: ChatType | str = ChatType.ALL, chatter_name: str = "", platform: str = "") -> list[dict[str, Any]]`

批量获取适用场景下所有 Agent 的 Schema 列表。

### `get_agent_usables(signature: str) -> list[type[LLMUsable]]`

获取 Agent 的专属可用工具（usables）列表。这些工具仅供该 Agent 使用。

### `get_agent_usable_schemas(signature: str) -> list[dict[str, Any]]`

获取 Agent 专属工具的 Schema 列表。

## 相关文档

- [Agent 组件](../components/agent.md)
- [LLM API](./llm-api.md)
