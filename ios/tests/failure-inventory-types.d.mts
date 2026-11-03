import type { SpawnOptions } from 'node:child_process'
export interface ProbeChild {
  pid?: number
  kill: (signal: NodeJS.Signals) => unknown
  stdout: {on: (event: 'data', listener: (bytes: Buffer) => void) => unknown}
  stderr: {on: (event: 'data', listener: (bytes: Buffer) => void) => unknown}
  on(event: 'error', listener: (error: NodeJS.ErrnoException) => void): unknown
  on(event: 'close', listener: (code: number | null, signal: NodeJS.Signals | null) => void): unknown
}
export type SpawnProbe = (binary: string, args: string[], options: SpawnOptions) => ProbeChild
export interface CaptureLimits {
  commandMs: number
  sharedMs: number
  outputBytes: number
  tailBytes: number
  relativeDirectory: string
}
export interface CaptureState {signal: string | null; activeKill: ((reason: string) => void) | null}
export interface ProbeOutput {put: (name: string, value: unknown) => void; check: () => void}
export interface ProbeContext {
  workspace: string
  output: ProbeOutput
  context: Record<string, unknown>
  limits: CaptureLimits
  deadline: number
  now: () => number
  spawnProcess: SpawnProbe
  state: CaptureState
  environment: NodeJS.ProcessEnv
}
export interface InventoryOptions {
  workspace?: string
  unitOutcome?: string
  jobStatus?: string
  context?: Record<string, unknown>
  environment?: NodeJS.ProcessEnv
  spawnProcess?: SpawnProbe
  signals?: {on(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown; removeListener(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown}
  now?: () => number
  limits?: CaptureLimits
  outputDirectory?: string
}
export interface UnstartedProbeReceipt {
  name: string
  spawn_attempted: false
  status: string
}
export interface StartedProbeReceipt {
  name: string; binary: string; arguments: string[]; post_unit_failure: boolean
  spawn_attempted: true; process_created: boolean
  started_at: string; completed_at: string; elapsed_ms: number; timeout_ms: number; timeout_scope: string
  code: number | null; signal: string | null; stop: string | null; error: {code: unknown; message: string} | null
  cancelled_signal: string | null; observed_stream_bytes: number
  raw_stdout_bytes: number; raw_stderr_bytes: number; raw_stdout_SHA256: string; raw_stderr_SHA256: string
  captured_stdout_bytes: number; captured_stderr_bytes: number; captured_stdout_SHA256: string; captured_stderr_SHA256: string
  uncaptured_stream_bytes: number; captured_output_complete: boolean; stdout_tail: string; stderr_tail: string
  json: {status: string; expected_top_level_shape: boolean | null; error?: string}
}
export type ProbeReceipt = UnstartedProbeReceipt | StartedProbeReceipt
export interface InventoryResult extends Record<string, unknown> {
  status: string
  unit_outcome?: string
  cancelled_signal?: string | null
  probes: ProbeReceipt[]
}
