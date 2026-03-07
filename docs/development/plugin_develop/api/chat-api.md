# Chat API

`src/app/plugin_system/api/chat_api` 提供 Chatter 组件的查询和聊天流管理接口。

## 导入

```python
from src.app.plugin_system.api.chat_api import (
    get_all_chatters,
    get_chatters_for_plugin,
    get_chatter_class,
    get_active_chatters,
    get_chatter_for_stream,
    get_or_create_chatter_for_stream,
)
```

## 核心函数

### `get_all_chatters() -> dict[str, type[BaseChatter]]`

获取所有已注册的 Chatter 组件。

**返回值：**
```python
{
    "default:chatter:default": DefaultChatter,
    "advanced:chatter:multi_round": MultiRoundChatter,
}
```

**使用示例：**
```python
chatters = get_all_chatters()
print(f"共有 {len(chatters)} 个 Chatter 组件")
```

---

### `get_chatters_for_plugin(plugin_name: str) -> dict[str, type[BaseChatter]]`

获取指定插件的所有 Chatter 组件。

**参数：**
- `plugin_name`: 插件名称

**返回值：**
```python
{
    "my_plugin:chatter:custom_chatter": CustomChatter,
}
```

**使用示例：**
```python
chatters = get_chatters_for_plugin("my_plugin")
for signature, chatter_class in chatters.items():
    print(f"Chatter: {signature}")
```

---

### `get_chatter_class(signature: str) -> type[BaseChatter] | None`

通过签名获取 Chatter 类。

**参数：**
- `signature`: Chatter 组件签名（格式：`plugin_name:chatter:chatter_name`）

**返回值：**
- Chatter 类，未找到则返回 `None`

**使用示例：**
```python
chatter_class = get_chatter_class("default:chatter:default")
if chatter_class:
    print(f"找到 Chatter: {chatter_class.__name__}")
```

---

### `get_active_chatters() -> dict[str, BaseChatter]`

获取所有活跃的 Chatter 实例。

**返回值：**
```python
{
    "stream_id_1": <DefaultChatter instance>,
    "stream_id_2": <CustomChatter instance>,
}
```

**使用示例：**
```python
active_chatters = get_active_chatters()
print(f"当前有 {len(active_chatters)} 个活跃 Chatter")

for stream_id, chatter in active_chatters.items():
    print(f"Stream {stream_id}: {chatter.__class__.__name__}")
```

---

### `get_chatter_for_stream(stream_id: str) -> BaseChatter | None`

获取指定聊天流的 Chatter 实例。

**参数：**
- `stream_id`: 聊天流 ID

**返回值：**
- Chatter 实例，未找到则返回 `None`

**使用示例：**
```python
chatter = get_chatter_for_stream(self.stream_id)
if chatter:
    print(f"当前 Chatter: {chatter.__class__.__name__}")
else:
    print("该 stream 没有活跃的 Chatter")
```

---

### `get_or_create_chatter_for_stream(stream_id: str, chat_type: ChatType | str, platform: str, signature: str = "") -> BaseChatter`

获取或创建指定聊天流的 Chatter 实例。

**参数：**
- `stream_id`: 聊天流 ID
- `chat_type`: 聊天类型（`ChatType` 或字符串）
- `platform`: 平台名称
- `signature`: Chatter 签名，可选（为空时使用默认 Chatter）

**返回值：**
- Chatter 实例

**使用示例：**
```python
from src.core.components.types import ChatType

# 获取或创建默认 Chatter
chatter = await get_or_create_chatter_for_stream(
    stream_id=self.stream_id,
    chat_type=ChatType.GROUP,
    platform="qq",
)

# 获取或创建指定的 Chatter
custom_chatter = await get_or_create_chatter_for_stream(
    stream_id=self.stream_id,
    chat_type="private",
    platform="qq",
    signature="my_plugin:chatter:custom",
)
```

## 完整示例

### 示例 1：查询和管理 Chatter

```python
from src.app.plugin_system.api.chat_api import (
    get_all_chatters,
    get_active_chatters,
    get_chatter_for_stream,
)

class ChatterStatusCommand(BaseCommand):
    async def execute(self):
        # 1. 列出所有可用 Chatter
        all_chatters = get_all_chatters()
        chatter_list = [f"- {sig}" for sig in all_chatters]
        await self.send_text("可用 Chatter:\n" + "\n".join(chatter_list))
        
        # 2. 列出活跃 Chatter  
        active_chatters = get_active_chatters()
        active_list = [
            f"- {stream_id[:8]}...: {chatter.__class__.__name__}"
            for stream_id, chatter in active_chatters.items()
        ]
        await self.send_text("活跃 Chatter:\n" + "\n".join(active_list))
        
        # 3. 查询当前会话的 Chatter
        current_chatter = get_chatter_for_stream(self.stream_id)
        if current_chatter:
            await self.send_text(
                f"当前 Chatter: {current_chatter.__class__.__name__}"
            )
```

### 示例 2：切换 Chatter

```python
from src.app.plugin_system.api.chat_api import (
    get_or_create_chatter_for_stream,
    get_chatter_for_stream,
)
from src.core.components.types import ChatType

class SwitchChatterCommand(BaseCommand):
    async def execute(self, chatter_signature: str):
        # 获取当前 Chatter
        current = get_chatter_for_stream(self.stream_id)
        if current:
            await current.cleanup()  # 清理旧 Chatter
        
        # 创建新 Chatter
        new_chatter = await get_or_create_chatter_for_stream(
            stream_id=self.stream_id,
            chat_type=self.chat_type,
            platform=self.platform,
            signature=chatter_signature,
        )
        
        await self.send_text(
            f"已切换 Chatter: {new_chatter.__class__.__name__}"
        )
```

### 示例 3：在 Action 中调用 Chatter

```python
from src.app.plugin_system.api.chat_api import get_chatter_for_stream

class ProcessMessageAction(BaseAction):
    async def execute(self, stream_id: str, message: str):
        # 获取目标流的 Chatter
        chatter = get_chatter_for_stream(stream_id)
        
        if not chatter:
            return {"error": "Chatter 未找到"}
        
        # 调用 Chatter 的方法
        response = await chatter.process_user_message(message)
        
        return {"response": response}
```

## 相关文档

- [Chatter 组件](../components/chatter.md) — Chatter 组件的详细说明
- [Stream API](./stream-api.md) — 聊天流管理 API
- [消息查询 API](./message-api.md) — 历史消息查询
