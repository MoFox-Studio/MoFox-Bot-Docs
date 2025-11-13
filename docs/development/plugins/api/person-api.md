# 个人信息API

个人信息API模块提供用户信息查询和管理功能，让插件能够获取和使用用户的相关信息。

## 导入方式

```python
from src.plugin_system.apis import person_api
# 或者
from src.plugin_system import person_api
```

## 主要功能

### 1. Person ID 获取
```python
def get_person_id(platform: str, user_id: int | str) -> str:
```
根据平台和用户ID获取person_id

**Args:**
- `platform`：平台名称，如 "qq", "telegram" 等
- `user_id`：用户ID

**Returns:**
- `str`：唯一的person_id（MD5哈希值）

#### 示例
```python
person_id = person_api.get_person_id("qq", 123456)
```

### 2. 用户信息查询
```python
async def get_person_info(person_id: str) -> dict[str, Any]:
```
获取用户的核心基础信息

**Args:**
- `person_id`：用户的唯一标识ID

**Returns:**
- `dict[str, Any]`：包含用户基础信息的字典，例如 `person_name`, `nickname`, `know_times`, `attitude` 等。如果用户不存在则返回空字典。

#### 示例
```python
info = await person_api.get_person_info(person_id)
if info:
    print(f"用户昵称: {info.get('nickname', '未知')}")
```

### 3. 获取用户印象
```python
async def get_person_impression(person_id: str, short: bool = False) -> str:
```
获取对用户的印象。

**Args:**
- `person_id`：用户的唯一标识ID
- `short`：是否获取简短版印象，默认为`False`获取长篇印象

**Returns:**
- `str`：一段描述性的文本。

#### 示例
```python
impression = await person_api.get_person_impression(person_id)
short_impression = await person_api.get_person_impression(person_id, short=True)
```

### 4. 获取用户记忆点
```python
async def get_person_points(person_id: str, limit: int = 5) -> list[tuple]:
```
获取关于用户的'记忆点'，这些是与用户交互中产生的关键信息。

**Args:**
- `person_id`：用户的唯一标识ID
- `limit`：返回的记忆点数量上限，默认为5

**Returns:**
- `list[tuple]`：一个列表，每个元素是一个包含记忆点内容、权重和时间的元组。

#### 示例
```python
points = await person_api.get_person_points(person_id, limit=3)
for point, weight, time in points:
    print(f"记忆点: {point} (重要性: {weight})")
```

### 5. 判断用户是否已知
```python
async def is_person_known(platform: str, user_id: int) -> bool:
```
判断是否认识某个用户

**Args:**
- `platform`：平台名称
- `user_id`：用户ID

**Returns:**
- `bool`：是否认识该用户

### 6. 根据用户名获取Person ID
```python
async def get_person_id_by_name(person_name: str) -> str:
```
根据用户名获取person_id

**Args:**
- `person_name`：用户名

**Returns:**
- `str`：person_id，如果未找到返回空字符串

### 7. 生成关系报告
```python
async def get_full_relationship_report(person_id: str) -> str:
```
生成一份关于你和用户的完整'关系报告'，综合了基础信息、印象、记忆点和关系分。

**Args:**
- `person_id`：用户的唯一标识ID

**Returns:**
- `str`：格式化的关系报告文本。

#### 示例
```python
report = await person_api.get_full_relationship_report(person_id)
print(report)
```

## 常用字段说明

### 基础信息字段 (通过 `get_person_info` 获取)
- `person_name`: 用户名
- `nickname`：用户昵称
- `know_times`: 认识次数
- `know_since`: 初次认识时间
- `last_know`: 最近一次认识时间
- `attitude`: 对用户的态度

### 关系信息字段 (通过专用函数获取)
- **印象**: 通过 `get_person_impression` 获取
- **记忆点**: 通过 `get_person_points` 获取

其他字段可以参考`PersonInfo`类的属性（位于`src/person_info/person_info.py`）

## 注意事项

1. **异步操作**：大部分查询函数都是异步的，需要使用`await`
2. **性能考虑**：批量查询优于单个查询（虽然当前版本API暂未提供批量接口，但设计上应有此意识）
3. **隐私保护**：确保用户信息的使用符合隐私政策
4. **数据一致性**：person_id是用户的唯一标识，应妥善保存和使用