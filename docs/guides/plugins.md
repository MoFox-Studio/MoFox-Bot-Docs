# 安装插件

装插件是让 Bot 变强的最快方式。这一页讲清楚：插件能干嘛、从哪装、不要了怎么删。装完怎么配置，见[内置插件一览](/docs/guides/builtin)的「插件配置在哪改」。

## 插件能干嘛？

一句话：[插件](/docs/guides/glossary#插件)就是 Bot 的「功能扩展包」，装上之后 Bot 就多会一样本事。举几个真实存在的例子：

- **网页搜索**（`web_search_tool`）：让 Bot 联网查资料，支持 Exa、Tavily、DuckDuckGo、Bing、SearXNG 等一串搜索引擎；
- **B 站解析**（`bilibili_parser`）：丢个 B 站链接，Bot 帮你读出标题、UP 主、播放量；
- **语音回复**（`gpt_sovits_tts`）：接入 GPT-SoVITS，让 Bot 用语音回你消息；
- **表情包发送**（`emoji_sender`）：让 Bot 学会斗图；
- **URL 内容解析**（`url_parser`）、**AI 画画**（`nai_artist`）……更多去插件市场逛逛。

插件都装在 Bot 目录下的 `plugins/` 文件夹里，下面四种途径任选一种。

## 安装途径

### 途径①：WebUI 插件市场一键安装（推荐）

最省心的方式。前提是 WebUI 已经装好并能打开（WebUI 本身也是一个插件，安装和访问方法见 [WebUI 指南](/docs/guides/webui)）。

1. 浏览器打开 WebUI（默认 `http://localhost:8000/webui/frontend/`，端口以你 `core.toml` 里 `[http_router]` 的配置为准）。
2. 进入「插件市场」页面，搜索或按分类浏览插件；列表里会标出每个插件**是否已安装、是否已加载、有没有新版本**。
3. 点进插件详情页，看看版本列表、依赖要求、和你当前 Bot 版本的兼容性，以及插件 README。
4. 点「安装」：WebUI 会先生成一份**安装计划**——检查所选版本、兼容性和依赖，这一步不写入任何东西。
5. 确认计划没问题后，点「确认安装」，WebUI 创建异步安装任务开始下载（`.mfp` 包会做 SHA-256 校验，超过 50MB 的包会被拒绝）。
6. 页面会自动轮询任务状态（排队中 → 进行中 → 成功/失败），显示当前阶段和进度百分比。
7. 安装完成后**重启 Bot** 才会生效。

![图片：WebUI 插件市场页](/guide/webui/plugin-market.png)

![图片：WebUI 安装计划确认弹窗](/guide/plugins/market-install-dialog.png)

::: tip 安装开关
市场安装能力由 `install_enabled` 开关控制（WebUI 通过接口下发），当前版本默认开启。如果安装按钮置灰，先检查 WebUI 版本是否过旧。
:::

::: details 市场地址在哪改？
WebUI 的插件市场地址在 WebUI「设置」页里可以改，默认是官方市场的 API 地址 `https://39.96.71.162`。一般不用动它。
:::

### 途径②：让 Bot 自己查市场装什么

Bot 自带一个 `mofox_market` 插件（随主仓库的 `plugins/` 目录提供），它给 Bot 提供了一个「插件市场搜索工具」，你可以直接在聊天里让 Bot 帮你查：

1. 「帮我搜搜市场里有没有搜索类插件」——Bot 调用搜索（`search`），按关键词、分类、标签找插件；
2. 「`web_search_tool` 这个插件详情是啥」——查详情（`detail`）；
3. 「它有哪些版本？推荐装哪个？」——查版本列表（`versions`）和推荐安装版本（`recommended`）；
4. 「给我它的安装信息」——获取下载链接等安装信息（`install`）。

::: warning 注意
这些都是**只读查询**，Bot 不会替你真的执行安装。拿到 `.mfp` 下载地址后，按下面的途径③手动安装。
:::

`mofox_market` 插件自己也有配置（`config/config.toml` 或 WebUI 里改）：市场服务地址、请求超时（默认 30 秒）、结果缓存（默认开，5 分钟）等。

### 途径③：手动安装 .mfp 包

从官方插件市场或插件作者的 GitHub Release 下载到 `.mfp` 包后：

1. 把 `.mfp` 文件（`.zip` 包同样支持）丢进 Bot 目录下的 `plugins/` 文件夹。
2. 重启 Bot。
3. 看启动日志，出现「在 …/plugins 中发现 N 个插件」就说明识别到了。

::: details 什么样的包能被识别？
`.mfp` 本质是 ZIP 包，包内**必须有 `manifest.json`**（放在包根级或一级子目录里都行）。缺清单的包不会被加载，日志会报「manifest.json 不存在」。
:::

![图片：把 .mfp 包放入 plugins 目录](/guide/plugins/plugins-folder.png)

<!-- TODO-SCREENSHOT: 文件管理器截图，展示 plugins 目录中 .mfp 包与文件夹插件混排的样子 -->

### 途径④：手动安装文件夹插件

从 GitHub 等地方拿到的是源码文件夹时：

1. 把**整个插件文件夹**（内含 `manifest.json`、`plugin.py` 等）复制进 `plugins/` 目录。
2. 重启 Bot 生效。以后升级就整个文件夹覆盖替换。

## 装完怎么配置？

所有插件的配置统一放在 `config/plugins/<插件名>/config.toml`，插件第一次被加载时会自动生成带注释的默认配置文件，不用手动建。改法（手动改文件 / WebUI 表单）见[内置插件一览](/docs/guides/builtin)的「插件配置在哪改」。

## 卸载与禁用

1. **卸载**：删掉 `plugins/` 目录下对应的 `.mfp` 文件或插件文件夹，重启 Bot。
2. **临时禁用**：改 `config/plugins/<插件名>/config.toml` 里 `[plugin]` 节的 `enabled = false`（大多数插件都支持），不用删文件。
3. **订阅插件要特别注意**：如果你在 `core.toml` 里配置过 `[plugin_market]`（市场地址、用户 ID、访问令牌），Bot 启动时会自动和市场的订阅列表同步：
   - 默认会把**订阅了但本地没有**的插件自动装回来（`auto_install_subscribed_missing` 默认开）——所以光删文件，下次启动它可能又回来了；想彻底删，先去市场取消订阅，或关掉这个开关；
   - 已安装的市场 `.mfp` 插件默认**自动更新**到新版本（`auto_update_mfp` 默认开）；
   - 「严格订阅列表模式」（`strict_subscribed_list_mode`）默认关闭；开启后，启动时会把**订阅列表之外**的市场 `.mfp` 插件直接清掉（只清在市场里登记为已发布的 `.mfp`；文件夹插件、普通 `.zip` 和没有市场记录的插件不受影响）。
4. 想完全关掉市场同步：把 `core.toml` 里 `[plugin_market]` 的 `enabled` 设为 `false`。

## 从哪里找插件？

- **官方插件市场**：正式地址 [market.mofox-sama.com](https://market.mofox-sama.com)（MoFox 官方唯一域名是 mofox-sama.com，其他相似域名均非官方）；WebUI 插件市场页浏览的就是这个市场。
- **GitHub**：搜「mofox 插件」「mfp」等关键词，注意甄别来源。

::: warning 安全提示
插件是能跑**任意代码**的 Python 程序——一个恶意插件可以读写你的文件、偷走你的 API key。只装信任来源的插件：官方市场对插件有 SHA-256 校验和信任级别标注，但手动下载 `.mfp` 时没有这些保护，更要自己把好关。
:::

装好插件后想接入外部工具（文件系统、远程服务等），看看 [MCP 接入](/docs/guides/mcp)；遇到问题先翻 [常见问题 FAQ](/docs/guides/faq)。
