#!/usr/bin/env node
/**
 * guard-generated.mjs — PreToolUse フック(Edit|Write|MultiEdit)
 *
 * sync-content.mjs / next build の生成物ディレクトリへの書き込みをブロックする。
 * 正本は docs/(手書き上書きページは website/content-src/)。
 *
 * 入出力(Claude Code hooks 仕様):
 * - stdin: { tool_input: { file_path, ... }, ... } の JSON
 * - exit 2 + stderr: ツール呼び出しをブロックし、stderr をモデルへのフィードバックにする
 * - exit 0(無出力): 許可
 *
 * 既知の限界: Bash のリダイレクト等による書き込みは対象外(主リスクである
 * Edit/Write の誤編集はこれで塞がる。生成物は .gitignore 済みで復元も容易)。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
  let filePath = null
  try {
    filePath = JSON.parse(input)?.tool_input?.file_path ?? null
  } catch {
    process.exit(0) // JSON が読めない場合はブロックしない(フェイルオープン)
  }
  if (!filePath) process.exit(0)
  const rel = path
    .relative(REPO_ROOT, path.resolve(REPO_ROOT, filePath))
    .split(path.sep)
    .join('/')
    .toLowerCase()
  if (GENERATED_DIRS.some(dir => rel.startsWith(dir)) || GENERATED_FILES.includes(rel)) {
    console.error(
      `${rel} は sync-content.mjs / next build の生成物です(git 管理外・毎回再生成)。` +
        '正本は docs/(手書きページは website/content-src/)。docs/ 側を編集し、' +
        '必要なら npm --prefix website run sync で再生成してください。'
    )
    process.exit(2)
  }
  process.exit(0)
})
