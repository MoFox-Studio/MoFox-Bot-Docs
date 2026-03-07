# Storage API

`src/app/plugin_system/api/storage_api` 提供两种独立存储能力：JSON 存储和数据库存储。

## 导入

```python
# JSON 存储
from src.app.plugin_system.api.storage_api import (
    save_json,
    load_json,
    delete_json,
    exists_json,
    list_json,
)

# 数据库存储
from src.app.plugin_system.api.storage_api import PluginDatabase
```

## JSON 存储

简单的键值存储，每个 `store_name` 对应 `data/json_storage/<store_name>/` 目录。

### `save_json(store_name: str, name: str, data: dict) -> None`

保存 JSON 数据。

**参数：**
- `store_name`: 存储命名空间（通常使用插件名称）
- `name`: 数据键名（不含 `.json` 后缀）
- `data`: 要保存的数据字典

**使用示例：**
```python
# 保存用户设置
await save_json(
    store_name="my_plugin",
    name="user_settings",
    data={
        "theme": "dark",
        "language": "zh-CN",
        "notifications": True,
    },
)
```

---

### `load_json(store_name: str, name: str) -> dict | None`

加载 JSON 数据。

**参数：**
- `store_name`: 存储命名空间
- `name`: 数据键名

**返回值：**
- 数据字典，键不存在时返回 `None`

**使用示例：**
```python
# 加载用户设置
settings = await load_json("my_plugin", "user_settings")

if settings:
    theme = settings.get("theme", "light")
    print(f"当前主题: {theme}")
else:
    print("设置不存在")
```

---

### `delete_json(store_name: str, name: str) -> bool`

删除 JSON 数据。

**参数：**
- `store_name`: 存储命名空间
- `name`: 数据键名

**返回值：**
- `True` 表示删除成功，`False` 表示键不存在

**使用示例：**
```python
success = await delete_json("my_plugin", "user_settings")

if success:
    print("设置已删除")
else:
    print("设置不存在")
```

---

### `exists_json(store_name: str, name: str) -> bool`

检查 JSON 键是否存在。

**参数：**
- `store_name`: 存储命名空间
- `name`: 数据键名

**返回值：**
- `True` 表示存在，`False` 表示不存在

**使用示例：**
```python
if await exists_json("my_plugin", "user_settings"):
    print("设置已存在")
else:
    print("设置不存在，使用默认值")
```

---

### `list_json(store_name: str) -> list[str]`

列出命名空间下所有键名。

**参数：**
- `store_name`: 存储命名空间

**返回值：**
- 键名列表（不含 `.json` 后缀）

**使用示例：**
```python
keys = await list_json("my_plugin")

print("已保存的数据:")
for key in keys:
    print(f"  - {key}")
```

## 数据库存储

基于 SQLite 的结构化存储，提供完整的 CRUD 和查询能力。

### `PluginDatabase`

插件独立数据库类。

**初始化：**
```python
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Text

Base = declarative_base()

class MyRecord(Base):
    __tablename__ = "records"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[str] = mapped_column(Text)

# 创建数据库实例
db = PluginDatabase("data/my_plugin/data.db", [MyRecord])

# 初始化（建表）
await db.initialize()
```

---

### `db.crud(model) -> CRUDBase`

获取 CRUD 接口。

**返回值：**
- `CRUDBase` 实例

**使用示例：**
```python
# 创建记录
record = await db.crud(MyRecord).create({
    "name": "test",
    "value": "hello",
})

# 读取记录
record = await db.crud(MyRecord).get(id=1)

# 更新记录
updated = await db.crud(MyRecord).update(
    id=1,
    data={"value": "world"},
)

# 删除记录
success = await db.crud(MyRecord).delete(id=1)
```

---

### `db.query(model) -> QueryBuilder`

获取查询构建器。

**返回值：**
- `QueryBuilder` 实例

**使用示例：**
```python
# 简单查询
records = await db.query(MyRecord).filter(name="test").all()

# 复杂查询
records = await db.query(MyRecord)\
    .filter(name="test")\
    .order_by("id", desc=True)\
    .limit(10)\
    .all()

# 分页查询
page1 = await db.query(MyRecord).limit(20).offset(0).all()
page2 = await db.query(MyRecord).limit(20).offset(20).all()
```

---

### `db.aggregate(model) -> AggregateQuery`

获取聚合查询接口。

**返回值：**
- `AggregateQuery` 实例

**使用示例：**
```python
# 统计总数
count = await db.aggregate(MyRecord).count()

# 分组统计
results = await db.aggregate(MyRecord).group_by_count("name")
# 返回: [{"name": "test", "count": 5}, ...]
```

---

### `db.session() -> AsyncSession`

获取原始会话（用于复杂操作）。

**返回值：**
- 异步上下文管理器，yield `AsyncSession`

**使用示例：**
```python
from sqlalchemy import update

# 批量更新
async with db.session() as s:
    await s.execute(
        update(MyRecord)
        .where(MyRecord.name == "old")
        .values(name="new")
    )

# upsert 操作
async with db.session() as s:
    # 复杂的 upsert 逻辑
    pass
```

---

### `db.close() -> None`

关闭数据库。

**使用示例：**
```python
await db.close()
```

## 完整示例

### 示例 1：JSON 存储 - 用户偏好管理

```python
from src.app.plugin_system.api.storage_api import (
    save_json,
    load_json,
    exists_json,
)

class UserPreferenceService(BaseService):
    name = "user_preference"
    
    async def get_preference(self, user_id: str) -> dict:
        """获取用户偏好"""
        prefs = await load_json(
            store_name="my_plugin",
            name=f"user_{user_id}",
        )
        
        if not prefs:
            # 返回默认偏好
            return {
                "theme": "light",
                "language": "zh-CN",
                "notifications": True,
            }
        
       return prefs
    
    async def set_preference(self, user_id: str, prefs: dict):
        """设置用户偏好"""
        await save_json(
            store_name="my_plugin",
            name=f"user_{user_id}",
            data=prefs,
        )
    
    async def has_preference(self, user_id: str) -> bool:
        """检查用户是否有自定义偏好"""
        return await exists_json(
            store_name="my_plugin",
            name=f"user_{user_id}",
        )
```

### 示例 2：数据库存储 - 完整 CRUD

```python
from src.app.plugin_system.api.storage_api import PluginDatabase
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Text, DateTime
from datetime import datetime

Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class TaskManager(BaseService):
    name = "task_manager"
    
    async def initialize(self):
        """初始化数据库"""
        self.db = PluginDatabase("data/my_plugin/tasks.db", [Task])
        await self.db.initialize()
    
    async def create_task(self, title: str, description: str = "") -> Task:
        """创建任务"""
        task = await self.db.crud(Task).create({
            "title": title,
            "description": description,
            "status": "pending",
        })
        return task
    
    async def get_task(self, task_id: int) -> Task | None:
        """获取任务"""
        return await self.db.crud(Task).get(id=task_id)
    
    async def list_tasks(self, status: str = None) -> list[Task]:
        """列出任务"""
        query = self.db.query(Task)
        
        if status:
            query = query.filter(status=status)
        
        return await query.order_by("created_at", desc=True).all()
    
    async def update_task(self, task_id: int, **updates) -> Task | None:
        """更新任务"""
        return await self.db.crud(Task).update(id=task_id, data=updates)
    
    async def delete_task(self, task_id: int) -> bool:
        """删除任务"""
        return await self.db.crud(Task).delete(id=task_id)
    
    async def count_tasks(self) -> dict[str, int]:
        """统计任务数量"""
        results = await self.db.aggregate(Task).group_by_count("status")
        return {r["status"]: r["count"] for r in results}
    
    async def cleanup(self):
        """清理资源"""
        await self.db.close()
```

### 示例 3：混合使用两种存储

```python
from src.app.plugin_system.api.storage_api import (
    save_json,
    load_json,
    PluginDatabase,
)

class DataService(BaseService):
    name = "data"
    
    async def initialize(self):
        """初始化存储"""
        # JSON 存储用于配置和缓存
        self.store_name = "my_plugin"
        
        # 数据库存储用于结构化数据
        self.db = PluginDatabase("data/my_plugin/data.db", [MyModel])
        await self.db.initialize()
    
    async def save_cache(self, key: str, data: dict):
        """保存缓存到 JSON"""
        await save_json(self.store_name, f"cache_{key}", data)
    
    async def get_cache(self, key: str) -> dict | None:
        """从 JSON 获取缓存"""
        return await load_json(self.store_name, f"cache_{key}")
    
    async def save_record(self, data: dict):
        """保存记录到数据库"""
        return await self.db.crud(MyModel).create(data)
    
    async def query_records(self, **filters):
        """查询数据库记录"""
        query = self.db.query(MyModel)
        
        for key, value in filters.items():
            query = query.filter(**{key: value})
        
        return await query.all()
```

### 示例 4：数据迁移

```python
from src.app.plugin_system.api.storage_api import (
    list_json,
    load_json,
    PluginDatabase,
)

class DataMigration:
    """将 JSON 数据迁移到数据库"""
    
    async def migrate(self):
        # 1. 列出所有 JSON 数据
        keys = await list_json("my_plugin")
        
        # 2. 初始化数据库
        db = PluginDatabase("data/my_plugin/data.db", [MyModel])
        await db.initialize()
        
        # 3. 迁移数据
        migrated = 0
        for key in keys:
            data = await load_json("my_plugin", key)
            if data:
                try:
                    await db.crud(MyModel).create(data)
                    migrated += 1
                except Exception as e:
                    print(f"迁移 {key} 失败: {e}")
        
        print(f"成功迁移 {migrated}/{len(keys)} 条记录")
        
        await db.close()
```

### 示例 5：复杂数据库操作

```python
from src.app.plugin_system.api.storage_api import PluginDatabase
from sqlalchemy import update, select, and_

class AdvancedDatabaseService(BaseService):
    name = "advanced_db"
    
    async def initialize(self):
        self.db = PluginDatabase("data/my_plugin/data.db", [MyModel])
        await self.db.initialize()
    
    async def batch_update(self, updates: list[tuple[int, dict]]):
        """批量更新"""
        async with self.db.session() as session:
            for record_id, data in updates:
                await session.execute(
                    update(MyModel)
                    .where(MyModel.id == record_id)
                    .values(**data)
                )
    
    async def complex_query(self):
        """复杂查询"""
        async with self.db.session() as session:
            result = await session.execute(
                select(MyModel)
                .where(and_(
                    MyModel.status == "active",
                    MyModel.score > 80,
                ))
                .order_by(MyModel.score.desc())
                .limit(10)
            )
            return result.scalars().all()
    
    async def atomic_increment(self, record_id: int, field: str, amount: int = 1):
        """原子递增"""
        async with self.db.session() as session:
            await session.execute(
                update(MyModel)
                .where(MyModel.id == record_id)
                .values(**{field: getattr(MyModel, field) + amount})
            )
```

## 存储方案选择

### JSON 存储适用场景：
- ✅ 配置文件
- ✅ 缓存数据
- ✅ 简单键值对
- ✅ 无需复杂查询

### 数据库存储适用场景：
- ✅ 结构化数据
- ✅ 需要复杂查询
- ✅ 需要关系和约束
- ✅ 大量数据

## 最佳实践

### 1. 使用插件名作为 store_name

```python
# ✅ 好的做法
await save_json("my_plugin", "settings", data)

# ❌ 不好的做法
await save_json("cache", "settings", data)  # 可能与其他插件冲突
```

### 2. 数据库路径使用插件专属目录

```python
# ✅ 好的做法
db = PluginDatabase("data/my_plugin/data.db", [MyModel])

# ❌ 不好的做法
db = PluginDatabase("data.db", [MyModel])  # 可能冲突
```

### 3. 及时关闭数据库

```python
class MyService(BaseService):
    async def cleanup(self):
        if hasattr(self, 'db'):
            await self.db.close()
```

## 相关文档

- [数据库 API](./database-api.md) — 主数据库 API
- [Service 组件](../components/service.md) — 在 Service 中使用存储
- [插件结构](../structure.md) — 数据文件组织
