/** Contracts written by sync-content and consumed by the public site. */
export interface PageMetadata {
  title: string
  description: string
  last_updated: string | null
  source_path: string
}
export type PagesMetadata = Record<string, PageMetadata>
export interface Section {
  slug: string
  num: string
  title: string
  description: string
  route: string
  count: number
}
export interface GlossaryEntry {
  name: string
  english: string | null
  summary: string
  href: string | null
}
export interface LinkedGlossaryEntry extends GlossaryEntry { href: string }
export interface ArticleSummary { title: string; route: string; level: string | null }
export interface TagGroup { tag: string; count: number; articles: ArticleSummary[] }
export interface AudioChapter { id: string; title: string; start_seconds: number }
export interface AudioVoice { id: string | number; name: string; role: string }
export interface AudioArticle {
  article_path: string
  source_digest: string
  title: string
  route: string
  section: string
  section_title: string
}
export interface AudioEpisode {
  id: string
  article_path: string
  source_digest: string
  title: string
  part: number
  parts: number
  audio_url: string
  duration_seconds: number
  chapters: AudioChapter[]
  published_at: string
  audio_sha256: string
  script_sha256: string
  voices: AudioVoice[]
  attribution: string
  route: string
  article_title: string
  section: string
  section_title: string
  stale: boolean
}
/** JSON imports widen numeric literals; the producer validates the version. */
export interface AudioCatalog {
  schema_version: number
  updated_at: string | null
  test_only: boolean
  articles: AudioArticle[]
  episodes: AudioEpisode[]
}
export interface PartialObservation {
  observed_on: string
  status: string
  affected_docs: string[]
  evidence: string
  summary: string
}
export interface FreshnessSystem {
  id: string
  title: string
  cadence_days: number
  target_patterns: string[]
  last_verified_at: string | null
  verification_scope: string | null
  next_due_on: string | null
  status: string
  evidence: string | null
  last_partial_observation_on: string | null
  partial_observations: PartialObservation[]
}
export interface FreshnessReport { checked_on: string; systems: FreshnessSystem[] }
