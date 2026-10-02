# 进阶模型配置

默认配置就能让 Bot 正常聊天，所以这篇是**进阶内容**：想换模型、想省钱、想接多家服务商时再来看。

模型配置有两条完全对等的改法：用编辑器改 `config/model.toml`，或者在 WebUI 的模型配置编辑器里点出来。两条路改的是同一份配置、覆盖同样的内容，只是操作方式不同。**下面每一步都同时给出两种做法，任选一条跟着走即可**；配置文件怎么改、怎么生效的通用规则见[核心配置要点](/docs/guides/core-config)。

## 先弄懂：三层结构

不管用哪种改法，模型配置都是同一个三层结构，理解了它你就理解了一切：

1. **`[[api_providers]]` 服务商** —— 找哪些服务商买服务（地址、[API Key](/docs/guides/glossary#api-key)）
2. **`[[models]]` 模型** —— 有哪些模型可用（模型的真实 ID、价格）
3. **`[model_tasks]` 任务路由** —— 谁干哪件事（把模型分配给聊天、看图、语音等不同任务）

三层之间靠「名字」串起来：模型用 `api_provider` 指向服务商的名字，任务用 `model_list` 指向模型的名字。WebUI 模型配置编辑器里的三个标签页「供应商配置 / 模型配置 / 任务配置」正好对应这三层，按顺序添加就行。

## 第一步：添加服务商（去哪买服务）

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

用编辑器打开 `config/model.toml`。每一段 `[[api_providers]]`（注意是双方括号，可以写多段）描述一家服务商：请求发到哪个网址、用什么密钥、超时重试怎么算。

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

**`client_type` 怎么选**：它告诉 Bot 用哪种「语言」和服务商对话，可选值：`openai`、`openai_response`、`anthropic`、`gemini`、`aiohttp_gemini`、`bedrock`。

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

**多 Key 轮询**：`api_key` 除了填一个字符串，还可以填一个列表——Bot 会**自动在多个 Key 之间轮流使用**，把请求分摊开，单个 Key 的限流压力小很多：

```toml
# 多个 Key 轮流用
api_key = ["sk-key-one", "sk-key-two", "sk-key-three"]
```

</MethodTab>

<MethodTab value="webui">

1. 打开 WebUI，进入「配置」页面，点顶部的「模型配置」标签。
2. 默认就在「供应商配置」页。每家服务商一张卡片，卡片上显示 API 地址、客户端类型、超时时间、最大重试：

![图片：WebUI 模型配置的供应商配置页，DeepSeek、SiliconFlow 等服务商各一张卡片](/guide/webui/config-model.png)

3. 点「供应商」标题旁的「添加」按钮，在弹出的对话框里填写：

![图片：添加供应商对话框，包含名称、Base URL、API Key、客户端类型等输入框](/guide/webui/config-model-add-provider.png)

| 对话框字段 | 对应配置项 | 怎么填 |
| --- | --- | --- |
| 提供商名称 | `name` | 自己起的代号，比如 `SiliconFlow`，下一步添加模型时选它 |
| Base URL | `base_url` | 服务商的 API 地址，比如 `https://api.siliconflow.cn/v1` |
| API Key | `api_key` | 去服务商官网申请的密钥；输入框按密码处理，粘贴后不显示明文 |
| 客户端类型 | `client_type` | 下拉选择。绝大多数服务商（DeepSeek、硅基流动、OpenRouter 等）选 OpenAI；Claude 官方选 Anthropic |
| 最大重试次数 / 超时时间 / 重试间隔 | `max_retry` / `timeout` / `retry_interval` | 默认 3 / 30 / 10 即可 |

4. 点对话框右下角「添加」，新服务商就会出现在卡片列表里。

每张服务商卡片右侧还有三个按钮：

- **测试**：检查这家服务商的配置是否完整、名下有没有挂模型，**不会真正调用模型**，可以放心点。
- **编辑**：随时修改这家服务商的信息。
- **删除**：把这家服务商从列表里去掉。

::: tip 所有改动都要点「保存」
在表单里添加、编辑、删除都先改在页面里，**点右上角的「保存」按钮才真正写入 `config/model.toml`**（有未保存改动时按钮才会亮）。写入后重启 Bot 生效。
:::

::: tip 想填多个 Key 轮询？
表单里的 API Key 输入框一次只能填一个。想配多 Key 轮询，点右上角「代码模式」切换成 TOML 编辑器，把对应服务商的 `api_key` 改成列表（写法见左侧「配置文件」标签），改完点「保存」即可。
:::

</MethodTab>

</MethodTabs>

## 第二步：添加模型

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

接着在 `config/model.toml` 里写。每段 `[[models]]` 描述一个模型。**注意区分两个字段，这是新手最容易搞混的地方**：

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

</MethodTab>

<MethodTab value="webui">

1. 在「模型配置」编辑器里切到「模型配置」标签页。这里每个模型一张卡片，显示模型标识、所属供应商、输入输出价格、上下文长度：

![图片：WebUI 模型配置标签页，每个模型一张卡片](/guide/webui/config-model-list.png)

2. 点「模型」标题旁的「添加」按钮，在弹出的对话框里填写：

![图片：添加模型对话框，包含模型名称、模型标识符、所属提供商、价格、上下文长度等字段](/guide/webui/config-model-add-model.png)

| 对话框字段 | 对应配置项 | 怎么填 |
| --- | --- | --- |
| 模型名称 | `name` | 内部代号自己起，第三步分配任务时选它 |
| 模型标识符 | `model_identifier` | 发给 API 的真实 ID，照抄服务商的模型名。输入框可以直接手动输入，也可以点开下拉从服务商拉取真实模型列表里搜（需要这家服务商的 Key 有效） |
| 所属提供商 | `api_provider` | 下拉选择第一步添加的服务商 |
| 输入价格 / 缓存命中输入价格 / 输出价格 | `price_in` / `cache_hit_price_in` / `price_out` | 每百万 Token 的价格，只影响用量统计；白嫖渠道全填 0 |
| 最大上下文长度 | `max_context` | 按服务商标注填 |
| 强制流式输出模式 | `force_stream_mode` | 部分只支持流式输出的接口才勾 |
| Tool Call 兼容模式 | `tool_call_compat` | 模型不支持原生工具调用时才勾 |
| 额外参数 | `extra_params` | 高级选项，支持 TOML 写法或 JSON，一般留空 |
| 启用反截断 | `anti_truncation` | 回复被截断时尝试续写，一般不勾 |

3. 点对话框右下角「添加」，再点右上角「保存」写入配置，重启 Bot 生效。

模型卡片上的**测试按钮会真实调用这个模型**：发一句「你好」，然后显示延迟和回复内容（或报错）。配完新模型先点一下测试，比重启之后才发现配错了强得多。

</MethodTab>

</MethodTabs>

## 第三步：把模型分给任务（任务路由）

不管哪种改法，先搞清楚「任务」是什么：Bot 内部把 LLM 请求分成了不同「工种」——聊天是聊天、看图是看图、听语音是听语音。每个工种可以（也应该）配不同的模型——**主力聊天用强模型，杂活用便宜模型，这是省钱的关键**。

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

### 怎么配

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

在 `config/model.toml` 里，每个任务一个独立小节，支持的字段都一样：

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

**自定义任务**：除了九个内置任务，你还可以按同样的格式自己加任务（配置模型对额外任务开放），供插件按任务名取用：

```toml
# 自定义任务：名字随意，格式和内置任务一致
[model_tasks.my_summary_task]
model_list = ["deepseek-v4-flash"]
max_tokens = 500
temperature = 0.7
concurrency_count = 1
```

</MethodTab>

<MethodTab value="webui">

1. 在「模型配置」编辑器里切到「任务配置」标签页。九个内置任务每个一张卡片，显示模型列表、最大 Tokens、温度：

![图片：WebUI 任务配置标签页，utils、actor 等任务各一张卡片](/guide/webui/config-model-tasks.png)

2. 点任务卡片右侧的「编辑」，在弹出的对话框里调整：

![图片：编辑任务对话框，任务名称不可修改，模型列表为多选](/guide/webui/config-model-task-edit.png)

- **模型列表**：下拉多选，选项就是第二步里添加的模型（内部代号）；可以选多个，多个时按调度策略自动分摊（见核心配置的 `[llm]`）。
- **最大 Tokens**：任务最大输出 Token 数。主聊天 `actor` 觉得回复总被截断就调大。
- **温度**：判断类任务（`utils_small`）调低更稳，主聊天 `actor` 调高更活。

任务名称是灰色不可改的——它只是内部标识，不需要改。

3. 改完点对话框的「保存」，再点右上角「保存」写入配置，重启 Bot 生效。

::: warning 表单模式改不了任务清单本身
「任务配置」标签页只能**编辑和删除**现有任务，没有「添加」按钮。想新增自定义任务（供插件按任务名取用），点右上角「代码模式」切到 TOML 编辑器，照内置任务的格式加一段（写法见左侧「配置文件」标签的自定义任务），改完点「保存」。
:::

</MethodTab>

</MethodTabs>

## 场景示例

### ① 主模型 + 便宜小模型分工

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

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

</MethodTab>

<MethodTab value="webui">

同一个思路，在界面上分四步做出来：

1. **供应商配置**：添加你的服务商（第一步的流程），比如硅基流动。
2. **模型配置**：添加两个模型（第二步的流程）——一个强模型，内部代号起 `my-strong-model`，价格按实际填；一个便宜模型，代号 `my-cheap-model`，价格全填 0。
3. **任务配置**：逐个点「编辑」改模型列表：
   - `actor`（主聊天）选 `my-strong-model`，最大 Tokens 调到 2000，温度调到 0.8；
   - `tool_use`（工具调用）、`vlm`（看图）也选 `my-strong-model`；
   - `sub_actor`、`utils`、`utils_small` 选 `my-cheap-model`，最大 Tokens 分别 800 / 800 / 500；
   - `voice` 换成专门的语音识别模型、`embedding` 换成嵌入模型——这两类拿聊天模型配不出效果。
4. 点右上角「保存」，重启 Bot。

::: warning 每类任务要用对口型
`vlm` 要选**支持看图**的多模态模型；`voice` 要选**语音识别（ASR）**模型；`embedding` 要选**嵌入**模型；`tool_use` 要选**支持原生工具调用**的模型。拿聊天模型去干这些活，是配不出效果的。
:::

</MethodTab>

</MethodTabs>

### ② 多 Key 轮询

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

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

</MethodTab>

<MethodTab value="webui">

表单里的 API Key 输入框一次只能填一个 Key，所以多 Key 轮询要走「代码模式」：

1. 在「模型配置」编辑器点右上角「代码模式」，页面变成整份 `config/model.toml` 的 TOML 编辑器。
2. 找到对应服务商那段，把 `api_key` 从单个字符串改成列表：

```toml
api_key = [
    "sk-key-one",
    "sk-key-two",
    "sk-key-three",
]
```

3. 点右上角「保存」写入配置。Bot 会自动在几个 Key 之间轮流使用，分摊限流压力。

代码模式和表单模式是双向同步的：切回「表单模式」（按钮会变成「表单模式」，点了切回）就能看到服务商卡片还在，只是 Key 部分以代码为准。

</MethodTab>

</MethodTabs>

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

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

1. 保存 `config/model.toml`，重启 Bot。
2. 看启动日志里的 **LLM 预检**：默认开启（核心配置 `[bot]` 的 `llm_preflight_check`），启动时会逐个测试你配置的服务商是否连通。哪一家报「预检失败」，就去检查它的 `base_url` 和 `api_key`。
3. 到 WebUI 的模型页查看任务分配和调用情况，详见 [WebUI 使用](/docs/guides/webui)。
4. 私聊 Bot 说句话，能正常回复就说明 `actor` 主链路通了；发张图片、发条语音，分别验证 `vlm` 和 `voice`。

</MethodTab>

<MethodTab value="webui">

1. 点编辑器右上角「保存」写入配置，再点侧边栏底部的「重启」让 Bot 重新加载。
2. 不重启也能先做个快速检查：到「模型配置」标签页点模型卡片上的**测试**按钮——它会真实调用模型发一句「你好」，显示延迟和回复就说明这个模型配通了；报错就回对话框检查标识符和所属服务商。
3. 重启后到「LLM 统计」页面看各任务的实际调用情况，详见 [WebUI 使用](/docs/guides/webui)。
4. 私聊 Bot 说句话，能正常回复就说明 `actor` 主链路通了；发张图片、发条语音，分别验证 `vlm` 和 `voice`。

</MethodTab>

</MethodTabs>

相关页面：

- [核心配置要点](/docs/guides/core-config)：配置怎么改、怎么生效
- [人设指南](/docs/guides/persona)：模型管智力，人设管性格
- [WebUI 使用](/docs/guides/webui)：在网页里查看和验证模型配置
