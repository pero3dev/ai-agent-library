import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const FRAMEWORK_MODEL_TUNING_STAGES=Object.freeze({
 'framework-abstraction-selection':rows([
  ['小さな生API','小さな代表タスクで、必要な抽象度を先に確かめる。','フレームワークの便利さを判断するため、モデル呼出し・ツール・状態の基本構造を把握します。図は実APIを呼びません。'],
  ['三つの抽象度','薄いSDK、オーケストレーション、フルスタックを比べる。','機能が多いほど適するとは限りません。既存基盤との接続、隠れる挙動、交換の負担を合わせて見ます。'],
  ['八つの選定軸','必要な状態・制御・観測・連携を、選定の軸へ対応させる。','マルチAgentは必要な場合の軸です。すべてを必要条件とせず、原文のチェックリストと未確認を保持します。'],
  ['なしという選択','単純なループ、厳しい監査、チームの理解を採用条件へ戻す。','状態・再開・承認の複雑さが大きい場合は、自作で再現する費用も比べます。自作を常に安価な選択にしません。'],
  ['代表タスクで確認','満たした条件と残る負担を、代表タスクで確認する。','機能一覧の一致だけで採用せず、状態遷移・失敗時の観測・介入を試します。図は採用順位や実測値を作りません。']
 ]),
 'framework-boundary-migration':rows([
  ['境界を分ける','ツール・プロンプト・評価を、接着層から分離する。','交換できる境界を持つことと、移行が無費用・無変更で済むことは別です。業務ロジックをフレームワークへ埋め込みません。'],
  ['移行の条件','交換した接着層を、同じ評価と観測で検査する。','ツール・プロンプト・評価の独立と版の把握が、検証する候補の条件です。図は移行やデプロイを実行しません。'],
  ['提供段階を分ける','安定した中核と、個別のpreview機能を分けて確認する。','原文のMicrosoft Agent Framework 1.0の例です。中核のproduction-readyを全機能へ拡張せず、AutoGenの保守状態とも区別します。'],
  ['再評価へ戻す','提供段階・版・接続先の変更を、代表タスクの評価へ戻す。','採用時の一度の確認で終わらず、提供元の一次情報と原文のTODOを見直します。未知の条件を確認済みに変換しません。']
 ]),
 'model-constraints-tier':rows([
  ['条件が先','モデル名の前に、タスクと提供条件を定める。','原文のモデル例は2026-08時点の説明です。現在の順位・価格・提供可否を図で確定しません。'],
  ['七つの判断軸','tier・推論・遅延・費用・文脈・modal・提供条件を比べる。','長い入力窓や上位tierだけで自社タスクの品質を保証しません。必要な入力形式・データ条件も独立に確認します。'],
  ['用途とtier','規則的な大量処理と、失敗の高い判断を分ける。','中位を出発点として測って上下させる考え方を示します。軽量・中位・上位のラベルを固定した勝敗や製品順位にしません。'],
  ['条件の未確認','必要な提供条件と評価が不明なら、先に照合する。','modal対応、データ・リージョン条件、実タスク評価をすべて確認します。不可は別経路を検討し、未確認を可へ変換しません。'],
  ['同じタスクで測る','公開benchmarkと実タスクを区分して、採用を評価する。','正確さに加え遅延・費用・失敗時の振る舞いを測ります。図は実モデルの成績・費用を算出しません。']
 ]),
 'model-portfolio-updates':rows([
  ['役割を分担','計画・実行・委譲・評価を、必要な強さへ分ける。','routingとfallbackは評価した条件へ対応させます。別系統の評価も誤りをなくす保証ではありません。'],
  ['費用の構成','入力・出力・思考・cache・batchを、実際の請求条件へ照合する。','原文の料金傾向は2026-08時点です。割引率や出力比率を現在の全製品へ一般化せず、思考は可視表示だけで計算しません。'],
  ['版と変更','モデルの識別子・設定・評価を記録し、変更点を追えるようにする。','可変aliasを固定した版と見なさず、同じ評価セットで移行を比べます。データ方針と提供終了も再確認します。'],
  ['移行と復帰','旧新の比較と段階的な切替、戻せる条件を用意する。','新しい世代を自動採用せず、同じタスクの非劣化・費用・遅延を確認します。図は切替や復帰を実行しません。']
 ]),
 'tuning-choice-methods':rows([
  ['先に試す代替','指示・RAG・別モデルを先に試し、残る問題を分ける。','FTは最新事実の更新・削除・再現性を保証しません。タスクの形式や振る舞いと、外部知識の供給を切り分けます。'],
  ['七つの前提','評価・代替・データ・提供経路・再調整の条件を揃える。','図の選択は一つの不足条件を変え、その他は満たした想定です。検討候補になっても訓練・採用・品質を保証しません。'],
  ['四つの手法','教師出力、選好、報酬、軽量な更新の役割を比べる。','SFT・DPO・報酬ベース・LoRAは利用可能な経路とモデルへ照合します。すべてのモデルで使えるメニューにしません。'],
  ['経路を照合','モデル単位の対象・受付・リージョン・SLAを確認する。','原文の提供条件と確認時点を保持します。別モデルの対応を転用せず、受付停止と既存モデルの推論継続を区別します。'],
  ['検討へ戻す','条件が揃った範囲で、投資と継続運用を評価する。','データ準備・費用・基盤モデル変更時の再調整を含めます。図は学習jobや外部サービスを呼びません。']
 ]),
 'distillation-data-lifecycle':rows([
  ['教師から生徒へ','教師の出力を選別し、生徒を同じ評価で比べる。','教師の誤りも転写されます。強い教師を正解の保証にせず、品質差と費用削減を実タスクで測ります。'],
  ['代表性と選別','数だけ増やさず、入力分布とラベルの品質を整える。','原文の件数は説明上の目安です。普遍的なしきい値にせず、運用入力とのずれや有害な出力を点検します。'],
  ['学習と評価を分離','JSONLの形式・機微情報のマスク・データ分離を確認する。','学習へ使った例を評価へ流し、改善の根拠にしません。ログをそのまま学習へ送る許可とも扱いません。'],
  ['改善と非劣化','狙ったタスクの改善と、他の重要タスクの非劣化を確認する。','学習lossや教師との一致だけで採用せず、FT前後を同じ評価で比較します。図は実精度を生成しません。'],
  ['版と再調整','基盤モデル・dataset・job・設定を版として追う。','基盤モデルの変更・提供終了は再調整と再評価の判断です。FT後もプロンプトと運用評価を保持します。'],
  ['提供条件へ戻す','新規学習の受付と、既存推論・SLA・提供領域を別々に確認する。','原文のOpenAI・Google・Bedrockの条件をモデル単位で読む段階です。図は未確認の当日呼出しや契約条件を補いません。']
 ])
})
export function frameworkModelTuningFrame(diagram,phase){const stages=FRAMEWORK_MODEL_TUNING_STAGES[diagram];if(!stages)throw TypeError('Unknown framework model tuning diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=(values)=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit prerequisite state required')}
export function frameworkMigration({toolsIndependent,promptsIndependent,evaluationIndependent,versionRecorded}){const values=[toolsIndependent,promptsIndependent,evaluationIndependent,versionRecorded];explicit(values);return {verificationCandidate:values.every(Boolean),migrationExecuted:false}}
export const TUNING_CONDITIONS=Object.freeze(['evaluationReady','promptLimitObserved','knowledgeSeparated','alternativesCompared','dataQualified','routeVerified','retrainingAccepted'])
export function tuningCandidate(state){const values=TUNING_CONDITIONS.map(key=>state[key]);explicit(values);return {evaluationCandidate:values.every(Boolean),trainingExecuted:false,qualityGuaranteed:false}}
export function modelConditions({modality,provision,evaluation}){const values=[modality,provision,evaluation];if(values.some(v=>!['unknown','yes','no'].includes(v)))throw TypeError('Explicit model condition required');return {next:values.includes('no')?'alternative':values.includes('unknown')?'confirm':'evaluate-candidate',deploymentExecuted:false}}
