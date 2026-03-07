# Action API

`src/app/plugin_system/api/action_api` 提供 Action 组件的查询、过滤与使用接口。

## 导入

```python
from src.app.plugin_system.api.action_api import (
    get_all_actions,
    get_actions_for_plugin,
    get_actions_for_chat,
    get_action_class,
    get_action_instances,
    get_actions_as_llm_usable,
)
```

## 核心函数

### `get_all_actions() -> dict[str, type[BaseAction]]`

获取所有已注册的 Action 组件。

**返回值：**
```python
{
    "plugin_name:action:action_name": ActionClass,
    "another_plugin:action:another_action": AnotherActionClass,
}
```

**使用示例：**
```python
all_actions = get_all_actions()
print(f"已注册 {len(all_actions)} 个 Action 组件")
```

---

### `get_actions_for_plugin(plugin_name: str) -> dict[str, type[BaseAction]]`

获取指定插件的所有 Action 组件。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
```python
{
    "plugin_name:action:search": SearchAction,
    "plugin_name:action:download": DownloadAction,
}
```

**使用示例：**
```python
actions = get_actions_for_plugin("web_search")
for signature, action_class in actions.items():
    print(f"Action: {signature}")
```

---

### `get_actions_for_chat(chat_type=ChatType.ALL, chatter_name="", platform="") -> list[type[LLMUsable]]`

获取适用于特定聊天上下文的 Action 组件列表。

**参数：**
- `chat_type`: 聊天类型（`ChatType.ALL`、`ChatType.PRIVATE`、`ChatType.GROUP` 等）
- `chatter_name`: Chatter 名称，可选
- `platform`: 平台名称，可选

**返回值：**
```python
[
    SearchAction,
    DownloadAction,
    TranslateAction,
]
```

**使用示例：**
```python
from src.core.components.types import ChatType

# 获取所有适用于群聊的 Action
group_actions = get_actions_for_chat(chat_type=ChatType.GROUP)

# 获取特定 Chatter 的 Action
chatter_actions = get_actions_for_chat(chatter_name="default_chatter")

# 获取特定平台的 Action
qq_actions = get_actions_for_chat(platform="qq")
```

---

### `get_action_class(signature: str) -> type[BaseAction] | None`

通过签名获取 Action 类。

**参数：**
- `signature`: Action 组件签名（格式：`plugin_name:action:action_name`）

**返回值：**
- Action 类，未找到则返回 `None`

**使用示例：**
```python
action_class = get_action_class("web_search:action:search")
if action_class:
    print(f"找到 Action: {action_class.__name__}")
else:
    print("Action 不存在")
```

---

### `get_action_instances(chat_type=ChatType.ALL, chatter_name="", platform="", plugin=None) -> list[LLMUsable]`

获取 Action 实例列表（已实例化）。

**参数：**
- `chat_type`: 聊天类型
- `chatter_name`: Chatter 名称，可选
- `platform`: 平台名称，可选
- `plugin`: 插件实例，可选

**返回值：**
```python
[
    <SearchAction instance>,
    <DownloadAction instance>,
]
```

**使用示例：**
```python
# 获取所有 Action 实例
actions = get_action_instances(plugin=self.plugin)

# 在 Chatter 中使用
class MyChatter(BaseChatter):
    async def execute(self):
        actions = get_action_instances(
            chat_type=self.chat_type,
            platform=self.platform,
            plugin=self.plugin
        )
        for action in actions:
            print(f"可用 Action: {action}")
```

---

### `get_actions_as_llm_usable(chat_type=ChatType.ALL, chatter_name="", platform="", plugin=None) -> list[LLMUsable]`

获取可供 LLM 使用的 Action 列表。

**参数：**
- `chat_type`: 聊天类型
- `chatter_name`: Chatter 名称，可选
- `platform`: 平台名称，可选
- `plugin`: 插件实例，可选

**返回值：**
```python
[
    <SearchAction as LLMUsable>,
    <DownloadAction as LLMUsable>,
]
```

**使用示例：**
```python
from src.app.plugin_system.api.llm_api import create_tool_registry

# 获取可用 Action
actions = get_actions_as_llm_usable(
    chat_type=ChatType.GROUP,
    platform="qq",
    plugin=self.plugin
)

# 注册为 LLM 工具
tool_registry = create_tool_registry(tools=actions)
```

## 完整示例

```python
from src.app.plugin_system.api.action_api import (
    get_all_actions,
    get_actions_for_chat,
    get_action_instances,
)
from src.app.plugin_system.api.llm_api import create_tool_registry
from src.core.components.types import ChatType

class MyChatter(BaseChatter):
    async def execute(self):
        # 1. 查询所有已注册 Action
        all_actions = get_all_actions()
        self.logger.info(f"系统中共有 {len(all_actions)} 个 Action")
        
        # 2. 获取适用于当前聊天的 Action
        suitable_actions = get_actions_for_chat(
            chat_type=self.chat_type,
            platform=self.platform,
        )
        
        # 3. 获取 Action 实例并注册为工具
        action_instances = get_action_instances(
            chat_type=self.chat_type,
            platform=self.platform,
            plugin=self.plugin,
        )
        
        tool_registry = create_tool_registry(tools=action_instances)
        
        # 4. 在 LLM 请求中使用
        # ... 后续 LLM 调用逻辑
```

## 相关文档

- [Action 组件](../components/action.md) — Action 组件的详细说明
- [LLM API](./llm-api.md) — 如何将 Action 注册为 LLM 工具
- [组件总览](../components/index.md) — 所有组件类型概览
