import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

export type JsonObject = Record<string, unknown>
export function record(value: unknown): value is JsonObject { return value !== null && typeof value === 'object' && !Array.isArray(value) }
export function object(value: unknown): asserts value is JsonObject { assert.ok(record(value), 'Expected JSON object') }
export function array(value: unknown): asserts value is unknown[] { assert.ok(Array.isArray(value), 'Expected JSON array') }
export function values(value: unknown): unknown[] { array(value); return value }
export function property(value: unknown, key: string): unknown { assert.ok(value !== null && value !== undefined, 'Expected property receiver'); return Reflect.get(Object(value), key) }
export function objects(value: unknown): JsonObject[] { array(value); for (const item of value) object(item); return value as JsonObject[] }
export function jsonValue(text: string): unknown { return JSON.parse(text) as unknown }
export function jsonObject(text: string): JsonObject { const value: unknown = JSON.parse(text); object(value); return value }
export function jsonArray(text: string): unknown[] { const value: unknown = JSON.parse(text); array(value); return value }
// Node's assert.match rejects non-string actuals at runtime as well.
export function match(value: unknown, expected: RegExp, message?: string | Error): asserts value is string { assert.match(value as string, expected, message) }
// Preserve optional-property diagnostic metadata without claiming its schema.
export function optionalMessage(value: unknown): unknown { return value == null ? undefined : Reflect.get(Object(value), 'message') }

export const WORKFLOW_SOURCES = Object.freeze([
  ".github/scripts/ios-sdk26-archive/01-verify-the-actual-runner-and-documented-xcode-sdk.mts",
  ".github/scripts/ios-sdk26-archive/02-count-tracked-published-sources-independently.mts",
  ".github/scripts/ios-sdk26-archive/03-audit-metadata-all-app-sha-values-device-binary-and-dsym.mts",
  ".github/scripts/ios-sdk26-archive/04-record-compact-completion-or-failure.mts",
  ".github/scripts/ios-sdk26-archive/contracts.mts",
  ".github/workflows/ios-sdk26-archive.yml",
  "ios/tests/archive-signing-settings.mjs",
  "ios/tests/archive-signing-settings.mts",
  "ios/tests/capture-built-app-icon.mjs",
  "ios/tests/capture-built-app-icon.mts",
  "ios/tests/check-built-app-icon.mjs",
  "ios/tests/check-built-app-icon.mts",
  "ios/tests/check-release-package.mjs",
  "ios/tests/check-release-package.mts",
  "ios/tools/app-icon.mjs",
  "ios/tools/app-icon.mts",
  "ios/tools/package-lock.json",
  "package-lock.json",
  "scripts/build-ios-native-content.mjs",
  "scripts/build-ios-native-content.mts",
  "scripts/lib/ios-audio-identity.mjs",
  "scripts/lib/ios-audio-identity.mts",
  "scripts/lib/ios-content.mjs",
  "scripts/lib/ios-content.mts",
  "scripts/lib/ios-learning-content.mjs",
  "scripts/lib/ios-learning-content.mts",
  "scripts/lib/ios-native-assets.mjs",
  "scripts/lib/ios-native-assets.mts",
  "scripts/lib/ios-native-content.mjs",
  "scripts/lib/ios-native-content.mts",
  "scripts/lib/ios-types.d.mts",
  "scripts/lib/json-guards.mjs",
  "scripts/lib/json-guards.mts",
  "scripts/lib/markdown-links.mjs",
  "scripts/lib/markdown-links.mts",
  "scripts/lib/md-utils.mjs",
  "scripts/lib/md-utils.mts"
])
export function sourceHashes(checkpoint: () => void = () => {}): Record<string, string> {
 const hashes: Record<string, string> = {}
 for (const file of WORKFLOW_SOURCES) {
  checkpoint()
  const stat = lstatSync(file)
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size <= 1024 * 1024, 'Source binding requires bounded unlinked regular files')
  assert.equal(realpathSync.native(file), path.resolve(file), 'Source binding cannot follow a linked parent')
  const bytes = readFileSync(file)
  assert.equal(bytes.length, stat.size, 'Source changed during binding')
  hashes[file] = createHash('sha256').update(bytes).digest('hex')
  checkpoint()
 }
 return hashes
}
