# E2 文脈内学習と記憶: 実装前インターフェース案

作成日: 2026-09-30。状態: **未レビューの提案・未実装・未受入**。

対象は `docs/11-llm-internals/in-context-learning-and-memorization.md`。親担当からの依頼により、PR62 CI 待ちの間に E2 の実装前契約だけを準備した。所有は本 MD と同名 JSON の TEMP 2 ファイル。製品、本文、公開 kit、Git、ゲート、正本記録は変更しない。他者の作業を戻さない。終了条件は、採択済み絵コンテを変えず、実装と独立検査に使える exports・hook・意味オブジェクト・READ 対応を具体化して親担当へ返すこと。外部操作は不要で、実施していない。

採択元は project/records/2026-09-24/p1-remaining-storyboards.md/json とその独立計画レビュー。E2 の前提は E1 と C2 の公開受入である。本提案から実装開始や公開受入を宣言しない。JSON の adopted は採択元 E2 全体をそのまま保持する（当時の draft/status を含む）。追加の proposed/common は今回の未承認提案であり、採択済みの state / motion / checks / readCarryover を置き換えない。実装担当になった場合も、作者による自己承認を独立レビューと呼ばない。

## 固定する範囲と原文の保全

原文 SHA256 は `c150ab8ee4a72dc6786a5abb52e0266f97d78f1b6584ce1c695e01f94106f5c4`。採択元と現在の原文は一致し、E2 の訂正候補はない。図ラベル以外の本文・具体例・新規の科学的主張を加えない。各図は概念図であり、因果効果、精度、実性能曲線、最適例数・順序、実測の確率を作らない。一次研究の鮮度調査は今回の範囲外である。

原文 AST は H3 8 個、うち連続した 5 H3・15 body blocks を包装する。表示数式 1、inlineMath 2、inlineCode 3、fenced code 0、Mermaid 0。式・リストを分割せず、リンク、見出し、順序、コードを保持する。3 図・13 段階・11 READ 停止・手動専用 2 段階。元 AST の position を除き、キーをソートして文字列を LF 正規化した canonical AST SHA256 は `02db1d0966c20a40c22a6334ea810b5d7d96bcd463a77630d5f9323f36bbd7d4`。

原文の唯一の表示式（AST 値）:

~~~tex
p(\text{出力} \mid \text{プロンプト}) = \int p(\text{出力} \mid \theta,\, \text{プロンプト})\, p(\theta \mid \text{プロンプト})\, d\theta
~~~

| 図 | READ stages | 手動専用 | 採択 / 再計算した sourceDigest |
| --- | --- | --- | --- |
| `icl-hypotheses` | 0, 1, 3, 4 | 2 | `sha256:6194981065168116f345a0845c1cced61a940a9775c702d158e53177cf04b7e5` |
| `icl-demonstrations` | 0, 1, 2 | なし | `sha256:b1fa9562e83d2c634dec83ba57fdacf802184cf3df3d44a1c8df2514dac5b750` |
| `icl-memory-evaluation` | 0, 2, 3, 4 | 1 | `sha256:c514cb25832cbf38561bfbd14380fffb0005d3a0f55170de88cf77e835b284b4` |

全 37 論点（動的 22・静的 15）の対応は JSON adopted.topics を変更せず引き継ぐ。静的論点を図対応済みと上書きしない。grouped-blocks / sourceHeadings / blockTypes は JSON inventory.bindings に明記した。

## ファイルと共通 API の提案

| id | component named export | model frame / stages / fixture |
| --- | --- | --- |
| icl-hypotheses | IclHypotheses | iclHypothesesFrame / ICL_HYPOTHESES_STAGES / ICL_HYPOTHESES_FIXTURE |
| icl-demonstrations | IclDemonstrations | iclDemonstrationsFrame / ICL_DEMONSTRATIONS_STAGES / ICL_DEMONSTRATIONS_FIXTURE / ICL_DEMONSTRATION_FOCI |
| icl-memory-evaluation | IclMemoryEvaluation | iclMemoryEvaluationFrame / ICL_MEMORY_EVALUATION_STAGES / ICL_MEMORY_EVALUATION_FIXTURE |

各 id に `website/lib/<id>-model.mjs`、`website/components/diagrams/<id>-walkthrough.jsx` と `<id>.css`、`website/tests/unit/<id>-model.test.mjs` の 4 ファイル。合計 12 ファイル。共有統合は親担当が担当し、icl-walkthrough.jsx の IclWalkthrough({diagramId,children}) が固定 allowlist 3 件を遅延 import する案。準備段階ではファイルも registry 登録も作らない。

各 scene は ({children}) を受け、既存 ReadingFigure / SceneBase / Select を使う。renderScene の {phase,stage,id,ready}、renderControls の {ready,phase,stage} を継承。SceneBase は標準 640×430 viewBox、role=img、namespaced title/description。意味 ID と DOM id は区別し、後者は renderScene.id で名前空間化して拡大表示との重複を避ける。

frame(phase, options={}) は純粋関数。clampPhase / stageForPhase を再利用し、有限 phase は範囲内へ clamp、段階は Math.round。文字列、null、undefined、NaN、Infinity 等の phase は TypeError。options は plain object、unknown key・不正 enum を拒否する提案である（既存全モデルが同じ厳格性を持つとは主張しない）。整数 stage の意味・説明・ID と表示ラベルは一致し、中間 phase は提示上の動きにだけ使う。返却の入れ子オブジェクトは別呼び出しへ変更が波及しない。STAGES と固定 fixture は frozen。

戻り値の共通部分は {phase,stage,label,detail}、図別意味フィールドは JSON proposed[].frameFields。scene marker は lazy scene の eyebrow にだけ置く。marker は順に ICL / HYPOTHESES、ICL / DEMONSTRATIONS、ICL / MEMORY & EVALUATION。段階属性は data-icl-hypotheses-stage、data-icl-demonstrations-stage、data-icl-memory-evaluation-stage。必須 hook は可視オブジェクト / 線と対応させ、非表示 DOM だけでは合格にしない。

既存の読書連動、停止・前後・再生・再読書、キーボード、拡大と focus return、reduced motion、JS 無効、印刷を引き継ぐ。停止中・非表示中の常時 loop を追加しない。操作は例図の強調切替 1 個だけ。READ の意味を理解するために操作や拡大を必須にしない。

## 採択段階・READ 対応（変更なし）

### icl-hypotheses

- S0 重みは固定（READ）: 例と新入力が文脈に入り、同じモデルから出力。重み更新の経路はない。 動き: 文脈カードが追加されるが重み枠は静止。
- S1 ベイズ的な仮説（READ）: 例→タスクの事後分布→出力の周辺化を原式の項に結ぶ。仮説と明記。 動き: theta候補の強調が変わり、積分項へ合流。
- S2 学習則の模倣（手動専用）: 順伝播の内部計算が学習アルゴリズムに似るという限定的な研究解釈。推論で重みを書き換えない。 動き: 表現内部の状態だけを更新し固定重みを保持。
- S3 誘導ヘッド（READ）: 本文のA B ... AからBへのコピー経路と、入力例→順伝播内の状態更新→出力という学習則模倣の仮説経路を並べる。状態更新は内部表現に限定し、モデル重みは固定。仮説名だけの見出しへ省略しない。 動き: 前のA/Bから後のAを経て出力Bへ経路を追う。
- S4 相補的な候補（READ）: 3仮説を同じ入力/出力枠へ並列接続。排他的選択や決着の印は付けない。 動き: 3経路が同じモデル枠の異なる観点として揃う。

READ 原文対応: 「概要: 重みを変えずに「学ぶ」ように見える」= S0 / 1 body block；「ICL はなぜ起きるか: 主要な理論仮説」= S1 / 4 body block → S3 / 1 body block → S4 / 1 body block。H3 は最初の ReadingStep に同梱し、body count に含めない。

### icl-demonstrations

- S0 何を示す例か（READ）: 例列に形式・ラベル空間・入力分布のタグを付け、出力ラベルの正しさと区別。 動き: 同じ例の別の属性を順に強調。
- S1 数と順序（READ）: 同じ例IDの順序変更と例数変更を別条件にする。ラベル破壊の研究は条件依存として小ラベルで残す。 動き: 順序ではカードを移動、例数では末尾を加減。混ぜない。
- S2 評価で確認（READ）: 元条件・変更条件を同じ評価欄へ接続。増量の単調な改善や誤ラベル推奨の表示はしない。 動き: 変更軸を固定した比較行を揃える。

READ 原文対応: 「few-shot の例の効き方」= S0 / 1 body block → S1 / 1 body block → S2 / 1 body block。H3 は最初の ReadingStep に同梱し、body count に含めない。

### icl-memory-evaluation

- S0 二つの評価（READ）: 学習で見たデータと未見データを別枠にする。 動き: 同じモデルから二つの評価先へ分岐。
- S1 逐語記憶（手動専用）: 訓練データと出力の一致を強調し、汎化への等号を付けない。 動き: 同じ記号IDが出力へ現れる対応線。
- S2 異なる現象（READ）: 逐語記憶・grokking・二重降下を三つの小枠で同時に可読化。時間と規模の軸を混同しない。 動き: 時間枠は遅れて変化、規模枠は非単調という質的形だけ。実測値なし。
- S3 訓練改善と汎化（READ）: 訓練指標からテスト成功へ直接の保証線がないことを表示。 動き: 2評価の間の未保証表示を残す。
- S4 汚染（READ）: 評価データが訓練集合へ混入する重複と、非公開/新しい評価を別に配置。完全無汚染の保証印は付けない。 動き: 一部評価カードが訓練領域と重なり、独立評価側を強調。

READ 原文対応: 「記憶と汎化」= S0 / 1 body block → S2 / 1 body block → S3 / 1 body block；「データ汚染とベンチマークへの含意」= S4 / 2 body block。H3 は最初の ReadingStep に同梱し、body count に含めない。

## 重みを固定した三つの説明: オブジェクトと hook

iclHypothesesFrame(phase, options={}) の options は空のみ。仮説の winner を選ぶ control は作らない。

prompt-0（ex-1 / ex-2 / ex-3 と query-0）、output-0、weights-W を固定する。W は model-parameters で updated=false。latent-task-theta は潜在タスク θ で、学習済み重みの別名にしない。posterior の数値と θ の具体的な候補集合は未指定に保つ。bayesian / learning-rule / induction-head は非排他的な候補であり決着済みとはしない。

S1 は posterior-theta「p(θ | プロンプト)」、conditional-output「p(出力 | θ, プロンプト)」、marginal-output「∫ … dθ」を原式の項へ結ぶ。事後分布と条件付き出力が積分へ合流する構図にし、一つの θ を当てたから正答するという winner 選択へ置換しない。強調の移動は概念的で、確率バーや百分率は置かない。

学習則仮説は prompt-0 → representation-before → representation-after → output-0。更新対象は順伝播の内部表現だけで、optimizerUpdate=false。限定的な研究設定という留保と固定 W を残す。S3 はこの全経路を上段、誘導コピーの全経路を下段に置き、二つとも READ で見える大きさを確保する。

誘導側は ctx-a-early=A、ctx-b-early=B、ctx-gap=…、ctx-a-late=A、out-b=B の異なる occurrence を使う。previous-pair は最初の A→B の隣接関係、match-a は後の A→前の A の同じ記号の対応、copy-b は前の B→出力 B の候補コピーで match-a が条件。実測注意重みや介入の因果効果ではない。動きは本文どおり前の A/B と後の A を経て出力 B を読むための強調である。S4 は三候補の短い経路を並列で残す。

必須 hook 群: data-model-weights-id=weights-W / data-fixed=true、data-latent-task-id=latent-task-theta / data-symbol-role=latent-task、data-bayes-term=posterior|conditional|marginal、data-hypothesis-path=bayesian|learning-rule|induction-head、data-update-target=internal-representation、data-representation-state、data-context-occurrence、data-induction-relation / data-from / data-to、data-induction-limit=candidate-not-all-icl、data-hypothesis-relationship=complementary / data-exclusive=false。段階ごとの可視対象と属性の全値は JSON に列挙した。

必須結論は「推論中の W は固定」「θ と W は異なる」「内部表現の更新は重み更新ではない」「誘導ヘッドは候補で全 ICL の証明ではない」「三候補は相補的で未決着」。文脈内コピーと外部検索を同一にしない。図に外部検索ノードを置かないことは、ICL と検索を組み合わせられないという主張ではない。

## 例の形式・数・順序: 小さい操作と固定比較

iclDemonstrationsFrame(phase, {comparisonFocus='order'}={})。唯一の custom Select は「強調する変更」。option は order=「順序」、count=「例数」、既定値 order。S1/S2 の強調にだけ効く。S0 は control を隠して effectiveComparisonFocus=null とし、選択が意味・構図へ影響しない。S1/S2 は未選択の行も常に表示する。

| condition | 順序 | 枚数 | 変更軸 |
| --- | --- | --- | --- |
| baseline | ex-1, ex-2, ex-3 | 3 | none |
| order | ex-3, ex-1, ex-2 | 3 | order |
| count | ex-1, ex-2 | 2 | count |

例のカード内容は ID と「入力→出力」の概念表示だけ。本文にない具体的な問題・出力・正解例を作らない。同じ query-0、weights-W、形式・ラベル空間の規約、evaluation-condition-0 を使い、order 行は集合を保持、count 行は末尾の ex-3 だけを減らす。例数変更で観測された入力分布まで同一だとは言わない。入力分布タグは例が伝えうる属性であり、固定された実測分布ではない。

data-example-attribute=format|label-space|input-distribution、data-example-id、data-occurrence-id（conditionId-exampleId）、data-demonstration-condition、data-example-order、data-example-count、data-changed-axis、data-comparison-focus で可視カードと比較行を観測する。data-label-study-limit=task-and-setting-dependent と data-label-corruption-recommended=false は可視の留保を伴う。S2 は data-evaluation-protocol-id と data-improvement-guarantee=false を表示する。

数値 3/3/2 は構造上の枚数だけで、精度・効果量ではない。scores / optimalOrder / optimalCount は null。架空スコア、収穫逓減の実測曲線、最適順序を作らない。「研究結果はタスク・設定に依存」「誤ラベルを推奨しない」を図の短いラベルにし、ラベルが常に不要とも例数増量が必ず改善するとも示さない。

## 記憶・汎化・汚染: 対応関係と質的な軸

iclMemoryEvaluationFrame(phase, options={}) は空 options のみ。三つの現象を切り替えて隠す control は置かない。

S0 は evaluated-model / checkpoint-unspecified の同じ時点から training-set（training-item）と heldout-set（heldout-item）へ分岐し、training-metric / heldout-metric を別表示する。数値は null。訓練の進行に沿う grokking は異なる checkpoint を含みうるため、その時間軸全体に推論図の「重み固定」を適用しない。

S1/S2 の逐語記憶は train-span-occurrence と output-span-occurrence が同じ span-m を持つ対応。verbatim-match は一致の線であり、外部データベースの読出し・因果介入・全出力が記憶であるという意味ではない。既存 Wire は必ず矢印先端を付けるため、この対応には plain SVG path（marker なし）を使う。未見データへの汎化は別枠で残す。

S2 は上段の一致線付き記憶枠、その下の grokking / 二重降下 2 枠で、三現象を同時に見せる。grokking の x 軸は training-progress「学習の進行（時間）」、y 軸は「誤差（概念）」。訓練での改善後に汎化が遅れる場合という質的形だけで、小さな課題等の限定を保つ。二重降下の x 軸は model-scale「モデル規模」、y 軸は「テスト誤差（概念）」、方向は下がる→上がる→下がる。描画座標は図形用で、数値 tick、実測点、最適規模・転換点を置かない。三現象を互いの原因として連結しない。

S3 は訓練指標からテスト成功への保証がないことを残す。S4 は別の概念シナリオとして、train={training-item, shared-eval-item} と benchmark={shared-eval-item, benchmark-other} の共通 ID を示す。実データの汚染率やスコア増分ではない。private-evaluation「非公開の評価」、recent-evaluation「新しい評価」、contamination-check「混入を点検」を別に置き、いずれも cleanliness=unknown で完全無汚染の印を付けない。

必須 hook 群: data-evaluation-target=train|heldout、data-learning-metric / data-value=unknown、data-memorized-span=span-m / data-occurrence-id、data-memory-relation=verbatim-match / data-relation-kind=correspondence / data-causal-proof=false / data-retrieval=false、data-learning-phenomenon、data-qualitative-axis=training-progress|model-scale / data-measured=false、data-memory-generalization-equality=false、data-training-generalization-guarantee=false、data-dataset-membership / data-item-id、data-contamination-overlap=shared-eval-item / data-score-increment=unknown、data-evaluation-alternative / data-cleanliness=unknown / data-clean-evaluation-guarantee=false。

## 独立 assertion の計画と引き継ぎ

独立 fixture 作者は採択絵コンテとレビュー後の本契約から literal ID・列・対応・軸を固定する。製品モデルを期待値生成に使わず、DOM から読み戻した値で期待値を作らない。これは構造と意味の検査であり研究の実性能検証ではない。

- unit: 全 13 整数段階、10 境界の .49/.50/.51 を往復する 60 phase visits、不正入力と clamp、同じ入力の決定性、入れ子変更の非波及、selector 2 値と inactive S0 を検査する。
- 負例: 中点の段階不一致、θ と W の混同、重み更新への置換、持越し経路の見出し化や hidden DOM 化、誤った induction occurrence、並べ替えによる集合変更、末尾以外の例数変更、未選択比較の非表示、時間と規模の交換、実測値・精度・汚染スコア捏造、逐語一致の検索 / 因果矢印化、無汚染保証を落とせることを確認する。
- AST: 3 digest と blockGroups / blockTypes の一致、wrapper 復元後の original AST 完全保持、数式・リスト・リンク・コード・見出しの保持を確認する。
- browser: 全 11 READ 停止を往復する。仮説 READ3 と記憶 READ2 の持越しは新規ページからスクロールのみで到達し、selector・前後・再生・拡大を先に操作しない。経路・対応線・軸・留保が可視かを実画像とアクセシビリティ内容で確かめる。
- UI: 通常クリック・keyboard、選択の図間独立、play/pause/replay、読書へ戻る、modal と focus、reduced motion、noJS / print を既存契約どおり検査する。最低限の既存 profiles は 1440 light/dark、1280×720 light、390 light/dark、960×540 DSF2 と、その時点の large / tablet 必須枠。viewport と complete-scene の画像を区別する。
- 実装後に別担当が scene / model / 内容を独立レビューし、同一入力の local / public を別に検証する。今回の作者は独立承認を出さない。

今回実施したのは原文・採択契約・既存 API の読取、原文 SHA と sourceDigest 3 件 / AST inventory の再計算、および本提案の整合確認だけ。製品 unit・browser・build・CI・公開受入は実施していない。実装開始時には当時の main と共有 API を再確認し、採択前提 E1/C2 の公開受入を確認したうえで、親担当・scene 担当・独立 public fixture 担当が exports / hooks / controls をレビュー後に固定する。

## 読取元と成果物のハッシュ

JSON は原文 inventory、全採択 E2 レコード、全属性の stage 対応、モデル入出力と独立 assertion 計画を保持する。JSON SHA256: `46b275e0da9d9033d07fecb775f74b4136b76f7d0308268c4e7dfd4729c4c828`（107666 bytes）。自己参照や MD↔JSON の hash cycle は作らない。両ファイルは UTF-8 / LF / final newline 1 個。

| Source path | bytes | SHA256 |
| --- | --- | --- |
| `project/records/2026-09-24/p1-remaining-storyboards.md` | 38588 | `b663581aa76b9da2cb78c7121f54108f5e01cb248d3a059996656922aeab8108` |
| `project/records/2026-09-24/p1-remaining-storyboards.json` | 427025 | `1cef526de4f41aebe195360c50c526386d199f0cd511dc477911223a4a4a7319` |
| `project/records/2026-09-24/p1-remaining-storyboards-review.json` | 19361 | `fa91dc1738a4a9aac4866806e00f7386e085eb2d0af733a4d831817c4a91eca4` |
| `docs/11-llm-internals/in-context-learning-and-memorization.md` | 13226 | `c150ab8ee4a72dc6786a5abb52e0266f97d78f1b6584ce1c695e01f94106f5c4` |
| `website/lib/reading-clock.mjs` | 1707 | `f39eadf5eb39ebbb0f33877e6bceb9966211fc7acdaad13118428a4c2019081b` |
| `website/components/diagrams/reading-figure.jsx` | 12435 | `c130ffe313b499521e0a947532d22b101050362de9050534ac105b41347b6d12` |
| `website/components/diagrams/concept-scene-primitives.jsx` | 2803 | `5aac3bf8a418a57cd269b89fdab0252eb71d671dfbe6ac6dbe064a052e790a2b` |
| `website/lib/pretraining-data-model.mjs` | 4181 | `5338703ea3cd88e8c2df1df41e4d077be40a01042dc62ba2a69ede28c97673fa` |
| `website/components/diagrams/pretraining-data-walkthrough.jsx` | 11140 | `d2724eb12d8426bc52f812c1a6e7d4171171295bc4ac3d4acfde71b1793527bf` |
| `website/tests/unit/pretraining-data-model.test.mjs` | 5037 | `23465e6b87a3c5ec52b7cfff882694050d6dd4e1aa9afdc3fbb174250f23d0f9` |
| `website/components/diagrams/pretraining-walkthrough.jsx` | 1413 | `110b28350502a8e61430fdf080e435807228a5c9509b0537cee7668c1c6b7292` |
| `website/lib/diagram-registry.mjs` | 24546 | `85e75284f46ce42f7c89384a32bce6d227d2273855adfc81238d2f78966518d9` |
| `website/lib/diagram-decoration.mjs` | 6067 | `bd3ed962f793fbc28862d29765b6c1392fe08107cfec4d2cc141c0184cdeba6f` |
