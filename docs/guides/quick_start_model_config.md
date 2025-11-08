# 模型配置快速上手

本篇指南将用最直接的方式，告诉你如何让 MoFox-Bot 开口说话。

## 核心：填入你的 API 密钥

对于新手，你**唯一**需要做的，就是在配置文件中填入你的 API 密钥。

如果没有，点击[硅基流动注册](https://cloud.siliconflow.cn/)进行注册

ps：如果你[点击这里注册](https://cloud.siliconflow.cn/i/0ww8zcOn)，我和你都能获得14元赠金，感谢支持

### 操作步骤

1.  **创建配置文件**:
    *   在 `mofox-bot` 文件夹中, 找到 `template/model_config_template.toml` 文件。
    *   复制它，并粘贴到 `config/` 目录下，重命名为 `model_config.toml`。

2.  **找到并修改 API Key**:
    *   打开你刚刚创建的 `model_config.toml` 文件。
    *   找到下面这几行：
        ```toml
        [[api_providers]]
        name = "siliconflow"
        base_url = "https://api.siliconflow.cn/v1"
        api_key = "your-api-key-here" # <--- 就是这里！
        ```
    *   将 `"your-api-key-here"` 替换成你自己的 API 密钥（通常以 `sk-` 开头）。
    *   现在，`api_key` 字段也支持多个密钥轮询。你可以像这样配置多个密钥：
        ```toml
        api_key = ["your-api-key-here-1", "your-api-key-here-2"]
        ```

**完成！** 保存文件并重启机器人即可。

### 注意事项

-   模板文件中的其他配置项**均为默认可用配置**，在你熟悉所有功能前，**无需修改**。
-   默认配置使用的是 **siliconflow** 服务。
-   如果你想进行更复杂的配置（如更换模型、使用本地模型等），请参考【[模型配置进阶指南](./model_configuration_guide.md)】，那里有获取各类API Key的详细说明。