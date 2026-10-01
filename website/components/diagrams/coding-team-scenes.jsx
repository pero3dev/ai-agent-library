'use client'
import { OutcomeFigure,OutcomeCanvas,Text,Box,Wire } from './coding-outcomes-primitives'
const rollout=['現状把握','パイロット','規約策定','展開と教育','定着と改善']
export function CodingTeamRollout({children}){
  return <OutcomeFigure diagram="coding-team-rollout" title="承認の経路へ、測定と教育を伴って広げる"
    scene={s=><OutcomeCanvas diagram="coding-team-rollout" {...s}>{f=><>
      <Text y={35}>{['需要を把握し、使いやすい承認経路を用意する','測定設計を決め、少数チームで確かめる','結果を規約と利用ガイドへまとめて展開する','粒度と基準を揃え、成功と失敗から学ぶ','定着・品質・費用を見て、導入の設計へ戻る'][f.stage]}</Text>
      <g>{rollout.map((title,i)=><g key={title}><Box x={32} y={70+i*66} width={217} height={56} title={title} active={i===f.stage} tone={i===1?'amber':'violet'}/>{i===f.stage&&<Wire id={s.id} d={`M249 ${98+i*66}H306V231H340`} active phase={f.phase}/>}</g>)}</g>
      <Box x={348} y={167} width={260} height={155} title={['利用実態と要望の一覧','評価データ・ガイド','参照できるポリシー','承認経路の利用と実践知','継続測定と見直し'][f.stage]} lines={[
        ['咎めず需要を把握','承認経路へ誘導'],['測定設計を先に','全社展開の根拠へ'],['組織契約と教育','設定の実効性を確認'],['依頼とレビューを揃える','失敗も改善へ戻す'],['品質・費用・利用を測る','ライセンス数だけで測らず']][f.stage]} tone={f.stage===1?'amber':'teal'}/>
      <Text y={420} small>定着と改善から、実態把握と導入の設計へ戻る</Text>
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
export function CodingTeamReview({children}){
  return <OutcomeFigure diagram="coding-team-review" title="責任と品質基準を維持し、レビュー負荷を整える"
    scene={s=><OutcomeCanvas diagram="coding-team-review" {...s}>{f=><>
      <Text y={35}>{['AIの利用で、提出とマージの責任は消えない','構文が整っていても、要件と差分を確かめる','一回で見られる粒度と、自己レビューを揃える','表示から関与を追い、品質分析と調査につなぐ'][f.stage]}</Text>
      {f.stage===1?<>
        {['もっともらしい誤り','過剰な変更','仕様を検証するテスト'].map((t,i)=><Box key={t} x={71} y={94+i*91} width={498} height={66} title={t} tone={i===2?'violet':'amber'}/>)}
        <Text y={408} small>通常の品質基準を維持し、AIの失敗観点を加える</Text>
      </>:<>
        <Box x={32} y={100} width={260} height={145} title={['AIの出力と補助','', 'レビュー可能なPR','コミット・PRに表示'][f.stage]} lines={[
          ['AIレビューは人の補助','品質事故の免責にせず'],[],['範囲を小さく保つ','全行の意図を説明'],['Co-Authored-By等','利用したツールを申告']][f.stage]} tone="violet"/>
        <Wire id={s.id} d="M292 173H340" active phase={f.phase}/><Box x={348} y={100} width={260} height={145} title={['人が内容を確認','', '提出者の自己レビュー','事後の分析と調査'][f.stage]} lines={[
          ['コミット・マージの責任','要件と品質を確認'],[],['テストの意味も確認','人の判断を補助する'],['AI関与を追跡する','表示だけで品質保証せず']][f.stage]} tone="teal" data-ai-removes-responsibility={f.stage===0?'false':undefined}/>
        <Text y={347} small>{f.stage===2?'AIの提出量だけ増やしても、レビューの消化量は増えない':'生成の主体だけで、確認基準を軽くも重くもしない'}</Text>
      </>}
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
export function CodingTeamGovernance({children}){
  return <OutcomeFigure diagram="coding-team-governance" title="契約と技術の境界を揃え、利用と失敗を改善へ戻す"
    scene={s=><OutcomeCanvas diagram="coding-team-governance" {...s}>{f=><>
      <Text y={35}>{['チームのポリシーに、四つの項目を置く','承認したツールとプランの設定を確かめる','課金の条件と利用の実態を、両方見る','報告できる経路を、規約と教育へ戻す'][f.stage]}</Text>
      {f.stage===0?<>
        {['許可ツールと契約','禁止データと強制','ライセンス・知財','事故時の連絡先'].map((t,i)=><Box key={t} x={32+i%2*316} y={97+Math.floor(i/2)*139} width={260} height={105} title={t} tone={i===1?'amber':'violet'}/>)}
        <Text y={404} small>個別の契約・設定を確認する。図は法的適合を判定しない</Text>
      </>:<>
        <Box x={32} y={108} width={260} height={146} title={['','組織の承認経路','費用の計上条件','失敗と不審な挙動'][f.stage]} lines={[
          [],['組織契約・SSO','退職時のアクセス管理'],['シート・従量・超過','予算アラートと上限'],['秘密送信等を報告','咎めず事例を共有']][f.stage]} tone="violet"/>
        <Wire id={s.id} d="M292 181H340" active phase={f.phase}/><Box x={348} y={108} width={260} height={146} title={['','有効な設定を確認','利用の実態を観測','ポリシーと教育へ'][f.stage]} lines={[
          [],['監査・学習利用条件','配置だけで有効とせず'],['誰が・何に・量','定着と費用を改善'],['ルールとガイドを更新','報告経路を周知']][f.stage]} tone={f.stage===1?'amber':'teal'}/>
        <Text y={352} small>契約名・利用量だけで、統制や定着の成功を判定しない</Text>
      </>}
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
