# Chatter — 聊天器组件

`BaseChatter` 是对话流程组件，使用异步生成器通过 `yield` 返回状态。

## 执行模型

```text
消息进入聊天流
  -> 框架调度 chatter.execute()
  -> Chatter 内部可多次 yield Wait()/Success()/Failure()/Stop()
```

## 结果类型

| 类型 | 构造方式 | 含义 |
| --- | --- | --- |
| `Wait` | `Wait()` / `Wait(time=30)` | 等待下一次调度，或等待指定秒数 |
| `Success` | `Success("说明")` | 本轮处理成功 |
| `Failure` | `Failure("错误")` | 本轮处理失败 |
| `Stop` | `Stop(time=60)` | 停止一段时间后再恢复 |

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `chatter_name` | `str` | `""` | 聊天器名称 |
| `chatter_description` | `str` | `""` | 描述 |
| `associated_platforms` | `list[str]` | `[]` | 限制平台 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 聊天类型限制 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖 |

## 实例属性

| 属性 | 说明 |
| --- | --- |
| `self.stream_id` | 当前聊天流 ID |
| `self.plugin` | 所属插件实例 |

## 必须实现的方法

### `execute(self) -> AsyncGenerator[ChatterResult, None]`

`BaseChatter` 当前签名不接收 `unreads` 参数。未读消息请通过 `fetch_unreads()` 获取。

## 关键辅助方法

### `await self.fetch_unreads(format_as_group=True)`

读取未读消息快照，返回：

- `formatted_text: str`（JSON 格式字符串）
- `unread_messages: list[Message]`

### `await self.flush_unreads(unread_messages)`

将指定快照中的未读消息搬运到 history，避免漏读或误清空。

### `await self.get_llm_usables()`

获取当前流可用的 `Action/Tool/Collection` 组件类列表。

### `await self.modify_llm_usables(llm_usables)`

对可用组件做激活与适配过滤，返回最终可用列表。

### `await self.exec_llm_usable(usable_cls, message, **kwargs)`

直接执行指定可调用组件。

## 最小示例

```python
from typing import AsyncGenerator

from src.core.components.base.chatter import BaseChatter, Wait, Success, Failure
from src.app.plugin_system.api.llm_api import get_model_set_by_task, create_llm_request
from src.app.plugin_system.api.send_api import send_text
from src.kernel.llm import LLMPayload, ROLE, Text


class SimpleChatter(BaseChatter):
    chatter_name = "simple_chatter"
    chatter_description = "基础对话"

    async def execute(self) -> AsyncGenerator[Wait | Success | Failure, None]:
        unread_json, unread_messages = await self.fetch_unreads()
        if not unread_messages:
            yield Wait()
            return

        model_set = get_model_set_by_task("actor")
        req = create_llm_request(model_set, request_name="simple_chatter")
        req.add_payload(LLMPayload(ROLE.SYSTEM, Text("你是简洁的中文助手")))
        req.add_payload(LLMPayload(ROLE.USER, Text(unread_json)))

        yield Wait()
        resp = await req.send(stream=False)

        answer = (resp.message or "").strip()
        if not answer:
            yield Failure("LLM 返回为空")
            return

        ok = await send_text(answer, self.stream_id)
        if not ok:
            yield Failure("发送回复失败")
            return

        await self.flush_unreads(unread_messages)
        yield Success("对话完成")
```

## Tool Calling 关键点

- 工具声明应通过 `ROLE.TOOL` 的 payload 提供给请求。
- 返回对象字段使用 `response.message` 与 `response.call_list`。
- 工具执行结果回传应使用 `ROLE.TOOL_RESULT`。
