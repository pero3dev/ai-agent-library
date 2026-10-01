import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const CLIENT_ADOPTION_STAGES=Object.freeze({
 'client-approval-contract':rows([
  ['商流の合意','誰に、何を、どの順で示すかを設計する。','顧客・商流の合意と、自社チームの展開を分けます。技術的な経路は関連正本へ照合します。'],
  ['判断者の棚卸し','顧客・元請・自社・監査の関心へ資料を合わせる。','案件ごとに必要な判断者を棚卸しします。現場の口頭了解だけで、他部門の必要承認を完了しません。'],
  ['契約の論点','品質・IP・データ・規制の入口を法務へつなぐ。','責任分担は契約と適用法へ照合します。AI利用だけで品質確認を省略せず、契約文言や法的適合を図で生成しません。'],
  ['見積りの前提','工数削減と、単価・品質責任を分けて議論する。','値下げ・付加価値・短納期を自動で結論にしません。レビューと検証を含む見積り、価格戦略は案件と経営の判断です。'],
  ['合意する範囲','データ、品質、責任分界と承認範囲を合わせる。','関心に合う資料と、必要な確認先へ戻します。論点の整理だけで利用許可や免責を確定しません。']
 ]),
 'client-staged-adoption':rows([
  ['社内で測る','顧客に依存しない社内題材で、効果とリスクを測る。','提供形態とデータ経路を社内で確立します。最初から顧客の本番案件へ全面適用しません。'],
  ['題材を確認','契約・機密区分・内容で、顧客非依存を確認する。','自社が書いたコードでも顧客契約の対象になり得ます。必要な社内・契約上の承認を先に得ます。'],
  ['合意して適用','データ・品質・責任分界を合意し、確認した範囲へ広げる。','顧客資産への適用は必要承認を得てからです。題材分類・経路・承認・測定の未知を飛ばしません。'],
  ['実績で広げる','各段階の実測とリスクを、次の範囲の合意へ戻す。','小さな承認範囲から実績を積みます。小さな成功だけで全顧客資産への全面適用を許可しません。']
 ]),
 'client-measured-evidence':rows([
  ['対象の工数','対象作業の工数を、同じ条件と範囲で測る。','体感の速さを実測として出さず、対象・条件・変更の範囲を示します。架空の短縮率を生成しません。'],
  ['品質の変化','手戻り・欠陥と、残る品質確認を合わせて示す。','実装が速くてもレビュー・検証の必要性は残ります。元記事の品質責任と見積りの前提へ戻します。'],
  ['レビュー負荷','確認する人の負荷も含め、効果を比較する。','実装の時間だけで全体の効率化や値下げを確定しません。各段階の実績を次の合意の材料にします。'],
  ['リスクも示す','データと経路、品質担保、失敗対応を効果と並べる。','小さな実績とリスクの両方を判断者へ示します。法務の判断、必要な承認、適用範囲を図の操作で代替しません。']
 ])
})
export function clientAdoptionFrame(id,phase){
 if(!Object.hasOwn(CLIENT_ADOPTION_STAGES,id))throw new RangeError('Unknown client adoption diagram')
 const stages=CLIENT_ADOPTION_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
 return {...stages[stage],stage,phase:bounded}
}
export function clientTrialGate({contractChecked,classified,approvalsChecked,evidenceMeasured}){
 if([contractChecked,classified,approvalsChecked,evidenceMeasured].some(v=>typeof v!=='boolean'))throw new TypeError('Explicit contract subject approvals and measurement required')
 return {candidateScopeReady:contractChecked&&classified&&approvalsChecked&&evidenceMeasured,legalComplianceDetermined:false,selfAuthorshipExemptsContract:false,unlimitedRolloutApproved:false}
}
