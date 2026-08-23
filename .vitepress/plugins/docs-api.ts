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
 *   GET /api/docs/llms.json                 LLM 检索索引（按 section 排序，替代 search）
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
  let body = src
    .replace(/^\uFEFF/, "")
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
    .trim();
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
  const body = src.replace(/^\uFEFF/, "").replace(/^---[\s\S]*?\n---/, "");
  const match = body.match(/^#\s+(.+?)\s*$/m);
  if (!match) return "";
  return match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function extractDescription(src: string): string {
  let body = src
    .replace(/^\uFEFF/, "")
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
    .trim();
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

// ── LLM 索引（llms.json，替代 search 作为 LLM 入口）──────────────────

function sectionOf(id: string): string {
  const [top, sub] = id.split("/");
  return top === "guides" && sub ? `${top}/${sub}` : top;
}

const SECTION_PRIORITY: Record<string, number> = {
  "guides/deployment": 1,
  "guides/index": 1.5,
  "guides/configuration": 2,
  "guides/usage": 3,
  "guides/adapter_list": 4,
  "guides/misc": 5,
  development: 6,
  builtin_plugins: 7,
};

function toLlmsEntry(doc: DocsApiDocDetail) {
  return {
    id: doc.id,
    path: doc.path,
    title: doc.title,
    description: doc.description,
    preview: doc.content.slice(0, 500),
    section: sectionOf(doc.id),
  };
}

function llmsIndex(docs: DocsApiDocDetail[]) {
  const ordered = [...docs].sort((a, b) => {
    const pa = SECTION_PRIORITY[sectionOf(a.id)] ?? 99;
    const pb = SECTION_PRIORITY[sectionOf(b.id)] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.path.localeCompare(b.path);
  });
  return {
    title: "Neo-MoFox Docs",
    description:
      "Neo-MoFox 文档库 LLM 索引，替代 search 接口作为文档检索入口。按 section 分组排序，" +
      "先依据 title / description / preview 判断相关性，再通过 GET /api/docs/<id>.json 获取完整正文。",
    version: 1,
    total: ordered.length,
    docs: ordered.map(toLlmsEntry),
  };
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

      if (relPath === "llms.json") {
        json(res, 200, llmsIndex(all));
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

      // LLM 索引（按 section 排序、含简介与预览，替代 search 作为检索入口）
      await fs.writeFile(
        resolve(apiDir, "llms.json"),
        JSON.stringify(llmsIndex(docs), null, 2),
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