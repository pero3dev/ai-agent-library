# 注意変種の記事全体の動的図解

開始日: 2026-09-24。状態: PR #54マージ・公開受入完了。P1の2番目の制作単位（1記事）。

## 作業契約

- 目的: 本文を増やさず、KV共有・計算と保存・位置の対応範囲の3図で注意変種の主要論点を追えるようにする。
- 根拠: [採択計画](../../plans/engineering/dynamic-diagrams.md)、[全体の許可と進捗](dynamic-diagram-rollout.md)、[絵コンテ](llm-diagram-storyboards.md)。既存記事の表示機能の展開であり、執筆済みROADMAPタスクの再開ではない。
- 基準: TransformerのPR #53、公開SHA `828aa492adbbc1382a68edb40f6c3c14eb3d12e0`。main CI・Pages・公開11件の成功後、最新mainから `feat/attention-variants-reading-diagrams` を作成した。
- 所有: rootはA2のscene/model/test、dispatcher・共通CSS、ブラウザー統合と実施記録。scene担当はA1/A3のscene/model/固有CSS/test。integration担当はregistry・AST・MDX安全性・記事割当/受入・対応単体試験。担当範囲を調整し、他者の変更を戻さない。
- 変更範囲: websiteの表示・本文対応・試験とprojectの記録。docsの原文・依存lockfile・生成物は直接変更しない。
- 検証: 既存lockfileで準備済みの依存を使用し、root check、サイト単体、静的export、図固有の数理/本文保持・操作/表示・障害時・性能、独立レビュー、実GitHub/Pages/公開を確認する。共有コード変更に対しTransformerも再受入する。
- 終了条件: 11 H3の主要論点の割当、3図の受入、Transformerの退行なし、対象版の公開確認が完了。全199記事の完了とは数えない。
- 外部操作: ユーザーの「順に作業を自律的に進めてください」に基づき、既存PUBLICリポジトリへのPR・CI・通常squashマージ・Pages・公開確認までを含む。有料APIや外部サービス登録を加えない。

## 確定した本文対応

リストを分割せず、原文ASTを一度だけ包装する。A1のMHA/MQAは同じ段落にあるため、共有節全体を比較段階へ対応させる。A3は位置節のみを包装し、間のSSMは外側へ保持する。後方の「対応」表記の節は意味上の依存元であり、その節への直接の読書同期とはしない。

| 図 | 段階数 | H3内の段階/本文ブロック数 |
| --- | --- | --- |
| A1 `attention-kv-sharing` | 5 | 概要: 0/2 → 1/3、KV共有: 4/4 |
| A2 `attention-compute-memory` | 6 | 疎: 0/3、線形: 1/1 → 2/2、Flash: 3/1 → 4/1 → 5/1 |
| A3 `attention-context-range` | 4 | 位置: 0/1 → 2/2 |

計6 H3・21本文ブロックを包装する。記事は11 H3・28本文ブロック（本文26、注意点2）。A1の段階2/3、A3の段階1は手動・再生で到達できる。共通時計の既存動作により、A3の段階3は位置節を読み終えたときにも到達する。

## 制作前の独立レビュー

独立担当 `p0_final_review` が本文・絵コンテと一次資料を照合した。A2の線形注意に表示範囲を明記する条件を採用し、予備判定はapproved / low。実装・数理モデル・実画像の最終承認とは区別する。

- A1: n・L・ヘッド幅・要素サイズを固定してKVヘッド数を比較し、Qヘッドと注意のトークン対数を保つ。実行中の無損失変換や性能保証として描かない。[GQA §2.2](https://arxiv.org/html/2305.13245v3#S2.SS2)
- A2・疎: 因果接続の模式図と明示し、直接接続と複数層での到達可能性を区別する。先頭保持は重要語や全履歴の保持としない。[Longformer §3.1](https://arxiv.org/html/2004.05150v2#S3.SS1)、[StreamingLLM](https://arxiv.org/html/2309.17453v4)
- A2・線形: 「本文の積の並べ替え（正規化・因果制約は省略）」と表示する。本文の積は原論文の分子部分なので、因果マスクを外して積の結果までを示す。特徴写像の幅が常に入力幅と同じとは表示しない。[Linear Transformers §3.2–3.3](https://arxiv.org/html/2006.16236v3#S3.SS2)
- A2・Flash: 同じ行の状態を次タイルへ引き継ぎ、Q/K/Vの読込と出力の書戻しを保つ。独立なタイルsoftmaxの合算、IOゼロ、線形計算量として描かない。[FlashAttention §3.1](https://arxiv.org/html/2205.14135v2#S3.SS1)
- A3: 入力トークンを保持したまま全位置を単調に再割当てし、範囲外の切詰め・丸め・統合をしない。補間や対応長を品質保証としない。[Position Interpolation §2.3](https://arxiv.org/html/2306.15595v2#S2.SS3)、[Lost in the Middle](https://arxiv.org/abs/2307.03172)

## 受入状況

実装・数理・全体回帰・独立した画像レビューが完了し、当該版の公開を続行中。Transformerの公開結果は[制作記録](transformer-reading-diagrams.md)と[PR #53時点の受入スナップショット](transformer-article-acceptance-pr53.json)へ保存した。旧受入を新しい共有コード版の承認として自動流用しない。

### 実装候補と担当外レビュー

追加3図と登録・AST・MDX安全性・2記事の受入判定を実装した。A1/A3はrootとintegration担当が作者以外としてコード・意味を確認し、A2はscene担当が本文・一次資料と照合した。registry/AST/受入は作者以外のrootが確認した。各判定はapproved / low、画像と公開は別工程。

レビューでA2のfloorによる段階判定と共通時計の中点判定の不一致、Flashの新しい行で前の行の状態を保持したように見える表示を修正した。A2を共通stageForPhaseへ合わせ、引継ぎ段階は同じqueryStartのタイル7→8→9だけを進める。A3も外挿段階の途中で補間を始めず、phase1.5→2の区間で全位置を連続的に再割当てする。整数段階だけでなく、境界と逆向きの途中シークを検証した。

A1/A3モデル13件、A2モデル5件が成功。登録・AST・MDX・受入の関連77件も成功。本文21ブロック/6 H3を原ノードのまま一度だけ包装し、3図の全8有効化組合せ、包装外の意味依存、2記事の証拠分離、共有コード変更での旧受入失効を検査した。既存Transformerのscene/model/固有CSSに差分はない。

予備内容レビューに基づき新3図をenabled/reviewedへ進め、sourceDigestとreviewedDigestを一致させた。これは本文との意味照合であり、記事全体の完了を意味しない。公開相当ビルドとroot共通検証を実行中。

### 公開相当ビルドと対象ブラウザー検証

静的exportのBUILD_IDは `b6ED74Yt-o5VtdMJ2DUpg`。223/223ルート、230 HTML、16章の入口検査が成功。サイト単体195/195、rootの `npm run check` も成功した。root試験は455件中454成功・1 skipで失敗0。Git fixtureの同期処理が多数あるため約8.7分かかったが、独立した読み取り観測で子プロセスの進行とfixtureの後処理を確認し、中断せず完了を待った。

Chromiumの対象試験は最終21/21成功。3図の全15段階は1440×1000明暗・1280×720明・390×844明暗でSVG文字と操作が枠内に収まり、ページ横あふれがなかった。疎接続の到達範囲、線形積の途中状態、Flashの行引継ぎ、KVの3方式、位置補間の順逆シーク、本文への個別復帰・拡大とfocus復帰を確認した。3図を含む10種類のchunk失敗でも原文を保持した。noJSでは全段階の静的一覧を開け、印刷時は既存契約どおり本文・静止SVGを残し、操作と一覧を隠す。

初回は16成功・5失敗。3件は操作アイコンを含むSVGの選択、1件はpermalinkを含む見出しの完全一致、1件は印刷時に段階一覧が見えるという試験側の期待だった。本文・共通印刷CSS・既存回帰に照合して試験だけを修正し、同じ製品ビルドで全21件を再実行した。初回ログ `p1-variants-browser-targeted.log`、再実行ログ `p1-variants-browser-targeted-rerun.log` をTEMPに保持する。

### 独立した表示・性能監査と内容レビュー

Windows Edge `153.0.4234.48`、同じ固定BUILD_IDで34画像を独立担当が全件確認し、approved / low、必須修正なしと判定した。全15整数段階に加え、A2のphase1.6/2.6/4.1、A3の1.49/1.6、1440暗色の主要選択、1280×720暗色を含む。A1のQ4本を保ったKV4/2/1、A2の接続・積・行状態、A3の8入力を保った位置対応が本文の意味と一致した。1280×720では非stickyへ切り替わり、下端操作へ通常スクロールで到達する。全図が1画面に収まるという判定ではない。

TransformerはPR #53から本文・scene/model/固有CSS・選択したregistry4件に差分がないことを確認し、このビルドの入出力・ブロックを追加2画像で確認した。共有行列の対応と全体計数に退行がなく、こちらもapproved / low。独立担当自身が実装したregistry/AST/受入拡張の承認は、作者以外のrootによる意味・差分レビューと単体/全体回帰を組み合わせた。新しい本文装飾は固定IDと固定bindingを追加するだけで、Transformerの包装順・段階・元ノードを変更しない。

| 図 | 段階操作の応答 | 実時間再生のrAF間隔P95 | 明示停止・画面外停止 |
| --- | --- | --- | --- |
| KV共有 | 12.2 ms | 7.1 ms | 成功 |
| 計算と保存 | 14 ms | 7.1 ms | 成功 |
| 位置の対応範囲 | 15 ms | 7.1 ms | 成功 |

仮想時計なしのローカルHTTP計測。応答は操作handlerからrangeの変化を最初に観測するまで、rAF間隔はGPU描画時間ではない。冷読みCLSは新記事・図なし対照（alignment-theory）とも0。各新規contextで操作・スクロールをせず、初回load後5秒を計測した。図なし記事の重い図解chunkは0。全端末の性能や常にCLS 0を保証する値ではない。

実ダウンロードしたJS応答全chunkをNode gzipで換算すると、scene/core 25,272 B、共通入口21,330 B、合計46,602 B。記事固有75 KiBと共通100 KiBの予算内である。純粋なmodule差分や実HTTP圧縮転送量とは区別する。予期しないpage/console/HTTPエラーは0。既知のローカルfavicon 404、fetch中断147件、noJS時CSP preload通知1件は生ログへ別計上した。

新記事HTML SHA-256は `f3bbadeb344de22ea1a4ddb1e5770e12b3e73b465372ba0b8dadcec4341ff54a`、対照は `2dccb762045fe40a4aa5ee08218470a913978bb0d9f1c9df08579730b02d21b6`。BUILD_IDと3記事のHTMLは監査前後で不変だった。監査用4205は終了・接続拒否を確認済み。TEMP `codex-attention-variants-audit-20260924/independent-review.json` に記事別判定、`audit-chromium.json` に生結果、`transformer-reaccept.json` に旧図の追加確認、計36 PNGを保存した。

全サイトChromium回帰は192件中187成功・音声fixture専用5 skip（5.5分）。数式・Mermaid・検索・音声shell・既存図解を含む。TEMP `p1-variants-browser-chromium.log` に記録した。WebKitの起動を前検証サーバー終了前に1回試したためport使用中として検査開始前に拒否されたが、Chromium終了を回収してから再実行した。製品の失敗として数えない。

WebKitの主要7 specは95/95成功（5.2分）。TEMP `p1-variants-browser-webkit.log` に記録した。物理iPhone Safari、実スクリーンリーダー、本人による学習効果の評価は未実施。

[注意変種の受入](attention-variants-article-acceptance.json)と[Transformerの再受入](transformer-article-acceptance.json)に、この版の独立レビュー・ローカル成功を保存した。入力ダイジェストは注意変種 `sha256:7a5ff97d663c87e223227599e4e18d1497ceccdb7d5491cdafeb6dfe60cb4588`、Transformer `sha256:27ec63f55d3ffa5f758c124f02706cd86efcce28722b3d818710bfd0ed5c926a`。公開ゲートは未完のまま提出し、CI・Pages・実公開の確認後だけ保存する。公開済み記事の完成数は引き続き1/199。

### PR・Pages・公開受入の完了

[PR #54](https://github.com/pero3dev/ai-agent-library/pull/54)は2026-09-24 13:59:22 JSTにsquashマージされた。PR head `ce209d6201257ff1d54f785ebec1ac7b6b3f82f1`、公開SHA `a0dc1ff67b40d7e35af87b07f34dc643f95f57dc`。必須11チェックが成功し、実マージ本文・名義と検査済みsquash本文、マージ後のファイルと候補が一致した。PR CIもサイト単体195件、ブラウザー187成功・5 fixture skipだった。PRのdeployはmain専用条件でskip。

[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/35957966340)と[Pagesジョブ](https://github.com/pero3dev/ai-agent-library/actions/runs/35957966340/job/107501392858)は同じSHAで成功。GitHub APIを再取得し、deployment `6630620836` の最新successと同じdeploy job/公開URLの対応を確認した。artifact `10791143128` を独立にダウンロードし、2記事だけをtarから読み取った。初回は取得スクリプトがtar名をarchive.tarと仮定して停止したが、実形式artifact.tarに対応し、同一run/attempt/artifactの再照合後に取得済みファイルから再開した。製品に変更はない。

CIのBUILD_ID `pwtscI6SBWL5tUH0bvAAV`、注意変種HTML SHA-256 `8a6bc723554d3e668cef5d8ab9d9b440725bfa6a55ecd9c0fc14cf28f34f229f`、Transformer HTML `5b08fa026da606ce5d49f0692406699a8ec754fe9ea3f570b79c4f1fb422e157` が実配信と一致した。期待値を公開HTML自身から作る循環検査はしていない。

[公開記事](https://pero3dev.github.io/ai-agent-library/docs/llm-internals/attention-variants-and-long-context)をWindows Edge `153.0.4234.48`で14:10:58〜14:13:01 JSTに確認し、15/15ケース成功。新3図の全15段階を5画面条件で検証し、選択・途中シーク・本文連動・拡大/focus・実時間再生と停止、noJS/印刷、旧Transformer4図のPC/狭幅、図なし対照の重い図解コード0を確認した。実配信資産47件はHTTP 200・期待MIME・非空。30画像を保存し、主担当がKV比較・線形積・位置補間・旧図狭幅の4画像を原寸確認した。幾何検査と全画像の目視を同一視しない。

TEMP `ai-agent-library-variants-public/artifact-evidence.latest.json` と `ci-35957966340-attempt-1-20260924T050646608Z/` がGitHub/CI成果物の証拠、`public-chromium-2026-09-24T05-10-58-181Z/result.json` が公開実行結果。予期しないブラウザーエラーはなく、noJSのscript CSP拒否は別記録した。

同じ入力版で2記事の公開ゲートを保存し、CLIで両方complete=trueを確認した。[注意変種PR #54スナップショット](attention-variants-article-acceptance-pr54.json)と[Transformer PR #54スナップショット](transformer-article-acceptance-pr54.json)は以後の共有変更で書き換えない。この版の全体対応は2/199記事。次はMoE2図を制作する。
