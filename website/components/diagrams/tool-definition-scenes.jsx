'use client'
import { useState } from 'react'
import { PromptFigure,PromptCanvas,Text,Box,Wire,Select } from './prompt-tool-output-primitives'
const verbs={get:['単一取得','get_'],search:['検索','search_'],list:['一覧','list_']},details={what:['何をするか','経費精算履歴を検索'],when:['いつ使うか','状況・金額・日付の質問'],cannot:['何ができないか','新規申請・修正・削除は不可'],format:['形式の注意','月をまたぐ照会は月ごと']}
export function ToolDefinitionContract({children}){
 const [verb,setVerb]=useState('search'),[detail,setDetail]=useState('cannot'),[schema,setSchema]=useState('enum')
 return <PromptFigure diagram="tool-definition-contract" title="モデルが選ぶ判断を、名前・説明・入力に配置する"
  controls={({stage,ready})=>stage===1?<Select label="原文の動詞の役割" value={verb} onChange={setVerb} ready={ready}>{Object.entries(verbs).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===2?<Select label="説明の四つの要素" value={detail} onChange={setDetail} ready={ready}>{Object.entries(details).map(([id,[t]])=><option key={id} value={id}>{t}</option>)}</Select>:stage===3?<Select label="入力設計の境界" value={schema} onChange={setSchema} ready={ready}><option value="enum">有限の状態はenum</option><option value="optional">必須と任意</option><option value="format">説明と形式例</option><option value="small">小さい引数と粒度</option></Select>:null}
  scene={s=><PromptCanvas diagram="tool-definition-contract" {...s}>{f=><>
   <Text y={35}>{['定義全体が、選択と呼出しの材料','動詞と対象の語彙を揃える','説明を、判断する四つの要素へ分ける','入力の揺れと捏造を減らす境界','結果とエラーを、次の判断へ返す'][f.stage]}</Text>
   {f.stage===0?<>
    {['名前：動詞と対象','説明：発火条件と限界','入力：型・形式・必須任意'].map((t,i)=><Box key={t} x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>)}
   </>:f.stage===1?<>
    <Box x={67} y={81} width={506} height={120} title={`${verbs[verb][1]} + 対象`} lines={[`${verbs[verb][0]}を表す動詞を、チームで統一`]} tone="violet"/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="関連操作のグループ" lines={['同義の別名を増やさず、役割を区分']} tone="teal"/>
   </>:f.stage===2?<>
    <Box x={67} y={81} width={506} height={120} title={details[detail][0]} lines={[details[detail][1]]} tone="violet"/>
    <Wire id={s.id} d="M320 201V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="search_expenses：照会専用" lines={['申請・変更・削除へ進まない']} tone="teal" data-tool-write-permitted="false"/>
   </>:f.stage===3?<>
    <Box x={32} y={81} width={260} height={169} title={{enum:'有限の状態',optional:'本当の任意値',format:'対象月の形式',small:'モデルの判断境界'}[schema]} lines={{enum:['表記揺れを減らす','enumで固定'],optional:['未知を捏造しない','必須を増やし過ぎない'],format:['説明と形式例','YYYY-MM'],small:['少数の引数','定型処理は内部へ']}[schema]} tone="violet"/>
    <Wire id={s.id} d="M292 165H340" active phase={f.phase}/><Box x={348} y={81} width={260} height={169} title="要求を具体化" lines={['必要な型と条件','内部の複雑さを分離','入力の実検証はコード']} tone="teal"/>
    <Text y={352} small>定義の説明だけで、実行や安全を保証しない</Text>
   </>:<>
    <Box x={67} y={81} width={506} height={121} title="必要な成功フィールド" lines={['無関係な内部メタデータを省く']} tone="violet"/>
    <Wire id={s.id} d="M320 202V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="修正できるエラーと、上限・続き" lines={['次の呼出しを決める観測にする']} tone="teal"/>
   </>}
  </>}</PromptCanvas>}>{children}</PromptFigure>
}
export function ToolResultMaintenance({children}){
 const [error,setError]=useState('useful'),[result,setResult]=useState('limited'),[set,setSet]=useState('focused')
 return <PromptFigure diagram="tool-result-maintenance" title="直せる観測と必要なツールで、選択の負荷を減らす"
  controls={({stage,ready})=>stage===0?<Select label="説明用エラーの形" value={error} onChange={setError} ready={ready}><option value="dump">不透明なエラー</option><option value="useful">修正できる形式説明</option></Select>:stage===1?<Select label="大きな結果の扱い" value={result} onChange={setResult} ready={ready}><option value="dump">全応答を直写し</option><option value="limited">上限と絞込・続き</option></Select>:stage===2?<Select label="ツールセットの範囲" value={set} onChange={setSet} ready={ready}><option value="all">全ツールを常時投入</option><option value="focused">タスクに必要なセット</option></Select>:null}
  scene={s=><PromptCanvas diagram="tool-result-maintenance" {...s}>{f=><>
   <Text y={35}>{['次の修正を決められるエラーにする','打切りと全件取得を同じにしない','定義の重複と選択負荷を調べる','判断の粒度で、定型API処理をまとめる'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={80} width={506} height={128} title={error==='useful'?'monthはYYYY-MMで指定':'エラーが発生しました'} lines={error==='useful'?['違反した形式と修正を示す','原文の形式例：2026-06']:['何が悪いか・直し方が不明','生のスタックだけを返さない']} tone={error==='useful'?'teal':'amber'}/>
    <Wire id={s.id} d="M320 208V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="観測を次の引数へ戻す" lines={['図ではLLMやAPIを呼び出さない']} tone="violet"/>
   </>:f.stage===1?<>
    <Box x={67} y={80} width={506} height={128} title={result==='limited'?'必要な結果を、件数上限付きで返す':'内部APIの全応答を直写し'} lines={result==='limited'?['残りを取る手段・絞込みを示す','打切りを全件完了としない']:['無関係なメタデータで文脈を圧迫','必要情報へ設計し直す']} tone={result==='limited'?'teal':'amber'} data-tool-all-results-retrieved="false"/>
    <Text y={323} small>件数やページングの実測値を図で作らない</Text>
   </>:f.stage===2?<>
    <Box x={67} y={80} width={506} height={120} title={set==='focused'?'タスクに必要なツール':'全ツールを常時投入'} lines={[set==='focused'?'追加前に、役割の重複を確認':'選択ミスと文脈の負荷を増やす']} tone={set==='focused'?'teal':'amber'}/>
    <Wire id={s.id} d="M320 200V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="説明できるかをテスト・評価" lines={['図の表示は実モデルの評価結果ではない']} tone="violet"/>
   </>:<>
    <Box x={32} y={81} width={260} height={174} title="モデルが判断" lines={['操作する目的と範囲','状況と発火条件','結果から次を選ぶ']} tone="violet"/>
    <Box x={348} y={81} width={260} height={174} title="ツール内部" lines={['決定論的な組合せ','入力の検証','上限と回復手段']} tone="teal"/>
    <Text y={358} small>既存サンプル・説明テスト・評価を保守へつなぐ</Text>
   </>}
  </>}</PromptCanvas>}>{children}</PromptFigure>
}
