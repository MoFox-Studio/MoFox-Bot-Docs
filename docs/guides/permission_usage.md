# 指令权限系统使用指南

## ⚠️ 首要步骤：配置你的主人 (Master User)！

在开始使用权限系统之前，**最重要、最优先**的一步是在你的机器人配置文件中设置 **Master 用户**。

### 什么是 Master 用户？

Master 用户是机器人的**最高管理员**，拥有所有权限，可以执行任何操作，不受权限系统的任何限制。你可以把它理解为机器人的“主人”。

### 为什么必须先配置 Master 用户？

*   **初始授权**：权限管理指令（例如 `/system permission grant`）本身是需要权限才能使用的。如果没有一个初始的最高权限用户，就没人能够分配权限，整个权限系统就无法启动。
*   **安全保障**：Master 用户是管理机器人的最终保障，确保你永远不会因为错误的权限配置而失去对机器人的控制。

在你完成 Master 用户的配置之前，请**不要**尝试使用任何权限管理指令，否则你只会收到“权限不足”的提示。

> **提示**: Master 用户的配置在 `config/bot_config.toml` 文件中完成。你需要找到 `[permission]` 部分，然后将自己的用户 ID 添加到 `master_users` 字段中。
>
> 下面是一个具体的配置示例：
>
> ```toml
> # config/bot_config.toml
>
> [permission] # 权限系统配置
> # Master用户配置（拥有最高权限，无视所有权限节点）
> # 格式：[[platform, user_id], ...]
> # 示例：[["qq", "123456"], ["telegram", "user789"]]
> master_users = [["qq", "123456789"]] # <--- 在这里填入你的平台和用户ID
> ```
>
> **请务必注意格式**：
> *   使用**双层**方括号 `[[...]]`。
> *   平台和用户 ID 都需要用**英文双引号** `""` 包裹。
> *   常见的平台名称有 `"qq"` 等。

---

## 什么是权限系统？

在你配置好 Master 用户之后，我们再来了解这个强大的权限系统。

机器人拥有一个精细的权限控制系统，可以控制谁可以使用哪些功能。这确保了机器人不会被滥用，并且只有授权用户才能执行敏感操作。

权限系统的核心是 **权限节点**。每个插件或功能都可以定义自己的权限节点，你可以把它们想象成一把把不同的“钥匙”。拥有某把“钥匙”（即被授予了某个权限节点）的用户，就可以使用对应的功能。

## 权限管理指令详解

作为 Master 用户，或已被授予权限的管理员，你可以通过 `/system permission` 系列指令来管理权限。

### 1. 授予与撤销权限

- **授予权限 (grant)**: 让某个用户可以使用特定功能。
  - **格式**: `/system permission grant <@用户或用户ID> <权限节点>`
  - **示例**: `/system permission grant @小明 plugin.music.play`

- **撤销权限 (revoke)**: 取消某个用户使用特定功能的权限。
  - **格式**: `/system permission revoke <@用户或用户ID> <权限节点>`
  - **示例**: `/system permission revoke @小明 plugin.music.play`

### 2. 查询与检查权限

- **查看权限 (list)**: 查看自己或他人拥有的所有权限。
  - **格式**: `/system permission list [@用户或用户ID]`
  - **示例**: 查看自己的权限 `/system permission list`，查看小明的权限 `/system permission list @小明`。

- **检查特定权限 (check)**: 检查某个用户是否拥有特定的权限节点。
  - **格式**: `/system permission check <@用户或用户ID> <权限节点>`
  - **示例**: `/system permission check @小明 plugin.music.play`

### 3. 工具指令

- **查看所有权限节点 (nodes)**: 查看机器人中所有可用的“钥匙”。
  - **格式**: `/system permission nodes [插件名]`
  - **示例**: 查看所有权限 `/system permission nodes`，只看音乐插件的 `/system permission nodes music`。

- **获取帮助 (help)**: 忘记指令时寻求帮助。
  - **格式**: `/system permission help`

## 常见问题

**Q: 我输入了指令，但机器人提示我“权限不足”，怎么办？**
A: 这意味着你没有执行该操作所需的“钥匙”（权限节点）。如果你是机器人的主人，请先检查是否已在配置文件中将自己设为 Master 用户。如果不是，你需要联系机器人的管理员，让他使用 `/system permission grant` 指令授予你相应的权限。

**Q: 我是管理员，该如何找到我需要的权限节点名称？**
A: 你可以使用 `/system permission nodes` 指令来查看所有可用的权限节点及其描述。通常，权限节点的名称都很有规律，例如 `plugin.插件名.功能名`。

**Q: 我不小心给错了权限怎么办？**
A: 不用担心，立即使用 `/system permission revoke` 指令将错误的权限撤销即可。
## 推荐权限配置流程

为了帮助你更好地理解和使用权限系统，这里提供一个推荐的操作流程：

```mermaid
graph TD
    A[开始：配置机器人] --> B{配置文件中是否已设置 Master User?};
    B -->|否| C[打开配置文件 config/bot_config.toml];
    C --> D[找到 master_users 字段];
    D --> E[填入你自己的用户ID];
    E --> F[保存配置文件并重启机器人];
    B -->|是| G[机器人正常启动];
    F --> G;
    G --> H[使用 /system permission 指令为其他管理员授权];
    H --> I[根据需要为普通用户授予特定功能权限];
    I --> J[完成权限配置];
    J --> K[结束：权限系统配置完成];
```