import type { EventEmitter } from 'node:events'
import type { SpawnOptions } from 'node:child_process'

export interface Snapshot {
  bytes: Buffer
  mode: number
  dev: number
  ino: number
  uid: number
}
export interface NamedSnapshot extends Snapshot { path: string; limit: number }
export interface HostContext {
  platform: string
  arch: string
  uid?: number
  cwd: string
  scriptPath: string
  env: NodeJS.ProcessEnv
}
export interface Acquisition {
  phase: string
  attempt?: number
  args: string[]
  seconds: number | null
  signal?: AbortSignal
  interruptible: boolean
}
export interface ProcessSpec {
  command: string
  args: string[]
  signal?: AbortSignal
  interruptible: boolean
  input?: string
}
export interface ProcessResult { code: number; signal?: string | null; output_bytes?: number }
export interface PreparationIo {
  read: (name: string, limit: number) => Promise<Snapshot>
  directory: (name: string) => Promise<{uid?: number}>
  sourceNames: () => Promise<string[]>
  log: (value: Record<string, unknown>) => void
  run: (options: Acquisition) => Promise<ProcessResult>
  rewrite: (original: Pick<Snapshot, 'mode' | 'dev' | 'ino' | 'uid'>, expected: Buffer[], replacement: Buffer) => Promise<void>
}
type Register = (event: string, listener: Parameters<EventEmitter['on']>[1]) => unknown
export interface ChildHandle {
  pid?: number
  once: Register
  stdout: { on: Register }
  stderr: { on: Register }
  stdin: { on: Register; end: (input: string) => unknown }
}
export interface ChildOptions {
  spawnChild?: (command: string, args: string[], options: SpawnOptions) => ChildHandle
  killGroup?: (pid: number, signal: NodeJS.Signals) => unknown
}
export interface FilesystemStat {
  isFile?: () => boolean; isDirectory?: () => boolean; isSymbolicLink: () => boolean
  size?: number; dev?: number; ino?: number; uid?: number; mode?: number
}
export interface PreparationFilesystem {
  lstat: (name: string) => Promise<FilesystemStat>
  realpath: (name: string) => Promise<string>
  open?: (name: string, flags: string) => Promise<{stat(): Promise<Pick<Snapshot, 'dev' | 'ino' | 'uid' | 'mode'>>; readFile(): Promise<Buffer>; close(): Promise<unknown>}>
  readdir?: (name: string) => Promise<string[]>
}
