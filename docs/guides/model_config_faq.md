# 🔧 模型配置问题排查指南

> 遇到问题？对照日志找答案！本指南收集了真实的错误日志示例，帮你快速定位问题。



## 📋 目录

| 问题类型 | 日志关键词 | 快速跳转 |
|---------|----------|---------|
| 🔑 **认证失败** | `401`, `Unauthorized`, `api_key` | [→ API Key 问题](#-api-key-认证问题) |
| 💰 **余额不足** | `402`, `Payment Required` | [→ 账户余额问题](#-账户余额问题) |
| 🚫 **权限不足** | `403`, `Forbidden` | [→ 权限问题](#-权限不足问题) |
| ⚡ **请求限流** | `429`, `Too Many Requests`, `请求过于频繁` | [→ 限流问题](#-请求限流问题) |
| 🌐 **网络错误** | `Connection`, `Timeout`, `连接异常` | [→ 网络问题](#-网络连接问题) |
| 💥 **服务器错误** | `500`, `503`, `服务器错误` | [→ 服务端问题](#-服务器端问题) |
| ⚙️ **配置错误** | `not found`, `模型未找到`, `TOML` | [→ 配置问题](#️-配置文件问题) |
| 📝 **格式错误** | `parse`, `float`, `字符串` | [→ 格式问题](#-toml-格式错误) |



## 🔑 API Key 认证问题

### 日志示例：`401 Unauthorized`

```log
任务-'replyer' 模型-'deepseek-v3': 客户端错误 401 - API-Key错误，认证失败，请检查/config/model_config.toml中的配置是否正确，不再重试。
```

### ❓ 这是什么意思？

你的 API Key 无效。Bot 无法通过身份验证。

### ✅ 解决方法

**第一步：检查配置文件中的 API Key**

打开 `config/model_config.toml`，找到你使用的供应商配置：

```toml
[[api_providers]]
name = "SiliconFlow"
base_url = "https://api.siliconflow.cn/v1"
api_key = "sk-xxxxxxxxxxxxxxxxxx"  # ← 检查这里！
```

**第二步：逐项排查**

| 检查项 | 说明 |
|-------|------|
| ✅ Key 是否完整 | 复制时可能漏掉了开头或结尾 |
| ✅ 是否有多余空格 | Key 前后不能有空格 |
| ✅ 引号是否正确 | 必须使用英文引号 `"` 而不是中文引号 `"` |
| ✅ Key 是否过期 | 登录供应商后台检查 Key 状态 |
| ✅ Key 是否被禁用 | 某些 Key 可能因安全原因被吊销 |

**各平台 Key 格式参考：**

| 平台 | Key 开头 | 获取位置 |
|-----|---------|---------|
| SiliconFlow | `sk-` | [控制台](https://cloud.siliconflow.cn/) → API Keys |
| DeepSeek | `sk-` | [控制台](https://platform.deepseek.com/) → API Keys |
| OpenAI | `sk-` | [Platform](https://platform.openai.com/) → API Keys |
| Google Gemini | `AIza` | [AI Studio](https://aistudio.google.com/) → Get API Key |

## 💰 账户余额问题

### 日志示例：`402 Payment Required`/`403 Forbidden`

```log
任务-'replyer' 模型-'deepseek-v3': 客户端错误 402 - 账号余额不足，不再重试。
```
```log
任务-'replyer' 模型-'gpt-4': 客户端错误 403 - 模型拒绝访问，可能需要实名或余额不足，不再重试。
```


### ❓ 这是什么意思？

你的 API 账户余额为 0 或不足以支付本次请求。

### ✅ 解决方法

1. **登录对应平台查看余额并充值**
   - [SiliconFlow 充值](https://cloud.siliconflow.cn/)
   - [DeepSeek 充值](https://platform.deepseek.com/)

2. **设置低余额提醒**（强烈推荐）
   - 大多数平台支持设置余额告警
   - 建议设置 10 元以下提醒

3. **使用多 Key 轮询分散风险**
   ```toml
   [[api_providers]]
   name = "SiliconFlow"
   api_key = [
     "sk-account1-key",  # 账户1
     "sk-account2-key",  # 账户2
     "sk-account3-key"   # 账户3
   ]
   # Bot 会自动轮换，一个没余额会切换到下一个
   ```


## 🚫 权限不足问题

### 日志示例：`403 Forbidden`

```log
任务-'replyer' 模型-'gpt-4': 客户端错误 403 - 模型拒绝访问，可能需要实名或余额不足，不再重试。
```

### ❓ 这是什么意思？

你的账户没有权限使用该模型，可能是以下原因：
- 账户未完成实名认证
- 该模型需要额外申请权限
- 账户被限制

### ✅ 解决方法

1. **完成实名认证**
   - 登录供应商网站，按提示完成身份验证

2. **检查模型权限**
   - 某些高级模型（如 GPT-4、Claude）需要单独申请
   - 在供应商后台查看你有权访问的模型列表

3. **更换可用模型**
   - 在 `model_config.toml` 中改用你有权限的模型


## ⚡ 请求限流问题

### 日志示例：`429 Too Many Requests`

```log
任务-'replyer' 模型-'deepseek-v3': 请求过于频繁，将于10秒后重试 (2次剩余)。
```

```log
任务-'utils_small' 模型-'qwen3-8b': 请求过于频繁，已达最大重试次数，放弃。
```

### ❓ 这是什么意思？

你在短时间内发送了太多请求，超出了 API 的速率限制。

### ✅ 解决方法

**方案1：等待自动重试**

Bot 内置了自动重试机制，看到这个日志先别急：
```toml
[[api_providers]]
max_retry = 3          # 最大重试次数
retry_interval = 10    # 重试间隔（秒）
```

**方案2：使用多个 API Key 分流**

```toml
[[api_providers]]
name = "SiliconFlow"
api_key = [
  "sk-key1",
  "sk-key2", 
  "sk-key3"
]  # 3 个 Key = 3 倍配额！
```

**方案3：配置多供应商备份**

```toml
# 主供应商
[[api_providers]]
name = "SiliconFlow"
api_key = "sk-xxx"

# 备用供应商（同样的模型）
[[api_providers]]  
name = "DeepSeek"
api_key = "sk-xxx"

# 两个模型配置
[[models]]
name = "sf-deepseek"
model_identifier = "deepseek-ai/DeepSeek-V3"
api_provider = "SiliconFlow"

[[models]]
name = "ds-deepseek"
model_identifier = "deepseek-chat"
api_provider = "DeepSeek"

# 任务中配置多个模型，Bot 会智能调度
[model_task_config.replyer]
model_list = ["sf-deepseek", "ds-deepseek"]
```


## 🌐 网络连接问题

### 日志示例：网络连接错误

```log
任务-'replyer' 模型-'deepseek-v3': 连接异常，将于10秒后重试 (2次剩余)。
```

### 日志示例：严重网络错误（高额惩罚）

```log
模型 'deepseek-v3' 发生严重错误 (NetworkConnectionError)，增加高额惩罚值: 5
```

### ❓ 这是什么意思？

Bot 无法与 API 服务器建立网络连接。

### ✅ 解决方法

**第一步：测试网络连通性**

在终端中运行：
```powershell
# 测试 SiliconFlow
curl https://api.siliconflow.cn/v1/models

# 测试 DeepSeek  
curl https://api.deepseek.com/v1/models
```

**第二步：增加超时时间**

如果网络较慢，调整配置：
```toml
[[api_providers]]
name = "SiliconFlow"
timeout = 60           # 从默认30秒增加到60秒
max_retry = 3
retry_interval = 10
```

**第三步：检查 base_url 是否正确**

| 平台 | 正确的 base_url |
|-----|----------------|
| SiliconFlow | `https://api.siliconflow.cn/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Ollama（本地） | `http://localhost:11434/v1` |

**第四步：检查防火墙/代理**

- 确保程序可以访问外网
- 如果使用公司网络，可能需要配置代理


## 💥 服务器端问题

### 日志示例：`500 Internal Server Error`

```log
任务-'replyer' 模型-'deepseek-v3': 服务器错误，将于10秒后重试 (2次剩余)。
```

```log
模型 'deepseek-v3' 发生服务器错误 (状态码: 500)，增加高额惩罚值: 5
```

### 日志示例：`503 Service Unavailable`

```log
任务-'replyer' 模型-'deepseek-v3': 服务器错误，将于10秒后重试 (2次剩余)。
```

### ❓ 这是什么意思？

API 服务器出问题了，不是你的错！

### ✅ 解决方法

1. **等待自动重试** - Bot 会自动重试
2. **查看供应商状态页**
   - [SiliconFlow 状态](https://status.siliconflow.cn/)
   - [DeepSeek 状态](https://status.deepseek.com/)
3. **配置备用供应商** - 一个挂了自动切另一个



## ⚙️ 配置文件问题

### 日志示例：模型未找到

或者在模型选择阶段：

```log
没有可用的模型供当前请求选择。
```

### ❓ 这是什么意思？

你在任务配置中引用的模型名称，在 `[[models]]` 中没有定义。

### ✅ 解决方法：检查配置链路

配置文件中有**三个层级**，它们必须正确关联：

```toml
# ① 供应商层 - 定义 API 来源
[[api_providers]]
name = "SiliconFlow"                        # ← 这个名字要记住
base_url = "https://api.siliconflow.cn/v1"
api_key = "sk-xxx"
client_type = "openai"

# ② 模型层 - 定义具体模型
[[models]]
name = "my-deepseek"                        # ← 你自定义的名字（在任务中使用）
model_identifier = "deepseek-ai/DeepSeek-V3"  # ← 供应商的官方模型ID
api_provider = "SiliconFlow"                # ← 必须与上面 name 一致！

# ③ 任务层 - 使用模型
[model_task_config.replyer]
model_list = ["my-deepseek"]                # ← 使用你在 models 中定义的 name
```

**常见错误：**

| ❌ 错误 | ✅ 正确 |
|--------|--------|
| `model_list = ["deepseek-ai/DeepSeek-V3"]` | `model_list = ["my-deepseek"]` |
| 使用官方 model_identifier | 使用你自定义的 name |



## 📝 TOML 格式错误

### 日志示例：配置文件格式错误

```log
配置文件解析失败: Invalid value for 'api_key' at line 5
```

### ❓ 这是什么意思？

你的 TOML 配置文件格式有语法错误。

### ✅ 解决方法：常见格式错误对照表

```toml
# ❌ 错误1：字符串缺少引号
api_key = sk-xxxxxxxxxx
# ✅ 正确：
api_key = "sk-xxxxxxxxxx"

# ❌ 错误2：列表元素缺少引号
model_list = [model1, model2]
# ✅ 正确：
model_list = ["model1", "model2"]

# ❌ 错误3：布尔值加了引号
force_stream_mode = "true"
# ✅ 正确：
force_stream_mode = true

# ❌ 错误4：使用了中文符号
api_key = "sk-xxx"   # 注意：这里是中文引号！
# ✅ 正确：使用英文符号
api_key = "sk-xxx"

# ❌ 错误5：小数点前没有数字
price_in = .5
# ✅ 正确：
price_in = 0.5
```



## 📞 还是解决不了？

1. **查看完整日志**
   - 日志位置：`你的安装目录/logs/` 目录
   - 按日期命名：`app_YYYYMMDD_HHMMSS.log.jsonl`

2. **加入社区求助**
   - 💬 QQ 交流群：[点击加入](https://qm.qq.com/q/jfeu7Dq7VS)
   - 🐙 GitHub Issues：[提交问题](https://github.com/MoFox-Studio/MoFox_Bot/issues)

3. **提问时请附上：**
   - 完整的错误日志（隐藏 API Key！）
   - 相关配置片段
   - 你尝试过的解决方法



> 📖 **相关文档**
> - [模型配置快速上手](./quick_start_model_config.md)
> - [模型配置高级指南](./model_configuration_guide.md)
> - [MoFox_Bot 常见问题](./core_FAQ.md)
