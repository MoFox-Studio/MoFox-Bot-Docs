# 10. 系统能力导览：把 Prompt 真正送进 LLM API

> **导读** prompt 写好之后，如何把它送进一次真正的模型请求？本章介绍 LLM API 的核心调用链：从选择模型集合、创建请求对象、添加 payload，到发送请求并消费响应。这不是一句万能函数，而是一条清晰的请求链。理解这条链，是后续处理工具调用、流式响应和多轮对话的前提。

上一章我们已经把一件很关键的事理顺了：

> **插件可以先把 prompt 组织出来，再按需要取回。**

但如果只停在这一步，Prompt API 仍然只是“把文本整理得更像样”。它还没有真正进入模型请求。

这一章要接上的，就是后半段链路：

> **当 prompt 已经准备好之后，怎样通过 LLM API 把它送进一次真正的模型请求。**

这里我想先提前打一个很重要的预防针。

很多人第一次接触这层 API，会下意识地去找一个类似下面这样的接口：

```python
reply = llm_api.ask("你好")
```

但当前项目的设计并不是这条路。Neo-MoFox 这一层更强调的是：

- 你先明确自己要用哪个模型集合。
- 再明确自己要发什么 payload。
- 然后拿到一个请求对象去发送。

所以本章介绍的，不是“一步到位的万能函数”，而是一条更清楚、也更适合系统扩展的请求链。

## 10.1 先建立一个最小认知：LLM API 不是 Prompt API 的替身

上一章的 Prompt API 负责的是：

- 管理 prompt 模板。
- 管理 reminder。
- 把 prompt 组织成可复用资源。

而这一章的 LLM API 负责的是：

- 选择模型。
- 创建请求。
- 添加 payload。
- 发起调用并接收响应。

所以它们的关系更像：

- **Prompt API** 负责“准备要说什么”。
- **LLM API** 负责“把这些内容真正发出去”。

如果把这两层揉成一层来理解，后面一旦出现多模型、流式响应、工具调用、多轮上下文，你会很容易看花。

本章将按照这个顺序逐步展开。

## 10.2 这一章我们要把 `echo_demo` 变成什么样

这一章做完之后，`echo_demo` 会多出一条真正调用模型的链路：

1. 先通过上一章的模板构建 prompt。
2. 再通过 LLM API 创建请求对象。
3. 把 prompt 作为 payload 加进请求。
4. 发起一次非流式请求。
5. 把模型返回的文本真正回给命令调用方。

也就是说，`echo_demo` 会第一次从“本地字符串处理插件”，往“真正会调模型的插件”跨一步。

## 10.3 核心对象速览

入门阶段，不需要一口气把整个 `kernel.llm` 体系都看完。先抓住下面几个名字就够了：

- `llm_api.get_model_set_by_task()`：拿模型集合。
- `llm_api.create_llm_request()`：创建请求对象。
- `LLMPayload`：一条要发给模型的消息负载。
- `ROLE`：负载角色，比如 `system`、`user`、`assistant`。
- `Text`：最基本的文本内容。
- `LLMResponse`：请求发出去之后拿回来的响应对象。

这些名字看起来稍微多一点，但它们其实正好对应一次请求最核心的几个问题：

- 用哪个模型。
- 发什么消息。
- 消息是什么角色。
- 回来之后怎么拿结果。

## 10.4 先从模型集合开始，而不是一上来就 new Request

很多人第一次看 `create_llm_request()` 时，注意力会立刻落在 request 本身上。但真正更适合先建立的认知其实是：

> **请求不是凭空创建的，它总要先知道自己要用哪组模型。**

当前高层 API 最适合入门的拿法，是按任务获取模型集合：

```python
from src.app.plugin_system.api import llm_api
from src.app.plugin_system.types import TaskType

model_set = llm_api.get_model_set_by_task(TaskType.ACTOR.value)
```

这里的直觉其实很简单：

- 你不是在说“我要随便调一个模型”。
- 而是在说“我要完成一类任务，请给我这一类任务对应的模型配置”。

对于插件作者来说，这种写法通常比直接按具体模型名取更稳，因为它更贴近系统配置层已经整理好的任务分工。

当然，如果你已经明确知道自己就要指定某个模型，也可以走：

```python
model_set = llm_api.get_model_set_by_name("your_model_name")
```

但入门阶段，更建议先按任务取模型这条线走，因为它更自然。

## 10.5 现在把 LLM 调用逻辑接进 `EchoService`

既然前面我们已经把“能力”尽量收进了 Service，那这一章最自然的落点也还是 `service.py`。

可以把 `EchoService` 往前再推一步：

```python
from __future__ import annotations

from src.app.plugin_system.api import llm_api, prompt_api
from src.app.plugin_system.base import BaseService
from src.app.plugin_system.types import LLMPayload, ROLE, TaskType, Text


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

    async def generate_llm_reply(self, text: str, mode: str = "plain") -> str:
        """生成一条真正来自模型的回复。"""
        prompt_text = await self.build_reply_prompt(text=text, mode=mode)

        model_set = llm_api.get_model_set_by_task(TaskType.ACTOR.value)
        request = llm_api.create_llm_request(
            model_set=model_set,
            request_name="echo_demo_reply",
            with_reminder="actor",
        )
        request.add_payload(LLMPayload(ROLE.USER, Text(prompt_text)))

        response = await request.send(stream=False)
        reply_text = await response

        return reply_text.strip() if reply_text else ""
```

这一段虽然比前几章长一点，但别急。它其实正好把一次最小 LLM 调用拆成了几步非常清楚的小动作。

## 10.6 先看这段代码到底做了什么

### 第一步：先把 prompt 真正构建出来

```python
prompt_text = await self.build_reply_prompt(text=text, mode=mode)
```

这一步就是上一章的成果正式派上用场的地方。

它的意义在于：

- Prompt 的组织逻辑仍然留在 Prompt API 那一层。
- LLM API 不负责替你“想 prompt”。
- 请求发出去前，你已经拿到了一段完整可读的 prompt 文本。

这会让后面排查问题轻松很多。因为一旦模型输出不对，你至少先能回答一个问题：

> **到底是 prompt 本身写得不好，还是模型请求链路出了问题。**

### 第二步：按任务取模型集合

```python
model_set = llm_api.get_model_set_by_task(TaskType.ACTOR.value)
```

这里先不要把 `ModelSet` 想得太神秘。入门阶段你只要知道：

> **它代表这次请求可用的一组模型配置。**

请求对象并不是只绑定一个死模型，而是拿着这组配置去完成一次请求过程。

从插件作者视角看，这一层最重要的并不是内部细节，而是：

- 你需要先选模型。
- 这一步最好走高层 API，而不是自己拼配置字典。

### 第三步：创建请求对象

```python
request = llm_api.create_llm_request(
    model_set=model_set,
    request_name="echo_demo_reply",
    with_reminder="actor",
)
```

这里的 `request_name` 很值得养成习惯去写。

它不是决定模型行为的 prompt 字段，而更像这次请求在系统里的名字。你可以把它理解成：

- 日志里更容易看懂。
- 指标里更容易区分。
- 后面排查问题时更容易定位。

另一个值得注意的是：

```python
with_reminder="actor"
```

这不是再去注册 reminder，而是在说：

> **如果 actor bucket 里已经有 reminder，就把它带进这次请求的上下文。**

也就是说，上一章你存进去的 reminder，到这里才开始真正和 LLM 请求发生关系。

## 10.7 这里的 reminder 不是单独多出一条 system 消息

这一点很容易误会，值得单独说明。

如果你以为 `with_reminder="actor"` 会直接再塞一条显眼的 `ROLE.SYSTEM` 消息进去，那就会和当前实现不太一致。

现在这套上下文管理更接近的是：

- reminder 会先登记到 `context_manager`
- 等真正出现第一条 `USER` payload 时，再被注入进去

所以你要记住的重点不是“它内部到底以哪种数据结构放进去”，而是：

> **reminder 会参与这次请求上下文，但它不是另一套独立的高层 prompt API。**

对插件作者来说，知道这一层关系就够了。至于更细的上下文注入位置，可以以后读底层实现时再慢慢对。

## 10.8 然后才是把 payload 真正加进去

```python
request.add_payload(LLMPayload(ROLE.USER, Text(prompt_text)))
```

这行代码很值得停一下。

因为它其实在明确回答三个问题：

- 这是一次什么角色的消息。这里是 `USER`。
- 消息内容是什么。这里是 `Text(prompt_text)`。
- 这条消息要被追加到哪个请求对象里。

这里你也会第一次明显感受到：LLM API 不是“传一个字符串然后等结果”的风格，而是明确地把对话消息组织成 payload。

这会带来两个好处：

- 消息角色很清楚。
- 后面如果你要加图片、音频、工具调用，结构不会一下变形。

## 10.9 为什么这里用的是 `ROLE.USER`，不是 `ROLE.SYSTEM`

这个问题很常见，也很值得现在就讲明白。

当前这条入门链路里，上一章构建出来的 prompt，本质上是“当前这次任务的输入内容”，所以先把它作为 `USER` 消息送进去，是最自然也最稳的做法。

如果你后面要把某些长期不变的行为约束拆成 system prompt，也完全可以，但这不是这一章最先要建立的认知。

这一章先抓住最小闭环就够了：

- 先有一段完整 prompt
- 再把它作为一次 user 输入发给模型

这样边界最清楚。

## 10.10 真正发送时，最容易让人愣住的是这两步

```python
response = await request.send(stream=False)
reply_text = await response
```

很多人第一次看到这里，会下意识问：

> 为什么已经 `await request.send()` 了，后面还要再 `await response`？

这个疑问很合理。

当前实现里，`request.send()` 返回的是一个 `LLMResponse` 对象，而不是直接把最终字符串塞给你。

这个响应对象本身又支持两种消费方式：

- `await response`：收集完整结果。
- `async for chunk in response`：流式读取。

所以这里的两步可以这样理解：

1. 第一层 `await` 是在“拿到响应对象”。
2. 第二层 `await` 是在“把响应对象消费成完整文本”。

只要把这两层分开理解，这段写法就不奇怪了。

## 10.11 如果你只想拿完整文本，现在最稳的写法就是这样

入门阶段，最推荐的就是刚才那种写法：

```python
response = await request.send(stream=False)
reply_text = await response
```

然后你也可以继续使用：

```python
response.message
```

因为在完整消费之后，响应对象里会保留最终文本内容。

你可以先把它理解成：

- `reply_text` 适合你当场直接返回。
- `response.message` 适合你后面还想继续读响应对象状态时使用。

## 10.12 现在把它接回 Command，就有第一条真正的模型命令了

有了 `generate_llm_reply()` 之后，命令层就可以继续往前走一步：

```python
class EchoCommand(BaseCommand):
    """最小回显命令。"""

    command_name = "echo"
    command_description = "一个用于演示插件系统的最小回显命令"
    command_prefix = "/"

    async def _get_service(self) -> EchoService:
        """创建当前插件对应的 EchoService 实例。"""
        return EchoService(self.plugin)

    @cmd_route("ask")
    async def handle_ask(self, text: str) -> tuple[bool, str]:
        """通过 LLM 生成一条回复。"""
        service = await self._get_service()
        result = await service.generate_llm_reply(text=text)
        if not result:
            return False, "模型没有返回有效内容"
        return True, result
```

这样之后，`echo_demo` 就第一次不再只是本地处理字符串，而是真的会请求模型了。

你可以把这一步理解成：

> **插件终于从“会组织 prompt”走到了“会把 prompt 发给模型”。**

## 10.13 这一章的最小验证命令可以是什么

现在你就可以增加一个最小验证命令，比如：

```text
/echo ask 请用一句话介绍一下你自己
```

如果链路正常，返回的就不再是固定的 `echo: ...`，而是一次真正的模型输出。

这里最值得验证的，不只是“有没有返回内容”，而是下面几层：

- 插件是否成功拿到了模型集合。
- Prompt 是否正常构建。
- 请求是否正常发出。
- 响应是否被正确消费成文本。

只要这几层都通了，后面再继续加多轮对话、工具调用和流式响应，就都会稳很多。

## 10.14 还有一个很实用的默认行为：响应会自动写回上下文

这一点很多人第一次用时不会立刻注意到，但它其实很有价值。

当前 `request.send()` 默认是：

```python
auto_append_response=True
```

这意味着当你完整消费响应之后，这次 assistant 的回复会自动被写回响应对象内部维护的 payload 上下文里。

这件事的意义在于：

- 它不是一次“完全失忆”的调用。
- 后面如果你要接着继续发下一轮，就已经有一份更新过的上下文链。

入门阶段你可以先知道它存在，但先不用急着把多轮链路也写进示例里。因为这一章最重要的目标仍然是：先打通第一次请求。

## 10.15 如果你想做流式输出，入口也已经在这里了

虽然这一章主线用的是非流式：

```python
response = await request.send(stream=False)
reply_text = await response
```

但当前 `LLMResponse` 本身也支持流式消费。

也就是说，后面如果你想边生成边输出，可以走类似这样的结构：

```python
response = await request.send(stream=True)
chunks: list[str] = []

async for chunk in response:
    chunks.append(chunk)

reply_text = "".join(chunks)
```

这里先知道它能做什么就够了。不要急着这章就把所有流式交互也揉进来，否则主线会一下变重。

## 10.16 为什么这一章先不接入 Tool 注册表

你可能已经会自然想到：

> 既然 `llm_api` 里也有 `create_tool_registry()`，是不是可以顺手把 Tool 也接进来了？

从系统结构上说，这当然是后面会走到的地方。

但从学习节奏上看，现在先不涉及更好。

因为只要 Tool 一进来，请求链就会立刻多出一整段新的结构：

- assistant 可能返回 tool_calls
- tool_result 需要回写
- follow-up assistant 还要继续补完

而这一章真正想帮你建立的，是更基础也更必要的一层：

> **先把“普通 prompt → 一次正常 LLM 请求 → 一条文本响应”这条最小链路走通。**

这一步一旦通了，后面再接 Tool，会清楚很多。

## 10.17 这章真正要带走的，不是代码，而是链路

如果把这一章压缩一下，真正值得你带走的其实是这一条链：

```text
PromptTemplate
-> build 出 prompt 文本
-> 选择 model_set
-> create_llm_request()
-> add_payload(ROLE.USER, Text(...))
-> send()
-> await response
-> 拿到最终文本
```

这条链一旦在脑子里建立起来，后面你再看更复杂的对话系统代码时，就不会只觉得“它在调很多对象”。你会知道：它其实只是把这条最小链路，一步步扩展得更完整。

## 10.18 这一章压缩成一句话

如果要把这一章压缩成一句最值得带走的话，那就是：

> **LLM API 负责把已经准备好的 prompt 真正发给模型；它的核心不是一句万能函数，而是一条清楚的请求链。**

下一步如果继续往前走，就很自然了：

> **既然模型已经能正常返回文本，那当它不只返回文本，而开始返回 tool call 时，这条链会怎样继续往前走？**

那就是 Tool 调用链真正接入 LLM 的地方。