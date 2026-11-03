/** Static contracts for persisted audio jobs; runtime validators remain authoritative. */
export type ScriptAgent = 'codex' | 'claude'
export type VoiceRole = 'listener' | 'explainer'
export interface VoiceConfig { speaker_id: number; name: string; license_url: string }
export interface AudioConfig {
  schema_version: number
  claude_command: string
  claude_model: string
  claude_timeout_seconds: number
  engine_url: string
  ffmpeg_path: string
  ffprobe_path: string
  voices: Record<VoiceRole, VoiceConfig>
  attribution: string
  synthesis: { speed_scale: number; max_chunk_chars?: number; bitrate_kbps: number }
  max_repair_attempts: number
  max_articles_per_run: number
  inter_article_delay_seconds: number
  quota_retry_hours: number
}
export interface SourceSection { id: string; title: string }
export interface SupplementalEntry { document_path: string; heading: string; excerpt: string; excerpt_sha256: string }
export interface SupplementalBundle { schema_version: number; entries: SupplementalEntry[] }
export interface Article {
  article_path: string
  source_digest: string
  title: string
  section: string
  source: string
  supplemental?: SupplementalBundle | null
}
export interface ScriptTurn { role: VoiceRole; text: string }
export interface ScriptChapter { id: string; title: string; source_sections: string[]; turns: ScriptTurn[] }
/** Top-level title is unused legacy metadata; chapter titles are validated spoken content. */
export interface AudioScript { title?: unknown; chapters: ScriptChapter[] }
export interface ReviewCoverage { source_section: string; adequate: boolean; reason: string }
export interface ScriptReview {
  passed: boolean
  issues: string[]
  coverage: ReviewCoverage[]
  source_digest?: string
  script_sha256?: string
  supplemental_digest?: string
  reviewed_at?: string
}
export interface BoundScriptReview extends ScriptReview { source_digest: string; script_sha256: string }
export interface SourceBinding { article_path: string; source_digest: string; script_sha256: string | null }
export interface ScriptAuthorship extends SourceBinding { schema_version: number; agents: ScriptAgent[]; legacy: boolean }
export interface ExecuteOptions { cwd?: string; input?: string; env?: NodeJS.ProcessEnv; timeout?: number }
export interface ExecuteResult { code: number | null; stdout: string; stderr: string }
export type Execute = (command: string, args: string[], options?: ExecuteOptions) => Promise<ExecuteResult>
export type Progress = (value: ProgressUpdate) => unknown | Promise<unknown>
export interface ProgressUpdate { phase?: string; status?: string; repair_attempt?: number; chapter?: string; turn?: number; part?: number; error?: string; ready_file?: string; article_path?: string }
export interface EngineVoice { id: number; name: string; role: VoiceRole; license_url: string }
export interface AudioEngine { version: unknown; voices: EngineVoice[] }
export interface SignalChecks { passed: boolean; duration_seconds: number; silence_seconds: number; character_count: number; issues: string[]; audio_sha256?: string }
export interface ChunkMetadata { signature: string; sha256: string; duration_seconds: number; character_count: number }
export interface SpeechChunk extends ChunkMetadata { file: string; text: string; role: VoiceRole; turn_index: number }
export interface AudioChapter { id: string; title: string; chunks: SpeechChunk[]; duration: number }
export interface ChapterMarker { id: string; title: string; start_seconds: number }
export interface ProducedPart { part: number; parts: number; audio_file: string; audio_sha256: string; duration_seconds: number; chapters: ChapterMarker[]; signal: SignalChecks }
export interface ProducedEpisode {
  id: string; article_path: string; source_digest: string; title: string; part: number; parts: number
  duration_seconds: number; chapters: ChapterMarker[]; audio_sha256: string; audio_file: string
  script_sha256: string; voices: EngineVoice[]; attribution: string
  audio_url?: string; published_at?: string
}
export interface ReadyManifest {
  schema_version: number; article_path: string; source_digest: string; production_signature: string
  supplemental_file?: string; supplemental_digest?: string | null; script_file: string; created_at: string
  review: BoundScriptReview
  signal_checks: { passed: boolean; method: string; parts: SignalChecks[]; limitation: string }
  episodes: ProducedEpisode[]
}
export interface QueueJob extends ProgressUpdate { source_digest: string; job_dir: string; status: string; started_at?: string; updated_at?: string }
export interface ProductionQueue { schema_version: number; jobs: Record<string, QueueJob>; total_articles?: number; pause_until?: string; pause_reason?: string }
export interface ProductionSummary { status: string; ready: string[]; held: { article_path: string; error?: string }[]; processed: number; skipped: number; pause_until?: string; reason?: string }
export interface GeneratorOptions { cwd: string; run?: Execute; env?: NodeJS.ProcessEnv }
export type Generate = (config: AudioConfig, prompt: string, schema: object, options: GeneratorOptions) => Promise<unknown>
export type CatalogEpisode = Omit<ProducedEpisode, 'audio_file' | 'voices'> & { audio_url: string; published_at: string; voices: { id: string | number; name: string; role: VoiceRole; license_url?: string }[] }
export interface StoredCatalog { schema_version: number; updated_at?: string | null; episodes: CatalogEpisode[] }
export interface AuthorshipSnapshot extends SourceBinding { script_sha256: string; agents: ScriptAgent[]; script_file: string }
/** Readers retain the pre-signature/script-file READY format and resolve the legacy script location. */
export type PersistedReadyManifest = Omit<ReadyManifest, 'production_signature' | 'script_file' | 'signal_checks' | 'episodes'> & Partial<Pick<ReadyManifest, 'production_signature' | 'script_file'>> & {
  signal_checks: Omit<ReadyManifest['signal_checks'], 'limitation'> & { limitation?: string }
  episodes: (Omit<ProducedEpisode, 'voices'> & { voices: (Omit<EngineVoice, 'id'> & { id: string | number })[] })[]
}
export interface ValidatedReady extends PersistedReadyManifest { script_authorship: AuthorshipSnapshot }
export type PublicationCommand = (binary: string, args: string[], cwd: string) => string
export interface AssetCoordinates { tag: string; name: string; url: string }
export interface AssetEvidence { verified_at: string; range: boolean; sha256: string; size: number }
export type ProbeAsset = (url: string, options: { size: number; sha256: string }) => Promise<AssetEvidence>
export interface CatalogPr { state: string; number?: number; url?: string; headRefOid?: string; branch?: string }
export interface FullCatalogPr {
  number: number; url?: string; state: string; headRefOid: string; headRefName: string; baseRefName: string
  isCrossRepository: boolean; title: string; body: string; files?: {path: string}[]
  autoMergeRequest?: unknown; mergeStateStatus?: string
}
export interface RegenerationEntry { article_path: string; previous_source_digest: string; source_digest: string | null; status: string; reason: string; requested_at?: string }
export interface CatalogConflict { article_path: string; reason: string }
export interface RefreshJournal {
  status: string; number: number; previous_head: string; previous_title: string; previous_body_sha256: string
  new_head: string; main_sha: string; worktree: string; branch: string; body_file: string; body_sha256: string
  title: string; regeneration: RegenerationEntry[]; authorship?: AuthorshipSnapshot[]
}
export interface CatalogMergeResult {
  status: string; pr?: CatalogPr; head?: string; reason?: string; check?: string; conclusion?: string | null
  workflow_run?: string; regeneration_needed?: RegenerationEntry[]; conflicts?: (CatalogConflict | string)[]
}
export interface PublicationResult {
  mode: string; ready: {manifest: string; article_path: string; episodes: AssetCoordinates[]}[]
  held: {manifest?: string; article_path?: string; reason: string}[]; publications: CatalogEpisode[]
  merge?: CatalogMergeResult; pr?: CatalogPr; waiting_existing_pr?: boolean; regeneration_needed?: RegenerationEntry[]
  published_evidence?: unknown; waiting_deployment?: string
  waiting_batches?: {section: string; ready_articles: number; minimum_batch: number}[]; selected_articles?: string[]
}
