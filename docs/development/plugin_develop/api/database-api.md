# 数据库 API

`src/app/plugin_system/api/database_api` 提供 `CRUDBase / QueryBuilder / AggregateQuery` 的扁平化封装。

## 导入

```python
from src.app.plugin_system.api.database_api import (
    # CRUD
    get_by_id,
    get_by,
    get_multi,
    create,
    update,
    delete,
    count,
    exists,
    get_or_create,
    bulk_create,
    bulk_update,
    # QueryBuilder
    query,
    filter_query,
    filter_query_first,
    filter_query_count,
    # Aggregate
    aggregate,
    sum_field,
    avg_field,
    max_field,
    min_field,
    group_by_count,
    # Iterator / Pagination
    iter_batches,
    iter_all,
    paginate,
)
```

## CRUD

```python
item = await get_by_id(MyModel, 1)
item = await get_by(MyModel, key="k1")
items = await get_multi(MyModel, skip=0, limit=20, status="active")

created = await create(MyModel, {"name": "A"})
updated = await update(MyModel, created.id, {"name": "B"})
ok = await delete(MyModel, created.id)

total = await count(MyModel, status="active")
has_any = await exists(MyModel, key="k1")

obj, is_created = await get_or_create(
    MyModel,
    defaults={"status": "new"},
    key="k1",
)

batch = await bulk_create(MyModel, [{"name": "A"}, {"name": "B"}])
changed = await bulk_update(
    MyModel,
    [(1, {"name": "A1"}), (2, {"name": "B1"})],
)
```

## QueryBuilder 扁平入口

```python
rows = await query(MyModel).filter(status="active").order_by("-id").limit(50).all()
rows = await filter_query(MyModel, status="active", score__gt=10)
first = await filter_query_first(MyModel, key="k1")
amount = await filter_query_count(MyModel, status="active")
```

## 聚合查询

```python
agg = aggregate(MyModel)

total_amount = await sum_field(MyModel, "amount", status="paid")
avg_score = await avg_field(MyModel, "score", status="active")
max_score = await max_field(MyModel, "score")
min_score = await min_field(MyModel, "score")

# 返回形如 [(group_key1, group_key2, ..., count), ...]
groups = await group_by_count(MyModel, "platform", "status")
```

## 迭代与分页

```python
# 分批遍历（每批 list[T]）
async for batch in iter_batches(MyModel, batch_size=500, status="active"):
    for row in batch:
        ...

# 逐条遍历（T）
async for row in iter_all(MyModel, batch_size=500, status="active"):
    ...

# 分页
rows, total = await paginate(MyModel, page=1, page_size=20, status="active")
```

## 过滤操作符

常用条件写法：

- `field=value`
- `field__gt=...`
- `field__gte=...`
- `field__lt=...`
- `field__lte=...`
- `field__in=[...]`
- `field__contains="..."`
- `field__startswith="..."`
