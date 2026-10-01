'use client'
import { useState } from 'react'
import { PromptFigure,PromptCanvas,Text,Box,Wire,Select } from './prompt-tool-output-primitives'
import { promptStop } from '../../lib/prompt-tool-output-model.mjs'
const sections=[['役割と目的','成功の条件'],['能力とツール','選択する方針'],['制約と禁止','衝突の優先順位'],['進め方','計画と相談条件'],['出力形式','報告と成果物'],['判断の例','割れる条件を示す']]
export function PromptStructureBoundaries({children}){
 const [section,setSection]=useState('2'),[action,setAction]=useState('read'),[errors,setErrors]=useState('2'),[missing,setMissing]=useState('no'),state=promptStop({sameErrors:Number(errors),informationMissing:missing==='yes'})
 return <PromptFigure diagram="prompt-structure-boundaries" title="繰り返し使う判断基準を、役割と停止条件へ分ける"
  controls={({stage,ready})=>stage===1?<Select label="プロンプトのセクション" value={section} onChange={setSection} ready={ready}>{sections.map(([t],i)=><option key={t} value={String(i)}>{t}</option>)}</Select>:stage===2?<Select label="原文の操作区分" value={action} onChange={setAction} ready={ready}><option value="read">照会・下書き</option><option value="write">削除・送信・支払い</option></Select>:stage===3?<><Select label="同じエラーの回数例" value={errors} onChange={setErrors} ready={ready}>{[0,1,2,3,4].map(n=><option key={n} value={String(n)}>{n}回</option>)}</Select><Select label="判断情報の不足" value={missing} onChange={setMissing} ready={ready}><option value="no">不足を確認していない</option><option value="yes">必要情報が不足</option></Select></>:null}
  scene={s=><PromptCanvas diagram="prompt-structure-boundaries" {...s}>{f=><>
   <Text y={35}>{['多状況のループで、原則と境界を使う','役割の違う六つのセクション','曖昧な慎重さを、操作と条件にする','失敗の繰返しと情報不足を分ける','変更・レビュー・評価を版に結び付ける','文章の指示と、強制する実装を合わせる'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={79} width={506} height={91} title="役割・原則・境界" lines={['単発の出力指示だけにしない']} tone="violet"/>
    <Wire id={s.id} d="M320 170V217" active phase={f.phase}/>
    {['計画する状況','実行する状況','回復する状況'].map((t,i)=><Box key={t} x={32+i*204} y={228} width={168} height={106} title={t} tone="teal"/>)}
    <Text y={385} small>ループ全体で参照する基準を、保守できる形へ</Text>
   </>:f.stage===1?<>
    {sections.map(([t,n],i)=><Box key={t} x={32+i%2*316} y={75+Math.floor(i/2)*110} width={260} height={86} title={t} lines={[n]} tone={i===Number(section)?'teal':'violet'} active={i===Number(section)} data-prompt-section={i===Number(section)?section:undefined}/>)}
   </>:f.stage===2?<>
    <Box x={67} y={80} width={506} height={108} title={action==='write'?'削除・送信・支払い':'照会・下書き'} lines={['操作の影響で、条件を区分する']} tone="violet"/>
    <Wire id={s.id} d="M320 188V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title={action==='write'?'原文の承認へ戻す':'原文の照会・下書きの経路'} lines={['図は操作も承認も実行しない']} tone={action==='write'?'amber':'teal'} data-prompt-approval-required={String(action==='write')}/>
   </>:f.stage===3?<>
    <Box x={32} y={81} width={260} height={145} title={`同じエラー ${errors}回`} lines={[state.stopAndReport?'停止して報告':'原文の例は3回で停止','試したことを要約']} tone={state.stopAndReport?'amber':'violet'} data-prompt-stop={String(state.stopAndReport)}/>
    <Box x={348} y={81} width={260} height={145} title="必要な判断情報" lines={[state.askForInformation?'不足：質問へ戻す':'不足の状態を確認','推測で補完しない']} tone={state.askForInformation?'amber':'teal'} data-prompt-question={String(state.askForInformation)}/>
    <Text y={329} small>3回は原文の指示例。全製品の既定値ではない</Text>
   </>:f.stage===4?<>
    {['版管理した変更','レビューと評価','モデル更新で再確認'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
   </>:<>
    <Box x={32} y={81} width={260} height={174} title="文章の判断基準" lines={['六つの責任を整理','衝突の優先順位','古い指示を見直す']} tone="violet"/>
    <Box x={348} y={81} width={260} height={174} title="実行側の制御" lines={['権限と承認','停止と回復の実装','安全を文章だけにしない']} tone="teal"/>
    <Text y={358} small>変更の効果は評価する。成功を表現だけで保証しない</Text>
   </>}
  </>}</PromptCanvas>}>{children}</PromptFigure>
}
const causes={tool:['ツール誤用・不使用','名前・説明・役割の定義'],memory:['過去の決定と矛盾','履歴の圧縮と決定の保持'],retrieval:['資料に基づかない回答','検索品質と文脈の構成']}
export function PromptCauseRevision({children}){
 const [cause,setCause]=useState('tool')
 return <PromptFigure diagram="prompt-cause-revision" title="指示の継ぎ足し前に原因候補を分け、評価へ戻る"
  controls={({stage,ready})=>stage===0?<Select label="原文の症状" value={cause} onChange={setCause} ready={ready}>{Object.entries(causes).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:null}
  scene={s=><PromptCanvas diagram="prompt-cause-revision" {...s}>{f=><>
   <Text y={35}>{['症状から調べる先を変える','衝突と古い指示を、単位で見直す','強い語を増やし続けない','変更の範囲と評価結果を照合'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={80} width={506} height={108} title={causes[cause][0]} lines={['プロンプトの不足と即断しない']} tone="violet"/>
    <Wire id={s.id} d="M320 188V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title={causes[cause][1]} lines={['候補を調べ、実際の原因を確認']} tone="teal" data-prompt-cause={cause} data-cause-confirmed="false"/>
   </>:f.stage===1?<>
    <Box x={32} y={80} width={260} height={170} title="継ぎ足した指示" lines={['簡潔に／詳細に','新旧の衝突が堆積','効く条件が不明']} tone="amber"/>
    <Wire id={s.id} d="M292 165H340" active phase={f.phase}/><Box x={348} y={80} width={260} height={170} title="セクションを改訂" lines={['矛盾と古い指示を整理','判断する条件を明示','差分をレビュー']} tone="teal"/>
    <Text y={352} small>障害1件につき指示1行、という増量を続けない</Text>
   </>:f.stage===2?<>
    <Box x={67} y={80} width={506} height={118} title="強調が増える" lines={['少数の重要な境界が埋もれる']} tone="amber"/>
    <Wire id={s.id} d="M320 198V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="必要な制約と条件を明確にする" lines={['モデル更新時にも効き方を評価']} tone="teal"/>
   </>:<>
    {['原因と変更対象を確認','セクションの差分をレビュー','評価して、版と結果を記録'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
   </>}
  </>}</PromptCanvas>}>{children}</PromptFigure>
}
