import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=v=>Object.freeze(v.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const GOVERNANCE_SAFETY_STAGES=Object.freeze({
 'compliance-regulatory-map':rows([
 ['五つの問い','法域・ログ・社内統制・監査・契約へ分け、担当を結ぶ。','法的助言や適合判定ではありません。原文の全体確認09-10と部分確認09-21を区別します。'],
 ['法域と役割','地域・用途・立場を、一次情報と法務の確認へ結ぶ。','providerとdeployerを名称やAPI利用だけで決めません。PoCから本番の関門で確認します。'],
 ['EUの時間軸','適用済み・延期確定・新設禁止・既存systemの猶予を区別する。','2026-09-10時点の原文です。高リスク義務の延期を全透明性義務の延期へ変換しません。'],
 ['日本の段階','推進法・ソフトロー・個人情報保護を分け、成立・公布・施行を読む。','PPCの議論や資料公表を正式公募や最終規則にしない。将来施行版を現行へ転用しません。'],
 ['米国の主体','CaliforniaとColoradoの異なる主体・法・規則案を区別する。','原文の確認日を保持する。提案・予定・訴訟の帰結を確定義務へ変換しません。'],
 ['規格を分ける','任意frameworkと認証規格を、規制の地図に別の道具として置く。','管理体制の説明と法的適合・個々の出力の安全は別に評価します。']
 ]),
 'compliance-data-governance':rows([
 ['ログは機微data','入力・社内data・生成応答を含む記録の目的と扱いを決める。','通常logの無期限保持へ流さず、実装と制度・契約の責任を結びます。'],
 ['保持と削除の範囲','利用目的・二次利用・保持・越境・削除の波及を確認する。','削除は会話ログだけでなくmemory・評価・派生dataへ。図は実削除を行いません。'],
 ['policyとinventory','ユースケース・data分類・承認・責任者と、利用する場所を記録する。','原文の統制用inventoryの模式図です。作業用の追加台帳は作りません。'],
 ['risk別の関門','個人data・自動実行・社外影響に応じたレビューを本番前へ置く。','低riskの軽い確認を無統制へ、高riskのmodel拒否を実承認へ変換しません。'],
 ['既存の運用へ','セキュリティ・個人情報・調達の既存関門へAIの観点を統合する。','独立した委員会の名前だけで現場の統制が動くとは扱いません。']
 ]),
 'compliance-audit-vendor':rows([
 ['普段から残す','監査のための後付け書類でなく、日々の運用から記録を出す。','図は追加の作業証跡を要求しない。実運用の正本と再現可能性を点検します。'],
 ['記録の出所','inventory・review・版とtrace・承認・評価・incidentを対応づける。','構成・時点・帰属と判定を結び、書類の存在だけで実行を証明しません。'],
 ['規制を待たない','共通の運用の土台を、変更と説明責任へ活かす。','延期された一義務と、全運用の不要化は異なります。'],
 ['契約時に確認','契約・アカウント・region・endpointの範囲と確認日を揃える。','請求額が0円という事実だけでデータ条項を判定しません。'],
 ['六つの契約観点','学習既定・保持/ZDR・DPA・region・監査資料・変更通知を照合する。','ZDRは自分の構成の対象範囲と承認を確認する。図は契約解釈を確定しません。'],
 ['責任と変更','法務・調達・技術の担当を、変更通知と再確認の経路へ結ぶ。','製品に機能があることと自社契約で使えることを分け、各公式と法務へ戻します。']
 ]),
 'standards-types-stage':rows([
 ['五つの道具','要求事項・指針・任意framework・認証機関要求・ソフトローを分ける。','全てを認証対象へ変換しません。有償本文の要求は別途入手して確認します。'],
 ['認証できるもの','42001の組織の要求事項と、指針・任意の改善枠組みを分ける。','23894・42005・AI RMFやguideを取得認証へ転用しません。'],
 ['版と状態','発行済み規格・評価guide・Zero Draftの役割と観測日を保持する。','2026-09-10時点の原文です。意見期限の経過を最終化へ変換しません。'],
 ['三つの段階','規格発行・欧州委員会評価・OJ引用を、版と対象条項で読む。','発行だけで適合推定効を判断しない。図は現在の引用や法的効果を確定しません。'],
 ['組織の仕組み','42001のPDCAへAI固有の統制を加え、既存ISMSと統合する。','個々の出力の安全を保証する規格ではなく、27001の代替でもありません。'],
 ['所在へ戻す','ISOとJISの版・適用範囲・有償本文を、公式の所在で確認する。','図の概要や原文の確認日だけで、逐条の適合や取得要否を確定しません。']
 ]),
 'standards-fit-maintain':rows([
 ['意味と限界','管理の仕組みを第三者が確認する意味と、出力安全の限界を分ける。','取引要件と信頼の外部化を、個々のAIの正確性や無害性にしません。'],
 ['認定と認証','認定機関・認証機関・取得組織の別の主体と行為を追う。','日本初の認証発行と国内認証機関の初認定は、異なる行為と日付です。'],
 ['統合とgap分析','実運用・要求とのgap・AIの影響評価を、既存の仕組みへ加える。','文書は運用の写像にする。図は実審査や認証を行いません。'],
 ['維持の監査','日々のlog・review・影響評価を要求へ対応づけ、定期審査で維持する。','一度の認証から全ての変更の適合を推測しません。'],
 ['誰に求められるか','取引・入札・規制の要件と、維持体制・費用を照合する。','箔付けの名称だけで取得を選ばない。専門家と認証機関で要否を確認します。'],
 ['代替と改善','認証が不要なら、指針・自己宣言・第三者評価などの目的を照合する。','指針を内部改善に使うことを認証取得へ変換しない。維持の負担も評価します。']
 ]),
 'frontier-framework-report':rows([
 ['能力とアプリ','提供者の危険能力評価と、自社Agentの攻撃面を別の層として読む。','具体的な危険能力や攻撃手法は扱わず、提供者の枠組みを選定軸に加えます。'],
 ['観測日を保持','版・機関名・役割の変化を、採用時の公式確認へ戻す。','2026-09-10時点の原文のスナップショットです。'],
 ['四段の構造','閾値の事前定義・評価・措置・公表を能力領域ごとに結ぶ。','緩和策と展開制限は提供者の条件を読む。図は危険能力を試験しません。'],
 ['自己統治と申告','公表された枠組みの存在と、安全達成の自己評価を分ける。','規制や第三者評価は補完する経路であり、一つの主張を全安全へ変換しません。'],
 ['文書と日付','方針の発効・ページ更新・報告の公表・評価対象日を区別する。','公開日までの全modelや変更が評価済みとは推測しません。'],
 ['範囲とレビュー','採用model・対象期間・墨消し・外部reviewの範囲を確認する。','原文はAugust Risk Report全186ページの評価結果を精査していません。図も全精査を主張しません。']
 ]),
 'frontier-procurement-observation':rows([
 ['評価領域を読む','サイバー・CBRN・AI自己改善・自律性などの評価の枠組みを見る。','危険能力の方法を扱わず、領域・閾値・開発と展開の評価段階を読みます。'],
 ['第三者の役割','各国の機関と評価の焦点、連携・評価ツール・公表を分ける。','機関の評価は網羅的認証ではありません。名称と役割は都度公式で確認します。'],
 ['自社の観測と制御','AISIのAgent・ロボティクスのguideを、自社の評価計画へ結ぶ。','提供者の能力評価と、自社が観測・制御できるかの検証は別に必要です。'],
 ['四つの選定軸','現行方針・modelカードとrisk報告・更新履歴・第三者連携を照合する。','modelと評価対象の一致を確認し、存在する文書の数だけで安全にしません。'],
 ['複数を照合','自己申告を複数の記録で照合し、品質・費用・遅延などと併せて判断する。','第三者連携も補助signal。機微用途での重みを自社の要件に合わせます。'],
 ['変更を追う','版・名称・提供者・規制接続の変化を、採用前と継続運用で確認する。','一回の調達reviewで永久に完了としない。図はmodel採用・公開・実評価を行いません。']
 ])
})
export function governanceSafetyFrame(diagram,phase){const stages=GOVERNANCE_SAFETY_STAGES[diagram];if(!stages)throw TypeError('Unknown governance safety diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
export function regulatoryReview({jurisdictionChecked,useClassified,roleChecked,currentSourceChecked}){const v=[jurisdictionChecked,useClassified,roleChecked,currentSourceChecked];bools(v);return {reviewCandidate:v.every(Boolean),legalConclusion:false}}
export function legislativeStage(stage){if(!['discussion','enacted','promulgated','in-force'].includes(stage))throw TypeError('Unknown legal stage');return {stage,effectiveObserved:stage==='in-force',finalRuleInferred:false,actualApplicabilityDecided:false}}
export function deletionScope({logs,memory,evaluation,derived}){const v=[logs,memory,evaluation,derived];bools(v);return {scopeReviewCandidate:v.every(Boolean),deleted:false}}
export function contractScope({regionChecked,accountChecked,billingChecked,endpointChecked}){const v=[regionChecked,accountChecked,billingChecked,endpointChecked];bools(v);return {reviewCandidate:v.every(Boolean),zeroPriceDeterminesTerms:false,contractInterpreted:false}}
export function standardsKind(kind){if(!['requirements','guidance','framework','certifier','soft-law'].includes(kind))throw TypeError('Unknown standard kind');return {certificationCandidate:kind==='requirements',aiSafetyGuaranteed:false,certified:false}}
export function harmonizationReview({published,commissionAssessed,ojReferenced,versionMatched,clausesMatched}){const v=[published,commissionAssessed,ojReferenced,versionMatched,clausesMatched];bools(v);return {presumptionReviewCandidate:v.every(Boolean),legalEffectEstablished:false}}
export function accreditationChain({accreditorChecked,certifierScopeChecked,organizationScopeChecked}){const v=[accreditorChecked,certifierScopeChecked,organizationScopeChecked];bools(v);return {chainReviewCandidate:v.every(Boolean),certificationIssued:false,outputSafetyGuaranteed:false}}
export function managementReview({realOperations,requirementsMapped,gapsAddressed,recordsAvailable,sustainable}){const v=[realOperations,requirementsMapped,gapsAddressed,recordsAvailable,sustainable];bools(v);return {reviewCandidate:v.every(Boolean),certified:false,outputSafetyGuaranteed:false}}
export function reportCoverage({publicationDate,coverageDate,modelIncluded,versionMatched}){for(const d of [publicationDate,coverageDate]){const time=Date.parse(d);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==d)throw TypeError('Real calendar date required')}bools([modelIncluded,versionMatched]);if(coverageDate>publicationDate)throw TypeError('Coverage cannot follow publication in this illustration');return {reviewCandidate:modelIncluded&&versionMatched,publicationExtendsCoverage:false,allModelsAssessed:false,verified:false}}
export function frontierProcurement({frameworkChecked,modelCardChecked,coverageMatched,updatesChecked,thirdPartyScopeChecked}){const v=[frameworkChecked,modelCardChecked,coverageMatched,updatesChecked,thirdPartyScopeChecked];bools(v);return {reviewCandidate:v.every(Boolean),applicationSafe:false,modelSelected:false}}
