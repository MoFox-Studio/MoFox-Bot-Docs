#  [ 没更新的旧时代文档 ] MoFox-Bot 配置文件 (bot_config.toml) 究极详细指南

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

#### SQLite 配置 (当 `database_type = "sqlite"`)
-   `sqlite_path`: 数据库文件的路径。默认是 `"data/MaiBot.db"`，**通常你不需要动它**。

#### MySQL 配置 (当 `database_type = "mysql"`)
这部分只有在你选择 `mysql` 时才需要关心。
-   `mysql_host`, `mysql_port`, `mysql_database`, `mysql_user`, `mysql_password`, `mysql_charset`: 基础连接信息。
-   `mysql_ssl_mode`, `mysql_ssl_ca`, `mysql_ssl_cert`, `mysql_ssl_key`: SSL 加密连接相关的配置，有需要再研究。
-   `mysql_autocommit`, `mysql_sql_mode`: 高级配置，通常保持默认。
-   `connection_pool_size`: 连接池大小，简单来说就是性能优化，默认 `10` 够用了。
-   `connection_timeout`: 连接超时时间（秒）。

#### 数据库性能与缓存
-   `batch_action_storage_enabled`: **批量动作记录存储**。默认 `true`。开启后，机器人会将多个动作记录打包一次性写入数据库，提升性能，**保持开启就对了**。
-   `enable_database_cache`: **数据库查询缓存**。默认 `true`。开启后可以显著提升常用数据的读取速度，降低数据库压力。除非你的内存真的非常紧张，否则**强烈建议开启**。
-   `cache_l1_max_size`, `cache_l2_max_size`: L1（热数据）和 L2（温数据）缓存的大小。
-   `cache_max_memory_mb`: 缓存系统最大能占多少内存。

### [permission] - 权限系统：谁是主人？
-   `master_users`: **机器人管理员**列表。把你的账号加进去，你就能在机器人的权限系统“为所欲为”了。
    -   格式: `[["平台", "你的ID"]]`
    -   示例: `master_users = [["qq", "123456789"]]`
-   `[permission.master_prompt]`: **主人身份提示词**。
    -   `enable`: 开启后，LLM会根据对话的是不是主人，接收到不同的隐藏提示词。
    -   `master_hint`, `non_master_hint`: 分别是与主人和非主人对话时的提示。

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
-   `reply_style`: **说话风格**。描述它说话的习惯。
-   `safety_guidelines`: **安全与互动底线**。机器人必须遵守的原则，这是最高指令，任何情况下都不能违背。
-   `prompt_mode`: Prompt 模式，保持 `"s4u"` 即可，这是为本项目优化的模式。
-   `compress_personality`, `compress_identity`: **人格压缩**。开启后可以节省一点点资源，但可能会丢失人设细节。如果你的模型性能不错，建议都设为 `false` 以获得最佳拟人效果。

### [expression] - 表达学习：近朱者赤
让机器人模仿特定聊天对象的说话风格，变得更“接地气”。
-   `mode`: 表达学习的模式，`"classic"` 是经典随机模式，`"exp_model"` 使用机器学习模型，更智能。
-   `expiration_days`: 一个学到的表达方式如果太久没用，就会被忘掉。
-   `rules`: 一个学习规则列表，可以为不同的聊天（私聊/群聊）设置独立的规则。
    -   `chat_stream_id`: 聊天ID。格式为 `"platform:id:type"`。留空 `""` 表示全局配置。
    -   `use_expression`: 是否**使用**学到的表达。
    -   `learn_expression`: 是否**学习**新的表达。
    -   `learning_strength`: 学习强度，数值越大，学得越快。
    -   `group`: 表达共享组。在同一个组内的聊天会共享学习到的表达方式。

## 三、聊天交互：机器人的“情商”

### [chat] - 聊天通用设置
-   `allow_reply_self`: 是否允许机器人回复自己发出的消息。一般没人会跟自己说话吧？默认 `false`。
-   `max_context_size`: **记忆长度**。机器人能记住的最近对话数量。
-   `thinking_timeout`: **思考超时**（秒）。
-   `enable_message_cache`: **消息缓存**。开启后，正在处理消息时收到的新消息会先存起来，处理完再看，防止消息丢失。

#### 消息打断系统
-   `interruption_enabled`: **是否启用消息打断**。开启后，机器人在“思考”时如果收到新消息，有一定概率会放弃当前的回复，转而处理新消息。更像真人的反应，不是吗？
-   `allow_reply_interruption`: 是否允许在生成回复的过程中被打断。

#### 动态消息分发系统
-   `dynamic_distribution_enabled`: **是否启用动态消息分发**。开启后，系统会根据当前的聊天活跃度，智能地调整处理消息的频率，而不是傻乎乎地排队。可以提升高并发场景下的响应速度。
-   `max_concurrent_distributions`: 最大能同时处理多少个聊天流。
-   `enable_decision_history`: **决策历史**。让语言模型能看到自己之前的决策过程，有助于做出更连贯的反应。

### [message_receive] - 消息接收与过滤
-   `ban_words`: 屏蔽词列表。
-   `ban_msgs_regex`: 屏蔽消息的正则表达式列表。
-   `mute_group_list`: **静默群组**。在这些群里，只有被@或回复时，机器人オ会说话。

### [notice] - 系统通知消息处理
-   `enable_notice_trigger_chat`: 是否让戳一戳、拍一拍这类通知消息也和文字消息一样触发聊天。
-   `notice_in_prompt`: 是否在提示词里告诉机器人最近发生的通知事件。

### [anti_prompt_injection] - 人格防篡改系统
用于防止机器人被恶意指令攻击，也就是“催眠”。
-   `enabled`: 是否启用。
-   `process_mode`: 处理模式，`"strict"` (严格), `"lenient"` (宽松), `"auto"` (自动), `"counter_attack"` (反击)。
-   `whitelist`: 白名单，这些用户的消息将跳过检测。

### [mood] & [emoji] - 情绪与表情包
-   `[mood]`:
    -   `enable_mood`: 让机器人拥有喜怒哀乐，并影响它的回复。
    -   `mood_update_threshold`: 情绪更新阈值，越高，情绪变化越慢，性格越稳定。
-   `[emoji]`:
    -   `emoji_chance`: **发表情包的概率**。
    -   `emoji_activate_type`: 推荐设为 `"llm"`，让机器人智能地判断何时该发表情包。
    -   `steal_emoji`: **偷表情包**。
    -   `emoji_selection_mode`: **表情选择模式**。`"emotion"` 模式让大模型根据情感标签选，`"description"` 模式让大模型根据详细描述选。前者更自由，后者更精准。
    -   `max_reg_num`, `do_replace`: 收藏表情包的最大数量，以及满了之后是否替换旧的。
    -   `max_context_emojis`: 每次随机给大模型多少个表情备选。设为 `0` 就是把所有表情都给它看，可能会增加思考成本哦。
    -   其他均为高级配置，用于精细化管理表情包。    

## 四、核心记忆系统：机器人的“海马体”

新一代基于知识图谱和向量的混合记忆架构，**强烈建议全部开启**。

### [memory] - 记忆图系统
-   `enable`: **【核心功能】是否开启记忆**。
-   `search_top_k`: 检索记忆时返回的数量。
-   `search_similarity_threshold`: 相似度阈值，决定了哪些记忆是相关的。
-   `enable_query_optimization`: **查询优化**。使用小模型分析对话，生成更精准的搜索请求。
-   `consolidation_enabled`: **记忆整合**。自动去重合并相似记忆，并建立记忆之间的关联，让记忆形成网络。
-   `forgetting_enabled`: **自动遗忘**。模拟生物大脑的遗忘曲线，让机器人忘记不重要、不常用的信息。
-   `activation_decay_rate`: **激活度衰减**。记忆和人一样，不经常回想就会慢慢淡忘。

## 五、进阶能力：解锁更多“技能”

### [tool] & [web_search] - 工具与网络
-   `[tool]`:
    -   `enable_tool`: 是否在普通聊天中启用工具（如网络搜索、看视频等）。
-   `[web_search]`: **上网冲浪**。
    -   `enable_web_search_tool`: 让机器人可以搜索网络来回答你的问题。
    -   `enable_url_tool`: 让机器人可以直接“阅读”链接内容。
    -   `tavily_api_keys`, `exa_api_keys`, `metaso_api_keys`, `searxng_instances`, `serper_api_keys`: 需要填入第三方搜索服务的 API Key 或实例地址。
    -   `enabled_engines`: 启用的搜索引擎。
    -   `search_strategy`: 搜索策略，如 `"single"` (单个), `"parallel"` (并行), `"fallback"` (备用)。

### [voice] & [video_analysis] - 视听能力
-   `[voice]`:
    -   `enable_asr`: 开启后，机器人可以“听懂”语音消息。
    -   `asr_provider`: 语音识别提供商，可选 `"api"` 或 `"local"`。
-   `[video_analysis]`: **看视频**。
    -   `enable`: 开启后，你把视频发给它，它能“看懂”并告诉你视频内容。
    -   `rust_keyframe_threshold`, `rust_use_simd`...: **Rust 模块性能配置**。这些是用于视频抽帧的底层优化，使用 Rust 编写，性能极高。**保持默认即可享受**。
    -   `ffmpeg_path`: FFmpeg 可执行文件的路径。
::: tip
关于视频分析功能的详细配置和使用方法，请参考专门的 [视频识别功能配置指南](./video_recognition.md) 页面。
:::

### [lpmm_knowledge] - 本地知识库
-   `enable`: 是否启用本地知识库功能。这是一个高级功能，用于构建机器人的专属知识体系。

### [[reaction.rules]] & [custom_prompt] - 自定义回复
-   `[[reaction.rules]]`:
    -   可以定义多个规则块，基于 `keyword` (关键词) 或 `regex` (正则表达式) 触发固定回复。
-   `[custom_prompt]`:
    -   `image_prompt`: 用于图片描述的提示词。
    -   `planner_custom_prompt_content`: 用于决策器的自定义提示词内容。

### [response_post_process] - 回复后处理
-   `enable_response_post_process`: 总开关，启用下面的错别字和分割器。
-   `[chinese_typo]`: 开启后，机器人回复时会模拟真⼈，产⽣⼀些随机的、合理的错别字。
-   `[response_splitter]`: 开启后，会将过长的回复分割成多条消息发送。

## 六、高级自动化：让机器人真正“活”起来

这部分的配置是 MoFox-Bot 拟人化体验的精髓，它们让 Bot 从一个被动的应答工具，进化成一个拥有自己“生活节奏”、“情绪”和“社交能力”的虚拟伙伴。

### `[planning_system]` - 规划系统：拥有自己的“人生节奏”

赋予 Bot 制定个人计划的能力，让它拥有自己的“生活”。

#### **日程生成**
这就像 Bot 的每日课程表。开启后，它每天都会根据你的指导方针，为自己生成一份独一无二的日程。

-   `schedule_enable` (`true`/`false`)
:
    -   **作用**: 是否启用每日日程生成功能。
    -   **建议**: 设置为 `true`。这是提升 Bot 拟人化程度的关键功能，让它看起来每天都有自己的“事情”要做。
-   `schedule_guidelines`:
    -   **作用**: 你给 Bot 制定的“日程规划总纲”，它会严格按照你写的原则来安排自己的每一天。
    -   **怎么写**: 用自然语言告诉它你希望它的生活是什么样的，例如要求劳逸结合，学习、娱乐、休眠时间都要有。

#### **月度计划**
Bot 的长期目标系统，它会为自己设定一些需要在一个月内逐步完成的目标。

-   `monthly_plan_enable` (`true`/`false`):
    -   **作用**: 是否启用月度计划系统。
    -   **建议**: 如果你想让 Bot 有更强的成长感和目标感，就设置为 `true`。
-   `monthly_plan_guidelines`:
    -   **作用**: 月度计划的“最高指示”，Bot 会根据这里的原则来构思自己的月度目标。
-   `max_plans_per_month` (整数): 每个月最多生成多少个月度计划。
-   `avoid_repetition_days` (整数): 避免在多少天内，Bot 重复执行同一个月度计划下的活动。
-   `completion_threshold` (整数): 一个月度计划相关的活动被执行了多少次，就算这个计划“完成”了。

### `[cross_context]` - 跨上下文共享

-   `enable`: 总开关。
-   `s4u_mode`: **S4U 用户中心模式**。不再依赖于固定的共享组，而是以“用户”为中心，自动检索该用户在其他聊天中的发言作为上下文。更智能，更强大。
-   `[[cross_context.groups]]`: **共享组模式**。定义共享组，在同一个组内的聊天会共享上下文，主要供插件使用。


### `[affinity_flow]` - 兴趣流系统：Bot 的“情商”与“反应热度”

这个系统模拟了人类的“兴趣”，让 Bot 对不同消息的反应不再是千篇一律的“回复”，而是有选择、有热度的。

-   `enable_normal_mode` (`true`/`false`):
    -   **作用**: 兴趣流系统的总开关。启用后，Bot 会开始根据“兴趣分数”来决定是否要回应消息。
    -   **建议**: **强烈建议开启 (`true`)**，否则 Bot 会变回那个呆板的、每条消息都必定回应的传统机器人。

#### **兴趣评分系统：Bot 如何判断“我感不感兴趣？”**
每次收到消息，系统都会给这条消息打一个“兴趣分”，分数决定了 Bot 的反应。

-   `reply_action_interest_threshold` (浮点数):
    -   **作用**: **回复动作兴趣阈值**。兴趣分必须**高于**这个值，Bot **才会打字回复**。这是 Bot 的“兴奋点”。
    -   **建议**: 默认值 `0.9` 比较“高冷”，你可以适当调低，比如 `0.8` 或 `0.75`，让它更健谈。
-   `non_reply_action_interest_threshold` (浮点数):
    -   **作用**: **非回复动作兴趣阈值**。当兴趣分介于此值和回复阈值之间，Bot 不会打字，但可能**会做些“小动作”**，比如发个表情回应。这是 Bot 的“礼貌线”。
-   **关键词与权重**:
    -   系统会综合**关键词匹配度** (`keyword_match_weight`)、**是否被提及** (`mention_bot_weight`) 和**人物关系** (`relationship_weight`) 来计算总兴趣分。
    -   直接@Bot、回复它或私聊属于**强提及** (`strong_mention_interest_score`)，会大幅提高兴趣分，确保它一定会理你。在消息中提到它的名字属于**弱提及** (`weak_mention_interest_score`)。

#### **连续对话机制：如何让对话更流畅？**

-   `enable_post_reply_boost` (`true`/`false`):
    -   **作用**: **回复后阈值降低机制**。启用后，在 Bot 回复你之后的几条消息内，它的回复阈值会**临时降低**，让它更容易进行连续对话，模拟真实的“对话热度”。
    -   **建议**: **强烈建议开启 (`true`)**，能极大优化对话的连贯性。

### `[proactive_thinking]` - 主动思考：Bot 的“社交牛逼症”

让 Bot 在聊天冷场的时候，主动发起对话，打破僵局。

-   `enable` (`true`/`false`):
    -   **作用**: **主动思考功能的总开关**。
    -   **建议**: 想要一个会社交、不冷场的 Bot 吗？果断设置为 `true`。

#### **触发机制与频率**

-   `base_interval` (秒): Bot 内部“思考定时器”的基础间隔。
-   `use_interest_score` (`true`/`false`): **建议开启**。让 Bot 根据对当前聊天的“兴趣分”动态调整思考频率，在感兴趣的群更活跃。
-   `reply_reset_enabled` (`true`/`false`): **强烈建议开启**。Bot 被动回复后，会重置主动思考的定时器，避免在正常对话中突然插话。
-   `topic_throw_cooldown` (秒): 在 Bot 主动抛出一个话题后，会进入一段冷却时间，暂停主动思考，等待别人的回应。

#### **作用范围与策略**

-   `whitelist_mode` / `blacklist_mode`:
    -   **白名单模式**: Bot **只在**名单内的聊天中主动发言。
    -   **黑名单模式**: Bot **永远不会**在名单内的聊天中主动发言。
    -   **注意**: 不要同时开启两个模式。
-   `enable_time_strategy` (`true`/`false`):
    -   **时间策略**。开启后，可以让 Bot 在你设定的“安静时段”（如半夜）降低主动发言的频率。

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