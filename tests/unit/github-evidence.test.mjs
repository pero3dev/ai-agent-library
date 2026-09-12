import assert from 'node:assert/strict'
import test from 'node:test'
import { isWithinPages, parsePrUrl, validateGithubSnapshot } from '../../scripts/lib/github-evidence.mjs'
import { requiredChecks, requiredWorkflows } from '../../scripts/lib/github-policy.mjs'

const head = 'a'.repeat(40), merge = 'b'.repeat(40), repo = 'owner/library'
const headTree = 'c'.repeat(40), mergeTree = 'd'.repeat(40), headBranch = 'fix/example'
function fixture() {
  const names = requiredChecks
  const checks = names.map((name, i) => ({ id: i + 1, name, app: { id: 15368 }, head_sha: head, check_suite: { id: i + 10 }, status: 'completed', conclusion: 'success', details_url: `https://github.com/${repo}/actions/runs/${i + 1}/job/${i + 1}` }))
  const workflows = Object.fromEntries(checks.map(c => [c.id, { head_sha: head, head_branch: headBranch, repository: { id: 10, full_name: repo }, head_repository: { id: 10, full_name: repo }, pull_requests: [], display_title: `${requiredWorkflows[c.name].runName ?? 'CI PR #'}1`, check_suite_id: c.check_suite.id, event: c.name.endsWith('-policy') ? 'pull_request_target' : 'pull_request', path: `.github/workflows/${c.name.endsWith('-policy') ? c.name : 'ci'}.yml`, status: 'completed', conclusion: 'success' }]))
  return {
    pr: { number: 1, html_url: `https://github.com/${repo}/pull/1`, base: { ref: 'main', repo: { id: 10, full_name: repo } }, head: { sha: head, ref: headBranch, repo: { id: 10, full_name: repo } }, merged: true, merge_commit_sha: merge },
    headCommit: { sha: head, tree: { sha: headTree } }, mergeCommit: { sha: merge, tree: { sha: mergeTree } },
    protection: { required_status_checks: { strict: true, checks: names.map(context => ({ context, app_id: 15368 })) }, enforce_admins: { enabled: true } }, checks, workflows,
    mainRuns: [{ id: 90, head_sha: merge, head_branch: 'main', event: 'push', path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'success' }],
    mainJobs: { 90: [{ id: 91, name: 'deploy', status: 'completed', conclusion: 'success', html_url: `https://github.com/${repo}/actions/runs/90/job/91` }] },
    pagesUrl: 'https://owner.github.io/library/',
    deployments: [{ id: 100, sha: merge, ref: 'main', environment: 'github-pages' }], deploymentStatuses: { 100: [{ id: 101, state: 'success', environment_url: 'https://owner.github.io/library/', log_url: `https://github.com/${repo}/actions/runs/90/job/91` }] }
  }
}
const options = { repo, expectedHead: head, requirePublication: true }

test('current PR, required workflows and exact merge deployment pass as separate states', () => {
  const result = validateGithubSnapshot(fixture(), options)
  assert.equal(result.merge_sha, merge)
  assert.equal(result.head_tree_sha, headTree)
  assert.equal(result.merge_tree_sha, mergeTree)
  assert.equal(result.publication.verified, true)
  assert.equal(result.verified, undefined, 'pure fixture validation is not a live API observation')
  assert.equal(validateGithubSnapshot(fixture(), { ...options, requirePublication: false }).publication.verified, false)
})

for (const name of requiredChecks) test(`removing required ${name} cannot weaken the accepted baseline`, () => {
  const s = fixture()
  s.protection.required_status_checks.checks = s.protection.required_status_checks.checks.filter(item => item.context !== name)
  s.checks = s.checks.filter(item => item.name !== name)
  assert.throws(() => validateGithubSnapshot(s, options), /必須チェック/)
})

test('GitHub commit trees bind the PR to the locally verified candidate, independently of merge changes', () => {
  assert.equal(validateGithubSnapshot(fixture(), { ...options, expectedTree: headTree }).merge_tree_sha, mergeTree)
  assert.throws(() => validateGithubSnapshot(fixture(), { ...options, expectedTree: mergeTree }), /検証済み候補/)
  for (const key of ['headCommit', 'mergeCommit']) {
    const s = fixture()
    s[key].sha = 'e'.repeat(40)
    assert.throws(() => validateGithubSnapshot(s, options), /commit \/ tree/)
  }
})

for (const [name, mutate] of [
  ['same SHA on an alias branch', s => { s.workflows[6].head_branch = 'chore/alias' }],
  ['another head repository', s => { s.workflows[6].head_repository = { id: 20, full_name: 'other/library' } }],
  ['same repository name with another ID', s => { s.workflows[6].repository.id = 20 }],
  ['same repository ID with another full name', s => { s.workflows[6].repository.full_name = 'other/library' }],
  ['another policy PR event', s => { s.workflows[6].display_title = 'Freshness policy PR #2' }],
  ['old policy without event binding', s => { s.workflows[9].display_title = 'A former PR title' }],
  ['another related PR', s => { s.workflows[6].pull_requests = [{ number: 2 }] }],
  ['missing relation data', s => { delete s.workflows[6].pull_requests }],
  ['PR URL with another number', s => { s.pr.html_url = `https://github.com/${repo}/pull/2` }],
]) test(`${name} cannot supply target PR policy evidence`, () => {
  const s = fixture(); mutate(s)
  assert.throws(() => validateGithubSnapshot(s, options), /不一致|結合|関連|PR/)
})

test('empty post-merge PR arrays require the immutable policy run name; exact fork identity is supported', () => {
  const s = fixture()
  s.pr.head.repo = { id: 20, full_name: 'contributor/library' }
  for (const run of Object.values(s.workflows)) run.head_repository = { ...s.pr.head.repo }
  assert.equal(validateGithubSnapshot(s, options).head_sha, head)
  for (const run of Object.values(s.workflows)) run.pull_requests = [{
    number: 1, head: { sha: head, ref: headBranch, repo: { id: 20 } }, base: { ref: 'main', repo: { id: 10 } }
  }]
  assert.equal(validateGithubSnapshot(s, options).head_sha, head)
  s.workflows[9].pull_requests[0].head.repo.id = 30
  assert.throws(() => validateGithubSnapshot(s, options), /別の PR/)
})
for (const [name, mutate, pattern] of [
  ['another head', s => { s.pr.head.sha = 'c'.repeat(40) }, /head/],
  ['unmerged', s => { s.pr.merged = false }, /マージ/],
  ['missing mandatory check', s => { s.protection.required_status_checks.checks.shift() }, /必須チェック/],
  ['unprotected base', s => { s.protection.required_status_checks.strict = false }, /保護/],
  ['another app', s => { s.checks[0].app.id = 7 }, /チェック/],
  ['another workflow', s => { s.workflows[1].path = '.github/workflows/fake.yml' }, /workflow/],
  ['another event', s => { s.workflows[1].event = 'workflow_dispatch' }, /event/],
  ['old workflow head', s => { s.workflows[1].head_sha = 'd'.repeat(40) }, /head/],
  ['another check suite', s => { s.workflows[1].check_suite_id = 900 }, /suite/],
  ['newest failed check', s => { s.checks.push({ ...s.checks[0], id: 200, conclusion: 'failure' }) }, /最新チェック/],
  ['newest incomplete main run', s => { s.mainRuns.push({ ...s.mainRuns[0], id: 92, status: 'in_progress' }) }, /main CI/],
  ['skipped deployment', s => { s.mainJobs[90][0].conclusion = 'skipped' }, /deploy/],
  ['another main branch', s => { s.mainRuns[0].head_branch = 'other-branch' }, /main CI/],
  ['another deployment branch', s => { s.deployments[0].ref = 'other-branch' }, /deployment/],
  ['another deployment job', s => { s.deploymentStatuses[100][0].log_url = 'https://github.com/owner/library/actions/runs/1/job/2' }, /deploy job/],
  ['another deployed site', s => { s.deploymentStatuses[100][0].environment_url = 'https://owner.github.io/other/' }, /公開 URL/],
  ['old deployment SHA', s => { s.deployments[0].sha = 'e'.repeat(40) }, /deployment/],
  ['failed deployment status', s => { s.deploymentStatuses[100].push({ id: 102, state: 'failure' }) }, /success/]
]) test(`${name} cannot count as completed publication`, () => { const s = fixture(); mutate(s); assert.throws(() => validateGithubSnapshot(s, options), pattern) })

test('PR identifiers exclude credentials, alternate hosts and malformed paths', () => {
  assert.deepEqual(parsePrUrl('https://github.com/owner/library/pull/123'), { repo, number: 123 })
  for (const value of ['https://token@github.com/owner/library/pull/1', 'https://example.com/owner/library/pull/1', 'https://github.com/owner/library/pull/1/../2']) assert.throws(() => parsePrUrl(value))
})

test('both requested and redirected URLs must remain within the Pages project', () => {
  const base = 'https://owner.github.io/library/'
  assert.equal(isWithinPages(`${base}docs/topic.html`, base), true)
  for (const value of ['https://owner.github.io/another/page.html', 'https://owner.github.io/library-suffix/', 'https://owner.github.io/library/../other/', 'https://name:secret@owner.github.io/library/']) assert.equal(isWithinPages(value, base), false)
})

function supersededFixture() {
  const s = fixture(), next = 'c'.repeat(40)
  s.deploymentStatuses[100].push({ id: 103, state: 'inactive' })
  s.currentPublication = {
    deployment: { id: 110, ref: 'main', environment: 'github-pages', sha: next },
    status: { state: 'success', environment_url: s.pagesUrl, log_url: `https://github.com/${repo}/actions/runs/120/job/121` },
    run: { id: 120, head_sha: next, head_branch: 'main', event: 'push', path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'success' },
    job: { id: 121, name: 'deploy', status: 'completed', conclusion: 'success', html_url: `https://github.com/${repo}/actions/runs/120/job/121` },
    comparison: { status: 'ahead', base_commit: { sha: merge }, merge_base_commit: { sha: merge }, url: `https://api.github.com/repos/${repo}/compare/${merge}...${next}` }
  }
  return s
}

test('resuming after a later publication records historical success and supersession separately', () => {
  const result = validateGithubSnapshot(supersededFixture(), options)
  assert.equal(result.publication.state, 'superseded')
  assert.equal(result.publication.deployment_id, 100)
  assert.equal(result.publication.current_deployment_id, 110)
})
for (const [name, mutate] of [
  ['no original success', s => { s.deploymentStatuses[100].shift() }],
  ['no live replacement', s => { delete s.currentPublication }],
  ['failed replacement', s => { s.currentPublication.status.state = 'failure' }],
  ['unrelated main history', s => { s.currentPublication.comparison.status = 'diverged' }],
  ['another comparison base', s => { s.currentPublication.comparison.merge_base_commit.sha = 'd'.repeat(40) }],
  ['another comparison head', s => { s.currentPublication.comparison.url = `https://api.github.com/repos/${repo}/compare/${merge}...${'d'.repeat(40)}` }],
  ['another replacement job', s => { s.currentPublication.status.log_url = 'https://example.com/' }]
]) test(`inactive alone cannot prove publication: ${name}`, () => { const s = supersededFixture(); mutate(s); assert.throws(() => validateGithubSnapshot(s, options)) })
