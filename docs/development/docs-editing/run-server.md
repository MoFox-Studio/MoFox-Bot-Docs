# 启动与预览

本章介绍如何在本地把 MoFox-Bot-Docs 跑起来，包括开发服务器、生产构建、产物预览，以及常见的排错思路。前两步假设你已经完成 [Node.js 安装](./nodejs-install)。

## 1. 克隆仓库

如果还没有仓库代码，先 clone 一份到本地：

```bash
git clone https://github.com/MoFox-Studio/MoFox-Bot-Docs.git
cd MoFox-Bot-Docs
```

如果你打算贡献 PR，请先在 GitHub 上 Fork 本仓库，再 clone 你 Fork 出来的地址，并配置上游：

```bash
git remote add upstream https://github.com/MoFox-Studio/MoFox-Bot-Docs.git
```

## 2. 安装依赖

仓库根目录已带 `package.json` 与 `package-lock.json`，执行：

```bash
npm install
```

首次安装会下载 VitePress、Vue、Nolebase 系列插件等，大约需要 1-3 分钟。完成后会出现 `node_modules/` 目录。

::: tip
不要把 `node_modules/` 提交到 Git，`.gitignore` 已经默认忽略它。
:::

## 3. npm 脚本一览

`package.json` 中定义了三个文档命令：

| 命令 | 作用 |
| --- | --- |
| `npm run docs:dev` | 启动开发服务器，支持热更新 |
| `npm run docs:build` | 构建静态站点产物到 `docs/.vitepress/dist` |
| `npm run docs:preview` | 本地预览构建产物（模拟线上环境） |
| `npm run typecheck` | 对 `.vitepress` 下 TS 文件做类型检查 |

## 4. 启动开发服务器

在仓库根目录执行：

```bash
npm run docs:dev
```

终端会输出类似：

```
  VITE v7.x.x  ready in 1200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

浏览器访问 <http://localhost:5173/> 即可看到站点。

### 4.1 热更新行为

- **修改 Markdown 文件**：保存后浏览器自动刷新当前页面。
- **修改 `.vitepress/config.ts`**：需要重启 `docs:dev` 才能生效。
- **新增 / 删除文件**：自动增量加载，无需重启。
- **修改主题或组件**（`.vitepress/theme/`）：组件热替换，无需整页刷新。

### 4.2 修改端口

如果 5173 端口被占用，VitePress 会自动顺延到 5174、5175 等。也可以手动指定：

```bash
npx vitepress dev --port 8080
```

### 4.3 让局域网其他设备访问

```bash
npx vitepress dev --host
```

终端会打印 `Network: http://192.168.x.x:5173/`，手机/平板与电脑同网段即可访问，便于真机调试。

## 5. 构建生产产物

提交 PR 前建议先本地构建一次，确保没有错误：

```bash
npm run docs:build
```

构建过程会输出每页的渲染日志，结束时会提示：

```
✅ catalog.json generated with N pages → .../docs/.vitepress/dist/catalog.json
building site client + server...
✓ building client + server...
✓ rendering N pages...

Build succeeded.
```

产物目录：`docs/.vitepress/dist/`。其中除了 HTML/JS/CSS 资源外，还自动生成 `catalog.json`，记录所有侧边栏页面的链接清单（由 `config.ts` 的 `buildEnd` 钩子生成）。

::: warning
若构建报错 `dead link`，说明有 Markdown 文件中的站内链接指向了不存在的目标。请按提示路径修复链接。本仓库默认配置了 `ignoreDeadLinks: true`，构建不会中断，但页面上会显示失效链接图标，仍应避免。
:::

## 6. 预览构建产物

```bash
npm run docs:preview
```

默认监听 4173 端口，浏览器访问 <http://localhost:4173/> 可看到与线上等价的产物渲染效果。

::: tip
`docs:dev` 与 `docs:preview` 的区别：
- `dev` 直接从源码热编译，速度快、修改实时可见，适合写作时使用。
- `preview` 渲染的是 `docs:build` 产出的静态文件，最贴近线上表现，适合最终检查。
:::

## 7. 类型检查

如果你修改了 `.vitepress/config.ts` 或自定义主题里的 TypeScript 代码，请运行：

```bash
npm run typecheck
```

它会调用 `vue-tsc` 对 `.vitepress/tsconfig.json` 涵盖的文件做静态检查。仅写 Markdown 不需要执行。

## 8. 排错速查

| 现象 | 可能原因 | 解决办法 |
| --- | --- | --- |
| `vitepress: command not found` | 依赖未安装 | `npm install` |
| 端口被占用 | 多个 dev server 同时跑 | 关闭旧进程或用 `--port` 指定新端口 |
| 侧边栏没显示新页面 | 未在 `config.ts` 注册 | 见 [下一章](./sidebar-nav-config) |
| 页面 404 | 链接路径与实际文件不匹配 | 检查 `.md` 是否省略、是否以 `/docs/...` 开头 |
| 中文乱码 | 文件编码不是 UTF-8 | 用编辑器另存为 UTF-8（无 BOM） |
| 启动白屏 splash 一直转 | 网络/字体加载阻塞 | 等待 4 秒会自动消失，或检查控制台报错 |

## 9. 下一步

完成本地预览后，如果新增或修改了页面，往往还需要在站点导航里加入口，请继续阅读 [侧边栏与顶栏配置](./sidebar-nav-config)。
