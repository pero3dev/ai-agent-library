import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// The observer copies these checked bytes next to its immutable installation.
// Arguments are data fingerprinted by the same owned input catalog as the entry.
const argv: unknown = JSON.parse(readFileSync(new URL('./producer-argv.json', import.meta.url), 'utf8'))
assert.ok(Array.isArray(argv) && (argv as unknown[]).every(value => typeof value === 'string'))
const implementation: unknown = await import(new URL('./installation/core-performance-runner.mjs', import.meta.url).href)
assert.ok(implementation !== null && typeof implementation === 'object' && !Array.isArray(implementation))
const { main, installProcessCleanup } = implementation as Record<string, unknown>
assert.ok(typeof main === 'function' && typeof installProcessCleanup === 'function')
const remove: unknown = Reflect.apply(installProcessCleanup, undefined, [])
assert.ok(typeof remove === 'function')
try { await (Reflect.apply(main, undefined, [argv]) as unknown) }
finally { Reflect.apply(remove, undefined, []) }
