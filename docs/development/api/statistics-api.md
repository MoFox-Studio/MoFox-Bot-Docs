# 统计数据 API

本文档介绍 MoFox-Core 提供的统计数据相关 API 接口，包括 LLM 使用统计和消息统计功能。

::: tip 提示
所有 API 接口都需要在请求头中携带有效的 API Key 进行身份验证。
:::

## 配置 API Key

在使用这些 API 之前，你需要先在 MoFox-Core 的配置文件中设置有效的 API Key。

**配置步骤：**

1. 打开 `config/bot_config.toml` 配置文件
2. 找到 `[plugin_http_system]` 部分
3. 在 `plugin_api_valid_keys` 数组中添加你的 API Key

**配置示例：**

```toml
# config/bot_config.toml

[plugin_http_system]
# 其他 HTTP 系统配置...

# 在这里添加有效的 API Key（可以添加多个）
plugin_api_valid_keys = [
    "your-super-secret-key-here",
    "another-api-key-for-different-service"
]
```

::: warning 安全提示
- 请使用足够复杂和随机的字符串作为 API Key
- 不要在代码仓库中提交包含真实 API Key 的配置文件
- 定期更换 API Key 以提高安全性
- 为不同的应用或服务使用不同的 API Key，便于管理和撤销
:::



## LLM 使用统计 API

### 获取 LLM 统计信息

**端点：** `GET /llm/stats`

**功能说明：**
获取大模型（LLM）的使用情况统计数据，包括请求次数、Token 消耗、费用等信息。支持多种时间维度和分组方式的灵活查询。

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `period_type` | string | 否 | `daily` | 时间段类型：`daily`（按天）、`custom`（自定义）、`last_hour`（最近1小时）、`last_24_hours`（最近24小时）、`last_7_days`（最近7天）、`last_30_days`（最近30天） |
| `days` | integer | 否 | `1` | 当 `period_type` 为 `daily` 时，指定查询过去多少天的数据（最小值：1） |
| `start_time_str` | string | 条件必填 | - | 当 `period_type` 为 `custom` 时，指定查询的开始时间（ISO 8601 格式） |
| `end_time_str` | string | 条件必填 | - | 当 `period_type` 为 `custom` 时，指定查询的结束时间（ISO 8601 格式） |
| `group_by` | string | 否 | `model` | 分组维度：`model`（按模型）、`module`（按模块）、`user`（按用户）、`type`（按类型） |

**返回数据结构：**

```json
{
  "period": {
    "start": "2026-01-23T00:00:00",
    "end": "2026-01-24T00:00:00"
  },
  "total_requests": 150,
  "total_cost": 2.45,
  "details_by_group": {
    "gpt-4": {
      "requests": 80,
      "cost": 1.80,
      "input_tokens": 12000,
      "output_tokens": 3000,
      "total_tokens": 15000
    },
    "claude-3-opus": {
      "requests": 70,
      "cost": 0.65,
      "input_tokens": 8000,
      "output_tokens": 2000,
      "total_tokens": 10000
    }
  }
}
```

**字段说明：**

- `period.start`：统计时间段的开始时间
- `period.end`：统计时间段的结束时间
- `total_requests`：总请求次数
- `total_cost`：总费用
- `details_by_group`：按指定维度分组的详细统计
  - `requests`：该分组的请求次数
  - `cost`：该分组的费用
  - `input_tokens`：输入 Token 数量
  - `output_tokens`：输出 Token 数量
  - `total_tokens`：总 Token 数量

**使用场景：**

- 📊 监控不同模型的使用频率和成本
- 💰 分析各个模块或用户的费用消耗
- 📈 生成 LLM 使用报表和趋势分析
- 🔍 定位高消耗的模块或用户



## 消息统计 API

### 获取最近消息统计

**端点：** `GET /messages/recent`

**功能说明：**
获取 BOT 在指定天数内的消息统计数据，可以筛选发送消息、接收消息或全部消息。

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `days` | integer | 否 | `1` | 查询过去多少天的数据（最小值：1） |
| `message_type` | string | 否 | `all` | 消息类型筛选：`sent`（BOT 发送的）、`received`（BOT 接收的）、`all`（全部） |

**返回数据结构：**

当 `message_type` 为 `all` 时：
```json
{
  "days": 1,
  "message_type": "all",
  "sent_count": 245,
  "received_count": 1230,
  "total_count": 1475
}
```

当 `message_type` 为 `sent` 或 `received` 时：
```json
{
  "days": 1,
  "message_type": "sent",
  "count": 245
}
```

**字段说明：**

- `days`：查询的天数
- `message_type`：消息类型
- `sent_count`：BOT 发送的消息数量
- `received_count`：BOT 接收的消息数量
- `total_count`：总消息数量
- `count`：筛选后的消息数量



### 按聊天会话统计消息

**端点：** `GET /messages/stats_by_chat`

**功能说明：**
获取在指定天数内，按聊天会话（群聊或私聊）统计的消息数据。支持按用户分组和格式化输出。

**查询参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `days` | integer | 否 | `1` | 查询过去多少天的数据（最小值：1） |
| `source` | string | 否 | `user` | 消息来源：`user`（用户发送的）、`bot`（BOT 发送的） |
| `group_by_user` | boolean | 否 | `false` | 是否按用户进行分组统计（仅当 `source=user` 时有效） |
| `format` | boolean | 否 | `false` | 是否格式化输出，包含群聊和用户信息 |

**返回数据结构：**

当 `source=bot`，`format=false` 时（简单统计）：
```json
{
  "chat_123456": 150,
  "chat_789012": 85
}
```

当 `source=bot`，`format=true` 时（格式化输出）：
```json
{
  "chat_123456": {
    "chat_name": "技术交流群",
    "count": 150
  },
  "chat_789012": {
    "chat_name": "用户昵称",
    "count": 85
  }
}
```

当 `source=user`，`group_by_user=false`，`format=false` 时：
```json
{
  "chat_123456": {
    "total": 450
  },
  "chat_789012": {
    "total": 120
  }
}
```

当 `source=user`，`group_by_user=true`，`format=true` 时（完整统计）：
```json
{
  "chat_123456": {
    "chat_name": "技术交流群",
    "total_stats": {
      "total": 450
    },
    "user_stats": {
      "user_10001": {
        "nickname": "张三",
        "count": 200
      },
      "user_10002": {
        "nickname": "李四",
        "count": 150
      },
      "user_10003": {
        "nickname": "王五",
        "count": 100
      }
    }
  }
}
```

**字段说明：**

- `chat_name`：聊天会话名称（群名或用户昵称）
- `count`：消息数量
- `total_stats.total`：该会话的总消息数
- `user_stats`：按用户分组的统计信息
  - `nickname`：用户昵称
  - `count`：该用户的消息数量

**使用场景：**

- 📊 分析最活跃的群聊或用户
- 👥 统计各个群成员的活跃度
- 📈 生成消息活跃度报表
- 🤖 监控 BOT 的响应频率
- 🔍 识别高频互动的聊天会话


### 使用 API Key 发送请求

在发送 HTTP 请求时，需要在请求头中包含 `X-API-Key` 字段：

**请求头格式：**
```
X-API-Key: your-super-secret-key-here
```

**使用 cURL 示例：**

```bash
# GET 请求示例
curl -X GET "http://127.0.0.1:8000/llm/stats?period_type=daily&days=7" \
     -H "X-API-Key: your-super-secret-key-here"


```

**使用 Python requests 库示例：**

```python
import requests

# 配置
API_BASE_URL = "http://127.0.0.1:8000"
API_KEY = "your-super-secret-key-here"

# 设置请求头
headers = {
    "X-API-Key": API_KEY
}

# 发送 GET 请求
response = requests.get(
    f"{API_BASE_URL}/llm/stats",
    headers=headers,
    params={
        "period_type": "last_7_days",
        "group_by": "model"
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"总请求数: {data['total_requests']}")
    print(f"总费用: ${data['total_cost']}")
else:
    print(f"请求失败: {response.status_code}")
    print(response.json())
```

**使用 JavaScript fetch 示例：**

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
const API_KEY = 'your-super-secret-key-here';

// 发送请求
fetch(`${API_BASE_URL}/messages/recent?days=7&message_type=all`, {
    method: 'GET',
    headers: {
        'X-API-Key': API_KEY
    }
})
.then(response => response.json())
.then(data => {
    console.log('消息统计:', data);
})
.catch(error => {
    console.error('请求失败:', error);
});
```



## 错误处理

所有 API 在出错时会返回 HTTP 错误状态码和错误详情：

**400 Bad Request** - 请求参数错误
```json
{
  "detail": "自定义时间段必须提供开始和结束时间"
}
```

**401 Unauthorized** - 未授权（API Key 无效或缺失）
```json
{
  "detail": "Invalid API key"
}
```

**500 Internal Server Error** - 服务器内部错误
```json
{
  "detail": "获取统计信息失败: [错误详情]"
}
```



## 最佳实践

### 性能优化建议

1. **合理设置查询范围**：大范围的时间查询可能会影响性能，建议按需查询
2. **使用适当的分组**：根据实际需求选择合适的 `group_by` 参数
3. **缓存结果**：对于不经常变化的历史数据，建议在客户端实现缓存
4. **按需格式化**：只在需要详细信息时使用 `format=true`

### 数据分析建议

1. **定期监控成本**：使用 LLM 统计 API 定期检查模型使用成本
2. **分析使用模式**：通过消息统计了解用户活跃时段和高频群聊
3. **优化资源分配**：根据统计数据调整 BOT 的响应策略
4. **识别异常**：监控突然的流量或成本变化



## 更新日志

- **2026-01-24**：初始版本，提供 LLM 统计和消息统计 API
