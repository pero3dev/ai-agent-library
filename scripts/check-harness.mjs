#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { load as yaml, JSON_SCHEMA } from 'js-yaml'
import { parse as toml } from 'smol-toml'
import { syncHarness } from './sync-harness.mjs'
import { parseMarkdownLinks } from './lib/markdown-links.mjs'
import { existsCaseSensitive, splitLocalDestination } from './lib/md-utils.mjs'
import { cli, filesUnder, git, parseOptions, ROOT, verificationManifest } from './lib/tooling-common.mjs'

export function isActiveTeachingFile(file) {
  if (!/^(?:examples|templates|tests|harness\/fixtures)\//i.test(file) || /\.example$/i.test(file)) return false
  return /(?:^|\/)(?:AGENTS(?:\.override)?\.md|CLAUDE(?:\.local)?\.md|SKILL\.md|\.mcp\.json)$/i.test(file) || /\/(?:\.codex\/(?:config\.toml|hooks\.json|agents\/[^/]+\.toml)|\.claude\/(?:settings(?:\.local)?\.json|(?:agents|commands|rules)\/(?:[^/]+\/)*[^/]+\.md)|\.github\/(?:copilot-instructions\.md|instructions\/[^/]+\.instructions\.md|agents\/[^/]+\.agent\.md|prompts\/[^/]+\.prompt\.md))$/i.test(file)
}
export function parseConfiguration(file, text) {
  const source = text.replace(/^\uFEFF/, '')
  if (file.endsWith('.json')) return JSON.parse(source)
  if (file.endsWith('.toml')) return toml(source)
  if (/\.ya?ml$/.test(file)) return yaml(source, { schema: JSON_SCHEMA })
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
  if (!front) throw new Error('front matter がありません')
  return yaml(front[1], { schema: JSON_SCHEMA })
}

export function verificationDrift(manifest, workflow) {
  const problems = []
  const normalized = command => command.trim().replace(/^\.\/actionlint(?=\s|$)/, 'actionlint')
  for (const row of manifest.checks) {
    const job = workflow.jobs?.[row.job]
    if (!job) { problems.push(`verification.json: CI job がありません: ${row.job}`); continue }
    const matches = (job.steps ?? []).filter(step => typeof step.run === 'string' && normalized(step.run) === normalized(row.command) && path.posix.normalize(step['working-directory'] ?? job.defaults?.run?.['working-directory'] ?? workflow.defaults?.run?.['working-directory'] ?? '.') === path.posix.normalize(row.cwd))
    if (matches.length !== 1 || matches[0].if !== undefined || matches[0]['continue-on-error'] || job.if !== undefined || job['continue-on-error']) problems.push(`verification.json: CI の command / cwd / 必須実行が不一致です: ${row.id}`)
  }
  return problems
}

export function validateSchemaReferences(schema) {
  if (!schema || schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || schema.type !== 'object' || !schema.properties || !Array.isArray(schema.required)) throw new Error('schema の版・type・properties・required が不正です')
  const visit = value => {
    if (!value || typeof value !== 'object') return
    if (value.$ref !== undefined) {
      if (typeof value.$ref !== 'string' || !value.$ref.startsWith('#/')) throw new Error('schema 参照は文書内の JSON Pointer で指定してください')
      const tokens = decodeURIComponent(value.$ref.slice(2)).split('/').map(token => {
        if (/~[^01]|~$/.test(token)) throw new Error(`schema 参照のエスケープが不正です: ${value.$ref}`)
        return token.replace(/~1/g, '/').replace(/~0/g, '~')
      })
      let target = schema
      for (const token of tokens) { if (!target || typeof target !== 'object' || !Object.hasOwn(target, token)) throw new Error(`schema 参照先がありません: ${value.$ref}`); target = target[token] }
    }
    if (Array.isArray(value.required) && value.properties && value.required.some(key => !Object.hasOwn(value.properties, key))) throw new Error('schema の required と properties が不一致です')
    for (const child of Object.values(value)) visit(child)
  }
  visit(schema)
}

export async function checkHarness(root = ROOT, { trackedFiles, hooks } = {}) {
  const problems = []
  const capture = (file, action) => { try { return action() } catch (error) { problems.push(`${file}: ${error.message}`); return null } }
  for (const file of ['harness/profiles.json', '.agents/skills/freshness-maintenance/SKILL.md', '.codex/agents/doc-reviewer.toml', '.codex/agents/freshness-checker.toml', '.claude/agents/doc-reviewer.md', '.claude/agents/freshness-checker.md']) if (!existsSync(path.join(root, file))) problems.push(`必要なハーネス定義がありません: ${file}`)
  const sync = capture('sync-harness', () => syncHarness(root))
  if (sync) for (const file of [...sync.mismatches, ...sync.unexpected]) problems.push(`共通正本との同期が必要です: ${file}`)
  const files = capture('configuration inventory', () => ['.agents', '.codex', '.claude', '.github', 'harness', 'scripts/schemas'].flatMap(dir => filesUnder(root, dir))) ?? []
  for (const file of files) {
    if (file.endsWith('.example')) continue
    const isSkill = /\/SKILL\.md$/.test(file)
    const isRole = /^\.(?:codex|claude)\/agents\/[^/]+\.(?:md|toml)$/.test(file)
    if (!isSkill && !isRole && !/\.(?:json|toml|ya?ml)$/.test(file)) continue
    const value = capture(file, () => parseConfiguration(file, readFileSync(path.join(root, file), 'utf8')))
    if (!value) continue
    if (file.startsWith('scripts/schemas/') && file.endsWith('.schema.json')) capture(file, () => validateSchemaReferences(value))
    if (isSkill || isRole) {
      const expected = isSkill ? path.posix.basename(path.posix.dirname(file)) : path.posix.basename(file).replace(/\.(?:md|toml)$/, '')
      if (value.name !== expected || typeof value.description !== 'string' || !value.description.trim()) problems.push(`${file}: name / description が不正です`)
      if (isRole && file.endsWith('.toml') && (typeof value.developer_instructions !== 'string' || !value.developer_instructions.trim())) problems.push(`${file}: developer_instructions が必要です`)
      if (isRole && file.endsWith('.toml') && ['doc-reviewer', 'freshness-checker'].includes(expected) && value.sandbox_mode !== 'read-only') problems.push(`${file}: 読み取り専用 role の sandbox_mode は read-only が必要です`)
      if (isRole && file.endsWith('.md') && (typeof value.tools !== 'string' || !value.tools.trim())) problems.push(`${file}: tools が必要です`)
      if (isRole && file.endsWith('.md') && ['doc-reviewer', 'freshness-checker'].includes(expected)) {
        const required = ['Read', 'Grep', 'Glob', ...(expected === 'freshness-checker' ? ['WebSearch', 'WebFetch'] : [])].sort()
        const actual = typeof value.tools === 'string' ? value.tools.split(',').map(tool => tool.trim()).sort() : []
        if (JSON.stringify(actual) !== JSON.stringify(required)) problems.push(`${file}: 読み取り専用 role の tools が共通 contract と不一致です`)
      }
      const text = file.endsWith('.toml') ? value.developer_instructions ?? '' : readFileSync(path.join(root, file), 'utf8')
      for (const link of parseMarkdownLinks(text).links) {
        const target = splitLocalDestination(link.target)
        if (target.external) continue
        const abs = target.pathname ? path.resolve(root, path.dirname(file), target.pathname) : path.resolve(root, file)
        const relative = path.relative(root, abs)
        if (target.error || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative) || !existsCaseSensitive(abs, root)) problems.push(`${file}:${link.line}: 不正な参照 ${link.target}`)
        else if (target.fragment && abs.endsWith('.md') && !parseMarkdownLinks(readFileSync(abs, 'utf8')).anchors.has(target.fragment)) problems.push(`${file}:${link.line}: 見出しアンカーがありません: ${link.target}`)
      }
    }
  }
  capture('verification.json', () => {
    const manifest = verificationManifest(root)
    const workflow = parseConfiguration('ci.yml', readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8'))
    problems.push(...verificationDrift(manifest, workflow))
    for (const name of ['lint', 'actionlint', 'docs', 'examples', 'build', 'harness', 'harness-windows']) if (!workflow.jobs?.[name]) problems.push(`ci.yml: 必須 job がありません: ${name}`)
  })
  capture('profiles.json', () => {
    const catalog = JSON.parse(readFileSync(path.join(root, 'harness/profiles.json'), 'utf8'))
    if (catalog.schema_version !== 1 || !catalog.profiles || Array.isArray(catalog.profiles)) throw new Error('profiles の schema が不正です')
    for (const name of ['new-doc', 'article-update', 'freshness', 'publish-review', 'examples', 'website', 'harness']) {
      const profile = catalog.profiles[name]
      if (!profile || !Array.isArray(profile.allowed_roots) || !Array.isArray(profile.allowed_files) || !Array.isArray(profile.extensions) || typeof profile.review_required !== 'boolean' || !['local', 'merged', 'published', 'observed'].includes(profile.completion)) problems.push(`profiles.json: profile の必要項目が不正です: ${name}`)
    }
  })
  let contracts = hooks
  if (!contracts) {
    try {
      const command = await import(pathToFileURL(path.join(root, 'scripts/lib/hook-command.mjs')))
      const core = await import(pathToFileURL(path.join(root, 'scripts/lib/hook-core.mjs')))
      contracts = { hookCommand: command.hookCommand, codexWindowsHookCommand: command.codexWindowsHookCommand, generatedPath: core.generatedPath }
    } catch (error) { problems.push(`共通 hook contract を読めません: ${error.code ?? error.message}`) }
  }
  if (contracts) {
    for (const [client, file] of [['codex', '.codex/hooks.json'], ['claude', '.claude/settings.json']]) capture(file, () => {
      const settings = parseConfiguration(file, readFileSync(path.join(root, file), 'utf8'))
      for (const [event, mode] of [['PreToolUse', 'guard'], ['PostToolUse', 'validate']]) {
        const entries = settings.hooks?.[event]
        if (!Array.isArray(entries) || entries.length !== 1 || entries[0].hooks?.length !== 1 || entries[0].hooks[0].type !== 'command' || entries[0].hooks[0].command !== contracts.hookCommand(client, mode)) problems.push(`${file}: ${event} command が共通 contract と不一致です`)
        if (client === 'codex' && entries?.[0]?.hooks?.[0]?.commandWindows !== contracts.codexWindowsHookCommand(mode)) problems.push(`${file}: ${event} commandWindows が共通 contract と不一致です`)
        const matcher = new RegExp(entries?.[0]?.matcher ?? '(?!)')
        for (const tool of ['Edit', 'Write', 'MultiEdit', ...(client === 'codex' ? ['apply_patch'] : [])]) if (!matcher.test(tool)) problems.push(`${file}: matcher が ${tool} を対象にしません`)
        const timeout = entries?.[0]?.hooks?.[0]?.timeout
        if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60) problems.push(`${file}: hook timeout が不正です`)
      }
    })
  }
  const tracked = trackedFiles ?? capture('git inventory', () => git(root, 'ls-files', '-z').split('\0').filter(Boolean)) ?? []
  for (const file of tracked) {
    if (contracts?.generatedPath(file)) problems.push(`生成物を Git 追跡してはいけません: ${file}`)
  }
  for (const dir of ['examples', 'templates', 'tests', 'harness/fixtures']) {
    for (const file of capture(dir, () => filesUnder(root, dir)) ?? []) if (isActiveTeachingFile(file)) problems.push(`教材設定を .example にしてください: ${file}`)
  }
  return { schema_version: 1, checked_files: files.length, problems, verified: problems.length === 0, evidence: 'static' }
}
await cli(import.meta.url, async () => { const options = parseOptions(process.argv.slice(2), ['root']); const result = await checkHarness(options.root ?? ROOT); if (!result.verified) process.exitCode = 1; return result })
