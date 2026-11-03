export interface SavedIconFile { filename: string; bytes: number; sha256: string }
export interface CaptureError { phase: string; message: string }
export interface IconCommand {
  label: string
  binary: string
  arguments: string[]
  timeout_ms: number
  combined_output_cap: number
  exit_code: number | null
  signal: string | null
  error: string | null
  truncated: boolean
  stdout: string
  stderr: string
}
export interface IconCapture extends Record<string, unknown> {
  schema_version: number
  status: string
  Info: ({bytes: number; sha256: string; raw: string} & Record<string, unknown>) | null
  PNGs: {
    filename: string
    bytes: number
    sha256: string
    header: Record<string, string | number | boolean>
    raw: string | null
  }[]
  Assets_car: {bytes: number; sha256: string; raw_copy: boolean} | null
  commands: IconCommand[]
  errors: CaptureError[]
  saved: SavedIconFile[]
}
