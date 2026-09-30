# D2 推論モデル: インターフェース案

作成: 2026-09-29T18:47:44.039Z。観測 HEAD: `ca3c09eebd1b549564f874f3304d23ae25328194`。作成者: `01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_change_evidence`。

**提案・独立レビュー待ち。D1/D2の実装、記事訂正、公開kit編集、Git操作、公開受入は行っていない。** 作成ファイルはTEMPの本MDと同名JSONだけ。親担当の別変更を戻さない。D1公開受入とこの案のレビュー・開始指示を待って実装する。

## 範囲と正本

対象は `docs/10-llm-foundations/reasoning-models.md`、routeは `/docs/llm-foundations/reasoning-models`。採択済み `project/records/2026-09-24/p1-remaining-storyboards.md/json` の D2 を具体化する。計画全体は P1 15/199記事で公開受入後停止。P0の部分対応2記事をP1の達成数へ混ぜず、P2は始めない。

記事の採択・現在・候補 SHA256 はすべて `71246ca014e171936139af9083df301f16dcb7dade8f7aeb3a0b14516a19ef44`。本文訂正は0。JSONの adopted.article は採択D2 objectを無改変で収録。既存計画の approved/low は計画だけの承認で、この新インターフェースの承認ではない。

現在の本文とsourceDigestを再計算した。一次資料の新規Web取得はしていない。元記事の参照日2026-09-10を記録し、現在のprovider API仕様・価格・性能について新しい断定を足さない。

## 原文とREADの契約

2図・9段階、READ停止8、手動補助1。H3は9、元body blockは18。6H3・14bodyを包装し、概要/アンチパターン/チェックリストの3H3・4bodyは静的に残す。43原子論点はdynamic26/static17で、dynamic26はすべてREAD到達段階に割り当て済み。

AST rootは43 nodes、table2、list11、blockquote1。display math0、inline math0、code0、Mermaid0。位置情報以外を保存した全ASTのSHA256は `eb85b1513c5f56e896902a387d505e0ee967ff6d5cbbbd93566846f61202cecc`。全記事の見出し・文・リンク・強調・表・リスト・引用・frontmatterを保持する。ASTの包装を復元して完全一致を検査する。

| 図 | 段階 | READ | 手動のみ | 元AST範囲 | body→段階 |
| --- | --- | --- | --- | --- | --- |
| reasoning-sequence | 4 | 0, 2, 3 | 1 | [12, 16) | 1→S0 / 1→S2 / 1→S3 |
| reasoning-evaluation | 5 | 0, 1, 2, 3, 4 | なし | [16, 32) | 3→S0 ; 2→S1 ; 2→S2 ; 2→S3 ; 2→S4 |

範囲は0始まり・end exclusiveで見出しを含む。H3は各節最初のReadingStepへ一度だけ同梱し、body countに数えない。table/listは分割しない。JSON reading.bindings に元AST index・blockTypes・group countを完全記載する。

| 図 | sourceDigest |
| --- | --- |
| reasoning-sequence | `sha256:497581aab0df110ad41c3fbc116fc1837073be16d937aaaa44e99d4cab8ad107` |
| reasoning-evaluation | `sha256:4b26e91dcb1f6d5d7e09a43f86a1b622cd2c9a5a3b53e8846e234d39ec615930` |

sequenceのsourceHeadingsは「仕組み」「思考量」「プロンプト」「評価」の4H3、evaluationは「仕組み」から「評価」までの6H3。意味依存のdigest範囲と実際の包装範囲を区別する。

## reasoning-sequence: 4段階

| S | 到達 | 必ず見える意味 |
| --- | --- | --- |
| 0 同じ生成の土台 | READ | 全体の順序。最終回答は未展開の枠。推論領域は不透明な模式帯であり、非公開が全製品共通とは表示しない。 |
| 1 中間トークン | 補助手動 | 補助操作の記号追記。装飾の個数・長さをトークン数や性能値にしない。新しい事実をここだけに閉じ込めない。 |
| 2 学習と実行 | READ | 過去の操作に依存せず完成構図を返す。学習側の調整を点線の別枠、実行側を固定モデルとして同時に示す。CoT 指示だけと同一視しない。 |
| 3 回答と費用 | READ | 最終回答を展開し、先行する推論の非数値帯を残す。推論・回答の各帯は同じ意味 ID を保持。 |

**READ 2へ未操作で直接到達しても、既生成の記号、後続予測へ向かう条件矢印、学習の別枠、推論中の固定重み、実際の思考の再現ではないラベルが同時に見えること。** 手動1を通った履歴へ依存させない。さらにREAD0にも、最初の原段落が扱う「既生成の内容が後続の条件になる」を矢印で見せる。

model exportsは `REASONING_SEQUENCE_STAGES` と `reasoningSequenceFrame(phase, options = {})`。scene exportは `ReasoningSequence({ children })`。固有設定なし、optionsは空objectだけ。CSSは `rs-`、sceneは `reasoning-sequence-scene`。段階ラベルは採択の4個を保持。

frameはphase/stage/label/title/detail、安定IDのnodes/edges、記号の模式表現、runtimeWeights=fixed、学習枠の可視性、S3の推論/回答resourceBands、nonClaimsを返す。content/rawThought/tokenCount/duration/price/costEstimate/billingFormulaはnull。装飾記号は既生成/続きの2IDと省略記号で、個数をトークン数と扱わない。

必須属性: `data-reasoning-sequence-stage`、`data-runtime-weights="fixed"`、`data-reasoning-content="not-reproduced"`、`data-reasoning-node`、`data-edge-source/target/meaning`、`data-resource-band`。属性は実際の可視要素に結び付け、非表示要素だけでは受け入れない。

## reasoning-evaluation: 5段階

| S | 必ず見える意味 | 固有操作 |
| --- | --- | --- |
| 0 同じタスクで比較 | 既存表の選択した行は観点の強調。左右の異なる候補を同一タスク・同一入力だとみなさない。全候補は元表に残し、低め/高めの比較枠は一つの同じ入力。 | taskFocus |
| 1 思考量 | 両設定を並べたまま選択側の枠・線だけ強調。品質の増減も費用比も生成しない。低め/高めは API enum ではない。 | effortFocus |
| 2 追加便益 | 高め側に追加の作業帯を示すが目盛・比率・秒数は置かない。未知の品質欄は空欄のまま、上昇/下降の性能曲線を描かない。 | effortFocus |
| 3 必須条件 | 探索枠の移動は固定の境界内。指示の絵を権限強制の実装と同一視せず、モデル外の実行側を別ラベルで示す。実際の許可や操作を行わない。 | なし |
| 4 複数回の測定 | 各設定内では同一条件の反復。設定間では思考量だけが変わる。試行枠も指標値も未実行/未計測。生の思考が非公開・要約のみの場合もあることを短いラベルで残す。 | なし |

model exportsは `REASONING_EVALUATION_STAGES`、`REASONING_TASK_FOCI`、`REASONING_EFFORT_FOCI`、`reasoningEvaluationFrame(phase, options = {})`。scene exportは `ReasoningEvaluation({ children })`。CSSは `re-`、sceneは `reasoning-evaluation-scene`。

| 設定 | 許容値/既定値 | 操作可能段階 | 変えるもの |
| --- | --- | --- | --- |
| taskFocus「表の観点」 | multi-step / verifiable / constraints、既定multi-step | S0だけ | 既存表の対応する行の強調 |
| effortFocus「注目する思考量」 | lower / higher、既定lower | S1とS2だけ | 同じ比較枠内の選択側の強調 |

上記は合計2 control・5 option。対象外ではcontrolを表示せず、frameのeffective focusはnull。入力設定の保持自体はよいが、対象外段階の意味や数値へ影響させない。両設定の比較枠は残す。行選択は原表の二群を同一入力とみなす操作ではなく、各タスク内で同じ実入力を比べるための入口。低め/高めはprovider API enumではない。

比較枠の inputId=same-input、modelId=same-model、promptId=same-instructions、criteriaId=same-criteria は内容を持たない模式ID。この図は思考量だけを比較変数として固定する。実務でモデル比較を禁じる意味ではない。品質/費用/待ち時間のvalue/unitは全段階null、status=unmeasured、表示は「未計測」。S3は目標・制約・承認・根拠確認・業務規程を固定し、モデル外の実行コードを明示。

S4は低めA/B・高めA/Bの4つの空試行枠。設定内のconditionIdは同じ、全inputIdも同じ、設定間は思考量だけが違う。12指標セルをすべて未計測に保つ。A/Bは複数回を表す模式的な場所で、推奨試行回数でも実行済み件数でもない。

必須属性: `data-reasoning-evaluation-stage`、`data-task-focus`、`data-effort-focus`、`data-measurement-state="unmeasured"`、`data-task-decision="none"`、`data-task-row`、`data-comparison-input/model`、`data-effort-variant`、`data-metric/status`、`data-required-condition`、`data-execution-boundary="outside-model"`、`data-trial-id/condition/input/effort`。完全なenum・fixture・caveat hookはJSONを正本とする。

## 共通実装境界と所有

article-specific所有は採択済みの次8ファイル。製品ファイルは観測時点でいずれも未作成。

- `website/lib/reasoning-sequence-model.mjs`
- `website/components/diagrams/reasoning-sequence-walkthrough.jsx`
- `website/components/diagrams/reasoning-sequence.css`
- `website/tests/unit/reasoning-sequence-model.test.mjs`
- `website/lib/reasoning-evaluation-model.mjs`
- `website/components/diagrams/reasoning-evaluation-walkthrough.jsx`
- `website/components/diagrams/reasoning-evaluation.css`
- `website/tests/unit/reasoning-evaluation-model.test.mjs`

共有変更はroot統合担当のみ。`ReasoningWalkthrough({ diagramId, children })`を提案し、2つのliteral lazy importだけで各sceneへ振り分ける。`ReadingArticleContents`、`DiagramBoundary`と元children fallbackを再利用。BINDINGS/registry、diagram-decoration、MDX allowlist、mdx-components、articles/acceptance、共通試験を同期する。任意module path・props/spread/式/import・walkthroughの入れ子は許さない。release kitは別レビュー・別担当範囲。

phaseは既存clampPhase/stageForPhaseを使う。非有限数/数値以外はTypeError、有限の範囲外値は端へクランプ、中点は共通丸め。settingsはplain objectだけ、null/array/Date/function/primitiveと未知keyはTypeError、未知enumはRangeError。入力非破壊・ネスト返り値を毎回分離し、Date/random/network/新しいRAF/intervalは使わない。

READ/PLAY/STOP/段階指定/戻る/拡大/キーボード/reduced-motionを共通ReadingFigureへ委ねる。scene固有の継続loopを設けない。入力・比較レーン・指標欄など同じ対象を各段階で保持し、動きはphaseに従う位置・線・不透明度だけにする。SVGの字を極小化して説明を詰めず、短い図ラベルと元本文の役割を守る。

## 言わないこと

- 思考内容を生成・推測・再現せず、秘密のchain-of-thoughtや個別モデルの推論ログを扱わない。
- 推論トークンの表示可否/要約方法/effort enum/予算/課金式を全製品共通とは言わない。
- 品質の単調増加や全簡単タスクの悪化を示さない。研究の対象範囲を越えた数値・性能曲線を追加しない。
- 本文の「精度2ポイント・コスト3倍」は説明例として原文に保存するが、図の実測データやoracle値に転用しない。
- 記号の個数、非数値帯の長さ、試行a/bは画面構成。トークン数、費用・時間比、推奨サンプル数ではない。
- 学習と推論の設定を区別し、推論中の重み更新、検証の正しさ、承認や業務規程の自動強制をモデルへ帰属しない。
- 通常モデルにも中間の考察は可能。推論モデルを単なるCoT定型プロンプト内蔵と同一視しない。
- 図は評価準備の説明で、実モデル/API/Agentの評価や公開受入を実施した証拠ではない。

## 独立検証案

### source-ast (source+decoration)

- 元記事の raw SHA と canonical AST を固定し、装飾を外した tree 全体が同一。43 root nodes / H3 9 / body 18。全リンク、強調、表2、リスト11、引用1を保持。数式0、Mermaid0。
- 2 figures の順序と 8 ReadingStep、グループの原 AST 参照を literal fixture で確認。H3 はその節最初の step へ一度だけ同梱。
- sourceHeadings と sourceDigest の変更、誤った blockTypes/count、重複 heading・step は拒否。

### literal-oracle (independent-fixture)

- 検証者が採択計画と本文から書いた literal の9段階必要物・辺・ラベル・null指標を固定する。製品 frame 関数を oracle として呼ばない。
- 本提案の fixtures を出発点に独立レビューで確認する。JSON を実装担当がそのまま期待値へコピーしただけでは独立検算済みにしない。
- 意味検査は attributes だけでなく SVG の実物、線の両端、表示ラベル、getBBox の正面衝突、アクセシビリティ内容へ結ぶ。

### sequence-carryover (model+browser)

- 未操作の READ 0→2→3 と逆方向を使用。READ2 で prior-symbols と conditioning-edge、学習別枠と固定重み、非再現ラベルが同時に見える。manual1/selector/再生を使わず確認。
- stage0 にも paragraph の条件追加という論点が実物で見える。stage2だけに依存させない。
- phase と設定から完全な frame を返す。1 を経由しなくても同じ 2、逆 seek 後も同じ 2。rawThought/content/tokenCount/costEstimate は null。

### evaluation-controls (model+browser)

- taskFocus 3 値は S0 の選択行だけ、effortFocus 2 値は S1/S2 の強調だけに効く。非対象段階の effective focus は null。非対象設定を変えても意味 frame は変わらない。
- S0 の3行6候補は原表と対応し、自動採否は null。左右の候補と比較入力は別概念。
- S1/S2 の両設定・共通入力・3指標を保持し全測定値は null。成功率、秒、金額、性能曲線、比較の勝者を生成しない。
- S3 は5必須条件とモデル外の実行境界が見え、探索経路は境界を越えない。
- S4 は低め A/B と高め A/B、同設定内の conditionId 一致、全 inputId 一致、未計測12セル。同じ条件に別 effort を混ぜていない。試行数を推奨回数と説明しない。

### phase-contract (pure-model)

- 共通 clampPhase/stageForPhase を使用。有限数以外は TypeError、範囲外有限値は端へクランプ。中点は共通の Math.round 境界に一致。
- 不正 object / unknown settings key は TypeError、未知 enum は RangeError。入力を変更せず、返り値の配列や子 object を変更しても次 frame・定数に漏れない。
- sequence4基本段階と評価5段階×設定6組、前進・逆順・既存中点境界を意味 oracle に照合。性能や推論の実行試験とは呼ばない。

### reading-ux (browser+visual)

- 共通 READ/PLAY/STOP/手動段階/戻る/拡大/キーボード/reduced-motion を再利用。2図が互いの読書位置を奪わない。停止・非表示に固有RAF/intervalを残さない。
- PCの通常/拡大と狭幅の静止 fallback で全9段階を確認。元記事の長い表やリンクを切らず、ページ全体に横スクロールを作らない。
- 可視 bbox と screenshot で重なり・切れ・線端・色だけの意味依存を確認。属性のtrueだけでは合格しない。

### fallback-and-isolation (SSR+runtime)

- JS無効・図chunk遮断・読込失敗・print/reduced-motionで原文を読める。共通の主要段階静止図を意味同等にし、非公開思考内容を埋め込まない。
- 記事外の無図対照に ReadingFigure がなく、D2固有chunkを実行しない。2 literal lazy imports以外の任意モジュール入力を拒否。
- 前単位の受入 assertion 名/順/本文を保つ。D2追加の公開kit設計と fixture hash は別途独立レビュー。

## 現在の検証と次の作業

今回実施したのは本文raw SHA、2つのsourceDigest、AST inventory、採択D2の複製一致、READ割当の作成者自己確認のみ。独立レビュー、製品実装、unit/browser実行、ビルド、CI/Pages、公開runtimeは未実施。JSON selfCheckとscopeで区別した。

独立レビューでは9段階の意味・26動的論点との対応・補助1からREAD2への持越し・未計測欄・全社共通主張の不在・表の候補と比較入力の区別を重点確認する。承認後も、D1公開受入と親担当の開始指示、開始時source/digest再照合が必要。公開kitはD1までの旧case/本文/primary assertionを保った独立fixtureとflat predecessor proofを別途設計する。

別PCへ渡す際は採択後にrepo相対pathでprojectへ移す。TEMPは唯一の引継ぎ正本やimport依存にしない。観測した全入力ファイルのraw/LF SHA、本文sectionごとのcanonical AST SHA、元26+17論点、2図完全レコードは同名JSONに含む。
