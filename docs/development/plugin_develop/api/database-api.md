# Database API

`src.app.plugin_system.api.database_api` 提供扁平化的数据库操作接口，封装了 CRUD、查询构建器、聚合查询、分页和批量迭代。

所有数据库操作均为**异步函数**，调用时需 `await`。

## 导入

```python
from src.app.plugin_system.api.database_api import (
    # CRUD
    get_by_id, get_by, get_multi, create, update, delete,
    count, exists, get_or_create, bulk_create, bulk_update,
    # 查询构建器
    query, filter_query, filter_query_first, filter_query_count,
    # 聚合
    aggregate, sum_field, avg_field, max_field, min_field, group_by_count,
    # 迭代器
    iter_batches, iter_all,
    # 分页
    paginate,
)
```

## CRUD 操作

| 函数 | 说明 |
|------|------|
| `get_by_id(model, id) -> T \| None` | 按 ID 获取 |
| `get_by(model, **filters) -> T \| None` | 按条件获取单条 |
| `get_multi(model, skip=0, limit=100, **filters) -> list[T]` | 获取多条 |
| `create(model, obj_in: dict) -> T` | 创建记录 |
| `update(model, id, obj_in: dict) -> T \| None` | 更新记录 |
| `delete(model, id) -> bool` | 删除记录 |
| `count(model, **filters) -> int` | 统计数量 |
| `exists(model, **filters) -> bool` | 检查存在 |
| `get_or_create(model, defaults=None, **filters) -> tuple[T, bool]` | 获取或创建 |
| `bulk_create(model, objs_in: list[dict]) -> list[T]` | 批量创建 |
| `bulk_update(model, updates: list[tuple[int, dict]]) -> int` | 批量更新，`updates` 为 `(id, update_data)` 元组列表 |

```python
user = await get_by_id(UserModel, 1)
users = await get_multi(UserModel, skip=0, limit=50, status="active")
count = await count(UserModel, status="active")
```

## 查询构建器

| 函数 | 说明 |
|------|------|
| `query(model) -> QueryBuilder[T]` | 创建查询构建器（支持链式调用） |
| `filter_query(model, **conditions) -> list[T]` | 快速过滤查询，支持操作符（如 `field__gt=5`、`field__in=[1,2]`） |
| `filter_query_first(model, **conditions) -> T \| None` | 快速过滤取第一条 |
| `filter_query_count(model, **conditions) -> int` | 快速过滤统计 |

```python
# 链式查询
results = await query(UserModel).filter(age__gt=18).order_by("name").all()

# 快速过滤
users = await filter_query(UserModel, status="active", role__in=["admin", "mod"])
```

## 聚合查询

| 函数 | 说明 |
|------|------|
| `aggregate(model) -> AggregateQuery` | 创建聚合查询 |
| `sum_field(model, field, **filters) -> float` | 求和 |
| `avg_field(model, field, **filters) -> float` | 求平均 |
| `max_field(model, field, **filters) -> Any` | 最大值 |
| `min_field(model, field, **filters) -> Any` | 最小值 |
| `group_by_count(model, *fields, **filters) -> list[tuple]` | 分组统计，返回 `[(分组值1, 分组值2, ..., 数量), ...]` |

## 迭代器（内存优化）

| 函数 | 说明 |
|------|------|
| `iter_batches(model, batch_size=1000, **conditions) -> AsyncIterator[list[T]]` | 分批迭代 |
| `iter_all(model, batch_size=1000, **conditions) -> AsyncIterator[T]` | 逐条迭代 |

```python
async for batch in iter_batches(LogModel, batch_size=500, level="ERROR"):
    for log in batch:
        process(log)
```

## 分页

`paginate(model, page=1, page_size=20, **conditions) -> tuple[list[T], int]`

返回 `(结果列表, 总数量)`。`page` 从 1 开始。

```python
items, total = await paginate(UserModel, page=1, page_size=20)
```

## 相关文档

- [Storage API](./storage-api.md)
