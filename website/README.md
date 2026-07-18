# website — ドキュメントサイト(Nextra)

`docs/`(正本)を取り込んで公開する [Nextra](https://nextra.site/) ベースの静的サイトです。
設計の詳細は [../WEBSITE-PLAN.md](../WEBSITE-PLAN.md) を参照してください。

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

## 生成物と正本の対応

| パス | 位置づけ |
| --- | --- |
| `content/` | sync 生成の記事 MDX(git 管理外) |
| `generated/` | `sections.json` / `glossary.json` / `tags.json` / `routes.json`(git 管理外) |
| `out/` | 静的エクスポート(git 管理外) |
| `content-src/` | 手書き上書きページ(**唯一の手編集対象**。同名は手書きが勝つ) |

## パイプラインの安全装置

- **CRLF 正規化**: 読込時に LF へ正規化(`.gitattributes` でも作業ツリーを LF に統一)
- **未解決リンク / 読込失敗**: `sync` が `exit 1`(不完全な公開物を防ぐ)
- **MDX ガード**: 生成 MDX を再パースし、`TodoCallout` / `PracticeSection` / `GlossaryTerm`
  以外の JSX・`import`/`export`・`{式}`・生 HTML を検出したらビルドを失敗させる
- **draft ゲート**: `status: draft` は既定で除外。`INCLUDE_DRAFTS=1` で開発時のみ含める
- **ルート網羅チェック**: `generated/routes.json` の期待ルートが `out/` に全て生成されたか postbuild で照合

## 公開ビルドの環境変数(CI)

| 変数 | 意味 |
| --- | --- |
| `STATIC_EXPORT=1` | 静的エクスポート(`out/` を生成) |
| `NEXT_PUBLIC_BASE_PATH` | サブパス配信のベースパス(例: `/ai-agent-library`) |
| `NEXT_PUBLIC_SITE_URL` | OG タグの絶対 URL 解決に使う公開 URL |

デプロイの有効化手順は [../.github/workflows/ci.yml](../.github/workflows/ci.yml) の冒頭コメントを参照してください。
