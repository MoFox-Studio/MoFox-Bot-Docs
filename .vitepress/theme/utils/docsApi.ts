/**
 * 文档 JSON API 客户端助手
 *
 * 与 .vitepress/plugins/docs-api.ts 配套使用，开发服务器与静态托管行为完全一致：
 *
 *   getAllDocs()              → 获取所有文档（元信息）
 *   searchDocs(q)             → 按标题 / 路径 / id 搜索文档
 *   searchDocsContent(q)      → 按文档正文文字搜索文档（结果含正文文本）
 *   getDoc(id)                → 获取指定文档（含正文文本）
 *
 * 内部通过 fetch 请求 /api/docs/* 下的静态 JSON（开发时由中间件实时生成，
 * 构建后由插件写入产物目录），因此无需后端服务即可在任意静态页面上使用。
 */

export interface DocsApiDoc {
  id: string;
  path: string;
  title: string;
  description: string;
}

export interface DocsApiDocDetail extends DocsApiDoc {
  content: string;
}

export interface DocsApiIndex {
  total: number;
  docs: DocsApiDoc[];
}

export interface DocsApiSearch {
  query: string;
  total: number;
  results: DocsApiDoc[] | DocsApiDocDetail[];
}

const BASE = "/api/docs";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`文档 API 请求失败 (${res.status}): ${url}`);
  }
  return (await res.json()) as T;
}

/** 获取所有文档（仅元信息）。 */
export async function getAllDocs(): Promise<DocsApiDoc[]> {
  const data = await getJson<DocsApiIndex>(`${BASE}/index.json`);
  return data.docs;
}

/** 按标题 / 路径 / id 搜索文档。 */
export async function searchDocs(query: string): Promise<DocsApiDoc[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const data = await getJson<DocsApiSearch>(`${BASE}/search.json`);
  const results = data.results as DocsApiDoc[];
  return results.filter((doc) =>
    `${doc.title}\n${doc.path}\n${doc.id}`.toLowerCase().includes(q),
  );
}

/** 按文档正文文字搜索文档（结果含正文文本）。 */
export async function searchDocsContent(
  query: string,
): Promise<DocsApiDocDetail[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const data = await getJson<DocsApiSearch>(`${BASE}/search-content.json`);
  const results = data.results as DocsApiDocDetail[];
  return results.filter((doc) => doc.content.toLowerCase().includes(q));
}

/** 获取指定文档（含正文文本）。id 形如 guides/index、plugin_develop/api/action-api。 */
export async function getDoc(id: string): Promise<DocsApiDocDetail> {
  return getJson<DocsApiDocDetail>(`${BASE}/${id}.json`);
}