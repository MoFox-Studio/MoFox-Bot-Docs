# Action API

`src.app.plugin_system.api.action_api` 提供 Action 组件的查询、Schema 获取与缓存管理。

## 导入

```python
from src.app.plugin_system.api.action_api import (
    get_all_actions,
    get_actions_for_plugin,
    get_actions_for_chat,
    get_action_class,
    get_action_schema,
    get_action_schemas,
    clear_schema_cache,
)
```

## 函数

### `get_all_actions() -> dict[str, type[BaseAction]]`

获取所有已注册的 Action 组件，返回签名到类的映射。

```python
actions = get_all_actions()
# {"plugin_name:action:action_name": ActionClass, ...}
```

### `get_actions_for_plugin(plugin_name: str) -> dict[str, type[BaseAction]]`

获取指定插件的所有 Action。

### `get_actions_for_chat(chat_type: ChatType | str = ChatType.ALL, chatter_name: str = "", platform: str = "") -> list[type[LLMUsable]]`

获取适用于特定聊天上下文的 Action 列表。可按聊天类型、Chatter 名称和平台过滤。

```python
from src.core.components.types import ChatType

group_actions = get_actions_for_chat(chat_type=ChatType.GROUP, platform="qq")
```

### `get_action_class(signature: str) -> type[BaseAction] | None`

通过签名（格式 `plugin_name:action:action_name`）获取 Action 类，未找到返回 `None`。

### `get_action_schema(signature: str) -> dict[str, Any] | None`

获取单个 Action 的 OpenAI Tool Calling Schema。

### `get_action_schemas(chat_type: ChatType | str = ChatType.ALL, chatter_name: str = "", platform: str = "") -> list[dict[str, Any]]`

批量获取适用场景下所有 Action 的 Schema 列表，用于直接传递给 LLM。

### `clear_schema_cache(signature: str | None = None) -> None`

清除 Schema 缓存。传入签名则清除单个，不传则清除全部。

## 相关文档

- [Action 组件](../components/action.md)
- [LLM API](./llm-api.md)
