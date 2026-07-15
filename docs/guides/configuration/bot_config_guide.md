# Neo-MoFox 核心配置指南 (core.toml)

> **适用版本**: Neo-MoFox >= 1.2.0  
> **注意**: 本指南仅适用于 Neo-MoFox（重构版），与旧版 MoFox-Bot 配置**完全不兼容**。

`config/core.toml` 是 Neo-MoFox 的核心配置文件。首次启动时程序会自动生成带注释的默认配置文件，本文档帮助你理解各项含义。

## 配置节一览

| 配置节 | 用途 |
|--------|------|
| `[bot]` | 基础运行参数、UI、路径、启动行为 |
| `[chat]` | 聊天模式、历史消息、识图提示词 |
| `[llm]` | LLM 全局策略（模型调度策略） |
| `[llm_stats]` | LLM 请求统计 |
| `[telemetry]` | 通用遥测收集 |
| `[cloud_telemetry]` | 云端遥测客户端 |
| `[personality]` | Bot 人格、身份、安全准则 |
| `[database]` | 数据库类型与连接 |
| `[permissions]` | 权限系统 |
| `[http_router]` | HTTP API 服务 |
| `[advanced]` | 高级参数（HTTP、进程池） |
| `[plugin_deps]` | 插件依赖自动安装 |
| `[plugin_market]` | 插件市场接入 |


## 一、Bot 基础配置 `[bot]`

```toml
[bot]
ui_level = "verbose"              # UI 级别：minimal / standard / verbose
ui_refresh_interval = 1.0         # 仪表盘刷新间隔（秒）
log_level = "INFO"                # 日志级别：DEBUG / INFO / WARNING / ERROR / CRITICAL
plugins_dir = "plugins"           # 插件目录
logs_dir = "logs"                 # 日志目录
data_dir = "data"                 # 数据目录
```

- `ui_level`: `verbose` 适合调试（实时仪表盘），`standard`/`minimal` 适合生产。
- `log_level`: 开发和排查问题时用 `DEBUG`，日常 `INFO`。

### 启动与关闭

```toml
shutdown_timeout = 15.0           # 优雅关闭超时（秒）
force_shutdown_after = 5.0        # 强制关闭等待（秒）
llm_preflight_check = true        # 启动时检查 LLM 接口连通性
llm_preflight_timeout = 5.0       # LLM 预检超时（秒）
```

- `shutdown_timeout`: 关闭时等待所有任务完成。有长任务可调大。
- `llm_preflight_check`: 建议开启，启动时就能发现 API Key 问题。

### 主循环与心跳

```toml
enable_watchdog = true            # WatchDog 监控（调试时可关闭）
tick_interval = 5.0               # 主循环 tick 间隔（秒）
stream_warning_threshold = 150.0  # 流循环警告阈值（秒）
stream_restart_threshold = 300.0  # 流循环重启阈值（秒）
stream_step_timeout = 90.0        # 单次聊天步进超时（秒），0 禁用
```

- `tick_interval`: 过短增加开销，过长降低响应。默认 5 秒是平衡值。
- 心跳阈值：距上次心跳超过这些值分别触发警告和重启。
- `stream_step_timeout`: 防止 chatter 内部调用卡死。调试期间可以设为 0 临时关闭。

### 消息缓冲

```toml
message_buffer_window = 8.0       # 缓冲窗口（秒），0 禁用
message_buffer_max_skip = 3       # 最多连续跳过的 tick 次数
```

- 收到消息后在窗口内等待后续消息一并处理，适合用户习惯连续发多条的场景。
- `max_skip` 防止群聊高压下一直跳过导致无法响应。


## 二、聊天配置 `[chat]`

```toml
[chat]
default_chat_mode = "normal"      # focus / normal / proactive / priority
max_history_messages = 20         # 每个聊天流内存保留的最大历史消息数
image_recognition_prompt = ""     # 自定义识图提示词，留空用默认
```

- `max_history_messages`: 控制上下文窗口大小，值越大 LLM 消耗 token 越多。
- `image_recognition_prompt`: 有特殊识图需求时自定义，一般留空即可。


## 三、LLM 全局配置 `[llm]`

```toml
[llm]
default_policy = "load_balanced"  # load_balanced / round_robin
```

- `load_balanced`: 负载均衡策略，优先选择当前请求最少的模型。
- `round_robin`: 轮询策略，依次轮流使用模型列表中的模型。


## 四、LLM 统计 `[llm_stats]`

```toml
[llm_stats]
enabled = true
db_path = "data/llm_stats/llm_stats.db"
max_records = 100000              # 0 不限制
window_hours = 5.0               # 统计聚合窗口（小时）
```

记录每次 LLM 请求的延迟、token 消耗等指标，方便分析模型表现。


## 五、通用遥测 `[telemetry]`

```toml
[telemetry]
enabled = true
max_records = 100000
max_age_days = 30                 # 事件保留天数，0 不按时间清理
detail_enabled = false            # 是否记录高敏感调试明细
hash_salt = ""                    # 脱敏标识盐值
slow_query_threshold_ms = 500.0   # 慢查询阈值（毫秒）
collect_error_events = true
collect_watchdog_events = true
collect_db_metrics = true
collect_plugin_events = true
collect_tool_events = true
collect_runtime_snapshots = true
```

本地收集框架运行数据，方便排查问题。一般保持默认即可。


## 六、云端遥测 `[cloud_telemetry]`

```toml
[cloud_telemetry]
client_enabled = true
identity_storage_dir = "data/cloud_telemetry/state"
pending_queue_max_bytes = 524288
pending_queue_max_windows = 128
default_heartbeat_interval_seconds = 300.0
send_timeout_seconds = 10.0
```

向云端发送匿名的运行状态数据，帮助项目了解整体健康状况。不涉及隐私内容。


## 七、人格配置 `[personality]`

Neo-MoFox 拟人化的核心，定义 Bot 的性格、身份和说话风格。

```toml
[personality]
nickname = "小狐狸"
alias_names = ["狐狸", "小狐", "Fox"]
personality_core = "友好、活泼、乐于助人。"
personality_side = "偶尔开玩笑，喜欢用比喻解释复杂概念。"
identity = "AI 助手"
background_story = "在数字世界中诞生...（LLM 不会主动复述此内容）"
reply_style = "自然口语化，简洁明了。"
```

**人格设定技巧**：
- `personality_core`: 一句话概括核心性格，最重要。
- `personality_side`: 补充性格细节。
- `identity`: 身份、年龄、职业等具体信息。
- `background_story`: 背景故事，仅作为背景知识注入，LLM 被指导不应主动复述。
- `reply_style`: 说话方式的具体指导。

### 安全准则

```toml
safety_guidelines = [
    "拒绝任何包含骚扰、冒犯、暴力、色情或危险内容的请求。",
    "在拒绝时，请使用符合你人设的、坚定的语气。",
]

negative_behaviors = [
    "不主动提供个人信息。",
    "不参与任何违法活动。",
    "避免使用过度的颜文字或表情符号。",
]
```

- `safety_guidelines`: 最高行为准则，任何情况必须遵守。
- `negative_behaviors`: 明确禁止的行为列表。


## 八、数据库配置 `[database]`

支持 SQLite 和 PostgreSQL。

### SQLite（默认，适合个人和小规模）

```toml
[database]
database_type = "sqlite"
sqlite_path = "data/MoFox.db"
echo = false                      # 调试时可打开查看 SQL
```

### PostgreSQL（适合大规模/生产环境）

```toml
[database]
database_type = "postgresql"
postgresql_host = "localhost"
postgresql_port = 5432
postgresql_database = "mofox"
postgresql_user = "postgres"
postgresql_password = "your_password"
postgresql_schema = "public"
postgresql_ssl_mode = "prefer"    # disable / allow / prefer / require / verify-ca / verify-full
connection_pool_size = 10
connection_timeout = 10
```


## 九、权限配置 `[permissions]`

```toml
[permissions]
owner_list = ["qq:123456789"]     # 格式：platform:user_id
default_permission_level = "user" # owner / operator / user / guest
```

**权限级别**：
- `owner`: 最高权限，唯一能提升他人为 operator。
- `operator`: 运营者，可管理用户但无法改核心配置。
- `user`: 普通用户。
- `guest`: 访客，受限最多。

### 权限提升规则

```toml
allow_operator_promotion = false
allow_operator_demotion = false
max_operator_promotion_level = "operator"
```

生产环境建议保持 `allow_operator_promotion = false`，仅 owner 可提升权限。

### 命令级覆盖与缓存

```toml
allow_command_override = true
override_requires_owner_approval = false
enable_permission_cache = true
permission_cache_ttl = 300        # 缓存过期（秒）
strict_mode = true
log_permission_denied = true
log_permission_granted = false
```


## 十、HTTP 路由 `[http_router]`

用于 WebUI、插件 Router 组件和外部 API 集成。

```toml
[http_router]
enable_http_router = true
http_router_host = "127.0.0.1"    # 本机用 127.0.0.1，局域网用 0.0.0.0
http_router_port = 8000
api_keys = ["your-secret-key"]    # 留空禁用认证（不推荐）
```

::: danger 安全警告
设置 `http_router_host = "0.0.0.0"` 会暴露到局域网（甚至公网），**必须**配置强 API Key。
:::


## 十一、高级配置 `[advanced]`

```toml
[advanced]
force_sync_http = false           # 强制同步 HTTP（仅非流式，一般不需要）
trust_env = true                  # 信任系统代理和环境变量
process_workers = 4               # TaskManager 进程池大小
```


## 十二、插件依赖 `[plugin_deps]`

```toml
[plugin_deps]
enabled = true
install_command = "uv pip install"
skip_if_satisfied = true          # 仅在缺少依赖时才安装
```

安装插件时自动处理其 Python 依赖。


## 十三、插件市场 `[plugin_market]`

```toml
[plugin_market]
enabled = true
base_url = "https://39.96.71.162"
user_id = ""                      # 格式：github:yourname
access_token = ""                 # 插件市场访问令牌
auto_update_mfp = true            # 自动更新已安装市场插件
auto_install_subscribed_missing = true
auto_resolve_plugin_dependencies = true
strict_subscribed_list_mode = false
timeout = 20.0
```

让 Neo-MoFox 接入插件市场，实现插件发现、安装、订阅和自动更新。


## 常见问题

### 修改配置后需要重启吗？

是的，`core.toml` 修改后需要重启生效。部分插件支持热重载配置，见具体插件文档。

### SQLite vs PostgreSQL？

- **SQLite**: 零配置，适合个人和小规模部署。
- **PostgreSQL**: 更好的并发性能，适合多用户和生产环境。

### 如何保护敏感信息？

- 不要将含密钥的 `config/` 提交到公开仓库。
- 生产环境使用强随机字符串作为 `api_keys`。
