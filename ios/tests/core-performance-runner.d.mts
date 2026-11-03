/** Compatibility boundary for the immutable preregistered runner.
 * Implementation SHA-256: 4276643f3c0df1e21d62f020c0ebd5ec32639b536fa6933806e7ad611edcaf5f.
 * This declaration does not claim that the implementation passed TypeScript checking.
 */
import type { BinaryLike } from 'node:crypto'

export const SCENARIOS: string[]
export const CORE_SOURCES: string[]
export function sha256(bytes: BinaryLike): string
export interface PrivateTempRoot {
  readonly root: string; readonly parent: string; readonly marker: string; readonly token: string
  readonly pid: number; readonly uid: number; readonly dev: number; readonly ino: number
  readonly parentDev: number; readonly parentIno: number
}
export function createPrivateTempRoot(parent: string): PrivateTempRoot
export function controlledChildEnvironment(context: PrivateTempRoot): NodeJS.ProcessEnv
export function cleanupPrivateTempRoot(context: PrivateTempRoot): void
export function installProcessCleanup(): () => void
export interface BoundedOptions {
  cwd?: string; timeoutMs?: number; maxBytes?: number; deadline?: number
  env?: NodeJS.ProcessEnv; privateTempRoot?: PrivateTempRoot
}
export interface BoundedResult { stdout: Buffer; stderr: Buffer; pid: number; command: string; args: string[] }
export function runBounded(command: string, args: string[], options?: BoundedOptions): Promise<BoundedResult>
export function literalQueries(swift: string): string[]
export function publishedSource(source: string, sourcePath: string): boolean
export interface CorpusInventory {
  manifest: { schema_version: number; revision: string; articles: unknown[]; files: Record<string, string> } & Record<string, unknown>
  manifest_sha256: string; corpus_sha256: string; files_including_manifest: number
  listed_sha_files: number; bytes_including_manifest: number; png_files: number
}
export function inventoryCorpus(root: string): Promise<CorpusInventory>
export function idsDigest(ids: string[]): string
export interface QueryResult { query_index: number; result_count: number; ordered_ids_sha256: string }
export interface PerformanceRecord {
  schema_version: number; mode: string; invocation_id: string; process_id: number
  identity_sha256: string; manifest_sha256: string; query_sha256: string; query_count: number
  actual_article_count: number; corpus_revision: string; article_order_sha256: string
  executable_architecture: string; host_os_version: string; correctness?: string
  query_results?: QueryResult[]; wall_seconds?: number; process_peak_resident_bytes?: number
}
export interface PerformanceIdentity {
  executable_architecture: string; manifest_sha256: string; query_sha256: string; query_count: number
  expected_article_count: number; corpus_revision: string; article_order_sha256: string
}
export function validateRecord(record: unknown, identity: PerformanceIdentity, identityHash: string, mode: string, invocationID: string, oracle: Pick<PerformanceRecord, 'query_results'> | null | undefined, pid: number): PerformanceRecord
export interface MetricSummary { median: number; minimum: number; maximum: number; range: number }
export function summarize(records: Pick<PerformanceRecord, 'wall_seconds' | 'process_peak_resident_bytes'>[]): Record<'wall_seconds' | 'process_peak_resident_bytes', MetricSummary>
export function collectSamples(invoke: (mode: string, phase: string, sample: number, oracle?: PerformanceRecord) => Promise<PerformanceRecord>): Promise<{
  scenario: string; discarded_warmup: PerformanceRecord; raw_samples: PerformanceRecord[]
  descriptive: ReturnType<typeof summarize>
}[]>
export function targetSpec(target: unknown): { architecture: string; version: number[] }
export function parseArgs(args: string[]): Record<string, string> | null
export interface Toolchain {
  compiler: string; sdk: string; target: string; swiftVersion: string; architecture: string; compilerVersion: string
  selection: {
    mode: string; requested: { swiftc: string; sdk: string; target: string | null; swift_version: string | null }
    resolved: { swiftc: string; sdk: string; target: string; swift_version: string }
    invocation: { swiftc: string; sdk: string }; compiler_default_target: string; host_process_architecture: string
    sdk: { canonical_name: string; version: string; settings_sha256: string }
  }
}
export function selectToolchain(options: Record<string, string>, bounded?: (command: string, args: string[]) => Promise<Pick<BoundedResult, 'stdout'>>, hostArch?: string): Promise<Toolchain>
export function compileCommand(toolchain: Pick<Toolchain, 'compiler' | 'sdk' | 'target' | 'swiftVersion'>, sources: string[], harness: string, moduleCache: string, executable: string): { executable: string; flags: string[]; args: string[] }
export function main(args: string[]): Promise<void>
