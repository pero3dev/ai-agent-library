import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const installer = fileURLToPath(new URL('../../scripts/Install-AudioLearningTools.ps1', import.meta.url))
test('FFmpeg versioned upstream asset and checksum remain one pinned definition', () => {
  const script = readFileSync(installer, 'utf8')
  assert.match(script, /Version = '9\.0\.1'; Archive = 'ffmpeg-9\.0\.1\.zip'/)
  assert.match(script, /https:\/\/github\.com\/GyanD\/codexffmpeg\/releases\/download\/9\.0\.1\/ffmpeg-9\.0\.1-essentials_build\.zip/)
  assert.match(script, /fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9/)
  assert.doesNotMatch(script, /ffmpeg-release-essentials\.zip/)
})

for (const scenario of ['normal-reuse', 'cached-mismatch', 'download-mismatch', 'interrupted-download', 'incomplete-installation', 'unsafe-entry']) {
  test(`portable audio installer ${scenario} preserves evidence and recovers safely`, { skip: process.platform !== 'win32' }, t => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'audio-installer-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const script = path.join(root, 'fixture.ps1')
    writeFileSync(script, `
      $ErrorActionPreference = 'Stop'
      $fixtureRoot = $args[0]; $installer = $args[1]; $scenario = $args[2]
      . $installer -DefinitionsOnly
      Add-Type -AssemblyName System.IO.Compression.FileSystem
      $source = Join-Path $fixtureRoot 'source'; $null = New-Item -ItemType Directory $source
      [IO.File]::WriteAllText((Join-Path $source 'payload.txt'), 'verified inert fixture; never executable')
      $good = Join-Path $fixtureRoot 'good.zip'
      [IO.Compression.ZipFile]::CreateFromDirectory($source, $good)
      if ($scenario -eq 'unsafe-entry') {
        $zip = [IO.Compression.ZipFile]::Open($good, [IO.Compression.ZipArchiveMode]::Update)
        $null = $zip.CreateEntry('../escape.txt'); $zip.Dispose()
      }
      $owned = Join-Path $fixtureRoot 'tools'; $null = New-Item -ItemType Directory $owned
      $item = @{ Name='fixture-1'; Version='1'; Archive='fixture.zip'; Url='https://example.invalid/pinned/fixture-1.zip'; Sha256=(Get-FileHash $good -Algorithm SHA256).Hash.ToLowerInvariant() }
      $archive = Join-Path $owned $item.Archive; $destination = Join-Path $owned $item.Name
      $script:downloads = 0
      $fetchGood = { param($Url, $Output) $script:downloads++; Copy-Item -LiteralPath $good -Destination $Output }
      if ($scenario -eq 'cached-mismatch') { [IO.File]::WriteAllText($archive, 'bad cache') }
      if ($scenario -eq 'incomplete-installation') {
        $null = New-Item -ItemType Directory $destination
        [IO.File]::WriteAllText((Join-Path $destination 'partial.txt'), 'incomplete extracted bytes')
      }
      if ($scenario -in 'download-mismatch', 'interrupted-download') {
        $fetchBad = { param($Url, $Output) [IO.File]::WriteAllText($Output, 'incomplete bad archive'); if ($scenario -eq 'interrupted-download') { throw 'fixture interruption' } }
        $rejected = $false
        try { Install-VerifiedAudioTool $item $owned $fetchBad } catch { $rejected = $true }
        if (-not $rejected -or (Test-Path -LiteralPath $destination) -or (Test-Path -LiteralPath $archive)) { throw 'Unverified download was accepted or extracted.' }
      }
      if ($scenario -eq 'unsafe-entry') {
        $rejected = $false
        try { Install-VerifiedAudioTool $item $owned $fetchGood } catch { $rejected = $_.Exception.Message -eq 'Unsafe archive entry.' }
        if (-not $rejected -or (Test-Path (Join-Path $owned 'escape.txt')) -or (Test-Path (Join-Path $destination '.audio-install-complete'))) { throw 'Unsafe archive accepted.' }
      } else {
        Install-VerifiedAudioTool $item $owned $fetchGood
        Install-VerifiedAudioTool $item $owned { throw 'Verified rerun must not download again.' }
        if ($script:downloads -ne 1 -or (Get-Content (Join-Path $destination 'payload.txt')) -ne 'verified inert fixture; never executable') { throw 'Verified cache or extraction failed.' }
        if ($scenario -ne 'normal-reuse') {
          $evidence = @(Get-ChildItem -LiteralPath $owned -Filter '*.quarantine-*.json')
          if ($evidence.Count -ne 1) { throw 'Expected one quarantine evidence record.' }
          $record = Get-Content -LiteralPath $evidence[0].FullName -Raw | ConvertFrom-Json
          if (-not (Test-Path -LiteralPath $record.quarantined_path) -or $record.expected_sha256 -ne $item.Sha256 -or $record.url -ne $item.Url) { throw 'Missing quarantine evidence.' }
        }
      }
      Write-Output "FIXTURE_OK $scenario"
    `, 'utf8')
    const output = execFileSync('powershell.exe', ['-NoProfile', '-File', script, root, installer, scenario], {
      encoding: 'utf8', windowsHide: true, timeout: 30000,
      env: { ...process.env, PSModulePath: path.join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/Modules') }
    })
    assert.ok(output.includes(`FIXTURE_OK ${scenario}`))
  })
}
