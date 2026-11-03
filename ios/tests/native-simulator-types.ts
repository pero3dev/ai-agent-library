export interface SimulatorContext { repository: string; run_id: string; run_attempt: string; job: string; source_head: string; checkout_sha: string; source_tree: string; developer_dir: string; profile?: string; ui_slice?: string }
export interface SimulatorStore { has(name: string): boolean; read(name: string): Record<string, unknown>; write(name: string, value: unknown): void }
export type SimulatorExecuteOptions = import('node:child_process').SpawnSyncOptions & { timeout: number; maxBuffer: number; killSignal: 'SIGKILL'; env: NodeJS.ProcessEnv }
export type SimulatorExecute = (binary: string, args: string[], options: SimulatorExecuteOptions) => unknown
export interface SimulatorOptions { context: unknown; store: SimulatorStore; execute: SimulatorExecute; env?: NodeJS.ProcessEnv; now?: () => number; makeToken?: () => string; onToken?: (token: string) => void; onCreated?: (uuid: string) => void; onReady?: (destination: string) => void; token?: string; createdUUID?: string }
export interface DeviceRow { runtime: string; UUID: string; device: Record<string, unknown> & {name: string} }
export interface SimulatorIntent { schema_version: number; context: SimulatorContext; token: string; name: string; runtime_identifier: string; device_type_identifier: string; preexisting_UUIDs: string[]; before_devices_stdout_SHA256: string; before_devices_attempt_label: string; before_devices_receipt_SHA256: string }
export interface CleanupReport { status: string; context: SimulatorContext; UUID: string|null; ok: boolean; error: string|null; shutdown_ok?: boolean; delete_ok?: boolean; absent_after?: boolean }
export interface StreamReceipt extends Record<string, unknown> { stdout_base64: string; stderr_base64: string; stdout_SHA256: string; stderr_SHA256: string }
