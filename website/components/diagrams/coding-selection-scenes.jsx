'use client'
import { useState } from 'react'
import { CodingFigure,CodingCanvas,Text,Box,Wire,Select } from './coding-decisions-primitives'
export function CodingSelectionConstraints({children}){
  const [use,setUse]=useState('pair')
  const uses={pair:['対話する設計・実装','ローカルのCLI・IDE','往復と文脈共有'],batch:['独立した定型大量処理','クラウド実行','隔離と並列処理'],issue:['Issueから修正PRへ','Issue・PR連携','開発イベントを入口に'],review:['PRレビューの補助','レビュー連携','人のレビューの前段'],private:['機密性を重視','経路を選べる構成','BYOKだけで保証しない'],ide:['既存IDEを維持','IDE拡張・ターミナル','専用IDEの移行を避ける']}
  return <CodingFigure diagram="coding-selection-constraints" title="変えられない制約から、用途に合う形態へ"
    controls={({stage,ready})=>stage===4?<Select label="形態を考える用途" value={use} onChange={setUse} ready={ready}>{Object.entries(uses).map(([v,row])=><option key={v} value={v}>{row[0]}</option>)}</Select>:null}
    scene={s=><CodingCanvas diagram="coding-selection-constraints" {...s}>{f=><>
      <Text y={35}>{['機能比較の前に、落とせない条件を揃える','データの経路と、実行の権限を確認する','開発フローと、社内への接続を確認する','管理・費用・モデル選択の条件を確認する','用途から考えても、制約の確認は必要'][f.stage]}</Text>
      {f.stage===0?<>
        {['データ取扱い','実行場所','権限モデル','開発フロー','拡張性','チーム管理','コスト構造','モデル選択'].map((t,i)=><Box key={t} x={32+i%2*292} y={68+Math.floor(i/2)*80} width={284} height={57} title={t} tone={i<3?'amber':'violet'}/>)}
        <Text y={408} small>予定プランの一次情報を読み、制約で候補を絞る</Text>
      </>:f.stage===1?<>
        <Box x={32} y={82} width={260} height={155} title="データ取扱い" lines={['送信先・保持期間','学習利用・設定・規制']} tone="amber"/><Box x={348} y={82} width={260} height={155} title="実行場所と権限" lines={['手元・クラウド・CI','承認粒度・隔離・監査']} tone="violet"/>
        <Box x={68} y={295} width={504} height={101} title="BYOKは、キーを持ち込む選択" lines={['送信経路や、保持・組織統制も別途確認']} tone="amber"/>
      </>:f.stage===2?<>
        <Box x={32} y={97} width={260} height={148} title="開発フロー適合" lines={['既存IDE・SCM','規模と移行コスト']} tone="violet"/><Box x={348} y={97} width={260} height={148} title="拡張機構" lines={['MCP・フック・SDK','社内ツールへの接続']} />
        <Text y={335} small>{['対応の○印だけで、制御の深さは分からない','方式と承認・運用の範囲を確認する']}</Text>
      </>:f.stage===3?<>
        {['組織の統制','費用の構造','モデルの選択'].map((t,i)=><Box key={t} x={32} y={75+i*100} width={228} height={79} title={t} tone={i===1?'amber':'violet'}/>)}
        {['SSO・強制・監査・管理','含有枠・超過時の扱い','固定か、持込み可能か'].map((t,i)=><g key={t}><Wire id={s.id} d={`M260 ${114+i*100}H304`} active phase={f.phase}/><Box x={312} y={75+i*100} width={296} height={79} title={t}/></g>)}
        <Text y={417} small>持込みの自由度と、運用責任を一緒に確認する</Text>
      </>:<>
        <Box x={32} y={104} width={260} height={147} title={uses[use][0]} lines={[uses[use][2]]} tone="violet"/><Wire id={s.id} d="M292 177H340" active phase={f.phase}/><Box x={348} y={104} width={260} height={147} title={uses[use][1]} lines={['元記事の形態の対応','データと権限を再確認']} tone="teal"/>
        <Text y={344} small>これは形態の検討経路で、特定製品の推薦順位ではない</Text>
      </>}
    </>}</CodingCanvas>}>{children}</CodingFigure>
}
export function CodingSelectionTrial({children}){
  const [conditions,setConditions]=useState('planned')
  return <CodingFigure diagram="coding-selection-trial" title="併用の整合を保ち、同じ条件で試して見直す"
    controls={({stage,ready})=>stage===2?<Select label="試用するプランの条件" value={conditions} onChange={setConditions} ready={ready}><option value="planned">導入予定の組織プラン相当</option><option value="personal">無料・個人版だけで比較</option></Select>:null}
    scene={s=><CodingCanvas diagram="coding-selection-trial" {...s}>{f=><>
      <Text y={35}>{['役割が違えば、併用も自然な構成になる','どの入口でも、同じ組織基準で運用する','制約で足切りし、予定条件の実タスクで試す','決定したときに、再評価の引金も残す'][f.stage]}</Text>
      {f.stage===0?<>
        {['IDEの補完','対話型Agent','PRレビュー'].map((t,i)=><Box key={t} x={32+i*197} y={133} width={182} height={110} title={t} tone={i===1?'violet':'teal'}/>)}
        <Text y={337} small>役割の組合せとして設計し、一製品への統一を先に置かない</Text>
      </>:f.stage===1?<>
        {['ルール正本を一つに','シート・従量の重複確認','共通の取扱い・権限基準'].map((t,i)=><Box key={t} x={69} y={83+i*97} width={502} height={71} title={t} tone={i===2?'amber':'violet'}/>)}
        <Text y={401} small>最も緩い併用先から、組織の基準を崩さない</Text>
      </>:f.stage===2?<>
        <Box x={32} y={81} width={260} height={143} title="制約で2〜3候補へ" lines={['同じ実タスク・依頼','同等の設定で比較']} tone="violet"/><Wire id={s.id} d="M292 152H340" active phase={f.phase}/><Box x={348} y={81} width={260} height={143} title={conditions==='planned'?'予定の条件で試用':'予定との条件差を確認'} lines={conditions==='planned'?['成功・介入・時間・費用']:['データ・管理・上限の差','そのまま採否を決めない']} tone={conditions==='planned'?'teal':'amber'}/>
        <Text y={326} small>{['無料・個人版と、組織条件の違いを確認する','図は、試用の点数や候補の順位を作らない']}</Text>
      </>:<>
        {['主要な更新','料金の変更','社内成績の変化'].map((t,i)=><Box key={t} x={32+i*197} y={91} width={182} height={102} title={t} tone="violet"/>)}
        <Wire id={s.id} d="M320 193V271" active phase={f.phase}/><Box x={112} y={279} width={416} height={98} title="再評価と、乗換えの条件" lines={['選定を固定せず、基準に戻って比較']} tone="teal"/>
      </>}
    </>}</CodingCanvas>}>{children}</CodingFigure>
}
