# iPhone 幅でのモバイルメニュー表示修正

## 作業範囲

- 依頼: iPhone でハンバーガーメニューを開くとスタイルが崩れる問題を確認し、修正します。
- 適用規約: ルート `AGENTS.md`、`CONTRIBUTING.md` のサイト変更・提出前チェック、`project/README.md` の記録配置。`ROADMAP.md` の作業入口から既存サイトの保守として扱います。
- 所有ファイル: 原因がある `website/` の手書きスタイルまたはコンポーネント、必要な `website/tests/browser/` の回帰試験、本記録、`project/README.md`。生成物は生成コマンドから更新します。
- 検証: 修正前のブラウザー再現、修正後の iPhone 相当の画面幅での開閉・スクロール・遷移、デスクトップ表示、`npm ci`、`npm run check`、サイト単体試験、公開相当のクリーンビルド、ブラウザー試験。
- 終了条件: 再現原因に対応した修正、実施した検証と残る実機確認の区別、再開可能な記録。
- 許可根拠: 初回の「確認して修正してください」に基づきローカル調査・変更・検証を実施しました。後続の「マージまでお願いします」に基づき、作業ブランチの push、PR 作成、CI 確認、マージと公開反映確認まで進めます。

## 原因と修正

初期の Git 作業ツリーに変更はありませんでした。公開サイトのホームを Playwright の iPhone 13 設定で開き、メニューボタンを押しました。ライト・ダークの両方で本文とメニューが重なる症状を再現しました。

- `--nextra-bg` が未定義で、`.nextra-mobile-nav` の計算済み背景色が `rgba(0, 0, 0, 0)` になっていました。[実測値](evidence/mobile-menu/public-before.json)、[ライトの修正前画像](evidence/mobile-menu/public-before-light.png)、[ダークの修正前画像](evidence/mobile-menu/public-before-dark.png)を保存しました。
- インストール済み Nextra の実装では `Head` が背景色などの CSS 変数を定義します。サイトの `website/app/layout.jsx` にはこの部品がありませんでした。
- 同ファイルに `nextra/components` の `Head` を読み込み、`html` 直下に `<Head />` を追加しました。この版では `Head` 自体が `head` 要素を返します。[公式の root layout 例](https://nextra.site/docs/docs-theme/start)とも照合しました(確認日: 2026-09-13)。
- 追加した回帰試験が、Chromium の 375px 幅の記事ページで横溢れも検出しました。非表示の `.glossary-term-popover` が右端 458.75px まで伸び、ページと固定メニューの幅が 459px になっていました。`visibility: hidden` のボックスもページ幅へ影響していたため、`website/app/docs.css` で非表示時を `display: none`、hover・キーボードフォーカス時を `display: block` に変更しました。説明の表示機能は維持し、フェード表示は廃止しました。
- `website/tests/browser/mobile-menu.spec.mjs` に 375・390・430px の両テーマを含むモバイル 6 ケースと、デスクトップ 1 ケースを追加しました。背景の不透明性、画面内への収まり、開閉・スクロール・遷移、非表示の説明枠の横溢れと説明表示の維持を検査します。

## ローカル修正時点の検証結果

- ルートとサイトの `npm ci`: 成功。サイトは初回に一時的な `EBUSY` が発生し、再実行で成功しました。
- `npm run check`: 再実行で成功(436 件成功、環境条件による skip 1 件)。初回はビルドとの並行実行中に既存の PowerShell エンコーディング試験 1 件がタイムアウトしました。検査の省略や timeout の変更はしていません。
- サイト単体試験: 61 件成功。
- 公開先と同じ `/ai-agent-library` の静的クリーンビルド: 最終コードで成功。ルート網羅 223/223、230 HTML の本文スキップ先、16 セクションへの導線を検査しました。
- Chromium の全体ブラウザー試験: 94 件成功、音声の専用 fixture ビルドだけで動く 5 件は skip。検索・記事遷移・公開記事の Mermaid 描画も含みます。専用 fixture の音声再生試験は今回実施していません。
- 最終のメニュー試験: Chromium・WebKit ともに 7 件成功。WebKit の通常リンクへの Tab 移動方針を前提にしないよう、デスクトップの説明表示試験はキーボード操作後に対象へフォーカスを設定して検査します。Chromium 全体試験の後にこの試験手順だけを調整し、メニュー試験を両方で再実行しました。
- 独立レビュー: テーマ初期化、既存メタデータとの整合、説明枠の非表示・表示変更に阻害事項なし。静的なコードレビューです。
- ブラウザー検証は Windows 上で行います。iPhone 実機の Safari 確認は未実施です。
- 記録の Markdown lint、相対リンク検査、`git diff --check`: 成功。
- 初回のローカル修正段階では外部公開を実施していません。後続の提出は次節に記録します。

## GitHub 提出

- 対象: `pero3dev/ai-agent-library`、公開リポジトリ、base は `main`。remote と公開範囲を実 GitHub で確認しました。
- 元 HEAD と取得済み `origin/main`: `3de7b1f521adf766c7d90cf2fa867c526cc44dc7`。依頼に対応する既存 PR はありませんでした。
- 所有パス: `website/app/layout.jsx`、`website/app/docs.css`、`website/tests/browser/mobile-menu.spec.mjs`、本記録と `evidence/mobile-menu/`、`project/README.md`。
- 作業ブランチ: `fix/mobile-menu-theme`。他の worktree とブランチを共有しません。
- 終了条件: 最終差分の独立レビュー、commit・PR・squash の共通形式検査、必須 CI 成功、実マージ SHA の検査、main の CI と公開サイトでの修正確認。

## 表示確認と再確認手順

最終ビルドを Windows 上の WebKit で開き、[ライトの修正後](evidence/mobile-menu/local-after-light.png)、[ダークの修正後](evidence/mobile-menu/local-after-dark.png)、[デスクトップの記事](evidence/mobile-menu/local-after-desktop.png)を目視確認しました。メニューの背景はライトで `rgb(250, 250, 250)`、ダークで `rgb(17, 17, 17)` となり、本文との重なりはありません。[修正後の実測値](evidence/mobile-menu/local-after.json)を保存しています。

PowerShell での再確認コマンドです。各コマンドは `website/` から実行します。

```powershell
$env:STATIC_EXPORT = '1'
$env:NEXT_PUBLIC_BASE_PATH = '/ai-agent-library'
$env:NEXT_PUBLIC_SITE_URL = 'https://pero3dev.github.io/ai-agent-library/'
npm run build:clean
npx playwright install chromium webkit
npm run test:browser
npm run test:browser -- mobile-menu --browser=webkit
```

実機確認では、ホームと記事ページを開き、ライト・ダークでメニューの開閉、メニューのスクロール、タグなどへの遷移を確認します。今回の実装は非表示の用語説明による横溢れを修正するもので、説明を表示中の狭い画面での位置調整までは変更していません。
