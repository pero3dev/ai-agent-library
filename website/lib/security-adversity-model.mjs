import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SECURITY_ADVERSITY_STAGES=Object.freeze({
 'red-exercise-design':rows([
 ['モデルから演習','脅威モデルの地図を、隔離した実地試験と修正へ結ぶ。','机上だけでは実効性、演習だけでは網羅性が残ります。図は実攻撃を行いません。'],
 ['作用を成功条件へ','不適切な文章と、権限を使った害のある作用を区別する。','tool提案・実行・最終状態の証拠を別に確認します。'],
 ['四つの設計','範囲・goal・攻撃者の能力・成功条件と記録を先に決める。','本番と似た権限の隔離環境で試す。破壊的な本番攻撃は行いません。'],
 ['手動で深く','七つの手動の型から、各入力sourceと盲点の経路を調べる。','直接・間接・権限・承認・漏えい・連鎖・誘導を分ける。payloadは表示しません。'],
 ['自動で反復','生成・変形・攻撃側LLM・回帰・採点で、既知の経路を反復する。','自動試行数を網羅性や実安全率へ変換しません。judgeの検証も必要です。'],
 ['深さと広さ','手動の新しい発想と、自動の広さ・再現性を補い合う。','微妙な出力は検証済judge、作用はログと最終状態で確認する。']
 ]),
 'red-results-return':rows([
 ['証拠の違い','出力・tool要求・実行・外部状態の観測を読み分ける。','安全そうな出力だけでも、観測がないだけでも、被害なしを確定しません。'],
 ['構造を先に修正','攻撃文字列の個別修正より、権限・承認・三重奏の穴を優先する。','影響・可逆性・機微度・件数と悪用のしやすさを照合します。'],
 ['同じと派生','修正した境界を、同じ攻撃・派生・回帰で再検証する。','promptの調整だけを構造的な修正や安全受入にしません。'],
 ['変更をトリガー','tool・MCP・model・promptの変更で、攻撃面を見直す。','定期実施と構成変更を併用する。図は実CIや演習を起動しません。'],
 ['継続する運用','既知の回帰・外部の視点・開示窓口を、重要度に応じて組む。','他者の検証対象や権限を自動で増やしません。'],
 ['地図へ還流','新しく見つかった経路を、脅威モデルと演習のscopeへ書き戻す。','一度の演習で完了とせず、次の構成と条件で点検します。']
 ]),
 'supply-asset-integrity':rows([
 ['導入前の境界','外から持つ資産の受入と、実行時の隔離・権限を分ける。','同一性や審査を確認しても、実行時の安全保証は完成しません。'],
 ['五つの資産','重み・data・prompt／skill・MCP／tool・依存を棚卸しする。','コード実行を伴う重み形式や、共有指示・更新の面も含めます。'],
 ['資産ごとの作用','読み込むコード・学習へ残るdata・指示・接続の変化を分ける。','便利な共有資産も、出所や形式を確認する前に高権限で使いません。'],
 ['出所と同一性','誰が公開した何かを、信頼した出所と検証手段で照合する。','同じhashは同一性の証拠であり、挙動の無害性や許諾の保証ではありません。'],
 ['審査と許諾','署名／checksum・license・registry審査を、別の条件として確認する。','誰でも投稿できるhubと審査済みを分ける。図は実署名やファイルを検証しません。'],
 ['残る制約','受入後も限定権限・隔離・監視を維持する。','完全な信頼やzero riskは作らない。安全な形式だけでmodel挙動を保証しません。']
 ]),
 'supply-admission-update':rows([
 ['審査と限定試用','出所・同一性・許諾・審査を確認し、限定した隔離環境で試す。','初期試用へ本番dataや全権を自動で渡しません。'],
 ['明示的に昇格','同じ版の試用と必要な権限を照合して、昇格判断へ戻す。','試用成功は図の実権限付与や全権への昇格ではありません。'],
 ['一つの資産台帳','出所・版・受入日・権限・使う場所を、統制のinventoryへ統合する。','記事の学習用台帳の模式図です。作業用の追加台帳やhash台帳は作りません。'],
 ['更新で変わる','MCP・tool・skillの更新で、導入時の受入条件を見直す。','前の版での成功を、新しい版の未確認な挙動へ転用しません。'],
 ['固定と差分','検証済みの版を固定し、差分と再試用を経て更新する。','版の固定は既知の脆弱性を無くす保証ではありません。'],
 ['使う場所を辿る','異常の監視とinventoryを結び、該当する版・権限・場所を調べる。','図は実監視・停止・更新を行わない。実構成の正本へ戻します。']
 ]),
 'attack-delayed-paths':rows([
 ['同じ原理の別経路','記憶・知識源・tool・Agent間・条件起動を、別の入口として読む。','全入力は指示になり得るという原則を、時間と受け渡しにも適用します。'],
 ['記憶の時間差','書かれた内容が、後のsessionで再び読まれる経路を追う。','書込検証・出所・権限分離、想起時の未信頼扱いを保ちます。'],
 ['知識源と検索','取り込みから検索・生成まで、作者と閲覧範囲を確認する。','参照情報だから正しい・安全とは扱わない。取り込み検証と権限検索を重ねます。'],
 ['定義・結果・error','toolの説明・結果・errorも、modelへ入る外部の内容として扱う。','認証や接続の成功を、内容への信頼へ変換しません。'],
 ['Agent間の波及','一体の汚染が委譲と共有文脈を越えたとき、各境界を点検する。','peer出力を上位の命令にせず、各Agentの権限を最小化します。'],
 ['条件が揃う時','時間・入力・状態でだけ動く経路を、単発の正常結果から分ける。','未発火の観測は全条件での安全証拠ではありません。継続監視と条件別の評価を続けます。']
 ]),
 'attack-propagation-controls':rows([
 ['防御を対応づける','五類型を、新規の万能防御でなく既存の境界へ対応づける。','形式や名称だけで適用完了と扱いません。実構成で試験します。'],
 ['入口の制約','出所・書込・取り込み・権限検索を、各dataの入口へ置く。','記憶も知識源も、モデルに見せる前の認可と保存の制約を保ちます。'],
 ['権限を最小化','全ての受け渡しを未信頼とし、各Agentの権限で波及を限定する。','他Agentの出力や共有文脈から、新たな権限を得ません。'],
 ['委譲の確認','重要な委譲は、親の制約と人の確認を維持する。','内部通信という名前だけで境界や承認を省略しません。'],
 ['観測を続ける','多様な条件・更新差分・運用監視を、受入と回帰へ戻す。','一回のreviewや正常出力を、全経路の安全にしません。']
 ])
})
export function securityAdversityFrame(diagram,phase){const stages=SECURITY_ADVERSITY_STAGES[diagram];if(!stages)throw TypeError('Unknown security adversity diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
export function exerciseReview({scopeDefined,goalDefined,capabilityDefined,evidenceDefined,isolatedEnvironment}){const v=[scopeDefined,goalDefined,capabilityDefined,evidenceDefined,isolatedEnvironment];bools(v);return {reviewCandidate:v.every(Boolean),attackExecuted:false}}
export function actionEvidence({unsafeText,toolRequested,toolExecuted,stateChanged,observationComplete}){const v=[unsafeText,toolRequested,toolExecuted,stateChanged,observationComplete];bools(v);return {finding:!observationComplete?'unknown':toolExecuted&&stateChanged?'external-effect-observed':toolExecuted?'execution-observed':toolRequested?'request-observed':unsafeText?'output-observed':'not-observed',safetyEstablished:false}}
export function repairReview({structuralControl,sameCasePassed,variantsPassed,regressionAdded}){const v=[structuralControl,sameCasePassed,variantsPassed,regressionAdded];bools(v);return {reviewCandidate:v.every(Boolean),allThreatsSafe:false}}
export function assetReview({sourceChecked,integrityMatched,licenseChecked,registryChecked}){const v=[sourceChecked,integrityMatched,licenseChecked,registryChecked];bools(v);return {reviewCandidate:v.every(Boolean),behaviorGuaranteed:false}}
export function assetPromotion({reviewed,isolatedTrialPassed,rightsLimited,explicitApproval,sameVersion}){const v=[reviewed,isolatedTrialPassed,rightsLimited,explicitApproval,sameVersion];bools(v);return {reviewCandidate:v.every(Boolean),rightsGranted:false}}
export function updateReview({sameVersion,oldReviewValid,deltaReviewed,newTrialPassed}){const v=[sameVersion,oldReviewValid,deltaReviewed,newTrialPassed];bools(v);return {reviewCandidate:sameVersion?oldReviewValid:deltaReviewed&&newTrialPassed,oldApprovalTransferred: sameVersion&&oldReviewValid,updated:false}}
export function memoryDataReview({writeChecked,sourceRecorded,tenantMatched}){const v=[writeChecked,sourceRecorded,tenantMatched];bools(v);return {reviewCandidate:v.every(Boolean),instructionTrusted:false,groundTruth:false}}
export function peerBoundary({sourceRecorded,rightsLimited,parentGatePreserved}){const v=[sourceRecorded,rightsLimited,parentGatePreserved];bools(v);return {reviewCandidate:v.every(Boolean),instructionTrusted:false,rightsIncreased:false}}
export function conditionalObservation(conditionPresent){bools([conditionPresent]);return {path:conditionPresent?'trigger-condition-present':'trigger-not-observed',safetyEstablished:false,attackExecuted:false}}
