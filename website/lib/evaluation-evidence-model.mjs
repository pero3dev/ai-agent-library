import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const EVALUATION_EVIDENCE_STAGES=Object.freeze({
 'judge-format-bias':rows([
  ['別のアプリ','judgeもLLMアプリとして、検証してから採用する。','判定を盲信すると、誤判定に向かって本体が最適化されます。図は実LLMへ送信しません。'],
  ['形式と観点','観点別の二値判定と、手順を決めたペア比較を使う。','総合スコアの差を原因説明へ変換しません。基準のない数値判定の偏りを保持します。'],
  ['基準と文脈','境界例・必要な文脈・理由と判定を、構造化して渡す。','理由を説明として使い、非公開の内部思考を取得したという意味にはしません。形式だけで正しい判定とは扱いません。'],
  ['偏りを点検','位置・長さ・自己選好・寛大さの偏りを別々に点検する。','順序を入れ替えた判定の一致は位置の点検です。全体品質や他の偏りの解消を保証しません。']
 ]),
 'judge-validation-split':rows([
  ['調整と判定','開発用と未見の採用判定用を、原資料の単位で分ける。','同じ会話・原文の派生を両側へ入れません。単純なファイル名の分離を独立な評価と扱いません。'],
  ['人手の基準','人手とjudgeの不一致を、基準と見逃し・過剰検出へ分ける。','原文の20〜50件は初期の作業例です。人手ラベルも基準と品質を確認し、十分な標本数の保証にしません。'],
  ['固定して測る','構成を固定し、未見の判定用で、用途別の採用条件を確認する。','基準自体を変えたなら、人手ラベルも独立に付け直します。図は実採点や採用を実行しません。'],
  ['誤りの母数','一致率と、誤合格・過剰不合格を、それぞれの母数で読む。','表示する件数は読者が選ぶ模式入力です。全体で高い一致だけを普遍的な採用基準にしません。'],
  ['既知へ移す','判定用のケースを読んで調整したら、開発用として扱う。','調整したセットを未見の最終評価へ戻しません。新たな判定用と版を確保し、回帰へ接続します。'],
  ['コードを先に','形式・必須要素・最終状態をコードで検査し、判断だけをjudgeへ残す。','費用・遅さ・非決定性を考慮します。コードとjudgeの分担だけでタスク品質は保証しません。']
 ]),
 'trajectory-path-review':rows([
  ['成果と経路','同じ最終回答でも、危険・無駄・偶然の経路を分ける。','最終成果の正しさは、途中の安全性や効率を保証しません。模式経路は実行ログではありません。'],
  ['選択と引数','必要なtoolの選択と、渡した引数を照合する。','toolを呼んだだけで、必要な情報の取得と妥当な引数を確認したとは扱いません。'],
  ['効率と回復','同一呼出しの繰り返しと、失敗後の行動を確認する。','原文の回数例を全タスクの上限にせず、盲目的な再試行と適切な回復を区分します。'],
  ['安全性','禁止操作と、承認の必要な作用を点検する。','照会の途中の不要な書き込みを、最終回答が正しいことだけで合格にしません。'],
  ['採点を分ける','機械的な不変条件はルールで固め、判断だけを検証したjudgeへ渡す。','整形するログは必要な種別・引数・結果を保持します。事後の評価は実行時ガードの代わりではありません。']
 ]),
 'trajectory-record-constraints':rows([
  ['記録を共通化','評価と本番に共通する、構造化した各ステップを記録する。','tool名・引数・結果・トークン量・時間を追います。非公開の内部思考を取得できる保証へ広げません。'],
  ['不変条件','安全性・必須の情報取得・資源上限を、経路の自由度と分ける。','禁止・必要なマイルストーン・上限を照合します。図は実行時の強制停止を実装しません。'],
  ['別解を認める','条件を満たす別経路を認め、完全一致を要求しない。','細かい順序を固定したい部分はWorkflowとしての設計を検討します。異なる経路を無条件に安全とはしません。'],
  ['部分と全体','長いタスクの到達点を測り、部分点と最終成果を別々に残す。','候補提示や承認の取得は途中の達成です。未達の最終状態を完了へ昇格しません。'],
  ['実行時にも守る','評価でガードの効きを確認し、禁止作用は実行時にも制御する。','事後に失敗を見つけることと、事前に作用を阻止することを分けます。図は実toolを実行しません。']
 ]),
 'dataset-source-synthetic':rows([
  ['循環する資産','収集・ラベル・セット・評価・本番の失敗を循環させる。','原文のMermaidと件数目安を保持します。件数の大きさだけを品質や網羅性にしません。'],
  ['四つの収集源','実ログ・失敗・想定・合成の、役割と不足を分ける。','実ログは機微情報と利用方針、失敗は正常系との分布、想定は設計者の盲点、合成は補完の条件を確認します。'],
  ['運用の前後','リリース前の想定と合成から、実ログと失敗へ重心を移す。','利用者の修正・再試行・低評価も収集します。量や収集元だけで代表性を認定しません。'],
  ['合成の役割','言い換え・境界・秘密を使えない場面を補い、実データの代替にしない。','整った入力と共通の盲点に注意します。別系統の生成と人手の設計は、全盲点を解消する保証ではありません。'],
  ['正解を点検','合成の正解は人がレビューし、分布・権利・層と分離を確認する。','図はデータを生成・収集・転送しません。マスキングだけで利用が許可されたとは扱いません。']
 ]),
 'dataset-label-maintenance':rows([
  ['基準を先に','何を合格にするかを、判定例付きの基準書へする。','基準なしの複数人ラベルを信用しません。ラベルが一致することだけを業務上の正しさへ変換しません。'],
  ['独立と裁定','重要ラベルを独立に付け、不一致を裁定して基準へ戻す。','低い一致は曖昧な基準の兆候です。判定者の同調を独立な確認にしません。'],
  ['専門知識','業務固有の正しさは有識者と確認し、judgeの検証へ使う。','人手ラベルの品質が低いとjudgeの検証もできません。図は専門家の判断や実ラベルを捏造しません。'],
  ['層別と分割','タスク・難易度・入力・成否を層別し、開発と判定の参照経路を分ける。','prompt・例・RAGへ評価問題と正解を混ぜません。原資料の派生を跨がせず、公開ベンチの汚染可能性を保持します。'],
  ['版と棚卸し','業務ルールと正解の変更を更新・廃止し、測定した版を残す。','規模の目安を網羅性保証へ変換しません。古い正解のまま合否を採用しません。'],
  ['失敗と飽和','失敗のケース化を完了条件へ入れ、容易な層の飽和を補う。','既知ケースの常時合格だけを本番の品質保証にしません。失敗の還流と未見の採用判定用を両立します。']
 ])
})
export function evaluationEvidenceFrame(diagram,phase){const stages=EVALUATION_EVIDENCE_STAGES[diagram];if(!stages)throw TypeError('Unknown evaluation evidence diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit evidence condition required')}
export function judgeConfusion({truePass,trueFail,falsePass,falseFail}){const counts=[truePass,trueFail,falsePass,falseFail];if(counts.some(n=>!Number.isInteger(n)||n<0||n>8))throw TypeError('Bounded toy confusion counts required');const total=counts.reduce((a,b)=>a+b,0),humanFail=trueFail+falsePass,humanPass=truePass+falseFail;return {total,humanFail,humanPass,agreement:total?(truePass+trueFail)/total:null,falseAcceptance:humanFail?falsePass/humanFail:null,overRejection:humanPass?falseFail/humanPass:null,qualityGuaranteed:false}}
export function judgeSwapResult({firstWinner,reversedWinner}){if(!['a','b'].includes(firstWinner)||!['a','b'].includes(reversedWinner))throw TypeError('Semantic winners after order swap required');return {orderConsistent:firstWinner===reversedWinner,winner:firstWinner===reversedWinner?firstWinner:null,qualityGuaranteed:false}}
export function judgeAcceptance({criteriaFixed,labelsChecked,unseenSet,thresholdsMet,sampleReported,compositionFrozen}){const values=[criteriaFixed,labelsChecked,unseenSet,thresholdsMet,sampleReported,compositionFrozen];explicit(values);return {reviewCandidate:values.every(Boolean),gradingExecuted:false}}
export function trajectoryInvariantResult({requiredInformation,forbiddenAbsent,approvalBeforeEffect,withinBudget}){const values=[requiredInformation,forbiddenAbsent,approvalBeforeEffect,withinBudget];explicit(values);return {invariantsMet:values.every(Boolean),finalOutcomeVerified:false,effectsPrevented:false}}
export function evaluationDatasetAcceptance({masked,usageAgreed,labelsReviewed,strataChecked,setsSeparated,lineageSeparated}){const values=[masked,usageAgreed,labelsReviewed,strataChecked,setsSeparated,lineageSeparated];explicit(values);return {reviewCandidate:values.every(Boolean),datasetCollected:false,qualityGuaranteed:false}}
