# Media API

`src.app.plugin_system.api.media_api` 提供媒体识别（图片、表情包、语音）和信息管理。

所有函数均为**异步函数**，调用时需 `await`。`media_type` 取 `"image"`、`"emoji"` 或 `"voice"`：`image` / `emoji` 走 VLM 识别，`voice` 走 ASR 识别并落盘到 voices 目录。

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

识别单张图片、表情包或语音。按 `media_type` 路由到对应识别引擎：`image` / `emoji` 走 VLM，`voice` 走 ASR（音频为 WAV，识别后落盘到 voices 目录）。

- `base64_data`: Base64 编码的媒体内容（语音为 WAV）
- `media_type`: 媒体类型，取 `"image"`、`"emoji"` 或 `"voice"`
- `use_cache`: 是否使用缓存
- 返回: 识别结果文本，未识别则返回 `None`

```python
result = await recognize_media(b64_data, "image")
voice_text = await recognize_media(wav_b64, "voice")
```

### `recognize_batch(media_list: list[tuple[str, str]], use_cache: bool = True) -> list[tuple[int, str | None]]`

批量识别，支持混合 `image` / `emoji` / `voice` 类型。

- `media_list`: `(base64_data, media_type)` 元组列表，必须是非空列表
- `use_cache`: 是否使用缓存
- 返回: 识别结果列表，包含索引与识别文本

### `save_media_info(media_hash: str, media_type: str, file_path: str | None = None, description: str | None = None, vlm_processed: bool = False) -> None`

保存媒体信息到数据库。按 `media_type` 路由：`image` / `emoji` 写入 `Images` 表，`voice` 写入 `Voices` 表。

- `media_hash`: 媒体哈希（语音时即 voice_hash）
- `media_type`: 媒体类型
- `file_path`: 文件路径，可选
- `description`: 媒体描述（语音时为 ASR 文本），可选
- `vlm_processed`: 是否已完成识别；语音时映射为 `asr_processed`

### `get_media_info(media_hash: str) -> dict[str, Any] | None`

根据哈希值或路径获取媒体信息。依次查询 `Images` 与 `Voices` 表，命中即返回。

- `media_hash`: 媒体哈希或文件路径
- 返回: 媒体信息字典，未找到则返回 `None`

返回字典根据命中表不同，可能包含以下字段：

**Images 命中（图片 / 表情包）：**

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

**Voices 命中（语音）：**

| 字段 | 说明 |
|------|------|
| `id` | 记录 ID |
| `voice_id` | 语音 ID |
| `path` | 文件路径 |
| `type` | 媒体类型 |
| `description` | 语音描述（ASR 文本） |
| `count` | 出现次数 |
| `timestamp` | 时间戳 |
| `asr_processed` | 是否已完成 ASR 识别 |
