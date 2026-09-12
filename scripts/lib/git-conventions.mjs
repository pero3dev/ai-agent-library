import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

// Load beside this implementation, never from the PR candidate checkout.
export const GIT_CONVENTIONS = JSON.parse(readFileSync(new URL('../../harness/git-conventions.json', import.meta.url), 'utf8'))
const contract = GIT_CONVENTIONS
const japanese = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u
const shaPattern = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/
const footerField = /^\s*(?:[-*#>]\s*)?(?:Agent|Co-authored-by|Generated-by)\s*:/i
const placeholder = /^(?:TODO|TBD|FIXME|未記入|未入力|要記入|ここに.*|.*を記載(?:してください)?|[?？]+|<[^>]+>|\{\{[^}]+\}\}|\[[^\]]*(?:記入|選択)[^\]]*\])$/i

export function validateGitConventions(config = contract) {
  const problems = []
  if (!config || typeof config !== 'object' || Array.isArray(config)) return ['Git 契約は object で指定してください']
  const list = (value, label, pattern) => {
    if (!Array.isArray(value) || !value.length || value.some(item => typeof item !== 'string' || !pattern.test(item)) || new Set(value).size !== value.length) problems.push(`Git 契約の ${label} は重複のない非空配列にしてください`)
  }
  if (config.schema_version !== 1) problems.push('未対応の Git 契約 schema_version です')
  list(config.subject?.types, 'subject.types', /^[a-z]+$/)
  list(config.subject?.scopes, 'subject.scopes', /^[a-z]+$/)
  if (!Number.isSafeInteger(config.subject?.max_codepoints) || config.subject.max_codepoints < 20 || config.subject.max_codepoints > 200 || config.subject.japanese_required !== true || config.subject.breaking_marker !== false) problems.push('Git 契約の subject 設定が不正です')
  list(config.commit_sections, 'commit_sections', /^[^\s:\r\n]+$/)
  list(config.pr_sections, 'pr_sections', /^[^\r\n#]+$/)
  if (config.commit_sections?.length !== 3 || config.pr_sections?.length !== 3) problems.push('commit / PR は対応する 3 節が必要です')
  const agentEntries = Object.entries(config.agents ?? {})
  if (!agentEntries.length || agentEntries.some(([key, identity]) => !/^[a-z]+$/.test(key) || ['none', 'automation'].includes(key) || typeof identity !== 'string' || !/^[^<>\r\n]+ <[^<>\s@]+@[^<>\s@]+>$/.test(identity)) || new Set(agentEntries.map(([, identity]) => identity.toLowerCase())).size !== agentEntries.length) problems.push('Git 契約の Agent 名義が不正です')
  list(config.agent_values, 'agent_values', /^[a-z]+(?:,[a-z]+)*$/)
  if (Array.isArray(config.agent_values) && (['none', 'automation', ...agentEntries.map(([key]) => key)].some(key => !config.agent_values.includes(key)) || config.agent_values.some(value => !['none', 'automation'].includes(value) && value.split(',').some(key => !Object.hasOwn(config.agents ?? {}, key))))) problems.push('Git 契約の agent_values と agents が一致しません')
  list(config.automation?.subjects, 'automation.subjects', /^[a-z]+\([a-z]+\): \S[^\r\n]*$/)
  if (typeof config.automation?.generated_by !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.automation.generated_by)) problems.push('Git 契約の generated_by が不正です')
  if (config.range_policy !== 'all-new-commits') problems.push('range_policy は all-new-commits にしてください')
  if (typeof config.base_branch !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.base_branch)) problems.push('base_branch が不正です')
  return problems
}

export function validateSubject(subject, { allowPrNumber = false } = {}) {
  const problems = []
  if (typeof subject !== 'string') return ['件名が文字列ではありません']
  if (allowPrNumber) subject = subject.replace(/ \(#[1-9]\d*\)$/, '')
  if (/ \(#\d+\)$/.test(subject)) problems.push('PR title の PR 番号 suffix または commit の重複 suffix は省いてください')
  if ([...subject].length > contract.subject.max_codepoints) problems.push(`件名は ${contract.subject.max_codepoints} Unicode code point 以内にしてください`)
  if (/[\p{Cc}\p{Cf}]/u.test(subject)) problems.push('件名に制御文字を含められません')
  if (/\s{2}/u.test(subject)) problems.push('件名に連続した空白を含められません')
  const match = /^([a-z]+)\(([a-z]+)\): (\S(?:.*\S)?)$/u.exec(subject)
  if (!match || !contract.subject.types.includes(match[1]) || !contract.subject.scopes.includes(match[2])) problems.push('件名は許可された type(scope): 日本語の要約 にしてください（! は未対応）')
  else {
    if (!japanese.test(match[3])) problems.push('件名の要約には日本語を含めてください')
    if (/[.。!！?？:：;；,，、…]$/u.test(match[3])) problems.push('件名末尾の句読点は省いてください')
    if (placeholder.test(match[3]) || /\{\{[^}]+\}\}/.test(match[3])) problems.push('件名のプレースホルダーを置き換えてください')
    if (['修正する', '更新する'].includes(match[3])) problems.push('件名には具体的な変更結果を記載してください')
  }
  return problems
}

export function validateBranch(branch) {
  if (typeof branch !== 'string') return ['PR の head branch が文字列ではありません']
  if (/^automation\/freshness-\d{8}t\d{9}z-[a-f0-9]{8}$/.test(branch)) return []
  const match = /^([a-z]+)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(branch)
  return match && contract.subject.types.includes(match[1]) ? [] : ['PR の head branch は type/kebab-slug または所定の automation/freshness-<runId> にしてください（main は不可）']
}

function normalize(text, problems) {
  if (typeof text !== 'string') { problems.push('本文が文字列ではありません'); return '' }
  const value = text.replace(/\r\n/g, '\n').replace(/\n+$/, '')
  if (/[\p{Cf}\x00-\x08\x0b-\x1f\x7f]/u.test(value)) problems.push('本文に制御文字を含められません')
  return value
}

function fenceStates(lines, problems) {
  let fence = null
  let comment = false
  const outside = lines.map(line => {
    const isOutside = !fence && !comment
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && /^ {0,3}(?:`+|~+)\s*$/.test(line)) fence = null
      return isOutside
    }
    if (!comment && marker) { fence = marker[1]; return isOutside }
    // HTML comments may span otherwise plausible section headings. Ignore
    // comment delimiters inside inline code, just as fenced code is ignored.
    for (let i = 0; i < line.length;) {
      if (comment) {
        const end = line.indexOf('-->', i)
        if (end < 0) break
        comment = false
        i = end + 3
      } else if (line[i] === '`') {
        const run = /^`+/.exec(line.slice(i))[0]
        let end = line.indexOf(run, i + run.length)
        while (end >= 0 && (line[end - 1] === '`' || line[end + run.length] === '`')) end = line.indexOf(run, end + run.length)
        // An unmatched backtick is literal text, so a subsequent comment
        // delimiter must still enter the comment state.
        i = end >= 0 ? end + run.length : i + run.length
      } else if (line.startsWith('<!--', i)) {
        comment = true
        i += 4
      } else i++
    }
    return isOutside
  })
  if (fence) problems.push('閉じていないコードブロックがあります')
  if (comment) problems.push('閉じていない HTML コメントがあります')
  return outside
}

function splitFooter(text, problems, { allowAutomation = true, expectedAgent } = {}) {
  const lines = text.split('\n')
  const outside = fenceStates(lines, problems)
  const start = lines.findIndex((line, i) => outside[i] && /^Agent: /.test(line))
  if (start < 0 || !outside[start] || start === 0 || lines[start - 1] !== '') {
    problems.push('本文末尾の独立した trailer に Agent: が必要です')
    return { content: text, footer: '', agent: null }
  }
  for (let i = 0; i < start; i++) if (outside[i] && footerField.test(lines[i])) problems.push('Agent / Co-authored-by / Generated-by は末尾 trailer にのみ置いてください')
  const footer = lines.slice(start)
  const agent = footer[0].slice('Agent: '.length)
  if (!contract.agent_values.includes(agent) || (!allowAutomation && agent === 'automation')) problems.push(`未対応の Agent: ${agent}`)
  if (expectedAgent !== undefined && agent !== expectedAgent) problems.push(`Agent は指定された ${expectedAgent} と一致させてください`)
  const credits = []
  let generated = false
  for (let i = 1; i < footer.length; i++) {
    const line = footer[i]
    if (line === `Generated-by: ${contract.automation.generated_by}` && i === 1 && agent === 'automation') { generated = true; continue }
    const match = /^Co-authored-by: ([^<>\r\n]+) <([^<>\s@]+@[^<>\s@]+)>$/.exec(line)
    if (!match || match[1] !== match[1].trim()) { problems.push(`trailer の形式または配置が不正です: ${line}`); continue }
    const identity = `${match[1]} <${match[2]}>`
    if (credits.some(item => item.toLowerCase().endsWith(`<${match[2].toLowerCase()}>`))) problems.push('Co-authored-by が重複しています')
    credits.push(identity)
    for (const [key, canonical] of Object.entries(contract.agents)) {
      if ((match[1].toLowerCase() === key || match[2].toLowerCase() === /<([^>]+)>/.exec(canonical)[1]) && identity !== canonical) problems.push(`AI の共同編集者は ${canonical} と完全一致させてください`)
    }
  }
  for (const [key, identity] of Object.entries(contract.agents)) {
    const required = agent.split(',').includes(key)
    if (credits.includes(identity) !== required) problems.push(`Agent と Co-authored-by の ${key} が一致しません`)
  }
  const aiCredits = credits.filter(identity => Object.values(contract.agents).includes(identity))
  const expectedCredits = Object.entries(contract.agents).filter(([key]) => agent.split(',').includes(key)).map(([, identity]) => identity)
  if (JSON.stringify(aiCredits) !== JSON.stringify(expectedCredits)) problems.push('AI 共同編集者は Agent 定義の順に記載してください')
  if (agent === 'automation' && (!generated || credits.length)) problems.push('内部生成は Generated-by: ai-agent-library を記載し、共同編集者を付けません')
  return { content: lines.slice(0, start - 1).join('\n'), footer: footer.join('\n'), agent }
}

function sections(content, labels, kind, problems) {
  const lines = content.split('\n')
  const outside = fenceStates(lines, problems)
  const found = []
  const commitLabel = new RegExp(`^(${labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}):(?: (.*))?$`)
  for (let i = 0; i < lines.length; i++) {
    if (!outside[i]) continue
    const match = kind === 'pr' ? /^## (.+)$/.exec(lines[i]) : commitLabel.exec(lines[i])
    if (match) found.push({ index: i, label: match[1], first: kind === 'pr' ? '' : match[2] ?? '' })
  }
  if (found.length !== labels.length || found.some((item, i) => item.label !== labels[i]) || found[0]?.index !== 0) {
    problems.push(`本文は ${labels.map(label => kind === 'pr' ? `## ${label}` : `${label}:`).join(' / ')} の順で構成してください`)
    return []
  }
  return found.map((item, i) => {
    if (i > 0 && lines[item.index - 1] !== '') problems.push(`${item.label} の前に空行が必要です`)
    const value = [item.first, ...lines.slice(item.index + 1, found[i + 1]?.index ?? lines.length)].join('\n').trim()
    const visible = value.replace(/<!--[\s\S]*?-->/g, '').replace(/^ {0,3}(?:`{3,}|~{3,}).*$/gm, '').replace(/^[ \t]*(?:[-*][ \t]+(?:\[[ x]\](?:[ \t]+|$))?)?/gm, '').trim()
    if (!visible || placeholder.test(visible) || /\{\{[^}]+\}\}/.test(visible)) problems.push(`${item.label} を具体的に記載してください`)
    if (i === 1 && /^未実施[。.]?$/.test(visible)) problems.push('検証が未実施の場合は理由を記載してください')
    return value
  })
}

export function validateCommitMessage(text, options = {}) {
  const problems = []
  const normalized = normalize(text, problems)
  const [subject] = normalized.split('\n')
  problems.push(...validateSubject(subject, { allowPrNumber: true }))
  if (!normalized.startsWith(`${subject}\n\n`)) problems.push('件名と本文の間に空行が必要です')
  const result = splitFooter(normalized.slice(subject.length + 2), problems, { expectedAgent: options.agent })
  sections(result.content, contract.commit_sections, 'commit', problems)
  if (result.agent === 'automation') {
    if (!contract.automation.subjects.includes(subject)) problems.push('内部生成コミットは指定された保存・評価準備の件名に限定されます')
  }
  return problems
}

export function validatePr({ title, body, branch, headRefName, baseRefName } = {}) {
  if (branch !== undefined && headRefName !== undefined && branch !== headRefName) return ['branch と headRefName が一致しません']
  if (branch === undefined) branch = headRefName
  const problems = [...validateSubject(title), ...validateBranch(branch)]
  if (baseRefName !== undefined && baseRefName !== contract.base_branch) problems.push(`PR の base は ${contract.base_branch} にしてください`)
  const result = splitFooter(normalize(body, problems), problems, { allowAutomation: false })
  sections(result.content, contract.pr_sections, 'pr', problems)
  return problems
}

export function formatCommitMessage({ type, scope, summary, reason, validation, impact = 'なし', agent = 'codex', generatedBy } = {}) {
  for (const [key, value] of Object.entries({ type, scope, summary, reason, validation, impact, agent })) if (typeof value !== 'string') throw new Error(`${key} は文字列で指定してください`)
  const trailers = [`Agent: ${agent}`]
  if (generatedBy !== undefined) trailers.push(`Generated-by: ${generatedBy}`)
  for (const key of String(agent).split(',')) if (contract.agents[key]) trailers.push(`Co-authored-by: ${contract.agents[key]}`)
  const message = `${type}(${scope}): ${summary}\n\n理由: ${reason}\n\n検証: ${validation}\n\n影響: ${impact}\n\n${trailers.join('\n')}\n`
  const problems = validateCommitMessage(message)
  if (reason === undefined || validation === undefined) problems.push('reason と validation は必須です')
  if (problems.length) throw new Error(problems.join('\n'))
  return message
}

export function formatSquashMessage({ title, body } = {}) {
  const problems = validateSubject(title)
  const result = splitFooter(normalize(body, problems), problems, { allowAutomation: false })
  const values = sections(result.content, contract.pr_sections, 'pr', problems)
  if (problems.length) throw new Error(problems.join('\n'))
  const output = `${contract.commit_sections.map((label, i) => `${label}:\n${values[i]}`).join('\n\n')}\n\n${result.footer}\n`
  const commitProblems = validateCommitMessage(`${title}\n\n${output}`)
  if (commitProblems.length) throw new Error(commitProblems.join('\n'))
  return { subject: title, body: output }
}

const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
export function validateCommitRange({ root = process.cwd(), base, head } = {}) {
  if (!shaPattern.test(base ?? '') || !shaPattern.test(head ?? '') || base.length !== head.length) throw new Error('base/head は同じ長さの完全な小文字 Git SHA で指定してください')
  for (const sha of [base, head]) if (git(root, 'cat-file', '-t', sha).trim() !== 'commit') throw new Error(`commit object がありません: ${sha}`)
  // No candidate code is checked out or run; immutable commit objects are read only.
  const rows = git(root, 'rev-list', '--reverse', '--parents', `${base}..${head}`, '--').split('\n').filter(Boolean)
  const result = { problems: [], checked_commits: 0, checked_merges: 0 }
  for (const row of rows) {
    const [sha, ...parents] = row.split(' ')
    if (parents.length > 1) result.checked_merges++
    result.checked_commits++
    for (const problem of validateCommitMessage(git(root, 'show', '--no-patch', '--format=%B', sha, '--'))) result.problems.push(`${sha}: ${problem}`)
  }
  if (!rows.length) result.problems.push('新規コミットがない base/head は PR 検査に使用できません')
  return result
}
