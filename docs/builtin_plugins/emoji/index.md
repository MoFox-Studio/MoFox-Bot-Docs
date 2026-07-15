# 表情插件（emoji_like / emoji_sender）

Neo-MoFox 内置两个表情相关插件，分别负责**贴表情回应**和**表情包收藏发送**。

## emoji_like — 智能贴表情

为群聊消息添加 QQ 表情回应（贴表情），通过 LLM 自动选择合适的表情，支持「跟贴」功能。

### 核心功能

- **自动贴表情**：根据对话上下文，机器人自动为群消息贴上合适的表情回应
- **跟贴**：当其他用户对消息贴表情时，自动跟贴相同表情

### 它是给谁用的

emoji_like 是**给 LLM 使用的 Action**，普通用户无需手动触发。机器人会根据群聊气氛自动决定是否贴表情。

### 配置说明

配置文件：`config/plugins/emoji_like/config.toml`

```toml
[plugin]
enabled = true        # 是否启用插件
follow_emoji = false  # 是否启用跟贴功能：当其他用户对消息贴表情时，自动跟贴相同表情
```

### 依赖

- 依赖插件：`notice_processor`
- 依赖组件：`notice_processor:service:notice_processor`（必需）

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
| `inject_system_prompt` | `true` | 是否将表情包使用提示同步到 default_chatter 的 actor system reminder |

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
| emoji_like | `set_emoji_like` | Action | 为消息贴表情回应 |
| emoji_sender | `emoji_sender` | Service | 表情包检索与发送服务 |
| emoji_sender | `send_emoji_meme` | Action | 根据情感 tag 发送表情包 |
