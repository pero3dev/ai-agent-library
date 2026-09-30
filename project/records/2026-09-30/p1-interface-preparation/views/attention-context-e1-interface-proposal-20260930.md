# E1 注意機構とコンテキスト: インターフェース案

作成 2026-09-29T19:01:59.919Z / 観測HEAD `5940334a6fd3aab8178cfeb8746a58c8b937d390`。作成者 `01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_change_evidence`。

**提案・独立レビュー待ち。製品・記事・公開kit・Gitは未変更。実装/公開受入も未開始。** 作成物はTEMPの本MDと同名JSONだけ。他担当の変更を戻さない。D2公開受入、本案レビュー、親担当の開始指示を待って実装する。

## 範囲と正本

対象 `docs/10-llm-foundations/attention-and-context.md`、route `/docs/llm-foundations/attention-and-context`。採択済み `project/records/2026-09-24/p1-remaining-storyboards.json` と対応MDのE1を具体化する。P1採択済み15/199記事の公開受入で停止。P0部分対応2記事はP1達成数へ加算しない。P2は開始しない。

原文の採択/現在/候補SHA256はすべて `433d75095383235eeace9c4b34048bad43a3f4b0ba6e65c2e7e7d25eebdb1c55`。本文訂正0。JSONのadopted.articleには採択E1 objectを無改変で収録し、計画の承認とこの新案/製品の承認を別に扱う。

元記事の一次資料3件と参照日2026-09-10を記録した。今回の新規Web取得ではなく、最新API/料金/性能について新しい主張は足さない。

## 原文とREAD

2図11段階、READ10、手動補助1。H3は8、body15。5H3/body12を包装し、実務への接続・アンチパターン・チェックリストの3H3/body3は静的に残す。30原子論点はdynamic18/static12、18全件がREADへ割り当て済み。

root AST39、table1/list10/link23/strong18。display math0、inline math0、code0、Mermaid0を保持する。positionだけ除外したcanonical全AST SHA256: `ea4d5da00220847b1c69d5deaee1a6fac11cc20dfbfb19b3d1d67d6523370ce8`。

| 図 | 段階 | READ | 補助 | 原AST範囲 | body→S |
| --- | --- | --- | --- | --- | --- |
| context-causal-cost | 5 | 0, 1, 2, 3, 4 | なし | [9, 19) | 1→0; 1→1/2→2; 2→3/1→4 |
| context-cache-quality | 6 | 0, 2, 3, 4, 5 | 1 | [19, 26) | 1→0/1→2; 1→3/1→4/1→5 |

範囲は0始まり/end exclusive/H3込み。H3は節の最初のReadingStepへ1回同梱しbody数に含めない。table/listを分割せず、元記事の全ASTを復元して完全一致を確認する。

| 図 | sourceDigest |
| --- | --- |
| context-causal-cost | `sha256:3d148c85ba70c31149692bbbb25b7ce25ec0d9a9457b43f85b646287e4ff625e` |
| context-cache-quality | `sha256:cbdf6f68c773444b57ccffc29430974e2705c11460558a8b39b4ea0fabc6c7ed` |

causalの意味依存は概要〜KVの4H3、cacheの意味依存は概要〜長文品質の5H3。包装範囲とは別。元AST index・blockTypes・group countはJSON reading.bindingsに記載。

## context-causal-cost

scene export `ContextCausalCost({ children })`、CSS prefix `ccc-`、scene class `context-causal-cost-scene`。model exports: `CONTEXT_CAUSAL_STAGES`, `CONTEXT_QUERY_POSITIONS`, `CONTEXT_LENGTHS`, `contextCausalCostFrame`。

関数: `contextCausalCostFrame(phase, { queryIndex = 3, length = 6 } = {})`。

| S | 到達 | 必ず見える意味 | 固有操作 |
| --- | --- | --- | --- |
| 0 因果的な範囲 | READ | 既定6位置/query3。query変更時に現在行と未来maskを更新し、未来へ活動中の参照線を残さない。 | queryIndex |
| 1 関連を混ぜる | READ | 既存「それ」と名詞役割だけ。t3の参照可能なt0..t3から混合枠へ線。太さは模式で数値weight/vector/正答判定はnull。 | なし |
| 2 機会と保証 | READ | 4/6位置の下三角範囲を比較。面積が増えても品質の合格印/性能曲線を足さない。入力一括の素朴な注意と実時間を区別。 | length |
| 3 二つの処理 | READ | 両レーンを同時に残す。prefillは0..5、次回decodeは位置6だけ。候補6は次回処理前にはKVなし、処理後KV0..6/次候補7はKVなし。時間値は未測定。 | なし |
| 4 計算とメモリ | READ | 入力4/6位置とK/V帯のIDを対応させる。Qを保存せず学習重みは別枠。bytes/料金/品質をセル数から計算しない。 | length |

| 設定 | 値 / 既定 | 有効段階 | 変えるもの |
| --- | --- | --- | --- |
| queryIndex「現在の位置」 | 0, 1, 2, 3, 4, 5 / 3 | 0 | 現在行と未来mask/参照線だけ。順序は保持。 |
| length「説明用の入力長」 | 4, 6 / 6 | 2, 4 | 説明セル数・参照面積/S4のK/V帯だけ。品質/速度/価格は計算しない。 |

対象段階だけcontrolをrenderしreadyで操作可能にする。非対象段階のeffective settingはnull、非対象設定の変更で意味frameを変えない。必要物の一覧は既定設定のREAD到達状態を基準とし、操作後のゼロ件領域は該当fixtureに従う。

図の短い注記: 密な因果注意を示す模式図です。参照範囲やセル数は、理解の正しさ・実時間・料金の測定値ではありません。

frame fields:

- common: phase, stage, label, title, detail
- effectiveQueryIndex: S0のみqueryIndex、他null
- effectiveLength: S2/4のみlength、他null
- tokens: 固定6slotの全部またはS2/4のprefix4slot。IDと順序を保持。
- maskRows: 選択長の下三角表。S0は選択query、S1は固定query3。
- referenceLines: 許可sourceのみ。S1は模式weightRoleから表現枠への混合。
- processing: S3でprefill/decodeの両fixtureと候補非保存を表示。
- kv: S4で各位置のK/V。Qなし、bytes null。
- metrics: ttft/速度/memory/price/qualityのvalue/unit null
- claims: fixtures.nonClaims

DOMの意味属性（実際の可視要素へ付ける）:

- root: `data-context-causal-stage`, `data-attention-scope="dense-causal-example"`, `data-query-index=<integer|none>`, `data-context-length=<integer>`, `data-quality-judgment="none"`
- tokens: `data-context-token-id`, `data-context-position`
- matrix: `data-query-position`, `data-key-position`, `data-attention-allowed=<true|false>`, `data-future-masked=<true|false>`
- mix: `data-mix-source`, `data-weight-role=<light|medium|strong>`, `data-weight-origin="illustrative"`, `data-mix-target="contextual-representation"`
- processing: `data-processing-lane=<prefill|decode>`, `data-processed-positions`, `data-cached-positions`, `data-sampled-position`, `data-sampled-in-cache="false"`
- kv: `data-kv-field=<K|V>`, `data-kv-position`
- metrics: `data-context-metric=<id>`, `data-measured="false"`
- caveats: `data-caveat="reach-not-correct-use"`, `data-caveat="pairs-not-wall-clock"`, `data-caveat="not-all-attention"`

## context-cache-quality

scene export `ContextCacheQuality({ children })`、CSS prefix `ccq-`、scene class `context-cache-quality-scene`。model exports: `CONTEXT_CACHE_QUALITY_STAGES`, `CONTEXT_PREFIX_EDITS`, `CONTEXT_INFO_POSITIONS`, `CONTEXT_DOCUMENT_SETS`, `contextCacheQualityFrame`。

関数: `contextCacheQualityFrame(phase, { editMode = "suffix-change", importantPosition = "middle", documentSet = "with-distractors" } = {})`。

| S | 到達 | 必ず見える意味 | 固有操作 |
| --- | --- | --- | --- |
| 0 KV再利用 | READ | 過去6位置のK/Vを再利用し、候補を次回入力処理してから位置6KVを追記。別要求で自動的にhitするとは言わない。 | なし |
| 1 共通接頭辞 | 補助 | 補助段階。先頭4位置を一致帯、後2位置を比較対象にする。実service hitとは表示しない。 | なし |
| 2 変更位置 | READ | 未操作の既定suffix-changeで4保持/2再計算を同時表示。先頭変更は保持0、追記は保持6/新規未計算1/無効化0。Agent履歴の追記も同じ末尾。 | editMode |
| 3 入ると使える | READ | 同じ情報IDを位置0/3/5へ移す。値null、普遍的U曲線・中間必敗の色付け・品質順位なし。 | importantPosition |
| 4 妨害と統合 | READ | 位置と必要2文書を保持して追加資料だけ加減。未操作READ4でも3位置比較の小さな要約図を残す。検索/統合は別の未測定枠で、成功を転用しない。 | importantPosition, documentSet |
| 5 選んで渡す | READ | 不要資料を畳む模式図と独立したprefix境界図を同時表示。選択で入力が変われば一致範囲も変わり得る。cache不変/品質改善を保証しない。 | なし |

| 設定 | 値 / 既定 | 有効段階 | 変えるもの |
| --- | --- | --- | --- |
| editMode「入力の変え方」 | front-change, suffix-change, append / suffix-change | 2 | 共通prefixと再計算/新規位置だけ。service hit/割引は未測定。 |
| importantPosition「重要情報の位置」 | beginning, middle, end / middle | 3, 4 | 同じ情報IDの位置だけ。具体例文/回答/性能値を作らない。 |
| documentSet「評価に渡す資料」 | needed-only, with-distractors / with-distractors | 4 | 必要資料を固定し、追加資料だけ加減。原因/性能差は推定しない。 |

対象段階だけcontrolをrenderしreadyで操作可能にする。非対象段階のeffective settingはnull、非対象設定の変更で意味frameを変えない。必要物の一覧は既定設定のREAD到達状態を基準とし、操作後のゼロ件領域は該当fixtureに従う。

図の短い注記: 接頭辞の構造的な再利用と、長文で確かめる観点の模式図です。実際のキャッシュヒット・料金・回答品質を測定する図ではありません。

frame fields:

- common: phase, stage, label, title, detail
- effectiveEditMode: S2のみeditMode、他null
- effectiveImportantPosition: S3/4のみimportantPosition、他null
- effectiveDocumentSet: S4のみdocumentSet、他null
- generationKv: S0の同一生成内K/V/新入力位置と別要求境界
- prefix: S1/S2/S5別軸に2入力/境界/固定可変role。S2以外は固定suffix-change fixture
- prefixStatus: structure only; service値はnull
- importantInformation: 同じIDを位置0/3/5へ、text/回答/性能null
- documents: 必要2文書保持。妨害2文書はS4のみ切替。S5は固定の選択模式図。
- evaluation: retrieval/integrationそれぞれresult/score null
- axes: S5で情報選択/prefix再利用を別の未測定判断として同時表示

DOMの意味属性（実際の可視要素へ付ける）:

- root: `data-context-cache-stage`, `data-prefix-edit=<enum|none>`, `data-important-position=<enum|none>`, `data-document-set=<enum|none>`, `data-provider-cache-hit="unknown"`
- generation: `data-cache-boundary=<same-generation|cross-request>`, `data-kv-field=<K|V>`, `data-kv-position`
- prefix: `data-prefix-input=<base|candidate>`, `data-prefix-position`, `data-prefix-role=<fixed|variable>`, `data-prefix-state=<structurally-reusable|needs-recompute|new-uncomputed>`, `data-common-prefix-length`, `data-change-position=<integer|none>`
- quality: `data-important-info="important-info"`, `data-info-position`, `data-position-case=<beginning|middle|end>`, `data-document-id`, `data-document-role=<needed|distractor>`
- evaluation: `data-evaluation-kind=<retrieval|integration>`, `data-evaluation-status="unmeasured"`
- axes: `data-decision-axis=<information-selection|prefix-reuse>`
- caveats: `data-caveat="structure-not-service-hit"`, `data-caveat="position-not-universal"`, `data-caveat="retrieval-not-integration"`, `data-caveat="not-only-dilution"`

## 固定fixtureの意味

### 因果注意・prefill・decode

固定6slot t0..t5、t1は名詞という役割、t3だけ元本文の「それ」。S1はt0..t3の重み付き混合を示す。太さlight/strong/medium/mediumは模式的で、numericWeights/outputVector/正答判定はnull。新例文・層の語→句→文固定対応を作らない。

独立mask fixtureは4行 `1000/1100/1110/1111` と6行 `100000/110000/111000/111100/111110/111111`。許すセル10/21はFLOPsや実時間ではなく参照可能なペアの模式数。画面に速度倍率/数式/品質値を足さない。

prefill: 入力0..5を処理→KV0..5→候補6は未保存。次回decode: 候補6を入力処理→KV0..6→次候補7は未保存。選んだ候補は処理前からKVに存在しない。S3では両レーンとTTFT/生成速度を同時に示す。S4はK/Vだけを保持し、Qと共通学習重みは別。bytes/秒/毎秒/価格/品質はnull。

### 共通接頭辞とREAD2

基準はp0..p5。p0/p1は固定部（システムプロンプト/ツール定義）、後方は可変部（履歴/ユーザー入力/検索結果）。同じモデル・位置・計算条件の密な因果依存だけを説明する。模式IDは実tokenizer出力や追加例題ではない。

| 変更 | prefix長 | 保持候補 | 再計算 | 新規未計算 |
| --- | --- | --- | --- | --- |
| 先頭p0変更 | 0 | なし | 0..5 | なし |
| 後方p4変更（既定） | 4 | 0..3 | 4,5 | なし |
| 後方へp6追記 | 6 | 0..5 | なし | 6 |

**READ2に未操作で到達した時点で、先頭が揃った2入力・固定/可変ラベル・prefix4位置と境界・保持4位置/再計算2位置を同時に見せる。** 補助1を通った履歴に依存させない。追記の新位置を「壊れた過去のcache」と表示しない。未来の変更が以前へ影響する線を引かない。

状態は `structurally-reusable / needs-recompute / new-uncomputed`。service hit/TTL/最低prefix長/料金/割引はnull。構造的一致は実service hitの保証ではない。同一生成内のKVと別要求のcache境界はS0から区別する。

### 内部で参照できることと実能力

同じimportant-infoを先頭0/中間3/末尾5へ移す。内容textはnullで回答例を作らない。S4でも3位置比較を小さな要約図で残し、必要文書A/Bを固定したまま追加の無関係/類似文書だけを加減する。検索と統合は独立した評価枠でresult/scoreはnull。中間必敗の色付け、普遍的U曲線、原因断定を作らない。

S5は必要文書の選択とprefix再利用という2軸を同時に残す。選択で入力が変わればprefixも変わり得るため、cache不変/品質改善を保証しない。資料A/Bやセル数は説明上の場所で、実験結果や推奨データ量ではない。

## 共有実装と所有

固有controlはcausal2個/8option、cache3個/8option、合計5個/16option。共通SceneBaseは640×430、ReadingFigureの読書/再生/停止/手動/戻る/拡大/keyboard/reduced-motionを再利用する。安定IDと元入力を保った位置/線/maskの補間だけで意味を変化させ、新しいtimer/APIを追加しない。

dispatcherは `ContextWalkthrough`、ファイル `website/components/diagrams/context-walkthrough.jsx`。2つのliteral lazy importとCSSだけを登録し、ReadingArticleContents/DiagramBoundary/元childrenを再利用。既存attention-context-model.mjs / contextFrame / CONTEXT_STAGESとは別module・別exports。既存記事を置き換えない。

共有変更はroot担当だけ。BINDINGS/registry/decoration/MDX allowlist/mdx-components/articles/acceptance/共通試験を同期する。式/任意props/spread/import/ネストwalkthroughを許可しない。固有所有8ファイル:

- `website/lib/context-causal-cost-model.mjs`
- `website/components/diagrams/context-causal-cost-walkthrough.jsx`
- `website/components/diagrams/context-causal-cost.css`
- `website/tests/unit/context-causal-cost-model.test.mjs`
- `website/lib/context-cache-quality-model.mjs`
- `website/components/diagrams/context-cache-quality-walkthrough.jsx`
- `website/components/diagrams/context-cache-quality.css`
- `website/tests/unit/context-cache-quality-model.test.mjs`

共通frame契約:

- phase/settingsから決定的なframe。副作用・前段階state依存なし。
- 定数freeze、返り値arrays/objects分離、入力非破壊。
- settingsはplain object(Object.prototypeまたはnull prototype)。null/array/Date/function/primitiveとunknown keyはTypeError。未知enum/数値選択はRangeError。
- 対象外設定は保存してもeffective値をnullとし、非対象段階のframe意味を変えない。
- 未知の科学値/性能値/provider値はnull。可視表示は未測定/条件依存。セル数/座標は実測データではない。
- 共有時計/UXを再利用し、独自RAF/interval/random/Date/network/APIは追加しない。

有限phase以外はTypeError、有限の範囲外値はclamp、中点は共通stageForPhase。Select側でNumber変換し、modelで数値文字列を暗黙変換しない。公開kitや生成物は今回触らない。

## 非主張

- 密な因果注意の例であり、局所/双方向等すべての注意構成を表していない。
- 参照可能性/重みを、認知・正しい利用・因果説明・回答正解の証拠にしない。
- 元「それ」と役割名以外に新しい具体例文を足さない。模式セルは製品tokenizer出力やcontext上限ではない。
- 入力一括の注意ペア規模とキャッシュdecode/最適化後演算数/モデル全体の実時間/料金を同一視しない。
- 候補は選ばれた時点でKVにない。次回入力処理後に保存。KVはQや学習済み重みと別。
- 構造的再利用候補だけを示し、提供側のTTL/最小長/一致条件/価格/割引/hit率/アクセス境界は発明しない。
- 未来への追記は既存の過去を変えない。新規未計算位置と再計算が必要な既存位置を区別。
- 位置効果は対象モデル/タスクに依存。普遍的U字曲線、中間必敗、妨害文書の必ずの悪影響を描かない。
- 品質差を重みの希釈だけで説明せず、検索成功を統合成功へ読み替えない。
- 情報選択とprefix再利用は別の判断軸。品質/費用改善はこの図だけで保証しない。
- 実モデル/API/Agent、実service cache計測、CI/公開確認は実施していない。

## 独立検証案

### source-preservation (source+decoration)

- 39 root nodes / H3 8 / body15の全AST復元一致。数式0・Mermaid0・code0を保持。リンク23/表1/リスト10/強調18を削除しない。
- 5H3/body12を2図へ順序どおり包装、READ10/manual1。H3を最初のstepへ1回、table/listを分割しない。
- 18動的topicのbody→stageをliteral確認し静的12論点を保持。digest/heading/blockTypes/countのずれを拒否。

### independent-oracle (reviewed-literal-fixture)

- 検証者が原文/採択計画からmask、prefix、候補のKV時点、必要可視物を独立に確認したliteralを使う。製品frameを期待値生成に使わない。
- 6行/4行のmask文字列とqueryごとのallowed/maskedを検算。10/21セルはFLOPs/実時間/価格として表示しない。
- prefix3ケースの境界/保持/再計算/新規をliteral arraysで照合。本番の比較関数をoracle側で呼ばない。

### causal-boundary-and-mix (model+browser)

- query0..5全6値で自己以前だけ参照。未来mask先が混合sourceに含まれない。query3はallowed0..3、masked4..5。
- S1は「それ」/名詞役割/重み付き混合が可視。太さは模式で実attention値/正答根拠にせず、固定言語階層を描かない。
- S2のlengthは参照面積だけを変える。品質/価格/時間nullと密な因果注意の限定ラベルを保持。

### prefill-decode-kv (model+browser)

- S3で両レーンとTTFT/生成速度を同時表示。prefill処理0..5→KV0..5/候補6非保存。decode処理6→KV0..6/候補7非保存。候補を先取りしてKVへ入れない。
- S4のK/V位置IDが4/6入力に対応。Q保存/学習重み更新なし、bytes/単価/時間なし。
- cache S0は同一生成のKVと別リクエストのcache境界を可視labelで分け、service hitはnull。

### prefix-read-carryover (untouched-READ+runtime)

- manual1/selector/前後/再生を使わずREAD2へ。先頭が揃う2入力、固定/可変ラベル、prefix4位置と境界、再計算2位置が同時に実表示される。
- 既定suffix-changeは保持0..3/再計算4..5。front-changeは保持なし/再計算0..5。appendは保持0..5/新規6/無効化なし。ゼロ件の領域を架空に作らない。
- 後方変更が以前の位置へ影響しない。構造的候補を実service hitと断定せず、提供仕様の未確認を保持。

### quality-is-separate (model+browser)

- S3全3位置で同じ重要情報ID/textを保持。表示性能/順位/普遍的U曲線なし。
- S4の両資料条件でneeded-a/bと情報を保持。追加a/bだけ変わり、retrieval/integrationのresult/scoreは別々にnull。未操作READ4でも3位置比較の要約と2評価枠が見える。
- S5は情報選択/prefix再利用を別軸で同時表示。cache改善→品質改善を推論しない。情報選択でprefixも変わり得ることを表示。

### settings-and-clock (pure-model)

- 共通clampPhase/stageForPhase。有限数以外TypeError、有限範囲外clamp。直接到達/逆seek/中点で履歴に依存しない同じ意味。
- plain settings objectのみ。未知key/不正objectはTypeError、未知enum/不正数値選択はRangeError。Select側でNumber変換し、modelで文字列を暗黙変換しない。
- 全5controlの有効stageを検査。非対象effective値null、対象外設定を変えてもframe意味は不変。定数freeze、返り値deep mutation隔離、入力非破壊。
- phaseは提示時計で実秒/速度/学習実行ではない。Date/random/network/新たなRAF/intervalなし。

### visual-fallback-regression (browser+visual+SSR)

- 全11段階のPC通常/拡大/狭幅、light/dark、reduced-motion、keyboardを既存受入枠で確認。実bbox/screenshotで文字/線/mask/境界を確認。隠れたDOM/ARIAだけでは合格にしない。
- 未操作READ10を前後両方向で確認。STOP/手動/戻る/拡大/非表示停止を保持し、2図で読書位置を奪わない。
- JS無効/chunk失敗/printでも原文と主要段階静止図が読める。元table/list/linkを保ち、ページ全体overflowなし。
- 既存attention-context図は別記事の実装。新module/ID/CSSが干渉しない。旧対象/無図対照/旧primary assertionsを保存し、E1公開kitは別レビュー。

## 検証状態と次の手順

今回実施したのは本文raw SHA、2sourceDigest、section AST/types、18dynamicのbody→READ、READ10/body12/11段階、mask/prefix fixtureの内部整合、採択objectコピー一致、全入力hashの再照合という作成者自己確認のみ。独立レビュー、製品unit/browser、build、CI、公開受入は未実施。

D2公開受入、本案の独立レビュー、親担当の開始指示後。開始時本文SHA/sourceDigest/共有実装を再照合し変化があれば案を更新・再レビュー。

実装時にroot check、website unit/sync/build、browser/視覚/独立内容レビュー、記事coverage、release kit、CI/Pages、公開配信hash/runtimeを別証拠として記録。今回は未実施。

旧case名/順/本文/primary assertionsを保護。E1追加のliteral fixtureとflat predecessor proofを別の独立レビューにかける。

採択後にrepo相対pathを正本としてprojectへ移す。TEMPをimport/実行依存や唯一の引継ぎ正本にしない。

全入力raw/LF SHA、全AST/section SHA、元採択E1全文、frame/attribute/fixed fixture契約は同名JSONに保存した。
