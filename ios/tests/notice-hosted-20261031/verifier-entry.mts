import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const argv: unknown = JSON.parse(readFileSync(new URL('./verifier-argv.json', import.meta.url), 'utf8'))
assert.ok(Array.isArray(argv) && (argv as unknown[]).every(value => typeof value === 'string'))
const implementation: unknown = await import(new URL('./installation/verify-core-performance-notice-20261031.mjs', import.meta.url).href)
assert.ok(implementation !== null && typeof implementation === 'object' && !Array.isArray(implementation))
const { main } = implementation as Record<string, unknown>
assert.ok(typeof main === 'function')
await (Reflect.apply(main, undefined, [argv]) as unknown)
