/** Consumed shapes of persisted audio state. Content and binding validators remain authoritative. */
/** @param {unknown} value @returns {value is Record<string, unknown>} */
export const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
/** @param {unknown} value @returns {value is string[]} */
const strings = value => Array.isArray(value) && [...value].every(item => typeof item === 'string')
/** @param {unknown} value @returns {value is import('./contracts.ts').ReviewCoverage} */
export const reviewCoverage = value => record(value) && typeof value.source_section === 'string' && typeof value.adequate === 'boolean' && typeof value.reason === 'string'
/** @param {unknown} value @returns {value is import('./contracts.ts').ScriptReview} */
export function scriptReview(value) {
  return record(value) && typeof value.passed === 'boolean' && strings(value.issues)
    && Array.isArray(value.coverage) && [...value.coverage].every(reviewCoverage)
    && ['source_digest', 'script_sha256', 'supplemental_digest', 'reviewed_at'].every(key => value[key] === undefined || typeof value[key] === 'string')
}
/** @param {unknown} value @returns {value is import('./contracts.ts').BoundScriptReview} */
export const boundReview = value => scriptReview(value) && typeof value.source_digest === 'string' && typeof value.script_sha256 === 'string'
/** @param {unknown} value @returns {value is import('./contracts.ts').AudioScript} */
export function audioScript(value) {
  return record(value) && Array.isArray(value.chapters) && [...value.chapters].every(chapter => record(chapter)
    && typeof chapter.id === 'string' && typeof chapter.title === 'string' && strings(chapter.source_sections)
    && Array.isArray(chapter.turns) && [...chapter.turns].every(turn => record(turn)
      && (turn.role === 'listener' || turn.role === 'explainer') && typeof turn.text === 'string'))
}
/** @param {unknown} value @returns {value is import('./contracts.ts').SupplementalBundle} */
export function supplementalBundle(value) {
  return record(value) && typeof value.schema_version === 'number' && Array.isArray(value.entries)
    && [...value.entries].every(entry => record(entry) && ['document_path', 'heading', 'excerpt', 'excerpt_sha256'].every(key => typeof entry[key] === 'string'))
}
/** @param {unknown} value @returns {value is import('./contracts.ts').ChunkMetadata} */
export const chunkMetadata = value => record(value) && typeof value.signature === 'string' && typeof value.sha256 === 'string'
  && typeof value.duration_seconds === 'number' && typeof value.character_count === 'number'

/** @typedef {{passed: boolean, issues: string[], audio_sha256?: string, duration_seconds: number, silence_seconds: number}} CachedSignal */
/** @typedef {{script_sha256: string, source_digest: string, part: number, parts: number, audio_file: string, audio_sha256: string, duration_seconds: number}} CachedEpisode */
/** @typedef {{source_digest: string, review: import('./contracts.ts').ScriptReview, signal_checks: {passed: boolean, parts: CachedSignal[]}, episodes: CachedEpisode[], production_signature?: string, script_file?: string, supplemental_file?: string, supplemental_digest?: string | null}} ReadyCache */
/** @param {unknown} value @returns {value is CachedSignal} */
const cachedSignal = value => record(value) && typeof value.passed === 'boolean' && strings(value.issues)
  && (value.audio_sha256 === undefined || typeof value.audio_sha256 === 'string') && typeof value.duration_seconds === 'number' && typeof value.silence_seconds === 'number'
/** @param {unknown} value @returns {value is CachedEpisode} */
const cachedEpisode = value => record(value) && ['script_sha256', 'source_digest', 'audio_file', 'audio_sha256'].every(key => typeof value[key] === 'string')
  && ['part', 'parts', 'duration_seconds'].every(key => typeof value[key] === 'number')
/** @param {unknown} value @returns {value is ReadyCache} */
export function readyCache(value) {
  return record(value) && typeof value.source_digest === 'string' && scriptReview(value.review)
    && record(value.signal_checks) && typeof value.signal_checks.passed === 'boolean'
    && Array.isArray(value.signal_checks.parts) && [...value.signal_checks.parts].every(cachedSignal)
    && Array.isArray(value.episodes) && [...value.episodes].every(cachedEpisode)
    && ['production_signature', 'script_file', 'supplemental_file'].every(key => value[key] === undefined || typeof value[key] === 'string')
    && (value.supplemental_digest === undefined || value.supplemental_digest === null || typeof value.supplemental_digest === 'string')
}

/** Historical jobs may omit producer fields; only known, consumed fields are typed. */
/** @typedef {{schema_version?: number, jobs: Record<string, Partial<import('./contracts.ts').QueueJob>>, total_articles?: number, pause_until?: string, pause_reason?: string}} PersistedQueue */
/** @param {unknown} value @returns {value is Partial<import('./contracts.ts').QueueJob>} */
function queueJob(value) {
  return record(value) && ['source_digest', 'job_dir', 'status', 'started_at', 'updated_at', 'phase', 'chapter', 'error', 'ready_file', 'article_path'].every(key => value[key] === undefined || typeof value[key] === 'string')
    && ['repair_attempt', 'turn', 'part'].every(key => value[key] === undefined || typeof value[key] === 'number')
}
/** @param {unknown} value @returns {asserts value is PersistedQueue} */
export function assertQueue(value) {
  if (!record(value) || !record(value.jobs) || !Object.values(value.jobs).every(queueJob)
    || !['schema_version', 'total_articles'].every(key => value[key] === undefined || typeof value[key] === 'number')
    || !['pause_until', 'pause_reason'].every(key => value[key] === undefined || typeof value[key] === 'string')) throw new Error('Invalid audio queue state')
}
/** @typedef {{articles?: {article_path: string, source_digest: string | null}[]}} RegenerationState */
/** @param {unknown} value @returns {asserts value is RegenerationState | null} */
export function assertRegeneration(value) {
  if (value === null) return
  if (!record(value) || (value.articles !== undefined && (!Array.isArray(value.articles) || ![...value.articles].every(item => record(item)
    && typeof item.article_path === 'string' && (typeof item.source_digest === 'string' || item.source_digest === null))))) throw new Error('Invalid audio regeneration state')
}
