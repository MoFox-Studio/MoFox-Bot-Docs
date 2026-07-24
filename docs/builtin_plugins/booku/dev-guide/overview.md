# Booku 开发指南 · 总览

本文面向希望在 Booku 记忆系统基础上做二次开发的插件作者，详列对外暴露的服务、方法签名、返回结构与使用示例。

## 组件签名

| 组件签名 | 类型 | 说明 |
|----------|------|------|
| `booku_memory:service:booku_memory` | Service | 记忆核心服务，提供记忆 CRUD / 检索 / 晋升等能力 |
| `booku_memory:service:booku_knowledge` | Service | 知识库服务，提供文档入库与导出能力 |
| `booku_memory:router:memory_admin` | Router | WebUI 记忆管理后台路由 |
| `booku_memory:tool:memory_command` | Tool | LLM 可调用的长期记忆命令工具（CLI 风格） |
| `booku_memory:tool:temporary_memo` | Tool | LLM 可调用的临时便签工具 |

## 跨插件调用约定

外部插件**不能**直接 `import plugins.booku_memory.*`，只能通过框架 Service API 获取：

```python
from src.app.plugin_system.api.service_api import get_service

memory_service = get_service("booku_memory:service:booku_memory")
knowledge_service = get_service("booku_memory:service:booku_knowledge")
```

`get_service(...)` 每次返回新实例，建议在 `on_plugin_loaded` 中缓存或按需获取。所有方法均为 `async`，需在异步上下文中 `await` 调用。

---

## BookuMemoryService 接口

服务签名：`booku_memory:service:booku_memory`

### 写入与合并

#### `upsert_memory(content, *, title=None, bucket="memory", folder_id=None, tags=None, core_tags=None, diffusion_tags=None, opposing_tags=None, memory_type="knowledge", status="active", person_id=None, relation_memory_ids=None, relation_aliases=None, event_start_at=0.0, event_end_at=0.0, related_people=None, knowledge_type="", address_or_coord="", place_type="", asset_type="", disposition_status="", procedure_type="", source="agent") -> dict`

写入或自动合并记忆。写入前检索邻域向量并计算新颖度能量比：

- 能量比 ≥ `write_conflict.energy_cutoff`：内容新颖，创建新记忆（`mode="created"`）
- 能量比 < 阈值：内容重复，自动合并到最相似的现有记忆（`mode="merged"`）

**参数：**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `content` | `str` | — | 记忆正文，不能为空字符串 |
| `title` | `str \| None` | `None` | 标题，为空时从 `content` 首行自动提取 |
| `bucket` | `str` | `"memory"` | 存储桶，仅支持 `"memory"` / `"knowledge"` |
| `folder_id` | `str \| None` | `None` | 记忆所属文件夹 |
| `tags` | `list[str] \| None` | `None` | 通用标签 |
| `core_tags` / `diffusion_tags` / `opposing_tags` | `list[str] \| None` | `None` | 三元标签组，检索重塑用 |
| `memory_type` | `str` | `"knowledge"` | 见下方类型表 |
| `status` | `str` | `"active"` | `active` / `archived` / `expired` |
| `person_id` | `str \| None` | `None` | `memory_type="person"` 时必填，格式 `platform:id` |
| `relation_memory_ids` | `list[str] \| None` | `None` | 关联记忆 ID |
| `relation_aliases` | `list[str] \| None` | `None` | 关联别名 |
| `event_start_at` / `event_end_at` | `float` | `0.0` | 事件起止时间戳（`event` 类型用） |
| `related_people` | `list[str] \| None` | `None` | 关联人物 |
| `source` | `str` | `"agent"` | 来源标识 |

**返回：** `{"mode": "created"|"merged", "id": str, "collection": str, "novelty_energy": float, "item": dict}`

**抛错：** `content` 为空时抛 `ValueError`。

#### `create_memory(*, title, content, folder_id=None, bucket="emergent", core_tags=None, diffusion_tags=None, opposing_tags=None, memory_type="knowledge", status="active", person_id=None, ...) -> dict`

创建记忆并返回标准工具项形式结果。与 `upsert_memory` 的区别：**不**做冲突合并，直接新建，默认进入 `emergent`（隐现）层。

- `title` / `content` 为必填
- `bucket` 默认 `"emergent"`（隐现层，区别于 `upsert_memory` 的 `"memory"`）
- 其余参数同 `upsert_memory`

#### `create_temporary_memo(*, content, expire_hours=2.0, stream_id=None) -> dict`

创建或刷新短期临时备忘录。

- `content`（必填）：要记录的短期关键内容
- `expire_hours`：相对过期时间（小时），默认 2.0
- `stream_id`：可选，绑定到特定聊天流
- **特性**：不进入长期记忆检索；会通过 system reminder 短期播报；到期自动过期

---

### 检索

#### `retrieve_memories(query_text, *, top_k=None, include_archived=None, include_knowledge=None, core_tags=None, diffusion_tags=None, opposing_tags=None) -> dict`

执行 EPA 向量动力学重塑后的语义检索。流程：初始检索 → 根据三元标签组 + 投影熵/共振展当轮 beta → 用重塑向量再次检索并潄分 → 去重器消除冗余。

**参数：**

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `query_text` | `str` | — | 检索关键词文本 |
| `top_k` | `int \| None` | `None` | 返回条数，`None` 用配置默认值 `retrieval.default_top_k` |
| `include_archived` | `bool \| None` | `None` | 是否检索归档层，`None` 用配置默认 |
| `include_knowledge` | `bool \| None` | `None` | 是否检索知识库，`None` 用配置默认 |
| `core_tags` | `list[str] \| None` | `None` | 核心标签，提升匹配记忆得分 |
| `diffusion_tags` | `list[str] \| None` | `None` | 扩散标签，扇形扩展检索语义 |
| `opposing_tags` | `list[str] \| None` | `None` | 对立标签，对匹配记忆陨分 |

**返回：** `{"query": str, "logic_depth": float, "resonance": float, "beta": float, "total": int, "results": list[dict]}`，每个 result 含 `id` / `title` / `content_snippet` / `score` 等。

#### `search_memory_entries(*, top_n=10, query_text=None, memory_type=None, status=None, person_id=None, relation_of=None, include_archived=False, include_knowledge=True, include_related=False, core_tags=None, diffusion_tags=None, opposing_tags=None) -> dict`

按条件检索，返回仅含 `id` / `title` / `metadata` 的精简结果，适合列表展示。

- `relation_of`：返回与指定 memory_id 有关系记忆
- `include_related`：是否包含关联记忆

#### `grep_memories(*, query, search_fields, folder_id=None, include_archived=False, top_k=10, use_regex=False) -> dict`

按关键词或正则表达式在指定字段中匹配记忆，适合精确词汇 / 模式定位。

- `search_fields`（必填）：要搜索的字段列表，如 `["title", "content"]`
- `use_regex`：`True` 时 `query` 作为正则

---

### 读取

#### `read_full_content(*, memory_ids) -> dict`

按 `memory_id` 列表批量读取记忆完整正文。

**返回：** `{"action": "read", "items": list[dict], "missing": list[str]}`，`items` 含 `id` / `title` / `content` / `metadata`。

#### `get_memory_detail(*, memory_id, include_deleted=True) -> dict`

读取单条记忆的完整详情。

- `memory_id`（必填）
- `include_deleted`：是否允许读取软删除记录，默认 `True`

#### `list_memory_entries(*, keyword=None, memory_type=None, status=None, person_id=None, folder_id=None, bucket=None, include_archived=True, include_deleted=False, limit=50) -> dict`

按后台管理所需的结构化条件列出记忆。

#### `query_memory_status(*, folder_id=None, include_archived=True, recent_limit=8) -> dict`

查询记忆状态：各层记忆数量、最近记忆、folder id 列表。

**返回：** `{"folder_id": str, "vector_counts": dict, "metadata_counts": dict, "recent": list, "folder_memory_ids": list}`

#### `get_status(folder_id=None) -> dict`

`query_memory_status` 的简化包装层，返回 `{"folder_id", "counts": {"vector", "metadata"}, "recent", "folder_memory_ids"}`。

#### `list_folder_ids() -> dict`

列出当前记忆库中可用的 folder_id。

**返回：** `{"action": "list_folder_ids", "total": int, "items": list[str]}`

---

### 更新与删除

#### `update_memory_by_id(*, memory_id, title=None, content=None, core_tags=None, diffusion_tags=None, opposing_tags=None, memory_type=None, status=None, person_id=None, relation_memory_ids=None, relation_aliases=None, event_start_at=None, event_end_at=None, related_people=None, knowledge_type=None, address_or_coord=None, place_type=None, asset_type=None, disposition_status=None, procedure_type=None) -> dict`

按 `memory_id` 就地更新普通记忆的内容、标题及标签。所有字段均可选，传 `None` 表示不修改。

- `memory_id`（必填）
- 若更新标签，**必须整组三元标签一起传**（`core_tags` + `diffusion_tags` + `opposing_tags`）

#### `delete_memories(*, memory_ids, hard=False) -> dict`

删除指定记忆。

- `memory_ids`（必填）：ID 列表
- `hard`：`False` 软删（默认，可恢复），`True` 硬删

#### `move_memories(*, memory_ids, to_bucket=None, to_folder_id=None) -> dict`

将指定记忆批量移动到目标 folder 或 bucket。

#### `archive_memories(memory_ids, *, folder_id=None) -> dict`

将隐现记忆迁移到归档层（emergent → archived）。

#### `update_activated(memory_id) -> None`

原子地将指定记忆的激活次数 +1 并更新最近激活时间。用于隐现记忆晋升判定。

---

### 维护

#### `promote_stale_emergent(folder_id=None) -> dict`

扫描超过时间窗口（`time_window.emergent_days`）的 emergent 记忆：激活次数达阈值（`activation_threshold`）者升冻归档，其余丢弃。

---

## BookuKnowledgeService 接口

服务签名：`booku_memory:service:booku_knowledge`

#### `ingest_document(*, title, content="", file_path=None, source="agent") -> dict`

入库文档到知识库。文档内容可直接传入 `content`，也可通过 `file_path` 指向本地文件。支持按 `chunking.max_chunk_chars` / `overlap_chars` 切分，标题与正文分别 embedding。

- `title`（必填）：文档标题
- `content`：文档内容文本
- `file_path`：本地文件路径（与 `content` 二选一）
- `source`：来源标识

#### `export_document_titles() -> list[str]`

导出知识库中所有文档标题列表。

#### `dump_documents(*, limit=100) -> dict`

导出知识库文档内容。该方法未封装进 tool，供后台 / 调用方直接使用。

#### `remember_titles_json() -> str`

以 JSON 字符串形式返回已记录的文档标题（便于注入 prompt，让 LLM 知道有哪些知识库文档可检索）。

---

## 三元标签组

> 重要：三元标签组是语义检索的关键驱动力。

只要使用标签参数，就必须同时提供完整且非空的三组：

- `core_tags`：核心标签，检索时最优先，提升匹配记忆得分
- `diffusion_tags`：扩散标签，扇形扩展检索语义
- `opposing_tags`：对立标签，对匹配记忆陨分

也可使用简写 `-triple_tags "核心1,核心2|扩散1,扩散2|对立1,对立2"`（仅 Tool 接口支持）。

## 记忆类型与专属字段

| 类型 | 专属字段 | 说明 |
|------|----------|------|
| `person` | `person_id`、`relation_memory_ids`、`relation_aliases` | 人物记忆，`person_id` 必填，格式 `platform:id` |
| `event` | `event_start_at`、`event_end_at`、`related_people` | 事件记忆，含起止时间 |
| `knowledge` | `knowledge_type` | 知识记忆，`knowledge_type` 取 `concept` / `model` / `quote` / `counterintuitive` |
| `place` | `address_or_coord`、`place_type` | 地点记忆 |
| `asset` | `asset_type`、`disposition_status` | 资产记忆 |
| `procedure` | `procedure_type` | 流程记忆，取 `process` / `tech` / `deploy` / `cooking` |

## 检索重塑机制

检索阶段基于三元标签组对召回结果做向量重塑（EPA 向量动力学）：

| 配置项 | 作用 |
|--------|------|
| `base_beta` | 基准重塑强度 |
| `logic_depth_scale` | 逻辑深度对 beta 的增益 |
| `core_boost_min` / `core_boost_max` | 核心标签增强范围 |
| `diffusion_boost` | 扩散标签增强权重 |
| `opposing_penalty` | 对立标签惩罚权重 |

## 使用示例

### 写入一条人物记忆

```python
service = get_service("booku_memory:service:booku_memory")

result = await service.upsert_memory(
    content="张三是我的大学同学，喜欢打篮球",
    title="张三",
    memory_type="person",
    person_id="qq:10001",
    core_tags=["朋友", "同学"],
    diffusion_tags=["学校", "班级"],
    opposing_tags=["陌生人", "路人"],
)
print(result["mode"], result["id"])  # created 或 merged
```

### 语义检索

```python
result = await service.retrieve_memories(
    query_text="大学同学",
    top_k=5,
    core_tags=["朋友", "同学"],
    diffusion_tags=["学校", "班级"],
    opposing_tags=["陌生人", "路人"],
)
for item in result["results"]:
    print(item["title"], item["score"])
```

### 读取记忆全文

```python
detail = await service.read_full_content(memory_ids=["mem-xxx"])
for item in detail["items"]:
    print(item["title"], item["content"])
```

### 入库知识库文档

```python
kservice = get_service("booku_memory:service:booku_knowledge")
await kservice.ingest_document(
    title="Neo-MoFox 架构说明",
    file_path="data/booku_memory/knowledges/arch.md",
)
```

## 版本

- Plugin: `1.0.0`
- min_core_version: `1.2.0RC1`
- api_version: `llm_api`, `log_api`, `storage_api`（均为 `1.0.0`）
