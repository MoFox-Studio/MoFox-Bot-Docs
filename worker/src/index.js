const SITE_ORIGIN = 'https://docs.mofox.chat'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const MAX_BODY_BYTES = 4096
const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT = 10
const MAX_RATE_BUCKETS = 10000

// Origin is mandatory for normal browser POSTs. A trusted Referer may be used
// by clients without Origin; if both are present, both must be trusted.
function isTrustedRequest(request) {
  const origin = request.headers.get('Origin')
  const referer = request.headers.get('Referer')
  if (origin !== null && origin !== SITE_ORIGIN) return false
  if (referer !== null) {
    try {
      if (new URL(referer).origin !== SITE_ORIGIN) return false
    } catch {
      return false
    }
  }
  return origin === SITE_ORIGIN || referer !== null
}

function responseHeaders(trusted) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  })
  if (trusted) headers.set('Access-Control-Allow-Origin', SITE_ORIGIN)
  return headers
}

function jsonResponse(body, status, trusted, extraHeaders = {}) {
  const headers = responseHeaders(trusted)
  for (const [key, value] of Object.entries(extraHeaders)) headers.set(key, value)
  return new Response(JSON.stringify(body), { status, headers })
}

function errorResponse(error, message, status, trusted, extraHeaders) {
  return jsonResponse({ error, message }, status, trusted, extraHeaders)
}

// Stream the request body so a missing Content-Length cannot bypass the limit.
async function readCode(request) {
  const contentLength = request.headers.get('Content-Length')
  if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
    return { error: 'payload_too_large', status: 413 }
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return { error: 'unsupported_media_type', status: 415 }
  }
  if (!request.body) return { error: 'invalid_code', status: 400 }

  const reader = request.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        return { error: 'payload_too_large', status: 413 }
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).length !== 1 || typeof body.code !== 'string'
      || !/^[A-Za-z0-9_-]{1,1024}$/.test(body.code)) {
      return { error: 'invalid_code', status: 400 }
    }
    return { code: body.code }
  } catch {
    return { error: 'invalid_code', status: 400 }
  } finally {
    reader.releaseLock()
  }
}

// A factory keeps each isolate's rate-limit state private and permits tests to
// inject a fake clock/upstream. No request body, secret or token is logged.
export function createWorker({ fetchImpl = fetch, now = Date.now, timeoutMs = 10000 } = {}) {
  const buckets = new Map()
  let lastCleanup = 0

  function consumeRateLimit(ip) {
    const time = now()
    if (time - lastCleanup >= 60000 || buckets.size >= MAX_RATE_BUCKETS) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= time) buckets.delete(key)
      }
      lastCleanup = time
    }
    let bucket = buckets.get(ip)
    if (!bucket || bucket.resetAt <= time) {
      if (!bucket && buckets.size >= MAX_RATE_BUCKETS) return { capacityExceeded: true }
      bucket = { count: 0, resetAt: time + RATE_WINDOW_MS }
      buckets.set(ip, bucket)
    }
    if (bucket.count >= RATE_LIMIT) {
      return { retryAfter: Math.max(1, Math.ceil((bucket.resetAt - time) / 1000)) }
    }
    bucket.count += 1
    return {}
  }

  return {
    async fetch(request, env) {
      const trusted = isTrustedRequest(request)
      if (!trusted) return errorResponse('origin_not_allowed', '此来源无权使用登录服务。', 403, false)
      if (new URL(request.url).pathname !== '/token') {
        return errorResponse('not_found', '接口不存在。', 404, true)
      }
      if (request.method === 'OPTIONS') {
        const requestedMethod = request.headers.get('Access-Control-Request-Method')
        const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '')
          .split(',').map(header => header.trim().toLowerCase()).filter(Boolean)
        if (requestedMethod !== 'POST' || requestedHeaders.some(header => header !== 'content-type')) {
          return errorResponse('preflight_not_allowed', '不支持此预检请求。', 403, true)
        }
        const headers = responseHeaders(true)
        headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
        headers.set('Access-Control-Allow-Headers', 'Content-Type')
        headers.set('Access-Control-Max-Age', '600')
        headers.set('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers')
        return new Response(null, { status: 204, headers })
      }
      if (request.method !== 'POST') {
        return errorResponse('method_not_allowed', '请使用 POST 请求。', 405, true, { Allow: 'POST, OPTIONS' })
      }
      // Cloudflare sets CF-Connecting-IP in production. Local dev uses one
      // shared bucket when the header is absent; do not trust X-Forwarded-For.
      const rate = consumeRateLimit(request.headers.get('CF-Connecting-IP') || 'unknown')
      if (rate.capacityExceeded) {
        return errorResponse('service_busy', '登录服务繁忙，请稍后再试。', 503, true)
      }
      if (rate.retryAfter) {
        return errorResponse('rate_limited', '登录尝试过于频繁，请稍后再试。', 429, true, {
          'Retry-After': String(rate.retryAfter),
          'Access-Control-Expose-Headers': 'Retry-After',
        })
      }
      const input = await readCode(request)
      if (input.error) {
        return errorResponse(input.error, '请提交有效的 JSON 授权码（请求体不超过 4 KB）。', input.status, true)
      }
      if (!env || typeof env.GH_CLIENT_ID !== 'string' || !env.GH_CLIENT_ID.trim()
        || typeof env.GH_CLIENT_SECRET !== 'string' || !env.GH_CLIENT_SECRET.trim()) {
        return errorResponse('service_not_configured', '登录服务尚未配置，请联系维护者。', 503, true)
      }

      const controller = new AbortController()
      let timeout
      let timedOut = false
      try {
        const exchange = async () => {
          const upstream = await fetchImpl(GITHUB_TOKEN_URL, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'MoFox-Bot-Docs-OAuth',
            },
            body: JSON.stringify({
              client_id: env.GH_CLIENT_ID,
              client_secret: env.GH_CLIENT_SECRET,
              code: input.code,
            }),
            redirect: 'error',
            signal: controller.signal,
          })
          if (!upstream.ok) return { unavailable: true }
          return { data: await upstream.json() }
        }
        const result = await Promise.race([
          exchange(),
          new Promise((_, reject) => {
            timeout = setTimeout(() => {
              timedOut = true
              controller.abort()
              reject(new Error('upstream_timeout'))
            }, timeoutMs)
          }),
        ])
        if (result.unavailable) {
          return errorResponse('github_unavailable', 'GitHub 登录服务暂时不可用，请重新登录。', 502, true)
        }
        const token = result.data?.access_token
        if (result.data?.error || typeof token !== 'string' || !token || token.length > 4096) {
          // GitHub may return OAuth errors with HTTP 200. Never relay its body:
          // it can include details unsuitable for the browser or logs.
          return errorResponse('exchange_failed', '授权码无效或已过期，请返回来源页重新登录。', 400, true)
        }
        return jsonResponse({ access_token: token }, 200, true)
      } catch {
        return errorResponse(
          timedOut ? 'github_timeout' : 'github_unavailable',
          timedOut ? 'GitHub 登录服务响应超时，请重新登录。' : '无法连接 GitHub 登录服务，请稍后重试。',
          timedOut ? 504 : 502,
          true,
        )
      } finally {
        clearTimeout(timeout)
      }
    },
  }
}

export default createWorker()
