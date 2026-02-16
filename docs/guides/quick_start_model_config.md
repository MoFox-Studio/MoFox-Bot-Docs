# 模型配置快速上手

本篇指南将用最直接的方式，告诉你如何让 Neo-MoFox 开口说话。

## 核心：填入你的 API 密钥

对于新手，你**唯一**需要做的，就是在配置文件中填入你的 API 密钥。

如果没有，点击[硅基流动注册](https://cloud.siliconflow.cn/)进行注册

ps：如果你[点击这里注册](https://cloud.siliconflow.cn/i/0ww8zcOn)，我和你都能获得14元赠金，感谢支持

### 操作步骤

1.  **启动Neo-MoFox**:
    *   打开命令行窗口，进入 `Neo-MoFox` 文件夹。
    *   执行启动命令：
        ```shell
        uv run main.py
        ```
    *   程序会自动在 `config/` 目录下生成一个名为 `model.toml` 的文件。这就是我们需要修改的模型配置文件。

2.  **找到并修改 API Key**:
    *   打开刚刚创建的 `model.toml` 文件。
    *   找到下面这几行：
        ```toml
        [[api_providers]]
        # API提供商名称（如 openai、azure、gemini 等）
        # 值类型：str, 默认值："SiliconFlow"
        name = "SiliconFlow"

        # API 基础 URL
        # 值类型：str, 默认值："https://api.siliconflow.cn/v1"
        base_url = "https://api.siliconflow.cn/v1"

        # API 密钥，支持单个密钥或密钥列表轮询
        # 值类型：str | list[str], 默认值："your-siliconflow-api-key-here"
        api_key = "your-siliconflow-api-key-here" #<-就是这里

        # 客户端类型（openai/gemini/bedrock等）
        # 值类型：Literal, 默认值："openai"
        client_type = "openai"

        # 最大重试次数
        # 值类型：int, 默认值：3
        max_retry = 3

        # API 调用超时时长（秒）
        # 值类型：int, 默认值：30
        timeout = 30

        # 重试间隔时间（秒）
        # 值类型：int, 默认值：10
        retry_interval = 10
                ```
    *   将 `"your-siliconflow-api-key-here"` 替换成你自己的 API 密钥（通常以 `sk-` 开头）。
    *   现在，`api_key` 字段也支持多个密钥轮询。你可以像这样配置多个密钥：
        ```toml
        api_key = ["your-siliconflow-api-key-here-1", "your-siliconflow-api-key-here-2"]
        ```

**完成！** 保存文件并重启机器人即可。

### 注意事项

-   模板文件中的其他配置项**均为默认可用配置**，在你熟悉所有功能前，**无需修改**。
-   默认配置使用的是 **siliconflow** 服务。
-   如果你想进行更复杂的配置（如更换模型、使用本地模型等），请参考【[模型配置进阶指南](./model_configuration_guide.md)】，那里有获取各类API Key的详细说明。