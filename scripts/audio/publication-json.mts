// Decode consumed JSON fields without rewriting the original object or its key order.
// That preserves the script/digest and journal contracts checked by the caller.
type Decoder<T> = (value: unknown) => T
type Fields = Record<string, Decoder<unknown>>
type Decoded<S extends Fields> = { [K in keyof S]: ReturnType<S[K]> }
const fail = (): never => { throw new Error('Invalid publication JSON structure') }
const text: Decoder<string> = value => typeof value === 'string' ? value : fail()
const number: Decoder<number> = value => typeof value === 'number' && Number.isFinite(value) ? value : fail()
const boolean: Decoder<boolean> = value => typeof value === 'boolean' ? value : fail()
const anything: Decoder<unknown> = value => value
const optional = <T,>(decode: Decoder<T>): Decoder<T | undefined> => value => value === undefined ? undefined : decode(value)
const nullable = <T,>(decode: Decoder<T>): Decoder<T | null> => value => value === null ? null : decode(value)
const array = <T,>(decode: Decoder<T>): Decoder<T[]> => value => {
  if (!Array.isArray(value)) return fail()
  for (const item of value as unknown[]) decode(item)
  return value as T[] // Every element passed the supplied decoder.
}
const object = <S extends Fields>(fields: S): Decoder<Decoded<S>> => value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail()
  const record = value as Record<string, unknown>
  for (const [key, decode] of Object.entries(fields)) decode(record[key])
  return record as Decoded<S> // Each declared field passed its decoder; retain extra metadata.
}
const role = (value: unknown): 'listener' | 'explainer' => value === 'listener' || value === 'explainer' ? value : fail()
const speaker = (value: unknown): string | number => typeof value === 'string' ? value : number(value)
const voice = object({ id: speaker, name: text, role, license_url: optional(text) })
const chapter = object({ id: text, title: text, start_seconds: number })
const episodeFields = { id: text, article_path: text, source_digest: text, title: text, part: number, parts: number,
  duration_seconds: number, chapters: array(chapter), audio_sha256: text, script_sha256: text, voices: array(voice), attribution: text }
const signal = object({ passed: boolean, duration_seconds: number, silence_seconds: number, character_count: number, issues: array(text), audio_sha256: optional(text) })
const coverage = object({ source_section: text, adequate: boolean, reason: text })
const review = object({ passed: boolean, issues: array(text), coverage: array(coverage), source_digest: text, script_sha256: text, reviewed_at: text, supplemental_digest: optional(text) })
export const decodeSupplemental = object({ schema_version: number, entries: array(object({ document_path: text, heading: text, excerpt: text, excerpt_sha256: text })) })
const persistedVoice = object({ id: speaker, name: text, role, license_url: text })
export const decodeReady = object({ schema_version: number, article_path: text, source_digest: text,
  production_signature: optional(text), supplemental_file: optional(text), supplemental_digest: optional(nullable(text)), script_file: optional(text), created_at: text, review,
  signal_checks: object({ passed: boolean, method: text, parts: array(signal), limitation: optional(text) }),
  episodes: array(object({ ...episodeFields, voices: array(persistedVoice), audio_file: text, audio_url: optional(text), published_at: optional(text) })) })
export const decodeCatalog = object({ schema_version: number, updated_at: optional(nullable(text)), episodes: array(object({ ...episodeFields, audio_url: text, published_at: text })) })
const authorship = object({ article_path: text, source_digest: text, script_sha256: text, script_file: text,
  agents: array((value: unknown): 'codex' | 'claude' => value === 'codex' || value === 'claude' ? value : fail()) })
export const decodeAuthorship = array(authorship)
const regeneration = object({ article_path: text, previous_source_digest: text, source_digest: nullable(text), status: text, reason: text, requested_at: optional(text) })
export const decodeRegeneration = object({ articles: array(regeneration) })
const journal = object({ status: text, number, previous_head: text, previous_title: text, previous_body_sha256: text, new_head: text, main_sha: text,
  worktree: text, branch: text, body_file: text, body_sha256: text, title: text, regeneration: array(regeneration), authorship: optional(decodeAuthorship) })
// Other journal phases intentionally contain fewer fields. Decode the complete
// shape only in a phase which will consume it; do not reject resumable history.
export function decodeRefresh(value: unknown) {
  const phase = object({ status: text })(value)
  if (phase.status === 'prepared' || phase.status === 'pushed') return journal(value)
  return object({ status: text, previous_head: optional(text), new_head: optional(text), regeneration: optional(array(regeneration)), authorship: optional(decodeAuthorship) })(value)
}
export const decodePreparedRefresh = journal
export const decodePending = object({ number, headRefOid: text })
export const decodePr = object({ state: text, number: optional(number), url: optional(text), headRefOid: optional(text), branch: optional(text) })
export const decodePrIdentity = object({ state: text, number, url: optional(text), headRefOid: text })
export const decodeFullPr = object({ number, url: optional(text), state: text, headRefOid: text, headRefName: text, baseRefName: text,
  isCrossRepository: boolean, title: text, body: text, files: optional(array(object({ path: text }))), autoMergeRequest: optional(anything), mergeStateStatus: optional(text) })
export const decodePrList = array(decodeFullPr)
export const decodePrHead = object({ state: text, headRefOid: text, autoMergeRequest: optional(anything) })
export const decodePrMetadata = object({ state: text, headRefOid: text, title: text, body: text })
export const decodeRepository = object({ nameWithOwner: text, visibility: text, defaultBranchRef: optional(nullable(object({ name: text }))) })
export const decodeRelease = object({ tag_name: text, draft: boolean, assets: array(object({ name: text, size: number, created_at: optional(text) })) })
export const decodeProtection = object({ required_status_checks: object({ strict: boolean, checks: array(object({ context: text, app_id: nullable(number) })) }), enforce_admins: object({ enabled: boolean }) })
export const decodeChecks = object({ total_count: number, check_runs: array(object({ id: number, name: text, app: optional(nullable(object({ id: number }))), head_sha: text,
  status: text, conclusion: nullable(text), details_url: optional(nullable(text)), check_suite: optional(object({ id: number })) })) })
export const decodeWorkflow = object({ head_sha: text, path: text, event: text, repository: optional(object({ full_name: text })), head_branch: text,
  check_suite_id: number, display_title: optional(text), status: text, conclusion: nullable(text) })
export const decodeQueue = object({ jobs: optional((value: unknown): Record<string, { status?: string; source_digest?: string }> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail()
  const record = value as Record<string, unknown>, entry = object({ status: optional(text), source_digest: optional(text) })
  for (const item of Object.values(record)) entry(item)
  return record as Record<string, { status?: string; source_digest?: string }>
}) })
export function parsePublicationJson<T>(text: string, decode: Decoder<T>): T {
  const value: unknown = JSON.parse(text)
  return decode(value)
}
