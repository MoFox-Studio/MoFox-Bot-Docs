# 日程与月度计划查询API

本API模块提供了一系列用于查询日程和月度计划的 **只读** 接口，帮助插件与MoFox-Bot的日程系统进行交互。API经过重构，专注于提供灵活的数据查询能力。

## 导入方式

```python
from src.plugin_system import schedule_api
# 或者
from src.plugin_system.apis import schedule_api
```

## 主要功能

所有对外接口均为异步函数，请在插件的异步环境中使用 `await` 进行调用。

### 1. 获取日程安排

替代了旧的 `get_today_schedule()`，功能更强大。

```python
async def get_schedule(
    date: Optional[str] = None,
    formatted: bool = False,
    format_template: str = "{time_range}: {activity}"
) -> Union[List[Dict[str, Any]], str, None]:
```

**Args**:
- `date` (Optional[str]): 目标日期，格式为 `"YYYY-MM-DD"`。如果省略，则默认为 **今天**。
- `formatted` (bool): 若为 `True`，则返回根据模板格式化的字符串。默认为 `False`，返回原始数据列表。
- `format_template` (str): `formatted` 为 `True` 时使用的格式化模板。

**Returns**:
- `Union[List[Dict[str, Any]], str, None]`: 日程数据列表、格式化字符串或 `None`。

### 2. 获取当前活动

```python
async def get_current_activity(
    formatted: bool = False,
    format_template: str = "{time_range}: {activity}"
) -> Union[Dict[str, Any], str, None]:
```

**Args**:
- `formatted` (bool): 若为 `True`，则返回格式化的字符串。默认为 `False`，返回包含活动详情的字典。
- `format_template` (str): `formatted` 为 `True` 时使用的格式化模板。

**Returns**:
- `Union[Dict[str, Any], str, None]`: 当前活动的字典、格式化字符串或 `None`。

### 3. 获取时间段内的活动 (新增)

```python
async def get_activities_between(
    start_time: str,
    end_time: str,
    date: Optional[str] = None,
    formatted: bool = False,
    format_template: str = "{time_range}: {activity}"
) -> Union[List[Dict[str, Any]], str, None]:
```

**Args**:
- `start_time` (str): 开始时间，格式为 `"HH:MM"`。
- `end_time` (str): 结束时间，格式为 `"HH:MM"`。
- `date` (Optional[str]): 目标日期，格式为 `"YYYY-MM-DD"`。默认为今天。
- `formatted` (bool): 控制返回类型是列表还是格式化字符串。

**Returns**:
- `Union[List[Dict[str, Any]], str, None]`: 在指定时间范围内的活动列表、格式化字符串或 `None`。

### 4. 获取月度计划 (重构)

查询月度计划的接口，功能大幅增强。

```python
async def get_monthly_plans(
    target_month: Optional[str] = None,
    random_count: Optional[int] = None,
    formatted: bool = False,
    format_template: str = "- {plan_text}"
) -> Union[List[MonthlyPlan], str, None]:
```

**Args**:
- `target_month` (Optional[str]): 目标月份，格式为 `"YYYY-MM"`。默认为当前月份。
- `random_count` (Optional[int]): 如果设置，将从当月计划中 **随机** 返回指定数量的计划。如果忽略，则返回全部计划。
- `formatted` (bool): 控制返回类型是 `MonthlyPlan` 对象列表还是格式化字符串。

**Returns**:
- `Union[List[MonthlyPlan], str, None]`: 月度计划对象列表、格式化字符串或 `None`。

### 5. 统计月度计划数量 (新增)

```python
async def count_monthly_plans(target_month: Optional[str] = None) -> int:
```

**Args**:
- `target_month` (Optional[str]): 目标月份，格式为 `"YYYY-MM"`。默认为当前月份。

**Returns**:
- `int`: 指定月份的有效月度计划总数。

## 已移除的API

为使API更加专注和清晰，以下与日程生成和状态管理相关的函数已被移除：
- `regenerate_schedule()`
- `ensure_monthly_plans()`
- `archive_monthly_plans()`

## 注意事项

1.  **异步调用**: 本API中的所有函数都是 `async` 函数，必须在异步上下文中使用 `await` 关键字进行调用。
2.  **异常处理**: 建议将API调用包裹在 `try...except` 块中，以应对可能发生的意外情况。
3.  **数据模型**: `get_monthly_plans` 在未格式化时返回的是 `MonthlyPlan` 对象列表，你可以直接访问其属性来获取计划的详细信息，例如 `.plan_text`。
