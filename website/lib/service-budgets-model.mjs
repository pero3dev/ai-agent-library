import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SERVICE_BUDGETS_STAGES=Object.freeze({
 'cost-history-measurement':rows([
  ['三つの変動','回数・毎回の履歴再送・固定の入力が、タスク費用を変える。','模式の長さは実tokenの計測ではありません。単発の呼出しや月額合計だけでタスクの単位経済を読めたとは扱いません。'],
  ['履歴の累積','一定量の履歴を毎回追加して再送する条件で、総入力が膨らむ。','固定入力と一定の履歴増分という模式条件です。圧縮や打切りがある全システムで、無条件に二乗増加するとは扱いません。'],
  ['固定の入力','system・tool定義・tool結果も、入力の計測に含める。','ユーザー本文だけを入力費用にしません。入力が支配的かは実構成で測り、図の長さを全モデルの費用にしません。'],
  ['タスク単位','まずタスク1件を単位に、tokenと費用をトレースへ記録する。','図は実APIや課金を実行しません。タスク、ユーザー、テナント、機能を関連付けて実費を読む設計です。'],
  ['分布を読む','平均だけでなくP95と最大、属性別の分布を追う。','少数の暴走が合計を支配する条件を点検します。模式の数値を本番のP95や請求額にしません。']
 ]),
 'cost-reduction-quality':rows([
  ['手段を分ける','入力再処理・履歴膨張・部品・tool結果・即時性を分ける。','キャッシュ、圧縮、モデル使い分け、結果の絞込み、バッチは効く対象が違います。削減だけを品質の合格にしません。'],
  ['前方一致','固定部分を先頭に、可変末尾を後ろへ集める。','再利用するprefixが同じ条件でキャッシュ候補になります。図の一致を実cache hitや全モデルでの対応にしません。'],
  ['圧縮と品質','履歴を小さくする変更では、失う情報を品質評価で確かめる。','費用の縮小だけで元の意図や制約が残ったとは扱いません。キャッシュの単価・対応条件は原文TODOで最新を確認します。'],
  ['部品と総費用','単純な部品に使うモデルも、再試行と人手を含む総費用で選ぶ。','安い単価を安い成功タスクにしません。図は実モデルの品質や料金を比較していません。'],
  ['結果と即時性','不要なtool結果を絞り、急がないタスクを非同期バッチへ分ける。','取りすぎない設計はtool側の責任です。バッチ割引と応答の非同期を、すべてのタスクの即時完了にしません。']
 ]),
 'cost-budget-cache-accounting':rows([
  ['三層の上限','タスク・テナント・全体で、異なる影響範囲へ上限を置く。','図は予算を実システムへ設定しません。一つの上限だけで全層の暴走を止めたとは扱いません。'],
  ['タスクと占有','最大ステップとtoken、期間利用とrate limitを分ける。','単一タスクの停止条件と、利用者による占有・悪用の制御は違います。'],
  ['全体の予算','日次・月次の予算を監視し、遮断と対応手順へつなぐ。','模式の残量は請求額や実行許可ではありません。予算遮断を既に発生した費用や作用の取消にしません。'],
  ['報告して停止','上限では、ここまでの結果と中断理由を残して停止する。','黙って切り捨てません。図は実Agentを停止せず、未完了を成功や既作用の取消にしません。'],
  ['三つの区分','通常入力・cache読取・cache書込を重複せず区分する。','原文の2026-09-10確認のusage区分を読む。数字と倍率は無単位の模式入力で、実料金・全ベンダー共通の計算仕様ではありません。'],
  ['再利用と契約','再利用しない可変末尾の書込と、モデル別の単価・保持契約を読む。','書込に通常入力を二重加算しません。原文の保持時間をデータ削除期限へ変換せず、割引率を他モデルへ流用しません。'],
  ['条件を保持','原文の構成更新とeffortの例は、モデル・経路・時点付きで読む。','対応する追記機構を、systemや過去履歴を自由に書き換えても一致する保証へ広げません。最新の条件は特化ガイドへ戻します。']
 ]),
 'latency-breakdown-tools':rows([
  ['実時間を分解','LLM・tool・オーバーヘッドの内訳を、トレースから読む。','模式時間は無単位です。体感を改善するstreamingと、実際の完了時間の短縮を分けます。'],
  ['一回の時間','TTFTと出力長×生成時間から、LLM一回の時間を近似する。','模式の近似で、実モデルを計測したものではありません。全構成で固定のTTFTや出力速度を保証しません。'],
  ['支配項を測る','LLMと決めつけず、実際に遅いタスクの内訳を測る。','一つの遅いtoolが支配する場合もあります。図の選択は原因の実証や本番の測定ではありません。'],
  ['往復を減らす','必要情報を一往復にまとめ、依存がないtoolだけを並列にする。','先行結果が必要な呼出しは直列です。図はtoolを実行せず、無条件な並列化を成功や副作用の安全性にしません。'],
  ['判断を限定','固定の手順をWorkflowへ、Agentには必要な判断を残す。','自律性と回数・費用を併せて読む。固定手順へ変えればすべてのタスク品質が保たれるとは扱いません。']
 ]),
 'latency-levers-priorities':rows([
  ['出力を短く','中間の構造化・短い応答を、品質評価とセットで調整する。','推論の記述を削ると品質が下がる場合があります。短くしただけで最適化の採用にしません。'],
  ['TTFTと部品','入力再処理の削減と、単純部品の高速モデルを評価する。','cacheや小型をすべての構成の実時間短縮にせず、品質・再試行・総費用を併せて読む。'],
  ['toolを直す','遅いAPIやqueryを最適化し、各toolにtimeoutを設ける。','timeoutは待機の上限で、toolの既作用を取消すものではありません。図は実APIやtimeoutを起動しません。'],
  ['三つの優先','品質・費用・レイテンシの優先順位を、タスクごとに明示する。','全軸を無条件に最優先へしません。図の必要条件照合は採用検討の候補で、実測や実リリースではありません。'],
  ['同期の必要','急がないタスクは、ジョブと妥当な完了通知へ分ける。','非同期化を即時完了や通知済みへ変換しません。同期SLOと戦う前に、要件を見直す判断です。']
 ]),
 'slo-indicators-reliability':rows([
  ['指標と目標','SLIの測定とSLOの宣言、発火後の対応を分担する。','目標の宣言を品質の達成や対外契約にしません。計測・judge・品質信号の正本と接続します。'],
  ['候補を選ぶ','成功・採点品質・逸脱・移管・時間と費用を組み合わせる。','エスカレーションは低すぎても高すぎても問題です。数字の小ささだけで品質合格にしません。'],
  ['測定の信頼','judgeの合格率は、判定の検証・較正を前提に読む。','未検証の95%を品質の95%にしません。模式の条件照合は検討候補で、実採点の検証ではありません。'],
  ['現状から合意','まずベースラインを測り、影響に合う現実的な水準を決める。','品質100%を目標にして常時違反へしません。図は医療・金融などの実水準や全用途の閾値を決定しません。'],
  ['複数で見る','品質と時間・費用を併記し、タスクの必要十分な水準を合意する。','品質のための費用暴走を見落としません。水準と指標は合意と実測に戻します。']
 ]),
 'slo-budget-release-sla':rows([
  ['予算の意味','SLOの裏返しとして、許容失敗量を期間と母数付きで読む。','模式の99%と1000件では許容10件です。図の数を実測した品質や自社の最適SLOにしません。'],
  ['残量と判断','予算が残る場合と、使い切った場合の優先順位を分ける。','超過は誰かを非難する根拠ではなく、止める変更と直す品質を判断するトリガーです。'],
  ['変更の関門','予算と測定・guardの条件を照合し、変更可否を判断する。','残量だけで未検証の変更を出しません。モデル・prompt・知識源の劣化を静かな予算消費として読む。'],
  ['契約と区分','内部SLOと、対外約束・結果を伴うSLAを分ける。','図は契約を締結しません。回答の正しさを無条件に約束できるとはせず、測定の信頼性と統制可能性を読む。'],
  ['余裕を持つ','内部目標より余裕を持つ約束と、約束できる指標を選ぶ。','原文の99%と95%は例です。自社のSLAや免責・補償へ自動昇格しません。API契約の正本へつなぎます。'],
  ['更新で再検査','変更前後のSLIとSLOを回帰・段階リリースで確かめる。','SLOを割る変更をそのまま出しません。図は実デプロイせず、judge世代やモデル更新時の測り直しを残します。']
 ])
})
export function serviceBudgetsFrame(diagram,phase){const stages=SERVICE_BUDGETS_STAGES[diagram];if(!stages)throw TypeError('Unknown service budgets diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit service budget conditions required')}
export function toyHistoryInput({steps,fixed,increment,historyCap}){if(!Number.isInteger(steps)||steps<1||steps>8||!Number.isInteger(fixed)||fixed<0||fixed>8||!Number.isInteger(increment)||increment<0||increment>4||!Number.isInteger(historyCap)||historyCap<0||historyCap>8)throw TypeError('Bounded toy history required');const rows=Array.from({length:steps},(_,i)=>({fixed,history:increment*Math.min(i,historyCap),input:fixed+increment*Math.min(i,historyCap)}));return {rows,total:rows.reduce((s,row)=>s+row.input,0),tokensMeasured:false,qualityVerified:false}}
export function toyCacheAccounting({input,read,write}){if([input,read,write].some(n=>!Number.isInteger(n)||n<0||n>100)||read+write>input)throw TypeError('Disjoint bounded toy token groups required');const ordinary=input-read-write;return {ordinary,read,write,weighted:ordinary+read/5+write*1.5,priced:false,billed:false}}
export function budgetLayers({taskRemaining,tenantRemaining,systemRemaining}){const rows=[taskRemaining,tenantRemaining,systemRemaining];if(rows.some(n=>!Number.isInteger(n)||n<0||n>20))throw TypeError('Bounded remaining toy budgets required');return {blocked:rows.map((n,i)=>n===0?['task','tenant','system'][i]:null).filter(Boolean),mayContinue:rows.every(n=>n>0),stopped:false,effectsUndone:false}}
export function toyLatency({ttft,output,perToken,toolA,toolB,overhead,independent,parallel}){if([ttft,output,perToken,toolA,toolB,overhead].some(n=>!Number.isFinite(n)||n<0||n>20))throw TypeError('Bounded toy durations required');explicit([independent,parallel]);const llm=ttft+output*perToken,tools=independent&&parallel?Math.max(toolA,toolB):toolA+toolB;return {llm,tools,overhead,total:llm+tools+overhead,parallelUsed:independent&&parallel,measured:false,toolsExecuted:false}}
export function latencyAdoption({qualityChecked,costChecked,latencyChecked,priorityDefined}){const v=[qualityChecked,costChecked,latencyChecked,priorityDefined];explicit(v);return {reviewCandidate:v.every(Boolean),deployed:false,improvementGuaranteed:false}}
export function sloMeasurement({definitionKnown,judgeValidated,samplingKnown,measurementWindowKnown}){const v=[definitionKnown,judgeValidated,samplingKnown,measurementWindowKnown];explicit(v);return {reviewCandidate:v.every(Boolean),qualityMeasured:false,contractCreated:false}}
export function toyErrorBudget({total,failed,targetPercent}){if(!Number.isInteger(total)||total<1||total>1000||!Number.isInteger(failed)||failed<0||failed>total||!Number.isInteger(targetPercent)||targetPercent<50||targetPercent>99)throw TypeError('Bounded toy SLO sample required');const allowed=total*(100-targetPercent)/100,remaining=allowed-failed;return {allowed,remaining,exhausted:remaining<=0,observed:(total-failed)/total,qualityMeasured:false}}
export function sloRelease({budgetRemaining,measurementTrusted,guardPassed}){if(!Number.isFinite(budgetRemaining)||budgetRemaining<-1000||budgetRemaining>1000)throw TypeError('Bounded toy error budget required');explicit([measurementTrusted,guardPassed]);return {reviewCandidate:budgetRemaining>0&&measurementTrusted&&guardPassed,deployed:false,contractCreated:false}}
