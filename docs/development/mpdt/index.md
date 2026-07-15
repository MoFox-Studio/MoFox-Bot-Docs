# MPDT: 你的插件开发启动器

::: info 版本说明
本文档对齐 mofox-plugin-dev-toolkit v0.6.5 版本
:::

如果你正准备为 Neo-MoFox 开发插件，却被"第一步该干啥"卡住，那么 `mpdt` 就是你的救星。

`mpdt` (mofox-plugin-dev-toolkit) 是一个命令行工具，一个纯粹的脚手架，专为简化 Neo-MoFox 插件开发的全过程而生。它的使命只有一个：让你告别繁琐的手动配置，专注于核心逻辑的实现。忘记那些"该建什么目录"、"manifest 该怎么写"的烦恼吧，有这时间不如多摸会儿鱼。

## 核心特性

`mpdt` 把插件开发的生命周期浓缩为几个简单命令：

- **`plugin init`**: 一键生成标准插件结构，自带 10 种模板（basic、action、tool、collection、router、plus_command、event_handler、full、adapter、chatter），从"能跑就行"到"全家桶"任君选择。
- **`plugin generate`**: 快速生成 10 种组件代码（action、tool、event、adapter、plus-command、router、chatter、service、config、collection），始终生成异步方法，告别手写样板代码。
- **`plugin check`**: 8 层静态检查（结构、元数据、组件、导入、配置、类型、风格、自动修复），从目录结构到代码风格，全方位扫描你的插件，还能自动修复，堪称代码洁癖的福音。
- **`plugin build`**: 将你的插件打包成标准的 `.mfp` 文件（本质为 ZIP），支持 `mfp` 和 `zip` 两种格式。
- **`plugin dev`**: 启动热重载开发模式，基于 DevBridge 插件实现文件变化自动重载，让你享受现代前端开发般的丝滑体验。
- **`plugin bump`**: 语义化版本号升级，支持 major / minor / patch 三种类型。
- **`config`**: 交互式管理工具配置，再也不用满世界找配置文件了。
- **`depend`**: 依赖管理，支持 Python 包和 Neo-MoFox 插件依赖的添加、搜索、查看、移除和列出。
- **`market`**: 插件市场管理，支持一键发布、搜索、查看详情、更新版本、废弃版本和删除插件。

::: tip 🤖 AI 助手增强
MPDT 提供了 **Skill 文件** (`SKILL.md`)，让 GitHub Copilot、Cursor 等 AI 助手能按照最佳实践自动帮你执行完整的插件开发流程。查看 [AI Skill 安装指南](./skill-guide.md) 了解详情。
:::

## 快速开始：三分钟上手

想体验一下？只需三步，从零到拥有一个能跑的插件：

**1. 初始化项目**

选个你喜欢的目录，然后运行：

```bash
mpdt plugin init my-first-plugin --template full
```

`my-first-plugin` 就是你的插件目录，`--template full` 表示使用功能最全的模板。

**2. 进入开发模式**

```bash
cd my-first-plugin
mpdt plugin dev
```

`mpdt` 会自动找到你的 Neo-MoFox 主程序，并以热重载模式启动。现在，你可以随便修改插件里的代码，保存一下，看看控制台的变化。

**3. 检查与打包**

开发得差不多了？是时候让 `mpdt` 给你"体检"一下了。

```bash
# 运行检查，并尝试自动修复问题
mpdt plugin check --fix

# 升级版本号
mpdt plugin bump --type patch

# 检查通过，打包发布！
mpdt plugin build
```

`dist/` 目录下会生成一个 `.mfp` 文件，这就是你的插件成品。把它丢进 Neo-MoFox 的 `plugins` 目录，大功告成！

---

`mpdt` 的设计哲学是"约定优于配置"。它提供了一套经过验证的最佳实践，让你在正确的轨道上起步。当然，它也足够灵活，当你成为老司机后，可以完全定制自己的工作流。

::: tip 💡 想让 AI 帮你开发插件？
MPDT 提供了完整的 Skill 文件支持，让 GitHub Copilot、Cursor 等 AI 助手能够自动按照最佳实践执行开发流程。只需在对话中说"使用 MPDT 创建插件"，AI 就会帮你搞定一切。查看 [AI Skill 安装指南](./skill-guide.md) 了解如何启用。
:::

现在，让我们从 [安装](./installation.md) 开始，正式进入 `mpdt` 的世界。
