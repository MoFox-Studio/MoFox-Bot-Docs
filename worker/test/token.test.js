import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorker } from '../src/index.js'

const origin = 'https://docs.mofox.chat'
// These deliberately fake values are fixtures, never real OAuth credentials.
const env = { GH_CLIENT_ID: 'test-client-id', GH_CLIENT_SECRET: 'not-a-real-secret' }
const token = 'not-a-real-access-token'

function request({ method = 'POST', headers = {}, body = { code: 'test_authorization_code' }, path = '/token' } = {}) {
  return new Request(`https://worker.example${path}`, {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  })
}

function successWorker(options = {}) {
  return createWorker({
    fetchImpl: async () => Response.json({ access_token: token, token_type: 'bearer', scope: 'public_repo' }),
    ...options,
  })
}

test('exchanges only at the GitHub endpoint and returns only access_token', async () => {
  let calls = 0
  const worker = successWorker({ fetchImpl: async (url, init) => {
    calls += 1
    assert.equal(url, 'https://github.com/login/oauth/access_token')
    assert.equal(init.method, 'POST')
    assert.equal(init.headers.Accept, 'application/json')
    assert.equal(init.redirect, 'error')
    assert.deepEqual(JSON.parse(init.body), {
      client_id: env.GH_CLIENT_ID, client_secret: env.GH_CLIENT_SECRET, code: 'test_authorization_code',
    })
    return Response.json({ access_token: token, token_type: 'bearer', scope: 'public_repo', refresh_token: 'not-exposed' })
  } })
  const response = await worker.fetch(request(), env)
  assert.equal(calls, 1)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.deepEqual(await response.json(), { access_token: token })
})

test('rejects deceptive origins, mismatched/malformed Referer and missing provenance', async () => {
  const worker = successWorker({ fetchImpl: () => { throw new Error('upstream must not be called') } })
  const cases = [
    { Origin: 'https://docs.mofox.chat.evil.example' },
    { Origin: 'http://docs.mofox.chat' },
    { Origin: 'null' },
    { Origin: origin, Referer: 'https://evil.example/page' },
    { Origin: origin, Referer: 'not-a-url' },
    { Origin: 'https://evil.example', Referer: `${origin}/docs/` },
  ]
  for (const headers of cases) {
    const response = await worker.fetch(request({ headers }), env)
    assert.equal(response.status, 403)
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
  }
  const noProvenance = request()
  noProvenance.headers.delete('Origin')
  assert.equal((await worker.fetch(noProvenance, env)).status, 403)
})

test('permits a trusted Referer without Origin and permits a trusted pair', async () => {
  const worker = successWorker()
  const refererOnly = request({ headers: { Referer: `${origin}/docs/feedback/callback/?code=hidden` } })
  refererOnly.headers.delete('Origin')
  assert.equal((await worker.fetch(refererOnly, env)).status, 200)
  assert.equal((await worker.fetch(request({ headers: { Referer: `${origin}/docs/` } }), env)).status, 200)
})

test('handles a valid CORS preflight without consuming rate quota', async () => {
  const worker = successWorker()
  for (let i = 0; i < 12; i += 1) {
    const response = await worker.fetch(request({ method: 'OPTIONS', headers: {
      'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type',
    } }), env)
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
    assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS')
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type')
  }
  assert.equal((await worker.fetch(request(), env)).status, 200)
  assert.equal((await worker.fetch(request({ method: 'OPTIONS', headers: {
    'Access-Control-Request-Method': 'DELETE',
  } }), env)).status, 403)
  assert.equal((await worker.fetch(request({ method: 'OPTIONS', headers: {
    'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization',
  } }), env)).status, 403)
})

test('limits each IP to ten attempts per hour and expires old buckets', async () => {
  let clock = 1000
  const worker = successWorker({ now: () => clock })
  const headers = { 'CF-Connecting-IP': '192.0.2.1' }
  for (let i = 0; i < 10; i += 1) assert.equal((await worker.fetch(request({ headers }), env)).status, 200)
  const limited = await worker.fetch(request({ headers }), env)
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('Retry-After'), '3600')
  assert.equal(limited.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal((await worker.fetch(request({ headers: { 'CF-Connecting-IP': '192.0.2.2' } }), env)).status, 200)
  clock += 60 * 60 * 1000
  assert.equal((await worker.fetch(request({ headers }), env)).status, 200)
})

test('validates JSON code, media type and streamed request size before upstream', async () => {
  const worker = successWorker({ fetchImpl: () => { throw new Error('upstream must not be called') } })
  for (const body of [{ code: '' }, { code: 123 }, { code: 'bad code' }, { code: 'x', extra: true }, [], 'not-json']) {
    assert.equal((await worker.fetch(request({ body }), env)).status, 400)
  }
  assert.equal((await worker.fetch(request({ headers: { 'Content-Type': 'text/plain' } }), env)).status, 415)
  // No Content-Length: the stream itself must enforce the cap.
  assert.equal((await worker.fetch(request({ body: { code: 'x'.repeat(5000) } }), env)).status, 413)
})

test('does not expose GitHub errors or secret-like upstream details', async () => {
  const worker = successWorker({ fetchImpl: async () => Response.json({
    error: 'bad_verification_code', error_description: `private detail ${env.GH_CLIENT_SECRET}`, access_token: token,
  }) })
  const response = await worker.fetch(request(), env)
  const body = await response.text()
  assert.equal(response.status, 400)
  assert.ok(!body.includes(env.GH_CLIENT_SECRET))
  assert.ok(!body.includes(token))
  assert.ok(!body.includes('private detail'))
})

test('maps non-OK, invalid JSON, missing token and network failures to safe errors', async () => {
  const cases = [
    { fetchImpl: async () => new Response('private details', { status: 502 }), status: 502 },
    { fetchImpl: async () => new Response('not-json'), status: 502 },
    { fetchImpl: async () => Response.json({ token_type: 'bearer' }), status: 400 },
    { fetchImpl: async () => { throw new Error('private network details') }, status: 502 },
  ]
  for (const { fetchImpl, status } of cases) {
    const response = await successWorker({ fetchImpl }).fetch(request(), env)
    assert.equal(response.status, status)
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
    assert.ok(!(await response.text()).includes('private'))
  }
})

test('times out a hanging upstream and aborts the request', async () => {
  let signal
  const worker = successWorker({ timeoutMs: 5, fetchImpl: async (_, init) => {
    signal = init.signal
    return new Promise(() => {})
  } })
  const response = await worker.fetch(request(), env)
  assert.equal(response.status, 504)
  assert.equal(signal.aborted, true)
  assert.equal((await response.json()).error, 'github_timeout')
})

test('has only /token POST and reports missing credentials safely', async () => {
  const worker = successWorker()
  assert.equal((await worker.fetch(request({ path: '/elsewhere' }), env)).status, 404)
  const wrongMethod = await worker.fetch(request({ method: 'GET' }), env)
  assert.equal(wrongMethod.status, 405)
  assert.equal(wrongMethod.headers.get('Allow'), 'POST, OPTIONS')
  assert.equal((await worker.fetch(request(), { GH_CLIENT_ID: 'test-client-id' })).status, 503)
})
