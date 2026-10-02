# 进阶模型配置

默认配置就能让 Bot 正常聊天，所以这篇是**进阶内容**：想换模型、想省钱、想接多家服务商时再来看。

模型配置都写在 `config/model.toml` 里（改文件的方式和生效规则见[核心配置要点](/docs/guides/core-config)）。整份文件是一个三层结构，理解了它你就理解了一切：

1. **`[[api_providers]]`** —— 找哪些服务商买服务（地址、[API Key](/docs/guides/glossary#api-key)）
2. **`[[models]]`** —— 有哪些模型可用（模型的真实 ID、价格）
3. **`[model_tasks]`** —— 谁干哪件事（把模型分配给聊天、看图、语音等不同任务）

## 两种改法：文件 or WebUI

模型配置可以改文件，也可以在 WebUI 里改：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

用编辑器打开 `config/model.toml`，按下面讲的三层结构（服务商 → 模型 → 任务）逐层填写，保存后重启 Bot 生效。

</MethodTab>

<MethodTab value="webui">

1. 打开 WebUI 的「配置」页面，切到「模型配置」标签。
2. 按「服务商 → 模型 → 任务」的顺序在表单里填写；点右上角「代码模式」还能像改文件一样直接编辑整份 `model.toml`。
3. 保存后重启 Bot 生效。

![图片：WebUI 模型配置页，可看到服务商与模型列表](/guide/webui/config-model.png)

</MethodTab>

</MethodTabs>

下面按三层结构讲清楚每个字段怎么填。

## 第一层：`[[api_providers]]` 服务商

每一段 `[[api_providers]]`（注意是双方括号，可以写多段）描述一家服务商：请求发到哪个网址、用什么密钥、超时重试怎么算。

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `name` | `"SiliconFlow"` | 服务商的代号（自己起），模型通过这个名字引用它 |
| `base_url` | `https://api.siliconflow.cn/v1` | API 基础地址，问服务商要或看它的接入文档 |
| `api_key` | 占位符 | 密钥；**支持单个字符串，也支持列表轮询**（见下） |
| `client_type` | `"openai"` | 客户端类型，决定用哪种协议对话（见下） |
| `max_retry` | `2` | 请求失败后的最大重试次数 |
| `timeout` | `30` | 单次请求超时（秒） |
| `retry_interval` | `10` | 两次重试之间的间隔（秒） |
```toml

[[api_providers]]
# 服务商代号，随便起，后面 [[models]] 里的 api_provider 填它
name = "SiliconFlow"

# API 基础地址
base_url = "https://api.siliconflow.cn/v1"

# API 密钥，去服务商官网申请
api_key = "your-siliconflow-api-key-here"

# 协议类型
client_type = "openai"

# 重试与超时，默认即可
max_retry = 2
timeout = 30
retry_interval = 10
```

### `client_type` 怎么选

`client_type` 告诉 Bot 用哪种「语言」和服务商对话，可选值：`openai`、`openai_response`、`anthropic`、`gemini`、`aiohttp_gemini`、`bedrock`。

| client_type | 用于什么 |
| --- | --- |
| `openai` | OpenAI 兼容接口——**绝大多数服务商都兼容它**（DeepSeek、硅基流动、OpenRouter、各类中转站等），选不准就选它 |
| `openai_response` | OpenAI 较新的 Responses API 接口（`/v1/responses`），一般用不到 |
| `anthropic` | Anthropic 官方接口（Claude 系列） |
| `gemini` / `aiohttp_gemini` | Google Gemini 接口（后者是另一种实现方式） |
| `bedrock` | AWS Bedrock |

::: warning gemini 和 bedrock 目前是预留类型
源码的客户端注册表（`registry.py`）当前**默认只内置了 `openai`、`anthropic`、`openai_response` 三种客户端**，`gemini`、`aiohttp_gemini`、`bedrock` 属于预留，未注册时会回退到 openai 客户端。想用 Gemini 系模型，更稳妥的办法是通过 OpenAI 兼容渠道（如 OpenRouter 或硅基流动）接入，`client_type` 填 `openai`。
:::

### 多 Key 轮询

`api_key` 除了填一个字符串，还可以填一个列表——Bot 会**自动在多个 Key 之间轮流使用**，把请求分摊开，单个 Key 的限流压力小很多：
```toml

# 多个 Key 轮流用
api_key = ["sk-key-one", "sk-key-two", "sk-key-three"]
```

## 第二层：`[[models]]` 模型

每段 `[[models]]` 描述一个模型。**注意区分两个字段，这是新手最容易搞混的地方**：

- `model_identifier`：**发给 API 的真实模型 ID**，必须和服务商家的完全一致（比如 `deepseek-ai/DeepSeek-V4-Flash`）
- `name`：**Bot 内部的代号**，自己起的昵称，第三层 `[model_tasks]` 里引用的是它

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `model_identifier` | 必填 | 发给 API 的模型 ID，照抄服务商的模型名 |
| `name` | 必填 | 内部代号，任务配置里 `model_list` 引用的就是它 |
| `api_provider` | 必填 | 所属服务商，填 `[[api_providers]]` 里的 `name` |
| `price_in` | `0.0` | 每百万 [Token](/docs/guides/glossary#token) 输入价格（用于用量统计） |
| `cache_hit_price_in` | 空 | 缓存命中时的输入价格；不填则按 `price_in` 算 |
| `price_out` | `0.0` | 每百万 Token 输出价格 |
| `force_stream_mode` | `false` | 强制流式输出，部分只支持流式的接口才需要 |
| `max_context` | `131072` | 模型最大输入上下文（Token 数），按服务商标注填 |
| `tool_call_compat` | `false` | Tool Call 兼容模式，模型不支持原生工具调用时开启 |
| `extra_params` | `{}` | 额外参数：`headers`（注入请求头）、`query`（URL 参数）、`body`（合并进请求体），其余键原样透传给 API |
| `anti_truncation` | `false` | 反截断功能（回复被截断时尝试续写） |
```toml

[[models]]
# 发给 API 的真实 ID，照抄服务商的
model_identifier = "deepseek-ai/DeepSeek-V4-Flash"

# 内部代号，自己起，任务里引用它
name = "deepseek-v4-flash"

# 用哪家服务商（填 api_providers 里的 name）
api_provider = "SiliconFlow"

# 价格：每百万 Token（只影响用量统计，不影响调用）
price_in = 1.0
cache_hit_price_in = 0.020
price_out = 2.0

# 上下文长度按官方标注填
max_context = 131072
```

::: tip 价格填了有什么用
`price_in` / `price_out` 不影响调用，只用于 Bot 的用量统计（配合 `[llm_stats]`），让你知道自己大概花了多少钱。白嫖渠道全填 `0` 就行。
:::

## 第三层：`[model_tasks]` 任务路由

Bot 内部把 LLM 请求分成了不同「工种」：聊天是聊天、看图是看图、听语音是听语音。每个工种可以（也应该）配不同的模型——**主力聊天用强模型，杂活用便宜模型，这是省钱的关键**。

### 九个任务分别干嘛

| 任务 | 大白话 | 源码定位 | 默认模型 |
| --- | --- | --- | --- |
| `actor` | **主聊天大脑**：Bot 回复消息的主力模型 | 聊天组件的默认任务 | `deepSeek-v4-flash` |
| `sub_actor` | **副动作器**：给主大脑打下手的轻量对话/动作生成 | 副动作器模型 | `qwen3.5-4b` |
| `utils` | **工具模型**：各种杂活 | 工具模型 | `deepSeek-v4-flash` |
| `utils_small` | **轻量杂活**：最轻量的小判断（比如判断某个动作要不要触发） | 轻量工具模型 | `qwen3.5-4b` |
| `vlm` | **看图**：识别图片和表情包的内容 | 图像识别模型 | `qwen3.6-35b-a3b` |
| `voice` | **听语音**：把语音消息转成文字（语音识别） | 语音识别模型 | `sensevoice-small` |
| `video` | **视频分析**：理解视频内容（内置识别引擎目前是占位，主要供插件使用） | 视频分析模型 | `qwen3.6-35b-a3b` |
| `tool_use` | **工具调用**：让 Bot 执行工具/Function Calling，**必须选支持原生工具调用的模型** | 工具调用模型 | `deepSeek-v4-flash` |
| `embedding` | **记忆检索**：把文本变成向量，用于查找相关记忆 | 嵌入模型（默认 `embedding_dimension = 1024`） | `bge-m3` |

### 每个任务怎么配
```toml

[model_tasks]
# 下面每个任务节都支持这几个字段：

# 任务使用的模型列表——填的是 [[models]] 里的 name（内部代号）
# 可以填多个，多个时按调度策略分摊（见核心配置的 [llm]）
[model_tasks.actor]
model_list = ["deepseek-v4-flash"]
max_tokens = 800          # 任务最大输出 Token 数
temperature = 0.7         # 温度：越高越发散，主聊天可以调高些
concurrency_count = 1     # 并发请求数量

# 嵌入任务额外有 embedding_dimension（向量维度），要和模型匹配
[model_tasks.embedding]
model_list = ["bge-m3"]
embedding_dimension = 1024
```

字段速查：

- `model_list`：模型代号列表，填 `[[models]]` 里的 `name`；配多个模型互为备份、自动分摊。
- `max_tokens`：任务最大输出 Token 数，默认 `800`。主聊天觉得回复总被截断可以调大。
- `temperature`：温度，默认 `0.7`。判断类任务（`utils_small`）调低更稳，主聊天调高更活。
- `concurrency_count`：并发数，默认 `1`，一般不用动。

### 自定义任务

除了九个内置任务，你还可以按同样的格式**自己加任务**（配置模型对额外任务开放），供插件按任务名取用：
```toml

# 自定义任务：名字随意，格式和内置任务一致
[model_tasks.my_summary_task]
model_list = ["deepseek-v4-flash"]
max_tokens = 500
temperature = 0.7
concurrency_count = 1
```

## 场景示例

### ① 主模型 + 便宜小模型分工

思路：`actor`（主聊天）用强模型保证质量；`utils_small`、`sub_actor` 这类高频小活用便宜模型省钱。示例中的服务商和模型名是占位，格式照抄即可：
```toml

# ── 服务商 ──
[[api_providers]]
name = "SiliconFlow"
base_url = "https://api.siliconflow.cn/v1"
api_key = "your-siliconflow-api-key-here"
client_type = "openai"
max_retry = 2
timeout = 30
retry_interval = 10

# ── 模型：一强一便宜 ──
[[models]]
model_identifier = "vendor/Strong-Model-X"   # 换成你买的强模型 ID
name = "my-strong-model"
api_provider = "SiliconFlow"
price_in = 2.0
price_out = 8.0
max_context = 131072

[[models]]
model_identifier = "vendor/Cheap-Model-Mini" # 换成便宜的模型 ID
name = "my-cheap-model"
api_provider = "SiliconFlow"
price_in = 0.0
price_out = 0.0
max_context = 32768

# ── 任务路由：强模型管大脑，便宜模型干杂活 ──
[model_tasks.actor]
model_list = ["my-strong-model"]      # 主聊天：质量优先
max_tokens = 2000
temperature = 0.8

[model_tasks.sub_actor]
model_list = ["my-cheap-model"]       # 副动作器：省钱
max_tokens = 800

[model_tasks.utils]
model_list = ["my-cheap-model"]       # 杂活：省钱
max_tokens = 800

[model_tasks.utils_small]
model_list = ["my-cheap-model"]       # 轻量小判断：最省钱
max_tokens = 500

[model_tasks.tool_use]
model_list = ["my-strong-model"]      # 工具调用：要强模型才靠谱
max_tokens = 800

[model_tasks.vlm]
model_list = ["my-strong-model"]      # 看图需要多模态模型，按实际替换
max_tokens = 800

[model_tasks.voice]
model_list = ["my-asr-model"]         # 语音识别要用专门的 ASR 模型
max_tokens = 800

[model_tasks.embedding]
model_list = ["my-embedding-model"]   # 记忆检索要用嵌入模型
embedding_dimension = 1024
```

::: warning 每类任务要用对口型
`vlm` 要选**支持看图**的多模态模型；`voice` 要选**语音识别（ASR）**模型；`embedding` 要选**嵌入**模型；`tool_use` 要选**支持原生工具调用**的模型。拿聊天模型去干这些活，是配不出效果的。
:::

### ② 多 Key 轮询

只有一个服务商、但手里有多个 Key？直接把 Key 列起来，Bot 自动轮流用：
```toml

[[api_providers]]
name = "SiliconFlow"
base_url = "https://api.siliconflow.cn/v1"
client_type = "openai"
max_retry = 2
timeout = 30
retry_interval = 10

# 多个 Key 轮流使用，分摊限流压力
api_key = [
    "sk-key-one",
    "sk-key-two",
    "sk-key-three",
]
```

## 常见提供商速查表

| 提供商 | base_url | client_type | 备注 |
| --- | --- | --- | --- |
| 硅基流动 SiliconFlow | `https://api.siliconflow.cn/v1` | `openai` | 源码默认示例 |
| DeepSeek 官方 | `https://api.deepseek.com/v1` | `openai` | OpenAI 兼容接口 |
| OpenAI 官方 | `https://api.openai.com/v1` | `openai` | <!-- VERIFY: base_url 来自 OpenAI 公开文档，源码中无此默认值 --> |
| Anthropic 官方 | `https://api.anthropic.com` | `anthropic` | 用官方协议，client_type 必须是 `anthropic` <!-- VERIFY: base_url 来自 Anthropic 公开文档，源码中无此默认值 --> |
| Google Gemini 官方 | Gemini 原生协议 | `gemini` | 官方原生接口当前为预留类型，建议走 OpenAI 兼容渠道接入 <!-- VERIFY: gemini 客户端未内置，原生接入的 base_url 写法请以 Google 文档为准 --> |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai` | 聚合各家模型的兼容渠道，一个 Key 用多家模型 <!-- VERIFY: base_url 来自 OpenRouter 公开文档，源码中无此默认值 --> |

::: tip 一个 Key 想用所有模型？
像 OpenRouter、硅基流动这类「聚合渠道」都是 OpenAI 兼容接口：建一个 provider、`client_type = "openai"`，`[[models]]` 里多列几个模型，就能在不同任务间随意分配。
:::

## 改完怎么验证

1. 保存 `config/model.toml`，重启 Bot。
2. 看启动日志里的 **LLM 预检**：默认开启（核心配置 `[bot]` 的 `llm_preflight_check`），启动时会逐个测试你配置的服务商是否连通。哪一家报「预检失败」，就去检查它的 `base_url` 和 `api_key`。
3. 到 WebUI 的模型页查看任务分配和调用情况，详见 [WebUI 使用](/docs/guides/webui)。
4. 私聊 Bot 说句话，能正常回复就说明 `actor` 主链路通了；发张图片、发条语音，分别验证 `vlm` 和 `voice`。


相关页面：

- [核心配置要点](/docs/guides/core-config)：配置怎么改、怎么生效
- [人设指南](/docs/guides/persona)：模型管智力，人设管性格
- [WebUI 使用](/docs/guides/webui)：在网页里查看和验证模型配置
