export interface EvaluationOptions extends Record<string, string | undefined> {
  mode: string
  scenario: string
  ref: string
  binary?: string
  run?: string
}
export interface ExecutionContract {
  cwd: string
  scratch_directory: string
  temporary_directory: string
  npm_cache_directory: string
  environment: Record<string, string>
  dependency_install_command: string
}
export interface EvaluationEvent {
  type: string
  thread_id?: unknown
  item?: unknown
  usage?: unknown
}
/** Provider telemetry is retained without claiming a validated provider schema. */
export interface EvaluationEventSummary {
  thread_id: unknown
  completed_turns: number
  failed_turns: number
  command_count: number
  command_failures: number
  usage: unknown
  commands: unknown[]
}
export interface EvaluationRecord extends Record<string, unknown> {
  schema_version?: number
  scenario?: string
  checkout: string
  fixture_sha: string
  execution_contract?: unknown
  observed?: EvaluationEventSummary | null
  changes?: string[]
  committed_changes?: string[]
  summary_file?: string
}
export interface PreparedEvaluation {
  directory: string
  checkout: string
  execution_contract: ExecutionContract
}
