import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SE_CONTINUITY_STAGES=Object.freeze({
 'legacy-observation-draft':rows([
  ['五つの役割','構造・仕様・影響・削除候補・変換を、仮説と判断へ分ける。','原文の5役割です。現行挙動の読解が基準で、生成した説明はドラフト。望ましい要求かどうかの判断は別です。'],
  ['構造と背景','入口・依存・分岐をたどり、背景は履歴で確かめる。','構造要約と背景の説明には見落としや隠れた副作用があり得ます。重要な理解は実コード・履歴・関係者へ戻します。'],
  ['仕様の復元','生成した日本語仕様を、現行の入出力へ突き合わせる。','もっともらしい説明が例外を落とすことがあります。食い違いは実挙動で確かめ、バグか仕様かは別の判断へ残します。'],
  ['影響の調査','呼出しとデータ、動的経路とコード外連携を確かめる。','候補は当たり付けです。見落としも過剰検出もあるため、指摘なしを影響なしの保証にしません。'],
  ['削除の候補','低頻度の実行と、重複に隠れた固有分岐を確かめる。','ログ・呼出し元・運用スケジュールを確認してから削除可否を判断します。重複の指摘だけで統合しません。']
 ]),
 'legacy-measure-migrate':rows([
  ['対応を測る','対象の言語・方言・環境を、小さな実コードで試す。','公式対応と読解・変換の実測を合わせます。未確認の対応度・成功率を補わず、本文のTODOを保ちます。'],
  ['段階で移す','全面置換より、module単位の変換と検証を重ねる。','変換・テスト・文書を下書きとして使い、移行の順と可否は業務リスク・投資判断で人が決めます。'],
  ['新旧を比較','同じ条件の現行入出力を、移行後の結果へ照合する。','生成した変換は下書きです。比較・実行・検証範囲を確認し、未実行の説明を等価性の証拠にしません。'],
  ['要求と分ける','現行の再現と、望ましい仕様への変更を分ける。','現行挙動を保つ比較で、バグの是認や要求適合を保証しません。関係者の判断と変更の検証を別に行います。'],
  ['移行を判断','現状維持・塩漬け・段階移行・再構築を人が決める。','モデルの案だけで投資や移行可否を確定せず、小さな試行とレビュー負荷を材料へ戻します。']
 ]),
 'maintenance-hypothesis-change':rows([
  ['役割の分担','調査・改修・経緯・文書・自動化の下書きと確定を分ける。','保守対象システムを扱う原文の役割分担案です。Agent自体の運用とは別で、効率向上を保証しません。'],
  ['原因の証拠','候補と再現の仮説を、ログ・実行・コードで確かめる。','原因の確定と恒久対策は証拠に基づき人が判断します。本番ログの機微情報と許可経路も先に確認します。'],
  ['修正と反映','動く修正案を、設計に沿うかと本番反映へ分ける。','影響・慣習・仕様への適合を人がレビューし、採否・リリース・切り戻しを判断します。'],
  ['経緯を復元','履歴とticketの要約を、一次記録・関係者で裏取りする。','記録に残らない事情を保留し、危険箇所の指摘の有無にかかわらず影響調査とテストを行います。'],
  ['文書も更新','改修と設計書・手順書のドラフトを同じ差分で確認する。','生成した文書が実装と一致するか、人が確認します。正本のテキスト化は原文の段階論と合意に従います。']
 ]),
 'maintenance-production-boundary':rows([
  ['可逆な範囲','反復する調査・下書きから、検証しやすい範囲を選ぶ。','ログ集計・設定案・軽い修正を候補とし、影響とレビュー負荷を測ります。本番不可逆操作は人の承認へ残します。'],
  ['失敗の設計','検知・切り戻し・通知を、自動化より先に用意する。','静かに壊れる自動化を避けるための原文の設計です。この図は本番操作や通知を行いません。'],
  ['渡す情報','本番ログを必要な範囲へ加工し、許可経路を確かめる。','マスキングだけで契約外の送信を許可しません。何をどこへ渡せるかを契約・提供形態へ照合します。'],
  ['環境の分離','調査は読取・非本番の複製、本番反映は人が承認する。','Agentへ本番操作権限を与えない原文の基本を示します。調査の完了をリリース許可へ自動昇格しません。'],
  ['責任と確認','原因・適合・反映・復旧の判断を運用の担当へ戻す。','契約と経路で情報・操作の範囲を引き、検証と測定を確認します。法的責任を図で確定しません。']
 ]),
 'enterprise-constraints-topology':rows([
  ['制約から始める','制約の棚卸しから提供形態と可否判断へ進む。','技術防御と規制の入口は関連正本へ委ね、ここは渡してよいかと、どの形態で使うかの判断です。'],
  ['五つの制約','データ・承認・網・監査・責任分界を案件で確認する。','高機能でも契約・承認・ネットワークで許されなければ使えません。多重請負で判断者の抜けを残さないようにします。'],
  ['三つの形態','SaaS、顧客クラウド、自社ホストを境界で比較する。','2026-07時点の一般類型です。契約・tenant・region・推論先を区別し、個別製品の現況は採用時に再確認します。'],
  ['閉域の通信','外部APIへ到達しない条件と、保持条件を分ける。','ZDRは通信を通す仕組みではありません。ローカル推論とAgent・tool・管理の経路を確認し、全経路が環境内という構成条件を保ちます。'],
  ['運用する統制','モデルの配置とは別に、監査・認証・強制を設計する。','OSS構成で必要なログ基盤・端末管理等を確認します。商用提供の変化や未確認の保証を補いません。']
 ]),
 'enterprise-contract-route':rows([
  ['契約を確認','外部送信・保存・AI利用の契約と規程を先に確認する。','不可・未承認・未確認は利用可能へ進めません。この選択は架空の案件状態で、契約や法的適合を判定しません。'],
  ['対象を分類','公開コード・顧客コード・個人情報や業務データを分ける。','不要な機微情報はマスク・抽象化します。加工した情報でも、許可と経路の確認を飛ばしません。'],
  ['経路を照合','形態・送信先・保持・学習・regionを契約へ照合する。','経路から先に選ばず、分類と契約に合う形態を確認します。未知の保持や学習条件を許可扱いにしません。'],
  ['承認の資料','フロー・残留・学習利用を具体的に埋めて判断者へ示す。','何がどこへ流れるか、どれだけ残るか、学習に使われるかを示します。現場の口頭了解だけで承認を完了しません。'],
  ['採用時に再確認','提供状況・適格条件・地域・認証範囲・モデル資源を確認する。','定点観測の原文の対象を保ちます。古い代表例を現在の契約仕様へ転用せず、最新の一次情報と対象構成へ戻します。']
 ])
})
export function seContinuityFrame(id,phase){
 if(!Object.hasOwn(SE_CONTINUITY_STAGES,id))throw new RangeError('Unknown continuity diagram')
 const stages=SE_CONTINUITY_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
 return {...stages[stage],stage,phase:bounded}
}
export function legacyEquivalence({executed,sameConditions,scopeReviewed}){
 if([executed,sameConditions,scopeReviewed].some(v=>typeof v!=='boolean'))throw new TypeError('Explicit execution conditions and scope required')
 return {comparisonEvidenceReady:executed&&sameConditions&&scopeReviewed,desiredRequirementsVerified:false,allBehaviorGuaranteed:false}
}
export function enterpriseRoute({contract,classified,routeVerified}){
 if(!['allowed','denied','unknown'].includes(contract)||[classified,routeVerified].some(v=>typeof v!=='boolean'))throw new TypeError('Explicit contract classification and route state required')
 return {candidateReady:contract==='allowed'&&classified&&routeVerified,legalComplianceDetermined:false,unknownPermitted:false}
}
