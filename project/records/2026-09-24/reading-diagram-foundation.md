# P0 — 読書図解の共通基盤と基準作

開始日: 2026-09-24。状態: **P0公開受入完了（2026-09-24 04:22 JST）**。途中の検証記録は履歴として保持し、最終結果を末尾に追記する。

## 作業と分担

[展開状況の作業契約](dynamic-diagram-rollout.md#作業契約)に従い、DD-00〜DD-05を実施する。

- 共通外枠担当: ReadingFigure・ReadingStep、操作状態、表示CSS、自己注意の移植。
- 登録担当: registry、本文対応とダイジェスト、無効化、安全なMDX登録、網羅状況、対応単体試験。
- 主担当: 新規2図の意味モデル・シーン、ブラウザー試験、絵コンテ、記録、統合・公開。
- レビュー担当: 原文と意味の対応、最終実装の読み取り専用レビュー。

## 絵コンテと本文対応

| 図 | 段階と静止時の姿 | 原文との対応 | 重要な制約 |
| --- | --- | --- | --- |
| 自己注意 | 入力→Q/K/V→スコア→因果マスク→重み→Vの加重和。固定した座標と行選択を保つ | Transformer記事「自己注意の数式」、既存の5本文ステップと6描画段階 | 単一ヘッドの説明用データ。既存の式・計算値・丸め・原文を維持 |
| Agentループ | コンテキスト→モデル呼び出し→応答の解釈→アプリによるツール実行と結果追記→停止判定。同じノード間で情報と制御の経路を強調する | 「詳細: 1 イテレーションの分解」の5項目。番号付きリストを保持して各項目内部を段階に対応 | 最終応答・生成上限・拒否・不正応答・継続可能な停止はツール実行を通らない。ツール要求がないだけで正常完了にしない |
| Workflow比較 | 手順の決定主体→トレードオフ→構成の選択→ハイブリッド→移行可能な境界。固定手順とモデルが決める経路を同じ配置で比較する | 本文の5つのH3。表・判断フロー・2種類のハイブリッド・移行の順序を保持 | 固定度を能力や品質の順位にしない。架空の点数・コスト値・成功率を追加しない |

## 主要論点の扱い

| 記事 | P0で扱うもの | 後続で確認するもの |
| --- | --- | --- |
| Transformer | 公開済みの自己注意を共通基盤へ移す | 埋め込み・出力ヘッド、位置表現、Multi-Head、FFN、残差・正規化等の主要論点はP1の本文対応表で補う |
| Agentループ | 1周の5段階と、応答に応じて分岐・終了・継続する経路 | 停止条件の全系統、失敗の返却、履歴増加、実装判断と擬似コードはP2で全体の割当・受入を判定 |
| Workflow比較 | 本文5節の主要な関係・比較を図示する | 実務上のアンチパターン・チェックリストは既存本文で読めることを確認し、P2で記事全体の完成基準を判定 |

P0の基準作完成を3記事の全対応完成とは数えない。今回は異なる形式で、共通操作・読書連動・本文保持・意味の正確さを受け入れる。

## 検証・公開

画面外停止、拡大時のフォーカス、noJS・印刷、低いPC画面、本文更新の検出と個別無効化を必須確認とする。

### 実装と内容レビュー

- 共通外枠は段階数を固定せず、自己注意6段階と新規2図の5段階に対応。本文の番号付きリスト・表・数式・Mermaid・見出しをASTの包装で保持する。
- 台帳は描画範囲の `headings` と意味依存元の `sourceHeadings` を分離した。Agent図は描画する1節に加えて停止条件・ツール失敗・履歴の3節もダイジェストに含める。本文変更時の同期停止と、個別無効化による原文への復帰を単体検証した。
- 初回の独立した静的レビューは `approved / low risk`。指摘された非ツール応答の見出し・式、Workflow選択時のSVG代替説明、Agent図の意味依存元を修正して再レビューした。公開・実画面の成功とは区別する。
- 共通入口から各図をSSR有効のまま `React.lazy` で遅延読み込みする。重要なCSSは静的に読み込む。AgentとWorkflowは描画・意味モデルを分割し、共通SVG部品のみ共有する。
- 読書ステップとContextを軽量な入口に置き、図の通信失敗は局所的なエラー境界で捕捉して本文へ復帰する。sceneと共通描画部の通信失敗を実chunkの遮断で検証する。
- 目次はサーバーで生成した見出しを共通Contextで渡し、最初の登録図の直前で遅延描画・エラー境界の外に表示する。初回HTMLから幅を確定し、図の読み込み中・失敗時・JavaScript無効時にも目次を使用できる。

### 中間検証

| 対象 | 結果と範囲 |
| --- | --- |
| 依存準備 | ルート・websiteとも `npm ci` 成功。依存追加なし |
| リポジトリ | `npm run check` 成功。単体455件中454成功・1 skip、文書・リンク・ハーネス検査成功 |
| サイト単体 | 126件成功。本文保持、意味モデル、安全性、時計、ダイジェストと無効化を含む |
| 最初の静的ビルド | 成功。公開223ルート、230 HTMLのスキップ先、16章の入口を検証 |
| 中間の画面採取 | Edgeで18画面条件・96段階、54 PNG、印刷PDF3本、noJS3件。横overflowと枠外操作なし。1440・1280・1920幅の明暗を確認 |
| 中間のブラウザー回帰 | 数式26件成功。その他の試験と実時間計測から下記の修正を実施し、最終結果は再検証待ち |

中間測定で、最初のrAF時刻がeffect内の時刻をわずかに下回り再生が止まる問題を検出した。経過時間を0以上に制限した。また図なし記事への全図コード配信、hydration後の目次退避による本文幅変更、小さな履歴ラベルを修正した。試験の仮想時計はアプリ初期化前から導入し、遷移中の時計原点の変更による巻き戻りを避ける。

ローカルなSuspense境界は静的出力に隠れた本文を残すため設けず、ページのサーバーレンダリングで図を解決する。[Reactのlazy](https://react.dev/reference/react/lazy)と[Next.jsの遅延読み込み](https://nextjs.org/docs/app/guides/lazy-loading)を参照しつつ、採用可否は実際の静的出力とnoJS試験で判定した。読み込み途中の見た目と、図の通信失敗を同じ状態として扱わない。

最終候補の意味・コード・更新運用の独立レビューは `approved / low risk`、必須修正なし。修正後の静止表示・通信失敗7件も成功。独立レビューの判定は、以下の実行結果や公開確認とは別の証拠として扱う。

### 確定ビルドのローカル検証

2026-09-24 03:23 JST時点。公開相当の `build:clean` が成功した最終候補（作業上の呼称 `build-release`）を対象とした。監査の保存先名は `build-ssr`。中間候補の `final`・`build-lazy` の数値を最終結果へ流用していない。

| 対象 | 最終候補で確認した結果 |
| --- | --- |
| Edgeの全ブラウザー回帰 | 163件中158成功・5 skip。skipは専用音声fixture用で、成功数に含めない |
| Windows WebKit | 自己注意・共通操作・通信失敗・数式の65件成功（4.6分）。物理iPhone Safariとは区別する |
| 表示の追加監査 | 3図×2画面条件の6条件、全32段階で本文と図の二列表示、ページ横あふれなし、操作部の図枠外へのはみ出しなし、縮小モーション時の即時切替を確認 |
| 目視 | 最終PNG4枚を採取。自己注意1440・Workflow1440・Agent1280の3枚を目視し、文字や要素の重なり・横方向の欠けがないことを確認 |
| 低いPC画面 | 1280×720では図の固定表示を解除。下部の再生操作は初期viewportより下にあるが、通常スクロールで到達する |
| 読み込み時のCLS | 3図の記事と図なし対照記事の4ページすべて0。クリック・プログラムによるスクロールなし、scrollYとスクロールイベント数もすべて0 |
| JavaScript無効 | 3図とも本文・静止図・段階一覧を表示。記事内目次はそれぞれ19・17・15リンクで使用可能、native detailsの開閉ができ、動的操作は無効 |
| 資産分離 | 図なし対照記事にscene・共通描画部を含む重いchunkの配信なし。各図の記事は当該図のchunkのみを取得 |
| 通信・エラー | 予期しないconsoleエラー0、捕捉したHTTP 4xx/5xx応答0、不存在のpreload JavaScript 0。既知のローカル `/favicon.ico` 404のconsole記録1件は別計上 |
| 終了処理 | 監査用4205サーバーを終了し、接続拒否を確認 |

`requestfailed` はHTTP応答と分けて保存した。内訳はページ遷移・context終了に伴う `net::ERR_ABORTED` のfetch 122件と、JavaScript無効の3contextにおけるscript preloadの `csp` 3件。これらをHTTP成功やゼロ件へ置き換えていない。

この候補の実時間測定は次のとおり。応答は段階ボタンクリックから最初のrange値変更まで、フレーム間隔は再生中のrAF間隔であり、GPUの描画完了時間ではない。再測定時にスクリプトを再確認し、応答の定義を当初記録の「再生クリック」から訂正した。

| 図 | 初回応答 | rAF間隔P95 / 最大 | 5.5秒間のphase | 画面外停止 |
| --- | --- | --- | --- | --- |
| 自己注意 | 18.5 ms | 20.8 / 34.7 ms | 0.03 → 1.25 | 成功 |
| Agentループ | 14.1 ms | 7.1 / 13.9 ms | 0.01 → 1.24 | 成功 |
| Workflow比較 | 13.3 ms | 7.1 / 20.9 ms | 0.01 → 1.24 | 成功 |

### 資産容量の測定範囲

実際に取得したJS応答本文をNode.jsの `gzipSync` の既定設定で圧縮した。ローカルサーバーは非圧縮配信のため、以下はHTTP転送量の実測ではない。また、関係のないコードを含むchunk全体の合計による保守的な上限であり、図解moduleだけの純増分ではない。共通描画部は各sceneのchunkに重複配置される場合があるため、入口とscene側を分けて記録する。

| 配信単位 | chunk名 | 応答本文 | gzip相当 |
| --- | --- | --- | --- |
| 軽量入口を含む共通chunk（図なし記事にも配信） | `0a_1isr4c2u7g.js` | 59,502 B | 21,124 B |
| 自己注意scene・共通描画部 | `0sadaiwxvvih8.js` | 20,401 B | 7,652 B |
| Agentループscene・共通描画部 | `0filogt1tv18r.js` | 21,367 B | 7,900 B |
| Workflow比較scene・共通描画部 | `30cdvo22kwtjh.js` | 23,998 B | 8,482 B |

共通chunkと当該scene側を合算したgzip相当の上限は、自己注意28,776 B、Agentループ29,024 B、Workflow比較29,606 B。サイト全体のJS総量ではない。

### 再現条件とビルド識別

- Windows、Node.js `v24.16.0`、Playwright Chromiumの `msedge` channel、Edge `153.0.4234.48`、headless、deviceScaleFactor 1。ローカル静的HTTP、通信・CPUの制限なし。同時に主担当が4183でブラウザー回帰を実行しており、厳密な専用機ベンチマークではない。
- CLS: ページごとにキャッシュを共有しないcontextを作成し、1440×900・light・`reducedMotion: reduce` で `load`、`document.fonts.ready`、実時間5秒の順に待つ。クリック・スクロールをせず、直近入力のないlayout-shiftを、間隔1秒以内・合計5秒以内のsession windowで合計し最大値を採る。プログラムで読書位置へ移動した後の値と混ぜない。
- 表示: 1440×900と1280×720、light、縮小モーションあり。フォントと既存Mermaidの `svg .nodes` を待ち、対象位置へ移動して2回のrAF後に採取する。Mermaidの遅延描画とブラウザーのscroll anchoringを、読書同期の誤動作と混同しない。
- 実時間: 1440×900、縮小モーションなし、native `performance.now` とrAFを使用する。仮想時計を導入しない。再生クリックから5,500 ms測定し、最初のrAF間隔を除外したP95・最大値、phaseの進行、pageerrorの有無、画面外停止を記録する。
- noJS: 1440×900、`javaScriptEnabled: false` のcontextで、記事内目次・本文・静止段階とnative detailsを確認する。
- 最終監査はlightの2画面条件に限定。明暗・1920幅・印刷PDFの中間採取を、最終ビルドの追加性能監査として数え直さない。ブラウザー回帰の範囲は上表と試験正本に従う。

Next.js BUILD_IDは `-Hmy_ZhTBAYD1skVFF2WE`。開始時と終了時にBUILD_IDと以下の静的HTMLのSHA-256が一致した。

| `website/out/` からの相対パス | SHA-256 |
| --- | --- |
| `docs/llm-internals/transformer-architecture.html` | `ce268125a6da5b6d1c2e94013a56b4a756d2860e1d1f20ae21be8bd3c6d5215f` |
| `docs/concepts/agent-loop.html` | `5c7f3dac60e75f41f85ba5389134b49845e69b9a524d8b30942800847c53f033` |
| `docs/architecture/workflow-vs-agent.html` | `9f39bcf9feb371cd7312a005f04d8fe4ffff73f2e7ed7f32ece3d9a39bcb9bce` |
| `docs/llm-internals/attention-variants-and-long-context.html`（図なし対照） | `a619fe0dd55461f343a928a0379fe5727574728cc41869a7bd210719abbc6e51` |

ローカル証拠の保存先は `C:\Users\81906\AppData\Local\Temp\codex-reading-figure-audit-20260924-023701\build-ssr`。`audit-build-ssr.mjs` が再現用スクリプト、`audit-chromium.json` が測定全文、`summary.json` が集計、PNG4枚が表示証拠。TEMP内の証拠はリポジトリ配布物ではなく、この記録に結果・測定条件・識別子を残す。

再測定するときは、上記のスクリプトを新しい専用一時ディレクトリへコピーしてから次を実行する。スクリプトは自身のディレクトリに結果を保存し、`website/scripts/serve-export.mjs` の一時コピーを4205で起動・終了する。既存証拠を上書きせず、再ビルドした場合は新しいBUILD_IDを別の測定として扱う。

```powershell
$env:AUDIT_REPO = 'C:\dev\ai-agent-library'
$env:NEXT_PUBLIC_BASE_PATH = '/ai-agent-library'
$env:AUDIT_BROWSER = 'chromium'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
node '<新しい一時ディレクトリ>\audit-build-ssr.mjs'
```

### 未完了の確認と作業窓

Windows WebKitの対象65件まで完了した。今回のP0変更のPR・CI・マージ・Pages・公開URLでの確認は未完了。物理iPhone Safariは未検証で、Windows上のWebKit結果で代替しない。公開受入前であり、制作済み3図を全記事対応完了に数えない。

計画の性能目標（共通部100 KiB・記事固有75 KiB、CLS 0.05以下、操作応答200 ms以下、代表PCのrAF間隔P95 32 ms以下）をP0の継続基準として採択する。今回のchunk全体による上限測定でも容量目標内だった。上記の環境での観測値であり、全端末・通信条件の保証ではない。後続で記事内の図数が増えた場合は記事単位の総量を再測定する。

ファイル作成時刻02:17から、この更新の基準時刻03:23まで約1時間6分（2026-09-24 JST）。これは並列実装・修正・待機を含む作業窓の参考値であり、人時・図1本の制作時間・全199記事の見積ではない。

次の制作単位は [LLM記事の絵コンテ](llm-diagram-storyboards.md)。3記事・全31見出しの割当を保存し、P0受入後に実装へ進む。

### PRの検証経過

[PR #52](https://github.com/pero3dev/ai-agent-library/pull/52)の初回CIではサイトビルド成功、ブラウザー156成功・5 skip・2失敗だった。失敗はLinux Chromiumの390幅・Workflow比較の明暗2件で、`scrollIntoViewIfNeeded` の端合わせ後にボタンのviewport比率が0.994756937となった。Windows同梱Chromiumの修正前2件では再現しなかった。

試験ではボタンと拡大図のスライダーを通常の `scrollIntoView` で中央へ移動してから、全体の可視性（ratio 1）を確認するよう変更した。枠内の幾何・ページの横あふれ・低い画面での固定解除・全体可視の条件は維持し、画面端の端数丸めと操作への到達性を分けて検証する。製品実装と確定ビルドは変更していない。修正後はWindows同梱Chromiumの全8表示条件が成功し、独立レビューは `approved / low risk`。Linuxの端数丸めは原因推定であり、修正後CIと実公開の受入は続けて確認する。

到達検査の修正はWindows WebKitの8条件でも成功し、2回目のCIでも当該2件は解消した。2回目は157成功・5 skip・1失敗で、Agentループ記事の既存Mermaidが描画を開始しないケースだった。元の試験をWindows同梱Chromiumで8回繰り返し、7成功・1失敗を再現した。

ネイティブIntersectionObserverの引数・callback・戻り値を変えずに記録する一時診断では、同じ対象の画面外（y=1119.53）→画面内（y=391.53）の2通知が一度に届いていた。`([entry])` が先頭のfalseだけを読み、後続のtrueを取りこぼしていたことが原因。対象の接続と現在のrefは一致しており、空領域の寸法や描画速度を原因とはしない。診断10回で9成功・1失敗、追加4回で3成功・1失敗で同じ条件を確認した。共通図解の可視状態にも同じ通知の束を確認した。

Mermaidは一度でも交差した通知があれば読み込みを開始し、再生中の共通図解は最新の通知を可視状態として扱うよう修正した。複数通知の一括配送は [IntersectionObserverの仕様](https://w3c.github.io/IntersectionObserver/#notify-intersection-observers)とも一致する。原状の証拠はローカルTEMPの `p0-mermaid-failure-trace.zip`、`p0-mermaid-io-3.json` に保存した。

### 表示通知修正後の候補

BUILD_ID `b4D9OrIx54Q5rylkZZkI-`。サイト単体126件と再ビルド（223ルート）が成功した。制御した通知バッチの新規3件は、修正前ビルドで全件が対応する不具合によって失敗し、修正後は全件成功。元のMermaid検査を実ネイティブ通知・スクロールのまま20回繰り返し、20件成功（52.4秒）した。制御試験とネイティブ試験を別の証拠として扱う。

製品2箇所と新規回帰試験の独立レビューは `approved / low risk`、必須修正なし。修正前の回帰証拠はTEMPの `p0-intersection-before-20260924`、修正後のログは `p0-io-batches-green.log` と `p0-mermaid-native-repeat.log` に保持する。全体回帰・再測定・実GitHub・公開確認は継続中。上段の旧BUILD_IDの測定結果を、この候補の測定済み結果として読み替えない。

### P0最終候補のローカル受入結果

対象はIO修正後の `build-io`。Next.js BUILD_IDは `b4D9OrIx54Q5rylkZZkI-`。以下の性能・資産・表示の数値は、このビルドから再採取した結果である。旧 `build-ssr` 等の測定値を流用していない。監査開始時と終了時でBUILD_IDと4ページのHTML SHA-256が一致した。

| 静的HTML（`website/out/` からの相対パス） | SHA-256 |
| --- | --- |
| `docs/llm-internals/transformer-architecture.html` | `e8234e8923b4466fe7582f68c094714bd97354c45ba2444ddb44cd255854ab34` |
| `docs/concepts/agent-loop.html` | `e880ba54d8c74950b4049fa7f504a989472cbf7ed2001240759aaa770d9fc574` |
| `docs/architecture/workflow-vs-agent.html` | `e0ee40642b21cacdc612966f08265f1e41f44bc09e524fb7cd379423ce76d2b3` |
| `docs/llm-internals/attention-variants-and-long-context.html`（図なし対照） | `ed53f243eb6220006419735e8e8f53ad7499fb478c722b7cd197bbeb13e8e170` |

主担当による最終回帰と、別ポートでの追加監査を分けて記録する。

| 検証 | 結果 |
| --- | --- |
| サイト単体・静的ビルド | 単体126件成功。静的ビルドと223公開ルートの確認成功 |
| Windows同梱Chromiumの全ブラウザー回帰 | 166件中161成功・5 skip、3.4分。skipは専用音声fixture用で成功数に含めない |
| IOの追加制御回帰 | 修正後3件成功。旧出力では同じ3件が失敗し、回帰を検出できることを確認 |
| Mermaidのnative時計による再現確認 | 20/20成功、52.4秒 |
| Edgeの追加表示監査 | 1440×900・1280×720の3図、6画面条件・全32段階で二列表示、ページ横あふれなし、操作部は図枠内、縮小モーション時の切替は即時 |
| 無操作の冷起動CLS | 3図の記事と図なし対照記事の4ページすべて0。scrollYとスクロールイベント数もすべて0 |
| 実時間再生・画面外停止 | 3図とも5.5秒でphaseが1.22〜1.23進み、画面外で停止。pageerrorなし |
| JavaScript無効 | 3図とも本文・静止図・段階一覧・記事内目次を使用可能。native detailsが開き、動的操作は無効 |
| 証拠と終了処理 | 最終PNG4枚を保存。監査サーバー4205を終了し、接続拒否を確認 |

1280×720では図の固定表示を解除する。下部の再生操作は初期viewportより下にあるが、通常スクロールで到達する。

段階ボタンの応答と、別区間で測った実時間再生を混同しない。応答は「段階ボタンクリックをhandler前に捕捉してから、最初のrange値変更まで」をrAFで観測した値である。明示的なpauseボタンの検証は主担当のブラウザー回帰側に含み、この追加監査の停止確認は画面外停止である。

| 図 | 段階ボタン応答 | 再生中rAF間隔P95 / 最大 | 5.5秒のphase |
| --- | --- | --- | --- |
| 自己注意 | 17.2 ms | 7.0 / 14.0 ms | 0.01 → 1.23 |
| Agentループ | 9.3 ms | 7.0 / 7.1 ms | 0.00 → 1.23 |
| Workflow比較 | 12.2 ms | 7.0 / 7.1 ms | 0.00 → 1.22 |

### 資産配信と容量の上限

実際に取得したJS応答本文をNode.js `gzipSync` の既定設定で圧縮した。ローカルサーバーは非圧縮配信であり、実HTTP転送量ではない。関係のないコードも含むchunk全体による保守的な上限で、図解moduleの純増分やサイト全体のJS総量ではない。共通描画部は各scene側のchunkに含まれるため、軽量入口を含む共通chunkと分ける。

| 配信単位 | chunk名 | 応答本文 | gzip相当 |
| --- | --- | --- | --- |
| 共通入口を含むchunk | `2c6k8q092mldr.js` | 59,509 B | 21,129 B |
| 自己注意scene・共通描画部 | `43trsqkc-pkws.js` | 20,417 B | 7,656 B |
| Agentループscene・共通描画部 | `417umj07mddtc.js` | 21,383 B | 7,904 B |
| Workflow比較scene・共通描画部 | `3rjx8tso82ak2.js` | 24,014 B | 8,487 B |

共通入口と当該scene側の合計上限は、自己注意28,785 B、Agentループ29,033 B、Workflow比較29,616 B。図なし対照記事への重いscene・共通描画部chunk配信は0で、各図の記事では当該図のchunkのみを取得した。

### 追加監査の測定条件と既知の記録

- Windows、Node.js `v24.16.0`、Playwright Chromiumの `msedge` channel、Edge `153.0.4234.48`、headless、deviceScaleFactor 1。静的HTTPのloopback通信、CPU・通信の制限なし。主担当の4183回帰と並行しており、専用機の厳密な性能比較ではない。
- CLSはページごとに新規contextを作り、1440×900・light・縮小モーションありで `load` → `document.fonts.ready` → 実時間5秒を待つ。クリック・プログラムスクロールをせず、直近入力を除いたlayout-shiftについて、間隔1秒以内・全長5秒以内のsession windowの最大合計を採る。
- 表示採取はlight・縮小モーションあり。フォントと既存Mermaidの `svg .nodes` を待ち、対象位置へ移動後2回のrAFを待つ。6画面・32段階を検査し、代表PNG4枚を保存した。明暗・1920幅の旧測定を、この最終追加監査に含めない。
- 再生は1440×900・縮小モーションなし。native `performance.now` とrAFを使い、仮想時計を導入せず5,500 ms測定する。最初のrAF間隔を除いたP95・最大値と、phaseの進行・pageerror・画面外停止を確認した。rAF間隔はGPU描画完了時間ではない。
- noJSは1440×900・`javaScriptEnabled: false`。目次・本文・静止段階・native detailsを確認した。Windows上のブラウザー検証であり、物理iPhone Safariは未検証。
- 予期しないconsoleエラー0、捕捉したHTTP 4xx/5xx応答0、不存在preload JavaScript 0。既知のローカル `/favicon.ico` 404はconsole記録1件として別計上した。
- `requestfailed` はHTTP応答と別に記録した。ページ遷移・context終了に伴うfetchの `net::ERR_ABORTED` 111件と、noJSの3contextでscript preloadの `csp` 3件を含む。これらを「全通信エラーなし」と言い換えない。

証拠の保存先は `C:\Users\81906\AppData\Local\Temp\codex-reading-figure-audit-20260924-023701\build-io`。`audit-build-ssr.mjs` が再現用スクリプト（ファイル名は元のまま）、`audit-chromium.json` が測定全文、`summary.json` が集計、`summarize-audit.mjs` が集計処理、PNG4枚が画面証拠である。再測定時はスクリプトを別の一時ディレクトリへコピーし、既存証拠を上書きしない。

```powershell
$env:AUDIT_REPO = 'C:\dev\ai-agent-library'
$env:NEXT_PUBLIC_BASE_PATH = '/ai-agent-library'
$env:AUDIT_BROWSER = 'chromium'
$env:PLAYWRIGHT_CHANNEL = 'msedge'
node '<新しい一時ディレクトリ>\audit-build-ssr.mjs'
```

Windows WebKitの対象42件も成功（3.3分）。ローカル結果とGitHub・公開結果は次節で区別する。

## P0のGitHub・公開受入

[PR #52](https://github.com/pero3dev/ai-agent-library/pull/52)の全CIと独立レビューを確認し、2026-09-24 04:13 JSTにsquashマージした。マージSHAは `584a379ccd56f19cc4c31162288f30880be7bb67`。取得した実commitの件名・本文・Agent/Co-authored-byが事前に検証したpayloadと一致し、形式の再検査も成功した。

[main CI run 35907828294](https://github.com/pero3dev/ai-agent-library/actions/runs/35907828294)と[Pages deploy job 107341735771](https://github.com/pero3dev/ai-agent-library/actions/runs/35907828294/job/107341735771)は成功。当該SHAに対するdeployment `6622403841` と公開先を実GitHub APIで取得した。

公開サイトの検証は2026-09-24 04:21:45〜04:22:36 JSTにEdge `153.0.4234.48`で実施し、11件すべて成功した。対象は[自己注意](https://pero3dev.github.io/ai-agent-library/docs/llm-internals/transformer-architecture)、[Agentループ](https://pero3dev.github.io/ai-agent-library/docs/concepts/agent-loop)、[Workflow比較](https://pero3dev.github.io/ai-agent-library/docs/architecture/workflow-vs-agent)、図なしの注意変種記事。

- 明暗テーマ・1440幅・1280×720で、表示と操作を確認。横あふれ0、低い画面では固定を解除し操作へ通常スクロールで到達できた。
- 3図の実時間再生が進み、停止後に位置が変わらないことを確認。JavaScript無効の3記事でも本文・数式・リスト・表・SVGと静止表示を保持した。
- 公開HTMLが参照するJS/CSS/preloadの実URL34件はすべてHTTP 200、非空、適切なMIMEだった。ブラウザーエラー・request failureは0。図なし記事の重いscene/frame配信は0。
- 代表画像4枚を保存し、公開画面を目視確認した。初回の監査器はPlaywrightがnoscriptをテキスト照合から除外するため3件失敗した。DOMのtextContentと子pの可視性を検証するよう監査器を直し、全件を再実行した。製品コードは変更していない。

証拠はローカルTEMPの `ai-agent-library-p0-public/deployment-evidence.json` と `public-2026-09-23T19-21-45-260Z/result.json`・PNG4枚。初回の検査器失敗も `public-2026-09-23T19-19-27-240Z` に保持する。SHAとの対応はGitHub API、公開内容と資産は公開URLのブラウザー・HTTPという別の証拠で確認した。

P0のDD-00〜DD-05を受入完了とする。制作開始02:17から公開確認04:22まで約2時間5分の作業窓で、待機・並列作業を含み、人時や図1本の制作速度を意味しない。物理iPhone Safari・スクリーンリーダー実機・本人の学習評価は未実施。新基準での記事全体完了は0件のままで、制作済み3図を3記事完了とは数えない。次は[Transformer1記事の制作](transformer-reading-diagrams.md)へ進む。
