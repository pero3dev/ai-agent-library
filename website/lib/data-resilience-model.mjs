import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const DATA_RESILIENCE_STAGES=Object.freeze({
 'conversation-collection-layers':rows([
 ['二面性と全段','改善の一次資料と機微情報として、全段へ統制を置く。','図は会話を収集しません。利用の価値だけで開放せず、機微だけを理由に改善の経路を無設計にしません。'],
 ['同じtrace','応答・検索・tool・フィードバックを、同じIDで関連付ける。','結合は分析の入口で、全文の保存義務や実データの検索済みを意味しません。'],
 ['目的と最小化','目的と記録範囲を説明し、学習利用は別の条件として扱う。','運用目的を学習利用の同意・契約に広げません。必要な内容・件数・期間を絞り、規制の正本へ戻します。'],
 ['非構造の機微','発話だけでなく、toolの結果にも記録前の処理を置く。','機微の場所は予測できません。既知パターンの検出を完全な除去にしません。'],
 ['三つの加工','入口のマスク、分離した仮ID、用途別の保存層を分ける。','仮名化は対応表を分離した可逆の識別です。匿名化と同じ意味や無条件の広い利用へ変換しません。'],
 ['残る機微','文脈と派生データにも機微が写るため、原本の統制から始める。','埋め込み・要約・cache・評価ケースも対象です。加工しただけでアクセス・契約・再識別の点検を省きません。']
 ]),
 'conversation-retention-deletion':rows([
 ['用途と期間','用途に必要な保持期間を宣言し、満了を運用へ載せる。','図は実データを保存・削除しません。原文の週〜月や長期は設計例で、全組織共通の保存義務ではありません。'],
 ['四つの保存層','生ログ・分析用・評価用・集計を、別の用途と条件で保つ。','匿名化済み評価用も個人から切り離せているか確認します。集計に個人データが残るなら同じ条件とは扱いません。'],
 ['二つの削除','期限の満了と、利用者・テナントの要求を分ける。','要求では全保存層を横断する配置が必要です。原本だけを消した状態を完了にしません。'],
 ['派生物まで','ID・所在・系譜から、派生データの残存を照合する。','模式の点検条件は実削除の証拠ではありません。削除対応に必要な系譜を、会話本文の全量保存義務にしません。'],
 ['評価の条件','評価へ入れる前に匿名化と再識別リスク・契約を点検する。','処理名だけで個人から切り離せたとは扱いません。削除で抜けるケースと回帰保守の条件も読む。']
 ]),
 'conversation-use-access':rows([
 ['活用の要件','改善の循環を可能にするデータ側の要件を揃える。','改善運用の正本はフィードバックと評価データです。記録しただけで改善の完了にしません。'],
 ['分析を支える','属性検索・ラベル保存・管理環境内の分析を揃える。','毎回の生ログ持出しは統制外のコピーを増やします。図はログを検索・exportしません。'],
 ['読める範囲','全員が全会話を読める状態を、既定のアクセスにしない。','外部漏えいがなくても目的と契約・信頼の問題になります。図は実アクセスを許可しません。'],
 ['役割と監査','マスク済みを既定に、目的・役割・例外承認・閲覧監査を揃える。','マスクだけでアクセス条件を満たしません。生ログの例外承認と、誰が何を見たかの記録を残します。'],
 ['送信の経路','監視SaaSや分析サービスへの送信先・保持・学習利用を点検する。','送信を単なるログ表示にしません。図は外部送信せず、契約や法的適合を判定しません。']
 ]),
 'governance-ownership-catalogue':rows([
 ['正本の分担','知識源の組織管理を、会話ログ・規制・取り込み技術と分担する。','制度の正本を技術のタグへ置換しません。図は全組織の責任を確定しません。'],
 ['知識源の品質','古い・誤った・重複した版は、生成だけでは直せない場合がある。','AIの誤答から原本の条件へ戻します。図の分類を実際の原因の確定にしません。'],
 ['オーナーへ戻す','責任者・更新義務を決め、回答から原本と責任者へ遡る。','担当名があるだけで更新や廃止が完了したとは扱いません。図は担当へ連絡しません。'],
 ['五つの所在情報','所在・鮮度・権限・オーナー・用途の可否をカタログへ載せる。','AI利用のタグだけで適合を保証しません。実インデックスと更新日・見直し日を関連付ける設計です。'],
 ['土台を先に','責任とカタログ・定期品質計測を、問題の差戻しへつなぐ。','AI導入だけでデータ整備が自動完了するとは扱いません。模式の条件照合は運用の検討候補です。']
 ]),
 'governance-quality-permission':rows([
 ['測れる基準','鮮度・正確性・一意性を測り、基準を割る原本を差し戻す。','空の母数を0%へせず、模式の比率を実データ品質にしません。三指標は同じ資料で重なり得ます。'],
 ['用途を分ける','検索と学習は、別の利用可否として分類する。','検索に載せてよいことをFTや合成データへの利用可にしません。'],
 ['未分類は保留','分類がないデータは、AIに載せないことを既定にする。','タグが可でも権限・機微・権利・契約の点検は別に残ります。図は実取り込みを行いません。'],
 ['問題を還流','フィードバックの知識源問題を、原本の責任者へ戻す。','AIをきっかけに整備を進める運用です。土台の責任とカタログを丸投げしません。'],
 ['既存組織へ','既存のカタログと品質管理へ、AI固有の所在と用途を足す。','AIのために二重の管理組織を自動作成しません。'],
 ['分担を揃える','規制・法務と取り込み技術の責任を、既存の仕組みで分担する。','AIチームだけで権限と全管理を抱えません。図は組織の権限や契約を変更しません。']
 ]),
 'chaos-hypothesis-targets':rows([
 ['信頼性の演習','備えの設計・攻撃の演習・環境・事故対応と分担する。','図は実障害を注入しません。信頼性の演習をセキュリティの全防御や実Agentの試験にしません。'],
 ['四つの対象','provider・出力・tool・知識源の異常を、計画した対象にする。','正常系だけでは形式崩れ・拒否・空応答等を確かめられません。図の選択は実障害ではありません。'],
 ['守る仮説','Xが落ちてもYが守られる、という仮説を先に定める。','無目的に壊しません。例の閾値を全用途の実SLOへ変換しません。'],
 ['基準を先に','正常時のSLI、成否基準、限定した範囲を注入前に揃える。','一度に複数を壊して因果を確定しません。条件の照合と実施・観測を区別します。'],
 ['弱点を見つける','fallbackの発動と指標の基準を、両方観測して仮説を点検する。','発動だけで品質の合格にしません。模式の結果は実回復力や全障害への保証ではありません。']
 ]),
 'chaos-environment-learning':rows([
 ['忠実度を上げる','評価環境からstaging、本番の限定条件へ進む。','いきなり本番で行いません。図は環境を作成したり障害を注入したりしません。'],
 ['本番の限定','評価環境で再現できない実依存だけを、小さく副作用なしで試す。','本番の作用toolを注入しません。準備した条件の照合は、実施許可や実演習の証拠ではありません。'],
 ['定常の演習','game dayで、手順どおりの縮退・復旧を人も含めて確かめる。','一度の演習を永続的な回復力にしません。図の操作は演習実施ではありません。'],
 ['成熟後の自動化','成熟した自動注入と、fallback・retry変更後の発動検査を回す。','設定だけで実発動が確認できたとは扱いません。図はCIや本番の自動注入を開始しません。'],
 ['設計と手順へ','未発動・不明な復旧の弱点を、備えと対応手順へ還流する。','弱点の報告だけで改善が完了したとは扱いません。'],
 ['回帰と環境へ','見つけた障害を、再現ケースと環境にして継続検査へ戻す。','ケース化をすべての障害の再現や永久防止にしません。図はケースを保存しません。']
 ])
})
export function dataResilienceFrame(diagram,phase){const stages=DATA_RESILIENCE_STAGES[diagram];if(!stages)throw TypeError('Unknown data resilience diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const explicit=values=>{if(values.some(v=>typeof v!=='boolean'))throw TypeError('Explicit data resilience conditions required')}
export function conversationPurpose({purpose,traceLinked,notified,minimized,retentionSet,accessControlled,trainingCondition}){if(!['operation','training'].includes(purpose))throw TypeError('Known collection purpose required');explicit([traceLinked,notified,minimized,retentionSet,accessControlled,trainingCondition]);return {reviewCandidate:traceLinked&&notified&&minimized&&retentionSet&&accessControlled&&(purpose==='operation'||trainingCondition),collected:false,legalComplianceDetermined:false}}
export function conversationAccess({raw,external,purposeKnown,roleAllowed,auditRecorded,rawExceptionApproved,destinationChecked}){explicit([raw,external,purposeKnown,roleAllowed,auditRecorded,rawExceptionApproved,destinationChecked]);return {reviewCandidate:purposeKnown&&roleAllowed&&auditRecorded&&(!raw||rawExceptionApproved)&&(!external||destinationChecked),accessGranted:false,sent:false}}
export function deletionCoverage({raw,pseudonym,embedding,cache,evaluation,memory}){const v=[raw,pseudonym,embedding,cache,evaluation,memory];explicit(v);return {unchecked:['raw','pseudonym','embedding','cache','evaluation','memory'].filter((_,i)=>!v[i]),designChecked:v.every(Boolean),deleted:false}}
export function knowledgeOwnership({ownerKnown,updateDuty,catalogueKnown,qualityMeasured}){const v=[ownerKnown,updateDuty,catalogueKnown,qualityMeasured];explicit(v);return {reviewCandidate:v.every(Boolean),dataCorrected:false}}
export function knowledgeUse({search,training,purpose}){if(!['unknown','allow','deny'].includes(search)||!['unknown','allow','deny'].includes(training)||!['search','training'].includes(purpose))throw TypeError('Separate explicit use classifications required');return {tagAllowsCandidate:(purpose==='search'?search:training)==='allow',unclassified:(purpose==='search'?search:training)==='unknown',indexed:false,trained:false,legalComplianceDetermined:false}}
export function toySourceQuality({total,expired,incorrect,duplicate}){if(!Number.isInteger(total)||total<0||total>20||[expired,incorrect,duplicate].some(n=>!Number.isInteger(n)||n<0||n>total))throw TypeError('Bounded source quality denominators required');return {expiryRate:total?expired/total:null,incorrectRate:total?incorrect/total:null,duplicateRate:total?duplicate/total:null,measured:false}}
export function chaosPlan({environment,hypothesisKnown,steadyDefined,criteriaDefined,smallScope,sideEffectsAbsent,realDependencyNeeded}){if(!['evaluation','staging','production'].includes(environment))throw TypeError('Known exercise environment required');explicit([hypothesisKnown,steadyDefined,criteriaDefined,smallScope,sideEffectsAbsent,realDependencyNeeded]);return {reviewCandidate:hypothesisKnown&&steadyDefined&&criteriaDefined&&smallScope&&sideEffectsAbsent&&(environment!=='production'||realDependencyNeeded),injected:false,authorized:false}}
export function chaosOutcome({observed,fallbackActivated,withinCriteria}){explicit([observed,fallbackActivated,withinCriteria]);return {supportedInToy:observed&&fallbackActivated&&withinCriteria,weaknessInToy:observed&&(!fallbackActivated||!withinCriteria),resilienceMeasured:false}}
