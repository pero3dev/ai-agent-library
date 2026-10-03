# 音声処理・必須チェック・取得ツール・検証依存の Issue 対応

## 作業契約

2026-10-03（日本時間）、ユーザーの「GitHub の Issue のすべてを自律的に Close に向けて進める」依頼に基づき #161 → #162 と #163・#164 を担当する。共通入口は [AGENTS.md](../../../AGENTS.md)、[ハーネス変更規約](../../../CONTRIBUTING.md#ハーネスを変更するとき)、[定期メンテナンス](../../../ROADMAP.md#定期メンテナンスフェーズ完了後も継続)、[記録の索引](../../README.md)。他の担当の変更を戻さない。

所有範囲は `scripts/audio/{lock,pipeline,publication}.mjs`、`scripts/lib/github-{policy,evidence}.mjs`、`scripts/Install-AudioLearningTools.ps1`、ルート package/lockfile・SECURITY、対応する `tests/unit/`、`automation/audio/README.md` と本記録。CONTRIBUTING・索引・Git 操作・実 GitHub の保護設定/PR/Issue 操作は全体担当が扱う。

終了条件は排他の実競合試験、共通 11 必須チェックの異常拒否、固定 FFmpeg の実 archive/hash/version 照合、既知 2 advisory の直接/CLI 経由の解消と既存検証の成功。必要な公式情報とパッケージ/archive の取得は依頼された修正・検証の範囲。実 TTS・有料 API・音声生成・音声公開は行わない。

## 変更と確認

### #161 — 所有者付き排他

既存 `harness-state.mjs` の `withLockMutex`（OS 間の atomic mkdir）を各 namespace の guard へ再利用する。取得・stale 回復・解除を同一 mutex に置き、UUID attempt token と PID を保存する。旧形式は正しい PID/時刻かつ `ESRCH` の場合だけ隔離して移行する。不正記録、確認できない PID、残存 mutex は保持して失敗する。解除は自分の PID/token に一致するときだけ行う。

同プロセスで stale lock を 30 ラウンド競合させ、最大同時 producer=1。独立した 2 子プロセスを同期して競合させ、制作/公開の両 namespace を各 5 ラウンド試験し、毎回 owner=1、blocked=1。旧 token は新 lock を解除できず、namespace は独立。queue 読取失敗の後に再取得できる。これは実 OS プロセスを使うローカル試験であり、実 API/TTS の結果ではない。

### #162 — 音声 2 必須チェック

共通 policy に `Audio playback regression` と `Safari audio playback regression` を追加する。音声専用の Chromium 特例を削除し、共通定義へ統合する。両名は CI の実 job 名、`ci.yml` と `pull_request`、deploy の needs と照合する。音声 fixture job が Pages artifact をアップロードしないことも検査する。欠落・失敗・別 head・別 workflow は証拠判定/公開予約の双方で拒否する。

main の実保護 11 件・strict/admin enforcement と実 PR の 2 チェックは全体担当が別々に読戻して記録する。ローカル fixture の成功を実 GitHub の設定反映や iPhone 実機の証拠に置き換えない。

### #163 — 固定取得と安全な再試行

[upstream 9.0.1 release](https://github.com/GyanD/codexffmpeg/releases/tag/9.0.1) の API で版付き essentials ZIP、size 111253802、digest `fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9` を確認する。可変 latest URL を版付き GitHub asset URL へ置き換える。取得を partial ファイルへ行い、SHA-256 成功後だけキャッシュへ移す。不一致/中断/不完全展開は証拠 JSON とともに隔離し、正しい固定 URL で再試行する。

Windows PowerShell の不活性 ZIP fixture で正常再利用・不一致 cache・不一致 download・中断 download・不完全展開からの回復と unsafe entry の拒否を確認する。試験子プロセスの PSModulePath は Windows PowerShell の標準 modules に限定し、PowerShell 7 の親から異なる版の module path を引き継がない。

空の `.tmp/ffmpeg-9.0.1-verification` へ実 archive を取得し、111253802 bytes と SHA-256 `fec81ae03971d9dd4be3ebe02e263bd2ec1d789483f931bdba5f5715e65da2e9` を照合した。検証済み cache からの再実行も成功し、次の実出力を確認した。PATH・registry・global 環境は変更していない。

```text
ffmpeg version 9.0.1-essentials_build-www.gyan.dev
ffprobe version 9.0.1-essentials_build-www.gyan.dev
```

### #164 — 互換修正版への限定更新

[markdown-it advisory](https://github.com/advisories/GHSA-253c-mchw-3w2r) の修正版 14.3.1 と [js-yaml advisory](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm) の修正版 5.4.1 を公式情報で確認する。ルートをそれぞれ固定し、CLI 0.49.1 の `js-yaml ~5.2.1` だけを direct 版へ override する。lockfile の版変更はこの 2 パッケージのみ。`linkify: false` と `JSON_SCHEMA` を維持し、bare URL/mail の非 linkify と YAML merge key をデータとして扱う回帰を追加する。

限定更新後の `npm ci` は成功、`npm audit --json` を再取得して info/low/moderate/high/critical/total がすべて 0。`npm ls markdown-it js-yaml` は直接版と CLI 経由の両方が 14.3.1/5.4.1（deduped）へ解決した。既存 ini 7.0.0 が Node 24.14.0 に engine warning（Node 24.15.0 以上を要求）を出した。これは今回更新した 2 パッケージの警告ではなく、lockfile で元から固定された依存の条件。実行済み検証結果と分け、依存一括更新へ広げない。

## 検証証拠と残件

| 実行面・検証 | 結果 |
| --- | --- |
| 初回 audio-production/audio-publication（#162 の追加前） | 82 tests pass、fail 0 |
| 最終 github-evidence/markdown-validation/harness-tooling | 100 tests pass、fail 0 |
| 不活性 ZIP installer fixture | 7 tests pass、fail 0（正常・回復・拒否） |
| 排他の最終対象試験（子プロセス競合に 30 秒上限を設定） | 4 tests pass、fail 0 |
| `npm run check:harness` | 共通ハーネス・配置・Git形式検査すべて成功 |
| 対象 Markdown lint、`git diff --check` | 成功 |
| `npm run test:harness:windows`（sandbox） | 257 tests、238 pass、18 fail、1 skip。既存 hook の `EPERM realpath <user-home>` と既存 PowerShell 5 子プロセスの timeout |
| 同 Windows 集合（通常権限、他検証と並行） | 257 tests、254 pass、2 fail、1 skip。残る失敗は既存 PowerShell 5 試験 2 件の timeout |
| 失敗した PowerShell 5 試験を単独で再実行（通常権限） | 2 tests pass、fail 0、約 2.1 秒。timeout の閾値は変更していない |
| 同 Windows 集合を直列再実行（通常権限、`--test-concurrency=1`） | 257 tests、256 pass、fail 0、1 skip、約 399.4 秒 |

Windows 集合は同じ対象ファイルを直列で完走した。集合の audio 試験通過後に timestamp/token の型を string に限定し、JSON array の暗黙変換も不正記録として保持する最終差分を追加した。この差分は排他の 4 対象試験を再実行して fail 0 を確認した。並行負荷の失敗・単独成功・集合の成功・最終差分の検証を区別する。実 FFmpeg の検証は version/hash の取得だけで、実音声生成を行わないため実 FFmpeg 合成の既存試験は skip のまま。全体 `npm run check` と CI・GitHub・公開確認は全体担当の結果へ接続する。
