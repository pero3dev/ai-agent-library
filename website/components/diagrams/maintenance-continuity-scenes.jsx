'use client'
import { useState } from 'react'
import { ContinuityFigure,ContinuityCanvas,Text,Box,Wire,Select } from './se-continuity-primitives'
export function MaintenanceHypothesisChange({children}){
 const [evidence,setEvidence]=useState('none'),evidences={none:['原因候補だけ','まだ確定原因ではない'],logs:['関連するログ','症状と時系列を確認'],reproduce:['再現した結果','仮説の条件と再現を照合'],code:['実コードの確認','原因と対策の関係を照合']},choice=evidences[evidence]
 return <ContinuityFigure diagram="maintenance-hypothesis-change" title="原因候補から証拠へ、修正から設計と記録へ"
  controls={({stage,ready})=>stage===1?<Select label="調査で得た根拠" value={evidence} onChange={setEvidence} ready={ready}>{Object.entries(evidences).map(([id,row])=><option key={id} value={id}>{row[0]}</option>)}</Select>:null}
  scene={s=><ContinuityCanvas diagram="maintenance-hypothesis-change" {...s}>{f=><>
   <Text y={35}>{['下書きの支援と、人の確定を対応させる','原因候補を、証拠と人の判断へ戻す','動いたことと、設計へ適合することは別','記録の要約と、当時の経緯を分ける','コードと文書を、同じ改修の差分で確認'][f.stage]}</Text>
   {f.stage===0?<>
    {['障害調査 → 原因と対策の確定','改修案 → 採否と本番反映','経緯の要約 → 一次記録の裏取り','文書更新 → 実装との一致','定型自動化 → 範囲と失敗設計'].map((t,i)=><Box key={t} x={67} y={75+i*63} width={506} height={50} title={t} tone={i===4?'teal':'violet'}/>)}
    <Text y={419} small>Agent自体の運用と区別。効率向上を保証しない</Text>
   </>:f.stage===1?<>
    <Box x={67} y={81} width={506} height={123} title={choice[0]} lines={[choice[1],'ログ・再現・コードの証拠へ照合']} tone={evidence==='none'?'amber':'violet'}/>
    <Wire id={s.id} d="M320 204V265" active phase={f.phase}/><Box x={67} y={275} width={506} height={117} title="人が原因と恒久対策を確定" lines={['もっともらしい説明だけで確定しない','本番ログの機微情報と経路も確認']} tone="teal" data-cause-auto-confirmed="false"/>
   </>:f.stage===2?<>
    <Box x={32} y={82} width={260} height={171} title="生成した修正案" lines={['影響の当たり付け','動くことを確認','設計思想・既存の慣習']} tone="violet"/>
    <Wire id={s.id} d="M292 167H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={171} title="人の採否と反映" lines={['設計への適合をreview','リリースの可否','切り戻し計画を用意']} tone="teal"/>
    <Text y={356} small>修正の動作確認だけで、本番反映を許可しない</Text>
   </>:f.stage===3?<>
    <Box x={32} y={82} width={260} height={170} title="散在する記録" lines={['commit・ticket・文書','背景の要約は仮説','記録にない事情が残る']} tone="violet"/>
    <Wire id={s.id} d="M292 167H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={170} title="重要な経緯の裏取り" lines={['当時の関係者','一次記録へ戻る','改修の根拠を確認']} tone="teal"/>
    <Text y={356} small>危険箇所の指摘がなくても、影響調査とtestを行う</Text>
   </>:<>
    <Box x={32} y={82} width={260} height={161} title="コードの改修" lines={['実装と実行結果','変更した設計・操作']} tone="violet"/>
    <Box x={348} y={82} width={260} height={161} title="文書の更新案" lines={['設計書・手順書','同じ差分でreview']} tone="violet"/>
    <Wire id={s.id} d="M162 243V270H320V290M478 243V270H320" active phase={f.phase}/><Box x={67} y={300} width={506} height={99} title="実装との一致を人が確かめる" lines={['正本のテキスト化は合意と段階に従う']} tone="teal"/>
   </>}
  </>}</ContinuityCanvas>}>{children}</ContinuityFigure>
}
export function MaintenanceProductionBoundary({children}){
 const [masked,setMasked]=useState('yes'),[route,setRoute]=useState('unknown'),ready=masked==='yes'&&route==='allowed'
 return <ContinuityFigure diagram="maintenance-production-boundary" title="調査と自動化を、本番の情報と操作から分ける"
  controls={({stage,ready})=>stage===2?<><Select label="本番ログの加工" value={masked} onChange={setMasked} ready={ready}><option value="yes">不要な機微情報を加工した</option><option value="no">未加工・未確認</option></Select><Select label="契約と送信経路" value={route} onChange={setRoute} ready={ready}><option value="unknown">未確認</option><option value="denied">許可されない</option><option value="allowed">許可範囲へ照合した</option></Select></>:null}
  scene={s=><ContinuityCanvas diagram="maintenance-production-boundary" {...s}>{f=><>
   <Text y={35}>{['可逆で検証しやすい仕事から自動化する','静かに壊れないための三つの設計','マスクと許可経路は、別の確認','調査環境から、本番の操作を分離する','契約と運用で、判断者と範囲を確認'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={32} y={82} width={260} height={171} title="自動化の候補" lines={['定型的なログ集計','設定変更の下書き','軽い修正とreview']} tone="violet"/>
    <Box x={348} y={82} width={260} height={171} title="人の承認を残す" lines={['本番の不可逆な操作','検証が難しい影響','自動化の範囲を絞る']} tone="amber"/>
    <Text y={356} small>可逆性・影響・レビュー負荷を、実際に測って判断</Text>
   </>:f.stage===1?<>
    {['検知：失敗を見つける','切り戻し：影響を復旧する','通知：対応する人へ伝える'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone={i===0?'amber':'violet'}/>)}
    <Text y={418} small>失敗時の扱いを、稼働システムへ入れる前に設計</Text>
   </>:f.stage===2?<>
    <Box x={32} y={82} width={260} height={157} title="情報の加工" lines={[masked==='yes'?'必要な範囲へ加工済み':'機微情報が未確認','マスキング・匿名化']} tone={masked==='yes'?'teal':'amber'}/>
    <Box x={348} y={82} width={260} height={157} title="契約と経路" lines={[route==='allowed'?'許可範囲へ照合済み':route==='denied'?'許可されない経路':'まだ未確認の経路','対象と提供形態を確認']} tone={route==='allowed'?'teal':'amber'}/>
    <Box x={67} y={300} width={506} height={97} title={ready?'情報と経路を確認した範囲':'送信の準備は未完了'} lines={['加工だけで契約外の送信を許可しない']} tone={ready?'teal':'amber'} data-information-ready={String(ready)}/>
   </>:f.stage===3?<>
    <Box x={32} y={82} width={260} height={171} title="Agentの調査" lines={['読み取りと非本番の複製','仮説と修正案を作る','本番操作権限を持たせない']} tone="violet" data-agent-production-access="false"/>
    <Box x={348} y={82} width={260} height={171} title="本番の反映" lines={['人が結果を確認','人が承認して実行','切り戻しを用意']} tone="amber"/>
    <Text y={356} small>調査の完了から、リリース許可へ自動で進めない</Text>
   </>:<>
    {['原因・設計適合：証拠を確認','反映・復旧：人の承認と実行','情報・操作：契約と経路へ照合'].map((t,i)=><Box key={t} x={67} y={78+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>)}
    <Text y={418} small>担当と測定を確認し、法的責任を図で確定しない</Text>
   </>}
  </>}</ContinuityCanvas>}>{children}</ContinuityFigure>
}
