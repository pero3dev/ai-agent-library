import { randomUUID } from 'node:crypto'
import { closeSync, lstatSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { withLockMutex } from '../lib/harness-state.mjs'
import { PrerequisiteError } from './core.mjs'

const namespaces = new Set(['run', 'publication'])
const tokenPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/
const pause = new Int32Array(new SharedArrayBuffer(4))

function withAudioMutex(guard, action) {
  for (let attempt = 0; ; attempt++) {
    try { return withLockMutex(guard, action) } catch (error) {
      if (!error.message.startsWith('Lock recovery is already running.') || attempt >= 50) throw error
      // A different process may be finishing its short metadata mutation. Never
      // remove its mutex; a crashed/persistent mutex still fails after the wait.
      Atomics.wait(pause, 0, 0, 10)
    }
  }
}

function readOwner(file) {
  let info
  try { info = lstatSync(file) } catch (error) { if (error.code === 'ENOENT') return null; throw error }
  if (!info.isFile() || info.isSymbolicLink() || info.size > 4096) throw new Error('Invalid audio lock; preserve it for inspection')
  const owner = JSON.parse(readFileSync(file, 'utf8'))
  const started = owner?.created_at ?? owner?.started_at
  if (!Number.isSafeInteger(owner?.pid) || owner.pid <= 0 || typeof started !== 'string' || !Number.isFinite(Date.parse(started)) ||
      (owner.attempt_id !== undefined && (typeof owner.attempt_id !== 'string' || !tokenPattern.test(owner.attempt_id)))) throw new Error('Invalid audio lock owner; preserve it for inspection')
  return owner
}

/** Keep the existing file namespaces; all mutations share the OS-level mutex.
 * Legacy PID/date records migrate only after ESRCH. Malformed records and a
 * persistent lock-mutex are preserved for inspection, never guessed stale.
 */
export function acquireAudioLock(stateDir, namespace) {
  if (!namespaces.has(namespace)) throw new Error('Invalid audio lock namespace')
  const file = path.join(stateDir, `${namespace}.lock`)
  const guard = path.join(stateDir, `.${namespace}-lock-guard`)
  const owner = { pid: process.pid, attempt_id: randomUUID(), created_at: new Date().toISOString() }
  withAudioMutex(guard, () => {
    const previous = readOwner(file)
    if (previous) {
      let alive = true
      try { process.kill(previous.pid, 0) } catch (error) { if (error.code === 'ESRCH') alive = false; else throw error }
      if (alive) throw new PrerequisiteError(`Audio ${namespace === 'run' ? 'producer' : 'publication'} is already running (PID ${previous.pid})`)
      renameSync(file, path.join(stateDir, `expired-${namespace}.lock-${randomUUID()}`))
    }
    const handle = openSync(file, 'wx')
    try { writeFileSync(handle, JSON.stringify(owner)) } finally { closeSync(handle) }
  })
  return {
    owner,
    release: () => withAudioMutex(guard, () => {
      const current = readOwner(file)
      if (!current || current.pid !== owner.pid || current.attempt_id !== owner.attempt_id) return false
      unlinkSync(file)
      return true
    })
  }
}
