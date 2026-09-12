import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const executeFile = promisify(execFile)
const psLiteral = value => `'${value.replaceAll("'", "''")}'`

test('Windows audio wrapper shares state across a real linked worktree with spaces', { skip: process.platform !== 'win32' }, t => {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'audio runtime '))
  t.after(() => {
    assert.ok(realpathSync(temporary).startsWith(realpathSync(os.tmpdir()) + path.sep))
    rmSync(temporary, { recursive: true, force: true })
  })
  const source = path.join(temporary, 'source')
  const linked = path.join(temporary, 'linked checkout')
  const git = args => execFileSync('git', args, { encoding: 'utf8', windowsHide: true })
  git(['init', source])
  git(['-C', source, '-c', 'user.name=Audio runtime test', '-c', 'user.email=audio-test@example.invalid', 'commit', '--allow-empty', '-m', 'fixture'])
  git(['-C', source, 'worktree', 'add', '--detach', linked])
  const plans = [source, linked].map(project => JSON.parse(execFileSync('powershell.exe', [
    '-NoProfile', '-File', path.join(root, 'scripts/Invoke-AudioLearning.ps1'),
    '-ProjectRoot', project, '-DryRun', '-SyncMain', '-Publish', '-AutoMerge'
  ], { encoding: 'utf8', windowsHide: true })))
  // Windows 8.3 aliases can survive realpath(). Compare the actual directory identity too.
  const expectedGit = statSync(path.join(source, '.git'), { bigint: true })
  const sharedState = plans[0].production[plans[0].production.indexOf('--state-dir') + 1]
  for (const plan of plans) {
    const statePath = plan.production[plan.production.indexOf('--state-dir') + 1]
    assert.equal(statePath, sharedState)
    assert.equal(plan.publication[plan.publication.indexOf('--state-dir') + 1], sharedState)
    assert.equal(path.basename(statePath), 'audio-learning')
    const actualGit = statSync(path.dirname(statePath), { bigint: true })
    assert.equal(actualGit.dev, expectedGit.dev)
    assert.equal(actualGit.ino, expectedGit.ino)
    assert.equal(plan.starts_engine, false)
    assert.equal(plan.sync_main, true)
    assert.ok(!plan.publication.includes('--apply'))
  }
})

async function captureNativeJson(t, productionExit) {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'audio native encoding '))
  t.after(() => {
    assert.ok(realpathSync(temporary).startsWith(realpathSync(os.tmpdir()) + path.sep))
    rmSync(temporary, { recursive: true, force: true })
  })
  // Only /version is needed: the real wrapper must reuse this fixture endpoint,
  // while both native commands are real Node processes emitting known JSON.
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end('"encoding-fixture"')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  const state = path.join(temporary, 'state'), scripts = path.join(temporary, 'scripts')
  mkdirSync(state); mkdirSync(scripts)
  const message = '台本の自動修正上限です。正常終了→完了。🎧 引用「二人の対話」\n改行と\tタブも保持します。'
  const production = { status: 'completed', held: [{ article_path: 'docs/01-concepts/agent-loop.md', error: message }] }
  const publication = { mode: 'apply', title: message, publications: [] }
  for (const [name, data, exit] of [['audio-run.mjs', production, productionExit], ['audio-publish.mjs', publication, 0]]) {
    writeFileSync(path.join(scripts, name), `process.stdout.write(JSON.stringify(${JSON.stringify(data)}, null, 2) + '\\n'); process.exitCode = ${exit};\n`, 'utf8')
  }
  writeFileSync(path.join(state, 'tools.json'), JSON.stringify({
    engine_url: `http://127.0.0.1:${server.address().port}`,
    engine_path: process.execPath, ffmpeg_path: process.execPath, ffprobe_path: process.execPath
  }), 'utf8')
  const restoration = path.join(temporary, 'restoration.json'), probe = path.join(temporary, 'probe.ps1')
  writeFileSync(probe, '\uFEFF' + `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::GetEncoding(932)
$OutputEncoding = [Text.Encoding]::ASCII
$wrapperExit = $null
$wrapperError = $null
try {
    & ${psLiteral(path.join(root, 'scripts/Invoke-AudioLearning.ps1'))} -ProjectRoot ${psLiteral(temporary)} -StateDir ${psLiteral(state)}
    $wrapperExit = $LASTEXITCODE
} catch { $wrapperError = $_.Exception.Message }
$result = [ordered]@{ version = $PSVersionTable.PSVersion.Major; edition = $PSVersionTable.PSEdition; console_code_page = [Console]::OutputEncoding.CodePage; output_code_page = $OutputEncoding.CodePage; wrapper_exit = $wrapperExit; wrapper_error = $wrapperError }
[IO.File]::WriteAllText(${psLiteral(restoration)}, ($result | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
`, 'utf8')
  await executeFile('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', probe], { windowsHide: true, timeout: 30_000 })
  const restored = JSON.parse(readFileSync(restoration, 'utf8'))
  assert.equal(restored.version, 5)
  assert.equal(restored.edition, 'Desktop')
  assert.equal(restored.console_code_page, 932)
  assert.equal(restored.output_code_page, 20127)
  const logs = readdirSync(path.join(state, 'logs'))
  assert.equal(logs.some(name => name.includes('-engine.')), false)
  const log = suffix => JSON.parse(readFileSync(path.join(state, 'logs', logs.find(name => name.endsWith(suffix))), 'utf8'))
  assert.deepEqual(log('-production.json'), production)
  return { restored, publication, logs, log }
}

test('Windows PowerShell 5 captures Japanese Node JSON as BOM-free UTF-8 and restores caller encodings', { skip: process.platform !== 'win32' }, async t => {
  for (const exitCode of [0, 2]) {
    const result = await captureNativeJson(t, exitCode)
    assert.deepEqual(result.log('-publication.json'), result.publication)
    assert.equal(result.restored.wrapper_exit, exitCode)
    assert.equal(result.restored.wrapper_error, null)
  }
})

test('Windows PowerShell 5 restores caller encodings when native production fails', { skip: process.platform !== 'win32' }, async t => {
  const result = await captureNativeJson(t, 1)
  assert.match(result.restored.wrapper_error, /Audio production failed/)
  assert.equal(result.logs.some(name => name.endsWith('-publication.json')), false)
})
