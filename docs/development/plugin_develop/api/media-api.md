# Media API

`src/app/plugin_system/api/media_api` 提供媒体识别、批量识别与媒体信息查询能力。

## 导入

```python
from src.app.plugin_system.api.media_api import (
    recognize_media,
    recognize_batch,
    save_media_info,
    get_media_info,
    update_media_description,
)
```

## 核心函数

### `recognize_media(base64_data: str, media_type: str, use_cache=True) -> str | None`

识别媒体内容（图片或表情包）。

**参数：**
- `base64_data`: Base64 编码的媒体内容
- `media_type`: 媒体类型（`"image"` 或 `"emoji"`）
- `use_cache`: 是否使用缓存（默认 `True`）

**返回值：**
- 识别结果文本，未识别则返回 `None`

**使用示例：**
```python
# 识别图片
description = await recognize_media(
    base64_data="iVBORw0KGgoAAAANSUhEUgAA...",
    media_type="image",
)

if description:
    print(f"图片描述: {description}")
else:
    print("识别失败")

# 识别表情包
emoji_desc = await recognize_media(
    base64_data="R0lGODlhAQABAIAAAP...",
    media_type="emoji",
    use_cache=False,  # 不使用缓存
)
```

---

### `recognize_batch(media_list: list[tuple[str, str]], use_cache=True) -> list[tuple[int, str | None]]`

批量识别媒体。

**参数：**
- `media_list`: `(base64_data, media_type)` 元组列表
- `use_cache`: 是否使用缓存（默认 `True`）

**返回值：**
- `(索引, 识别结果)` 元组列表

**返回值示例：**
```python
[
    (0, "一只可爱的猫咪"),
    (1, "笑哭表情包"),
    (2, None),  # 识别失败
]
```

**使用示例：**
```python
# 准备媒体列表
media_list = [
    ("base64_image_1", "image"),
    ("base64_image_2", "image"),
    ("base64_emoji_1", "emoji"),
]

# 批量识别
results = await recognize_batch(media_list)

for index, description in results:
    if description:
        print(f"媒体 {index}: {description}")
    else:
        print(f"媒体 {index}: 识别失败")
```

---

### `save_media_info(media_hash: str, media_type: str, file_path=None, description=None, vlm_processed=False) -> None`

保存媒体信息到数据库。

**参数：**
- `media_hash`: 媒体哈希值
- `media_type`: 媒体类型（`"image"` 或 `"emoji"`）
- `file_path`: 文件路径，可选
- `description`: 媒体描述，可选
- `vlm_processed`: 是否已完成 VLM 识别（默认 `False`）

**使用示例：**
```python
import hashlib

# 计算媒体哈希
media_hash = hashlib.md5(base64_data.encode()).hexdigest()

# 保存媒体信息
await save_media_info(
    media_hash=media_hash,
    media_type="image",
    file_path="data/media_cache/abc123.jpg",
    description="一只猫咪",
    vlm_processed=True,
)
```

---

### `get_media_info(media_hash: str) -> dict[str, Any] | None`

根据哈希值获取媒体信息。

**参数：**
- `media_hash`: 媒体哈希值或文件路径

**返回值：**
```python
{
    "hash": "abc123...",
    "type": "image",
    "file_path": "data/media_cache/abc123.jpg",
    "description": "一只猫咪",
    "vlm_processed": True,
    "created_at": "2024-01-01T12:00:00",
}
```
未找到则返回 `None`

**使用示例：**
```python
# 查询媒体信息
info = await get_media_info(media_hash="abc123...")

if info:
    print(f"媒体类型: {info['type']}")
    print(f"描述: {info['description']}")
    print(f"已识别: {info['vlm_processed']}")
else:
    print("媒体信息不存在")
```

---

### `update_media_description(media_hash: str, description: str) -> bool`

更新媒体描述。

**参数：**
- `media_hash`: 媒体哈希值
- `description`: 新的描述文本

**返回值：**
- `True` 表示更新成功，`False` 表示失败

**使用示例：**
```python
success = await update_media_description(
    media_hash="abc123...",
    description="一只黑白相间的猫咪",
)

if success:
    print("描述已更新")
else:
    print("更新失败")
```

## 完整示例

### 示例 1：在 Chatter 中识别图片

```python
from src.app.plugin_system.api.media_api import recognize_media
from src.core.models.message import MessageType

class ImageAnalyzerChatter(BaseChatter):
    async def execute(self):
        message = self.message
        
        # 检查是否包含图片
        if message.message_type != MessageType.IMAGE:
            await self.send_text("请发送图片")
            return
        
        # 获取图片数据
        image_data = message.media_data.get("base64", "")
        
        if not image_data:
            await self.send_text("图片数据获取失败")
            return
        
        # 识别图片
        description = await recognize_media(
            base64_data=image_data,
            media_type="image",
        )
        
        if description:
            await self.send_text(f"图片内容: {description}")
        else:
            await self.send_text("图片识别失败")
```

### 示例 2：批量处理消息中的媒体

```python
from src.app.plugin_system.api.media_api import recognize_batch
from src.app.plugin_system.api.message_api import get_recent_messages
from src.core.models.message import MessageType

class BatchMediaAnalyzer:
    async def analyze_recent_media(self, stream_id: str, hours: float = 1.0):
        # 获取最近消息
        messages = await get_recent_messages(
            stream_id=stream_id,
            hours=hours,
        )
        
        # 提取所有媒体
        media_list = []
        for msg in messages:
            if msg.message_type in [MessageType.IMAGE, MessageType.EMOJI]:
                base64_data = msg.media_data.get("base64", "")
                if base64_data:
                    media_type = "image" if msg.message_type == MessageType.IMAGE else "emoji"
                    media_list.append((base64_data, media_type))
        
        if not media_list:
            return []
        
        # 批量识别
        results = await recognize_batch(media_list)
        
        return results
```

### 示例 3：媒体缓存管理

```python
from src.app.plugin_system.api.media_api import (
    get_media_info,
    save_media_info,
    update_media_description,
)
import hashlib

class MediaCacheManager:
    async def process_media(self, base64_data: str, media_type: str):
        # 计算哈希
        media_hash = hashlib.md5(base64_data.encode()).hexdigest()
        
        # 检查是否已缓存
        info = await get_media_info(media_hash)
        
        if info and info.get("vlm_processed"):
            # 已识别过，直接返回缓存结果
            return info["description"]
        
        # 识别媒体
        from src.app.plugin_system.api.media_api import recognize_media
        
        description = await recognize_media(
            base64_data=base64_data,
            media_type=media_type,
            use_cache=False,  # 强制重新识别
        )
        
        if description:
            # 保存识别结果
            await save_media_info(
                media_hash=media_hash,
                media_type=media_type,
                description=description,
                vlm_processed=True,
            )
        
        return description
    
    async def update_cache(self, media_hash: str, new_description: str):
        """更新缓存中的描述"""
        success = await update_media_description(
            media_hash=media_hash,
            description=new_description,
        )
        return success
```

### 示例 4：媒体统计命令

```python
from src.app.plugin_system.api.message_api import get_messages_by_type
from src.app.plugin_system.api.media_api import get_media_info
from src.core.models.message import MessageType
from datetime import datetime, timedelta

class MediaStatsCommand(BaseCommand):
    async def execute(self, days: int = 7):
        # 获取最近的图片消息
        start_time = datetime.now() - timedelta(days=days)
        
        messages = await get_messages_by_type(
            stream_id=self.stream_id,
            message_type=MessageType.IMAGE,
            start_time=start_time,
        )
        
        # 统计识别情况
        total = len(messages)
        recognized = 0
        
        for msg in messages:
            media_hash = msg.media_data.get("hash", "")
            if media_hash:
                info = await get_media_info(media_hash)
                if info and info.get("vlm_processed"):
                    recognized += 1
        
        # 发送统计结果
        await self.send_text(
            f"最近 {days} 天媒体统计:\n"
            f"- 总图片数: {total}\n"
            f"- 已识别: {recognized}\n"
            f"- 未识别: {total - recognized}\n"
            f"识别率: {recognized / total * 100:.1f}%"
        )
```

## 媒体类型说明

| 类型 | 值 | 说明 |
| --- | --- | --- |
| 图片 | `"image"` | 普通图片（JPG、PNG 等） |
| 表情 | `"emoji"` | 表情包（动图、静态表情等） |

## 注意事项

1. **Base64 编码**：媒体数据必须是 Base64 编码的字符串
2. **缓存机制**：识别结果会自动缓存，避免重复识别
3. **哈希计算**：使用 MD5 计算媒体哈希值
4. **VLM 模型**：识别功能依赖配置的 VLM 模型

## 相关文档

- [消息查询 API](./message-api.md) — 查询包含媒体的消息
- [LLM API](./llm-api.md) — VLM 模型配置
- [模型配置指南](/docs/guides/model_configuration_guide) — 配置 VLM 模型
