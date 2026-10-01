'use client'
import { useState } from 'react'
import { PromptFigure,PromptCanvas,Text,Box,Wire,Select } from './prompt-tool-output-primitives'
import { structuredNext } from '../../lib/prompt-tool-output-model.mjs'
const downstream={code:['後続はコード','型・形式を構造化する'],human:['後続は人','読める自由文を使う'],both:['コードと人の両方','構造内に自由文を持たせる']},methods={prompt:['プロンプト指示','逸脱や前置きが混じり得る'],tool:['ツール入力の流用','対応する入力スキーマを使う'],native:['ネイティブ機能','対応する制約と終了状態を確認']}
export function StructuredMethodSchema({children}){
 const [target,setTarget]=useState('code'),[method,setMethod]=useState('native'),[unknown,setUnknown]=useState('yes')
 return <PromptFigure diagram="structured-method-schema" title="形式を揃える方式と、未知を残すスキーマを選ぶ"
  controls={({stage,ready})=>stage===0?<Select label="出力を使う相手" value={target} onChange={setTarget} ready={ready}>{Object.entries(downstream).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===1?<Select label="構造化の方式" value={method} onChange={setMethod} ready={ready}>{Object.entries(methods).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===3?<Select label="enumの未知の経路" value={unknown} onChange={setUnknown} ready={ready}><option value="no">逃げ道がない</option><option value="yes">その他・判定不能を持つ</option></Select>:null}
  scene={s=><PromptCanvas diagram="structured-method-schema" {...s}>{f=><>
   <Text y={35}>{['後続で使う方法から、構造を決める','方式の制御と、対応条件を読む','必要なフィールドだけに絞る','該当しない入力を、無理に分類しない','理由と形式を、処理できる構造へ'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={81} width={506} height={120} title={downstream[target][0]} lines={[downstream[target][1]]} tone="violet"/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="すべてをJSONへ押し込まない" lines={['読む文章と、処理する値を区分']} tone="teal"/>
   </>:f.stage===1?<>
    <Box x={67} y={81} width={506} height={120} title={methods[method][0]} lines={[methods[method][1]]} tone="violet" data-structured-method={method}/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="形式と業務内容は別の検証" lines={['未対応・拒否・生成上限も照合']} tone="teal" data-schema-content-guaranteed="false"/>
   </>:f.stage===2?<>
    <Box x={32} y={81} width={260} height={173} title="巨大な一発構造" lines={['使わないfieldも要求','関心事が混ざる','後半の品質を測る']} tone="amber"/>
    <Wire id={s.id} d="M292 165H340" active phase={f.phase}/><Box x={348} y={81} width={260} height={173} title="最小の構造へ" lines={['必要な値と型','独立した関心事で分割','検証しやすく設計']} tone="teal"/>
    <Text y={358} small>field数や精度の因果を図で実測した結果ではない</Text>
   </>:f.stage===3?<>
    <Box x={67} y={81} width={506} height={120} title="どの分類にも該当しない入力" lines={['既知の近いラベルへ押し込まない']} tone="violet"/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title={unknown==='yes'?'その他・判定不能へ':'逃げ道なし：誤分類のリスク'} lines={['未知分類の割合を監視する']} tone={unknown==='yes'?'teal':'amber'} data-unknown-path={unknown}/>
   </>:<>
    <Box x={32} y={81} width={260} height={174} title="根拠と分類" lines={['reasoning → label','理由を先に置く案','内部思考の保証ではない']} tone="violet"/>
    <Box x={348} y={81} width={260} height={174} title="数値と日付" lines={['金額はnumber型','日時の形式を固定','自由表記の揺れを減らす']} tone="teal"/>
    <Text y={358} small>型が揃っても、合計・参照先・値域は別に確認</Text>
   </>}
  </>}</PromptCanvas>}>{children}</PromptFigure>
}
export function StructuredValidationLoop({children}){
 const [schema,setSchema]=useState('yes'),[business,setBusiness]=useState('no'),[attempt,setAttempt]=useState('0'),state=structuredNext({schemaValid:schema==='yes',businessValid:business==='yes',attempt:Number(attempt)})
 return <PromptFigure diagram="structured-validation-loop" title="形式から業務検証へ進み、違反は上限内で再生成する"
  controls={({stage,ready})=>stage>=1&&stage<=3?<><Select label="スキーマ検証の結果例" value={schema} onChange={setSchema} ready={ready}><option value="no">違反がある</option><option value="yes">通った</option></Select><Select label="業務検証の結果例" value={business} onChange={setBusiness} ready={ready}><option value="no">違反がある</option><option value="yes">通った</option></Select><Select label="原文の試行番号" value={attempt} onChange={setAttempt} ready={ready}>{[0,1,2].map(n=><option key={n} value={String(n)}>{n===0?'初回':'再試行 '+n}</option>)}</Select></>:null}
  scene={s=><PromptCanvas diagram="structured-validation-loop" {...s}>{f=><>
   <Text y={35}>{['出力の完了状態と、型・形式を見る','形式が合っても、業務条件を検証する','違反内容を、次の観測へ返す','初回と再試行を数え、上限で失敗にする','検証を通った結果だけ、後続へ渡す'][f.stage]}</Text>
   {f.stage===0?<>
    {['出力の終了状態','スキーマの型と形式','拒否・上限・未対応を確認'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
   </>:f.stage<=3?<>
    <Box x={32} y={80} width={260} height={108} title="スキーマ" lines={[schema==='yes'?'形式を通った':'形式に違反']} tone={schema==='yes'?'teal':'amber'}/>
    <Box x={348} y={80} width={260} height={108} title="業務の条件" lines={[business==='yes'?'業務検証を通った':'業務条件に違反']} tone={business==='yes'?'teal':'amber'}/>
    <Wire id={s.id} d="M162 188V221H320M478 188V221H320V258" active phase={f.phase}/>
    <Box x={67} y={270} width={506} height={112} title={{use:'検証した結果を後続へ',retry:'違反を添え、上限内で再生成',fail:'上限到達：明示的に失敗'}[state.next]} lines={[`初回＋再試行2回、現在の試行 ${Number(attempt)+1}/3`]} tone={state.next==='fail'?'amber':'teal'} data-structured-next={state.next}/>
    <Text y={418} small>schema準拠は、全内容の正しさを保証しない</Text>
   </>:<>
    <Box x={67} y={80} width={506} height={120} title="スキーマ＋業務検証を通った結果" lines={['形式だけのパースで利用しない']} tone="teal"/>
    <Wire id={s.id} d="M320 200V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="後続処理と、監視へ" lines={['未知分類・再生成率・失敗を測る']} tone="violet"/>
   </>}
  </>}</PromptCanvas>}>{children}</PromptFigure>
}
