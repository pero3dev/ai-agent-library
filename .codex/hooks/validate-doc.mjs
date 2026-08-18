#!/usr/bin/env node
/**
 * validate-doc.mjs — PostToolUse フック(Edit|Write|MultiEdit)
 *
 * docs/ 配下の .md を編集した直後に、その 1 ファイルだけを検証して問題をモデルに返す。
 * 検証ロジックは scripts/lib/validate-core.mjs と共用(CI の validate-docs --all と同一)。
 * ファイル内で閉じる検査のみなので、複数ステップ編集の途中でも誤警告しない。
 *
 * 入出力(Claude Code hooks 仕様):
 * - stdin: { tool_input: { file_path, ... }, ... } の JSON
 * - exit 2 + stderr: 編集後のフィードバックとして stderr をモデルに渡す(PostToolUse は非ブロック)
 * - exit 0(無出力): 問題なし。docs/ 配下の .md 以外も即 exit 0(静粛性の要)
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDoc } from '../../scripts/lib/validate-core.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

let input = ''
process.stdin.on('data', d => (input += d))
process.stdin.on('end', () => {
  let filePath = null
  try {
    filePath = JSON.parse(input)?.tool_input?.file_path ?? null
  } catch {
    process.exit(0)
  }
  if (!filePath) process.exit(0)
  const abs = path.resolve(REPO_ROOT, filePath)
  const rel = path.relative(REPO_ROOT, abs).split(path.sep).join('/')
  if (!/^docs\/[^/]+\/[^/]+\.md$/.test(rel)) process.exit(0)

  let text
  try {
    text = readFileSync(abs, 'utf8')
  } catch {
    process.exit(0) // 削除直後など読めない場合は検証対象なし
  }
  const issues = validateDoc(rel, text)
  if (issues.length === 0) process.exit(0)
  for (const i of issues) {
    console.error(`${rel}:${i.line}: [${i.check}] ${i.message}`)
  }
  console.error(
    `検証エラー ${issues.length} 件(検証ルールの正本は CLAUDE.md。全体検証は node scripts/validate-docs.mjs --all)`
  )
  process.exit(2)
})
