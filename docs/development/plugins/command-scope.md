# 🎯 控制插件的可用范围

在开发 MoFox_Bot 插件时，精确控制每个组件（尤其是命令）在何处生效是至关重要的。你可以决定一个命令是只能在群聊中使用，还是只能由私聊触发，或者两者皆可。

这主要通过在组件类中设置 `chat_type_allow` 属性来实现。

## `chat_type_allow` 属性详解

`chat_type_allow` 属性接收一个 `ChatType` 枚举值，该枚举定义了三种可用范围：

-   `ChatType.ALL`: **通用** - 组件在**群聊**和**私聊**中都可用。
-   `ChatType.GROUP`: **仅群聊** - 组件只能在群聊中被触发或激活。
-   `ChatType.PRIVATE`: **仅私聊** - 组件只能在与机器人的私聊中被触发或激活。


## 示例：创建一个仅限群聊的命令

假设我们要创建一个 `/roll` 命令，用于在群聊中投骰子。这个命令在私聊中没有意义，所以我们希望禁用它。

```python
from src.plugin_system import PlusCommand, CommandArgs, ChatType
from typing import Tuple, Optional
import random

class RollDiceCommand(PlusCommand):
    """一个仅在群聊中可用的投骰子命令。"""
    
    command_name = "roll"
    command_description = "投一个 1 到 100 之间的骰子。"
    
    # --- 关键设置 ---
    # 将可用范围设置为仅群聊
    chat_type_allow = ChatType.GROUP

    async def execute(self, args: CommandArgs) -> Tuple[bool, Optional[str], bool]:
        # args.sender_name 包含了发送者的昵称
        sender = args.sender_name or "一位冒险者"
        result = random.randint(1, 100)
        
        # self.send_text 会在命令被触发的聊天窗口中回复消息
        await self.send_text(f"🎲 {sender} 投出了 {result} 点！")
        
        return True, "成功投掷骰子", True
```

**工作原理**:

-   当用户在**群聊**中发送 `/roll` 时，`RollDiceCommand` 会被成功触发。
-   如果用户在与机器人的**私聊**中发送 `/roll`，命令处理器会直接忽略它，因为它不满足 `chat_type_allow = ChatType.GROUP` 的条件。

## 示例：创建一个仅限私聊的管理命令

现在，我们来创建一个 `/set_master` 命令，用于设置机器人的管理员。这类敏感操作显然只应该在私聊中进行。

```python
from src.plugin_system import PlusCommand, CommandArgs, ChatType
from typing import Tuple, Optional

class SetMasterCommand(PlusCommand):
    """一个仅在私聊中可用的管理员设置命令。"""
    
    command_name = "set_master"
    command_description = "将某个用户设置为机器人管理员。"
    
    # --- 关键设置 ---
    # 将可用范围设置为仅私聊
    chat_type_allow = ChatType.PRIVATE

    async def execute(self, args: CommandArgs) -> Tuple[bool, Optional[str], bool]:
        # 在真实场景中，这里会有权限校验和更复杂的逻辑
        target_user = args.command_text # 获取命令后的文本，例如 /set_master 12345
        
        if not target_user:
            await self.send_text("请指定要设置为管理员的用户 ID。")
            return False, "缺少参数", True

        # ... 执行设置管理员的逻辑 ...
        
        await self.send_text(f"✅ 已成功将用户 {target_user} 设置为管理员。")
        
        return True, "成功设置管理员", True
```

**工作原理**:

-   用户必须**私聊**机器人并发送 `/set_master 12345` 才能触发此命令。
-   在任何**群聊**中发送此命令都将是无效的。

## 何时使用 `ChatType.ALL`？

`ChatType.ALL` 是最常见的设置，适用于那些在任何聊天场景下都有意义的功能。例如，一个查询天气、讲笑话或者像我们快速入门指南中的 `/hello` 命令，无论是在群聊中活跃气氛，还是在私聊中进行互动，都是合适的。

```python
class HelloCommand(PlusCommand):
    """一个简单的问候命令，随处可用。"""
    command_name = "hello"
    command_description = "向机器人发送一个简单的问候。"
    
    # --- 关键设置 ---
    # 在群聊和私聊中都可用
    chat_type_allow = ChatType.ALL

    async def execute(self, args: CommandArgs) -> Tuple[bool, Optional[str], bool]:
        await self.send_text("Hello, World!")
        return True, "成功发送问候", True
```

通过灵活运用 `chat_type_allow`，你可以设计出行为得体、功能边界清晰的强大插件。

---

## 扩展到 Action (动作)

`chat_type_allow` 属性不仅限于 `Command`，它同样可以应用于 `Action`，用于控制 Action 的触发环境。

### 示例：创建一个只在群聊中发送的提醒 Action

假设我们想让机器人在群聊中偶尔提醒大家“不要发送不和谐内容”。这个功能在私聊中显然是不需要的。

```python
from src.plugin_system import BaseAction, ActionActivationType, ChatType
from typing import Tuple
import random

class GroupReminderAction(BaseAction):
    """一个只在群聊中随机发送提醒的动作。"""
    
    action_name = "group_reminder"
    action_description = "在群聊中随机发送一条和谐友善的提醒。"
    
    # --- 激活控制 ---
    activation_type = ActionActivationType.RANDOM
    random_activation_probability = 0.05  # 5% 的概率被激活
    
    # --- 关键设置 ---
    # 将可用范围设置为仅群聊
    chat_type_allow = ChatType.GROUP

    async def execute(self) -> Tuple[bool, str]:
        reminders = [
            "提醒一下，请大家保持友善交流哦～",
            "构建和谐社区，从你我做起！",
            "今天也要元气满满地聊天呀！"
        ]
        await self.send_text(random.choice(reminders))
        return True, "成功发送了一条群聊提醒"

```

**工作原理**:

-   这个 `GroupReminderAction` 只有在**群聊**消息的上下文中才可能被激活。
-   在**私聊**中，无论对话如何进行，这个 Action 都不会进入备选池，因为它不满足 `chat_type_allow = ChatType.GROUP` 的条件。

通过这种方式，你可以为不同场景设计出更具针对性的自动化行为，让你的机器人更加智能和得体。