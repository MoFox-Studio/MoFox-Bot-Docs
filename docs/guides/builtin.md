# 内置插件一览

把 Neo-MoFox 跑起来之后，你其实已经拥有了 8 个官方内置插件——它们随核心仓库一起分发，clone 下来就有，不用单独安装。这个页面帮你把它们一次看明白：每个插件是干嘛的、平时怎么用、有哪些值得改的配置。

::: tip 看不懂某个词？
文中出现的 [TOML](/docs/guides/glossary#toml)、[VLM](/docs/guides/glossary#vlm)、[Embedding](/docs/guides/glossary#embedding)、[OneBot](/docs/guides/glossary#onebot) 等术语，都收录在[名词小课堂](/docs/guides/glossary)里，随时可以翻。
:::

## 插件配置在哪改？

所有插件的配置文件都在 `config/plugins/<插件名>/config.toml`，手动改文件、WebUI 表单两种改法，详见专门的[插件配置怎么改](/docs/guides/plugin-config)页。

## 速查表

| 插件 | 干嘛的 | 要不要配置 | 去哪看详情 |
| --- | --- | --- | --- |
| default_chatter | 默认聊天器，Bot 的"说话大脑" | 装好即用，可微调 | [深度文档](/docs/builtin_plugins/) |
| neo_default_chatter | 新一代事件驱动聊天器（默认关闭） | 想用再开 | [深度文档](/docs/builtin_plugins/) |
| onebot_adapter | OneBot 11 适配器，负责连接 QQ | **必填**：Bot 的 QQ 号 | [深度文档](/docs/builtin_plugins/) |
| booku_memory | 长期记忆 + 短期便签 | 建议检查模型任务 | [深度文档](/docs/builtin_plugins/) |
| emoji_sender | 让 Bot 收藏并发送表情包 | 装好即用，需要 VLM | [深度文档](/docs/builtin_plugins/) |
| skill_manager | 技能索引与按需加载 | 装好即用 | [深度文档](/docs/builtin_plugins/) |
| perm_plugin | 聊天框里管权限（`/权限`） | 零配置 | [深度文档](/docs/builtin_plugins/) |
| utility_commands | 实用运维命令（`/清空上下文`） | 零配置 | [深度文档](/docs/builtin_plugins/) |

> 下表「常用配置」里的字段名与配置文件一致，改法见[插件配置怎么改](/docs/guides/plugin-config)，改完重载或重启生效。


## default_chatter — 默认聊天器

**一句话定位**：Bot 的默认"说话大脑"，消息进来后由它决定回不回、回什么、要不要调用工具，是所有聊天能力的中枢。

**怎么用**：什么都不用做，它默认启用。你在群里 @ 它、私聊它，走的都是这套聊天器。想调整它在群聊/私聊里的"说话风格"，改配置里的场景引导文字就行。

**常用配置**（`config/plugins/default_chatter/config.toml`，均在 `[plugin]` 节）：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 是否启用插件 |
| `theme_guide.private` | 内置文案 | 私聊场景的额外提示词，教 Bot 在私聊里如何拿捏分寸 |
| `theme_guide.group` | 内置文案 | 群聊场景的额外提示词，让 Bot 像个正常群友一样参与 |
| `enable_sub_agent` | `true` | 群聊消息先经过一个轻量 [sub-agent](/docs/guides/glossary) 过滤，判断值不值得回复 |
| `enable_programmatic_controller` | `true` | 本地概率直通：被 @、被回复等强提及直接放行，省一轮 LLM 判定 |
| `enable_cooldown` | `true` | 回复后冷却生效；如果 Bot 经常"装死"太久，可以关掉 |
| `enable_interest_filter` | `false` | 兴趣值过滤：先给消息打兴趣分再决定回不回（见下方 details） |
| `enable_sub_agent_collaboration` | `false` | 子代理协作模式：把 MCP 工具委托给子代理执行 |
| `native_multimodal` | `false` | 原生多模态：图片直接进对话上下文，需 actor 模型支持看图 |

::: details 进阶：概率直通与兴趣值过滤
`[plugin.programmatic_probability]` 节控制"多大几率不经过 LLM 判定直接回复"：`base_bypass_probability`（基础放行率 0.1）、`name_mention_bonus`（被 @ 加成 0.7）、`alias_mention_bonus`（叫到名字加成 0.4）等。觉得 Bot 在群里太冷淡就调大，太话痨就调小。

`[plugin.interest]` 节在 `enable_interest_filter = true` 时生效：`reply_threshold`（回复阈值 0.72）、`semantic_weight` / `mentioned_weight`（语义与提及的权重 0.6 / 0.4）等。开启后插件会用最近的消息自动训练一个本地小模型（`[plugin.semantic_training]` 节可调采样与训练参数），不需要你额外准备什么。
:::

**需要额外条件吗**：需要 [model.toml](/docs/guides/glossary#toml) 里配置好 `actor` 模型任务（主对话模型），这是 Bot 能说话的前提，见[核心配置](/docs/guides/core-config)。兴趣值过滤的训练默认用 `utils` 任务标注，无需额外服务。


## neo_default_chatter — 新一代聊天器

**一句话定位**：事件驱动架构重写的聊天器（NDFC），把会话流程拆成一串可插拔的事件处理器，原生支持多模态，是 default_chatter 的"新版本"。

**怎么用**：它**默认关闭**。想尝鲜的话，把 `enabled` 改成 `true` 即可；两个聊天器建议只开一个，免得框架自动选择时行为不好预期。它的定位、提示词结构与 default_chatter 类似，但多了"模拟打字延迟"等细节体验。

**常用配置**（`config/plugins/neo_default_chatter/config.toml`）：

| 字段（`[plugin]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `false` | 是否启用（默认走 default_chatter） |
| `actor_task_name` | `actor` | 主会话使用的模型任务名 |
| `introduce` | 内置文案 | 系统提示词的引言板块，定义 Bot 的基本定位 |
| `theme_guide.private` / `theme_guide.group` | 内置文案 | 私聊 / 群聊场景引导 |
| `native_multimodal` | `false` | 图片以原图直接进上下文，跳过 VLM 转述（需模型支持看图） |
| `default_stop_minutes` | `5.0` | Bot 主动停止后的默认冷却分钟数 |
| `typing_delay_per_char` | `0.5` | 模拟打字延迟（秒/字符），设 0 关闭 |

| 字段（`[plugin.preprocess_sub_agent]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 群聊消息先由轻量 LLM 判定"值不值得回" |
| `task_name` | `sub_actor` | 判定用的模型任务，建议配个便宜快速的模型 |
| `decision_temperature` | `0.2` | 判定温度，越低越稳定 |

::: tip 概率直通也在
和 default_chatter 一样，NDFC 也有"被 @ 直通"的本地概率门，在 `[plugin.preprocess_probability_bypass]` 节：`base_bypass_probability = 0.1`、`name_mention_bonus = 0.7` 等，含义相同。
:::

**需要额外条件吗**：需要 `actor` 和 `sub_actor` 两个模型任务（后者用于消息判定，建议轻量模型）。目前版本号还比较低（0.2.0），属于新架构，求稳可以继续用 default_chatter。


## onebot_adapter — OneBot 11 适配器

**一句话定位**：Bot 与 QQ 之间的"翻译官"，通过 [OneBot 11](/docs/guides/glossary#onebot) 协议对接 SnowLuma、NapCat 等协议端，收发消息、图片、视频、戳一戳。

**怎么用**：装好协议端（官方 Docker 方案默认搭配 SnowLuma），然后必填 Bot 自己的 QQ 号和昵称，把两边连上即可。这是 8 个内置插件里唯一一个"不填就跑不通"的。
```toml

# config/plugins/onebot_adapter/config.toml
[bot]
qq_id = "123456789"        # Bot 的 QQ 号，必填
qq_nickname = "小狐狸"      # Bot 的昵称，必填

[onebot_server]
mode = "reverse"           # reverse=Bot 开服务端等协议端来连（默认）；direct=Bot 主动去连协议端
host = "127.0.0.1"
port = 8095                # SnowLuma 里反向 WebSocket 地址填 ws://<这台机器IP>:8095
access_token = ""          # 可选鉴权令牌
```

**常用配置**（`[features]` 节）：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `group_list_type` / `group_list` | `blacklist` / 空 | 群聊黑白名单：黑名单屏蔽指定群，白名单只接指定群 |
| `private_list_type` / `private_list` | `blacklist` / 空 | 私聊黑白名单，同理 |
| `ban_user_id` | 空 | 全局封禁的用户，所有消息直接忽略 |
| `enable_poke` | `true` | 处理"戳一戳"消息（Bot 被戳会有反应） |
| `enable_emoji_like` | `true` | 处理群聊表情回应消息 |
| `enable_reply_at` / `reply_at_rate` | `true` / `0.5` | 回复时按概率 @ 原消息发送者 |
| `enable_video_processing` | `true` | 下载并解析视频消息（`video_max_size_mb` 默认 100MB 上限） |
| `forward_image_threshold` | `5` | 转发消息里图片太多时用占位符，防止刷屏 |

**需要额外条件吗**：需要一个 OneBot 11 协议端（如 SnowLuma、NapCat）并保持在线；Python 依赖 pillow 会自动安装。连接排障见[常见问题](/docs/guides/faq)。


## booku_memory — Booku 记忆

**一句话定位**：Bot 的长期记忆系统。重要的事会被沉淀成一条条"记忆"，聊天时自动检索相关内容，让 Bot 记得住你是谁、聊过什么。

**怎么用**：不需要命令，全自动。Bot 在聊天中会自己调用 `memory_command` 工具来搜索、写入、更新记忆，也会用 `temporary_memo` 记短期便签（默认 2 小时自动过期）。你只要正常聊天，剩下交给它。另外它自带一个网页管理界面：浏览器打开 `http://127.0.0.1:<HTTP路由端口>/booku-memory`（端口是 core.toml 里的 `http_router_port`，默认 8000），可以直观查看和管理记忆条目。

**常用配置**（`config/plugins/booku_memory/config.toml`）：

| 字段（`[plugin]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `inject_system_prompt` | `true` | 在系统提示中注入记忆引导语，让 Bot 记得主动查记忆 |
| `memory_tool_miss_warning_threshold` | `6` | Bot 连续 6 轮没用记忆工具就提醒它一次 |

| 字段（`[retrieval]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `default_top_k` | `5` | 每次检索召回的记忆条数 |
| `deduplication_threshold` | `0.88` | 检索结果去重的相似度阈值 |

::: details 进阶：记忆闪回与启动导入
`[flashback]` 节是"记忆闪回"：聊天中按概率（`trigger_probability`）突然想起一条相关旧记忆，并带冷却时间（`cooldown_seconds`），让 Bot 偶尔"触景生情"。`[startup_ingest]` 节可以在启动时把指定目录里的文档（`paths`）批量导入为记忆/知识，适合一次性喂给它设定集、世界观资料。
:::

**需要额外条件吗**：是。记忆检索依赖 [embedding](/docs/guides/glossary#embedding) 模型任务，内部决策依赖 `tool_use` 模型任务——确认 model.toml 里这两项已配置（默认任务名已就位，填好模型即可），否则记忆功能基本不可用。数据保存在本地 SQLite 和 ChromaDB，不需要外部服务。


## emoji_sender — 表情包发送器

**一句话定位**：让 Bot 拥有自己的表情包库：定时"刷"到候选表情 → VLM 判断值不值得收藏并打上情感标签 → 聊天时按情绪和语义挑一张发出去。

**怎么用**：同样全自动。Bot 觉得气氛到位了就会自己调 `send_emoji_meme` 发表情，不需要命令。想让它多发，可以在配置的 `custom_instructions` 里写"在什么场景多用表情包"。

<!-- TODO-SCREENSHOT: QQ 群聊截图，Bot 回复一段文字后紧跟一张表情包图片，体现发送效果；需打码群号与成员昵称 -->

**常用配置**（`config/plugins/emoji_sender/config.toml`）：

| 字段（`[plugin]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `interaction_mode` | `direct` | `direct`=一步直达（自动挑一张就发）；`picker`=两段式（Bot 先看候选列表再亲自挑）。改后需重载插件 |
| `inject_system_prompt` | `true` | 在系统提示中注入表情包使用引导 |
| `sample_from_media_cache` | `true` | 从 `data/media_cache/emojis/` 随机抽候选入库；关掉则用你手动放进 `ingest.manual_memes_dir` 的图 |

| 字段（`[dedup]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 短时间内不重复发同一张 |
| `window` | `6` | 每个聊天流（见[名词小课堂](/docs/guides/glossary)）记住最近 6 张已发的表情 |

::: tip 想自己投喂表情包？
把 `sample_from_media_cache` 关掉，往 `data/emoji_sender/manual_memes/` 里放图，入库任务会自动让 VLM 标注收藏。不喜欢的表情直接删掉 `data/emoji_sender/memes/` 里的文件即可，数据库会自动清理。
:::

**需要额外条件吗**：需要 [VLM](/docs/guides/glossary#vlm) 和 embedding 两个模型任务。没配 VLM 或 embedding 时入库会被跳过，表情包库攒不起来，Bot 就无表情可发。入库节奏由 `[scheduler]` 节的 `interval_seconds`（默认 120 秒）控制。


## skill_manager — Skill 管理器

**一句话定位**：给 Bot 装"技能包"的入口：扫描本地 `skill/` 目录，把写有 SKILL.md 的技能登记造册，Bot 需要时自动读取对应技能说明书再干活。

**怎么用**：两层用法——

- **你（管理者）**：用 `/skill` 命令管理索引（仅 [owner](/docs/guides/glossary) 可用）：
  - `/skill list`（或 `/技能 列表`）——列出已登记的技能
  - `/skill refresh`——重新扫描 `skill/` 目录
- **Bot（AI）**：自动调用 `get_skill` / `get_reference` 工具按需加载技能内容，你不用管。

<!-- TODO-SCREENSHOT: 聊天界面截图，展示 /skill list 命令的输出：已索引技能名称与描述列表 -->

**常用配置**（`config/plugins/skill_manager/config.toml`）：

| 字段（`[manager]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `paths` | `["skill"]` | 扫描哪些目录找技能（子目录里有 SKILL.md 即算一个技能） |
| `inject_actor_reminder` | `true` | 在系统提醒中同步技能清单，让 Bot 知道自己会什么 |

| 字段（`[security]` 节） | 默认值 | 说明 |
| --- | --- | --- |
| `allow_script_execution` | `false` | 是否允许 Bot 执行技能自带脚本（`.py`/`.sh` 等） |
| `script_execution_permission_level` | `owner` | 执行脚本所需的调用者最低权限 |

::: warning 脚本执行默认关闭
`get_script` 能在子进程里真跑脚本（统一 15 秒超时保护）。看不懂的话保持默认关闭就好；要开，请确认技能来源可信，并留意 `script_execution_permission_level` 的权限门槛。
:::

**需要额外条件吗**：无模型依赖，装好即用。技能本身去哪找、怎么写，属于进阶玩法，见[内置插件深度文档](/docs/builtin_plugins/)。


## perm_plugin — 权限管理

**一句话定位**：在聊天框里直接管权限的命令工具，主人不用碰配置文件就能给谁升管理员、给谁开某个插件的权限。

**怎么用**：发 `/权限` 或 `/perm`（完全等价）。**只有 owner 能用**——owner 名单在 core.toml 的 `[permissions].owner_list` 里配置，格式为 `"平台:用户ID"`（如 `"qq:123456"`）。不确定插件名？先发 `/权限 插件` 看所有已注册插件。
```text

/权限 帮助                    # 查看帮助
/权限 查看 @某人               # 看某人的权限状态
/权限 设置 @某人 operator      # 提升为管理员
/权限 授权 @某人 插件名         # 允许某人使用某插件的全部命令
/权限 禁止 @某人 插件名         # 反之，禁止
/权限 重置 @某人               # 恢复默认权限
```

子命令中英文都认：`status/查看`、`set/设置`、`reset/重置`、`allow/授权`、`deny/禁止`、`clear/清除`、`list/名单`、`plugins/插件`、`help/帮助`。指定用户时直接 @ 对方，或手写 `qq:123456`。

<!-- TODO-SCREENSHOT: 聊天界面截图，展示 /权限 插件 或 /权限 查看 的命令输出：插件与命令列表或用户权限状态 -->

**常用配置**：无。权限级别全局分四档：`owner`（主人）> `operator`（管理员）> `user`（默认）> `guest`（访客）；更细的全局权限策略（如是否允许 operator 提升他人）在 core.toml 的 `[permissions]` 节，见[核心配置](/docs/guides/core-config)。

**需要额外条件吗**：无。


## utility_commands — 实用命令

**一句话定位**：运维小工具收纳箱，目前提供 `/清空上下文`：让 Bot 在某个聊天里"失忆"，从零开始积累对话。

**怎么用**：发 `/清空上下文`（仅 owner 可用，英文别名 `/clearctx`）：
```text

/清空上下文              # 清空当前聊天的上下文
/清空上下文 群            # 清空所有群聊的上下文
/清空上下文 群 123456     # 清空指定群
/清空上下文 私 654321     # 清空与某人的私聊
/清空上下文 全部          # 全部清空
```

注意：这只清空 Bot 的"对话上下文"，数据库里的消息记录不会删除，而且设置是持久的——重启后依然算数。Bot 疯起来停不下来、或者聊歪了想重开一局时特别好使。

**常用配置**：无。

**需要额外条件吗**：无。


## 下一步

- **想装更多插件**：看[插件市场使用](/docs/guides/plugins)，有 WebUI 一键安装、上插件市场下载 `.mfp` 包、安装本地插件包等方式（core.toml 的 `[plugin_market]` 节还能开启订阅自动下载与自动更新）。
- **某个插件行为奇怪**：先看对应插件深度文档（[内置插件总览](/docs/builtin_plugins/)），再翻[常见问题](/docs/guides/faq)。
