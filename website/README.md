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

## 生成物と正本の対応

| パス | 位置づけ |
| --- | --- |
| `content/` | sync 生成の記事 MDX(git 管理外) |
| `generated/` | `sections.json` / `glossary.json` / `tags.json` / `routes.json` / `audio.json`(git 管理外) |
| `out/` | 静的エクスポート(git 管理外) |
| `content-src/` | 手書き上書きページ(**唯一の手編集対象**。同名は手書きが勝つ) |
| `audio/catalog.json` | 公開済み音声と記事の版を結ぶカタログの正本。音声本体は GitHub Releases |

## 音声学習

`app/audio/` の一覧、記事の再生入口、layout 配下の共通プレイヤーで音声を再生します。カタログを同期すると、公開中の記事ハッシュとの不一致は旧版表示になり、削除・非公開の記事は一覧から除外されます。音声制作・無料ツールの準備・定期実行・実機受入は [音声の運用手順](../automation/audio/README.md)を参照してください。

再生試験は `AUDIO_TEST_CATALOG=tests/browser/fixtures/audio-catalog.json` と `NEXT_PUBLIC_BASE_PATH=/__audio-test` の組み合わせでビルドします。どちらか一方だけを設定して公開ビルドへ試験音声を混ぜないでください。CI は公開出力を持たない別 job でこの試験を実行します。

## パイプラインの安全装置

- **CRLF 正規化**: 読込時に LF へ正規化(`.gitattributes` でも作業ツリーを LF に統一)
- **未解決リンク / 読込失敗**: `sync` が `exit 1`(不完全な公開物を防ぐ)
- **MDX ガード**: 生成 MDX を再パースし、`TodoCallout` / `PracticeSection` / `GlossaryTerm`
  以外の JSX・`import`/`export`・`{式}`・生 HTML を検出したらビルドを失敗させる。
  許可コンポーネントでも属性式・spread は拒否し、挿入する文字列属性と値だけを許可する
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
