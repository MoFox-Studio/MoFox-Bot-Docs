# 表情插件（emoji_sender）

Neo-MoFox 内置的表情相关插件，负责**表情包收藏发送**：从 media cache 抽取候选，VLM 决策是否收藏并标注入库，再按情感 tag + 向量检索发送表情包。

## emoji_sender — 表情包发送器

从 media cache 随机挑选表情包，VLM 决策是否收藏并标注入库；按情感 tag + 向量检索发送表情包。

### 核心功能

- **自动入库**：定时从 `data/media_cache/emojis/` 随机抽取表情包，调用 VLM（注入主配置人格 `personality`）决定是否收藏并输出标注（描述 + 情感 tag）
- **收藏存储**：若收藏，复制源文件到 `data/emoji_sender/memes/`，并将描述 embedding 写入 `data/emoji_sender/vector_db/`
- **智能发送**：对外暴露 Action，根据「目标描述 + 情感 tag」通过向量检索发送表情包
- **编程接口**：对外暴露 Service，供其他插件以编程方式检索 / 发送
- **温度采样**：检索阶段支持通过 `vector.temperature` 控制采样强度，避免代表性表情反复被固定选中

::: tip 手动管理表情
用户手动删除 `data/emoji_sender/memes/` 中不想要的表情后，会在下一次入库任务开始时自动清理数据库对应条目。
:::

### 它是给谁用的

emoji_sender 的 Action 由**LLM 自动调用**。机器人会根据对话情感判断是否主动发送表情包。Service 接口供其他插件编程调用。

### 配置说明

配置文件：`config/plugins/emoji_sender/config.toml`

#### `[scheduler]` 调度

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `interval_seconds` | `120` | 入库任务执行间隔（秒） |

#### `[plugin]` 插件行为

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 是否启用插件 |
| `inject_system_prompt` | `true` | 是否将表情包使用提示同步到 default_chatter 的 actor system reminder |
| `interaction_mode` | `"direct"` | 发送模式：`direct`=一步直达（插件自动挑选后直接发送）；`picker`=两段式（先查询候选列表，由 AI 亲自挑选后按 id 发送）。修改后需重载插件 |

::: warning dev 分支专属
`interaction_mode` 与 direct / picker 双模式为 **1.1.0 起的新功能**，目前仅存在于 Neo-MoFox 的 **`dev` 分支**（正式发布版为 1.0.0，仅 direct 模式）。
:::

### 发送模式（1.1.0 起，dev 分支）

#### direct（默认）——一步直达

注册 Action `send_emoji_meme`：AI 给出「目标描述 + 情感 tag」，插件按向量距离与温度采样自动挑选一张直接发送。适合简单场景，省一轮 LLM 调用。

#### picker——查询挑选（AI 亲自挑选）

注册 Tool `search_emoji_memes` + Action `send_emoji_meme_by_id`，两段式流程：

1. AI 调用 `search_emoji_memes(描述, [情感tag], page)` 查看候选列表（每项含 id、标签、描述、距离，距离越小越贴切，同一表情多标签已去重）
2. AI 从中挑选最契合的一张，调用 `send_emoji_meme_by_id(id)` 发送；不满意可换描述重查或翻页

适合希望 AI 对发什么表情有更高控制力、表达更精准的场景。每页数量由 `[picker]` 配置节控制。

#### 使用历史去重（两种模式共通）

`[dedup]` 配置节：

- `enabled`：默认开启。每个聊天流记住最近 `window` 张已发送的表情包，检索候选时自动过滤，避免短时间重复发同一张
- 候选全被过滤时自动回退全量，不会因此无表情可发
- 历史保存在内存中，重启后清空

#### `[prompt]` 自定义提示词

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `custom_instructions` | `""` | 追加到 `send_emoji_meme` action 描述末尾的自定义指令，可描述希望 AI 主动使用表情包的具体场景 |

#### `[ingest]` 入库

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `manual_memes_dir` | `data/emoji_sender/manual_memes` | 手动放置表情包的目录 |
| `sample_from_media_cache` | `true` | 是否从 `data/media_cache/emojis` 随机抽取候选（关闭则使用手动目录） |

#### `[vector]` 向量库

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `collection_name` | `emoji_sender` | 向量集合名 |
| `db_path` | `data/emoji_sender/vector_db` | 向量数据库路径（ChromaDB） |
| `top_n` | `8` | 检索候选数量 topN |
| `max_distance` | `0.35` | 最大距离阈值（距离越小越相似） |
| `temperature` | `0.3` | 检索结果采样温度（`<=0` 固定选最相似项，越大越随机） |

#### `[picker]` 两段式挑选（dev 分支）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `page_size` | `6` | picker 模式下候选列表每页数量 |

#### `[dedup]` 使用历史去重（dev 分支）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 是否过滤每个聊天流最近已发送过的表情包（无可用候选时自动回退全量） |
| `window` | `6` | 每个聊天流记住的最近已发送表情包数量（最近 N 张内不重复发送） |

#### `[storage]` 文件存储

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `data_dir` | `data/emoji_sender/memes` | 插件表情包复制文件目录 |
| `max_memes` | `200` | 最大可用表情包数量上限（`<=0` 表示不限制） |

### 依赖

- Python 依赖：`pillow`（必需）
- 配置依赖为必需（`dependencies_required: true`）

## 组件清单

| 插件 | 组件 | 类型 | 说明 |
|------|------|------|------|
| emoji_sender | `emoji_sender` | Service | 表情包检索与发送服务 |
| emoji_sender | `send_emoji_meme` | Action | direct 模式：根据情感 tag 自动挑选并发送表情包 |
| emoji_sender | `search_emoji_memes` | Tool | picker 模式：查询表情包候选列表 |
| emoji_sender | `send_emoji_meme_by_id` | Action | picker 模式：按 id 发送选定的表情包 |
