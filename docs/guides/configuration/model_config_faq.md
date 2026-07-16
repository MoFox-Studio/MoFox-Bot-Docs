# 模型配置问题排查指南

> 遇到问题？对照日志找答案！本指南收集了真实的错误日志示例，帮你快速定位问题。
>
> 日志基本格式说明：
> - `LLM 请求失败：` — 不可重试的错误（如 401/402/403 认证、余额、权限），直接放弃。
> - `LLM 请求暂时失败：` — 可重试的错误（如 429/500/503 限流、服务器、网络错误），会自动重试。
> - `LLM 请求将重试：` — 即将重试，附带重试次数、下一个模型和延迟秒数。
> - `LLM 重试已耗尽：` — 重试次数用完，最终放弃。
>
> 日志中的 `reason=` 字段为底层 SDK 原始错误信息，实际内容可能因供应商而异，示例中做了简化展示。



## 📋 目录

| 问题类型 | 日志关键词 | 快速跳转 |
|---------|----------|---------|
| 🔑 **认证失败** | `401`, `LLMAuthenticationError`, `api_key` | [→ API Key 问题](#-api-key-认证问题) |
| 💰 **余额不足** | `402`, `Payment Required`, `LLMAPIError` | [→ 账户余额问题](#-账户余额问题) |
| 🚫 **权限不足** | `403`, `Forbidden`, `LLMAPIError` | [→ 权限问题](#-权限不足问题) |
| ⚡ **请求限流** | `429`, `LLMRateLimitError`, `Rate limit` | [→ 限流问题](#-请求限流问题) |
| 🌐 **网络错误** | `ConnectionError`, `Timeout`, `暂时失败` | [→ 网络问题](#-网络连接问题) |
| 💥 **服务器错误** | `500`, `503`, `status_code`, `Internal server` | [→ 服务端问题](#-服务器端问题) |
| ⚙️ **配置错误** | `未找到`, `Initialization failed`, `重试已耗尽` | [→ 配置问题](#️-配置文件问题) |
| 📝 **格式错误** | `Invalid value`, `Fatal error`, `column` | [→ 格式问题](#-toml-格式错误) |



## 🔑 API Key 认证问题

### 日志示例：`401 Unauthorized`

```log
LLM 请求失败：model=deepseek-v3, request=actor, error_type=LLMAuthenticationError, reason=Error code: 401 - 'Invalid API key'
```

### ❓ 这是什么意思？

你的 API Key 无效。Bot 无法通过身份验证。

### ✅ 解决方法

**第一步：检查配置文件中的 API Key**

打开 `config/model.toml`，找到你使用的供应商配置：

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
| ✅ 引号是否正确 | 必须使用英文引号 `"` 而不是中文引号 `“` |
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
LLM 请求失败：model=deepseek-v3, request=actor, error_type=LLMAPIError, reason=Error code: 402 - 'Insufficient balance'
```
```log
LLM 请求失败：model=gpt-4, request=actor, error_type=LLMAPIError, reason=Error code: 403 - 'Model access denied'
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
LLM 请求失败：model=gpt-4, request=actor, error_type=LLMAPIError, reason=Error code: 403 - 'Model access denied'
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
   - 在 `model.toml` 中改用你有权限的模型


## ⚡ 请求限流问题

### 日志示例：`429 Too Many Requests`

```log
LLM 请求暂时失败：model=deepseek-v3, request=actor, error_type=LLMRateLimitError, reason=Error code: 429 - 'Rate limit exceeded'
LLM 请求将重试：request=actor, retry_count=1, next_model=deepseek-v3, delay_seconds=10.00
```

```log
LLM 重试已耗尽：request=utils_small, retry_count=3, last_error=LLMRateLimitError: Error code: 429 - 'Rate limit exceeded'
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
[model_task_config.actor]
model_list = ["sf-deepseek", "ds-deepseek"]
```


## 🌐 网络连接问题

### 日志示例：网络连接错误

```log
LLM 请求暂时失败：model=deepseek-v3, request=actor, error_type=ConnectionError, reason=Failed to connect to api.siliconflow.cn
LLM 请求将重试：request=actor, retry_count=1, next_model=deepseek-v3, delay_seconds=10.00
```

> 💡 负载均衡策略会在内部对失败模型静默施加惩罚值以降低其被选中的概率，但**不会输出额外的惩罚日志**。你只会看到上面的"暂时失败"和"将重试"日志。

### ❓ 这是什么意思？

Bot 无法与 API 服务器建立网络连接。

### ✅ 解决方法

**第一步：测试网络连通性**

在终端中运行：
```bash
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
LLM 请求暂时失败：model=deepseek-v3, request=actor, error_type=LLMAPIError, status_code=500, reason=Error code: 500 - 'Internal server error'
LLM 请求将重试：request=actor, retry_count=1, next_model=deepseek-v3, delay_seconds=10.00
```

### 日志示例：`503 Service Unavailable`

```log
LLM 请求暂时失败：model=deepseek-v3, request=actor, error_type=LLMAPIError, status_code=503, reason=Error code: 503 - 'Service unavailable'
LLM 请求将重试：request=actor, retry_count=1, next_model=deepseek-v3, delay_seconds=10.00
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

### 日志示例：模型不存在

当任务配置中引用的模型名称在 `[[models]]` 中没有定义时，会在构建模型集时抛出异常：

```log
Initialization failed: 模型 'deepseek-ai/DeepSeek-V3' 未找到
```

### ❓ 这是什么意思？

你在任务配置中引用的模型名称，在 `[[models]]` 中没有定义。

### ✅ 解决方法：检查配置链路

配置文件中有**三个层级**，它们必须正确关联：

# 配置链路示例（3 层）——简明说明

- **供应商层（api_providers）**：定义 API 源、base_url、api_key，name 用作引用。  
- **模型层（models）**：给每个模型起一个自定义 name，绑定供应商的模型标识（model_identifier）和 api_provider。  
- **任务层（model_task_config）**：在任务中引用模型层的自定义 name 列表。

```toml
# ① 供应商层：定义 API 提供方
[[api_providers]]
name = "SiliconFlow"        # 供② 模型层引用的名字
base_url = "https://api.siliconflow.cn/v1"
api_key = "sk-xxx"
client_type = "openai"

# ② 模型层：将供应商的官方模型包装为自定义 name
[[models]]
name = "my-deepseek"                         # 在③ 任务层中引用的名称
model_identifier = "deepseek-ai/DeepSeek-V3" # 供应商的官方模型 ID
api_provider = "SiliconFlow"                 # 必须与上面供应商层的 name 完全一致

# ③ 任务层：在任务中引用模型层的 name
[model_task_config.actor]
model_list = ["my-deepseek"]                 # 使用② 模型层定义的 name
```

提示：确保 api_provider 字符串与对应 [[api_providers]] 的 name 完全一致（包括大小写）。

**常见错误：**

| ❌ 错误 | ✅ 正确 |
|--------|--------|
| `model_list = ["deepseek-ai/DeepSeek-V3"]` | `model_list = ["my-deepseek"]` |
| 使用官方 model_identifier | 使用你自定义的 name |



## 📝 TOML 格式错误

### 日志示例：配置文件格式错误

```log
Initialization failed: Invalid value (at line 5, column 12)
```

或启动时直接报错退出：

```log
[Fatal error: Invalid value (at line 5, column 12)]
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
   - 按启动会话命名：`mofox_YYYYMMDD_HHMMSS_<微秒>_<会话ID>_<YYYY-MM-DD>.log`

2. **加入社区求助**
   - 💬 QQ 交流群：[点击加入](https://qm.qq.com/q/jfeu7Dq7VS)
   - 🐙 GitHub Issues：[提交问题](https://github.com/MoFox-Studio/Neo-MoFox/issues)

3. **提问时请附上：**
   - 完整的错误日志（隐藏 API Key！）
   - 相关配置片段
   - 你尝试过的解决方法



> 📖 **相关文档**
> - [模型配置快速上手](./quick_start_model_config.md)
> - [模型配置高级指南](./model_configuration_guide.md)
