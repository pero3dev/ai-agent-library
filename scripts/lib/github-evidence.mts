/** GitHub の保存済み自己申告ではなく、対象 PR と実行・公開の実状態を照合する。 */
import { execFileSync } from 'node:child_process'
import { requiredChecks, workflowFor } from './github-policy.mjs'

interface Repository { id: number; full_name: string }
interface Branch { ref: string; sha: string; repo: Repository }
interface PullRequest { number: number; html_url: string; base: Branch; head: Branch; merged: boolean; merge_commit_sha: string }
interface GitCommit { sha: string; tree: { sha: string } }
interface CheckRun { id: number; name: string; app?: { id: number }; head_sha: string; status: string; conclusion: string | null; details_url: string | null; check_suite: { id: number } }
interface WorkflowRun {
  id: number; head_sha: string; event: string; path: string; head_branch: string
  repository: Repository; head_repository: Repository
  pull_requests: Array<{ number: number; head: {ref: string; sha: string; repo: {id: number}}; base: {ref: string; repo: {id: number}} }>
  display_title: string; check_suite_id: number; status: string; conclusion: string | null
}
interface WorkflowJob { id: number; name: string; status: string; conclusion: string | null; html_url: string }
interface Deployment { id: number; sha: string; ref: string; environment: string }
interface DeploymentStatus { id: number; state: string; log_url: string; environment_url: string }
interface CurrentPublication {
  deployment: Deployment; status?: DeploymentStatus; run?: WorkflowRun; job?: WorkflowJob
  comparison?: { status: string; base_commit?: { sha: string }; merge_base_commit?: { sha: string }; url?: string }
}
interface GithubSnapshot {
  pr: PullRequest
  protection: { required_status_checks: { strict: boolean; checks: Array<{ context: string; app_id: number }> }; enforce_admins: { enabled: boolean } }
  checks: CheckRun[]; workflows: Record<number, WorkflowRun>; headCommit: GitCommit; mergeCommit: GitCommit
  mainRuns?: WorkflowRun[]; mainJobs?: Record<number, WorkflowJob[]>; deployments?: Deployment[]
  deploymentStatuses?: Record<number, DeploymentStatus[]>; pagesUrl?: string; currentPublication?: CurrentPublication
}
interface VerifiedUrl { url: string; status: number; content_verified: boolean }
export interface PublicationEvidence {
  verified: boolean; urls: VerifiedUrl[]; state?: string; workflow_run_id?: number; deployment_id?: number
  environment_url?: string; current_deployment_id?: number; current_sha?: string
}
export interface GithubVerification {
  verified: boolean; pr_url: string; head_sha: string; head_tree_sha: string; merge_sha: string; merge_tree_sha: string
  checks: string[]; publication: PublicationEvidence; checked_at?: string
}
export interface GithubVerificationOptions {
  root?: string; prUrl: string; expectedHead: string; expectedTree?: string; requirePublication?: boolean
  publicationUrls?: Array<string | { url: string; includes?: string }>
}
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
const shaPattern = /^[a-f0-9]{40}$/
const sameRepository = (actual: Repository, expected: Repository) => Number.isSafeInteger(expected?.id) && expected.id > 0 && actual?.id === expected.id &&
  typeof actual.full_name === 'string' && actual.full_name.toLowerCase() === expected.full_name?.toLowerCase()

export function parsePrUrl(value: string) {
  const match = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/pull\/([1-9][0-9]*)$/.exec(value ?? '')
  assert(match, 'GitHub の PR URL が必要です')
  return { repo: match[1], number: Number(match[2]) }
}

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
function fields(value: unknown, label: string): Record<string, unknown> {
  assert(object(value), `${label}: GitHub 応答には object が必要です`)
  return value
}
function textField(row: Record<string, unknown>, key: string, label: string): string {
  const value = row[key]
  assert(typeof value === 'string', `${label}.${key}: string が必要です`)
  return value
}
function integerField(row: Record<string, unknown>, key: string, label: string): number {
  const value = row[key]
  assert(typeof value === 'number' && Number.isSafeInteger(value) && value > 0, `${label}.${key}: 正の safe integer が必要です`)
  return value
}
function booleanField(row: Record<string, unknown>, key: string, label: string): boolean {
  const value = row[key]
  assert(typeof value === 'boolean', `${label}.${key}: boolean が必要です`)
  return value
}
function nullableTextField(row: Record<string, unknown>, key: string, label: string): string | null {
  const value = row[key]
  assert(value === null || typeof value === 'string', `${label}.${key}: string または null が必要です`)
  return value
}
function array(value: unknown, label: string): unknown[] {
  assert(Array.isArray(value), `${label}: GitHub 応答には array が必要です`)
  return value
}
function repository(value: unknown): Repository {
  const row = fields(value, 'repository')
  return {id: integerField(row, 'id', 'repository'), full_name: textField(row, 'full_name', 'repository')}
}
function branch(value: unknown): Branch {
  const row = fields(value, 'branch')
  return {ref: textField(row, 'ref', 'branch'), sha: textField(row, 'sha', 'branch'), repo: repository(row.repo)}
}
function pullRequest(value: unknown): PullRequest {
  const row = fields(value, 'pull request')
  return {number: integerField(row, 'number', 'pull request'), html_url: textField(row, 'html_url', 'pull request'),
    base: branch(row.base), head: branch(row.head), merged: booleanField(row, 'merged', 'pull request'), merge_commit_sha: textField(row, 'merge_commit_sha', 'pull request')}
}
function protection(value: unknown): GithubSnapshot['protection'] {
  const row = fields(value, 'branch protection'), checks = fields(row.required_status_checks, 'required_status_checks')
  const admins = fields(row.enforce_admins, 'enforce_admins')
  return {required_status_checks: {strict: booleanField(checks, 'strict', 'required_status_checks'), checks: array(checks.checks, 'required_status_checks.checks').map(value => {
    const check = fields(value, 'required check')
    return {context: textField(check, 'context', 'required check'), app_id: integerField(check, 'app_id', 'required check')}
  })}, enforce_admins: {enabled: booleanField(admins, 'enabled', 'enforce_admins')}}
}
function commit(value: unknown): GitCommit {
  const row = fields(value, 'commit'), tree = fields(row.tree, 'commit.tree')
  return {sha: textField(row, 'sha', 'commit'), tree: {sha: textField(tree, 'sha', 'commit.tree')}}
}
function checkRun(value: unknown): CheckRun {
  const row = fields(value, 'check run'), suite = fields(row.check_suite, 'check run.check_suite')
  return {id: integerField(row, 'id', 'check run'), name: textField(row, 'name', 'check run'), head_sha: textField(row, 'head_sha', 'check run'),
    status: textField(row, 'status', 'check run'), conclusion: nullableTextField(row, 'conclusion', 'check run'), details_url: nullableTextField(row, 'details_url', 'check run'),
    check_suite: {id: integerField(suite, 'id', 'check run.check_suite')},
    ...(row.app === undefined || row.app === null ? {} : {app: {id: integerField(fields(row.app, 'check run.app'), 'id', 'check run.app')}})}
}
function workflowRun(value: unknown): WorkflowRun {
  const row = fields(value, 'workflow run')
  return {id: integerField(row, 'id', 'workflow run'), head_sha: textField(row, 'head_sha', 'workflow run'), event: textField(row, 'event', 'workflow run'),
    path: textField(row, 'path', 'workflow run'), head_branch: textField(row, 'head_branch', 'workflow run'), repository: repository(row.repository), head_repository: repository(row.head_repository),
    pull_requests: array(row.pull_requests, 'workflow run.pull_requests').map(value => {
      const item = fields(value, 'workflow PR'), head = fields(item.head, 'workflow PR.head'), base = fields(item.base, 'workflow PR.base')
      return {number: integerField(item, 'number', 'workflow PR'), head: {ref: textField(head, 'ref', 'workflow PR.head'), sha: textField(head, 'sha', 'workflow PR.head'),
        repo: {id: integerField(fields(head.repo, 'workflow PR.head.repo'), 'id', 'workflow PR.head.repo')}},
        base: {ref: textField(base, 'ref', 'workflow PR.base'), repo: {id: integerField(fields(base.repo, 'workflow PR.base.repo'), 'id', 'workflow PR.base.repo')}}}
    }), display_title: textField(row, 'display_title', 'workflow run'), check_suite_id: integerField(row, 'check_suite_id', 'workflow run'),
    status: textField(row, 'status', 'workflow run'), conclusion: nullableTextField(row, 'conclusion', 'workflow run')}
}
function workflowJob(value: unknown): WorkflowJob {
  const row = fields(value, 'workflow job')
  return {id: integerField(row, 'id', 'workflow job'), name: textField(row, 'name', 'workflow job'), status: textField(row, 'status', 'workflow job'),
    conclusion: nullableTextField(row, 'conclusion', 'workflow job'), html_url: textField(row, 'html_url', 'workflow job')}
}
function deployment(value: unknown): Deployment {
  const row = fields(value, 'deployment')
  return {id: integerField(row, 'id', 'deployment'), sha: textField(row, 'sha', 'deployment'), ref: textField(row, 'ref', 'deployment'), environment: textField(row, 'environment', 'deployment')}
}
function deploymentStatus(value: unknown): DeploymentStatus {
  const row = fields(value, 'deployment status')
  return {id: integerField(row, 'id', 'deployment status'), state: textField(row, 'state', 'deployment status'), log_url: textField(row, 'log_url', 'deployment status'), environment_url: textField(row, 'environment_url', 'deployment status')}
}
function comparison(value: unknown): NonNullable<CurrentPublication['comparison']> {
  const row = fields(value, 'comparison')
  return {status: textField(row, 'status', 'comparison'), ...(row.base_commit === undefined ? {} : {base_commit: {sha: textField(fields(row.base_commit, 'comparison.base_commit'), 'sha', 'comparison.base_commit')}}),
    ...(row.merge_base_commit === undefined ? {} : {merge_base_commit: {sha: textField(fields(row.merge_base_commit, 'comparison.merge_base_commit'), 'sha', 'comparison.merge_base_commit')}}),
    ...(row.url === undefined ? {} : {url: textField(row, 'url', 'comparison')})}
}

/** Structural decoding alone grants no verification or publication authority. */
export const githubResponseDecoders = {pullRequest, protection, commit, checkRun, workflowRun, workflowJob, deployment, deploymentStatus, comparison,
  pages(value: unknown) { return {html_url: textField(fields(value, 'pages'), 'html_url', 'pages')} },
  publicResponse(value: unknown) {
    const row = fields(value, 'public response'), status = integerField(row, 'status', 'public response')
    assert(status >= 200 && status < 300, '公開応答の HTTP status が成功ではありません')
    return {status, url: textField(row, 'url', 'public response'), matches: booleanField(row, 'matches', 'public response')}
  }
}

function readGitHub<T>(root: string, endpoint: string, decode: (value: unknown) => T): T {
  let value: unknown
  try {
    value = JSON.parse(execFileSync('gh', ['api', endpoint], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }))
  } catch {
    throw new Error(`GitHub の状態を取得できません: ${endpoint}`)
  }
  return decode(value)
}

function pages<T>(root: string, endpoint: string, decode: (value: unknown) => T, field?: string): T[] {
  const result: T[] = []
  for (let page = 1; page <= 20; page++) {
    const value = readGitHub(root, `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`, value => value)
    const rows = array(field ? fields(value, 'GitHub の一覧応答')[field] : value, 'GitHub の一覧応答')
    result.push(...rows.map(decode))
    if (rows.length < 100) return result
  }
  throw new Error('GitHub 一覧の取得上限を超えました。確認範囲を省略せず再実行してください')
}

function workflowId(check: CheckRun, repo: string) {
  const escaped = repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`^https://github\\.com/${escaped}/actions/runs/([0-9]+)(?:/job/[0-9]+)?$`, 'i').exec(check.details_url ?? '')
  assert(match, `${check.name}: GitHub Actions の実行 URL がありません`)
  return Number(match[1])
}

/** API fixture に使う純粋判定。これだけの呼出しはライブ確認の証拠にはしない。 */
export function validateGithubSnapshot(snapshot: GithubSnapshot, { repo, expectedHead, expectedTree, requirePublication = false }: { repo: string; expectedHead: string; expectedTree?: string; requirePublication?: boolean }): Omit<GithubVerification, 'verified'> {
  const { pr, protection, checks, workflows, mainRuns = [], mainJobs = {}, deployments = [], deploymentStatuses = {} } = snapshot
  assert(shaPattern.test(expectedHead ?? ''), 'expectedHead は 40 桁の SHA が必要です')
  assert(pr?.base?.repo?.full_name?.toLowerCase() === repo.toLowerCase() && pr.base.ref === 'main', 'PR の base repository / branch が不一致です')
  const identity = parsePrUrl(pr.html_url)
  assert(identity.repo.toLowerCase() === repo.toLowerCase() && identity.number === pr.number, 'PR 番号 / URL が不一致です')
  assert(sameRepository(pr.base.repo, pr.base.repo) && sameRepository(pr.head?.repo, pr.head?.repo), 'PR の repository ID / full_name を取得できません')
  assert(typeof pr.head.ref === 'string' && pr.head.ref.length > 0, 'PR の head branch を取得できません')
  assert(pr.head?.sha === expectedHead, 'PR head が検証対象と異なります')
  assert(pr.merged === true && shaPattern.test(pr.merge_commit_sha ?? ''), 'PR はまだマージされていません')
  const commitTree = (commit: GitCommit, expectedSha: string, label: string) => {
    assert(commit?.sha === expectedSha && shaPattern.test(commit.tree?.sha ?? ''), `${label}: commit / tree が不一致です`)
    return commit.tree.sha
  }
  const headTree = commitTree(snapshot.headCommit, expectedHead, 'PR head')
  const mergeTree = commitTree(snapshot.mergeCommit, pr.merge_commit_sha, 'merge')
  if (expectedTree !== undefined) assert(shaPattern.test(expectedTree) && headTree === expectedTree, 'PR head tree が検証済み候補と異なります')
  assert(protection?.required_status_checks?.strict === true && protection.enforce_admins?.enabled === true, 'main の strict / 管理者保護を確認できません')
  const required = protection.required_status_checks.checks
  assert(Array.isArray(required), '必須チェックを取得できません')
  for (const name of requiredChecks) assert(required.some(item => item.context === name && item.app_id === 15368), `既存の必須チェックが欠けています: ${name}`)
  for (const item of required) {
    assert(item.app_id === 15368, `${item.context}: 想定した GitHub Actions App ではありません`)
    const expected = workflowFor(item.context)
    const candidates = checks.filter(check => check.name === item.context && check.app?.id === 15368 && check.head_sha === expectedHead)
      .sort((a, b) => b.id - a.id)
    const check = candidates[0]
    assert(check && check.status === 'completed' && check.conclusion === 'success', `${item.context}: 対象 head の最新チェックが成功していません`)
    const run = workflows[workflowId(check, repo)]
    assert(run?.head_sha === expectedHead && run.event === expected.event && run.path === expected.path, `${item.context}: workflow / event / head が不一致です`)
    assert(sameRepository(run.repository, pr.base.repo) && sameRepository(run.head_repository, pr.head.repo) && run.head_branch === pr.head.ref, `${item.context}: workflow の repository / head branch が PR と不一致です`)
    assert(Array.isArray(run.pull_requests), `${item.context}: workflow の PR 関連情報を取得できません`)
    if (run.pull_requests.length) assert(run.pull_requests.some(item => item.number === pr.number && item.head?.sha === expectedHead && item.head.ref === pr.head.ref && item.head.repo?.id === pr.head.repo.id && item.base?.ref === 'main' && item.base.repo?.id === pr.base.repo.id), `${item.context}: workflow は別の PR に関連付けられています`)
    // マージ後の API は pull_requests が空になる。trusted-base workflow の不変 run-name
    // で PR 番号を結び、変更可能な PR title や自己申告 artifact は使わない。
    if ('runName' in expected && expected.runName) assert(run.display_title === `${expected.runName}${pr.number}`, `${item.context}: trusted policy の PR イベント結合を確認できません`)
    assert(Number.isInteger(check.check_suite?.id) && check.check_suite.id === run.check_suite_id, `${item.context}: check と workflow の suite が不一致です`)
    assert(run.status === 'completed' && run.conclusion === 'success', `${item.context}: workflow 全体が成功していません`)
  }
  let publication: PublicationEvidence = { verified: false, urls: [] }
  if (requirePublication) {
    const run = mainRuns.filter(item => item.head_sha === pr.merge_commit_sha && item.head_branch === 'main' && item.event === 'push' && item.path === '.github/workflows/ci.yml').sort((a, b) => b.id - a.id)[0]
    assert(run?.status === 'completed' && run.conclusion === 'success', 'マージ SHA の main CI が成功していません')
    const deployJob = mainJobs[run.id]?.filter(job => job.name === 'deploy').sort((a, b) => b.id - a.id)[0]
    assert(deployJob?.status === 'completed' && deployJob.conclusion === 'success', 'main CI の deploy が成功していません')
    const deployment = deployments.filter(item => item.sha === pr.merge_commit_sha && ['main', 'refs/heads/main'].includes(item.ref) && item.environment === 'github-pages').sort((a, b) => b.id - a.id)[0]
    assert(deployment, 'マージ SHA の Pages deployment がありません')
    const history = deploymentStatuses[deployment.id]?.slice().sort((a, b) => b.id - a.id) ?? []
    const status = history[0]
    const success = status?.state === 'success' ? status : history.find(item => item.state === 'success')
    assert(success && ['success', 'inactive'].includes(status?.state), 'Pages deployment の最新状態が success または後続公開による inactive ではありません')
    assert(typeof deployJob.html_url === 'string' && success.log_url === deployJob.html_url, 'deployment と deploy job の実行が一致しません')
    assert(isWithinPages(success.environment_url, snapshot.pagesUrl), 'deployment の公開 URL が Pages 設定と一致しません')
    publication = { verified: true, state: 'current', workflow_run_id: run.id, deployment_id: deployment.id, environment_url: success.environment_url, urls: [] }
    if (status.state === 'inactive') {
      const current = snapshot.currentPublication
      assert(current?.deployment?.environment === 'github-pages' && ['main', 'refs/heads/main'].includes(current.deployment.ref), '後続 main deployment を確認できません')
      assert(current.deployment.id > deployment.id && current.status?.state === 'success', '後続の配信が成功していません')
      assert(current.run?.head_branch === 'main' && current.run.head_sha === current.deployment.sha && current.run.event === 'push' && current.run.path === '.github/workflows/ci.yml' && current.run.status === 'completed' && current.run.conclusion === 'success', '後続の main CI が一致しません')
      assert(current.job?.name === 'deploy' && current.job.status === 'completed' && current.job.conclusion === 'success' && typeof current.job.html_url === 'string' && current.status.log_url === current.job.html_url, '後続 deploy job が一致しません')
      assert(isWithinPages(current.status.environment_url, snapshot.pagesUrl), '後続公開 URL が一致しません')
      const comparisonUrl = `https://api.github.com/repos/${repo}/compare/${pr.merge_commit_sha}...${current.deployment.sha}`
      assert(current.comparison && ['ahead', 'identical'].includes(current.comparison.status) && current.comparison.base_commit?.sha === pr.merge_commit_sha && current.comparison.merge_base_commit?.sha === pr.merge_commit_sha && current.comparison.url?.toLowerCase() === comparisonUrl.toLowerCase(), '後続 main の配信に対象 commit が含まれていません')
      publication.state = 'superseded'
      publication.current_deployment_id = current.deployment.id
      publication.current_sha = current.deployment.sha
    }
  }
  return { pr_url: pr.html_url, head_sha: expectedHead, head_tree_sha: headTree, merge_sha: pr.merge_commit_sha, merge_tree_sha: mergeTree, checks: required.map(item => item.context), publication }
}

export function isWithinPages(value: unknown, baseUrl: unknown) {
  try {
    if (typeof value !== 'string' || typeof baseUrl !== 'string') return false
    const base = new URL(baseUrl), target = new URL(value)
    const prefix = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`
    return base.protocol === 'https:' && target.protocol === 'https:' && !target.username && !target.password && target.origin === base.origin && (target.pathname === base.pathname || target.pathname.startsWith(prefix))
  } catch { return false }
}

/** Typed source is serialized after Node's native type erasure for the child. */
async function probePublishedPage(url: string, includes: string): Promise<void> {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw Error('HTTP ' + response.status)
  const text = await response.text()
  console.log(JSON.stringify({ status: response.status, url: response.url, matches: includes === '' || text.includes(includes) }))
}

function verifyUrl(url: string, includes: string | undefined, baseUrl: string | undefined) {
  const target = new URL(url)
  assert(isWithinPages(target.href, baseUrl), '公開 URL はこのリポジトリの Pages 配下である必要があります')
  assert(includes === undefined || (typeof includes === 'string' && includes.length > 0 && includes.length <= 2000), '本文確認文字列が不正です')
  const code = `await (${probePublishedPage.toString()})(process.argv[1],process.argv[2])`
  let raw: unknown
  try { raw = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code, target.href, includes ?? ''], { encoding: 'utf8', timeout: 25000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })) } catch { throw new Error(`公開 URL を取得できません: ${target.href}`) }
  const response = githubResponseDecoders.publicResponse(raw)
  assert(response.matches && isWithinPages(response.url, baseUrl), `公開本文または最終 URL が一致しません: ${target.href}`)
  return { url: target.href, status: response.status, content_verified: includes !== undefined }
}

/** 終了判定から毎回呼ぶ。保存した verified:true や PR 本文は判定材料にしない。 */
export function verifyGithubEvidence({ root = process.cwd(), prUrl, expectedHead, expectedTree, requirePublication = false, publicationUrls = [] }: GithubVerificationOptions): GithubVerification {
  const { repo, number } = parsePrUrl(prUrl)
  assert(shaPattern.test(expectedHead ?? ''), 'expectedHead は必須です')
  const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const remoteMatch = /^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/.exec(remote)
  assert(remoteMatch?.[1].toLowerCase() === repo.toLowerCase(), 'PR と origin が異なります')
  assert(Array.isArray(publicationUrls) && publicationUrls.length <= 20, '公開 URL は 20 件以内の配列が必要です')
  const prefix = `repos/${repo}`
  const pr = readGitHub(root, `${prefix}/pulls/${number}`, pullRequest)
  assert(pr.number === number && pr.html_url?.toLowerCase() === prUrl.toLowerCase(), '取得した PR が指定 URL と異なります')
  assert(pr.head?.sha === expectedHead, 'PR head が検証対象と異なります')
  assert(pr.merged === true, 'PR はまだマージされていません')
  const protection = readGitHub(root, `${prefix}/branches/main/protection`, githubResponseDecoders.protection)
  const checks = pages(root, `${prefix}/commits/${expectedHead}/check-runs`, checkRun, 'check_runs')
  const workflows: Record<number, WorkflowRun> = {}
  for (const item of protection.required_status_checks?.checks ?? []) {
    const check = checks.filter(c => c.name === item.context && c.app?.id === 15368 && c.head_sha === expectedHead).sort((a, b) => b.id - a.id)[0]
    if (check) { const id = workflowId(check, repo); workflows[id] ??= readGitHub(root, `${prefix}/actions/runs/${id}`, workflowRun) }
  }
  const headCommit = readGitHub(root, `${prefix}/git/commits/${expectedHead}`, commit)
  assert(shaPattern.test(pr.merge_commit_sha ?? ''), 'merge SHA が不正です')
  const mergeCommit = readGitHub(root, `${prefix}/git/commits/${pr.merge_commit_sha}`, commit)
  const snapshot: GithubSnapshot = { pr, protection, checks, workflows, headCommit, mergeCommit }
  if (requirePublication) {
    snapshot.pagesUrl = readGitHub(root, `${prefix}/pages`, githubResponseDecoders.pages).html_url
    snapshot.mainRuns = pages(root, `${prefix}/actions/workflows/ci.yml/runs?event=push&head_sha=${pr.merge_commit_sha}`, workflowRun, 'workflow_runs')
    snapshot.mainJobs = {}
    const latest = snapshot.mainRuns.slice().sort((a, b) => b.id - a.id)[0]
    if (latest) snapshot.mainJobs[latest.id] = pages(root, `${prefix}/actions/runs/${latest.id}/jobs`, workflowJob, 'jobs')
    snapshot.deployments = pages(root, `${prefix}/deployments?sha=${pr.merge_commit_sha}&environment=github-pages`, githubResponseDecoders.deployment)
    snapshot.deploymentStatuses = {}
    const deployment = snapshot.deployments.slice().sort((a, b) => b.id - a.id)[0]
    if (deployment) snapshot.deploymentStatuses[deployment.id] = pages(root, `${prefix}/deployments/${deployment.id}/statuses`, deploymentStatus)
    if (deployment && snapshot.deploymentStatuses[deployment.id]?.slice().sort((a, b) => b.id - a.id)[0]?.state === 'inactive') {
      const latestDeployment = pages(root, `${prefix}/deployments?environment=github-pages`, githubResponseDecoders.deployment).sort((a, b) => b.id - a.id)[0]
      assert(latestDeployment && shaPattern.test(latestDeployment.sha), '後続 deployment の SHA が不正です')
      const current: CurrentPublication = { deployment: latestDeployment }
      current.status = pages(root, `${prefix}/deployments/${latestDeployment.id}/statuses`, deploymentStatus).sort((a, b) => b.id - a.id)[0]
      current.run = pages(root, `${prefix}/actions/workflows/ci.yml/runs?event=push&head_sha=${latestDeployment.sha}`, workflowRun, 'workflow_runs').sort((a, b) => b.id - a.id)[0]
      if (current.run) current.job = pages(root, `${prefix}/actions/runs/${current.run.id}/jobs`, workflowJob, 'jobs').filter(job => job.name === 'deploy').sort((a, b) => b.id - a.id)[0]
      current.comparison = readGitHub(root, `${prefix}/compare/${pr.merge_commit_sha}...${latestDeployment.sha}`, comparison)
      snapshot.currentPublication = current
    }
  }
  const result = validateGithubSnapshot(snapshot, { repo, expectedHead, expectedTree, requirePublication })
  if (requirePublication && publicationUrls.length) {
    result.publication.urls = publicationUrls.map(item => typeof item === 'string' ? verifyUrl(item, undefined, snapshot.pagesUrl) : verifyUrl(item.url, item.includes, snapshot.pagesUrl))
  }
  return { verified: true, ...result, checked_at: new Date().toISOString() }
}
