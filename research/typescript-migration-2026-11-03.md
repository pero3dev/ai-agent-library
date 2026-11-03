# TypeScript 段階移行の一次資料調査

確認日: 2026-11-03(JST)。調査中に時計で確認した時刻は2026-11-03T11:24:58Z。以下の公式ページは同日中に取得・照合した。個別ページごとの取得秒は保存していないため、この時計観測をページの取得時刻には読み替えない。

用途: [移行計画](../project/plans/engineering/typescript-migration.md)の実行方式と段階導入の根拠。製品コードの移行、型検査、Nextビルドを実施した証拠ではない。

## 確認した主張と適用先

| 出典 | 確認できた範囲 | 計画への適用・限界 |
| --- | --- | --- |
| [Next.js: TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript) | 既存プロジェクトへTS/TSXを追加する導入経路と型検査、Next生成型、TypeScript 7のcompiler APIとの違い | サイトの標準導入経路。取得したページは16.4.4の資料で、lockの16.3.8の全挙動を証明しない。P0で固定版のcompiler互換性と生成順を実測 |
| [Nextra: TypeScript](https://nextra.site/docs/advanced/typescript) | TypeScriptと型依存の導入、配布コードの型定義 | Nextraの型を利用する方針。例示されたtheme configを現行構成へそのまま転記せず、固定4.6.1の実exportを確認する |
| [Nextra: MDX components file](https://nextra.site/docs/file-conventions/mdx-components-file) | `mdx-components`にTSXを使用でき、拡張子を含むTurbopack alias設定の案内がある | MDX入口の移行候補。現行の独自Mermaid aliasとloaderはリポジトリ固有の回帰試験も必要 |
| [Node.js 22: Modules TypeScript](https://nodejs.org/docs/latest-v22.x/api/typescript.html) | 22.18.0以降の既定型除去、型検査なし、`.mts`のESM解釈、明示拡張子、tsconfig非読込、変換が必要な構文の制約 | npm未導入経路を維持する候補。取得ページは22.23.4で、最低対応22.22.2の実起動や各OSは未検証 |
| [TypeScript: allowJs](https://www.typescriptlang.org/tsconfig/allowJs.html) | JSとTSの段階的な併存を許す | 併存を可能にする設定。JSの検査完了を意味しない |
| [TypeScript: checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html) | 対象のJSにも診断を報告する | 残すJSの型検査に使う。適用範囲はimport経由の広がりも含め実測する |
| [TypeScript: module](https://www.typescriptlang.org/tsconfig/module.html) | NodeNextのNode向けmodule解決と、bundler向け設定との区別 | NodeとNextの設定を分離する根拠。コンパイラー版により挙動が変わるため版を固定 |
| [TypeScript: erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html) | enum、parameter property等、消去だけでは実行できない構文を診断する設定 | native型除去を選ぶNode側の候補。`verbatimModuleSyntax`も合わせて評価 |
| [TypeScript: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html) | 未保証の添字アクセスにundefinedを含める | 配列・辞書・JSON境界から追加の厳格化を試す。既存コードへの全体適用費用は未測定 |

## 観測と推論を分ける

観測した公式仕様から、Next UIとNodeツールの設定・実行方式を分け、段階移行できると判断した。工数21〜37人日、予備枠、性能判断の20%という閾値は、このリポジトリの規模と契約から作成した計画上の見積もり・提案であり、一次資料に掲載された実績ではない。

`website/package-lock.json`のTypeScript 6.0.3はpeer導入であり、採用版確定の根拠にはしない。現在の公式資料で新しいcompilerの案内があっても、固定Next/Nextraへの互換確認を省略しない。Nextraの型定義が存在することから、独自AST変換や音声の型付けまで自動で成立すると推定しない。

## 未確認事項と適用状態

- 最低対応Nodeの型除去、`.mjs`互換入口から`.mts`、テストglob、子プロセスの組合せはP0で実行する。
- 固定Next/NextraとTypeScript 6/7系の適合、clean checkoutでの`next typegen`、生成JSONの取得順、型エラー件数はP0で測る。
- ブラウザー、実Agentフック、実機Safari、GitHub操作、Pages公開は今回の調査で再検証していない。
- 適用先は計画・調査・作業記録のみ。学習記事、製品コード、依存定義、生成物への適用はない。
