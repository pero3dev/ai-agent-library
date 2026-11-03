import type { SimulatorContext, SimulatorIntent, SimulatorOptions, SimulatorExecuteOptions } from '../../ios/tests/native-simulator-types.ts'
export interface DeviceFixture { udid: string; name: string; state?: string; isAvailable?: boolean; deviceTypeIdentifier?: string }
export interface ReceiptFixture extends Record<string, unknown> {
  schema_version: number; binary: string; arguments: string[]; timeout_ms: number; status: number|null; signal: string|null
  error_code: string|null; error: string|null; output_complete: boolean; stdout_bytes: number; stderr_bytes: number
  stdout_base64: string; stderr_base64: string; stdout_SHA256: string; stderr_SHA256: string; returned_within_deadline: boolean
}
type Ready = ReturnType<typeof import('../../ios/tests/native-simulator-prepare.mjs').prepareNativeSimulator>
export type FixtureEvidence<Key extends string> = (Key extends 'intent' ? SimulatorIntent : Key extends 'ready' ? Ready : Key extends 'created' ? Omit<Ready, 'status'|'inventory'|'destination'> : Key extends 'context' ? SimulatorContext : ReceiptFixture) & Record<string, unknown>
export interface FixtureOptions {
  existing?: DeviceFixture[]; xcode?: string; sdk?: string; runtimes?: unknown[]; types?: unknown[]
  createFailure?: boolean; createOutput?: string; bootFailure?: boolean; bootstatusFailure?: boolean
  shutdownFailure?: boolean; deleteFailure?: boolean; clockIncrement?: number
  intercept?: (binary: string, args: string[], settings: SimulatorExecuteOptions) => unknown
  listHook?: (state: {made: DeviceFixture|null, listCount: number}) => void
  storeHook?: (key: string, value: Record<string, unknown>, files: Map<string, unknown>) => void
}
export interface CommandFixture { binary: string; args: string[]; settings: SimulatorExecuteOptions }
export interface GitCommandFixture { binary: string; args: string[]; options: SimulatorExecuteOptions }
export interface RawResponse { status: number|null; signal: string|null; error: unknown; stdout: Buffer; stderr: Buffer }
export type CleanupOverrides = Partial<SimulatorOptions>
