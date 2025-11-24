# Napcat Adapter (独立部署)

本文档将指导你如何独立配置和使用 Napcat Adapter，使其能够连接到你的 NapCat 客户端，并将消息转发到 MoFox-Core。

## 什么是独立适配器？

独立适配器意味着 Napcat Adapter 作为一个独立的进程运行，它通过 WebSocket 与 NapCat 和 MoFox-Core 进行通信。这种部署方式提供了更好的灵活性和稳定性。

## 核心概念：WebSocket 连接模式

Napcat Adapter 支持两种 WebSocket 连接模式，以适应不同的网络环境和部署需求。

### 1. 反向连接模式 (`reverse`) - 推荐

在这种模式下，**Napcat Adapter 作为 WebSocket 服务器**，等待 NapCat 客户端主动连接。这是默认且最常用的模式。

**工作流程:**
1.  Napcat Adapter 启动并监听一个指定的 IP 地址和端口（例如 `ws://0.0.0.0:8095`）。
2.  你在 NapCat 客户端的配置文件中，将 WebSocket 连接地址指向 Napcat Adapter。
3.  NapCat 客户端连接到 Adapter，开始消息同步。

**优点:**
-   配置简单，易于理解。
-   网络控制更安全，Adapter 可以部署在防火墙后。

### 2. 正向连接模式 (`forward`)

在这种模式下，**Napcat Adapter 作为 WebSocket 客户端**，主动连接到 NapCat 服务器。

**工作流程:**
1.  NapCat 客户端作为 WebSocket 服务器运行，并监听一个 URL。
2.  Napcat Adapter 启动后，会根据配置主动连接到该 URL。
3.  连接成功后，开始消息同步。

**优点:**
-   适用于 Adapter 无法被外部网络直接访问的场景。
-   支持通过 `access_token` 进行身份验证，增强安全性。

## 配置步骤

1.  **下载或克隆项目**
    ```bash
    git clone https://github.com/MoFox-Studio/Napcat-Adapter.git
    cd Napcat-Adapter
    ```

2.  **安装依赖**
    ```bash
    pip install -r requirements.txt
    #uv用户使用下面这个
    uv pip install -r requirements.txt
    ```

3.  **创建并编辑配置文件**
    从模板复制一份配置文件：
    ```bash
    cp template/template_config.toml config/config.toml
    ```
    然后，使用文本编辑器打开 `config/config.toml` 文件。

### 配置文件详解

你需要关注文件中的 `[napcat_server]` 和 `[maibot_server]` 部分。

```toml
[napcat_server] # Napcat连接的ws服务设置
mode = "reverse"        # 连接模式: "reverse" 或 "forward"
host = "0.0.0.0"        # [反向模式] 监听的主机地址
port = 8095             # [反向模式] 监听的端口号
url = ""                # [正向模式] Napcat 的 WebSocket URL
access_token = ""       # [可选] 访问令牌
heartbeat_interval = 30 # 心跳间隔（秒）

[maibot_server] # 连接麦麦的ws服务设置
host = "localhost" # 麦麦在.env文件中设置的主机地址
port = 8000        # 麦麦在.env文件中设置的端口
```

#### **配置示例 1：使用反向模式**

如果你希望 Adapter 在 `0.0.0.0:8095` 上监听来自 NapCat 的连接，配置如下：

```toml
[napcat_server]
mode = "reverse"
host = "0.0.0.0"
port = 8095
url = ""
access_token = ""
```

#### **配置示例 2：使用正向模式**

如果你的 NapCat 服务器运行在 `ws://127.0.0.1:3001`，并且需要令牌 `my-secret-token`，配置如下：

```toml
[napcat_server]
mode = "forward"
host = "localhost" # 此项在 forward 模式下无效，但建议保留
port = 8095        # 此项在 forward 模式下无效，但建议保留
url = "ws://127.0.0.1:3001"
access_token = "my-secret-token"
```

## 权限与安全：配置白名单

除了基本的连接配置，Napcat Adapter 还支持通过独立的 `features.toml` 文件来管理可以接收消息的群聊和用户，例如设置群聊和私聊的白名单。

1.  **创建 `features.toml` 文件**

    在 `config` 文件夹下，从模板复制一份功能配置文件：
    ```bash
    cp template/features_template.toml config/features.toml
    ```

2.  **编辑 `features.toml`**

    打开 `config/features.toml` 文件，你可以看到详细的权限设置。

    **核心配置项：**
    - `group_list_type`: 群聊列表类型。
        - `"whitelist"`: **白名单模式**，只有 `group_list` 中的群聊的消息才能被传达给机器人。
        - `"blacklist"`: **黑名单模式**，`group_list` 中的群聊**不能**的消息被传达给机器人。
    - `group_list`: 群聊号码列表。
    - `private_list_type`: 私聊列表类型，规则同上。
    - `private_list`: 用户 QQ 号码列表。

    **配置示例：只允许特定群聊和用户使用**
    ```toml
    # 设置为白名单模式
    group_list_type = "whitelist"
    # 填入允许的群号
    group_list = [123456789, 987654321]

    # 设置为白名单模式
    private_list_type = "whitelist"
    # 填入允许的用户QQ号
    private_list = [10001, 10002]
    ```
    > [!TIP]
    > `features.toml` 文件支持热重载，修改保存后会立即生效，无需重启适配器。

## 启动适配器

所有配置完成后，在 `Napcat-Adapter` 目录下运行以下命令来启动适配器：

```bash
python main.py
```

如果一切正常，你将看到日志输出，表明适配器已成功启动并根据你选择的模式开始监听或连接。

---

现在，你的 Napcat Adapter 已经成功运行了！它会作为你和 MaiBot 之间的桥梁，高效地处理和转发消息。