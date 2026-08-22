# 文档 JSON API

MoFox-Bot-Docs 内置了一个文档 JSON API，允许外部程序（或本站组件）以 JSON 格式获取、搜索文档。无论你是在本地开发服务器（`npm run docs:dev`）还是静态托管（`npm run docs:build` 之后的产物，如 GitHub Pages），**同一批 URL 完全可用**，无需任何后端服务。

## 为什么静态页面也能用？

静态站点没有服务器进程。本 API 通过两种机制实现了"开发环境与静态页面行为一致"：

- **开发服务器**：`.vitepress/plugins/docs-api.ts` 注册了一个 Vite 中间件，实时扫描 `docs/` 目录并返回 JSON，文档改动后立即生效。
- **静态托管**：构建时（`docs:build`）插件会把同样的 JSON 文件写入产物目录 `api/docs/`，托管后直接作为静态文件被访问。

两种模式下接口路径、返回结构完全一致。

## 接口总览

| 接口 | 说明 | 返回 |
| --- | --- | --- |
| `GET /api/docs/index.json` | 获取所有文档（元信息） | `{ total, docs[] }` |
| `GET /api/docs/search.json?q=关键词` | 按标题 / 路径 / id 搜索文档 | `{ query, total, results[] }` |
| `GET /api/docs/search-content.json?q=关键词` | 按文档正文文字搜索文档 | `{ query, total, results[] }` |
| `GET /api/docs/<id>.json` | 获取指定文档（含正文文本） | `{ id, path, title, description, content }` |

## 数据字段说明

每篇文档由以下字段组成：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 文档唯一标识，即相对 `docs/` 的路径去掉 `.md`，如 `guides/configuration/bot_config_guide` |
| `path` | string | 站内路由，如 `/docs/guides/configuration/bot_config_guide` |
| `title` | string | 标题（取自一级标题，缺省时为文件名） |
| `description` | string | 简介（取自正文首段，截断为 200 字符） |
| `content` | string | **纯文本正文**（Markdown 已被转换为文本，便于直接使用 / 全文检索） |

`index.json` 与 `search.json` 只包含元信息（不含 `content`），适合做目录或列表；`search-content.json` 与单个文档接口包含 `content` 字段。

## 1. 获取所有文档

```http
GET /api/docs/index.json
```

```json
{
  "total": 150,
  "docs": [
    {
      "id": "guides/configuration/bot_config_guide",
      "path": "/docs/guides/configuration/bot_config_guide",
      "title": "Neo-MoFox 核心配置指南 (core.toml)",
      "description": "config/core.toml 是 Neo-MoFox 的核心配置文件……"
    }
  ]
}
```

## 2. 搜索指定文档（按标题 / 路径）

按标题、路径或 id 做不区分大小写的模糊匹配：

```http
GET /api/docs/search.json?q=mcp
```

```json
{
  "query": "mcp",
  "total": 1,
  "results": [
    {
      "id": "guides/configuration/mcp_guide",
      "path": "/docs/guides/configuration/mcp_guide",
      "title": "MCP 使用教程",
      "description": "……"
    }
  ]
}
```

## 3. 通过文档正文文字搜索

按文档正文的纯文本内容匹配，命中结果会包含 `content` 字段：

```http
GET /api/docs/search-content.json?q=Owner
```

```json
{
  "query": "Owner",
  "total": 14,
  "results": [
    {
      "id": "builtin_plugins/perm/index",
      "path": "/docs/builtin_plugins/perm/",
      "title": "权限管理",
      "description": "……",
      "content": "……"
    }
  ]
}
```

## 4. 获取指定文档

`<id>` 为文档唯一标识（见 `index.json` 中的 `id` 字段）。返回的 `content` 是**纯文本正文**：

```http
GET /api/docs/guides/configuration/bot_config_guide.json
```

```json
{
  "id": "guides/configuration/bot_config_guide",
  "path": "/docs/guides/configuration/bot_config_guide",
  "title": "Neo-MoFox 核心配置指南 (core.toml)",
  "description": "config/core.toml 是 Neo-MoFox 的核心配置文件……",
  "content": "Neo-MoFox 核心配置指南 (core.toml)\n\n适用版本: Neo-MoFox >= 1.2.0\n……"
}
```

::: tip 获取目录页
目录页（`index.md`）的 id 形如 `guides/index`，因此它的接口是 `/api/docs/guides/index.json`。
:::

## 静态托管下的搜索

在静态托管下，`search.json` 与 `search-content.json` 直接返回**完整索引**（`query` 为空、包含全部文档），由调用方在客户端过滤——因为纯静态托管无法按查询参数动态返回结果。开发服务器的这两个接口则支持 `?q=` 服务端过滤，方便用 `curl` 调试。

```js
// 示例：静态托管下客户端过滤
const { results } = await fetch("/api/docs/search.json").then((r) => r.json());
const hits = results.filter((doc) => doc.title.includes("docker"));
```

## 客户端助手模块

本站还提供了一个与 API 配套的 TypeScript 助手模块，封装了上述四个操作，开发环境与静态环境行为一致：

```ts
// .vitepress/theme/utils/docsApi.ts
import {
  getAllDocs,
  searchDocs,
  searchDocsContent,
  getDoc,
} from "./docsApi";

const all = await getAllDocs();          // 所有文档元信息
const hit = await searchDocs("webui");   // 按标题搜索
const full = await searchDocsContent("Owner"); // 按正文搜索
const doc = await getDoc("guides/configuration/bot_config_guide"); // 指定文档
```

## 常见问题

- **`/api/docs/<id>.json` 不存在时返回什么？** 开发服务器返回 `404` 与 `{ "error": "not_found", "message": "文档不存在: <id>" }`；静态托管下访问不存在的文件会落到站点的 404 页面。
- **新增 / 修改文档后需要做什么？** 开发服务器会通过文件监听自动刷新缓存；静态托管需要重新执行 `npm run docs:build` 以重新生成 JSON 文件。
- **文件生成在哪里？** 构建产物的 `api/docs/` 目录，共三类文件：`index.json`（列表）、`search.json` / `search-content.json`（搜索索引）、以及每篇文档一个的 `<id>.json`。