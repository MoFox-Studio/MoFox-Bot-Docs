# MoFox-Bot 配置文件 (bot_config.toml) 究极详细指南

哼，欢迎来到我的地盘，这份指南会像我一样，精准、高效、偶尔带点吐槽地带你完全掌握 `bot_config.toml` 这个文件。不管你是刚接触机器人的小白，还是想深度定制的极客，这里都有你想要的答案。记住，我们项目的核心是**高度拟人化**，所以接下来的所有配置，都是为了创造一个有“灵魂”的 Bot。

## 零、重要：如何拥有你的配置文件

想让机器人动起来？那你就得先给它一份名为 `bot_config.toml` 的“身份卡”。

**正确姿势如下**：
1.  找到项目里的 `template/bot_config_template.toml` 文件，**完整地**复制一份。别缺斤少两的。
2.  把复制出来的文件，丢到 `config/` 目录下面，然后把它改名为 `bot_config.toml`。
3.  打开这个新文件，跟着本指南，开始你的“创世之旅”吧。

::: tip 
模板文件里有所有必需的配置项，别自作主张乱删东西，尤其是你看不懂的。不然机器人闹脾气罢工了，可别怪我没提醒你。
:::


## 一、基础设定：机器人的“身份”与“大脑”

这部分是让机器人跑起来的基础，没这些，后面都是空谈。

### [database] - 数据库：记忆的存放地
这里决定了机器人的记忆、知识、还有它偷偷学到的小习惯都存在哪儿。

-   `database_type`: 数据库类型。
    -   `"sqlite"`: **强烈推荐新手使用**。简单、方便、开箱即用，就像个外置硬盘。数据库文件会放在 `sqlite_path` 指定的位置。
    -   `"mysql"`: 如果你有专业的服务器，想让机器人处理海量数据，那就选这个。当然，你得自己先去把 MySQL/MariaDB 服务器搭好。
-   `batch_action_storage_enabled`: **批量动作记录存储**。默认 `true`。开启后，机器人会将多个动作记录打包一次性写入数据库，而不是写一次就存一次。简单来说，就是提升性能，减少硬盘读写压力，**保持开启就对了**。

#### SQLite 配置 (当 `database_type = "sqlite"`)
-   `sqlite_path`: 数据库文件的路径。默认是 `"data/MaiBot.db"`，**通常你不需要动它**。

#### MySQL 配置 (当 `database_type = "mysql"`)
只有选择了 `mysql`，这部分才需要你来操心。
-   `mysql_host`, `mysql_port`: 你的 MySQL 服务器地址和端口。
-   `mysql_database`, `mysql_user`, `mysql_password`: 数据库名、用户名和密码。
-   `mysql_charset`: 字符集，默认 `"utf8mb4"`，支持 emoji。
-   `mysql_unix_socket`: Unix 套接字路径，一般用不上，留空就行。
-   `mysql_ssl_mode`, `mysql_ssl_ca`, `mysql_ssl_cert`, `mysql_ssl_key`: SSL 加密连接相关的配置，有需要再研究。
-   `mysql_autocommit`: 是否自动提交事务，默认 `true`。
-   `mysql_sql_mode`: SQL 模式，默认 `"TRADITIONAL"`。
-   `connection_pool_size`: 连接池大小，简单来说就是性能优化，默认 `10` 够用了。
-   `connection_timeout`: 连接超时时间（秒）。

### [permission] - 权限系统：谁是主人？
-   `master_users`: **机器人管理员**列表。把你的账号加进去，你就能在机器人的权限系统“为所欲为”了。
    -   格式: `[["平台", "你的ID"]]`
    -   示例: `master_users = [["qq", "123456789"]]`
:::tip
1. 这里的用户 ID 必须是字符串格式，哪怕是数字也要加引号。平台名称目前支持 `"qq"`。
2. 如果你想获取更多关于权限系统的信息,请参阅[权限系统使用指南](./permission_usage.md)。
:::


### [bot] - 机器人身份信息
-   `platform`: **【必填】** 机器人运行的平台，比如 `"qq"`。
-   `qq_account`: **【必填】** 你家机器人的 QQ 号。
-   `nickname`: 机器人的大名。
-   `alias_names`: 机器人的小名、外号。别人喊这些名字，它也会有反应。

### [command] - 命令配置
-   `command_prefixes`: 命令的起始符号。比如设成 `['/', '!']`，那 `/帮助` 和 `!帮助` 就都能用。

## 二、核心人格：注入“灵魂”

这部分是拟人化的灵魂所在，决定了机器人“是谁”以及“它如何说话”。

### [personality] - 人格与风格
这是你为机器人注入灵魂的地方！
-   `personality_core`: **人格核心**。一句话概括 TA 的性格，这是最关键的设定。例如：“是一个积极向上的女大学生”。
-   `personality_side`: **人格侧面**。对核心的补充，让性格更丰满。例如：“偶尔有点小迷糊，但对朋友非常真诚”。
-   `identity`: **身份信息**。更具体的设定，比如外貌、年龄、职业等。例如：“年龄19岁,是女孩子,身高为160cm,有黑色的短发”。
-   `background_story`: **世界观背景**。为机器人设定一个独特的背景故事，这部分内容会成为它的背景知识，但它不会主动复述。
-   `reply_style`: **说话风格**。描述它说话的习惯，例如：“回复可以简短一些。可以参考贴吧，知乎和微博的回复风格”。
-   `safety_guidelines`: **安全与互动底线**。机器人必须遵守的原则，这是最高指令，任何情况下都不能违背。
-   `prompt_mode`: Prompt 模式，保持 `"s4u"` 即可，这是为本项目优化的模式。
-   `compress_personality`, `compress_identity`: **人格压缩**。开启后可以节省一点点资源，但可能会丢失人设细节。如果你的模型性能不错，建议都设为 `false` 以获得最佳拟人效果。

### [expression] - 表达学习：近朱者赤
让机器人模仿特定聊天对象的说话风格，变得更“接地气”。
-   `rules`: 一个学习规则列表，可以为不同的聊天（私聊/群聊）设置独立的规则。
    -   `chat_stream_id`: 聊天ID。格式为 `"platform:id:type"`，例如 `"qq:123456:private"`。留空 `""` 表示全局配置。
    -   `use_expression`: 是否**使用**学到的表达。
    -   `learn_expression`: 是否**学习**新的表达。
    -   `learning_strength`: 学习强度，数值越大，学得越快。
    -   `group`: 表达共享组。在同一个组内的聊天会共享学习到的表达方式。

### [chat] - 聊天通用设置
-   `allow_reply_self`: 是否允许机器人回复自己发出的消息。一般没人会跟自己说话吧？默认 `false`。
-   `max_context_size`: **记忆长度**。机器人能记住的最近对话数量。
-   `thinking_timeout`: **思考超时**（秒）。控制一次回复最长需要多久时间才会被放弃，免得它卡住不动。

#### 消息打断系统
-   `interruption_enabled`: **是否启用消息打断**。开启后，机器人在“思考”时如果收到新消息，有一定概率会放弃当前的回复，转而处理新消息。更像真人的反应，不是吗？
-   `interruption_max_limit`: 每个聊天里最多能打断多少次，免得它一直被打断，一句话都说不出来。
-   `interruption_min_probability`: 最低的打断概率。就算聊得再嗨，也总有那么一丝可能被打断。

#### 动态消息分发系统
-   `dynamic_distribution_enabled`: **是否启用动态消息分发**。开启后，系统会根据当前的聊天活跃度，智能地调整处理消息的频率，而不是傻乎乎地排队。可以提升高并发场景下的响应速度。
-   `dynamic_distribution_base_interval`: 基础的分发间隔（秒）。
-   `dynamic_distribution_min_interval`, `dynamic_distribution_max_interval`: 最小和最大的分发间隔。
-   `dynamic_distribution_jitter_factor`: 来点随机性，让分发间隔不那么死板。
-   `max_concurrent_distributions`: 最大能同时处理多少个聊天流。

### [mood] - 情绪系统
-   `enable_mood`: 让机器人拥有喜怒哀乐，并影响它的回复。
-   `mood_update_threshold`: 情绪更新阈值，越高，情绪变化越慢，性格越稳定。

### [emoji] - 表情包系统
-   `emoji_chance`: **发表情包的概率**。
-   `emoji_activate_type`: 推荐设为 `"llm"`，让机器人智能地判断何时该发表情包。
-   `steal_emoji`: **偷表情包**。开启后，它会把别人发的有趣表情包收藏起来自己用。
-   `max_reg_num`, `do_replace`: 收藏表情包的最大数量，以及满了之后是否替换旧的。
-   `emoji_selection_mode`: **表情选择模式**。`"emotion"` 模式让大模型根据情感标签选，`"description"` 模式让大模型根据详细描述选。前者更自由，后者更精准。
-   `max_context_emojis`: 每次随机给大模型多少个表情备选。设为 `0` 就是把所有表情都给它看，可能会增加思考成本哦。
-   其他均为高级配置，用于精细化管理表情包。

## 三、核心记忆系统：机器人的“海马体”

这是机器人的核心记忆系统，非常复杂，但效果拔群。**强烈建议全部开启**。

-   `enable_memory`: **【核心功能】是否开启记忆**。开启后，机器人会记住对话内容，形成长期记忆。
-   `enable_vector_memory_storage`: **【推荐开启】** 使用专业的向量数据库来存储记忆，性能和扩展性远超旧的存储方式。
-   `enable_llm_instant_memory`, `enable_vector_instant_memory`: **瞬时记忆**。让机器人能更好地记住刚刚说过的话。两者都很重要。

#### 记忆采样系统：如何“记”
-   `memory_sampling_mode`: 记忆采样模式。`'immediate'`(即时采样) 更快，`'hippocampus'`(海马体定时采样) 更智能，`'all'`(双模式) 兼顾两者。
-   `enable_hippocampus_sampling`, `hippocampus_sample_interval`...: 海马体双峰采样策略的详细配置，它会模拟生物大脑，在不同时间尺度上回顾和巩固记忆。**新手保持默认**。
-   `precision_memory_reply_threshold`: 精准记忆回复阈值。高于这个值的对话会被立即记下来。

#### 智能遗忘机制：如何“忘”
-   `enable_memory_forgetting`: **【推荐开启】** 模拟生物大脑的遗忘曲线，让机器人忘记不重要、不常用的信息，避免记忆库无限膨胀。
-   `base_forgetting_days`, `min_forgetting_days`, `max_forgetting_days`: 基础、最小和最大的遗忘天数。
-   `critical_importance_bonus`, `verified_confidence_bonus`, `activation_frequency_weight`...: 各种影响遗忘的权重，比如重要的、确信的、经常被想起来的记忆会保存得更久。**新手保持默认**。

#### Vector DB 配置
-   `[vector_db]`: 向量数据库的具体配置。目前支持 `chromadb`。
    -   `type`: 数据库类型，目前是 `"chromadb"`。
    -   `path`: 数据库文件存放路径。
    -   `[vector_db.settings]`: ChromaDB 的一些内部设置。
    -   `[vector_db.collections]`: 定义不同的数据集合，用于存放不同类型的记忆数据。

## 四、进阶能力：解锁更多“技能”

这部分是机器人的“隐藏技能”，开启后会让它变得更强大、更智能。

### [message_receive] & [anti_prompt_injection] - 消息过滤与安全
-   `[message_receive]`:
    -   `ban_words`: 屏蔽词列表。
    -   `ban_msgs_regex`: 屏蔽消息的正则表达式列表。
-   `[anti_prompt_injection]`: **人格防篡改系统**，用于防止机器人被恶意指令攻击，也就是“催眠”。
    -   `enabled`: 是否启用。
    -   `process_mode`: 处理模式，如 `"strict"` (严格), `"lenient"` (宽松)。
    -   `whitelist`: 白名单，这些用户的消息将跳过检测。
    -   其他均为高级配置，通常无需修改。

### [tool] & [web_search] - 工具与网络
-   `[tool]`:
    -   `enable_tool`: 是否在普通聊天中启用工具（如网络搜索、看视频等）。
-   `[web_search]`: **上网冲浪**。
    -   `enable_web_search_tool`: 让机器人可以搜索网络来回答你的问题。
    -   `enable_url_tool`: 让机器人可以直接“阅读”链接内容。
    -   `tavily_api_keys`, `exa_api_keys`, `searxng_instances`: 需要填入第三方搜索服务的 API Key 或实例地址。
    -   `enabled_engines`: 启用的搜索引擎，可选 `"exa"`, `"tavily"`, `"ddg"`, `"bing"`。
    -   `search_strategy`: 搜索策略，如 `"single"` (单个), `"parallel"` (并行), `"fallback"` (备用)。

### [voice] & [video_analysis] - 视听能力
-   `[voice]`:
    -   `enable_asr`: 开启后，机器人可以“听懂”语音消息。需要额外配置语音识别模型。
-   `[video_analysis]`: **看视频**。
    -   `enable`: 开启后，你把视频发给它，它能“看懂”并告诉你视频内容。这是一个非常消耗资源的功能，并且需要正确配置FFmpeg。
    -   `rust_keyframe_threshold`, `rust_use_simd`...: **Rust 模块性能配置**。这些是用于视频抽帧的底层优化，使用 Rust 编写，性能极高。**保持默认即可享受**。
    -   `ffmpeg_path`: FFmpeg 可执行文件的路径。
::: tip
关于视频分析功能的详细配置和使用方法，请参考专门的 [视频识别功能配置指南](./video_recognition.md) 页面。
:::

### [lpmm_knowledge] - 本地知识库
-   `enable`: 是否启用本地知识库功能。这是一个高级功能，用于构建机器人的专属知识体系。
-   其他均为知识库的技术参数，**新手建议保持默认**。

### [keyword_reaction] & [custom_prompt] - 自定义回复
-   `[keyword_reaction]`:
    -   `keyword_rules`: 设置关键词触发的固定回复。
    -   `regex_rules`: 设置正则表达式触发的固定回复。
-   `[custom_prompt]`:
    -   `image_prompt`: 用于图片描述的提示词。
    -   `planner_custom_prompt_content`: 用于决策器的自定义提示词内容。

### [response_post_process] - 回复后处理
-   `enable_response_post_process`: 总开关，启用下面的错别字和分割器。
-   `[chinese_typo]`: 开启后，机器人回复时会模拟真⼈，产⽣⼀些随机的、合理的错别字。
-   `[response_splitter]`: 开启后，会将过长的回复分割成多条消息发送。

## 五、高级自动化：让机器人“活”起来

这部分是机器人的“全自动”和“可插拔”模块，让它更主动、更强大。

### [planning_system] - 规划系统
-   `schedule_enable`: **日程生成**。开启后，机器人会为自己安排每天的日程。
-   `monthly_plan_enable`: **月度计划**。开启后，机器人会为自己制定月度目标。
-   其他均为详细参数，可按需调整。

### [sleep_system] - 睡眠系统
-   `enable`: 开启后，机器人会模拟人的作息，在设定的时间“睡觉”。
-   `wakeup_threshold`: 控制机器人被“吵醒”的阈值。
-   `angry_prompt`: 被吵醒后生气时的人设。
-   `enable_insomnia_system`: **失眠系统**。机器人可能会因为“压力”等原因失眠。
-   `enable_flexible_sleep`: **弹性睡眠**。机器人不会到点就睡，会根据“睡眠压力”稍微推迟一会。
-   `enable_pre_sleep_notification`: **睡前晚安**。准备睡觉时会发一条消息。
-   其他均为睡眠和失眠系统的详细参数。

### [cross_context] - 跨上下文共享
-   `enable`: 开启后，可以让机器人在不同的群聊/私聊之间共享上下文。
-   `groups`: **共享组模式**。定义共享组，在同一个组内的聊天会共享上下文。
-   `s4u_mode`: **S4U 用户中心模式**。不再依赖于固定的共享组，而是以“用户”为中心，自动检索该用户在其他聊天中的发言作为上下文。更智能，更强大。
-   `maizone_context_group`: 定义QQ空间互通组，用于生成更相关的说说。

### [affinity_flow] - 兴趣流与关系追踪
这是一个复杂的系统，用于模拟机器人的“兴趣”和“人际关系”，决定了它对不同话题和用户的反应。
-   `reply_action_interest_threshold`...: 一系列兴趣阈值和权重，决定了机器人对什么样的话题“更感兴趣”。
-   `enable_relationship_tracking`: **【推荐开启】** 是否启用关系追踪系统。开启后，机器人会分析对话，尝试理解并记录它与每个人的关系。
-   其他均为高级参数，**新手保持默认**。

### [proactive_thinking] - 主动思考
-   `enable`: **【核心功能】主动找话题**。开启后，机器人在冷场时会自己找话题聊天，让聊天氛围不再尴尬。
-   `interval`, `interval_sigma`: 主动说话的基础间隔和随机浮动范围。
-   `talk_frequency_adjust`: **分时段活跃度**。可以设置机器人在不同时间段有不同的活跃度，实现“早C晚A”般的作息。
-   `enable_in_private`, `enable_in_group`: 分别控制是否在私聊和群聊中启用。
-   `enabled_private_chats`, `enabled_group_chats`: 指定只在哪些聊天中启用，为空则不限制。
-   `enable_cold_start`: 对于很久没聊过天的私聊对象，是否进行一次“冷启动”问候。

## 六、扩展与开发：连接“外部世界”

### [[mcp_servers]] - MCP 工具服务器
-   这是一个扩展功能，允许机器人连接外部的工具服务器，调用那里的工具来完成特定任务（比如操作文件、调用 Git 等）。
-   `name`: 服务器名称。
-   `url`: 服务器地址。
-   `enabled`: 是否启用。

## 七、系统与调试：幕后设定

这部分通常保持默认即可，主要供开发者使用。

### [log] - 日志配置
-   用于控制日志的输出格式、级别和颜色，方便排查问题。

### [dependency_management] - 插件依赖管理
-   `auto_install`: **【推荐开启】** 是否自动为插件安装所需的Python依赖库。
-   `use_mirror`, `mirror_url`: 使用国内镜像源加速下载。

### [debug] - 调试
-   `show_prompt`: 是否在日志中显示完整的prompt内容，用于调试人设,也用于发给开发者用。

### [maim_message] - 消息服务
-   用于连接自定义的消息服务器，**通常无需修改**。

---

好了，配置完成后，记得**保存文件**并**重启 MoFox-Bot**。去享受和你专属 Bot 的愉快时光吧！