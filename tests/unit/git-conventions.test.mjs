import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { GIT_CONVENTIONS, formatCommitMessage, formatSquashMessage, validateBranch, validateCommitMessage, validateCommitRange, validateGitConventions, validatePr, validateSubject } from '../../scripts/lib/git-conventions.mjs'
import { checkGitConventions, parseGitConventionArgs } from '../../scripts/check-git-conventions.mjs'

const title = 'chore(harness): Git 操作の記載形式を統一する'
const credit = 'Agent: codex\nCo-authored-by: Codex <codex@openai.com>'
const body = `## 変更内容\n\n記載形式を統一するため、規約を追加しました\n\n## 検証\n\n単体試験に成功しました\n\n## 影響・残件\n\nなし\n\n${credit}\n`
const pr = { title, body, branch: 'chore/git-conventions' }
const message = (overrides = {}) => formatCommitMessage({ type: 'chore', scope: 'harness', summary: 'Git 操作の記載形式を統一する', reason: '表記の揺れを防ぐため', validation: '単体試験に成功', ...overrides })
const script = fileURLToPath(new URL('../../scripts/check-git-conventions.mjs', import.meta.url))

function directory(t) {
  const parent = fs.realpathSync(os.tmpdir())
  const dir = fs.mkdtempSync(path.join(parent, 'git-conventions-test-'))
  t.after(() => {
    const target = fs.realpathSync(dir)
    const relative = path.relative(parent, target)
    assert.equal(path.dirname(relative), '.')
    assert.ok(relative.startsWith('git-conventions-test-') && !path.isAbsolute(relative))
    fs.rmSync(target, { recursive: true, force: true })
  })
  return dir
}

function fixture(t) {
  const root = directory(t)
  const git = (args, input) => execFileSync('git', args, { cwd: root, encoding: 'utf8', input, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  git(['init', '--quiet', '--initial-branch=main'])
  git(['config', 'user.name', 'Test User'])
  git(['config', 'user.email', 'test@example.com'])
  const tree = git(['mktree'], '')
  const commit = (text, parents = []) => git(['commit-tree', tree, ...parents.flatMap(sha => ['-p', sha]), '-F', '-'], text)
  const base = commit('legacy commit intentionally outside adoption range\n')
  git(['update-ref', 'refs/heads/main', base])
  return { root, git, commit, base }
}

test('contract and Japanese subjects are bounded, scoped, and explicit', () => {
  assert.deepEqual(validateGitConventions(), [])
  assert.ok(validateGitConventions(null).length)
  assert.ok(validateGitConventions({ ...GIT_CONVENTIONS, subject: { ...GIT_CONVENTIONS.subject, types: ['fix', 'fix'] } }).length)
  assert.ok(validateGitConventions({ ...GIT_CONVENTIONS, range_policy: 'skip-merges' }).length)
  assert.deepEqual(validateSubject(title), [])
  const prefix = 'docs(docs): '
  assert.deepEqual(validateSubject(prefix + '日'.repeat(72 - [...prefix].length)), [])
  assert.ok(validateSubject(prefix + '日'.repeat(73 - [...prefix].length)).length)
  assert.deepEqual(validateSubject(prefix + '日' + '😀'.repeat(71 - [...prefix].length)), [])
  for (const invalid of ['docs: 本文を更新する', 'feat(other): 更新する', 'fix(docs)!: 修正する', 'fix(docs): English only', 'fix(harness): 検査  を直す', 'fix(harness): 修正する', 'docs(docs): 更新する', 'docs(docs): {{summary}} 本文', `${title}。`, `${title}\n注記`, `${title}\u202e`, `${title} (#12)`]) assert.ok(validateSubject(invalid).length, invalid)
  assert.deepEqual(validateCommitMessage(message().replace(title, `${title} (#12)`)), [])
})

test('ordinary and scheduled branch names are exact and main cannot be a PR head', () => {
  for (const branch of ['fix/doc-links', 'test/harness-2', 'automation/freshness-20260912t123456789z-deadbeef']) assert.deepEqual(validateBranch(branch), [])
  for (const branch of ['main', 'structure/content', 'chore/UPPER', 'fix/a--b', 'fix/a/b', 'automation/freshness-20260912T123456789Z-deadbeef', '-f', 'fix/line\nbreak']) assert.ok(validateBranch(branch).length, branch)
})

test('formatter creates all real agent credits and accepts honest unexecuted validation', () => {
  for (const agent of ['codex', 'claude', 'codex,claude', 'none']) {
    const text = message({ agent, validation: '未実施（文書のみの変更のため）' })
    assert.deepEqual(validateCommitMessage(text, { agent }), [])
  }
  assert.ok(validateCommitMessage(message(), { agent: 'claude' }).length)
  assert.throws(() => message({ reason: undefined }), /reason/)
  assert.throws(() => message({ reason: '' }), /理由/)
  assert.throws(() => message({ validation: '{{validation}}' }), /検証/)
  assert.throws(() => message({ validation: '未実施' }), /理由/)
  assert.ok(validateCommitMessage(message().replace('\n\n検証:', '\n検証:')).length)
})

test('human coauthors are preserved while duplicate, forged and misplaced credits fail', () => {
  assert.deepEqual(validateCommitMessage(message() + 'Co-authored-by: Example Person <person@example.com>\n'), [])
  const invalid = [
    message().replace('Agent: codex', 'agent: codex'),
    message().replace('Co-authored-by:', 'co-authored-by:'),
    message().replace('Codex <codex@openai.com>', 'codex <codex@openai.com>'),
    message().replace('Codex <codex@openai.com>', 'Assistant <codex@openai.com>'),
    message().replace('Codex <codex@openai.com>', 'Codex <other@example.com>'),
    message() + 'Co-authored-by: Codex <codex@openai.com>\n',
    message() + 'Co-authored-by: One <HUMAN@example.com>\nCo-authored-by: Two <human@example.com>\n',
    message().replace('Agent: codex', 'Agent: none'),
    message().replace('理由: ', '理由: 前置き\nCo-authored-by: Codex <codex@openai.com>\n'),
    message().replace('Agent: codex\n', 'Agent: codex\n\n'),
    message() + '\n追加本文\n'
  ]
  for (const text of invalid) assert.ok(validateCommitMessage(text).length, text)
  const both = message({ agent: 'codex,claude' }).replace('Co-authored-by: Codex <codex@openai.com>\nCo-authored-by: Claude <noreply@anthropic.com>', 'Co-authored-by: Claude <noreply@anthropic.com>\nCo-authored-by: Codex <codex@openai.com>')
  assert.ok(validateCommitMessage(both).length)
})

test('internal generated messages are limited to two named tasks without AI credit', () => {
  for (const [type, summary] of [['chore', '作業状態を保存する'], ['test', '隔離評価環境を準備する']]) {
    const text = message({ type, summary, agent: 'automation', generatedBy: 'ai-agent-library' })
    assert.deepEqual(validateCommitMessage(text), [])
    assert.ok(!text.includes('Co-authored-by'))
    assert.ok(validateCommitMessage(text.replace('Generated-by: ai-agent-library', 'Generated-by: other')).length)
    assert.ok(validateCommitMessage(text + 'Co-authored-by: Codex <codex@openai.com>\n').length)
  }
  assert.throws(() => message({ agent: 'automation', generatedBy: 'ai-agent-library' }), /保存・評価準備/)
  assert.throws(() => message({ generatedBy: 'ai-agent-library' }), /trailer/)
})

test('PR body has fixed nonempty ordered sections and gh view metadata normalizes safely', () => {
  assert.deepEqual(validatePr(pr), [])
  assert.deepEqual(validatePr({ title, body, headRefName: pr.branch }), [])
  assert.ok(validatePr({ ...pr, headRefName: 'fix/other' }).length)
  assert.ok(validatePr({ ...pr, baseRefName: 'other' }).length)
  const invalidBodies = [
    body.replace('## 検証', '## テスト'),
    body.replace('単体試験に成功しました', ''),
    body.replace('単体試験に成功しました', '<!-- 実行内容を記載 -->'),
    body.replace('単体試験に成功しました', '```text\n```'),
    body.replace('単体試験に成功しました', '- [ ] {{validation}}'),
    body.replace('単体試験に成功しました', '- [ ]'),
    body.replace('単体試験に成功しました', 'TODO'),
    body.replace('単体試験に成功しました', '成功しました\n\n## 検証\n\n成功しました'),
    body.replace(credit, 'Agent: automation\nGenerated-by: ai-agent-library'),
    `導入文\n\n${body}`
  ]
  for (const text of invalidBodies) assert.ok(validatePr({ ...pr, body: text }).length, text)
})

test('code fences and hidden text cannot spoof section or trailer requirements', () => {
  const fake = `## 変更内容\n\n説明\n\n\`\`\`text\n## 検証\n\n成功\n\n## 影響・残件\n\nなし\n\n${credit}\n\`\`\`\n`
  assert.ok(validatePr({ ...pr, body: fake }).length)
  assert.ok(validatePr({ ...pr, body: body.replace(credit, `\`\`\`text\n${credit}\n\`\`\``) }).length)
  assert.ok(validatePr({ ...pr, body: body.replace(credit, `<!--\n${credit}`) }).length)
  const realCode = body.replace('単体試験に成功しました', '次の試験に成功しました\n\n```text\n## このコード内見出しは構造ではありません\n```')
  assert.deepEqual(validatePr({ ...pr, body: realCode }), [])
})

test('HTML comments cannot hide required sections while genuine fenced trailer examples remain ordinary content', () => {
  const hiddenSections = `## 変更内容\n\n規約を追加しました\n<!--\n\n## 検証\n\n試験に成功しました\n\n## 影響・残件\n\nなし\n-->\n\n${credit}`
  assert.ok(validatePr({ ...pr, body: hiddenSections }).length)
  assert.ok(validatePr({ ...pr, body: hiddenSections.replace('<!--', '` <!--') }).length)
  assert.throws(() => formatSquashMessage({ title, body: hiddenSections }), /本文/)
  const withExample = body.replace('記載形式を統一するため、規約を追加しました', `記載形式の例です\n\n\`\`\`text\n${credit}\n<!-- この例では閉じないコメントです\n\`\`\``)
  assert.deepEqual(validatePr({ ...pr, body: withExample }), [])
  const squash = formatSquashMessage({ title, body: withExample })
  assert.deepEqual(validateCommitMessage(`${title}\n\n${squash.body}`), [])
  assert.ok(squash.body.includes(`\`\`\`text\n${credit}\n<!--`))
  const inlineCommentExample = body.replace('単体試験に成功しました', '`<!--` の開始文字列を検証しました')
  assert.deepEqual(validatePr({ ...pr, body: inlineCommentExample }), [])
})

test('squash preserves a fenced-only section and comment boundaries after each commit label', () => {
  for (const block of ['```text\n287 tests passed\n```', '<!-- 説明 -->\n```text\n287 tests passed\n```']) {
    const candidate = { title, body: body.replace('単体試験に成功しました', block) }
    assert.deepEqual(validatePr({ ...candidate, branch: pr.branch }), [])
    const squash = formatSquashMessage(candidate)
    assert.ok(squash.body.includes(`検証:\n${block}`))
    assert.deepEqual(validateCommitMessage(`${title}\n\n${squash.body}`), [])
  }
})

test('squash converts PR sections into commit sections and preserves multiline evidence and contributors', () => {
  const text = body.replace('単体試験に成功しました', '- Windows: 成功\n- Linux: 成功\n\n```text\n287 tests passed\n```') + 'Co-authored-by: Example Person <person@example.com>\n'
  const output = formatSquashMessage({ title, body: text })
  assert.equal(output.subject, title)
  assert.deepEqual(validateCommitMessage(`${output.subject}\n\n${output.body}`), [])
  assert.ok(output.body.includes('287 tests passed'))
  assert.ok(output.body.endsWith('Co-authored-by: Example Person <person@example.com>\n'))
  assert.throws(() => formatSquashMessage({ title, body: text.replace('## 検証', '## omitted') }), /本文/)
})

test('real Git range excludes old history but validates all new commits including merges and snapshots', t => {
  const repo = fixture(t)
  const first = repo.commit(message(), [repo.base])
  const snapshot = repo.commit(message({ summary: '作業状態を保存する', agent: 'automation', generatedBy: 'ai-agent-library' }), [first])
  const branch = repo.commit(message({ summary: '別の作業を記録する' }), [first])
  const merge = repo.commit(message({ summary: 'main の変更を統合する' }), [snapshot, branch])
  assert.deepEqual(validateCommitRange({ root: repo.root, base: repo.base, head: merge }), { problems: [], checked_commits: 4, checked_merges: 1 })
  const invalidMerge = repo.commit('Merge branch main\n', [snapshot, branch])
  assert.ok(validateCommitRange({ root: repo.root, base: repo.base, head: invalidMerge }).problems.some(problem => problem.startsWith(invalidMerge)))
  const invalid = repo.commit('fixup! temporary\n', [merge])
  assert.ok(validateCommitRange({ root: repo.root, base: merge, head: invalid }).problems.length)
  assert.ok(validateCommitRange({ root: repo.root, base: merge, head: merge }).problems.length)
})

test('range rejects missing objects and option-like or abbreviated revisions without running candidate code', t => {
  const repo = fixture(t)
  assert.throws(() => validateCommitRange({ root: repo.root, base: repo.base, head: 'f'.repeat(40) }))
  for (const head of ['HEAD', '--help', repo.base.slice(0, 7), `${repo.base}; touch nope`, repo.base.toUpperCase()]) assert.throws(() => validateCommitRange({ root: repo.root, base: repo.base, head }), /SHA/)
  assert.ok(!fs.existsSync(path.join(repo.root, 'nope')))
})

test('event checks live PR edits and full base/head objects, rejects non-PR and wrong target metadata', t => {
  const repo = fixture(t)
  const head = repo.commit(message(), [repo.base])
  const event = { pull_request: { title, body, base: { sha: repo.base, ref: 'main' }, head: { sha: head, ref: pr.branch } } }
  const eventFile = path.join(repo.root, 'event.json')
  const run = value => { fs.writeFileSync(eventFile, JSON.stringify(value)); return checkGitConventions(['--event', eventFile], repo.root) }
  assert.equal(run(event).valid, true)
  assert.equal(run({ pull_request: { ...event.pull_request, title: 'temporary' } }).valid, false)
  assert.equal(run({ pull_request: { ...event.pull_request, body: body.replace('## 検証', '## none') } }).valid, false)
  assert.throws(() => run({}), /pull_request/)
  assert.throws(() => run({ pull_request: { ...event.pull_request, base: { sha: repo.base, ref: 'other' } } }), /pull_request/)
  assert.throws(() => run({ pull_request: { ...event.pull_request, head: { sha: head, ref: 'main' } } }), /pull_request/)
  assert.throws(() => run({ pull_request: { ...event.pull_request, head: { sha: 'f'.repeat(40), ref: pr.branch } } }))
})

test('CLI modes are strict, duplicate and incompatible options fail', () => {
  for (const args of [[], ['--check-config', '--pr-file', 'a'], ['--message-file', 'a', '--message-file', 'b'], ['--base', 'a', '--pr-file', 'p'], ['--pr-file', 'p', '--agent', 'codex'], ['--squash-file', 'p'], ['--event', 'e', '--head', 'h', '--base', 'b'], ['--check-config', '--unexpected'], ['--message-file']]) assert.throws(() => parseGitConventionArgs(args), args.join(' '))
})

test('CLI validates message and range JSON, writes squash body only, and has failure exit status', t => {
  const repo = fixture(t)
  const head = repo.commit(message(), [repo.base])
  const messageFile = path.join(repo.root, 'message.txt')
  const prFile = path.join(repo.root, 'pr.json')
  const outputFile = path.join(repo.root, 'squash.txt')
  fs.writeFileSync(messageFile, message())
  fs.writeFileSync(prFile, JSON.stringify({ title, body, headRefName: pr.branch }))
  assert.equal(checkGitConventions(['--message-file', messageFile, '--agent', 'codex'], repo.root).valid, true)
  assert.equal(checkGitConventions(['--pr-file', prFile, '--base', repo.base, '--head', head], repo.root).checked_commits, 1)
  fs.writeFileSync(prFile, JSON.stringify({ ...pr, headRefOid: repo.base }))
  assert.throws(() => checkGitConventions(['--pr-file', prFile, '--base', repo.base, '--head', head], repo.root), /metadata/)
  fs.writeFileSync(prFile, JSON.stringify(pr))
  assert.equal(checkGitConventions(['--squash-file', prFile, '--body-file', outputFile], repo.root).subject, title)
  assert.deepEqual(validateCommitMessage(`${title}\n\n${fs.readFileSync(outputFile, 'utf8')}`), [])
  assert.throws(() => checkGitConventions(['--squash-file', prFile, '--body-file', prFile], repo.root), /別ファイル/)
  for (const invalid of [{ ...pr, branch: 'main' }, { ...pr, baseRefName: 'other' }, { title, body }]) {
    fs.writeFileSync(prFile, JSON.stringify(invalid))
    assert.throws(() => checkGitConventions(['--squash-file', prFile, '--body-file', outputFile], repo.root), /branch|base/)
  }
  assert.equal(repo.git(['rev-parse', 'HEAD']), repo.base)
  fs.writeFileSync(messageFile, 'WIP\n')
  assert.throws(() => execFileSync(process.execPath, [script, '--message-file', messageFile], { cwd: repo.root, windowsHide: true, stdio: 'pipe' }), error => error.status === 1)
})

test('squash output cannot overwrite its input through a hardlink or filesystem case alias', t => {
  const root = directory(t)
  const input = path.join(root, 'pr.json')
  const hardlink = path.join(root, 'input-alias.json')
  const original = JSON.stringify(pr)
  fs.writeFileSync(input, original)
  fs.linkSync(input, hardlink)
  const run = output => checkGitConventions(['--squash-file', input, '--body-file', output], root)
  assert.throws(() => run(hardlink), /別ファイル/)
  assert.equal(fs.readFileSync(input, 'utf8'), original)
  assert.equal(fs.readFileSync(hardlink, 'utf8'), original)
  const caseAlias = path.join(root, 'PR.JSON')
  if (fs.existsSync(caseAlias)) {
    assert.throws(() => run(caseAlias), /別ファイル/)
    assert.equal(fs.readFileSync(input, 'utf8'), original)
  } else {
    // On a case-sensitive filesystem this is a genuinely separate output.
    assert.equal(run(caseAlias).valid, true)
    assert.equal(fs.readFileSync(input, 'utf8'), original)
  }
  const output = path.join(root, 'squash.txt')
  fs.writeFileSync(output, 'old output'.repeat(1000))
  assert.equal(run(output).valid, true)
  assert.equal(fs.readFileSync(output, 'utf8'), formatSquashMessage(pr).body)
  assert.equal(fs.readFileSync(input, 'utf8'), original)
})
