'use client'
import {useId,useState} from 'react'
import {VendorCanvas,VendorFigure,VendorPair,Text,Box,Select,Tokens,ExampleGate,ExampleSelect,MigrationGate,MigrationSelect} from './vendor-prompt-controls-primitives'
import {geminiThinkingGate} from '../../lib/vendor-prompt-controls-model.mjs'
export function GeminiStructureExamples({children}){
 const id=useId(),[markup,setMarkup]=useState('xml'),[example,setExample]=useState('repeated')
 return <VendorFigure diagram="gemini-structure-examples" title="system・一貫した区切り・代表例" scene={({phase})=><VendorCanvas diagram="gemini-structure-examples" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['モデル固有の設計を、カタログと区分する','重要な指示と曖昧語の定義を、先に置く','XMLかMarkdownで、境界を一貫させる','few-shotの推奨と、例の量の評価を合わせる'][stage]}</Text>
  {stage===0?<VendorPair id={id} phase={phase} left={['モデルのカタログ','モデルIDと提供条件','既定と終了予定','原文の確認日を保持']} right={['Gemini固有の設計','例・思考・sampling','入力のモダリティ','対象APIへ照合する']}/>:stage===1?<VendorPair id={id} phase={phase} left={['system instruction','役割・制約・出力','明確で直接な目標','曖昧な用語を定義']} right={['入力と資料','今回の内容を渡す','参照する入力を明示','資料を権限にしない']}/>:stage===2?<>
   <Tokens labels={['役割','制約','文脈','タスク']} y={98} selected={[0,1,2,3]}/>
   <Box x={64} y={231} width={512} height={137} title={markup==='xml'?'XML: 種類ごとのタグで区切る':'Markdown: 節ごとの見出しで区切る'} lines={['どちらも、一貫した境界を使う','望む出力と制約を明示する','区切りの採用だけで保証しない']} tone="violet"/>
  </>:<><Tokens labels={['形式を統一','代表性','数を実験']} y={99} selected={[0,1,2]}/><Text y={219} small>例を増やしすぎると、その例への過学習もある</Text><ExampleGate state={example}/></>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===2?<Select label="区切りの記法" value={markup} onChange={setMarkup} ready={ready}><option value="xml">XMLタグ</option><option value="markdown">Markdown見出し</option></Select>:stage===3?<ExampleSelect state={example} setState={setExample} ready={ready}/>:null}>{children}</VendorFigure>
}
export function GeminiThinkingContext({children}){
 const id=useId(),[thinking,setThinking]=useState('sdk'),[modality,setModality]=useState('image')
 const decision=geminiThinkingGate({sdkTyped:thinking!=='untyped',modelConfirmed:!['sdk','model'].includes(thinking),apiConfirmed:!['sdk','model','api'].includes(thinking),requestValidated:['none','untyped'].includes(thinking)})
 const references={text:['この文書の該当箇所','範囲と出典を結ぶ'],image:['この画像の対象','位置と目的を明示'],audio:['この音声の区間','聴取と目的を明示'],video:['この動画の時間範囲','フレームと目的を明示']}
 return <VendorFigure diagram="gemini-thinking-context" title="思考の受理・出力の検証・入力の参照" scene={({phase})=><VendorCanvas diagram="gemini-thinking-context" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['SDKの型と、対象モデルでの受理を区分する','schemaと業務検証を置き、samplingの世代差を照合する','資料を先に置き、問いと検索の粒度を決める','どの入力を何に使うか、指示側で明示する'][stage]}</Text>
  {stage===0?<g data-gemini-thinking-candidate={String(decision.reviewCandidate)} data-gemini-all-models-compatible="false" data-gemini-request-sent="false">
   <Tokens labels={['SDKの型','モデル','API面','実受理']} y={99} selected={[0,1,2,3]}/>
   <Box x={64} y={232} width={512} height={139} title={decision.reviewCandidate?'対象での対応を照合する候補':'SDKの型だけで対応を確定しない'} lines={['levelと数値budgetを一括化しない','Live等のAPI面も個別に確認','署名はSDKの扱いを照合する']} tone={decision.reviewCandidate?'teal':'amber'}/>
  </g>:stage===1?<VendorPair id={id} phase={phase} arrow={false} left={['JSONの出力契約','型とdescription','深いschemaの拒否','アプリで意味を検証']} right={['samplingの条件','3.xは既定を照合','低温度のloopingに注意','低温度を安全保証にせず']}/>:stage===2?<>
   <Tokens labels={['前置きの資料','転換句','末尾の問い']} y={99} selected={[0,1,2]}/>
   <Box x={64} y={233} width={512} height={136} title="多数箇所の同時検索は、タスクを分けて比較" lines={['cacheは利用条件と費用を照合','文脈の量を品質にしない','必要な範囲の抽出を実測する']} tone="violet"/>
  </>:<>
   <Tokens labels={['text','image','audio','video']} y={98} selected={[['text','image','audio','video'].indexOf(modality)]}/>
   <VendorPair id={id} phase={phase} y={216} left={['指示側で参照',...references[modality],'複数入力の対応を保持']} right={['入力側の条件','対象と範囲を照合','解像度のtoken負担','送信・生成は実行せず']}/>
  </>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===0?<Select label="思考制御の確認状態" value={thinking} onChange={setThinking} ready={ready}><option value="sdk">SDKに型があるだけ</option><option value="model">対象モデルが未確認</option><option value="api">API面が未確認</option><option value="request">実受理が未確認</option><option value="none">必要な対応を照合</option><option value="untyped">型だけに頼らず対応を照合</option></Select>:stage===3?<Select label="明示する入力" value={modality} onChange={setModality} ready={ready}><option value="text">text</option><option value="image">image</option><option value="audio">audio</option><option value="video">video</option></Select>:null}>{children}</VendorFigure>
}
export function GeminiToolMigration({children}){
 const id=useId(),[mode,setMode]=useState('validated'),[api,setApi]=useState('interactions'),[missing,setMissing]=useState('model')
 const modes={auto:['auto','呼出しをモデルが選択','必要な権限は別に照合'],any:['any','呼出しを要求する条件','許可や成功を保証せず'],none:['none','toolを呼ばない条件','使うAPIの対応を確認'],validated:['validated','schemaの条件を照合','業務の意味と許可は別']}
 const apis={generate:['generateContent','従来の呼出し面','使う機能の対応を確認'],interactions:['Interactions','状態を持つAPI面','提供条件と機能を確認'],live:['Live API','音声等の会話面','数値予算を一括変換せず']}
 return <VendorFigure diagram="gemini-tool-migration" title="toolの宣言・履歴・API移行の条件" scene={({phase})=><VendorCanvas diagram="gemini-tool-migration" phase={phase} id={id}>{({stage})=><>
  <Text y={34}>{['関数の型と呼出しモードを、実行権限から区分する','同じモデル名でも、API面の機能を照合する','モデル・契約・回帰・権限をそろえて移行する','過度な補助と例の量を、実タスクで見直す'][stage]}</Text>
  {stage===0?<VendorPair id={id} phase={phase} arrow={false} left={['関数の宣言','目的と強い型付け','副作用と回復の条件','必要なtoolへ絞る']} right={[modes[mode][0],...modes[mode].slice(1),'図はtoolを実行しない']}/>:stage===1?<VendorPair id={id} phase={phase} arrow={false} left={[apis[api][0],...apis[api].slice(1),'全機能互換にはしない']} right={['履歴と署名','SDKの保持を照合','長い手作りCoTを見直す','2.5 Liveの条件は別']}/>:stage===2?<MigrationGate missing={missing}/>:<VendorPair id={id} phase={phase} left={['見直す旧手法','過度な説得とCoT','低温度の常用','大量の類似例']} right={['対応と効果を照合','対象モデル・API','代表例で品質を測る','未確認はTODOを保持']}/>}
 </>}</VendorCanvas>} controls={({stage,ready})=>stage===0?<Select label="原文の呼出しモード" value={mode} onChange={setMode} ready={ready}>{Object.entries(modes).map(([value,labels])=><option key={value} value={value}>{labels[0]}</option>)}</Select>:stage===1?<Select label="移行先のAPI面" value={api} onChange={setApi} ready={ready}>{Object.entries(apis).map(([value,labels])=><option key={value} value={value}>{labels[0]}</option>)}</Select>:stage===2?<MigrationSelect missing={missing} setMissing={setMissing} ready={ready}/>:null}>{children}</VendorFigure>
}
