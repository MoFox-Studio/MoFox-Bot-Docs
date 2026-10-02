# MCP 使用教程

MCP（Model Context Protocol）允许 Neo-MoFox 通过外部工具服务器扩展 AI 能力，如网页抓取、搜索引擎查询、文件管理等。

## 配置

编辑 `config/mcp.toml`：

```toml
[mcp]
enabled = true

[mcp.stdio_servers.<server-name>]
command = "<启动命令>"
args = ["<参数1>", "<参数2>", ...]
instructions = "<向 LLM 描述该服务器功能的说明>"
defer_loading = false   # 是否延迟加载（默认 false）
```

### 配置项

| 字段 | 说明 |
|------|------|
| `enabled` | 是否启用 MCP 功能 |
| `command` | 启动 MCP 服务器的命令（如 `uvx`、`npx`、`python`） |
| `args` | 传递给命令的参数列表 |
| `instructions` | 该服务器功能的自然语言描述，LLM 据此判断何时调用 |
| `defer_loading` | `true` 时延迟加载，首次调用时才启动服务器 |

### 环境变量

部分 MCP 服务器需要环境变量（如代理设置）：

```toml
[mcp.stdio_servers.<server-name>.env]
HTTP_PROXY = "http://127.0.0.1:10808"
HTTPS_PROXY = "http://127.0.0.1:10808"
```

## 内置示例

### Fetch — 网页抓取

```toml
[mcp.stdio_servers.fetch]
command = "uvx"
args = ["mcp-server-fetch"]
instructions = "提供网页内容抓取功能，将 HTML 转换为 markdown"
```

### Bing Search — 搜索引擎

```toml
[mcp.stdio_servers.bing-search]
command = "npx"
args = ["-y", "bing-cn-mcp-enhanced"]
instructions = "提供搜索引擎查询功能"
```

## 使用方式

配置完成后重启 Neo-MoFox，LLM 会自动识别可用的 MCP 服务器并根据指令判断是否调用。
