# 文章生成・トークン化の記事全体の動的図解

開始日: 2026-09-24。状態: 実装・統合・独立レビュー・ローカル検証完了、PR提出前。P1の4番目の制作単位（2記事）。

## 作業契約

- 目的: 本文を増やさず、1トークンの生成と、分割・計数・履歴の関係を本文連動の2図で追えるようにする。
- 根拠: [採択計画](../../plans/engineering/dynamic-diagrams.md)、[展開状況](dynamic-diagram-rollout.md)。正本は[文章生成](../../../docs/10-llm-foundations/how-llms-generate-text.md)と[トークン化](../../../docs/10-llm-foundations/tokenization.md)。ROADMAPの完了した記事執筆を再開するものではない。
- 元HEAD: MoEのPR #55・main CI・Pages・公開25ケース成功後の `11ab1664fc9864b3f68c4d0eef278f629d9861b1`。所有branchは `feat/generation-tokenization-reading-diagrams`。
- 所有: rootは生成scene/CSS・dispatcher・ブラウザー試験・記録と公開。model担当は生成モデル/unit。scene担当はトークン化model/scene/CSS/unit。integration担当はregistry・AST・MDX安全性・記事割当/受入・対応unit。別担当の変更を戻さず調整する。
- 範囲: websiteとprojectの記録。本文、lockfile、生成物を直接編集しない。次の推論内部の記事は別単位とする。
- 検証: 同日同一lockfileのnpm ci済み環境を再利用し、root check・サイト単体・公開相当export・意味/数値/AST保持・ブラウザー表示/操作/障害/性能・独立レビュー・実GitHub/Pages/公開を確認する。共有変更後の旧3記事も新入力版で再受入する。
- 終了条件: 全16 H3・58論点の割当、2図の受入、旧3記事の退行なし、同じ版の公開確認。図の本数だけで記事完了を判定しない。
- 外部操作: ユーザーの「順に作業を自律的に進めてください」と中断からの継続指示に基づき、既存PUBLICリポジトリで通常PR・CI・squashマージ・Pages・公開確認まで行う。有料API・外部登録を加えない。

## 採択した設計

TEMP `p1-generation-next-unit-plan.md` と独立レビュー `p1-generation-next-unit-plan-review.md` に基づく単位Aを採択した。設計SHA-256は `64e5fa8b73e97c1d366f2a8ef8df6c55aaf5038f99ddb9f8fa4f283fc413de71`、レビューは `3d278e3229c74e9f0850d6ea2cfcd0980b50b9d9c04e3422727b9d84901a2acc`。Aの設計判定はapproved / low。これは最終実装・画像・公開の承認ではない。Bのtop-p本文についての指摘は次の推論内部の単位で扱う。

| 図 | 段階 | 本文の対応 |
| --- | --- | --- |
| `generation-token-loop` | 0全体、1候補、2選択、3次の条件、4温度/候補、5分岐、6停止、7配信 | 5 H3・15 body。読書は0→3→4→5→6→7 |
| `tokenization-counting` | 0単位、1変換、2境界、3条件、4語彙、5計測、6履歴 | 5 H3・10 body。読書は0→1→2→3→4→5 |

生成の原文SHA-256は `252a118e9db2a3c98a27d681d5a7935625511db312bf69c1cec2bee51ad9b8b3`、トークン化は `c7cfa3103d66cab419bbac059e30e1cfd19d090b66ca04b111a0b49191b327e1`。各記事は全8 H3。生成の全31論点とトークン化の全27論点を動的段階または本文へ割り当てる。元のMermaid・表・リストを分割せず、既存grouped-blocksで包装する。G1の段階0に全ループ、T1の段階5に履歴の包含を残し、自動読書だけでも主な関係を読めるようにする。

## 説明用モデルと制作時の条件

生成は固定prefix ABの4候補分布 `[.4,.3,.2,.1]` から選択Bを末尾へ追加し、ABBの次分布 `[.1,.2,.6,.1]` へ進む。語彙IDと出現IDを分け、既存の列・モデル重みを書き換えない。温度とtop-pは同じ入力ABへ適用する。温度0は貪欲の別分岐、top-pは累積が指定値以上になる最小集合と再正規化を用いる。選択位置uの差とスコアの微小差を分け、架空の品質評価を作らない。[nucleus sampling原論文](https://arxiv.org/html/1904.09751)

停止・配信は別の固定例と明示し、自然終了のEOS、文字列BCによる停止、選択2回の上限を比較する。BCを保留して返却から除くのはこの図の説明用規則。一般のAPI契約とはしない。生成と配信の区切りを分け、送信済み文字列を巻き戻さない。

トークン化は手で定義した語彙Aの `token|izer`（2個）と語彙Bの `tok|en|i|zer`（4個）を比較する。9文字を完全に覆い、IDから同じ文字列へ復元する。実BPEの結果、言語間倍率、実測usage・金額を作らない。文字・語・語片は比較であり、全方式がその順で処理する手順とは描かない。[SentencePiece原論文](https://aclanthology.org/D18-2012/)

TEMP候補時点の生成モデル12件、トークン化モデル8件は成功。旧3記事の公開受入はPR #55のsnapshotへ保存してから共通統合を変更する。最終受入・ビルド・ブラウザー・公開結果は以下へ追記する。

## 内容レビューと統合前の確認

生成scene/modelは別担当が原文・設計と照合し、初回に分岐比較の文字重なりと累積分布上のu位置の欠落を指摘した。rootが行間を広げ、同じ確率から累積帯・選択位置を描くよう修正。追加先の空枠から重複文字を除き、停止・配信を別の固定例と明示した。修正後31状態のメモリ内SSRをEdgeで再確認し、枠外文字・文字同士の重なり0、approved / low、必須修正なしとなった。これはHTTP上の製品画面・本文同期・最終画像監査の代わりではない。

最終候補scene SHA-256は `d1d01e33ed90847ed6047726196d3128860481ff32808837ba4d81877bb3aa78`。TEMP `generation-scene-independent-review.md` に初回指摘と再判定を保持した。モデルの中点、逆シーク、選択済みと確定済みの区別、EOS/文字列保留/配信順序、段階ごとの設定の分離も確認した。

トークン化は作者とは別のrootがmodel・scene・CSS・単体の条件を読み、9文字の完全被覆、語彙内IDと出現の区別、2/4比較、別段階への設定持越し防止、実測値を捏造しないこと、計測段階での履歴包含に必須修正がないと判断した。実ブラウザーの可読性・操作は統合後に判定する。

候補をrepoへ移した後、生成12件＋トークン化8件の単体を再実行し、20/20成功。コピーした10ファイルはTEMP候補とのhash一致を確認し、試験用にコピーされていたreading-clockは取り込まなかった。本文・lockfileは引き続き変更していない。

## 統合とローカル検証

registry・AST包装・MDX制約・記事受入の独立レビューはapproved / low。初回にトークン化の論点対応2件を指摘し、語彙依存を段階3/4、非単語の内容を段階3へ合わせて解消した。全16 H3・58論点、原ASTの完全復元、MDX不正属性10件の拒否、旧3記事の受入失効と新2記事nullゲートを別担当が確認した。TEMP `foundations-integration-independent-review.md` に最終判定を保存した。T1作者による自身のscene承認には数えない。

統合局所3ファイルの単体65/65が成功し、論点修正後の関連受入7/7も成功。旧3記事の割当データはmainと完全一致し、既存serialized領域の書式も保持した。rootが内容レビュー後に新2図をreviewed/enabledへ変更した。記事全体の最終review/local/publicはこの有効化と区別して未完のままにした。

rootの `npm run check` は成功。単体455件中454成功・1 skip、Markdown lint・記事215ファイル・リンク303ファイル5527リンク・TODO・harness・Git形式を検証した。単体部分は377,987ms。サイト全体単体は有効化後246/246成功、skip 0、100,965ms。

公開相当の `build:clean` は `STATIC_EXPORT=1`、`NEXT_PUBLIC_BASE_PATH=/ai-agent-library`、`NEXT_PUBLIC_SITE_URL=https://pero3dev.github.io/ai-agent-library` で成功。BUILD_IDは `zOmqMF05XuC0eHsm_9BD-`、223/223 routes、230 HTMLのskip target、16章の索引を確認した。既存のlockfile検出・生成MDXのGit更新時刻・日本語stemmerの警告は保持した。

TEMP `ai-agent-library-foundations-root-check.log`、`ai-agent-library-foundations-website-unit.log`、`ai-agent-library-foundations-build.log` に記録した。最初の重点ブラウザー検証は37件中29成功・8失敗。表の比較へ非表示の用語集説明が混ざる点と、noscript親のテキストをPlaywrightが空として抽出する点を検査側で修正した。製品コードは変えず、表示本文の比較と実際の注意文の可視性を確認する。初回ログ・失敗contextはTEMP `ai-agent-library-foundations-first-browser-failures/` に保持し、再確認結果は以下へ追記する。

修正後の新2記事の重点検証は23/23成功（1.4分）。全Chromiumは228件中223成功・音声fixture専用5 skip（7.0分）。両sceneの読み込み失敗と共通frameの失敗時にも本文が残る。ログはTEMP `ai-agent-library-foundations-targeted-recheck.log` と `ai-agent-library-foundations-chromium.log`。

## 最終内容と表示の独立レビュー

2026-09-24 16:02 JST、5記事とも対象範囲でapproved / low、必須修正なし。新scene/modelを作成していない担当が固定exportを独立監査し、新2図102画像と旧9図の代表9画像、計111 PNGを全件目視した。新15整数段階・中点・全selector、旧3記事9図52整数段階・selector・読書同期を確認した。この担当が作成した統合部分は、先述の別担当によるレビューと組み合わせ、自己承認に数えない。

TEMP `codex-foundations-audit-20260924/independent-review.md` のSHA-256は `2058e9494664026502b6ecb0d01ae636b6de79679dfaeb1d3feecbc8d1486d2f`。機械可読版と生の `audit-chromium.json` を同じディレクトリへ保存した。生データのSHA-256は `46b7c16a849c58e6a93d5d0b971dce7bd8735f048769414afe1d1481535b8d48`。監査前後でBUILD_ID・6 HTML・5記事のinputDigestが一致した。

生成ではABへの選択とABBでの次分布、温度0の参照確率と選択の区別、同分布の乱数差とlogit差、停止条件と配信済み内容の非撤回を確認した。トークン化では同じ9文字の境界、語彙ごとのIDと復元、条件の比較・usage未計測・履歴の包含を確認した。新図の枠外文字・文字重なり候補・ページ横overflowは0。旧図の幾何検査には非表示文字等の候補が含まれるため、全候補0とは報告せず、表示中の画像に必須修正がないと判定した。

1440では二列・stickyが成立し、1280×720では長いパネルを通常スクロールで読める。生成図の1280での最小13.28pxは短い補助ラベル・確率で、主要ラベルは約14.94px、見出し約17.43px。実寸全画面を見て、PCでは拡大に頼らず読めると判断した。390での最小8.9pxは快適な可読性を保証せず、PC中心の範囲で収まりと既存機能の退行を確認した限界として残す。

| ローカル観測 | 文章生成 | トークン化 |
| --- | ---: | ---: |
| 操作への初回反応 | 27.4ms | 25.1ms |
| 再生中rAF間隔P95 | 16.7ms | 16.8ms |
| cold load CLS | 0 | 0 |
| scene/core gzip相当 | 11,790B | 9,229B |
| 共通entry gzip相当 | 21,479B | 21,479B |

Chromium 153.0.8010.12の実時間による観測であり、GPU描画時間や独立したベンチマークではない。gzip相当は応答本文の再圧縮でHTTP転送量そのものではない。対照記事のCLSも0、重い図解chunkも0、各記事は自身のsceneのみを読み込んだ。明示停止・画面外停止・末尾からの再生、noJSの本文/静止説明・印刷CSSと5 PDFも確認した。予期しないpage/console/HTTPエラー0。生ログに残る223件のlinked-route/RSC中断とnoJSの5件のscript CSP拒否を成功通信とは数えない。専用4205サーバーを停止し接続拒否を確認した。

物理iPhone Safari、実スクリーンリーダー、物理印刷、本人の学習効果は未確認。独立監査を全体suiteや公開確認の代わりにせず、以下で別に記録する。

## 最終ローカル受入

WebKitの主要9 specは133/133成功、skip 0（7.4分）。自己注意・注意変種・Transformer・MoE・新2図・共通図解・chunk障害・IntersectionObserver・数式を検証した。TEMP `ai-agent-library-foundations-webkit.log` に記録し、Chromiumの終了を回収してから同じ4183 portで実行、終了コード0を確認した。

5記事の現在の入力版について、内容/統合/画像の独立判定とローカル検証を受入記録へ反映する。旧3記事のPR #55の公開証拠は固定スナップショットに残し、今回のpublicはnullとする。CLIは保存済み証拠の整合検査であり、実GitHubや公開確認ではない。

提出前にリモートPUBLIC、main=`11ab1664fc9864b3f68c4d0eef278f629d9861b1`、既存open PRなしを再確認した。Markdown・リンク・差分の検査を再実施する。PR・必須CI・main CI・Pages・公開5記事の43ケースはまだ未実施であり、以下に実結果を追記する。

## GitHubと公開受入の完了

上記は提出前の状態。2026-09-24 16:43 JSTに公開受入を完了した。[PR #56](https://github.com/pero3dev/ai-agent-library/pull/56)の候補 `62edee9fc1cf2a69bbfca9d2385e9eca6a769dbe` は必須11チェックを通過し、16:20:56 JSTに `1af3a76bf037a31fcbc8a8f677da7b135da3864d` へsquashされた。候補とmergeのtree一致、最終タイトル・本文・名義の形式を確認した。[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/35969128318)と[Pages](https://github.com/pero3dev/ai-agent-library/actions/runs/35969128318/job/107535952253)は成功。deployment IDは `6632493197`、status IDは `18769970907`。

成功した同一CIのartifact `10795486480` から独立取得したBUILD_ID `o1a4xgpP5Y4b-28L7h62D` と5記事HTMLのSHA-256が公開配信に一致した。artifact APIのdigestは `sha256:0b193c71732b754180b2c065e2eb6457fabb1a1e6d00b822f6dc9582550aa8f0`、取得したarchive.tarのSHA-256は `39f0a44749e4b646cf1df4182e2433b397483dd663d5f64f581808b8c0bf91da`。両者は対象が違うため同一視しない。

公開Edge 153.0.4234.48の43/43ケースが成功（16:40:05〜16:43:13 JST）。新2図の15段階・全条件・往復中点・読書同期・実時間の再生停止・キーボード・拡大・noJS・印刷と、既存3記事・対照記事を確認した。56 assetのHTTP 200・非空本文・MIMEを検査し、105 PNGを保存した。代表の文章生成第1段階画像を目視し、ローカル独立監査111画像と組み合わせて公開差分を確認した。全105画像を目視したとは扱わない。

最初の公開検査は42成功・1失敗で、生結果を保存した。原因はブラウザーが自動照会するサイトルート `https://pero3dev.github.io/favicon.ico` の404。PR #55にも同じ観測があり、今回の5記事と旧artifactにicon/manifest指定がないことを独立確認した。再検査では「未指定」「その完全一致URL」「その完全一致404文言」の組だけを既知観測へ分類し、raw consoleErrorsも残した。再検査にもこの観測1件がある。図解・本文・JS・CSS・fontの失敗条件は変更していない。分類の否定例を含む10条件も通過した。TEMP `foundations-favicon-audit-review.md` はapproved、SHA-256 `67854c8f91950cbf38cf22e37bcdba8b16027cd3e63b97865bcfca9f8e11fe1e`。

公開証拠はTEMP `ai-agent-library-foundations-public/artifact-evidence.latest.json` と `public-chromium-2026-09-24T07-40-05-975Z/result.json`。失敗した初回は同じ親の `public-chromium-2026-09-24T07-31-59-016Z/result.json`。追加のローカル12条件（新2図×1920/768/960 CSS px×明暗）も全段階で成功し、3代表画像を目視した。960 CSS px・DSF2は200%相当のviewport模擬で、ブラウザー本体のズーム操作ではない。専用サーバーの停止も確認した。

5記事の現在のinputDigestに公開ゲートを結び、`*-article-acceptance-pr56.json` に固定した。全5件の保存証拠整合はcomplete=true。全体は5/199記事、P1は5/15記事が記事全体の公開受入を完了し、部分導入を含む公開図解は7記事13図となった。次の推論内部の共有コード変更後は再受入を必要とする。
