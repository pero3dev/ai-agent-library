import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { assertSafeArticlePath, discoverArticles, PrerequisiteError, productionDigest, QuotaError, readJson, readSupplementalSources, sha256, sourceDigest, sourceSections, splitSpeech, supplementalDigest, validateScript, validateSupplementalMaterial, writeJson } from '../../scripts/audio/core.mjs'
import { askClaude, assertSubscriptionEnvironment, checkSubscription, execute, scriptSchema, scriptPrompt } from '../../scripts/audio/claude.mjs'
import { checkAccountConfirmation, loadConfig, prepareReviewedScript, reviewProblems, runProduction } from '../../scripts/audio/pipeline.mjs'
import { checkEngine, engineBase, evaluateSignal, synthesizeScript } from '../../scripts/audio/synthesis.mjs'
import { parseArguments } from '../../scripts/audio-run.mjs'

const configPath = path.resolve('automation/audio/config.json')
const config = await loadConfig(configPath, {})
const source = '---\ntitle: "試験記事"\nstatus: "published"\n---\n# 試験記事\n## 目的\n仕組みを理解する。\n## 本文\nMAX_STEPS は停止回数の上限です。'
const sections = sourceSections(source)
const article = { article_path: 'docs/01-concepts/example.md', title: '試験記事', source, source_digest: sourceDigest(source), section: '01-concepts' }
const makeScript = () => ({ title: '試験記事', chapters: sections.map((section, index) => ({ id: `chapter-${index + 1}`, title: section.title, source_sections: [section.id], turns: [{ role: 'listener', text: '初めて学ぶので、どのような仕組みなのか教えてください。'.repeat(3) }, { role: 'explainer', text: '処理には停止条件が必要です。マックス・ステップスという設定が回数の上限を決め、終了時には途中経過を保存します。'.repeat(3) }] })) })
const makeReview = () => ({ passed: true, issues: [], coverage: sections.map(section => ({ source_section: section.id, adequate: true, reason: '設計理由と停止条件が説明されている。' })) })
const engine = { version: 'test', voices: [{ id: 10005, name: '女声1', role: 'listener', license_url: 'https://voicevox.hiroshiba.jp/nemo/term/' }, { id: 10001, name: '男声1', role: 'explainer', license_url: 'https://voicevox.hiroshiba.jp/nemo/term/' }] }
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'audio-production-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const repoRoot = path.join(root, 'repo'), stateDir = path.join(root, 'state')
  await mkdir(path.join(repoRoot, 'docs/01-concepts'), { recursive: true })
  await writeFile(path.join(repoRoot, article.article_path), source)
  await writeJson(path.join(stateDir, 'account-confirmation.json'), { subscription_only_confirmed: true, extra_usage_disabled_confirmed: true, confirmed_at: new Date().toISOString() })
  return { root, repoRoot, stateDir }
}
const generated = async (_config, _prompt, schema) => schema === scriptSchema ? makeScript() : makeReview()
const fakeSynthesis = async (_script, _config, jobDir) => {
  const file = path.join(jobDir, 'part-01.mp3'), bytes = Buffer.from('fake audio fixture only')
  await writeFile(file, bytes)
  return [{ part: 1, parts: 1, audio_file: file, audio_sha256: sha256(bytes), duration_seconds: 90, chapters: [{ id: 'intro', title: '導入', start_seconds: 0 }], signal: { passed: true, duration_seconds: 90, silence_seconds: 0, character_count: 450, issues: [] } }]
}
const dependencies = { preflight: async () => ({}), engineCheck: async () => engine, generate: generated, synthesize: fakeSynthesis, progress: () => {}, delay: async () => {} }

test('article source digest normalizes Windows line endings without dropping source content', () => {
  assert.equal(sourceDigest(source), sourceDigest(source.replaceAll('\n', '\r\n')))
  assert.notEqual(sourceDigest(source), sourceDigest(`${source}\n`))
})
test('discovery excludes drafts, indexes, glossary, and operational files', async t => {
  const { repoRoot } = await fixture(t)
  await writeFile(path.join(repoRoot, 'docs/01-concepts/README.md'), source)
  await writeFile(path.join(repoRoot, 'docs/01-concepts/draft.md'), source.replace('published', 'draft'))
  await writeFile(path.join(repoRoot, 'docs/GLOSSARY.md'), source)
  assert.deepEqual((await discoverArticles(repoRoot)).map(item => item.article_path), [article.article_path])
})
test('article paths cannot escape the published article namespace', () => {
  for (const file of ['../secret.md', 'docs/01-concepts/../../secret.md', 'docs/GLOSSARY.md', 'C:\\secret.md']) assert.throws(() => assertSafeArticlePath(file))
})
test('headings inside nested Markdown teaching fences do not create coverage requirements', () => {
  assert.deepEqual(sourceSections('## 主張\n````md\n```js\n## 教材内\n```\n````\n## まとめ\n## 参考資料').map(item => item.title), ['主張', 'まとめ'])
})
test('script validation rejects missing source sections, wrong roles and repeated utterances', () => {
  assert.deepEqual(validateScript(makeScript(), sections), [])
  const script = makeScript(); script.chapters[1].source_sections = []; script.chapters[0].turns[1].role = 'narrator'; script.chapters[1].turns[1].text = script.chapters[1].turns[0].text
  const issues = validateScript(script, sections).join('\n')
  assert.match(issues, /未対応/); assert.match(issues, /話者/); assert.match(issues, /同一発話/)
})
test('process output preserves UTF-8 characters split across stdout and stderr pipe chunks', async () => {
  const childCode = "const bytes = Buffer.from('日本語'); process.stdout.write(bytes.subarray(0, 1)); process.stderr.write(bytes.subarray(0, 2)); setTimeout(() => { process.stdout.write(bytes.subarray(1)); process.stderr.write(bytes.subarray(2)); }, 40)"
  const result = await execute(process.execPath, ['-e', childCode], { timeout: 5000 })
  assert.equal(result.code, 0); assert.equal(result.stdout, '日本語'); assert.equal(result.stderr, '日本語')
})
test('replacement characters invalidate scripts and reviews instead of becoming spoken content', () => {
  const script = makeScript(); script.chapters[0].turns[0].text += '\uFFFD'
  assert.match(validateScript(script, sections).join(' '), /文字化け/)
  const review = makeReview(); review.coverage[0].reason += '\uFFFD'
  assert.match(reviewProblems(review, sections).join(' '), /文字化け/)
})
test('resuming an invalid cached script sends the validation issue in the first repair prompt', async t => {
  const { root } = await fixture(t)
  const damaged = makeScript(); damaged.chapters[0].turns[0].text += '\uFFFD'
  await writeJson(path.join(root, 'script.json'), damaged)
  let firstPrompt
  const result = await prepareReviewedScript(article, config, root, { generate: async (...args) => { if (!firstPrompt) firstPrompt = args[1]; return generated(...args) } })
  assert.match(firstPrompt, /修正指摘:.*文字化け/)
  assert.deepEqual(validateScript(result.script, sections), [])
  assert.equal(result.review.passed, true)
})
test('speech splitting preserves all spoken characters and respects the configured maximum', () => {
  const text = '停止条件を確かめます。'.repeat(70)
  const chunks = splitSpeech(text, 80)
  assert.equal(chunks.join(''), text)
  assert.ok(chunks.every(chunk => chunk.length <= 80))
  assert.throws(() => splitSpeech(text, 1))
})
test('subscription environment gate rejects paid provider overrides without exposing secret values', () => {
  assert.throws(() => assertSubscriptionEnvironment({ ANTHROPIC_API_KEY: 'secret-test-value' }), error => error instanceof PrerequisiteError && !error.message.includes('secret-test-value'))
  assert.doesNotThrow(() => assertSubscriptionEnvironment({ PATH: 'test' }))
})
test('auth status requires subscription OAuth and rejects unauthenticated/API provider modes', async () => {
  await assert.rejects(checkSubscription(config, { env: {}, run: async () => ({ code: 0, stdout: JSON.stringify({ loggedIn: true, authMethod: 'api_key', apiProvider: 'firstParty' }) }) }), PrerequisiteError)
  const result = await checkSubscription(config, { env: {}, run: async () => ({ code: 0, stdout: JSON.stringify({ loggedIn: true, authMethod: 'claude.ai', apiProvider: 'firstParty', subscriptionType: 'pro' }) }) })
  assert.equal(result.authenticated, true)
})
test('account confirmation is required independently of CLI authentication', async t => {
  const { stateDir } = await fixture(t)
  assert.equal((await checkAccountConfirmation(stateDir)).method, 'account-owner-confirmation')
  await writeJson(path.join(stateDir, 'account-confirmation.json'), { subscription_only_confirmed: true, extra_usage_disabled_confirmed: false, confirmed_at: new Date().toISOString() })
  await assert.rejects(checkAccountConfirmation(stateDir), PrerequisiteError)
})
test('Claude requests isolate tools/settings but retain subscription OAuth capability', async t => {
  const { root } = await fixture(t)
  let call
  const result = await askClaude(config, scriptPrompt(article, sections), scriptSchema, { cwd: path.join(root, 'controlled'), env: {}, run: async (command, args, options) => { call = { command, args, options }; return { code: 0, stdout: JSON.stringify({ structured_output: makeScript() }), stderr: '' } } })
  assert.equal(result.title, '試験記事')
  assert.ok(call.args.includes('--safe-mode')); assert.ok(!call.args.includes('--bare'))
  assert.equal(call.args[call.args.indexOf('--tools') + 1], '')
  assert.match(call.options.input, /資料記事/)
  assert.ok(!call.args.includes(article.source))
})
test('quota errors are separate from failed JSON output and never trigger another provider', async t => {
  const { root } = await fixture(t)
  let calls = 0
  await assert.rejects(askClaude(config, 'test', scriptSchema, { cwd: root, env: {}, run: async () => { calls++; return { code: 1, stdout: JSON.stringify({ is_error: true, result: "You've hit your limit. Resets 5pm" }), stderr: '' } } }), QuotaError)
  assert.equal(calls, 1)
})
test('independent review requires an affirmative detailed result for every source section', () => {
  const review = makeReview(); review.coverage.pop()
  assert.match(reviewProblems(review, sections).join(' '), /未確認/)
  assert.deepEqual(reviewProblems(makeReview(), sections), [])
})
test('failed review repairs the complete script and cache binds both source and script hashes', async t => {
  const { root } = await fixture(t)
  let calls = 0
  const generate = async (_config, prompt, schema) => {
    calls++
    if (schema === scriptSchema) return makeScript()
    if (calls === 2) return { ...makeReview(), passed: false, issues: ['停止条件の補足が必要'] }
    assert.match(prompt, /停止条件/)
    return makeReview()
  }
  const first = await prepareReviewedScript(article, config, root, { generate })
  assert.equal(calls, 4); assert.equal(first.review.source_digest, article.source_digest)
  await prepareReviewedScript(article, config, root, { generate: async () => { throw new Error('cache should avoid calls') } })
  const changed = makeScript(); changed.chapters[0].turns[0].text += '変更'
  await writeJson(path.join(root, 'script.json'), changed)
  let reviewedAgain = false
  await prepareReviewedScript(article, config, root, { generate: async () => { reviewedAgain = true; return makeReview() } })
  assert.equal(reviewedAgain, true)
})
test('exhausted repair attempts fail instead of accepting a favorable top-level flag', async t => {
  const { root } = await fixture(t)
  let reviews = 0
  await assert.rejects(prepareReviewedScript(article, { ...config, max_repair_attempts: 1 }, root, { generate: async (_config, _prompt, schema) => { if (schema === scriptSchema) return makeScript(); reviews++; return { passed: true, issues: [], coverage: [] } } }), /修正上限/)
  assert.equal(reviews, 2)
})
test('malformed generated script and review caches are preserved and repaired within the normal loop', async t => {
  const { root } = await fixture(t)
  await writeFile(path.join(root, 'script.json'), '{broken script')
  await writeFile(path.join(root, 'review.json'), '{broken review')
  let calls = 0
  const result = await prepareReviewedScript(article, config, root, { generate: async (...args) => { calls++; return generated(...args) } })
  assert.equal(calls, 2); assert.equal(result.review.passed, true)
  const files = await readdir(root)
  const scriptEvidence = files.find(name => name.startsWith('script.json.invalid-'))
  const reviewEvidence = files.find(name => name.startsWith('review.json.invalid-'))
  assert.equal(await readFile(path.join(root, scriptEvidence), 'utf8'), '{broken script')
  assert.equal(await readFile(path.join(root, reviewEvidence), 'utf8'), '{broken review')
})
test('malformed chunk metadata is quarantined and only that chunk is synthesized again', async t => {
  const { root } = await fixture(t)
  const script = { chapters: [{ id: 'intro', title: '導入', turns: [{ role: 'listener', text: '処理の仕組みを教えてください。' }, { role: 'explainer', text: '停止条件で処理回数を制限します。' }] }] }
  const wav = Buffer.alloc(64); wav.write('RIFF', 0); wav.write('WAVE', 8)
  let synthesisRequests = 0
  const request = async url => ({ ok: true, json: async () => ({}), arrayBuffer: async () => { if (url.includes('/synthesis?')) synthesisRequests++; return wav } })
  const run = async (command, args) => {
    if (command === config.ffprobe_path) return { code: 0, stdout: JSON.stringify({ format: { duration: args.at(-1).endsWith('.wav') ? 2 : 4 }, streams: [{ codec_type: 'audio' }] }), stderr: '' }
    if (args.at(-1).endsWith('.mp3')) await writeFile(args.at(-1), 'encoded fixture only')
    return { code: 0, stdout: '', stderr: '' }
  }
  await synthesizeScript(script, config, root, engine, { run, request })
  assert.equal(synthesisRequests, 2)
  const chunksDirectory = path.join(root, 'chunks')
  const cache = (await readdir(chunksDirectory)).find(name => name.endsWith('.wav.json'))
  await writeFile(path.join(chunksDirectory, cache), '{broken metadata')
  await synthesizeScript(script, config, root, engine, { run, request })
  assert.equal(synthesisRequests, 3)
  const evidence = (await readdir(chunksDirectory)).find(name => name.startsWith(`${cache}.invalid-`))
  assert.equal(await readFile(path.join(chunksDirectory, evidence), 'utf8'), '{broken metadata')
})
test('signal checks reject long silence and truncated or grossly overlong synthesis', () => {
  assert.equal(evaluateSignal(100, '', 500).passed, true)
  assert.equal(evaluateSignal(100, 'silence_duration: 7', 500).passed, false)
  assert.equal(evaluateSignal(1, '', 500).passed, false)
  assert.equal(evaluateSignal(1000, '', 500).passed, false)
})
test('VOICEVOX endpoint is limited to loopback and requires matching two configured voices', async () => {
  for (const endpoint of ['https://paid.example.com', 'http://user:pass@localhost:50021', 'http://localhost:50021/query']) assert.throws(() => engineBase(endpoint))
  const request = async url => ({ ok: true, json: async () => url.endsWith('/version') ? 'test' : [{ name: '女声1', styles: [{ id: 10005 }] }, { name: '男声1', styles: [{ id: 10001 }] }] })
  assert.equal((await checkEngine(config, { request })).voices.length, 2)
  await assert.rejects(checkEngine({ ...config, voices: { ...config.voices, listener: { ...config.voices.listener, name: '間違い' } } }, { request }), /mismatch/)
})
test('producer completes, persists a READY manifest and skips already verified audio on the next run', async t => {
  const fixturePaths = await fixture(t)
  const options = { ...fixturePaths, config }
  const first = await runProduction(options, dependencies)
  assert.equal(first.processed, 1); assert.equal(first.ready.length, 1)
  const ready = await readJson(first.ready[0]); assert.equal(ready.review.passed, true); assert.equal(ready.episodes[0].source_digest, article.source_digest)
  const second = await runProduction(options, { ...dependencies, preflight: async () => { throw new Error('must not consume more quota') } })
  assert.equal(second.skipped, 1); assert.equal(second.processed, 0)
})
test('a source update during synthesis is held and cannot create a current READY manifest', async t => {
  const paths = await fixture(t)
  const result = await runProduction({ ...paths, config }, { ...dependencies, synthesize: async (...args) => { const parts = await fakeSynthesis(...args); await writeFile(path.join(paths.repoRoot, article.article_path), `${source}\n更新`); return parts } })
  assert.equal(result.ready.length, 0); assert.match(result.held[0].error, /Source changed/)
})
test('legacy READY without script-file and per-part hash bindings regenerates evidence from reviewed cache', async t => {
  const paths = await fixture(t)
  const first = await runProduction({ ...paths, config }, dependencies)
  const readyFile = first.ready[0], legacy = await readJson(readyFile)
  delete legacy.script_file
  delete legacy.signal_checks.parts[0].audio_sha256
  await writeJson(readyFile, legacy)
  let synthesisCalls = 0
  const resumed = await runProduction({ ...paths, config }, { ...dependencies, generate: async () => { throw new Error('approved script must not consume Claude usage again') }, synthesize: async (...args) => { synthesisCalls++; return fakeSynthesis(...args) } })
  assert.equal(resumed.processed, 1); assert.equal(resumed.held.length, 0); assert.equal(synthesisCalls, 1)
  const upgraded = await readJson(readyFile)
  assert.equal(upgraded.script_file, path.join(path.dirname(readyFile), 'script.json'))
  assert.equal(upgraded.signal_checks.parts[0].audio_sha256, upgraded.episodes[0].audio_sha256)
  const cached = await runProduction({ ...paths, config }, { ...dependencies, generate: async () => { throw new Error('unexpected regeneration') } })
  assert.equal(cached.skipped, 1)
})
test('quota exhaustion persists a cooldown and the next scheduled run makes no model request', async t => {
  const paths = await fixture(t)
  let calls = 0
  const deps = { ...dependencies, generate: async () => { calls++; throw new QuotaError('test quota') } }
  const first = await runProduction({ ...paths, config }, deps)
  assert.equal(first.status, 'paused'); assert.equal(calls, 1)
  const second = await runProduction({ ...paths, config, retryHeld: true }, deps)
  assert.equal(second.status, 'paused'); assert.equal(calls, 1)
})
test('held articles do not block other articles or retry forever on scheduled resume', async t => {
  const paths = await fixture(t)
  const nextPath = 'docs/01-concepts/second.md'
  await writeFile(path.join(paths.repoRoot, nextPath), source.replace('試験記事', '次の記事'))
  let generations = 0
  const deps = { ...dependencies, generate: async (cfg, prompt, schema, options) => { generations++; if (options.cwd.includes('example')) throw new Error('fixture failure'); return generated(cfg, prompt, schema) } }
  const first = await runProduction({ ...paths, config, limit: 2 }, deps)
  assert.equal(first.held.length, 1); assert.equal(first.ready.length, 1)
  const before = generations
  const second = await runProduction({ ...paths, config, limit: 2 }, deps)
  assert.equal(second.held.length, 1); assert.equal(generations, before)
  const third = await runProduction({ ...paths, config, retryHeld: true }, dependencies)
  assert.equal(third.held.length, 0); assert.equal(third.ready.length, 2)
})
test('local tooling overrides tracked defaults while explicit environment overrides win', async t => {
  const { stateDir } = await fixture(t)
  await writeJson(path.join(stateDir, 'tools.json'), { ffmpeg_path: 'local-ffmpeg', ffprobe_path: 'local-ffprobe' })
  const loaded = await loadConfig(configPath, { AUDIO_FFMPEG: 'explicit-ffmpeg' }, stateDir)
  assert.equal(loaded.ffmpeg_path, 'explicit-ffmpeg'); assert.equal(loaded.ffprobe_path, 'local-ffprobe')
})
test('CLI requires a mode and distinguishes safe resume from explicit held retry', () => {
  assert.throws(() => parseArguments([])); assert.throws(() => parseArguments(['--run', '--plan']))
  assert.equal(parseArguments(['--run', '--resume']).retry_held, undefined)
  assert.equal(parseArguments(['--run', '--retry-held']).retry_held, true)
  assert.throws(() => parseArguments(['--run', '--limit', '0']))
})
test('invalid queue state releases the producer lock before reporting the error', async t => {
  const paths = await fixture(t)
  await writeFile(path.join(paths.stateDir, 'queue.json'), '{invalid')
  await assert.rejects(runProduction({ ...paths, config }, dependencies), SyntaxError)
  await assert.rejects(readFile(path.join(paths.stateDir, 'run.lock')), { code: 'ENOENT' })
  assert.equal(await readFile(path.join(paths.stateDir, 'queue.json'), 'utf8'), '{invalid')
})
test('atomic state writes retry temporary Windows sharing violations without deleting the previous state', async t => {
  const { root } = await fixture(t)
  const file = path.join(root, 'state.json')
  await writeJson(file, { version: 'previous' })
  let attempts = 0
  const pauses = []
  await writeJson(file, { version: 'next' }, {
    renameFile: async (temporary, destination) => {
      attempts++
      assert.deepEqual(await readJson(destination), { version: 'previous' })
      if (attempts < 3) throw Object.assign(new Error('sharing violation'), { code: 'EPERM' })
      await rename(temporary, destination)
    }, pause: async milliseconds => { pauses.push(milliseconds) },
  })
  assert.equal(attempts, 3); assert.deepEqual(pauses, [40, 80]); assert.deepEqual(await readJson(file), { version: 'next' })
  attempts = 0
  await assert.rejects(writeJson(file, { version: 'must not replace' }, {
    renameFile: async () => { attempts++; throw Object.assign(new Error('permanent denial'), { code: 'EACCES' }) }, pause: async () => {},
  }), { code: 'EACCES' })
  assert.equal(attempts, 8); assert.deepEqual(await readJson(file), { version: 'next' })
})
test('supplemental context includes only related exact glossary excerpts and validates against a source reader', async t => {
  const { repoRoot } = await fixture(t)
  const glossary = '# 用語集\n### MCP(Model Context Protocol)\n\nツールとデータを接続する標準です。\n### RAG(検索拡張生成)\n\n検索結果をモデルの入力に加えます。\n### 別の用語\n\n無関係な情報です。'
  await writeFile(path.join(repoRoot, 'GLOSSARY.md'), glossary)
  const bundle = await readSupplementalSources(repoRoot, { source: 'MCP と RAG を説明する。' })
  assert.deepEqual(bundle.entries.map(entry => entry.heading), ['MCP(Model Context Protocol)', 'RAG(検索拡張生成)'])
  assert.deepEqual(await validateSupplementalMaterial(bundle, repoRoot, { readDocument: async () => glossary }), [])
  assert.deepEqual(await validateSupplementalMaterial(bundle, repoRoot, { readDocument: async () => glossary.replace('無関係な情報', '別の情報') }), [])
  assert.match((await validateSupplementalMaterial(bundle, repoRoot, { readDocument: async () => glossary.replace('検索結果', '検索した資料') })).join(' '), /変更/)
  const forged = structuredClone(bundle); forged.entries[0].document_path = '../outside.md'
  assert.match((await validateSupplementalMaterial(forged, repoRoot)).join(' '), /パス/)
})
test('new script and review share grounded prerequisites; used excerpts bind READY and unrelated edits reuse it', async t => {
  const paths = await fixture(t)
  const glossaryPath = path.join(paths.repoRoot, 'GLOSSARY.md')
  const glossary = '# 用語集\n### MAX_STEPS\n\n停止回数の上限を表す設定です。\n### 無関係な語\n\n別の内容です。'
  await writeFile(glossaryPath, glossary)
  const prompts = []
  const first = await runProduction({ ...paths, config }, { ...dependencies, generate: async (...args) => { prompts.push(args[1]); return generated(...args) } })
  assert.equal(first.held.length, 0); assert.equal(prompts.length, 2)
  assert.ok(prompts.every(prompt => prompt.includes('停止回数の上限を表す設定です。')))
  assert.match(prompts[1], /その理由だけで不合格にしません/)
  const ready = await readJson(first.ready[0]), bundle = await readJson(ready.supplemental_file)
  assert.equal(ready.supplemental_digest, supplementalDigest(bundle))
  assert.equal(ready.review.supplemental_digest, ready.supplemental_digest)
  const baseSignature = sha256(JSON.stringify({ voices: config.voices, synthesis: config.synthesis, attribution: config.attribution }))
  assert.equal(ready.production_signature, productionDigest(baseSignature, ready.supplemental_digest))
  await writeFile(glossaryPath, glossary.replace('別の内容', '変更した無関係な内容'))
  const unchanged = await runProduction({ ...paths, config }, { ...dependencies, generate: async () => { throw new Error('unrelated glossary edits must not consume usage') } })
  assert.equal(unchanged.skipped, 1)
  await writeFile(glossaryPath, glossary.replace('停止回数の上限', '繰り返し回数の上限'))
  let reviews = 0
  const changed = await runProduction({ ...paths, config }, { ...dependencies, generate: async (...args) => { reviews++; return generated(...args) } })
  assert.equal(changed.processed, 1); assert.equal(reviews, 1)
  assert.notEqual((await readJson(first.ready[0])).supplemental_digest, ready.supplemental_digest)
})
test('introducing prerequisites does not force regeneration of legacy source-only approved audio', async t => {
  const paths = await fixture(t)
  await runProduction({ ...paths, config }, dependencies)
  await writeFile(path.join(paths.repoRoot, 'GLOSSARY.md'), '# 用語集\n### MAX_STEPS\n\n停止回数の上限を表す設定です。')
  const result = await runProduction({ ...paths, config }, { ...dependencies, generate: async () => { throw new Error('legacy approved audio must remain usable') } })
  assert.equal(result.skipped, 1)
})
test('publisher regeneration requests prioritize only the exact current article revision', async t => {
  const paths = await fixture(t)
  const secondPath = 'docs/01-concepts/second.md'
  await writeFile(path.join(paths.repoRoot, secondPath), source)
  await writeJson(path.join(paths.stateDir, 'publication/regeneration-needed.json'), { schema_version: 1, articles: [{ article_path: secondPath, source_digest: article.source_digest }, { article_path: article.article_path, source_digest: 'f'.repeat(64) }] })
  const result = await runProduction({ ...paths, config, limit: 1 }, dependencies)
  assert.equal(result.processed, 1)
  assert.equal((await readJson(result.ready[0])).article_path, secondPath)
})
