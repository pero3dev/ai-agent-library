import type { FreshnessCheckpoint, FreshnessState, PendingItem } from './freshness-runtime-types.ts'

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item: unknown) => typeof item === 'string')
const optionalStrings = (value: Record<string, unknown>, keys: readonly string[]) => keys.every(key => value[key] === undefined || typeof value[key] === 'string')
const pending = (value: unknown): value is PendingItem => object(value) && typeof value.id === 'string' && typeof value.system_id === 'string' && typeof value.reason === 'string' && optionalStrings(value, ['next_retry_at', 'run_id'])

/** Decode persisted fields without deleting unknown metadata or rewriting legacy state. */
export function assertFreshnessCheckpoint(value: unknown): asserts value is FreshnessCheckpoint {
  if (!object(value) || typeof value.run_id !== 'string' || !strings(value.systems)) throw new Error('Invalid freshness checkpoint run ID/systems')
  if (!optionalStrings(value, ['status', 'started_at', 'finished_at', 'mode', 'base_sha', 'head_sha', 'attempt_id', 'queue_state', 'snapshot_commit', 'snapshot_head', 'saved_at'])) throw new Error('Invalid freshness checkpoint metadata')
  for (const key of ['pr_url', 'merge_sha', 'next_eligible_at', 'wait_reason']) if (value[key] !== undefined && value[key] !== null && typeof value[key] !== 'string') throw new Error(`Invalid freshness checkpoint ${key}`)
  for (const key of ['schema_version', 'generation']) if (value[key] !== undefined && typeof value[key] !== 'number') throw new Error(`Invalid freshness checkpoint ${key}`)
  if (value.completed_systems !== undefined && !strings(value.completed_systems)) throw new Error('Invalid completed systems')
  if (value.resolved_pending_ids !== undefined && !strings(value.resolved_pending_ids)) throw new Error('Invalid resolved pending IDs')
  if (value.pending !== undefined && (!Array.isArray(value.pending) || !value.pending.every(pending))) throw new Error('Invalid pending item')
  if (value.budget !== undefined && (!object(value.budget) || !optionalStrings(value.budget, ['deadline_at', 'stop_reason']) || value.budget.save_margin_seconds !== undefined && typeof value.budget.save_margin_seconds !== 'number')) throw new Error('Invalid run budget')
  if (value.publication_urls !== undefined && (!Array.isArray(value.publication_urls) || !value.publication_urls.every((item: unknown) => typeof item === 'string' || object(item) && typeof item.url === 'string' && optionalStrings(item, ['includes'])))) throw new Error('Invalid publication URLs')
}

export function assertFreshnessState(value: unknown): asserts value is FreshnessState {
  if (!object(value) || value.schema_version !== 1 || !object(value.systems) || !Array.isArray(value.pending) || !value.pending.every(pending) || !object(value.runs)) throw new Error('Invalid local state. Preserve it and inspect before retrying.')
  for (const system of Object.values(value.systems)) if (!object(system) || !optionalStrings(system, ['last_attempted_at', 'last_verified_at']) || system.next_retry_at !== undefined && system.next_retry_at !== null && typeof system.next_retry_at !== 'string') throw new Error('Invalid local system state')
  for (const run of Object.values(value.runs)) if (!object(run) || typeof run.outcome !== 'string' || run.systems !== undefined && !strings(run.systems) || typeof run.completed_at !== 'string' || ['pr_url', 'merge_sha'].some(key => run[key] !== undefined && run[key] !== null && typeof run[key] !== 'string')) throw new Error('Invalid local run result')
  if (value.generation !== undefined && typeof value.generation !== 'number') throw new Error('Invalid local state generation')
  if (value.pending_resolutions !== undefined) {
    if (!object(value.pending_resolutions) || !Object.values(value.pending_resolutions).every(item => object(item) && typeof item.run_id === 'string' && typeof item.system_id === 'string')) throw new Error('Invalid local pending resolution')
  }
  if (value.run_contracts !== undefined) {
    if (!object(value.run_contracts)) throw new Error('Invalid prepared freshness contracts')
    for (const contract of Object.values(value.run_contracts)) if (!object(contract) || typeof contract.run_id !== 'string' || !strings(contract.systems) || !optionalStrings(contract, ['started_at', 'mode'])) throw new Error('Invalid prepared freshness contract')
  }
}

export function assertCandidateEvidence(value: unknown): asserts value is {
  run_id: string; base_sha: string; systems: string[]; started_at: string; observations: Array<{ system_id: string; status: string }>
} {
  if (!object(value) || typeof value.run_id !== 'string' || typeof value.base_sha !== 'string' || typeof value.started_at !== 'string' || !strings(value.systems) || !Array.isArray(value.observations) || !value.observations.every((item: unknown) => object(item) && typeof item.system_id === 'string' && typeof item.status === 'string')) throw new Error('Invalid freshness candidate evidence')
}
