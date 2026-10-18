# 进阶模型配置

默认配置就能让 Bot 正常聊天，所以这篇是**进阶内容**：想换模型、想省钱、想接多家服务商时再来看。

模型配置有两条完全对等的改法：用编辑器改 `config/model.toml`，或者在 WebUI 的模型配置编辑器里点出来。两条路改的是同一份配置、覆盖同样的内容，只是操作方式不同。**下面每一步都同时给出两种做法，任选一条跟着走即可**；配置文件怎么改、怎么生效的通用规则见[核心配置要点](/docs/guides/core-config)。

## 先弄懂：三层结构

不管用哪种改法，模型配置都是同一个三层结构，理解了它你就理解了一切：

1. **`[[api_providers]]` 服务商** —— 找哪些服务商买服务（地址、[API Key](/docs/guides/glossary#api-key)）
2. **`[[models]]` 模型** —— 有哪些模型可用（模型的真实 ID、价格）
3. **`[model_tasks]` 任务路由** —— 谁干哪件事（把模型分配给聊天、看图、语音等不同任务）

三层之间靠「名字」串起来：模型用 `api_provider` 指向服务商的名字，任务用 `model_list` 指向模型的名字。WebUI 模型配置编辑器里的三个标签页「供应商配置 / 模型配置 / 任务配置」正好对应这三层，按顺序添加就行。

下文截图来自实际 WebUI 的浅色界面，使用演示配置。`vendor/Strong-Model-X`、`vendor/Cheap-Model-Mini` 和价格只是示例；实际模型 ID、能力与价格请按服务商控制台填写，API Key 输入框留空展示。

## 第一步：添加服务商（去哪买服务）

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

用编辑器打开 `config/model.toml`。每一段 `[[api_providers]]`（双方括号是 TOML 的[数组节](/docs/guides/toml#节与数组节-展开说说)，可以写多段）描述一家服务商：请求发到哪个网址、用什么密钥、超时重试怎么算。

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `name` | `"SiliconFlow"` | 服务商的代号（自己起），模型通过这个名字引用它 |
| `base_url` | `https://api.siliconflow.cn/v1` | API 基础地址，问服务商要或看它的接入文档 |
| `api_key` | 占位符 | 密钥，去服务商官网申请 |
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

</MethodTab>

<MethodTab value="webui">

1. 打开 WebUI，进入「配置」页面，点顶部的「模型配置」标签。
2. 默认就在「供应商配置」页。每家服务商一张卡片，卡片上显示 API 地址、客户端类型、超时时间、最大重试：

![WebUI 供应商配置页：SiliconFlow 示例卡片显示 API 地址、协议、超时与重试，右上角有添加按钮](/guide/webui/config-model.png)

3. 点「供应商」标题旁的「添加」按钮，在弹出的对话框里填写：

![图片：添加供应商对话框，包含名称、Base URL、API Key、客户端类型等输入框](/guide/webui/config-model-add-provider.png)

| 对话框字段 | 对应配置项 | 怎么填 |
| --- | --- | --- |
| 提供商名称 | `name` | 自己起的代号，比如 `SiliconFlow`，下一步添加模型时选它 |
| Base URL | `base_url` | 服务商的 API 地址，比如 `https://api.siliconflow.cn/v1` |
| API Key | `api_key` | 去服务商官网申请的密钥；输入框按密码处理，粘贴后不显示明文 |
| 客户端类型 | `client_type` | 下拉选择。绝大多数兼容服务商（DeepSeek、硅基流动、OpenRouter 等）选 OpenAI；所需协议未出现在选项里时，切到「代码模式」填写对应的 `client_type` |
| 最大重试次数 / 超时时间 / 重试间隔 | `max_retry` / `timeout` / `retry_interval` | 默认 3 / 30 / 10 即可 |

4. 点对话框右下角「添加」，新服务商就会出现在卡片列表里。

每张服务商卡片右侧还有三个按钮：

- **测试**：检查这家服务商的配置是否完整、名下有没有挂模型，**不会真正调用模型**，可以放心点。
- **编辑**：随时修改这家服务商的信息。
- **删除**：把这家服务商从列表里去掉。

::: tip 所有改动都要点「保存」
在表单里添加、编辑、删除都先改在页面里，**点右上角的「保存」按钮才真正写入 `config/model.toml`**（有未保存改动时按钮才会亮）。写入后重启 Bot 生效。
:::

::: tip 右上角的「代码模式」
点「代码模式」可以把整个编辑器切换成整份 `config/model.toml` 的 TOML 文本编辑，适合批量调整或处理表单不支持的内容（比如给任务清单新增一个自定义任务）；改完点「保存」，再点「表单模式」切回卡片视图，两边双向同步。
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
| `extra_params` | `{}` | 额外参数：标准请求参数、服务商扩展参数，以及 `headers` / `query` / `body` 三个 HTTP 特殊键 |
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

![WebUI 模型配置页：每个模型一张卡片，显示内部代号、服务商真实 ID、所属供应商与统计价格；图中为演示数据](/guide/webui/config-model-list.png)

2. 点「模型」标题旁的「添加」按钮，在弹出的对话框里填写：

![图片：添加模型对话框，包含模型名称、模型标识符、所属提供商、价格、上下文长度等字段](/guide/webui/config-model-add-model.png)

| 对话框字段 | 对应配置项 | 怎么填 |
| --- | --- | --- |
| 模型名称 | `name` | 内部代号自己起，第三步分配任务时选它 |
| 模型标识符 | `model_identifier` | 发给 API 的真实 ID，从服务商控制台复制到输入框，注意大小写和路径前缀 |
| 所属提供商 | `api_provider` | 下拉选择第一步添加的服务商 |
| 输入价格 / 缓存命中输入价格 / 输出价格 | `price_in` / `cache_hit_price_in` / `price_out` | 每百万 Token 的价格，只影响用量统计；白嫖渠道全填 0 |
| 最大上下文长度 | `max_context` | 按服务商标注填 |
| 强制流式输出模式 | `force_stream_mode` | 部分只支持流式输出的接口才勾 |
| Tool Call 兼容模式 | `tool_call_compat` | 模型不支持原生工具调用时才勾 |
| 额外参数 | `extra_params` | 高级选项，支持 TOML inline object 或 JSON；`headers` / `query` / `body` 在下面三个独立输入框填写 |
| 启用反截断 | `anti_truncation` | 回复被截断时尝试续写，一般不勾 |

3. 点对话框右下角「添加」，再点右上角「保存」写入配置，重启 Bot 生效。

模型卡片上的**测试按钮会真实调用这个模型**：发一句「你好」，然后显示延迟和回复内容（或报错）。配完新模型先点一下测试，比重启之后才发现配错了强得多。

</MethodTab>

</MethodTabs>

## 模型级高级参数

模型卡片里的「额外参数」属于**模型级配置**：同一个模型被 `actor`、`tool_use` 或其他任务使用时，都会使用这些配置。任务卡片里的 `max_tokens` 和 `temperature` 属于**任务级配置**，决定这次任务的输出上限和采样温度。建议在任务中设置这两个字段；OpenAI 兼容客户端会用 `extra_params` 中的同名字段覆盖任务提供的值。

### 参数说明

<a id="advanced-standard-params"></a>

#### 1. 标准采样参数

OpenAI 兼容客户端会把 `extra_params` 中的标准字段放在请求顶层；模型服务商支持哪些字段，以服务商的接口文档为准。最常用的字段如下：

| 参数 | 示例 | 作用 | 使用建议 |
| --- | --- | --- | --- |
| `top_p` | `0.9` | 核采样范围，越低越保守 | 已调 `temperature` 时通常保持默认 |
| `presence_penalty` | `0.2` | 鼓励引入新主题，减少重复话题 | 聊天重复明显时小幅增加 |
| `frequency_penalty` | `0.2` | 惩罚重复词语和短语 | 复读明显时小幅增加 |
| `seed` | `42` | 部分服务商支持的随机种子 | 仅用于尽量复现结果，不能保证完全一致 |
| `stop` | `["<END>"]` | 遇到指定序列时停止 | 只有接口明确支持时才使用 |
| `user` | `"mofox-bot"` | 传给服务商的调用方标识 | 用于审计、限流或用量统计 |
| `stream_options` | `{ include_usage = true }` | 流式响应附带用量信息 | 服务商兼容时可开启 |
| `reasoning_effort` | `"high"` | 部分推理模型的推理强度 | 只对支持该字段的渠道生效 |

配置文件和 WebUI 的具体填写方式见下方「按方法配置」菜单。配置文件菜单包含完整 TOML 示例；WebUI 菜单说明每个输入框对应这里的哪一组参数。

<a id="advanced-headers"></a>

#### 2. headers：注入 HTTP 请求头

`extra_params.headers` 会透传为 SDK 的 `extra_headers`，最终加入实际 HTTP 请求头。它适合服务商要求的版本头、租户头、路由头或自定义鉴权头。

请求头的值会转换为字符串；`null` 值会被忽略。`headers` 必须是对象，不能写成字符串、数组或单个值。

如果服务商的 SDK 已经自动生成 `Authorization`、`Content-Type` 等头，通常不需要重复设置。只有服务商文档要求覆盖它们时才手动添加，并确认不会覆盖 SDK 的鉴权行为。

<a id="advanced-query"></a>

#### 3. query：注入 URL 查询参数

`extra_params.query` 会透传为 SDK 的 `extra_query`，附加到请求 URL 的查询字符串。

`query` 的值可以是字符串、数字、布尔值或嵌套对象，具体是否被服务商接受取决于它的 API。它适合版本号、部署名、路由选项等 URL 层参数，不适合放 JSON 请求体字段。

<a id="advanced-body"></a>

#### 4. body：合并请求体字段

`extra_params.body` 会合并进请求体，适合服务商扩展字段、元数据、服务端内置工具或其他非标准请求选项。

OpenAI 兼容客户端会把 `extra_params` 中无法识别为标准参数的其他键也放进请求体；显式写在 `body` 中的同名字段优先级更高。`body` 必须是对象，支持嵌套对象和数组。

在配置文件菜单的完整示例中，`response_format` 作为请求顶层参数，`metadata` 通过 `body` 合并到请求体扩展字段。

<a id="advanced-tools"></a>

#### 5. Tool Call、结构化输出与联网搜索

##### Tool Call

支持原生工具调用的模型可以使用 `tool_choice` 和 `parallel_tool_calls` 控制工具调用策略，具体写法见配置文件菜单。

- `tool_choice = "auto"`：让模型自行决定是否调用工具。
- `tool_choice = "none"`：禁止模型调用工具，前提是服务商支持该值。
- `parallel_tool_calls = true`：允许模型并行发起多个工具调用，服务商不支持时删除这一项。
- `tool_call_compat = true`：模型没有原生 Tool Call 能力时，使用兼容提示词模式；它不是原生工具调用，效果和稳定性取决于模型。

`tool_use` 任务仍应选择支持原生工具调用的模型。`tool_call_compat` 只作为没有合适模型时的兼容手段。

##### 结构化输出

服务商支持 JSON 模式时，可以把 `response_format` 放入额外参数，具体写法见配置文件菜单。

部分服务商支持 JSON Schema；字段名和严格模式要以服务商文档为准，完整写法见配置文件菜单。

##### 服务端联网搜索

某些 Responses API 服务商把内置 `web_search` 工具放在请求体的 `tools` 字段中，具体写法见配置文件菜单。

WebUI 在支持该预设的 DeepSeek 服务商上会提供「快捷添加联网搜索」按钮。这个能力由服务商计费和权限控制，按钮可用不代表当前模型一定支持。

<a id="advanced-tokens"></a>

#### 6. Token、上下文和费用怎么配

Neo-MoFox 里有三种容易混淆的 Token 设置：

| 配置 | 所在位置 | 控制什么 |
| --- | --- | --- |
| `max_context` | `[[models]]` | 模型一次请求能接收的最大上下文 Token，按服务商标注填写 |
| `max_tokens` | `[model_tasks.<任务名>]` | 这类任务单次最多生成的输出 Token |
| `price_in` / `cache_hit_price_in` / `price_out` | `[[models]]` | 每百万输入、缓存命中输入、输出 Token 的统计价格 |

`max_context` 是输入上下文总容量，包含系统提示词、历史消息、工具描述、用户消息和模型输出所需空间。它不是“单次回复长度”。单次回复长度由任务的 `max_tokens` 控制，配置位置见配置文件菜单。

如果 `actor` 回复经常在半句话处截断，先提高 `model_tasks.actor.max_tokens`；如果请求因为上下文太长失败，再检查 `max_context` 是否按官方值填写，并减少历史消息或工具描述。

##### 为输出和工具调用预留上下文

可以在 `extra_params` 中使用 `context_reserve_ratio` 和 `context_reserve_tokens` 两个框架级参数，为输出或后续工具调用预留空间，配置写法见配置文件菜单。

两者取计算结果中较大的值，实际可用于上下文的预算是 `max_context - max(比例预留, 固定预留)`。这两个键由框架的上下文预算逻辑使用，不会透传给模型 API。

##### 费用统计

- `price_in`、`cache_hit_price_in`、`price_out` 的单位是每百万 Token。
- 它们只影响 WebUI 的 LLM 统计和费用估算，不会改变服务商真实账单，也不会改变模型输出。
- 不收费或本地模型可全部填写 `0`。
- 服务商没有返回缓存命中 Token 时，统计会按普通输入 Token 计算；价格没填时，缓存命中输入价格回退到 `price_in`。

<a id="advanced-network"></a>

#### 7. 网络与兼容性开关

以下键也可以放进 `extra_params`，但它们由 Neo-MoFox 的 HTTP 层消费，不会发给模型：

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `trust_env` | `true` | 是否信任 `HTTP_PROXY` / `HTTPS_PROXY` 等系统代理环境变量；直连环境遇到代理干扰时可设为 `false` |
| `force_ipv4` | `false` | 强制使用 IPv4 出口；IPv6 路由不稳定时尝试开启 |
| `force_sync_http` | 已废弃 | 历史兼容键，会被忽略，不要再新增 |

这些开关可以和 `headers/query/body` 同时使用，填写方式见下方菜单。

::: warning 额外参数不会替服务商做兼容转换
Neo-MoFox 会把标准字段、HTTP 特殊键和服务商扩展字段分流到对应位置，但不会把某家服务商的字段自动翻译成另一家的字段。比如 `reasoning_effort`、`response_format`、`service_tier` 是否可用，最终由当前 `client_type`、模型和服务商决定。
:::

### 按方法配置

下面两个标签只展示“怎么填”。参数含义和兼容性说明见上面的[标准采样参数](#advanced-standard-params)、[headers](#advanced-headers)、[query](#advanced-query)、[body](#advanced-body)、[工具与结构化输出](#advanced-tools)、[Token 与费用](#advanced-tokens)、[网络与兼容性](#advanced-network)。

<MethodTabs dimension="advanced-model" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

在 `config/model.toml` 中找到要修改的 `[[models]]` 条目，按下面示例合并字段。模型 ID、已配置的服务商名称和价格请替换为自己的值；仅保留接口支持且需要的参数。已有 `extra_params = { ... }` 时，将其中的内容移入下面的 `[models.extra_params]`，避免重复定义。

对应关系：

- [标准采样参数](#advanced-standard-params)：`top_p`、`presence_penalty`、`frequency_penalty`、`seed`、`reasoning_effort`
- [headers](#advanced-headers)：`extra_params.headers`
- [query](#advanced-query)：`extra_params.query`
- [body](#advanced-body)：`extra_params.body`
- [工具与结构化输出](#advanced-tools)：`tool_choice`、`parallel_tool_calls`、`response_format`
- [Token 与费用](#advanced-tokens)：`max_context`、任务级 `max_tokens`、三个价格字段
- [网络与兼容性](#advanced-network)：`trust_env`、`force_ipv4`

```toml
[[models]]
model_identifier = "provider/model-id"
name = "my-advanced-model"
api_provider = "MyProvider"
price_in = 2.0
cache_hit_price_in = 0.2
price_out = 8.0
max_context = 131072
force_stream_mode = false
tool_call_compat = false
anti_truncation = false

[models.extra_params]
# 对应「1. 标准采样参数」
top_p = 0.9
presence_penalty = 0.1
frequency_penalty = 0.1
seed = 42
reasoning_effort = "high"
stream_options = { include_usage = true }

# 对应「5. Tool Call、结构化输出与联网搜索」
tool_choice = "auto"
parallel_tool_calls = true
response_format = { type = "json_object" }

# 对应「6. Token、上下文和费用」与「7. 网络与兼容性开关」
context_reserve_ratio = 0.10
context_reserve_tokens = 4096
trust_env = false
force_ipv4 = true

# 对应「2. headers」
[models.extra_params.headers]
"X-API-Version" = "2024-06"

# 对应「3. query」
[models.extra_params.query]
version = "2024-01-01"

# 对应「4. body」
[models.extra_params.body]
metadata = { source = "mofox" }
custom_flag = true

# 对应「6. Token、上下文和费用」：修改已有任务节中的字段
[model_tasks.actor]
model_list = ["my-advanced-model"]
max_tokens = 2000
temperature = 0.8
```

**JSON Schema 写法**（对应[工具与结构化输出](#advanced-tools)）：需要 Schema 时，用下面的子表替换示例中的 `response_format = { type = "json_object" }`。将它放在该模型的其他子表之后、下一个 `[[models]]` 或任务节之前。

```toml
[models.extra_params.response_format]
type = "json_schema"

[models.extra_params.response_format.json_schema]
name = "answer"
strict = true

[models.extra_params.response_format.json_schema.schema]
type = "object"
properties = { answer = { type = "string" } }
required = ["answer"]
additionalProperties = false
```

**服务端联网搜索写法**（对应[工具与结构化输出](#advanced-tools)）：在支持该功能的接口上，把下面字段合并到该模型已有的 `[models.extra_params.body]` 中。

```toml
[models.extra_params.body]
tools = [{ type = "web_search" }]
```

</MethodTab>

<MethodTab value="webui">

输入框与上方说明的对应关系如下；点击说明名称可以跳回查看含义。

| WebUI 位置 | 对应外部说明 | 填写内容 |
| --- | --- | --- |
| 模型编辑 → 额外参数 | [标准采样参数](#advanced-standard-params)、[工具与结构化输出](#advanced-tools) | `top_p`、`seed`、`tool_choice`、`response_format` 等 |
| 模型编辑 → headers | [headers](#advanced-headers) | 请求头对象 |
| 模型编辑 → query | [query](#advanced-query) | URL 参数对象 |
| 模型编辑 → body | [body](#advanced-body)、[联网搜索](#advanced-tools) | 请求体扩展字段；支持时可填写 `tools` |
| 模型编辑 → 最大上下文长度、价格 | [Token 与费用](#advanced-tokens) | `max_context` 和三个价格字段 |
| 任务编辑 → 最大 Tokens、温度 | [Token 与费用](#advanced-tokens)、[标准采样参数](#advanced-standard-params) | `max_tokens`、`temperature` |
| 模型编辑 → 额外参数 | [上下文预留](#advanced-tokens)、[网络与兼容性](#advanced-network) | `context_reserve_ratio`、`context_reserve_tokens`、`trust_env`、`force_ipv4` |

在 WebUI 中打开「配置 → 模型配置 → 模型配置」，点模型卡片的「编辑」即可看到参数区。下面这张图来自正在运行的 WebUI，模型名称和提供商已经替换为演示数据，API Key 和实际请求内容不会写入截图：

![WebUI 模型编辑器的高级参数区：额外参数、HTTP headers、query、body，以及上下文长度和价格配置](/guide/webui/config-model-advanced-params.png)

按下面的顺序填写：

1. 在「额外参数」中填写[标准采样参数](#advanced-standard-params)和[工具与结构化输出](#advanced-tools)，例如 `{ "top_p": 0.9, "seed": 42 }`，或 TOML 写法 `{ top_p = 0.9, seed = 42 }`。
2. 在「HTTP 请求头（headers）」中填写对应[headers 说明](#advanced-headers)的请求头对象，例如 `{ "X-API-Version": "2024-06" }`。
3. 在「URL 查询参数（query）」中填写对应[query 说明](#advanced-query)的 URL 参数，例如 `{ "version": "2024-01-01" }`。
4. 在「请求体字段（body）」中填写对应[body 说明](#advanced-body)的请求体字段，例如 `{ "metadata": { "source": "mofox" } }`。使用服务端联网搜索时，按接口要求合并 `"tools": [{ "type": "web_search" }]`。
5. 点弹窗底部「保存」，再点模型配置页面右上角「保存」。启用保存后自动热重载时会自动应用，否则按页面提示重启 Bot。

三个 HTTP 特殊键在 WebUI 中分开编辑，但最终都会写入同一个模型的 `extra_params`。留空表示不启用；输入内容必须是对象，解析失败时页面会提示检查 TOML 或 JSON 格式。

上下文预留和网络开关也直接填在「额外参数」中，与已有参数合并。例如，下面的 JSON 对应[标准采样参数](#advanced-standard-params)、[Token 与费用](#advanced-tokens)和[网络与兼容性](#advanced-network)：

```json
{
  "top_p": 0.9,
  "context_reserve_ratio": 0.10,
  "context_reserve_tokens": 4096,
  "trust_env": false,
  "force_ipv4": true
}
```

结构化输出对应[工具与结构化输出](#advanced-tools)：在「额外参数」对象中合并 `"response_format": { "type": "json_object" }`；需要 JSON Schema 时，在同一位置填写 `response_format` 对象及其 `json_schema` 子对象。

`max_context`、价格、Tool Call 兼容模式和反截断在模型编辑弹窗的对应字段填写；`max_tokens` 和 `temperature` 在「任务配置 → 对应任务 → 编辑」中填写。

保存后点模型卡片上的「测试」按钮验证调用，再到「请求检视」查看最终请求参数。

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

![WebUI 任务配置页：actor 使用强模型，sub_actor 与 utils 使用便宜模型，卡片显示最大 Tokens 与温度](/guide/webui/config-model-tasks.png)

2. 点任务卡片右侧的「编辑」，在弹出的对话框里调整：

![编辑 actor 任务的实际对话框：模型选 my-strong-model，最大 Tokens 为 2000，温度为 0.8](/guide/webui/config-model-task-edit.png)

- **模型列表**：每一行下拉选择一个模型，选项就是第二步里添加的模型（内部代号）；需要多个模型时点「添加模型」增加一行。多个时按调度策略自动分摊（见核心配置的 `[llm]`）。
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

### 主模型 + 便宜小模型分工

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

![场景示例的两个模型卡片：my-strong-model 与 my-cheap-model 都属于 SiliconFlow，真实 ID 与价格需自行替换](/guide/webui/config-model-list.png)

3. **任务配置**：逐个点「编辑」改模型列表：
   - `actor`（主聊天）选 `my-strong-model`，最大 Tokens 调到 2000，温度调到 0.8；
   - `tool_use`（工具调用）、`vlm`（看图）也选 `my-strong-model`；
   - `sub_actor`、`utils`、`utils_small` 选 `my-cheap-model`，最大 Tokens 分别 800 / 800 / 500；
   - `voice` 换成专门的语音识别模型、`embedding` 换成嵌入模型——这两类拿聊天模型配不出效果。
4. 点右上角「保存」，重启 Bot。

![给主聊天任务分配强模型：actor 的模型列表选择 my-strong-model，同时设置输出长度与温度](/guide/webui/config-model-task-edit.png)

上图是 `actor` 的填写位置。`sub_actor`、`utils`、`utils_small` 同样进入各自的「编辑」对话框，把模型列表换为 `my-cheap-model`；对话框里保存后，还要保存整份模型配置。

::: warning 每类任务要用对口型
`vlm` 要选**支持看图**的多模态模型；`voice` 要选**语音识别（ASR）**模型；`embedding` 要选**嵌入**模型；`tool_use` 要选**支持原生工具调用**的模型。拿聊天模型去干这些活，是配不出效果的。
:::

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
