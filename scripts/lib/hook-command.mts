/**
 * 設定に埋める bootstrap の正本。Codex は公式仕様どおり session cwd の git root、
 * Claude は CLAUDE_PROJECT_DIR を起点にする。shell の変数展開には依存しない。
 * 識別子は別プロジェクトの誤起動を防ぐためであり、コードの信頼を証明しない。
 * https://learn.chatgpt.com/docs/hooks (確認: 2026-09-10)
 */
/** Checked source for the small JavaScript command needed to locate the repo. */
async function hookBootstrap(client: string, script: string): Promise<void> {
  try {
    const fs: typeof import('node:fs') = require('node:fs');
    const p: typeof import('node:path') = require('node:path');
    const u: typeof import('node:url') = require('node:url');
    const child: typeof import('node:child_process') = require('node:child_process');
    const candidate = client === 'claude' ? process.env.CLAUDE_PROJECT_DIR : child.execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (!candidate || !p.isAbsolute(candidate)) throw Error('Project root is unavailable');
    const r = fs.realpathSync(candidate), core = p.join(r, 'scripts/lib/hook-core.mjs'), implementation = p.join(r, 'scripts/lib/hook-core.mts');
    const entry = p.join(r, '.' + client + '/hooks/' + script);
    for (const file of [core, entry]) if (fs.realpathSync(file) !== file) throw Error('Hook path resolves outside its expected location');
    if (fs.readFileSync(core, 'utf8').split(/\r?\n/, 1)[0] !== '// ai-agent-library:hook-core-v1') throw Error('Not an AI Agent Library hook root');
    if (fs.realpathSync(implementation) !== implementation) throw Error('Hook path resolves outside its expected location');
    if (fs.readFileSync(implementation, 'utf8').split(/\r?\n/, 1)[0] !== '// ai-agent-library:hook-core-v1') throw Error('Not an AI Agent Library hook root');
    await import(u.pathToFileURL(entry).href);
  } catch (error) {
    console.error('Hook startup failed: ' + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 2;
  }
}

/** @param {string} client @param {string} mode */
export function hookCommand(client: string, mode: string) {
  if (!['codex', 'claude'].includes(client) || !['guard', 'validate'].includes(mode)) throw new Error('不明な hook adapter です')
  const script = mode === 'guard' ? 'guard-generated.mjs' : 'validate-doc.mjs'
  const source = hookBootstrap.toString().replace(/\r?\n[ \t]*/g, ' ')
  const command = `(${source})('${client}','${script}')`
  return `node -e "${command}"`
}

/**
 * Codex の Windows hook runner は PowerShell を使うため、Node の exit 2 を保持する。
 * -Command の末尾が native command のままだと PowerShell は非ゼロ終了を 1 に変換し、
 * Codex が期待する blocking error (2) にならない。Unix と Claude の command は変更しない。
 */
/** @param {string} mode */
export function codexWindowsHookCommand(mode: string) {
  return `${hookCommand('codex', mode)}; exit $LASTEXITCODE`
}
