'use client'
import {useState} from 'react'
import {RagMemoryFigure,RagMemoryCanvas,Text,Box,Wire,Select,Tokens} from './rag-memory-graph-primitives'
import {memoryExtraction,memoryDeletion} from '../../lib/rag-memory-graph-model.mjs'
export function MemoryExtractStore({children}){
 const [stable,setStable]=useState('yes'),[source,setSource]=useState('yes'),[sensitive,setSensitive]=useState('yes'),[consent,setConsent]=useState('no'),[format,setFormat]=useState('hybrid')
 const formats={profile:['固定profile','読み書きは決定的','schema外を持てない'],memo:['自由記述メモ','柔軟に書ける','矛盾・重複を管理'],vector:['vector検索','言い換えに強い','否定・完全一致を評価'],graph:['関係構造','関係を表現する','実装・保守の負担'],hybrid:['小さいprofile＋メモ','毎回必要な情報は固定','他はmeta付きで検索']}
 const state=memoryExtraction({stable:stable==='yes',sourceRecorded:source==='yes',sensitive:sensitive==='yes',explicitConsent:consent==='yes'})
 return <RagMemoryFigure diagram="memory-extract-store" title="覚える入口、除外基準と保存形式"
 controls={({stage,ready})=>stage===2?<>{[['安定した記憶の基準',stable,setStable],['出所・日時・信頼度',source,setSource],['機微な個人情報',sensitive,setSensitive],['保存への明示的同意',consent,setConsent]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="no">なし</option><option value="yes">あり</option></Select>)}</>:stage===3?<Select label="記憶の保存形式" value={format} onChange={setFormat} ready={ready}>{Object.entries(formats).map(([value,[title]])=><option key={value} value={value}>{title}</option>)}</Select>:null}
 scene={s=><RagMemoryCanvas diagram="memory-extract-store" {...s}>{f=><>
  <Text y={35}>{['検索の前に、何を書くか・いつ捨てるかを設計する','本人の明示と、推論を含む抽出を区分する','会話に出た情報を、そのまま保存許可にしない','保存の強みと、管理する負担を比べる','毎回必要な少量と、必要時に引く情報を分ける'][f.stage]}</Text>
  {f.stage===0?<>
   <Tokens labels={['会話','抽出','保存','想起','会話へ']} y={83} selected={[0,1,2,3,4]}/>
   <Wire id={s.id} d="M320 137V185" active phase={f.phase}/><Box x={112} y={185} width={416} height={100} title="更新・忘却を保存へ戻す" lines={['追記だけで矛盾・陳腐化を増やさない']} tone="teal"/>
   <Wire id={s.id} d="M112 235H20V58H320V75" active phase={f.phase}/><Text y={369} small>全部保存して検索するだけでは、品質と削除は未設計</Text>
  </>:f.stage===1?<>
   {['本人の明示','自動抽出','バッチ振返り'].map((title,i)=><Box key={title} x={32+i*202} y={83} width={172} height={151} title={title} lines={i===0?['意思を登録','高い信頼度']:i===1?['推論を含む','基準を照合']:['文脈が薄れる','統合へ利用']} tone={i===0?'teal':'violet'}/>)}
   <Box x={65} y={300} width={510} height={80} title="出所・日時・信頼度を残す" lines={['訂正・削除・覚えている理由の説明へ']}/>
  </>:f.stage===2?<>
   <Box x={32} y={83} width={260} height={173} title="抽出の基準" lines={['安定事実・好み・決定','一時状態・弱い推測は除外','出所と信頼度を保持']} tone="violet"/>
   <Wire id={s.id} d="M292 169H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={173} title={state.saveCandidate?'保存する候補':'保存せず条件確認'} lines={['機微情報は明示的同意','図は記憶を書かない']} tone={state.saveCandidate?'teal':'amber'} data-memory-save-candidate={String(state.saveCandidate)} data-memory-written="false"/>
   <Text y={359} small>推論を本人の意思へ、自動で昇格しない</Text>
  </>:f.stage===3?<>
   <Box x={100} y={85} width={440} height={149} title={formats[format][0]} lines={formats[format].slice(1)} tone="teal"/>
   <Text y={357} small>graphは関係の質問の具体的な失敗から検討する</Text>
  </>:<>
   <Box x={32} y={83} width={260} height={155} title="毎回使う少量" lines={['役割・好みの上位項目','固定schemaのprofile','常時の文脈消費']} tone="teal"/>
   <Box x={348} y={83} width={260} height={155} title="必要時に引く" lines={['meta付きのメモ','検索と関連度の評価','否定・完全一致も点検']} tone="violet"/>
   <Text y={357} small>保存の形式だけで、想起の品質を保証しない</Text>
  </>}
 </>}</RagMemoryCanvas>}>{children}</RagMemoryFigure>
}
export function MemoryRecallForget({children}){
 const [route,setRoute]=useState('fixed'),[relevant,setRelevant]=useState('no'),[kind,setKind]=useState('preference'),[item,setItem]=useState('yes'),[index,setIndex]=useState('no'),[backup,setBackup]=useState('no'),[derived,setDerived]=useState('no')
 const state=memoryDeletion({itemRemoved:item==='yes',indexRemoved:index==='yes',backupHandled:backup==='yes',derivativesRemoved:derived==='yes'})
 return <RagMemoryFigure diagram="memory-recall-forget" title="想起の下限、訂正と派生物までの削除"
 controls={({stage,ready})=>stage===0?<Select label="記憶を引く経路" value={route} onChange={setRoute} ready={ready}><option value="always">常時注入</option><option value="fixed">固定検索</option><option value="agent">Agentの記憶ツール</option></Select>:stage===1?<Select label="関連度の下限への適合" value={relevant} onChange={setRelevant} ready={ready}><option value="no">該当なし</option><option value="yes">条件に適合</option></Select>:stage===2?<Select label="更新する情報の種別" value={kind} onChange={setKind} ready={ready}><option value="preference">現在の好み</option><option value="decision">過去の決定</option></Select>:stage===4?<>{[['記憶項目の削除',item,setItem],['vector索引の削除',index,setIndex],['backupの削除経路',backup,setBackup],['派生要約の削除',derived,setDerived]].map(([label,value,onChange])=><Select key={label} label={label} value={value} onChange={onChange} ready={ready}><option value="no">未対応</option><option value="yes">対応</option></Select>)}</>:null}
 scene={s=><RagMemoryCanvas diagram="memory-recall-forget" {...s}>{f=><>
  <Text y={35}>{['どの記憶を、いつ文脈へ入れるかを設計する','上位だから常に入れる、を避ける','応答だけでなく、記憶側も訂正する','他ユーザーの記憶を、構造的な境界で分離する','項目の削除だけで、完全削除とは言えない'][f.stage]}</Text>
  {f.stage===0?<>
   <Box x={32} y={83} width={260} height={160} title={{always:'常時注入',fixed:'固定検索',agent:'記憶ツール'}[route]} lines={route==='always'?['少量の安定情報','毎ターン文脈を消費']:route==='fixed'?['入力から関連を検索','該当なしの下限を置く']:['モデルが必要時に引く','遅延・費用も増える']} tone="violet"/>
   <Wire id={s.id} d="M292 164H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={160} title="文脈へ入れる範囲" lines={['必要な記憶を選ぶ','無関係な過去を避ける','注入内容をtraceへ']} tone="teal"/>
  </>:f.stage===1?<>
   <Box x={32} y={83} width={260} height={158} title="検索した上位" lines={['関連度の下限と照合','数値は自社評価で決める']} tone="violet"/>
   <Wire id={s.id} d="M292 163H340" active phase={f.phase}/><Box x={348} y={83} width={260} height={158} title={relevant==='yes'?'注入を検討':'記憶を注入しない'} lines={['注入した内容をtraceへ','抽出側の基準も点検']} tone={relevant==='yes'?'teal':'amber'} data-memory-injection-candidate={String(relevant==='yes')}/>
   <Text y={357} small>生成プロンプトだけで、誤想起を直したとしない</Text>
  </>:f.stage===2?<>
   <Box x={32} y={83} width={260} height={167} title={kind==='preference'?'現在の好み':'過去の決定'} lines={kind==='preference'?['新情報で上書きする','古い好みを残さない']:['有効期間付きの履歴','当時の理由を保持']} tone="teal"/>
   <Box x={348} y={83} width={260} height={167} title="訂正と陳腐化" lines={['応答だけでなく記憶へ','確認・参照日時を保持','本人が編集・削除']} tone="violet"/>
   <Text y={357} small>データ種別ごとに、矛盾の解決規則を決める</Text>
  </>:f.stage===3?<>
   <Box x={32} y={83} width={260} height={160} title="ユーザーの境界" lines={['ストア・索引を分離','またはquery条件を強制','任意filterだけに頼らず']} tone="teal"/>
   <Box x={348} y={83} width={260} height={160} title="説明と選択" lines={['記憶機能を説明','opt-outを用意','機微情報の基準']} tone="violet"/>
   <Text y={357} small>図の条件は、実際の認可を実行しない</Text>
  </>:<>
   <Tokens labels={['記憶項目','vector','backup','派生要約']} y={83} selected={[item,index,backup,derived].flatMap((v,i)=>v==='yes'?[i]:[])}/>
   <Box x={99} y={183} width={442} height={144} title={state.completeCandidate?'削除経路の確認候補':'削除経路が未完了'} lines={['ユーザー・項目単位で対象を追う','図は実データを削除しない']} tone={state.completeCandidate?'teal':'amber'} data-memory-deletion-candidate={String(state.completeCandidate)} data-deletion-executed="false"/>
   <Text y={396} small>画面から消えただけの状態を、完全削除にしない</Text>
  </>}
 </>}</RagMemoryCanvas>}>{children}</RagMemoryFigure>
}
