# Action API

`src.app.plugin_system.api.action_api` 提供 Action 组件的查询、Schema 获取、执行、缓存管理与上下文激活。

Action 是偏副作用的 [`LLMUsable`](../../components/llm-usable.md) 组件，返回值约定为 `(bool, str)`。

## 导入

```python
from src.app.plugin_system.api.action_api import (
    get_all_actions,
    get_actions_for_plugin,
    get_actions_for_chat,
    get_action_class,
    get_action_schema,
    get_action_schemas,
    execute_action,
    clear_schema_cache,
    modify_actions,
)
```

## 函数

### `get_all_actions() -> dict[str, type[BaseAction]]`

获取所有已注册的 Action 组件，返回签名到类的映射。

```python
actions = get_all_actions()
# {"plugin_name:action:name": ActionClass, ...}
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

通过签名（格式 `plugin_name:action:name`）获取 Action 类，未找到返回 `None`。

### `get_action_schema(signature: str) -> dict[str, Any] | None`

获取单个 Action 的 OpenAI Tool Calling Schema。

### `get_action_schemas(chat_type: ChatType | str = ChatType.ALL, chatter_name: str = "", platform: str = "") -> list[dict[str, Any]]`

批量获取适用场景下所有 Action 的 Schema 列表，用于直接传递给 LLM。

### `execute_action(signature: str, plugin: BasePlugin, message: Message, **kwargs: Any) -> tuple[bool, str]`

执行 Action。创建 Action 实例并调用其 `execute` 方法。此函数为**异步函数**。

- `signature`: Action 组件签名
- `plugin`: 插件实例
- `message`: 消息对象
- `**kwargs`: 传递给 Action 的参数
- 返回: `(是否成功, 结果描述)`

```python
from src.app.plugin_system.api.action_api import execute_action

success, result = await execute_action(
    signature="my_plugin:action:send_msg",
    plugin=my_plugin,
    message=msg,
    content="Hello",
)
```

### `clear_schema_cache(signature: str | None = None) -> None`

清除 Schema 缓存。传入签名则清除单个，不传则清除全部。

### `modify_actions(stream_id: str, message_content: str = "") -> list[str]`

修改动作列表，根据上下文过滤和激活动作。此函数为**异步函数**。

- `stream_id`: 聊天流 ID
- `message_content`: 消息内容
- 返回: 可用 Action 签名列表

## 相关文档

- [Action 组件](../components/action.md)
- [LLM API](./llm-api.md)
- [Stream API](./stream-api.md)
