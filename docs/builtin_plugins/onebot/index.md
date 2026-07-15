# OneBot 适配器（onebot_adapter）

OneBot 11 适配器，让你的机器人接入 QQ 等 OneBot 11 协议平台，通过 WebSocket 与 Napcat 等实现端通信。

## 它能做什么

- **接入 QQ**：把 Neo-MoFox 连接到你的 QQ 账号，收发消息
- **黑白名单**：精细控制哪些群 / 哪些人的消息要处理
- **戳一戳**：处理 QQ 的「戳一戳」交互
- **表情回应**：处理群聊表情回复（贴表情）通知

## 快速开始

### 1. 准备 OneBot 实现

安装一个支持 OneBot 11 协议的实现端（如 [NapCat](https://github.com/NapNeko/NapCatQQ)），并开启 WebSocket 服务。

### 2. 配置连接

配置文件：`config/plugins/onebot_adapter/config.toml`，也可在 WebUI 的「插件配置」中图形化编辑。

```toml
[bot]
qq_id = "123456789"        # Bot 的 QQ 账号
qq_nickname = "我的机器人"   # Bot 的昵称

[onebot_server]
mode = "reverse"           # reverse: 逆向 / direct: 正向
host = "localhost"
port = 8095
access_token = ""          # 可选，留空表示不鉴权
```

- **reverse（逆向）**：OneBot 实现端主动连接 Neo-MoFox（推荐）
- **direct（正向）**：Neo-MoFox 主动连接 OneBot 实现端

### 3. 启动

插件随 Neo-MoFox 启动时自动加载，WebSocket 连接自动建立与重连由基类处理。

## 黑白名单过滤

### 群聊过滤

- **黑名单模式** (`blacklist`)：屏蔽指定群聊的消息
- **白名单模式** (`whitelist`)：只接收指定群聊的消息

### 私聊过滤

- **黑名单模式** (`blacklist`)：屏蔽指定用户的私聊消息
- **白名单模式** (`whitelist`)：只接收指定用户的私聊消息

### 全局封禁

`ban_user_id` 中的用户无论在群聊还是私聊都会被过滤。

### 配置示例

```toml
[features]
# 群聊：只允许特定群聊的消息
group_list_type = "whitelist"
group_list = ["123456789", "987654321"]

# 私聊：屏蔽特定用户的消息
private_list_type = "blacklist"
private_list = ["111111111", "222222222"]

# 全局封禁
ban_user_id = ["333333333", "444444444"]
```

### 常见使用场景

| 场景 | 群聊模式 | 私聊模式 | 说明 |
|------|----------|----------|------|
| 个人机器人（只服务特定群和用户） | `whitelist` | `whitelist` | 严格白名单 |
| 群管机器人（屏蔽捣乱用户） | `blacklist` | `blacklist` | 配合 `ban_user_id` |
| 公开服务机器人（无限制） | `blacklist` | `blacklist` | 名单留空即可 |

## 戳一戳功能

```toml
[features]
enable_poke = true                    # 是否启用戳一戳
ignore_non_self_poke = false          # 是否忽略不是针对自己的戳一戳
poke_debounce_seconds = 2.0           # 戳一戳防抖时间（秒）
```

## 配置参数详解

### `[plugin]` 插件设置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 是否启用 OneBot 适配器 |

### `[bot]` Bot 配置

| 参数 | 说明 |
|------|------|
| `qq_id` | Bot 的 QQ 账号 ID |
| `qq_nickname` | Bot 的 QQ 昵称 |

### `[onebot_server]` OneBot 服务器

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `mode` | `reverse` | ws 连接模式：`reverse` / `direct` |
| `host` | `localhost` | OneBot WebSocket 服务地址 |
| `port` | `8095` | OneBot WebSocket 服务端口 |
| `access_token` | `""` | OneBot API 访问令牌（可选） |

### `[features]` 功能特性

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `group_list_type` | `blacklist` | 群聊名单模式 |
| `group_list` | `[]` | 群聊名单 |
| `private_list_type` | `blacklist` | 私聊名单模式 |
| `private_list` | `[]` | 私聊名单 |
| `ban_user_id` | `[]` | 全局封禁用户 ID 列表 |
| `enable_poke` | `true` | 是否启用戳一戳 |
| `ignore_non_self_poke` | `false` | 是否忽略非自己的戳一戳 |
| `poke_debounce_seconds` | `2.0` | 戳一戳防抖时间 |

## 依赖

- Python 依赖：`pillow>=12.1.0`（必需）

## 相关文档

- [OneBot 适配器开发指南 · 总览](./dev-guide/overview) — 面向开发者的通知事件与扩展说明
- [适配器介绍](/docs/guides/adapter_list)
- [OneBot 适配器配置](/docs/guides/adapter_list/onebot_v11_config)
