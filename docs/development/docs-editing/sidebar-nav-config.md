# 侧边栏与顶栏配置

VitePress 的导航完全由 `.vitepress/config.ts` 中的 `themeConfig` 配置驱动。本章讲解如何为新页面添加 **顶栏（nav）** 与 **侧边栏（sidebar）** 入口。

## 1. 配置文件位置

```
MoFox-Bot-Docs/
└── .vitepress/
    └── config.ts          ← 就是它
```

文件较大（800+ 行），但结构清晰。导航相关字段集中在 `themeConfig` 下：

```ts
themeConfig: {
  nav: [...],          // 顶栏菜单
  sidebar: {...},      // 侧边栏（按路径分区）
  editLink: {...},
  socialLinks: [...],
  // ...
}
```

::: tip 修改后需重启
`config.ts` 是站点配置，**不能热更新**。修改后请按 `Ctrl+C` 终止 `npm run docs:dev`，再重新执行该命令让改动生效。
:::

## 2. 顶栏（nav）配置

`nav` 是一个数组，每个对象表示一个顶栏项。打开 `config.ts` 找到：

```ts
nav: [
  { text: "主页", link: "/" },
  { text: "指南", link: "/docs/guides/" },
  { text: "开发", link: "/docs/development/" },
  {
    text: "相关链接",
    items: [
      { text: "MoFox-Studio", link: "https://github.com/MoFox-Studio" },
      // ...
    ],
  },
],
```

### 2.1 添加一个普通顶栏项

直接在数组里追加一个对象即可：

```ts
nav: [
  { text: "主页", link: "/" },
  { text: "指南", link: "/docs/guides/" },
  { text: "开发", link: "/docs/development/" },
  { text: "更新日志", link: "/docs/changelog" },   // ← 新增
  // ...
],
```

- `text`：顶栏按钮显示的文字。
- `link`：点击后跳转的页面路径。**站内路径必须以 `/` 开头且省略 `.md`**；外链写完整 URL。

### 2.2 添加一个下拉菜单项

把 `link` 换成 `items`，即可变成下拉菜单：

```ts
{
  text: "资源",
  items: [
    { text: "更新日志", link: "/docs/changelog" },
    { text: "MoFox-Studio", link: "https://github.com/MoFox-Studio" },
  ],
},
```

::: warning
顶栏项目不宜过多，建议控制在 5-7 个。过多会影响移动端排版。
:::

## 3. 侧边栏（sidebar）基础

`sidebar` 是一个**对象**（`SidebarMulti`），键是路径前缀，值是对应的侧边栏分组数组。本仓库用了三个分区：

```ts
sidebar: {
  "/docs/guides/": [ /* 指南区侧边栏 */ ],
  "/docs/development/": devSidebar,   // 抽成顶部变量，便于阅读
  "/docs/builtin_plugins/": [ /* 内置插件侧边栏 */ ],
},
```

当用户访问 `/docs/development/xxx` 时，VitePress 会自动套用 `devSidebar`。

### 3.1 最小示例

在文件顶部可以看到 `devSidebar` 的定义：

```ts
const devSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: "开发",
    collapsed: false,
    items: [{ text: "开发主页", link: "/docs/development/" }],
  },
  // ...更多分组
];
```

每个分组对象字段含义：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `text` | `string` | 分组标题（必填） |
| `items` | `SidebarItem[]` | 子项列表（与 `link` 二选一） |
| `link` | `string` | 直接跳转链接（与 `items` 二选一） |
| `collapsed` | `boolean` | 是否默认折叠，默认 `false` |

### 3.2 添加一个叶子项

例如在「贡献指南和开发帮助」分组里加入「文档编辑指南」：

```ts
{
  text: "贡献指南和开发帮助",
  collapsed: false,
  items: [
    { text: "参与项目贡献", link: "/docs/development/guidelines/CONTRIBUTE" },
    { text: "开发准则", link: "/docs/development/guidelines/development_guidelines" },
    // ↓ 新增项
    { text: "文档编辑指南", link: "/docs/development/docs-editing/" },
  ],
},
```

保存后**重启 dev server**，刷新页面即可在侧边栏看到新条目。

::: tip 路径规则
- `link` 以 `/docs/...` 开头表示从站点根算起的绝对路径。
- 末尾的 `/` 等价于该目录下的 `index.md`，例如 `/docs/development/docs-editing/` 对应文件 `docs/development/docs-editing/index.md`。
- 不要写 `.md` 后缀。
:::

## 4. 多级侧边栏

`items` 里的每一项可以再嵌套 `items`，形成多级菜单：

```ts
{
  text: "文档编辑指南",          // ← 一级：分组
  collapsed: false,
  items: [
    { text: "概述", link: "/docs/development/docs-editing/" },     // 二级：页面
    {
      text: "基础流程",            // ← 二级：子分组
      collapsed: false,
      items: [
        { text: "安装 Node.js", link: "/docs/development/docs-editing/nodejs-install" },  // 三级：页面
        { text: "编辑文档内容", link: "/docs/development/docs-editing/edit-docs" },
        { text: "启动与预览", link: "/docs/development/docs-editing/run-server" },
        { text: "侧边栏配置", link: "/docs/development/docs-editing/sidebar-nav-config" },
      ],
    },
  ],
},
```

侧边栏最多支持 **6 层**嵌套，但实际写作用 2-3 层即可，过深会影响读者浏览体验。

## 5. 折叠分组

把 `collapsed` 设为 `true`，分组在首次进入页面时是收起状态，用户点击才会展开。适合内容很多但不常用的子分组：

```ts
{
  text: "MPDT 开发工具",
  collapsed: true,    // ← 默认折叠
  items: [/* ... */],
},
```

读者进入对应页面后，VitePress 会自动展开其所属分组，方便定位。

## 6. 完整示例：新增一个章节

假设你要为本「文档编辑指南」章节在 `devSidebar` 中添加一个**新的大项**，操作步骤：

1. 确认文件已创建：
   - `docs/development/docs-editing/index.md`
   - `docs/development/docs-editing/nodejs-install.md`
   - `docs/development/docs-editing/edit-docs.md`
   - `docs/development/docs-editing/run-server.md`
   - `docs/development/docs-editing/sidebar-nav-config.md`

2. 在 `config.ts` 顶部的 `devSidebar` 数组中，在合适位置插入新分组：

```ts
const devSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: "开发",
    collapsed: false,
    items: [{ text: "开发主页", link: "/docs/development/" }],
  },
  {
    text: "贡献指南和开发帮助",
    collapsed: false,
    items: [
      { text: "参与项目贡献", link: "/docs/development/guidelines/CONTRIBUTE" },
      { text: "开发准则", link: "/docs/development/guidelines/development_guidelines" },
    ],
  },
  // ────── 新增大项：文档编辑指南 ──────
  {
    text: "文档编辑指南",
    collapsed: false,
    items: [
      { text: "概述", link: "/docs/development/docs-editing/" },
      { text: "安装 Node.js 环境", link: "/docs/development/docs-editing/nodejs-install" },
      { text: "编辑文档内容", link: "/docs/development/docs-editing/edit-docs" },
      { text: "启动与预览", link: "/docs/development/docs-editing/run-server" },
      { text: "侧边栏与顶栏配置", link: "/docs/development/docs-editing/sidebar-nav-config" },
    ],
  },
  // ──────────────────────────────────
  {
    text: "插件开发",
    collapsed: false,
    items: [/* ... */],
  },
];
```

3. 保存后**重启** `npm run docs:dev`，访问 <http://localhost:5173/docs/development/docs-editing/> 即可看到效果。

## 7. 其他常用 themeConfig 字段

| 字段 | 作用 |
| --- | --- |
| `editLink` | 页面右上角「在 GitHub 上编辑此页」的链接模板 |
| `socialLinks` | 右上角社交图标（GitHub、Discord 等） |
| `search` | 本地搜索配置（`provider: "local"`） |
| `footer` | 页脚版权信息 |
| `docFooter` | 上一页 / 下一页按钮文字 |
| `lastUpdated` | 「最后更新」文案与 Git 提交时间显示 |

完整字段可参考 [VitePress 默认主题配置文档](https://vitepress.dev/reference/default-theme-config)。

## 8. 检查清单

提交 PR 前，请对照以下清单自检：

- [ ] 新增的 Markdown 文件路径与 `link` 完全一致（注意首尾斜杠）。
- [ ] 侧边栏分组顺序符合阅读逻辑。
- [ ] `npm run docs:dev` 重启后，所有新条目都可见且可点击。
- [ ] `npm run docs:build` 构建无错误。
- [ ] 顶栏与侧边栏没有重复条目。
- [ ] `config.ts` 中的代码风格与现有保持一致（双引号、尾逗号、缩进 2 空格）。

完成后即可推送分支并向 [`MoFox-Bot-Docs`](https://github.com/MoFox-Studio/MoFox-Bot-Docs) 仓库的 `master` 分支提交 PR，感谢你的贡献！
