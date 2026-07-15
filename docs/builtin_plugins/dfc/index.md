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
| `enable_sub_agent_collaboration` | `false` | 是否启用子代理协作模式 |
| `sub_agent_task_name` | `actor` | 子代理使用的模型任务名 |

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
| `name_mention_bonus` | `0.7` | 命中机器人昵称时的加成 |
| `alias_mention_bonus` | `0.4` | 命中别名时的加成 |
| `unread_message_bonus` | `0.05` | 每条未读消息叠加的加成 |

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

[plugin.theme_guide]
private = ""
group = ""
```

## 相关文档

- [DFC 开发指南 · 总览](./dev-guide/overview) — 面向开发者的通用聊天服务接口
