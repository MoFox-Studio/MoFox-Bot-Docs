# 插件市场使用

装插件是让 Bot 变强的最快方式。这一页讲清楚：插件能干嘛、怎么从插件市场装（WebUI 里点几下，或者手动下载 `.mfp` 包），以及主程序和插件市场之间那些同步配置。装完怎么配置，见[插件配置怎么改](/docs/guides/plugin-config)。

## 插件能干嘛？

一句话：[插件](/docs/guides/glossary#插件)就是 Bot 的「功能扩展包」，装上之后 Bot 就多会一样本事。举几个真实存在的例子：

- **网页搜索**（`web_search_tool`）：让 Bot 联网查资料，支持 Exa、Tavily、DuckDuckGo、Bing、SearXNG 等一串搜索引擎；
- **B 站解析**（`bilibili_parser`）：丢个 B 站链接，Bot 帮你读出标题、UP 主、播放量；
- **语音回复**（`gpt_sovits_tts`）：接入 GPT-SoVITS，让 Bot 用语音回你消息；
- **表情包发送**（`emoji_sender`）：让 Bot 学会斗图；
- **URL 内容解析**（`url_parser`）、**AI 画画**（`nai_artist`）……更多去插件市场逛逛。

插件都装在 Bot 目录下的 `plugins/` 文件夹里。装法按下面的标签页二选一：喜欢自己下载文件的走**手动安装**，懒得动手就在 **WebUI** 里点几下。

## 安装插件

<MethodTabs dimension="plugin-install" :options="[
  { value: 'manual', label: '手动安装', icon: 'mdi:package-variant-closed', desc: '自己从市场下载 .mfp 包（或拿到现成的包），放进 plugins/ 目录' },
  { value: 'webui', label: 'WebUI 安装', icon: 'mdi:monitor-dashboard', desc: '在网页里浏览市场、点一下就装好，最省心' },
]">

<MethodTab value="manual">

手动安装适合不开 WebUI、或者想装市场之外插件（GitHub 源码等）的场景。装完的效果和 WebUI 装完全一样。按包的来源选下面的方式：

<MethodTabs dimension="plugin-manual" :options="[
  { value: 'market', label: '上插件市场下载', icon: 'mdi:store' },
  { value: 'local', label: '安装本地 .mfp 包', icon: 'mdi:file-download-outline' },
]">

<MethodTab value="market">

<PluginStats />

插件市场是官方的插件集散地：可以浏览、搜索、下载 `.mfp` 插件包，还能订阅更新。整套流程浏览器打开就能用，Bot 那边什么都不用装。

**打开市场，找到插件**

1. 浏览器打开[插件市场](https://39.96.71.162/)。第一次进入会先看到**「首次使用安全提示」**弹窗，仔细阅读后点右下角**「我已知悉」**；随后可能再弹一个公告弹窗，点**「知道了，不再提示」**即可进入首页。

![图片：插件市场首页](/guide/plugins/market-home.png)

2. 找插件：顶部搜索框按名称、作者或标签搜索；或点顶部导航**「推荐」「浏览」**按分类逛；已经拿到详情页链接的可以直接打开。
3. 进入插件详情页后，先核对这几样：插件名称和 ID 是不是你要的、作者是否可信、最新版本号和更新时间是否合理、简介 / 依赖 / 评论 / 评分是否符合预期，以及插件是否适配你当前的 Bot 版本。

**下载插件包**

4. 在详情页右侧的**「安装」**面板点**「下载插件」**，下载最新稳定版；想装指定版本就切到**「版本」**标签，点对应版本右侧的**「下载」**。（浏览器窗口比较窄时，「安装」面板可能跑到页面下方，向下滚动就能看到。）

![图片：插件市场详情页，右侧为「安装」面板](/guide/plugins/market-plugin-page.png)

5. 把下载到的 `.mfp` 包放进 Bot 目录下的 `plugins/` 文件夹，重启 Bot 生效（见下方「放进 plugins 目录之后」）。

**订阅更新（推荐，需登录）**

6. 回到详情页的**「安装」**面板点**「订阅更新」**，按钮变成**「已订阅」**即成功；订阅过的插件可在顶部导航**「我的」**集中查看。市场账号通过 **GitHub 登录**，见下方[主程序与插件市场的配置](#主程序与插件市场的配置)。订阅之后，配合主程序的市场同步配置可以实现订阅插件自动装回、自动更新。

   不想订阅也行——订阅按钮旁边的**「下载插件」**，以及**「版本」**标签里每个版本右侧的**「下载」**，随时都能把 `.mfp` 包拿到手，按第 5 步手动安装就行。

::: danger 安全提醒
插件市场中的插件由作者自行上传。安装前请确认插件名称、作者、简介、版本、依赖和评论，只安装你信任来源的插件。
:::

</MethodTab>

<MethodTab value="local">

从插件市场、插件作者的 GitHub Release 或别人分享处直接拿到了 `.mfp` 包时：

1. 把 `.mfp` 文件丢进 Bot 目录下的 `plugins/` 文件夹。
2. 重启 Bot。
3. 看启动日志，出现「在 …/plugins 中发现 N 个插件」就说明识别到了。

::: details 什么样的包能被识别？
`.mfp` 本质是 ZIP 包，包内**必须有 `manifest.json`**（放在包根级或一级子目录里都行）。缺清单的包不会被加载，日志会报「manifest.json 不存在」。
:::

::: details 拿到的是 .zip 压缩包或源码文件夹？
`.zip` 包同样直接放进 `plugins/`。拿到的是源码文件夹时，把**整个插件文件夹**（内含 `manifest.json`、`plugin.py` 等）复制进 `plugins/` 即可；以后升级就整个文件夹覆盖替换。不要把插件放进 `config`、`data`、`logs` 等目录。
:::

![把插件包或完整源码目录放入 Neo-MoFox/plugins 的路径示意](/guide/plugins/plugins-folder.svg)

</MethodTab>

</MethodTabs>

### 放进 plugins 目录之后

无论哪种手动方式，最后都是这两步：**重启 Bot → 看日志确认**。在 `logs` 文件夹里打开最新的日志文件，看到类似下面这样就是加载成功了：

```log
[21:58:25] plugin_manager | INFO | ✅ 插件 'xxxxxx' 的组件注册完成
[21:58:25] plugin_manager | INFO | ✅ 插件加载成功: xxxxx vX.X.X
```

恭喜，插件装好了，快去体验它带来的新功能吧！

</MethodTab>

<MethodTab value="webui">

最省心的方式。前提是 WebUI 已经装好并能打开（WebUI 本身也是一个插件，安装和访问方法见 [WebUI 指南](/docs/guides/webui)）。

1. 浏览器打开 WebUI（形如 `http://localhost:8000/webui/frontend/`，端口以你 `core.toml` 里 `[http_router]` 的配置为准），输入访问密钥登录。
2. 左侧导航进入**「插件市场」**页面：搜索或按分类浏览插件；列表里会标出每个插件**是否已安装、是否已加载、有没有新版本**。

![图片：WebUI 插件市场页](/guide/webui/plugin-market.png)

3. 点插件的**「查看详情」**进入详情页：这里能看到插件介绍和 README、依赖要求、版本历史，右侧的**「安装与本地状态」**面板会显示当前安装状态、和你 Bot 版本的兼容性、安装包大小。

![图片：WebUI 插件详情页，右侧为安装面板](/guide/plugins/market-plugin-detail.png)

4. 点**「安装」**（市场卡片上或详情页面板里都有）：WebUI 会弹出**「确认安装插件」**——列出插件名、版本、来源、安装包大小和注意事项，这一步不写入任何东西。
5. 确认没问题后点**「安装」**，WebUI 开始下载（`.mfp` 包会做 SHA-256 校验，超过 50MB 的包会被拒绝），页面会显示任务的当前阶段和进度。
6. 下载完成后会自动加载新版本；如果页面提示「请重启 Neo-MoFox 后生效」（更新已加载的插件时可能出现），重启一次 Bot 即可。拿不准的话，重启一遍总没错。

![图片：确认安装插件弹窗](/guide/plugins/market-install-dialog.png)

::: tip 安装开关
市场安装能力由 `install_enabled` 开关控制（WebUI 通过接口下发），当前版本默认开启。如果安装按钮置灰并提示「服务端已关闭市场安装功能」，先检查 WebUI 版本是否过旧。
:::

::: details 市场地址在哪改？
WebUI 的插件市场地址在 WebUI「设置」页里可以改，默认是官方市场的 API 地址 `https://39.96.71.162`。一般不用动它。
:::

</MethodTab>

</MethodTabs>

## 装完怎么配置？

所有插件的配置统一放在 `config/plugins/<插件名>/config.toml`，插件第一次被加载时会自动生成带注释的默认配置文件，不用手动建。改法（手动改文件 / WebUI 表单）详见[插件配置怎么改](/docs/guides/plugin-config)。

## 卸载与禁用

1. **卸载**：删掉 `plugins/` 目录下对应的 `.mfp` 文件或插件文件夹，重启 Bot。
2. **临时禁用**：改 `config/plugins/<插件名>/config.toml` 里 `[plugin]` 节的 `enabled = false`（大多数插件都支持），不用删文件。
3. **订阅插件要特别注意**：如果你配置过下方[主程序与插件市场的配置](#主程序与插件市场的配置)，Bot 启动时会自动和市场的订阅列表同步——默认会把**订阅了但本地没有**的插件自动装回来（`auto_install_subscribed_missing` 默认开），已安装的市场 `.mfp` 插件也会自动更新（`auto_update_mfp` 默认开）。所以光删文件，下次启动它可能又回来了：想彻底删，先去市场取消订阅，或关掉对应开关。
4. 想完全关掉市场同步：把 `core.toml` 里 `[plugin_market]` 的 `enabled` 设为 `false`。

## 主程序与插件市场的配置

**这节管什么**：主程序（Neo-MoFox 本体）和官方插件市场之间的连接配置——凭据（市场用户 ID、访问令牌）和几个自动同步开关，全部收在 `config/core.toml` 的 `[plugin_market]` 一节。

**不填也完全能用**：上面的几种安装方式都不依赖它。只有想用「订阅自动同步」——启动时自动把订阅的插件装回来、自动更新市场插件——才需要配一次。

### 第一步：在插件市场拿到凭据

浏览、下载插件不需要登录；要订阅更新、让主程序同步订阅，才需要先登录拿凭据：

1. 打开插件市场，点右上角**「GitHub 登录」**，在 GitHub 页面登录并授权后会自动跳回市场——右上角显示你的用户名就说明登录成功了。

![图片：通过 GitHub 登录插件市场](/guide/plugins/market-login.png)

::: tip 登录报 `GITHUB_OAUTH_FAILED` 怎么办？
登录后如果市场页面显示 `GitHub OAuth token exchange failed`（`bad_verification_code`）这样的错误，是授权码交换失败了——**重新点一次「GitHub 登录」再登一遍**通常就能进去；偶尔 GitHub 那边状态没缓过来，过一两天再试就自己好了。
:::

2. 点顶部导航栏的**「我的」**：页面顶部就是**「插件市场访问令牌」**区域；右侧用户卡里能看到你的**市场用户 ID**，格式是 `github:<你的 GitHub 用户名小写>`，点**「复制用户 ID」**可直接复制——它不是昵称，也不是邮箱。

![图片：「我的」页面的市场用户 ID 与访问令牌区域](/guide/plugins/market-me-token.png)

3. 还没有令牌就点**「生成令牌」**，页面会显示**「新令牌」**，点**「复制令牌」**；如果显示的是打码状态（形如 `mfox_Rdy...ToT0`），说明之前生成过，重新生成才能拿到令牌原文。

::: warning 令牌只在生成时完整显示
令牌形如 `mfox_xxxxxxxxxxxxxxxx`，生成后请立刻复制并妥善保存。粘贴时**不要**加 `Bearer ` 前缀，也**不要**加引号。它是「单活跃 token」：重新生成会让旧令牌立即失效；点了**「撤销」**，主程序就无法再从市场同步订阅。
:::

### 第二步：填进主程序

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

编辑 `config/core.toml`，找到 `[plugin_market]` 一节（每个字段上方都有注释），填入凭据后保存：

```toml
[plugin_market]
enabled = true
base_url = "https://39.96.71.162"
user_id = "github:你的GitHub用户名小写"
access_token = "mfox_粘贴你复制的令牌"
```

</MethodTab>

<MethodTab value="webui">

进入 WebUI 的**「配置」**页，切到**「插件市场」**分区，把用户 ID 和访问令牌填进对应输入框（其余保持默认），点**「保存」**：

![图片：WebUI 配置页的插件市场分区](/guide/webui/config-plugin-market.png)

</MethodTab>

</MethodTabs>

两种方式填的是同一份配置，改完都**重启 Neo-MoFox** 让配置生效（这一节在启动时读取）。

完整字段一览（一般只需要动 `user_id` 和 `access_token` 两项）：

| 字段 | 默认值 | 作用 |
|------|--------|------|
| `enabled` | `true` | 总开关。设为 `false` 完全跳过市场同步流程 |
| `base_url` | `https://39.96.71.162` | 插件市场地址，一般不用改 |
| `user_id` | 空 | 市场用户 ID（`github:用户名小写`），用于拉取你的订阅列表 |
| `access_token` | 空 | 市场访问令牌（`mfox_xxx`），与用户 ID 配对使用 |
| `auto_update_mfp` | `true` | 已安装的市场 `.mfp` 插件自动更新到新版本 |
| `auto_install_subscribed_missing` | `true` | 启动时自动装回「订阅了但本地没有」的插件 |
| `strict_subscribed_list_mode` | `false` | 严格订阅列表模式：开启后，启动时会把订阅列表**之外**的市场 `.mfp` 插件清掉（只清在市场里登记为已发布的 `.mfp`；文件夹插件、普通 `.zip` 和没有市场记录的插件不受影响） |
| `auto_resolve_plugin_dependencies` | `true` | 自动解析并补齐市场插件声明的依赖插件 |
| `timeout` | `20.0` | 市场请求超时时间（秒） |

### 怎么确认生效？

查看 `logs` 目录下最新的日志：

- 出现 `插件市场同步完成` —— 配置生效，订阅列表已同步。
- 出现 `已跳过（未配置市场用户 ID）` —— `user_id` 没填或填错。
- 出现 `已跳过（未配置访问令牌）` —— `access_token` 没填或填错。
- 出现 `Market access token is invalid` —— 令牌已被撤销或重新生成，回插件市场重新复制一份。

::: tip 哪些情况不需要令牌？
只有**已经安装到本地的 `.mfp` 插件**、且该插件已在插件市场登记，主程序才能在不配置访问令牌的情况下做更新检查。想同步你的市场订阅列表、自动下载订阅插件，仍然需要配置访问令牌。
:::

## 从哪里找插件？

- **官方插件市场**：入口 [39.96.71.162](https://39.96.71.162/)，WebUI 插件市场页浏览的就是这个市场（MoFox 官方唯一域名是 mofox-sama.com，其他相似域名均非官方）。
- **GitHub**：搜「mofox 插件」「mfp」等关键词，注意甄别来源。

::: warning 安全提示
插件是能跑**任意代码**的 Python 程序——一个恶意插件可以读写你的文件、偷走你的 API key。只装信任来源的插件：官方市场对插件有 SHA-256 校验和信任级别标注，但手动下载 `.mfp` 时没有这些保护，更要自己把好关。
:::

装好插件后想接入外部工具（文件系统、远程服务等），看看 [MCP 接入](/docs/guides/mcp)；遇到问题先翻 [常见问题 FAQ](/docs/guides/faq)。
