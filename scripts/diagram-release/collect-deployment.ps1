#requires -Version 7.0
[CmdletBinding()]
param(
  [string]$MergeSha,
  [long]$RunId,
  [string]$OutputDirectory,
  [string]$Repo = (Get-Location).Path,
  [string]$ResumeEvidenceDirectory,
  [switch]$ReleaseConfirmed,
  [switch]$Help
)
if ($Help) {
  Write-Output 'After confirmed Pages success: ./collect-deployment.ps1 -ReleaseConfirmed -MergeSha <40hex> -RunId <positive integer> -OutputDirectory <evidence-directory> [-Repo <repository-root; default cwd>] [-ResumeEvidenceDirectory <existing child of output>]'
  exit 0
}
if (-not $ReleaseConfirmed -or $MergeSha -notmatch '^[a-f0-9]{40}$' -or $MergeSha -match '^0{40}$' -or $RunId -lt 1 -or -not $OutputDirectory) { throw 'Explicit release confirmation, nonzero 40-character merge SHA, positive RunId and OutputDirectory are required. Use -Help.' }

# Execute only after the release owner confirms the main CI/Pages deployment.
# Read-only GitHub API/download operations; no Git, deployment or public HTTP.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$repository = 'pero3dev/ai-agent-library'
$siteUrl = 'https://pero3dev.github.io/ai-agent-library'
$runPrefix = "https://github.com/$repository/actions/runs/$RunId"
$utf8 = [Text.UTF8Encoding]::new($false)
foreach ($command in @('node', 'gh', 'tar')) { [void](Get-Command $command -ErrorAction Stop) }
function Get-PathContext([string[]]$ExtraArguments = @()) {
  $lines = & node (Join-Path $PSScriptRoot 'portable-paths.mjs') "--repo=$Repo" "--output=$OutputDirectory" @ExtraArguments
  if ($LASTEXITCODE -ne 0) { throw 'Portable path validation failed before GitHub access' }
  return (($lines -join "`n") | ConvertFrom-Json)
}
$pathContext = Get-PathContext
$Repo = $pathContext.repo
$OutputDirectory = $pathContext.output
if ($ResumeEvidenceDirectory) {
  $ResumeEvidenceDirectory = (Get-PathContext @("--directory=$ResumeEvidenceDirectory")).directory
  foreach ($entry in @(Get-ChildItem -LiteralPath $ResumeEvidenceDirectory -Force -Recurse)) {
    if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Resume evidence contains a symlink/junction' }
  }
}
$latestFile = Join-Path $OutputDirectory 'artifact-evidence.latest.json'
if (Test-Path -LiteralPath $latestFile) { [void](Get-PathContext @("--existing=$latestFile")) }

function Read-GitHubJson([string]$Endpoint) {
  $lines = & gh api --method GET -H 'Accept: application/vnd.github+json' $Endpoint
  if ($LASTEXITCODE -ne 0) { throw "GitHub request failed: $Endpoint" }
  return (($lines -join "`n") | ConvertFrom-Json)
}
function Write-Json([string]$Path, $Value) {
  [IO.File]::WriteAllText($Path, (($Value | ConvertTo-Json -Depth 50) + "`n"), $utf8)
}
function Assert-Run($Run) {
  if ($Run.id -ne $RunId -or $Run.repository.full_name -ne $repository -or
      $Run.head_sha -ne $MergeSha -or $Run.head_branch -ne 'main' -or
      $Run.path -ne '.github/workflows/ci.yml' -or $Run.event -ne 'push' -or
      $Run.status -ne 'completed' -or $Run.conclusion -ne 'success') {
    throw 'Main CI repository, workflow, SHA, event or success state mismatch'
  }
}
function Assert-Status($Status, $Job) {
  if ($Status.state -ne 'success' -or $Status.environment -ne 'github-pages' -or
      $Status.environment_url.TrimEnd('/') -ne $siteUrl -or
      ($Status.log_url -ne $Job.html_url -and $Status.target_url -ne $Job.html_url)) {
    throw 'Pages status is not a success bound to this exact deploy job and public URL'
  }
}

$run = Read-GitHubJson "repos/$repository/actions/runs/$RunId"
Assert-Run $run
$attempt = [int]$run.run_attempt
$jobResponse = Read-GitHubJson "repos/$repository/actions/runs/$RunId/attempts/$attempt/jobs?per_page=100"
if ($jobResponse.total_count -gt 100) { throw 'More than 100 jobs; explicit pagination review is required' }
$buildJobs = @($jobResponse.jobs | Where-Object { $_.name -eq 'build' -and $_.status -eq 'completed' -and $_.conclusion -eq 'success' })
$deployJobs = @($jobResponse.jobs | Where-Object { $_.name -eq 'deploy' -and $_.status -eq 'completed' -and $_.conclusion -eq 'success' })
if ($buildJobs.Count -ne 1 -or $deployJobs.Count -ne 1) { throw 'Exactly one successful build and deploy job are required' }
$buildJob = $buildJobs[0]; $deployJob = $deployJobs[0]
foreach ($job in @($buildJob, $deployJob)) {
  if ($job.run_id -ne $RunId -or $job.run_attempt -ne $attempt -or $job.head_sha -ne $MergeSha -or
      -not $job.html_url.StartsWith("$runPrefix/job/")) { throw 'Job identity or run-attempt mismatch' }
}

$deployments = @(Read-GitHubJson "repos/$repository/deployments?sha=$MergeSha&environment=github-pages&per_page=100")
$deploymentMatches = @()
foreach ($candidate in $deployments) {
  if ($candidate.sha -ne $MergeSha -or $candidate.environment -ne 'github-pages') { continue }
  $candidateStatuses = @(Read-GitHubJson "repos/$repository/deployments/$($candidate.id)/statuses?per_page=100")
  if ($candidateStatuses.Count -eq 0) { continue }
  $latest = @($candidateStatuses | Sort-Object id -Descending)[0]
  if ($latest -and ($latest.log_url -eq $deployJob.html_url -or $latest.target_url -eq $deployJob.html_url)) {
    Assert-Status $latest $deployJob
    $deploymentMatches += [pscustomobject]@{ deployment = $candidate; status = $latest }
  }
}
if ($deploymentMatches.Count -ne 1) { throw 'Exactly one successful Pages deployment linked to the exact run-attempt deploy job is required' }
$deployment = $deploymentMatches[0].deployment; $latestStatus = $deploymentMatches[0].status

$artifactResponse = Read-GitHubJson "repos/$repository/actions/runs/$RunId/artifacts?per_page=100"
if ($artifactResponse.total_count -gt 100) { throw 'More than 100 artifacts; explicit pagination review is required' }
$artifacts = @($artifactResponse.artifacts | Where-Object { $_.name -eq 'github-pages' -and -not $_.expired })
if ($artifacts.Count -ne 1) { throw 'Exactly one unexpired github-pages artifact is required; name-based download would otherwise be ambiguous' }
$artifact = $artifacts[0]
if ($artifact.workflow_run.id -ne $RunId -or $artifact.workflow_run.head_sha -ne $MergeSha -or $artifact.workflow_run.head_branch -ne 'main') { throw 'Artifact run/SHA/main identity mismatch' }
$artifactTime = [DateTimeOffset]$artifact.created_at
if ($artifactTime -lt [DateTimeOffset]$buildJob.started_at -or $artifactTime -gt ([DateTimeOffset]$buildJob.completed_at).AddMinutes(2)) {
  throw 'Artifact creation time is outside this successful build attempt; do not substitute an earlier rerun artifact'
}

$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$evidenceRoot = $null
if (-not $ResumeEvidenceDirectory) { $evidenceRoot = (Get-PathContext @("--new-child=ci-$RunId-attempt-$attempt-$stamp")).child }
if ($ResumeEvidenceDirectory) {
  $evidenceRoot = $ResumeEvidenceDirectory
  $previous = Get-Content -Raw -LiteralPath (Join-Path $evidenceRoot 'deployment-before.json') | ConvertFrom-Json
  if ($previous.mergeSha -ne $MergeSha -or $previous.run.id -ne $RunId -or $previous.run.run_attempt -ne $attempt -or
      $previous.artifact.id -ne $artifact.id -or $previous.artifact.digest -ne $artifact.digest -or
      $previous.artifact.updated_at -ne $artifact.updated_at) { throw 'Downloaded artifact identity changed; cannot resume' }
}
$download = Join-Path $evidenceRoot 'download'
if (-not $ResumeEvidenceDirectory) { [void](New-Item -ItemType Directory -Path $download) }
$beforeName = if ($ResumeEvidenceDirectory) { 'deployment-resume-before.json' } else { 'deployment-before.json' }
Write-Json (Join-Path $evidenceRoot $beforeName) ([ordered]@{
  checkedAt = [DateTime]::UtcNow.ToString('o'); evidenceClass = 'live-github-api'; repository = $repository
  mergeSha = $MergeSha; run = $run; buildJob = $buildJob; deployJob = $deployJob
  deployment = $deployment; latestStatus = $latestStatus; artifact = $artifact
})

if (-not $ResumeEvidenceDirectory) {
  & gh run download $RunId --repo $repository --name github-pages --dir $download
  if ($LASTEXITCODE -ne 0) { throw 'github-pages artifact download failed' }
}
$tarFiles = @(Get-ChildItem -LiteralPath $download -File | Where-Object { $_.Name -in @('artifact.tar', 'archive.tar') })
if ($tarFiles.Count -ne 1) { throw 'Expected exactly one Pages tar at the downloaded artifact root' }
$tarFile = $tarFiles[0].FullName
$htmlLines = & node (Join-Path $PSScriptRoot 'extract-ci-html.mjs') "--repo=$Repo" "--archive=$tarFile" "--output=$evidenceRoot"
if ($LASTEXITCODE -ne 0) { throw 'Selected artifact HTML extraction or build identity checks failed' }
$htmlIdentity = ($htmlLines -join "`n") | ConvertFrom-Json
$expectedRoutes = @(
  '/docs/llm-internals/inference-internals',
  '/docs/llm-foundations/how-llms-generate-text',
  '/docs/llm-foundations/tokenization',
  '/docs/llm-internals/mixture-of-experts-internals',
  '/docs/llm-internals/attention-variants-and-long-context',
  '/docs/llm-internals/transformer-architecture',
  '/docs/llm-foundations/llm-training-pipeline'
)
$actualRoutes = @($htmlIdentity.documents | ForEach-Object { $_.route })
if ($actualRoutes.Count -ne 7 -or @(Compare-Object $expectedRoutes $actualRoutes).Count -ne 0) { throw 'Expected exactly seven fixed artifact HTML routes' }

# Re-read identities after download, so a rerun/replacement/status transition is
# not silently accepted under the earlier metadata.
$runAfter = Read-GitHubJson "repos/$repository/actions/runs/$RunId"
Assert-Run $runAfter
if ($runAfter.run_attempt -ne $attempt) { throw 'Run attempt changed during evidence collection' }
$artifactAfter = Read-GitHubJson "repos/$repository/actions/artifacts/$($artifact.id)"
if ($artifactAfter.id -ne $artifact.id -or $artifactAfter.name -ne 'github-pages' -or $artifactAfter.expired -or
    $artifactAfter.size_in_bytes -ne $artifact.size_in_bytes -or $artifactAfter.updated_at -ne $artifact.updated_at -or
    $artifactAfter.digest -ne $artifact.digest -or $artifactAfter.workflow_run.id -ne $RunId -or
    $artifactAfter.workflow_run.head_sha -ne $MergeSha) { throw 'Artifact identity changed during download' }
$statusesAfter = @(Read-GitHubJson "repos/$repository/deployments/$($deployment.id)/statuses?per_page=100")
if ($statusesAfter.Count -eq 0) { throw 'Deployment status disappeared after download' }
$statusAfter = @($statusesAfter | Sort-Object id -Descending)[0]
Assert-Status $statusAfter $deployJob

$evidence = [ordered]@{
  schemaVersion = 1; evidenceClass = 'github-actions-pages-artifact'; checkedAt = [DateTime]::UtcNow.ToString('o')
  repository = $repository; baseURL = $siteUrl; mergeSha = $MergeSha; runId = $RunId; runAttempt = $attempt
  workflowPath = $run.path; ciUrl = $run.html_url; buildJobUrl = $buildJob.html_url; deployJobUrl = $deployJob.html_url
  deploymentId = $deployment.id; deploymentStatusId = $statusAfter.id; deploymentState = $statusAfter.state
  artifactId = $artifact.id; artifactName = $artifact.name; artifactApiDigest = $artifact.digest
  archiveTarSHA256 = $htmlIdentity.archiveTarSHA256; expectedBuildId = $htmlIdentity.expectedBuildId
  documents = $htmlIdentity.documents
  digestNote = 'artifactApiDigest describes the GitHub artifact container. archiveTarSHA256 is independently computed for downloaded archive.tar; the two digests are not equated.'
  expectedValueSource = 'Seven selected HTML files (inference, generation, tokenization, MoE, attention variants, Transformer, training) from the successful exact-run github-pages artifact. No expected value is read from public HTTP or a local build.'
}
Write-Json (Join-Path $evidenceRoot 'deployment-after.json') ([ordered]@{ run = $runAfter; artifact = $artifactAfter; latestStatus = $statusAfter })
$expectedFile = Join-Path $evidenceRoot 'artifact-evidence.json'
Write-Json $expectedFile $evidence
$pathReferences = [ordered]@{
  relativeTo = 'explicit output directory'
  artifactEvidence = [IO.Path]::GetRelativePath($OutputDirectory, $expectedFile).Replace('\', '/')
  documents = @($htmlIdentity.documents | ForEach-Object { [ordered]@{ route = $_.route; file = [IO.Path]::GetRelativePath($OutputDirectory, $_.localFile).Replace('\', '/') } })
}
Write-Json (Join-Path $evidenceRoot 'portable-references.json') $pathReferences
Write-Json $latestFile $evidence
[ordered]@{ expectedBuildId = $htmlIdentity.expectedBuildId; mergeSha = $MergeSha; runId = $RunId; runAttempt = $attempt; artifactEvidence = $expectedFile; latestArtifactEvidence = $latestFile; documents = $htmlIdentity.documents } | ConvertTo-Json -Depth 8
