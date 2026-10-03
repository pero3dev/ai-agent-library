# サイト背景の霧とダークテーマの装飾色

## 作業契約

- 目的: 2026-10-04(日本時間)の未完了 Issue [#215](https://github.com/pero3dev/ai-agent-library/issues/215)・[#216](https://github.com/pero3dev/ai-agent-library/issues/216)を、実装・独立レビュー・検証・PR・公開確認・Closeまで進める。
- 許可根拠: ユーザーの「GithubのIssueのすべて自律的にCloseに向けて進めてください」という依頼。対象はこのリポジトリのremote `pero3dev/ai-agent-library`。Issueコメント、修正PR、CI確認、通常のマージと完了条件を満たしたCloseを含む。
- 元HEAD: `22b2892c8ad859cb1454f241433555b880dde4d1`。取得した `origin/main` と一致し、開始時の作業差分はない。
- ブランチ: `codex/site-fog-and-dark-callouts`。他の登録worktreeと既存ブランチを変更しない。
- 所有パス: `website/app/docs.css`、`website/components/home/home.css`、`website/tests/browser/site-appearance.spec.mjs`、`website/scripts/capture-theme-evidence.mjs`、`.github/workflows/ci.yml`の表示検証と証跡保存、今回の記録、`project/README.md`。記事の正本と生成済みサイト内容は直接編集しない。
- 必要な検証: lockfileによる `npm ci`、`npm run check`、サイト単体試験・公開相当ビルド・ブラウザー試験、明暗とPC/スマホ幅の変更前後画面、コントラスト、印刷、重なり順、Git形式、最終差分の独立レビュー、実GitHubのPR head/必須CI/merge SHA、同SHAのmain CI/deploymentと公開画面。
- 終了条件: 両Issueの全完了条件を証拠で照合する。PRへ画面証拠を添付し、解消した変更と検証をリンクする。CI予約と完了、WebKit自動試験とSafari実機操作を区別する。

## 状況

開始時の実GitHub検索で未完了Issueは2件、未完了PRは0件だった。両Issueに追加コメントはない。

## 実装と画面証拠

Nextraの実背景はライト `rgb(250, 250, 250)`、ダーク `rgb(17, 17, 17)`。ダークはIssueの計算条件と一致するため、指定色をそのまま反映した。

霧は `body` の独立した重なり順の中で、HTML背景より上、本文と操作部品より下に固定する。ライトのアクセント18%・紫12%、ダークの5.76%・3.84%と、中心が透明な2層のグラデーションをIssueの式で実装した。トップページのアクセントは共通トークンを参照し、印刷時は霧を非表示にする。TODOの左帯・ラベル、アンチパターンの記号、チェックリストの色を残し、ライトの装飾色は維持した。

実際の変更前の静的出力を私有領域へ保存し、同じブラウザー・画面寸法・ページで比較する。トップ/記事の明暗×1440×900・390×844と、ダークのTODO/アンチパターン/チェックリストを各幅で撮影する。画像とSHA-256付きmanifestはActions artifactへ90日保持し、PRから参照する。CIのbeforeはPR baseの独立checkoutを監査・ビルドし、afterはCIで実ビルドしたrevisionとPR headを区別して記録する。CSSを注入して旧画面を再現したものではない。

## 候補提出時点の検証

この表と以下の追記は、候補作成・再提出時点の証拠を残す。最終CI・merge・同SHAのmain CI/deployment・公開画面・Closeの証拠は、[PR #217](https://github.com/pero3dev/ai-agent-library/pull/217)と、冒頭の各Issueの完了コメントから確認する。

| 実行面 | 結果と範囲 |
| --- | --- |
| Nodeと依存 | 同梱Node 24.19.0とlockfileでルート・サイトの `npm ci` を実施。初回PATHの24.14.0によるengine警告後、対応版のNodeからnpm CLIを直接起動して依存準備を完了 |
| `npm run check` | exit 0。単体523件: 520成功・3skip・失敗0。Markdown、記事、リンク、前提レベル、TODO、ハーネスの検査も成功 |
| サイト単体 | 84件成功・失敗0 |
| 公開相当ビルド | `STATIC_EXPORT=1`、公開base path/URLで成功。230/230ルート、232 HTMLの検査が成功 |
| 独立内容レビュー | CSS・撮影helper・CI・表示検証を読み取り専用の別担当が確認。実装に必須修正なし。画面とブラウザーの検証とは別の証拠 |
| Chromium | ローカル全ブラウザー回帰: 659成功・5skip・失敗0。before/after各14枚の実出力から霧の表示と中央の可読性を確認 |
| Firefox Windows | Playwright 1.63.0/Firefox 155.0のページ作成が `_page` エラーで失敗。単独probeでも再現し、DOM/表示検査は未実施。Ubuntu CIで対象表示検査を実行して別に判定する |
| WebKit/Chrome | Stable Chromeの外観12件成功。Windows WebKitは9件成功後、Color4の検査側変換とメニュー対象の訂正後に残る3件が成功。macOS CIでは全12件成功。WebKit自動試験とSafari/iPhone実機の操作は区別する |
| 実GitHub・公開 | PR/必須CI/merge/main CI/deployment/公開画面の照合は未完了。成功後にIssueへ根拠を残してCloseする |

## PR初回CIと再提出

[初回CI run 37150494133](https://github.com/pero3dev/ai-agent-library/actions/runs/37150494133)は、候補 `30549ff624f868399d20d46f4bf5a662254cc536` に対応する。Chromiumは659成功・5skip、macOS WebKitの外観は12成功。Ubuntu Firefoxは外観10件成功・2件失敗だった。失敗はダークの霧の計算済みアルファを小数第2位へ丸めて返す差で、`5.76%`・`3.84%` の指定値、文字コントラスト、チェックボックス、印刷、操作の検査は成功していた。

Firefoxだけは、指定値の厳密な確認を維持したまま、計算済みアルファの正確な値と小数第2位へ丸めた表記を許容する。CSSは変更せず、検査を訂正して新しいheadで必須CIを取り直す。

初回の[画面artifact](https://github.com/pero3dev/ai-agent-library/actions/runs/37150494133/artifacts/11283689415)を実際にダウンロードし、PNGの署名とmanifestのSHA-256を全28枚で照合した。beforeは元HEAD、afterのビルドrevisionは `a04a17f4a9b888b0c9799d66db795ac63e226bc7`、PR headは上記候補で、CIの実checkoutとも一致した。代表4枚の日本語、配置、霧、実務ボックスとチェック色を画面確認した。macOS WebKitの小artifactには成功した検査の状態のみ残り、チェックボックスのPNG添付が保持された証拠とは扱わない。
