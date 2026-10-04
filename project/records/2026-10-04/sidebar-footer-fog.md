# サイドバー下部の背景の霧

## 作業契約

- 目的: 未完了 Issue [#218](https://github.com/pero3dev/ai-agent-library/issues/218) の修正、画面証拠、検証、独立レビュー、PR、公開確認、Closeを完了する。
- 許可根拠: ユーザーの「GithubのIssueのすべて自律的にCloseに向けて進めてください」という依頼。remote `pero3dev/ai-agent-library` の修正PR、Issueコメント、通常のマージ、全完了条件を満たしたCloseを含む。
- 元HEAD: `658062d8c3bf766f1c113b9ac4078489d7309de4`。取得した `origin/main` と一致し、開始時の作業差分はない。
- ブランチ: `codex/sidebar-footer-fog`。登録済みの他worktreeは変更しない。
- 所有パス: `website/app/docs.css`、`website/tests/browser/site-appearance.spec.mjs`、`website/scripts/capture-theme-evidence.mjs`、今回の記録、`project/README.md`。画面は既存CIのActions artifactへ保存する。
- 必要な検証: ルート・サイトの `npm ci`、`npm run check`、サイト単体、公開相当ビルド、ブラウザー回帰、ライト/ダーク・サイドバー開閉・スクロール・スマホ幅の確認、変更前後の実ビルド画面、Git形式、最終差分の独立レビュー、PR headの必須CI、merge SHA、同SHAのmain CI/deployment、公開画面。
- 終了条件: Issueの全完了条件を照合し、PRへ画面証拠を添付し、解消PRと検証結果をIssueへ残して `completed` でCloseする。

## 開始時の確認

2026-10-04(日本時間)の実GitHub一覧では未完了Issueは #218 の1件、未完了PRは0件だった。Issueの追加コメントはない。Nextraのサイドバーフッターにある不透明背景を調査し、半透明背景とぼかしによる修正を進める。

## 実装と証拠の範囲

Nextra 4.6.1 の `--nextra-bg` はカンマ区切りのRGBで、ナビバーの背景は70%の `color-mix(in oklab, ...)`、ぼかしは12pxだった。PCサイドバー直下のフッターだけを同じ背景と標準・WebKitのぼかしへ上書きする。幅のクラスに依存せず、開いた状態と80pxの折りたたみ状態へ適用する。

サイドバーとメニューのスクロール領域自体は透明だった。選択・ホバーの背景は項目を区別するために保持する。スマホのメニューは全画面で本文を覆うため、既存の不透明背景を維持する。

回帰試験は両テーマで、実際に描画した背景のRGBAがナビバーと一致し、アルファが約0.7、ぼかしが12pxであることを検査する。メニュー末尾へのスクロール、キーボードによる開閉、開いた後の別記事への移動も確認する。

撮影helperにはPCの両テーマ×開閉×先頭/末尾スクロールの8枚を追加し、既存のトップ・記事・スマホ・実務ボックスと合わせて各版22枚を取得する。beforeは元HEADの実ビルドであり、候補CSSの注入による再現ではない。CIはPR baseを独立checkoutしてビルドし、同じhelperでbefore/afterを撮影する。画像とSHA-256付きmanifestは既存のActions artifactへ90日保持し、PRからリンクする。manifestのビルドrevisionとPR headを区別する。

## 候補の検証

| 実行面 | 結果と範囲 |
| --- | --- |
| 依存準備 | lockfileからルート・サイトの `npm ci` 成功。ルート初回のNode 24.14.0 engine警告後、対応版24.19.0で準備を取り直し、検証を実行 |
| `npm run check` | exit 0。単体523件: 520成功、3skip、失敗0。Markdown、記事、リンク、前提レベル、TODO、ハーネスの検査も成功 |
| サイト単体 | 84件成功、失敗0 |
| 変更前の公開相当ビルド | 公開base path/URLと `STATIC_EXPORT=1` でexit 0。230/230ルート、232 HTML、索引・メタデータ・CSPの検査が成功 |
| 変更前の画面 | Chromium 153.0.8010.12で22枚とmanifest取得成功。ライト末尾スクロールとダーク折りたたみで、フッターが四角い不透明領域になることを実画面で確認 |
| 変更後の公開相当ビルド | exit 0。230/230ルート、232 HTML、索引・メタデータ・CSPの検査が成功 |
| 変更後の画面 | 同じChromium・寸法・ページで22枚取得。before/after全44枚のSHA-256をmanifestと照合。両テーマのopen/closedと末尾スクロールの画面で、霧の透過と配置・操作欄の維持を確認。ローカルafterは未commitの候補ビルドとしてrevisionを未指定にし、CIでは実checkout revisionとheadを記録する |
| Chromiumの外観・モバイル | `site-appearance.spec.mjs` と `mobile-menu.spec.mjs` の全23件成功。新規の明暗2件でアルファ約0.7・ナビバー同色・12px blur・内部末尾スクロール・80pxへの開閉・記事移動を確認 |
| 独立レビュー | CSS・試験・撮影helper・記録の最終差分を別担当が読み取りレビュー。最終判定とCI以降の証拠はPRに残す |
| 実GitHub・公開 | 未完了。最終PR headの11必須チェック、merge、同SHAのmain CI/deployment、公開画面を照合してIssueへ根拠を残す |

ローカルの画面照合結果は[小さなJSON](sidebar-footer-fog-evidence.json)に記録する。追跡するファイルへPNGやtraceを追加しない。PRのActions artifactから `before/manifest.json` と `after/manifest.json` を復元し、各PNGのSHA-256を照合できる。CIの画像は別OS・ビルドrevisionなので、ローカルのmanifestと同じhashであるとは扱わない。
