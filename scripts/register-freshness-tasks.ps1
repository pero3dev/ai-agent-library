# Uses the installed desktop app's local automation.toml loading path.
# Does not modify its database, authentication, or existing unrelated tasks.
[CmdletBinding()]
param(
    [ValidateSet('Install', 'Status', 'Pause')]
    [string]$Mode = 'Status',
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$TaskDataRoot = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex')
)
$ErrorActionPreference = 'Stop'
$projectPath = (Resolve-Path -LiteralPath $ProjectRoot).Path
$taskRoot = Join-Path $TaskDataRoot 'automations'
$definitions = @(
    @{ Id = 'ai-agent-library-weekly-focus'; Name = 'AI Agent Library - 週次重点更新'; Day = 'MO'; PromptFile = 'freshness-weekly-focus.txt' },
    @{ Id = 'ai-agent-library-rotation'; Name = 'AI Agent Library - 全系統巡回'; Day = 'TH'; PromptFile = 'freshness-rotation.txt' }
)
if ($Mode -eq 'Install') {
    if ((Get-TimeZone).Id -ne 'Tokyo Standard Time') { throw 'These tasks require the local Windows time zone to be Tokyo Standard Time.' }
    foreach ($definition in $definitions) {
        $taskFile = Join-Path $taskRoot ($definition.Id + '\automation.toml')
        if (Test-Path -LiteralPath $taskFile) { throw "Task already exists; inspect it before changing: $taskFile" }
        if (-not (Test-Path -LiteralPath (Join-Path $projectPath ('automation\' + $definition.PromptFile)))) { throw 'Task prompt is missing.' }
    }
    $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    foreach ($definition in $definitions) {
        $taskDir = Join-Path $taskRoot $definition.Id
        $taskFile = Join-Path $taskDir 'automation.toml'
        $promptText = (Get-Content -Raw -LiteralPath (Join-Path $projectPath ('automation\' + $definition.PromptFile))).Trim()
        $lines = @(
            'version = 1',
            ('id = ' + (ConvertTo-Json -InputObject $definition.Id -Compress)),
            'kind = "cron"',
            ('name = ' + (ConvertTo-Json -InputObject $definition.Name -Compress)),
            ('prompt = ' + (ConvertTo-Json -InputObject $promptText -Compress)),
            'status = "ACTIVE"',
            ('rrule = "FREQ=WEEKLY;BYDAY=' + $definition.Day + ';BYHOUR=7;BYMINUTE=23;BYSECOND=0"'),
            ('cwds = [' + (ConvertTo-Json -InputObject $projectPath -Compress) + ']'),
            'execution_environment = "worktree"',
            'model = "gpt-6-astra"',
            ('created_at = ' + $stamp),
            ('updated_at = ' + $stamp)
        )
        New-Item -ItemType Directory -Path $taskDir -Force | Out-Null
        Set-Content -LiteralPath $taskFile -Value ($lines -join "`n") -Encoding utf8NoBOM
        Write-Output "Created task configuration: $taskFile"
    }
}
if ($Mode -eq 'Pause') {
    foreach ($definition in $definitions) {
        $taskFile = Join-Path $taskRoot ($definition.Id + '\automation.toml')
        if (-not (Test-Path -LiteralPath $taskFile)) { continue }
        $taskText = Get-Content -Raw -LiteralPath $taskFile
        if ($taskText -notmatch ('(?m)^id = "' + [regex]::Escape($definition.Id) + '"\r?$')) { throw "Unexpected task ID: $taskFile" }
        $taskText = [regex]::Replace($taskText, '(?m)^status = "[A-Z]+"\r?$', 'status = "PAUSED"')
        $taskText = [regex]::Replace($taskText, '(?m)^updated_at = [0-9]+\r?$', ('updated_at = ' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()))
        Set-Content -LiteralPath $taskFile -Value $taskText -Encoding utf8NoBOM -NoNewline
        Write-Output "Paused task configuration: $taskFile"
    }
}
$database = Join-Path $TaskDataRoot 'sqlite\codex-dev.db'
if (-not (Test-Path -LiteralPath $database)) { Write-Output 'Desktop registration database is not available; file creation does not prove registration.'; exit 0 }
$statusScript = @'
import json, re, sqlite3, sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
database, *ids = sys.argv[1:]
c = sqlite3.connect(Path(database).as_uri() + '?mode=ro', uri=True)
c.row_factory = sqlite3.Row
rows = c.execute('SELECT id,name,status,rrule,cwds,execution_environment,model,next_run_at,last_run_at FROM automations WHERE id IN (' + ','.join('?' for _ in ids) + ')', ids).fetchall()
result = []
for row in rows:
    entry = dict(row)
    config_file = Path(database).parent.parent / 'automations' / entry['id'] / 'automation.toml'
    config_text = config_file.read_text(encoding='utf-8') if config_file.exists() else ''
    configured_status = re.search(r'^status = "(ACTIVE|PAUSED)"\s*$', config_text, re.MULTILINE)
    entry['configured_status'] = configured_status.group(1) if configured_status else None
    for key in ('next_run_at','last_run_at'):
        entry[key + '_jst'] = datetime.fromtimestamp(entry[key]/1000, timezone(timedelta(hours=9))).isoformat() if entry[key] is not None else None
    result.append(entry)
c.close()
print(json.dumps({'registered':len(result),'expected':len(ids),'tasks':result}, ensure_ascii=False, indent=2))
'@
& python -X utf8 -c $statusScript $database @($definitions | ForEach-Object { $_.Id })
if ($LASTEXITCODE -ne 0) { throw 'Could not verify registration from the desktop app database.' }
