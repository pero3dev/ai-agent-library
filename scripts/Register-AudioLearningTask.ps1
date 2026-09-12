[CmdletBinding()]
param(
    [ValidateSet('Xml', 'Install', 'Status', 'Pause', 'Resume')][string]$Mode = 'Xml',
    [string]$ProjectRoot,
    [string]$StateDir,
    [string]$Config,
    [ValidateRange(1, 24)][int]$EveryHours = 4,
    [ValidateRange(1, 20)][int]$Limit = 1,
    [switch]$Publish,
    [switch]$AutoMerge,
    [switch]$SyncMain,
    [string]$OutputPath
)
$ErrorActionPreference = 'Stop'
if (-not $ProjectRoot) { $ProjectRoot = Split-Path -Parent $PSScriptRoot }
$taskName = 'AI Agent Library - Audio Learning'
if ($AutoMerge -and -not $Publish) { throw '-AutoMerge requires -Publish.' }
$projectPath = (Resolve-Path -LiteralPath $ProjectRoot).Path
function Quote-TaskArgument([string]$Value) {
    if ($Value -match '["\r\n]' -or $Value.EndsWith('\')) { throw 'Task arguments cannot contain quotes, newlines, or trailing backslashes.' }
    return '"' + $Value + '"'
}
if ($Mode -eq 'Status') {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if (-not $task) { Write-Output '{"registered":false}'; exit 0 }
    $info = Get-ScheduledTaskInfo -TaskName $taskName
    [ordered]@{ registered = $true; state = [string]$task.State; last_run = $info.LastRunTime; last_result = $info.LastTaskResult; next_run = $info.NextRunTime; actions = @($task.Actions | Select-Object Execute, Arguments) } | ConvertTo-Json -Depth 5
    exit 0
}
if ($Mode -eq 'Pause') { Disable-ScheduledTask -TaskName $taskName | Out-Null; Write-Output 'Audio task paused.'; exit 0 }
if ($Mode -eq 'Resume') { Enable-ScheduledTask -TaskName $taskName | Out-Null; Write-Output 'Audio task enabled.'; exit 0 }
$wrapper = Join-Path $projectPath 'scripts\Invoke-AudioLearning.ps1'
if (-not (Test-Path -LiteralPath $wrapper -PathType Leaf)) { throw 'Audio task wrapper is missing.' }
$shellPath = Join-Path $PSHOME 'powershell.exe'
if (-not (Test-Path -LiteralPath $shellPath)) { $shellPath = Join-Path $PSHOME 'pwsh.exe' }
if (-not (Test-Path -LiteralPath $shellPath -PathType Leaf)) { throw 'The current PowerShell executable could not be resolved.' }
$arguments = '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -File ' + (Quote-TaskArgument $wrapper) + ' -ProjectRoot ' + (Quote-TaskArgument $projectPath) + ' -Limit ' + $Limit
if ($StateDir) { $arguments += ' -StateDir ' + (Quote-TaskArgument ([IO.Path]::GetFullPath($StateDir))) }
if ($Config) { $arguments += ' -Config ' + (Quote-TaskArgument ([IO.Path]::GetFullPath($Config))) }
if ($Publish) { $arguments += ' -Publish' }
if ($AutoMerge) { $arguments += ' -AutoMerge' }
if ($SyncMain) { $arguments += ' -SyncMain' }
$escape = { param($value) [Security.SecurityElement]::Escape([string]$value) }
$userSid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$start = [DateTime]::Now.AddMinutes(1).ToString('yyyy-MM-ddTHH:mm:ss')
$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Produce AI Agent Library audio using the existing subscription and local synthesis. No paid API fallback.</Description></RegistrationInfo>
  <Triggers><TimeTrigger><Repetition><Interval>PT${EveryHours}H</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition><StartBoundary>$start</StartBoundary><Enabled>true</Enabled></TimeTrigger><LogonTrigger><Enabled>true</Enabled><UserId>$userSid</UserId><Delay>PT2M</Delay></LogonTrigger></Triggers>
  <Principals><Principal id="Author"><UserId>$userSid</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries><StopIfGoingOnBatteries>false</StopIfGoingOnBatteries><AllowHardTerminate>true</AllowHardTerminate><StartWhenAvailable>true</StartWhenAvailable><RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable><AllowStartOnDemand>true</AllowStartOnDemand><Enabled>true</Enabled><Hidden>true</Hidden><WakeToRun>false</WakeToRun><ExecutionTimeLimit>PT4H</ExecutionTimeLimit><Priority>7</Priority></Settings>
  <Actions Context="Author"><Exec><Command>$(& $escape $shellPath)</Command><Arguments>$(& $escape $arguments)</Arguments><WorkingDirectory>$(& $escape $projectPath)</WorkingDirectory></Exec></Actions>
</Task>
"@
[xml]$parsedXml = $taskXml
if ($OutputPath) { [IO.File]::WriteAllText([IO.Path]::GetFullPath($OutputPath), $taskXml, [Text.Encoding]::Unicode) }
if ($Mode -eq 'Xml') { Write-Output $taskXml; exit 0 }
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) { throw 'Audio task already exists. Inspect or pause it; installation never overwrites an existing task.' }
Register-ScheduledTask -TaskName $taskName -Xml $parsedXml.OuterXml | Out-Null
Write-Output 'Audio task registered. Registration alone does not prove a successful production run.'
