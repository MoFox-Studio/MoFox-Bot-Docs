# Media API

`src.app.plugin_system.api.media_api` 提供媒体识别（图片、表情包）和信息管理。

所有函数均为**异步函数**，调用时需 `await`。`media_type` 只能取 `"image"` 或 `"emoji"`。

## 导入

```python
from src.app.plugin_system.api.media_api import (
    recognize_media,
    recognize_batch,
    save_media_info,
    get_media_info,
)
```

## 函数

### `recognize_media(base64_data: str, media_type: str, use_cache: bool = True) -> str | None`

识别单张图片或表情包。

- `base64_data`: Base64 编码的媒体内容
- `media_type`: 媒体类型，取 `"image"` 或 `"emoji"`
- `use_cache`: 是否使用缓存
- 返回: 识别结果文本，未识别则返回 `None`

```python
result = await recognize_media(b64_data, "image")
```

### `recognize_batch(media_list: list[tuple[str, str]], use_cache: bool = True) -> list[tuple[int, str | None]]`

批量识别。

- `media_list`: `(base64_data, media_type)` 元组列表，必须是非空列表
- `use_cache`: 是否使用缓存
- 返回: 识别结果列表，包含索引与识别文本

### `save_media_info(media_hash: str, media_type: str, file_path: str | None = None, description: str | None = None, vlm_processed: bool = False) -> None`

保存媒体信息到数据库。

- `media_hash`: 媒体哈希
- `media_type`: 媒体类型
- `file_path`: 文件路径，可选
- `description`: 媒体描述，可选
- `vlm_processed`: 是否已完成 VLM 识别

### `get_media_info(media_hash: str) -> dict[str, Any] | None`

根据哈希值或路径获取媒体信息。

- `media_hash`: 媒体哈希或文件路径
- 返回: 媒体信息字典，未找到则返回 `None`

返回字典可能包含以下字段：

| 字段 | 说明 |
|------|------|
| `id` | 记录 ID |
| `image_id` | 图片 ID |
| `path` | 文件路径 |
| `type` | 媒体类型 |
| `description` | 媒体描述 |
| `count` | 出现次数 |
| `timestamp` | 时间戳 |
| `vlm_processed` | 是否已完成 VLM 识别 |
