# 13. 用 Agent 编排工具组：把复杂任务关进一个更小、更省 token 的工作流里

> **导读** 本章介绍 Agent 的定位与用法：当 Tool 数量增多、调用逻辑开始复杂时，Agent 可以把一组相关 Tool 收束进一个私有工作流，对外只暴露一个更高层的调用入口。本章将展示如何定义 Agent、如何在内部编排 usables、如何用独立 LLMRequest 隔离上下文，以及 Agent 与 Tool 的职责边界在哪里。最后提供 `BaseAgent` 基类速查。

前一章我们拆了 `default_chatter` 的 `enhanced` 状态机，目的是让你理解“标准上下文”为什么要严格闭合。

在此基础上，可以进一步考虑更高层的能力编排了。

当插件里只有一两个 Tool 时，主模型直接调用它们，通常已经够用。

但当 Tool 开始变多，问题就会慢慢冒出来：

- 主模型要面对越来越长的工具清单。
- 每个 Tool 的描述、参数 schema 都会占上下文。
- 一些任务其实是“先判断，再多步调用，再汇总”，不适合直接塞给主对话链。
- 你只是想做一个局部子任务，却要把整个聊天上下文都拖进来，token 消耗会越来越重。

这时候，Agent 的价值就出来了。

这一章要讲的不是“Agent 很高级”，而是更务实的一句话：

> **当 Tool 多到需要编排时，Agent 可以把这组能力关进一个更小的工作流里，既提升工具利用率，也隔离上下文，避免主回复模型白白吃掉太多 token。**

这一章继续沿用 `echo_demo`，但定位会和前几章不一样。

前面我们是在做：

- 一个 Tool
- 一次 tool call
- 一条 follow-up 链

这一章开始做的是：

- 一组 Tool
- 一个 Agent 负责内部编排
- 主模型只看到一个更高层的能力入口

## 13.1 先把 Tool 和 Agent 的边界说清楚

这一章如果不先讲边界，后面会很容易越写越糊。

### Tool 更像“单步能力”

Tool 最适合解决的是这种问题：

- 我已经知道要做什么。
- 我只差执行一个明确动作。
- 参数也比较清楚。

比如：

- 把文本转成标题格式
- 查询某条记录
- 发送一条消息

这种时候，一个 Tool 就够了。

### Agent 更像“任务编排者”

Agent 适合解决的是另一类问题：

- 任务目标是明确的，但执行路径未必固定。
- 可能要在多个 Tool 之间做选择。
- 可能要多轮决策、分步调用，再汇总结论。
- 你不希望主聊天模型直接暴露全部细节能力。

也就是说：

> **Tool 解决“做这一步”，Agent 解决“为了完成这个子任务，应该怎么组织这几步”。**

这也是为什么在当前实现里，`BaseAgent` 本身也是一种 `LLMUsable`。对主模型来说，它看起来像一个更高层的可调用能力；但进入 Agent 内部以后，它又会自己调度那组私有 usables。

## 13.2 为什么 Tool 多了以后，直接全挂给主模型不是最好选择

从功能上说，当然可以。

如果你愿意，你完全可以把十几个 Tool 全都直接暴露给主模型。

但这样做通常会越来越难控，原因不神秘，主要就三点。

### 第一，工具面板会越来越宽

每多一个 Tool，就多一份 schema、多一份描述、多一组参数定义。

当工具数量上来之后，主模型在每轮对话里都得先理解：

- 现在有哪些能力可用
- 它们之间差别是什么
- 当前任务到底该选哪一个

这会直接拉高上下文负担。

### 第二，很多局部任务并不值得带着整段主聊天历史去推理

比如“把这段内容整理成更合适的回复格式”这种事，本质上是个局部子任务。

如果你把它放在主对话链里处理，模型拿到的通常是：

- 系统提示词
- 历史对话
- 新用户消息
- 一长串工具能力

但其实这个子任务真正需要的，往往只是：

- 一段输入文本
- 一个目标风格
- 几个专门处理文本的小工具

把大上下文直接拖进来，很多 token 都是白花的。

### 第三，主模型不一定最适合承担细粒度工具编排

主模型更适合做面向用户的总体回应。

而“在几个局部工具之间来回试探、挑选、补一步再收口”这种事情，往往更适合交给一个更窄、更专门的子工作流。

这就是 Agent 的位置。

## 13.3 当前实现里的 Agent，核心不是“更强”，而是“更收束”

这点特别值得记住。

很多系统会把 Agent 讲成“比 Tool 更高级的万能能力”。

但在 Neo-MoFox 这套实现里，`BaseAgent` 最有价值的地方，恰恰不是它能接触更多东西，而是它被限制得更明确。

你可以先抓住两个事实。

### 第一，Agent 有自己专属的 `usables`

`BaseAgent` 上有一个类属性：

```python
usables = []
```

这里放的不是“全局所有工具”，而是：

> **这个 Agent 被允许调用的那一小组私有能力。**

它们可以是：

- `BaseTool` 子类
- `BaseAction` 子类
- 甚至另一个 `BaseAgent` 子类
- 或这些组件的签名字符串

### 第二，Agent 内部执行私有 usable 时，只在这组局部能力里查找

当前 `execute_local_usable()` 的行为很明确：

- 先解析 `self.get_local_usables()`
- 再只在这组 usables 里做名称匹配
- 然后执行匹配到的 Tool / Action / Agent

也就是说：

> **Agent 的内部编排范围，是它自己声明出来的那一小块能力域，而不是整个全局注册表。**

这就是“能力收束”的关键。

## 13.4 所谓“上下文隔离”，在这里具体隔离了什么

这是你这章特别点名要讲的重点，我先把它讲得具体一点。

当我们说 Agent 可以“隔离上下文”，不是说它 magically 开了一个平行宇宙，而是说：

> **Agent 往往会自己新建一条独立的 LLMRequest，把主任务压缩成一个更小的输入，再只给它自己的私有 usables。**

这件事在 `BaseAgent.create_llm_request()` 里是有明确支撑的。

你可以在 Agent 内部自己创建请求：

```python
request = self.create_llm_request(
    model_set=model_set,
    request_name="echo_agent_internal",
    with_usables=True,
)
```

这里的关键点有两个。

### 一，它是独立 request

这意味着 Agent 内部可以自己决定：

- 要不要带历史
- system prompt 长什么样
- USER 输入压缩成什么形式
- 要不要多轮 follow-up

它不是被动复用主聊天链里那一长串上下文。

### 二，`with_usables=True` 注入的是 Agent 私有 usables

不是全局工具池，而是：

```python
self.get_local_usables()
```

所以 Agent 内部模型看到的能力面，是被刻意缩小过的。

这就是为什么它既能做编排，又能控制 token 成本。

## 13.5 “省 token”不是魔法，而是靠缩小任务面

很多人一听“隔离上下文、节省 token”，容易把它理解成某种自动优化黑科技。

其实没有那么玄。

Agent 省 token，靠的通常就是三件非常朴素的事：

1. 不把整段主聊天历史直接拖进内部子任务。
2. 不把所有全局 Tool 都暴露给内部模型。
3. 把局部子任务压缩成一段结构化输入，再让内部模型只解决这一件事。

这跟你手工写 prompt 时会做的“问题缩写”其实是同一种思路，只不过 Agent 把它做成了一套正式的工作流。

## 13.6 继续沿用 `echo_demo`，这次我们不只给它一个 Tool，而是一组 Tool

要讲 Agent，最好的方式不是空讲概念，而是把前面做过的 `echo_demo` 往前推一格。

这一章里，你可以把它想成有这样一组文本处理能力：

- `EchoFormatterTool`：负责大小写、标题格式之类的变换
- `EchoToneTool`：负责把语气改成更自然、更礼貌或更简洁
- `EchoSummaryTool`：负责把长文本压缩成更短版本

这些 Tool 单独都不复杂。

但一旦用户需求变成：

> “帮我把这段话整理成一个适合直接发出去的短回复。”

这就不再是“调用某一个 Tool 就完事”的问题了。

它更像：

- 要不要先压缩
- 要不要再润色语气
- 最后要不要再做一次格式整理

这就是 Agent 更合适接手的地方。

## 13.7 一个最小的 `EchoPolishAgent` 可以长什么样

这一章先不追求做一个很重的子系统，我们只做一个最小可理解版本。

```python
from __future__ import annotations

from typing import Annotated

from src.app.plugin_system.api import llm_api
from src.app.plugin_system.base import BaseAgent
from src.app.plugin_system.types import LLMPayload, ROLE, TaskType, Text, ToolResult

from .tool import EchoFormatterTool, EchoSummaryTool, EchoToneTool


class EchoPolishAgent(BaseAgent):
    """负责在多个文本工具之间做内部编排。"""

    agent_name = "echo_polish"
    agent_description = "把一段原始文本整理成可直接发送的简洁回复"

    usables = [
        EchoFormatterTool,
        EchoToneTool,
        EchoSummaryTool,
    ]

    async def execute(
        self,
        task: Annotated[str, "需要整理的原始文本"],
        target_style: Annotated[str, "目标风格，例如 concise、polite、title"] = "concise",
    ) -> tuple[bool, str]:
        """执行一个内部多步整理任务。"""
        model_set = llm_api.get_model_set_by_task(TaskType.TOOL_USE.value)
        request = self.create_llm_request(
            model_set=model_set,
            request_name="echo_polish_agent_internal",
            with_usables=True,
        )

        request.add_payload(
            LLMPayload(
                ROLE.SYSTEM,
                Text(
                    "你是 echo_demo 的文本整理代理。"
                    "你可以根据任务需要，在 summary / tone / formatter 之间选择合适步骤。"
                    "不要暴露中间过程，只返回最终整理结果。"
                ),
            )
        )
        request.add_payload(
            LLMPayload(
                ROLE.USER,
                Text(
                    f"task={task}\n"
                    f"target_style={target_style}\n"
                    "请按需调用工具，最终输出可直接发送给用户的文本。"
                ),
            )
        )

        response = await request.send(stream=False)
        await response

        for _ in range(4):
            calls = response.call_list or []
            if not calls:
                final_text = (response.message or "").strip()
                return bool(final_text), final_text

            for call in calls:
                call_args = call.args if isinstance(call.args, dict) else {}
                success, result = await self.execute_local_usable(
                    usable_name=call.name,
                    **call_args,
                )
                response.add_payload(
                    LLMPayload(
                        ROLE.TOOL_RESULT,
                        ToolResult(
                            value=result,
                            call_id=call.id,
                            name=call.name,
                        ),
                    )
                )

            response = await response.send(stream=False)
            await response

        return False, "Agent 在限定步数内没有完成整理"
```

这段代码虽然看起来长了一点，但如果你已经看过前面的 Tool + LLM 章节，其实不会陌生。

它的新增点主要只有两个：

- 能力入口从 Tool 变成了 Agent
- Tool 的暴露和执行都被关进了 Agent 内部

## 13.8 这里最关键的一行，其实是 `usables = [...]`

如果只挑一行最值得你盯住的代码，那就是：

```python
usables = [
    EchoFormatterTool,
    EchoToneTool,
    EchoSummaryTool,
]
```

因为这行代码直接定义了 Agent 的能力边界。

它等于在说：

- 这个 Agent 能做什么
- 它不能做什么
- 内部 LLM 最多能编排到哪一层

这也意味着：

> **Agent 的“智能”不是无限扩张出来的，而是被这组私有 usables 精确框住的。**

这对可控性非常重要。

## 13.9 `with_usables=True` 真正带来的，不只是方便，而是能力域隔离

如果你已经理解了前面那一节，这里就会发现：

```python
request = self.create_llm_request(..., with_usables=True)
```

这行代码的意义远不只是“少写两行 add_payload”。

它真正做的是：

- 给 Agent 内部 request 注入自己的私有 Tool/Action/Agent 能力
- 而不是把主系统那一大堆全局可用能力都展开给内部模型看

这样一来，内部模型在思考时就只会在这组局部能力之间做选择。

这对两个目标都有帮助：

- 提高工具组的命中率
- 减少无关 schema 对上下文的挤占

## 13.10 为什么说 Agent 更容易“最大化利用工具组”

这里的“最大化利用”不是指盲目多调工具，而是指：

> **让模型真的看见这组工具之间的组合空间，并在局部任务里更愿意用它们。**

如果这些 Tool 直接挂在主模型下面，它们往往只是主模型众多可选能力的一小部分。

但放进 Agent 以后，局面会变成：

- 这个内部模型的世界本来就很小
- 它要完成的又正好是这组 Tool 擅长的子任务

于是模型在内部更容易做出这样的决策：

- 先 `summary`
- 再 `tone`
- 最后 `formatter`

也就是说，它不是“更聪明了”，而是你给它搭了一个更适合发挥这组 Tool 的小场域。

## 13.11 这条链路和主 chatter 的关系，最好理解成“主模型委托一个子任务”

这一章别把 Agent 想得太神秘。

你完全可以把它理解成：

> **主模型遇到一个局部复杂任务时，不是自己直接调所有 Tool，而是把这件事委托给一个更专门的子代理。**

对主模型来说，它看到的是：

- `agent-echo_polish`

对 `echo_polish` 这个 Agent 来说，它看到的是：

- `tool-echo_formatter`
- `tool-echo_tone`
- `tool-echo_summary`

这两层看到的能力面是不一样的。

这就是“分层编排”的价值。

## 13.12 一个很务实的判断标准：什么时候该从 Tool 升成 Agent

至此，你可能最关心的是：

> **我什么时候该新建一个 Agent，而不是继续加 Tool？**

这里给你一个很实用的判断标准。

如果一个需求同时满足下面两条，就很适合考虑 Agent：

1. 它不是稳定的一步调用，而是经常需要在多个 Tool 之间选择或串联。
2. 这个子任务没有必要总带着完整主聊天上下文来推理。

反过来，如果只是：

- 明确的一次查询
- 明确的一次转换
- 明确的一次动作执行

那大概率还是 Tool 更合适。

## 13.13 不要把 Agent 写成“另一个更大的 Chatter”

这是一个很实际的提醒。

Agent 的确能开内部 request，也能多轮 follow-up，但这不意味着它应该无限膨胀。

如果一个 Agent 里又塞了过长的系统提示、又暴露了过多 usables、又把主历史整段搬进去，那它很快就会重演主模型过载的问题。

所以这章真正想强调的，不是“Agent 可以做很多事”，而是：

> **Agent 应该刻意保持任务窄、能力窄、输入窄。**

这样它才真的能起到：

- 编排局部工具组
- 隔离上下文
- 节省 token

这三件事。

## 13.14 如果把这一章压缩成一个结构图

你可以把它压成这样一张脑内图：

```text
主 chatter / 主模型
  看见的是：agent-echo_polish
  -> 把“整理这段文本”委托出去

EchoPolishAgent
  自己创建一条独立 request
  只注入自己的 usables
  看见的是：formatter / tone / summary
  -> 在局部上下文里多步调用
  -> 写回 ToolResult
  -> 收口为最终整理文本

主模型
  只拿到 Agent 的最终结果
```

这张图里最重要的不是“多了一层”，而是：

- 主层更干净
- 子层更聚焦
- 工具组更容易被真正用起来

## 13.15 BaseAgent 基类速查

`BaseAgent` 定义于 `src/core/components/base/agent.py`，继承自 `ABC` 和 `LLMUsable`。

### 类属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `agent_name` | `str` | Agent 名称，schema 中注册为 `agent-{agent_name}` |
| `agent_description` | `str` | Agent 描述，告知模型此 Agent 的用途 |
| `usables` | `list[type[LLMUsable] | str]` | 私有 usables 列表（类或组件签名字符串），不进入全局注册表 |
| `chatter_allow` | `list[str]` | 允许使用此 Agent 的 Chatter 名称列表，为空则不限制 |
| `chat_type` | `ChatType` | 支持的聊天类型（`ALL` / `PRIVATE` / `GROUP`） |
| `associated_platforms` | `list[str]` | 关联的平台列表，为空则不限制 |
| `dependencies` | `list[str]` | 组件级依赖（其他组件的签名列表） |

### 实例属性

| 属性 | 说明 |
|------|------|
| `self.stream_id` | 当前聊天流 ID |
| `self.plugin` | 所属插件实例 |

### 方法

| 方法 | 说明 |
|------|------|
| `execute(*args, **kwargs) -> tuple[bool, str\|dict]` | **抽象方法**，Agent 核心逻辑，返回 `(成功标志, 结果)` |
| `create_llm_request(model_set, ...) -> LLMRequest` | 快速创建内部 `LLMRequest`，可通过 `with_usables=True` 自动注入私有 usables |
| `execute_local_usable(usable_name, ...) -> tuple[bool, Any]` | 按名称执行私有 usable，支持 Tool / Action / Agent 三类路由 |
| `get_local_usables() -> list[type[LLMUsable]]` | 返回已解析的私有 usables 类列表 |
| `get_local_usable_schemas() -> list[dict]` | 返回私有 usables 的 schema 列表 |
| `to_schema() -> dict` | 生成 LLM Tool Schema，schema 名称为 `agent-{agent_name}` |
| `go_activate() -> bool` | Agent 激活判定，默认返回 `True`，可重写以实现条件激活 |
| `get_signature() -> str \| None` | 返回组件签名，格式为 `{plugin}:agent:{agent_name}` |

### usables 的两种写法

`usables` 支持直接传入类或使用组件签名字符串（后者在运行时从全局注册表解析）：

```python
class EchoPolishAgent(BaseAgent):
    agent_name = "echo_polish"
    usables = [
        FormatterTool,           # 直接引用组件类
        "echo_demo:tool:tone",   # 组件签名字符串（运行时解析）
    ]
```

### execute_local_usable 示例

```python
async def execute(self, text: Annotated[str, "要处理的文本"]) -> tuple[bool, str]:
    ok, result = await self.execute_local_usable("format", text=text)
    return ok, result
```

`execute_local_usable` 会按 schema 名称（含或不含 `tool-` / `action-` 前缀）在私有 usables 中查找，不访问全局注册表。

## 13.16 对插件作者来说，这一章最值得带走什么

如果把这章压成几个最实用的结论，那就是：

1. Tool 适合单步能力，Agent 适合局部多步编排。
2. Agent 的价值不在于接入更多能力，而在于把能力域收束到私有 `usables`。
3. Agent 内部用独立 request 跑子任务，本质上就是在做上下文隔离。
4. token 节省来自任务面缩小、工具面缩小、输入压缩，而不是某种自动优化魔法。
5. 当一组 Tool 经常要成套使用时，给它们加一个 Agent 往往比继续把 Tool 直接挂给主模型更稳。

## 13.17 把这一章压缩成一句话

如果要把这一章压缩成一句最值得带走的话，那就是：

> **Agent 在 Neo-MoFox 里更像一个受限的局部编排工作流：它把一组 Tool 收束成一个更高层入口，用独立 request 隔离上下文，让主模型少背细节、让子模型更专注地把工具组用起来。**

沿着这个方向，下一步自然会涉及：

> **既然 Agent 已经能做局部编排，那插件作者该怎么设计“主 Chatter -> Agent -> Tool/Action”的分层边界，避免各层职责互相打架？**

那就是完整编排设计的问题了。