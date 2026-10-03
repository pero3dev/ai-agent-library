#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { filesUnder } from './lib/tooling-common.mjs'
import { parseRegistry, matchesPattern } from './freshness-registry.mjs'

export const jstToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export function datedPlans(text, { today = jstToday(), file = '' } = {}) {
  const rows = []; let fence = false, frontmatter = false, deadlineColumns = [], precedingParagraph = '', tableAddressed = false
  const now = Date.parse(`${today}T00:00:00Z`)
  const lines = text.split(/\r?\n/)
  const visible = line => line.replace(/(`+)[\s\S]*?\1/g, '').replace(/\]\([^)]*\)/g, ']').replace(/https?:\/\/\S+/g, '').replace(/[*_]/g, '')
  const deadlineHeader = /予定|期限|EOL|(?:終了|停止|廃止|退役)日/
  for (const [index, line] of lines.entries()) {
    if (index === 0 && line === '---') { frontmatter = true; continue }
    if (frontmatter) { if (line === '---') frontmatter = false; continue }
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue }
    if (fence || /^\s*>/.test(line) || /<!--|-->/.test(line)) continue
    const table = /^\s*\|/.test(line), cleaned = visible(line)
    if (!table) { deadlineColumns = []; tableAddressed = false; if (line.trim()) precedingParagraph = cleaned }
    const cells = table ? cleaned.trim().replace(/^\||\|$/g, '').split('|') : [cleaned]
    if (table && /^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1] ?? '')) {
      deadlineColumns = cells.map((cell, column) => deadlineHeader.test(cell) ? column : -1).filter(column => column >= 0)
      tableAddressed = /(?:期日|予定日).*(?:経過|過ぎ)|経過一覧/.test(precedingParagraph)
      continue
    }
    const year = cleaned.match(/\b(20\d{2})-\d{2}-\d{2}\b/)?.[1] ?? today.slice(0, 4)
    const matches = [...cleaned.matchAll(/(?<![\w/-])(20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})(?![\w/-])/g)]
    for (const [ordinal, match] of matches.entries()) {
      const date = match[0].includes('/') ? `${year}-${match[0].split('/').map(part => part.padStart(2, '0')).join('-')}` : match[0]
      const parsed = Date.parse(`${date}T00:00:00Z`)
      if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== date) continue
      const column = table ? cleaned.slice(0, match.index).split('|').length - 2 : 0
      const preceding = cleaned.slice(Math.max(0, match.index - 30), match.index).split(/[、。|]/).at(-1)
      const following = cleaned.slice(match.index + match[0].length, matches[ordinal + 1]?.index ?? cleaned.length).split(/[、。|]/)[0].slice(0, 35)
      const tableDeadline = table && deadlineColumns.includes(column) && !/[（(][^）)]*$/.test(preceding)
      if (!tableDeadline && /^\s*(?:の|に)?\s*(?:告知|確認|部分確認|公表|公開|発表|時点)/.test(following)) continue
      // Bind a date to its own event, rather than to another plan elsewhere in the paragraph.
      const before = /(?:期限|期日|(?:終了|停止|廃止|退役|開始|移行)(?:予定)?日|予定日)\s*(?:は|が|を|[:：])?\s*$/.test(preceding)
      const after = /^\s*(?:に|から|までに|は|を)?\s*(?:EOL\b|(?:サポート|提供)終了|(?:終了|停止|廃止|開始|移行|退役)(?:予定|見込み)|(?:まで|が期限|が締切))/.test(following)
      if (!(tableDeadline || before || after)) continue
      const days = Math.round((parsed - now) / 86400000)
      if (days > 30) continue
      const addressed = days < 0 && (tableAddressed || /実施済み|終了済み|廃止済み|撤回|延期|予定日を(?:過ぎ|経過)|(?:期日|予定日).{0,8}経過|(?:終了|廃止|開始|実施)しました|実施状況.*確認不能/.test(cleaned))
      const classification = addressed ? 'addressed' : /TODO\(要確認\)|要確認|未確認|確認できません|確認不能/.test(cleaned) ? 'todo' : 'pending'
      rows.push({ file, line: index + 1, date, days_until: days, status: addressed ? 'addressed' : days < 0 ? 'expired' : 'upcoming', classification, needs_verification: !addressed, text: line.trim() })
    }
  }
  return rows
}
export function deadlineReport(root = process.cwd(), { today = jstToday() } = {}) {
  const registry = parseRegistry(readFileSync(path.join(root, 'ROADMAP.md'), 'utf8'))
  const entries = filesUnder(root, 'docs').filter(file => file.endsWith('.md') && !file.endsWith('/README.md')).flatMap(file => datedPlans(readFileSync(path.join(root, file), 'utf8'), { today, file }).map(row => ({ ...row, system_ids: registry.filter(system => system.docPatterns.some(pattern => matchesPattern(file, pattern))).map(system => system.id) })))
  return { checked_on: today, expired: entries.filter(row => row.status === 'expired'), upcoming: entries.filter(row => row.status === 'upcoming'), addressed: entries.filter(row => row.status === 'addressed'), priority_system_ids: [...new Set(entries.filter(row => row.status === 'expired').flatMap(row => row.system_ids))], watchlist_candidates: entries.filter(row => row.status === 'upcoming').map(row => `- **${row.system_ids.join(', ')}** — ${row.date}: ${row.file}:${row.line} を期日後に一次情報で再確認`) }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2); const json = args.includes('--json'); const at = args.indexOf('--today'); const report = deadlineReport(process.cwd(), { today: at < 0 ? jstToday() : args[at + 1] })
    if (json) console.log(JSON.stringify(report, null, 2))
    else { for (const group of ['expired', 'upcoming']) { console.log(`${group}: ${report[group].length}`); for (const row of report[group]) console.log(`${row.file}:${row.line} ${row.date} ${row.text}`) } console.log(report.watchlist_candidates.join('\n')) }
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
