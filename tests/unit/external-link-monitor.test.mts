import assert from 'node:assert/strict'
import test from 'node:test'
import { collectTargets, compareResults, createProbe, findBaselineArtifact, issueBody, monitor, normalizedBody, parseReport, publicUrl, retryAfterMs, selectBaselineArtifact, upsertIssue, ISSUE_MARKER } from '../../scripts/external-link-monitor.mts'
import type { LinkResult, LinkTarget } from '../../scripts/external-link-monitor.mts'
import { describeChecks, runChecks } from '../../scripts/check-ci.mjs'
import { ROOT } from '../../scripts/lib/tooling-common.mjs'
const target: LinkTarget = { url: 'https://example.com/reference', docs: ['docs/01-concepts/agent-loop.md'] }
const textResponse = (body = 'Reference', status = 200, extra: Record<string, string> = {}) => new Response(body, { status, headers: { 'content-type': 'text/html', ...extra } })
const baseRow = (): LinkResult => ({ ...target, status: 200, final_url: target.url, content_sha256: 'a'.repeat(64), last_content_sha256: 'a'.repeat(64), outcome: 'ok', reason: null })

test('external references are deduplicated, fragments omitted, document associations retained', () => {
  const targets = collectTargets()
  assert.ok(targets.length > 500)
  assert.equal(new Set(targets.map(row => row.url)).size, targets.length)
  assert.ok(targets.every(row => !new URL(row.url).hash && row.docs.length > 0))
  assert.throws(() => publicUrl('http://127.0.0.1/admin'))
  assert.throws(() => publicUrl('https://user:password@example.com/'))
})
test('scheduled network checks are inventoried as not-run and cannot run through the local check selector', () => {
  const inventory = describeChecks(ROOT)
  assert.ok(inventory.scheduled_checks.some(row => row.id === 'external-link-monitor' && row.result === 'not-run'))
  assert.throws(() => runChecks(ROOT, 'external-link-monitor'), /検査 ID/)
})
test('normalization ignores scripts, style, comments, whitespace and Unicode composition', () => {
  assert.equal(normalizedBody('<style>noise</style><p>A&nbsp; B</p><!-- id --><script>random()</script>', 'text/html'), 'A B')
  assert.equal(normalizedBody('e\u0301\n text', 'text/plain'), 'é text')
  assert.equal(retryAfterMs('3', 0), 3000)
  assert.equal(retryAfterMs('Thu, 01 Jan 1970 00:00:04 GMT', 1000), 3000)
})
test('HEAD unsupported falls back to GET, including redirect chains', async () => {
  const calls: string[] = []
  const fetcher: typeof fetch = async (input, init) => {
    calls.push(`${init?.method} ${String(input)}`)
    if (String(input).endsWith('/reference')) return new Response(null, { status: 302, headers: { location: '/new' } })
    return init?.method === 'HEAD' ? new Response(null, { status: 405 }) : textResponse('<p>Reference</p>')
  }
  const result = await createProbe({ fetcher, intervalMs: 0 })(target)
  assert.equal(result.outcome, 'ok')
  assert.equal(result.final_url, 'https://example.com/new')
  assert.match(result.content_sha256 ?? '', /^[a-f0-9]{64}$/)
  assert.deepEqual(calls.map(row => row.split(' ')[0]), ['HEAD', 'HEAD', 'GET', 'GET'])
})
test('per-host throttle applies across concurrent URLs and redirect hosts', async () => {
  let clock = 0
  const starts: { host: string; at: number }[] = []
  const fetcher: typeof fetch = async input => { starts.push({ host: new URL(String(input)).host, at: clock }); return textResponse() }
  await monitor([target, { ...target, url: 'https://example.com/second' }, { ...target, url: 'https://another.example/ref' }], null, { fetcher, now: () => clock, sleep: async ms => { clock += ms }, intervalMs: 1000, concurrency: 3 })
  const sameHost = starts.filter(row => row.host === 'example.com')
  for (let i = 1; i < sameHost.length; i++) assert.ok(sameHost[i].at - sameHost[i - 1].at >= 1000)
})
test('429 respects Retry-After and long retry is deferred without a GET', async () => {
  let clock = 0
  let calls = 0
  const waits: number[] = []
  const fetcher: typeof fetch = async () => ++calls === 1 ? new Response(null, { status: 429, headers: { 'retry-after': '3' } }) : textResponse()
  const row = await createProbe({ fetcher, now: () => clock, sleep: async ms => { waits.push(ms); clock += ms }, intervalMs: 0 })(target)
  assert.equal(row.outcome, 'ok'); assert.ok(waits.includes(3000))
  calls = 0
  const deferred: typeof fetch = async () => { calls++; return new Response(null, { status: 429, headers: { 'retry-after': '3600' } }) }
  const limited = await createProbe({ fetcher: deferred, intervalMs: 0 })(target)
  assert.equal(calls, 1); assert.equal(limited.outcome, 'unconfirmed')
})
test('a concurrent 429 extends the deadline of another same-host request already sleeping', async () => {
  let clock = 0
  let manual = true
  let resolveHead: (response: Response) => void = () => {}
  let signalSleep: () => void = () => {}
  const sleeping = new Promise<void>(resolve => { signalSleep = resolve })
  const waits: { ms: number; resolve: () => void }[] = []
  const starts: { url: string; at: number }[] = []
  let first = true
  const fetcher: typeof fetch = async input => {
    starts.push({ url: String(input), at: clock })
    if (first) { first = false; return new Promise<Response>(resolve => { resolveHead = resolve }) }
    return textResponse()
  }
  const probe = createProbe({ fetcher, now: () => clock, intervalMs: 1000, sleep: async ms => {
    if (!manual) { clock += ms; return }
    await new Promise<void>(resolve => { waits.push({ ms, resolve }); signalSleep() })
  } })
  const a = probe(target)
  const b = probe({ ...target, url: 'https://example.com/second' })
  await sleeping
  assert.equal(waits[0].ms, 1000)
  clock = 100
  resolveHead(new Response(null, { status: 429, headers: { 'retry-after': '3' } }))
  await new Promise<void>(resolve => setImmediate(resolve))
  clock = 1000
  waits[0].resolve()
  await new Promise<void>(resolve => setImmediate(resolve))
  assert.equal(starts.length, 1, 'the sleeping request must not start at the obsolete t=1000 deadline')
  assert.equal(waits[1].ms, 2100, 'Retry-After moved the shared deadline to t=3100')
  manual = false
  clock = 3100
  waits[1].resolve()
  const results = await Promise.all([a, b])
  assert.ok(starts.slice(1).every(row => row.at >= 3100))
  assert.ok(results.every(row => row.outcome === 'ok'))
})
test('404 and 410 are broken; bot/auth refusal is unconfirmed', async () => {
  for (const status of [404, 410, 401, 403, 429, 500]) {
    const row = await createProbe({ fetcher: async () => new Response(null, { status, headers: { 'retry-after': '3600' } }), intervalMs: 0 })(target)
    assert.equal(row.status, status)
    assert.equal(row.outcome, [404, 410].includes(status) ? 'broken' : 'unconfirmed')
  }
  const headOnly404: typeof fetch = async (_input, init) => init?.method === 'HEAD' ? new Response(null, { status: 404 }) : textResponse()
  assert.equal((await createProbe({ fetcher: headOnly404, intervalMs: 0 })(target)).outcome, 'ok')
})
test('timeouts and body size bounds are unconfirmed', async () => {
  const hanging: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
  assert.equal((await createProbe({ fetcher: hanging, timeoutMs: 10 })(target)).reason, 'timeout')
  assert.equal((await createProbe({ fetcher: async () => textResponse('too large'), maxBytes: 2, intervalMs: 0 })(target)).reason, 'body-size-limit')
})
test('baseline comparison emits article x URL candidates without marking coverage complete', () => {
  const old = compareResults([baseRow()], null, '2026-11-01T00:00:00Z')
  assert.equal(old.summary.content_changed, 0)
  const moved = { ...baseRow(), final_url: 'https://example.com/new', content_sha256: 'b'.repeat(64), docs: [...target.docs, 'docs/01-concepts/tool-use.md'] }
  const report = compareResults([moved], old, '2026-11-04T00:00:00Z')
  assert.equal(report.summary.moved, 1); assert.equal(report.summary.content_changed, 1)
  assert.equal(report.candidates.length, 2)
  assert.ok(report.candidates.every(row => row.changes.includes('content-changed')))
  const failure = compareResults([{ ...baseRow(), outcome: 'unconfirmed', content_sha256: null }], old, '2026-11-05T00:00:00Z')
  assert.equal(failure.results[0].last_content_sha256, 'a'.repeat(64))
  assert.equal(parseReport(JSON.parse(JSON.stringify(failure))).results[0].last_content_sha256, 'a'.repeat(64))
  assert.equal(compareResults([{ ...baseRow(), content_sha256: 'b'.repeat(64) }], failure, '2026-11-06T00:00:00Z').summary.content_changed, 1)
  assert.match(issueBody(report), /正誤や記事の鮮度完了を自動判定しません/)
  assert.equal(parseReport(JSON.parse(JSON.stringify(old))).results.length, 1)
  assert.throws(() => parseReport({ ...old, results: [{ ...baseRow(), content_sha256: 'invalid' }] }))
})
test('baseline selection verifies each run workflow, source repository, branch, event and completed success', async () => {
  const good = { id: 1, path: '.github/workflows/external-link-monitor.yml', head_repository: { full_name: 'owner/repo' }, head_branch: 'main', event: 'schedule', status: 'completed', conclusion: 'success' }
  const runs: Record<number, unknown> = {
    1: good,
    2: { ...good, id: 2, event: 'workflow_dispatch' },
    3: { ...good, id: 3, path: '.github/workflows/unrelated.yml' },
    4: { ...good, id: 4, head_repository: { full_name: 'fork/repo' } },
    5: { ...good, id: 5, head_branch: 'feature' },
    6: { ...good, id: 6, event: 'pull_request' },
    7: { ...good, id: 7, status: 'in_progress' },
    8: { ...good, id: 8, conclusion: 'failure' },
  }
  const artifacts = Object.keys(runs).map(id => ({ id: Number(id) * 10, name: 'external-link-monitor-baseline', expired: false, created_at: `2026-11-0${id}T00:00:00Z`, workflow_run: { id: Number(id), head_branch: 'main' } }))
  const requested: number[] = []
  const readRun = async (id: number) => { requested.push(id); return runs[id] }
  assert.equal(await selectBaselineArtifact({ artifacts }, 'owner/repo', readRun), 20)
  assert.deepEqual(requested, [8, 7, 6, 5, 4, 3, 2])
  assert.equal(await selectBaselineArtifact({ artifacts: [{ ...artifacts[0], expired: true }] }, 'owner/repo', readRun), null)
  assert.equal(await selectBaselineArtifact({ artifacts: [artifacts[0]] }, 'owner/repo', readRun), 10)
  const fetcher: typeof fetch = async input => Response.json(String(input).includes('/actions/artifacts?') ? { artifacts } : runs[Number(String(input).split('/').at(-1))])
  assert.equal(await findBaselineArtifact('owner/repo', 'test-token', fetcher), 20)
})
test('tracking issue upsert reuses the same marker including closed issues', async () => {
  let issue: { number: number; body: string; state: string } | null = null
  let creates = 0
  const fetcher: typeof fetch = async (input, init) => {
    if (init?.method === 'GET') return Response.json(String(input).includes('?') ? issue ? [issue] : [] : issue)
    const body: unknown = JSON.parse(String(init?.body))
    assert.ok(typeof body === 'object' && body !== null && 'body' in body && 'state' in body)
    if (init?.method === 'POST') { creates++; issue = { number: 123, body: String(body.body), state: String(body.state) } }
    else { assert.match(String(input), /\/issues\/123$/); issue = { number: 123, body: String(body.body), state: String(body.state) } }
    return Response.json(issue)
  }
  const findings = compareResults([{ ...baseRow(), status: 404, outcome: 'broken' }], null, '2026-11-04T00:00:00Z')
  assert.equal((await upsertIssue(findings, 'owner/repo', 'test-token', fetcher)).action, 'created')
  await upsertIssue(findings, 'owner/repo', 'test-token', fetcher)
  await upsertIssue(compareResults([baseRow()], null, '2026-11-05T00:00:00Z'), 'owner/repo', 'test-token', fetcher)
  await upsertIssue(findings, 'owner/repo', 'test-token', fetcher)
  assert.equal(creates, 1)
  assert.ok(issue !== null)
  assert.ok((issue as { body: string }).body.startsWith(ISSUE_MARKER))
})
