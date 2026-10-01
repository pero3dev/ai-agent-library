'use client'
import {useId,useState} from 'react'
import {ActionCanvas,ActionFigure,ActionPair,Text,Box,Wire,Select,Tokens} from './slm-computer-voice-primitives'
import {slmRoute,slmAdoption} from '../../lib/slm-computer-voice-model.mjs'

export function SlmQualityComponents({children}){
 const id=useId(),[group,setGroup]=useState('routine')
 return <ActionFigure diagram="slm-quality-components" title="小型を活かす範囲と、評価する境界を読む。" scene={({phase})=><ActionCanvas diagram="slm-quality-components" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['モデル戦略と実行環境を分ける','平均で入力群の基準割れを隠さない','小型の後に上位へ回る二段も測る','定型部品と安全性を別々に確かめる'][stage]}</Text>
  {stage===0?<ActionPair id={id} phase={phase} left={['小型を活かす戦略','役割・品質・昇格','モデル選定へ接続','顔ぶれはカタログへ']} right={['実行場所の設計','端末・edge・サーバー','別の要件と制約','ローカル実装へ接続']} arrow={false}/>:stage===1?<>
   <Tokens labels={['定型入力','多段推論','長文・曖昧']} y={74} selected={[group==='routine'?0:group==='reasoning'?1:2]}/>
   <ActionPair id={id} phase={phase} y={155} left={['入力群ごとの測定',group==='routine'?'狭い範囲も検証':group==='reasoning'?'多段推論を検証':'長文・曖昧を検証','学習・推論・量子化','品質基準へ照合']} right={['移管する範囲','平均だけで決めず','基準割れを残す','架空の精度は置かず']}/>
  </>:stage===2?<>
   <Box x={32} y={76} width={260} height={125} title="小型を既定に" lines={['SLM → 必要時に上位','二段分の費用と時間']} tone="violet"/>
   <Box x={348} y={76} width={260} height={125} title="上位へ直行" lines={['難しい入力を分ける','余分な小型試行を省く']}/>
   <Wire id={id} d="M162 201V238" active phase={phase}/><Wire id={id} d="M478 201V238" active phase={phase}/>
   <Box x={64} y={248} width={512} height={103} title="全体で比較する" lines={['ルーター・検証を含む総費用','同じ入力群の品質とp95/p99']} tone="amber"/>
  </>:<>
   <Box x={32} y={89} width={260} height={177} title="固定手順の部品" lines={['分類・抽出・整形','workflowへ割当','タスク別の品質基準']} tone="violet"/>
   <Box x={348} y={89} width={260} height={177} title="ガードレール" lines={['危険入力の通過を測る','攻撃・言語・長文別','権限と実行制約も保持']} tone="amber"/>
   <Text y={322} small>分類の平均精度だけで、安全性の評価を済ませない</Text>
  </>}
 </>}</ActionCanvas>} controls={({stage,ready})=>stage===1?<Select label="評価する入力群" value={group} onChange={setGroup} ready={ready}><option value="routine">定型・狭い範囲</option><option value="reasoning">多段の推論</option><option value="context">長文・曖昧な入力</option></Select>:null}>{children}</ActionFigure>
}
export function SlmRoutingCost({children}){
 const id=useId(),[difficulty,setDifficulty]=useState('easy'),[quality,setQuality]=useState('no'),[verified,setVerified]=useState('no'),[missing,setMissing]=useState('quality'),[guard,setGuard]=useState('yes')
 const route=slmRoute({difficultInput:difficulty==='hard',qualityAccepted:quality==='yes',verifierPassed:verified==='yes'})
 const acceptance=slmAdoption({groupQualityCompared:missing!=='quality',totalCostCompared:missing!=='cost',tailLatencyCompared:missing!=='tail',guardrailTask:guard==='yes',safetyCompared:missing!=='safety'})
 return <ActionFigure diagram="slm-routing-cost" title="昇格経路と、移管するための品質ゲートを読む。" scene={({phase})=><ActionCanvas diagram="slm-routing-cost" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['難易度と、出力の品質・検証を分けて判定する','昇格には、小型と上位の二段分がかかる','上位の判断と定型部品を組み合わせる','学習の前に、軽い変更を比較する','品質・総費用・応答・必要な安全性を合わせる'][stage]}</Text>
  {stage<=1?<g data-slm-route-next={route.next} data-model-called="false">
   <Box x={207} y={66} width={226} height={73} title="入力の難易度" tone="amber"/>
   <Wire id={id} d="M260 139V168H162V193" active={route.next!=='upper-direct'} phase={phase}/>
   <Wire id={id} d="M380 139V168H478V193" active={route.next==='upper-direct'} phase={phase}/>
   <Box x={32} y={199} width={260} height={126} title="小型を試す" lines={['品質と検証を確認','不足なら上位を確認']} tone="violet"/>
   <Box x={348} y={199} width={260} height={126} title="上位モデル" lines={['難しい入力は直行','品質は別に検証']}/>
   <Wire id={id} d="M292 260H340" active={route.next==='confirm-escalation'} phase={phase}/>
   <Text y={364} small tone={route.next==='slm-candidate'?'teal':'amber'}>{route.next==='upper-direct'?'上位へ直行する候補':route.next==='slm-candidate'?'小型の結果を検討する候補':'小型の不足を残して、昇格を確認する'}</Text>
  </g>:stage===2?<ActionPair id={id} phase={phase} left={['上位の判断','広い推論の役割','全体の状態を保持','部品の結果を検証']} right={['固定手順の部品','分類・抽出・整形','小型を割り当てる','守りの安全性は別']}/>:stage===3?<>
   <Tokens labels={['プロンプト','ルーティング','FT・蒸留']} y={100} selected={[0,1]}/>
   <Box x={64} y={204} width={512} height={136} title="届かない範囲と維持費を確認" lines={['品質基準を満たす入力群を測る','データ作成・維持・学習を含める','教師出力の選別と評価分離は正本へ']} tone="amber"/>
  </>:<g data-slm-review-candidate={String(acceptance.reviewCandidate)} data-slm-deployment-executed="false">
   <Tokens labels={['入力群品質','総費用','p95/p99','安全性']} y={94} selected={[0,1,2,3].filter(i=>missing!==['quality','cost','tail','safety'][i]&&(i!==3||guard==='yes'))}/>
   <Box x={64} y={209} width={512} height={136} title={acceptance.reviewCandidate?'採用を検討する候補':'不足を残して評価へ戻る'} lines={['タスク・入力群ごとの基準','ルーター・二段の負担も含める','本番の移管は実行しない']} tone={acceptance.reviewCandidate?'teal':'amber'}/>
  </g>}
 </>}</ActionCanvas>} controls={({stage,ready})=>stage<=1?<>{[['入力の難易度',difficulty,setDifficulty,[['easy','小型を試す範囲'],['hard','上位へ直行する範囲']]],['小型の品質条件',quality,setQuality,[['no','不足・未確認'],['yes','基準を確認']]],['出力の検証',verified,setVerified,[['no','失敗・未確認'],['yes','通過を確認']]]].map(([label,value,onChange,options])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}>{options.map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>)}</>:stage===4?<><Select label="移管前の不足条件" value={missing} onChange={setMissing} ready={ready}><option value="quality">入力群の品質が不足</option><option value="cost">総費用の比較が不足</option><option value="tail">p95/p99の比較が不足</option><option value="safety">安全性の比較が不足</option><option value="none">必要条件を確認</option></Select><Select label="ガードレールの移管" value={guard} onChange={setGuard} ready={ready}><option value="yes">安全性の比較も必要</option><option value="no">ガードレール以外の部品</option></Select></>:null}>{children}</ActionFigure>
}
