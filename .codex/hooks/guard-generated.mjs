#!/usr/bin/env node
/**
 * guard-generated.mjs — PreToolUse フック(Edit|Write|MultiEdit)
 *
 * sync-content.mjs / next build の生成物ディレクトリへの書き込みをブロックする。
 * 正本は docs/(手書き上書きページは website/content-src/)。
 *
 * 入出力(Codex hooks 仕様。file_path 形式も互換対応):
 * - stdin: { tool_name: 'apply_patch', cwd, tool_input: { command: パッチ本文 } }
 * - exit 2 + stderr: ツール呼び出しをブロックし、stderr をモデルへのフィードバックにする
 * - exit 0(無出力): 許可
 *
 * 既知の限界: Bash のリダイレクト等による書き込みは対象外(主リスクである
 * Edit/Write の誤編集はこれで塞がる。生成物は .gitignore 済みで復元も容易)。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { editedPaths } from './edited-paths.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/** 生成物ディレクトリ(リポジトリルートからの相対・小文字。.gitignore の website 節と対応) */
const GENERATED_DIRS = [
  'website/content/',
  'website/generated/',
  'website/out/',
  'website/.next/',
  'website/public/_pagefind/',
]

/** 生成物ファイル(単体) */
const GENERATED_FILES = ['website/next-env.d.ts', 'website/dev-server.log']

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
  for (const filePath of files) {
    const rel = path.relative(REPO_ROOT, filePath).split(path.sep).join('/').toLowerCase()
    if (!GENERATED_DIRS.some(dir => rel === dir.slice(0, -1) || rel.startsWith(dir)) && !GENERATED_FILES.includes(rel)) continue
    console.error(
      `${rel} は sync-content.mjs / next build の生成物です(git 管理外・毎回再生成)。` +
        '正本は docs/(手書きページは website/content-src/)。docs/ 側を編集し、' +
        '必要なら npm --prefix website run sync で再生成してください。'
    )
    process.exit(2)
  }
  process.exit(0)
})
