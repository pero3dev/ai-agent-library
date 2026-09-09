import path from 'node:path'

/** Codex apply_patch と file_path 形式の編集イベントから全対象を取り出す。
 * 公式仕様: https://learn.chatgpt.com/docs/hooks (確認: 2026-09-10)
 * apply_patch の tool_input.command はパッチ本文。Move は旧・新両方を検査する。
 * シェル経由の書き込みやシンボリックリンク解決を含む完全な隔離境界ではない。
 */
export function editedPaths(event, repoRoot) {
  const input = event?.tool_input
  const paths = new Set()
  if (typeof input?.file_path === 'string' && input.file_path) paths.add(input.file_path)
  for (const edit of input?.edits ?? []) {
    if (typeof edit?.file_path === 'string' && edit.file_path) paths.add(edit.file_path)
  }
  if (event?.tool_name === 'apply_patch') {
    if (typeof input?.command !== 'string') throw new Error('apply_patch の tool_input.command がありません')
    for (const match of input.command.matchAll(/^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)\r?$/gm)) {
      paths.add(match[1].trimEnd())
    }
    if (!paths.size) throw new Error('apply_patch の編集対象パスを取得できません')
  }
  const cwd = typeof event?.cwd === 'string' && path.isAbsolute(event.cwd) ? event.cwd : repoRoot
  return [...paths].map(file => path.resolve(cwd, file))
}
