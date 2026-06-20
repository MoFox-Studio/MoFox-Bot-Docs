# Media API

`src.app.plugin_system.api.media_api` 提供媒体识别（图片、表情包）和信息管理。

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

识别单张图片或表情包。`media_type` 取 `"image"` 或 `"emoji"`。

```python
result = await recognize_media(b64_data, "image")
```

### `recognize_batch(media_list: list[tuple[str, str]], use_cache: bool = True) -> list[tuple[int, str | None]]`

批量识别。`media_list` 格式：`[(base64_data, media_type), ...]`。

### `save_media_info(media_hash: str, media_type: str, file_path: str | None = None, description: str | None = None, vlm_processed: bool = False) -> None`

保存媒体信息到数据库。

### `get_media_info(media_hash: str) -> dict[str, Any] | None`

根据哈希获取媒体信息。
