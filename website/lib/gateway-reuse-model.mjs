import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const GATEWAY_REUSE_STAGES=Object.freeze({
 'gateway-crossroads-topology':rows([
 ['共通の交差点','アプリとproviderの間に、利用の共通層を置く。','原則は各正本に残し、共通部品へ実装点を集約する。図はAPIを呼びません。'],
 ['重複を集める','キー・抽象化・集計・監査・上限を、同じ入口へ集める。','統一しただけで分離や品質の保証になりません。共通層も運用対象です。'],
 ['仮想キー','providerのキーと、アプリごとの仮想キーを分ける。','仮想キーに範囲と上限を結ぶ設計です。図はキーを発行・保存・失効しません。'],
 ['三つの構成','自作・OSS・managedを、規模と統制・データ経路で比べる。','代表例は原文の時点です。ライセンスと有償機能・閉域要件を現行版で確認します。'],
 ['共通層も運用','集約の運用負担と、高可用性を選定へ含める。','薄い自作へ機能を足し続ける前に要件を点検する。図は採用を確定しません。']
 ]),
 'gateway-routing-boundaries':rows([
 ['用途と経路','用途別のtierと自ホストを、同じ入口に束ねる。','互換APIは固有機能の全互換を保証しません。モデル選定の原則と分担します。'],
 ['信頼性の実装','fallback・retry・breakerの実装を共通層へ置く。','別providerへの切替は出力・権限・提供条件の点検を飛ばしません。図は切替や再送を行いません。'],
 ['テナント境界','仮想キーへ権限・クォータ・予算を結び、使用量を分ける。','キーの名前だけで分離を保証しません。業務条件と実制御は別に検証します。'],
 ['共通の故障','共通層が落ちたときの影響範囲を、高可用性へ戻す。','providerの冗長性だけでゲートウェイの単一障害点は消えません。模式の構成は稼働証拠ではありません。'],
 ['固有機能を残す','統一と固有機能の経路、監視・更新・スケールを両立する。','抽象化の過不足を読む。共通化を運用負担ゼロにしません。'],
 ['世代と許諾','製品の世代とcore・機能tierの境界を分けて照合する。','原文の2026-09-10の確認範囲と未確定を保持する。Kong coreの許諾を製品全体へ広げません。']
 ]),
 'cache-levels-semantic-risk':rows([
 ['入力と応答','入力の処理結果と、過去の最終応答の再利用を分ける。','応答ヒットはモデルを呼ばない設計です。検索や運用の費用までゼロとは扱いません。'],
 ['三つの一致','完全・意味保存の正規化・類似度の三階層を比べる。','まず厳しい一致で足りるかを確認する。完全一致でも権限・文脈・知識版の条件が残ります。'],
 ['意味を守る','語順・否定・名前・コードの差を、無条件に捨てない。','原文のA pays BとB pays Aは支払う側が逆です。用途で確認した変換だけを使います。'],
 ['候補から応答','質問ベクトルの候補としきい値を、最終応答へ結ぶ。','モデルへのRAGではなく応答の再利用です。図は埋め込みや実検索を行いません。'],
 ['類似は同一でない','近い質問でも、答えが異なる条件を点検する。','東京と大阪の天気、解約可と不可の質問を、同じ応答へ変換しません。'],
 ['被害と基準','しきい値を、誤ヒットの被害と品質の計測で選ぶ。','高いヒット率や類似候補だけで正しい応答とは扱いません。図の入力は模式条件です。']
 ]),
 'cache-reuse-invalidation':rows([
 ['対象を絞る','決定性・非個人化・鮮度の条件から、共有対象を絞る。','全応答を一律に載せません。図は実キャッシュへ保存しません。'],
 ['三軸の条件','同じ答えでよい条件を、三軸すべてで確認する。','個人・権限で変わる情報、残高や在庫、創作を無条件の共有対象にしません。'],
 ['更新と期限','知識源・prompt・modelの変更に無効化を結び、TTLを足す。','TTLだけで更新直後の古い答えを正しくしません。図は実無効化を行いません。'],
 ['境界をキーへ','tenant・権限をキーへ含め、個人応答を共有しない。','境界はコスト最適化より先です。近い質問でも別tenantや権限なら共有候補にしません。'],
 ['二つの計測','ヒット率と誤ヒット・品質低下を、同時に測る。','サンプリング比較の設計を読む。図は実モデルの応答を測定しません。'],
 ['調整へ戻る','削減した費用・時間と品質の変化から、対象と基準を直す。','ヒット率だけを成功にしません。模式条件は実採用・実品質の証拠ではありません。']
 ]),
 'batch-route-capacity':rows([
 ['急がない経路','即時性が不要な大量処理を、非同期の経路へ分ける。','ユーザーを待たせる対話・その場の判断と分ける。図はジョブを投入しません。'],
 ['猶予と割引','待てる猶予と単価・容量を、providerの契約で読む。','原文の代表的性質で、現在の割引率・提供モデル・保持期限を生成しません。'],
 ['全件成功は別','期限までの処理猶予と、全件成功の保証を区別する。','期限切れでも完了結果と未完了エラーを回収する。容量枠にも制限があります。'],
 ['四つの対象','評価・再埋め込み・backfill・一括分類を、締切で選ぶ。','同じ処理でも即時性が必要な利用を、そのままバッチへ載せません。'],
 ['締切で選ぶ','大量・余裕・即時性不要の条件から、経路を検討する。','条件照合は納期保証ではありません。実時間と再投入・回収の余裕を見積もります。']
 ]),
 'batch-results-deadlines':rows([
 ['分割と進捗','扱える単位へ分割し、項目ごとの成功・失敗を残す。','原文の1万件中30件の例を保持する。図の入力はその結果の状態を読む模式条件です。'],
 ['不明と再投入','成功分を再送せず、不明なら既存ジョブを照合する。','custom_idは対応の識別子で、再投入の呼出し・課金重複を排除する保証ではありません。'],
 ['同じ処理','即時とbatchで、prompt・後処理のロジックを共有する。','実行経路だけを変える。2経路があるだけで同じ品質とは扱いません。'],
 ['順序に頼らない','一意の入力キーで結果を対応づけ、順序を保証としない。','識別と受信側の冪等契約・原子的な反映を分ける。図は実結果を保存しません。'],
 ['費用と納期','件数・token・単価と、期限切れ・再投入・回収の時間を見込む。','原文の概算式で実料金や納期を保証しません。即時経路にも容量の限界があります。'],
 ['監視と切替','進捗・成功率・完了時間・失敗の偏りから、切替を検討する。','投げっぱなしを完了にしません。図は再投入・課金・切替を実行しません。']
 ])
})
export function gatewayReuseFrame(diagram,phase){const stages=GATEWAY_REUSE_STAGES[diagram];if(!stages)throw TypeError('Unknown gateway reuse diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit gateway reuse conditions required')}
export function gatewayControl({tenantKnown,keyScoped,quotaSet,budgetSet,auditSet}){const v=[tenantKnown,keyScoped,quotaSet,budgetSet,auditSet];bools(v);return {reviewCandidate:v.every(Boolean),isolated:false,keyIssued:false}}
export function gatewayAvailability({gatewayRedundant,providerRedundant}){bools([gatewayRedundant,providerRedundant]);return {gatewaySinglePoint:!gatewayRedundant,providerSinglePoint:!providerRedundant,availabilityMeasured:false}}
export function responseCacheTarget({deterministic,nonPersonalized,freshnessIndependent}){const v=[deterministic,nonPersonalized,freshnessIndependent];bools(v);return {reviewCandidate:v.every(Boolean),stored:false}}
export function cacheReuse({matchCandidate,sameTenant,sameScope,sameContext,versionsCurrent,notExpired,sharedTarget}){const v=[matchCandidate,sameTenant,sameScope,sameContext,versionsCurrent,notExpired,sharedTarget];bools(v);return {reviewCandidate:v.every(Boolean),returned:false,correctnessGuaranteed:false}}
export function cacheInvalidation({knowledgeChanged,promptChanged,modelChanged,ttlExpired}){const v=[knowledgeChanged,promptChanged,modelChanged,ttlExpired];bools(v);return {discardCandidate:v.some(Boolean),invalidated:false}}
export function batchRoute({large,deadlineLoose,immediateRequired}){bools([large,deadlineLoose,immediateRequired]);return {next:large&&deadlineLoose&&!immediateRequired?'batch-candidate':'realtime-review',submitted:false,deadlineGuaranteed:false}}
export function batchItemNext(status){if(!['succeeded','failed','expired','unknown'].includes(status))throw TypeError('Known batch item status required');return {next:status==='succeeded'?'keep-result':status==='unknown'?'reconcile-job':'retry-item-review',resubmitted:false,callDeduplicated:false}}
export function batchCapacity({queueTime,retryTime,recoveryTime,deadlineTime,realtimeAvailable}){if([queueTime,retryTime,recoveryTime,deadlineTime].some(n=>!Number.isInteger(n)||n<0||n>20))throw TypeError('Bounded toy deadline terms required');bools([realtimeAvailable]);const needed=queueTime+retryTime+recoveryTime;return {needed,margin:deadlineTime-needed,next:needed<=deadlineTime?'batch-plan-review':realtimeAvailable?'realtime-capacity-review':'deadline-replan',completed:false}}
