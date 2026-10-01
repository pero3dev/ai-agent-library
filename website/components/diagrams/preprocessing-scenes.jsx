'use client'
import {useState} from 'react'
import {RetrievalFigure,RetrievalCanvas,Text,Box,Wire,Select,Tokens} from './retrieval-data-primitives'
import {derivedSearch} from '../../lib/retrieval-data-model.mjs'
export function PreprocessExtractionQuality({children}){
 const [format,setFormat]=useState('scan'),[clean,setClean]=useState('strong')
 const formats={html:['HTML','非本文の除外','DOMの構造を点検'],office:['Office','見出し・表・セル','構造を保持して抽出'],pdf:['テキストPDF','読み順と段組み','脚注・ページ跨ぎ'],scan:['画像PDF','OCRが必要','複雑なlayoutを点検']}
 return <RetrievalFigure diagram="preprocess-extraction-quality" title="原本から構造を保ち、清掃の副作用を確かめる"
 controls={({stage,ready})=>stage===2?<Select label="原本の形式" value={format} onChange={setFormat} ready={ready}>{Object.entries(formats).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:stage===4?<Select label="清掃の強さ" value={clean} onChange={setClean} ready={ready}><option value="weak">弱い除去</option><option value="strong">強い除去</option></Select>:null}
 scene={s=><RetrievalCanvas diagram="preprocess-extraction-quality" {...s}>{f=><>
  <Text y={35}>{['後段の検索品質は、取り込みの上流に依存する','保存の冪等性と、出力の決定性を分ける','形式ごとに、抽出の難所が違う','構造を平らにしてから、元どおりとは言えない','不要な情報と、必要な記号・構造を見分ける'][f.stage]}</Text>
  {f.stage===0?<>
   {['前処理：抽出・品質','chunk：構造で分割','embedding：表現へ','検索：根拠の候補'].map((t,i)=><g key={t}><Box x={64} y={69+i*82} width={512} height={62} title={t} tone={i===0?'amber':'violet'}/>{i<3&&<Wire id={s.id} d={`M320 ${131+i*82}V${145+i*82}`} active phase={f.phase}/>}</g>)}
  </>:f.stage===1?<>
   <Tokens labels={['原本','抽出','清掃','重複排除','meta']} y={80} selected={[0,1,2,3,4]}/>
   <Box x={32} y={182} width={260} height={149} title="再実行する保存" lines={['作用の重複を防ぐ','原本・規則の版を保持']} tone="teal"/>
   <Box x={348} y={182} width={260} height={149} title="抽出の出力" lines={['同じ結果とは限らない','モデル・抽出器も記録']} tone="amber"/>
   <Text y={397} small>冪等な保存だけで、抽出品質は保証されない</Text>
  </>:f.stage===2?<>
   <Box x={32} y={82} width={260} height={158} title={formats[format][0]} lines={formats[format].slice(1)} tone="violet"/>
   <Wire id={s.id} d="M292 161H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={158} title="抽出を点検" lines={['一つの抽出器で','全形式を保証しない','専門処理の条件を確認']} tone="teal"/>
   <Text y={357} small>図はOCRや文書抽出を実行しない</Text>
  </>:f.stage===3?<>
   <Box x={32} y={82} width={260} height={168} title="残す構造" lines={['見出し・段落・表','結合セル・脚注','読み順・ページ跨ぎ']} tone="teal"/>
   <Wire id={s.id} d="M292 166H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={168} title="次の分割" lines={['構造を使ってchunk化','原本へ戻って点検','変換だけで決めない']} tone="violet"/>
   <Text y={357} small>同じ文字列でも、対応する構造は失い得る</Text>
  </>:<>
   <Box x={32} y={82} width={260} height={159} title={clean==='strong'?'強く除去する':'弱く除去する'} lines={clean==='strong'?['非本文は減り得る','必要情報も失い得る']:['必要情報を残しやすい','ノイズも残り得る']} tone="violet"/>
   <Wire id={s.id} d="M292 162H340" active phase={f.phase}/><Box x={348} y={82} width={260} height={159} title="保持と検索を評価" lines={['数値・記号・コード','改行・表・完全一致','規則の副作用を比較']} tone="teal"/>
   <Text y={357} small>除去の強さを、品質の高さへ変換しない</Text>
  </>}
 </>}</RetrievalCanvas>}>{children}</RetrievalFigure>
}
export function PreprocessMetadataLineage({children}){
 const [tenant,setTenant]=useState('yes'),[acl,setAcl]=useState('yes'),[version,setVersion]=useState('yes'),[deleted,setDeleted]=useState('no'),[removed,setRemoved]=useState('no')
 const state=derivedSearch({sameTenant:tenant==='yes',aclInherited:acl==='yes',versionApplies:version==='yes',deletedSource:deleted==='yes',derivativesDeleted:removed==='yes'})
 return <RetrievalFigure diagram="preprocess-metadata-lineage" title="重複・版・権限と、派生物の更新・削除"
 controls={({stage,ready})=>stage===2?<>{[['同じテナント',tenant,setTenant],['原本ACLの継承',acl,setAcl],['質問時点に適用する版',version,setVersion]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="yes">条件一致</option><option value="no">不一致・未反映</option></Select>)}</>:stage===3?<>{[['原本の削除',deleted,setDeleted],['古い派生物の削除',removed,setRemoved]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="no">未完了</option><option value="yes">完了</option></Select>)}</>:null}
 scene={s=><RetrievalCanvas diagram="preprocess-metadata-lineage" {...s}>{f=><>
  <Text y={35}>{['同じ、似ている、版が違う、を区分する','取り込み時点で、原本との対応を残す','権限・テナント・適用版を、派生物へ引き継ぐ','原本だけ消した状態を、削除完了にしない','原本と版を保持して、再処理の品質を比べる'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={82} width={260} height={165} title="重複の判定" lines={['完全一致はhashなど','準重複は別の判断','似た別文書を残す']} tone="violet"/>
   <Box x={348} y={82} width={260} height={165} title="版の判定" lines={['同文書の更新は別版','有効期間を保持','質問時点と照合']} tone="teal"/>
   <Text y={357} small>無条件の統合で、権限・適用期間を消さない</Text>
  </>:f.stage===1?<>
   <Tokens labels={['出典','更新日','権限','owner']} y={80} selected={[0,1,2,3]}/>
   <Box x={32} y={183} width={260} height={144} title="原本ID・版" lines={['取り込み時点を保持','後の更新・削除へ対応']} tone="teal"/>
   <Box x={348} y={183} width={260} height={144} title="後からの復元" lines={['消えた情報は戻せない','正確な復元は保証せず']} tone="amber"/>
  </>:f.stage===2?<>
   <Tokens labels={['原本','chunk','vector','要約']} y={80} selected={state.searchCandidate?[0,1,2,3]:[0]} muted={state.searchCandidate?[]:[1,2,3]}/>
   <Box x={92} y={182} width={456} height={142} title={state.searchCandidate?'検索対象の候補':'統合せず条件を確認'} lines={['テナント・ACL・適用版を引継ぐ','実認可と検索の実装は別に検証']} tone={state.searchCandidate?'teal':'amber'} data-derived-search-candidate={String(state.searchCandidate)} data-authorization-executed="false"/>
   <Text y={394} small>図の条件一致は、認可処理の実行ではありません</Text>
  </>:f.stage===3?<>
   <Box x={32} y={83} width={260} height={157} title={deleted==='yes'?'原本は削除済み':'原本は残存'} lines={['更新・削除を検出','原本ID・版で対応']} tone="violet"/>
   <Wire id={s.id} d="M292 162H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={157} title={state.deletionComplete?'派生物まで削除':'削除は未完了'} lines={['古いchunk・vector','要約・索引も対応']} tone={state.deletionComplete?'teal':'amber'} data-deletion-complete={String(state.deletionComplete)}/>
   <Text y={357} small>変更文書を増分処理し、古いchunkを置換する</Text>
  </>:<>
   {['原本・各規則・モデル版を保持','抽出・清掃・派生物を再処理','検索評価で旧版と比較'].map((t,i)=><g key={t}><Box x={64} y={76+i*102} width={512} height={72} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${148+i*102}V${173+i*102}`} active phase={f.phase}/>}</g>)}
   <Text y={413} small>確率的な出力の差も評価し、品質を保証扱いしない</Text>
  </>}
 </>}</RetrievalCanvas>}>{children}</RetrievalFigure>
}
