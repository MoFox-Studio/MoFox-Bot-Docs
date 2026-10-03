# 默认聊天器（default_chatter / DFC）

Neo-MoFox 的默认聊天组件，机器人收到消息后由它驱动整个对话回复流程。

## 它能做什么

- **完整对话流程**：从拉取未读消息、构建 prompt、调用模型、执行工具，到发送回复，一条龙完成
- **对话状态机**：内建四相状态机（等待用户 → 模型决策 → 工具执行 → 后续推进），保证对话行为一致
- **未读消息合并**：自动拉取、格式化并注入未读消息，保证对话上下文与平台消息状态一致
- **工具与 Action**：统一编排模型输出的工具调用，支持普通工具、Action、子代理混合
- **挂起 / 恢复 / 结束**：支持「等一下」（pass_and_wait）、「结束本轮」（stop_conversation）等控制流
- **子代理协作**：可启用主代理编排多个子执行单元
- **多模态**：可启用图片等内容直接进入会话输入
- **场景引导**：按私聊 / 群聊区分主题引导词

## 它是给谁用的

DFC 是 Neo-MoFox 的**默认聊天执行核心**。普通用户无需手动操作——机器人收到消息后会自动通过 DFC 完成回复。你只需要做好配置。

如果你是插件开发者，想在自己的插件里复用完整的聊天链路，参考 [DFC 开发指南](./dev-guide/overview)。

## 配置说明

配置文件：`config/plugins/default_chatter/config.toml`，也可在 WebUI 的「插件配置」中图形化编辑。

### `[plugin]` 插件设置

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 是否启用 DefaultChatter |
| `reinforce_negative_behaviors` | `true` | 是否在每轮提示词中再次强调负面行为约束 |
| `enable_cooldown` | `true` | 是否启用回复后冷却（关闭可避免 LLM 设过长冷却导致无法回复） |
| `enable_programmatic_controller` | `true` | 是否启用群聊本地概率直通（关闭后群聊始终经 LLM 决策） |
| `enable_action_suspend` | `true` | 是否启用纯 Action 回合的挂起机制 |
| `enable_sub_agent_collaboration` | `false` | 是否启用子代理协作模式。开启后主工具列表将隐藏 MCP 工具，改为通过 `create_agent`/`get_agent`/`kill_agent` 把指定工具和 MCP 能力委托给子代理 |
| `sub_agent_task_name` | `actor` | 子代理创建 LLM request 时使用的模型任务名（可配置独立任务如 `sub_agent_actor`） |
| `enable_sub_agent` | `true` | 是否启用 sub-agent 消息过滤。关闭后不使用 sub-agent 判断消息是否需要回复 |
| `enable_interest_filter` | `false` | 是否启用兴趣值消息过滤。与 Sub-Agent 同时开启时，先通过兴趣值初筛，再交给 sub-agent 判断 |
| `enable_sub_agent_context` | `true` | 是否为 sub-agent 提供历史上下文和决策记录，使其能感知话题连续性 |
| `sub_agent_context_history_limit` | `25` | sub-agent 上下文中包含的历史消息条数上限 |
| `sub_agent_decision_history_limit` | `3` | sub-agent 决策历史保留条数 |
| `enable_stop_direct_message_wake` | `false` | 是否允许私聊 / @Bot 消息按概率提前解除 stop 冷却 |
| `stop_direct_message_wake_probability` | `0.5` | 私聊 / @Bot 消息提前解除 stop 冷却的概率（0.0~1.0） |
| `native_multimodal` | `false` | 原生多模态模式：图片直接 base64 打包进 LLM payload（表情包仍走 VLM 识别以利用哈希缓存）。需确保 actor 模型支持多模态输入 |

### `[plugin.theme_guide]` 场景引导

| 字段 | 说明 |
|------|------|
| `private` | 私聊场景的额外提示词 |
| `group` | 群聊场景的额外提示词 |

::: tip
主题引导词默认提供详细的私聊 / 群聊行为约束，可以根据机器人人设自行修改。
:::

### `[plugin.programmatic_probability]` 程序化概率配置

仅在 `enable_programmatic_controller = true` 时生效。控制群聊中跳过 LLM 直接响应的概率：

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `base_bypass_probability` | `0.1` | 基础放行概率 |
| `name_mention_bonus` | `0.7` | 强提及加成：未读消息精准 @机器人或回复机器人发言时叠加 |
| `alias_mention_bonus` | `0.4` | 弱提及加成：文本命中机器人全名或别名时叠加 |
| `unread_message_bonus` | `0.05` | 每条未读消息叠加的加成 |
| `next_tick_reply_bonus` | `0.5` | 上一次 `send_text` 成功后，下一 tick 叠加的放行概率加成，用于提升连续对话的连贯性 |

### `[plugin.interest]` 兴趣值配置

仅在 `enable_interest_filter = true` 时生效。控制二维加权兴趣值（语义 + 提及）的权重、阈值和动态调整：

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `reply_threshold` | `0.72` | 回复动作兴趣阈值，达到则触发回复 |
| `action_threshold` | `0.55` | 非回复动作兴趣阈值 |
| `semantic_weight` | `0.6` | 语义兴趣度权重 |
| `mentioned_weight` | `0.4` | 提及分权重 |
| `strong_mention_score` | `2.0` | 强提及（被@、被回复、私聊）的兴趣分 |
| `weak_mention_score` | `0.8` | 弱提及（文本匹配名字/别名）的兴趣分 |
| `no_reply_threshold_adjustment` | `0.02` | 连续不回复时每次降低的回复阈值 |
| `max_no_reply_count` | `5` | 不回复计数上限 |
| `reply_cooldown_reduction` | `2` | 回复后减少的不回复计数 |
| `enable_post_reply_boost` | `true` | 是否启用回复后阈值降低机制，增强连续对话 |
| `post_reply_threshold_reduction` | `0.2` | 回复后第一轮降低的阈值 |
| `post_reply_boost_max_count` | `5` | 阈值降低持续的轮数 |
| `post_reply_boost_decay_rate` | `0.8` | 每轮衰减因子（1.0 不衰减，0.8 每轮衰减 20%） |

### `[plugin.semantic_training]` 语义模型训练配置

仅在启用兴趣值过滤时生效。控制自动训练流程中的数据采样、LLM 标注和关键词生成参数：

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `training_model_name` | `"utils"` | 训练阶段使用的 LLM 任务名（用更强的模型如 `actor` 标注可提升数据质量） |
| `training_days` | `7` | 采样最近 N 天的消息用于训练 |
| `training_max_samples` | `1000` | 训练时从数据库采样的最大消息条数（2000-3000 性价比最高） |
| `training_batch_size` | `50` | LLM 批量标注时每批的消息条数 |
| `keyword_iterations` | `3` | 关键词生成的迭代次数（每次约 100 条关键词） |
| `min_train_interval_hours` | `720` | 最小训练间隔（小时），默认 30 天；人设变化时不受此限制 |

配置示例：

```toml
[plugin]
enabled = true
reinforce_negative_behaviors = true
enable_cooldown = true
enable_programmatic_controller = true
enable_action_suspend = true
enable_sub_agent_collaboration = false
sub_agent_task_name = "actor"
enable_sub_agent = true
enable_interest_filter = false

[plugin.theme_guide]
private = ""
group = ""

[plugin.programmatic_probability]
base_bypass_probability = 0.1
name_mention_bonus = 0.7
alias_mention_bonus = 0.4
unread_message_bonus = 0.05
next_tick_reply_bonus = 0.5
```

## 相关文档

- [DFC 开发指南 · 总览](./dev-guide/overview) — 面向开发者的通用聊天服务接口
