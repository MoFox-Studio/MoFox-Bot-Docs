# 8. 再进一步：引入 Tool

> **导读** Tool 是插件向模型暴露能力的专用通道。本章从一个最小的文本格式化工具出发，介绍 `BaseTool` 的写法、命名规范和参数描述习惯，并在最后系统梳理 `BaseTool` 的所有属性与方法。理解 Tool 和 Service 的职责差异，是插件真正进入智能对话链路的基础。

到了这里，我们的 `echo_demo` 已经不只是一个“能跑起来”的插件了。

它现在有：

- Command，负责接住用户输入。
- Service，负责承载可复用能力。
- Config，负责控制插件行为。

如果继续沿着这条线往前走，很自然就会遇到下一个组件：**Tool**。

很多人第一次听到 Tool，会下意识把它理解成“另一种 Service”或者“能被调用的方法集合”。这种理解不算完全错，但会有点太粗。因为 Tool 真正特别的地方，不在于它也能做事，而在于：

> **它是面向模型调用语境设计出来的能力组件。**

这一章先不把 Tool 拉进复杂对话流程，也不涉及 MCP、Agent、Chatter 那些更重的上下文。先只做一件事：

> **给 `echo_demo` 写出第一个真正的 Tool。**

这样你会先把 Tool 的写法、命名方式和参数描述习惯建立起来。后面再把它放进更复杂的调用链里，理解会轻松很多。

## 8.1 Tool 的定位：面向模型调用的能力接口

如果对 Tool 目前还有点抽象，可以先这样理解：

- **Service** 更像插件内部或插件间复用的能力。
- **Tool** 更像插件暴露给模型使用的能力接口。

这两者都可以承载“能力”，但它们服务的调用场景不完全一样。

Service 更偏向：

- 我写代码时要复用它。
- 其他插件也可能调用它。
- 它是程序化能力接口。

Tool 更偏向：

- 模型在运行时可能会选择调用它。
- 它需要清楚描述“自己叫什么、能干什么、参数是什么”。
- 它天然会更在意 schema 和参数语义。

所以 Tool 的重点并不只是“写一个 `execute()` 方法”，而是“把一项能力描述成适合被模型理解和调用的形式”。

## 8.2 这一章我们做什么 Tool

为了保持主线稳定，我们还是继续沿用 `echo_demo`。

这一章给它加一个很小的 Tool：`echo_formatter`。

这个 Tool 做的事情也很简单：

- 输入一段文本。
- 再输入一个格式模式。
- 返回格式化后的文本。

比如：

- `upper`：转成大写
- `lower`：转成小写
- `title`：转成标题格式

这个例子有几个好处：

- 它足够简单，不会让注意力跑到业务细节上。
- 它比单纯“再 echo 一次”更像一个独立能力。
- 它能很自然地体现 Tool 的参数描述意义。

## 8.3 先新增一个 tool.py

在 `echo_demo` 目录里新增一个 `tool.py`：

```python
from __future__ import annotations

from typing import Annotated

from src.app.plugin_system.base import BaseTool


class EchoFormatterTool(BaseTool):
    """对文本做简单格式化。"""

    tool_name = "echo_formatter"
    tool_description = "对输入文本进行简单格式化，例如转大写、转小写或标题格式化"

    async def execute(
        self,
        text: Annotated[str, "需要处理的原始文本"],
        mode: Annotated[str, "格式模式，可选值为 upper、lower、title"],
    ) -> tuple[bool, str]:
        """格式化文本并返回结果。"""
        normalized_mode = mode.strip().lower()

        if normalized_mode == "upper":
            return True, text.upper()

        if normalized_mode == "lower":
            return True, text.lower()

        if normalized_mode == "title":
            return True, text.title()

        return False, f"不支持的格式模式: {mode}"
```

先把注意力放在这段代码本身。Tool 的第一眼印象，就藏在这里了。

## 8.4 Tool 最核心的三个字段

写一个 Tool，最先需要明确的通常有三个点：

### **1. tool_name**

```python
tool_name = "echo_formatter"
```

这不是普通的内部变量名，而是这个 Tool 在系统中的公开名称之一。

后面无论是 schema 生成，还是模型侧看到的工具名称，都会和它有关。所以它最好：

- 语义清晰。
- 不要太模糊。
- 尽量一眼就知道这东西是干什么的。

### **2. tool_description**

```python
tool_description = "对输入文本进行简单格式化，例如转大写、转小写或标题格式化"
```

这个描述不是凑字数的。对于 Tool 来说，它的意义比一般注释更实际。因为 Tool 天然是要“被理解后再使用”的能力组件。

如果名字像标题，那描述就像简短说明书。

### **3. execute()**

这是 Tool 真正执行能力的入口。

但和普通函数不太一样的是，Tool 的 `execute()` 不只是“把事情做了”，它还需要尽量把参数说清楚，让系统和后续调用方知道：

- 这个 Tool 需要什么输入。
- 每个输入是什么意思。
- 返回结果大概长什么样。

所以 Tool 的 `execute()` 往往会比普通内部函数更强调参数语义。

## 8.5 为什么这里用了 Annotated

你应该已经注意到了，我们这里没有只写：

```python
text: str
mode: str
```

而是写成了：

```python
text: Annotated[str, "需要处理的原始文本"]
mode: Annotated[str, "格式模式，可选值为 upper、lower、title"]
```

这不是花哨写法，而是 Tool 非常重要的一个习惯。

因为 Tool 不只是给人看代码时用，它还要被系统进一步理解成可调用能力。参数如果只有类型，没有语义说明，很多时候是不够的。

你可以先把 `Annotated` 理解成这样：

> **类型说明这是个什么值，附带描述说明这个值是拿来干什么的。**

对于 Tool 来说，这类额外说明尤其有价值。因为一个好的 Tool 参数描述，会直接影响它后续是不是容易被正确使用。

## 8.6 为什么 Tool 返回 `(bool, str)`

在这个例子里，我们返回的是：

```python
tuple[bool, str]
```

也就是：

- `True` 表示执行成功
- `False` 表示执行失败
- 第二个值则是结果或错误信息

这和前面很多组件的基本返回风格是一致的，所以读者不会突然切换思维模式。

当然，Tool 也可以返回字典等结构化结果，但在入门阶段，先用字符串结果最直观。因为现在这章的重点不是返回结构设计，而是先把 Tool 的定义方式讲清楚。

## 8.7 现在把 Tool 注册进插件

有了 `EchoFormatterTool` 之后，别忘了插件类还需要把它交给系统。

这意味着 `plugin.py` 里要继续补一处：

```python
from __future__ import annotations

from src.app.plugin_system.base import BaseCommand, BasePlugin, cmd_route, register_plugin

from .config import EchoDemoConfig
from .service import EchoService
from .tool import EchoFormatterTool


class EchoCommand(BaseCommand):
    ...


@register_plugin
class EchoDemoPlugin(BasePlugin):
    ...

    def get_components(self) -> list[type]:
        if isinstance(self.config, EchoDemoConfig) and not self.config.plugin.enabled:
            return []
        return [EchoCommand, EchoService, EchoFormatterTool]
```

这里最重要的不是“多写了一个类名”，而是要继续记住那个老原则：

> **组件只有被插件明确返回，系统才会正式注册它。**

Tool 也不例外。

## 8.8 那么这个 Tool 和前一章的 Service 到底差在哪

这是这一章最容易让人混淆的地方。

因为从表面上看，`EchoService` 和 `EchoFormatterTool` 都是在提供某种文本处理能力，它们好像只是包装方式不一样。

但如果你把注意力放在“它服务谁”，差异就会非常明显：

### EchoService 更像

- 插件内部复用能力
- 程序化能力接口
- 给命令、给别的组件、给后续高层 API 使用

### EchoFormatterTool 更像

- 对话系统可调用能力
- 需要被理解的工具接口
- 面向模型使用语境的能力封装

所以它们都可以处理文本，但它们的“对外身份”不同。

这也是为什么前面一直强调：**不要把 Tool 理解成“换个名字的 Service”。**

## 8.9 这一章先不让 Command 直接调 Tool

这里我想故意按住一下节奏。

你可能会自然想到：

> 既然 Tool 已经有了，是不是可以让 `/echo say` 去调用它？

从纯代码层面看，当然不是完全不行。但从教学节奏和职责边界上说，现在先不这么做更好。

因为这一章更想帮你建立的是：

- Tool 是什么。
- Tool 的接口该怎么写。
- Tool 和 Service 的定位为什么不同。

如果现在就把 Command、Service、Tool 三者强行串成一团，读者很容易只记住“反正都是组件互相调用”，却没真正理解三者为什么要分开。

所以这一章先把 Tool 定义清楚，让它作为一个正式组件进入系统。后面等进入更完整的对话和智能能力链路时，你会更自然地看到它真正发力的场景。

## 8.10 为什么 Tool 会比 Service 更在意“描述能力”

这一点值得单独说一下。

如果你回头看 Service，通常我们最关心的是：

- 能不能复用。
- 逻辑是否稳定。
- 接口是否适合程序调用。

而 Tool 则会额外多一层要求：

- 名字是否足够清晰。
- 描述是否足够明确。
- 参数语义是否足够具体。

这其实是在提前训练一种很重要的习惯：

> **当你写 Tool 时，不只是写给自己未来看，也是在写给“调用它的系统语境”看。**

哪怕我们这一章还没有把它完整拉进对话链，这个写法习惯也值得一开始就建立起来。

> **提示**
>
> 相比 Service，Tool 目前对插件作者暴露的高层查询/调用入口还没有那么完整地收敛到一层简单 API 上。所以这一章先重点理解 Tool 的定位和写法，而不是过早把注意力放在它的所有运行时调用细节上。

## 8.11 到这里，echo_demo 已经开始像一个真正的插件组装体了

如果你现在回头看 `echo_demo`，它已经开始慢慢长出不同层次的组件了：

- Command：接住用户命令。
- Service：承载可复用能力。
- Tool：提供适合被模型调用的能力接口。
- Config：控制插件启用与行为边界。

这时候它和最开始那个“把所有东西写在一个文件里”的最小样例相比，已经不只是代码量不同，而是开始出现真正的职责分层了。

这也是为什么我一直不建议把多组件理解成“组件越多越高级”。重点从来不在于数量，而在于：

> **每个组件是不是在负责一种清楚的事情。**

## 8.13 `BaseTool` 基类速查

### 类属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tool_name` | `str` | `""` | 工具名称，如 `"echo_formatter"`，影响 schema 生成和模型侧工具名 |
| `tool_description` | `str` | `""` | 工具描述，直接暴露给模型，影响调用时机判断 |
| `chatter_allow` | `list[str]` | `[]` | 允许调用此工具的 Chatter 列表，空列表表示所有 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 支持的聊天类型 |
| `associated_platforms` | `list[str]` | `[]` | 关联的平台列表 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖，填写组件签名字符串 |

### 主要方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `execute()` | `async, *args, **kwargs → tuple[bool, str\|dict]` | **抽象方法**，必须实现。参数应使用 `Annotated[type, "描述"]` 注解以便 schema 正确生成 |
| `to_schema()` | `cls → dict[str, Any]` | 基于 `execute()` 签名和 `Annotated` 注解，自动生成 OpenAI Tool Calling 格式的 schema |
| `get_signature()` | `cls → str \| None` | 返回 `plugin_name:tool:tool_name` 格式的签名 |

### `Annotated` 参数描述约定

Tool 的 `execute()` 参数推荐统一使用 `Annotated` 附加描述：

```python
from typing import Annotated

async def execute(
    self,
    text: Annotated[str, "需要处理的原始文本"],
    mode: Annotated[str, "格式模式，可选值为 upper、lower、title"],
) -> tuple[bool, str]:
    ...
```

`to_schema()` 会自动读取这些描述，生成 LLM 能理解的参数文档。省略描述不会报错，但会显著降低模型选择工具时的准确率。

### 返回值约定

```python
# 成功
return True, "格式化结果文本"
# 失败
return False, "错误描述"
# 结构化结果（也支持）
return True, {"key": "value"}
```


## 8.14 这一章压缩成一句话

如果要把这一章压缩成一句最值得带走的话，那就是：

> **Tool 是把能力写成“适合被模型理解和调用”的形式，它和 Service 一样承载能力，但服务的调用语境并不相同。**

下一步，我们就继续把这条线往前推。到后面更复杂的章节里，你会开始真正看到：当 Tool、Service、Prompt、LLM 一起出现时，插件为什么会从“功能脚本”逐渐变成“能力系统”。