import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join, relative, resolve, sep } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import MarkdownIt from "markdown-it";

/**
 * 文档 JSON API 插件
 *
 * 在开发服务器（docs:dev）与构建产物（docs:build / 静态托管）中提供一致的 API：
 *
 *   GET /api/docs/index.json                获取所有文档（元信息）
 *   GET /api/docs/search.json?q=关键词       按标题 / 路径 / id 搜索文档
 *   GET /api/docs/search-content.json?q=关键词  按文档正文文字搜索
 *   GET /api/docs/<id>.json                 获取指定文档（含正文文本）
 *
 * 开发模式：由 Vite 中间件实时扫描 docs/ 目录并返回 JSON。
 * 构建模式：在 closeBundle 时把同样的 JSON 静态文件写入 outDir，
 *           静态托管（GitHub Pages 等）可直接访问同一批 URL。
 */

const md = new MarkdownIt({ html: true });

export interface DocsApiDoc {
  id: string;
  path: string;
  title: string;
  description: string;
}

export interface DocsApiDocDetail extends DocsApiDoc {
  content: string;
}

// ── Markdown 文本提取 ────────────────────────────────────────────────

function markdownToText(src: string): string {
  let body = src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  body = body.replace(/<style[\s\S]*?<\/style>/gi, "");

  const html = md.render(body);
  let text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

function extractTitle(src: string): string {
  const body = src.replace(/^---[\s\S]*?\n---/, "");
  const match = body.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : "";
}

function extractDescription(src: string): string {
  let body = src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#{1,6}\s/.test(line)) continue;
    if (/^```/.test(line)) continue;
    if (/^:::/.test(line)) continue;
    if (/^[-*+]\s/.test(line)) continue;
    if (/^\d+\.\s/.test(line)) continue;
    if (/^>/.test(line)) continue;
    if (/^\|/.test(line)) continue;
    if (/^<[a-zA-Z!]/.test(line)) continue;

    const clean = line
      .replace(/[#*`_~\[\]()<>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (clean.length >= 10) {
      return clean.length > 200 ? clean.slice(0, 200) + "…" : clean;
    }
  }
  return "";
}

// ── 文档扫描 ─────────────────────────────────────────────────────────

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

async function scanDocs(docsDir: string): Promise<DocsApiDocDetail[]> {
  const files = await walk(docsDir);
  const docs: DocsApiDocDetail[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const src = await fs.readFile(file, "utf-8");
    const rel = relative(docsDir, file).split(sep).join("/");
    const id = rel.replace(/\.md$/, "");
    const isIndex = id.endsWith("/index");
    const path =
      "/docs/" + (isIndex ? id.slice(0, -"/index".length) + "/" : id);

    docs.push({
      id,
      path,
      title: extractTitle(src) || id,
      description: extractDescription(src),
      content: markdownToText(src),
    });
  }

  docs.sort((a, b) => a.path.localeCompare(b.path));
  return docs;
}

function toMeta(doc: DocsApiDocDetail): DocsApiDoc {
  return { id: doc.id, path: doc.path, title: doc.title, description: doc.description };
}

function findDocs(
  docs: DocsApiDocDetail[],
  query: string,
  field: "meta" | "content",
): DocsApiDocDetail[] {
  const q = query.trim().toLowerCase();
  if (!q) return docs;
  return docs.filter((doc) => {
    const hay = field === "content" ? doc.content : `${doc.title}\n${doc.path}\n${doc.id}`;
    return hay.toLowerCase().includes(q);
  });
}

// ── JSON 响应工具 ────────────────────────────────────────────────────

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

// ── Vite 插件 ────────────────────────────────────────────────────────

export default function docsApiPlugin(): Plugin {
  let root = process.cwd();
  let docsDir = join(root, "docs");
  let outDir = "";
  let isBuild = false;
  let cache: DocsApiDocDetail[] | null = null;

  async function loadDocs(): Promise<DocsApiDocDetail[]> {
    if (cache) return cache;
    cache = await scanDocs(docsDir);
    return cache;
  }

  function handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): void {
    const url = new URL(req.url ?? "/", "http://localhost");
    // 兼容中间件挂载后 req.url 被剥离 /api/docs 前缀的情况（connect 会改写 req.url）
    const relPath = url.pathname
      .replace(/^\/+/, "")
      .replace(/^api\/docs\/?/, "");
    const segments = relPath.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? "";

    void loadDocs().then((all) => {
      if (relPath === "index.json") {
        json(res, 200, { total: all.length, docs: all.map(toMeta) });
        return;
      }

      if (relPath === "search.json") {
        const q = url.searchParams.get("q") ?? "";
        const results = findDocs(all, q, "meta").map(toMeta);
        json(res, 200, { query: q, total: results.length, results });
        return;
      }

      if (relPath === "search-content.json") {
        const q = url.searchParams.get("q") ?? "";
        const results = findDocs(all, q, "content");
        json(res, 200, { query: q, total: results.length, results });
        return;
      }

      // /api/docs/<id>.json → 获取指定文档
      if (last.endsWith(".json")) {
        const id = segments.join("/").replace(/\.json$/, "");
        const doc = all.find((d) => d.id === id);
        if (doc) {
          json(res, 200, doc);
        } else {
          json(res, 404, { error: "not_found", message: `文档不存在: ${id}` });
        }
        return;
      }

      json(res, 404, { error: "not_found", message: "未知的 API 端点" });
    });
  }

  return {
    name: "mofox-docs-api",

    configResolved(config: ResolvedConfig) {
      root = config.root || process.cwd();
      docsDir = join(root, "docs");
      outDir = config.build?.outDir ?? "";
      isBuild = config.command === "build";
    },

    configureServer(server) {
      const invalidate = () => {
        cache = null;
      };
      const onChange = (file: string) => {
        if (file.startsWith(docsDir + sep)) invalidate();
      };
      server.watcher.on("add", onChange);
      server.watcher.on("change", onChange);
      server.watcher.on("unlink", onChange);

      server.middlewares.use("/api/docs", (req, res, next) => {
        try {
          handleRequest(req, res);
        } catch (err) {
          next(err as Error);
        }
      });
    },

    async closeBundle() {
      // 仅在构建时写入静态 JSON；开发模式由中间件实时提供
      if (!isBuild || !outDir) return;
      const apiDir = resolve(outDir, "api/docs");
      await fs.mkdir(apiDir, { recursive: true });

      const docs = await scanDocs(docsDir);

      // 所有文档（元信息）
      await fs.writeFile(
        resolve(apiDir, "index.json"),
        JSON.stringify({ total: docs.length, docs: docs.map(toMeta) }, null, 2),
        "utf-8",
      );

      // 标题 / 路径搜索索引（完整元信息，客户端过滤）
      await fs.writeFile(
        resolve(apiDir, "search.json"),
        JSON.stringify(
          { query: "", total: docs.length, results: docs.map(toMeta) },
          null,
          2,
        ),
        "utf-8",
      );

      // 正文搜索索引（含完整正文文本，客户端过滤）
      await fs.writeFile(
        resolve(apiDir, "search-content.json"),
        JSON.stringify(
          { query: "", total: docs.length, results: docs },
          null,
          2,
        ),
        "utf-8",
      );

      // 每个文档一个 JSON 文件
      for (const doc of docs) {
        const filePath = resolve(apiDir, `${doc.id}.json`);
        await fs.mkdir(filePath.slice(0, filePath.lastIndexOf(sep)), {
          recursive: true,
        });
        await fs.writeFile(filePath, JSON.stringify(doc, null, 2), "utf-8");
      }

      console.log(
        `✅ Docs JSON API generated → ${docs.length} docs in ${apiDir}`,
      );
    },
  };
}