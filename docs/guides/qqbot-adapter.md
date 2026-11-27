---
title: QQ Bot 适配器接入
description: 从 QQ 开放平台创建机器人，到从插件市场安装并配置 qqbot_adapter 社区插件
outline: [2, 3]
---

# QQ Bot 适配器接入

本教程介绍如何把腾讯 QQ 官方机器人接入 Neo-MoFox，完整流程是：**注册 QQ Bot → 保存 AppID/AppSecret → 从插件市场下载 `qqbot_adapter` → 放入插件目录 → 配置并启动**。

`qqbot_adapter` 是社区插件，直连 QQ 官方机器人开放平台，不需要 NapCat、OneBot 等协议端。插件由社区开发者独立维护，不属于 Neo-MoFox 核心内置组件：

- [插件市场中的 `qqbot_adapter`](https://market.mofox.chat/plugin/qqbot_adapter)
- [插件源代码仓库](https://github.com/qingfeng66640/qqbot_adapter)

::: warning 安全提醒
AppSecret 是机器人凭据。不要把它发到群聊、提交到公开仓库、写进公开截图或日志。本文中的注册截图已对机器人名称、AppID、AppSecret、账号名和地址栏做脱敏处理。
:::

::: tip 这和 OneBot 适配器有什么区别？
本教程接入的是 QQ 官方机器人（小龙虾 Bot），认证方式是 AppID + AppSecret。若你使用的是普通 QQ 账号和 NapCat 等协议端，请改看 [OneBot 适配器文档](/docs/builtin_plugins/onebot/)。两种适配器不要同时为同一条消息配置路由。
:::

## 接入前准备

开始前确认：

1. Neo-MoFox 已经部署，并且能够正常启动；
2. 你能访问 Bot 根目录下的 `plugins/` 和 `config/`；
3. 已准备一个可以登录 QQ 开放平台的 QQ 账号；
4. 计划先在沙箱环境测试，还是直接使用正式环境；
5. 使用的 Neo-MoFox Core 满足插件要求。当前插件仓库列出的要求是 Python 3.11 及以上、Neo-MoFox Core `1.2.0-rc` 及以上，以及 `websockets`、`httpx`、`h2` 等依赖。依赖通常由 Neo-MoFox 自动处理。

## 一、在 QQ 开放平台创建机器人

### 1. 打开机器人管理后台

浏览器打开 [QQ 机器人管理后台](https://q.qq.com/qqbot/dashboard/)，登录后进入左侧的「**我的机器人**」。在机器人列表右上角点击「**创建机器人**」。

![QQ 机器人管理后台的“我的机器人”页面，右上角有“创建机器人”按钮](/guide/qqbot-adapter/01-bot-list.png)

### 2. 填写机器人基本信息

在「创建机器人账号」页面填写：

- **机器人头像**：可使用官方头像，也可以上传自定义图片；
- **机器人昵称**：必填，按页面显示的字数限制填写；这个昵称可能会公开显示在 QQ 中；
- **机器人简介**：选填，用一句话说明机器人能做什么。

确认信息后点击「**创建机器人**」。

![QQ 机器人创建页面，需要填写头像、昵称和简介](/guide/qqbot-adapter/02-create-bot.png)

创建完成后，回到机器人列表，点击刚创建的机器人进入它的设置页面。

## 二、取得 AppID 和 AppSecret

### 1. 进入“其他机器人服务”

在机器人设置页找到「**设置 AI 服务**」区域，选择「**其他机器人服务**」。这里的选项不是让你选择 Neo-MoFox，而是进入第三方机器人服务的手动接入说明。

![QQ 机器人“设置 AI 服务”页面，箭头指向“其他机器人服务”](/guide/qqbot-adapter/03-other-service.png)

### 2. 展开手动连接参数

在「其他机器人服务」页面的底部，找到「**查看手动连接参数**」并点击展开。

![“其他机器人服务”页面底部的“查看手动连接参数”入口](/guide/qqbot-adapter/04-manual-connection.png)

展开后记录以下两项：

- **AppID**：机器人应用 ID；
- **AppSecret**：机器人应用密钥。

![展开后的 AppID 和 AppSecret 区域，凭据值已脱敏](/guide/qqbot-adapter/05-credentials-redacted.png)

::: danger AppSecret 只能安全保存一次
页面会提示 AppSecret 不支持明文保存，再次查看可能会强制重置。请在当前页面把新生成的 AppSecret 保存到密码管理器或其他安全位置。若 AppSecret 曾经出现在公开截图、日志或聊天记录中，应立即在 QQ 开放平台重置，并使用新值更新 Neo-MoFox 配置。
:::

## 三、从插件市场下载 `qqbot_adapter`

### 1. 打开插件详情页

打开 [Neo-MoFox 插件市场中的 `qqbot_adapter`](https://market.mofox.chat/plugin/qqbot_adapter)。如果没有直接打开详情页，也可以在插件市场搜索 `qqbot_adapter`。

下载前核对：

- 插件 ID 是 `qqbot_adapter`；
- 作者、简介、版本和更新时间符合预期；
- 这是社区插件，不是 Neo-MoFox 内置插件；
- 插件版本与你当前的 Neo-MoFox 版本兼容。

### 2. 下载插件包

在插件详情页的「安装」面板点击「**下载插件**」，下载最新稳定版 `.mfp` 插件包。想安装指定版本时，在「版本」区域选择对应版本下载。

下载完成后，先停止正在运行的 Neo-MoFox，再把 `.mfp` 文件放进 Bot 根目录的 `plugins/` 文件夹：

```text
Neo-MoFox/
├── plugins/
│   └── qqbot_adapter*.mfp
├── config/
└── ...
```

不要把插件包放到 `config/`、`data/` 或 `logs/`。插件市场的其他安装方式和目录规则见[插件市场使用](/docs/guides/plugins)。

## 四、配置 `qqbot_adapter`

### 1. 让插件生成配置文件

把插件包放进 `plugins/` 后启动一次 Neo-MoFox。插件第一次加载时通常会生成：

```text
config/plugins/qqbot_adapter/config.toml
```

停止 Neo-MoFox，使用文本编辑器打开这个文件。配置文件可能会随着插件版本增加字段；**不要删除自动生成的其他字段，也不要在已有区块后重复粘贴同名区块**，只修改对应值即可。

### 2. 填写凭据和基础连接配置

在自动生成的配置中确认或修改以下字段：

```toml
[plugin]
enabled = true

[bot]
app_id = "你的 AppID"
app_secret = "你的 AppSecret"
bot_name = "你的机器人名称"

[connection]
env = "sandbox"     # 首次测试建议使用 sandbox；正式运行改为 production
intents = 33554432  # 默认接收普通群聊 @ 消息和 C2C 私聊消息
shard_count = 1     # 当前版本使用单分片

[features]
enable_group_message = true
enable_c2c_message = true
markdown_support = false
media_upload_mode = "chunked"
streaming = false

[http]
http2 = true
```

::: warning 检查配置中的空格
上面代码中的 `enable_c2c_message` 行前面不应有多余缩进。请以插件自动生成的配置格式为准，确保 TOML 能正常解析。
:::

最少需要正确填写 `[bot]` 下的三项：

- `app_id` 填 QQ 开放平台取得的 AppID；
- `app_secret` 填与这个 AppID 属于同一个机器人应用的 AppSecret；
- `bot_name` 填一个便于在日志中识别的名称。

### 3. 选择运行环境和消息权限

- **沙箱测试**：保留 `env = "sandbox"`，适合先验证连接和收发消息；
- **正式环境**：改成 `env = "production"`，并按照 QQ 开放平台要求配置服务器 IP 白名单；
- **普通群聊和 C2C 私聊**：保留 `intents = 33554432` 即可；
- **额外事件**：如果要接收入群申请、群成员事件或互动事件，先在 QQ 开放平台开通对应权限，再按插件 README 的 intents 说明调整数值，不要随意填写未经授权的事件掩码。

`shard_count` 当前固定为 `1`，一般不需要修改。群聊默认需要 @ 机器人才能触发回复；私聊则直接向机器人发送消息。

## 五、启动并验证

保存配置后启动 Neo-MoFox，在最新日志中确认插件完成连接。不同版本的日志前缀可能略有差异，但应能看到类似这些关键内容：

```text
QQ Bot 适配器正在启动...
QQ Bot access_token 获取成功，有效期 7200 秒
获取网关地址成功: wss://...
Ready! Bot: 我的机器人 (id=xxx)
QQ Bot 适配器已就绪
```

看到 `Ready` 或「适配器已就绪」后，可以按当前环境进行测试：

1. 在 QQ 官方机器人允许的沙箱或正式使用范围内找到机器人；
2. 私聊机器人发送一条文本；
3. 在群聊中 @机器人发送一条文本；
4. 查看 Neo-MoFox 日志，确认收到消息并产生回复。

适配器只负责 QQ 消息的接收和发送，回复内容仍需要 Neo-MoFox 的模型和核心配置正常工作。模型没有配置好时，连接可能是正常的，但机器人不会生成有效回复。

## 常见问题

### 插件市场下载后没有加载

确认 `.mfp` 文件位于 Bot 根目录的 `plugins/` 文件夹，而不是 `config/plugins/`；然后完全重启 Neo-MoFox。若仍未加载，检查日志中的插件依赖错误和包结构错误。

### 没有生成 `config.toml`

这通常表示插件尚未成功加载。先确认插件包完整、文件后缀没有被浏览器改成 `.mfp.zip`，再检查 Neo-MoFox Core 版本和 Python 依赖是否满足要求。

### AppID 或 AppSecret 无效

确认两项凭据来自同一个 QQ 机器人应用，且没有复制多余空格。若你在 QQ 开放平台重新查看或重置了 AppSecret，旧值会失效，必须把新值同步到 `config.toml` 后重启。

### 能连接但收不到消息

依次检查：

1. QQ 开放平台是否已经给机器人开通对应的消息事件权限；
2. `connection.intents` 是否包含并且只包含已授权的事件；
3. 群聊消息是否 @ 了机器人；
4. 当前机器人是否被添加到允许使用的沙箱、群聊或私聊范围；
5. `[features]` 中 `enable_group_message` 和 `enable_c2c_message` 是否被关闭。

### 连接反复重试或无法获取 Token

检查服务器网络、DNS、TLS、代理和防火墙。正式环境还要检查 QQ 开放平台的 IP 白名单。先切回 `sandbox` 验证凭据和网络，再排查正式环境配置。

### 与 OneBot 适配器同时使用时回复异常

`qqbot_adapter` 和 OneBot 适配器都可能使用统一的 QQ 平台标识。若同一个 Neo-MoFox 实例同时启用了两套 QQ 接入，可能出现路由冲突。只使用 QQ 官方机器人时，建议不要同时启用另一套 QQ 适配器；确实需要并行接入时，应额外配置明确的路由归属。

## 相关文档

- [插件市场使用](/docs/guides/plugins)：下载、安装、更新和卸载 `.mfp` 插件；
- [插件配置怎么改](/docs/guides/plugin-config)：通过配置文件或 WebUI 修改插件配置；
- [OneBot 适配器文档](/docs/builtin_plugins/onebot/)：使用普通 QQ 账号协议端的另一种接入方式；
- [QQ 机器人管理后台](https://q.qq.com/qqbot/dashboard/)：注册机器人并管理凭据；
- [`qqbot_adapter` 源代码仓库](https://github.com/qingfeng66640/qqbot_adapter)：查看插件版本说明、完整配置和故障排查文档。
