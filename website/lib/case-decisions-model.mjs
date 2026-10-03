import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=v=>Object.freeze(v.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CASE_DECISIONS_STAGES=Object.freeze({
 'expense-migration-evidence':rows([
 ['段階の全体','単発・固定手順・自律loop・承認付き書込みを、限界の証拠でつなぐ。','架空事例の順序を唯一の一般則にしません。'],
 ['規定Q&A','一回の検索で足りる間は単発のRAGを使い、評価を作る。','原文の15問は説明用の設定です。反復の価値を確認する前にloopを増やしません。'],
 ['固定の照会','二分類と固定APIで手順を決められたため、Workflowを選ぶ。','LLMは分類と文生成の部品。照会APIはコードで固定します。'],
 ['移行の証拠','実問い合わせの複合性から、固定手順では足りない証拠を得る。','原文の2割は架空設定。Agent採用は自分のタスクの評価と記録で確認します。'],
 ['読み取りloop','規定検索と申請照会を繰り返すが、権限は読み取りへ固定する。','ステップ・時間・tokenの上限はコード側で強制。情報不足なら質問します。'],
 ['評価を引き継ぐ','既存Q&Aの回帰と構造化traceを、次の構成へ持ち越す。','構成を変えたことだけで品質や費用が改善したとは扱いません。']
 ]),
 'expense-write-regression':rows([
 ['差分の下書き','修正案までAgentが作り、提出前に差分を承認へ渡す。','読み取りを毎回承認させず、取消しにくい提出を事前承認へ置きます。'],
 ['本人と承認','承認・本人scope・対象の一致を、tool側で強制する。','modelへのお願いを認可にしない。図は申請を提出しません。'],
 ['二軸を分ける','loopの自律性と書込み権限を、別の軸として広げる。','この事例の段階を普遍的なriskの数式や線形保証にしません。'],
 ['三つの採点','Q&A・照会状態・複合taskの各性質に合わせて評価する。','原文の50case・smoke10は架空設定。承認なしの書込みを軌跡で検査します。'],
 ['運用と縮退','費用とstepの分布を見て、前のWorkflowへ戻す手段を残す。','旧構成への切替は、既に提出した申請の取消ではありません。'],
 ['根拠を持ち帰る','限界の証拠・評価の継続・二軸の制御を、自案件で判断する。','順序や数値だけを模倣せず、自社のログ・許容risk・評価で決めます。']
 ]),
 'pilot-criteria-value':rows([
 ['撤退の物語','専門的な照会のdemoから、品質と費用の壁・撤退へ至る。','架空の半年の経緯。実案件の失敗率や、常に撤退すべきという実証ではありません。'],
 ['demoの存在証明','答えられる選別入力と、実入力の分布を分ける。','よい例が存在することを、本番の成功率へ一般化しません。'],
 ['前提の品質','誤答の損害と、古い・散在・矛盾する知識源を確認する。','検索改善だけで知識源の欠落を消すとは扱わない。実入力で測ります。'],
 ['基準のすり替え','95%から80%へ下げても、人手対応と運用費は消えない。','二数値は架空の設定。表示上の達成と省力化の目的を分けます。'],
 ['費用の反転','model・多段検証・人手reviewを含む将来費用と効果を照合する。','token費だけや生成時間だけで、正の費用対効果を作りません。'],
 ['判断を戻す','着手時の基準と知識源の前提へ戻り、続行・縮小・撤退を検討する。','図は実際の投資判断や新しい実測値を作りません。']
 ]),
 'pilot-withdrawal-assets':rows([
 ['先に決めた基準','品質・費用対効果の撤退基準に、パイロット結果を照合する。','失敗を隠すための事後緩和で成功にしません。'],
 ['これからの価値','既に使った費用を除き、将来の追加費用と価値で検討する。','サンクコストの大小だけで延命や撤退を決めません。'],
 ['解ける見込み','知識源の構造問題など、追加投資で解ける根拠を確認する。','追加予算という名前だけで問題が解けるとは扱いません。'],
 ['説明と回収','判断の基準・試算・根拠を伝え、評価・分類・知識源の発見を残す。','組織の信頼と学びを、曖昧に終えることで失わないようにします。'],
 ['次の仕事へ','知識源の整備と評価資産を、次の企画や前提確認へ渡す。','撤退後の資産の利用にも目的・dataの許可を確認します。'],
 ['自案件の判断','基準の先決めと将来価値の型を使い、自分の結果で判断し直す。','架空事例の撤退を、どのprojectでも唯一の正解にしません。']
 ]),
 'helpdesk-action-boundary':rows([
 ['照会と実行','FAQ・申請・資産の照会と、実際の操作を別の速度で開く。','架空事例のリスク区分は自組織で評価し直します。'],
 ['頻度から選ぶ','照会の運用logで、本当に必要な操作を把握する。','要望だけで全操作を一度に開放しません。'],
 ['操作別の条件','reset・許可済み配布・権限申請を、本人確認と承認で分ける。','原文の許可リスト内の限定自動化を、一律の無承認へ広げません。'],
 ['承認の内容','対象user・操作・影響範囲を、実行前に読める形で示す。','中身を見ない素通り承認にしない。図は承認も操作も実行しません。'],
 ['一操作ずつ','可逆性・影響・本人確認に応じ、自社の自律度を評価し直す。','一律の承認も一律の自動化も、事例の判断を失います。']
 ]),
 'helpdesk-authority-trace':rows([
 ['帰属と最小権限','全域の管理者権限でなく、操作別に必要な権限と帰属を設計する。','エージェント本人の行為として説明する。認証と操作の認可は別です。'],
 ['toolで強制','本人のみ・許可リスト内を、実装側の条件にする。','modelがお願いを無視しても、実経路で制限がかかる設計を検査します。'],
 ['誰が何をしたか','入力・判断・tool・承認と実行結果を、帰属できる記録へ結ぶ。','記録名があるだけで、実行や実承認が済んだとは扱いません。'],
 ['承認と責任','誰の承認でどの権限を付与したかを、操作logへ対応づける。','追加の作業台帳を作る要求ではなく、原文の実運用の説明です。'],
 ['効果と見直し','セルフサービスの効果と権限・承認を、自社の運用へ戻す。','照会と実行を同時に全解放せず、投資対効果は実際に測ります。']
 ])
})
export function caseDecisionsFrame(diagram,phase){const stages=CASE_DECISIONS_STAGES[diagram];if(!stages)throw TypeError('Unknown case decision');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
export function expenseMigration({fixedStepsSufficient,evaluatedNeed,regressionPresent}){bools([fixedStepsSufficient,evaluatedNeed,regressionPresent]);return {agentReviewCandidate:!fixedStepsSufficient&&evaluatedNeed&&regressionPresent,selected:false}}
export function expenseWrite({approved,ownScope,targetMatched,toolEnforced}){const v=[approved,ownScope,targetMatched,toolEnforced];bools(v);return {writeReviewCandidate:v.every(Boolean),submitted:false}}
export function pilotCriteria(threshold){if(![80,95].includes(threshold))throw TypeError('Two original fictional criteria only');return {fictionalObservedQuality:80,displayedCriterionMet:80>=threshold,futureValuePositive:false,originalCriterionMet:false,actualMeasured:false}}
export function prospectiveDecision({qualityMet,futureValuePositive,problemSolvable,sunkCost}){bools([qualityMet,futureValuePositive,problemSolvable]);if(!Number.isFinite(sunkCost)||sunkCost<0)throw TypeError('Finite nonnegative past cost');return {continuationReviewCandidate:qualityMet&&futureValuePositive&&problemSolvable,pastCostDeterminesChoice:false,actualChoiceMade:false}}
export function helpdeskAction({action,identityMatched,allowlisted,approved,toolEnforced,attributable}){bools([identityMatched,allowlisted,approved,toolEnforced,attributable]);if(!['reset','software','rights'].includes(action))throw TypeError('Only original three action classes');return {actionReviewCandidate:toolEnforced&&attributable&&(action==='software'?allowlisted:approved&&(action==='rights'||identityMatched)),approvalRequired:action!=='software',identityRequired:action==='reset',actualAction:false}}
export function helpdeskTrace({inputRecorded,decisionRecorded,toolRecorded,approvalRecorded,outcomeRecorded,actorRecorded}){const v=[inputRecorded,decisionRecorded,toolRecorded,approvalRecorded,outcomeRecorded,actorRecorded];bools(v);return {traceReviewCandidate:v.every(Boolean),executionEstablished:false,approvalEstablished:false}}
