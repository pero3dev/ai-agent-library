#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectDocs, REPO_ROOT } from './lib/md-utils.mjs'
import { parseMarkdownLinks } from './lib/markdown-links.mjs'

export interface LinkTarget { url: string; docs: string[] }
export type Outcome = 'ok' | 'broken' | 'unconfirmed'
export interface LinkResult extends LinkTarget {
  status: number | null; final_url: string; content_sha256: string | null
  last_content_sha256: string | null; outcome: Outcome; reason: string | null
}
export interface Candidate { doc: string; url: string; changes: string[] }
export interface MonitorReport {
  schema_version: 1; checked_at: string; baseline_checked_at: string | null
  summary: { urls: number; broken: number; moved: number; unconfirmed: number; content_changed: number }
  results: LinkResult[]; candidates: Candidate[]
}
interface MonitorOptions {
  fetcher?: typeof fetch; now?: () => number; sleep?: (ms: number) => Promise<void>
  intervalMs?: number; timeoutMs?: number; maxBytes?: number; concurrency?: number
}
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
export const ISSUE_MARKER = '<!-- ai-agent-library:external-link-monitor -->'

export function publicUrl(raw: string): string {
  const url = new URL(raw)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /^(localhost|.*\.localhost|127\..*|0\..*|10\..*|192\.168\..*|169\.254\..*|172\.(1[6-9]|2\d|3[01])\..*|\[.*\])$/i.test(url.hostname)) throw new Error('Unsupported public HTTP URL')
  url.hash = ''
  return url.href
}

export function collectTargets(root = REPO_ROOT): LinkTarget[] {
  const targets = new Map<string, Set<string>>()
  for (const doc of collectDocs(root).filter(row => !row.isReadme)) {
    for (const link of parseMarkdownLinks(readFileSync(doc.abs, 'utf8')).links) {
      if (!/^https?:\/\//i.test(link.target)) continue
      const url = publicUrl(link.target)
      if (!targets.has(url)) targets.set(url, new Set())
      targets.get(url)!.add(doc.repoRel)
    }
  }
  return [...targets].sort(([a], [b]) => a.localeCompare(b)).map(([url, docs]) => ({ url, docs: [...docs].sort() }))
}

export function normalizedBody(text: string, contentType: string): string {
  return (contentType.includes('html') ? text.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|#160);/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>') : text).normalize('NFC').replace(/\s+/g, ' ').trim()
}
export function retryAfterMs(value: string | null, now: number): number {
  if (!value) return 1000
  if (/^\d+$/.test(value.trim())) return Number(value) * 1000
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - now) : 1000
}

export function createProbe(options: MonitorOptions = {}) {
  const fetcher = options.fetcher ?? fetch
  const now = options.now ?? Date.now
  const sleep = options.sleep ?? delay
  const interval = options.intervalMs ?? 1000
  const timeout = options.timeoutMs ?? 15000
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024
  const queues = new Map<string, Promise<void>>()
  const nextRequest = new Map<string, number>()
  async function throttle(url: string) {
    const host = new URL(url).host
    const preceding = queues.get(host) ?? Promise.resolve()
    let release: () => void = () => {}
    const current = new Promise<void>(resolve => { release = resolve })
    queues.set(host, current)
    await preceding
    try {
      // An in-flight request can extend Retry-After while this slot sleeps.
      // Re-read the shared deadline after every wakeup before starting a request.
      while (true) {
        const wait = Math.max(0, (nextRequest.get(host) ?? 0) - now())
        if (wait > 60000) throw new Error('rate-deferred')
        if (wait) { await sleep(wait); continue }
        nextRequest.set(host, Math.max(nextRequest.get(host) ?? 0, now()) + interval)
        return release
      }
    } catch (error) { release(); throw error }
  }
  async function request(initial: string, method: 'HEAD' | 'GET'): Promise<{ response: Response; final: string; controller: AbortController; timer: ReturnType<typeof setTimeout> }> {
    let url = initial
    let retried = false
    for (let redirects = 0; redirects <= 8; redirects++) {
      const release = await throttle(url)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      let response: Response
      try {
        let pending: Promise<Response>
        try { pending = fetcher(url, { method, redirect: 'manual', signal: controller.signal, headers: { 'User-Agent': 'ReferenceLinkMonitor/1.0', Accept: 'text/html,text/plain,application/json;q=0.9,*/*;q=0.1' } }) }
        finally { release() }
        response = await pending
      }
      catch (error) { clearTimeout(timer); throw error }
      if (response.status === 429 && !retried) {
        const wait = retryAfterMs(response.headers.get('retry-after'), now())
        clearTimeout(timer); await response.body?.cancel()
        const host = new URL(url).host
        nextRequest.set(host, Math.max(nextRequest.get(host) ?? 0, now() + wait))
        // Never retry before Retry-After; a delay beyond this run's bound is deferred.
        if (wait > 60000) return { response, final: url, controller, timer }
        retried = true; redirects--; continue
      }
      if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.has('location')) {
        clearTimeout(timer); await response.body?.cancel()
        url = publicUrl(new URL(response.headers.get('location')!, url).href)
        continue
      }
      return { response, final: url, controller, timer }
    }
    throw new Error('redirect-limit')
  }
  return async (target: LinkTarget): Promise<LinkResult> => {
    let status: number | null = null
    let final = target.url
    try {
      const head = await request(target.url, 'HEAD')
      clearTimeout(head.timer); await head.response.body?.cancel()
      status = head.response.status; final = head.final
      if (status === 429) return { ...target, status, final_url: final, content_sha256: null, last_content_sha256: null, outcome: 'unconfirmed', reason: 'access-or-rate-limit' }
      // GET is also needed after a successful HEAD to compare the normalized body.
      const get = await request(target.url, 'GET')
      status = get.response.status; final = get.final
      try {
        if ([404, 410].includes(status)) return { ...target, status, final_url: final, content_sha256: null, last_content_sha256: null, outcome: 'broken', reason: 'http-not-found' }
        if (!get.response.ok) return { ...target, status, final_url: final, content_sha256: null, last_content_sha256: null, outcome: 'unconfirmed', reason: [401, 403, 429].includes(status) ? 'access-or-rate-limit' : 'http-error' }
        const contentType = get.response.headers.get('content-type') ?? ''
        if (!/text\/|json|xml|javascript/.test(contentType)) return { ...target, status, final_url: final, content_sha256: null, last_content_sha256: null, outcome: 'ok', reason: 'non-text-body' }
        const reader = get.response.body?.getReader()
        const chunks: Uint8Array[] = []
        let bytes = 0
        if (reader) while (true) {
          const { done, value } = await reader.read()
          if (done) break
          bytes += value.byteLength
          if (bytes > maxBytes) { await reader.cancel(); return { ...target, status, final_url: final, content_sha256: null, last_content_sha256: null, outcome: 'unconfirmed', reason: 'body-size-limit' } }
          chunks.push(value)
        }
        const body = normalizedBody(Buffer.concat(chunks).toString('utf8'), contentType)
        const digest = createHash('sha256').update(body).digest('hex')
        return { ...target, status, final_url: final, content_sha256: digest, last_content_sha256: digest, outcome: 'ok', reason: null }
      } finally { clearTimeout(get.timer); await get.response.body?.cancel().catch(() => {}) }
    } catch (error) {
      return { ...target, status, final_url: final, content_sha256: null, last_content_sha256: null, outcome: 'unconfirmed', reason: error instanceof Error && /abort|timeout/i.test(error.name + error.message) ? 'timeout' : error instanceof Error && error.message === 'rate-deferred' ? 'access-or-rate-limit' : 'network-or-redirect-error' }
    }
  }
}

export function compareResults(results: LinkResult[], previous: MonitorReport | null, checkedAt: string): MonitorReport {
  const old = new Map(previous?.results.map(row => [row.url, row]) ?? [])
  const candidates: Candidate[] = []
  let contentChanged = 0
  for (const row of results) {
    const prior = old.get(row.url)
    const changes: string[] = []
    if (row.outcome === 'broken') changes.push('broken')
    if (row.outcome === 'unconfirmed') changes.push('unconfirmed')
    if (row.final_url !== row.url) changes.push('moved')
    const priorDigest = prior?.content_sha256 ?? prior?.last_content_sha256
    if (row.content_sha256 && priorDigest && row.content_sha256 !== priorDigest) { changes.push('content-changed'); contentChanged++ }
    if (prior && prior.final_url !== row.final_url && !changes.includes('moved')) changes.push('destination-changed')
    if (prior && prior.outcome !== 'ok' && row.outcome === 'ok') changes.push('recovered')
    row.last_content_sha256 = row.content_sha256 ?? priorDigest ?? null
    if (changes.length) for (const doc of row.docs) candidates.push({ doc, url: row.url, changes: [...changes] })
  }
  return { schema_version: 1, checked_at: checkedAt, baseline_checked_at: previous?.checked_at ?? null, summary: { urls: results.length, broken: results.filter(row => row.outcome === 'broken').length, moved: results.filter(row => row.final_url !== row.url).length, unconfirmed: results.filter(row => row.outcome === 'unconfirmed').length, content_changed: contentChanged }, results, candidates }
}
export async function monitor(targets: LinkTarget[], previous: MonitorReport | null = null, options: MonitorOptions = {}): Promise<MonitorReport> {
  const probe = createProbe(options)
  const results = new Array<LinkResult>(targets.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(options.concurrency ?? 12, targets.length) }, async () => {
    while (cursor < targets.length) { const index = cursor++; results[index] = await probe(targets[index]) }
  }))
  return compareResults(results, previous, new Date((options.now ?? Date.now)()).toISOString())
}

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
export async function selectBaselineArtifact(value: unknown, repository: string, readRun: (id: number) => Promise<unknown>): Promise<number | null> {
  if (!record(value) || !Array.isArray(value.artifacts)) throw new Error('Invalid GitHub artifact list')
  const candidates: { id: number; run: number; created: number }[] = []
  for (const artifact of value.artifacts as unknown[]) {
    if (!record(artifact) || artifact.name !== 'external-link-monitor-baseline' || artifact.expired !== false || typeof artifact.id !== 'number' || !Number.isSafeInteger(artifact.id) || artifact.id < 1 || !record(artifact.workflow_run) || typeof artifact.workflow_run.id !== 'number' || !Number.isSafeInteger(artifact.workflow_run.id) || typeof artifact.created_at !== 'string') continue
    const created = Date.parse(artifact.created_at)
    if (Number.isFinite(created)) candidates.push({ id: artifact.id, run: artifact.workflow_run.id, created })
  }
  candidates.sort((a, b) => b.created - a.created || b.id - a.id)
  for (const candidate of candidates) {
    const run = await readRun(candidate.run)
    if (record(run) && run.id === candidate.run && run.path === '.github/workflows/external-link-monitor.yml' && record(run.head_repository) && run.head_repository.full_name === repository && run.head_branch === 'main' && ['schedule', 'workflow_dispatch'].includes(String(run.event)) && run.status === 'completed' && run.conclusion === 'success') return candidate.id
  }
  return null
}
export async function findBaselineArtifact(repository: string, token: string, fetcher: typeof fetch = fetch): Promise<number | null> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Invalid repository')
  const base = `https://api.github.com/repos/${repository}`
  const get = async (endpoint: string): Promise<unknown> => {
    const response = await fetcher(base + endpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } })
    if (!response.ok) throw new Error(`GitHub baseline lookup failed: ${response.status}`)
    return response.json()
  }
  for (let page = 1; ; page++) {
    const artifacts = await get(`/actions/artifacts?name=external-link-monitor-baseline&per_page=100&page=${page}`)
    const selected = await selectBaselineArtifact(artifacts, repository, id => get(`/actions/runs/${id}`))
    if (selected !== null) return selected
    if (!record(artifacts) || !Array.isArray(artifacts.artifacts) || artifacts.artifacts.length < 100) return null
  }
}
export function parseReport(value: unknown): MonitorReport {
  if (!record(value) || value.schema_version !== 1 || typeof value.checked_at !== 'string' || !Number.isFinite(Date.parse(value.checked_at)) || !Array.isArray(value.results)) throw new Error('Invalid link monitor baseline')
  const urls = new Set<string>()
  const results = value.results.map((raw: unknown): LinkResult => {
    if (!record(raw) || typeof raw.url !== 'string' || publicUrl(raw.url) !== raw.url || urls.has(raw.url) || typeof raw.final_url !== 'string' || publicUrl(raw.final_url) !== raw.final_url || !Array.isArray(raw.docs) || !raw.docs.every(doc => typeof doc === 'string' && /^docs\/[^\\]+\.md$/.test(doc)) || !['ok', 'broken', 'unconfirmed'].includes(String(raw.outcome)) || !(raw.status === null || Number.isInteger(raw.status) && Number(raw.status) >= 100 && Number(raw.status) <= 599) || ![raw.content_sha256, raw.last_content_sha256].every(hash => hash === null || typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)) || !(raw.reason === null || typeof raw.reason === 'string')) throw new Error('Invalid link monitor row')
    urls.add(raw.url)
    return { url: raw.url, docs: raw.docs as string[], status: raw.status as number | null, final_url: raw.final_url, content_sha256: raw.content_sha256 as string | null, last_content_sha256: raw.last_content_sha256 as string | null, outcome: raw.outcome as Outcome, reason: raw.reason as string | null }
  })
  const report = compareResults(results.map(row => ({ ...row })), null, value.checked_at)
  report.results = results
  return report
}
export function issueBody(report: MonitorReport): string {
  const s = report.summary
  const rows: string[] = []
  let length = 0
  for (const row of report.candidates.slice(0, 100)) {
    const line = `| \`${row.doc}\` | ${row.changes.join(', ')} | <${row.url.replaceAll('|', '%7C')}> |`
    if (length + line.length > 48000) break
    rows.push(line); length += line.length
  }
  return `${ISSUE_MARKER}\n# 外部リンクの再確認候補\n\n確認日時: ${report.checked_at}。対象 ${s.urls} URL、404/410 ${s.broken}、移転 ${s.moved}、取得未確認 ${s.unconfirmed}、本文ハッシュ変化 ${s.content_changed}。\n\n本文の変化は再確認候補です。正誤や記事の鮮度完了を自動判定しません。401/403/429・タイムアウト・取得障害はリンク切れに含めません。初回は比較基線を作り、本文変化を判定しません。\n\n| 記事 | 候補理由 | URL |\n| --- | --- | --- |\n${rows.join('\n')}\n\n全 ${report.candidates.length} 記事×URLの結果と状態コード・最終URL・SHA-256は [週次実行のartifact](https://github.com/pero3dev/ai-agent-library/actions/workflows/external-link-monitor.yml) に保存します。表示は先頭100件です。自動修正は行いません。\n`
}

export async function upsertIssue(report: MonitorReport, repository: string, token: string, fetcher: typeof fetch = fetch): Promise<{ action: string; number: number | null }> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Invalid repository')
  const base = `https://api.github.com/repos/${repository}`
  async function api(endpoint: string, method = 'GET', body?: unknown): Promise<unknown> {
    const response = await fetcher(base + endpoint, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
    if (!response.ok) throw new Error(`GitHub issue operation failed: ${response.status}`)
    return response.json()
  }
  let existing: { number: number; state: string } | null = null
  for (let page = 1; ; page++) {
    const issues = await api(`/issues?state=all&per_page=100&page=${page}`)
    if (!Array.isArray(issues)) throw new Error('Invalid GitHub issue list')
    for (const issue of issues) if (record(issue) && !issue.pull_request && typeof issue.body === 'string' && issue.body.startsWith(ISSUE_MARKER) && typeof issue.number === 'number' && typeof issue.state === 'string') {
      if (!existing || issue.number < existing.number) existing = { number: issue.number, state: issue.state }
    }
    if (issues.length < 100) break
  }
  if (!report.candidates.length && !existing) return { action: 'no-findings', number: null }
  const body = { body: issueBody(report), state: report.candidates.length ? 'open' : 'closed', ...(report.candidates.length ? {} : { state_reason: 'completed' }) }
  const result = existing ? await api(`/issues/${existing.number}`, 'PATCH', body) : await api('/issues', 'POST', { title: '[external-link-monitor] 外部参照の移転・変化・取得未確認を確認する', ...body })
  if (!record(result) || typeof result.number !== 'number') throw new Error('Invalid GitHub issue mutation result')
  const confirmed = await api(`/issues/${result.number}`)
  if (!record(confirmed) || confirmed.number !== result.number || confirmed.body !== body.body || confirmed.state !== body.state) throw new Error('GitHub issue readback does not match the requested report')
  return { action: existing ? 'updated' : 'created', number: result.number }
}

export async function runCli() {
  const args = process.argv.slice(2)
  if (args.includes('--baseline-artifact')) {
    if (args.length !== 1 || !process.env.GH_TOKEN || !process.env.GH_REPO) throw new Error('--baseline-artifact requires GH_TOKEN and GH_REPO and cannot be combined with other arguments')
    const selected = await findBaselineArtifact(process.env.GH_REPO, process.env.GH_TOKEN)
    if (selected !== null) console.log(selected)
    return
  }
  const values = new Map<string, string>()
  let update = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--update-issue') { update = true; continue }
    if (!['--root', '--out', '--previous', '--limit'].includes(args[i]) || values.has(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Invalid monitor arguments')
    values.set(args[i], args[++i])
  }
  const out = path.resolve(values.get('--out') ?? '.local/external-link-monitor')
  const previousFile = values.get('--previous')
  const previous = previousFile && existsSync(previousFile) ? parseReport(JSON.parse(readFileSync(previousFile, 'utf8'))) : null
  const targets = collectTargets(values.get('--root') ?? REPO_ROOT)
  const limit = values.has('--limit') ? Number(values.get('--limit')) : targets.length
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Invalid URL limit')
  const report = await monitor(targets.slice(0, limit), previous)
  const json = JSON.stringify(report, null, 2) + '\n'
  if (Buffer.byteLength(json) > 1024 * 1024) throw new Error('Monitor JSON exceeds 1 MiB; keep the report in an artifact and reduce fields before committing')
  mkdirSync(out, { recursive: true })
  writeFileSync(path.join(out, 'report.json'), json)
  writeFileSync(path.join(out, 'issue-body.md'), issueBody(report))
  console.log(JSON.stringify({ checked_at: report.checked_at, baseline_checked_at: report.baseline_checked_at, summary: report.summary, candidates: report.candidates.length, bytes: Buffer.byteLength(json) }))
  if (update) {
    if (!process.env.GH_TOKEN || !process.env.GH_REPO) throw new Error('GH_TOKEN and GH_REPO are required to update the tracking issue')
    console.log(JSON.stringify(await upsertIssue(report, process.env.GH_REPO, process.env.GH_TOKEN)))
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
