#!/usr/bin/env node
/**
 * validate-doc.mjs — PostToolUse フック(Edit|Write|MultiEdit)
 *
 * docs/ 配下の .md を編集した直後に、その編集対象を検証して問題をモデルに返す。
 * 検証ロジックは scripts/lib/validate-core.mjs と共用(CI の validate-docs --all と同一)。
 * ファイル内で閉じる検査のみなので、複数ステップ編集の途中でも誤警告しない。
 *
 * 入出力(Codex hooks 仕様。file_path 形式も互換対応):
 * - stdin: { tool_name: 'apply_patch', cwd, tool_input: { command: パッチ本文 } }
 * - exit 2 + stderr: 編集後のフィードバックとして stderr をモデルに渡す(PostToolUse は非ブロック)
 * - exit 0(無出力): 問題なし。docs/ 配下の .md 以外も即 exit 0(静粛性の要)
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDoc } from '../../scripts/lib/validate-core.mjs'
import { editedPaths } from './edited-paths.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

let input = ''
process.stdin.on('data', d => (input += d))
process.stdin.on('end', () => {
  let files
  try {
    files = editedPaths(JSON.parse(input), REPO_ROOT)
  } catch (error) {
    console.error(`編集対象を検査できません: ${error.message}`)
    process.exit(2)
  }
  let count = 0
  for (const abs of files) {
    const rel = path.relative(REPO_ROOT, abs).split(path.sep).join('/')
    if (!/^docs\/[^/]+\/[^/]+\.md$/.test(rel)) continue
    let text
    try {
      text = readFileSync(abs, 'utf8')
    } catch (error) {
      if (error.code === 'ENOENT') continue // 削除・移動元は検証対象なし
      console.error(`${rel}: 読込失敗 (${error.message})`)
      count++
      continue
    }
    const issues = validateDoc(rel, text)
    count += issues.length
    for (const i of issues) console.error(`${rel}:${i.line}: [${i.check}] ${i.message}`)
  }
  if (!count) process.exit(0)
  console.error(
    `検証エラー ${count} 件(検証ルールの正本は CLAUDE.md。全体検証は node scripts/validate-docs.mjs --all)`
  )
  process.exit(2)
})
