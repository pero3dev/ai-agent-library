[CmdletBinding()]
param(
    [string]$ProjectRoot,
    [string]$StateDir,
    [string]$Config,
    [ValidatePattern('^\d{2}-[a-z0-9-]+$')][string]$Section,
    [ValidateRange(1, 20)][int]$Limit = 1,
    [switch]$Publish,
    [switch]$AutoMerge,
    [switch]$SyncMain,
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
if (-not $ProjectRoot) { $ProjectRoot = Split-Path -Parent $PSScriptRoot }
if ($AutoMerge -and -not $Publish) { throw '-AutoMerge requires -Publish.' }
$projectPath = (Resolve-Path -LiteralPath $ProjectRoot).Path
$nodePath = (Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
if (-not $StateDir) {
    $gitDirectory = & git -C $projectPath rev-parse --path-format=absolute --git-common-dir
    if ($LASTEXITCODE -ne 0) { throw 'Cannot locate the common Git directory.' }
    $StateDir = Join-Path $gitDirectory.Trim() 'audio-learning'
}
$statePath = [IO.Path]::GetFullPath($StateDir)
$productionArgs = @((Join-Path $projectPath 'scripts\audio-run.mjs'), $(if ($DryRun) { '--plan' } else { '--run' }), '--state-dir', $statePath, '--limit', [string]$Limit)
if ($Config) { $productionArgs += @('--config', [IO.Path]::GetFullPath($Config)) }
if ($Section) { $productionArgs += @('--section', $Section) }
$publicationArgs = @((Join-Path $projectPath 'scripts\audio-publish.mjs'), '--state-dir', $statePath)
if ($Publish -and -not $DryRun) { $publicationArgs += '--apply' }
if ($AutoMerge -and -not $DryRun) { $publicationArgs += '--auto-merge' }
if ($DryRun) {
    [ordered]@{ mode = 'dry-run'; node = $nodePath; production = $productionArgs; publication = $publicationArgs; starts_engine = $false; sync_main = [bool]$SyncMain } | ConvertTo-Json -Depth 5
    exit 0
}
New-Item -ItemType Directory -Path $statePath -Force | Out-Null
$mutexSuffix = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($statePath)).Replace('/', '_').Replace('+', '-').TrimEnd('=')
$mutex = New-Object Threading.Mutex($false, ('Local\AI-Agent-Library-Audio-' + $mutexSuffix))
$ownedMutex = $false
$engineProcess = $null
$savedEnvironment = @{}
$exitStatus = 0
try {
    try { $ownedMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownedMutex = $true }
    if (-not $ownedMutex) { Write-Output '{"status":"already-running"}'; exit 0 }
    [Diagnostics.Process]::GetCurrentProcess().PriorityClass = 'BelowNormal'
    if ($SyncMain) {
        $remote = & git -C $projectPath remote get-url origin
        if ($LASTEXITCODE -ne 0 -or $remote -notin @('https://github.com/pero3dev/ai-agent-library.git', 'https://github.com/pero3dev/ai-agent-library', 'git@github.com:pero3dev/ai-agent-library.git')) { throw 'Unexpected audio checkout origin.' }
        $branch = & git -C $projectPath branch --show-current
        if ($LASTEXITCODE -ne 0 -or $branch -notin @('main', 'chore/audio-production-main')) { throw '-SyncMain requires main or the dedicated chore/audio-production-main branch.' }
        $dirty = & git -C $projectPath status --porcelain --untracked-files=all
        if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'The dedicated audio checkout has unsaved changes. Synchronization stopped.' }
        & git -C $projectPath fetch origin main
        if ($LASTEXITCODE -ne 0) { throw 'Cannot fetch main for audio production.' }
        & git -C $projectPath merge --ff-only origin/main
        if ($LASTEXITCODE -ne 0) { throw 'The audio checkout diverged; inspect it without resetting.' }
        $lockPath = Join-Path $projectPath 'package-lock.json'
        $packagePath = Join-Path $projectPath 'package.json'
        $dependencyStamp = ((Get-FileHash -LiteralPath $lockPath -Algorithm SHA256).Hash + (Get-FileHash -LiteralPath $packagePath -Algorithm SHA256).Hash)
        $dependencyMarker = Join-Path $projectPath 'node_modules\.audio-learning-dependencies'
        $installedStamp = if (Test-Path -LiteralPath $dependencyMarker) { (Get-Content -LiteralPath $dependencyMarker -Raw).Trim() } else { '' }
        if ($installedStamp -ne $dependencyStamp) {
            $npmPath = (Get-Command npm.cmd -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
            & $npmPath --prefix $projectPath ci
            if ($LASTEXITCODE -ne 0) { throw 'Cannot prepare updated audio production dependencies.' }
            [IO.File]::WriteAllText($dependencyMarker, $dependencyStamp, [Text.UTF8Encoding]::new($false))
        }
    }
    $toolsFile = Join-Path $statePath 'tools.json'
    if (-not (Test-Path -LiteralPath $toolsFile)) { throw 'Local audio tools are not prepared. Run scripts/Install-AudioLearningTools.ps1 first.' }
    $tools = Get-Content -LiteralPath $toolsFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $engineUri = [Uri]$tools.engine_url
    if ($engineUri.Scheme -ne 'http' -or $engineUri.Host -ne '127.0.0.1' -or $engineUri.UserInfo -or $engineUri.AbsolutePath -ne '/') { throw 'Audio engine must use an HTTP loopback URL.' }
    foreach ($entry in @(@('AUDIO_FFMPEG', $tools.ffmpeg_path), @('AUDIO_FFPROBE', $tools.ffprobe_path), @('AUDIO_ENGINE_URL', $tools.engine_url))) {
        $savedEnvironment[$entry[0]] = [Environment]::GetEnvironmentVariable($entry[0], 'Process')
        [Environment]::SetEnvironmentVariable($entry[0], $entry[1], 'Process')
    }
    foreach ($binary in @($tools.ffmpeg_path, $tools.ffprobe_path, $tools.engine_path)) {
        if (-not [IO.Path]::IsPathRooted($binary) -or -not (Test-Path -LiteralPath $binary -PathType Leaf)) { throw 'A configured local audio binary is missing.' }
    }
    $logDirectory = Join-Path $statePath 'logs'
    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
    $engineReady = $false
    try { $null = Invoke-RestMethod -Uri ($tools.engine_url.TrimEnd('/') + '/version') -TimeoutSec 3; $engineReady = $true } catch { $engineReady = $false }
    if (-not $engineReady) {
        $engineProcess = Start-Process -FilePath $tools.engine_path -ArgumentList @('--host', '127.0.0.1', '--port', [string]$engineUri.Port, '--cpu_num_threads', '2', '--output_log_utf8', '--disable_mutable_api') -WorkingDirectory (Split-Path -Parent $tools.engine_path) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory ($stamp + '-engine.stdout.log')) -RedirectStandardError (Join-Path $logDirectory ($stamp + '-engine.stderr.log'))
        for ($attempt = 0; $attempt -lt 60; $attempt++) {
            if ($engineProcess.HasExited) { throw 'Audio engine exited during startup.' }
            try { $null = Invoke-RestMethod -Uri ($tools.engine_url.TrimEnd('/') + '/version') -TimeoutSec 1; $engineReady = $true; break } catch { Start-Sleep -Seconds 1 }
        }
        if (-not $engineReady) { throw 'Audio engine did not become ready.' }
    }
    $productionOutput = & $nodePath @productionArgs
    $productionExit = $LASTEXITCODE
    $productionOutput | Set-Content -LiteralPath (Join-Path $logDirectory ($stamp + '-production.json')) -Encoding UTF8
    $productionOutput | Write-Output
    if ($productionExit -notin @(0, 2)) { throw 'Audio production failed; inspect its local log.' }
    # A quota pause must not prevent already validated episodes from progressing.
    $publicationOutput = & $nodePath @publicationArgs
    $publicationExit = $LASTEXITCODE
    $publicationOutput | Set-Content -LiteralPath (Join-Path $logDirectory ($stamp + '-publication.json')) -Encoding UTF8
    $publicationOutput | Write-Output
    if ($publicationExit -notin @(0, 2)) { throw 'Audio publication failed; inspect its local log.' }
    if ($productionExit -eq 2 -or $publicationExit -eq 2) { $exitStatus = 2 }
} finally {
    if ($engineProcess -and -not $engineProcess.HasExited) { Stop-Process -Id $engineProcess.Id -ErrorAction SilentlyContinue }
    foreach ($name in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process') }
    if ($ownedMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
exit $exitStatus
