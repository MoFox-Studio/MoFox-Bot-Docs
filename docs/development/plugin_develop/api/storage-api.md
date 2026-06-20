# Storage API

`src.app.plugin_system.api.storage_api` 提供两种独立存储能力：JSON 文件存储和 PluginDatabase（SQLite）。

## JSON 存储

简单键值存储，每个 `store_name` 对应 `data/json_storage/<store_name>/` 目录，不同插件互不干扰。

```python
from src.app.plugin_system.api.storage_api import (
    save_json, load_json, delete_json, exists_json, list_json,
)
```

| 函数 | 说明 |
|------|------|
| `save_json(store_name, name, data) -> None` | 保存 JSON 数据 |
| `load_json(store_name, name) -> dict \| None` | 加载 JSON 数据 |
| `delete_json(store_name, name) -> bool` | 删除 JSON 数据 |
| `exists_json(store_name, name) -> bool` | 检查键是否存在 |
| `list_json(store_name) -> list[str]` | 列出所有键名 |

```python
await save_json("my_plugin", "settings", {"theme": "dark"})
settings = await load_json("my_plugin", "settings")
```

## PluginDatabase

插件独立 SQLite 数据库，提供标准 CRUD/QueryBuilder/AggregateQuery 接口。

```python
from src.app.plugin_system.api.storage_api import PluginDatabase
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, Text

class Base(DeclarativeBase):
    pass

class MyRecord(Base):
    __tablename__ = "my_records"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)

db = PluginDatabase("data/my_plugin/data.db", [MyRecord])
await db.initialize()

# CRUD
record = await db.crud(MyRecord).create({"name": "hello"})

# 查询
results = await db.query(MyRecord).filter(name="hello").all()

# 聚合
counts = await db.aggregate(MyRecord).group_by_count("name")

# 原始 session（复杂操作）
async with db.session() as s:
    await s.execute(...)

await db.close()
```

### 方法

| 方法 | 说明 |
|------|------|
| `db.initialize() -> None` | 初始化引擎并建表（幂等） |
| `db.crud(model) -> CRUDBase` | 获取 CRUD 实例 |
| `db.query(model) -> QueryBuilder` | 获取查询构建器 |
| `db.aggregate(model) -> AggregateQuery` | 获取聚合查询 |
| `db.session() -> AsyncGenerator[AsyncSession]` | 获取原始 session（上下文管理器） |
| `db.close() -> None` | 关闭数据库引擎 |
