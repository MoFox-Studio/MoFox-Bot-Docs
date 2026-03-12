# 11. 系统能力导览：让 Tool 真正接进 LLM 调用链

> **导读** Tool 不只是一个能被定义的组件，它还需要真正接进 LLM 调用链才能发挥作用。本章介绍完整的 Tool Calling 流程：从 `ToolRegistry` 暴露能力给模型，到读取 `call_list` 执行工具，再把 `ToolResult` 写回上下文，最后通过 follow-up 让模型补完回复。同时讨论为什么需要 follow-up，以及系统如何防止重复调用。

上一章我们已经把一条很重要的链路打通了：

```text
prompt -> LLMRequest -> send() -> 文本响应
```

这条线足够让你第一次真正“把 prompt 发给模型”。

但如果只停在这里，Tool 还只是插件系统里一个“已经定义好、但没有真正进入模型调用”的组件。你知道它怎么写，也知道它有 schema，可它到底什么时候会被模型用上、用上之后上下文会怎么继续往前走，这件事还是抽象的。

这一章要解决的，就是这段最关键的后半截：

> **当模型不只返回文本，而是返回一个 Tool 调用请求时，系统接下来会怎样继续把这轮对话走完。**

而且这一次，我们不只停在最小闭环，还会把你刚才选的那一步也带上：

- 一次 Tool 调用如何被执行。
- Tool 结果怎样回写进上下文。
- 为什么常常还需要 follow-up 再发一轮模型请求。
- 系统为什么要对重复工具调用做去重控制。

不过先说明一下节奏。

这一章虽然会比前两章更复杂，但我还是不会直接把 `default_chatter` 的完整状态机整套搬过来。我们先只抓住一条清楚主线：

> **模型看到 Tool -> 发出 tool call -> 系统执行 Tool -> 把 tool result 写回去 -> 模型再补一轮回复。**

## 11.1 先把一个误区掐掉：Tool 并不是“模型自动执行的函数”

很多人第一次接触 tool calling，会下意识把它想成这样：

1. 模型发现有工具可用。
2. 模型自己把工具执行了。
3. 结果直接出现在回复里。

这套脑补很顺，但和当前实现不一样。

更准确的理解应该是：

1. 你先把 Tool 以 schema 的形式暴露给模型。
2. 模型决定“我想调用哪个 Tool、参数是什么”。
3. 模型返回的是 **tool call 请求**，而不是工具结果本身。
4. 系统收到这个请求之后，再去执行真实 Tool。
5. 工具执行结果被写回上下文。
6. 模型基于这个结果，再继续生成下一轮回复。

也就是说：

> **模型负责决定要不要调用 Tool，系统负责真正执行 Tool。**

这一层如果不先理清，后面你会很容易把“模型返回了 tool call”误以为“工具已经跑完了”。

## 11.2 这一章继续沿用 `echo_demo`

为了不把业务背景换来换去，这一章还是继续使用 `echo_demo`。

前面我们已经给它准备过一个 Tool：

- `EchoFormatterTool`

它能做的事情很简单：

- 把文本转成大写
- 转成小写
- 转成标题格式

这正好很适合作为第一次 tool calling 的例子。因为它足够小，小到你不会把注意力浪费在业务细节上；但它又足够像一个真实工具，因为模型需要明确说出：

- 要调用哪个工具
- 传什么参数

## 11.3 Tool 真正接进 LLM 前，先要有 ToolRegistry

这一层是整个链路的第一个入口。

当前高层 LLM API 提供了这样一个接口：

```python
from src.app.plugin_system.api import llm_api

registry = llm_api.create_tool_registry([EchoFormatterTool])
```

这个 `ToolRegistry` 的角色，你可以先把它理解成：

> **一份要暴露给模型的可用工具清单。**

它不是执行器，也不是 manager，更不是某种“智能代理”。它先只是把哪些工具可用这件事整理出来。

也就是说，这一步解决的问题是：

- 当前这次请求里，有哪些 Tool 能让模型看到。

而不是：

- 这些 Tool 要不要执行。
- 执行完之后怎么回写。

那些是后面的事。

## 11.4 为什么 ToolRegistry 里放的是 Tool 类，而不是 Tool 实例

这里很值得停一下。

你可能会本能地想写：

```python
registry = llm_api.create_tool_registry([EchoFormatterTool(self.plugin)])
```

但当前这条链里，更自然的是传类，而不是实例：

```python
registry = llm_api.create_tool_registry([EchoFormatterTool])
```

原因并不复杂。

在“把 Tool 暴露给模型”这一步，系统更关心的是：

- 它叫什么。
- 它的描述是什么。
- 它的参数 schema 是什么。

这些信息都可以从类本身生成出来，因为 `BaseTool.to_schema()` 会基于 `execute()` 的签名和注解生成 Tool schema。

所以这一步先是“描述工具”，还不是“实例化并执行工具”。

## 11.5 先看 `EchoService` 怎样把 Tool 带进请求

这一章我们可以在 `service.py` 里新增一条更完整的调用链：

```python
from __future__ import annotations

from src.app.plugin_system.api import llm_api, prompt_api
from src.app.plugin_system.base import BaseService
from src.app.plugin_system.types import LLMPayload, ROLE, TaskType, Text, ToolCall, ToolResult

from .tool import EchoFormatterTool


class EchoService(BaseService):
    """EchoDemo 的核心回显能力。"""

    service_name = "echo_service"
    service_description = "提供基础的回显与文本处理能力"

    async def build_reply_prompt(self, text: str, mode: str) -> str:
        """构建一段供后续模型使用的 prompt。"""
        template = prompt_api.get_template("echo_demo.reply")
        if template is None:
            return "你正在处理 echo_demo 插件的文本任务。"

        return await (
            template.set("user_input", text)
            .set("mode", mode)
            .build()
        )

    async def ask_with_formatter_tool(self, text: str) -> str:
        """让模型决定是否调用 EchoFormatterTool，再返回最终文本。"""
        prompt_text = await self.build_reply_prompt(text=text, mode="title")

        model_set = llm_api.get_model_set_by_task(TaskType.ACTOR.value)
        request = llm_api.create_llm_request(
            model_set=model_set,
            request_name="echo_demo_tool_reply",
            with_reminder="actor",
        )

        tool_registry = llm_api.create_tool_registry([EchoFormatterTool])

        for tool_cls in tool_registry.get_all():
            request.add_payload(LLMPayload(ROLE.TOOL, tool_cls))

        request.add_payload(
            LLMPayload(
                ROLE.USER,
                Text(
                    prompt_text
                    + "\n如果你认为有必要，可以调用 echo_formatter 对文本做格式化，再给出最终答复。"
                ),
            )
        )

        response = await request.send(stream=False)
        await response

        if not response.call_list:
            return response.message.strip() if response.message else ""

        for call in response.call_list:
            if call.name != "tool-echo_formatter":
                continue

            tool_instance = EchoFormatterTool(self.plugin)
            call_args = call.args if isinstance(call.args, dict) else {}
            success, result = await tool_instance.execute(**call_args)

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

        follow_up = await response.send(stream=False)
        final_text = await follow_up
        return final_text.strip() if final_text else ""
```

不要被代码长度吓到。它只是把前两章学到的东西，第一次串成一条更完整的调用链。

## 11.6 这一段代码里，真正新增的部分只有三块

如果把它压缩一下，这一章相对上一章真正新增的，其实主要就是三件事：

### 第一块：把 Tool 作为可用能力暴露给模型

```python
tool_registry = llm_api.create_tool_registry([EchoFormatterTool])

for tool_cls in tool_registry.get_all():
    request.add_payload(LLMPayload(ROLE.TOOL, tool_cls))
```

这里的意思是：

- 这一轮请求里，我允许模型看到这个 Tool。
- 所以模型现在有资格返回一个对应的 tool call。

注意，这一步还没有执行 Tool。它只是把“你可以用什么工具”告诉模型。

### 第二块：检查模型有没有真的返回 tool call

```python
if not response.call_list:
    return response.message.strip() if response.message else ""
```

这一步非常重要，因为它提醒你：

> **Tool 暴露给模型，不代表模型一定会用。**

模型有可能：

- 直接返回普通文本。
- 返回一个或多个 tool call。

所以这一章的第一层判断，就是先看 `response.call_list` 里有没有内容。

### 第三块：如果有 tool call，就执行并回写

```python
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
```

这里是整条链里最关键的一步。

它不是把工具结果“直接返回给用户”，而是先把工具结果写回模型上下文。

这意味着系统在说：

> 你刚才申请调用的工具，我已经帮你执行完了；这是结果，你现在可以继续往下生成真正的回复了。

这也是为什么后面还会再有一轮：

```python
follow_up = await response.send(stream=False)
```

## 11.7 为什么 Tool 执行完之后，常常还需要 follow-up

这是这一章最值得看懂的点。

很多人第一次接 Tool calling，会以为：

- 模型发出 tool call
- 系统执行工具
- 工具结果就已经是最终答案了

但在很多情况下，工具结果其实只是“原材料”，不是最终答复。

比如我们的 `EchoFormatterTool` 返回的可能只是：

```text
HELLO WORLD
```

而模型真正想对用户说的，可能是：

```text
这是我帮你整理后的结果：HELLO WORLD
```

这两者并不一样。

所以更自然的流程通常是：

1. 模型先决定要用哪个 Tool。
2. 系统执行 Tool。
3. ToolResult 被写回上下文。
4. 模型再基于 ToolResult，生成真正面向用户的回答。

也就是说：

> **Tool 的输出经常只是中间结果，而不是最终回复。**

这也是为什么 follow-up 在这条链里这么常见。

## 11.8 这里的 ToolResult 为什么一定要带 `call_id`

这一点是技术细节，但它真的很重要。

当模型返回一个 ToolCall 时，里面会带自己的调用标识：

```python
ToolCall(id="...", name="tool-echo_formatter", args={...})
```

而系统在回写结果时，不能只说“这个工具执行完了”，还要说：

> **我回写的是哪一次调用的结果。**

所以这里才会写：

```python
ToolResult(
    value=result,
    call_id=call.id,
    name=call.name,
)
```

你可以把 `call_id` 理解成这条工具调用链的对账单编号。

如果它对不上，后续上下文结构就会变得不稳定，甚至直接非法。

## 11.9 如果模型一次返回多个 call，会发生什么

这一章的示例为了简单，只重点看一个工具，但当前实现并不是只能处理单个调用。

所以这里你至少要建立一个概念：

- `response.call_list` 是一个列表。
- 这意味着模型可能一次返回多个 ToolCall。

也正因为这样，示例里才用了：

```python
for call in response.call_list:
    ...
```

入门阶段你不一定要立刻把并发执行、多工具混用都写进示例，但至少要知道：这条链天然就是为“可能有多个 call”准备的。

## 11.10 这里为什么开始出现“去重”这个词

一旦你接受了“模型可能返回多个 call，甚至可能 follow-up 多轮继续返回 call”，去重就会自然出现。

原因很现实。

模型并不总是完美稳定地只调用一次工具。它有可能：

- 在同一轮重复发相同调用。
- 在下一轮 follow-up 里又发一遍相同调用。

如果系统不做控制，就可能出现：

- 同一段文本被重复格式化
- 同一条消息被重复发送
- 同一个查询被反复调用

这就是为什么当前默认对话链里会有专门的去重控制。

## 11.11 这一章先不用把默认对话链状态机整套背下来

你刚才选的是“把 follow-up 与去重控制也讲进去”，这是对的。但这里我还是不建议你现在就去死背 `default_chatter` 里的完整状态机相位。

因为对入门读者来说，更值得先记住的是它背后的结构原因，而不是全部控制细节。

你先把下面这四句话记住，会比背一堆相位名更有用：

1. 模型返回 ToolCall 后，系统要先执行 Tool。
2. ToolResult 要写回上下文，而不是直接当最终答案返回。
3. 写回之后常常还需要 follow-up，再让模型补完真正回复。
4. 为了避免重复工具调用，系统通常会做同轮或跨轮去重。

只要这四句成立，后面你再去看复杂实现时，就不会迷路。

## 11.12 那 `echo_demo` 的命令层现在可以怎么写

既然 Service 已经能完成这条链，那命令层就还是尽量保持轻一点：

```python
class EchoCommand(BaseCommand):
    """最小回显命令。"""

    command_name = "echo"
    command_description = "一个用于演示插件系统的最小回显命令"
    command_prefix = "/"

    async def _get_service(self) -> EchoService:
        """创建当前插件对应的 EchoService 实例。"""
        return EchoService(self.plugin)

    @cmd_route("ask_tool")
    async def handle_ask_tool(self, text: str) -> tuple[bool, str]:
        """让模型在需要时调用 echo_formatter。"""
        service = await self._get_service()
        result = await service.ask_with_formatter_tool(text)
        if not result:
            return False, "模型没有返回有效内容"
        return True, result
```

这样你就有了一个很明确的新入口：

```text
/echo ask_tool hello world
```

它的意义在于：

- 不是本地直接调用 `EchoFormatterTool`
- 而是把“要不要调用这个 Tool”交给模型决定

这一步的感觉，会和前面纯命令式的插件明显不同。

## 11.13 这里最值得观察的，不是结果文本，而是中间结构

如果你真的去跑这一条链，最值得观察的其实不只是最后回复了什么，而是：

- 第一次 `send()` 之后，`response.call_list` 有没有内容。
- `call.name` 是不是你预期的工具名。
- `call.args` 长什么样。
- 你回写了哪些 `ToolResult`。
- 第二次 follow-up 之后，最终文本有没有正常补完。

因为到了 Tool calling 这里，最终文本只是链路末端的结果，中间结构本身已经很值得看。

如果中间结构不对，最后答案大概率也不会稳。

## 11.14 本章边界说明：先不展开 Agent 与完整状态机

这里有意收住一下。

因为只要再往前一步，内容马上就会继续膨胀：

- Tool 和 Action 的分工
- Tool 与 Agent 混用
- 多轮推理控制
- send_text 一类 action-only 调用
- suspend 占位
- cross-round dedupe

这些都是真实存在的，但如果一口气全拖进来，读者第一次看会直接失去主线。

所以这一章的边界非常明确：

> **只先讲清 Tool 是怎样真正进入 LLM 请求、执行并回写，再通过 follow-up 产出最终回复。**

这已经足够把 Tool 从“定义好的组件”推到“真正参与对话生成的能力”了。

## 11.15 把这一章压缩成一条主线

如果把这一章压成一条最值得带走的主线，那就是：

```text
把 Tool 暴露给模型
-> 模型返回 ToolCall
-> 系统执行 Tool
-> ToolResult 回写上下文
-> 模型 follow-up 补完最终回复
```

你只要先把这条线看顺，后面再看复杂对话系统里的工具链，就不会只是觉得“它在调用很多对象”。你会知道它其实只是在把这条主线扩展得更稳、更细。

## 11.16 这一章压缩成一句话

如果要把这一章压缩成一句最值得带走的话，那就是：

> **Tool 真正接进 LLM 调用链之后，模型负责提出调用请求，系统负责执行与回写，最终回复通常还要靠一轮 follow-up 才会完整。**

下一步如果继续往前走，就很自然了：

> **既然 Tool 已经能进模型调用链，那什么时候该用 Tool，什么时候更适合用 Action、Service，甚至 Agent？**

那就是更完整的能力编排问题了。