# 📝 Prompt 组件开发指南 (v2)

## 📖 什么是 Prompt 组件？

Prompt 组件是插件中用于动态增强和定制核心 Prompt 的一种强大工具。它的核心思想是通过向现有的 Prompt 模板中“注入”额外的上下文信息，从而在不修改核心代码的情况下，精细地调整和扩展模型的行为、语气和风格。

你可以把它想象成给模型戴上不同的“面具”或“角色卡”。例如，在与不同用户交流时，可以通过注入不同的 Prompt 来让模型展现出不同的性格；或者在处理特定任务时，注入相关的背景知识来提高其表现。

### 与 Action 组件的区别

为了更好地理解 Prompt 组件，我们可以将其与 Action 组件进行简单对比：

-   **⚡ Action 组件**：决定模型 **“做什么”**。它为模型提供了回复之外的额外能力，如发送图片、调用工具等。这是一个行为层面的扩展。
-   **📝 Prompt 组件**：决定模型 **“说什么”** 和 **“怎么说”**。它通过影响输入给模型的上下文，来改变模型生成文本的风格和内容。这是一个内容和风格层面的扩展。


## 🎯 Prompt 组件的基本结构

所有 Prompt 组件都必须继承自 `BasePrompt` 基类，并实现其核心方法和属性。

### 核心属性详解

-   `prompt_name: str`: **（必需）** 组件的唯一标识符。命名应清晰、简洁，并能反映其功能。
-   `prompt_description: str`: **（推荐）** 对组件功能的简要描述，有助于其他开发者理解其用途。
-   `injection_rules: list[InjectionRule]`: **（必需）** 这是定义注入行为的核心。它是一个 `InjectionRule` 对象的列表，允许你精确控制注入的 **目标、方式、位置** 和 **优先级**。

### 核心方法详解

#### `async def execute(self) -> str`

这是组件的核心执行逻辑，**必须实现**。该方法负责根据当前的上下文动态生成需要注入的文本内容。

-   **返回值**: `str` - 生成的文本字符串，将根据 `injection_rules` 的定义被注入到目标 Prompt 中。

### 代码框架示例

```python
from src.plugin_system.base.base_prompt import BasePrompt
from src.plugin_system.base.component_types import InjectionRule, InjectionType
from src.chat.utils.prompt_params import PromptParameters

class ExamplePrompt(BasePrompt):
    # 1. 组件基本信息
    prompt_name = "example_prompt"
    prompt_description = "这是一个示例Prompt，用于向核心Prompt添加额外信息。"
    
    # 2. 定义注入规则 (核心)
    injection_rules = [
        InjectionRule(
            target_prompt="planner_prompt", 
            injection_type=InjectionType.PREPEND, 
            priority=100
        )
    ]

    # 3. 初始化 (通常无需修改，父类已处理)
    # def __init__(self, params: PromptParameters, plugin_config: dict | None = None, target_prompt_name: str | None = None):
    #     super().__init__(params, plugin_config, target_prompt_name)

    # 4. 核心执行逻辑
    async def execute(self) -> str:
        """
        根据上下文动态生成要注入的文本。
        """
        # --- 在这里编写你的逻辑 ---
        user_name = self.params.sender
        
        # 示例：根据用户信息生成一段定制化的提示
        custom_prompt = f"记住，现在与你对话的用户是'{user_name}'，他是一位资深程序员。请在回复时使用更专业、更技术性的语言。"
        
        return custom_prompt
```

## 🧠 可用参数：你的“信息仪表盘”

在 `execute` 方法中，你可以通过 `self` 访问到两个非常重要的属性，它们是你构建动态 Prompt 的主要信息来源。

### 1. `self.params: PromptParameters`

这是一个数据类，包含了构建 Prompt 所需的 **所有上下文信息**。它就像一个仪表盘，展示了当前对话的方方面面。

**常用关键参数速览：**

| 参数名 | 类型 | 描述 |
| --- | --- | --- |
| `chat_id` | `str` | 当前聊天的唯一ID。 |
| `is_group_chat` | `bool` | 是否为群聊。 |
| `sender` | `str` | 消息发送者的ID或昵称。 |
| `bot_name` | `str` | 机器人自身的名称。 |
| `message_list_before_now_long` | `list` | 完整的长聊天历史记录。 |
| `message_list_before_short` | `list` | 经过处理的短聊天历史记录。 |
| `target_user_info` | `dict` | 对话目标用户的信息。 |
| `available_actions` | `dict` | 当前可用的 Action 组件信息。 |
| `chat_scene` | `str` | 由系统动态生成的当前聊天场景描述。 |

> **提示**：`PromptParameters` 包含的参数非常丰富，以上仅为常用部分。你可以直接在代码中查看 `src.chat.utils.prompt_params.PromptParameters` 类的定义，以了解所有可用参数。

### 2. `self.target_prompt_name: str`

这个属性告诉你 **当前 `execute` 方法是为哪个目标 Prompt 生成内容**。

当你使用 `injection_rules` 将一个组件注入到 **多个不同目标** 时，这个参数就显得至关重要。你可以通过判断 `self.target_prompt_name` 的值，来为不同的注入目标返回不同的文本内容，实现“一组件多用”的强大效果。

例如，你可以检查 `if self.target_prompt_name == "planner_prompt":` 来为规划器提供详细信息，而在 `elif self.target_prompt_name == "s4u_style_prompt":` 时返回一句简短的风格提醒。

### 3. `self.plugin_config: dict`

通过 `self.get_config(key: str, default: Any = None)` 方法，你可以安全地从当前插件的配置文件中读取配置项。这使得你的 Prompt 行为可以被用户轻松配置。

## 🛠️ 核心概念：`InjectionRule` 详解

`injection_rules` 列表取代了旧的 `injection_point`，提供了更强大和灵活的注入控制能力。每个 `InjectionRule` 对象都定义了一条完整的注入规则。

### `InjectionRule` 的参数

-   `target_prompt: str`: **（必需）** 要注入的一个或多个目标核心 Prompt 的名称。常见的有:
    -   `planner_prompt`: 规划器的Prompt
    -   `s4u_style_prompt`: S4U风格的回复Prompt
    -   `normal_style_prompt`: 普通风格的回复Prompt
    -   `change_mood_prompt`: 情绪改变时的Prompt
    -   `proactive_thinking_decision`: 主动思考决策Prompt
    -   `proactive_thinking_simple_bubble`: 主动思考冒泡回复Prompt
    -   `proactive_thinking_throw_topic`: 主动思考抛出话题回复Prompt

-   `injection_type: InjectionType`: **（可选，默认 `PREPEND`）** 注入的方式。这是一个枚举类型，可选值包括：
    -   `InjectionType.PREPEND`: 在目标 Prompt 的 **最前面** 插入内容。
    -   `InjectionType.APPEND`: 在目标 Prompt 的 **最后面** 追加内容。
    -   `InjectionType.REPLACE`: **替换** 目标 Prompt 中的指定内容。
    -   `InjectionType.REMOVE`: **移除** 目标 Prompt 中的指定内容。
    -   `InjectionType.INSERT_AFTER`: 在目标 Prompt 的指定内容 **之后** 插入。

-   `priority: int`: **（可选，默认 `100`）** 注入的优先级。当多个组件注入到同一个目标时，**数字越小，优先级越高，越先执行**。

-   `target_content: str | None`: **（特定类型必需）** 当 `injection_type` 为 `REPLACE`, `REMOVE`, 或 `INSERT_AFTER` 时，此项为 **必需**。它指定了要操作的目标内容，支持正则表达式。

### ⚠️ 关于旧的 `injection_point`

旧的 `injection_point: str | list[str]` 属性 **已被废弃**，但为了向后兼容，系统会自动将其转换为 `injection_rules`。

-   `injection_point = "planner_prompt"` 会被自动转换为 `[InjectionRule(target_prompt="planner_prompt")]`。
-   **强烈建议** 所有新的 Prompt 组件直接使用 `injection_rules` 来定义注入行为，以获得更强的控制力。


## 🚀 实践示例：创建一个高级天气提示组件

让我们通过一个具体的例子来展示如何综合运用 `self.params` 和 `self.target_prompt_name`。

**场景**: 我们希望模型在制定计划时能参考天气，但我们还想在最终回复时追加一条天气提醒。

**实现步骤**:

1.  **创建组件** `AdvancedWeatherPrompt`。
2.  **设定规则一**: 使用 `PREPEND` 在 `planner_prompt` 的开头注入详细天气信息，供模型规划时参考。
3.  **设定规则二**: 使用 `APPEND` 在 `s4u_style_prompt` 和 `normal_style_prompt` 的末尾追加一句简短的天气提醒。
4.  **实现逻辑**: 在 `execute` 方法中，通过判断 `self.target_prompt_name` 来为不同的注入目标返回不同的内容。

**完整代码示例:**

```python
import random
from src.plugin_system.base.base_prompt import BasePrompt
from src.plugin_system.base.component_types import InjectionRule, InjectionType
from src.chat.utils.prompt_params import PromptParameters

class AdvancedWeatherPrompt(BasePrompt):
    prompt_name = "advanced_weather_info_prompt"
    prompt_description = "向规划Prompt注入详细天气，并向回复Prompt追加天气提醒。"
    
    injection_rules = [
        # 规则1：为规划器提供详细天气信息
        InjectionRule(
            target_prompt="planner_prompt", 
            injection_type=InjectionType.PREPEND, 
            priority=50  # 较高优先级，确保在其他规划信息前
        ),
        # 规则2：为两种风格的回复追加一句提醒
        InjectionRule(
            target_prompt="normal_style_prompt"
            injection_type=InjectionType.APPEND, 
            priority=200 # 较低优先级
        ),
        InjectionRule(
            target_prompt="s4u_style_prompt"
            injection_type=InjectionType.APPEND, 
            priority=200 # 较低优先级
        )
    ]

    async def _get_current_weather(self, city: str) -> dict:
        """一个模拟的天气API调用函数。"""
        # 在实际应用中，这里应该是真实的天气API调用
        print(f"正在为城市 '{city}' 获取天气信息...")
        weathers = [
            {"condition": "晴朗", "temp": "25°C", "suggestion": "天气晴朗，适合户外活动。"},
            {"condition": "小雨", "temp": "18°C", "suggestion": "正在下雨，请尽量安排室内活动。"},
        ]
        return random.choice(weathers)

    async def execute(self) -> str:
        """
        根据不同的注入目标和上下文，返回不同的内容。
        """
        # 通过 get_config 读取用户在插件配置中设定的城市
        city = self.get_config("weather.city", "北京")
        weather_data = await self._get_current_weather(city)

        # 关键：通过 self.target_prompt_name 判断当前的注入目标
        if self.target_prompt_name == "planner_prompt":
            # 目标是规划器，返回详细信息
            return f"""
# 当前天气参考
- 城市: {city}
- 天气状况: {weather_data['condition']}
- 温度: {weather_data['temp']}
- 出行建议: {weather_data['suggestion']}
请在制定下一步计划时，务必考虑到以上天气情况。
"""
        elif self.target_prompt_name in ["s4u_style_prompt", "normal_style_prompt"]:
            # 目标是回复模板，返回简短提醒
            # 这里我们还从 self.params 中获取了用户名，让提醒更个性化
            user_name = self.params.sender
            return f"\n\n[温馨提示, {user_name}：今天{city}天气{weather_data['condition']}，温度{weather_data['temp']}，请注意。]"
        
        return "" # 其他未匹配的注入目标，返回空字符串
```

通过这个例子，你可以看到，利用 `self.params` 和 `self.target_prompt_name`，我们用一个组件就实现了对不同 Prompt 的、不同方式的、且内容可定制的精确注入操作。这就是 Prompt 组件 v2 的强大之处！