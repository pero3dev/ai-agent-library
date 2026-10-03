# サイトレビュー Issue #157–160 の修正

作業日: 2026-10-03(日本時間)。依頼は GitHub の全 Issue を自律的に Close に向けて進めること。担当範囲は日本語検索、操作部品の名前、文字コントラスト、用語説明の操作。

## 作業契約

- 入口: [AGENTS.md](../../../AGENTS.md)、[ROADMAP.md](../../../ROADMAP.md) の現行入口、[CONTRIBUTING.md のサイト規約](../../../CONTRIBUTING.md#サイトwebsiteを変更するとき)、[website の検証手順](../../../website/README.md)。
- 所有: `website/` の該当実装・テスト、必要な package.json / package-lock.json、本記録。website README / operations と project 索引、Git / GitHub 書き込みは統括担当。
- 正本と生成スクリプトを編集し、content / generated / out / .next / public/_pagefind を直接修正しない。他者の変更を戻さない。
- 順序: #157 と、#158 → #159 → #160。終了条件は対象検索語の結果・遷移・キーボード、light / dark と 375 / 1440px の対象 axe 違反 0、用語説明の pointer / focus / Escape / 狭幅・拡大・リンク遷移の通過。
- 検証: website `npm ci`、`npm test`、公開 basePath の `npm run build:clean`、ブラウザー回帰。実ブラウザー・静的検査・公開確認を区別する。独立レビューと PR 全 CI・公開確認は統括担当へ引き渡す。
- 外部操作: 調査の読み取りと依存準備はユーザー依頼の遂行に必要な通常作業。Issue 本文自身を外部書き込みの許可根拠にしない。

## 調査と修正

開始時のレビュー HEAD は `d990973c2c02b6108cd9911fc06e45b3a29f9332`。以下は未 commit の修正作業ツリーをローカルで検証した記録であり、PR / 公開環境の確認とは区別する。

### #157: 日本語タイトル検索

修正前の 223 ページ索引を実 Edge の Pagefind API から読むと、「プロンプトインジェクション」は 0 件だった。同じ索引で「プロンプト インジェクション」は 34 件になり、対象記事が先頭に出た。Node / Edge の `Intl.Segmenter('ja', { granularity: 'word' })` は、空白のない語を `プロ / ン / プ / トイ / ン / ジ / ェ / ク / ション` に分割した。[Pagefind の多言語検索](https://pagefind.app/docs/multilingual/)では索引の日本語分割とブラウザーの検索語分割を別の実装で行うため、この語での分割の不一致を修正の対象とした。

タイトルだけの小さな HTML fixture と対象記事単体の索引では 1 件になり、元の 0 件は再現しなかった。したがって、単語だけの fixture を再現成功とは数えない。実サイトの全索引を保持した前後比較と、実ブラウザーの検索・結果リンク・キーボード回帰を根拠にする。Pagefind 内部の全トークン生成過程を解析し終えた、という主張も行わない。

`postbuild.mjs` は Node API で HTML を読み、すべての日本語 h1 タイトルに Intl の分割語を `data-pagefind-index-attrs` で索引へ追加する。特定の検索語を埋め込まず、英語のみのタイトルは変更しない。別名は索引へ渡すメモリ上のコピーにだけ追加し、出力 HTML のタイトル・記事本文を変えない。従来の検索 UI とリンクを維持した。

| 検索語 | 修正前の結果件数 | 最終索引の結果件数 | 修正後の確認 |
| --- | ---: | ---: | --- |
| プロンプトインジェクション | 0 | 1 | 対応記事を含む。API・クリック・ArrowDown / Enter が通過 |
| コンテキストエンジニアリング | 40 | 40 | 同上 |
| ツール使用 | 69 | 69 | 同上 |
| MCP | 39 | 40 | 同上 |
| Agent | 199 | 200 | 同上。大量結果でのスクロール・クリックと選択候補の Enter 遷移も通過 |

公開 basePath `/ai-agent-library` を API の `baseUrl` に明示し、UI が出す結果リンクにもその接頭辞があることを検査した。Control+k の検索フォーカスも通過した。デスクトップと非表示のモバイル用検索 input が併存するため、回帰は表示中の検索 input を選ぶ。また、ArrowDown が選ぶ候補の `aria-activedescendant` と実際の href を取得して Enter の遷移先を検査し、結果グループ全体の URL と見出し候補の URL を混同しない。

### #158: チェック項目・テーマ・記事利用操作の名前

チェック項目を生成する remark 処理で、元の項目のインライン内容を `ChecklistBox` へ渡した。チェックボックスは一意な ID を持つその本文へ `aria-labelledby` で結び、元の checked 状態を保持する。全項目を同じ汎用名へ置き換えず、Space の選択とフォーカスを検査した。

テーマ操作をサイト所有の native select に変更し、名前を「表示テーマ」、選択肢を「ライト / ダーク / システム設定」にした。保存されたテーマから現在値を表示し、next-themes の provider を維持した。ArrowDown / Enter で light から dark に切り替わり、現在値とフォーカスが保持されること、system 値へ戻せることを実 Edge で確認した。

調査時に、Issue の button-name 1 件の説明はテーマ操作と一致していなかった。実 DOM で名前のない button は Nextra の記事利用メニューだったため、これもサイト所有の操作に置き換えた。「記事をコピー」button と「記事の利用方法」select は Markdown コピー、ChatGPT、Claude の既存経路を保持する。実 clipboard の原文コピーは確認済み。メニューは `selectOption` で操作し、`window.open` の stub により固定 URL、現在記事 URL、`_blank` と `noopener,noreferrer` を検査した。この検査は OS の選択ポップアップでの Enter 操作や、外部サービスでの記事読み込み成功の証明ではない。外部サービスへ実際の送信は行っていない。

tool-use / agent-loop / workflow-vs-agent の各ページを light / dark、375 / 1440px で監査し、label / button-name 違反は 0。各 checkbox のアクセシブル名が、その項目本文に対応することも検査した。

### #159: 共通の補助色とリンク識別

共通色 `--site-text-secondary` を light `#62626c`、dark `#b4b4be` とし、concept-english、doc-meta-updated、glossary-card-english、dep-node-count、dep-panel-hint、tag-chip-count、tag-title-count などに適用した。通常文字の基準 4.5:1 を共通定義で満たす。dark の主 button はラベンダー背景に暗い文字を使い、home の route-more リンクには通常時から下線を付けた。hover / focus とフォーカス枠を保持した。

追加の incomplete 要素確認で、React Flow の attribution link に `#999` と半透明の白背景が残っていた。light の比率は約 2.7:1 であり、#159 の roadmap に含まれるため、表示名・リンクを保持したまま共通の補助色と不透明の light `#fff` / dark `#18181b` 背景に修正した。回帰の実色サンプルにもこの要素を加えた。

対象 `/`、`/docs/concepts/tool-use`、`/glossary`、`/roadmap`、`/tags`、`/audio` × light / dark × 375 / 1440px の 24 条件で、color-contrast / link-in-text-block 違反は 0。各表示要素の計算済み文字色と実際の祖先背景色を採取し、比率が 4.5 以上であることも別に検査した。axe の violations と incomplete、色サンプルはブラウザー JSON report の attachment に残す。

| 用途 | 計算済み文字色 | 実背景色 | 比率 |
| --- | --- | --- | ---: |
| light 補助文字 | `rgb(98,98,108)` | `rgb(250,250,250)` | 5.78:1 |
| light 補助文字 | 同上 | `rgb(255,255,255)` | 6.03:1 |
| dark 補助文字 | `rgb(180,180,190)` | `rgb(17,17,17)` | 9.18:1 |
| dark 補助文字 | 同上 | `rgb(24,24,27)` | 8.62:1 |
| dark 補助文字 | 同上 | `rgb(30,30,30)` | 8.11:1 |
| light 主 button | `rgb(255,255,255)` | `rgb(79,70,229)` | 6.29:1 |
| dark 主 button | `rgb(24,24,27)` | `rgb(129,140,248)` | 5.94:1 |

375 / 1440px で同じ色と背景の算定値を取得した。`/audio` は対象補助色 selector のサンプルが 0 件であり、色サンプルがあるページへ置き換えて数えない。ページ全体の対象 axe 監査には含める。

axe 4.13 の color-contrast は各条件で `getCellFromPoint` の内部例外や判定できない背景を incomplete に返した。違反 0 と incomplete 0 は別であり、無例外で完走したとは記載しない。incomplete の要素だけを再取得し、実計算済み色と祖先の背景を canvas の sRGB へ変換して半透明背景を合成し、4.5:1 の基準と照合した。CSS `lab()` を RGB の数列として扱った途中の誤算定値は採用しない。修正後の 86 サンプルは 4.5:1 未満 0、最小 5.7621:1。React Flow の表示名は light 6.03:1 / dark 8.62:1 になった。取得時刻は `2026-10-03T07:56:18Z`、ローカル証拠は `.tmp/website-axe-incomplete-manual.json`。最終回帰の incomplete 84 要素はすべてこの計測対象に含まれ、新規の未計測 selector は 0 だった。この対象限定の補完を、全サイトの未判定箇所の網羅へ拡張しない。

home / checklist / glossary の light / dark × 375 / 1440px の 12 枚をローカル撮影し、すべてを `view_image` で目視した。4 条件とも補助文字と主見出しの階層、本文リンクの下線、チェック項目と用語リンクの焦点枠を確認した。説明は本文を一時的に覆うが文字が読め、左右へはみ出さず、Escape で本文へ戻れる操作と対応していた。

範囲外の agent-loop dark 1440 の構文強調色は追加の色検査で 7 箇所の違反が出た。このページは #158 の label / button-name 対象であり、#159 の 6 ページには含まれないため、その色を今回の合格対象に含めない。サイト全体の WCAG 適合宣言を行わない。

### #160: 用語説明の操作

pointer / focus / Escape の状態を React で管理し、Escape 後は同じ hover / focus 中に閉じたままにする。説明枠の pointer-events を有効にし、用語との隙間を CSS の hover 領域でつなぎ、領域を出ると遅延して閉じる。リンク名は用語本文、説明は一意な ID と `aria-describedby` で対応付けた。

左右の viewport 補正は getBoundingClientRect の物理座標と CSS 座標の倍率を合わせ、開いている間の resize で再計算する。独立レビューで指摘された CSS zoom 時の補正量の二重拡大と、offset=0 の resize で再計算されない問題を修正した。

375 / 1440px で hover → Escape、pointer を説明中央へ移す、領域を出る、focus → Escape、別の focus を経た再表示、説明とリンクの対応、リンク Enter が通過。さらに記事に CSS `zoom: 2` を適用し、375 → 320px / 1440 → 640px の resize 後も説明が左右に収まることを検査した。これは CSS zoom の実 DOM 計測であり、ブラウザー UI のズーム、OS 拡大、Safari / iPhone の証明とは区別する。

## 検証結果と残件

既定 npm cache の `EPERM stat` で初回 `npm ci` は失敗し、作業領域 cache の sandbox 内試行は `Exit handler never called` で終了した。依存準備を同じ専用 cache で sandbox 外に切り替えて成功し、個人設定や ACL は変更しなかった。直接依存 `next-themes@0.4.6` と監査用 `@axe-core/playwright@4.13.0` は lockfile に固定し、準備時の audit は 0 件。

| 検証 | 最終結果 |
| --- | --- |
| `npm test` | 76 passed / 0 failed / 0 skipped、exit 0 |
| `STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/ai-agent-library npm run build:clean` | 成功。223 / 223 routes、Pagefind 索引 223 pages、skip target 230 HTML、16 sections、Windows 互換 RSC segment 228 件 |
| Edge 検索の最終対象回帰 | 16 passed、exit 0。検索 5 語・クリック・キーボード・basePath を含む |
| Edge 全ブラウザー回帰 | 170 passed / 0 failed / 5 skipped、exit 0、3.8 分。2026-10-03T07:55:19.474Z 開始、225142.642ms |
| axe incomplete 対象の実色補完 | 86 サンプル、4.5:1 未満 0、最小 5.7621:1。lab 色を sRGB へ変換、背景 alpha を合成して算定 |

初回の全ブラウザー試行と途中の対象試行は、sandbox 内で個別結果を出した後、Windows の終了処理が戻らなかったためその試行を中断した。中断された実行を成功扱いにしない。同じテストを sandbox 外で実行し、完了した終了コードを採用する。

途中の完了した全回帰は 169 passed / 1 failed / 5 skipped。Agent の大量結果に対し、2 回目のページ読み込みで結果表示や Enter 後のクライアント遷移が既定 5 秒の期待を超えた。検索結果の存在・リンク先や選択候補の期待は維持し、Agent だけ結果表示と実 URL の遷移を 20 秒、テスト全体を 90 秒まで待つようにした。失敗の単独切り分けでは 1 passed / exit 0、実テスト 29.9 秒だった。最終全回帰では Agent が 41.3 秒で通過し、選択 href と実 URL が一致した。Enter から遷移判定までの実測は 13696ms、他の 4 語は 148–2461ms。当該経路の Enter 後の新規 request は 0 件であり、未完了の HTTP request があったと推定しない。実ブラウザーの結果読込とクライアント遷移の待機を含めた確認で、検索の性能改善を完了したという主張は行わない。

最終 JSON report は `.tmp/website-browser-final.json`、抽出結果は `.tmp/website-accessibility-results.json` に保存した。axe 32 条件の対象違反はすべて 0、最終 incomplete は color-contrast の上記 84 要素であり、label / button-name / link-in-text-block の incomplete は 0。音声 fixture の 5 skip は通常の公開データ build で fixture を作っていないための既存条件で、実再生を成功と数えない。

公開 basePath のローカル HTTP 静的 export を Microsoft Edge / Chromium で検証した。スクリーンリーダー実機、Safari / iPhone、公開 URL はこの担当では未実施。音声 fixture の再生はサイト公開データで走る全回帰とは別の CI と音声担当が所有する。全サイト WCAG 適合、検索全語の網羅、外部 ChatGPT / Claude 成功の宣言は行わない。最終の build:clean は統括担当の openai-prompting 本文訂正を含む最新の入力から生成した。

## 変更パス

- 実装: `website/app/docs.css`、`website/app/layout.jsx`、`website/components/home/home.css`、`website/components/mdx/checklist-box.jsx`、`website/components/mdx/glossary-term.jsx`、`website/components/mdx/article-actions.jsx`、`website/components/theme-switch.jsx`、`website/lib/doc-decorations.mjs`、`website/lib/mdx-safety.mjs`、`website/lib/search-titles.mjs`、`website/mdx-components.js`、`website/scripts/postbuild.mjs`。
- 依存: `website/package.json`、`website/package-lock.json`。
- 回帰: `website/tests/unit/mdx-safety.test.mjs`、`website/tests/unit/search-titles.test.mjs`、`website/tests/browser/accessibility.spec.mjs`、`website/tests/browser/glossary.spec.mjs`、`website/tests/browser/mobile-menu.spec.mjs`、`website/tests/browser/site.spec.mjs`。
- 実施記録: 本ファイル。website README / operations と project README は統括担当の変更。

Git / GitHub の書き込みは行っていない。最終独立レビュー、root `npm run check`、PR 全 CI、公開確認、Issue Close は統括担当へ引き渡す。
