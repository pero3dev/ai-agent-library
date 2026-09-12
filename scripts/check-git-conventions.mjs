#!/usr/bin/env node
import { closeSync, existsSync, fstatSync, ftruncateSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GIT_CONVENTIONS, formatSquashMessage, validateCommitMessage, validateCommitRange, validateGitConventions, validatePr } from './lib/git-conventions.mjs'

const implementationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function writeSquashBody(inputFile, bodyFile, body) {
  const samePath = (first, second) => process.platform === 'win32' ? first.toLowerCase() === second.toLowerCase() : first === second
  if (samePath(inputFile, bodyFile)) throw new Error('入力 JSON と出力本文は別ファイルにしてください')
  const inputFd = openSync(inputFile, 'r')
  let outputFd
  try {
    // Open existing output without truncating it; compare the opened identities
    // before the first write, including case aliases, symlinks and hardlinks.
    outputFd = openSync(bodyFile, existsSync(bodyFile) ? 'r+' : 'wx')
    const inputStat = fstatSync(inputFd, { bigint: true })
    const outputStat = fstatSync(outputFd, { bigint: true })
    if (samePath(realpathSync(inputFile), realpathSync(bodyFile)) || inputStat.ino !== 0n && inputStat.dev === outputStat.dev && inputStat.ino === outputStat.ino) throw new Error('入力 JSON と出力本文は別ファイルにしてください（同じ実体を参照しています）')
    ftruncateSync(outputFd, 0)
    writeFileSync(outputFd, body, 'utf8')
  } finally {
    if (outputFd !== undefined) closeSync(outputFd)
    closeSync(inputFd)
  }
}

const json = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
export function parseGitConventionArgs(args) {
  const result = {}
  const values = new Set(['root', 'message-file', 'agent', 'pr-file', 'base', 'head', 'event', 'squash-file', 'body-file'])
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '')
    if (!args[i].startsWith('--') || (!values.has(key) && key !== 'check-config') || Object.hasOwn(result, key)) throw new Error(`未対応・重複の引数: ${args[i]}`)
    if (key === 'check-config') result[key] = true
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`--${key} の値が必要です`)
      result[key] = args[++i]
    }
  }
  const modes = ['message-file', 'pr-file', 'event', 'squash-file', 'check-config'].filter(key => Object.hasOwn(result, key))
  if (modes.length !== 1) throw new Error('message-file / pr-file / event / squash-file / check-config のいずれか 1 つを指定してください')
  const mode = modes[0]
  if (result.agent && mode !== 'message-file') throw new Error('--agent は --message-file と併用してください')
  if ((result.base || result.head) && (mode !== 'pr-file' || !result.base || !result.head)) throw new Error('--base と --head は --pr-file と同時に指定してください')
  if (Boolean(result['body-file']) !== (mode === 'squash-file')) throw new Error('--squash-file と --body-file は同時に指定してください')
  return result
}

export function checkGitConventions(args, cwd = process.cwd()) {
  const options = parseGitConventionArgs(args)
  const root = path.resolve(cwd, options.root ?? '.')
  let problems = validateGitConventions()
  let evidence = { checked_commits: 0, checked_merges: 0 }
  if (options['check-config']) {
    const fill = text => text.replaceAll('{{summary}}', '規約を確認する').replaceAll('{{reason}}', '記載形式を統一するため').replaceAll('{{validation}}', '静的検証に成功').replaceAll('{{impact}}', 'なし')
    const message = fill(readFileSync(path.join(implementationRoot, 'harness/commit-message.txt'), 'utf8'))
    const body = fill(readFileSync(path.join(implementationRoot, '.github/pull_request_template.md'), 'utf8'))
    problems.push(...validateCommitMessage(message), ...validatePr({ title: 'chore(harness): 規約を確認する', body, branch: 'chore/git-conventions' }))
  }
  if (options['message-file']) problems.push(...validateCommitMessage(readFileSync(path.resolve(cwd, options['message-file']), 'utf8').replace(/^\uFEFF/, ''), { agent: options.agent }))
  if (options['pr-file']) {
    const pr = json(path.resolve(cwd, options['pr-file']))
    problems.push(...validatePr(pr))
    if (options.base) {
      if (pr.baseRefOid !== undefined && pr.baseRefOid !== options.base || pr.headRefOid !== undefined && pr.headRefOid !== options.head) throw new Error('PR metadata の base/head SHA と検査範囲が一致しません')
      evidence = validateCommitRange({ root, base: options.base, head: options.head })
    }
  }
  if (options.event) {
    const event = json(path.resolve(cwd, options.event))
    const pr = event.pull_request
    if (!pr || pr.base?.ref !== GIT_CONVENTIONS.base_branch || typeof pr.head?.ref !== 'string' || pr.head.ref === pr.base.ref) throw new Error(`${GIT_CONVENTIONS.base_branch} を base とする pull_request イベントが必要です`)
    problems.push(...validatePr({ title: pr.title, body: pr.body, branch: pr.head.ref }))
    evidence = validateCommitRange({ root, base: pr.base.sha, head: pr.head.sha })
  }
  if (options['squash-file']) {
    const pr = json(path.resolve(cwd, options['squash-file']))
    problems.push(...validatePr(pr))
    if (problems.length) throw new Error(problems.join('\n'))
    const output = formatSquashMessage(pr)
    const bodyFile = path.resolve(cwd, options['body-file'])
    writeSquashBody(path.resolve(cwd, options['squash-file']), bodyFile, output.body)
    return { valid: true, subject: output.subject, body_file: bodyFile }
  }
  problems = [...problems, ...(evidence.problems ?? [])]
  return { valid: problems.length === 0, problems, checked_commits: evidence.checked_commits, checked_merges: evidence.checked_merges }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = checkGitConventions(process.argv.slice(2))
    console.log(JSON.stringify(result, null, 2))
    if (!result.valid) process.exitCode = 1
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
