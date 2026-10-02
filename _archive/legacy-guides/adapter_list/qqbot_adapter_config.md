# QQ Bot 适配器配置指南

> [!IMPORTANT]
> `qqbot_adapter` 是 **社区插件**，由社区开发者 [qf](https://github.com/qingfeng66640) 维护，仓库地址：<https://github.com/qingfeng66640/qqbot_adapter>。
> 该插件不在 Neo-MoFox 主程序内置范围内，需要自行安装后才能使用。插件市场地址：<https://39.96.71.162/plugin/qqbot_adapter>。

> [!CAUTION]
> **免责声明**：本社区插件由第三方开发者独立维护，与 Neo-MoFox 核心团队无关。插件的功能、稳定性、安全性和后续更新均由原作者负责。使用本插件产生的一切问题（包括但不限于账号封禁、数据泄露、服务中断、财产损失等），Neo-MoFox 核心团队不承担任何责任。请你在安装和使用前自行评估风险，仅从你完全信任的来源获取插件。

## 概述

QQ Bot 适配器（`qqbot_adapter`）用于对接腾讯 QQ 官方机器人（小龙虾 Bot）。它使用 QQ 官方 WebSocket OpCode 网关协议接收消息，通过 REST API 发送消息，认证方式为 `AppID + AppSecret`。

核心流程：

1. `AppID + AppSecret` → 获取 `access_token`（定时自动刷新）
2. WebSocket 连接 QQ 网关 → `Hello` → `Identify` → `Ready`
3. 收到 Dispatch 事件 → 转换为 `MessageEnvelope`
4. 推送到 Neo-MoFox 核心
5. 核心回复 → 通过 QQ REST API 发送

与 [OneBot 适配器](./onebot_v11_config) 的区别：

| 维度 | OneBot 适配器 | QQ Bot 适配器（本插件） |
| --- | --- | --- |
| 接入方式 | 通过 Napcat 等 OneBot 实现 | 直连 QQ 官方机器人开放平台 |
| 认证 | 无需 AppID/AppSecret | 需要 QQ 开放平台的 AppID/AppSecret |
| 协议 | OneBot v11 | QQ 官方 WebSocket OpCode 网关 |
| 消息能力 | 自由度较高，受 OneBot 实现限制 | 受 QQ 官方接口限制（主动消息数、Markdown 权限等） |
| 平台标识 | `qq` | `qq` |

> [!NOTE]
> 两个适配器都使用统一的平台标识 `qq`。如果同时接入会涉及路由冲突，详见 [多个 QQ Adapter 同时接入](#多个-qq-adapter-同时接入)。

## 前置条件

在配置适配器之前，请确保已完成：

1. Neo-MoFox 主程序部署（Python 环境 + 依赖安装）
2. `config/core.toml` 和 `config/model.toml` 基础配置
3. 已在 [QQ 开放平台](https://q.qq.com/) 创建机器人应用，并取得 **AppID** 和 **AppSecret**
4. 已为机器人应用申请所需事件权限（群聊 @ 消息、C2C 单聊消息等）
5. 如使用正式环境（`production`），已在 QQ 开放平台为应用配置 **IP 白名单**

## 安装插件

`qqbot_adapter` 是社区插件，使用前需要先安装到 Neo-MoFox。详细的安装步骤请参考 [插件安装指南](/docs/guides/usage/plugin-installation-guide)。

简要步骤：

1. 进入 [插件市场 · qqbot_adapter](https://39.96.71.162/plugin/qqbot_adapter) 页面。
2. 点击 **「下载插件」** 获取 `qqbot_adapter.mfp` 插件包，或通过 **「订阅更新」** 让主程序自动同步。
3. 将插件包按 Neo-MoFox 插件安装规则放入主程序的插件目录，安装完成后目录结构应为：

    ```text
    plugins/qqbot_adapter.mfp
    config/plugins/qqbot_adapter/config.toml
    ```

4. 插件依赖 `websockets>=12.0`、`httpx>=0.24.0`、`h2>=4.0.0`，大部分情况下 Neo-MoFox 会自动安装 Python 依赖；如自动安装失败，可手动执行 `uv pip install websockets httpx h2`。
5. 最低要求 Neo-MoFox 内核版本 `1.2.0-rc`。

## 配置适配器

插件安装完成后，配置文件位于 `config/plugins/qqbot_adapter/config.toml`。下面按配置区块逐项说明。

### 启用适配器

```toml
[plugin]
enabled = true          # 是否启用 QQ Bot 适配器
config_version = "1.0.0" # 配置文件版本（只读，请勿修改）
```

### Bot 身份与认证

```toml
[bot]
app_id = ""        # 必填：QQ 开放平台的 AppID
app_secret = ""    # 必填：QQ 开放平台的 AppSecret
bot_name = "QQBot" # Bot 显示名称（READY 事件未携带用户名时使用）
```

> [!WARNING]
> - AppID 和 AppSecret 必须属于同一个 QQ 机器人应用。
> - 不要公开配置文件，或将 AppSecret 写入日志、截图和公开仓库。
> - 若 AppID/AppSecret 仍为占位值或空字符串，适配器启动时会直接报错。

### 连接配置

```toml
[connection]
env = "sandbox"             # 运行环境：sandbox(沙箱) / production(正式)
intents = 33554432          # 事件订阅位掩码，默认 33554432=GROUP_AND_C2C_EVENT（群聊@+单聊）
shard_count = 1             # 当前仅支持单分片，固定为 1（已禁用修改）
reconnect_interval = 5.0    # WebSocket 重连间隔（秒），范围 1.0~60.0
max_reconnect_attempts = 0  # 最大重连次数，0 表示无限重连
```

说明：

- `env`：沙箱环境不需要 IP 白名单；正式环境需在 QQ 开放平台配置 IP 白名单。
- `intents`：传入未授权的 intents 会导致 WebSocket 连接被拒。如不需要群聊或单聊，可按需调整。
- `shard_count`：当前版本只实现一个 Gateway 实例，固定为 `1`。

### 功能特性

```toml
[features]
# === 消息开关 ===
enable_group_message = true   # 启用群聊消息处理（GROUP_AT_MESSAGE_CREATE 事件）
enable_c2c_message = true     # 启用单聊消息处理（C2C_MESSAGE_CREATE 事件）

# === 群聊触发策略 ===
require_mention = true        # 群聊是否需要 @机器人才响应（默认 true）
ignore_other_mentions = false # @了其他用户但没有 @机器人时是否丢弃消息（默认 false）

# === 名单与封禁 ===
group_list_type = "blacklist"  # 群聊名单模式：blacklist / whitelist
group_list = []                # 群聊名单（填入 group_openid）
private_list_type = "blacklist"# 私聊名单模式：blacklist / whitelist
private_list = []              # 私聊名单（填入 user_openid）
ban_user_id = []               # 全局封禁的用户 openid 列表（消息完全忽略）

# === 回复格式与流式 ===
markdown_support = false              # 普通回复是否以 QQ Markdown 消息体发送（需账号具备能力）
streaming = false                     # 启用流式消息能力（仅 C2C 私聊有效）
streaming_update_interval_ms = 500    # 流式刷新间隔（毫秒），范围 300~3000

# === 被动回复概率 ===
enable_passive_reply_probability = false # 是否在 5 分钟窗口内按概率使用 msg_id 被动回复
passive_reply_rate = 1.0                 # 被动回复概率（0.0~1.0）

# === 用户名映射 ===
user_alias_map = []  # 手动用户名映射，格式 openid:昵称（优先级最高）

# === 调试开关 ===
debug_log_raw_payload = false      # 打印所有入站事件的原始 JSON payload
debug_log_outbound_payload = false # 打印发往 QQ API 的完整请求体
```

名单机制说明：

- `blacklist` 模式：名单中的 openid **被屏蔽**，其他全部放行。
- `whitelist` 模式：仅放行名单中的 openid，其他全部屏蔽。
- `ban_user_id` 是最高优先级的全局封禁，与名单模式无关。
- 群聊名单填 `group_openid`，私聊名单填 `user_openid`，均为 QQ 视角下的标识，不要跨 Bot 复用。

### HTTP 客户端

各组件（TokenManager / SendHandler / MessageHandler / GatewayConnection / StreamingController / 分片上传）共享同一组连接池参数，启用 keep-alive 与 HTTP/2 复用 TLS 连接以降低握手开销。一般保持默认即可，仅在出现网络抖动或高频请求超时时调整。

```toml
[http]
max_keepalive_connections = 20  # 保持的空闲连接数上限，范围 1~100
max_connections = 50            # 总连接数上限（含活跃与空闲），范围 1~200
keepalive_expiry = 30.0        # 空闲连接保活时间（秒），范围 1.0~300.0
connect_timeout = 10.0         # 连接建立超时（秒），范围 1.0~60.0
request_timeout = 30.0         # 默认请求超时（秒），部分长操作会单独覆盖
http2 = true                   # 启用 HTTP/2（不支持时自动降级到 HTTP/1.1）
retry_max_attempts = 3         # 网络错误重试次数（HTTP 状态码错误不重试）
retry_backoff_base = 1.0       # 退避基准时间（秒），实际等待 = base * 2^attempt
retry_backoff_max = 10.0       # 退避上限（秒）
retry_jitter = 0.3             # 重试抖动系数（0~1），避免雪崩
```

## 启动 Neo-MoFox

按 Neo-MoFox 的正常方式启动程序。日志中依次出现以下内容，表示接入成功：

```text
QQ Bot 适配器正在启动...
QQ Bot access_token 获取成功，有效期 7200 秒
获取网关地址成功: wss://...
WebSocket 连接已建立
Ready! Bot: 我的机器人 (id=xxx)
QQ Bot 适配器已就绪
```

若 30 秒内未收到 `READY`，适配器会打印 `QQ Bot 适配器启动超时：未在 30 秒内收到 READY`，请参考 [故障排除](#故障排除)。

## 进阶功能

### 启用 Markdown 回复

确认机器人账号具备 QQ Markdown 能力后，修改：

```toml
[features]
markdown_support = true
```

启用后，回复内容会以 QQ Markdown 消息体渲染。如果启用后 QQ API 返回请求错误，先关闭该选项恢复普通文本，再检查机器人应用是否具有 Markdown 权限。

### 关于流式回复

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
- 流式发送需要其他插件显式调用实验性的 `QQBotService.start_streaming()`（接口签名见 `services/qqbot_service.py`）。

普通用户如果没有配套插件，应保持：

```toml
[features]
streaming = false
```

### 概率被动回复

QQ 官方对 5 分钟窗口内的被动回复（带 `msg_id`）有数量限制。开启后适配器会按概率决定是否走被动回复通道：

```toml
[features]
enable_passive_reply_probability = true
passive_reply_rate = 0.5  # 0.0~1.0，例如 0.5 表示 50% 概率
```

### 用户名映射

QQ 官方 C2C 事件通常不携带 `username`，会显示为 `QQ用户_xxxxxxxx`。这不是收信故障，可通过手动映射修正显示名：

```toml
[features]
# 每项格式 openid:昵称，例如 0D0C972A...:qf
user_alias_map = ["0D0C972A2FAC2481DC7B7FC1A23B6E7F:qf", "ABCDEF1234567890:阿范"]
```

私聊时优先使用此映射，优先级最高。

### 多个 QQ Adapter 同时接入

本 Adapter 使用统一的平台标识 `qq`。如果 Neo-MoFox 同时接入其他 QQ 账号或 QQ Adapter，请结合 [`stream_adapter_affinity`](https://39.96.71.162/plugin/stream_adapter_affinity)，避免回复被路由到错误的 Adapter。

QQ openid 是各 Bot 视角下的标识，不应在不同 Bot 之间直接复用名单或主动发送目标。

## 常用诊断开关

```toml
[features]
debug_log_raw_payload = true
debug_log_outbound_payload = true
```

- `debug_log_raw_payload`：记录完整入站事件，适合查找 openid 和消息结构。
- `debug_log_outbound_payload`：以 debug 级别记录发往 QQ API 的 URL 和完整请求体。

> [!CAUTION]
> 日志可能包含用户消息、openid、`msg_id` 和媒体 URL。排查结束后请关闭开关，并在分享日志前完成脱敏。

## 故障排除

- **AppID 或 AppSecret 无效**：是否仍使用占位值、空字符串或错误应用的凭证；AppID 和 AppSecret 是否属于同一个 QQ 开放平台应用。
- **Token 获取失败**：QQ API 暂不可用；DNS、TLS、代理或防火墙问题；系统时间错误。
- **30 秒内未收到 READY**：是否已获得 Token；是否出现 `WebSocket 连接已建立` 和 `收到 Hello`；QQ 开放平台是否为应用开放对应事件权限。
- **Intents 鉴权失败**：应用是否已上线或仍处于允许使用的沙箱状态；`connection.intents` 是否包含未申请的事件；是否至少具有群聊/C2C 所需权限。
- **心跳、断线与 Resume**：服务器正常要求重连时，将会使用随机抖动进行重连，属于正常现象。
- **分片配置无效**：当前版本只实现一个 Gateway 实例，`shard_count` 固定为 `1`。
- **收不到消息**：插件配置中消息类型被关闭；没有配置机器人可获取消息范围（主人号在 QQ 群聊中点击机器人头像 `设置` → `机器人可获取的群聊消息范围` 将其设置成 `获取群内全部消息`）。
- **用户名显示为 `QQ用户_xxxxxxxx`**：QQ 官方 C2C 事件通常没有 username。这不是收信故障。可通过 `features.user_alias_map` 手动设置。
- **主动消息受限**：QQ 官方对 bot 有发送消息数限制，具体以官方开发文档为准。
- **开启 streaming 但没有流式输出**：需要 chatter 等其他插件主动调用 `QQBotService.start_streaming()`。
- **流式中途停止**：属于 QQ 流式发送问题，由 QQ 官方接口侧返回，非本适配器问题。

## 相关链接

- 仓库地址：<https://github.com/qingfeng66640/qqbot_adapter>
- 插件市场：<https://39.96.71.162/plugin/qqbot_adapter>
- 插件安装指南：[插件安装指南](/docs/guides/usage/plugin-installation-guide)
- OneBot 适配器配置：[OneBot 适配器配置指南](./onebot_v11_config)
- QQ 开放平台：<https://q.qq.com/>
