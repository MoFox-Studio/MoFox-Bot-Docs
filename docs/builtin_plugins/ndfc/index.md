# Neo-Default-Chatter（neo_default_chatter / NDFC）

NDFC 是 Neo-MoFox 的新一代聊天执行核心，定位为「可复用的会话逻辑中台」。它采用 **EventBus 事件驱动**架构，把会话流水线上的全部可替换 seam 都以事件形式暴露给第三方插件——订阅事件即可「换函数」，不再需要像 DFC 那样构造聚合 Protocol 适配器。

> 全名 **Neo-Default-Chatter**，插件标识 `neo_default_chatter`，简称 **NDFC**。
> 与同仓的 [`default_chatter` (DFC)](../dfc/) 是姐妹插件：DFC 走适配器模式，NDFC 走事件模式。

## 它能做什么

- **完整对话流程**：从拉取未读消息、构建 prompt、调用模型、执行工具，到发送回复，一条龙完成
- **四相状态机**：`WAIT_USER → MODEL_TURN → TOOL_EXEC → FOLLOW_UP`，行为一致可预测
- **事件化扩展**：全部 42 个 seam 通过 17 个 `neo_default_chatter:*` 事件暴露，第三方订阅即可替换或加料
- **内置预处理策略**：消息到达后先走「概率直通门」+「SubAgent 轻量 LLM 判定」，决定本轮是否值得主 chatter 立即响应
- **原生多模态**：图片可直接以 base64 形式打包进 LLM payload，跳过 VLM 文字识别环节
- **挂起 / 恢复 / 结束**：支持 `pass_and_wait`（挂起等恢复）、`stop_conversation`（结束本轮）等控制流
- **Stop 直接唤醒**：私聊或 @Bot 消息可按概率提前解除 stop 冷却
- **场景引导**：按私聊 / 群聊区分主题引导词，默认含详尽行为约束

## 它是给谁用的

NDFC 是 **Neo-MoFox 的可选聊天执行核心**。默认未启用（`enabled = false`）——你需要手动启用它（通常会同时关闭 DFC 以避免冲突）。

如果你是插件开发者，想替换 / 加料 NDFC 的某个内部环节（如自定义未读拉取、改写 system prompt、追加负面行为约束、定制冷却计算等），参考 [NDFC 开发指南 · 总览](./dev-guide/overview)。

## 启用 NDFC

NDFC 与 DFC 是同位替代关系，二者择一即可。典型切换步骤：

1. 在 WebUI「插件配置」中把 `default_chatter` 的 `enabled` 关闭
2. 把 `neo_default_chatter` 的 `enabled` 打开
3. 重启 / 热重载插件

也可以直接编辑配置文件：`config/plugins/neo_default_chatter/config.toml`。

## 配置说明

配置文件：`config/plugins/neo_default_chatter/config.toml`，也可在 WebUI 的「插件配置」中图形化编辑。

### `[plugin]` 插件设置

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `false` | 是否启用 NDFC（默认关闭，与 DFC 二选一） |
| `native_multimodal` | `false` | 原生多模态模式：图片直接 base64 打包进 LLM payload，跳过 VLM 识别环节。需确保 actor 模型支持多模态输入 |
| `image_placeholder_template` | `"[图片-{idx}]"` | 文本侧图片占位符模板，`{idx}` 为从 1 开始的序号，与请求体里的 base64 图片一一对应 |
| `enable_stop_direct_message_wake` | `false` | 是否允许私聊 / @Bot 消息按概率提前解除 stop 冷却 |
| `stop_direct_message_wake_probability` | `0.5` | stop 冷却期间收到私聊 / @Bot 消息时的提前唤醒概率（0.0~1.0） |
| `reinforce_negative_behaviors` | `true` | 是否在每轮 user 提示词的 extra 板块中再次强调负面行为约束 |
| `default_stop_minutes` | `5.0` | `stop_conversation` 工具未传入 `minutes` 时的默认冷却分钟数 |
| `enable_cooldown` | `true` | 是否启用回复后冷却。关闭可避免 LLM 设过长冷却导致无法回复 |
| `enable_action_suspend` | `true` | 是否启用纯 Action 回合的 SUSPEND 挂起机制。关闭后纯 Action 结果会像常规工具结果一样继续 follow-up |
| `actor_task_name` | `"actor"` | 主会话 LLM 任务名，对应 `config/model.toml` 中的 task key |

### `[plugin.theme_guide]` 场景引导

| 字段 | 说明 |
|------|------|
| `private` | 私聊场景的额外提示词 |
| `group` | 群聊场景的额外提示词 |

::: tip
默认引导词非常详尽（强调「关系判断」「分寸感」「不打扰」等行为准则），可按机器人人设自行修改或留空。
:::

### `[plugin.preprocess_probability_bypass]` 预处理 · 概率直通

控制 `neo_default_chatter:preprocess` 事件中的「概率直通处理器」（`ProbabilityBypassHandler`，weight=100）。
当随机值低于放行概率时直接放行给主 chatter，跳过 SubAgent LLM 判定；未命中则交给 SubAgent 处理器。

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 是否启用概率直通处理器。关闭后所有消息都会落入 SubAgent 判定 |
| `base_bypass_probability` | `0.1` | 本地概率直通的基础放行概率（每轮 tick 的起始概率，0.0~1.0） |
| `name_mention_bonus` | `0.7` | 强提及加成：未读消息精准 @机器人或回复机器人发言时叠加 |
| `alias_mention_bonus` | `0.4` | 弱提及加成：文本命中机器人全名或别名时叠加 |
| `unread_message_bonus` | `0.05` | 每条未读消息叠加的加成（累积值 = 未读数 × 该值） |

::: tip 概率公式
最终放行概率 = `min(1.0, base + 强提及数 × name_mention_bonus + 弱提及数 × alias_mention_bonus + 未读数 × unread_message_bonus)`
:::

### `[plugin.preprocess_sub_agent]` 预处理 · SubAgent 判定

控制 `neo_default_chatter:preprocess` 事件中的 SubAgent 处理器（`SubAgentDecisionHandler`，weight=50）。
当概率直通门未命中时，发起一次轻量 LLM 单轮判定，让模型决定本轮消息是否值得主 chatter 立即回复。

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enabled` | `true` | 是否启用 SubAgent 轻量 LLM 判定。关闭后概率直通门未命中时也会直接放行给主 chatter |
| `task_name` | `"actor"` | 判定请求使用的 LLM 任务名，对应 `config/model.toml` 中的 task key（建议指向轻量 / 低成本模型任务） |
| `request_name` | `"neo_default_chatter:preprocess:sub_agent_decision"` | LLM 请求名，用于统计与日志识别 |
| `max_context_messages` | `8` | 拼入判定 prompt 的最近历史消息条数上限。值越大越准但越耗 token；`0` 表示只看本轮未读消息 |
| `max_unread_messages` | `10` | 拼入判定 prompt 的本轮未读消息条数上限。超过会截断保留最近若干条 |
| `decision_temperature` | `0.2` | 判定请求的温度参数，越低判定越确定（建议保持较低温度以保证一致性） |

### 配置示例

```toml
[plugin]
enabled = true
native_multimodal = false
image_placeholder_template = "[图片-{idx}]"
enable_stop_direct_message_wake = false
stop_direct_message_wake_probability = 0.5
reinforce_negative_behaviors = true
default_stop_minutes = 5.0
enable_cooldown = true
enable_action_suspend = true
actor_task_name = "actor"

[plugin.theme_guide]
private = ""
group = ""

[plugin.preprocess_probability_bypass]
enabled = true
base_bypass_probability = 0.1
name_mention_bonus = 0.7
alias_mention_bonus = 0.4
unread_message_bonus = 0.05

[plugin.preprocess_sub_agent]
enabled = true
task_name = "actor"
request_name = "neo_default_chatter:preprocess:sub_agent_decision"
max_context_messages = 8
max_unread_messages = 10
decision_temperature = 0.2
```

## 与 DFC 的差异

| 维度 | DFC (`default_chatter`) | NDFC (`neo_default_chatter`) |
|------|-------------------------|------------------------------|
| 扩展模型 | 适配器（聚合 Protocol） | EventBus 事件订阅 |
| 第三方介入成本 | 实现多接口的 dataclass | 写一个 `BaseEventHandler` 子类 |
| 默认启用 | `true` | `false` |
| 预处理策略 | 程序化概率直通 | 概率直通 + SubAgent LLM 判定 |
| 多模态 | 走 VLM 识别 | 可选原生多模态 / VLM |
| 推荐场景 | 简单场景、旧插件兼容 | 新插件、需要深度定制会话流程 |

::: tip 选哪个？
- 已经在用 DFC 且没有强烈定制需求：继续用 DFC
- 想用事件化扩展、原生多模态、SubAgent 判定：用 NDFC
- 两者不能同时对同一个 stream 生效，切换前请关闭另一个
:::

## 相关文档

- [NDFC 开发指南 · 总览](./dev-guide/overview) — 面向开发者的 Service 接口与事件 Hook 体系

## 版本

- Plugin: `0.2.0`
- Manifest: `plugins/neo_default_chatter/manifest.json`
- min_core_version: `1.2.0-rc.2`
- api_version: `event_api`, `llm_api`, `send_api`, `prompt_api`, `stream_api`, `log_api`, `adapter_api`, `message_api`, `service_api`（均为 `1.0.0`）
