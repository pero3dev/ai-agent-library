'use client'
import {useState} from 'react'
import {TechniqueFigure,TechniqueCanvas,Text,Box,Wire,Select} from './prompt-techniques-assets-primitives'
export function PromptBasicsInput({children}){
 const [separated,setSeparated]=useState('yes'),[examples,setExamples]=useState('representative')
 return <TechniqueFigure diagram="prompt-basics-input" title="指示・資料・例の役割を分け、判断の条件を具体化する"
  controls={({stage,ready})=>stage===2?<Select label="入力領域の区分" value={separated} onChange={setSeparated} ready={ready}><option value="no">指示と資料が混在</option><option value="yes">指示と資料を区分</option></Select>:stage===3?<Select label="例セットの構成" value={examples} onChange={setExamples} ready={ready}><option value="positive">肯定的な典型例だけ</option><option value="representative">代表・境界・該当なし</option></Select>:null}
  scene={s=><TechniqueCanvas diagram="prompt-basics-input" {...s}>{f=><>
   <Text y={35}>{['汎用技法と、別の正本の責任を読む','出力の条件と、望ましい振る舞いを指定','領域を分けても、認可は別の実装','例は、形式と判断基準の仕様書','必要な例とコストを、評価して選ぶ'][f.stage]}</Text>
   {f.stage===0?<>
    {['汎用：指示・区切り・例・形式','Agent：長期間の原則と境界','依頼と管理：タスク・資産の正本'].map((t,i)=><Box key={t} x={67} y={77+i*104} width={506} height={77} title={t} tone={i===0?'teal':'violet'}/>)}
   </>:f.stage===1?<>
    {['読み手と目的','観点と除外','長さと粒度','未知のときの行動'].map((t,i)=><Box key={t} x={32+i%2*316} y={78+Math.floor(i/2)*122} width={260} height={96} title={t} tone="violet"/>)}
    <Text y={375} small>「適切に」だけにせず、何を判断するかを明示する</Text>
   </>:f.stage===2?<>
    <Box x={67} y={81} width={506} height={121} title={separated==='yes'?'指示の領域':'指示と資料が混ざる'} lines={[separated==='yes'?'目的・制約・出力の条件':'資料内の命令文も混ざり得る']} tone={separated==='yes'?'teal':'amber'}/>
    <Box x={67} y={268} width={506} height={121} title={separated==='yes'?'処理対象の資料':'区分と対応を設計し直す'} lines={['タグだけで認可を強制しない']} tone="violet" data-delimiter-authorizes="false"/>
   </>:f.stage===3?<>
    {['典型の入力','境界の入力','該当なしの入力'].map((t,i)=><Box key={t} x={67} y={77+i*104} width={506} height={77} title={t} tone={i===0||examples==='representative'?'teal':'amber'} active={i===0||examples==='representative'}/>)}
    <Text y={418} small>{examples==='positive'?'肯定だけの偏りと、欠けた条件を確認':'ラベル比率・形式・一貫性も確認'}</Text>
   </>:<>
    <Box x={32} y={81} width={260} height={173} title="例を追加する" lines={['入力tokenが増える','固定部分のcacheを照合','数だけで品質を決めない']} tone="violet"/>
    <Box x={348} y={81} width={260} height={173} title="必要性を評価する" lines={['例なしで足りるか','代表性と境界','条件と結果を測る']} tone="teal"/>
    <Text y={358} small>実token・料金・精度の値を図で生成しない</Text>
   </>}
  </>}</TechniqueCanvas>}>{children}</TechniqueFigure>
}
export function PromptBasicsChain({children}){
 const [model,setModel]=useState('reasoning'),[focus,setFocus]=useState('2'),[target,setTarget]=useState('code')
 return <TechniqueFigure diagram="prompt-basics-chain" title="一段一責務で検証し、モデルと後続の処理へ合わせる"
  controls={({stage,ready})=>stage===0?<Select label="原文の生成と推論の区分" value={model} onChange={setModel} ready={ready}><option value="generation">明示的な中間ステップを検討</option><option value="reasoning">内部で推論するモデル</option></Select>:stage===1?<Select label="原文の分解した段階" value={focus} onChange={setFocus} ready={ready}>{['分類','抽出','変換','要約'].map((t,i)=><option key={t} value={String(i)}>{t}</option>)}</Select>:stage===2?<Select label="出力の後続処理" value={target} onChange={setTarget} ready={ready}><option value="human">人が読む</option><option value="code">コードが処理する</option></Select>:null}
  scene={s=><TechniqueCanvas diagram="prompt-basics-chain" {...s}>{f=><>
   <Text y={35}>{['表示の説明と内部推論を分ける','固定手順の各段を、個別にテストする','お願いする形式と、構造の制御を区分','技法を、自社タスクの評価で比べる','採用理由を残し、モデル更新で再評価'][f.stage]}</Text>
   {f.stage===0?<>
    <Box x={67} y={81} width={506} height={121} title={model==='reasoning'?'目標・制約・成功基準':'検証できる中間ステップ'} lines={['モデルとタスクで方式を照合']} tone="violet"/>
    <Wire id={s.id} d="M320 202V263" active phase={f.phase}/><Box x={67} y={274} width={506} height={107} title="長い説明だけで品質を保証しない" lines={['途中の誤りも後続へ渡り得る']} tone="amber" data-long-explanation-guarantees-quality="false"/>
   </>:f.stage===1?<>
    {['分類','抽出','変換','要約'].map((t,i)=><g key={t}><Box x={38+i*150} y={104} width={114} height={116} title={t} tone={i===Number(focus)?'teal':'violet'} active={i===Number(focus)}/>{i<3&&<Wire id={s.id} d={`M${152+i*150} 162H${180+i*150}`} active phase={f.phase}/>}</g>)}
    <Box x={67} y={291} width={506} height={103} title={`${['分類','抽出','変換','要約'][Number(focus)]}の入出力を検証`} lines={['失敗箇所を分け、段間の受け渡しを確認']} tone="teal"/>
   </>:f.stage===2?<>
    <Box x={67} y={81} width={506} height={120} title={target==='code'?'後続はコード':'後続は人'} lines={[target==='code'?'対応する構造化出力と検証':'見出し・箇条書き等のスタイル']} tone="teal"/>
    <Text y={295} small>「JSONで出力して」だけでは形式を保証しない</Text>
   </>:<>
    {['目標と評価セットを定める','同条件で変更前後を比較','採用理由・結果と版を記録'].map((t,i)=><g key={t}><Box x={67} y={77+i*104} width={506} height={77} title={t} tone={i===2?'teal':'violet'}/>{i<2&&<Wire id={s.id} d={`M320 ${154+i*104}V${172+i*104}`} active phase={f.phase}/>}</g>)}
    <Text y={418} small>{f.stage===4?'モデル更新後にも、公式指針と自社評価を確認':'魔法のフレーズを無検証で残さない'}</Text>
   </>}
  </>}</TechniqueCanvas>}>{children}</TechniqueFigure>
}
