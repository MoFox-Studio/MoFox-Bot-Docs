# 如何更换 MoFox-Core 的端口？

在大多数情况下，你**不需要**修改 MoFox-Core 的默认端口。但如果你遇到了**端口冲突**（例如，电脑上其他程序占用了 `8095` 端口），那么本指南将帮助你安全地更换端口。

MoFox-Core 主要涉及一个端口：

1.  **Napcat 适配器端口** (默认为 `8095`)：这是 MoFox-Core 与 Napcat QQ 客户端建立连接的端口。


## 场景二：修改 Napcat 适配器端口 (例如 `8095` 端口被占用)

这个端口是 MoFox-Core 和 Napcat QQ 客户端之间的“桥梁”。修改它的前提是，你**也需要修改 Napcat QQ 客户端中的反向 WebSocket 端口设置**。

**操作步骤 (共两步)**：

### 第一步：修改 Napcat QQ 客户端设置

1.  打开 Napcat QQ 客户端。
2.  进入 `网络配置` 设置。
3.  找到你添加的反向 WebSocket 设置 (例如 `ws://127.0.0.1:8095`)。
4.  将其中的端口号修改为一个新的、未被占用的端口。例如，修改为 `9595`。
5.  保存设置。

### 第二步：修改 MoFox-Core 适配器插件配置

1.  打开 `config/plugin_config/napcat_adapter/config.toml` 文件。
2.  找到 `[napcat_server]` 配置节。
3.  将其中的 `port` 值修改为**与 Napcat QQ 客户端中设置的新端口完全一致**。
    ```toml
    [napcat_server] # Napcat连接的ws服务设置
    mode = "reverse"
    host = "localhost"
    port = 9595             # <-- 确保这里和 Napcat 客户端的新端口一致
    ```

**修改完成后，保存文件，然后按照“先启动 Napcat QQ，再启动 MoFox-Core”的顺序重启，即可生效。**

> **💡 总结**:
> *   修改 MoFox-Core **内部端口**，需要同时改 `.env` 和 `napcat_adapter_plugin` 的配置。
> *   修改 **Napcat 连接端口**，需要同时改 `Napcat QQ 客户端` 和 `napcat_adapter_plugin` 的配置。
>
> 请根据你的实际情况，选择对应的修改方案。