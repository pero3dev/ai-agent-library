import { createHash } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { errorCode, errorMessage } from './errors.mjs'

/** @typedef {import('./contracts.ts').SourceBinding} SourceBinding */
/** @typedef {import('./contracts.ts').ScriptAgent} ScriptAgent */
/** @typedef {import('./contracts.ts').ScriptAuthorship} ScriptAuthorship */

const hashPattern = /^[a-f0-9]{64}$/
/** @type {ScriptAgent[]} */
const agentOrder = ['codex', 'claude']
/** @param {unknown} value */
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
export class AuthorshipError extends Error {
  /** @param {string} message */
  constructor(message) { super(`Script authorship: ${message}`); this.name = 'AuthorshipError' }
}
/** @type {(condition: unknown, message: string) => asserts condition} */
const requireValue = (condition, message) => { if (!condition) throw new AuthorshipError(message) }
/** @param {unknown} value @returns {value is Record<string, unknown>} */
const recordObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

/** @param {unknown} agents @returns {ScriptAgent[]} */
export function normalizeScriptAgents(agents) {
  requireValue(Array.isArray(agents) && agents.length > 0 && agents.every(agent => agentOrder.includes(agent)) && new Set(agents).size === agents.length, 'agents must be unique known writers (codex, claude)')
  return agentOrder.filter(agent => agents.includes(agent))
}

/** @param {unknown} value @param {{allowMissingScript?: boolean}} [options] @returns {SourceBinding} */
function binding(value, { allowMissingScript = false } = {}) {
  requireValue(recordObject(value) && typeof value.article_path === 'string' && /^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9][a-z0-9/-]*\.md$/.test(value.article_path) && !value.article_path.split('/').includes('..'), 'invalid article path')
  requireValue(typeof value.source_digest === 'string' && hashPattern.test(value.source_digest), 'invalid source digest')
  requireValue(typeof value.script_sha256 === 'string' && hashPattern.test(value.script_sha256) || (allowMissingScript && value.script_sha256 === null), 'invalid canonical script digest')
  return { article_path: value.article_path, source_digest: value.source_digest, script_sha256: value.script_sha256 }
}

/** @param {string} jobDir @param {boolean} [create] */
function directories(jobDir, create = false) {
  // Check every existing path component: an ignored job is still not a link target.
  const absolute = path.resolve(jobDir)
  let cursor = path.parse(absolute).root
  for (const part of path.relative(cursor, absolute).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part)
    requireValue(existsSync(cursor) && lstatSync(cursor).isDirectory() && !lstatSync(cursor).isSymbolicLink(), 'job directory is missing or contains a link')
  }
  const directory = path.join(realpathSync(absolute), 'authorship')
  let stat
  try { stat = lstatSync(directory) } catch (error) { if (errorCode(error) !== 'ENOENT') throw new AuthorshipError(`cannot inspect authorship history: ${errorMessage(error)}`) }
  if (stat) requireValue(stat.isDirectory() && !stat.isSymbolicLink(), 'authorship history must be a regular directory')
  else if (create) mkdirSync(directory)
  return directory
}

/** @param {string} file @param {SourceBinding} expected @returns {ScriptAuthorship} */
function readRecord(file, expected) {
  try {
    const stat = lstatSync(file)
    requireValue(stat.isFile() && !stat.isSymbolicLink() && stat.size < 4096, 'record must be a small regular file')
    const record = /** @type {unknown} */ (JSON.parse(readFileSync(file, 'utf8')))
    requireValue(recordObject(record) && record.schema_version === 1 && Object.keys(record).sort().join(',') === 'agents,article_path,schema_version,script_sha256,source_digest', 'invalid record schema')
    const actual = binding(record)
    requireValue(expected.article_path === actual.article_path && expected.source_digest === actual.source_digest && expected.script_sha256 === actual.script_sha256, 'record source/script binding mismatch')
    const agents = normalizeScriptAgents(record.agents)
    requireValue(JSON.stringify(agents) === JSON.stringify(record.agents), 'record agents must use canonical order')
    return { schema_version: 1, ...actual, agents, legacy: false }
  } catch (error) {
    if (error instanceof AuthorshipError) throw error
    throw new AuthorshipError(`cannot read current record: ${errorMessage(error)}`)
  }
}

/** Legacy Claude is allowed only when the job has no author history at all. */
/** @param {string} jobDir @param {Partial<SourceBinding>} value @returns {ScriptAuthorship | null} */
export function readScriptAuthorship(jobDir, value) {
  try {
    const expected = binding(value, { allowMissingScript: true })
    const directory = directories(jobDir)
    if (!existsSync(directory)) return expected.script_sha256 === null ? null : { schema_version: 1, ...expected, agents: ['claude'], legacy: true }
    requireValue(readdirSync(directory).length > 0, 'authorship directory exists but its history is empty; restore verified records before retrying')
    requireValue(expected.script_sha256 !== null, 'history exists but the current script is unavailable; restore the matching script before retrying')
    const file = path.join(directory, `${expected.script_sha256}.json`)
    requireValue(existsSync(file), 'history exists but the current script record is missing; restore or explicitly seed verified authorship')
    return readRecord(file, expected)
  } catch (error) {
    if (error instanceof AuthorshipError) throw error
    throw new AuthorshipError(`cannot inspect current history: ${errorMessage(error)}`)
  }
}

/** Append before saving script.json. Existing records are immutable, including agents. */
/** @param {string} jobDir @param {Partial<SourceBinding> & {agents: unknown}} value @returns {ScriptAuthorship} */
export function recordScriptAuthorship(jobDir, value) {
  const expected = binding(value)
  const record = { schema_version: 1, ...expected, agents: normalizeScriptAgents(value.agents) }
  const directory = directories(jobDir, true)
  const file = path.join(directory, `${expected.script_sha256}.json`)
  const existingRecord = () => {
    const previous = readRecord(file, expected)
    requireValue(JSON.stringify(previous.agents) === JSON.stringify(record.agents), 'an immutable record already has different writers')
    return previous
  }
  if (existsSync(file)) return existingRecord()
  let descriptor
  try {
    descriptor = openSync(file, 'wx')
    writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    fsyncSync(descriptor)
  } catch (error) {
    // A torn record remains visible and fails closed; it is never treated as legacy.
    if (errorCode(error) === 'EEXIST') return existingRecord()
    throw new AuthorshipError(`could not persist immutable record: ${errorMessage(error)}`)
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
  return { ...record, legacy: false }
}

/** Operator seed: an expected hash is mandatory and the actual script is read locally. */
/** @param {string} jobDir @param {{article_path?: string, source_digest?: string, agents?: unknown, expected_script_sha256?: string}} [options] */
export function seedScriptAuthorship(jobDir, { article_path, source_digest, agents, expected_script_sha256 } = {}) {
  binding({ article_path, source_digest, script_sha256: expected_script_sha256 })
  directories(jobDir)
  const file = path.join(jobDir, 'script.json')
  requireValue(existsSync(file) && lstatSync(file).isFile() && !lstatSync(file).isSymbolicLink() && lstatSync(file).size < 16 * 1024 * 1024, 'seed requires a regular current script')
  const scriptHash = hash(JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')))
  requireValue(scriptHash === expected_script_sha256, 'seed expected hash does not match the current script')
  return recordScriptAuthorship(jobDir, { article_path, source_digest, script_sha256: scriptHash, agents })
}
