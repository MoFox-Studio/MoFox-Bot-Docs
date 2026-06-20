# Permission API

`src.app.plugin_system.api.permission_api` 提供用户身份标识生成与权限查询。

## 导入

```python
from src.app.plugin_system.api.permission_api import (
    generate_raw_person_id,
    generate_person_id,
)
```

## 函数

### `generate_raw_person_id(platform: str, user_id: str) -> str`

生成原始格式的 person_id（`platform:user_id`）。

### `generate_person_id(platform: str, user_id: str) -> str`

生成哈希后的 person_id，用于权限系统内部索引。

```python
pid = generate_person_id("qq", "123456789")
```
