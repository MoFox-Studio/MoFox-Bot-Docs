# ⚡ Chatter 组件详解

## 📖 什么是 Chatter

Chatter 是 MoFox_Bot 中用于实现主动式对话（Proactive Chat）的智能组件。与被动响应用户指令的 Action 不同，Chatter 会持续分析对话流，并在满足特定条件时自主触发，让机器人能够发起互动、引导话题或在适当时机介入对话。

### Chatter 的特点

- **主动触发**：无需用户明确调用，能根据对话上下文自主执行。
- **情境感知**：通过分析完整的对话历史（`StreamContext`）来决定是否激活。
- **专注对话流**：每个 Chatter 实例都与一个特定的对话流（`stream_id`）绑定。
- **高度灵活**：可以与 `ActionManager` 结合，执行发送消息、调用工具等复杂操作。


## 🎯 Chatter 组件的基本结构

所有 Chatter 组件都必须继承自 `BaseChatter` 类，并实现其核心属性和方法。

```python
from src.plugin_system.base.base_chatter import BaseChatter
from src.common.data_models.message_manager_data_model import StreamContext
from src.plugin_system.base.component_types import ChatType
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.chat.planner_actions.action_manager import ChatterActionManager

class MyChatter(BaseChatter):
    # Chatter 的唯一标识符
    chatter_name: str = "my_chatter"
    # Chatter 功能的简短描述
    chatter_description: str = "这是一个示例 Chatter。"
    # 允许运行的聊天类型（私聊、群聊）
    chat_types: list[ChatType] = [ChatType.PRIVATE, ChatType.GROUP]

    def __init__(self, stream_id: str, action_manager: "ChatterActionManager"):
        super().__init__(stream_id, action_manager)
        # 在这里可以进行一些初始化设置

    async def execute(self, context: StreamContext) -> dict:
        """
        执行 Chatter 的核心逻辑。
        """
        # 分析 context，决定是否执行操作
        print(f"Executing {self.chatter_name} for stream {self.stream_id}")
        
        # 返回执行结果
        return   {
            "success": true,
            "stream_id": self.stream_id,
            "plan_created": true,
            "actions_count": 1,
            "has_target_message": true,
            "unread_messages_processed": 1
        }

```

### 核心属性详解

- **`chatter_name` (str)**: Chatter 的唯一名称，用于在系统中注册和识别。
- **`chatter_description` (str)**: 对 Chatter 功能的描述，帮助理解其用途。
- **`chat_types` (list[ChatType])**: 一个列表，定义了此 Chatter 可以在哪些类型的对话中运行（`ChatType.PRIVATE` 或 `ChatType.GROUP`）。

---

## 🚀 `execute` 方法

`execute` 是 Chatter 的核心，包含了所有的业务逻辑。它在每次对话更新时被调用。

- **`context: StreamContext`**: `execute` 方法接收一个 `StreamContext` 对象作为参数。该对象封装了当前对话流的所有信息，包括：
    - 历史消息记录
    - 参与者信息
    - 对话元数据
    - 更详细的信息请参考 src/common/data_models/message_manager_data_model.py。
- **返回值 (dict)**: `execute` 方法必须返回一个字典，用于向上层报告其执行状态。一个结构良好的返回值对于调试和系统监控至关重要。

  **成功时的返回值结构:**
  ```json
  {
      "success": true,
      "stream_id": self.stream_id,
      "plan_created": true,
      "actions_count": 1,
      "has_target_message": true,
      "unread_messages_processed": 1
  }
  ```

  **失败时的返回值结构:**
  ```json
  {
      "success": false,
      "stream_id": self.stream_id,
      "error_message": "...",
      "executed_count": 0
  }
  ```
  - **`success` (bool)**: 标记执行是否成功。
  - **`stream_id` (str)**: 当前的流ID。
  - **`error_message` (str, optional)**: 如果执行失败，提供错误信息。
  - 其他字段可以根据 Chatter 的具体逻辑自定义，以提供更丰富的上下文信息。

---

## 💡 完整示例：`GreetingChatter`

下面是一个完整的示例，展示了如何创建一个在检测到问候语时触发的 Chatter。

**`greeting_chatter.py`**
```python
from src.plugin_system.base.base_chatter import BaseChatter
from src.common.data_models.message_manager_data_model import StreamContext
from src.plugin_system.base.component_types import ChatType
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.chat.planner_actions.action_manager import ChatterActionManager


class GreetingChatter(BaseChatter):
    chatter_name: str = "greeting_chatter"
    chatter_description: str = "一个简单的示例 Chatter，用于响应问候语。"
    chat_types: list[ChatType] = [ChatType.PRIVATE, ChatType.GROUP]

    def __init__(self, stream_id: str, action_manager: "ChatterActionManager"):
        super().__init__(stream_id, action_manager)
        self.greeting_keywords = ["你好", "hello", "hi", "嗨"]

    async def execute(self, context: StreamContext) -> dict:
        """
        如果检测到问候语，则执行此 Chatter。
        """
        last_message = context.get_last_message()
        if not last_message or not last_message.text:
            return {
                "success": True,
                "stream_id": self.stream_id,
                "message": "Skipped: No text in last message"
            }

        if any(keyword in last_message.text for keyword in self.greeting_keywords):
            # 在这里，您可以调用执行具体的操作
            print(f"GreetingChatter executed for stream: {self.stream_id}")
            return {
                "success": True,
                "stream_id": self.stream_id,
                "plan_created": True,
                "actions_count": 1, # 假设我们执行了一个动作
                "message": "Greeting detected and action planned.",
                "has_target_message": true,
                "unread_messages_processed": 1
            }

        return {
            "success": false,
            "stream_id": self.stream_id,
            "error_message": "...",
            "executed_count": 0
        }
```

### 逻辑解释

1.  **初始化**: `__init__` 方法中定义了一个问候语关键词列表 `greeting_keywords`。
2.  **获取最新消息**: `execute` 方法首先通过 `context.get_last_message()` 获取对话流中的最后一条消息。
3.  **条件检查**: 它检查消息是否存在且包含文本。
4.  **关键词匹配**: 使用 `any()` 和列表推导式，判断消息文本是否包含任何一个问候语关键词。
5.  **执行与返回**:
    - 如果匹配成功，它会打印一条日志并返回 `executed` 状态。在实际应用中，这里可以调用 `self.action_manager` 来发送回复。
    - 如果不匹配或消息无效，则返回 `skipped` 状态。

---

## 🔧 Chatter 的内置属性和方法

### 属性

- **`self.stream_id` (str)**: 当前 Chatter 实例绑定的对话流 ID。
- **`self.action_manager` (ChatterActionManager)**: 一个强大的管理器，允许 Chatter 执行各种操作，例如发送消息、调用工具等。

### 类方法

- **`get_chatter_info() -> ChatterInfo`**: 一个类方法，它会自动从类属性（`chatter_name`, `chatter_description` 等）生成一个 `ChatterInfo` 对象，用于在系统中注册和展示 Chatter。

---

## 📚 高级示例与进一步学习

本文档中的 `GreetingChatter` 提供了一个 Chatter 组件的基础入门。对于更复杂、更贴近生产环境的用例，我们强烈建议您深入研究 `AffinityChatter` 的源代码。

- **文件路径**: `src/plugins/built_in/affinity_flow_chatter/affinity_chatter.py`

通过分析 `AffinityChatter`，您可以学习到：
- 如何与规划器（Planner）集成，动态生成动作。
- 如何管理和更新 Chatter 的内部状态与统计数据。
- 更复杂的错误处理和日志记录策略。