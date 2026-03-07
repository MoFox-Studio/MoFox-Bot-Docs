# Stream API

`src/app/plugin_system/api/stream_api` 提供聊天流的创建、查询与管理接口。

## 导入

```python
from src.app.plugin_system.api.stream_api import (
    get_or_create_stream,
    get_stream,
    build_stream_from_database,
    load_stream_context,
    add_message_to_stream,
    add_message,
    add_sent_message_to_history,
    delete_stream,
    get_stream_info,
    get_stream_messages,
    clear_stream_cache,
    refresh_stream,
    activate_stream,
)
from src.core.components.types import ChatType
```

## 核心函数

### `get_or_create_stream(stream_id="", platform="", user_id="", group_id="", chat_type="private") -> ChatStream`

获取现有流或创建新流。

**参数：**
- `stream_id`: 聊天流 ID，可选
- `platform`: 平台名称
- `user_id`: 用户 ID
- `group_id`: 群组 ID
- `chat_type`: 聊天类型（`ChatType` 或字符串）

**返回值：**
- `ChatStream` 实例

**使用示例：**
```python
from src.core.components.types import ChatType

# 通过 stream_id 获取
stream = await get_or_create_stream(stream_id=self.stream_id)

# 创建私聊流
stream = await get_or_create_stream(
    platform="qq",
    user_id="123456",
    chat_type=ChatType.PRIVATE,
)

# 创建群聊流
stream = await get_or_create_stream(
    platform="qq",
    group_id="789012",
    chat_type=ChatType.GROUP,
)
```

---

### `get_stream(stream_id: str) -> ChatStream | None`

获取现有流（不创建）。

**参数：**
- `stream_id`: 聊天流 ID

**返回值：**
- `ChatStream` 实例，未找到则返回 `None`

**使用示例：**
```python
stream = await get_stream(stream_id=self.stream_id)

if stream:
    print(f"流存在: {stream.chat_type.value}")
else:
    print("流不存在")
```

---

### `build_stream_from_database(stream_id: str) -> ChatStream | None`

从数据库记录构建 ChatStream。

**参数：**
- `stream_id`: 聊天流 ID

**返回值：**
- `ChatStream` 实例，未找到则返回 `None`

**使用示例：**
```python
# 强制从数据库重建流
stream = await build_stream_from_database(stream_id=self.stream_id)

if stream:
    print(f"流已重建: {stream.platform}")
```

---

### `load_stream_context(stream_id: str, max_messages=None) -> StreamContext`

从数据库加载 StreamContext（包含消息历史）。

**参数：**
- `stream_id`: 聊天流 ID
- `max_messages`: 最大加载消息数，可选

**返回值：**
- `StreamContext` 对象

**返回值示例：**
```python
{
    "stream": <ChatStream instance>,
    "messages": [<Message>, <Message>, ...],
    "total_count": 150,
}
```

**使用示例：**
```python
# 加载所有消息
context = await load_stream_context(stream_id=self.stream_id)

# 加载最近 50 条消息
context = await load_stream_context(
    stream_id=self.stream_id,
    max_messages=50,
)

print(f"加载了 {len(context['messages'])} 条消息")
print(f"总共有 {context['total_count']} 条消息")
```

---

### `add_message_to_stream(message: Message) -> Messages`

添加消息到流。

**参数：**
- `message`: 消息对象

**返回值：**
- 入库后的消息记录

**使用示例：**
```python
from src.core.models.message import Message, MessageType

message = Message(
    message_id="msg_123",
    content="你好",
    processed_plain_text="你好",
    message_type=MessageType.TEXT,
    sender_id="123456",
    sender_name="用户",
    platform="qq",
    stream_id=self.stream_id,
    chat_type="group",
)

db_record = await add_message_to_stream(message)
print(f"消息已保存，ID: {db_record.id}")
```

---

### `add_message(message: Message) -> Messages`

添加消息到流（与 `add_message_to_stream` 相同）。

**参数：**
- `message`: 消息对象

**返回值：**
- 入库后的消息记录

**使用示例：**
```python
db_record = await add_message(message)
```

---

### `add_sent_message_to_history(message: Message) -> Messages`

添加"已发送消息"到流历史。

**参数：**
- `message`: 消息对象

**返回值：**
- 入库后的消息记录

**使用场景：**
- Bot 主动发送的消息
- 需要记录到历史中的消息

**使用示例：**
```python
# Bot 发送消息后，记录到历史
from src.core.models.message import Message, MessageType

bot_message = Message(
    message_id="bot_msg_123",
    content="我是机器人的回复",
    processed_plain_text="我是机器人的回复",
    message_type=MessageType.TEXT,
    sender_id="bot",
    sender_name="Bot",
    platform="qq",
    stream_id=self.stream_id,
    chat_type="group",
)

await add_sent_message_to_history(bot_message)
```

---

### `delete_stream(stream_id: str, delete_messages=True) -> bool`

删除流及其消息。

**参数：**
- `stream_id`: 聊天流 ID
- `delete_messages`: 是否删除关联消息（默认 `True`）

**返回值：**
- `True` 表示删除成功，`False` 表示失败

**使用示例：**
```python
# 删除流和所有消息
success = await delete_stream(
    stream_id=self.stream_id,
    delete_messages=True,
)

# 仅删除流，保留消息
success = await delete_stream(
    stream_id=self.stream_id,
    delete_messages=False,
)
```

---

### `get_stream_info(stream_id: str) -> dict | None`

获取流的综合信息。

**参数：**
- `stream_id`: 聊天流 ID

**返回值示例：**
```python
{
    "stream_id": "abc123...",
    "platform": "qq",
    "chat_type": "group",
    "group_id": "789012",
    "message_count": 150,
    "last_active": "2024-01-01T12:00:00",
    "created_at": "2024-01-01T10:00:00",
}
```
未找到则返回 `None`

**使用示例：**
```python
info = await get_stream_info(stream_id=self.stream_id)

if info:
    print(f"平台: {info['platform']}")
    print(f"消息数: {info['message_count']}")
    print(f"最后活跃: {info['last_active']}")
```

---

### `get_stream_messages(stream_id: str, limit=100, offset=0) -> list[Message]`

获取流的消息（支持分页）。

**参数：**
- `stream_id`: 聊天流 ID
- `limit`: 单页数量（默认 100）
- `offset`: 偏移量（默认 0）

**返回值：**
- 消息对象列表

**使用示例：**
```python
# 获取最近 20 条消息
messages = await get_stream_messages(
    stream_id=self.stream_id,
    limit=20,
    offset=0,
)

# 分页获取
page1 = await get_stream_messages(self.stream_id, limit=50, offset=0)
page2 = await get_stream_messages(self.stream_id, limit=50, offset=50)
```

---

### `clear_stream_cache(stream_id=None) -> None`

清理流实例缓存。

**参数：**
- `stream_id`: 聊天流 ID，可选（为 `None` 时清理所有缓存）

**使用示例：**
```python
# 清理指定流的缓存
clear_stream_cache(stream_id=self.stream_id)

# 清理所有缓存
clear_stream_cache()
```

---

### `refresh_stream(stream_id: str) -> ChatStream | None`

强制从数据库刷新流。

**参数：**
- `stream_id`: 聊天流 ID

**返回值：**
- `ChatStream` 实例，未找到则返回 `None`

**使用示例：**
```python
# 刷新流数据
stream = await refresh_stream(stream_id=self.stream_id)

if stream:
    print("流已刷新")
```

---

### `activate_stream(stream_id: str) -> ChatStream | None`

激活流，更新其最后活跃时间。

**参数：**
- `stream_id`: 聊天流 ID

**返回值：**
- `ChatStream` 实例，未找到则返回 `None`

**使用场景：**
- 用户发送消息时
- 需要更新活跃时间时

**使用示例：**
```python
stream = await activate_stream(stream_id=self.stream_id)
```

## 完整示例

### 示例 1：在 Chatter 中使用 Stream

```python
from src.app.plugin_system.api.stream_api import (
    get_or_create_stream,
    load_stream_context,
    add_sent_message_to_history,
)

class MyChatter(BaseChatter):
    async def execute(self):
        # 1. 获取当前流
        stream = await get_or_create_stream(stream_id=self.stream_id)
        
        # 2. 加载上下文
        context = await load_stream_context(
            stream_id=self.stream_id,
            max_messages=10,
        )
        
        # 3. 使用历史消息
        for msg in context['messages']:
            print(f"{msg.sender_name}: {msg.processed_plain_text}")
        
        # 4. 生成回复
        response = await self.generate_response(context)
        
        # 5. 发送并记录
        await self.send_text(response)
        
        # 记录 Bot 的回复到历史
        bot_message = Message(
            message_id=f"bot_{self.message.message_id}",
            content=response,
            processed_plain_text=response,
            message_type=MessageType.TEXT,
            sender_id="bot",
            sender_name="Bot",
            platform=self.platform,
            stream_id=self.stream_id,
            chat_type=self.chat_type.value,
        )
        await add_sent_message_to_history(bot_message)
```

### 示例 2：流管理命令

```python
from src.app.plugin_system.api.stream_api import (
    get_stream_info,
    get_stream_messages,
    delete_stream,
)

class StreamInfoCommand(BaseCommand):
    name = "stream.info"
    description = "查看当前流信息"
    
    async def execute(self):
        # 获取流信息
        info = await get_stream_info(self.stream_id)
        
        if not info:
            await self.send_text("流信息不存在")
            return
        
        result = [
            "当前流信息:",
            f"平台: {info['platform']}",
            f"类型: {info['chat_type']}",
            f"消息数: {info['message_count']}",
            f"最后活跃: {info['last_active']}",
        ]
        
        await self.send_text("\n".join(result))

class ClearStreamCommand(BaseCommand):
    name = "stream.clear"
    description = "清空当前流历史"
    permission = PermissionLevel.ADMIN
    
    async def execute(self):
        # 删除流和消息
        success = await delete_stream(
            stream_id=self.stream_id,
            delete_messages=True,
        )
        
        if success:
            await self.send_text("流历史已清空")
        else:
            await self.send_text("清空失败")
```

### 示例 3：消息统计

```python
from src.app.plugin_system.api.stream_api import (
    get_stream_messages,
    get_stream_info,
)
from src.core.models.message import MessageType

class MessageStatsCommand(BaseCommand):
    name = "stats"
    description = "消息统计"
    
    async def execute(self):
        # 获取流信息
        info = await get_stream_info(self.stream_id)
        total = info['message_count'] if info else 0
        
        # 获取所有消息（分页）
        all_messages = []
        limit = 100
        offset = 0
        
        while True:
            messages = await get_stream_messages(
                stream_id=self.stream_id,
                limit=limit,
                offset=offset,
            )
            
            if not messages:
                break
            
            all_messages.extend(messages)
            offset += limit
        
        # 统计
        by_type = {}
        by_sender = {}
        
        for msg in all_messages:
            # 按类型统计
            msg_type = msg.message_type.value
            by_type[msg_type] = by_type.get(msg_type, 0) + 1
            
            # 按发送者统计
            sender = msg.sender_name
            by_sender[sender] = by_sender.get(sender, 0) + 1
        
        # 输出
        result = [
            f"消息统计 (共 {total} 条):",
            "",
            "按类型:",
        ]
        
        for msg_type, count in sorted(by_type.items()):
            result.append(f"  {msg_type}: {count}")
        
        result.append("\n按发送者:")
        for sender, count in sorted(by_sender.items(), key=lambda x: x[1], reverse=True)[:10]:
            result.append(f"  {sender}: {count}")
        
        await self.send_text("\n".join(result))
```

### 示例 4：跨流消息同步

```python
from src.app.plugin_system.api.stream_api import (
    get_stream_messages,
    add_message_to_stream,
)

class MessageSyncService(BaseService):
    name = "message_sync"
    
    async def sync_messages(self, source_stream: str, target_stream: str):
        """同步消息到另一个流"""
        # 获取源流消息
        messages = await get_stream_messages(
            stream_id=source_stream,
            limit=100,
        )
        
        # 复制到目标流
        synced = 0
        for msg in messages:
            # 修改 stream_id
            new_msg = Message(
                message_id=f"sync_{msg.message_id}",
                content=msg.content,
                processed_plain_text=msg.processed_plain_text,
                message_type=msg.message_type,
                sender_id=msg.sender_id,
                sender_name=msg.sender_name,
                platform=msg.platform,
                stream_id=target_stream,  # 新的流 ID
                chat_type=msg.chat_type,
            )
            
            await add_message_to_stream(new_msg)
            synced += 1
        
        return synced
```

### 示例 5：流归档

```python
from src.app.plugin_system.api.stream_api import (
    get_stream_info,
    get_stream_messages,
    delete_stream,
)
from src.app.plugin_system.api.storage_api import save_json
from datetime import datetime

class StreamArchiveService(BaseService):
    name = "stream_archive"
    
    async def archive_stream(self, stream_id: str):
        """归档流到 JSON"""
        # 获取流信息
        info = await get_stream_info(stream_id)
        if not info:
            return False
        
        # 获取所有消息
        all_messages = []
        limit = 100
        offset = 0
        
        while True:
            messages = await get_stream_messages(
                stream_id=stream_id,
                limit=limit,
                offset=offset,
            )
            
            if not messages:
                break
            
            all_messages.extend([
                {
                    "message_id": msg.message_id,
                    "content": msg.content,
                    "sender_name": msg.sender_name,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                }
                for msg in messages
            ])
            
            offset += limit
        
        # 保存归档
        archive_data = {
            "stream_info": info,
            "messages": all_messages,
            "archived_at": datetime.now().isoformat(),
        }
        
        await save_json(
            store_name="archives",
            name=f"stream_{stream_id}_{datetime.now().strftime('%Y%m%d')}",
            data=archive_data,
        )
        
        # 删除原流
        await delete_stream(stream_id, delete_messages=True)
        
        return True
```

## Stream 生命周期

```
创建流
  ↓
get_or_create_stream()
  ↓
添加消息
  ↓
add_message_to_stream()
  ↓
激活流
  ↓
activate_stream()
  ↓
查询消息
  ↓
get_stream_messages()
  ↓
清理缓存
  ↓
clear_stream_cache()
  ↓
删除流
  ↓
delete_stream()
```

## 最佳实践

### 1. 使用 stream_id 而不是重复构建流

```python
# ✅ 好的做法
stream = await get_or_create_stream(stream_id=self.stream_id)

# ❌ 不好的做法（重复构建）
stream = await get_or_create_stream(
    platform=self.platform,
    user_id=self.sender_id,
    chat_type=self.chat_type,
)
```

### 2. 分页查询大量消息

```python
# ✅ 好的做法
messages = await get_stream_messages(stream_id, limit=100, offset=0)

# ❌ 不好的做法（可能内存溢出）
context = await load_stream_context(stream_id)  # 加载所有消息
```

### 3. 记录 Bot 发送的消息

```python
# ✅ 好的做法
await self.send_text(response)
await add_sent_message_to_history(bot_message)

# ❌ 不记录（会导致上下文不完整）
await self.send_text(response)
```

## 相关文档

- [消息查询 API](./message-api.md) — 消息查询接口
- [Chat API](./chat-api.md) — Chatter 管理
- [Chatter 组件](../components/chatter.md) — 在 Chatter 中使用 Stream
