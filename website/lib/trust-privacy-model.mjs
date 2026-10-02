import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=v=>Object.freeze(v.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const TRUST_PRIVACY_STAGES=Object.freeze({
 'provenance-layers-loss':rows([
 ['二つのレイヤー','履歴の検証とAI由来の推定を、作成時と事後で分ける。','来歴の検証は内容の真実やAI生成そのものの断定ではありません。'],
 ['時点を保持','原文の確認日と提供範囲を、仕組みの説明から区別する。','ISO段階・Claudeのモデル名と取得APIは2026-09-10時点の原文の範囲です。'],
 ['二つの方式','署名付きメタデータと信号への透かしを、補完する方式として読む。','改ざん検知と剥離への強さは異なる。透かしの堅牢性は自己申告で除去不能ではありません。'],
 ['対象の経路','媒体・生成model／tool・取得API・後工程を、実際の成果物で照合する。','テキスト透かしとFiles APIのC2PAを全生成物へ一般化しない。図は実APIを呼びません。'],
 ['剥離と編集','再撮影・変換・uploadによる剥離と、再署名のない編集を区別する。','履歴が無いことは偽物の証拠ではない。対応した再署名は別に検証します。'],
 ['冗長化と限界','メタデータ・透かし・指紋から辿れる経路と、真偽の判断を分ける。','来歴の有無を単独根拠にしない。冗長化でも全経路の耐久性は保証しません。']
 ]),
 'provenance-detection-process':rows([
 ['推定の位置','検出はAIらしさの推定であり、断定の根拠にはしない。','偽陽性と偽陰性、回避との軍拡を含む補助signalです。'],
 ['二つの誤り','人の制作物をAI製とする誤りと、AI製を見逃す誤りを分ける。','本人・学生・従業員への不利益を防ぎ、ベンダー自己報告を実測へ変換しません。'],
 ['自社の生成','媒体・生成経路・取得APIに合った来歴を付け、配信後も照合する。','生成時だけで終えず、変換・保存・配信で失われた情報を確認します。'],
 ['外部の受入','来歴・別チャネル・文脈・人の判断を、受入のプロセスへ置く。','検出の合格を本人確認や重要指示の承認にしません。'],
 ['時点別の確認','標準の版・透かし対象・堅牢性・検出主張・表示義務を再確認する。','地域と用途の義務は原文の確認入口へ戻る。図は法的適合を判定しません。'],
 ['断定を避ける','透明性の付与と真偽の受入を、運用で繰り返し点検する。','一つの万能策を仮定せず、来歴と検出の限界を判断へ残します。']
 ]),
 'impersonation-callback-process':rows([
 ['声と顔の限界','本人らしい声・顔でも、重要指示の確認を省かない。','防御側の模式図です。音声・映像やなりすましを生成しません。'],
 ['四つの類型','電話・会議・偽広告・捜査や回復の偽装を、作用で読み分ける。','急ぎ・内密の圧力を確認省略の根拠にしません。'],
 ['既知の連絡先','受けた番号ではなく、事前に知る正規の連絡先へ確認する。','同じ攻撃者の連絡先へかけ直しても、独立した確認にはなりません。'],
 ['多重のプロセス','別経路・合言葉・複数人承認・上限を、重要操作の前に置く。','急かしや検出の合格で必須条件を省かない。図は実承認・送金をしません。'],
 ['検出は補助','検出の誤りと来歴の剥離を踏まえ、プロセスへsignalを追加する。','ツールが本物と言っても、既知の連絡先と承認を置き換えません。'],
 ['急ぎでも戻す','重要指示は、本人確認と業務の承認の両方へ戻す。','本人らしい内容と、本人確認・操作権限は異なる証拠です。']
 ]),
 'impersonation-report-monitor':rows([
 ['訓練する','声・顔の偽装、急かし、かけ直し確認を業務の訓練へ置く。','送金・機密を扱う担当と、確認を正当とする文化を組みます。'],
 ['相談と記録','迷わず相談する経路と、被害・未遂のincident記録を用意する。','確認すると失礼という心理で、手順を飛ばさない設計です。'],
 ['窓口も偽装される','受信linkでなく、既知の公式URLから正規窓口へ直接到達する。','2026-07-20の原文の注意喚起を保持し、新しい事件や法的結論を追加しません。'],
 ['経営層とbrand','内向きの指示と外向きの偽声明・広告を分けて監視する。','削除申請・通報にも既知の正規窓口を使う。図は実通報しません。'],
 ['運用へ戻す','公的機関の注意喚起を、訓練・確認・通報・対処へ戻す。','捜査・返金の名目でも通常の承認を省略しない。図は窓口へ移動しません。']
 ]),
 'privacy-layers-fit':rows([
 ['何を守るか','最小化・統制で満たす要件と、残る公開・共有経路を分ける。','階層は強さの順位ではありません。基本と追加保護を併せて設計する場合もあります。'],
 ['五つの技術','mask・仮名化／匿名化・DP・連合学習・秘密計算を場面で読む。','異なる対象と前提の技術を一律に強い順へ並べません。'],
 ['再識別の限界','検出漏れや文脈・別dataの突合せを、アクセス統制と併せて評価する。','匿名化したという名称だけで再識別や漏えいの不在を保証しません。'],
 ['保護する段階','集計の公開、学習時の更新、推論・処理を異なる経路として読む。','暗号方式・hardwareへの信頼・保護段階・性能と運用費用を分けます。'],
 ['連合学習の経路','生dataを中央へ集めない構成でも、更新と完成modelの漏えいを分ける。','集約時の秘匿だけで、公開後の推論も防げるとは扱いません。'],
 ['組み合わせる','誰から何を守るかに合わせ、集約・DP等の追加保護を照合する。','図は実学習・暗号・秘密計算を実行しない。名称だけで保証を採用しません。']
 ]),
 'privacy-unit-budget':rows([
 ['三つの仕様','隣接dataの保護単位、ε・δ、公開全体の予算を仕様にする。','一行の保護を一人の全記録の保護へ転用しません。'],
 ['単位を選ぶ','一行・一イベント・一人の全記録で、何が異なるdataかを読む。','個人の影響をゼロにし、全属性の推論を禁止する保証ではありません。'],
 ['確率の上限','式の乗法係数exp(ε)と加法のδを、別の寄与として読む。','固定の模式確率から右辺を計算するだけです。全出力事象の実DP証明ではありません。'],
 ['小ささと有用性','同じ単位・定義では小さいε・δほど強い制約と、有用性を併せて評価する。','ノイズを入れたという名称や一つの不等式だけで保証にしません。'],
 ['公開を合成','単純な逐次合成では、同じ対象の各公開のε・δを足して上限を管理する。','模式の固定値を示す。実製品の予算や無制限の公開を保証しません。'],
 ['別に残る経路','集約時の秘匿と完成modelからの推論を、違う保護段階として読む。','保護単位・累積公開・集団の傾向からの推論の範囲を仕様へ残します。']
 ]),
 'privacy-basic-selection':rows([
 ['場面で選ぶ','集計・学習・推論のどこに効くかから候補を絞る。','成熟度は一様でなく、導入可能でも実務の現実性は別に測ります。'],
 ['保護の範囲','公開統計・更新情報・暗号化した処理を、守る相手と結ぶ。','既存の非保護公開や完成modelからの推論を一括して消す保証ではありません。'],
 ['基本を尽くす','不要dataを減らし、必要な人と用途へ絞り、maskの漏れを評価する。','基本だけで不足する公開保護は、追加PETも最初から併せて設計します。'],
 ['要件から候補','何を・誰から・なぜ守るか、基本で足りるか、場面の候補を決める。','技術名ありきで範囲・脅威・法域の判断を飛ばしません。'],
 ['現実性を測る','有用性・性能・実装と運用の負担を測り、組み合わせを決める。','自社の要件と実測へ戻す。図は規制適合や最適技術を確定しません。']
 ])
})
export function trustPrivacyFrame(diagram,phase){const stages=TRUST_PRIVACY_STAGES[diagram];if(!stages)throw TypeError('Unknown trust privacy diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
export function provenanceClaim(status){if(!['present','absent','invalid'].includes(status))throw TypeError('Unknown provenance');return {historyClue:status==='present',truthEstablished:false,aiOriginEstablished:false,verified:false}}
export function detectorSignal(signal){if(!['ai','human','uncertain'].includes(signal))throw TypeError('Unknown signal');return {signal,identityEstablished:false,verdict:false}}
export function callbackReview({knownContact,independentChannel,identityMatched,dualApproval,withinLimit,urgent}){const v=[knownContact,independentChannel,identityMatched,dualApproval,withinLimit,urgent];bools(v);return {reviewCandidate:v.slice(0,5).every(Boolean),paymentExecuted:false}}
export function reportRoute(knownOfficial){bools([knownOfficial]);return {reviewCandidate:knownOfficial,navigated:false,reported:false}}
export function petCandidate(scene){const map={aggregation:'differential-privacy',training:'federated-learning',processing:'cryptography-or-tee'};if(!Object.hasOwn(map,scene))throw TypeError('Unknown PET scene');return {candidate:map[scene],optimal:false,privacyGuaranteed:false}}
export function privacyUnit(unit){if(!['row','event','person'].includes(unit))throw TypeError('Unknown unit');return {unit,protectsAllPersonRecords:unit==='person',allAttributeInferencePrevented:false,mechanismVerified:false}}
export function dpIllustration(epsilon,delta){if(!Number.isFinite(epsilon)||epsilon<0||epsilon>2||!Number.isFinite(delta)||delta<0||delta>0.1)throw TypeError('Bounded finite DP parameters required');const referenceProbability=0.1,rightBound=Math.exp(epsilon)*referenceProbability+delta;return {referenceProbability,factor:Math.exp(epsilon),rightBound,probabilityUpperBound:Math.min(1,rightBound),guaranteeVerified:false}}
export function sequentialBudget(releases){if(!Number.isInteger(releases)||releases<0||releases>20)throw TypeError('Bounded release count required');return {releases,epsilon:releases*0.1,delta:releases*0.000001,mechanismVerified:false}}
export function federatedLayers(mode){if(!['none','aggregation','dp','both'].includes(mode))throw TypeError('Unknown protection mode');return {rawDataCentralized:false,aggregationCandidate:['aggregation','both'].includes(mode),outputPrivacyCandidate:['dp','both'].includes(mode),privacyGuaranteed:false}}
export function privacyBasics({minimized,accessLimited,maskEvaluated,residualRequirementChecked}){const v=[minimized,accessLimited,maskEvaluated,residualRequirementChecked];bools(v);return {reviewCandidate:v.every(Boolean),reidentificationPrevented:false,compliant:false}}
