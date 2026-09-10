import { spawnSync } from 'node:child_process'
import { realpathSync, statSync } from 'node:fs'

/** Windows の実 8.3 名を取得する読取専用 test helper。パスを shell source に補間しない。 */
export function windowsShortPath(directory) {
  if (process.platform !== 'win32') return { path: null, reason: 'Windows 8.3 path test' }
  const physical = realpathSync.native(directory)
  if (!statSync(physical).isDirectory()) throw new Error('8.3 fixture は実在するディレクトリが必要です')
  // cmd の文字列展開を使わず、環境値を COM の文字列引数として渡す。
  // 空白・&・% 等を含む所有 fixture パスもコマンドとして解釈されない。
  const script = "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); $harnessTestFso=New-Object -ComObject Scripting.FileSystemObject; [Console]::WriteLine($harnessTestFso.GetFolder($env:HARNESS_TEST_LONG_PATH).ShortPath)"
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8', windowsHide: true, timeout: 15000,
    env: { ...process.env, HARNESS_TEST_LONG_PATH: physical },
  })
  if (result.error || result.status !== 0) throw new Error(`8.3 fixture の取得に失敗しました: ${result.error?.message ?? result.stderr}`)
  const short = result.stdout.trim()
  if (!short || short.toLowerCase() === physical.toLowerCase()) return { path: null, reason: 'このボリュームでは 8.3 の別名が提供されません' }
  if (realpathSync.native(short) !== physical) throw new Error('8.3 fixture の実体が一致しません')
  return { path: short, reason: null }
}
