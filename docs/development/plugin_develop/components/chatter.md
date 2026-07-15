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
| `Wait` | `Wait()` / `Wait(time=30)` | 等待下一次调度；`time=None` 表示等待新消息恢复，数字表示到期由框架主动恢复 |
| `Success` | `Success("说明")` | 本轮处理成功，可携带 `data`、`step_data` |
| `Failure` | `Failure("错误")` | 本轮处理失败，可携带 `exception`、`step_data` |
| `Stop` | `Stop(time=60)` | 停止一段时间后再恢复，可携带私聊唤醒配置 |

所有结果类型均支持可选的 `step_data: dict[str, Any] | None` 字段，用于在步进完成后由框架发布 `ON_CHATTER_STEP` / `AFTER_CHATTER_STEP` 通知事件。

`Stop` 的高级字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `time` | `float \| int` | 必填 | 停止时间（秒） |
| `direct_message_wake_enabled` | `bool` | `False` | 是否允许私聊消息直接唤醒停止中的 Chatter |
| `direct_message_wake_probability` | `float` | `0.0` | 私聊唤醒概率（0.0–1.0） |
| `step_data` | `dict \| None` | `None` | 步骤元数据 |

## 类属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `chatter_name` | `str` | `""` | 聊天器名称 |
| `chatter_description` | `str` | `""` | 描述 |
| `associated_platforms` | `list[str]` | `[]` | 限制平台 |
| `chat_type` | `ChatType` | `ChatType.ALL` | 聊天类型限制 |
| `dependencies` | `list[str]` | `[]` | 组件级依赖 |
| `stream_tick_interval` | `float \| None` | `None` | 覆盖聊天流的 tick 间隔（秒）；`None` 时维持框架默认 |
| `allow_message_buffer` | `bool \| None` | `None` | 是否允许该流的未读消息缓冲；`None` 时维持框架默认 |

::: tip 流运行时选项
`stream_tick_interval` 与 `allow_message_buffer` 会在 `apply_stream_runtime_options()` 中被写入当前聊天流上下文，仅作用于本 Chatter 接管的流。
:::

## 实例属性

| 属性 | 说明 |
| --- | --- |
| `self.stream_id` | 当前聊天流 ID |
| `self.plugin` | 所属插件实例 |

## 必须实现的方法

### `execute(self) -> AsyncGenerator[ChatterResult, WaitResumeEvent | None]`

`BaseChatter` 当前签名不接收 `unreads` 参数。未读消息请通过 `fetch_unreads()` 获取。

生成器在 `yield Wait(...)` 之后可通过 `send()` 接收 `WaitResumeEvent` 恢复事件，用于区分是新消息触发、定时器到期、子代理返回，还是内部上下文请求。

## 关键辅助方法

### `await self.fetch_unreads(time_format="%H:%M")`

读取未读消息快照，不修改上下文。返回 `tuple[str, list[Message]]`：

- 第一项：按统一格式渲染后的未读消息文本，每条一行
- 第二项：未读消息对象列表（原顺序）

::: warning 不要使用旧签名
旧文档中的 `fetch_unreads(format_as_group=True)` 不存在。`format_as_group` 不是合法参数。
:::

### `await self.flush_unreads(unread_messages)`

将指定快照中的未读消息搬运到 `history`，返回实际搬运数量。仅搬运传入的消息，避免漏读或误清新到达的消息。

### `await self.get_llm_usables()`

获取当前流可用的 `Action/Tool/Agent` 组件类列表（来自全局注册表，仅返回 `ACTIVE` 状态的组件）。

### `await self.modify_llm_usables(llm_usables)`

对可用组件做 `chatter_allow` 过滤、`associated_types` 校验与并行 `go_activate()` 激活判定，返回最终可用列表。

### `await self.exec_llm_usable(usable_cls, message, **kwargs)`

直接执行指定 `LLMUsable` 组件（Tool / Action / Agent），返回 `(bool, Any)`。Chatter 自身不能被直接执行。

### `self.create_request(task="actor", request_name="", with_reminder=None)`

快速创建 `LLMRequest`，自动加载任务模型集与上下文管理器：

- `task`：模型任务名称（对应 `config/model.toml` 中的 task key），默认 `"actor"`
- `request_name`：请求名称，默认使用 `chatter_name`
- `with_reminder`：可选的 system reminder bucket 名（也接受 `SystemReminderBucket` 枚举）；传入后会自动登记**全局** + **流私有**两个 bucket，无需插件侧额外处理

```python
req = self.create_request(task="actor", request_name="my_chatter")
req.add_payload(LLMPayload(ROLE.SYSTEM, Text("你是一个简洁的助手")))
```

### `await self.inject_usables(request)`

封装了 `get_llm_usables` → `modify_llm_usables` → 构建 `ToolRegistry` → 注入 `TOOL` payload 的固定链路，返回 `ToolRegistry`：

```python
req = self.create_request(request_name="my_chatter")
registry = await self.inject_usables(req)
```

### `await self.run_tool_call(calls, response, usable_map, trigger_msg, task_observer=None)`

执行一次响应中的普通 tool calls，并按顺序写回 `TOOL_RESULT`。控制流工具（`pass_and_wait` / `stop_conversation` 等）仍需调用方先行处理。

返回 `list[tuple[bool, bool]]`，每项为 `(是否已写回 TOOL_RESULT, execute 是否成功)`。

### `self.apply_stream_runtime_options(chat_stream)`

将 Chatter 声明的 `stream_tick_interval`、`allow_message_buffer` 写入当前聊天流上下文。通常由框架在调度 Chatter 时调用，开发者一般无需手动调用。

### `self.format_message_line(msg, time_format="%H:%M")` *静态方法*

将单条 `Message` 渲染为统一显示行，格式：

```
【时间】<role> [platform_id] 昵称:nickname$群名片:cardname [msg_id]： 消息
```

`fetch_unreads` 内部即使用该方法生成消息文本。

## 最小示例

```python
from typing import AsyncGenerator

from src.core.components.base.chatter import BaseChatter, Wait, Success, Failure
from src.kernel.llm import LLMPayload, ROLE, Text


class SimpleChatter(BaseChatter):
    chatter_name = "simple_chatter"
    chatter_description = "基础对话"

    async def execute(self) -> AsyncGenerator[Wait | Success | Failure, None]:
        unread_text, unread_messages = await self.fetch_unreads()
        if not unread_messages:
            yield Wait()
            return

        req = self.create_request(task="actor", request_name="simple_chatter")
        req.add_payload(LLMPayload(ROLE.SYSTEM, Text("你是简洁的中文助手")))
        req.add_payload(LLMPayload(ROLE.USER, Text(unread_text)))

        yield Wait()
        resp = await req.send(stream=False)

        answer = (resp.message or "").strip()
        if not answer:
            yield Failure("LLM 返回为空")
            return

        from src.app.plugin_system.api.send_api import send_text
        ok = await send_text(answer, self.stream_id)
        if not ok:
            yield Failure("发送回复失败")
            return

        await self.flush_unreads(unread_messages)
        yield Success("对话完成")
```

## Tool Calling 关键点

- 工具声明应通过 `inject_usables()` 或 `ROLE.TOOL` 的 payload 提供给请求。
- 响应对象字段使用 `response.message` 与 `response.call_list`。
- 工具执行结果回传应使用 `ROLE.TOOL_RESULT`，可借助 `run_tool_call()` 一次性写回。
- 控制流类工具（如 `pass_and_wait` / `stop_conversation`）应先由调用方处理，再调用 `run_tool_call()` 执行剩余 call。
