import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
const sha = text => createHash('sha256').update(text).digest('hex')
const corrections = JSON.parse(fs.readFileSync('research/internals/p1-remaining-diagram-sources-2026-09-24.json', 'utf8')).corrections.filter(row => row.id.startsWith('M'))
const article = 'docs/10-llm-foundations/multimodal-models.md'
assert.equal(corrections.length, 13)
assert.ok(corrections.every(row => row.article === article))
const before = fs.readFileSync(article, 'utf8').replaceAll('\r\n', '\n')
assert.equal(sha(before), '151625bf1c3c744cbb5ed04b4de827e4dea9810e6d45844d6cc54d974da28033')
let after = before
const matches = corrections.map(row => {
  const count = after.split(row.before).length - 1
  assert.equal(count, 1, row.id)
  after = after.replace(row.before, row.after)
  return { id: row.id, uniqueBeforeMatchCount: count, sourceIds: row.sourceIds }
})
assert.equal(sha(after), '27956431766343cd1c4b910ce9d7b703e655365856c3e10484de315684688ced')
assert.equal(fs.readFileSync(article, 'utf8').replaceAll('\r\n', '\n'), before)
const report = { checkedAt: new Date().toISOString(), scope: 'Read-only preimplementation check; date is not changed, no article writes', article, beforeSHA256: sha(before), proposedAfterBeforeDateSHA256: sha(after), matches, articleModified: false, formalArticleReview: 'not performed' }
fs.writeFileSync('TEMP/multimodal-f2-correction-precheck-20260930.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ corrections: matches.length, articles: 1, uniqueMatches: true, hashesMatchAdoptedProposal: true, articleModified: false }))
