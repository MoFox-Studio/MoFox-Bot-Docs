# MoFox_Bot 常见问题解答 (FAQ)

本文档整理了用户在使用 MoFox_Bot 过程中最常遇到的问题和解决方案。

## 📋 目录

- [配置相关问题](#配置相关问题)
  - [配置验证失败怎么办？](#配置验证失败怎么办)
  - [配置文件找不到或无法读取](#配置文件找不到或无法读取)
- [消息收发问题](#消息收发问题)
  - [发不出去消息怎么办？](#发不出去消息怎么办)
  - [发出去消息但 Bot 不回复怎么办？](#发出去消息但-bot-不回复怎么办)
  - [Bot 回复太慢或超时](#bot-回复太慢或超时)
- [表情包相关问题](#表情包相关问题)
  - [表情包无法收集或显示损坏](#表情包无法收集或显示损坏)
- [API 和模型问题](#api-和模型问题)
  - [API 调用失败](#api-调用失败)
  - [模型返回空回复或乱码](#模型返回空回复或乱码)
- [数据库问题](#数据库问题)
  - [数据库连接失败](#数据库连接失败)
  - [数据库文件损坏](#数据库文件损坏)
- [启动和运行问题](#启动和运行问题)
  - [ModuleNotFoundError: No module named 'xxx'](#modulenotfounderror-no-module-named-xxx)
- [其他常见问题](#其他常见问题)
  - [日志在哪里查看？](#日志在哪里查看)
  - [如何使用日志查看器？](#如何使用日志查看器)
  - [如何重置 Bot 状态？](#如何重置-bot-状态)



## 配置相关问题

### 配置验证失败怎么办？

**症状**：启动时提示配置验证失败、配置项缺失或格式错误。

**解决方案**：

1. **检查配置文件格式**
   - 确保 `config/bot_config.toml` 和 `config/model_config.toml` 是有效的 TOML 格式
   - 注意引号、括号是否匹配，特别是列表格式 `["item1", "item2"]`
   - 字符串值需要用引号包裹，数字和布尔值不需要

2. **常见格式错误示例**：
   ```toml
   # ❌ 错误：列表格式不对
   alias_names = [狐狐, 墨墨]
   
   # ✅ 正确：字符串需要引号
   alias_names = ["狐狐", "墨墨"]
   
   # ❌ 错误：布尔值用了引号
   enable_mood = "true"
   
   # ✅ 正确：布尔值不需要引号
   enable_mood = true
   ```

3. **重建配置**
   - 备份当前配置文件
   - 删掉你的配置文件并启动 Bot，系统会自动生成新的默认配置文件
   - 关闭 Bot 后，将你的配置项逐项复制到新的配置文件中，确保格式正确

4. **检查必填项**
   - `[model_task_config]` 中的模型名称必须与 `[[models]]` 中定义的 `name` 一致

### 配置文件找不到或无法读取

**症状**：启动时提示找不到配置文件。

**解决方案**：

确保配置文件位于正确位置：
   - `/config/core.toml`
   - `/config/model.toml`

## 消息收发问题

### 发不出去消息怎么办？

**症状**：Bot 在群里/私聊中无法发送消息。

**解决方案**：

1. **检查 Napcat-Adapter 连接状态**
   - 确保 Napcat-Adapter 正在运行
   - 检查 Napcat-Adapter 的 `config.toml` 配置：
     - `[Napcat_Server]` 的端口与 NapCat 设置一致
     - `[MaiBot_Server]` 的端口与 MoFox_Bot 的 `.env` 中 `PORT` 一致

2. **检查 NapCat 状态**
   - 确保 NapCat 已成功登录 QQ
   - 查看 NapCat 日志是否有错误

3. **检查网络连接**
   - 确保 Bot 主机可以正常访问网络
   - 如果使用代理，检查代理设置

### 发出去消息但 Bot 不回复怎么办？

**症状**：能看到 Bot 收到消息，但不回复。

**解决方案**：

1. **检查是否被静默**
   ```toml
   [message_receive]
   # 确保你的群不在静默列表中
   mute_group_list = []
   ```

5. **检查 API 是否正常工作**
   - 查看日志中是否有 API 调用错误
   - 确认 `model_config.toml` 中的 API Key 有效且余额充足

6. **尝试直接 @ Bot 或私聊**
   - 这是最可靠的触发方式
   - 如果 @ 后仍不回复，问题可能在 API 或配置

### Bot 回复太慢或超时

**症状**：Bot 回复需要很长时间，或者直接超时不回复。

**解决方案**：

1. **增加超时时间**
   ```toml
   [chat]
   thinking_timeout = 60  # 默认40秒，可以适当增加
   ```

2. **检查 API 响应速度**
   - 在 `model_config.toml` 中调整超时设置：
   ```toml
   [[api_providers]]
   timeout = 60  # 增加 API 超时时间
   ```

3. **使用更快的模型**
   - 考虑使用响应更快的小模型作为 `utils_small`
   - SiliconFlow 等平台通常响应较快

4. **检查网络状况**
   - 如果使用国外 API（如 OpenAI），考虑配置代理
   - 国内推荐使用 DeepSeek、SiliconFlow 等国内平台

## API 和模型问题

### API 调用失败

**症状**：日志中出现 API 调用错误、401/403/500 等错误码。

**解决方案**：

1. **检查 API Key 是否正确**
   ```toml
   [[api_providers]]
   name = "DeepSeek"
   base_url = "https://api.deepseek.com/v1"
   api_key = "sk-xxxxxxxx"  # 确保 Key 正确无误
   ```

2. **检查 API 余额**
   - 登录对应平台查看账户余额
   - 确保账户未欠费或被封禁

3. **检查 Base URL 是否正确**
   - DeepSeek: `https://api.deepseek.com/v1`
   - SiliconFlow: `https://api.siliconflow.cn/v1`
   - OpenAI: `https://api.openai.com/v1`

4. **启用 API 重试**
   ```toml
   [[api_providers]]
   max_retry = 3  # 失败后重试次数
   retry_interval = 10  # 重试间隔（秒）
   ```

5. **使用多个 API Key 轮询**
   ```toml
   [[api_providers]]
   api_key = ["key1", "key2", "key3"]  # 支持多 Key 轮询
   ```

### 模型返回空回复或乱码

**症状**：Bot 回复内容为空或乱码。

**解决方案**：

1. **检查模型配置是否正确**
   ```toml
   [[models]]
   model_identifier = "deepseek-chat"  # API 提供商定义的模型 ID
   name = "Deepseek-deepseek-v3-Actor"  # 你自定义的名称
   api_provider = "DeepSeek"  # 必须与 api_providers 中的 name 匹配
   ```

2. **确保 model_task_config 中使用正确的模型名称**
   ```toml
   [model_task_config.actor]
   model_list = ["Deepseek-deepseek-v3-Actor"]  # 使用 models 中定义的 name
   ```

3. **检查是否使用了 Gemini 模型**
   - Google格式的Gemini 需要特殊的 client_type：
   ```toml
   [[api_providers]]
   name = "Google"
   client_type = "gemini"  # Gemini 专用
   ```

:::tip
想知道更多请查看【[模型配置常见问题](./model_config_faq.md)】
:::


## 数据库问题

### 数据库连接失败

**症状**：启动时提示数据库连接错误。

**解决方案**：

1. **SQLite（默认）**
   ```toml
   [database]
   database_type = "sqlite"
   sqlite_path = "data/MaiBot.db"  # 确保路径正确
   ```
   - 确保 `data/` 目录存在且可写

### 数据库文件损坏

**症状**：SQLite 数据库文件损坏，无法读取。

**解决方案**：

1. **尝试恢复**
   ```shell
   # 备份原文件
   cp data/MaiBot.db data/MaiBot.db.backup
   
   # 尝试修复（需要安装 sqlite3）
   sqlite3 data/MaiBot.db ".recover" | sqlite3 data/MaiBot_recovered.db
   ```

2. **重新开始**
   - 删除或重命名损坏的数据库文件
   - Bot 会自动创建新数据库
   - 注意：这会丢失所有历史数据

## 启动和运行问题

### ModuleNotFoundError: No module named 'xxx'

**症状**：启动时提示 `ModuleNotFoundError: No module named 'xxx'`，Bot 无法启动。

**常见错误示例**：
```
ModuleNotFoundError: No module named 'aiohttp'
ModuleNotFoundError: No module named 'pydantic'
ModuleNotFoundError: No module named 'structlog'
```

**解决方案**：

根据你使用的环境管理工具选择对应方案：
**注意确认你的命令行工作路径在项目根目录下**

1. **同步依赖**
   ```shell
   # 同步依赖（会自动创建环境）
   uv sync
   ```

2. **重新启动 Bot**
   ```shell
   uv run main.py
   ```

## 其他常见问题

### 日志在哪里查看？

日志文件位于 `logs/` 目录下，按日期命名：
```
logs/
├── mofox_20260214_141704_519890_cf544a38_2026-02-14.log
├── mofox_20260214_201119_323890_c4ce3445_2026-02-14.log
└── ...
```

**调整日志级别**：
```toml
[bot]
# 日志目录
# 值类型：str, 默认值："logs"
logs_dir = "logs"
# 日志级别：DEBUG/INFO/WARNING/ERROR/CRITICAL
# 值类型：str, 默认值："INFO"
log_level = "INFO"
```

### 如何重置 Bot 状态？

**完全重置**
   - 备份 `config/` 目录
   - 删除整个 `data/` 目录
   - 重新启动 Bot


## 📞 获取帮助

如果以上方案都无法解决你的问题：

1. **查看详细日志**：设置 `log_level = "DEBUG"` 获取更多信息
2. **加入 QQ 交流群**：[点击加入](https://qm.qq.com/q/jfeu7Dq7VS)
3. **提交 Issue**：[GitHub Issues](https://github.com/MoFox-Studio/MoFox_Bot/issues)

提交问题时请附上：
- 错误日志片段
- 相关配置（隐藏敏感信息如 API Key）
- 操作系统和 Python 版本
- 问题复现步骤
