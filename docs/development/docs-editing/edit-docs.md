# 编辑文档内容

本章介绍 MoFox-Bot-Docs 的仓库结构、Markdown 写作约定，以及 VitePress 提供的扩展语法。掌握这些之后，你就可以开始添加或修改任意一个文档页面了。

## 1. 仓库结构速览

```bash
MoFox-Bot-Docs/
├── docs/                       # 所有 Markdown 正文都放在这里
│   ├── guides/                 # 面向终端用户的部署/配置指南
│   ├── development/            # 面向开发者的开发文档（本章节就在这里）
│   │   └── docs-editing/       # 你正在阅读的「文档编辑指南」
│   └── builtin_plugins/        # 内置插件文档
├── .vitepress/
│   ├── config.ts               # 站点主配置（导航栏、侧边栏、主题等）
│   ├── theme/                  # 自定义主题与布局
│   └── plugins/                # 自定义 Markdown 插件
├── public/                     # 静态资源（图片、logo 等），通过 /xxx 直接引用
├── index.md                   # 站点根路径 /
├── package.json                # 依赖与 npm 脚本
└── README.md                   # 仓库说明
```

**核心规则**：

- 你写的所有 Markdown 文件都放在 `docs/` 下。
- 修改导航/侧边栏需要编辑 `.vitepress/config.ts`（详见 [侧边栏与顶栏配置](./sidebar-nav-config)）。
- 图片放到 `public/` 目录后，可直接用 `/图片名.png` 引用。

## 2. 添加一个新页面

以在「文档编辑指南」下新增一页 `faq.md` 为例：

```bash
docs/development/docs-editing/
├── index.md
├── nodejs-install.md
├── edit-docs.md      # 本章
└── faq.md             # 新增的页面
```

文件首行通常是一个一级标题：

```md
# 文档编辑常见问题
```

随后即可开始正文写作。

::: warning 注意
只新建文件**不会**自动出现在站点侧边栏里。新页面需要在 `.vitepress/config.ts` 中注册才能被读者从导航进入，详见 [下一章](./sidebar-nav-config)。
:::

## 3. Frontmatter

每个 Markdown 文件顶部可以有一段 YAML 元数据，称为 frontmatter。最常用的字段：

```md
---
title: 编辑文档内容          # 页面标题，覆盖一级标题显示
description: 介绍仓库结构与 Markdown 约定   # SEO 描述
outline: [2, 3]              # 大纲展开到二、三级标题
---
```

不写 frontmatter 也可以，VitePress 会自动使用第一个 `#` 作为标题。

## 4. Markdown 基础语法

VitePress 完整支持 CommonMark + GFM，常用语法如下：

```md
**加粗**、*斜体*、~~删除线~~、`行内代码`

- 无序项 1
- 无序项 2
  - 嵌套项

1. 有序项 1
2. 有序项 2

[链接文本](./other-page)        <!-- 站内链接省略 .md -->
[外部链接](https://vitepress.dev)

![图片替代文字](/logo.png)       <!-- public 下的图片用绝对路径 -->
```

::: tip 站内链接规则
- 链接到同目录下文件：`[安装](./nodejs-install)`（**不要**写成 `./nodejs-install.md`）
- 链接到上级目录：`[贡献指南](../guidelines/CONTRIBUTE)`
- 路径以 `/` 开头时是站点根（如 `/docs/guides/`），与文件系统根无关
:::

## 5. 代码块

用三反引号包裹，并在第一行写明语言以启用语法高亮：

````md
```bash
npm install
```

```ts
const sidebar = [
  { text: "开发主页", link: "/docs/development/" },
]
```
````

行号高亮、行聚焦等高级用法可参考 [VitePress 代码块文档](https://vitepress.dev/guide/markdown#code-blocks)。

## 6. 自定义容器

VitePress 提供了三类提示容器：

```md
::: info
这是一段提示信息。
:::

::: tip
这是一条小贴士。
:::

::: warning
这是一个警告，请认真阅读。
:::

::: danger
这是危险警告，常用于不可逆操作。
:::
```

也可以自定义标题：

```md
::: warning 注意权限
不要使用 sudo 安装 npm 依赖。
:::
```

## 7. Mermaid 图表

本仓库已集成 [mermaid](https://mermaid.js.org/) 插件，可以直接画流程图：

````md
```mermaid
flowchart LR
  A[安装 Node.js] --> B[克隆仓库]
  B --> C[启动开发服务器]
  C --> D[编辑文档]
  D --> E[提交 PR]
```
````

## 8. 在 Markdown 中使用 Vue 组件

VitePress 允许在 Markdown 中直接写 Vue 代码。仓库的 `docs/development/index.md` 就用 `<GuideCards>` 组件渲染了卡片导航，并借助 `<script setup>` 注册本地数据：

```md
<script setup>
const cards = [
  { name: "安装 Node.js", link: "./docs-editing/nodejs-install" },
]
</script>

<GuideCards :guides="cards" />
```

普通文档写作用不到这一能力，了解即可。

## 9. 文件命名约定

- 全部使用小写英文与连字符，例如 `nodejs-install.md`、`sidebar-nav-config.md`。
- 不要使用空格、中文、下划线或大写字母。
- `index.md` 作为目录默认页（路由末尾带 `/`）。

## 10. 图片与静态资源

将文件放到 `public/` 目录下：

```
public/
└── logos/
    └── logo-3.png
```

引用时直接使用站点绝对路径：

```md
![MoFox Logo](/logos/logo-3.png)
```

不要把图片直接放在 `docs/` 下并用相对路径引用，那样构建后路径会失效。

## 11. 写作风格小贴士

- **小标题要短**：每段标题控制在 1 个短语，方便侧边栏展示。
- **先放代码，后放解释**：读者更关心"怎么做"再关心"为什么"。
- **保持段间空行**：Markdown 段落之间留一个空行，渲染才正确。
- **避免长段落**：超过 5 行就考虑拆段或换列表。
- **用容器强调重点**：`::: tip` / `::: warning` 比加粗更醒目。

完成本页内容后，请继续阅读 [启动与预览](./run-server) 在本地查看渲染效果。
