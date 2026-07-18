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
  `{式}` / 生 HTML を検出するとビルドを失敗させます(ドキュメント経由の実行可能コード混入を防ぐ)
- サンプルコードは秘密情報を環境変数参照とし、コードに埋め込みません
