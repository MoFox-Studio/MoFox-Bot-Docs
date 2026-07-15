# OneBot 适配器开发指南 · 总览

本文面向希望监听 OneBot 通知事件或扩展适配器行为的插件开发者，详列适配器对外发布的事件、通知转换为 `MessageEnvelope` 后的字段结构、消息段格式与处理流程。

## 组件签名

| 组件签名 | 类型 | 说明 |
|----------|------|------|
| `onebot_adapter:adapter:onebot_adapter` | Adapter | OneBot 11 适配器，负责协议双向转换 |

## 通知事件

适配器在处理 OneBot 通知（notice）时，会通过框架事件总线 `event_api` 发布事件。其他插件可订阅：

```python
from src.app.plugin_system.api import event_api

@event_api.on_event("onebot.on_received.friend_recall")
async def _on_friend_recall(event):
    message_id = event.data.get("message_id")
    user_id = event.data.get("user_id")
    ...
```

### 事件常量

事件名定义在 `onebot_adapter.src.event_types.OneBotEvent.ON_RECEIVED`，建议作为常量引用避免拼写错误：

```python
from plugins.onebot_adapter.src.event_types import OneBotEvent

@event_api.on_event(OneBotEvent.ON_RECEIVED.FRIEND_RECALL)
async def _on_recall(event): ...
```

### 事件清单

| 事件常量 | 事件名 | 触发时机 | 事件数据字段 |
|----------|--------|----------|--------------|
| `FRIEND_RECALL` | `onebot.on_received.friend_recall` | 好友撤回消息 | `message_id: str`、`user_id: str`（操作者） |
| `GROUP_RECALL` | `onebot.on_received.group_recall` | 群消息撤回 | `message_id: str`、`user_id: str`（操作者）、`group_id` |
| `EMOJI_LIEK` | `onebot.on_received.emoji_like` | 群聊表情回复（贴表情） | `message_id: str`（被贴表情的消息）、`emoji_id: str`、`group_id`、`user_id`（贴表情者） |

::: tip 事件触发条件
- `emoji_like` 事件会过滤机器人自己贴表情触发的回声，避免循环
- 撤回事件会尝试通过 `get_message_detail` 拉取被撤回消息的预览文本
:::

## 通知 MessageEnvelope 结构

每条通知除发布事件外，还会转换为标准的 `MessageEnvelope` 送回核心系统。通知的扩展信息统一携带在 `message_info.extra` 字段中（`notice_config` 字典），同时 `message_info.message_type` 被显式标记为 `"notice"`，使核心 receiver 路由到通知处理路径而非普通消息路径。

### `notice_config` 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `is_notice` | `bool` | 是否为通知类消息（区别于普通聊天消息） |
| `is_public_notice` | `bool` | 是否为公开通知 |
| `notice_type` | `str` | 通知类型标识，见下表 |
| `text_description` | `str` | 人类可读的描述文本，已作为 `text` 段注入机器人 prompt |
| `message_id` | `str` | 关联的消息 ID（如撤回的消息、被贴表情的消息） |
| `target_id` | `Any` | 通知的目标对象 ID（如戳一戳的被戳者） |
| `raw` | `dict` | 仅未支持的 notice 类型时携带原始 OneBot 数据，同时挂到 `envelope["raw_message"]` |

### `notice_type` 取值

| `notice_type` | 触发场景 | 描述文本示例 |
|---------------|----------|--------------|
| `friend_recall` | 好友撤回消息 | `张三撤回了一条消息[原消息:...]` |
| `group_recall` | 群消息撤回 | `李四撤回了一条消息[原消息:...]` |
| `poke` | 戳一戳 | `张三 戳了戳 我` |
| `emoji_like` | 群聊表情回复 | `张三使用Emoji表情[笑脸]回应了消息[原消息文本]` |
| `group_ban` | 群禁言（某人被禁言） | `李四 将 王五 禁言了 600 秒` |
| `group_whole_ban` | 全员禁言 | `李四开启了全体禁言` |
| `group_lift_ban` | 解除某人禁言 | `李四解除了王五的禁言` |
| `group_whole_lift_ban` | 关闭全员禁言 | `李四关闭了全体禁言` |
| `group_upload` | 群文件上传 | `张三 上传了文件: report.pdf (大小: 1024 字节)` |
| `<原始 notice_type>` | 未支持类型 | 原始 raw 数据（见下） |

::: warning 未支持类型不丢弃
对于暂不支持具体转换的 notice 类型，适配器**不会丢弃**数据，而是把原始 `raw` 包装为 `MessageEnvelope`（携带在 `message_info.extra.raw` 与 `raw_message` 字段中）交给下游处理，`notice_type` 为原始 OneBot 的 `notice_type` 字符串。
:::

### 消息文本段（message_segment）

通知转换为 `MessageEnvelope` 时，其 `message_segment` 通常是一个 `seglist`，内含一个 `text` 类型的 `SegPayload`，`data` 即为 `text_description`：

```python
# 戳一戳通知
envelope["message_segment"] = {
    "type": "seglist",
    "data": [{"type": "text", "data": "张三 戳了戳 我"}],
}
# 群禁言
envelope["message_segment"] = {
    "type": "seglist",
    "data": [{"type": "text", "data": "李四 将 王五 禁言了 600 秒"}],
}
```

机器人可直接基于这段文本决定如何回应。`content_format` 中会包含 `"notify"` 标记。

### UserInfoPayload 字段

通知携带的 `message_info.user_info`（`UserInfoPayload`）字段：

| 字段 | 说明 |
|------|------|
| `platform` | 固定 `"qq"` |
| `role` | `UserRole.MEMBER` 等（由 OneBot 角色映射） |
| `user_id` | 操作者 QQ（字符串） |
| `user_nickname` | 操作者昵称 |
| `user_cardname` | 操作者群名片（已 sanitize） |

群禁言类通知还会在 `seg.data` 中附带 `banned_user_info` / `lifted_user_info` 与 `duration` 字段。

## 戳一戳行为细节

- **防抖**：针对机器人自身的戳一戳，`features.poke_debounce_seconds` 时间内只处理一次
- **忽略机器人戳别人**：机器人自己戳别人触发的 notice 不会送回核心（`self_id == user_id` 时返回 None）
- **忽略非自己的戳一戳**：`features.ignore_non_self_poke=true` 时，被戳者不是机器人则丢弃
- **配置开关**：`features.enable_poke=false` 时整个戳一戳处理被关闭
- `poke` 事件的 `target_id` 来自 OneBot 原始 `target_id`

## 表情回复行为细节

- **过滤回声**：机器人自己贴表情触发的 notice 会被忽略（`str(user_id) == str(self_id)`），避免循环
- **配置开关**：`features.enable_emoji_like`（若存在）控制是否处理
- 事件数据中 `emoji_id` 取自 OneBot `likes[0].emoji_id`
- 描述文本中的表情名来自内置 `QQ_FACE` 映射表，找不到时显示 `[表情{emoji_id}]`
- 处理前会通过 `get_message_detail` 拉取被贴表情消息的预览文本

## 消息方向与处理流程

### 接收方向（to_core）

`OneBotAdapter.from_platform_message(message)` 根据原始事件的 `post_type` 路由：

| `post_type` | Handler | 说明 |
|-------------|---------|------|
| `message` | `MessageHandler.handle_raw_message` | 普通消息（文本/图片/@/回复/语音/视频/转发/文件/JSON 等） |
| `notice` | `NoticeHandler.handle_notice` | 本文描述的通知 |
| `meta_event` | `MetaEventHandler` | 心跳等元事件 |

::: tip 黑白名单过滤位置
黑白名单过滤已统一移到 `OneBotAdapter.from_platform_message` 顶层执行，确保所有类型的事件（消息、通知等）都能被统一过滤。
:::

### 普通消息段类型

`MessageHandler.handle_single_segment` 支持的 OneBot 消息段类型：

| OneBot 段类型 | 处理方法 | 说明 |
|---------------|----------|------|
| `text` | `_handle_text_message` | 文本 |
| `face` | `_handle_face_message` | QQ 表情 |
| `image` | `_handle_image_message` | 图片（含 base64 / url） |
| `at` | `_handle_at_message` | @某人 |
| `reply` | `_handle_reply_message` | 回复 |
| `record` | `_handle_record_message` | 语音 |
| `video` | `_handle_video_message` | 视频 |
| `rps` / `dice` | `_handle_rps_message` / `_handle_dice_message` | 猜拳 / 骰子 |
| `forward` | `handle_forward_message` | 合并转发（递归解析） |
| `file` | `_handle_file_message` | 文件 |
| `json` | `_handle_json_message` | JSON 卡片 |

普通消息的 `sender.role` 会被映射：`owner` → `UserRole.OWNER`、`admin` → `UserRole.OPERATOR`、`member` → `UserRole.MEMBER`。

### 发送方向（to_napcat）

`OneBotAdapter._send_platform_message(envelope)` 调用 `SendHandler`，将 `MessageEnvelope` 的 `message_segment` 转换为 OneBot 11 API 调用发送出去。

## 核心 API 调用模式（响应池）

适配器内部通过基于 echo 的 request-response 模式调用 OneBot API，超时默认 10 秒。其他需要直接调用 OneBot API 的场景可参考 `send_onebot_api(action, params)` 实现：

1. 生成唯一 `echo`（`{action}_{uuid}`）
2. 创建 `asyncio.Future` 放入 `_response_pool`
3. 通过 WebSocket 发送 `{"action", "params", "echo"}` 请求
4. 等待响应（带超时），完成后从池中移除

## 相关数据结构

完整的 `MessageEnvelope` / `SegPayload` / `MessageInfoPayload` / `UserInfoPayload` 定义见 `mofox_wire.types`（TypedDict）。适配器使用 `MessageBuilder` 构造 envelope，调用 `.direction()` / `.from_user()` / `.from_group()` / `.format_info()` / `.seg_list()` / `.build()`。

## 版本

- Plugin: `2.0.0`
- min_core_version: `1.0.0`
- Python 依赖：`pillow>=12.1.0`（必需）
