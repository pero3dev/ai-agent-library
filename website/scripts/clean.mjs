#!/usr/bin/env node
/**
 * clean.mjs — ビルド生成物を削除する(C5)。
 * .next の古いページマップキャッシュが残ると、ビルドが成功しても一部ルートが
 * 生成されないことがある。公開ビルドは build:clean(clean → build)で行う。
 */
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WEBSITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const dir of ['.next', 'out']) {
  rmSync(path.join(WEBSITE_ROOT, dir), { recursive: true, force: true })
}
console.log('clean: .next / out を削除しました')
