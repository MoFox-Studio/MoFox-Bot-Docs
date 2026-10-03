# WebUI 安装与使用

::: tip 启动器用户：你可能已经装好了
如果你是用 **Neo-MoFox 启动器** 安装的，并且在安装向导的「可选组件」一步勾选了 **安装 WebUI（Web 管理控制台）**，那么 WebUI 已经自动装好、登录密钥也在那时设置过了——直接跳到「[打开 WebUI 并登录](#打开-webui-并登录)」开始用就行。

本页其余部分主要面向 **Docker、手动部署、安卓** 等自己动手安装的用户。
:::

**WebUI** 是 Neo-MoFox 的网页版管理后台（[名词小课堂：WebUI](/docs/guides/glossary#webui)）。就像路由器的管理页面一样：Bot 在后台跑着，你在浏览器里打开一个网页，点点鼠标就能查看状态、改配置、装插件、看日志，不用再手动编辑配置文件。

它以 [插件](/docs/guides/glossary#插件) 的形式接入 Neo-MoFox 框架，界面采用 Material Design 3 设计语言，桌面和手机浏览器都能用。

<!-- VERIFY: 以下 glossary 锚点（#webui、#插件 等）需与 glossary 页面实际标题对齐 -->

## WebUI 能干嘛？

- **仪表盘**：一打开就能看到 Bot 的运行状态和关键信息。
- **配置管理**：Bot 核心配置、模型配置、[插件](/docs/guides/glossary#插件) 配置都能在网页上改，不用手动编辑 TOML 文件。
- **插件管理与插件市场**：查看已安装的插件，直接在市场里浏览、安装新插件。
- **聊天测试**：网页里直接和 Bot 对话，调试回复效果不用开聊天软件。
- **LLM 指标**：查看模型调用的用量统计，花了多少 [Token](/docs/guides/glossary#token) 一目了然。
- **日志查看**：在网页上实时看 Bot 的运行日志，出问题好排查。
- **请求检查器**：把发给大模型的每次请求摊开来看，进阶调试利器。
- **个性化**：主题色、壁纸都能换，还支持从壁纸自动取色。

## 两种获取方式

按你的安装方式选一种即可，装好之后都进入「[打开开关](#打开开关-core-toml-的-http-router)」这一步。

### 方式一：启动器勾选（最省事）

用 Neo-MoFox 启动器安装时，在安装向导的「可选组件」一步：

1. 勾选 **安装 WebUI（Web 管理控制台）**。
2. 在 **WebUI / HTTP 路由访问密钥** 一栏设置一个至少 8 位的密钥（这就是之后的登录密码）。
3. 继续安装，启动器会自动从 GitHub Release 下载 WebUI 插件包放进 `plugins/` 目录。

![图片：启动器安装向导的可选组件区块，勾选「安装 WebUI」并设置 WebUI / HTTP 路由访问密钥](/guide/launcher/install-config-webui.png)

装完直接去「[打开 WebUI 并登录](#打开-webui-并登录)」。

### 方式二：Release 下载 .mfp 放进 plugins/

不使用启动器的用户，最简单的方法是下载现成的插件包：

1. 打开 WebUI 的 GitHub Releases 页面：`https://github.com/ikun-1145141/Neo-MoFox-Webui/releases`。
2. 下载**排在列表最上面**的那个版本——通常是个带 **Pre-release** 标签的 `-dev` 预发布版，别犹豫：WebUI 的正式版往往很久才发一次，最新的修复都在预发布版里。点开它的 **Assets** 附件区，找到以 **`.mfp`** 结尾的插件包并下载（`.mfp` 是 Neo-MoFox 的插件包格式）。
3. 把 `.mfp` 文件放进 Neo-MoFox 的 `plugins/` 目录，**保持文件名不变**（插件加载器靠文件名识别插件）。
4. 重启 Neo-MoFox。

![图片：WebUI 的 GitHub Releases 页面，排在最前面的是带 Pre-release 标签的 -dev 版本，展开它的 Assets 附件区即可下载 .mfp 插件包](/guide/webui/download-releases.png)

::: details 想改 WebUI 界面代码？
那需要走完整开发环境部署：克隆整个仓库、安装 Node.js、`npm install` 后用 `npm run dev` 启动前端开发服务器。这属于开发者玩法，普通用户用不到，详见 WebUI 仓库的 INSTALL.md。
:::

::: warning 版本要求
WebUI 插件要求 Neo-MoFox 核心版本不低于 **1.3.0-alpha.0**，太旧的框架版本装不上。
:::

## 打开开关：core.toml 的 [http_router]

WebUI 依赖 Neo-MoFox 的 **HTTP 路由** 功能——可以理解为 Bot 身上开的一扇「网页服务窗口」，浏览器就是从这个窗口访问 WebUI 的。它由 [core.toml](/docs/guides/glossary#配置文件)（Bot 的主配置文件）里的 `[http_router]` 一节控制：

| 配置项 | 默认值 | 作用 |
|---|---|---|
| `enable_http_router` | `true` | 总开关，默认就是开的。关了 WebUI 就用不了 |
| `http_router_host` | `"127.0.0.1"` | 监听地址，见下方说明 |
| `http_router_port` | `8000` | 监听 [端口](/docs/guides/glossary#端口) |
| `api_keys` | 空 | 登录密钥，下一节细说 |

1. 用记事本或任意代码编辑器打开 `config/core.toml`。
2. 找到 `[http_router]` 一节，按需修改（默认值其实已经能在本机用了）。
3. 保存文件，重启 Neo-MoFox——这一节的配置**只在启动时读取**，改完必须重启才生效。

关于 **`http_router_host`**（监听地址）：

- `"127.0.0.1"`：只允许这台电脑自己访问（默认，最安全）。
- `"0.0.0.0"`：允许局域网 / 公网的其他设备（比如手机）访问。想用手机管 Bot 就得改成这个。

::: details 为什么有的文档里端口写的是 8005？
以源码为准：core.toml 的默认端口是 **8000**，什么都不改的话访问 `http://localhost:8000` 就对了。Neo-MoFox-Webui 官方安装文档示例中用的 8005 只是它的推荐示例值（那个 8005 主要服务于「前端开发服务器」的固定代理设置，普通用户根本用不到开发模式）。**端口以你 core.toml 里填的数字为准**，浏览器访问同一个端口即可：填 8005 就访问 8005，保持默认就是 8000。
:::

## 设个门锁：api_keys 登录密钥

`api_keys` 就是 WebUI 的登录密码（[名词小课堂：API 密钥](/docs/guides/glossary#api-key)）。WebUI 掌控着 Bot 的一切——改配置、装插件、看聊天日志，所以必须设个门锁。

1. 打开 `config/core.toml`，在 `[http_router]` 一节找到 `api_keys`。
2. 填上一个**长随机字符串**，例如：
   ```toml

   [http_router]
   api_keys = ["my-bot-9f3k2x8qp7wz"]
   ```

3. 保存并重启 Neo-MoFox。

可以填多个密钥（列表形式），登录时输其中任意一个都行。

::: warning 千万别把没有门锁的 WebUI 暴露到公网
`api_keys` 留空 + `http_router_host` 改成 `0.0.0.0` 的组合，等于把 Bot 的全部控制权敞开给互联网上所有人：陌生人可以读你的聊天记录、改你的配置、拿你的 API 额度跑模型。

Neo-MoFox 本身也会防你一手：启动时检测到「对外开放 + 没有设置安全密钥」，会在日志里打出一大段安全警告并要求你确认后才继续。示例性质的密钥（比如 `test-key`、`default-key`、`demo-key` 这类）同样会被判定为不安全——请务必换成自己随机编的长密钥。
:::

## 打开 WebUI 并登录

1. 启动 Neo-MoFox，等它跑完启动流程。启动日志里出现类似 `HTTP 服务器已启动: http://127.0.0.1:8000` 的字样，就说明窗口开好了。
2. 打开浏览器（推荐 Chrome / Edge），访问：
   ```

   http://localhost:8000
   ```

   端口换成你 core.toml 里实际配置的数字。`localhost` 意思是「这台电脑自己」。
3. 在登录页输入你设置的 `api_keys` 中的任意一个密钥。
4. 点击 **登录**，进入 WebUI 主界面。

![图片：WebUI 登录页，输入访问密钥的界面](/guide/webui/login.png)

::: tip Docker 用户
如果你把 Bot 跑在 [Docker](/docs/guides/glossary#docker-与镜像) 里，注意容器端口要映射出来（例如 `-p 8000:8000`），否则宿主机的浏览器访问不到。
:::

## 功能导览

登录后左侧是导航栏，各页面都能在手机浏览器上正常使用。下面逐个认识一下。

### 仪表盘（首页）

进入 WebUI 的第一屏，汇总 Bot 的运行状态和关键信息，日常瞄一眼这里就知道 Bot 活得好不好。

![图片：WebUI 仪表盘首页，展示 Bot 运行状态概览](/guide/webui/dashboard.png)

### 配置管理

Bot 的核心配置、模型配置等都能在这里改：网页上给出带说明的表单，改完点 **保存**，不用再手动编辑 TOML 文件。想改 Bot 性格、换模型参数，都从这里动手。

![图片：WebUI 配置管理页，表单式的 Bot 配置编辑界面](/guide/webui/config-bot.png)

改完怎么生效？看下面的「[改完配置怎么生效](#改完配置怎么生效)」。

### 插件管理

查看已安装的插件列表和它们的启用状态，也能进入单个插件修改它的专属配置。

![图片：WebUI 插件管理页，已安装插件列表](/guide/webui/plugins.png)

### 插件市场

不用再手动下载文件——在市场里浏览可用的插件，看简介、点安装，WebUI 会自动搞定下载和启用。

![图片：WebUI 插件市场页，可浏览和安装插件](/guide/webui/plugin-market.png)

### 聊天测试

网页里直接和 Bot 聊天，实时看它的回复。调教好人设之后，先在这里试试效果，再放去正式的聊天平台。

![图片：WebUI 聊天测试页，与 Bot 对话的聊天窗口](/guide/webui/chat.png)

### LLM 指标

模型调用的统计面板：调用了多少次、消耗了多少 [Token](/docs/guides/glossary#token)，关心用量和开销的用户常来这看看。

![图片：WebUI LLM 指标页，模型调用用量统计](/guide/webui/llm-metrics.png)

### 日志

在网页上查看 Bot 的运行日志，还会实时滚动更新。Bot 行为不对劲时，先来这儿找线索。

![图片：WebUI 日志页，实时滚动的运行日志](/guide/webui/logs.png)

::: details 还有两个进阶页面
- **请求检查器**：把每次发给大模型的完整请求（系统提示词、上下文、参数）摊开检查，排查「Bot 为什么这么回」时非常有用。
- **插件 UI**：部分插件自带自己的网页界面，会在这里出现。
:::

## 改完配置怎么生效？

在 WebUI 里改配置，生效方式分两种情况：

1. **大多数配置：保存后自动热重载。** WebUI 支持热重载（[名词小课堂：热重载](/docs/guides/glossary#热重载)，即不关机重新读一遍配置）——保存后它会重新读取配置文件并应用到运行中的 Bot，不需要你手动重启。
2. **部分配置：需要重启 Bot。** 热重载的本质是「重新读盘 + 替换全局配置」，但 Bot 里一些已经启动的组件还握着旧配置的引用，不会自动刷新。这类改动保存后要重启 Bot 才彻底生效。

所以实用口诀是：**普通配置改完直接用；行为没变化就重启一次 Bot。** 重启可以直接在 WebUI 的系统操作里点重启（Bot 会自动拉起自己），或者回到命令行 / 启动器重启。

<!-- VERIFY: 「保存后自动热重载」的默认开启状态来自 WebUI 前端设置项 auto_reload_after_save 的代码兜底值（true），实际请以 WebUI 设置页显示为准 -->

::: warning 例外：[http_router] 改了必须重启
`enable_http_router`、`http_router_host`、`http_router_port`、`api_keys` 这几项在 Bot 启动时读取，并且只在启动时读取——改完一定要重启 Neo-MoFox，而且改了端口的话，重启后要用**新端口**访问。
:::

## 常见问题

### 浏览器打不开 WebUI

按顺序检查：

1. **Bot 在运行吗？** 命令行窗口（或启动器）里 Neo-MoFox 应处于运行状态，没崩、没停。
2. **开关开了吗？** core.toml 里 `enable_http_router` 应为 `true`。
3. **地址对不对？** 浏览器访问的端口要和 `http_router_port` 一致（默认 8000）。
4. **是不是从别的设备访问？** `http_router_host` 为 `"127.0.0.1"` 时只有本机能打开，手机访问请改成 `"0.0.0.0"` 并重启。
5. **防火墙放行了吗？** 本机防火墙、云服务器的安全组都要放行对应端口。
6. **插件装上了吗？** 启动日志里应有 WebUI 插件的加载信息；没有的话回到「两种获取方式」检查安装。
7. **端口被占用了？** 换一个 `http_router_port` 数字，重启后再试。

### 登录密钥忘了 / 提示密码错误

1. 打开 `config/core.toml`，在 `[http_router]` 一节查看 `api_keys`——密钥就明文写在那里。
2. 输入时注意：密钥**区分大小写**，前后不能带多余空格。
3. 不想要旧密钥了？直接把它改成新字符串，重启 Neo-MoFox，用新密钥登录。
4. 如果 `api_keys` 是空的，WebUI 会提示「服务未配置登录口令」——至少要配置一个密钥才能登录。

### 用手机访问 WebUI

1. 电脑上把 `http_router_host` 改成 `"0.0.0.0"`，重启 Neo-MoFox。
2. 查出电脑的局域网 IP：
   - Windows：命令提示符运行 `ipconfig`，看「IPv4 地址」（一般是 `192.168.x.x`）。
   - Linux / macOS：终端运行 `ip addr` 或 `ifconfig`。
3. 手机连到**同一个 Wi-Fi**，浏览器访问 `http://192.168.x.x:8000`（换成你的 IP 和端口）。
4. 如果打不开，检查电脑防火墙是否放行了 8000 端口。

::: warning 手机访问 = 局域网开放
改成 `0.0.0.0` 后，同一网络里的所有设备都能碰到 WebUI，请务必确认 `api_keys` 已设置强密钥。不要为了图方便把它直接暴露到公网。
:::

## 相关页面

- [常见问题 FAQ](/docs/guides/faq) —— 更多疑难杂症集中解答
- [更新与升级](/docs/guides/update) —— Bot 和插件的更新方法
- [插件市场使用](/docs/guides/plugins) —— 插件的安装与插件市场的完整介绍
