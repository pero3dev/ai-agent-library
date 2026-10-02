import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const EVALUATION_CONTEXT_STAGES=Object.freeze({
 'environment-layers-state':rows([
  ['目的を分ける','測る対象・継続CI・セキュリティ隔離と、実行環境を分担する。','評価用のリセット可能な環境を、悪意あるコードを防ぐセキュリティ隔離そのものにしません。'],
  ['三つの層','モック・状態付き環境・限定の本番接続を、測る対象から選ぶ。','呼出しを測るモックと、終了状態を検証する環境は役割が違います。本番接続は読み取り専用・少数に限定します。'],
  ['初期状態','ケースごとに既知の状態をシードし、前の作用を持ち込まない。','図はDBやファイルを作成・削除しません。同じ入力だけで同じ評価条件とは扱いません。'],
  ['終了状態','会話の成功宣言と、実際のDB・ファイルの状態を分ける。','正解状態と必要な回答を照合します。状態の一致だけで途中のポリシー遵守まで確認したとは扱いません。'],
  ['限定して照合','少数の読み取りで本番との差を点検し、必要な忠実度を保つ。','限定評価はモックとの乖離の確認です。実行頻度・準備・危険を踏まえ、無制限の本番書込みへ広げません。']
 ]),
 'environment-repro-fidelity':rows([
  ['条件を固定','初期状態・時刻・乱数とID・外部応答を固定する。','環境側の揺れを消せる範囲で減らします。図の照合を実環境の作成や実LLMの決定性の保証にしません。'],
  ['残る揺れ','環境の固定と、Agentの非決定性への反復を分ける。','固定した環境でもLLM出力は揺れます。同じ初期状態を全試行の成功保証にしません。'],
  ['忠実度を保つ','通常・空・エラー・大量応答と、本番APIとの差を点検する。','モックの速さと保守の費用を併せて読む。本番API変更の運用にモック更新を組み込みます。'],
  ['CIへ載せる','シード・リセット・後片付けを自動化し、層ごとに頻度と予算を分ける。','速いモックと重い状態付き環境を同じ頻度へ集めません。図はCIや実APIを実行しません。'],
  ['失敗を再現','本番の失敗を入力と初期状態の組へし、修正と回帰へ残す。','入力だけのケースでは状態依存の失敗を再現できません。既知失敗の回帰を全将来タスクの保証にしません。']
 ]),
 'simulator-roles-constraints':rows([
  ['役割の分離','相手役の発話・Agentの操作・採点を、別の責任として置く。','相手役の満足を採点の正解にしません。図はユーザー役LLMや実Agentを起動しません。'],
  ['五つの構成','ペルソナ・目標・持ち情報・忍耐と振舞い・口調を設計する。','自然な雑談より、評価目的に必要な難しさを作る。情報の後出しや曖昧な依頼を意図的に含めます。'],
  ['終了を定める','目標と終了条件を外から定め、満足の基準をモデル任せにしない。','脱線・常時満足・永遠に不満を区分します。発話だけの役割へ絞り、業務toolの操作を渡しません。'],
  ['発話を照合','固定した事実と選択肢を照合し、相手役の失敗を別集計する。','プロンプトだけで捏造を防げるとはしません。自由文は抜き取りの人手確認を残し、Agent失敗との混同を避けます。'],
  ['原論文の分担','τ-bench原論文では、ユーザー役はAgentとtoolの通信を見ない。','相手役はシナリオと会話履歴、業務APIとDBはAgent、終了状態と必要回答の照合は採点側です。ユーザー役を業務APIで制約する方式にしません。']
 ]),
 'simulator-scenarios-validation':rows([
  ['分布を作る','正常・曖昧・不足・変更・拒否すべき依頼を、シナリオへする。','実ログから代表・困難なケースを抽出する。架空の自然な会話の量をカバレッジにしません。'],
  ['人間との差','人間ログと対話を照合し、聞かない情報や不自然な発話を読む。','人間との差が残る評価を実利用者の代表として確定しません。図は実ログの収集・転送をしません。'],
  ['道具を検証','既知の良い・悪いAgentを弁別し、相手役の条件と失敗を検証する。','全条件の模式照合は採用検討の候補です。実際の会話評価や人手の判定を完了したとは扱いません。'],
  ['過適合を点検','特定の相手役での改善を、実利用者との検証に戻す。','同じシミュレータ相手にだけ強い状態へ最適化しません。実対話との照合と反復を併用します。'],
  ['共有する盲点','別系統のモデルと、人手の設計で盲点を点検する。','別系統を使えば全盲点が消えるとはしません。もっともらしさと弁別できる難しさを分けます。']
 ]),
 'calibration-signals-bins':rows([
  ['信号と行動','確信度を取り出し、検証して、低信頼の縮退へ渡す。','過信・幻覚の由来と人へ回す運用の正本を分けます。数字の表示だけで正解の確率とは扱いません。'],
  ['取り出す方法','自己申告・logprob・反復一致度の限界を分ける。','利用モデルや用途の条件を保ちます。同じ答えの反復をその答えの正しさにしません。'],
  ['較正の意味','確信80%のケースが、どれだけ正解しているかを測る。','較正は確信度と実際の正解率の対応です。各回答が必ず8割正しいという保証にしません。'],
  ['ビンで読む','確信度で分け、ビンの正解率と母数を対角線に照合する。','模式の件数と平均確信度です。空の母数を正解率ゼロや完全較正にせず、図が実モデルを測ったとは扱いません。'],
  ['順序も点検','高信頼のケースほど正解しやすいかを確認し、縮退へ使う。','過信や迎合を保持します。信頼度の順位が壊れているなら、閾値を上げただけで精度改善とは扱いません。']
 ]),
 'calibration-abstain-update':rows([
  ['棄権の経路','低信頼なら答えず、不明や人への引き継ぎへ進める。','図は実回答やエスカレーションを送信しません。高信頼でも正解が保証されるとは扱いません。'],
  ['母数と精度','答える割合と、答えたケースの正解率を別々に読む。','模式の集計から計算します。すべて棄権したときは正解率の母数がなく、100%にしません。'],
  ['失敗のコスト','誤答と棄権の負担から、タスクごとの判断を残す。','高リスクの実判断や普遍的な閾値を図が決めません。下書きと不可逆操作の条件を同じにしません。'],
  ['セットで選ぶ','閾値を動かして、棄権率と回答した精度を評価セットで測る。','原文の85%・97%は比較の説明です。架空の実成績や最適閾値へ変換しません。'],
  ['更新時に測る','モデル更新や大きなprompt変更では、較正と閾値を測り直す。','旧閾値を新構成へ無検証で転用しません。図の操作はモデルやpromptの更新ではありません。'],
  ['継続して監視','較正のずれを回帰と定期監視へ戻す。','一度の較正を永久の確率保証にしません。過信が縮退をすり抜ける条件を点検します。']
 ])
})
export function evaluationContextFrame(diagram,phase){const stages=EVALUATION_CONTEXT_STAGES[diagram];if(!stages)throw TypeError('Unknown evaluation context diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit evaluation context required')}
export function evaluationEnvironmentLayer(layer){if(!['mock','state','limited'].includes(layer))throw TypeError('Known environment layer required');return {target:layer==='mock'?'calls':layer==='state'?'final-state':'drift',readOnly:layer==='limited',environmentCreated:false,securityIsolationGuaranteed:false}}
export function evaluationReproducibility({stateReset,timeFixed,seedFixed,externalFixed}){const values=[stateReset,timeFixed,seedFixed,externalFixed];explicit(values);return {conditionsMatched:values.every(Boolean),agentDeterministic:false,environmentCreated:false}}
export function simulatorUtterance({factsMatch,allowedSpeech,goalBounded,endBounded}){const values=[factsMatch,allowedSpeech,goalBounded,endBounded];explicit(values);return {simulatorFailure:!values.every(Boolean),agentOutcomeVerified:false,conversationExecuted:false}}
export function simulatorAcceptance({humanCompared,knownQualitySeparated,factsChecked,failuresSeparated,repeated,blindspotsChecked}){const values=[humanCompared,knownQualitySeparated,factsChecked,failuresSeparated,repeated,blindspotsChecked];explicit(values);return {reviewCandidate:values.every(Boolean),qualityGuaranteed:false,conversationExecuted:false}}
export function calibrationBins(bins){if(!Array.isArray(bins)||bins.length>5||bins.some(b=>!b||!Number.isFinite(b.confidence)||b.confidence<0||b.confidence>1||!Number.isInteger(b.total)||b.total<0||b.total>20||!Number.isInteger(b.correct)||b.correct<0||b.correct>b.total))throw TypeError('Bounded toy calibration bins required');return bins.map(b=>({...b,accuracy:b.total?b.correct/b.total:null,gap:b.total?b.confidence-b.correct/b.total:null,modelMeasured:false}))}
export function selectivePrediction(bins,threshold){if(!Number.isFinite(threshold)||threshold<0||threshold>1)throw TypeError('Bounded threshold required');const checked=calibrationBins(bins),total=checked.reduce((sum,b)=>sum+b.total,0),answered=checked.filter(b=>b.confidence>=threshold),accepted=answered.reduce((sum,b)=>sum+b.total,0),correct=answered.reduce((sum,b)=>sum+b.correct,0);return {total,answered:accepted,correct,coverage:total?accepted/total:null,accuracy:accepted?correct/accepted:null,escalationSent:false,qualityGuaranteed:false}}
