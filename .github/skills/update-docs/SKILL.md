---
name: update-docs
description: '更新 MoFox-Bot-Docs 文档站点内容。Use when: 文档过时需要修订、把 Neo-MoFox 新版本/新插件的变化同步进文档、新增或修改 docs/ 下的页面、修订部署/配置/内置插件指南。包含仓库 Markdown 约定、VitePress 侧边栏注册、构建校验与人工审核交付流程。'
argument-hint: '[更新范围，如 "guides/配置" | "builtin_plugins/ndfc" | "新增页面: xxx"]'
---

# 更新 MoFox-Bot-Docs 文档

为 Neo-MoFox 文档站（VitePress）做内容更新：修订过时内容、新增页面、同步框架变化。完成后交付变更摘要供人工审核，不直接发布。

## 适用与不适用

**适用**：

- 修订 `docs/` 下任何内容页（guides / development / builtin_plugins）
- 新增文档页面并在导航中注册
- 根据框架源码同步新功能、配置项、命令说明

**不适用**：

- VitePress 主题、自定义 markdown-it 插件等前端代码（`.vitepress/theme/`、`.vitepress/plugins/`）
- 仅在需要注册侧边栏/顶栏时才允许编辑 `.vitepress/config.ts`，且只动导航相关字段

## 关键事实（先读这个）

| 主题 | 事实 |
| --- | --- |
| 内容位置 | 所有正文在 `docs/`，三大分区：`guides/`（用户）、`development/`（开发者）、`builtin_plugins/`（内置插件） |
| 新页面必须注册 | 只建文件不会出现在站点；需在 `.vitepress/config.ts` 注册侧边栏。`buildEnd` 钩子生成的 `catalog.json` 也只收录已注册页面 |
| 侧边栏归属 | `guides/**` → `themeConfig.sidebar["/docs/guides/"]` 数组；`development/**` → 文件顶部 `devSidebar` 常量；`builtin_plugins/**` → `themeConfig.sidebar["/docs/builtin_plugins/"]` 数组 |
| config.ts 不热更 | 修改后需重启 `npm run docs:dev`；代码风格：双引号、尾逗号、2 空格缩进 |
| 死链不阻断构建 | `ignoreDeadLinks: true` → 死链只在页面上显示失效图标，必须自行核对每个站内链接 |
| 站内链接 | 省略 `.md` 后缀；同目录 `./xxx`、上级 `../xxx`、站点绝对路径 `/docs/...` |
| 图片 | 放 `public/`，用 `/xxx.png` 站点绝对路径引用；不要放 `docs/` 下相对引用，构建后会失效 |
| 文件命名 | 小写英文 + 连字符（如 `nodejs-install.md`）；`index.md` 为目录默认页。历史例外：`CONTRIBUTE.md` 是大写，不要改名 |
| 容器与图表 | `::: info / tip / warning / danger`（可自定义标题）；支持 mermaid 代码块 |
| frontmatter | 可选：`title` / `description` / `outline` |
| 写作风格 | 标题短；代码先于解释；段落超过 5 行就拆分或改列表；段间留空行；重点用容器而非加粗 |

## 工作流程

### 1. 确定范围

- 参数明确则直接用；否则先向用户澄清：改哪个分区/页面、依据什么变化（新版本发布？插件更新？勘误？）。
- 先读目标页面与同分区相邻页面，保持结构、口吻（你/您）与术语一致。

### 2. 确定版本基准（必做）

**文档描述的是上游最新发布版，本机实例只是参考，不一定是最新。** 动笔前先做版本比对：

1. 查文档目标主题对应的上游源码：主仓库 `https://github.com/MoFox-Studio/Neo-MoFox`（`src/`、`plugins/`），用 GitHub 工具或 `fetch_webpage` 取 `master`/`dev` 分支最新内容。
2. 查本机实例版本（`E:\Neo-mofox-instance\...\neo-mofox` 的 git log / pyproject 版本号），判断它是新于还是旧于上游。
3. 两者冲突时，**以上游为准**；本机实例仅用于对照行为细节与本地实测结果。
4. 无法访问上游时，把改动限定为「与文档自相矛盾的修正」（如死链、错别字），版本相关的新增内容一律进「未验证项」，不要落笔。
5. 在交付摘要中记录基准版本（上游 commit/版本号 + 本机实例版本），让审核者能判断时效性。

### 3. 收集事实依据（禁止编造）

按可信度从高到低取材：

1. 上游 Neo-MoFox 仓库最新源码（版本基准）
2. 本机 Neo-MoFox 实例源码（如 `E:\Neo-mofox-instance\bot-3693525299\neo-mofox`：核心 `src/app/`、`plugins/` 内置插件、配置模板）——注意可能滞后于上游
3. 插件自带的 README / CHANGELOG / manifest.json
4. 文档站现有相关页面（保持口径一致）

只写能从源码或配置验证的内容。无法验证的：

- 在代码位置加 `<!-- TODO: 待与 vX.X 核对 -->` 标注；
- 并记入交付摘要的「未验证项」。

绝不虚构配置项、API、默认值或命令输出。

### 4. 编辑内容

- 修订：就地修改，不新建重复页面。
- 新增：按命名约定建文件，首行一级标题；并从相关页面补交叉链接。
- 删除或大幅重写前，先全局搜索是否有其他页面链接到它（按链接路径 grep），一并更新。

### 5. 注册导航（仅新增页面/分组）

编辑 `.vitepress/config.ts` 中对应的侧边栏数组（归属见上表）；需要顶栏入口时改 `nav`（总项数控制在 5-7）。改完重启 dev server 才能生效。

### 6. 构建验证

在仓库根目录依次执行：

- `npm run docs:build` —— 成功后仍要注意输出里的 dead link 提示
- 对本次新增/修改的每个站内链接，确认目标文件真实存在（死链不会让构建失败）
- 改过 `config.ts` 或主题 TS 时补跑 `npm run typecheck`
- 可选：`npm run docs:preview` 或用浏览器工具目检渲染效果

### 7. 交付人工审核

- **不自动 commit / push**，除非用户明确要求。
- 输出摘要，包含：
  - 基准版本（上游 commit/版本号 + 本机实例版本，二者差异说明）
  - 变更文件清单（新增 / 修改 / 删除）
  - 侧边栏 / 顶栏注册项
  - 事实依据来源（读了哪些源码/配置）
  - 未验证项与 TODO 清单
  - 建议 PR 说明（docs 仓库 PR 目标分支为 `master`）

## 常见陷阱

- 新页面「看不见」→ 忘了在 `config.ts` 注册，或改完 config 没重启 dev server。
- 死链静默通过构建 → 必须逐一自查链接目标。
- 站内链接写了 `.md` 后缀 → 页面失效。
- 图片放 `docs/` 下相对引用 → 构建后路径失效。
- 顺手「修正」`CONTRIBUTE.md` 的大小写 → 断链。
- 编造未验证的功能/配置项 → 一律以源码为准，拿不准就标注 TODO。
- 把本机实例当最新版 → 本机可能滞后于上游；版本相关结论必须先与上游仓库比对。
- 留下无关的 AI 生成 md 文件 → 违反开发准则（见 `docs/development/guidelines/development_guidelines`），应删除或并入正文。

## 本机环境备注

- **本 skill 属本地私有文件，不得 commit / push 到 GitHub**；提交文档改动时排除 `.github/skills/` 路径。
- Windows + PowerShell；npm 命令在 `MoFox-Bot-Docs` 仓库根目录执行。
- 本机终端沙箱可能无法启动子进程；运行 npm 命令前按需申请非沙箱执行。
- PowerShell 中文输出乱码时用 `Out-String -Width 200` 或设置 UTF-8 编码。
- 构建前置：`node_modules` 可能缺失（`vitepress` 命令找不到时先 `npm install`）；npm 直连网络失败时加 `--prefer-offline --no-audit --no-fund` 重试。构建约 2 分钟，属正常。

## 参考

- 编辑规范：`docs/development/docs-editing/edit-docs`
- 启动与构建：`docs/development/docs-editing/run-server`
- 侧边栏配置：`docs/development/docs-editing/sidebar-nav-config`
- 贡献流程：`docs/development/guidelines/CONTRIBUTE`
- 开发准则：`docs/development/guidelines/development_guidelines`
- 导航源码：`.vitepress/config.ts`
