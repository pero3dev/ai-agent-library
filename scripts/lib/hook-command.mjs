/**
 * 設定に埋める bootstrap の正本。Codex は公式仕様どおり session cwd の git root、
 * Claude は CLAUDE_PROJECT_DIR を起点にする。shell の変数展開には依存しない。
 * 識別子は別プロジェクトの誤起動を防ぐためであり、コードの信頼を証明しない。
 * https://learn.chatgpt.com/docs/hooks (確認: 2026-09-10)
 */
export function hookCommand(client, mode) {
  if (!['codex', 'claude'].includes(client) || !['guard', 'validate'].includes(mode)) throw new Error('不明な hook adapter です')
  const script = mode === 'guard' ? 'guard-generated.mjs' : 'validate-doc.mjs'
  const root = client === 'claude'
    ? "process.env.CLAUDE_PROJECT_DIR"
    : "require('node:child_process').execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()"
  const command = "(async()=>{const fs=require('node:fs'),p=require('node:path'),u=require('node:url');" +
    `const candidate=${root};if(!candidate||!p.isAbsolute(candidate))throw Error('Project root is unavailable');` +
    "const r=fs.realpathSync(candidate),core=p.join(r,'scripts/lib/hook-core.mjs');" +
    `const entry=p.join(r,'.${client}/hooks/${script}');` +
    "for(const file of [core,entry])if(fs.realpathSync(file)!==file)throw Error('Hook path resolves outside its expected location');" +
    "if(fs.readFileSync(core,'utf8').split(/\\r?\\n/,1)[0]!=='// ai-agent-library:hook-core-v1')throw Error('Not an AI Agent Library hook root');" +
    "await import(u.pathToFileURL(entry).href)})().catch(e=>{console.error('Hook startup failed: '+e.message);process.exitCode=2})"
  return `node -e "${command}"`
}

/**
 * Codex の Windows hook runner は PowerShell を使うため、Node の exit 2 を保持する。
 * -Command の末尾が native command のままだと PowerShell は非ゼロ終了を 1 に変換し、
 * Codex が期待する blocking error (2) にならない。Unix と Claude の command は変更しない。
 */
export function codexWindowsHookCommand(mode) {
  return `${hookCommand('codex', mode)}; exit $LASTEXITCODE`
}
