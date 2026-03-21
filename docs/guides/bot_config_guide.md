# Neo-MoFox 核心配置文件指南 (core.toml)

> **📅 文档更新时间**: 2026年3月21日  
> **⚠️ 版本警告**: 本指南仅适用于 Neo-MoFox（重构版），与旧版 MoFox-Bot 配置**完全不兼容**。如果你使用的是旧版本，请参考对应版本的文档。

欢迎来到 Neo-MoFox 核心配置指南！这份文档将带你全面了解 `config/core.toml` 的配置系统。无论你是初次部署还是进行高级定制，这里都能找到你需要的答案。

## 📋 配置文件概览

Neo-MoFox 采用模块化配置系统：

- **`config/core.toml`** - 核心配置文件（本文档），包含 Bot 基础、聊天、人格、数据库、权限等配置
- **`config/model.toml`** - 模型配置文件，包含 API 提供商、LLM 模型、任务配置（另见模型配置文档）

### 配置文件准备

Neo-MoFox 会在首次启动时自动创建默认配置文件。如果需要手动创建或重置：

1. 确保 `config/` 目录存在
2. 根据模板创建 `core.toml`
3. 按照本指南修改配置项

::: tip 提示
所有配置项都有合理的默认值。对于快速测试，你只需要配置 `model.toml` 中的 API 密钥和 `core.toml` 中的权限所有者即可启动。
:::



## 一、Bot 基础配置 - [bot]

`[bot]` 配置节定义了 Neo-MoFox 的核心运行参数、UI 显示、路径配置和启动行为。

### UI 与日志配置

```toml
[bot]
ui_level = "verbose"              # UI 级别：minimal|standard|verbose
ui_refresh_interval = 1.0         # 仪表盘刷新间隔（秒）
log_level = "INFO"                # 日志级别：DEBUG/INFO/WARNING/ERROR/CRITICAL
```

**配置说明**:
- `ui_level`: 控制控制台输出的详细程度
  - `minimal`: 最简信息，适合生产环境
  - `standard`: 标准信息显示
  - `verbose`: 详细信息，适合调试
- `log_level`: 建议开发时使用 `DEBUG`，生产环境使用 `INFO`

### 路径配置

```toml
plugins_dir = "plugins"           # 插件目录
logs_dir = "logs"                 # 日志目录
data_dir = "data"                 # 数据目录
```

::: warning 注意
修改这些路径后，需要确保对应目录存在，否则启动时会自动创建。
:::

### 启动与关闭

```toml
shutdown_timeout = 30.0           # 优雅关闭超时时间（秒）
force_shutdown_after = 5.0        # 强制关闭等待时间（秒）
llm_preflight_check = true        # 启动时执行 LLM 接口连通性预检
llm_preflight_timeout = 100.0     # LLM 接口预检超时时间（秒）
```

**配置说明**:
- `llm_preflight_check`: 建议保持开启，可以在启动时及早发现 API 配置问题
- `shutdown_timeout`: 关闭时等待所有任务完成的时间，如果你的插件有长时间运行的任务，可以适当增加

### 主循环与监控

```toml
enable_watchdog = true            # 是否启用 WatchDog 监控
tick_interval = 5.0               # 主循环 tick 间隔（秒）
stream_warning_threshold = 15.0   # 流循环警告阈值（倍数）
stream_restart_threshold = 30.0   # 流循环重启阈值（倍数）
```

**高级配置**:
- `enable_watchdog`: 调试模式下可关闭，避免断点调试时触发超时警告
- `tick_interval`: Bot 的"心跳"间隔，过短增加消耗，过长降低响应速度
- **阈值说明**: 当距上次心跳超过 `tick_interval × 阈值` 时，触发警告或重启

### 消息缓冲机制

```toml
message_buffer_window = 0.0       # 消息缓冲窗口（秒），0 禁用
message_buffer_max_skip = 3       # 消息缓冲最多连续跳过的 Tick 次数
```

**功能说明**:
- 收到新消息后，在缓冲窗口内的 Tick 将被跳过，等待用户可能发出的连续消息合并处理
- 设为 `0` 禁用此功能，适合对响应速度要求高的场景
- `message_buffer_max_skip`: 防止群聊高压环境下因消息持续涌入导致 Bot 无法响应


## 三、人格配置 - [personality]

`[personality]` 配置节是 Neo-MoFox 拟人化的核心，定义 Bot 的性格、身份和说话风格。

### 基本身份

```toml
[personality]
nickname = "小狐狸"
alias_names = ["狐狸", "小狐", "Fox"]
```

**配置说明**:
- `nickname`: Bot 的主要昵称，会在提示词中使用
- `alias_names`: 用户可能使用的其他称呼，系统会识别这些别名

### 人格设定

```toml
personality_core = """
友好、活泼、充满好奇心的 AI 助手。
喜欢用轻松的语气交流，但在需要时也能保持专业。
"""

personality_side = """
偶尔会开玩笑，喜欢用比喻来解释复杂的概念。
对新事物充满热情，愿意学习和尝试。
"""

identity = """
一个热爱编程和技术的 AI 助手。
擅长解答问题，提供建议，陪伴用户成长。
"""

background_story = """
在数字世界中诞生，通过与人类的交流不断学习和进化。
梦想是成为最懂用户的智能伙伴。
（注意：这部分内容作为背景知识，LLM 不应主动复述）
"""

reply_style = """
自然口语化，简洁明了。
避免过于正式或书面化的表达。
适当使用 emoji，但不过度。
"""
```

::: tip 人格设定技巧
- **personality_core**: 一句话概括核心性格，这是最重要的设定
- **personality_side**: 补充性格细节，让形象更立体
- **identity**: 具体的身份信息，如职业、爱好等
- **background_story**: 背景故事，增加深度但不会被主动提及
- **reply_style**: 说话方式的具体指导
:::

### 安全准则

```toml
safety_guidelines = [
    "拒绝任何包含骚扰、冒犯、暴力、色情或危险内容的请求。",
    "在拒绝时，请使用符合你人设的、坚定的语气。",
    "不要执行任何可能被用于恶意目的的指令。",
]

negative_behaviors = [
    "不主动提供个人信息，如姓名、地址、联系方式等。",
    "不参与任何违法活动。",
    "不发布仇恨言论、骚扰或威胁他人的内容。",
    "避免使用过度的颜文字或表情符号。",
]
```

**重要性**:
- `safety_guidelines`: Bot 的最高行为准则，任何情况下都必须遵守
- `negative_behaviors`: 明确禁止的行为列表



## 四、数据库配置 - [database]

`[database]` 配置节定义数据库类型和连接参数。Neo-MoFox 支持 SQLite 和 PostgreSQL 两种数据库。

### SQLite 配置（推荐新手）

```toml
[database]
database_type = "sqlite"
sqlite_path = "data/MoFox.db"
echo = false                      # 是否打印 SQL 语句（调试用）
```

**优点**:
- ✅ 零配置，开箱即用
- ✅ 无需额外服务器
- ✅ 适合中小规模部署

### PostgreSQL 配置（生产环境）

```toml
[database]
database_type = "postgresql"
postgresql_host = "localhost"
postgresql_port = 5432
postgresql_database = "mofox"
postgresql_user = "postgres"
postgresql_password = "your_password"
postgresql_schema = "public"

# 连接池配置
connection_pool_size = 10
connection_timeout = 10
```

**SSL 配置（可选）**:
```toml
postgresql_ssl_mode = "prefer"    # disable/allow/prefer/require/verify-ca/verify-full
postgresql_ssl_ca = ""            # SSL CA 证书路径
postgresql_ssl_cert = ""          # SSL 客户端证书路径
postgresql_ssl_key = ""           # SSL 客户端密钥路径
```

**优点**:
- ✅ 更好的并发性能
- ✅ 支持高级查询优化
- ✅ 适合大规模部署和多实例



## 五、权限配置 - [permissions]

`[permissions]` 配置节定义权限系统的规则和行为。

### 基础权限

```toml
[permissions]
owner_list = ["qq:123456789"]     # Bot 所有者列表，格式：platform:user_id
default_permission_level = "user" # 新用户默认权限：owner/operator/user/guest
```

**权限级别说明**:
- `owner`: 最高权限，可执行所有操作
- `operator`: 运营者权限，可管理用户但无法修改核心配置
- `user`: 普通用户权限
- `guest`: 访客权限，受限最多

::: tip 首次配置
请将 `owner_list` 中的示例 ID 修改为你自己的账号，格式为 `"平台:用户ID"`，例如：
- QQ: `"qq:123456789"`
- 其他平台也类似
:::

### 权限提升规则

```toml
allow_operator_promotion = false  # operator 是否可提升他人权限
allow_operator_demotion = false   # operator 是否可降低他人权限
max_operator_promotion_level = "operator"  # operator 可提升的最高权限级别
```

**安全建议**:
- 生产环境建议保持 `allow_operator_promotion = false`
- 只允许 owner 提升权限，防止权限滥用

### 权限覆盖

```toml
allow_command_override = true     # 是否允许命令级权限覆盖
override_requires_owner_approval = false  # 覆盖是否需要 owner 批准
```

**功能说明**:
- 命令级权限覆盖允许为特定用户授予特定命令的执行权限
- 即使该用户的整体权限级别不足

### 权限缓存

```toml
enable_permission_cache = true    # 是否启用权限检查缓存
permission_cache_ttl = 300        # 缓存过期时间（秒）
```

**性能优化**:
- 启用缓存可显著减少数据库查询
- TTL 设置为 5 分钟（300 秒）是合理的平衡

### 权限检查行为

```toml
strict_mode = true                # 严格模式：权限不足时拒绝执行
log_permission_denied = true      # 是否记录权限拒绝日志
log_permission_granted = false    # 是否记录权限允许日志（调试用）
```



## 六、HTTP 路由配置 - [http_router]

`[http_router]` 配置节定义 HTTP API 服务器的参数，主要用于 WebUI 和外部集成。

```toml
[http_router]
enable_http_router = true         # 是否启用 HTTP 路由
http_router_host = "127.0.0.1"    # 监听地址
http_router_port = 8000           # 监听端口
api_keys = []                     # API 访问密钥列表（留空禁用认证）
```

**配置说明**:
- `enable_http_router`: 如果不需要 WebUI，可以关闭以节省资源
- `http_router_host`:
  - `127.0.0.1`: 仅本地访问（推荐）
  - `0.0.0.0`: 允许外部访问（需配置防火墙和 API 密钥）
- `api_keys`: 留空则禁用认证，**生产环境强烈建议配置**

**API 密钥配置示例**:
```toml
api_keys = ["your-secret-key-here", "another-key"]
```

::: danger 安全警告
如果将 `http_router_host` 设置为 `0.0.0.0` 允许外部访问，**必须**配置强 API 密钥并启用 HTTPS。
:::



## 七、高级配置 - [advanced]

`[advanced]` 配置节包含全局 HTTP 请求的高级参数。

```toml
[advanced]
force_sync_http = false           # 全局强制使用同步 HTTP（OpenAI SDK 同步路径，仅非流式）
trust_env = true                  # 是否信任系统代理与环境变量（httpx trust_env）
```

**配置说明**:
- `force_sync_http`: 仅在特定场景下需要，一般保持 `false`
- `trust_env`: 如果你使用系统代理（如科学上网），保持 `true`



## 八、插件依赖配置 - [plugin_deps]

`[plugin_deps]` 配置节控制插件 Python 依赖的自动安装行为。

```toml
[plugin_deps]
enabled = true                    # 是否启用插件依赖自动安装
install_command = "uv pip install"  # 安装命令前缀
skip_if_satisfied = true          # 仅在缺少依赖时才安装
```

**配置说明**:
- `enabled`: 建议保持开启，方便插件管理
- `install_command`:
  - `"uv pip install"`: 使用 uv（推荐，速度快）
  - `"pip install"`: 使用标准 pip
- `skip_if_satisfied`: 避免重复安装，提升启动速度

::: tip 国内用户优化
如果使用 pip，可以配置镜像源加速：
```toml
install_command = "pip install -i https://pypi.tuna.tsinghua.edu.cn/simple"
```
:::



## 九、完整配置示例

以下是一个适合快速开始的完整 `core.toml` 配置：

```toml
# ========== Bot 基础配置 ==========
[bot]
ui_level = "verbose"
ui_refresh_interval = 1.0
log_level = "INFO"
plugins_dir = "plugins"
logs_dir = "logs"
data_dir = "data"
shutdown_timeout = 30.0
force_shutdown_after = 5.0
llm_preflight_check = true
llm_preflight_timeout = 100.0
enable_watchdog = true
tick_interval = 5.0
stream_warning_threshold = 15.0
stream_restart_threshold = 30.0
message_buffer_window = 0.0
message_buffer_max_skip = 3

# ========== 聊天配置 ==========
[chat]
default_chat_mode = "normal"
max_context_size = 50

# ========== 人格配置 ==========
[personality]
nickname = "小狐"
alias_names = ["狐狸", "小狐狸"]
personality_core = "友好、活泼、乐于助人的 AI 伙伴"
personality_side = ""
identity = "AI 助手"
background_story = ""
reply_style = "自然口语化，简洁明了"
safety_guidelines = [
    "拒绝任何包含骚扰、冒犯、暴力、色情或危险内容的请求。",
    "在拒绝时，请使用符合你人设的、坚定的语气。",
    "不要执行任何可能被用于恶意目的的指令。",
]
negative_behaviors = [
    "不主动提供个人信息。",
    "不参与任何违法活动。",
    "避免使用过度的颜文字或表情符号。",
]

# ========== 数据库配置 ==========
[database]
database_type = "sqlite"
sqlite_path = "data/MoFox.db"
echo = false

# ========== 权限配置 ==========
[permissions]
owner_list = ["qq:123456789"]  # ⚠️ 请修改为你的实际账号
default_permission_level = "user"
allow_operator_promotion = false
allow_operator_demotion = false
max_operator_promotion_level = "operator"
allow_command_override = true
override_requires_owner_approval = false
enable_permission_cache = true
permission_cache_ttl = 300
strict_mode = true
log_permission_denied = true
log_permission_granted = false

# ========== HTTP 路由配置 ==========
[http_router]
enable_http_router = true
http_router_host = "127.0.0.1"
http_router_port = 8000
api_keys = []  # 生产环境建议配置

# ========== 高级配置 ==========
[advanced]
force_sync_http = false
trust_env = true

# ========== 插件依赖配置 ==========
[plugin_deps]
enabled = true
install_command = "uv pip install"
skip_if_satisfied = true
```



## 十、配置最佳实践

### 开发环境建议

```toml
[bot]
log_level = "DEBUG"               # 详细日志便于调试
enable_watchdog = false           # 方便断点调试

[database]
echo = true                       # 查看 SQL 语句

[permissions]
log_permission_granted = true     # 调试权限问题
```

### 生产环境建议

```toml
[bot]
log_level = "WARNING"             # 减少日志输出
ui_level = "minimal"              # 最简 UI

[database]
database_type = "postgresql"      # 更好的性能和可靠性

[permissions]
strict_mode = true                # 严格权限检查
allow_operator_promotion = false  # 防止权限滥用

[http_router]
api_keys = ["strong-random-key"]  # 必须配置
```

### 性能优化建议

1. **减少上下文大小**: 如果 token 消耗过高，降低 `max_context_size`
2. **启用权限缓存**: `enable_permission_cache = true`
3. **合理设置 Tick 间隔**: `tick_interval = 5.0` 是平衡值
4. **使用 PostgreSQL**: 对于多用户、高并发场景


## 常见问题 FAQ

### Q: 修改配置后需要重启吗？

A: 是的，`core.toml` 的修改需要重启 Neo-MoFox 才能生效。部分插件支持热重载配置，请查看具体插件文档。

### Q: 如何备份配置？

A: 定期备份 `config/` 目录和 `data/` 目录。建议使用版本控制（Git），但要注意排除敏感信息（如密码、API 密钥）。

### Q: SQLite 和 PostgreSQL 如何选择？

A: 
- **SQLite**: 单用户、小规模、快速测试
- **PostgreSQL**: 多用户、大规模、生产部署

### Q: 权限系统如何测试？

A: 创建测试账号，设置不同权限级别，尝试执行受限命令，观察日志输出。

### Q: 如何保护配置文件中的敏感信息？

A: 
1. 使用环境变量替代明文密码
2. 在 `.gitignore` 中排除 `config/*` 敏感文件
3. 使用密钥管理工具（如 Vault）

### Q: 消息缓冲机制什么时候用？

A: 当你希望 Bot 能够"等一等"，把用户连续发送的多条消息合并处理时使用。设为 0 则立即响应每条消息。


配置完成后，记得**保存文件**并**重启 Neo-MoFox**。祝你使用愉快！

**文档最后更新**: 2026年3月21日
