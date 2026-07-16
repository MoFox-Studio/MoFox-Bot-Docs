# 使用教程

本教程适用于已经在 QQ 开放平台创建机器人应用，并已取得 AppID 和 AppSecret 的用户。教程以 Neo-MoFox 中的基础私聊和群聊接入为主。

## 1. 开始使用

- 从 `http://39.96.71.162/plugin/qqbot_adapter` 下载qqbot适配器

并确认 Neo-MoFox 中存在以下目录：

```text
plugins/qqbot_adapter.mfp
```

## 2. 配置注意项

注意：

- AppID 和 AppSecret 必须属于同一个 QQ 机器人应用。
- 当前只支持单分片，`shard_count` 必须为 `1`。
- 不要公开配置文件或将 AppSecret 写入日志、截图和公开仓库。

## 3. 启动 Neo-MoFox

按 Neo-MoFox 的正常方式启动程序。日志中依次出现以下内容，表示接入成功：

```text
QQ Bot 适配器正在启动...
QQ Bot access_token 获取成功，有效期 7200 秒
获取网关地址成功: wss://...
WebSocket 连接已建立
Ready! Bot: 我的机器人 (id=xxx)
QQ Bot 适配器已就绪
```

## 4. 启用 Markdown 回复

确认机器人账号具备 QQ Markdown 能力后，修改：

```toml
[features]
markdown_support = true
```

启用后，回复内容则进行Markdown渲染

如果启用后 QQ API 返回请求错误，先关闭该选项恢复普通文本，再检查机器人应用是否具有 Markdown 权限。

## 5. 关于流式回复

以下配置只开放 C2C 流式能力：

```toml
[features]
markdown_support = true
streaming = true
streaming_update_interval_ms = 500
```

注意：

- 流式消息只支持 C2C 私聊；
- 流式接口固定使用 Markdown，因此必须同时开启 `markdown_support`；
- `streaming = true` 不会自动把默认 AI 回复改为流式；
- 流式发送需要其他插件显式调用实验性的 `QQBotService.start_streaming()`。

普通用户如果没有配套插件，应保持：

```toml
streaming = false
```

## 6. 多个 QQ Adapter 同时接入

本 Adapter 使用统一的平台标识 `qq`。如果 Neo-MoFox 同时接入其他 QQ 账号或 QQ Adapter，请结合 `stream_adapter_affinity`，避免回复被路由到错误的 Adapter。

QQ openid 是各 Bot 视角下的标识，不应在不同 Bot 之间直接复用名单或主动发送目标。

## 7. 常用诊断开关

```toml
[features]
debug_log_raw_payload = true
debug_log_outbound_payload = true
```

- `debug_log_raw_payload`：记录完整入站事件，适合查找 openid 和消息结构。
- `debug_log_outbound_payload`：以 debug 级别记录发往 QQ API 的 URL 和完整请求体。

日志可能包含用户消息、openid、`msg_id` 和媒体 URL。排查结束后请关闭开关，并在分享日志前完成脱敏。

## 8. 故障排除

- AppID 或 AppSecret 无效：是否仍使用占位值、空字符串或错误应用的凭证；AppID 和 AppSecret 是否属于同一个 QQ 开放平台应用。
- Token 获取失败：QQ API暂不可用；DNS、TLS、代理或防火墙问题；系统时间错误。
- 30 秒内未收到 READY：是否已获得 Token；是否出现 `WebSocket 连接已建立` 和 `收到 Hello`；QQ 开放平台是否为应用开放对应事件权限。
- Intents 鉴权失败：应用是否已上线或仍处于允许使用的沙箱状态；`connection.intents` 是否包含未申请的事件；是否至少具有群聊/C2C 所需权限。
- 心跳、断线与 Resume：服务器正常要求重连时，将会使用随机抖动进行重连，属于正常现象。
- 分片配置无效：当前版本只实现一个 Gateway 实例，`shard_count` 固定为 `1`。
- 收不到消息：插件配置中消息类型被关闭；没有配置机器人可获取消息范围（主人号在QQ群聊中点击机器人头像`设置`——`机器人可获取的群聊消息范围`将其设置成`获取群内全部消息`
- 用户名显示为 `QQ用户_xxxxxxxx`：QQ 官方 C2C 事件通常没有 username。这不是收信故障。可通过 `features.user_alias_map` 手动设置。
- 主动消息受限：QQ官方对bot有发送消息数限制，具体以官方开发文档为准。
- 开启 streaming 但没有流式输出：需要chatter插件主动调用`QQBotService.start_streaming()`。
- 流式中途停止：属于 QQ 流式发送问题；
