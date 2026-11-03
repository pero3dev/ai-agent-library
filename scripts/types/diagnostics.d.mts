import type { VerificationCheck } from '../lib/tooling-types.d.mts'

export interface CheckCommandOptions {
  root?: string
  python?: string
  platform?: NodeJS.Platform
  node?: string
  npmEntry?: string
}
export interface ExecutableCheck { binary: string; args: string[] }
export interface CheckExecutionOptions {
  python?: string
  platform?: NodeJS.Platform
  execute?: (row: VerificationCheck, command: ExecutableCheck) => unknown
}
export interface StructureContract {
  schema_version: 1
  root_files: string[]
  top_directories: string[]
  required_files: string[]
  markdown_coverage_roots: string[]
  retired_paths: string[]
  retired_directories: string[]
  retention: {
    completed_evidence_minimum_days: number
    inventory_threshold_bytes: number
    automatic_deletion: boolean
    deletion_requires: unknown[]
  }
  public_records?: unknown
}
export interface Observation {
  kind: string
  surface: string
  binary?: string
  version?: string
  result: 'passed' | 'failed' | 'unknown'
  observed_at: string
  evidence: string
}
export interface ToolProbe {
  name: string
  binary?: string
  version?: string
  result: string
  reason?: string
  evidence?: string
  model_compatibility?: string
}
export interface HealthRun {
  run_id?: string
  status?: string
  outcome?: string
  started_at?: string | number
  finished_at?: string | number
  completed_at?: string | number
  wait_reason?: string
  next_eligible_at?: string
  github_verification?: {
    verified?: boolean
    checked_at?: string
    publication?: { verified?: boolean; state?: string }
  }
}
export interface HealthState {
  runs?: Record<string, HealthRun>
  pending?: { id: string; status?: string; next_retry_at?: string }[]
}
/** Diagnostic metadata stays untrusted until a consumer narrows the fields it uses. */
export interface HealthRuntime {
  error?: unknown
  status?: unknown
  recovery?: unknown
  compatibility?: unknown
  runs?: unknown
  pending?: unknown
  records?: unknown
  interrupted?: unknown
  state?: unknown
  queue?: unknown
  lock?: unknown
}
export interface AutomationRegistration {
  error?: unknown
  expected?: unknown
  registered?: unknown
  tasks?: unknown
}
export interface HealthOptions {
  statusReader?: (name: string) => unknown | Promise<unknown>
  registrationReader?: () => unknown | Promise<unknown>
  storageReader?: () => unknown
}
export interface GitConventionOptions extends Record<string, string | true | undefined> {
  root?: string
  'message-file'?: string
  agent?: string
  'pr-file'?: string
  base?: string
  head?: string
  event?: string
  'squash-file'?: string
  'body-file'?: string
  'check-config'?: true
}
export interface InventoryScope { path: string; kind?: string }
export interface InventoryContext {
  common: string
  checkouts: { path: string; tracked: Set<string> }[]
}
export interface InventoryWorktree {
  path: string
  status?: string
  storage?: string
  covered_by?: string
  tracked_inventory?: string
}
