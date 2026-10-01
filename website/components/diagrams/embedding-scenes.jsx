'use client'
import {useState} from 'react'
import {RetrievalFigure,RetrievalCanvas,Text,Box,Wire,Select,Tokens} from './retrieval-data-primitives'
import {embeddingInput} from '../../lib/retrieval-data-model.mjs'
export function EmbeddingChoiceAsymmetry({children}){
 const [axis,setAxis]=useState('language'),[prefix,setPrefix]=useState('unknown')
 const axes={language:['言語・ドメイン','日本語・自社語彙','自社の質問で照合'],length:['入力長','指示・prefix込み','上限と分割を照合'],dimension:['次元','保存・計算・メモリ','同じ評価で比較'],delivery:['提供形態','API・自前の運用','費用と制約を照合']}
 return <RetrievalFigure diagram="embedding-choice-asymmetry" title="埋め込みの選定軸と、質問・文書の非対称性"
 controls={({stage,ready})=>stage===2?<Select label="見比べる選定軸" value={axis} onChange={setAxis} ready={ready}><option value="language">言語・ドメイン</option><option value="length">入力長</option><option value="dimension">次元</option><option value="delivery">提供形態</option></Select>:stage===3?<Select label="先頭N次元の対応" value={prefix} onChange={setPrefix} ready={ready}><option value="unknown">未確認</option><option value="yes">公式対応を確認</option><option value="no">対応なし</option></Select>:null}
 scene={s=><RetrievalCanvas diagram="embedding-choice-asymmetry" {...s}>{f=><>
  <Text y={35}>{['検索全体の中で、モデルの仕事を区分する','近さは、モデルと用途で変わる','公開順位から、自社の採用へ飛ばない','任意の切詰めを、有効な次元変更にしない','短い質問と長い文書は、同じ役割ではない'][f.stage]}</Text>
  {f.stage===0?<>
   {['前処理：構造・品質','埋め込み：表現へ変換','検索基盤：候補を探索','RAG：根拠を回答へ'].map((t,i)=><g key={t}><Box x={64} y={69+i*83} width={512} height={62} title={t} tone={i===1?'teal':'violet'}/>{i<3&&<Wire id={s.id} d={`M320 ${131+i*83}V${147+i*83}`} active phase={f.phase}/>}</g>)}
  </>:f.stage===1?<>
   <Box x={32} y={88} width={260} height={161} title="同じ文章" lines={['モデル・用途が変わる','近さの基準も変わる']} tone="violet"/>
   <Wire id={s.id} d="M292 168H340" active phase={f.phase}/><Box x={348} y={88} width={260} height={161} title="近い候補" lines={['正しい根拠とは別','閲覧権限とも別']} tone="amber"/>
   <Text y={351} small>座標・距離・順位は、実測せず図に置かない</Text>
  </>:f.stage===2?<>
   <Tokens labels={['言語','ドメイン','入力長','次元','提供']} y={80} selected={axis==='language'?[0,1]:axis==='length'?[2]:axis==='dimension'?[3]:[4]}/>
   <Box x={102} y={173} width={436} height={144} title={axes[axis][0]} lines={axes[axis].slice(1)} tone="teal"/>
   <Text y={383} small>質問と正解chunkで、候補を比べる</Text>
  </>:f.stage===3?<>
   <Tokens labels={['1','…','N','…','D']} y={83} selected={prefix==='yes'?[0,1,2]:[0,1,2,3,4]} muted={prefix==='yes'?[3,4]:[]}/>
   <Box x={32} y={177} width={260} height={151} title={prefix==='yes'?'条件付きの候補':'切詰めは未採用'} lines={[prefix==='yes'?'先頭N対応を確認':'任意の短縮は避ける','次元ごとに評価する']} tone={prefix==='yes'?'teal':'amber'} data-prefix-candidate={String(prefix==='yes')}/>
   <Box x={348} y={177} width={260} height={151} title="精度と負担" lines={['保存・計算・メモリ','高次元だけで決めない']} tone="violet"/>
   <Text y={397} small>模式的な成分列です。実ベクトル値ではありません</Text>
  </>:<>
   <Box x={32} y={85} width={260} height={154} title="query側" lines={['短い質問','対応する指示・prefix']} tone="teal"/>
   <Box x={348} y={85} width={260} height={154} title="document側" lines={['長い文書','対応する前処理']} tone="violet"/>
   <Wire id={s.id} d="M162 239V280H320V295 M478 239V280H320V295" active phase={f.phase}/><Box x={112} y={295} width={416} height={79} title="公式条件と自社評価で照合"/>
  </>}
 </>}</RetrievalCanvas>}>{children}</RetrievalFigure>
}
export function EmbeddingChunkDeploy({children}){
 const [counted,setCounted]=useState('no'),[over,setOver]=useState('yes'),[truncate,setTruncate]=useState('no'),[recorded,setRecorded]=useState('no'),[space,setSpace]=useState('new')
 const state=embeddingInput({counted:counted==='yes',overLimit:over==='yes',truncateExplicit:truncate==='yes',omissionRecorded:recorded==='yes'})
 return <RetrievalFigure diagram="embedding-chunk-deploy" title="入力の上限、評価とモデル移行の順序"
 controls={({stage,ready})=>stage===0?<>{[['指示込みのtoken計数',counted,setCounted],['入力上限の超過',over,setOver],['切詰めの明示設定',truncate,setTruncate],['欠落と評価の記録',recorded,setRecorded]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="no">なし</option><option value="yes">あり</option></Select>)}</>:stage===3?<Select label="queryが使うモデル空間" value={space} onChange={setSpace} ready={ready}><option value="old">旧モデル</option><option value="new">新モデル</option></Select>:null}
 scene={s=><RetrievalCanvas diagram="embedding-chunk-deploy" {...s}>{f=><>
  <Text y={35}>{['入力の形と、上限超過への対応を確認する','微調整を、最初の改善策に固定しない','公開順位から、自社の検索評価へ進む','同じ空間へqueryを送り、切替・復帰を用意する'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={82} width={260} height={160} title="実入力" lines={['本文＋指示＋prefix','対応tokenizerで計数','複数話題も点検']} tone="violet"/>
   <Wire id={s.id} d="M292 162H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={160} title={{count:'まず計数',candidate:'入力の候補',split:'分割を検討','evaluate-truncation':'切詰めを評価'}[state.next]} lines={state.next==='evaluate-truncation'?['欠落を記録する','検索評価へ戻す']:state.next==='split'?['無断の末尾脱落を避ける','API条件を確認する']:['処理の条件を確認','図はAPIを実行しない']} tone={state.next==='candidate'?'teal':'amber'} data-embedding-input-next={state.next} data-api-executed="false"/>
   <Text y={356} small>APIの拒否と明示的な切詰めを区分する</Text>
  </>:f.stage===1?<>
   {['汎用モデルを評価','非対称前処理を照合','chunkの分割を評価'].map((t,i)=><g key={t}><Box x={45} y={76+i*91} width={366} height={65} title={t}/>{i<2&&<Wire id={s.id} d={`M228 ${141+i*91}V${162+i*91}`} active phase={f.phase}/>}</g>)}
   <Box x={451} y={150} width={157} height={150} title="微調整" lines={['教師ペア','保守費用','変更の負担']} tone="violet"/>
   <Text y={393} small>特殊語彙の必要性を、先に評価で確かめる</Text>
  </>:f.stage===2?<>
   <Box x={32} y={83} width={260} height={166} title="評価の入力" lines={['自社の質問','正解chunkとの対応','言語・domainを保持']} tone="violet"/>
   <Wire id={s.id} d="M292 166H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={166} title="同じ条件で比較" lines={['recall@k','順位と費用','公開順位は候補の入口']} tone="teal"/>
   <Text y={357} small>架空の精度・速度・料金を表示しない</Text>
  </>:<>
   <Box x={32} y={83} width={260} height={146} title="旧インデックス" lines={['旧モデルの全chunk','復帰の経路を保持']} tone="violet" active={space==='old'}/>
   <Box x={348} y={83} width={260} height={146} title="新インデックス" lines={['新モデルで再埋込み','別構築して比較']} tone="teal" active={space==='new'}/>
   <Wire id={s.id} d={space==='old'?'M162 237V289H320V305':'M478 237V289H320V305'} active phase={f.phase}/><Box x={113} y={305} width={414} height={69} title={`${space==='old'?'旧':'新'}空間のqueryと対応`} data-query-space={space}/>
   <Text y={417} small>版・退役告知・再構築の時間と費用を記録する</Text>
  </>}
 </>}</RetrievalCanvas>}>{children}</RetrievalFigure>
}
