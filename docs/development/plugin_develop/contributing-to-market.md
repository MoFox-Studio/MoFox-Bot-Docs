# 贡献插件到插件市场

把辛苦开发的插件发布到 [Neo-MoFox 插件市场](https://39.96.71.162/)，让更多用户一键安装、依赖和搜索，是参与社区共建最直接的方式。本文以 `mpdt` 为核心，串起从「插件就绪」到「市场可装」的完整贡献流程。

::: tip 阅读前置
本文假设你已经完成插件开发并了解 `mpdt` 的基本用法。如果还不熟悉，请先阅读 [MPDT 概述](../mpdt/index.md) 与 [安装指南](../mpdt/installation.md)。
:::

## 整体流程一览

贡献一个插件到市场，通常经过以下阶段：

```text
开发完成 ──► 静态检查 ──► 配置 Token ──► 发布到市场 ──► 持续维护
   │              │             │              │              │
plugin dev   plugin check   config edit   market publish   market package-update / yank
```

::: info 市场不托管插件包
插件市场只保存插件元数据、版本索引和审核状态，真正的 `.mfp` 包仍然通过你自己的 GitHub Release 分发。这意味着你对自己的代码和发布历史拥有完整控制权。
:::

## 前置要求

在开始发布之前，请确认以下条件已经满足：

### 1. 一个可发布的插件

确保插件满足 [manifest.json 格式说明](./manifest) 中的最小要求，且关键字段完整：

- `id` / `name` / `version` / `author`
- `categories`（必须是有效分类）
- `tags`
- `entry_point` 与版本声明（`api_version` 声明所用 API 模块版本；`min_core_version` 声明核心能力版本；按需填写，详见 [manifest.json 格式说明](./manifest.md)）

如果尚未创建插件，使用 [mpdt plugin init](../mpdt/commands/plugin/init) 一键生成标准结构。

### 2. GitHub 账号与 Token

- 一个 GitHub 账号，用于托管插件源码和 Release。
- 一个具有 `repo` 和 `write:packages` 权限的 Personal Access Token。

### 3. MPDT 已配置 Token

通过 [mpdt config edit](../mpdt/commands/config/edit) 写入 Token：

```bash
mpdt config edit github.token ghp_xxxxxxxxxxxxx
```

如果还未安装 `mpdt`，参见 [安装指南](../mpdt/installation.md)。

## 第一步：完成开发与自测

发布前，确认插件在本地能够正常加载和运行。推荐使用 `mpdt plugin dev` 进入热重载开发模式，保存即重载，快速迭代。

```bash
mpdt plugin dev
```

详见 [mpdt plugin dev - 开发模式](../mpdt/commands/plugin/dev)。

::: tip 建议的目录与文件
完善以下文件会让插件更受欢迎：

- `README.md` — 功能说明、安装方法、配置示例
- `LICENSE` — 选择 GPL-3.0 / MIT / Apache-2.0 / BSD-3-Clause 之一
- `manifest.json` — 完整的元数据
- `docs/` — 文档目录（可用 `--with-docs` 一并发布）
:::

## 第二步：运行静态检查

发布前必须通过 `mpdt plugin check` 的 8 层检查，建议带上 `--fix` 自动修复可处理的问题：

```bash
mpdt plugin check --fix --level info
```

如果出现无法自动修复的错误，请按报告提示手动修复后再继续。详细参数和检查层级参见 [mpdt plugin check](../mpdt/commands/plugin/check)。

::: warning 不要带 error 级别问题发布
市场中检索到包含错误的插件会严重影响用户信任。检查报告存在 `error` 级别问题时请勿继续发布。
:::

## 第三步：发布到市场

### 首次发布

使用 [mpdt market publish](../mpdt/commands/market/publish) 一键完成构建、Git 提交、GitHub 仓库创建、Release 上传与市场注册：

```bash
mpdt market publish --owner your-github-username --release-notes "首次发布"
```

`mpdt` 会自动完成以下步骤：

1. 读取并校验 `manifest.json`
2. 调用 `mpdt plugin build` 构建 `.mfp`
3. 校验 GitHub Token 与仓库权限
4. 创建/确认 GitHub 仓库
5. 初始化 Git、提交代码、打版本标签（如 `v1.0.0`）并推送
6. 创建 GitHub Release 并上传 `.mfp` 资产
7. 将插件元数据注册到插件市场

完整参数说明与常见问题（Token 权限不足、仓库冲突等）见 [mpdt market publish](../mpdt/commands/market/publish)。

### 验证发布

发布完成后，可以用 [mpdt market info](../mpdt/commands/market/info) 查询插件详情，确认版本已成功注册：

```bash
mpdt market info your-plugin-id
```

也可以用 [mpdt market search](../mpdt/commands/market/search) 在市场中检索：

```bash
mpdt market search your-plugin-id
```

## 第四步：持续维护

插件发布后，后续的迭代依然围绕 `mpdt` 命令展开。

### 发布新版本

修改代码后，按以下流程发布新版本：

```bash
# 1. 升级版本号（patch / minor / major）
mpdt plugin bump --type patch

# 2. 再次检查
mpdt plugin check --fix

# 3. 打包并发布新版本
mpdt market package-update --release-notes "修复若干 bug"
```

`mpdt market package-update` 会复用现有的 GitHub 仓库，创建新的 Release 和市场版本记录。详见 [mpdt market package-update](../mpdt/commands/market/package-update)。

### 废弃有问题的版本

当某个版本存在严重 bug 或安全漏洞时，使用 [mpdt market yank](../mpdt/commands/market/yank) 标记为废弃，已安装用户不受影响，但新用户无法安装：

```bash
mpdt market yank your-plugin-id 1.0.0 --reason "存在安全漏洞，请升级到 1.0.1"
```

::: danger 关于删除
[mpdt market delete](../mpdt/commands/market/delete) 会从市场移除插件及所有版本信息，是不可逆操作。除非确实需要彻底下线，否则优先使用 `yank` 废弃有问题的版本。
:::

## 最佳实践

### 1. 遵循语义化版本

借助 [mpdt plugin bump](../mpdt/commands/plugin/bump) 自动管理版本号：

| 变更类型 | bump 类型 | 示例 |
| --- | --- | --- |
| 仅修复 bug | `patch` | `1.0.0 → 1.0.1` |
| 新增功能、向下兼容 | `minor` | `1.0.0 → 1.1.0` |
| 破坏性变更 | `major` | `1.0.0 → 2.0.0` |

### 2. 编写高质量的 Release Notes

详细的 Release Notes 帮助用户决定是否升级：

```bash
mpdt market publish --release-notes "
## 新功能
- 添加天气查询功能
- 支持自定义城市

## Bug 修复
- 修复配置读取错误

## 改进
- 优化性能
"
```

### 3. 完善元数据

`manifest.json` 中的 `categories` 和 `tags` 直接影响插件在市场中的可发现性。请使用有效的分类和准确的标签，让目标用户能通过 [mpdt market search](./commands/market/search) 找到你的插件。

### 4. 配置 CI 自动检查

在 GitHub Actions 中集成 `mpdt plugin check`，确保每次提交都不引入新问题：

```yaml
# .github/workflows/check.yml
name: Plugin Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install mofox-plugin-dev-toolkit
      - run: mpdt plugin check --level error
```

## 发布检查清单

发布前逐项确认：

- [ ] 插件通过 `mpdt plugin check`
- [ ] `manifest.json` 字段完整且分类/标签有效
- [ ] 已配置 GitHub Token（`mpdt config edit github.token`）
- [ ] 版本号已通过 `mpdt plugin bump` 升级
- [ ] `README.md` 内容完善
- [ ] `LICENSE` 文件存在
- [ ] 插件功能已在本地测试通过

## 相关命令参考

贡献插件到市场涉及的核心 `mpdt` 命令：

| 阶段 | 命令 | 说明 |
| --- | --- | --- |
| 开发调试 | [mpdt plugin dev](../mpdt/commands/plugin/dev) | 热重载开发模式 |
| 静态检查 | [mpdt plugin check](../mpdt/commands/plugin/check) | 8 层静态检查 |
| 版本升级 | [mpdt plugin bump](../mpdt/commands/plugin/bump) | 语义化版本升级 |
| 构建打包 | [mpdt plugin build](../mpdt/commands/plugin/build) | 打包为 `.mfp` |
| 配置 Token | [mpdt config edit](../mpdt/commands/config/edit) | 写入 GitHub Token |
| 首次发布 | [mpdt market publish](../mpdt/commands/market/publish) | 一键发布到市场 |
| 查询详情 | [mpdt market info](../mpdt/commands/market/info) | 查看插件详情 |
| 搜索插件 | [mpdt market search](../mpdt/commands/market/search) | 在市场中搜索 |
| 发布新版本 | [mpdt market package-update](../mpdt/commands/market/package-update) | 更新已发布插件 |
| 废弃版本 | [mpdt market yank](../mpdt/commands/market/yank) | 标记问题版本为废弃 |
| 删除插件 | [mpdt market delete](../mpdt/commands/market/delete) | 彻底移除插件（慎用） |

## 相关文档

- [MPDT 概述](../mpdt/index.md)
- [安装指南](../mpdt/installation.md)
- [manifest.json 格式说明](./manifest)
- [插件结构与最佳实践](./structure)
- [参与 Neo-MoFox 项目贡献](../guidelines/CONTRIBUTE.md)
