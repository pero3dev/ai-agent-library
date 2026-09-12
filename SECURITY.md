# セキュリティポリシー

## このプロジェクトの性質

本リポジトリは学習用ドキュメントライブラリで、公開物は認証を持たない静的サイト
(GitHub Pages)です。実行時のサーバやユーザーデータの取り扱いはありません。
とはいえ以下は対象になり得ます:

- `examples/` のサンプルコードに含まれる安全でないパターン
- `website/` の生成パイプライン(`scripts/sync-content.mjs` など)や依存関係
- ドキュメント本文から生成される MDX(生 HTML / ESM の混入)

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

CI は `npm ci` の後に `npm audit --audit-level=high` を実行し、high 以上があれば失敗します。
Python サンプルは `python -X utf8 -m pip_audit --strict -r examples/tests/requirements.txt --progress-spinner off`
で解決した依存を監査します。既知脆弱性の検出と依存の収集失敗を失敗として扱い、例外の自動追加や
依存の自動修正は行いません。監査ツールの版は `harness/requirements-audit.txt` に固定しています。
2026-09-10 のローカル監査では、サイト依存関係の脆弱性報告は 0 件でした。
これは将来の報告や未発見の脆弱性がないことを保証しません。

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
