# MCP 接入

插件解决「Bot 少什么功能」，MCP 解决「Bot 怎么用上外部工具」。这一页带你十分钟把 MCP server 接到 Bot 上。

MCP 配置有两条完全对等的改法：用编辑器改 `config/mcp.toml`，或者在 WebUI 的「MCP 配置」编辑器里点出来。两条路改的是同一份配置、覆盖同样的内容，只是操作方式不同。**下面每一步都同时给出两种做法，任选一条跟着走即可**；配置文件怎么改、怎么生效的通用规则见[核心配置要点](/docs/guides/core-config)。

## MCP 是什么？

大白话：MCP（Model Context Protocol，模型上下文协议）就是一个「**万能插座**」。USB 让各种外设插上电脑就能用，MCP 让各种外部工具插上 AI 就能用——本地文件、网页抓取、数据库、你自己写的服务……只要对方提供 MCP server，[Bot](/docs/guides/glossary#bot) 就能直接调用它的工具，不用为每个工具单独写插件。

[MCP](/docs/guides/glossary#mcp) 是标准协议，社区里有大量现成 server，配置基本都能直接抄。

## 先弄懂：三类服务器

不管用哪种改法，MCP 服务都分成三类，各配各的，写在同一个文件里：

1. **`stdio_servers` 本地进程** —— Bot 在你电脑上拉起一个程序，通过标准输入输出和它通信。**最常用**，社区里大多数现成 server 都是这种。
2. **`sse_servers` 远程 SSE** —— 连一个远程服务给的 URL。
3. **`streamable_http_servers` 远程 Streamable HTTP** —— 也是连远程 URL，是比 SSE 更新的传输方式，服务方给哪种就用哪种。

每类服务还支持两个公共可选项：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `instructions` | 不填 | 给这个服务额外补充的系统指令，帮 Bot 更懂怎么用它 |
| `defer_loading` | `true` | 延迟加载：开启时该服务的工具**只对子代理暴露**，不挤占主工具列表。发现某个工具没出现在 Bot 的主工具列表里，可以设为 `false` 试试 |

WebUI 的「MCP 配置」编辑器里，「Stdio 服务器 / SSE 服务器 / Streamable HTTP 服务器」三个标签页正好对应这三类，按需添加就行。

## 第一步：接一个本地工具（Stdio）

最常见的用法，比如官方的文件系统 server，让 Bot 能读写指定目录。

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

用编辑器打开 `config/mcp.toml`（没有这个文件时，Bot 首次启动会自动生成默认配置）。在 `[mcp.stdio_servers]` 下加一段，**`key` 是你起的服务名，`value` 是它的配置**：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `command` | 必填 | 启动命令，比如 `npx`、`uvx`、`python` |
| `args` | | 参数列表 |
| `env` | | 给这个进程额外注入的环境变量（比如 API key） |
| `instructions` / `defer_loading` | | 公共可选项，见上表 |

Node.js 写的 server 用 `npx` 启动：

```toml
[mcp.stdio_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/yourname/mofox-files"]
```

Python 写的 server 用 `uvx` 启动，比如官方的网页抓取 server：

```toml
[mcp.stdio_servers.fetch]
command = "uvx"
args = ["mcp-server-fetch"]
```

需要注入环境变量（比如 API key）时加一个 `env` 小节：

```toml
[mcp.stdio_servers.my_server]
command = "npx"
args = ["-y", "some-mcp-server"]

[mcp.stdio_servers.my_server.env]
API_KEY = "sk-xxx"
```

Bot 启动时会把这些进程拉起来，通过标准输入输出和它们通信。

<!-- VERIFY: npx/uvx 启动官方 filesystem、fetch server 为社区通用写法，包名请以对应 server 的官方文档为准 -->

</MethodTab>

<MethodTab value="webui">

1. 浏览器打开 WebUI（`http://127.0.0.1:8000/webui/frontend/`），进入「配置」页面，点顶部的「MCP 配置」标签。

![图片：WebUI 中的 MCP 配置页，三个标签页对应 config/mcp.toml 的三类服务器](/guide/webui/config-mcp.png)

2. 默认就在「Stdio 服务器」标签页。每个服务一张卡片，卡片上列着它的命令、参数、环境变量等字段。
3. 点「添加」按钮，在弹出的「添加 MCP 服务」对话框里填写（以接文件系统 server 为例）：

| 对话框字段 | 对应配置项 | 怎么填 |
| --- | --- | --- |
| 服务名称 | 服务名（key） | 自己起的代号，比如 `filesystem`，保存后不可修改 |
| 命令 | `command` | 启动命令，比如 `npx` / `uvx` |
| 参数 | `args` | 每行一个参数，比如 `-y` 一行、`@modelcontextprotocol/server-filesystem` 一行 |
| 环境变量 | `env` | 每行一个 `KEY=VALUE`，比如 `API_KEY=sk-xxx`，不需要就留空 |
| 系统指令 | `instructions` | 可选，帮 Bot 更懂怎么用这个服务 |
| 延迟加载 | `defer_loading` | 默认勾选；想让工具直接出现在主工具列表就取消勾选 |

![图片：添加 MCP 服务对话框，已按示例填好服务名称、命令和参数](/guide/webui/config-mcp-add-filled.png)

4. 点对话框右下角「添加」，新服务就会出现在卡片列表里，然后点右上角「保存」写入 `config/mcp.toml`：

![图片：添加完成后的 Stdio 服务器卡片，右侧有测试、编辑、删除三个按钮](/guide/webui/config-mcp-added.png)

</MethodTab>

</MethodTabs>

## 第二步：接一个远程服务（SSE / Streamable HTTP）

远程服务直接给个 URL 就行。两类远程服务配法一样，只是写在不同的节里——服务方给的是 SSE 地址就配 `sse_servers`，给的是 Streamable HTTP 地址就配 `streamable_http_servers`。

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

以 SSE 为例，最简写法直接给 URL 字符串：

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

表写法的字段：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `url` | 必填 | 服务的地址 |
| `headers` | | 请求头，比如放鉴权 token |
| `timeout` | SSE `5` / Streamable HTTP `30` | 建立连接的超时（秒），网络差就调大 |
| `sse_read_timeout` | `300` | 仅 SSE：读数据的超时（秒），一般不用动 |
| `instructions` / `defer_loading` | | 公共可选项，见上表 |

换成 Streamable HTTP 就是把节名换掉，字段一样：

```toml
[mcp.streamable_http_servers]
docs = "https://example.com/mcp"
```

::: warning 别重复定义
同一个服务名在文件里只能出现一次：上面「最简写法」和「表写法」是**二选一**，两种都写会导致配置解析报错「Cannot overwrite a value」。
:::

</MethodTab>

<MethodTab value="webui">

1. 在「MCP 配置」编辑器里切到「SSE 服务器」或「Streamable HTTP 服务器」标签页（看你服务的地址属于哪类）。
2. 点「添加」按钮，在弹出的对话框里填写：

| 对话框字段 | 对应配置项 | 怎么填 |
| --- | --- | --- |
| 服务名称 | 服务名（key） | 自己起的代号，比如 `weather`，保存后不可修改 |
| URL | `url` | 服务给的地址，比如 `https://example.com/sse` |
| 请求头 | `headers` | 每行一个 `KEY=VALUE`，比如 `Authorization=Bearer sk-xxx`，不需要就留空 |
| 超时(秒) | `timeout` | 建立连接的超时，默认 30，一般不用动 |
| 系统指令 | `instructions` | 可选，帮 Bot 更懂怎么用这个服务 |
| 延迟加载 | `defer_loading` | 默认勾选，一般不动 |

![图片：添加 SSE 服务对话框，已填入服务名称、URL 和请求头](/guide/webui/config-mcp-add-sse.png)

3. 点对话框右下角「添加」，再点右上角「保存」写入配置。

::: tip 表单里没有的字段
对话框只覆盖了常用字段。SSE 的 `sse_read_timeout` 之类的冷门字段，点右上角「代码模式」切到整份 `config/mcp.toml` 的 TOML 文本编辑器手动加，改完点「保存」，再点「表单模式」切回卡片视图，两边双向同步。
:::

</MethodTab>

</MethodTabs>

## 改完怎么生效、怎么验证

先说生效，再说验证。

- **WebUI 改的**：点「保存」后 WebUI 默认会**自动热重载** MCP 配置（设置里的「保存后自动热重载」默认开启），不用重启 Bot。改完没生效再重启一次。
- **手改文件的**：保存 `config/mcp.toml` 后**重启 Bot** 生效。

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

1. 重启 Bot，打开 `logs/` 目录下最新的日志文件，搜索 `mcp_manager`。看到这两行就说明成了：
   ```text
   已连接 MCP 服务器: filesystem
   已动态注册 MCP 工具: mcp_provider:tool:mcp-filesystem-list_directory
   ```
   如果 `[mcp]` 的 `enabled` 是 `false`，日志会提示「MCP 功能未启用」——这个总开关平时不用动，默认就是 `true`。

![图片：日志中的 MCP 连接成功记录，「已连接 MCP 服务器」与「已动态注册 MCP 工具」两行即为成功标志](/guide/mcp/mcp-log.png)

2. **工具的命名规则**是 `mcp-<服务名>-<工具名>`（统一转成短横线格式），比如服务名 `weather_server` 里的 `get_weather` 工具，就叫 `mcp-weather-server-get-weather`。
3. **在聊天里直接用**：比如接了文件系统 server 后，对 Bot 说「帮我看看 /home/yourname/mofox-files 里有什么文件」，看它会不会调工具。

</MethodTab>

<MethodTab value="webui">

1. 不用翻日志，**先点卡片上的「测试」按钮**：它会真的去连一次这个服务（stdio 类型会先检查命令是否存在，再拉起进程完成一次 MCP 握手），然后显示成功或失败、耗时多少毫秒和具体报错。配完先测一下，比重启之后才发现配错了强得多。

   ::: warning 测试 ≠ 保存
   「测试」只是临时连一次验证配置，不会把改动写入文件——测完记得点右上角「保存」。
   :::

2. 保存后热重载完成，就可以**在聊天里直接用**了：比如接了文件系统 server 后，对 Bot 说「帮我看看 /home/yourname/mofox-files 里有什么文件」，看它会不会调工具。
3. 想确认工具注册情况，也可以到「日志」页面搜 `mcp_manager`，工具的命名规则是 `mcp-<服务名>-<工具名>`。

</MethodTab>

</MethodTabs>

## 常见问题

### 提示 command not found（或测试按钮报「命令不存在」）

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

### WebUI 里保存了但 Bot 没用上工具

1. 确认点了右上角「保存」——有未保存改动时按钮才会亮；
2. 检查「保存后自动热重载」是否被关掉了（WebUI 的「设置」页），关了的话保存后需要手动重启 Bot；
3. 还不行就重启一次 Bot 再看日志——个别情况下运行中的组件握着旧配置引用，重启才彻底刷新。

配置好之后，Bot 的能力边界就取决于你能找到多少好用的 MCP server 了。装常规插件还是看 [安装插件](/docs/guides/plugins)；遇到问题去 [常见问题 FAQ](/docs/guides/faq)。

相关页面：

- [核心配置要点](/docs/guides/core-config)：配置怎么改、怎么生效
- [进阶模型配置](/docs/guides/advanced-model)：MCP 的工具调用依赖 `tool_use` 任务用的模型支持原生工具调用
- [WebUI 使用](/docs/guides/webui)：WebUI 的安装、登录和各页面导览
