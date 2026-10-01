'use client'
import {useState} from 'react'
import {RagMemoryFigure,RagMemoryCanvas,Text,Box,Wire,Select,Tokens} from './rag-memory-graph-primitives'
import {ragEvidence} from '../../lib/rag-memory-graph-model.mjs'
export function RagIngestionSearch({children}){
 const [chunk,setChunk]=useState('structure'),[search,setSearch]=useState('hybrid'),[filter,setFilter]=useState('post')
 const chunks={fixed:['固定長','重なり付きで分割','構造の乏しい文書'],structure:['構造ベース','見出し・表・手順を保つ','長い節だけ二次分割'],meaning:['意味ベース','話題の切れ目を検出','増える費用も評価']}
 const methods={vector:['vector','言い換え・意味の近さ','完全一致に弱い場合'],keyword:['keyword','型番・固有名詞・コード','言い換えに弱い場合'],hybrid:['hybrid','両候補を統合する','調整・実装の負担']}
 return <RagMemoryFigure diagram="rag-ingestion-search" title="取り込み・検索を切り分け、権限と上位kの順序を読む"
 controls={({stage,ready})=>stage===1?<Select label="chunk分割の方式" value={chunk} onChange={setChunk} ready={ready}>{Object.entries(chunks).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===2?<Select label="一次検索の方式" value={search} onChange={setSearch} ready={ready}>{Object.entries(methods).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===4?<Select label="権限条件と件数制限の順序" value={filter} onChange={setFilter} ready={ready}><option value="pre">権限条件を検索時に反映</option><option value="post">先に件数を絞り後filter</option></Select>:null}
 scene={s=><RagMemoryCanvas diagram="rag-ingestion-search" {...s}>{f=><>
  <Text y={35}>{['取り込み・検索・生成・評価の四段へ切り分ける','分割の方式、サイズと文脈を自社評価で決める','意味と語句の一致を組合せ、モデル版を保持する','一次検索と並替えは、違う問題を担当する','権限条件を強制し、件数制限の取りこぼしを測る'][f.stage]}</Text>
  {f.stage===0?<>
   {['取り込み：chunk・meta・索引','検索：条件付き候補・並替え','生成：文脈・回答・引用','評価：検索・生成・全体'].map((t,i)=><g key={t}><Box x={64} y={69+i*82} width={512} height={62} title={t} tone={i===3?'teal':'violet'}/>{i<3&&<Wire id={s.id} d={`M320 ${131+i*82}V${145+i*82}`} active phase={f.phase}/>}</g>)}
  </>:f.stage===1?<>
   <Box x={32} y={82} width={260} height={161} title={chunks[chunk][0]} lines={chunks[chunk].slice(1)} tone="violet"/>
   <Wire id={s.id} d="M292 163H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={161} title="chunk単体の意味" lines={['小さい：文脈が不足','大きい：ノイズが増える','見出し・出典・権限']} tone="teal"/>
   <Text y={357} small>表・手順の途中を切らず、評価で比較する</Text>
  </>:f.stage===2?<>
   <Box x={32} y={82} width={260} height={157} title={methods[search][0]} lines={methods[search].slice(1)} tone="teal"/>
   <Box x={348} y={82} width={260} height={157} title="モデル版を保持" lines={['言語・長さ・次元・費用','変更は全再索引','自社評価から選ぶ']} tone="violet"/>
   <Text y={357} small>hybridは原文の初期候補で、全queryの保証ではない</Text>
  </>:f.stage===3?<>
   <Box x={32} y={82} width={260} height={161} title="一次検索" lines={['必要な候補を取り込む','再現率を担当','広めに取得して評価']} tone="violet"/>
   <Wire id={s.id} d="M292 163H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={161} title="並替え・上位へ" lines={['候補内の質を担当','候補数で費用が増える','自社評価で追加を判断']} tone="teal"/>
   <Text y={357} small>50件・20件・5件は原文の説明例で、既定値ではない</Text>
  </>:<>
   <Box x={32} y={82} width={260} height={144} title={filter==='pre'?'権限条件で検索':'件数を先に制限'} lines={filter==='pre'?['利用者の条件を強制','モデルに変更させない']:['上位が権限外へ偏り得る','下位の正解を取りこぼす']} tone={filter==='pre'?'teal':'amber'}/>
   <Wire id={s.id} d="M292 154H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={144} title={filter==='pre'?'条件内で上位kへ':'候補を補う設計'} lines={filter==='pre'?['権限制限下のrecall','filterの実装を確認']:['候補拡張・追加取得','権限制限下のrecall']} tone="violet" data-filter-needs-expansion={String(filter==='post')}/>
   <Box x={65} y={292} width={510} height={82} title="権限外候補は外部へ渡さない" lines={['外部reranker・生成より前に強制する']} tone="amber" data-unauthorized-forwarded="false"/>
  </>}
 </>}</RagMemoryCanvas>}>{children}</RagMemoryFigure>
}
export function RagAgentEvidence({children}){
 const [route,setRoute]=useState('fixed'),[hit,setHit]=useState('yes'),[authorized,setAuthorized]=useState('yes'),[supports,setSupports]=useState('no'),[failure,setFailure]=useState('retrieval')
 const evidence=ragEvidence({hit:hit==='yes',authorized:authorized==='yes',supports:supports==='yes'})
 return <RagMemoryFigure diagram="rag-agent-evidence" title="動的な検索、引用の支持と改善する場所"
 controls={({stage,ready})=>stage===0?<Select label="検索経路の制御" value={route} onChange={setRoute} ready={ready}><option value="fixed">事前定義の多段Workflow</option><option value="agent">途中結果からモデルが選ぶ</option></Select>:stage===2?<>{[['使える検索hit',hit,setHit],['利用者の権限',authorized,setAuthorized],['引用が回答を支持',supports,setSupports]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="no">条件なし</option><option value="yes">条件あり</option></Select>)}</>:stage===4?<Select label="評価で外れている段" value={failure} onChange={setFailure} ready={ready}><option value="retrieval">必要chunkが検索上位へ来ない</option><option value="generation">検索は当たるが回答が不忠実</option></Select>:null}
 scene={s=><RagMemoryCanvas diagram="rag-agent-evidence" {...s}>{f=><>
  <Text y={35}>{['操作数でなく、経路を誰が選ぶかを見る','検索の契約と反復の上限を設計する','引用があることと、根拠が支持することは別','新しい索引を比較し、切替と復帰を用意する','観測した失敗段から、改善する場所へ戻る'][f.stage]}</Text>
  {f.stage===0?<>
   <Tokens labels={['書換え','並列検索','統合','計算','回答']} y={83} selected={route==='fixed'?[0,1,2,3,4]:[1,2]}/>
   <Box x={90} y={183} width={460} height={140} title={route==='fixed'?'事前定義の経路':'モデルが動的に選ぶ'} lines={route==='fixed'?['複数操作やLLMを含んでもWorkflow','途中結果による分岐が採用理由か確認']:['検索先・再検索・次操作を選ぶ','固定多段との効果の差を評価']} tone={route==='fixed'?'violet':'teal'} data-rag-control={route}/>
  </>:f.stage===1?<>
   <Box x={32} y={83} width={260} height={169} title="検索ツールの契約" lines={['query・filter・件数','知識と使う条件の説明','回数・token上限']} tone="violet"/>
   <Wire id={s.id} d="M292 167H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={169} title="往復と停止" lines={['要約・抜粋を往復へ','全文は最終生成へ','見つからない条件']} tone="teal"/>
   <Text y={358} small>上限を新しい推奨値として補完しない</Text>
  </>:f.stage===2?<>
   <Box x={32} y={83} width={260} height={169} title="chunk IDと出典" lines={['アプリでリンクへ解決','モデルのURLを盲信せず','引用の支持を評価']} tone="violet"/>
   <Wire id={s.id} d="M292 167H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={169} title={{block:'権限外を遮断','not-found':'見つからない','verify-support':'支持を再確認',candidate:'回答候補へ'}[evidence.next]} lines={evidence.next==='not-found'?['指示＋コード側ガード','根拠を創作しない']:['hit・権限・支持を照合','図は回答を生成しない']} tone={evidence.next==='candidate'?'teal':'amber'} data-rag-evidence-next={evidence.next} data-answer-executed="false"/>
   <Text y={359} small>リンクの存在だけで、忠実性を保証しない</Text>
  </>:f.stage===3?<>
   {['ACL・鮮度・旧版削除を設計','別索引を構築・検索と生成を比較','切替・復帰と運用を確認'].map((t,i)=><g key={t}><Box x={64} y={76+i*102} width={512} height={72} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${148+i*102}V${173+i*102}`} active phase={f.phase}/>}</g>)}
  </>:<>
   <Box x={32} y={83} width={260} height={160} title="観測する評価" lines={['検索：recallと順位','生成：忠実性と答え','全体：正答と出典']} tone="violet"/>
   <Wire id={s.id} d="M292 163H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={160} title={failure==='retrieval'?'取り込み・検索へ':'生成・投入方法へ'} lines={failure==='retrieval'?['chunk・方式・query','検索の失敗へ戻す']:['指示・文脈の組立て','生成の失敗へ戻す']} tone="teal" data-rag-repair-target={failure}/>
   <Text y={358} small>図は切分けの模式例で、実原因を確定しない</Text>
  </>}
 </>}</RagMemoryCanvas>}>{children}</RagMemoryFigure>
}
