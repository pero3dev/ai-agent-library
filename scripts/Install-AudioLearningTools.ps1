[CmdletBinding()]
param(
  [string]$Repository,
  [string]$ToolRoot,
  [switch]$FFmpegOnly,
  [switch]$DefinitionsOnly
)
$ErrorActionPreference = 'Stop'

# Portable, pinned tools only. No PATH, registry, global Python or system service changes.
$downloads = @(
  @{
    Name = 'voicevox-nemo-0.24.0'; Version = '0.24.0'; Archive = 'voicevox-nemo-0.24.0.zip'
    Url = 'https://github.com/VOICEVOX/voicevox_nemo_engine/releases/download/0.24.0/voicevox_engine-windows-cpu-0.24.0.vvpp'
    Sha256 = '418c515ce567c1426b425bd2fe05eb0a62196bcec223829725e9ed4ff345b437'
  },
  @{
    Name = 'ffmpeg-9.0.1'; Version = '9.0.1'; Archive = 'ffmpeg-9.0.1.zip'
    Url = 'https://github.com/GyanD/codexffmpeg/releases/download/9.0.1/ffmpeg-9.0.1-essentials_build.zip'
    Sha256 = 'fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9'
  }
)
function Move-AudioInstallEvidence {
  param([string]$Path, [string]$Root, [hashtable]$Item, [string]$Reason, [string]$ActualSha256)
  $rootPath = [IO.Path]::GetFullPath($Root) + [IO.Path]::DirectorySeparatorChar
  $sourcePath = [IO.Path]::GetFullPath($Path)
  if (-not $sourcePath.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) { throw 'Quarantine path escapes tool root.' }
  $target = "$sourcePath.quarantine-$([Guid]::NewGuid().ToString('N'))"
  Move-Item -LiteralPath $sourcePath -Destination $target
  $evidence = @{
    original_path = $sourcePath; quarantined_path = $target; reason = $Reason
    version = $Item.Version; url = $Item.Url; expected_sha256 = $Item.Sha256
    actual_sha256 = $ActualSha256; quarantined_at = [DateTime]::UtcNow.ToString('o')
  } | ConvertTo-Json
  [IO.File]::WriteAllText("$target.json", $evidence, [Text.UTF8Encoding]::new($false))
  Write-Output "Quarantined $Reason`: $target"
}

function Install-VerifiedAudioTool {
  param([hashtable]$Item, [string]$Root, [scriptblock]$Download = { param($Url, $Output) Invoke-WebRequest -Uri $Url -OutFile $Output })
  $null = New-Item -ItemType Directory -Force -Path $Root
  $archive = Join-Path $Root $Item.Archive
  $destination = Join-Path $Root $Item.Name
  if (Test-Path -LiteralPath $archive) {
    $cachedHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($cachedHash -ne $Item.Sha256) { Move-AudioInstallEvidence $archive $Root $Item 'cached-checksum-mismatch' $cachedHash }
  }
  if (-not (Test-Path -LiteralPath $archive)) {
    $temporary = "$archive.download-$([Guid]::NewGuid().ToString('N')).partial"
    try { $null = & $Download $Item.Url $temporary } catch {
      if (Test-Path -LiteralPath $temporary) { Move-AudioInstallEvidence $temporary $Root $Item 'interrupted-download' ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash.ToLowerInvariant()) }
      throw
    }
    $actualHash = (Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $Item.Sha256) {
      Move-AudioInstallEvidence $temporary $Root $Item 'download-checksum-mismatch' $actualHash
      throw "Checksum mismatch: $archive. Do not execute this archive; inspect the pinned upstream release."
    }
    Move-Item -LiteralPath $temporary -Destination $archive
  }
  $marker = Join-Path $destination '.audio-install-complete'
  $complete = (Test-Path -LiteralPath $marker) -and ((Get-Content -LiteralPath $marker -Raw).Trim() -eq $Item.Sha256)
  if (-not $complete) {
    if (Test-Path -LiteralPath $destination) { Move-AudioInstallEvidence $destination $Root $Item 'incomplete-installation' '' }
    # Archives from verified upstream downloads; check all entry paths before extracting.
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($archive)
    try {
      $prefix = [System.IO.Path]::GetFullPath($destination) + [System.IO.Path]::DirectorySeparatorChar
      foreach ($entry in $zip.Entries) {
        $entryPath = [System.IO.Path]::GetFullPath((Join-Path $destination $entry.FullName))
        if (-not $entryPath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe archive entry.' }
      }
    } finally { $zip.Dispose() }
    Expand-Archive -LiteralPath $archive -DestinationPath $destination -Force
    Set-Content -LiteralPath $marker -Value $Item.Sha256 -Encoding utf8
  }
  Write-Output "Verified $($Item.Name): $destination"
}
if ($DefinitionsOnly) { return }
if (-not $Repository) { $Repository = Split-Path $PSScriptRoot -Parent }
if (-not $ToolRoot) {
  $repoPath = (Resolve-Path -LiteralPath $Repository).Path
  $commonGit = (& git -C $repoPath rev-parse --path-format=absolute --git-common-dir).Trim()
  if ($LASTEXITCODE -ne 0) { throw 'Git common directory could not be resolved.' }
  $ToolRoot = Join-Path $commonGit 'harness-tools/audio-learning'
} elseif (-not $FFmpegOnly) { throw '-ToolRoot is reserved for isolated -FFmpegOnly verification.' }
$selected = if ($FFmpegOnly) { @($downloads | Where-Object Name -eq 'ffmpeg-9.0.1') } else { $downloads }
foreach ($item in $selected) { Install-VerifiedAudioTool $item $ToolRoot }
$toolRoot = [IO.Path]::GetFullPath($ToolRoot)
$ffmpeg = Get-ChildItem -LiteralPath (Join-Path $toolRoot 'ffmpeg-9.0.1') -Filter ffmpeg.exe -Recurse | Select-Object -First 1
$ffprobe = Get-ChildItem -LiteralPath (Join-Path $toolRoot 'ffmpeg-9.0.1') -Filter ffprobe.exe -Recurse | Select-Object -First 1
if (-not $ffmpeg -or -not $ffprobe) { throw 'Expected FFmpeg executables were not found.' }
foreach ($executable in @($ffmpeg, $ffprobe)) {
  $versionOutput = @(& $executable.FullName -version)
  $version = $versionOutput[0]
  if ($LASTEXITCODE -ne 0 -or $version -notmatch '^ff(?:mpeg|probe) version 9\.0\.1(?:-|\s)') { throw "Unexpected FFmpeg version: $version" }
  Write-Output $version
}
if ($FFmpegOnly) { return }
$engine = Get-ChildItem -LiteralPath (Join-Path $toolRoot 'voicevox-nemo-0.24.0') -Filter run.exe -Recurse | Select-Object -First 1
if (-not $engine -or -not $ffmpeg -or -not $ffprobe) { throw 'Expected executables were not found.' }
$statePath = Join-Path $commonGit 'audio-learning'
$null = New-Item -ItemType Directory -Force -Path $statePath
$toolsFile = Join-Path $statePath 'tools.json'
$toolConfiguration = @{
  engine_path = $engine.FullName; engine_url = 'http://127.0.0.1:50121'
  ffmpeg_path = $ffmpeg.FullName; ffprobe_path = $ffprobe.FullName
  voicevox_version = '0.24.0'; ffmpeg_version = '9.0.1'
} | ConvertTo-Json
[IO.File]::WriteAllText($toolsFile, $toolConfiguration, [Text.UTF8Encoding]::new($false))
Write-Output "Local tool paths: $toolsFile"
