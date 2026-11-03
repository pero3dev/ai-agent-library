import { createHash } from 'node:crypto'
import type { AudioArticle, AudioCatalog, AudioEpisode } from './content-types.ts'
export type { AudioArticle, AudioCatalog, AudioEpisode } from './content-types.ts'

type SourceEpisode = Omit<AudioEpisode, 'route' | 'article_title' | 'section' | 'section_title' | 'stale'>
interface SourceCatalog { schema_version: 1; updated_at: string | null; episodes: SourceEpisode[] }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const matches = (pattern: RegExp, value: unknown) => typeof value === 'string' && pattern.test(value)
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const HASH = /^[a-f0-9]{64}$/
const ARTICLE = /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/
const requiredText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const validDate = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))

export const audioSourceDigest = (text: string) => createHash('sha256').update(text.replace(/\r\n?/g, '\n'), 'utf8').digest('hex')

// Only the repository's versioned release assets are public playback sources.
export function isAudioAssetUrl(value: unknown) {
  try {
    if (typeof value !== 'string') return false
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port &&
      !url.username && !url.password && !url.search && !url.hash &&
      /^\/pero3dev\/ai-agent-library\/releases\/download\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\.mp3$/.test(url.pathname)
  } catch { return false }
}

export function validateAudioCatalog(catalog: unknown): string[] {
  const errors: string[] = []
  if (!record(catalog) || catalog.schema_version !== 1 || !Array.isArray(catalog.episodes)) return ['音声カタログの schema_version / episodes が不正です']
  if (catalog.updated_at !== null && !validDate(catalog.updated_at)) errors.push('updated_at が不正です')
  const ids = new Set()
  const groups = new Map<unknown, Record<string, unknown>[]>()
  for (const episode of catalog.episodes as unknown[]) {
    if (!record(episode)) { errors.push('episode が不正です'); continue }
    const prefix = `音声 ${episode.id ?? '(id なし)'}`
    if (!matches(ID, episode.id) || ids.has(episode.id)) errors.push(`${prefix}: id が不正または重複しています`)
    ids.add(episode.id)
    if (!matches(ARTICLE, episode.article_path) || matches(/\/readme\.md$/i, episode.article_path)) errors.push(`${prefix}: article_path が不正です`)
    for (const field of ['source_digest', 'audio_sha256', 'script_sha256']) if (!matches(HASH, episode[field])) errors.push(`${prefix}: ${field} が不正です`)
    if (!requiredText(episode.title) || !requiredText(episode.attribution)) errors.push(`${prefix}: タイトルまたはクレジットがありません`)
    if (!validDate(episode.published_at)) errors.push(`${prefix}: published_at が不正です`)
    if (!isAudioAssetUrl(episode.audio_url)) errors.push(`${prefix}: 許可された公開音声 URL ではありません`)
    if (!finite(episode.duration_seconds) || episode.duration_seconds <= 0 || episode.duration_seconds > 7200) errors.push(`${prefix}: 再生時間が不正です`)
    if (!finite(episode.part) || !finite(episode.parts) || !Number.isInteger(episode.part) || !Number.isInteger(episode.parts) || episode.part < 1 || episode.parts < episode.part || episode.parts > 100) errors.push(`${prefix}: 前後編の番号が不正です`)
    if (!Array.isArray(episode.voices) || episode.voices.length !== 2 || new Set(episode.voices.map((v: unknown) => record(v) ? v.role : undefined)).size !== 2 || episode.voices.some((v: unknown) => !record(v) || typeof v.role !== 'string' || !['listener', 'explainer'].includes(v.role) || !requiredText(v.name) || !['string', 'number'].includes(typeof v.id))) errors.push(`${prefix}: 二人の声の情報が不正です`)
    let previous = -1
    const chapterIds = new Set()
    if (!Array.isArray(episode.chapters) || !episode.chapters.length) errors.push(`${prefix}: チャプターがありません`)
    else for (const chapter of episode.chapters as unknown[]) {
      if (!record(chapter) || !matches(ID, chapter.id) || chapterIds.has(chapter.id) || !requiredText(chapter.title) || !finite(chapter.start_seconds) || chapter.start_seconds < 0 || chapter.start_seconds <= previous || !finite(episode.duration_seconds) || chapter.start_seconds >= episode.duration_seconds) errors.push(`${prefix}: チャプターが不正です`)
      if (record(chapter)) { if (finite(chapter.start_seconds)) previous = chapter.start_seconds; chapterIds.add(chapter.id) }
    }
    const firstChapter: unknown = Array.isArray(episode.chapters) ? episode.chapters[0] : undefined
    if (!record(firstChapter) || firstChapter.start_seconds !== 0) errors.push(`${prefix}: 最初のチャプターは 0 秒で開始してください`)
    const group = groups.get(episode.article_path) ?? []
    group.push(episode)
    groups.set(episode.article_path, group)
  }
  for (const [article, episodes] of groups) {
    const first = episodes[0]
    if (episodes.length !== first.parts || new Set(episodes.map(e => e.part)).size !== first.parts || episodes.some(e => e.parts !== first.parts || e.source_digest !== first.source_digest || e.script_sha256 !== first.script_sha256)) errors.push(`${article}: 前後編の欠落または異なる版の混在があります`)
  }
  return errors
}

function assertSourceCatalog(catalog: unknown): asserts catalog is SourceCatalog {
  const errors = validateAudioCatalog(catalog)
  if (errors.length) throw new Error(errors.join('\n'))
}

export function buildAudioCatalog(catalog: unknown, articles: AudioArticle[], { testOnly = false } = {}): AudioCatalog {
  assertSourceCatalog(catalog)
  const byPath = new Map(articles.map(article => [article.article_path, article]))
  // A removed or unpublished article must not remain discoverable through audio.
  const episodes = catalog.episodes.filter(e => byPath.has(e.article_path)).map(episode => {
    const article = byPath.get(episode.article_path)!
    const { id, article_path, source_digest, title, part, parts, audio_url, duration_seconds, chapters, published_at, audio_sha256, script_sha256, voices, attribution } = episode
    return { id, article_path, source_digest, title, part, parts, audio_url, duration_seconds, chapters, published_at, audio_sha256, script_sha256, voices, attribution,
      route: article.route, article_title: article.title, section: article.section, section_title: article.section_title, stale: source_digest !== article.source_digest }
  }).sort((a, b) => a.article_path.localeCompare(b.article_path) || a.part - b.part)
  return { schema_version: 1, updated_at: catalog.updated_at, test_only: testOnly, articles, episodes }
}
