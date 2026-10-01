'use client'
import {useState} from 'react'
import {RagMemoryFigure,RagMemoryCanvas,Text,Box,Wire,Select,Tokens} from './rag-memory-graph-primitives'
import {graphInvestment} from '../../lib/rag-memory-graph-model.mjs'
export function GraphBuildQuality({children}){
 const [schema,setSchema]=useState('strict'),[identity,setIdentity]=useState('no')
 return <RagMemoryFigure diagram="graph-build-quality" title="関係をたどる構造と、抽出・名寄せの品質"
 controls={({stage,ready})=>stage===1?<Select label="schemaの制約" value={schema} onChange={setSchema} ready={ready}><option value="loose">緩い制約</option><option value="strict">厳しい制約</option></Select>:stage===2?<Select label="同じ実体である裏付け" value={identity} onChange={setIdentity} ready={ready}><option value="no">未確認</option><option value="yes">照合材料あり</option></Select>:null}
 scene={s=><RagMemoryCanvas diagram="graph-build-quality" {...s}>{f=><>
  <Text y={35}>{['通常のRAGで届かない問いから検討する','entityと関係を、許す型に対応させる','似た表記を、確認なしに同じentityへ統合しない','graphがあるだけで、正しいとは言えない'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={83} width={260} height={157} title="通常RAGの失敗" lines={['質問ログと失敗を確認','hybrid・meta・chunk','先に改善できるか評価']} tone="violet"/>
   <Wire id={s.id} d="M292 163H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={157} title="graphの必要性" lines={['関係・集約が本質か','構築と維持の費用','印象だけで導入しない']} tone="teal"/>
  </>:f.stage===1?<>
   <Box x={42} y={87} width={175} height={95} title="山田" lines={['人のentity']} tone="teal"/>
   <Text x={312} y={112} small>所属</Text><Wire id={s.id} d="M217 145H398" active phase={f.phase}/><Box x={406} y={87} width={192} height={95} title="営業部" lines={['部署のentity']} tone="violet"/>
   <Box x={65} y={275} width={510} height={105} title={schema==='strict'?'許すentity型・関係型を絞る':'許すentity型・関係型を広げる'} lines={schema==='strict'?['構築の負担と精度のtrade-off']:['構築の自由と検索の不安定さを評価']} tone="amber"/>
  </>:f.stage===2?<>
   <Box x={32} y={82} width={260} height={105} title="営業部" lines={['原文の表記例']} tone="violet"/><Box x={348} y={82} width={260} height={105} title="営業本部" lines={['同じ実体か照合']} tone="violet"/>
   <Wire id={s.id} d="M162 187V248H320V270 M478 187V248H320V270" active={identity==='yes'} phase={f.phase}/><Box x={96} y={270} width={448} height={110} title={identity==='yes'?'統合を検討する候補':'別表記を自動統合しない'} lines={['裏付け・分裂・混線を点検','名寄せ後も抽出品質を評価']} tone={identity==='yes'?'teal':'amber'} data-graph-merge-candidate={String(identity==='yes')}/>
  </>:<>
   <Box x={32} y={83} width={260} height={169} title="graphの品質" lines={['誤り・欠落が残る','重要部分を人が確認','抽出と名寄せを評価']} tone="amber"/>
   <Box x={348} y={83} width={260} height={169} title="更新の負担" lines={['文書更新と再抽出','entity・関係の追加削除','schema変更の波及']} tone="violet"/>
   <Text y={359} small>構築して終わりにせず、維持と再評価へ戻す</Text>
  </>}
 </>}</RagMemoryCanvas>}>{children}</RagMemoryFigure>
}
export function GraphTypesInvestment({children}){
 const [kind,setKind]=useState('hybrid'),[question,setQuestion]=useState('aggregate'),[baseline,setBaseline]=useState('yes'),[relation,setRelation]=useState('yes'),[maintenance,setMaintenance]=useState('no')
 const state=graphInvestment({baselineFails:baseline==='yes',relationNeeded:relation==='yes',maintenanceAccepted:maintenance==='yes'})
 const kinds={entity:['entityから辿る','質問から対象を特定','関係をたどって集める'],community:['community要約','密な塊を事前要約','全体の問いへ集約'],hybrid:['vectorとの併用','通常RAGを土台に','関係部分を補う']}
 return <RagMemoryFigure diagram="graph-types-investment" title="質問の型、三つの構成と投資の条件"
 controls={({stage,ready})=>stage===0?<Select label="GraphRAGの構成" value={kind} onChange={setKind} ready={ready}>{Object.entries(kinds).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===1?<Select label="実ログで見る質問の型" value={question} onChange={setQuestion} ready={ready}><option value="fact">単純な事実検索</option><option value="relation">多段の関係</option><option value="aggregate">集約・全体の傾向</option></Select>:stage===2?<>{[['通常RAGでの失敗',baseline,setBaseline],['関係・集約の必要性',relation,setRelation],['維持費用の受入',maintenance,setMaintenance]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="no">未確認・条件なし</option><option value="yes">確認済み</option></Select>)}</>:null}
 scene={s=><RagMemoryCanvas diagram="graph-types-investment" {...s}>{f=><>
  <Text y={35}>{['graphを検索・要約へ使う位置を区分する','質問の型と実ログを、必要性の材料へ戻す','精度だけでなく、維持費用も受け入れられるか見る','同じ質問セットで、品質・費用・遅延を比べる','更新とschema変更を、再構築と評価へ戻す'][f.stage]}</Text>
  {f.stage===0?<>
   <Tokens labels={['entity辿り','塊の要約','vector併用']} y={82} selected={[Object.keys(kinds).indexOf(kind)]}/>
   <Box x={32} y={184} width={260} height={145} title={kinds[kind][0]} lines={kinds[kind].slice(1)} tone="violet"/>
   <Wire id={s.id} d="M292 257H340" active phase={f.phase}/><Box x={348} y={184} width={260} height={145} title="通常RAGとの分担" lines={['全面graph化とは別','実際の問いで比較']} tone="teal"/>
  </>:f.stage===1?<>
   <Box x={32} y={83} width={260} height={160} title={{fact:'単純な事実',relation:'多段の関係',aggregate:'集約・俯瞰'}[question]} lines={question==='fact'?['手順・エラーの意味','通常RAGを先に評価']:question==='relation'?['依存・参照をたどる','関係の欠落を評価']:['全体の主要テーマ','要約と範囲を評価']} tone="violet"/>
   <Box x={348} y={83} width={260} height={160} title="質問ログへ戻す" lines={['必要な問いの割合','抽出の精度・欠落','完全な集約は保証せず']} tone="teal"/>
   <Text y={357} small>向く質問の型だけで、graph導入を決めない</Text>
  </>:f.stage===2?<>
   <Tokens labels={['通常RAG失敗','関係が必要','維持費用']} y={83} selected={[baseline,relation,maintenance].flatMap((v,i)=>v==='yes'?[i]:[])}/>
   <Box x={91} y={184} width={458} height={143} title={state.evaluationCandidate?'導入を評価する候補':'条件を確認・改善する'} lines={['hybrid・meta・chunk改善とも比較','図は構築・導入を実行しない']} tone={state.evaluationCandidate?'teal':'amber'} data-graph-investment-candidate={String(state.evaluationCandidate)} data-graph-quality-guaranteed="false"/>
  </>:f.stage===3?<>
   <Box x={32} y={83} width={260} height={168} title="同じ質問のA/B" lines={['通常RAGとGraphRAG','効いた問いの範囲','人手標本で抽出を点検']} tone="teal"/>
   <Box x={348} y={83} width={260} height={168} title="費用と遅延" lines={['構築・維持の負担','レイテンシも比較','精度だけで採用しない']} tone="violet"/>
   <Text y={359} small>実測していない割合・費用を図で補完しない</Text>
  </>:<>
   {['文書・entity・関係の更新','schema・名寄せを再検討','再構築して同じ質問で評価'].map((t,i)=><g key={t}><Box x={64} y={76+i*102} width={512} height={72} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${148+i*102}V${173+i*102}`} active phase={f.phase}/>}</g>)}
   <Text y={413} small>手法と実装手段の未確認は、採用時に再確認する</Text>
  </>}
 </>}</RagMemoryCanvas>}>{children}</RagMemoryFigure>
}
