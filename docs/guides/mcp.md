# MCP 接入

插件解决「Bot 少什么功能」，MCP 解决「Bot 怎么用上外部工具」。这一页带你十分钟把 MCP server 接到 Bot 上。

## MCP 是什么？

大白话：MCP（Model Context Protocol，模型上下文协议）就是一个「**万能插座**」。USB 让各种外设插上电脑就能用，MCP 让各种外部工具插上 AI 就能用——本地文件、网页抓取、数据库、你自己写的服务……只要对方提供 MCP server，[Bot](/docs/guides/glossary#bot) 就能直接调用它的工具，不用为每个工具单独写插件。

[MCP](/docs/guides/glossary#mcp) 是标准协议，社区里有大量现成 server，配置基本都能直接抄。

## 配置文件：config/mcp.toml

MCP 的配置文件在 Bot 目录下：
```text

config/mcp.toml
```

1. 没有这个文件时，Bot 首次启动会自动生成默认配置。
2. `[mcp]` 节的 `enabled` 默认就是 `true`，不用改。
3. 三类服务器各配各的，写在同一个文件里。

![图片：WebUI 中的 MCP 配置页，对应 config/mcp.toml 的三类服务器](/guide/webui/config-mcp.png)

三类服务器的字段：

| 类型 | 写法 | 字段 |
|---|---|---|
| `stdio_servers` | `key` 为服务名，`value` 为配置表 | `command`（必填）、`args`、`env`，可选 `instructions`、`defer_loading` |
| `sse_servers` | `value` 为 URL 字符串，或配置表 | 表写法：`url`（必填）、`headers`、`timeout`（默认 5 秒）、`sse_read_timeout`（默认 300 秒），可选 `instructions`、`defer_loading` |
| `streamable_http_servers` | `value` 为 URL 字符串，或配置表 | 表写法：`url`（必填）、`headers`、`timeout`（默认 30 秒），可选 `instructions`、`defer_loading` |

## 三种接入方式（可直接抄）

### 方式一：stdio —— 在本地起一个进程

最常见的用法，比如官方的文件系统 server，让 Bot 能读写指定目录：
```toml

[mcp.stdio_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/yourname/mofox-files"]
```

用 Python 写的 server 也一样，比如官方的网页抓取 server：
```toml

[mcp.stdio_servers.fetch]
command = "uvx"
args = ["mcp-server-fetch"]
```

1. `command` 是启动命令，`args` 是参数列表；
2. `env` 可以给这个进程额外注入环境变量（比如 API key）：
   ```toml
   [mcp.stdio_servers.my_server.env]
   API_KEY = "sk-xxx"
   ```
3. Bot 启动时会把这个进程拉起来，通过标准输入输出和它通信。

<!-- VERIFY: npx/uvx 启动官方 filesystem、fetch server 为社区通用写法，包名请以对应 server 的官方文档为准 -->

### 方式二：SSE —— 连接远程服务

远程服务直接给个 URL 就行，最简写法：
```toml

[mcp.sse_servers]
weather = "https://example.com/sse"
```

需要带请求头或调整超时的话用表写法：
```toml

[mcp.sse_servers.weather]
url = "https://example.com/sse"
timeout = 10

[mcp.sse_servers.weather.headers]
Authorization = "Bearer sk-xxx"
```

::: warning 别重复定义
同一个服务名在文件里只能出现一次：上面「最简写法」和这里的「表写法」是**二选一**，两种都写会导致配置解析报错「Cannot overwrite a value」。
:::

### 方式三：Streamable HTTP —— 连接远程服务

和 SSE 类似，换成 `streamable_http_servers` 节：
```toml

[mcp.streamable_http_servers]
docs = "https://example.com/mcp"
```

带请求头和超时的写法：
```toml

[mcp.streamable_http_servers.docs]
url = "https://example.com/mcp"
timeout = 30

[mcp.streamable_http_servers.docs.headers]
Authorization = "Bearer sk-xxx"
```

::: warning 别重复定义
同上：`docs` 这个服务名的简单写法和表写法**二选一**，别两种都写。
:::

::: tip defer_loading 是干嘛的？
每个 server 都可以加 `defer_loading = true/false`（默认 `true`）。开启时该服务的工具按需加载；如果你发现某个 MCP 工具没有出现在 Bot 的主工具列表里，可以试着给它设 `defer_loading = false`。

<!-- VERIFY: defer_loading 默认值与「仅对子代理暴露」的描述来自 mcp_config.py 的注释，其完整加载逻辑未逐行核实 -->
:::

## 怎么验证接上了？

1. **重启 Bot**，打开 `logs/` 目录下最新的日志文件，搜索 `mcp_manager`。看到这两行就说明成了：
   ```text
   已连接 MCP 服务器: filesystem
   已动态注册 MCP 工具: mcp_provider:tool:mcp-filesystem-list_directory
   ```
   如果 `[mcp]` 的 `enabled` 是 `false`，日志会提示「MCP 功能未启用」。
2. **工具的命名规则**是 `mcp-<服务名>-<工具名>`（统一转成短横线格式），比如服务名 `weather_server` 里的 `get_weather` 工具，就叫 `mcp-weather-server-get-weather`。
3. **在聊天里直接用**：比如接了文件系统 server 后，对 Bot 说「帮我看看 /home/yourname/mofox-files 里有什么文件」，看它会不会调工具。
4. MCP 工具会进入 Bot 的 [Tool](/docs/guides/glossary#tool) 列表；WebUI 里也能查看（见 [WebUI 指南](/docs/guides/webui)）。

![图片：日志中的 MCP 连接成功记录](/guide/mcp/mcp-log.png)

<!-- TODO-SCREENSHOT: 启动日志截图，需包含「已连接 MCP 服务器」与「已动态注册 MCP 工具」两行高亮 -->

## 常见问题

### 提示 command not found

- **原因**：`command` 指向的程序没装或不在 PATH 里。最常见的是 `npx` 没装——它随 Node.js 一起安装，先装 Node.js（建议 LTS 版）再重试。
- **解决**：
  1. 终端里跑 `node -v` 和 `npx -v` 确认能找到；
  2. Windows 下如果 `npx` 起不来，可以试着把 `command` 改成 `cmd`、`args` 前面加 `"/c"`（如 `args = ["/c", "npx", "-y", ...]`）；
  3. 用 `uvx`/`python` 启动的 server，确认对应工具已安装且在 PATH 里。

<!-- VERIFY: Windows 下 cmd /c 包装 npx 是 MCP 社区常见解法，未在本项目环境逐台验证 -->

### 连接超时

- **原因**：远程服务不可达，或超时设得太短。
- **解决**：
  1. 先用浏览器或 `curl` 确认 URL 从你机器上能访问到；
  2. SSE 默认只等 5 秒，网络差就把 `timeout` 调大（Streamable HTTP 默认 30 秒）；
  3. 挂了代理的话，确认代理能通到目标地址（见下一条）。

### 环境变量与代理

- stdio 方式启动的 MCP 进程会**继承 Bot 主程序的全部环境变量**，`env` 字段是在此基础上的补充和覆盖；
- 远程连接（SSE / Streamable HTTP）走 httpx，**默认遵循系统代理环境变量**（`HTTP_PROXY`、`HTTPS_PROXY` 等）——代理配置不对会直接连不上；
- 模型请求、插件市场同步的系统代理行为由 `core.toml` 里 `[advanced]` 的 `trust_env` 控制（详见 [常见问题 FAQ](/docs/guides/faq)）。

配置好之后，Bot 的能力边界就取决于你能找到多少好用的 MCP server 了。装常规插件还是看 [安装插件](/docs/guides/plugins)；遇到问题去 [常见问题 FAQ](/docs/guides/faq)。
