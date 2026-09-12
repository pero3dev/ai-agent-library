import { createHash } from 'node:crypto'

const HASH = /^[a-f0-9]{64}$/
const ARTICLE = /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9-]+\.md$/
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/
const requiredText = value => typeof value === 'string' && value.trim().length > 0
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value))

export const audioSourceDigest = text => createHash('sha256').update(text.replace(/\r\n?/g, '\n'), 'utf8').digest('hex')

// Only the repository's versioned release assets are public playback sources.
export function isAudioAssetUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.port &&
      !url.username && !url.password && !url.search && !url.hash &&
      /^\/pero3dev\/ai-agent-library\/releases\/download\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\.mp3$/.test(url.pathname)
  } catch { return false }
}

export function validateAudioCatalog(catalog) {
  const errors = []
  if (catalog?.schema_version !== 1 || !Array.isArray(catalog?.episodes)) return ['音声カタログの schema_version / episodes が不正です']
  if (catalog.updated_at !== null && !validDate(catalog.updated_at)) errors.push('updated_at が不正です')
  const ids = new Set()
  const groups = new Map()
  for (const episode of catalog.episodes) {
    if (!episode || typeof episode !== 'object') { errors.push('episode が不正です'); continue }
    const prefix = `音声 ${episode.id ?? '(id なし)'}`
    if (!ID.test(episode.id ?? '') || ids.has(episode.id)) errors.push(`${prefix}: id が不正または重複しています`)
    ids.add(episode.id)
    if (!ARTICLE.test(episode.article_path ?? '') || /\/readme\.md$/i.test(episode.article_path)) errors.push(`${prefix}: article_path が不正です`)
    for (const field of ['source_digest', 'audio_sha256', 'script_sha256']) if (!HASH.test(episode[field] ?? '')) errors.push(`${prefix}: ${field} が不正です`)
    if (!requiredText(episode.title) || !requiredText(episode.attribution)) errors.push(`${prefix}: タイトルまたはクレジットがありません`)
    if (!validDate(episode.published_at)) errors.push(`${prefix}: published_at が不正です`)
    if (!isAudioAssetUrl(episode.audio_url)) errors.push(`${prefix}: 許可された公開音声 URL ではありません`)
    if (!Number.isFinite(episode.duration_seconds) || episode.duration_seconds <= 0 || episode.duration_seconds > 7200) errors.push(`${prefix}: 再生時間が不正です`)
    if (!Number.isInteger(episode.part) || !Number.isInteger(episode.parts) || episode.part < 1 || episode.parts < episode.part || episode.parts > 100) errors.push(`${prefix}: 前後編の番号が不正です`)
    if (!Array.isArray(episode.voices) || episode.voices.length !== 2 || new Set(episode.voices.map(v => v?.role)).size !== 2 || episode.voices.some(v => !v || !['listener', 'explainer'].includes(v.role) || !requiredText(v.name) || !['string', 'number'].includes(typeof v.id))) errors.push(`${prefix}: 二人の声の情報が不正です`)
    let previous = -1
    const chapterIds = new Set()
    if (!Array.isArray(episode.chapters) || !episode.chapters.length) errors.push(`${prefix}: チャプターがありません`)
    else for (const chapter of episode.chapters) {
      if (!chapter || !ID.test(chapter.id ?? '') || chapterIds.has(chapter.id) || !requiredText(chapter.title) || !Number.isFinite(chapter.start_seconds) || chapter.start_seconds < 0 || chapter.start_seconds <= previous || chapter.start_seconds >= episode.duration_seconds) errors.push(`${prefix}: チャプターが不正です`)
      if (chapter) { previous = chapter.start_seconds; chapterIds.add(chapter.id) }
    }
    if (episode.chapters?.[0]?.start_seconds !== 0) errors.push(`${prefix}: 最初のチャプターは 0 秒で開始してください`)
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

export function buildAudioCatalog(catalog, articles, { testOnly = false } = {}) {
  const errors = validateAudioCatalog(catalog)
  if (errors.length) throw new Error(errors.join('\n'))
  const byPath = new Map(articles.map(article => [article.article_path, article]))
  // A removed or unpublished article must not remain discoverable through audio.
  const episodes = catalog.episodes.filter(e => byPath.has(e.article_path)).map(episode => {
    const article = byPath.get(episode.article_path)
    const { id, article_path, source_digest, title, part, parts, audio_url, duration_seconds, chapters, published_at, audio_sha256, script_sha256, voices, attribution } = episode
    return { id, article_path, source_digest, title, part, parts, audio_url, duration_seconds, chapters, published_at, audio_sha256, script_sha256, voices, attribution,
      route: article.route, article_title: article.title, section: article.section, section_title: article.section_title, stale: source_digest !== article.source_digest }
  }).sort((a, b) => a.article_path.localeCompare(b.article_path) || a.part - b.part)
  return { schema_version: 1, updated_at: catalog.updated_at, test_only: testOnly, articles, episodes }
}
