'use client'
import {useState} from 'react'
import {TechniqueFigure,TechniqueCanvas,Text,Box,Wire,Select} from './prompt-techniques-assets-primitives'
import {promptReleaseGate} from '../../lib/prompt-techniques-assets-model.mjs'
export function PromptManagementAssets({children}){
 const [shared,setShared]=useState('shared'),[reference,setReference]=useState('alias')
 return <TechniqueFigure diagram="prompt-management-assets" title="共有部品の影響と、実行した版・モデルを追える形にする"
  controls={({stage,ready})=>stage===2?<Select label="ポリシーの管理方式" value={shared} onChange={setShared} ready={ready}><option value="shared">共有部品</option><option value="copy">複製して管理</option></Select>:stage===4?<Select label="promptの参照方式" value={reference} onChange={setReference} ready={ready}><option value="version">固定したprompt版</option><option value="alias">参照先が変わる別名</option></Select>:null}
  scene={s=><TechniqueCanvas diagram="prompt-management-assets" {...s}>{f=><>
   <Text y={35}>{['コードと同じ規律で、違う性質を管理','本体・例・metaと、共有・動的入力を分ける','直し漏れと、利用元の検査範囲を見る','開発と本番の参照を、明示的に区分','別名だけでなく、実際に解決した組合せを記録'][f.stage]}</Text>
   {f.stage===0?<>
    {['非局所：差分外のタスクも変わる','確率的：一例だけでは判断できない','多様な書き手：業務の提案を受ける'].map((t,i)=><Box key={t} x={67} y={77+i*104} width={506} height={77} title={t} tone="violet"/>)}
   </>:f.stage===1?<>
    <Box x={67} y={75} width={506} height={76} title="prompts / triage" tone="violet"/>
    {['system.md','examples.md','meta.yaml'].map((t,i)=><Box key={t} x={32+i*204} y={197} width={168} height={83} title={t} tone="teal"/>)}
    <Box x={67} y={329} width={506} height={77} title="shared / safety-policy.md と動的入力" tone="violet"/>
   </>:f.stage===2?<>
    <Box x={67} y={81} width={506} height={121} title={shared==='shared'?'共有部品の変更':'同じポリシーの複製'} lines={[shared==='shared'?'変更を全利用元へ追う':'共通のタグ・見出しで影響を追う']} tone="violet"/>
    <Wire id={s.id} d="M320 202V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title={shared==='shared'?'利用する全promptを回帰検査':'修正漏れと各版の一致を確認'} lines={['共有と複製を、影響範囲で判断']} tone="teal"/>
   </>:f.stage===3?<>
    {['開発で候補を調整','stagingで確認','明示的な昇格で本番参照'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
   </>:<>
    <Box x={67} y={75} width={506} height={76} title={reference==='alias'?'参照先が動く別名':'固定したprompt版'} tone="violet"/>
    <Wire id={s.id} d="M320 151V197" active phase={f.phase}/>
    {['解決した版','model・設定','共有部品版'].map((t,i)=><Box key={t} x={32+i*204} y={209} width={168} height={115} title={t} tone="teal"/>)}
    <Text y={385} small>同じprompt版でも設定は変わり得る。実体をtraceへ</Text>
   </>}
  </>}</TechniqueCanvas>}>{children}</TechniqueFigure>
}
export function PromptManagementChange({children}){
 const [judgment,setJudgment]=useState('unused'),[review,setReview]=useState('yes'),[regression,setRegression]=useState('yes'),[promotion,setPromotion]=useState('no'),[scope,setScope]=useState('yes'),state=promptReleaseGate({reviewed:review==='yes',regressionPassed:regression==='yes',explicitPromotion:promotion==='yes',sharedScopeCovered:scope==='yes',unusedJudgment:judgment==='unused'})
 return <TechniqueFigure diagram="prompt-management-change" title="提案を単一の評価ゲートへ通し、明示的に段階適用する"
  controls={({stage,ready})=>stage===1?<Select label="採用判断用ケースの状態" value={judgment} onChange={setJudgment} ready={ready}><option value="unused">調整に未使用</option><option value="used">失敗を読んで修正した</option></Select>:stage===2?<>{[['変更レビュー',review,setReview],['回帰テスト',regression,setRegression],['明示的な昇格',promotion,setPromotion],['共有部品の検査範囲',scope,setScope]].map(([label,value,setValue])=><Select key={label} label={label} value={value} onChange={setValue} ready={ready}><option value="no">未確認・未実施</option><option value="yes">確認した</option></Select>)}</>:null}
  scene={s=><TechniqueCanvas diagram="prompt-management-change" {...s}>{f=><>
   <Text y={35}>{['提案は開き、反映は同じフローで進める','開発と未使用の判定を分ける','回帰と範囲を通して、明示的に昇格する','offlineと本番の品質signalを照合する','結論後のvariantまで整理する'][f.stage]}</Text>
   {f.stage===0?<>
    {['意図と期待効果を示す提案','副作用・共有の影響をレビュー','回帰テストへ：緊急時も通す'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
   </>:f.stage===1?<>
    <Box x={32} y={81} width={260} height={174} title="開発用ケース" lines={['候補を調整する','読んだ失敗はここへ','修正の材料として使う']} tone="violet"/>
    <Box x={348} y={81} width={260} height={174} title="採用判断用" lines={[judgment==='unused'?'調整に未使用':'既に修正へ使った','未使用のケースを補う','漏れた評価を成功にしない']} tone={judgment==='unused'?'teal':'amber'} data-unused-judgment={String(judgment==='unused')}/>
    <Text y={358} small>判定結果を見て直したケースは、開発用へ移す</Text>
   </>:f.stage===2?<>
    {['review','回帰test','明示的昇格','shared利用元'].map((t,i)=><Box key={t} x={32+i%2*316} y={78+Math.floor(i/2)*113} width={260} height={82} title={t} tone={[review,regression,promotion,scope][i]==='yes'?'teal':'amber'}/>)}
    <Box x={67} y={330} width={506} height={76} title={state.stagedCandidateReady?'条件を確認した段階適用の候補':'不足する検証・昇格・判定へ戻る'} tone={state.stagedCandidateReady?'teal':'amber'} data-prompt-release-ready={String(state.stagedCandidateReady)} data-production-changed="false"/>
   </>:f.stage===3?<>
    <Box x={67} y={81} width={506} height={121} title="offlineの同条件比較" lines={['候補の劣化を、利用者へ届く前に確認']} tone="violet"/>
    <Wire id={s.id} d="M320 202V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="canaryで本番signalの新旧を確認" lines={['費用と検出範囲は条件に依存']} tone="teal"/>
   </>:<>
    {['変更と指標の対応を記録','結論と終了条件を確認','採用版へ統合し、旧variantを整理'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
   </>}
  </>}</TechniqueCanvas>}>{children}</TechniqueFigure>
}
