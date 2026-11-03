/** Immutable Notice profile boundary; implementation SHA-256:
 * c911db411741ddfa60af310a6d1906f565f3413375a6538655b29053a28d5784.
 * This is an interface declaration, not an implementation type-check result.
 */
import type { ByteContract, createObservationVerifier } from './verify-core-performance.mjs'
export const NOTICE_BYTE_CONTRACT: ByteContract
export const verifyNoticeObservation: ReturnType<typeof createObservationVerifier>
export function main(args: string[]): Promise<void>
