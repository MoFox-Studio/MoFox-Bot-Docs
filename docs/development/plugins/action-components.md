# ⚡ Action 组件开发指南 (v2.0)

## 📖 核心概念：什么是Action？

Action 是 MoFox-Core 插件系统中的核心组件之一，它赋予了 Bot 在常规回复之外执行**主动行为**的能力。

不同于响应特定命令的函数，Action 由 MoFox-Core 的**决策系统**根据当前的聊天情境、上下文乃至随机性，**自主选择**是否使用。这使得 Bot 的行为不再是简单的“一问一答”，而是充满了拟人化的、不可预测的、更贴近真人交流的动态交互。

### Action 的核心特点

-   🧠 **智能决策**: Bot 根据复杂的内部逻辑，从众多可用的 Action 中“选择”最合适的一个来执行。
-   🚀 **动态激活**: Action 可以根据特定条件（如关键词、随机概率、LLM判断）被动态地“激活”或“休眠”，减轻了决策系统的负担。
-   🤖 **高度拟人化**: 通过引入随机性和情境感知，让 Bot 的行为更加自然、富有个性。
-   🔧 **功能可扩展**: 开发者可以通过编写自定义 Action，无限扩展 Bot 的能力，例如发送图片、查询天气、控制智能家居等。


## 🎯 现代激活机制 (v2.0 推荐)

在新版插件系统中，我们强烈推荐通过重写 `go_activate()` 方法，来实现高度自定义和灵活的 Action 激活逻辑。

### 核心方法：`go_activate()`

`go_activate()` 是 Action 激活的唯一入口。插件加载时，系统会调用这个异步方法来判断该 Action 在当前情境下是否应该被“激活”（即加入到 Bot 的决策候选池中）。

```python
class MyAction(BaseAction):
    # ... 其他定义 ...

    async def go_activate(self, llm_judge_model: "LLMRequest | None" = None) -> bool:
        """
        自定义激活逻辑
        返回 True 表示激活，False 则不激活。
        """
        # 在这里编写你的判断逻辑
        return True
```

为了简化开发，`BaseAction` 提供了一系列内置的异步工具函数，你可以在 `go_activate()` 中直接调用它们。

### 激活工具函数详解

#### 1. `_keyword_match()` - 关键词匹配

这是最常用的激活方式之一。它会自动获取当前消息内容，并检查是否包含指定的关键词。

```python
async def go_activate(self, llm_judge_model=None) -> bool:
    # 当消息中包含 "你好" 或 "hello" (不区分大小写) 时激活
    return await self._keyword_match(
        keywords=["你好", "hello"],
        case_sensitive=False  # case_sensitive 参数可选，默认为 False
    )
```

#### 2. `_random_activation()` - 随机激活

为你的 Bot 增加一点不可预测的“人性”。

```python
async def go_activate(self, llm_judge_model=None) -> bool:
    # 有 30% 的概率激活这个 Action
    return await self._random_activation(probability=0.3)
```

#### 3. `_llm_judge_activation()` - LLM 智能判断

这是最强大、最智能的激活方式。它会利用一个（通常是较小的）LLM 模型来动态判断当前情境是否适合激活该 Action。

你只需要提供核心的判断条件，方法会自动构建完整的 Prompt，并解析 LLM 的“是/否”回答。

```python
async def go_activate(self, llm_judge_model=None) -> bool:
    # 利用 LLM 判断当前是否需要发送一个安慰的表情
    return await self._llm_judge_activation(
        judge_prompt="当用户在聊天中表现出悲伤、沮丧或失落的情绪时激活",
        action_description="这是一个发送安慰表情的动作", # 可选，帮助 LLM 理解 Action 用途
        action_require=["用户情绪低落"] # 可选，进一步提供场景说明
    )
```

#### 组合使用

`go_activate()` 的强大之处在于你可以自由组合这些工具函数，实现复杂的激活逻辑。

```python
async def go_activate(self, llm_judge_model=None) -> bool:
    # 优先判断关键词
    if await self._keyword_match(keywords=["发送表情"]):
        return True
    
    # 如果没匹配到关键词，再进行 10% 的随机判断
    if await self._random_activation(probability=0.1):
        return True
        
    # 都不满足，则不激活
    return False
```


## 🚀 Action 的高级用法

### `call_action()` - 在 Action 中调用其他 Action

你可以使用 `call_action()` 方法在一个 Action 内部触发另一个已注册的 Action，这对于逻辑复用和构建复杂的行为链条非常有用。

```python
class WeatherAction(BaseAction):
    action_name = "get_weather"
    action_description = "获取天气信息"
    action_parameters = {"city": "城市名称"}
    
    async def execute(self) -> Tuple[bool, str]:
        city = self.action_data.get("city", "北京")
        # ... (获取天气的逻辑) ...
        weather_info = f"{city}今天晴天"
        
        # 调用另一个 Action 来发送图片
        await self.call_action(
            action_name="send_image_action",
            action_data={"description": weather_info}
        )
        return True, "天气信息已发送"

class SendImageAction(BaseAction):
    action_name = "send_image_action"
    action_description = "根据描述生成并发送图片"
    action_parameters = {"description": "图片描述"}

    async def execute(self) -> Tuple[bool, str]:
        desc = self.action_data.get("description")
        # ... (根据描述生成图片的逻辑) ...
        return True, "图片已发送"
```

### 二步 Action (Two-Step Action)

对于需要用户二次确认或选择的复杂操作，可以使用“二步 Action”。

1.  **设置标志位**: 在你的 Action 类中，设置 `is_two_step_action = True`。
2.  **定义子操作**: 使用 `step_one_description` 和 `sub_actions` 描述第一步的功能和可选项。
3.  **实现第二步逻辑**: 重写 `execute_step_two()` 方法来处理用户选择后的具体操作。

当 Bot 决定使用这个 Action 时：
-   **第一步**: 它会调用 `handle_step_one()`，自动向用户展示 `step_one_description` 和 `sub_actions` 列表，并等待 LLM 从用户的新回复中解析出选择的子操作。
-   **第二步**: 当获取到用户的选择后，系统会自动调用 `execute_step_two()`，并将用户选择的 `sub_action_name` 传递进来。

```python
class FileManagerAction(BaseAction):
    action_name = "file_manager"
    is_two_step_action = True  # 开启二步 Action
    step_one_description = "我有一个文件管理器，可以帮你操作文件。请问你想做什么？"
    sub_actions = [
        ("create_file", "创建一个新文件", {"filename": "文件名"}),
        ("delete_file", "删除一个已存在的文件", {"filename": "文件名"}),
        ("read_file", "读取一个文件的内容", {"filename": "文件名"}),
    ]

    async def execute(self) -> Tuple[bool, str]:
        # 对于二步 Action，execute 方法通常不需要实现，因为逻辑会自动转到 handle_step_one
        pass

    async def execute_step_two(self, sub_action_name: str) -> tuple[bool, str]:
        # 获取 LLM 为子操作解析出的参数
        filename = self.action_data.get("filename")
        if not filename:
            return False, "我需要一个文件名才能操作哦。"

        if sub_action_name == "create_file":
            # ... 创建文件的逻辑 ...
            return True, f"文件 '{filename}' 已经创建好了。"
        elif sub_action_name == "delete_file":
            # ... 删除文件的逻辑 ...
            return True, f"文件 '{filename}' 已经被我删除了。"
        elif sub_action_name == "read_file":
            # ... 读取文件的逻辑 ...
            return True, f"这是文件 '{filename}' 的内容：..."
        
        return False, "未知的文件操作。"
```



## 🔧 Action 结构与核心属性/方法详解

### 基本结构

```python
class ExampleAction(BaseAction):
    # --- 核心定义 ---
    action_name = "example_action"
    action_description = "这是一个示例动作"
    
    # --- LLM决策辅助信息 ---
    # 定义该 Action 需要的参数，LLM 会尝试从对话中提取这些参数
    action_parameters = {"param1": "参数1的说明", "param2": "参数2的说明"}
    # Action 使用场景描述，帮助 LLM 判断何时“选择”使用
    action_require = ["当用户想要...时使用", "在...场景下比较合适"]
    
    # --- 激活逻辑 (v2.0 推荐) ---
    async def go_activate(self, llm_judge_model=None) -> bool:
        return await self._keyword_match(["示例"])

    # --- 执行逻辑 ---
    async def execute(self) -> Tuple[bool, str]:
        """
        执行 Action 的主要逻辑
        
        Returns:
            Tuple[bool, str]: (是否成功, 执行结果的简单描述，主要用于日志)
        """
        # ---- 在这里编写你的动作逻辑 ----
        return True, "执行成功"
```

### 核心实例属性

你可以在 `execute()` 方法中通过 `self` 访问这些非常有用的属性：

-   `self.action_data` (dict): **(极其重要)** 这是一个字典，包含了 LLM 决策后传递给该 Action 的所有数据。**你定义的 `action_parameters` 参数值就在这里面！**
-   `self.chat_stream` (ChatStream): 当前的聊天流对象，包含了完整的上下文信息。
-   `self.chat_id` (str): 当前聊天流的唯一 ID。
-   `self.is_group` (bool): 当前是否为群聊。
-   `self.user_id` (str): 发送消息的用户 ID。
-   `self.user_nickname` (str): 发送消息的用户昵称。
-   `self.group_id` (str): 当前群聊的 ID (如果是群聊)。
-   `self.action_message` (dict | DatabaseMessages): 触发本次思考的原始消息数据。
-   `self.plugin_config` (dict): 该 Action 所属插件的配置信息。

#### **重点：如何获取动作参数**

假设你定义了 `action_parameters = {"city": "需要查询天气的城市名"}`。当 LLM 决定使用你的 Action 时，它会从用户的消息（比如“帮我查查上海的天气”）中提取出 `city` 的值。

在 `execute()` 方法中，你可以这样获取它：

```python
async def execute(self) -> Tuple[bool, str]:
    # 使用 .get() 方法安全地获取参数，如果 LLM 没有提供，则使用默认值
    city_to_query = self.action_data.get("city", "北京")
    
    if not city_to_query:
        await self.send_text("你需要告诉我查询哪个城市哦。")
        return False, "缺少城市参数"
        
    # ... 使用 city_to_query 进行后续操作 ...
    return True, f"查询了 {city_to_query} 的天气"
```

### 核心实例方法

-   `async def send_text(content: str, ...)`: 发送一条文本消息。
-   `async def send_image(image_base64: str)`: 发送一张图片（Base64 格式）。
-   `async def send_emoji(emoji_base64: str)`: 发送一个表情（Base64 格式）。
-   `async def send_custom(message_type: str, content: str, ...)`: 发送自定义类型的消息（如 `voiceurl`, `videourl` 等）。
-   `async def send_command(command_name: str, args: dict)`: 向适配器发送一个命令。
-   `async def wait_for_new_message(timeout: int)`: 等待指定时间，直到有新消息或超时。
-   `def get_config(key: str, default=None)`: 从插件配置中安全地获取一个值，支持点分嵌套访问（如 `get_config("database.host")`）。
-   `async def call_action(action_name: str, ...)`: 调用另一个 Action。

---

## 📜 附录：旧的激活机制 (已废弃)

在 v2.0 之前，Action 的激活依赖于在类中定义一系列特定的属性。**虽然该机制仍然兼容，但我们强烈建议你使用 `go_activate()` 的方式，因为它更加灵活和强大。**

如果你在阅读旧插件代码时遇到以下属性，它们的作用如下：

-   `activation_type` (ActionActivationType): 激活类型，可选值为 `ALWAYS`, `NEVER`, `RANDOM`, `KEYWORD`, `LLM_JUDGE`。
-   `random_activation_probability` (float): 当 `activation_type` 为 `RANDOM` 时，指定激活概率。
-   `activation_keywords` (list[str]): 当 `activation_type` 为 `KEYWORD` 时，指定关键词列表。
-   `llm_judge_prompt` (str): 当 `activation_type` 为 `LLM_JUDGE` 时，指定 LLM 判断的提示词。

`BaseAction` 的默认 `go_activate()` 实现会读取这些旧属性，并调用对应的 `_keyword_match()` 等新版工具函数，以实现向后兼容。