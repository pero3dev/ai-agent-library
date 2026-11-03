import type { SpawnOptions } from 'node:child_process'
export type AttachmentRole = 'public' | 'restore' | 'export' | 'confirmation'
export type AttachmentName = readonly [name: string, filename: string, limit: number]
export interface Attachment {
  name: string
  id: string
  size: number
  uti: unknown
}
export interface ExportAttachment extends Attachment { filename: string; limit: number }
export interface SelectedFailure { identifier: string; id: string; omitted_failed_cases: number }
export interface NativeChild {
  pid?: number
  stdout: NativePipe
  stderr: NativePipe
  on(event: 'error', listener: (error: unknown) => void): unknown
  on(event: 'exit' | 'close', listener: (code: number | null, signal: string | null) => void): unknown
}
export interface NativePipe {
  on(event: 'data', listener: (bytes: Buffer) => void): unknown
  on(event: 'error', listener: (error: unknown) => void): unknown
  destroy(): unknown
}
export interface NativeExecuteOptions {
  spawnChild?: (binary: string, args: string[], options: SpawnOptions) => NativeChild
  kill?: (pid: number, signal: NodeJS.Signals) => unknown
  exists?: (pid: number) => boolean
  sleep?: (milliseconds: number) => Promise<unknown>
}
export interface NativeCommandResult {
  ok: boolean
  quiescent: boolean
  bytes: unknown
  exit_code?: number | null
  signal?: string | null
}
export interface NativeAttachmentIO {
  bundleAvailable: boolean
  invoke: (kind: string, payload: {id: string} | ExportAttachment | null, acquirePermit: () => number) => Promise<NativeCommandResult>
  retain: (name: string, bytes: Buffer) => Promise<void>
  close: (bytes: Buffer) => Promise<void>
}
export interface NativeCallReceipt {
  kind: string
  planned_timeout_ms: number
  actual_timeout_ms: number | null
  completed: boolean
  quiescent: boolean
  exit_code?: number | null
  signal?: string | null
}
