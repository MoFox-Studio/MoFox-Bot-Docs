# 22. 存储框架：让插件既能存简单 KV，又能开自己的 SQLite

> **导读** 本章介绍 `plugin_system.api.storage_api`——插件作者的公共存储入口。它把两类截然不同的存储能力收拢到同一个模块：一是基于文件的 JSON 键值存储（`save_json` / `load_json` 等），二是基于 SQLite 的结构化数据库（`PluginDatabase`）。后者复用了主程序同一套 `CRUDBase` / `QueryBuilder` / `AggregateQuery` 接口，但永远走独立连接，和主数据库互不干扰。理解这一章，你才能真正给插件加上长期、稳定、可演进的持久化能力。

前面几章我们一直在讲“插件怎样和能力打交道”：

- 通过 `adapter_api` 调平台
- 接下来还会讲通过 `message_api` 查消息、通过 `send_api` 发消息

但所有这些能力都隐含一个前提：

> **插件本身得有地方存自己的状态。**

比如：

- 一个签到插件要存“每个用户上次签到时间”
- 一个群管插件要存“被警告过的人”
- 一个统计插件要存“每天的发言计数”
- 一个游戏插件要存“玩家的分数、库存、关卡进度”
- 一个简单的插件只想存“自己的开关状态”

这些需求看起来都是“存点东西”，但仔细看会发现它们对存储的要求完全不一样：

- 有的就是几个布尔值 / 几个字符串
- 有的需要按字段查询、按时间排序、按用户聚合
- 有的需要原子计数和并发安全的更新

如果只给一种存储方案，必然会出现要么“太轻”，要么“太重”的尴尬。

所以 `storage_api` 这一层的核心设计思路是：

> **给插件作者两套存储能力，按需求自己选。**

- 轻量、非结构化 → JSON 存储
- 结构化、需要查询和聚合 → `PluginDatabase`

这一章就带你把这两套能力都看明白。

## 22.1 先把一句话记住：`storage_api` 是两类存储的统一入口

第一次接触 `storage_api`，很多人会下意识以为它就是“一个数据库封装”。

这种理解其实漏掉了它最有价值的一层设计。

更准确的说法是：

> **`storage_api` 把“JSON 文件存储”和“SQLite 数据库存储”这两类完全不同的能力，收拢到同一个公共入口。**

也就是说，你从这一层导入，可以同时拿到两种工具：

```python
from src.app.plugin_system.api import storage_api
from src.app.plugin_system.api.storage_api import PluginDatabase
```

这两种工具背后没有“谁更高级”的关系，它们就是面向两种不同需求：

| 维度 | JSON 存储 | `PluginDatabase` |
|------|----------|-------------------|
| 底层 | 单个 JSON 文件 | SQLite + SQLAlchemy |
| 数据形态 | 一个 `dict` 一把梭 | 表、字段、关系 |
| 查询能力 | 没有查询，只能整体读 | filter / order_by / limit / 聚合 |
| 写入粒度 | 整文件覆盖写 | 单行 insert / update / delete |
| 适合数据量 | 小（几 KB ~ 几百 KB） | 中到大（几万行 ~ 几百万行） |
| 适合场景 | 配置、开关、缓存、小型 KV | 日志、计数、关系数据、需要查询的业务表 |
| 隔离方式 | 按 `store_name` 分目录 | 按文件路径完全独立 |

记住这张表，你后面遇到具体需求时，就不会出现“我用 SQLite 存一个布尔开关吧”或者“我用 JSON 存十万条聊天记录吧”这种选择错位。

## 22.2 这一层 API 的导入边界，先说清楚

按前面一直在遵循的入口原则：

```python
# 函数式 API（JSON 存储的 5 个函数）
from src.app.plugin_system.api import storage_api

# 类形式（PluginDatabase，需要自己实例化）
from src.app.plugin_system.api.storage_api import PluginDatabase
```

也就是说：

- JSON 存储是扁平函数风格——直接 `await storage_api.save_json(...)`
- `PluginDatabase` 是类风格——你需要自己 `PluginDatabase(path, models)`、`await db.initialize()`、用完 `await db.close()`

这两种风格并存，是因为它们的使用模式本来就不一样：JSON 存储是无状态的“存/取/删”，而 `PluginDatabase` 是有状态的“持有引擎和会话工厂的长期对象”。

## 22.3 先看 JSON 存储：最小可用版本

我们先从最轻的 JSON 存储开始。它的 API 表面非常小，只有 5 个函数：

| 函数 | 作用 |
|------|------|
| `save_json(store_name, name, data)` | 把 `data` 存到 `store_name` 命名空间的 `name` 文件 |
| `load_json(store_name, name)` | 从 `store_name` 命名空间读 `name` 文件，返回 `dict \| None` |
| `delete_json(store_name, name)` | 删除 `store_name` 命名空间下的 `name` 文件 |
| `exists_json(store_name, name)` | 检查 `store_name` 命名空间下 `name` 是否存在 |
| `list_json(store_name)` | 列出 `store_name` 命名空间下所有 `name`（不含 `.json` 后缀） |

这五个函数背后的物理布局是这样的：

```text
data/json_storage/
└── <store_name>/
    ├── <name_1>.json
    ├── <name_2>.json
    └── ...
```

也就是说，`store_name` 是命名空间（通常用插件名），`name` 是这个命名空间下某一个具体的键。不同 `store_name` 互不干扰，这一点对你写多插件项目很重要——别人插件的 JSON 文件不会和你的混在一起。

一个最小的真实用法，给插件存一个开关：

```python
from src.app.plugin_system.api import storage_api


SWITCH_KEY = "feature_enabled"


async def is_feature_enabled() -> bool:
    """读插件开关，默认 False。"""
    data = await storage_api.load_json("my_plugin", "settings")
    if not isinstance(data, dict):
        return False
    return bool(data.get("enabled", False))


async def set_feature_enabled(value: bool) -> None:
    """更新插件开关。"""
    data = await storage_api.load_json("my_plugin", "settings") or {}
    data["enabled"] = value
    await storage_api.save_json("my_plugin", "settings", data)
```

这个例子很轻，但它已经把 JSON 存储最典型的使用模式讲清楚了：

- 用插件名当 `store_name`
- 用语义名当 `name`（这里是 `"settings"`）
- 读出来后判断类型再使用
- 写之前先读出来合并，避免覆盖掉别的字段

这里有一件值得专门记的事：

> **JSON 存储是整文件覆盖写，不支持字段级更新。**

也就是说，如果你的 `settings.json` 里有 10 个字段，你想改其中一个，必须像上面那样先 `load_json` 再合并再 `save_json`。直接 `save_json` 会把整个文件覆盖掉。

这也是为什么 JSON 存储只适合数据量小的场景——一旦数据大了，每次读 + 写整文件的开销会变得不可接受。

## 22.4 `store_name` 怎么取，是一个值得讲究的事

这一节虽然短，但很实用。

`store_name` 决定了你的 JSON 文件存在哪个子目录。它不是随便填的字符串，而是一个“命名空间隔离”的概念。

推荐的取法：

| 情况 | `store_name` 推荐值 | 文件路径 |
|------|--------------------|---------|
| 单插件单用途 | `"<plugin_name>"` | `data/json_storage/<plugin_name>/` |
| 单插件多用途 | `"<plugin_name>_<purpose>"` | `data/json_storage/<plugin_name>_<purpose>/` |
| 跨插件共享（少见） | `"shared_<feature>"` | `data/json_storage/shared_<feature>/` |

最稳妥的做法永远是第一种：**用插件名当 `store_name`**。

这样你的插件被卸载、重装、迁移时，整个 `data/json_storage/<plugin_name>/` 目录可以作为一个整体被处理，不会和其他插件纠缠在一起。

## 22.5 现在看 `PluginDatabase`：另一类完全不同的存储

JSON 存储讲完，我们来看 `PluginDatabase`。

它和 JSON 存储完全是另一回事：

> **`PluginDatabase` 是一个完全独立的 SQLite 数据库，使用 SQLAlchemy 模型，和主程序数据库不共享任何连接。**

它解决的问题是“插件有结构化、需要查询的数据，但又不想侵入主数据库”。

`PluginDatabase` 的核心特征：

1. **永远走 SQLite**，不需要你配置数据库连接字符串
2. **文件路径完全由你指定**，比如 `data/my_plugin/records.db`
3. **和主数据库隔离**——主库是 PostgreSQL / SQLite 都不影响插件库
4. **使用和主库完全相同的接口**（`CRUDBase` / `QueryBuilder` / `AggregateQuery`）
5. **初始化时自动建表**，不用手写迁移脚本
6. **自动应用 SQLite 性能优化**（WAL 模式、`synchronous=NORMAL`、`foreign_keys=ON`、`busy_timeout=10000`）

也就是说，你只需要：

- 定义 SQLAlchemy 模型
- 指定一个 `.db` 文件路径
- 调 `await db.initialize()`

就能拥有一个完整、隔离、可查询、可聚合的插件私有数据库。

## 22.6 一个最小的 `PluginDatabase` 例子

我们先从最小的可用版本开始。假设你写一个 `sign_in` 插件，想记录每个用户的签到时间。

第一步，定义模型：

```python
# sign_in/models.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, Integer, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """插件自己的模型基类。"""


class SignInRecord(Base):
    """一次签到记录。"""

    __tablename__ = "sign_in_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    person_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    stream_id: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    last_signed_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    extra: Mapped[dict[str, Any] | None] = mapped_column(Text, nullable=True)
```

第二步，在你的插件里创建并初始化 `PluginDatabase`：

```python
# sign_in/plugin.py
from __future__ import annotations

from src.app.plugin_system.api.storage_api import PluginDatabase
from src.app.plugin_system.base import BasePlugin, register_plugin

from .models import Base, SignInRecord


@register_plugin
class SignInPlugin(BasePlugin):
    plugin_name = "sign_in"
    plugin_version = "1.0.0"
    plugin_description = "签到演示插件，演示 PluginDatabase"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        # 1. 创建数据库实例（传入路径和模型列表）
        self.db: PluginDatabase = PluginDatabase(
            db_path="data/sign_in/sign_in.db",
            models=[SignInRecord],
        )

    async def on_plugin_loaded(self) -> None:
        # 2. 必须先 initialize，否则后续操作会抛 RuntimeError
        await self.db.initialize()

    async def on_plugin_unloaded(self) -> None:
        # 3. 插件卸载时关闭引擎，释放连接
        await self.db.close()
```

这个骨架很重要的一点是：

> **`PluginDatabase` 的生命周期和插件绑定。**

也就是说：

- `__init__` 里创建实例（不创建引擎）
- `on_plugin_loaded` 里 `await db.initialize()`（这时才真正建引擎和建表）
- `on_plugin_unloaded` 里 `await db.close()`（释放引擎）

如果你忘了 `initialize()`，后面任何 `crud / query / aggregate / session` 调用都会抛 `RuntimeError: PluginDatabase(...) 尚未初始化`。

这是新手最常踩的坑之一，记牢它。

## 22.7 用 `crud` / `query` / `aggregate` 三套接口

`PluginDatabase` 初始化好以后，你就有三套现成的接口可用。这三套接口和主程序数据库用的是同一套实现，只是绑定到了你插件的独立引擎上。

### `db.crud(model)`：基础增删改查

`CRUDBase` 提供按主键和按字段的单条 / 多条操作，适合“一次针对一行”的场景：

```python
crud = self.db.crud(SignInRecord)

# 创建一行
record = await crud.create({
    "person_id": "qq_123456",
    "stream_id": "qq_group_100",
    "streak_days": 1,
})

# 按主键读
record = await crud.get(42)

# 按字段读单条
record = await crud.get_by(person_id="qq_123456", stream_id="qq_group_100")

# 按主键更新
record = await crud.update(42, {"streak_days": 7})

# 按主键删除
ok = await crud.delete(42)

# 计数 / 存在性
n = await crud.count(stream_id="qq_group_100")
exists = await crud.exists(person_id="qq_123456")

# 不存在则创建
record, created = await crud.get_or_create(
    defaults={"streak_days": 1, "last_signed_at": now},
    person_id="qq_123456",
    stream_id="qq_group_100",
)

# 批量
created = await crud.bulk_create([
    {"person_id": "u1", "stream_id": "g1", "streak_days": 1},
    {"person_id": "u2", "stream_id": "g1", "streak_days": 1},
])
await crud.bulk_update([{"id": 1, "streak_days": 5}, {"id": 2, "streak_days": 6}])
```

`CRUDBase` 完整方法表：

| 方法 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `get(id)` | 按主键 | `T \| None` | 单条读取，命中进程内读缓存 |
| `get_by(**filters)` | 按字段相等 | `T \| None` | 单条读取 |
| `get_multi(skip=0, limit=100, **filters)` | 分页 + 过滤 | `list[T]` | 多条读取 |
| `create(obj_in: dict)` | 插入 | `T` | 创建一行 |
| `update(id, obj_in: dict)` | 按主键更新 | `T \| None` | 更新一行 |
| `delete(id)` | 按主键删除 | `bool` | 是否成功删除 |
| `count(**filters)` | 计数 | `int` | 按字段过滤计数 |
| `exists(**filters)` | 存在性 | `bool` | 是否存在 |
| `get_or_create(defaults=..., **filters)` | 不存在则创建 | `tuple[T, bool]` | `(实例, 是否新建)` |
| `bulk_create(objs_in: list[dict])` | 批量插入 | `list[T]` | 批量创建 |
| `bulk_update(objs_in: list[dict])` | 批量更新 | `None` | 批量按主键更新 |

### `db.query(model)`：链式查询

`QueryBuilder` 提供更灵活的链式查询，适合“需要排序、过滤、分页、迭代”的场景：

```python
from src.app.plugin_system.api.storage_api import PluginDatabase
# QueryBuilder 也可以直接从 kernel.db 拿，但通过 PluginDatabase 拿到的实例已经绑到你的引擎

query = self.db.query(SignInRecord)

# 链式过滤 + 排序 + 限制
recent = await (
    query
    .filter(stream_id="qq_group_100", streak_days__gte=3)
    .order_by("-last_signed_at")
    .limit(10)
    .all(as_dict=True)
)

# 计数
total = await (
    self.db.query(SignInRecord)
    .filter(stream_id="qq_group_100")
    .count()
)

# 是否存在
has_any = await (
    self.db.query(SignInRecord)
    .filter(person_id="qq_123456")
    .exists()
)

# 分批迭代（大数据量不爆内存）
async for batch in (
    self.db.query(SignInRecord)
    .filter(stream_id="qq_group_100")
    .iter_batches(batch_size=500, as_dict=True)
):
    for row in batch:
        ...

# 分页
page, total = await (
    self.db.query(SignInRecord)
    .filter(stream_id="qq_group_100")
    .order_by("-last_signed_at")
    .paginate(page=1, page_size=20)
)
```

`QueryBuilder` 支持的过滤操作符（在 `filter(**conditions)` 里用 `field__op=value` 形式）：

| 操作符 | 含义 | 示例 |
|--------|------|------|
| `eq`（或不带后缀） | 等于 | `field=value` |
| `gt` | 大于 | `time__gt=start` |
| `lt` | 小于 | `time__lt=end` |
| `gte` | 大于等于 | `streak_days__gte=3` |
| `lte` | 小于等于 | `streak_days__lte=10` |
| `ne` | 不等于 | `role__ne="member"` |
| `in` | 在列表中 | `person_id__in=[...]` |
| `nin` | 不在列表中 | `person_id__nin=[...]` |
| `like` | 模糊匹配 | `name__like="%关键词%"` |
| `isnull` | 是否为空 | `extra__isnull=True` |

另外还有 `filter_or(**conditions)`（OR 条件）和 `offset(n)`（跳过 n 条）。

`QueryBuilder` 完整方法表：

| 方法 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `filter(**conditions)` | 过滤 | `Self` | 链式，支持操作符后缀 |
| `filter_or(**conditions)` | OR 过滤 | `Self` | 任一条件满足 |
| `order_by(*fields)` | 排序 | `Self` | `-` 前缀表示降序 |
| `limit(n)` | 限制数量 | `Self` | 最多取 n 条 |
| `offset(n)` | 跳过 n 条 | `Self` | 分页用 |
| `iter_batches(batch_size, as_dict=)` | 分批迭代 | `AsyncIterator[list]` | 内存友好 |
| `iter_all(as_dict=)` | 单条迭代 | `AsyncIterator[T \| dict]` | 内存友好 |
| `all(as_dict=)` | 取全部 | `list[T] \| list[dict]` | 一次性返回 |
| `first(as_dict=)` | 取第一条 | `T \| dict \| None` | 等价 limit(1).all()[0] |
| `count()` | 计数 | `int` | 满足条件的总数 |
| `exists()` | 存在性 | `bool` | 是否有任何匹配 |
| `paginate(page, page_size)` | 分页 | `tuple[list, int]` | `(当前页数据, 总数)` |

### `db.aggregate(model)`：聚合查询

`AggregateQuery` 提供统计聚合能力，适合“算总数、平均值、最大最小、分组计数”的场景：

```python
agg = self.db.aggregate(SignInRecord)

# 求和
total_streak = await agg.filter(stream_id="qq_group_100").sum("streak_days")

# 平均值
avg_streak = await agg.filter(stream_id="qq_group_100").avg("streak_days")

# 最大 / 最小
max_streak = await agg.filter(stream_id="qq_group_100").max("streak_days")
min_streak = await agg.filter(stream_id="qq_group_100").min("streak_days")

# 分组计数：每个 stream 各有多少签到记录
groups = await agg.group_by_count("stream_id")
# 返回 [("qq_group_100", 42), ("qq_group_200", 18), ...]
```

`AggregateQuery` 完整方法表：

| 方法 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `filter(**conditions)` | 过滤（仅相等） | `Self` | 链式 |
| `sum(field)` | 求和 | `float` | 指定字段求和 |
| `avg(field)` | 平均值 | `float` | 指定字段取平均 |
| `max(field)` | 最大值 | `Any` | 指定字段最大值 |
| `min(field)` | 最小值 | `Any` | 指定字段最小值 |
| `group_by_count(*fields)` | 分组计数 | `list[tuple]` | 返回 `[(分组值, ..., 数量), ...]` |

## 22.8 什么时候要直接用 `db.session()`

三套接口已经覆盖了绝大多数场景，但有些操作它们表达不了：

- 原子计数更新（比如 `UPDATE ... SET counter = counter + 1`）
- 复杂 JOIN
- UPSERT（不存在则插入，存在则更新）
- 跨表事务

这时候你要直接操作底层 `AsyncSession`，用 `db.session()` 这个上下文管理器：

```python
from sqlalchemy import update


async def increment_streak(self, person_id: str, stream_id: str) -> None:
    """原子地给某人的连续签到天数 +1。"""
    async with self.db.session() as s:
        await s.execute(
            update(SignInRecord)
            .where(
                SignInRecord.person_id == person_id,
                SignInRecord.stream_id == stream_id,
            )
            .values(streak_days=SignInRecord.streak_days + 1)
        )
    # 退出 with 块时自动 commit；异常时自动 rollback
```

`db.session()` 的语义是：

> **进入时获取 session，正常退出时 commit，异常退出时 rollback。**

所以你不用自己写 try/except/commit/rollback，只要把所有写操作放在 `async with` 块里就行。

这里有一个很容易踩的坑：

> **如果你用了 `db.session()` 做了原始 SQL 写入，记得调 `db.invalidate(model)` 让该模型的进程内读缓存失效。**

否则 `CRUDBase.get` / `QueryBuilder.all` 这些方法可能读到旧缓存。例子：

```python
async with self.db.session() as s:
    await s.execute(update(SignInRecord).where(...).values(...))

# 让读缓存失效，避免读到旧数据
self.db.invalidate(SignInRecord)
```

## 22.9 一个完整一点的真实例子：签到逻辑

把前面所有片段串起来，看一个完整的签到业务：

```python
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from src.app.plugin_system.api import message_api
from src.app.plugin_system.api.storage_api import PluginDatabase
from src.app.plugin_system.base import BaseCommand, BasePlugin, cmd_route, register_plugin

from .models import Base, SignInRecord


class SignInCommand(BaseCommand):
    """签到命令：/sign"""

    @cmd_route("sign", alias=["签到"])
    async def handle_sign(self, ctx) -> None:
        now = datetime.now(timezone.utc)
        plugin: "SignInPlugin" = self.plugin  # type: ignore[assignment]
        db = plugin.db

        # 1. 查这条 stream 上当前用户的签到记录
        record = await (
            db.query(SignInRecord)
            .filter(person_id=ctx.person_id, stream_id=ctx.stream_id)
            .first(as_dict=True)
        )

        # 2. 已经签过今天？
        if record and self._is_today(record["last_signed_at"], now):
            await ctx.reply("你今天已经签过到了～")
            return

        # 3. 不存在则创建，存在则原子 +1
        if record is None:
            await db.crud(SignInRecord).create({
                "person_id": ctx.person_id,
                "stream_id": ctx.stream_id,
                "last_signed_at": now,
                "streak_days": 1,
            })
            streak = 1
        else:
            # 判断连续：上次签到是否在昨天前 24h 内
            yesterday = now - timedelta(days=1)
            is_streak = record["last_signed_at"] >= yesterday.replace(hour=0, minute=0)
            new_streak = record["streak_days"] + 1 if is_streak else 1

            async with db.session() as s:
                await s.execute(
                    update(SignInRecord)
                    .where(
                        SignInRecord.person_id == ctx.person_id,
                        SignInRecord.stream_id == ctx.stream_id,
                    )
                    .values(last_signed_at=now, streak_days=new_streak)
                )
            db.invalidate(SignInRecord)
            streak = new_streak

        # 4. 顺手用 message_api 拉最近发言数做个彩蛋
        recent = await message_api.get_recent_messages(
            stream_id=ctx.stream_id, hours=24, limit=200, filter_bot=True
        )
        await ctx.reply(f"签到成功！连续第 {streak} 天，最近 24h 你群发了 {len(recent)} 条消息。")

    @staticmethod
    def _is_today(ts: datetime, now: datetime) -> bool:
        return ts.date() == now.date()


@register_plugin
class SignInPlugin(BasePlugin):
    plugin_name = "sign_in"
    plugin_version = "1.0.0"
    plugin_description = "签到演示插件，完整演示 PluginDatabase 用法"

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.db: PluginDatabase = PluginDatabase(
            db_path="data/sign_in/sign_in.db",
            models=[SignInRecord],
        )

    def get_components(self) -> list[type]:
        return [SignInCommand]

    async def on_plugin_loaded(self) -> None:
        await self.db.initialize()

    async def on_plugin_unloaded(self) -> None:
        await self.db.close()
```

这个例子把本章关键点几乎都串了一遍：

- 在 `__init__` 创建 `PluginDatabase`
- 在 `on_plugin_loaded` 调 `initialize()`
- 用 `query().filter().first()` 单条查询
- 用 `crud().create()` 创建
- 用 `session()` + 原生 `update` 做原子计数
- 用 `invalidate()` 让缓存失效
- 在 `on_plugin_unloaded` 调 `close()` 释放资源
- 还顺手和下一章要讲的 `message_api` 联动了一下

把它读懂，你就基本掌握了 `PluginDatabase` 的真实用法。

## 22.10 JSON 存储和 `PluginDatabase`，到底什么时候用哪个

这是这一章边界最值得收的一刀。下面这张决策表可以直接照着选：

| 你的需求 | 推荐 |
|---------|------|
| 存一个布尔开关 | JSON |
| 存几组用户偏好（主题、语言） | JSON |
| 存一段 prompt 缓存 | JSON |
| 存某次外部 API 调用的原始 JSON 响应做缓存 | JSON |
| 存一个不超过 1000 条的简单列表，但要按字段查 | `PluginDatabase` |
| 存用户签到记录，要按时间排序、按用户聚合 | `PluginDatabase` |
| 存每天发言计数，需要按天 / 按群统计 | `PluginDatabase` |
| 存游戏分数、库存、关卡进度 | `PluginDatabase` |
| 存警告记录，要按用户查、按时间分页 | `PluginDatabase` |
| 存百万级日志，需要分批迭代 | `PluginDatabase` |
| 需要原子计数 / 事务 | `PluginDatabase` |
| 数据量未知，可能很大 | `PluginDatabase` |
| 数据量确定小，且只是给一个布尔 / 字符串 | JSON |

简而言之，可以用一句话概括：

> **能 JSON 解决的，别上 SQLite；需要查询、聚合、原子更新的，别用 JSON。**

## 22.11 这里最容易踩的几个坑

### 坑一：忘了 `await db.initialize()`

`PluginDatabase` 的 `__init__` 不会创建引擎。如果你忘了在 `on_plugin_loaded` 里调 `initialize()`，后续任何 `crud` / `query` / `aggregate` / `session` 都会抛 `RuntimeError: PluginDatabase(...) 尚未初始化`。

### 坑二：把 `PluginDatabase` 当成全局单例

`PluginDatabase` 不是单例。每个实例都持有自己的引擎和会话工厂。

如果你在多个地方分别 `PluginDatabase("data/x.db", [...])`，会创建多个引擎连同一个 `.db` 文件，虽然 SQLite 允许，但会浪费资源、增加锁竞争。

推荐做法：**把 `db` 实例作为插件实例属性持有**（就像上面例子里的 `self.db`），其他组件通过 `self.plugin.db` 拿到它。

### 坑三：路径随便放

`PluginDatabase` 不强制你把文件放哪，但请遵循约定：

```text
data/<plugin_name>/<plugin_name>.db
```

也就是放在 `data/` 下、用插件名建子目录。这样卸载插件、迁移数据时路径清晰，也避免和别的插件文件撞车。

### 坑四：JSON 存储当数据库用

不要用 JSON 存储存几百、几千条记录再每次循环遍历。每次读写都是整文件 IO，量大了会非常慢，而且没有任何过滤能力。

### 坑五：忘了 `invalidate`

`CRUDBase` 和 `QueryBuilder` 有进程内读缓存（提升主程序读性能用的）。当你用 `db.session()` 做了绕过 ORM 的原始写入（`UPDATE` / `INSERT` / `DELETE` 原生 SQL），缓存不会自动失效。

如果你之后立刻读，会读到旧值。解决：每次原始写入后调一次 `db.invalidate(model)`。

### 坑六：在 `__init__` 里就调 `await db.initialize()`

`__init__` 不能是 `async`，所以你没法在 `__init__` 里调 `initialize()`。但即使能，也不建议——`__init__` 阶段 SinkManager、引擎等基础设施可能还没完全就绪。

记住顺序：

1. `__init__` 只创建实例（不连库）
2. `on_plugin_loaded` 才 `initialize()`

## 22.12 一个补充：`storage_api` 里其实还导出了 `JSONStore`

如果你不想用 `save_json` 这种函数式 API，而想自己持有一个 `JSONStore` 实例（比如想要自定义存储目录），`storage_api` 也允许你直接拿到类：

```python
from src.kernel.storage import JSONStore

# 自定义存储目录
my_store = JSONStore("data/my_plugin/state")
await my_store.save("k1", {"a": 1})
data = await my_store.load("k1")
```

但绝大多数情况下，你不需要这么做。`storage_api.save_json` 等函数已经把命名空间隔离、路径约定、单例缓存都处理好了，直接用就行。

只有当你真的需要“特殊路径”或“完全独立的 store 实例”时，才需要下钻到 `JSONStore` 类自己实例化。

## 22.13 `storage_api` 速查

`storage_api` 定义于 `src/app/plugin_system/api/storage_api.py`。

### JSON 存储函数

| 函数 | 签名 | 返回 | 说明 |
|------|------|------|------|
| `save_json` | `(store_name, name, data: dict)` 异步 | `None` | 保存到 `data/json_storage/<store_name>/<name>.json` |
| `load_json` | `(store_name, name)` 异步 | `dict \| None` | 读取，键不存在返回 `None` |
| `delete_json` | `(store_name, name)` 异步 | `bool` | 是否删除成功 |
| `exists_json` | `(store_name, name)` 异步 | `bool` | 是否存在 |
| `list_json` | `(store_name)` 异步 | `list[str]` | 该命名空间下所有键名（不含后缀） |

### `PluginDatabase` 类

构造与方法：

| 方法 | 签名要点 | 返回 | 说明 |
|------|---------|------|------|
| `__init__` | `(db_path: str, models: list[type])` | `None` | 创建实例，不建引擎 |
| `initialize` | `()` 异步 | `None` | 建引擎 + 建 SQLite pragma + 建表（幂等） |
| `crud` | `(model)` | `CRUDBase[T]` | 绑定本库的 CRUD 接口 |
| `query` | `(model)` | `QueryBuilder[T]` | 绑定本库的链式查询 |
| `aggregate` | `(model)` | `AggregateQuery` | 绑定本库的聚合查询 |
| `invalidate` | `(model)` | `None` | 让该模型的进程内读缓存失效 |
| `session` | `()` 异步上下文 | `AsyncSession` | 拿到原始 session，自动 commit / rollback |
| `close` | `()` 异步 | `None` | 关闭引擎，释放所有连接资源 |

### 内部自动应用的 SQLite pragma

`initialize()` 会对每个 `PluginDatabase` 自动执行：

| PRAGMA | 值 | 作用 |
|--------|------|------|
| `journal_mode` | `WAL` | 写入不阻塞读取，提升并发 |
| `synchronous` | `NORMAL` | WAL 模式下的推荐值，兼顾安全和性能 |
| `foreign_keys` | `ON` | 启用外键约束 |
| `busy_timeout` | `10000` (ms) | 锁等待 10 秒，减少 `database is locked` |

你不用自己写 PRAGMA，但你应该知道有这层优化。

## 22.14 这一章先收在这里

如果把这一章压成最后几句话，我最希望你记住的是：

1. **`storage_api` 是两类存储的统一入口**——JSON 存储和 `PluginDatabase`，没有“谁更高级”，按需求选。
2. **JSON 存储是整文件覆盖写**，适合小数据、无查询、无原子更新的场景；按 `store_name` 自动分目录隔离。
3. **`PluginDatabase` 是完全独立的 SQLite**，使用和主库相同的 `CRUDBase` / `QueryBuilder` / `AggregateQuery` 接口，但永远走自己的连接和文件。
4. **`PluginDatabase` 的生命周期是“`__init__` 创建实例 → `on_plugin_loaded` 调 `initialize()` → `on_plugin_unloaded` 调 `close()`”**，跳过 `initialize()` 会直接抛 `RuntimeError`。
5. **三套接口分工**：`crud` 做单行 CRUD，`query` 做链式过滤/排序/分页，`aggregate` 做统计聚合；只有需要原子操作、JOIN、UPSERT 时才下钻到 `db.session()`。
6. **能用 JSON 解决的别上 SQLite，需要查询、聚合、原子更新的别用 JSON。**

到这里为止，你已经能给插件加上完整的持久化能力了。下一章我们换一个方向，看插件系统里另一组非常常用的公共能力：

> **消息 API——`message_api` 怎样查历史消息，`send_api` 怎样把消息真正发出去。**
