'use client'
import {useState} from 'react'
import {TechniqueFigure,TechniqueCanvas,Text,Box,Wire,Select} from './prompt-techniques-assets-primitives'
export function PromptPatternLayout({children}){
 const [aspect,setAspect]=useState('cache'),[placement,setPlacement]=useState('after'),[order,setOrder]=useState('first'),[dynamic,setDynamic]=useState('static'),aspects={cache:'前方一致のcache',position:'配置による品質差',reference:'指示と資料の参照'}
 return <TechniqueFigure diagram="prompt-pattern-layout" title="配置の三つの観点と、例の選択・順序を比較する"
  controls={({stage,ready})=>stage===0?<Select label="配置を見る観点" value={aspect} onChange={setAspect} ready={ready}>{Object.entries(aspects).map(([id,t])=><option key={id} value={id}>{t}</option>)}</Select>:stage===1?<Select label="指示と資料の配置例" value={placement} onChange={setPlacement} ready={ready}><option value="before">指示を資料の前へ</option><option value="after">指示を資料の後へ</option></Select>:stage===3?<Select label="同じ例セットの順序例" value={order} onChange={setOrder} ready={ready}><option value="first">代表→境界→否定</option><option value="second">否定→代表→境界</option></Select>:stage===4?<Select label="例の選び方" value={dynamic} onChange={setDynamic} ready={ready}><option value="static">固定した例セット</option><option value="dynamic">入力に合わせて検索</option></Select>:null}
  scene={s=><TechniqueCanvas diagram="prompt-pattern-layout" {...s}>{f=><>
   <Text y={35}>{['cache・品質・参照を、同時に設計する','固定部分と、品質を測る配置を分ける','例の代表性とラベル分布を確認する','順序を変え、同条件で複数回比較する','検索した例は可変部分と故障点になる'][f.stage]}</Text>
   {f.stage===0?<>
    {Object.entries(aspects).map(([id,t],i)=><Box key={id} x={67} y={77+i*104} width={506} height={77} title={t} tone={id===aspect?'teal':'violet'} active={id===aspect}/>)}
   </>:f.stage===1?<>
    {['固定の役割・制約',...(placement==='before'?['直近の指示','タスクの資料']:['タスクの資料','直近の指示'])].map((t,i)=><Box key={t} x={67} y={77+i*104} width={506} height={77} title={t} tone={i===0?'violet':'teal'}/>)}
    <Text y={418} small>最良の配置や実cacheヒットを図で確定しない</Text>
   </>:f.stage===2?<>
    <Box x={32} y={81} width={260} height={174} title="例の仕様" lines={['分布の代表','境界と否定','形式の一貫性']} tone="violet"/>
    <Box x={348} y={81} width={260} height={174} title="判断の条件" lines={['ラベル比率を確認','役割に基準と読者像','数だけで精度を決めない']} tone="teal"/>
    <Text y={358} small>区切りのescapeと参照を設計する。認可は別の制御</Text>
   </>:f.stage===3?<>
    {(order==='first'?['代表','境界','否定']:['否定','代表','境界']).map((t,i)=><Box key={t} x={32+i*204} y={106} width={168} height={112} title={t} tone={t==='境界'?'amber':'teal'}/>)}
    <Box x={67} y={291} width={506} height={103} title="順序と形式の感度を評価" lines={['最後の例が常に形式を決める規則はない']} tone="violet"/>
   </>:<>
    <Box x={67} y={81} width={506} height={120} title={dynamic==='static'?'固定した代表的な例':'入力に合わせて検索した例'} lines={[dynamic==='static'?'静的な例で足りるかを先に測る':'可変部分と検索品質を確認']} tone="violet"/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="cache条件と、出力品質を別々に測る" lines={['検索は新たな故障点になり得る']} tone="teal"/>
   </>}
  </>}</TechniqueCanvas>}>{children}</TechniqueFigure>
}
const longPaths={full:['全文と引用','引用の正確性と支持関係を検証'],map:['分割して統合','境界の喪失・重複・矛盾を検証'],rolling:['要約を持ち回る','初期誤りの増幅と節目の見直し']}
export function PromptPatternVerification({children}){
 const [output,setOutput]=useState('tokens'),[long,setLong]=useState('map'),[input,setInput]=useState('broken'),outputModes={prefill:['応答の書き出し','モデル別の対応と形式を照合'],stop:['停止シーケンス','余計な続きの停止を指定'],schema:['構造化出力','機械処理の形式を制御'],tokens:['最大token','打切りであり、文章長さの指定ではない']}
 return <TechniqueFigure diagram="prompt-pattern-verification" title="長文と崩れた入力の失敗を分け、効果を検証する"
  controls={({stage,ready})=>stage===1?<Select label="原文の出力制御" value={output} onChange={setOutput} ready={ready}>{Object.entries(outputModes).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===2?<Select label="長文を処理する経路" value={long} onChange={setLong} ready={ready}>{Object.entries(longPaths).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===3?<Select label="頑健性を調べる入力" value={input} onChange={setInput} ready={ready}><option value="paraphrase">同じ意図の言い換え</option><option value="broken">欠け・誤字・混在・空入力</option><option value="instruction">資料の中の命令文</option></Select>:null}
  scene={s=><TechniqueCanvas diagram="prompt-pattern-verification" {...s}>{f=><>
   <Text y={35}>{['説明や自己修正を、照合できる基準へ戻す','内容品質と、形式・停止・打切りを区分','資料の性質から経路と失敗を読む','きれいな入力だけで確認を終えない','個別と組合せの寄与を切り分ける','未使用の判定と、更新後の再評価へ'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={81} width={506} height={120} title="自己修正の候補" lines={['表示の説明だけで正しさを判断しない']} tone="violet"/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="検証できる基準と照合" lines={['基準のない再考は正解を壊す場合もある']} tone="amber" data-self-correction-guaranteed="false"/>
   </>:f.stage===1?<>
    <Box x={67} y={81} width={506} height={120} title={outputModes[output][0]} lines={[outputModes[output][1]]} tone="violet"/>
    <Box x={67} y={268} width={506} height={121} title="プロンプトは内容の条件を設計" lines={['機能の対応を別モデルへ一般化しない']} tone="teal" data-max-tokens-is-length="false"/>
   </>:f.stage===2?<>
    <Box x={67} y={81} width={506} height={120} title={longPaths[long][0]} lines={[longPaths[long][1]]} tone="violet"/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title={long==='map'?'重なりと統合時の矛盾解決':long==='rolling'?'節目で全体を見直す':'引用を回答と照合する'} lines={['全部渡す必要性も文脈設計で確認']} tone="teal"/>
   </>:f.stage===3?<>
    <Box x={67} y={81} width={506} height={120} title={input==='paraphrase'?'同じ意図の別表現':input==='broken'?'解析できない・不完全な入力':'データ内の命令文'} lines={[input==='broken'?'推測で正常にせず、失敗の経路を定める':'意図とデータを分け、実際の挙動を検証']} tone="violet"/>
    <Text y={303} small>指示での分離は防御の一層。構造的な境界を確認</Text>
   </>:<>
    {['一変更・要素除去で比較','同じ評価セットで複数回','未使用の判定・更新後の再評価'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>{f.stage===5?'採用したパターンと、条件・結果を記録する':'もっともらしい説明は、因果関係の証明ではない'}</Text>
   </>}
  </>}</TechniqueCanvas>}>{children}</TechniqueFigure>
}
