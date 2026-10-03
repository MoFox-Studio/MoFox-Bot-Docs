# 常见问题 FAQ

按类别整理了最常被问到的问题。每条都按「现象 → 原因 → 解决步骤」来写，先对照现象找问题。

::: tip 先学会看日志
绝大多数问题的答案都写在日志里。日志在 Bot 目录下的 `logs/` 文件夹，按时间命名（如 `mofox_20260801_120000_xxx_2026-08-01.log`），**找时间最新的那个**，用编辑器打开搜索关键词（报错一般有 ERROR 字样）。WebUI 里也有日志查看器。
:::

![图片：文件管理器打开 logs 目录，按时间命名的 mofox_*.log 日志文件列表，最新的一个已高亮](/guide/faq/logs-folder.png)
<!-- TODO-SCREENSHOT: 文件管理器截图，展示 logs 目录中按时间命名的 mofox_*.log 文件列表，高亮最新一个 -->

## 安装 / 启动类

### `uv` 不是内部或外部命令

- **现象**：运行 `uv run main.py` 或 `start.bat` 时报「'uv' 不是内部或外部命令，也不是可运行的程序」。
- **原因**：uv 没安装，或装了但不在系统 PATH 里。
- **解决步骤**：
  1. 用 `pip install uv` 或官方安装脚本安装 uv；
  2. 装完**重开一个终端**再试（PATH 不会立刻刷新）；
  3. 实在不想装 uv，也可以用 `python main.py`（需要 Python ≥ 3.11），并把 `config/core.toml` 里 `[plugin_deps]` 的 `install_command` 改成 `"pip install"`，插件依赖自动安装才能正常工作。

### Python 版本不对

- **现象**：启动时报语法错误、依赖安装失败，或提示 Python 版本不满足。
- **原因**：Neo-MoFox 要求 **Python 3.11 及以上**。
- **解决步骤**：
  1. 终端运行 `python --version` 确认版本；
  2. 低于 3.11 就去装新版 Python（或用 uv 自动管理：`uv run main.py` 会按项目要求选对版本）。

### 克隆仓库慢 / 失败

- **现象**：`git clone` 长时间无响应、中途断开或报网络错误。
- **原因**：访问 GitHub 的网络不通畅。
- **解决步骤**：
  1. 给 git 挂代理：`git config --global http.proxy http://127.0.0.1:7890`（端口换成你自己的）；
  2. 或者直接在仓库页面下载 ZIP 压缩包解压。

### 首次启动卡在协议确认

- **现象**：启动后打印一大段协议文字，停在那里等你输入；或在 Docker、服务器面板里直接退出。
- **原因**：首次启动需要你**在控制台确认 EULA 和隐私协议**，输入 `view` 看全文、`agree` 同意、`decline` 拒绝。非交互环境（Docker 无 `-it`、部分面板）读不到键盘输入，就会卡住或退出。
- **解决步骤**：
  1. 在能打字的终端里运行，输入 `agree` 即可，确认结果会记住，下次不再问；
  2. 自动化环境（Docker、CI）可以设置环境变量 `MOFOX_ACCEPT_STARTUP_AGREEMENTS`，跳过交互自动确认。

### 端口被占（8095 / 8000）

- **现象**：启动时报「address already in use」「端口被占用」，或协议端连不上。
- **原因**：两个常用默认端口被其他程序占了：**8095** 是 OneBot 适配器的默认端口（[SnowLuma](/docs/guides/glossary#snowluma)、[NapCat](/docs/guides/glossary#napcat) 等协议端通过反向 WebSocket 来连它），**8000** 是 HTTP 路由（WebUI）的默认端口。
- **解决步骤**：
  1. 找出占用进程：Windows 用 `netstat -ano | findstr 8095`，Linux 用 `lsof -i :8095`；
  2. 关掉占用进程，或改端口：
     - 8095 → `config/plugins/onebot_adapter/config.toml` 的 `[onebot_server]` → `port`；
     - 8000 → `config/core.toml` 的 `[http_router]` → `http_router_port`；
  3. 改完记得把协议端（SnowLuma / NapCat）那边的反向 WS 地址也改成新端口。

## 模型类

### 401 / 鉴权失败

- **现象**：日志里出现 401、Unauthorized、Invalid API key 等字样，Bot 不回话。
- **原因**：API key 错了、额度用完，或 `base_url` 填错。
- **解决步骤**：
  1. 打开 `config/model.toml`，检查 `[api_providers]` 里的 `api_key` 是否正确、有没有多余空格；
  2. 去服务商控制台确认 key 有效、额度没用完；
  3. 检查 `base_url` 是否完整（一般要带 `/v1`，如 `https://api.siliconflow.cn/v1`）；
  4. `client_type` 要和服务商匹配（Gemini 官方接口用 `gemini` 或 `aiohttp_gemini`，OpenAI 兼容接口用 `openai`）。

### 回复超时

- **现象**：Bot 长时间不回复，日志里出现 timeout 字样。
- **原因**：模型接口响应慢或网络不通。
- **解决步骤**：
  1. `config/model.toml` 里 `[api_providers]` 的 `timeout` 默认 30 秒，推理慢的模型可以调大；
  2. 同一节里还有 `max_retry`（默认 2 次）和 `retry_interval`（默认 10 秒）可调；
  3. 检查服务器网络和代理设置（见下面的「代理环境」）。

### GEMINI 内容审查报错

- **现象**：用 Gemini 模型时报错，错误信息含 safety、blocked、prohibited content 之类字样。
- **原因**：Gemini 的内容安全策略拦截了对话内容，群聊场景里特别容易触发。
- **解决步骤**：
  1. 让 Bot 使用的群聊内容避开敏感话题；
  2. 换一个模型或服务商试试（OpenAI 兼容接口一般没有这类拦截）；
  3. 部分中转服务提供关闭安全审查的选项，可查看你所用服务商的说明。

### 代理环境

- **现象**：模型请求、市场同步时好时坏，或开了代理后反而连不上。
- **原因**：`config/core.toml` 里 `[advanced]` 的 `trust_env` **默认开启**，httpx 会读取系统代理环境变量（`HTTP_PROXY`、`HTTPS_PROXY` 等）走代理。
- **解决步骤**：
  1. 代理不稳定时，要么把代理弄好，要么把 `trust_env` 设为 `false` 让请求直连；
  2. 插件市场同步也复用这个开关（`[plugin_market]` 的 `use_advanced_trust_env` 默认开）。

## QQ 类

### 扫码登录成功、不掉线，但 Bot 不回话

按顺序排查，最常见的是前两条：

1. **反向 WebSocket 没连上**：检查协议端的反向 WS 配置——SnowLuma 在「节点配置 → WS 客户端」，NapCat 在网络配置。反向 WS 地址应为 `ws://<Bot 主机 IP>:8095`（IP 和端口要和 Bot 侧 `config/plugins/onebot_adapter/config.toml` 里 `[onebot_server]` 的 `host`、`port` 一致，`mode` 保持 `reverse`）；Bot 启动日志里应有适配器连接成功的记录。
2. **qq_id 没填**：同一个文件的 `[bot]` 节里，`qq_id`（Bot 的 QQ 号）和 `qq_nickname` 是必填项，留空 Bot 不知道自己是谁。
3. **Bot 被禁言**：`mute_guard` 插件检测到 Bot 在群里被禁言时会暂时阻断回复，解禁后自动恢复——看看 Bot 是不是被群管理员禁言了。
4. **名单权限组不对**：同一配置文件的 `[features]` 节管着谁能触发 Bot：
   - 群聊默认 `blacklist` 模式：`group_list` 里的群**不**回复；
   - 私聊默认 `whitelist` 模式：只有 `private_list` 里的 QQ **才**回复；
   - 另有 `ban_user_id` 全局封禁名单，名单内用户一律不理。

反向 WS 连上之后，SnowLuma 的「节点配置 → WS 客户端」里会显示「已连接」，长这样（地址因部署方式而异）：

![图片：SnowLuma 节点配置中的 WS 客户端，反向 WebSocket 已连接](/guide/snowluma/snowluma_node_config.png)

### 频繁掉线

- **现象**：Bot 时而在线时而失联，或干脆反复掉线。
- **原因**：多半是协议端（SnowLuma / NapCat）自己掉线，其次是网络不稳定。

- **解决步骤**：
  1. 看协议端自身日志确认掉线原因（SnowLuma 的「日志」页 / NapCat 日志；账号风控、异地登录验证等要去 QQ 官方渠道处理）；
  2. 检查服务器网络：家用宽带、跨境服务器都容易断长连接；
  3. 反向 WS 由协议端发起，断开后一般会自动重连；若频繁重连失败，回到上一条检查地址和端口。

## WebUI 类

### WebUI 打不开

- **现象**：浏览器访问 WebUI 地址白屏、拒绝连接或超时。
- **原因**：路由没开、监听地址不对、端口被防火墙挡了。
- **解决步骤**：
  1. 确认访问地址：默认 `http://localhost:8000/webui/frontend/`，端口对应 `config/core.toml` `[http_router]` 的 `http_router_port`；
  2. 确认 `enable_http_router` 是 `true`；
  3. 从**别的设备**访问时，`http_router_host` 必须是 `0.0.0.0`（默认 `127.0.0.1` 只允许本机访问）；
  4. 服务器要放行对应端口（防火墙、云安全组）。

### 忘了 WebUI 的 api_keys

- **现象**：打开 WebUI 提示要密钥，自己不记得设过什么。
- **原因**：`config/core.toml` `[http_router]` 的 `api_keys` 里配了访问密钥。
- **解决步骤**：
  1. 打开 `config/core.toml`，看 `[http_router]` 节的 `api_keys` 列表；
  2. 想换就改成新值后重启 Bot；留空则关闭认证——**不推荐**，WebUI 能改所有配置，裸奔很危险。

## 插件类

### 插件装了不生效

- **现象**：把插件放进 `plugins/` 了，Bot 却没有新功能。
- **原因**：没重启、依赖没装上、清单文件有问题，或版本不兼容。
- **解决步骤**：
  1. **重启 Bot**——插件只在启动时加载；
  2. 看启动日志里插件名相关的报错：
     - 「manifest.json 不存在」或「缺少必需字段」：包不完整，重新下载（manifest 需要包含 name、version、description、author、dependencies、entry_point）；
     - 依赖安装失败：检查 `[plugin_deps]` 是否开启、`install_command` 用的 `uv pip install` 还是 `pip install`，必要时手动 `uv pip install <包名>`；
     - 「版本不兼容」：插件要求的 API 或核心版本比当前 Bot 新，升级 Bot 或换插件版本；
  3. 还是不行就带着日志去提问（见文末）。

### 市场同步失败

- **现象**：启动日志里 `plugin_market_sync` 报「已跳过」或请求错误；订阅插件没自动装上。
- **原因**：`[plugin_market]` 配置不全或网络不通——市场地址、用户 ID、访问令牌**缺一个整段同步就跳过**。
- **解决步骤**：
  1. 打开 `config/core.toml` 的 `[plugin_market]` 节，确认 `base_url`、`user_id`、`access_token` 三项都填了（令牌形如 `mfox_xxx`，在官方插件市场登录后生成）；

     <!-- VERIFY: 访问令牌的获取入口以官方插件市场站点的实际界面为准 -->
  2. 确认地址能访问（挂代理的话见「代理环境」）；
  3. 只想本地手动管插件，可以把 `[plugin_market]` 的 `enabled` 设为 `false`。


## 还没解决？

提问前先看这篇：[如何高效地提问](/docs/guides/misc/how-to-ask-questions-efficiently)——把现象、复现步骤、日志一起给出来，能省下大家来回猜的时间。

也可以加入 QQ 交流群：**169850076**。
