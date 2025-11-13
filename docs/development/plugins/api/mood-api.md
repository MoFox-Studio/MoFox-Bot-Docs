# 情绪API

情绪API模块负责提供与机器人情绪状态相关的接口，允许插件查询和控制情绪。

## 导入方式

```python
from src.plugin_system.apis import mood_api
# 或者
from src.plugin_system import mood_api
```

## 主要功能

### 1. 获取当前情绪

```python
def get_mood(chat_id: str) -> str:
```

获取指定聊天的当前情绪状态。

**Args**:
- `chat_id (str)`: 聊天ID (通常是 stream_id)

**Returns**:
- `str`: 当前的情绪状态描述

#### 示例：
```python
current_mood = mood_api.get_mood(chat_id)
print(f"当前情绪是: {current_mood}")
```

### 2. 设置新情绪

```python
def set_mood(chat_id: str, new_mood: str):
```

强制设定指定聊天的新情绪状态。

**Args**:
- `chat_id (str)`: 聊天ID(通常是 stream_id)
- `new_mood (str)`: 新的情绪状态

**Returns**:
- `bool`: 操作是否成功

#### 示例：
```python
sucess = mood_api.set_mood(chat_id, "感到很开心")
if sucess:
    print("情绪设置成功。")
```

### 3. 锁定情绪

```python
async def lock_mood(chat_id: str, duration: float | None = None):
```

锁定指定聊天的情绪，防止其自动更新。这是一个异步函数。

**Args**:
- `chat_id (str)`: 聊天ID(通常是 stream_id)
- `duration (Optional[float])`: 锁定时长（秒）。如果为 None，则永久锁定直到手动解锁。
**Returns**:
- `bool`: 操作是否成功

#### 示例：
```python
# 锁定情绪3分钟
sucess = await mood_api.lock_mood(chat_id, duration=180)

# 永久锁定
sucess = await mood_api.lock_mood(chat_id)
```

### 4. 解锁情绪

```python
async def unlock_mood(chat_id: str):
```

立即解除情绪锁定。这是一个异步函数。

**Args**:
- `chat_id (str)`: 聊天ID(通常是 stream_id)

**Returns**:
- `bool`: 如果成功解锁则返回 True，如果情绪未被锁定则返回 False。

#### 示例：
```python
sucess = await mood_api.unlock_mood(chat_id)
if sucess:
    print("情绪已成功解锁。")
else:
    print("情绪未被锁定。")
```

### 5. 检查情绪是否锁定

```python
def is_mood_locked(chat_id: str) -> bool:
```

检查指定聊天的情绪是否当前处于锁定状态。

**Returns**:
- `bool`: 如果情绪被锁定，则返回 True，否则返回 False。

#### 示例：
```python
if mood_api.is_mood_locked(chat_id):
    print("情绪当前是锁定的。")
```

## 注意事项

1.  **异步调用**：`lock_mood` 和 `unlock_mood` 是异步函数，需要使用 `await` 关键字来调用。
2.  **锁定逻辑**：锁定情绪后，机器人的情绪将不会因对话而自动改变。使用 `duration` 参数可以实现临时锁定。
3.  **Chat ID**：确保你传入的 `chat_id` 是正确的，它通常对应于一个独立的对话会话。