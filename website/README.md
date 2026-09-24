# website — ドキュメントサイト(Nextra)

`docs/`(正本)を取り込んで公開する [Nextra](https://nextra.site/) ベースの静的サイトです。
設計の詳細は [サイト構築計画](../project/plans/engineering/website.md) を参照してください。

- 公開先: [pero3dev.github.io/ai-agent-library](https://pero3dev.github.io/ai-agent-library/)
- 正本は `docs/`。このディレクトリのコンテンツは **生成物** で、直接編集しません

## セットアップ

```bash
cd website
npm ci
```

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `npm run sync` | `docs/` → `content/` + `generated/` を生成(`predev` / `prebuild` で自動実行) |
| `npm run dev` | 開発サーバ(sync → next dev) |
| `npm run build` | 静的ビルド(sync → next build → Pagefind → ルート網羅チェック) |
| `npm run build:clean` | `.next` / `out` を消してからビルド(**公開相当のビルドはこれを使う**) |
| `npm run clean` | `.next` / `out` を削除 |
| `npm test` | MDX 属性・静的 HTML の回帰検査 |
| `npm run test:browser` | ビルド済み `out/` のキーボード操作・検索・Mermaid をブラウザーで検査 |
| `npm run test:audio` | 専用 fixture ビルドで再生・再開・リスト・通信失敗をブラウザーで検査 |
| `node scripts/diagram-coverage.mjs` | 現行記事数・図解登録・レビュー・記事全体の受入状況を別々に集計 |

## 生成物と正本の対応

| パス | 位置づけ |
| --- | --- |
| `content/` | sync 生成の記事 MDX(git 管理外) |
| `generated/` | `sections.json` / `glossary.json` / `tags.json` / `routes.json` / `audio.json`(git 管理外) |
| `out/` | 静的エクスポート(git 管理外) |
| `content-src/` | 手書き上書きページ(**唯一の手編集対象**。同名は手書きが勝つ) |
| `audio/catalog.json` | 公開済み音声と記事の版を結ぶカタログの正本。音声本体は GitHub Releases |
| `diagrams/registry.json` | 図解ID・本文対応・意味依存元・レビュー済みダイジェスト・有効化状態の正本 |

## 本文に連動する動的図

自己注意・Agentループ・Workflow比較、Transformer・注意変種・MoE・文章生成・トークン化・推論内部・学習パイプラインの記事の図解は、`components/diagrams/reading-figure.jsx` の共通外枠で
読書位置との同期、再生・停止、段階送り、スライダー、拡大を提供します。
図の場面は記事・論点ごとのsceneに分け、対応する数値・意味モデルを単体試験で検証します。
軽量な入口から各記事に必要なコードを読み込み、静的HTMLにも図を出力します。
図の高さが画面内に収まる場合に追従させ、低い画面では通常の縦スクロールで操作できます。
縮小モーション・画面外停止・印刷・JavaScript無効時にも、本文と静止状態から読める構成です。
図解記事の目次はサーバーで生成した見出し情報を使い、初回表示から横幅を確保します。
目次と読書ステップは図のコードから独立させ、図の通信に失敗しても元の本文・数式・表を保持します。

1記事の複数図は、それぞれ独立した操作状態を持ちます。`generated/diagram-pages.json` は
実際の包装順と最初の図をsync時に生成し、記事内目次を1つだけ配置します。登録配列の順序には依存しません。

`lib/diagram-decoration.mjs` と `lib/attention-decoration.mjs` が元の本文を包装します。
見出し、アンカー、番号付きリスト、表、数式、Mermaidを維持し、本文の複製は作りません。
数式の件数・順序は `tests/browser/math.spec.mjs` が正本と照合します。

登録台帳の `headings` は図と並べる本文の節、`sourceHeadings` は図の意味が依存する節です。
後者には図の横に置かない停止条件・履歴管理なども含めます。本文の正規化ASTと参照リンク定義から
ダイジェストを計算し、`sourceDigest` と独立レビュー済みの `reviewedDigest` が一致しない場合は同期を停止します。
改行差だけでは失効させず、文言・式・表・図の意味変更を検出します。

`grouped-blocks` の `blockGroups` は、原文の各節のブロックをどの段階へ割り当てるかの固定契約です。
リストや数式を途中で分割せず、一度だけ包装します。読書位置に対応しない比較用段階は手動・再生で到達します。
最後の本文ブロックを読み終えると図の最終段階へ移ります。見出し・数値・図の意味上の段階は共通時計の中点で切り替えます。
同じ原文ASTで全図の本文版・構造を検証してから変形するため、後続図で失敗しても途中の包装を残しません。
意味依存の重複は許し、実際の包装範囲の重複・図の入れ子は拒否します。

本文更新時は、関連する図と段階対応を確認・修正し、新しいダイジェストの独立レビュー後に台帳を更新します。
図の修正を待たず本文を公開する必要がある場合は、該当IDの `enabled` を `false` にして再ビルドします。
包装を外して原文をそのまま出力し、他の記事の図解は維持します。台帳から任意のコードやモジュールは読み込まず、
ID・対応する節・コンポーネントは実装側でも許可リストを検証します。

全体の制作順・品質基準は [動的図解計画](../project/plans/engineering/dynamic-diagrams.md)、
公開確認を含む進捗は [展開状況](../project/records/2026-09-24/dynamic-diagram-rollout.md)を参照してください。
節への図解追加、記事全体の主要論点の受入、公開確認は別々に数えます。

記事全体の論点は `diagrams/articles.json` に割り当て、`lib/diagram-article-acceptance.mjs` が
本文・割当・必要な図・固定した表示コードの版と、独立レビュー・ローカル検証・公開確認の記録を照合します。
対象はTransformer・注意変種・MoE・文章生成・トークン化・推論内部・学習パイプラインの7記事です。リポジトリ直下で `node website/scripts/diagram-acceptance.mjs` を実行すると、
対象記事ごとのダイジェスト、記録の一致、未完の工程を読み取れます。`--article docs/11-llm-internals/attention-variants-and-long-context.md` で1記事へ絞れます。
コマンドは承認を書き込まず、外部サービスへ接続しません。記事固有のscene・割当・登録状態は他の記事の受入版へ含めません。
記録は過去の確認結果であり、公開サイトの現況は制作単位の終了時にGitHub・公開URLから別途取得します。
共有表示コードの変更は保守的に失効させます。GLOSSARYや音声カタログ等の共有データ、生成物、実施記録、commitは
入力ダイジェストに含めません。具体的な固定依存は上記module、受入結果は制作記録を参照してください。
文章生成とトークン化は共通入口が両方のCSSを読み込むため、その入口と両CSSを2記事の入力へ含めます。
推論内部は4図をそれぞれ遅延読み込みし、入口が静的に読む4つのCSSも記事の受入入力へ含めます。
学習パイプラインも2図を個別に遅延読み込みし、入口・2つのCSS・各図のsceneとモデルを記事固有の入力へ含めます。
サンプリング図が使う `generation-model.mjs` は文章生成と推論内部の両方の入力です。共有の明示faviconも固定入力で検査します。
`content-src` の同名上書きは記事のカテゴリに対応する `.md` / `.mdx` を監視し、追加・変更・削除でその記事の受入を失効させます。

## 音声学習

`app/audio/` の一覧、記事の再生入口、layout 配下の共通プレイヤーで音声を再生します。カタログを同期すると、公開中の記事ハッシュとの不一致は旧版表示になり、削除・非公開の記事は一覧から除外されます。音声制作・無料ツールの準備・定期実行・実機受入は [音声の運用手順](../automation/audio/README.md)を参照してください。

再生試験は `AUDIO_TEST_CATALOG=tests/browser/fixtures/audio-catalog.json` と `NEXT_PUBLIC_BASE_PATH=/__audio-test` の組み合わせでビルドします。どちらか一方だけを設定して公開ビルドへ試験音声を混ぜないでください。CI は公開出力を持たない別 job でこの試験を実行します。

プレイヤーは MP3 の形式を `<source type="audio/mpeg">` で明示します。GitHub Releases が拡張子のない URL へ転送し、`application/octet-stream` を返す場合にも、Safari の再生基盤へ形式を伝えるためです。source 要素で発生する読み込み失敗も捕捉し、再試行時は再生位置を保持して読み込み直します。

音声試験には合成した MP3 と、転送後のバイナリ形式・部分読み込み応答を使います。`PLAYWRIGHT_BROWSER=webkit` を指定すると WebKit で同じ試験を実行できます。CI の `Safari audio playback regression` は macOS の AVFoundation で実行し、Windows/Linux の WebKit とは区別します。iPhone 実機の画面ロックやイヤホン操作の受入は引き続き別に行います。

## パイプラインの安全装置

- **CRLF 正規化**: 読込時に LF へ正規化(`.gitattributes` でも作業ツリーを LF に統一)
- **未解決リンク / 読込失敗**: `sync` が `exit 1`(不完全な公開物を防ぐ)
- **MDX ガード**: 生成 MDX を再パースし、`TodoCallout` / `PracticeSection` / `GlossaryTerm` / `AttentionWalkthrough` / `AttentionStep` / `ReadingWalkthrough` / `TransformerWalkthrough` / `AttentionVariantsWalkthrough` / `MoEWalkthrough` / `FoundationsWalkthrough` / `InferenceWalkthrough` / `TrainingWalkthrough` / `ReadingStep`
  以外の JSX・`import`/`export`・`{式}`・生 HTML を検出したらビルドを失敗させる。
  許可コンポーネントでも属性式・spread は拒否し、挿入する文字列属性と値だけを許可する。段階番号は親の図IDに対応する上限で検査する
- **Mermaid の描画設定**: Nextra が生成する直接 import を、Turbopack / Webpack ともに
  `components/mdx/mermaid.jsx` へ解決する。`lib/mermaid-render.mjs` が描画ごとに
  `securityLevel: 'strict'` を指定し、Mermaid 既定の `secure` キーを維持する。
  図からのクリック処理は利用せず、記事の通常の Markdown リンクを使う。
  設定と import 経路を単体試験、実際の静的出力の図表示・テーマ変更・拡大をブラウザー試験で確認する。
  依存更新時もこの経路を維持する([Mermaid の設定](https://mermaid.js.org/config/usage#securitylevel))
- **draft ゲート**: `status: draft` は既定で除外。`INCLUDE_DRAFTS=1` で開発時のみ含める
- **ルート網羅チェック**: `generated/routes.json` の期待ルートが `out/` に全て生成されたか postbuild で照合
- **入口・本文移動チェック**: 全セクションへの本文リンクと、各 HTML の一意なスキップ先を照合

Windows で Next 16.3.4 を静的 export すると、セグメントキャッシュが
`out/roadmap/__next.roadmap/__PAGE__.txt` のような階層で生成され、ブラウザーが要求する
`out/roadmap/__next.roadmap.__PAGE__.txt` と一致しない場合があります([上流の報告](https://github.com/vercel/next.js/issues/92339))。
postbuild は実セグメント名を使ってドット区切りの配信ファイルを追加します。元ファイルと既存の正規出力は変更せず、
同名ファイルの内容が異なる場合や、出力内にシンボリックリンクがある場合はビルドを失敗させます。
Linux などで正規出力のみがある場合は何も追加しません。この互換処理は `out/` に反映するため、
ローカル検査サーバーにも公開先にも同じ成果物を配信できます。Next 更新時には回帰検査で必要性を再確認してください。

## ブラウザー回帰検査

公開ビルドの環境変数を設定して `npm run build:clean` を実行した後、同じ `NEXT_PUBLIC_BASE_PATH` を維持して実行します。

```bash
npx playwright install chromium
npm run test:browser
```

テストが `127.0.0.1:4183` に専用サーバーを起動し、終了時に停止します。Windows でインストール済み Edge を使う場合は、PowerShell で `$env:PLAYWRIGHT_CHANNEL='msedge'` を指定できます。CI は Chromium を使用します。失敗時のトレースは `test-results/` に保存します(生成物・Git 管理外)。

## 公開ビルドの環境変数(CI)

| 変数 | 意味 |
| --- | --- |
| `STATIC_EXPORT=1` | 静的エクスポート(`out/` を生成) |
| `NEXT_PUBLIC_BASE_PATH` | サブパス配信のベースパス(例: `/ai-agent-library`) |
| `NEXT_PUBLIC_SITE_URL` | OG タグの絶対 URL 解決に使う公開 URL |

デプロイの有効化手順は [../.github/workflows/ci.yml](../.github/workflows/ci.yml) の冒頭コメントを参照してください。
