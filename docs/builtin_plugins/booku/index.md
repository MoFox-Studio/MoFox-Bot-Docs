# Booku 记忆（booku_memory）

Booku 记忆系统是 Neo-MoFox 内置的长期记忆插件，让机器人能记住用户的偏好、过往事件与知识，并在后续对话中按需调用。

## 它能做什么

- **长期记忆**：把重要信息沉淀下来，后续对话中能「想起来」
- **临时便签**：记录短期关键内容（如「等下要回复某人」），到期自动消失
- **语义检索**：不是死记硬背，而是按语义相关性召回最合适的记忆
- **隐现晋升**：新记忆先进入「隐现层」，被多次激活后才转为「归档层」，避免噪音堆积
- **记忆闪回**：偶尔主动回忆一条旧记忆，让对话更自然
- **知识库导入**：启动时自动导入本地文档作为知识库
- **WebUI 管理**：通过管理后台可视化管理已存储的记忆

## 它是给谁用的

Booku 记忆是**给 LLM 自动使用的工具**，普通用户无需手动操作。机器人会根据对话内容自动决定何时检索、何时写入记忆。你只需要做好配置，剩下的交给机器人。

## 配置说明

配置文件：`config/plugins/booku_memory/config.toml`，也可在 WebUI 的「插件配置」中图形化编辑。

### 插件设置 `[plugin]`

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 是否启用插件 |
| `inject_system_prompt` | `true` | 是否把记忆引导语注入到机器人的系统提示中，让它知道有记忆可用 |
| `memory_tool_miss_warning_threshold` | `6` | 机器人连续多少轮没用记忆工具就提醒一次 |

### 存储配置 `[storage]`

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `metadata_db_path` | `data/booku_memory/metadata.db` | 元数据数据库路径 |
| `vector_db_path` | `data/chroma_db/booku_memory` | 向量数据库路径 |
| `default_folder_id` | `default` | 默认活动记忆文件夹 ID |

### 检索配置 `[retrieval]`

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `default_top_k` | `5` | 默认每次召回多少条记忆 |
| `include_archived_default` | `false` | 默认是否检索归档层记忆 |
| `include_knowledge_default` | `false` | 默认是否检索知识库 |
| `deduplication_threshold` | `0.88` | 结果去重阈值（越高越严格） |

### 隐现记忆窗口 `[time_window]`

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `emergent_days` | `7` | 新记忆在「隐现层」停留的天数 |
| `activation_threshold` | `2` | 在窗口内被激活多少次才晋升为归档记忆 |

### 记忆闪回 `[flashback]`

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `false` | 是否启用闪回 |
| `trigger_probability` | `0.05` | 每轮触发闪回的概率 |
| `archived_probability` | `0.6` | 闪回时抽归档层记忆的概率 |
| `cooldown_seconds` | `3600` | 同一条记忆被闪回的冷却时间 |

### 启动自动导入 `[startup_ingest]`

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 启动时是否自动导入配置路径下的文档 |
| `paths` | `["data\\booku_memory\\knowledges"]` | 导入路径列表 |
| `recursive` | `true` | 是否递归扫描子目录 |
| `skip_existing_title` | `true` | 标题已存在时是否跳过 |

::: tip 如何添加知识库
把要导入的文档（txt/md 等）放到 `startup_ingest.paths` 配置的目录下，重启机器人即可自动入库。
:::

## 相关文档

- [Booku 开发指南 · 总览](./dev-guide/overview) — 面向插件开发者的服务接口说明
