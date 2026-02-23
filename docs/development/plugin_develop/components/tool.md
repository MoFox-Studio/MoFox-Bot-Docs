# Tool — 工具组件

`BaseTool` 定义了"查询"工具的行为。与 Action 不同，Tool 侧重于返回信息供 LLM 参考，而非执行有副作用的操作。

## 与 Action 的区别

| 特性 | Action | Tool |
| --- | --- | --- |
| 主要用途 | 执行操作，产生副作用 | 查询信息，返回给 LLM |
| 执行后果 | 发消息、调 API 等 | 计算结果、查询数据库等 |
| 返回值用途 | Bot 内部记录 | LLM 读取后继续思考 |
| 典型场景 | 发送消息、发图片 | 计算、翻译、查天气 |

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tool_name` | `str` | `""` | 工具名称（必须设置，在插件内唯一）|
| `tool_description` | `str` | `""` | 向 LLM 描述工具的功能 |
| `chatter_allow` | `list[str]` | `[]` | 允许使用的 Chatter 列表，空列表表示全部 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 支持的聊天类型 |
| `associated_platforms` | `list[str]` | `[]` | 关联平台列表 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖签名列表 |

## 必须实现的方法

### `execute(*args, **kwargs) -> tuple[bool, str | dict]`

工具的核心执行逻辑。

**返回值**：`(是否成功, 结果)` — 结果可以是字符串或字典，LLM 会读取结果继续对话。

```python
async def execute(
    self,
    expression: Annotated[str, "要计算的数学表达式，如：2+3*4"],
) -> tuple[bool, str]:
    try:
        result = eval(expression)
        return True, f"计算结果：{result}"
    except Exception as e:
        return False, f"计算错误：{str(e)}"
```

## 完整示例

### 示例 1：数学计算器

```python
from typing import Annotated
from src.core.components.base.tool import BaseTool


class CalculatorTool(BaseTool):
    """数学表达式计算器"""

    tool_name = "calculator"
    tool_description = "计算数学表达式，支持加减乘除、幂运算等基本运算"

    async def execute(
        self,
        expression: Annotated[str, "要计算的数学表达式，例如：2+3*4 或 (10-5)**2"],
    ) -> tuple[bool, str]:
        try:
            # 安全计算（只允许基本运算）
            allowed_names = {"__builtins__": {}}
            result = eval(expression, allowed_names)
            return True, f"计算结果：{result}"
        except ZeroDivisionError:
            return False, "错误：除数不能为零"
        except Exception as e:
            return False, f"计算失败：{str(e)}"
```

### 示例 2：数据库查询工具

```python
from typing import Annotated
from src.core.components.base.tool import BaseTool
from src.app.plugin_system.api.database_api import get_by, get_multi


class UserInfoTool(BaseTool):
    """查询用户信息"""

    tool_name = "get_user_info"
    tool_description = "通过用户 ID 查询用户的基本信息，包括昵称、加入时间等"

    async def execute(
        self,
        user_id: Annotated[str, "要查询的用户 ID"],
    ) -> tuple[bool, dict]:
        from ..models import UserModel

        user = await get_by(UserModel, user_id=user_id)
        if not user:
            return False, {"error": f"用户 {user_id} 不存在"}

        return True, {
            "user_id": user.user_id,
            "nickname": user.nickname,
            "join_time": str(user.join_time),
            "level": user.level,
        }
```

### 示例 3：外部 API 查询工具

```python
from typing import Annotated
import aiohttp
from src.core.components.base.tool import BaseTool


class WeatherQueryTool(BaseTool):
    """查询实时天气数据"""

    tool_name = "query_weather"
    tool_description = "查询指定城市的当前天气数据，返回温度、湿度、天气描述等信息"

    async def execute(
        self,
        city: Annotated[str, "城市名称，支持中文，如：北京、上海"],
        unit: Annotated[str, "温度单位，'celsius' 或 'fahrenheit'，默认摄氏度"] = "celsius",
    ) -> tuple[bool, dict]:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.weather.example.com/current",
                    params={"city": city, "unit": unit}
                ) as resp:
                    data = await resp.json()

            return True, {
                "city": city,
                "temperature": data["temp"],
                "humidity": data["humidity"],
                "description": data["desc"],
                "wind_speed": data["wind"],
            }
        except Exception as e:
            return False, {"error": str(e)}
```

## `get_signature()` 类方法

```python
>>> CalculatorTool.get_signature()
"my_plugin:tool:calculator"
```

::: tip 返回 dict 还是 str？
当结果是结构化数据（多个字段）时，返回 `dict`；当结果是简单文本时，返回 `str`。LLM 对两种格式都能很好地理解。
:::
