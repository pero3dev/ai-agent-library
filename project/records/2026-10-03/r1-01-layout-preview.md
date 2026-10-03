# R1-01 本文を主役にする三列 — ローカルサンプル

## 作業契約

- 目的: ラウンド1の R1-01 を、実際の記事・トップページで比較できるローカルサンプルにする。
- 許可根拠: ユーザーの「R1-01のサンプルを作成、ローカルで確認できればよい」という依頼。
- 担当: Codex。ホームの限定CSSを別担当へ委任し、記事フレーム・目次・比較UI・起動・検証は統合担当が所有する。
- 所有範囲: `website/components/design/`、`website/app/layout.jsx`、`website/mdx-components.js`、`website/scripts/preview-r1-01.mjs`、`website/package.json`、`website/next.config.mjs`、この記録と `project/README.md`。
- 変更範囲: 導入部の余白、本文と左右欄の配分、現在の大見出しに属する小見出しを展開する目次。専用の起動時だけ有効にし、現行表示と提案表示を切り替える。
- 保持: 記事の原文、既存URL、検索・音声・数式・Mermaid、標準表示。
- 外部操作: 依存準備と指定公開サイトの読み取りを除き、公開・push・PR・mergeは対象外。
- 検証: lockfileで依存を準備し、ルートの `npm run check`、サイト単体試験、静的ビルド、既存の記事/数式/モバイル回帰と実ブラウザーの目次・画面幅確認を行う。
- 終了条件: ローカルURLを開けること、現行/提案を比較できること、PCと狭幅で本文と目次が成立すること、原文・生成物の正本を変更しないこと。

## 状態

2026-10-03、実装とローカル確認を完了。専用コマンドで起動したときだけ比較画面を有効にする。

## サンプル時点の確認方法

採択前のサンプルでは `website/` で次を実行した。公開用実装への昇格時に専用コマンドと比較UIを撤去したため、現在は `npm run dev` で通常表示を確認する。

```powershell
npm run preview:r1-01
```

- [トップページ](http://127.0.0.1:3210/): 導入部の上下余白を縮め、学習ルートの入口を早く見せる。
- [記事の比較](http://127.0.0.1:3210/docs/architecture/workflow-vs-agent): 左欄15rem・右欄13remにし、本文の左右余白も縮める。1440px幅で本文領域は現行約817pxから提案約913pxになる。
- 画面下の「現行」「提案」で切り替える。記事の大見出しは常に表示し、読んでいる大見出しの小見出しだけを展開する。
- 1180px未満では右目次を隠す。モバイルメニュー表示中は比較バーも隠し、音声プレイヤー表示中は比較バーをページ末尾へ移す。
- 終了は起動したターミナルで Ctrl+C。別ポートが必要なら `R1_PREVIEW_PORT` 環境変数を指定する。

## 検証結果

| 検証 | 結果・範囲 |
| --- | --- |
| 依存準備 | ルート・サイトで `npm ci` 完了。lockfileの変更なし |
| ルート単体試験 | 452件通過、3件スキップ、失敗0 |
| Markdown・記事・リンク・ハーネス | lint、validate、links、todos、check:harnessを通過。215ファイルの記事検証、451ファイル・5929リンクの内部参照検査 |
| サイト単体試験 | 73件通過 |
| 通常表示の静的ビルド | `STATIC_EXPORT=1` の `npm run build:clean` 通過。231ページ生成、Pagefind対象223ページ |
| 通常表示のブラウザー回帰 | article-layout、mobile-menu、mathの38件通過 |
| 提案表示の実ブラウザー | 1440×900と390×844で確認。現行/提案切替、本文幅の変化、H2全8件の表示、H3の節別展開、直接リンクの再読み込み、キーボードのEnter移動、モバイルメニュー、ライト/ダーク表示、ページ遷移、ページ全体の横はみ出しなしを確認 |
| 独立コードレビュー | 目次・通常表示との分離を確認。音声UIへの比較バーの重なりを指摘・修正し、修正の読み取りレビューを通過 |

`npm run check` は単体試験通過後、Next開発サーバーが自動生成した `website/CLAUDE.md` のMD041で停止した。専用プレビューでは自動生成を無効にし、この起動で生成された2ファイルだけを除去した後、残りの検査を個別コマンドで通過した。ブラウザー回帰のChrome起動とルート単体試験は、サンドボックス内のプロセス起動・realpath制約で失敗したため、同じ検査を許可済みの実行環境で再実行した。

確認画像はCodexの可視化ディレクトリに `r1-01-home.png`、`r1-01-article.png`、`r1-01-mobile.png` として保存。物理スマートフォンと音声の実再生は今回の確認対象に含めていない。公開サイトへの反映・Git提出は行っていない。

## 公開用実装への昇格

2026-10-03、ユーザーの「本番公開まで対応」という依頼により、R1-01の通常表示への採用、commit・push・PR・merge・GitHub Pages公開が承認された。

- 元HEAD・取得済みmain: `42dcee24f8b6f02ec918ab95d380433f0ecf8c86`。公開リポジトリ `pero3dev/ai-agent-library` と既存PRなしを確認し、`feat/reading-layout` で作業する。
- 所有範囲: `website/app/layout.jsx`、`website/mdx-components.js`、`website/components/home/home.css`、`website/components/mdx/article-toc.jsx`、`website/components/mdx/reading-layout.css`、`website/tests/browser/reading-layout.spec.mjs`、この記録と `project/README.md`。比較サンプル専用の未提出ファイルを撤去する。
- 通常表示へ本文幅・ホーム余白・節別目次を適用。JavaScript無効時は従来の全見出し目次を維持する。記事本文・URL・配色・書体を保持する。
- 検証: ルート検査、サイト単体試験・依存監査、公開base pathの静的ビルド、全ブラウザー回帰、新しい目次の節切替・直接リンク・遷移・JS無効時の回帰、独立コードレビュー、PR/main CIとPages deployment、公開実ブラウザー。
- 終了条件: 最終候補のレビューとPR検査通過、実merge SHAに対応するmain CIとPages deploy成功、公開トップ・記事の固有DOMと目次動作の確認。

公開用実装とローカル検証を完了した。サンプル時点の検証は上記に残す。公開状態は対象PR、mainの[CIとPages deploy](https://github.com/pero3dev/ai-agent-library/actions/workflows/ci.yml)、公開先の実確認で照合する。

### 公開用候補の検証

| 検証 | 結果 |
| --- | --- |
| ルート `npm run check` | exit 0。単体452件通過・3件スキップ、Markdown・記事・リンク・ハーネス検査通過 |
| サイト `npm test` | 73件通過 |
| サイト `npm audit --audit-level=high` | 既知脆弱性0件 |
| 静的 `npm run build:clean` | 公開base path `/ai-agent-library` で通過。231ページ生成、Pagefind/ルート網羅223ページ |
| 全 `npm run test:browser` | 128件通過・5件スキップ。実HTTPの静的出力で目次・検索・モバイルメニュー・数式・Mermaidを検証。5件は音声専用fixtureの試験で、CIの音声ジョブで別途実行される |
| 新規目次の回帰 | H2保持、H3の節切替、Enter操作、直接リンクと再読込、クライアント遷移、JavaScript無効時の全見出し目次を通過 |
| 独立コードレビュー | 本文・URL・音声Provider・数式・モバイル・SSR/クライアント境界・購読解除・試験設計の範囲で承認。重大指摘なし。レビュー自身は試験実行・公開確認の証拠ではない |

ルート検査・ブラウザー起動は前述のOS境界を避けるため許可済みの実行環境で行った。物理スマートフォンの確認は未実施。
