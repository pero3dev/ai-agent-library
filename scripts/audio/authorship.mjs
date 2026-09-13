import { createHash } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const hashPattern = /^[a-f0-9]{64}$/
const agentOrder = ['codex', 'claude']
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
export class AuthorshipError extends Error {
  constructor(message) { super(`Script authorship: ${message}`); this.name = 'AuthorshipError' }
}
const requireValue = (condition, message) => { if (!condition) throw new AuthorshipError(message) }

export function normalizeScriptAgents(agents) {
  requireValue(Array.isArray(agents) && agents.length > 0 && agents.every(agent => agentOrder.includes(agent)) && new Set(agents).size === agents.length, 'agents must be unique known writers (codex, claude)')
  return agentOrder.filter(agent => agents.includes(agent))
}

function binding(value, { allowMissingScript = false } = {}) {
  requireValue(/^docs\/\d{2}-[a-z0-9-]+\/[a-z0-9][a-z0-9/-]*\.md$/.test(value?.article_path ?? '') && !value.article_path.split('/').includes('..'), 'invalid article path')
  requireValue(hashPattern.test(value.source_digest ?? ''), 'invalid source digest')
  requireValue(hashPattern.test(value.script_sha256 ?? '') || (allowMissingScript && value.script_sha256 === null), 'invalid canonical script digest')
  return { article_path: value.article_path, source_digest: value.source_digest, script_sha256: value.script_sha256 }
}

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
  try { stat = lstatSync(directory) } catch (error) { if (error.code !== 'ENOENT') throw new AuthorshipError(`cannot inspect authorship history: ${error.message}`) }
  if (stat) requireValue(stat.isDirectory() && !stat.isSymbolicLink(), 'authorship history must be a regular directory')
  else if (create) mkdirSync(directory)
  return directory
}

function readRecord(file, expected) {
  try {
    const stat = lstatSync(file)
    requireValue(stat.isFile() && !stat.isSymbolicLink() && stat.size < 4096, 'record must be a small regular file')
    const record = JSON.parse(readFileSync(file, 'utf8'))
    requireValue(record?.schema_version === 1 && Object.keys(record).sort().join(',') === 'agents,article_path,schema_version,script_sha256,source_digest', 'invalid record schema')
    const actual = binding(record)
    requireValue(Object.keys(expected).every(key => expected[key] === actual[key]), 'record source/script binding mismatch')
    const agents = normalizeScriptAgents(record.agents)
    requireValue(JSON.stringify(agents) === JSON.stringify(record.agents), 'record agents must use canonical order')
    return { ...record, agents, legacy: false }
  } catch (error) {
    if (error instanceof AuthorshipError) throw error
    throw new AuthorshipError(`cannot read current record: ${error.message}`)
  }
}

/** Legacy Claude is allowed only when the job has no author history at all. */
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
    throw new AuthorshipError(`cannot inspect current history: ${error.message}`)
  }
}

/** Append before saving script.json. Existing records are immutable, including agents. */
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
    if (error.code === 'EEXIST') return existingRecord()
    throw new AuthorshipError(`could not persist immutable record: ${error.message}`)
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
  return { ...record, legacy: false }
}

/** Operator seed: an expected hash is mandatory and the actual script is read locally. */
export function seedScriptAuthorship(jobDir, { article_path, source_digest, agents, expected_script_sha256 } = {}) {
  binding({ article_path, source_digest, script_sha256: expected_script_sha256 })
  directories(jobDir)
  const file = path.join(jobDir, 'script.json')
  requireValue(existsSync(file) && lstatSync(file).isFile() && !lstatSync(file).isSymbolicLink() && lstatSync(file).size < 16 * 1024 * 1024, 'seed requires a regular current script')
  const scriptHash = hash(JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')))
  requireValue(scriptHash === expected_script_sha256, 'seed expected hash does not match the current script')
  return recordScriptAuthorship(jobDir, { article_path, source_digest, script_sha256: scriptHash, agents })
}
