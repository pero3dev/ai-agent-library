import type { RunBudget } from './harness-state.mts'

export interface PendingItem { id: string; system_id: string; reason: string; next_retry_at?: string; run_id?: string }
export interface FreshnessRunResult { outcome: string; systems?: string[]; completed_at: string; pr_url?: string | null; merge_sha?: string | null; publication?: unknown }
export interface FreshnessCheckpoint {
  schema_version?: number; run_id: string; systems?: string[]; status?: string; started_at?: string; finished_at?: string
  mode?: string; base_sha?: string; head_sha?: string; attempt_id?: string; completed_systems?: string[]
  pending?: PendingItem[]; resolved_pending_ids?: string[]; notes?: unknown; generation?: number
  queue_state?: string; next_eligible_at?: string | null; wait_reason?: string | null; budget?: RunBudget
  snapshot_commit?: string; snapshot_head?: string; saved_at?: string; pr_url?: string | null; merge_sha?: string | null
  publication?: unknown; publication_urls?: Array<string | { url: string; includes?: string }>
  github_verification?: unknown
  candidate_verification?: unknown
}
export type PreparedFreshnessContract = Pick<FreshnessCheckpoint, 'run_id' | 'started_at' | 'systems' | 'mode'>
export interface FreshnessState {
  schema_version: number; generation?: number
  systems: Record<string, { last_attempted_at?: string; last_verified_at?: string; next_retry_at?: string | null }>
  pending: PendingItem[]; runs: Record<string, FreshnessRunResult>
  pending_resolutions?: Record<string, { run_id: string; system_id: string }>
  run_contracts?: Record<string, PreparedFreshnessContract>
}
export interface FreshnessOptions {
  [key: string]: string | boolean | undefined
  dryRun?: boolean; usageLimit?: boolean; needsDecision?: boolean
  root?: string; mode?: string; ids?: string; run?: string; outcome?: string
  'run-id'?: string; 'attempt-id'?: string; 'wait-until'?: string; 'wait-reason'?: string; 'time-budget-minutes'?: string
}
