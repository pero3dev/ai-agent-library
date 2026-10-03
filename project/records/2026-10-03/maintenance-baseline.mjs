import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseFrontMatter, toLines, unquote } from '../../../scripts/lib/md-utils.mjs'
import { sourceDigest, sha256 } from '../../../scripts/audio/core.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const args = process.argv.slice(2)
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
if (args.some((arg, index) => index % 2 === 0 && !['--ref', '--output'].includes(arg)) || args.length % 2) throw new Error('Usage: node maintenance-baseline.mjs [--ref SHA] [--output JSON]')
const ref = option('--ref', 'd990973c2c02b6108cd9911fc06e45b3a29f9332')
const git = (...gitArgs) => execFileSync('git', ['-C', root, ...gitArgs], { maxBuffer: 32 * 1024 * 1024 })
const head = git('rev-parse', `${ref}^{commit}`).toString().trim()
const files = git('ls-tree', '-r', '--name-only', head).toString().trim().split('\n')
const inputs = new Map()
const read = name => {
  const raw = git('show', `${head}:${name}`)
  inputs.set(name, { path: name, blob_sha: git('rev-parse', `${head}:${name}`).toString().trim(), sha256: sha256(raw) })
  return raw.toString('utf8')
}
// Import the repository parsers only when their LF-normalized source matches the selected snapshot.
for (const helper of ['scripts/lib/md-utils.mjs', 'scripts/audio/core.mjs']) {
  if (sourceDigest(readFileSync(path.join(root, helper), 'utf8')) !== sourceDigest(read(helper))) throw new Error(`Helper differs from selected ref: ${helper}. Run in a checkout of that ref.`)
}
const articles = files.filter(name => /^docs\/\d{2}-[^/]+\/(?!README\.md)[^/]+\.md$/.test(name)).map(name => {
  const text = read(name), parsed = parseFrontMatter(toLines(text))
  if (!parsed || parsed.errors.length || parsed.unclosed) throw new Error(`Invalid front matter: ${name}`)
  const fields = Object.fromEntries(parsed.fields.map(field => [field.key, unquote(field.value)]))
  return { path: name, section: name.split('/')[1], status: fields.status, source_digest: sourceDigest(text) }
})
const published = articles.filter(article => article.status === 'published')
const catalog = JSON.parse(read('website/audio/catalog.json'))
const episodes = catalog.episodes.map(episode => {
  const article = articles.find(value => value.path === episode.article_path)
  return { id: episode.id, article_path: episode.article_path, part: episode.part, parts: episode.parts, source_digest: episode.source_digest, source_matches: article?.source_digest === episode.source_digest, article_published: article?.status === 'published', audio_url: episode.audio_url, credit: episode.attribution, voice_terms: episode.voices.map(voice => voice.license_url) }
})
const samples = files.filter(name => /^examples\/python\/[^/]+\/README\.md$/.test(name)).map(name => {
  const text = read(name)
  const section = text.split(/^## 動作確認日\s*$/m)[1]?.split(/^## /m)[0]?.trim() ?? 'No verification-date section'
  return { path: name, declared_verification: section, run_now: false }
})
const runs = files.filter(name => /^research\/freshness-runs\/[^/]+\.json$/.test(name)).map(name => {
  const run = JSON.parse(read(name))
  return { path: name, run_id: run.run_id, started_at: run.started_at, completed_at: run.completed_at, declared_systems: run.systems, observations: run.observations.map(observation => ({ system_id: observation.system_id, status: observation.status, summary: observation.summary, affected_docs: observation.affected_docs, sources: observation.sources })) }
})
const observations = runs.flatMap(run => run.observations)
const result = {
  schema_version: 1, baseline_date_jst: '2026-10-03', input_head: head,
  measurement: 'Tracked public sources at input_head; no production, API, or local runtime state',
  published: { count: published.length, denominator_all_articles: articles.length, sections: [...new Set(published.map(article => article.section))].sort().map(section => ({ section, count: published.filter(article => article.section === section).length })) },
  samples: { count: samples.length, entries: samples, boundary: 'README declarations only; historical mock/SDK evidence is not a fresh run or real API verification' },
  audio: { articles: new Set(episodes.map(episode => episode.article_path)).size, denominator_published: published.length, episodes: episodes.length, source_digest_mismatches: episodes.filter(episode => !episode.source_matches).length, entries: episodes, boundary: 'Catalog parts and LF-normalized source hashes; no MP3 decode or human listening' },
  freshness: { committed_run_files: runs.length, unique_declared_affected_docs: new Set(observations.flatMap(observation => observation.affected_docs)).size, unique_observed_system_ids: [...new Set(observations.map(observation => observation.system_id))].sort(), entries: runs, boundary: 'Declared observation claims only; excludes separate 2026-09-10 audit and uncommitted local runs; neither last_updated nor chapter membership is observation completion' },
  unknown: { production_success_rate: 'unknown', waiting_duration: 'unknown', execution_frequency: 'unknown', cycle_overdue: 'unknown', maintenance_effort: 'unknown', learner_outcomes: 'unknown' },
  separate_evidence: { initial_cross_section_audit: 'project/records/2026-09-10/freshness-audit.md', follow_up_updates: 'project/records/2026-09-10/freshness-update.md', local_runtime_state: 'not acquired' },
  inputs: [...inputs.values()].sort((a, b) => a.path.localeCompare(b.path, 'en'))
}
const output = option('--output', fileURLToPath(new URL('maintenance-baseline.json', import.meta.url)))
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`)
process.stdout.write(JSON.stringify({ head, published: published.length, samples: samples.length, audio_articles: result.audio.articles, episodes: episodes.length, mismatches: result.audio.source_digest_mismatches, freshness_runs: runs.length, affected_docs: result.freshness.unique_declared_affected_docs, system_ids: result.freshness.unique_observed_system_ids.length, output }) + '\n')
