# DFC 开发指南 · 总览

本文面向希望复用默认聊天器完整聊天链路的插件开发者，详述通用聊天服务 `default_chatter:service:chat_core` 的工厂方法、会话异步生成器驱动方式、配置项、全部适配器协议方法与会话状态机。

## 组件签名

| 组件签名 | 类型 | 说明 |
|----------|------|------|
| `default_chatter:service:chat_core` | Service | 聊天核心工厂（`DefaultChatterService`） |
| `default_chatter:chatter:default_chatter` | Chatter | 框架默认聊天器（薄适配层，委托给 session） |
| `default_chatter:action:send_text` | Action | 标准文本发送 |
| `default_chatter:action:pass_and_wait` | Action | 本轮挂起等待 |
| `default_chatter:action:stop_conversation` | Action | 结束本轮对话 |

## 跨插件调用约定

外部插件**不能**直接 `import plugins.default_chatter.*`，只能通过框架 Service API 获取：

```python
from src.app.plugin_system.api.service_api import get_service

service = get_service("default_chatter:service:chat_core")
```

---

## DefaultChatterService 接口

服务签名：`default_chatter:service:chat_core`。本身是工厂，**不保存**会话运行态。

### `create_default_session(*, stream_id, plugin, chatter=None, options=None) -> DefaultChatterSession`

创建一个由框架默认 chatter 运行时支持的会话。**这是跨插件接入的推荐方式**。

| 参数 | 类型 | 说明 |
|------|------|------|
| `stream_id` | `str` | 要使用的聊天流 ID |
| `plugin` | `BasePlugin` | 调用方插件实例（通常传 `service.plugin`） |
| `chatter` | `BaseChatter \| None` | 可选，传入自定义 chatter 实例以复用其 request / prompt / unread / tool 等能力；为 `None` 时内部新建 `DefaultChatter(stream_id, plugin)` |
| `options` | `DefaultChatterSessionOptions \| None` | 可选，为 `None` 时从插件配置构建默认 options |

内部会自动用 `chatter`（或新建的 `DefaultChatter`）填充全部 adapters（request/prompt/unread/usable/tool_execution/sub_agent/logger/plain_text）。

```python
session = service.create_default_session(
    stream_id="my-stream-id",
    plugin=service.plugin,
)
```

### `create_session(*, stream_id, options=None, adapters=None) -> DefaultChatterSession`

把 DFC 当成底层会话引擎，自己提供全部适配器。**主要面向 default_chatter 插件内部 / 框架内部 / 受控同仓库代码**，不建议跨插件直接依赖其内部类型。

- `adapters` 为 `None` 时回退到 `create_default_session`
- `adapters` 非 `None` 时必须提供全部适配器

---

## DefaultChatterSession 接口

会话核心，保存单次运行的状态。**一个 `stream_id` 的一次运行创建一个新 session，不要跨流复用。**

### 四相状态机

session 内部维护固定的四相 FSM（`DefaultChatterSessionPhase`）：

| 阶段 | 说明 |
|------|------|
| `WAIT_USER` | 等待用户消息，或等待外部恢复事件 |
| `MODEL_TURN` | 由模型做出本轮决策并输出文本 / tool calls |
| `TOOL_EXEC` | 执行模型本轮给出的工具调用，并把结果回写进上下文 |
| `FOLLOW_UP` | 在工具结果尾部、等待超时、sub-agent 完成等场景下继续推进后续决策 |

session 还维护 `DefaultChatterSessionState`：`response`、`phase`、`history_merged`、`unreads`、`cross_round_seen_signatures`、`unread_msgs_to_flush`、`plain_text_retry_count`、`used_tools_in_round`、`tool_results_in_round`、`internal_context_ids`。

### `execute() -> AsyncGenerator[Wait | Success | Failure | Stop, WaitResumeEvent | None]`

最重要的公共接口，异步生成器。自动完成：

1. 通过 `get_stream_manager().activate_stream(stream_id)` 激活 `ChatStream`，失败则 `yield Failure`
2. 拉起完整对话状态机（委托给 `execute_with_stream`）
3. 需要等待时 `yield Wait`
4. 接收 `WaitResumeEvent` 恢复后继续执行
5. 结束时 `yield Success` / `Failure` / `Stop`

**最小驱动示例：**

```python
from src.core.components.base import Failure, Stop, Success, Wait
from src.core.components.base import WaitResumeEvent


async def run_session(session) -> None:
    runner = session.execute()
    resume_event: WaitResumeEvent | None = None

    while True:
        try:
            result = await runner.asend(resume_event)
        except StopAsyncIteration:
            return

        resume_event = None

        if isinstance(result, Wait):
            resume_event = await wait_for_resume_event()  # 你自己实现
            continue
        if isinstance(result, Success):
            return
        if isinstance(result, Stop):
            return
        if isinstance(result, Failure):
            raise RuntimeError(result.message)
```

可以理解为：

- **session** 负责「计算下一步该做什么」
- **外部调度器** 负责「在 yield 之后何时继续」

### `execute_with_stream(chat_stream, *, apply_stop_wake_config) -> AsyncGenerator[...]`

更偏内部 / 高级接入场景的入口。`execute()` 内部就是先激活流再委托给它。一般插件调用只需要 `execute()`。

执行链路概要：

1. 若 `options.native_multimodal`，跳过该流的默认 VLM 图片识别
2. `request_adapter.create_request(actor_task_name, with_reminder="actor")` 创建 LLM 请求
3. `prompt_adapter._build_system_prompt` 构建系统提示并加入请求
4. `prompt_adapter._build_enhanced_history_text` 合并历史消息
5. `unread_adapter.fetch_unreads` 拉取未读消息并格式化
6. `_build_user_prompt` 构建 user prompt（含 `theme_guide` / 负面行为强化）
7. `usable_adapter.inject_usables(request)` 注入 tools / actions / agents
8. 发送模型请求，执行 tool calls（`tool_execution_adapter.run_tool_call`）
9. 根据结果继续 follow-up 或进入 wait / stop

### 恢复事件来源

DFC 典型接收这些恢复来源：

- 新消息触发
- `pass_and_wait` 设置的 timer 触发
- sub-agent 完成事件

对 session 而言，它只接收统一的 `WaitResumeEvent`，不关心外部恢复事件来自哪个子系统。

---

## DefaultChatterSessionOptions

session 的显式配置入口（`DefaultChatterSessionOptions`，dataclass）：

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `actor_task_name` | `str` | `"actor"` | 主对话 actor 使用的模型任务名 |
| `sub_actor_task_name` | `str` | `"actor"` | 子代理使用的模型任务名 |
| `enable_cooldown` | `bool` | `False` | 是否允许 `stop_conversation` 引入冷却语义 |
| `enable_action_suspend` | `bool` | `True` | 是否在 action-only 回合注入 suspend 占位 |
| `enable_programmatic_controller` | `bool` | `True` | 是否启用程序化前置控制（sub-agent 场景概率直通） |
| `enable_sub_agent_collaboration` | `bool` | `False` | 是否启用子代理协作能力 |
| `enable_stop_direct_message_wake` | `bool` | `False` | `Stop` 时是否允许私聊直唤重新激活 |
| `stop_direct_message_wake_probability` | `float` | `0.0` | Stop 状态下私聊直唤概率（0.0~1.0） |
| `native_multimodal` | `bool` | `False` | 是否让 unread 合并路径直接承载图片等多模态内容 |
| `theme_guide` | `dict[str, str]` | `{}` | 按场景区分的主题引导文本，通常含 `private` / `group` |
| `negative_behavior_reinforcement` | `bool` | `True` | 是否在 prompt 中追加负面行为强化 |
| `enable_llm_stream` | `bool` | `False` | 是否启用 LLM 流式输出 |

---

## DefaultChatterSessionAdapters

DFC 对外暴露的真实 seam（`DefaultChatterSessionAdapters`，dataclass）。目标是「允许替换能力来源」，不是「允许外部改写整个会话流程」。

| 字段 | 类型 | 默认 | 职责 |
|------|------|------|------|
| `request_adapter` | `SupportsRequestCreation` | 必填 | 创建 LLM 请求 |
| `prompt_adapter` | `PromptAdapter` | 必填 | 构建 prompt 各部分 |
| `unread_adapter` | `UnreadAdapter` | 必填 | 未读消息生命周期 |
| `usable_adapter` | `UsableAdapter` | 必填 | tools / actions / agents 注入 |
| `tool_execution_adapter` | `ToolExecutionAdapter` | 必填 | 执行模型给出的工具调用 |
| `sub_agent_adapter` | `SubAgentAdapter` | 必填 | unread 到来时的 sub-agent 判定 |
| `logger_adapter` | `LoggerAdapter` | 必填 | 日志与决策面板 |
| `plain_text_adapter` | `PlainTextResponseAdapter \| None` | `None` | 模型错误输出纯文本时的补救 |
| `stream_event_observer` | `Callable[..., Awaitable[None]] \| None` | `None` | 流式事件观察者 |

### 各适配器协议方法

#### request_adapter（`SupportsRequestCreation`）

```python
def create_request(
    self,
    task: str = "actor",
    request_name: str = "",
    with_reminder: str | None = None,
) -> LLMRequest: ...
```

#### prompt_adapter（`PromptAdapter`）

```python
async def _build_system_prompt(self, chat_stream: ChatStream) -> str: ...
def _build_enhanced_history_text(self, chat_stream: ChatStream) -> str: ...
async def _build_user_prompt(
    self,
    chat_stream: ChatStream,
    history_text: str,
    unread_lines: str,
    extra: str = "",
) -> str: ...
def _build_negative_behaviors_extra(self) -> str: ...
```

#### unread_adapter（`UnreadAdapter`）

```python
async def fetch_unreads(
    self,
    time_format: str = "%H:%M",
) -> tuple[str, list[Message]]: ...

def format_message_line(
    self,
    msg: Message,
    time_format: str = "%H:%M",
) -> str: ...

def _upsert_pending_unread_payload(
    self,
    response: LLMConversationState,
    formatted_text: str,
    unread_msgs: list[Message] | None = None,
    native_multimodal: bool = False,
    logger_override: Logger | None = None,
) -> None: ...

async def flush_unreads(self, unread_messages: list[Message]) -> int: ...
```

#### usable_adapter（`UsableAdapter`）

```python
async def inject_usables(self, request: LLMRequest) -> ToolRegistry: ...
```

#### tool_execution_adapter（`ToolExecutionAdapter`）

```python
async def run_tool_call(
    self,
    calls: list[ToolCall],
    response: LLMResponseLike,
    usable_map: ToolRegistry,
    trigger_msg: Message | None,
) -> list[tuple[bool, bool]]: ...
```

返回 `[(success, is_action), ...]`，标记每个工具调用的执行结果与是否为 action。

#### sub_agent_adapter（`SubAgentAdapter`）

```python
async def sub_agent(
    self,
    unreads_text: str,
    unread_msgs: list[Message],
    chat_stream: ChatStream,
) -> SubAgentDecision: ...
```

`SubAgentDecision` 为 `{"reason": str, "should_respond": bool}`。

#### logger_adapter（`LoggerAdapter`）

```python
def info(self, *args, **kwargs) -> None: ...
def warning(self, *args, **kwargs) -> None: ...
def error(self, *args, **kwargs) -> None: ...
def debug(self, *args, **kwargs) -> None: ...
def print_panel(
    self,
    message: str,
    title: str | None = None,
    border_style: str | None = None,
) -> None: ...
```

#### plain_text_adapter（`PlainTextResponseAdapter`，可选）

```python
def handle_plain_text_response(
    self,
    *,
    message: str,
    retry_count: int,
    response: LLMResponseLike,
) -> PlainTextResponseHandling: ...
```

`PlainTextResponseHandling` 为 `{"action": "retry"|"wait"|"stop", "reminder_text": str}`。

---

## Action 语义

### `send_text`

DFC 唯一标准文本输出路径。适合普通文本回复、多段连续发送、回复指定消息、指定 `at` 对象。不适合非文本媒体发送、把思维过程混入 `content`。

### `pass_and_wait`

本轮不再继续，挂起并等待新消息或定时器恢复。可选传入等待秒数，适合：

- 等用户下一条消息
- 设定一个稍后主动继续的 timer
- 工具链暂不需要再做 follow-up 的场景

### `stop_conversation`

显式结束本轮对话。与 `pass_and_wait` 的区别：

- `pass_and_wait` 是「挂起，准备恢复」
- `stop_conversation` 是「结束这一轮，让外部决定何时再次启动」

---

## Sub-agent 协作

启用 `enable_sub_agent_collaboration` 后，DFC 进入主代理协调模式，向主会话注入管理型 usable：

- `create_agent`：创建子代理
- `get_agent`：查询子代理状态
- `kill_agent`：销毁子代理及其级联后代

特性：

- 子代理状态按 `stream_id` 聚合管理
- 子代理完成后可通过 resume 事件回灌主会话
- 主会话 follow-up 时可读取子代理回灌结果
- 协作场景下普通工具与 MCP 能力会受到更严格的暴露控制（主代理不能直接用 MCP 工具，只能分配给子代理）

## 程序化前置控制器

`enable_programmatic_controller=True` 时，在正式发起 LLM 判定前做额外 gating：

- 主要用于 sub-agent 场景下的概率直通响应
- 群聊中按 `base_bypass_probability` + 命中名字 / 别名 / 未读消息加成决定是否跳过 LLM sub-agent 直接响应
- 关闭后群聊消息将始终经过 LLM sub-agent 决策

## 设计边界

- `send_text` / `pass_and_wait` / `stop_conversation` 仍然是插件层 action 组件
- service 是工厂，不保存会话运行态
- session 才保存单次运行的状态
- 外部通过 options 和 adapters 定制行为，而不是通过继承 session 改流程
- 一个 `stream_id` 的一次运行创建一个新 session，不要跨流复用

## 完整使用示例

```python
from src.app.plugin_system.api.service_api import get_service
from src.core.components.base import Failure, Stop, Success, Wait


async def run_chat(stream_id: str) -> None:
    service = get_service("default_chatter:service:chat_core")
    if service is None:
        raise RuntimeError("default_chatter service is not available")

    session = service.create_default_session(
        stream_id=stream_id,
        plugin=service.plugin,
    )

    runner = session.execute()
    resume_event = None
    while True:
        try:
            result = await runner.asend(resume_event)
        except StopAsyncIteration:
            return
        resume_event = None
        if isinstance(result, Wait):
            resume_event = await wait_for_resume_event()
        elif isinstance(result, Success):
            return
        elif isinstance(result, Stop):
            return
        elif isinstance(result, Failure):
            raise RuntimeError(result.message)
```

## 版本

- Plugin: `1.1.0`
- min_core_version: `1.2.0-alpha`
