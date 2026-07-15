# Agent API

`src.app.plugin_system.api.agent_api` 提供 Agent 组件的查询、Schema 获取、执行与可用工具管理。

Agent 是一种特殊的 [`LLMUsable`](../../components/llm-usable.md) 组件，拥有自己私有的工具集（usables），可用于构建多步骤任务编排。Agent 的 `usables` 不进入全局注册表，只对该 Agent 可见。

## 导入

```python
from src.app.plugin_system.api.agent_api import (
    get_all_agents,
    get_agents_for_plugin,
    get_agents_for_chat,
    get_agent_class,
    get_agent_schema,
    get_agent_schemas,
    execute_agent,
    get_agent_usables,
    get_agent_usable_schemas,
    execute_agent_usable,
)
```

## 函数

### 查询

#### `get_all_agents() -> dict[str, type[BaseAgent]]`

获取所有已注册的 Agent 组件，返回签名到类的映射。

#### `get_agents_for_plugin(plugin_name: str) -> dict[str, type[BaseAgent]]`

获取指定插件的所有 Agent。

#### `get_agents_for_chat(chat_type: ChatType | str = ChatType.ALL, chatter_name: str = "", platform: str = "") -> list[type[LLMUsable]]`

获取适用于特定聊天上下文的 Agent 列表。可按聊天类型、Chatter 名称和平台过滤。

#### `get_agent_class(signature: str) -> type[BaseAgent] | None`

通过签名获取 Agent 类。未找到返回 `None`。

### Schema 获取

#### `get_agent_schema(signature: str) -> dict[str, Any] | None`

获取单个 Agent 的 Tool Schema。

#### `get_agent_schemas(chat_type: ChatType | str = ChatType.ALL, chatter_name: str = "", platform: str = "") -> list[dict[str, Any]]`

批量获取适用场景下所有 Agent 的 Schema 列表。

### 执行

#### `execute_agent(signature: str, plugin: BasePlugin, stream_id: str, **kwargs: Any) -> tuple[bool, str | dict]`

执行 Agent。创建 Agent 实例并调用其 `execute` 方法。此函数为**异步函数**。

- `signature`: Agent 组件签名
- `plugin`: 插件实例
- `stream_id`: 聊天流 ID
- `**kwargs`: 传递给 Agent 的参数
- 返回: 执行是否成功与结果描述

```python
from src.app.plugin_system.api.agent_api import execute_agent

success, result = await execute_agent(
    signature="my_plugin:agent:my_agent",
    plugin=my_plugin,
    stream_id="qq_group_123",
)
```

### 私有 usables 管理

#### `get_agent_usables(signature: str) -> list[type[LLMUsable]]`

获取 Agent 的专属可用工具（usables）列表。这些工具仅供该 Agent 使用。

#### `get_agent_usable_schemas(signature: str) -> list[dict[str, Any]]`

获取 Agent 专属工具的 Schema 列表。

#### `execute_agent_usable(signature: str, plugin: BasePlugin, stream_id: str, usable_name: str, **kwargs: Any) -> tuple[bool, Any]`

执行 Agent 的专属 usable。此函数为**异步函数**。

- `signature`: Agent 组件签名
- `plugin`: 插件实例
- `stream_id`: 聊天流 ID
- `usable_name`: usable 名称
- `**kwargs`: 传递给 usable 的参数
- 返回: 执行是否成功与结果

```python
from src.app.plugin_system.api.agent_api import execute_agent_usable

success, result = await execute_agent_usable(
    signature="my_plugin:agent:my_agent",
    plugin=my_plugin,
    stream_id="qq_group_123",
    usable_name="helper_tool",
)
```

## 相关文档

- [Agent 组件](../components/agent.md)
- [LLM API](./llm-api.md)
