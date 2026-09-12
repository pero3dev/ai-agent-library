[CmdletBinding()]
param([string]$Repository = (Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference = 'Stop'

# Portable, pinned tools only. No PATH, registry, global Python or system service changes.
$repoPath = (Resolve-Path -LiteralPath $Repository).Path
$commonGit = (& git -C $repoPath rev-parse --path-format=absolute --git-common-dir).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Git common directory could not be resolved.' }
$toolRoot = Join-Path $commonGit 'harness-tools/audio-learning'
$null = New-Item -ItemType Directory -Force -Path $toolRoot
$downloads = @(
  @{
    Name = 'voicevox-nemo-0.24.0'; Archive = 'voicevox-nemo-0.24.0.zip'
    Url = 'https://github.com/VOICEVOX/voicevox_nemo_engine/releases/download/0.24.0/voicevox_engine-windows-cpu-0.24.0.vvpp'
    Sha256 = '418c515ce567c1426b425bd2fe05eb0a62196bcec223829725e9ed4ff345b437'
  },
  @{
    Name = 'ffmpeg-9.0.1'; Archive = 'ffmpeg-9.0.1.zip'
    Url = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
    Sha256 = 'fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9'
  }
)
foreach ($item in $downloads) {
  $archive = Join-Path $toolRoot $item.Archive
  $destination = Join-Path $toolRoot $item.Name
  if (-not (Test-Path -LiteralPath $archive)) {
    Write-Output "Downloading $($item.Name)"
    Invoke-WebRequest -Uri $item.Url -OutFile $archive
  }
  if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Sha256) {
    throw "Checksum mismatch: $archive. Do not execute this archive; inspect the pinned upstream release."
  }
  $marker = Join-Path $destination '.audio-install-complete'
  if (-not (Test-Path -LiteralPath $marker)) {
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
    Set-Content -LiteralPath $marker -Value $item.Sha256 -Encoding utf8
  }
  Write-Output "Verified $($item.Name): $destination"
}
$engine = Get-ChildItem -LiteralPath (Join-Path $toolRoot 'voicevox-nemo-0.24.0') -Filter run.exe -Recurse | Select-Object -First 1
$ffmpeg = Get-ChildItem -LiteralPath (Join-Path $toolRoot 'ffmpeg-9.0.1') -Filter ffmpeg.exe -Recurse | Select-Object -First 1
$ffprobe = Get-ChildItem -LiteralPath (Join-Path $toolRoot 'ffmpeg-9.0.1') -Filter ffprobe.exe -Recurse | Select-Object -First 1
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
