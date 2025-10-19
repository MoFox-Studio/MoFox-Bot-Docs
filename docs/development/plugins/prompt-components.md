# 📝 Prompt 组件开发指南

## 📖 什么是 Prompt 组件？

Prompt 组件是插件中用于动态增强和定制核心 Prompt 的一种强大工具。它的核心思想是通过向现有的 Prompt 模板中“注入”额外的上下文信息，从而在不修改核心代码的情况下，精细地调整和扩展模型的行为、语气和风格。

你可以把它想象成给模型戴上不同的“面具”或“角色卡”。例如，在与不同用户交流时，可以通过注入不同的 Prompt 来让模型展现出不同的性格；或者在处理特定任务时，注入相关的背景知识来提高其表现。

### 与 Action 组件的区别

为了更好地理解 Prompt 组件，我们可以将其与 Action 组件进行简单对比：

-   **⚡ Action 组件**：决定模型 **“做什么”**。它为模型提供了回复之外的额外能力，如发送图片、调用工具等。这是一个行为层面的扩展。
-   **📝 Prompt 组件**：决定模型 **“说什么”** 和 **“怎么说”**。它通过影响输入给模型的上下文，来改变模型生成文本的风格和内容。这是一个内容和风格层面的扩展。

---

## 🎯 Prompt 组件的基本结构

所有 Prompt 组件都必须继承自 `BasePrompt` 基类，并定义一些关键的类属性来声明其行为。

### 核心属性详解

-   `prompt_name: str`: **（必需）** 组件的唯一标识符。命名应清晰、简洁，并能反映其功能。
-   `prompt_description: str`: **（推荐）** 对组件功能的简要描述，有助于其他开发者理解其用途。
-   `injection_point: str | list[str]`: **（必需）** 指定此组件要注入的目标核心 Prompt 的名称。
    -   可以是一个字符串，如 `"planner_prompt"`，表示只注入到这一个目标。
    -   也可以是一个字符串列表，如 `["s4u_style_prompt", "normal_style_prompt"]`，表示同时注入到多个目标中。
    -   常见的目标有:
        -   `planner_prompt`: 规划器的Prompt
        -   `s4u_style_prompt`: S4U风格的回复Prompt
        -   `normal_style_prompt`: 普通风格的回复Prompt
        -   `change_mood_prompt`: 情绪改变时的Prompt

### 代码框架示例

下面是一个标准的 Prompt 组件代码结构：

```python
from src.plugin_system.base.base_prompt import BasePrompt
from src.chat.utils.prompt_params import PromptParameters

class ExamplePrompt(BasePrompt):
    # 1. 组件基本信息
    prompt_name = "example_prompt"
    prompt_description = "这是一个示例Prompt，用于向核心Prompt添加额外信息。"
    
    # 2. 指定注入目标
    # 可以是单个目标，也可以是多个目标的列表
    injection_point = "planner_prompt" 

    # 3. 初始化 (通常无需修改，直接继承父类即可)
    def __init__(self, params: PromptParameters, plugin_config: dict | None = None):
        super().__init__(params, plugin_config)

    # 4. 核心执行逻辑
    async def execute(self) -> str:
        """
        根据上下文动态生成要注入的文本。
        返回的字符串将被拼接到目标Prompt的最前面。
        """
        # --- 在这里编写你的逻辑 ---
        user_name = self.params.user_nickname
        
        # 示例：根据用户信息生成一段定制化的提示
        custom_prompt = f"记住，现在与你对话的用户是'{user_name}'，他是一位资深程序员。请在回复时使用更专业、更技术性的语言。"
        
        return custom_prompt
```

---

## 🛠️ 核心方法与属性详解

### `execute(self) -> str`

这是 Prompt 组件的灵魂所在，**所有子类都必须实现这个异步方法**。

-   **职责**: 它的核心职责是根据当前的上下文信息，动态地生成一段文本字符串。
-   **数据来源**: 该方法内可以通过 `self.params` 访问到丰富的上下文信息，这是实现动态注入的关键。
-   **返回值**: 方法返回的字符串将 **被自动拼接到 `injection_point` 指定的目标 Prompt 内容的最前面**。这意味着你注入的内容将具有较高的优先级，能有效地引导模型的后续输出。

### `self.params: PromptParameters`

`self.params` 是一个数据容器对象，它封装了构建 Prompt 所需的全部上下文信息。你可以通过它访问到：

-   `self.params.user_id`: 当前用户的唯一ID。
-   `self.params.user_nickname`: 当前用户的昵称。
-   `self.params.chat_history`: 当前对话的详细历史记录。
-   `self.params.is_group`: 判断当前是否为群聊环境。
-   ... 以及更多其他有用的上下文信息。

在 `execute` 方法中，你应该充分利用这些信息来生成高度情境化的提示内容。

### `get_config(self, key: str, default=None)`

这是一个非常实用的辅助方法，用于安全地从当前插件的配置文件中读取配置项。

-   **功能**: 避免了直接操作字典可能引发的 `KeyError`。
-   **嵌套访问**: 支持使用点号（`.`）来访问嵌套的配置值，例如 `self.get_config("api.weather.key")`。

**用法示例:**

```python
# 假设插件配置文件 config.json 中有如下内容:
# {
#   "weather_api": {
#     "api_key": "your_api_key_here",
#     "city": "Beijing"
#   }
# }

class WeatherPrompt(BasePrompt):
    ...
    async def execute(self) -> str:
        # 使用 get_config 安全地读取配置
        api_key = self.get_config("weather_api.api_key")
        default_city = self.get_config("weather_api.city", "Shanghai") # 带默认值
        
        if not api_key:
            return "（天气服务未配置，无法获取天气信息。）"
        
        # ...后续逻辑
        return f"当前城市是{default_city}。"
```

---

## 🚀 实践示例：创建一个天气提示组件

让我们通过一个具体的例子来展示 Prompt 组件的用法。

**场景**: 我们希望模型在为用户制定计划或提供建议时，能够主动考虑到当前的天气情况，让建议更加贴心和实用。

**实现步骤**:

1.  **创建组件**: 创建一个名为 `WeatherPrompt` 的新组件。
2.  **设定目标**: 将注入目标 `injection_point` 设置为 `planner_prompt`，因为我们希望在“计划”场景下生效。
3.  **实现逻辑**: 在 `execute` 方法中，调用一个（伪）天气服务来获取天气信息。
4.  **构建提示**: 将获取到的天气信息格式化为一段结构清晰的提示文本，并返回。

**完整代码示例:**

```python
import random
from src.plugin_system.base.base_prompt import BasePrompt
from src.chat.utils.prompt_params import PromptParameters

class WeatherPrompt(BasePrompt):
    prompt_name = "weather_info_prompt"
    prompt_description = "向计划类Prompt注入当前的天气信息，让模型的规划更贴近现实。"
    injection_point = "planner_prompt"

    def __init__(self, params: PromptParameters, plugin_config: dict | None = None):
        super().__init__(params, plugin_config)

    async def _get_current_weather(self, city: str) -> dict:
        """
        一个模拟的天气API调用函数。
        在实际应用中，这里应该是一个真实的HTTP请求。
        """
        print(f"正在为城市 '{city}' 获取天气信息...")
        # 伪代码：模拟API返回
        weathers = [
            {"condition": "晴朗", "temp": "25°C", "suggestion": "天气晴朗，适合户外活动。"},
            {"condition": "多云", "temp": "22°C", "suggestion": "天气多云，可能会有零星小雨，出门建议带伞。"},
            {"condition": "小雨", "temp": "18°C", "suggestion": "正在下雨，请尽量安排室内活动。"},
        ]
        return random.choice(weathers)

    async def execute(self) -> str:
        """
        获取天气信息并构建注入的Prompt文本。
        """
        # 假设我们可以从用户配置或历史消息中获取城市信息
        # 这里为了简化，我们使用插件配置中的城市
        city = self.get_config("weather.city", "北京") # 从配置读取城市，默认为北京

        weather_data = await self._get_current_weather(city)

        # 构建结构化的Prompt注入内容
        prompt_injection = f"""
# 当前天气参考
- 城市: {city}
- 天气状况: {weather_data['condition']}
- 温度: {weather_data['temp']}
- 出行建议: {weather_data['suggestion']}

请在制定下一步计划时，务必考虑到以上天气情况。
"""
        return prompt_injection
```

通过这个简单的组件，模型在执行任何与 `planner_prompt` 相关的任务时，都会首先看到我们注入的天气信息，从而做出更智能、更符合现实情况的规划。这就是 Prompt 组件的魅力所在！