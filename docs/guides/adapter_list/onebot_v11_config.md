# OneBot 适配器配置指南

## 概述

OneBot 适配器（`onebot_adapter`）是 Neo-MoFox 连接 QQ 平台的推荐方式，通过 OneBot 协议与 Napcat QQ 客户端通信。

> [!NOTE]
> 想了解 OneBot 适配器的功能特性、黑白名单、戳一戳等完整介绍？请参阅 [内置插件 · OneBot 适配器介绍](/docs/builtin_plugins/onebot/)。本页仅聚焦于连接配置与部署步骤。

## 前置条件

在配置适配器之前，请确保已完成：

1. Neo-MoFox 主程序部署（Python 环境 + 依赖安装）
2. `config/core.toml` 和 `config/model.toml` 基础配置
3. 已安装并登录 **Napcat QQ 客户端**

## 启用适配器

OneBot 适配器默认已启用。确认 `config/plugins/onebot_adapter/config.toml` 中：

```toml
[plugin]
enabled = true
```

## 配置连接参数

### 配置监听端口

```toml
[onebot_server]
mode = "reverse"      # reverse/direct
host = "localhost"    # 监听地址
port = 8095           # 监听端口
```

### 配置 Napcat 客户端

在 Napcat QQ 客户端中：
1. 点击"网络配置" → "WebSocket 客户端" → "新建"
2. URL 填写 `ws://127.0.0.1:8095`（端口与上面的 `port` 一致）
3. 保存

## 启动

```bash
uv run main.py
```

日志中出现 `[OneBot 适配器] Bot xxxxxxx 连接成功` 即表示连接建立。

## 故障排除

- **端口不通**：检查 `port` 值是否与 Napcat 客户端一致
- **连接失败**：确认 Napcat QQ 已登录在线
- **不回复消息**：检查 `model.toml` 的 API Key 是否有效，以及白名单设置
