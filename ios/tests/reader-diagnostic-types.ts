import type { Stats } from 'node:fs'
import type { EventEmitter } from 'node:events'

export type DiagnosticStats = Pick<Stats, 'dev' | 'ino' | 'size' | 'mtimeMs' | 'isFile' | 'isDirectory' | 'isSymbolicLink'>
export interface DiagnosticIO {
  lstatSync(file: string): DiagnosticStats; realpathSync(file: string): string
  openSync(file: string, flags: number): number; fstatSync(fd: number): DiagnosticStats
  readSync(fd: number, data: Buffer, offset: number, length: number, position: number): number
  closeSync(fd: number): unknown
  writeFileSync(file: string, data: Buffer, options: {flag: string; mode: number}): unknown
  mkdirSync(file: string, options: {mode: number}): unknown
  opendirSync(file: string): {readSync(): {name: string} | null; closeSync(): unknown}
  rmSync(file: string, options: {recursive: boolean; force: boolean}): unknown
}
export interface DiagnosticChild extends Pick<EventEmitter, 'once'> {
  pid?: number; stdout: Pick<EventEmitter, 'on'> & {destroy?(): unknown}; stderr: Pick<EventEmitter, 'on'> & {destroy?(): unknown}; unref?(): unknown
}
export interface BoundedOptions {cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs: number; maxBytes: number; monitor?: () => void}
export interface BoundedResult {
  status: number | null; signal: string | null; error: string | null; stdout: Buffer; stderr: Buffer
  observed_output_bytes?: number; retained_output_bytes?: number; group_kill_error?: string | null; termination_confirmed?: boolean
}
export type DiagnosticRun = (binary: string, args: string[], options: BoundedOptions) => BoundedResult | Promise<BoundedResult>
export interface BoundedDependencies {
  spawn?: (binary: string, args: string[], options: {cwd?: string; env?: NodeJS.ProcessEnv; stdio: ['ignore','pipe','pipe']; detached: true}) => DiagnosticChild
  killGroup?: (pid: number) => unknown
}
export interface DiagnosticDependencies {io?: DiagnosticIO; run?: DiagnosticRun; clock?: () => number; nonce?: () => string}
export interface DiagnosticOwner {UUID: string; token: string; name: string; runtime_identifier: string; device_type_identifier: string}
export interface DiagnosticRuntime {identifier: string; version: string; buildversion: string}
export interface DiagnosticReport {
  schema_version: number; status: string; diagnostic_only: true; primary_ui_outcome: string | null
  primary_acceptance_modified: false; source_head: string | null; run_id: string | null; run_attempt: string | null
  limits: Readonly<Record<string, number>>; commands: Array<{name:string;binary:string;arguments:string[];timeout_ms:number;output_cap_bytes:number;exit_code:number|null;signal:string|null;error:string|null;observed_output_bytes:number;retained_output_bytes:number;group_kill_error:string|null;termination_confirmed:boolean;raw_output_retained:boolean}>; attachments: Array<{name: string; exported_path: string; bytes: number; SHA256: string}>
  omissions: Array<{test_id?: string; path?: string; bytes?: number; reason: string}>; errors: string[]; geometry: string; unmeasured: string[]
  owner?: {UUID: string; token: string; name: string; runtime_identifier: string; runtime_version: string; runtime_build: string; deleted_identity_verified?: boolean}
  cleanup?: ReturnType<typeof import('./capture-reader-failure-diagnostics.mts').verifyCleanup>
  cached_results?: ReturnType<typeof import('./capture-reader-failure-diagnostics.mts').readCachedUIResults>['evidence']
  failed_test_scope?: ReturnType<typeof import('./capture-reader-failure-diagnostics.mts').failedNativeCases>
  exported?: {files:number;bytes:number;scope:string;test_id:string;filter:string;failure_association_filter:boolean}; failure_attachments?: string
  temporary_export_removed?: boolean; elapsed_ms?: number; retained_payload_bytes_excluding_manifest?: number
}
