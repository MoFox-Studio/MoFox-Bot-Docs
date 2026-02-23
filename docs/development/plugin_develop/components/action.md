# Action — 动作组件

`BaseAction` 定义了"主动响应"组件的行为。Action 通过 LLM Tool Calling 被触发，执行后会产生副作用（如发送消息、调用外部 API）。

## 工作原理

1. Chatter 将 Action 注册为 LLM 的可调用工具
2. 框架自动解析 `execute()` 方法的参数注解，生成 JSON Schema
3. LLM 根据对话上下文决定是否调用该 Action，并传入参数
4. 框架路由 Tool Call 到对应 Action，调用 `execute()`

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `action_name` | `str` | `""` | 动作名称（必须设置，在插件内唯一）|
| `action_description` | `str` | `""` | 向 LLM 描述该动作的功能（越详细 LLM 越准确）|
| `primary_action` | `bool` | `False` | 是否为主动作，主动作每轮对话只能执行一次 |
| `chatter_allow` | `list[str]` | `[]` | 允许调用的 Chatter 名称列表，空列表表示全部允许 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 支持的聊天类型 |
| `associated_platforms` | `list[str]` | `[]` | 关联平台，空列表表示所有平台 |
| `associated_types` | `list[str]` | `[]` | 需要的内容类型列表 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖的组件签名列表 |

## 必须实现的方法

### `execute(*args, **kwargs) -> tuple[bool, str]`

动作的核心执行逻辑。

**返回值**：`(是否成功, 结果描述)`

**重要**：`execute()` 的参数会被框架解析为 LLM Tool Schema。

- 推荐使用 `Annotated[type, "描述"]` 提供参数说明
- 若未提供 `Annotated`/docstring 参数描述，框架会回退为通用描述（如 `"xxx 参数"`）
- 描述文字会直接影响 LLM 调用质量，建议写清边界、单位、取值范围

```python
from typing import Annotated

async def execute(
    self,
    content: Annotated[str, "要发送的文本内容"],
    reply_to_id: Annotated[str | None, "要回复的消息 ID，不回复则为 None"] = None,
) -> tuple[bool, str]:
    ...
```

## 可选激活钩子

### `go_activate() -> bool`

`go_activate()` 不是必须实现的方法，但如果实现，框架会在对话期动态判断该 Action 是否可用。

常见场景：

- 按概率激活
- 按上下文条件激活
- 按外部状态（如配置开关、额度）激活

```python
class SendEmojiAction(BaseAction):
    action_name = "send_emoji"
    action_description = "发送表情包"

    async def go_activate(self) -> bool:
        # 仅示例：30% 概率向 LLM 暴露该 Action
        return await self._random_activation(0.3)
```

## 实例属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `self.chat_stream` | `ChatStream` | 当前聊天流，包含 `stream_id`、`platform` 等信息 |
| `self.plugin` | `BasePlugin` | 所属插件实例，可通过它访问插件配置 |

## 完整示例

### 示例 1：发送文本消息

```python
from typing import Annotated
from src.core.components.base.action import BaseAction
from src.core.components.types import ChatType
from src.app.plugin_system.api.send_api import send_text
from src.app.plugin_system.api.log_api import get_logger

logger = get_logger("my_plugin")


class SendTextAction(BaseAction):
    """发送文本消息到当前聊天"""

    action_name = "send_text"
    action_description = "向当前聊天发送一条文本消息"
    primary_action = True  # 每轮对话只能发一次主消息

    async def execute(
        self,
        content: Annotated[str, "要发送的消息内容，支持纯文本"],
    ) -> tuple[bool, str]:
        stream_id = self.chat_stream.stream_id
        success = await send_text(content, stream_id)
        if success:
            logger.info(f"已发送消息: {content[:50]}")
            return True, f"消息已发送: {content}"
        return False, "消息发送失败"
```

### 示例 2：发送表情包

```python
from typing import Annotated
from src.core.components.base.action import BaseAction
from src.core.components.types import ChatType
from src.app.plugin_system.api.send_api import send_emoji


class SendEmojiAction(BaseAction):
    """发送一张表情包"""

    action_name = "send_emoji"
    action_description = "根据情绪或关键词发送合适的表情包给用户"
    primary_action = False  # 非主动作，可在主消息之外额外使用

    async def execute(
        self,
        emoji_tag: Annotated[str, "表情包关键词，如：开心、大笑、委屈、无语"],
    ) -> tuple[bool, str]:
        # 根据 tag 查找并发送表情包
        emoji_url = await self._find_emoji(emoji_tag)
        if not emoji_url:
            return False, f"未找到标签为 '{emoji_tag}' 的表情包"

        success = await send_emoji(emoji_url, self.chat_stream.stream_id)
        return (True, f"表情包已发送") if success else (False, "发送失败")

    async def _find_emoji(self, tag: str) -> str | None:
        # 实现表情包查找逻辑
        ...
```

### 示例 3：调用外部 API

```python
from typing import Annotated
import aiohttp
from src.core.components.base.action import BaseAction


class QueryWeatherAction(BaseAction):
    """查询城市天气并发送结果"""

    action_name = "query_weather"
    action_description = "查询指定城市的实时天气情况，并将结果发送给用户"
    primary_action = True

    async def execute(
        self,
        city: Annotated[str, "要查询天气的城市名称，如：北京、上海、广州"],
    ) -> tuple[bool, str]:
        from src.app.plugin_system.api.send_api import send_text

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"https://api.weather.com/{city}") as resp:
                    data = await resp.json()
                    weather_text = f"{city}: {data['temp']}°C, {data['desc']}"

            await send_text(weather_text, self.chat_stream.stream_id)
            return True, f"天气已查询: {weather_text}"

        except Exception as e:
            return False, f"天气查询失败: {str(e)}"
```

## `ChatType` 枚举

```python
from src.core.components.types import ChatType

ChatType.PRIVATE   # 仅私聊
ChatType.GROUP     # 仅群聊
ChatType.DISCUSS   # 仅讨论组
ChatType.ALL       # 所有类型（默认）
```

## `get_signature()` 类方法

返回组件唯一签名，格式：`"plugin_name:action:action_name"`。

```python
>>> SendTextAction.get_signature()
"my_plugin:action:send_text"
```

::: tip 参数描述规范
`Annotated` 中的描述字符串会直接传给 LLM，是参数说明的首选来源。未提供时框架会尝试使用 docstring 或回退为通用描述。请写得清晰、准确、有边界说明。
:::
