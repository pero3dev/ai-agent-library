import { createHash } from 'node:crypto'
import { lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'

const profiles = /\b[A-Z]:[\\/]+Users[\\/]+[^\\/\s<>:"'`|()*\[\]{}]+|(?<![a-zA-Z0-9:./\\])\/(?:Users|home)\/[^/\s<>:"'`|()*\[\]{}]+/gi
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const profileOccurrences = text => [...text.matchAll(profiles)].length
export const redactProfilePaths = text => text.replace(profiles, '<user-home>')

export function checkPublicRecords(root, files, contract) {
  const problems = []
  const frozen = contract.public_records?.legacy ?? {}
  const policy = contract.public_records
  if (!policy || !Number.isInteger(policy.max_bytes) || policy.max_bytes < 1 || !Array.isArray(policy.extensions) || !policy.extensions.length) throw new Error('公開記録の容量・種類の契約が必要です')
  for (const [file, entry] of Object.entries(frozen)) {
    if (!file.startsWith('project/records/') || !/^[a-f0-9]{64}$/.test(entry.sha256) || !entry.reason) throw new Error(`既存証跡の凍結項目が不正です: ${file}`)
  }
  for (const file of files) {
    if (typeof file !== 'string' || file.includes('\\') || path.posix.isAbsolute(file) || path.win32.isAbsolute(file) || file.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('公開記録はリポジトリ内の正規相対パスで指定してください')
    const absolute = path.join(root, file)
    let current = root
    for (const part of file.split('/')) {
      current = path.join(current, part)
      if (lstatSync(current).isSymbolicLink()) throw new Error(`公開記録のリンクは検査できません: ${file}`)
    }
    const bytes = readFileSync(absolute)
    const legacy = frozen[file]
    const unchanged = legacy?.sha256 === sha256(bytes)
    if (file.startsWith('project/records/')) {
      if (bytes.length > policy.max_bytes && !unchanged) problems.push(`公開記録は${policy.max_bytes} bytes以下にしてください: ${file}`)
      if (!policy.extensions.includes(path.posix.extname(file).toLowerCase()) && !unchanged) problems.push(`公開記録の種類は${policy.extensions.join(', ')}です。大きな証跡はartifact/Releaseへ保存してください: ${file}`)
    }
    if (!bytes.includes(0) && profileOccurrences(bytes.toString('utf8')) && !(unchanged && legacy.privacy_exception === true)) problems.push(`ユーザープロファイルの絶対パスを含む公開テキストです: ${file}`)
    if (legacy && !unchanged && legacy.privacy_exception) problems.push(`digestで固定した既存証跡は変更できません。置換する場合は独立した記録で根拠を確認してください: ${file}`)
  }
  return problems
}
