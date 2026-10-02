'use client'
import {useId,useState} from 'react'
import {DataCanvas,DataFigure,DataPair,DataThree,Text,Box,Select,Tokens} from './data-resilience-primitives'
import {knowledgeOwnership,knowledgeUse,toySourceQuality} from '../../lib/data-resilience-model.mjs'
export function GovernanceOwnershipCatalogue({children}){
 const id=useId(),[missing,setMissing]=useState('quality')
 const result=knowledgeOwnership({ownerKnown:missing!=='owner',updateDuty:missing!=='duty',catalogueKnown:missing!=='catalogue',qualityMeasured:missing!=='quality'})
 return <DataFigure diagram="governance-ownership-catalogue" title="回答から原本と責任者へ戻る、知識源のカタログ" scene={({phase})=><DataCanvas diagram="governance-ownership-catalogue" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['組織の知識源と、隣接する正本を分担する','生成の出力から、知識源の品質へ戻る','責任者と更新義務・遡る情報を揃える','五つの項目で、AIから原本へ戻れるようにする','土台の責任と計測を、問題の差戻しへつなぐ'][stage]}</Text>
 {stage===0&&<DataThree columns={[["知識源の管理","責任・品質","用途の分類"],["会話と規制","別の正本","契約を点検"],["取り込み技術","indexと更新","原本へ戻す"]]}/>}
 {stage===1&&<><Tokens labels={['古い','誤り','担当不明','重複']} stage={1} y={90}/><DataPair left={['AIの回答の問題','品質の変化を点検','原本の候補へ遡る','原因は別に調べる']} right={['原本の整備へ','promptだけで直せない','版・鮮度・重複を点検','責任者へ戻す']} id={id} phase={phase} y={184}/></>}
 {stage===2&&<DataThree columns={[["責任者","更新と廃止","誰が担うか"],["更新義務","頻度と責任","名前だけでない"],["遡るメタ","回答から原本","所在とowner"]]}/>}
 {stage===3&&<><Tokens labels={['所在','鮮度','権限','owner','用途']} stage={1} y={90}/><Box x={60} y={185} width={520} height={174} title="更新・確認・見直しの時点を結ぶ" lines={['原本の所在とAIのインデックス','最終更新・更新頻度・次の確認','権限と検索／学習の用途を分ける']} tone="teal"/></>}
 {stage===4&&<DataPair left={['土台を揃える','責任と更新義務','カタログと品質計測','問題を原本へ戻す']} right={[result.reviewCandidate?'管理設計の検討候補':'不足する土台へ戻る','AI導入で自動整備しない','担当名は更新済みでない','図は原本を修正しない']} id={id} phase={phase}/>}
 <Text x={320} y={409} center small>図は原因・担当を確定せず、連絡や原本の更新を実行しない。</Text>
 </>}</DataCanvas>} controls={({stage,ready})=>stage===4?<Select label="知識源管理で不足する土台" value={missing} onChange={setMissing} ready={ready}>{Object.entries({owner:'責任者',duty:'更新義務',catalogue:'カタログ',quality:'定期品質計測',none:'必要条件を照合'}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>:null}>{children}</DataFigure>
}
const useNames={unknown:'未分類',allow:'可',deny:'不可'},rate=n=>n===null?'母数なし':`${Math.round(n*100)}%`
export function GovernanceQualityPermission({children}){
 const id=useId(),[total,setTotal]=useState('10'),[search,setSearch]=useState('allow'),[training,setTraining]=useState('unknown'),[purpose,setPurpose]=useState('training')
 const quality=toySourceQuality({total:Number(total),expired:Number(total)?2:0,incorrect:Number(total)?1:0,duplicate:Number(total)?2:0}),use=knowledgeUse({search,training,purpose})
 return <DataFigure diagram="governance-quality-permission" title="測る品質と、検索・学習を別に扱う利用条件" scene={({phase})=><DataCanvas diagram="governance-quality-permission" phase={phase} id={id}>{({stage})=><>
 <Text x={320} y={38} center>{['三つの品質は、母数と定期計測を持つ','検索が可でも、学習が可とは限らない','未分類は、AIへ載せないことを既定にする','知識源の問題を責任者へ差し戻す','既存のカタログと品質管理へ条件を足す','契約と技術を、既存の責任で分担する'][stage]}</Text>
 {stage===0&&<><DataThree columns={[["鮮度",rate(quality.expiryRate),"期限超過の割合"],["正確性",rate(quality.incorrectRate),"誤りの割合"],["一意性",rate(quality.duplicateRate),"重複の割合"]]}/><Text x={320} y={333} center>{`模式の母数: ${total}件。三つの分類は重なり得る。`}</Text><Text x={320} y={366} center small>基準を割る原本を責任者へ戻す。実測値ではない。</Text></>}
 {(stage===1||stage===2)&&<><DataPair left={['独立した用途タグ',`検索: ${useNames[search]}`,`学習: ${useNames[training]}`,'合成やFTの利用は別']} right={[use.unclassified?'未分類なので保留':use.tagAllowsCandidate?'タグ上は検討候補':'その用途には載せない',purpose==='training'?'確認する用途: 学習':'確認する用途: 検索','権利・契約は別に点検','図は取り込まない']} id={id} phase={phase} arrow={false}/><Text x={320} y={348} center>可のタグを、実取り込みや法的適合にしない</Text></>}
 {stage===3&&<DataPair left={['改善の入口','利用者の反応','知識源の問題を分類','原本の責任者へ戻す']} right={['整備の土台','責任者とカタログ','品質を定期に計測','丸投げで終わらない']} id={id} phase={phase}/>}
 {stage===4&&<DataPair left={['既存の管理','組織のデータカタログ','更新と品質の運用','同じ正本を使う']} right={['AI固有の条件','インデックスの所在','検索と学習の用途','二重組織を自動作成しない']} id={id} phase={phase}/>}
 {stage===5&&<DataThree columns={[["規制・法務","権利と契約","利用条件"],["原本の組織","責任・鮮度","既存の運用"],["AIの技術","取り込み・更新","利用と結ぶ"]]}/>}
 <Text x={320} y={409} center small>模式の比率・タグは、実測・取り込み・権利の判定ではない。</Text>
 </>}</DataCanvas>} controls={({stage,ready})=>stage===0?<Select label="品質比率の模式母数" value={total} onChange={setTotal} ready={ready}><option value="0">0件: 母数なし</option><option value="10">10件: 2・1・2件の分類</option><option value="20">20件: 2・1・2件の分類</option></Select>:stage===1||stage===2?<><Select label="検索の利用分類" value={search} onChange={setSearch} ready={ready}>{Object.entries(useNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select><Select label="学習の利用分類" value={training} onChange={setTraining} ready={ready}>{Object.entries(useNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select><Select label="確認する模式用途" value={purpose} onChange={setPurpose} ready={ready}><option value="search">検索</option><option value="training">学習</option></Select></>:null}>{children}</DataFigure>
}
