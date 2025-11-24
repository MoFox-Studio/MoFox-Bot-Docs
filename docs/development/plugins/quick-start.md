# 🚀 快速开始：创建你的第一个全功能插件

欢迎来到 MoFox-Core 插件开发的世界！本指南将带你从零开始，创建一个包含 **Prompt**、**Action**、**Command**、**Tool** 和 **Event Handler** 五大核心组件的 `hello_world` 插件。

通过这个过程，你将掌握插件系统的基本结构和开发流程。

## 📂 步骤一：创建插件基础结构

首先，我们需要为插件创建一个家。

### 1. 创建插件目录

在项目根目录的 `plugins/` 文件夹下，创建一个新的目录，命名为 `hello_world_plugin`。

### 2. 创建元数据文件 `__init__.py`
 
每个插件都需要一个 `__init__.py` 文件来定义其元数据。这取代了旧的 `_manifest.json` 系统。在 `hello_world_plugin` 目录下创建 `__init__.py` 文件，并填入以下内容：
 
```python
from src.plugin_system import PluginMetadata
 
# 定义插件元数据
metadata = PluginMetadata(
    name="Hello World 插件",
    description="一个包含四大核心组件的入门示例插件。",
    usage="这是一个示例插件，展示了如何使用Action、Command、Tool和Event Handler。",
    author="你的名字",
    version="1.0.1",
)
```
 
这个文件告诉 MoFox-Core 你的插件叫什么、功能是什么以及如何使用它。
 
### 3. 创建主文件 `plugin.py`

这是插件的灵魂所在。在 `hello_world_plugin` 目录下创建 `plugin.py` 文件。我们先写一个最基础的框架：

```python
from typing import List, Tuple, Type
from src.plugin_system import (
    BasePlugin,
    register_plugin,
    ComponentInfo,
    PermissionNodeField,
)

@register_plugin
class HelloWorldPlugin(BasePlugin):
    """一个包含四大核心组件的入门示例插件。"""
 
    # --- 插件基础信息 ---
    # 插件名称，必须与插件目录名一致
    plugin_name = "hello_world_plugin"
    # 默认是否启用插件
    enable_plugin = True
    # 插件依赖
    dependencies = []
    # Python包依赖
    python_dependencies = []
    # 配置文件名称
    config_file_name = "config.toml"
    # 配置文件结构定义
    config_schema = {}

    # --- 权限节点定义 ---
    permission_nodes = [
        PermissionNodeField(
            node_name="can_say_hello",
            description="允许用户使用 /hello 命令。"
        ),
    ]
 
    def get_plugin_components(self) -> List[Tuple[ComponentInfo, Type]]:
        """注册插件的所有功能组件。"""
        return []

```

到这里，你的插件已经可以被系统加载了，虽然它现在还什么都做不了。



## 🛠️ 步骤二：逐一添加五大组件

现在，让我们开始为插件添加真正的功能。我们将在 `plugin.py` 文件中添加代码。

### 1. 添加 Event Handler (事件处理器)

**功能**：我们想在机器人启动时，在控制台打印一条消息，证明插件已成功加载。

将以下代码添加到 `plugin.py` 的顶部：

```python
# (放在 import 语句下方)
from src.plugin_system import BaseEventHandler, EventType
from src.plugin_system.base.base_event import HandlerResult
from src.common.logger import get_logger

# ... (其他 import)

logger = get_logger("hello_world_plugin")

class StartupMessageHandler(BaseEventHandler):
    """启动时打印消息的事件处理器。"""
    handler_name = "hello_world_startup_handler"
    handler_description = "在机器人启动时打印一条日志。"
    init_subscribe = [EventType.ON_START]  # 订阅启动事件

    async def execute(self, params: dict) -> HandlerResult:
        logger.info("🎉 Hello World 插件已启动，准备就绪！")
        return HandlerResult(success=True, continue_process=True)
```

- `BaseEventHandler`: 所有事件处理器的父类。
- `init_subscribe`: 告诉系统我们关心哪个事件，这里是 `EventType.ON_START` (启动事件)。
- `execute`: 事件发生时，这里的代码会被执行。

> **💡 日志记录小贴士**
>
> 我们推荐使用 `logger = get_logger("...")` 的方式来获取日志记录器。
> - **参数**: `get_logger` 的参数是日志记录器的名字，它会显示在控制台的日志输出中。
> - **命名**: 你可以为它指定**任何名字**，但我们强烈建议使用**插件的名称** (例如 `"hello_world_plugin"`)。这样做的好处是，当你在查看日志时，可以非常清晰地知道这条日志信息是由哪个插件打印的，极大地提高了调试效率。
> - **用法**: `logger.info()` 的效果与 `logging.info()` 类似，但通过我们自定义的 `logger`，系统可以更好地控制日志的格式和输出。

### 2. 添加 Tool (工具)

**功能**：创建一个简单的工具，可以提供一些固定的系统信息。这个工具本身不被调用，仅用于展示结构。

将以下代码添加到 `StartupMessageHandler` 类的下方：

```python
from src.plugin_system import BaseTool, ToolParamType
from typing import Dict, Any

# ... (其他类定义)

class GetSystemInfoTool(BaseTool):
    """一个提供系统信息的示例工具。"""
    name = "get_system_info"
    description = "获取当前系统的模拟版本和状态信息。"
    available_for_llm = True  # 允许被 LLM 发现和使用
    parameters = []  # 这个工具不需要参数

    async def execute(self, function_args: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "name": self.name,
            "content": "系统版本: 1.0.1, 状态: 运行正常"
        }
```

- `BaseTool`: 所有工具的父类。
- `name`, `description`, `parameters`: 这三者定义了工具的“签名”，LLM 会根据这些信息来决定是否以及如何使用它。

### 3. 添加 Command (命令)

**功能**：让用户可以通过输入 `/hello` 来获得一句问候。

这里我们使用更现代的 `PlusCommand`。将以下代码添加到 `GetSystemInfoTool` 类的下方：

```python
from src.plugin_system import (
    PlusCommand,
    CommandArgs,
    ChatType,
    require_permission,
)
from typing import Tuple, Optional

# ... (其他类定义)

class HelloCommand(PlusCommand):
    """一个简单的 /hello 命令。"""
    command_name = "hello"
    command_description = "向机器人发送一个简单的问候。"
    command_aliases = ["hi", "你好"]  # 命令的别名
    chat_type_allow = ChatType.ALL  # 在群聊和私聊中都可用

    # --- 可用范围控制 ---
    # chat_type_allow 控制命令在哪些类型的聊天中可用。
    # - ChatType.ALL: 在群聊和私聊中都可用。
    # - ChatType.GROUP: 仅在群聊中可用。
    # - ChatType.PRIVATE: 仅在私聊中可用。
    chat_type_allow = ChatType.ALL

    @require_permission("hello_world_plugin.can_say_hello", "你没有权限说 hello！") # 使用权限装饰器,检测触发命令的用户有没有hello_world_plugin.can_say_hello权限
    async def execute(self, args: CommandArgs) -> Tuple[bool, Optional[str], bool]:
        await self.send_text("Hello, World! 我是一个由 MoFox-Core 驱动的插件。")
        return True, "成功发送问候", True
```

- `PlusCommand`: 推荐使用的命令基类，无需编写正则表达式。
- `command_name`, `command_aliases`: 定义了用户如何触发这个命令。
- `execute`: 当命令被触发时，这里的代码会被执行。`self.send_text` 是一个方便的内置方法，用于发送文本消息。

### 4. 添加 Action (动作)

**功能**：让机器人有时会“自发地”发送一个随机表情，增加一点趣味性。

将以下代码添加到 `HelloCommand` 类的下方：

```python
from src.plugin_system import BaseAction, ActionActivationType
import random

# ... (其他类定义)

class RandomEmojiAction(BaseAction):
    """一个随机发送表情的动作。"""
    action_name = "random_emoji"
    action_description = "随机发送一个表情符号，增加聊天的趣味性。"
    
    # --- 激活控制 (第一层决策) ---
    activation_type = ActionActivationType.RANDOM
    random_activation_probability = 0.1  # 10% 的概率被激活

    # --- 使用条件 (第二层决策) ---
    action_require = ["当对话气氛轻松时", "可以用来回应简单的情感表达"]
    associated_types = ["text"]

    async def execute(self) -> Tuple[bool, str]:
        emojis = ["😊", "😂", "👍", "🎉", "🤔", "🤖"]
        await self.send_text(random.choice(emojis))
        return True, "成功发送了一个随机表情"
```

- `BaseAction`: 所有动作的父类。
- `activation_type`: 定义了动作如何进入“备选池”。这里使用 `RANDOM`，意味着它有一定概率被考虑。
- `action_require`: 告诉 LLM 在什么情境下**选择**使用这个动作。
- `execute`: 当 LLM 最终决定使用这个动作时，这里的代码会被执行。

### 5. 添加 Prompt (提示词注入)

**功能**：我们希望机器人在回复时，能根据当前的情绪状态，微调自己的语气。

将以下代码添加到 `RandomEmojiAction` 类的下方：

```python
from src.plugin_system import BasePrompt
from src.chat.utils.prompt_params import PromptParameters

# ... (其他类定义)

class MoodBasedPrompt(BasePrompt):
    """根据机器人当前情绪调整语气的Prompt组件。"""
    prompt_name = "mood_based_prompt"
    prompt_description = "根据当前心情微调回复语气。"
    
    # 注入到核心的风格Prompt中
    injection_point = ["s4u_style_prompt", "normal_style_prompt"]

    async def execute(self) -> str:
        # 在实际应用中，我们会从一个情绪管理器中获取当前情绪
        # 这里为了简化，我们随机模拟一个情绪
        moods = ["开心", "平静", "有点小激动"]
        current_mood = random.choice(moods)
        
        return f"请注意：你当前的心情是'{current_mood}'，请在回复中 subtly (巧妙地) 体现出这种感觉。"

```

- `BasePrompt`: 所有提示词注入组件的父类。
- `injection_point`: 定义了这段文本要注入到哪个核心 `Prompt` 中。`s4u_style_prompt` 是负责定义机器人风格的核心 `Prompt` 之一。
- `execute`: 返回的字符串会被拼接到目标 `Prompt` 的最前面，从而影响最终的生成风格。
- 想要了解更多关于 `Prompt` 组件的知识，请阅读[《Prompt组件开发指南》](./prompt-components.md)。

---

## ✅ 步骤三：注册所有组件

现在我们已经定义好了五个组件，最后一步是告诉插件主类它们的存在。

回到 `HelloWorldPlugin` 类，修改 `get_plugin_components` 方法，将所有组件注册进去。

```python
# (修改 HelloWorldPlugin 类)

# ... (所有组件的类定义) ...

@register_plugin
class HelloWorldPlugin(BasePlugin):
    """一个包含四大核心组件的入门示例插件。"""

    # --- 插件基础信息 (保持不变) ---
    plugin_name = "hello_world_plugin"
    enable_plugin = True
    dependencies = []
    python_dependencies = []
    config_file_name = "config.toml"
    config_schema = {}

    def get_plugin_components(self) -> List[Tuple[ComponentInfo, Type]]:
        """注册插件的所有功能组件。"""
        return [
            (StartupMessageHandler.get_handler_info(), StartupMessageHandler),
            (GetSystemInfoTool.get_tool_info(), GetSystemInfoTool),
            (HelloCommand.get_command_info(), HelloCommand),
            (RandomEmojiAction.get_action_info(), RandomEmojiAction),
            (MoodBasedPrompt.get_prompt_info(), MoodBasedPrompt),
        ]
```

- 每个组件都有一个 `get_..._info()` 的类方法，用于获取其元信息。
- 我们将每个组件的元信息和类本身作为一个元组，添加到返回的列表中。

---

## 🎉 恭喜！

你已经成功创建了一个功能完整的 `hello_world` 插件！重启你的 MoFox-Core，你将会：

1.  在控制台看到 "🎉 Hello World 插件已启动，准备就绪！" 的消息。
2.  可以向机器人发送 `/hello` 或 `!你好`，并收到回复。
3.  在与机器人聊天时，偶尔会收到一个随机的表情符号。
4.  虽然 `get_system_info` 工具不会被直接触发，但它已经作为一项能力被注册到了系统中。
5.  机器人的回复风格会根据模拟的“心情”产生微小的变化，这正是 `Prompt` 组件在起作用！

现在，你已经掌握了插件开发的基础。可以尝试修改这个插件，或者创建属于你自己的全新插件了！

---

## 🚀 进阶：让插件更灵活

硬编码的文本不是一个好习惯。让我们学习如何使用配置文件，让你的插件可以由用户自由配置。

### 1. 定义配置 Schema
我们通过在插件主类中定义 `config_schema` 属性，来声明插件所需的配置项。系统会基于这个 schema 自动处理配置的生成和加载。

### 配置工作流

插件配置遵循一个清晰的生命周期：

1.  **定义 Schema**: 开发者在插件代码中通过 `config_schema` 来定义配置的结构、类型和默认值。这是配置的“蓝图”。

2.  **自动生成配置文件**: 当 MoFox-Core 首次加载插件时，它会读取 `config_schema` 并在 `config/plugins/<plugin_name>/config.toml` 路径下生成一个默认的配置文件。

3.  **用户自定义配置**: 用户应仅修改 `config/plugins/` 目录下的 `config.toml` 文件来覆盖默认值。插件代码永远不应修改此文件。这确保了用户配置的持久性和唯一性。

4.  **运行时加载配置**: 在插件内部，通过调用 `self.get_config()` 方法来安全地读取和验证用户配置。此方法返回一个 Pydantic 模型实例，确保了数据的类型安全和完整性。如果用户配置不符合 `config_schema` 定义的格式，系统会记录错误并加载默认值，保证插件的稳定运行。
---


**🚨 重要：你不需要手动创建 `config.toml` 文件！系统会根据你的定义自动生成它。**

修改 `plugin.py` 中的 `HelloWorldPlugin` 类：

```python
# (在 plugin.py 顶部)
from src.plugin_system import ConfigField # 别忘了导入 ConfigField

# ... (其他代码)

@register_plugin
class HelloWorldPlugin(BasePlugin):
    # ... (其他基础信息)
    
    # --- 配置文件定义 ---
    config_schema = {
        "greeting": {
            "message": ConfigField(
                type=str,
                default="这是来自配置文件的问候！👋",
                description="HelloCommand 使用的问候语。"
            ),
        },
    }

    def get_plugin_components(self) -> List[Tuple[ComponentInfo, Type]]:
        # ... (保持不变)
```

- `config_schema` 是一个字典，定义了配置的结构。
- `ConfigField` 用于详细定义每个配置项的类型、默认值和描述。

### 2. 在代码中使用配置

定义好 Schema 后，我们就可以在组件中通过 `self.get_config()` 方法来读取配置值了。

修改 `HelloCommand` 的 `execute` 方法：

```python
class HelloCommand(PlusCommand):
    # ... (基础信息不变)

    async def execute(self, args: CommandArgs) -> Tuple[bool, Optional[str], bool]:
        # 从配置文件读取问候语，如果找不到则使用默认值
        greeting = str(self.get_config("greeting.message", "Hello, World! 我是一个由 MoFox-Core 驱动的插件。"))
        await self.send_text(greeting)
        return True, "成功发送问候", True
```

- `self.get_config("greeting.message", ...)`: 第一个参数是配置的路径（`[greeting]` 下的 `message`），第二个是找不到配置时的默认值。
- 我们用 `str()` 确保最终得到的是一个字符串，以保证类型安全。

### 3. 它是如何工作的？

1.  **首次启动**: 当 MoFox-Core 第一次加载你的插件时，它会检查 `config_schema`。
2.  **生成文件**: 它会在 `config/plugins/hello_world_plugin/` 目录下自动生成一个 `config.toml` 文件，内容如下：
    ```toml
    # hello_world_plugin - 自动生成的配置文件
    # 一个包含四大核心组件和配置功能的入门示例插件。

    # greeting
    [greeting]

    # HelloCommand 使用的问候语。
    message = "这是来自配置文件的问候！👋"
    ```
3.  **用户修改**: 用户可以随时修改这个 `config.toml` 文件中的 `message` 值。
4.  **读取配置**: 下次 `/hello` 命令被触发时，`get_config` 就会读取用户修改后的新值。

现在，你的插件不仅功能完整，而且变得更加灵活和强大了！

### 4. 终极技巧：组件开关与配置版本

我们还可以做得更专业。通过配置文件，我们不仅可以改变文本，甚至可以控制插件的哪些部分需要加载！

#### a. 添加组件开关和版本号

让我们再次升级 `config_schema`，加入组件开关和版本号：

```python
@register_plugin
class HelloWorldPlugin(BasePlugin):
    # ... (基础信息)
    
    config_schema = {
        "meta": {
            "config_version": ConfigField(
                type=int,
                default=1,
                description="配置文件版本，请勿手动修改。"
            ),
        },
        "greeting": {
            "message": ConfigField(
                type=str,
                default="这是来自配置文件的问候！👋",
                description="HelloCommand 使用的问候语。"
            ),
        },
        "components": {
            "hello_command_enabled": ConfigField(
                type=bool,
                default=True,
                description="是否启用 /hello 命令。"
            ),
            "random_emoji_action_enabled": ConfigField(
                type=bool,
                default=True,
                description="是否启用随机表情动作。"
            ),
        }
    }
    # ...
```

- **`[meta]`**: 我们添加了一个 `meta` 表，用于存放元信息，比如 `config_version`。这对于未来管理插件配置的更新非常有帮助。
- **`[components]`**: 在这里，我们为 `HelloCommand` 和 `RandomEmojiAction` 分别添加了一个布尔类型的开关。

#### b. 动态加载组件

最后，也是最关键的一步，修改 `get_plugin_components` 方法，让它在加载组件前先读取配置：

```python
    def get_plugin_components(self) -> List[Tuple[ComponentInfo, Type]]:
        """根据配置文件动态注册插件的功能组件。"""
        components: List[Tuple[ComponentInfo, Type]] = []

        # 总是注册这两个基础组件
        components.append((StartupMessageHandler.get_handler_info(), StartupMessageHandler))
        components.append((GetSystemInfoTool.get_tool_info(), GetSystemInfoTool))

        # 根据配置决定是否注册 HelloCommand
        if self.get_config("components.hello_command_enabled", True):
            components.append((HelloCommand.get_command_info(), HelloCommand))
        
        # 根据配置决定是否注册 RandomEmojiAction
        if self.get_config("components.random_emoji_action_enabled", True):
            components.append((RandomEmojiAction.get_action_info(), RandomEmojiAction))

        return components
```

现在，用户可以直接在 `config.toml` 文件中将 `hello_command_enabled` 设置为 `false`，重启后 `/hello` 命令就会失效，而插件的其他部分（如随机表情）仍然可以正常工作。

这为用户提供了极大的灵活性，也让你的插件变得更加健壮和专业。
