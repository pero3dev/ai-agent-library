# E1 検証キット具体案（準備のみ）

作成 2026-09-30T12:18:30.080Z / 作者 /root/pretraining_visual_review。所有は本MDと同名JSONの2ファイルのみ。製品・記事・kit本体・登録・Gitは未変更。ブラウザーとネットワークは実行していない。

D2正式公開受入後、E1案の独立レビューとroot開始指示を経て実装する。P1の15/199記事で停止しP2を開始しない。現在のD2候補の観測は正式公開済みという意味ではない。

## ケース構成と旧121の保存

旧121ケースをそのまま保持し、新14ケースを連続blockで追加する。合計135ケース、artifact対象10→11記事。新routeは /docs/llm-foundations/attention-and-context。
挿入は0始まり95、runReasoningChecks直後・mandatory faviconの直前。新blockを除けば旧121の名前・順序・callback本文hashは完全一致。local/publicは同じrunContextChecksのcallbackを使い、adapterは接続・identity・deliveryだけを供給する。

| 追加case | 内容 |
| --- | --- |
| context: all 11 stages 1440x1000 light DSF1 | 2 figures/all11 integer stages; source, visible semantics, exact per-side counts, geometry, scene delivery. Each stage viewport + completeScene PNG with dimensions/hash; low PC panel relative and no page overflow. |
| context: all 11 stages 1440x1000 dark DSF1 | 2 figures/all11 integer stages; source, visible semantics, exact per-side counts, geometry, scene delivery. Each stage viewport + completeScene PNG with dimensions/hash; low PC panel relative and no page overflow. |
| context: all 11 stages 1280x720 light DSF1 | 2 figures/all11 integer stages; source, visible semantics, exact per-side counts, geometry, scene delivery. Each stage viewport + completeScene PNG with dimensions/hash; low PC panel relative and no page overflow. |
| context: all 11 stages 390x844 light DSF1 | 2 figures/all11 integer stages; source, visible semantics, exact per-side counts, geometry, scene delivery. Each stage viewport + completeScene PNG with dimensions/hash; low PC panel relative and no page overflow. |
| context: all 11 stages 390x844 dark DSF1 | 2 figures/all11 integer stages; source, visible semantics, exact per-side counts, geometry, scene delivery. Each stage viewport + completeScene PNG with dimensions/hash; low PC panel relative and no page overflow. |
| context: all 11 stages 960x540 light DSF2 | 2 figures/all11 integer stages; source, visible semantics, exact per-side counts, geometry, scene delivery. Each stage viewport + completeScene PNG with dimensions/hash; low PC panel relative and no page overflow. |
| context-causal-cost: independent mask and KV fixtures, every selector and midpoint reverse seeks | Literal4/6 masks, all6queries; no future line. Exact4 illustrative mix sources and no real weights/answer. Both prefill/decode lanes and candidate KV timing. K/V each n, no Q/learned-weight cache, null scientific metrics. |
| context-cache-quality: independent prefix and quality fixtures, every selector and midpoint reverse seeks | Exact3prefix cases and empty reused/recompute/new sets. History-free READ2 aligned rows, fixed/variable,4retained/2recompute. Same important-info0/3/5; READ4three summaries and2independent unknown eval frames. Needed2 retained; optional2 toggle; S5 independent2axes. |
| context: keyboard transport, modal selectors, isolated state and focus return | Home/End/prev/next disabled edges, Space/Enter, Escape/button close, focus return/unique IDs. All16option values in modal, inactive controls absent, inline state preserved. Other figure phase/settings unchanged. |
| context: all 10 READ stops, manual-stage meaning carryover and independent figure states | 10READ forward/reverse20; no wrapped cache1. Fresh visit before selectors/transport/play: causal0..4, cache0→2→3→4→5. READ2default shows both rows, prefix4/recompute2 without manual1; READ4summary3 without prior position selection. Manual survives scroll, explicit READ resumes, other figure unchanged. |
| context-causal-cost: native elapsed play, frozen pause, replay and completion | Real clock progress, phase/scene/settings freeze, final replay/completion. Actual viewport exit auto-pause; no simulated document.hidden; separate reviewed performance helper counts app-rAF idle. |
| context-cache-quality: native elapsed play, frozen pause, replay and completion | Same real-clock contract; final stage5. |
| context noJS: original prose, eight headings, one table and all 11 static stage descriptions | JSdisabled:2SSRfigures, original prose, disabled controls, noJS notice, readable static5/6descriptions. Source8H3/1table/10lists; no invented TODOaside. |
| context print: coherent scenes and original article with controls hidden | Seek2.25→beforeprint→print emulation coherent integer stage. Content semantics same oracle checkControls:false, stored effective setting; independently assert controls hidden. Original prose/no overflow retained. Emulation not physical printing. |

6profileは1440×1000明暗、1280×720明、390×844明暗、960×540明DSF2。整数stage66訪問、境界往復54、selectorのstage別21訪問（固有16値）、全設定×stage168観測。READ10往復20に、未操作の直接READ持越しを含む。ケース数とcase内の観測数を区別する。

## 原本文・装飾

原文SHA256: 433d75095383235eeace9c4b34048bad43a3f4b0ba6e65c2e7e7d25eebdb1c55。採択全AST（position除外）: ea4d5da00220847b1c69d5deaee1a6fac11cc20dfbfb19b3d1d67d6523370ce8。
2図11段階、READ10/manual1。全30論点は動的18・静的12。root39/H3 8/body15、包装5H3/body12、table1（header含む3行9セル）、source list10/link23/strong18、math/code/Mermaid0を保持する。
causal包装[9,19)、cache包装[19,26)。H3は最初のREADへ1回だけ、table/list非分割。静的H3「この理解が効く場面」「アンチパターン」「チェックリスト」はfigure外。AST逆変換とHTML構造確認は別検証。末尾TODO節の「なし」も残す。
TODO装飾は原文に従う。TodoCalloutはTODO(要確認)blockquoteだけをasideに変換する。E1は対象blockquote0なのでblockquote0・aside.todo-callout0を期待し、D2のaside1を流用しない。ブラウザーlist数は図の目次/static-stage一覧を除く。

## 固定fixtureと可視意味

JSONに採択E1の全fixture、各stage必須ラベル、属性、reading bindingを同梱した。製品frameを期待値生成に呼ばず、実装の独立レビューで原文からliteral oracleを照合する。

| 段階 | 意味とexact集合 |
| --- | --- |
| causal S0 | 既定6位置/query3、自己以前0..3だけ許可、未来4..5をmask。query0..5全値。密な因果注意の例と明記。 |
| causal S1 | t3「それ」、t1名詞役割、t0..t3から表現へ4path。light/strong/medium/mediumは模式。数値重み・正答・vectorはnull。固定の語→句→文層順にしない。 |
| causal S2 | 4×4/6×6下三角のliteral各行、許可セル10/21。参照できる≠正しく使える、注意ペア規模≠実時間/品質倍率。 |
| causal S3 | prefill processed/cache0..5→候補6未保存。decode processed6、cache0..6→次候補7未保存。両lane各1のTTFT/生成速度未測定欄、片側欠落を合計metric数で救済しない。 |
| causal S4 | 選択長4/6にK/V各n、Qや学習重みと分離。memory/price/quality未測定と時間の条件依存説明。実装freeze時に可視metric集合・欄数を独立literalへ固定する。 |
| cache S0 | 同一生成内KVと別要求共通接頭辞を別枠。候補6は次入力処理後にKVへ。service hit/TTL/料金は発明しない。 |
| cache S1→READ2 | base/candidateを先頭整列、p0/p1固定・後方可変。READ2未操作suffixではprefix4、保持0..3、再計算4/5を同時表示。手動1の履歴不要。 |
| cache S2全選択 | front保持0/再計算0..5。suffix保持0..3/再計算4,5。append保持0..5/新規6/無効化0。存在しない領域を作らない。 |
| cache S3/4 | 同じimportant-infoを0/3/5へ。READ4でも3位置summaryを残す。必要A/Bを固定し追加無関係/類似2文書だけ切替。retrieval/integration各枠のresult/score=null。普遍的U字曲線・中間必敗・希釈単独原因にしない。 |
| cache S5 | 必要2文書を残し不要2を畳む図とprefix境界を同時表示。何を渡すか/何を再利用できるかの別2軸。入力選択でprefixも変わり得る、cache/品質改善の保証なし。 |

可視leaf textを欄/レーン/セルに束ね、値・ラベル・否定を照合する。正しいdata-IDやtitle/descだけで通さない。global textが残っていても必要欄の表示が消えれば拒否する。parent textとtspanを二重集計しない。各K/V行、各入力行、各評価枠のexact数を検査する。
SVG水平/垂直strokeはbboxの片軸0でも実在し得る。stroke幅/opacity・色・getTotalLengthと可視祖先で判定する。prefix境界x、二行の列中心、重要情報印のslot内包含を同一座標系で確認（小数誤差1px以内）。text bbox候補は実PNGの字形確認へ渡す。

## 負例

- C-MASK: 未来key許可、転置/欠落/重複セル、query3→t4/t5参照、query5へ架空future追加 → literal mask4/6、exact16/36一意pair、全6queryの許可集合とpath endpoint。
- C-MIX: 参照4本の欠落、名詞役割消失、重み数値/正答/vectorを生成 → 各source可視text/模式role、4path、未知値null。
- C-REACH: data-IDは保持したまま正しい利用の保証、実時間倍率、全方式共通を表示 → 各欄の可視留保と非主張・未知値。
- C-LANES: prefill/decode片側欠落、両metricを一方へ集中、TTFT/生成速度交換 → lane exact2、各lane固有metric exact1と可視意味。
- C-KV-TIMING: 候補6を入力処理前から保存、候補7を選んだだけで保存、処理後6欠落 → 時点別processed/cache/sampled集合と可視説明。
- C-KV-FIELDS: Q保存、Vの1位置欠落、K重複、学習重みと同一視、byte値生成 → K/V各nのunique位置とラベル、学習枠分離、未知値。
- Q-GENERATION: 別要求へ自動hit保証、未処理候補のKV再利用 → same-generation/cross-request可視境界と時点oracle。
- Q-PREFIX: suffixのprefix3/5、変更p4保持、以前p2再計算、片入力欠落 → 両row exact配列/role、保持0..3/再計算4,5、境界geometry。
- Q-APPEND: appendのp6を過去無効化扱い、prefix7、frontで保持1件 → append保持0..5/new6/無効化[]、front保持[]/再計算0..5。
- Q-CARRY: titleに正しい語だけ残しREAD2の可視固定/可変や4/2説明を隠す → 未操作0→2の可視text/各領域/境界、非表示metadataは不採用。
- Q-SERVICE: provider-cache-hit unknownのまま実hit/TTL/割引を表示 → 可視文言の反転とnonnull service値。
- Q-POSITION: 情報ID交換、位置0/3/5誤り、READ4のsummary消失、中間必敗/U字性能 → 同じIDと実slot、summary exact3、モデル/タスク依存留保。
- Q-DOCUMENTS: needed片方欠落、distractorをneededに改名、needed-onlyで追加資料保持 → 設定ごとexact ID/role/可視labelと必要2/追加0or2。
- Q-EVALUATION: retrieval/integration片側欠落、結果共有、検索成功を統合成功へコピー → 別々のexact2枠と各result/score null、未測定text。
- Q-CAUSE-AXES: 希釈だけが原因、S5片軸消失、情報選択でcache不変/品質向上を保証 → 局所留保text、exact2軸、保持/折畳み文書と独立prefix境界。
- SETTINGS: 非対象stageでもcontrol有効、値漏れ、重複option、中点丸め差、戻ると結果差 → 全設定×stage168、exact option、直接到達/逆シーク、純粋model単体。
- GEOMETRY: mask/情報印をslot外、prefix境界xずれ、二行列中心ずれ、水平線をheight0で不可視扱い → 実bounds/center/pathとstroke可視、1px許容。文字重なりは実画像で追加確認。
- TEXT-SCOPE: 正しいID/titleだけ保持し実labelを空/否定/別laneへ移す/透明化 → 可視leaf textのrole別照合、祖先可視/paint、tspan二重集計なし。
- PRINT: printでselector残る、selector非表示を理由に意味全skip → control非表示とcontent意味を独立assert。
- SOURCE: 表/list分割・H3重複・TODO廃棄・D2aside1を要求 → 全AST逆変換/inventoryと原文依存の装飾契約。
- PROOF: 旧proof本文と内蔵hashとmanifestを一緒に改ざん、旧case順/名前/primary assert変更 → 外側に独立固定したD2原byte/hashと121callback、全宣言差分逆変換。
- RELEASE: 異なるmerge/run/deploy/artifact/BUILD、10/11HTMLだけ、duplicate route、critical asset失敗 → CI→公開identity鎖、exact11set、asset body/MIME、partial raw不受入。

printはcheckControls:falseで同じcontent oracleを使い、selector/transport非表示を別に確認する。表示に使ったstored settingを保持し、意味検査全体をskipしない。noJSは原本文と5/6段階静止説明を保持。元の限定CSP/network例外だけを維持し、新たな無差別除外は追加しない。

## 全predecessor内容と実装後の証拠

現在のkit20ファイルを読みraw/LF SHA256をJSONへ固定した。旧121の実登録名とFunction.toString本文hashを観測（callback実行0）。kit読取前後の全hash一致を確認。現manifest SHA256: 70c2178e900c3e641c1c5f13f272e8578bd106617db81e613965e5c4d0f51e19。
これは公開前D2候補のsnapshot。D2正式公開受入後のmerge/treeから全kit、source-mapping、c2/d1/d2 proof JSON全体、predecessor-proof.mjsを再凍結する。今回との差分を明示・レビューしてから最終predecessorを採択する。
新E1 flat proofは各before/afterを各1回の置換として列挙し、全逆変換後のD2各file全byte/hashをproof外の凍結原本と照合する。既存D2→D1→C2→C1検証も保持。旧proofを改ざんして内蔵hashとmanifestも更新する負例を拒否する。自己申告hashだけを承認根拠にしない。
候補ファイルはcontext-checks.mjs、local-context-adapter.mjs、e1-predecessor-proof.json。rootが共有route11、marker、登録1block、件数、README/manifest/preparationを同期する。旧121callback本文/primary assert/timeoutを維持する。
localは凍結BUILDと全11inputDigest/HTMLの前後一致。正式review→PR/CI/Pages後、collectorで実merge/run/build/deploy/artifact固定、公開11HTML/BUILDと観測asset bodyをCI artifactへ照合しEdge/WebKit各135。失敗原rawは保持、同条件の限定repeatは別記して上書きしない。
生成PNG総数と実視認数は分離。absolute source path/hash/engine/profile/capture/sourceCase/actuallyViewedを台帳化。新11段階と必要risk条件を独立実視認し、旧10carryは入力不変の独立proof＋現公開identity/回帰で範囲を限定する。WebKitを物理iPhone/Safariや実screen readerと扱わない。
性能は独立review済みhelperを低負荷時に実行。共通100KiB/固有75KiB gzip、CLS≤.05、入力≤200ms、native rAF p95≤32ms、停止/実viewport退出後のapp rAF idleを維持。ローカル環境の証拠であり実model/serviceの性能・料金ではない。

## 未確定事項

- marker文字列は採択interfaceに未指定。候補 CONTEXT / CAUSAL COST と CONTEXT / CACHE QUALITY をrootが制作前に採用または代替記録する。
- D2正式公開版の最終predecessor hashは公開受入後に再凍結する。これは残る開始条件で、既に承認済みという意味ではない。

その他の意味は採択fixtureに従う。これはkit具体案の準備であり、製品/kit実装やlocal/public受入を承認しない。
