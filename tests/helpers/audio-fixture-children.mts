import { openSync, closeSync, unlinkSync } from 'node:fs'
import { createInterface } from 'node:readline'
import path from 'node:path'

function utf8ChunkChild() {
  const bytes = Buffer.from('日本語')
  process.stdout.write(bytes.subarray(0, 1))
  process.stderr.write(bytes.subarray(0, 2))
  setTimeout(() => {
    process.stdout.write(bytes.subarray(1))
    process.stderr.write(bytes.subarray(2))
  }, 40)
}

export function utf8ChunkChildSource(): string {
  return `(${utf8ChunkChild.toString()})()`
}

async function audioLockChild(moduleUrl: string) {
  const { acquireAudioLock } = await import(moduleUrl) as typeof import('../../scripts/audio/lock.mjs')
  const reader = createInterface({ input: process.stdin }), commands: string[] = []
  let waiting: { resolve: (command: string) => void; reject: (error: Error) => void } | null | undefined, inputClosed = false
  reader.on('line', command => {
    if (waiting) { const next = waiting; waiting = null; next.resolve(command) }
    else commands.push(command)
  })
  reader.on('close', () => { inputClosed = true; if (waiting) waiting.reject(Error('Command input closed')) })
  const nextCommand = () => commands.length ? Promise.resolve(commands.shift()) : inputClosed ? Promise.reject(Error('Command input closed')) : new Promise<string>((resolve, reject) => { waiting = { resolve, reject } })
  process.stdout.write('READY\n')
  if (await nextCommand() !== 'GO') throw Error('Expected GO')
  let lock
  try { lock = acquireAudioLock(process.argv[1], process.argv[2]) }
  catch (error) {
    if (!(error instanceof Error) || !/already running|Lock recovery/.test(error.message)) throw error
    process.stdout.write('BLOCKED\n'); reader.close(); process.exit(0)
  }
  const active = path.join(process.argv[1], 'active')
  const handle = openSync(active, 'wx'); closeSync(handle)
  const release = nextCommand()
  process.stdout.write('OWNER\n')
  if (await release !== 'RELEASE') throw Error('Expected RELEASE')
  unlinkSync(active)
  if (!lock.release()) throw Error('Lost ownership')
  process.stdout.write('RELEASED\n'); reader.close(); process.exit(0)
}

export function audioLockChildSource(moduleUrl: string): string {
  // The child keeps its ESM imports and argv layout; its protocol body is checked above.
  return `import { openSync, closeSync, unlinkSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
await (${audioLockChild.toString()})(${JSON.stringify(moduleUrl)});`
}
