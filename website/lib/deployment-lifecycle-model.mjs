import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const DEPLOYMENT_LIFECYCLE_STAGES=Object.freeze({
 'deployment-state-execution':rows([
 ['三つの制約','長い処理・外部の制限・token費用を、実行基盤へ結ぶ。','HTTPの切断を処理の停止にしません。各原則の実装場所を読む図です。'],
 ['外部状態','queue・worker・外部状態と進捗の経路を分ける。','workerを増やす前に状態を外へ置きます。図は実ジョブや保存を行いません。'],
 ['四つの形態','同期・job・常駐・serverlessを、待ち時間と状態で比べる。','daemonの自己制限、serverlessの時間上限とcold startも残ります。'],
 ['tailで選ぶ','平均ではなくp95〜p99と同期上限から、jobへの分離を検討する。','対話的なUIでも進捗付きjobにできます。模式時間は実測の分位点ではありません。'],
 ['再開の位置','履歴とcheckpointを外部化し、workerの交換後も再開点を読む。','会話・ツール間・phaseの状態を保持する。affinityだけで障害復旧とは扱いません。'],
 ['副作用の契約','受信側の冪等契約か同じDBの原子的反映で、重複を防ぐ。','結果不明で契約がなければ自動再送を止め照合する。事前確認だけでは保証しません。']
 ]),
 'deployment-capacity-fallback':rows([
 ['CPU以外の上限','RPM・TPMと同時実行から、外部APIの容量を読む。','server数だけ増やしてもproviderの上限は増えません。実上限は原文のTODOと現行契約へ戻します。'],
 ['待ち行列','対話とbatchの優先度、tokenとloop上限を含めて流入を制御する。','semaphore・backpressure・queue waitを一緒に観測する。図は実呼出しを抑制しません。'],
 ['切替の条件','別model・providerの品質と切替・復帰条件を、先に評価する。','軽量経路の品質も事前評価が必要です。切替の名前だけで同品質とは扱いません。'],
 ['全体停止','全providerが使えないときは、受付を止めるか後続queueへ残す。','要求とprovider別のtraceで分析する。図は実再送・切替・復帰を行いません。'],
 ['小さく展開','旧・新経路を比較し、canaryとshadowの追加容量を含める。','shadowでも両経路のAPI枠と費用が必要です。成功率だけで全面展開を確定しません。'],
 ['残る作用','HTTP切断・memory消失・retry stormを、容量と状態の設計へ戻す。','中断しても課金や処理が残り得ます。要求数だけでtoken費用を管理しません。']
 ]),
 'resident-maintenance-signals':rows([
 ['個体の範囲','個体を、process・構成・外部記憶・taskの組として読む。','長く動かしただけでmodelの重みが劣化する説明にしません。単一taskのdurabilityと分担します。'],
 ['四つの変化','記憶・ルール・環境・品質の変化を、別の兆候として観測する。','図は模式の分類です。毎週一定に劣化する実測曲線は置きません。'],
 ['変化の時点','緩い傾向と急な変更の両方を、SLIとイベントで追う。','API変更や記憶の汚染は急変にもなります。一回の結果を全個体の状態へ広げません。'],
 ['二つの入口','定期とイベント起点から、記憶・文脈・健康状態を点検する。','時刻だけで点検済みにしません。無効記憶と矛盾するルールを点検します。'],
 ['保守の戻り先','決定を残し、外部計画・成果物から文脈を再構成する。','raw履歴を積み続けず、品質・成功率・人への移管で保守の結果を判断します。']
 ]),
 'resident-succession-retirement':rows([
 ['引継ぎを選ぶ','保守で戻らないとき、新しい個体への交代を検討する。','外部化した状態から準備する。図は個体を生成・停止しません。'],
 ['残すと捨てる','決定・確立した知識・未完taskと、汚染履歴・無効設定を分ける。','全履歴のコピーを保守完了にしません。元の権限・保持条件は引継ぎにも必要です。'],
 ['作用なしで比較','記録入力のreplayと副作用を止めたshadowで、新旧を比較する。','注文・送信・更新を二重に実行しません。図は実比較の品質を測りません。'],
 ['一つの実行権','実行権・処理済み記録・業務キーを、切替の前提へ結ぶ。','同じpromptとmodelでも個体差が残ります。記憶・設定のsnapshotも再現へ含めます。'],
 ['退役を決める','事前のSLI基準と終了時の保持・安全な破棄を設計する。','停止を保存先全部の削除完了にしません。使わない個体の費用と権限も回収します。'],
 ['戻る判断','無期限運用・全履歴移管・副作用付き並走を、設計へ戻す。','個体差や劣化を決めつけず、観測と切替条件で判断します。図は実承認しません。']
 ]),
 'mlops-common-differences':rows([
 ['共通の循環','変更を記録し、比較して展開し、監視から戻る基盤を共有する。','個別の版・prompt・observabilityの正本と分担する組織基盤の図です。'],
 ['比較の前提','自作予測modelと借りる生成アプリを、代表例として比べる。','従来MLにも不確実性・安全・公平性・費用があり、単一指標で足りるとは扱いません。'],
 ['五つの差分','資産・実験・評価・変更経路・監視を、一つずつ照合する。','全MLを決定的、全LLMを学習不要にしません。導入の頻度は利用条件で変わります。'],
 ['学習以外の変更','prompt・検索・toolの変更でも、組合せの比較と回帰を行う。','modelだけを版管理してもアプリの挙動は固定されません。'],
 ['既存を使う','実験・metrics・data pipeline・CI/CD・認証監査を部品別に点検する。','feature storeを無条件に全文再利用できるとは扱いません。製品名だけで適合しません。'],
 ['差分を足す','prompt版・確率的評価・token費用・traceを、共通基盤へ足す。','LLM-as-judgeも校正と失敗ケースが必要です。図は実評価や費用計測を行いません。']
 ]),
 'mlops-roles-training-join':rows([
 ['責任を分ける','ML・アプリ・platformの責任を、借りる／作る境界で読む。','品質の責任をmodel提供者だけへ移しません。'],
 ['つなぐ成果物','学習とアプリ品質と共通基盤を、版・評価・監視でつなぐ。','FTを始めても責任が空白にならないよう、変更前に接点を決めます。'],
 ['二つの道具','特化型と既存拡張を、成熟度・規模・分業と重複運用で比べる。','tool名だけで採用を確定せず、管理画面の二重化・部品ごとの適合も見る。'],
 ['学習の合流','FTでは学習データ・job・model版を、既存MLの知識へ接続する。','借りる構成だけならFTは必須ではありません。将来の接続点を先に設計します。'],
 ['分断を防ぐ','基盤の全作り直し・評価分断・役割の空白を、共通循環へ戻す。','模式条件の照合は実採用・学習実行・品質の保証ではありません。']
 ])
})
export function deploymentLifecycleFrame(diagram,phase){const stages=DEPLOYMENT_LIFECYCLE_STAGES[diagram];if(!stages)throw TypeError('Unknown deployment lifecycle diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const booleans=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
const bounded=values=>{if(values.some(x=>!Number.isInteger(x)||x<0||x>100))throw TypeError('Bounded toy inputs required')}
export function executionRoute({tail,syncLimit}){bounded([tail,syncLimit]);return {next:tail>syncLimit?'job-progress-review':'sync-review',completed:false}}
export function effectRecovery({outcomeKnown,receiverContract,atomicUpdate}){booleans([outcomeKnown,receiverContract,atomicUpdate]);return {next:!outcomeKnown&&!receiverContract&&!atomicUpdate?'stop-and-reconcile':'recovery-contract-review',resent:false}}
export function toyApiCapacity({tasks,tokens,loopBound,rpm,tpm}){bounded([tasks,tokens,loopBound,rpm,tpm]);const calls=tasks*loopBound,tokenDemand=calls*tokens;return {calls,tokenDemand,rpmWithin:calls<=rpm,tpmWithin:tokenDemand<=tpm,submitted:false}}
export function fallbackPlan({alternativeEvaluated,switchRule,returnRule,available}){booleans([alternativeEvaluated,switchRule,returnRule,available]);return {next:!available?'stop-or-queue':alternativeEvaluated&&switchRule&&returnRule?'fallback-review':'retain-and-evaluate',switched:false}}
export function shadowAllowance({oldDemand,newDemand,limit}){bounded([oldDemand,newDemand,limit]);const combined=oldDemand+newDemand;return {combined,within:combined<=limit,deployed:false}}
export function successionPlan({noShadowEffects,exclusiveRight,processedRecords,businessKey}){const v=[noShadowEffects,exclusiveRight,processedRecords,businessKey];booleans(v);return {reviewCandidate:v.every(Boolean),switched:false}}
export function retirementCoverage({disabled,accessRecovered,stateHandled}){const v=[disabled,accessRecovered,stateHandled];booleans(v);return {reviewCandidate:v.every(Boolean),deleted:false}}
export function trainingJoin({trainingPlanned,dataOwner,jobOwner,modelVersion,appEvaluation}){const v=[trainingPlanned,dataOwner,jobOwner,modelVersion,appEvaluation];booleans(v);return {next:!trainingPlanned?'borrowed-app-path':v.every(Boolean)?'training-integration-review':'assign-missing-owners',trained:false}}
