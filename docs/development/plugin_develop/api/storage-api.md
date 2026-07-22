# Storage API

`src.app.plugin_system.api.storage_api` 提供两种独立存储能力：JSON 文件存储（基于 `JSONStore`）和 PluginDatabase（SQLite）。

## JSON 存储

简单键值存储，每个 `store_name` 对应 `data/json_storage/<store_name>/` 目录，不同插件互不干扰。底层使用 `src.kernel.storage.JSONStore`。

```python
from src.app.plugin_system.api.storage_api import (
    save_json, load_json, delete_json, exists_json, list_json,
)
```

| 函数 | 说明 |
|------|------|
| `save_json(store_name, name, data) -> None` | 保存 JSON 数据 |
| `load_json(store_name, name) -> dict \| None` | 加载 JSON 数据，键不存在时返回 `None` |
| `delete_json(store_name, name) -> bool` | 删除 JSON 数据，键不存在时返回 `False` |
| `exists_json(store_name, name) -> bool` | 检查键是否存在 |
| `list_json(store_name) -> list[str]` | 列出所有键名（不含 `.json` 后缀） |

```python
await save_json("my_plugin", "settings", {"theme": "dark"})
settings = await load_json("my_plugin", "settings")
```

### `JSONStore`

`src.app.plugin_system.api.storage_api` 同时导出底层 `JSONStore` 类，可直接构造以使用自定义目录或更细粒度的控制：

```python
from src.app.plugin_system.api.storage_api import JSONStore

store = JSONStore("data/my_plugin/custom_store")
await store.save("key", {"a": 1})
data = await store.load("key")
```

## PluginDatabase

插件独立 SQLite 数据库，提供标准 CRUD/QueryBuilder/AggregateQuery 接口。

永远使用 SQLite，在指定路径独立存储，与主程序数据库不共享任何引擎或连接。

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
| `db.initialize() -> None` | 初始化引擎并建表（幂等），启用 WAL / NORMAL 等性能优化 pragma |
| `db.crud(model) -> CRUDBase` | 获取 CRUD 实例 |
| `db.query(model) -> QueryBuilder` | 获取查询构建器 |
| `db.aggregate(model) -> AggregateQuery` | 获取聚合查询 |
| `db.invalidate(model) -> None` | 使原始 SQL 写入后该模型的进程内读缓存失效 |
| `db.session() -> AsyncGenerator[AsyncSession, None]` | 获取原始 session（上下文管理器），会话退出时自动提交，异常时自动回滚 |
| `db.close() -> None` | 关闭数据库引擎，释放所有连接资源 |

::: warning 初始化约束
使用 `crud`、`query`、`aggregate`、`session` 方法前必须先调用 `await db.initialize()`，否则会抛出 `RuntimeError`。
:::

## 相关文档

- [Database API](./database-api.md)
- [数据持久化](../advanced/data-persistence.md)
