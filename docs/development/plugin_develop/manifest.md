# manifest.json 格式说明

`manifest.json` 是插件元数据入口，用于插件发现、依赖校验和加载顺序计算。

## 最小可用示例

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "description": "插件说明",
  "author": "作者",
  "dependencies": {
    "plugins": [],
    "components": []
  },
  "entry_point": "plugin.py",
  "api_version": "1.0.0"
}
```

## 顶级字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | **是** | 插件唯一名，建议与 `BasePlugin.plugin_name` 一致 |
| `version` | `string` | **是** | 语义化版本（如 `1.0.0`） |
| `description` | `string` | **是** | 插件描述 |
| `author` | `string` | **是** | 作者 |
| `dependencies` | `object` | **是** | 插件/组件依赖 |
| `entry_point` | `string` | **是** | 入口文件路径（通常为 `plugin.py`） |
| `api_version` | `string \| object` | 推荐 | 插件 API 模块版本要求，支持字符串与 dict 两种形式（详见下文） |
| `min_core_version` | `string` | 推荐 | 核心能力版本要求（如依赖核心新事件、新内核接口），与 `api_version` 同等判断 |
| `include` | `array` | 推荐 | 组件清单；未提供时按空列表处理 |
| `categories` | `array` | 推荐 | 分类标签，**仅允许一个值**，取值见 [下方固定取值](#categories-可用值)（如 `["tool"]`） |
| `tags` | `array` | 推荐 | 标签（如 `["qq", "ai"]`） |
| `python_dependencies` | `array` | 否 | Python 包依赖列表（pip requirement 格式） |
| `dependencies_required` | `bool` | 否 | Python 依赖是否必需（默认 `true`） |

## 版本兼容性声明：`api_version` 与 `min_core_version`

插件通过 `api_version` 与 `min_core_version` 声明对核心框架的版本要求。**两者同等判断（AND 语义）**：

- 声明了 `api_version` 就校验；声明了 `min_core_version` 就校验。
- 只要任一项声明且不满足 → **拒绝注册**。
- 两者都未声明 → 允许加载但发出警告，提示无法保证兼容性。

**不存在二流声明**：两个字段各司其职，按需选用，不区分主次。

### `api_version`：声明插件 API 模块版本

声明插件用到的 **插件 API 模块** 版本（按 20 个 `*_api` 模块逐一校验）。支持两种形式：

**字符串形式（最简）**：等价于对该版本声明时全部 20 个 API 模块都要求该版本。

```json
"api_version": "1.0.0"
```

**dict 形式（推荐，精确声明）**：仅校验声明的 keys，未声明的模块不校验。key 必须是合法 API 模块名，任何未知 key 会被拒绝加载（防止拼写错误被静默接受）。

```json
"api_version": {
  "llm_api": "1.0.0",
  "send_api": "1.2.0",
  "service_api": "1.0.0"
}
```

格式为 `x.y.z`（语义化版本）：

- **主版本号（x）**：破坏性更新，API 签名或行为发生不可兼容的变更
- **次版本号（y）**：部分非兼容性更新，可能包含弃用、行为微调等
- **小版本号（z）**：可向下兼容的更新，仅新增可选 API 或修复问题

兼容性检查规则（每个声明模块）：

- 主版本号不一致 → **拒绝加载**（存在破坏性变更）
- 核心 API 的次版本号低于插件要求 → **拒绝加载**（核心过旧）
- 核心 API 的次版本号与小版本号均不低于插件要求 → **允许加载**
- 核心 API 的次版本号高于插件要求 → **允许加载，但警告**（可能存在非兼容变更）

合法 API 模块名（20 个，与 `src/app/plugin_system/api/` 一一对应）：

```
action_api      adapter_api    agent_api      chat_api       command_api
config_api      database_api   event_api      llm_api        log_api
media_api       message_api    permission_api plugin_api     prompt_api
router_api      send_api       service_api    storage_api    stream_api
```

### `min_core_version`：声明核心能力版本

声明插件依赖的 **核心能力** 版本（基于 `CORE_VERSION` 做简单 `>=` 比较）。适用于插件依赖核心某些新功能——例如某些新的事件、新的核心组件机制、新的内核接口等——这些能力不通过 `*_api` 模块暴露，无法被 `api_version` 覆盖，必须由 `min_core_version` 兜底。

```json
"min_core_version": "1.2.0"
```

### 何时该用哪个

| 场景 | `api_version` | `min_core_version` |
| --- | --- | --- |
| 插件 `import` 了 `*_api` 模块 | ✅ 必填（dict 形式精确声明用到的模块） | 可选 |
| 插件依赖核心新事件 / 新内核接口 / 新组件机制 | ❌ 无法表达 | ✅ 必填 |
| 插件只用稳定 API、不碰核心新功能 | ✅ | 留空 |
| 插件同时用到 API 模块且依赖新核心能力 | ✅ | ✅（两者都填，AND 校验都须满足） |

::: tip 按需填写
两个字段是「或」关系，用到哪个就写哪个：

- 插件 `import` 了任何 `*_api` 模块 → 写 `api_version`
- 插件用到「必须更高版本核心才支持」的能力（新事件、新内核接口、新组件机制）→ 写 `min_core_version`
- 两者都不需要 → 可都不写（仅警告但加载，无法保证兼容性）

一旦声明，就按 AND 同等判断：声明了哪一项就校验哪一项，只要任一项声明且不满足即拒绝注册。
:::

## `dependencies`

```json
"dependencies": {
  "plugins": ["other_plugin"],
  "components": ["other_plugin:service:memory"]
}
```

- `plugins`：依赖的插件名列表
- `components`：依赖的组件签名列表（格式 `plugin:type:name`）

## `include`（推荐）

声明插件包含的组件及组件级依赖。

```json
"include": [
  {
    "component_type": "action",
    "component_name": "send_emoji",
    "dependencies": ["other_plugin:service:emoji"],
    "enabled": true
  }
]
```

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `component_type` | `string` | — | 组件类型 |
| `component_name` | `string` | — | 组件名称 |
| `dependencies` | `string[]` | `[]` | 组件级依赖 |
| `enabled` | `bool` | `true` | 是否启用 |

### `component_type` 可用值

- `action`
- `tool`
- `adapter`
- `chatter`
- `command`
- `event_handler`
- `service`
- `router`
- `config`
- `agent`

## `categories`（推荐）

声明插件的分类，用于插件市场检索与归类。**数组中只允许填一个值**，超出会被工具链告警。

```json
"categories": ["tool"]
```

### `categories` 可用值

固定取值（来源于 `mofox-plugin-toolkit` 中的 `ALLOWED_CATEGORIES`）：

- `tool` — 工具类
- `chat` — 对话/聊天类
- `fun` — 娱乐/趣味类
- `information` — 信息/查询类
- `moderation` — 管理/审核类

::: warning 只允许一个值
工具链会校验 `categories` 长度必须为 1，且值必须在上述范围内。多个分类或拼写错误（例如写成 `tools`、`chats`）都会触发告警。
:::

## `python_dependencies`（可选）

```json
"python_dependencies": [
  "requests>=2.28.0",
  "pandas>=1.5.0"
]
```

- `dependencies_required: true`（默认）：依赖安装失败时插件跳过
- `dependencies_required: false`：安装失败仅警告，仍尝试加载

## 完整示例

字符串形式（最简）：

```json
{
  "name": "default_chatter",
  "version": "1.0.0",
  "description": "默认对话插件",
  "author": "MoFox Team",
  "dependencies": {
    "plugins": [],
    "components": []
  },
  "include": [
    {
      "component_type": "chatter",
      "component_name": "default_chatter",
      "dependencies": [],
      "enabled": true
    }
  ],
  "entry_point": "plugin.py",
  "api_version": "1.0.0",
  "categories": ["chat"],
  "tags": ["built-in"]
}
```

dict 形式（推荐，精确声明所用 API 模块）：

```json
{
  "name": "default_chatter",
  "version": "1.2.0",
  "description": "默认对话插件",
  "author": "MoFox Team",
  "dependencies": {
    "plugins": [],
    "components": []
  },
  "include": [
    {
      "component_type": "chatter",
      "component_name": "default_chatter",
      "dependencies": [],
      "enabled": true
    }
  ],
  "entry_point": "plugin.py",
  "api_version": {
    "adapter_api": "1.0.0",
    "chat_api": "1.0.0",
    "database_api": "1.0.0",
    "event_api": "1.0.0",
    "llm_api": "1.0.0",
    "log_api": "1.0.0",
    "prompt_api": "1.0.0",
    "send_api": "1.0.0",
    "stream_api": "1.0.0"
  },
  "min_core_version": "1.2.0",
  "categories": ["chat"],
  "tags": ["built-in"]
}
```
