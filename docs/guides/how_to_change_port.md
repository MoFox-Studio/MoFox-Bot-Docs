# 如何更换 MoFox_Bot 的端口？

在大多数情况下，你**不需要**修改 MoFox_Bot 的默认端口。但如果你遇到了**端口冲突**（例如，电脑上其他程序占用了 `8000` 或 `8095` 端口），那么本指南将帮助你安全地更换端口。

MoFox_Bot 主要涉及两个端口：

1.  **内部服务端口** (默认为 `8000`)：这是 MoFox_Bot 核心服务运行的端口，用于内部组件间的通信。
2.  **Napcat 适配器端口** (默认为 `8095`)：这是 MoFox_Bot 与 Napcat QQ 客户端建立连接的端口。

下面，我们将分别介绍如何修改这两个端口。


## 场景一：修改内部服务端口 (例如 `8000` 端口被占用)

当你启动 MoFox_Bot 时，如果日志中出现类似 `Address already in use` 的错误，且明确指向 `8000` 端口，那么你需要修改内部服务端口。

**操作步骤 (共两步)**：

### 第一步：修改 `.env` 文件

1.  打开 MoFox_Bot 项目的**根目录**。
2.  找到并用代码编辑器打开 `.env` 文件。
3.  修改 `PORT` 的值为一个新的端口号。例如，我们想把它改成 `8088`。
    ```env
    HOST=127.0.0.1
    PORT=8088  # <-- 修改这里
    EULA_CONFIRMED=true
    ```

### 第二步：同步修改 Napcat 适配器配置

由于内部服务端口发生了变化，我们还需要告诉 Napcat 适配器去哪里找核心服务。

1.  打开 `config/plugin_config/napcat_adapter_plugin/config.toml` 文件。
2.  找到 `[maibot_server]` 配置节。
3.  将其中的 `port` 值修改为**与 `.env` 文件中 `PORT` 值相同**的新端口。
    ```toml
    [maibot_server] # 连接麦麦的ws服务设置
    host = "localhost"
    port = 8088        # <-- 确保这里和 .env 中的新端口一致
    ```

**修改完成后，保存文件并重启 MoFox_Bot 即可生效。**

> **⚠️ 重要提示**:
> 这两处修改**必须同步进行**！如果只修改了一处，会导致适配器无法连接到核心服务，机器人将无法接收和发送消息。


## 场景二：修改 Napcat 适配器端口 (例如 `8095` 端口被占用)

这个端口是 MoFox_Bot 和 Napcat QQ 客户端之间的“桥梁”。修改它的前提是，你**也需要修改 Napcat QQ 客户端中的反向 WebSocket 端口设置**。

**操作步骤 (共两步)**：

### 第一步：修改 Napcat QQ 客户端设置

1.  打开 Napcat QQ 客户端。
2.  进入 `OneBot v11` 设置。
3.  找到你添加的反向 WebSocket 地址 (例如 `ws://127.0.0.1:8095`)。
4.  将其中的端口号修改为一个新的、未被占用的端口。例如，修改为 `9595`。
5.  保存设置。

### 第二步：修改 MoFox_Bot 适配器插件配置

1.  打开 `config/plugin_config/napcat_adapter_plugin/config.toml` 文件。
2.  找到 `[napcat_server]` 配置节。
3.  将其中的 `port` 值修改为**与 Napcat QQ 客户端中设置的新端口完全一致**。
    ```toml
    [napcat_server] # Napcat连接的ws服务设置
    mode = "reverse"
    host = "localhost"
    port = 9595             # <-- 确保这里和 Napcat 客户端的新端口一致
    ```

**修改完成后，保存文件，然后按照“先启动 Napcat QQ，再启动 MoFox_Bot”的顺序重启，即可生效。**

> **💡 总结**:
> *   修改 MoFox_Bot **内部端口**，需要同时改 `.env` 和 `napcat_adapter_plugin` 的配置。
> *   修改 **Napcat 连接端口**，需要同时改 `Napcat QQ 客户端` 和 `napcat_adapter_plugin` 的配置。
>
> 请根据你的实际情况，选择对应的修改方案。