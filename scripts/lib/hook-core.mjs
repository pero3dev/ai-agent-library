// ai-agent-library:hook-core-v1
/**
 * Codex / Claude の編集フック共通処理。
 * 対応する編集ツールのフィードバックであり、シェルや競合する symlink 操作を
 * 封じる sandbox ではない。PostToolUse の exit 2 は変更を取り消さない。
 */
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDoc } from './validate-core.mjs'

export const GENERATED_DIRS = [
  'website/content', 'website/generated', 'website/out', 'website/.next',
  'website/public/_pagefind', 'website/test-results', 'website/playwright-report',
]
export const GENERATED_FILES = ['website/next-env.d.ts', 'website/dev-server.log']

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const validPath = value => typeof value === 'string' && value.trim().length > 0 && !/[\x00-\x1f]/.test(value)

/** Windows と POSIX のパス境界を分離して試験できる純粋関数。 */
export function relativeInside(root, file, pathApi = path) {
  const relative = pathApi.relative(root, file)
  if (relative === '..' || relative.startsWith(`..${pathApi.sep}`) || pathApi.isAbsolute(relative)) return null
  return relative.split(pathApi.sep).join('/')
}

export function generatedPath(relative) {
  if (relative === null) return false
  const normalized = relative.toLowerCase()
  return GENERATED_DIRS.some(dir => normalized === dir || normalized.startsWith(`${dir}/`)) || GENERATED_FILES.includes(normalized)
}

/** 未作成ファイルでも既存の親を解決する。存在する symlink の取り違えを防ぐ。 */
export function physicalPath(file) {
  const suffix = []
  let parent = path.resolve(file)
  while (true) {
    try {
      // Windows の通常版 realpathSync は 8.3 名を残す場合がある。
      // native 版で長名へ揃え、adapter root / event cwd の実体を同じ表記で比較する。
      return path.resolve(realpathSync.native(parent), ...suffix)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      const next = path.dirname(parent)
      if (next === parent) throw error
      suffix.unshift(path.basename(parent))
      parent = next
    }
  }
}

/** 8.3 名を長名へ揃えるが、編集対象の lexical boundary は symlink を越えて広げない。 */
export function lexicalPath(file) {
  const absolute = path.resolve(file)
  if (process.platform !== 'win32') return absolute
  const volume = path.parse(absolute).root
  const parts = absolute.slice(volume.length).split(path.sep).filter(Boolean)
  let resolved = volume
  for (const [index, part] of parts.entries()) {
    const current = path.join(resolved, part)
    try {
      // この地点より先は lexical な表記を維持する。外部リンクから repo 内へ
      // 戻るパスを、直接所有する編集対象として検証しない。
      if (lstatSync(current).isSymbolicLink()) return path.join(current, ...parts.slice(index + 1))
      resolved = realpathSync.native(current)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      // 新規ファイルは既存親の長名だけを使い、未作成の末尾を保つ。
      return path.join(current, ...parts.slice(index + 1))
    }
  }
  return resolved
}

/** adapter の配置が root の正本。process.cwd や別リポジトリから推測しない。 */
export function rootFromAdapter(adapterUrl) {
  return realpathSync.native(path.resolve(path.dirname(fileURLToPath(adapterUrl)), '..', '..'))
}

function patchPaths(command) {
  if (typeof command !== 'string') throw new Error('apply_patch の tool_input.command がありません')
  const lines = command.replace(/\r\n/g, '\n').split('\n')
  while (lines.at(-1) === '') lines.pop()
  if (lines[0] !== '*** Begin Patch' || lines.at(-1) !== '*** End Patch') throw new Error('apply_patch の開始・終了行が不正です')
  const files = []
  let operation = null
  let moved = false
  for (const line of lines.slice(1, -1)) {
    const match = /^\*\*\* (Add File|Update File|Delete File|Move to): (.*)$/.exec(line)
    if (match) {
      if (!validPath(match[2])) throw new Error('apply_patch の編集対象パスが不正です')
      if (match[1] === 'Move to') {
        if (operation !== 'Update File' || moved) throw new Error('apply_patch の Move to に対応する Update File がありません')
        moved = true
      } else {
        operation = match[1]
        moved = false
      }
      files.push(match[2])
    } else if (line.startsWith('*** ') && line !== '*** End of File') {
      throw new Error('apply_patch の対象行を解析できません')
    } else if (!operation && line !== '') {
      throw new Error('apply_patch の編集対象より前に本文があります')
    }
  }
  if (!files.length) throw new Error('apply_patch の編集対象パスを取得できません')
  return files
}

/** 現行 command 形式と従来の file_path / MultiEdit 形式を共通形へ変換する。 */
export function normalizeEditEvent(event) {
  if (!object(event) || !object(event.tool_input)) throw new Error('編集イベントの tool_input が不正です')
  const input = event.tool_input
  const paths = []
  if (event.tool_name === 'apply_patch') {
    paths.push(...patchPaths(input.command))
  } else {
    if (event.tool_name !== undefined && !['Edit', 'Write', 'MultiEdit'].includes(event.tool_name)) throw new Error('対応していない編集ツールです')
    if (input.file_path !== undefined) {
      if (!validPath(input.file_path)) throw new Error('file_path が不正です')
      paths.push(input.file_path)
    }
    if (input.edits !== undefined) {
      if (!Array.isArray(input.edits) || !input.edits.length) throw new Error('edits は空でない配列が必要です')
      for (const edit of input.edits) {
        if (!object(edit) || (edit.file_path === undefined && !validPath(input.file_path))) throw new Error('edits の編集対象が不明です')
        if (edit.file_path !== undefined) {
          if (!validPath(edit.file_path)) throw new Error('edits の file_path が不正です')
          paths.push(edit.file_path)
        }
      }
    }
    if (!paths.length) throw new Error('編集対象パスを取得できません')
  }
  if (event.cwd !== undefined && (!validPath(event.cwd) || !path.isAbsolute(event.cwd))) throw new Error('cwd は絶対パスが必要です')
  return { cwd: event.cwd, paths: [...new Set(paths)] }
}

export function resolveEditedPaths(edit, repoRoot) {
  const root = realpathSync.native(repoRoot)
  const cwd = physicalPath(edit.cwd ?? root)
  if (relativeInside(root, cwd) === null) throw new Error('イベント cwd がフックのリポジトリ外です')
  return [...new Set(edit.paths.map(file => lexicalPath(path.resolve(cwd, file))))]
}

export function editedPaths(event, repoRoot) {
  return resolveEditedPaths(normalizeEditEvent(event), repoRoot)
}

export function inspectEdits(mode, edit, repoRoot) {
  if (!['guard', 'validate'].includes(mode)) throw new Error('不明なフック種別です')
  const root = realpathSync.native(repoRoot)
  const messages = []
  for (const file of resolveEditedPaths(edit, root)) {
    const relative = relativeInside(root, file)
    const physical = physicalPath(file)
    const physicalRelative = relativeInside(root, physical)
    if (mode === 'guard') {
      if (generatedPath(relative) || generatedPath(physicalRelative)) {
        messages.push(`${relative ?? file} は sync-content.mjs / next build 等の生成物です。正本は docs/(手書きページは website/content-src/)。必要なら npm --prefix website run sync で再生成してください。`)
      }
      continue
    }
    // 外部ファイルは当リポジトリの規約対象外。外部 symlink の本文も読み込まない。
    if (physicalRelative === null || relative === null || !/^docs\/.*\.md$/i.test(relative)) continue
    let text
    try {
      text = readFileSync(physical, 'utf8')
    } catch (error) {
      if (error.code === 'ENOENT') continue // 削除・移動元は検証対象なし
      messages.push(`${relative}: 読込失敗 (${error.message})`)
      continue
    }
    for (const issue of validateDoc(relative, text)) messages.push(`${relative}:${issue.line}: [${issue.check}] ${issue.message}`)
  }
  if (mode === 'validate' && messages.length) messages.push(`検証エラー ${messages.length} 件(規約の入口は AGENTS.md。全体検証: node scripts/validate-docs.mjs --all)`)
  return { exitCode: messages.length ? 2 : 0, messages }
}

/** 両クライアントで解析不能は exit 2。生のイベントや会話は保存しない。 */
export async function runEditHook(mode, adapterUrl, normalize = normalizeEditEvent) {
  try {
    let input = ''
    for await (const chunk of process.stdin) input += chunk
    const result = inspectEdits(mode, normalize(JSON.parse(input)), rootFromAdapter(adapterUrl))
    for (const message of result.messages) console.error(message)
    process.exitCode = result.exitCode
  } catch (error) {
    console.error(`編集対象を検査できません: ${error.message}`)
    process.exitCode = 2
  }
}
