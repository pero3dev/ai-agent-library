import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** スキップリンクがある HTML では移動先が一意に存在することを検証する。 */
export function skipTargetErrors(html) {
  if (!/<a\b[^>]*\bhref=["']#nextra-skip-nav["']/i.test(html)) return []
  const targets = [...html.matchAll(/<[a-z][^>]*\bid=["']nextra-skip-nav["'][^>]*>/gi)]
  return targets.length === 1 ? [] : [`skip target が ${targets.length} 件です(期待: 1 件)`]
}

/** Next の HTML 全件(通常ルートと 404 を含む)を検査する。 */
export function checkExportSkipTargets(outDir) {
  const errors = []
  let count = 0
  const visit = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) visit(file)
      else if (entry.name.endsWith('.html')) {
        count++
        for (const error of skipTargetErrors(readFileSync(file, 'utf8'))) {
          errors.push(`${path.relative(outDir, file)}: ${error}`)
        }
      }
    }
  }
  visit(outDir)
  return { count, errors }
}

/** /docs の手書き入口にも全セクションへのリンクがあることを照合する。 */
export function missingSectionLinks(html, sections, basePath = '') {
  const hrefs = new Set([...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map(match => match[1].replace(/\/$/, '')))
  return sections.filter(section => !hrefs.has(`${basePath}${section.route}`)).map(section => section.route)
}
