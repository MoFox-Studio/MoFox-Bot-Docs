# 核心配置要点

把 Bot 跑起来之后，你大概率会在某个时刻想：「我是不是该改改配置？」好消息是：**大部分配置保持默认就是最优解**。这一页只讲「必要且稳定、不常变」的那部分——主要就是给你自己发一张「主人通行证」，再把 WebUI 的门锁好。

Bot 的核心配置都写在 `config/core.toml` 里。[TOML](/docs/guides/glossary#toml) 是一种给人和机器都能读的配置文件格式，长这样：`配置节 = [节名]`，下面一行行 `字段 = 值`，`#` 开头的是注释。

::: tip 升级不用慌：配置会自动升级
Bot 启动时会自动检查配置文件和程序版本的「签名」是否一致（core_config.py 里的 auto_update 机制）。如果新版本加了新配置项，启动时会**自动把缺的项补全**，同时**保留你改过的值**——你写的昵称、你的主人名单都不会丢。所以放心升级，不用手动合并配置。
:::

## 两种改法：文件 or WebUI

同一个配置，改文件和改 WebUI 效果一样，选你顺手的方式：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

1. 用任意文本编辑器（记事本、VS Code 都行）打开 Bot 目录下的 `config/core.toml`。
2. 找到对应的 `[配置节]`，修改下面的字段。
3. 保存文件，重启 Bot 生效（见文末「改完怎么生效」）。

</MethodTab>

<MethodTab value="webui">

1. 浏览器打开 [WebUI](/docs/guides/glossary#webui)（默认地址 `http://127.0.0.1:8000`）。
2. 进入「配置」页面，找到和下文同名的配置节（比如「权限配置」对应 `[permissions]`）。
3. 在表单里修改、保存，重启 Bot 生效。

</MethodTab>

</MethodTabs>

## 权限配置 `[permissions]`

**这节管什么**：谁是这个 Bot 的「主人」。主人可以管理权限、执行管理类命令，是整个权限体系的顶点。

**新手要不要动**：要动一次——把你自己加进 `owner_list`，否则你没法以主人身份管理 Bot。

**怎么改**：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

在 `config/core.toml` 里找到 `[permissions]` 节：

```toml

[permissions]
# 主人列表，格式是 "平台:用户ID"
# QQ 平台就填 "qq:你的QQ号"，可以有多个主人
owner_list = ["qq:123456"]

# 新用户的默认权限级别，可选 owner / operator / user / guest
# 默认 "user"（普通用户），一般不用改
default_permission_level = "user"
```

保存后重启 Bot 生效（见文末「改完怎么生效」）。

</MethodTab>

<MethodTab value="webui">

1. 浏览器打开 WebUI（默认地址 `http://127.0.0.1:8000`），进入「配置」页面。
2. 找到「权限配置」分区，在「所有者列表」里添加 `"qq:你的QQ号"`。
3. 保存后重启 Bot 生效。

![图片：WebUI 权限配置分区，在所有者列表里添加主人](/guide/webui/config-permissions.png)

</MethodTab>

</MethodTabs>

两点说明：

- 格式是 `平台:用户ID`。QQ 用户就是 `qq:QQ号`；其他平台同理，比如 `"platform:用户ID"`。
- **operator（运营者，可以帮忙管人的中间层）不是写在配置文件里的名单**，而是由 owner 在运行时通过权限管理功能授予的。`[permissions]` 里还有 `allow_operator_promotion`、`strict_mode` 等开关，默认值已经很安全，新手不用碰。

## HTTP 路由 `[http_router]`

**这节管什么**：WebUI 和对外 HTTP 接口的总开关。WebUI 就是你在浏览器里管理 Bot 的网页界面，它能不能打开、开在哪个端口、要不要密码，都由这节决定。

**新手要不要动**：默认 `127.0.0.1:8000` 只监听本机，最安全。想换端口、或想让同一局域网的其他设备访问 WebUI 时才需要动。

**怎么改**：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

在 `config/core.toml` 里找到 `[http_router]` 节：

```toml

[http_router]
# 是否启用 HTTP 路由，默认开启
# 注意：关掉之后 WebUI 将无法使用
enable_http_router = true

# 监听地址。默认 127.0.0.1 表示只有本机能访问（最安全）
http_router_host = "127.0.0.1"

# 监听端口，默认 8000，被占用时可换一个（1~65535）
http_router_port = 8000

# WebUI API 访问密钥列表。留空 = 不启用认证（源码注明：不推荐）
api_keys = ["your-secret-api-key"]
```

</MethodTab>

<MethodTab value="webui">

1. 打开 WebUI 的「配置」页面，找到「HTTP 路由」分区。
2. 在表单里改监听地址、端口，或在「API 密钥列表」里设置访问密钥。
3. 保存后重启 Bot 生效。

![图片：WebUI HTTP 路由分区，可以改端口、设置 API 密钥（密钥已打码）](/guide/webui/config-http-router.png)

</MethodTab>

</MethodTabs>

::: warning 安全警告：对外开放就一定要上锁
把 `http_router_host` 改成 `"0.0.0.0"`（允许所有设备访问）时，**必须**设置足够强的 `api_keys`，否则等于把 Bot 的管理后台裸奔在网络上。

这不是吓唬人：Bot 启动时会自动检查这个组合（源码 `bot.py` 的 `_check_http_security`），一旦发现「监听 0.0.0.0 + 没设密钥（或用了 `123456`、`password`、`test-key` 这类示例密钥）」，会在日志里打出一大段醒目的安全警告，并**要求你按回车确认后才能继续启动**。要么设强密钥，要么改回 `127.0.0.1`。
:::

## Bot 基础配置 `[bot]`

**这节管什么**：日志、目录、主循环这些「基础设施」。

**新手要不要动**：基本不用动。最值得认识的是日志级别 `log_level`：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

在 `config/core.toml` 里找到 `[bot]` 节：

```toml

[bot]
# 日志级别，默认 INFO
# 排查问题时临时改成 "DEBUG" 能看到更详细的日志
log_level = "INFO"

# 目录类字段：默认值就是最合理的，别动
# plugins_dir = "plugins"   # 插件目录
# logs_dir = "logs"         # 日志目录
# data_dir = "data"         # 数据目录
```

</MethodTab>

<MethodTab value="webui">

打开 WebUI 的「配置」页面，找到「Bot 基础配置」分区，日志级别等字段都可以直接改：

![图片：WebUI Bot 基础配置分区](/guide/webui/config-bot.png)

</MethodTab>

</MethodTabs>

- **`log_level` 什么时候调**：平时保持 `INFO` 就好。当你发现某个功能「没反应」想找原因，或开发者让你提供详细日志时，临时改成 `"DEBUG"`；注意 DEBUG 日志量很大，排查完记得改回来。可选值：`DEBUG` / `INFO` / `WARNING` / `ERROR` / `CRITICAL`。
- **`plugins_dir` / `logs_dir` / `data_dir` 默认别动**：改了之后 Bot 会去新路径找插件和数据，老数据不会自动搬家，容易出「东西突然全没了」的假象。
- **日志会自动清理**，不用你手动删文件，相关默认值：`log_cleanup_enabled = true`（开启清理）、`log_max_age_days = 30`（超过 30 天的日志文件删掉，`0` 表示不按时间清理）、`log_max_files = 100`（日志目录最多留 100 个文件，超出删最旧的，`0` 表示不限制）、`log_cleanup_interval_hours = 1.0`（每小时清理一轮）。

## 插件依赖安装 `[plugin_deps]`

**这节管什么**：装插件时，Bot 会自动帮你安装插件声明需要的 Python 包，不用你手动敲安装命令。

**新手要不要动**：不用动。默认行为就很合理：

<MethodTabs dimension="config" :options="[{ value: 'file', label: '配置文件', icon: 'mdi:file-document-outline' }, { value: 'webui', label: 'WebUI', icon: 'mdi:monitor-dashboard' }]">

<MethodTab value="file">

```toml

[plugin_deps]
# 默认开启：插件加载前自动安装它声明依赖的包
enabled = true

# 安装依赖用的命令前缀，默认用 uv（速度快）；可选 "pip install"
install_command = "uv pip install"

# 只在缺包时才装，避免每次启动都重复安装
skip_if_satisfied = true
```

</MethodTab>

<MethodTab value="webui">

打开 WebUI 的「配置」页面，找到「插件依赖安装」分区：

![图片：WebUI 插件依赖安装分区](/guide/webui/config-plugin-deps.png)

</MethodTab>

</MethodTabs>

唯一可能动它的场景：你的环境里没有 `uv` 且自动安装一直失败，可以把 `install_command` 改成 `"pip install"` 试试。

## 插件市场 `[plugin_market]`

**这节管什么**：连接官方插件市场的订阅凭据（市场地址、用户 ID、访问令牌）和自动同步开关（订阅插件自动装回、`.mfp` 自动更新等）。

**新手要不要动**：不填也完全能用——手动装插件、在 WebUI 插件市场装插件都不需要它。只有想用「订阅自动同步」（启动时自动把订阅的插件装回来、自动更新）时才需要填一次：`user_id` 和 `access_token` 这对凭据在插件市场网站获取，在 WebUI「配置」页的「插件市场」分区里填，或改 `config/core.toml` 的 `[plugin_market]` 节（每个字段上方都有注释）。

还不知道从哪里获取 `user_id` 和 `access_token`？请先按 [插件市场使用指南：在插件市场拿到凭据](/docs/guides/plugins#第一步-在插件市场拿到凭据) 登录市场，再按 [填进主程序](/docs/guides/plugins#第二步-填进主程序) 完成配置。

这些开关的具体行为（比如「光删文件、下次启动插件又回来了」）和插件的安装、卸载直接相关，完整讲法见[插件市场使用](/docs/guides/plugins)的「卸载与禁用」。

在 WebUI 中进入「配置 → 机器人配置 → 插件市场」，对应输入框里填写市场用户 ID 和访问令牌，再点右上角「保存」。图中使用空的示例输入框；填写时以你自己的市场账号信息为准。

![WebUI 的插件市场配置分区：市场用户 ID、市场访问令牌输入框和右上角保存按钮](/guide/webui/config-plugin-market.png)

## 人格配置 `[personality]`

**这节管什么**：Bot 叫什么名字、什么性格、怎么说话——整个 Bot 的「灵魂」，也是你最值得花时间的地方。

**新手要不要动**：强烈建议动！但它内容较多，单独开了一篇：

👉 **[人设怎么写看这篇：人设指南](/docs/guides/persona)**

## 数据库 `[database]`

**这节管什么**：聊天记录、记忆这些数据存在哪。

一句话：**默认 SQLite（就是一个数据库文件，默认在 `data/MoFox.db`），开箱即用，个人使用完全够**。只有当你多台机器共用数据、或数据量大到 SQLite 吃力时，才需要把 `database_type` 换成 `"postgresql"` 并填写对应的连接信息（`postgresql_host` 等字段，文件里有注释）。

## 可以不管的配置

下面这些节保持默认即可，列出来说明它们存在、不是坏了：

| 配置节 | 管什么 | 什么时候才需要看 |
| --- | --- | --- |
| `[chat]` | 聊天细节：每个聊天流保留的历史消息数（默认 20 条）、自定义识图/表情包/视频识别提示词、媒体文件自动清理 | 想让 Bot「记性」更长，或想换识图提示词时 |
| `[llm]` | 默认模型调度策略：`load_balanced`（负载均衡）/ `round_robin`（轮询） | 一个任务配了多个模型、想换分摊方式时（见[进阶模型配置](/docs/guides/advanced-model)） |
| `[llm_stats]` | LLM 用量统计（存在 `data/llm_stats/` 下） | 想统计模型花销时 |
| `[telemetry]` | 本地遥测，默认关闭 | 基本不用管 |
| `[cloud_telemetry]` | 云端遥测客户端，默认开启，匿名上报运行状态帮助项目改进 | 介意的话可以关（`client_enabled = false`） |
| `[advanced]` | 高级网络与性能参数（系统代理、进程池大小等） | 遇到代理或兼容性问题、开发者让你改时 |

## 改完怎么生效

1. 保存配置文件（或在 WebUI 里点保存）。
2. **重启 Bot**。配置只在启动时读取一次，改完不重启是不生效的。
3. 启动后留意日志里有没有配置相关的警告（比如前面说的 HTTP 安全警告），有就按提示处理。

::: warning 改配置前，先备份
动手改配置（尤其是大改）之前，先复制一份 `config/core.toml` 存起来——万一改坏了，把备份放回去就能恢复。日常的备份该怎么做、备份哪些东西，见[日常维护](/docs/guides/maintenance)。
:::


下一步推荐：

- [人设指南](/docs/guides/persona)：给 Bot 一副好性格
- [进阶模型配置](/docs/guides/advanced-model)：换模型、省钱、接多家服务商
- [WebUI 使用](/docs/guides/webui)：不想碰文件？全程在网页里改
