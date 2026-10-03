# セキュリティポリシー

## 静的サイトの CSP と referrer

GitHub Pages はこの構成では応答ヘッダーを設定できないため、ビルド後に全 HTML の `head` 冒頭へ CSP と `strict-origin-when-cross-origin` の meta を付けます。`object-src 'none'`・`base-uri 'self'`・`form-action 'none'` を必須とし、スクリプトは同一生成物と、その HTML が出力したインラインスクリプトの SHA-256 ハッシュに限定します。Next.js の hydration とテーマ初期化に必要な実出力をハッシュ化するので、`script-src` の `unsafe-inline` は使いません。Pagefind の Wasm は `wasm-unsafe-eval`、KaTeX・構文強調・レイアウトのインライン CSS は `style-src 'unsafe-inline'` を許可します。Mermaid は strict 設定でビルド時に両テーマの SVG を生成し、実行イベントを検査して画像として配信します。閲覧時には Mermaid の JS を読み込みません。

音声は同一オリジンと、このリポジトリの GitHub Releases からの MP3 を許可し、リダイレクト先の GitHub 資産ホストを `media-src` に列挙します。カタログの URL 検査も併用します。検索・数式・図・テーマ・音声のブラウザー試験で `securitypolicyviolation` を確認します。meta は後続リソースに適用され、`frame-ancestors`・報告専用ポリシーなどを指定する手段ではありません。iframe 埋め込み防止や HTTP 応答ヘッダーと同等の防御を宣言しません。

根拠: [Next.js CSP ガイド](https://nextjs.org/docs/app/guides/content-security-policy)(確認日: 2026-10-03)。nonce は動的描画を必要とするため、静的出力では実出力のハッシュを採用します。

## このプロジェクトの性質

本リポジトリは学習用ドキュメントライブラリで、公開物は認証を持たない静的サイト
(GitHub Pages)です。実行時のサーバやユーザーデータの取り扱いはありません。
とはいえ以下は対象になり得ます:

- `examples/` のサンプルコードに含まれる安全でないパターン
- `website/` の生成パイプライン(`scripts/sync-content.mjs` など)や依存関係
- ドキュメント本文から生成される MDX(生 HTML / ESM の混入)
- Scheduled を含む保守 Agent の実行権限と、ローカル `gh` / Git の認証・push・PR・マージ予約
- 外部 PR の候補コード・Issue コメント・調査資料・ログを読む Agent の信頼境界
- `.claude/settings.json` の事前許可、Codex/Claude の設定・スキル・フック

## Agent 運用の脅威モデル

守る資産は公開内容の完全性、保守者の資格情報、ローカルの実行権限、独立レビュー・CI・公開証拠です。外部の貢献者・コメント投稿者・依存の提供元は、候補コードや資料を供給できます。その入力は権限・送信先・必須検査を変更できる命令として扱いません。記事の参考URLを開く場合も同じ境界です。

外部 PR は信頼する base の checkout 上で `git show` と差分をデータとして読みます。Agent が保守者の認証を持つ端末で候補を checkout して `npm ci`、テスト、フックを実行すると、PR のコードがその権限で動くため、この読み取りレビューでは実行しません。候補の必要な実行検証は権限・秘密を持たない `pull_request` CIで行います。対応手順は [Git 共通規約](harness/git-rules.md#外部prコメントの読み取り)を参照してください。

`pull_request_target` の trusted-base policy は base のコード・依存で候補 Git tree をデータとして検査し、候補の lifecycle script を起動しません。本文の事実の正しさ、実 Agent の安全性、独立判断の実在、保守者の権限の誤用やCI上の未知の脆弱性までは保証しません。編集フックと deny は補助であり、シェル・symlink経由の書込みを完全隔離する sandbox としません。外部PRの新しい設定は、そのPR自身を許可する根拠にできません。

運用の監査は設定・静的検査・依存監査・実クライアント・GitHub・公開証拠を区別します。受容したリスクは `project/records/YYYY-MM-DD/` の記録に対象・理由・所有者・代替防御・見直し期限を残し、期限切れを成功扱いにしません。

## 脆弱性の報告

**公開 Issue では報告しないでください。** GitHub の
[Private vulnerability reporting](https://docs.github.com/ja/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
(リポジトリの **Security → Report a vulnerability**)からご連絡ください。

報告には以下を含めていただけると助かります:

- 影響範囲(該当ファイル / URL / サンプル)
- 再現手順または PoC
- 想定される影響

内容を確認し、対応方針をお返しします。修正の公開時期は影響度に応じて調整します。

## 補足(既知の設計上の防御)

- `sync-content.mjs` は生成 MDX を再パースし、許可コンポーネント以外の JSX / ESM /
  `{式}` / 生 HTML を検出するとビルドを失敗させます。許可コンポーネントでも属性式・スプレッド・
  許可外の属性を拒否し、装飾に必要な文字列属性だけを受け入れます。この検査は docs からの生成物が対象です。
  `website/content-src/` とサイト実装は実行可能コードとしてレビューします
- Codex の編集フックは `apply_patch` の全対象パス(移動元・移動先を含む)を検査し、
  生成物への直接編集をブロックします。シェル経由の書き込みなどを含む完全な隔離境界ではありません
- サンプルコードは秘密情報を環境変数参照とし、コードに埋め込みません
- Mermaid は Nextra が直接 import するコンポーネントをサイト所有の描画器へ解決し、描画ごとに
  `securityLevel: strict` を設定します。記事から安全設定を上書きする指定やイベント binding は採用しません。
  表示機能を変えるときは、設定だけでなく実ビルドの解決先と既存図の表示も検証します

## 依存関係の監査

CI はインストール前に `npm audit --package-lock-only --audit-level=high` を実行し、high 以上があれば失敗します。root lint は `npm ci --ignore-scripts` を使います。
Python サンプルは `python -X utf8 -m pip_audit --strict -r examples/tests/requirements.txt --progress-spinner off`
で解決した依存を監査します。既知脆弱性の検出と依存の収集失敗を失敗として扱い、例外の自動追加や
依存の自動修正は行いません。監査ツールの版は `harness/requirements-audit.txt` に固定しています。
2026-10-03 の修正前のローカル監査では、root・サイト依存関係の脆弱性報告は 0 件でした。今回の最終検証は新しい実施記録とCIで確認します。
これは将来の報告や未発見の脆弱性がないことを保証しません。

2026-10-03 にルートの `markdown-it` を 14.3.1、`js-yaml` を 5.4.1 へ限定更新しました。
[markdown-it の advisory](https://github.com/advisories/GHSA-253c-mchw-3w2r) と
[js-yaml の advisory](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm) が示す修正版です。
Markdown のリンク検査は `linkify: false`、YAML 設定検査は `JSON_SCHEMA` を維持します。
これらは upstream が記載する linkify 有効時・merge key 有効時の条件を制限しますが、
CLI を含む全経路の安全性を設定だけで保証しません。

`markdownlint-cli` 0.49.1 の `js-yaml ~5.2.1` を、ルートで固定する 5.4.1 へ限定 override します。
CLI が修正版を許容する依存指定へ移行したときに override を取り除き、`npm ci`・Markdown/YAML
回帰・全数記事/リンク検査・監査を再実行してください。次回依存メンテナンスで見直します。
更新後の `npm audit --json` は total 0、high/critical 0、`npm ls` は両依存が CLI 経由でも
同じ修正版へ解決したことを確認しました。監査件数は実悪用の観測や未発見問題の不存在を表しません。

`speech-rule-engine` が固定する `@xmldom/xmldom` 0.9.10 を、同じ 0.9 系の修正版 0.9.12 に
限定して上書きしています。上流の依存指定が修正版を取り込んだときに override を取り除き、
監査と静的サイトのクリーンビルドを再実行してください。

## リポジトリの予防設定

2026-09-12 に Private vulnerability reporting、secret scanning、push protection、
Dependabot alerts の有効化を API で確認しました。Actions は GitHub 所有の Action とローカル Action を
許可し、外部 Action の完全な commit SHA 固定を必須にしています。新しい提供元を利用する場合は、
実装・権限・固定先をレビューしてから許可範囲を変更します。

依存更新 PR の作成は既存の Agent 運用で扱います。Dependabot による修正 PR の自動作成は、
[Git 共通規約](harness/git-rules.md)の branch・日本語本文・名義の契約へ接続する仕組みを整えるまで無効です。
依存監査の成功や予防設定は、未発見の問題やすべての秘密情報の混入を防げることを意味しません。

## 依存監査と alerts の運用

[週次依存監査](.github/workflows/dependency-audit.yml)は毎週月曜07:41 JSTと手動起動でtrusted mainのroot・website lockfileとPython requirementsを読みます。PR必須チェックとは分離し、候補コードを実行しません。失敗時はリポジトリ保守者がGitHub Actionsの失敗通知とDependabot alertsを確認します。通知を受け取る保守者はGitHubの通知設定でActionsを有効にし、最低週1回Security → Dependabotも直接確認します。通知不達を監査成功と扱いません。

保守者またはその指示を受けたAgentは、advisory・影響条件・解消版を一次情報で確認し、Git規約のbranch・日本語件名・実編集Agent名義で限定した修正PRを作ります。例外の自動受容、依存の自動修正、保護ルール迂回はしません。未解消の受容は `project/records/YYYY-MM-DD/dependency-risk-acceptance.md` にadvisory ID・依存/版・影響条件・理由・対応者・代替防御・見直し期限(YYYY-MM-DD)を書き、PRから参照します。期限に再監査し、延長には新しい理由を残します。Dependabot自動PRは従来どおり無効です。

Claudeの事前許可にはforce push・hard reset・強制clean・admin merge・repository削除を拒否するdenyを設定しています。Codexはworkspace sandboxとセッションの承認境界を使い、同じ禁止操作をGit規約で制限します。設定だけで実効権限や実クライアントの発火を確認したとは記録しません。
