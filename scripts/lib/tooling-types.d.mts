export type VerificationOS = 'linux' | 'win32' | 'darwin'
export interface VerificationCheck {
  id: string
  job: string
  command: string
  cwd: string
  os: VerificationOS[]
  evidence: string
  prerequisites: string[]
}
export interface VerificationManifest {
  schema_version: 1
  checks: VerificationCheck[]
  external_evidence: string[]
  excluded_actions: string[]
}
export interface PythonOptions {
  root?: string
  python?: string
  platform?: NodeJS.Platform
  execute?: (binary: string, args: string[]) => string
}
