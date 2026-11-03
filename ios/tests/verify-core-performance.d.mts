/** Immutable verifier boundary; implementation SHA-256:
 * 15880ac76ec61af487d888684fa8910a5f74e74a43a717bb839442ce7fa30c51.
 * Implementation checking is intentionally excluded from this migration.
 */
export interface ByteContract {
  readonly production_source_sha256: Readonly<Record<string, string>>
  readonly harness_sha256: string; readonly runner_sha256: string; readonly query_source_sha256: string
  readonly query_sha256: string; readonly query_count: number; readonly expected_article_count: number
  readonly expected_count_method: string; readonly published_sources_sha256: string
}
export interface VerificationOptions { observation: string; corpus: string; revision: string }
export const BYTE_CONTRACT: ByteContract
export function createObservationVerifier(policy: {trustedByteContract: ByteContract; trustedRunnerDirectory: string}): (options: VerificationOptions) => Promise<Record<string, unknown>>
export const verifyObservation: ReturnType<typeof createObservationVerifier>
export function parseVerificationArgs(args: string[]): VerificationOptions | null
export function main(args: string[]): Promise<void>
