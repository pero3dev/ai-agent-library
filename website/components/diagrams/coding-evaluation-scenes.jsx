'use client'
import { useState } from 'react'
import { OutcomeFigure,OutcomeCanvas,Text,Box,Wire,Select } from './coding-outcomes-primitives'
import { evaluationComparison } from '../../lib/coding-outcomes-model.mjs'
export function CodingEvaluationExperiment({children}){
  const [condition,setCondition]=useState('same')
  const comparison=evaluationComparison(condition)
  return <OutcomeFigure diagram="coding-evaluation-experiment" title="自社の実タスクと同じ条件で、比較を設計する"
    controls={({stage,ready})=>stage===3?<Select label="候補間で揃えた評価条件" value={condition} onChange={setCondition} ready={ready}><option value="same">情報・依頼・回数制限が同じ</option><option value="prompt">依頼文が違う</option><option value="information">提供する情報が違う</option><option value="attempts">回数制限が違う</option></Select>:null}
    scene={s=><OutcomeCanvas diagram="coding-evaluation-experiment" {...s}>{f=><>
      <Text y={35}>{['ツール選定と、導入によるチームの効果は別の問い','公開スコアが測った条件と、自社の仕事を照合する','機械検査を下限とし、望ましい変更をレビューする','条件差を、ツールの差として読まない','成功だけでなく、人の負荷・時間・費用を記録'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={110} width={260} height={139} title="ツールの比較" lines={['自社タスクへの適合','選定・乗換えの判断']} tone="violet"/><Box x={348} y={110} width={260} height={139} title="導入効果の測定" lines={['チームの成果は改善か','継続・拡大の判断']} tone="teal"/>
        <Text y={346} small>公開ベンチマークだけで、両方の問いに答えない</Text>
      </>:f.stage===1?<>
        {['モデル＋ハーネス','データ汚染の可能性','タスク分布の偏り','自己報告・測定時点'].map((t,i)=><Box key={t} x={32+i%2*316} y={91+Math.floor(i/2)*133} width={260} height={103} title={t} tone={i===1?'amber':'violet'}/>)}
        <Text y={395} small>候補の参考には使う。自社で働く序列は自社で測る</Text>
      </>:f.stage===2?<>
        <Box x={91} y={68} width={458} height={79} title="実際の作業分布のタスク" lines={['バグ・小機能・リファクタ・テスト']} tone="violet"/>
        <Wire id={s.id} d="M320 147V195H162V229" active phase={f.phase}/><Wire id={s.id} d="M320 195H478V229" active phase={f.phase}/>
        <Box x={32} y={237} width={260} height={135} title="機械で判定する下限" lines={['既存・追加のテスト','lint・型検査']} tone="teal"/><Box x={348} y={237} width={260} height={135} title="望ましい変更か確認" lines={['要件が満たされるか','過剰変更がないか']} tone="amber"/>
        <Text y={421} small>テストが通るだけで、望ましい変更と判定しない</Text>
      </>:f.stage===3?<>
        {['提供情報','依頼文','回数制限'].map((t,i)=><g key={t}><Text x={92} y={106+i*72} small>{t}</Text><Box x={172} y={76+i*72} width={180} height={53} title={condition===['information','prompt','attempts'][i]?'候補Aの条件':'同じ条件'} tone="violet"/><Box x={402} y={76+i*72} width={206} height={53} title={condition===['information','prompt','attempts'][i]?'候補Bは異なる':'同じ条件'} tone={condition===['information','prompt','attempts'][i]?'amber':'teal'}/></g>)}
        <Box x={111} y={322} width={418} height={68} title={comparison.comparable?'条件を揃えた比較として測定':'条件差が混在：ツール差と断定しない'} tone={comparison.comparable?'teal':'amber'} data-evaluation-comparable={String(comparison.comparable)}/>
      </>:<>
        {['成功率','人の介入回数','依頼から完了の時間','消費・費用'].map((t,i)=><Box key={t} x={32+i%2*316} y={94+Math.floor(i/2)*131} width={260} height={102} title={t} tone={i===1?'amber':'teal'}/>)}
        <Text y={396} small>同じ成功率でも、実務の負荷と価値は違う</Text>
      </>}
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
export function CodingEvaluationEffects({children}){
  const [evidence,setEvidence]=useState('proxy')
  return <OutcomeFigure diagram="coding-evaluation-effects" title="早い指標と遅い品質を合わせ、更新時に測り直す"
    controls={({stage,ready})=>stage===2?<Select label="導入効果を見る証拠" value={evidence} onChange={setEvidence} ready={ready}><option value="proxy">生成量・満足度だけ</option><option value="outcomes">客観データと品質・介入も確認</option></Select>:null}
    scene={s=><OutcomeCanvas diagram="coding-evaluation-effects" {...s}>{f=><>
      <Text y={35}>{['使い手の差を、導入効果に混ぜない','早く出る指標と、遅れて出る品質を分ける','生成量だけでは、チームへの効果を判定しない','モデル・設定・タスクの更新に合わせ、再測定する'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={103} width={260} height={143} title="同じ人の前後比較" lines={['依頼設計の差を統制','条件の変化も確認']} tone="violet"/><Box x={348} y={103} width={260} height={143} title="ランダム割付" lines={['個人差の偏りを抑える','比較の設計を先に']} tone="teal"/>
        <Text y={346} small>満足度だけでなく、リポジトリ・CIの結果へ照合</Text>
      </>:f.stage===1?<>
        <Box x={32} y={107} width={260} height={145} title="先に観測する指標" lines={['PRまでの時間・介入','提案の受入れ等']} tone="violet"/><Wire id={s.id} d="M292 179H340" active phase={f.phase}/><Box x={348} y={107} width={260} height={145} title="遅れて見る品質" lines={['欠陥・変更失敗','レビュー・保守負荷']} tone="amber"/>
        <Text y={346} small>PRが早く出たことから、品質改善を自動で推論しない</Text>
      </>:f.stage===2?<>
        <Box x={32} y={110} width={260} height={138} title={evidence==='proxy'?'生成量・自己申告':'客観データと品質'} lines={evidence==='proxy'?['コード行数・PR数','満足度アンケート']:['成功・欠陥・介入','手戻りとレビュー負荷']} tone="violet"/>
        <Wire id={s.id} d="M292 179H340" active phase={f.phase}/><Box x={348} y={110} width={260} height={138} title={evidence==='proxy'?'成果の判断には不足':'成果を判断する材料へ'} lines={['結果を確認して判断','改善した値は作らない']} tone={evidence==='proxy'?'amber':'teal'} data-proxy-only={String(evidence==='proxy')} data-improvement-proved="false"/>
        <Text y={346} small>利用量を増やすことを、成果のKPIにしない</Text>
      </>:<>
        {['モデル・ツール更新','同じ条件で再実行','移行基準へ照合'].map((t,i)=><g key={t}><Box x={32+i*197} y={95} width={182} height={111} title={t} tone={i===2?'amber':'violet'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 150H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Wire id={s.id} d="M320 206V272" active phase={f.phase}/><Box x={75} y={280} width={490} height={97} title="評価セット自身も更新する" lines={['陳腐化・易しすぎるタスクを入れ替える']} tone="teal"/>
        <Text y={421} small>四半期・メジャー更新時に、過去の評価を固定しない</Text>
      </>}
    </>}</OutcomeCanvas>}>{children}</OutcomeFigure>
}
