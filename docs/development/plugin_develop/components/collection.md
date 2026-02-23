# Collection — 集合组件

`BaseCollection` 是 Action/Tool 的分组容器，也是 `LLMUsable`。Collection 为 LLM 提供工具集的门控机制：LLM 初始只看到 Collection，调用它后才能使用内部的具体工具。

## 适用场景

- 工具数量多，希望按功能分组
- 部分工具需要"解锁"后才能使用（如 VIP 功能、危险操作）
- 减少 LLM 的工具列表长度，降低噪音

## 工作原理

```
LLM 工具列表中只有：[premiumTools Collection]
                            ↓ LLM 调用 premiumTools
框架自动解包 Collection → [action_vip_send, tool_advanced_search]
                            ↓ 这些工具现在对 LLM 可见了
```

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `collection_name` | `str` | `""` | 集合名称（插件内唯一）|
| `collection_description` | `str` | `""` | 向 LLM 描述这个集合的用途（决定 LLM 是否调用）|
| `chatter_allow` | `list[str]` | `[]` | 允许的 Chatter 列表 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 支持的聊天类型 |
| `associated_platforms` | `list[str]` | `[]` | 关联平台 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖 |

## 必须实现的方法

### `get_contents() -> list[str]`

返回集合中包含的组件签名列表。

```python
async def get_contents(self) -> list[str]:
    return [
        "my_plugin:action:send_vip_card",
        "my_plugin:tool:advanced_search",
        "my_plugin:collection:sub_collection",  # 支持嵌套 Collection
    ]
```

### `execute(stream_id: str) -> tuple[bool, dict[str, Any]]`

Collection 作为 `LLMUsable` 也可以被直接调用。默认行为是按 `stream_id` 解包集合，并返回解包结果摘要（组件数量与组件签名列表）。

```python
ok, result = await collection.execute(stream_id="qq_group_123456")
# result 示例:
# {
#   "collection": "my_plugin:collection:vip_tools",
#   "stream_id": "qq_group_123456",
#   "components_count": 3,
#   "components": [...]
# }
```

## 完整示例

### 示例 1：VIP 功能集合

```python
from src.core.components.base.collection import BaseCollection


class VIPToolsCollection(BaseCollection):
    """VIP 专属工具集合"""

    collection_name = "vip_tools"
    collection_description = "VIP 用户专属工具集，当用户明确请求 VIP 功能时调用。包含高级图片生成、专属表情包等。"

    async def get_contents(self) -> list[str]:
        return [
            "my_plugin:action:generate_image",
            "my_plugin:action:send_vip_emoji",
            "my_plugin:tool:premium_search",
        ]
```

### 示例 2：媒体工具集合

```python
class MediaCollection(BaseCollection):
    """媒体相关工具集合"""

    collection_name = "media_tools"
    collection_description = "媒体处理工具，包含图片发送、语音合成、视频截图等功能。当用户需要发送媒体内容时调用。"

    async def get_contents(self) -> list[str]:
        return [
            "media_plugin:action:send_image",
            "media_plugin:action:send_voice",
            "media_plugin:action:send_video_thumb",
        ]
```

### Chatter 中使用 Collection

```python
# Chatter 将 Collection 和普通工具一起注册给 LLM
registry = create_tool_registry([
    SendTextAction,          # 直接工具
    VIPToolsCollection,      # 门控集合
    MediaCollection,         # 门控集合
])
```

::: tip collection_description 的重要性
`collection_description` 非常重要，LLM 完全依赖它来判断何时调用该集合。应明确描述包含的功能类型和适用场景。
:::

::: warning 关于 `cover_go_activate`
当前运行时代码没有对 `cover_go_activate` 提供实际行为，请不要依赖该属性实现门控逻辑。
:::
