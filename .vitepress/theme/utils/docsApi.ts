/**
 * 文档 JSON API 客户端助手
 *
 * 与 .vitepress/plugins/docs-api.ts 配套使用，开发服务器与静态托管行为完全一致：
 *
 *   getAllDocs()              → 获取所有文档（元信息）
 *   getDoc(id)                → 获取指定文档（含正文文本）
 *
 * 检索请使用 GET /api/docs/llms.json（按 section 排序的完整清单，
 * 依据 title / description / preview 判断相关性后，再用 getDoc 取正文）。
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

/** 获取指定文档（含正文文本）。id 形如 guides/index、plugin_develop/api/action-api。 */
export async function getDoc(id: string): Promise<DocsApiDocDetail> {
  return getJson<DocsApiDocDetail>(`${BASE}/${id}.json`);
}