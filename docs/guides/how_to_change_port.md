# 如何更换 Neo-MoFox 的端口？

在大多数情况下，你**不需要**修改 Neo-MoFox 的默认端口。但如果你遇到了**端口冲突**（例如，电脑上其他程序占用了 `8095` 端口），那么本指南将帮助你安全地更换端口。

Neo-MoFox 主要涉及2个端口：

1.  **Napcat 适配器端口** (默认为 `8095`)：这是 Neo-MoFox 与 Napcat QQ 客户端建立连接的端口。
2. **HTTP API 端口** (默认为 `8000`)：这是 Neo-MoFox 的 插件 提供 HTTP API 服务的端口。


## 场景1：修改 Napcat 适配器端口 (例如 `8095` 端口被占用)

这个端口是 Neo-MoFox 和 Napcat QQ 客户端之间的“桥梁”。修改它的前提是，你**也需要修改 Napcat QQ 客户端中的反向 WebSocket 端口设置**。

**操作步骤 (共2步)**：

### 第一步：修改 Napcat QQ 客户端设置

1.  打开 Napcat QQ 客户端。
2.  进入 `网络配置` 设置。
3.  找到你添加的反向 WebSocket 设置 (例如 `ws://127.0.0.1:8095`)。
4.  将其中的端口号修改为一个新的、未被占用的端口。例如，修改为 `9595`。
5.  保存设置。

### 第二步：修改 Neo-MoFox 适配器插件配置

1.  打开 `config/plugins/napcat_adapter/config.toml` 文件。
2.  找到 `[napcat_server]` 配置节。
3.  将其中的 `port` 值修改为**与 Napcat QQ 客户端中设置的新端口完全一致**。
```toml
# Napcat WebSocket 服务器配置
[napcat_server]
# ws 连接模式: reverse/direct
# 值类型：str, 默认值："reverse"
mode = "reverse"

# Napcat WebSocket 服务地址
# 值类型：str, 默认值："localhost"
host = "localhost"

# Napcat WebSocket 服务端口
# 值类型：int, 默认值：8095
port = 9595     # <-- 确保这里和 Napcat 客户端的新端口一致

# Napcat API 访问令牌（可选）
# 值类型：str, 默认值：""
access_token = ""
```

**修改完成后，保存文件，然后按照“先启动 Napcat QQ，再启动 Neo-MoFox”的顺序重启，即可生效。**

## 场景2：修改 HTTP API 端口 (例如 `8000` 端口被占用)
:::tip 注意
这个端口是 Neo-MoFox 的 插件 提供 HTTP API 服务的端口。修改它不会影响 Neo-MoFox 与 Napcat QQ 客户端之间的连接。
:::
**操作步骤(共1步)**：
### 修改 Neo-MoFox HTTP API 配置
1.  打开 `config/core.toml` 文件。
2.  找到 `[http_router]` 配置节。
3.  将其中的 `port` 值修改为一个新的、未被占用的端口。例如，修改为 `9000`。
```toml
# HTTP 路由配置节
# 
# 定义 HTTP API 相关的配置参数。
[http_router]
# 是否启用 HTTP 路由
# 值类型：bool, 默认值：true
enable_http_router = true

# HTTP 路由监听地址
# 值类型：str, 默认值："127.0.0.1"
http_router_host = "127.0.0.1"

# HTTP 路由监听端口
# 值类型：int, 默认值：8000
http_router_port = 9000   # <-- 修改为新的端口，例如 9000
```
**修改完成后，保存文件，然后重启 Neo-MoFox 即可生效。**

> **💡 总结**:
> *   修改 **Napcat 连接端口**，需要同时改 `Napcat QQ 客户端` 和 `napcat_adapter` 的配置。
> *   修改 **HTTP API 端口**，只需要改 `core.toml` 中的 HTTP 路由配置即可。
> 请根据你的实际情况，选择对应的修改方案。