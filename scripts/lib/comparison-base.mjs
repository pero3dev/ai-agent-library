import { execFileSync } from 'node:child_process'

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
/** PR commits compare with their common ancestor. A staged immutable tree uses the explicitly supplied base. */
export function comparisonBase(cwd, base, head) {
  for (const value of [base, head]) if (!/^[a-f0-9]{40}$/.test(value ?? '')) throw new Error('base/head は完全な SHA が必要です')
  const baseKind = git(cwd, ['cat-file', '-t', base])
  if (!['commit', 'tree'].includes(baseKind)) throw new Error('base は commit または tree が必要です')
  const kind = git(cwd, ['cat-file', '-t', head])
  if (kind === 'tree' || baseKind === 'tree') return base
  if (kind !== 'commit') throw new Error('head は commit または tree が必要です')
  const bases = git(cwd, ['merge-base', '--all', base, head]).split('\n')
  if (bases.length !== 1 || !/^[a-f0-9]{40}$/.test(bases[0])) throw new Error('一意の merge-base を取得できません。main の取り込みを確認してください')
  return bases[0]
}

/** Retain a reviewed manifest only when the comparison baseline of every declared changed path is identical. */
export function assertManifestBase(cwd, recorded, effective, changes) {
  if (recorded === effective) return
  if (!/^[a-f0-9]{40}$/.test(recorded ?? '')) throw new Error('manifest base_sha が不正です')
  try { git(cwd, ['merge-base', '--is-ancestor', recorded, effective]) } catch { throw new Error('manifest base_sha は比較 base の祖先である必要があります') }
  const records = new Map(git(cwd, ['ls-tree', '-r', recorded]).split('\n').filter(Boolean).map(line => {
    const match = /^(\d{6}) \w+ ([a-f0-9]{40})\t(.+)$/.exec(line)
    return [match[3], { mode: match[1], blob: match[2] }]
  }))
  for (const change of changes) {
    const prior = records.get(change.path)
    if ((prior?.mode ?? '000000') !== change.oldMode || (prior?.blob ?? '0'.repeat(40)) !== change.oldBlob) throw new Error(`${change.path}: 比較 base の内容が変わりました。manifest と独立レビューを更新してください`)
  }
}
