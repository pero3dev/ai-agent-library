'use client'

import { useState } from 'react'
import { Canvas, LearningFigure, Text, Box, Tokens, Wire, Select } from './learning-scene-primitives'

const tasks = [
  ['文章変換', '要約・翻訳・分類', '意味・取りこぼしを照合'],
  ['コード', '生成・説明・修正', '実行・テストで検証'],
  ['計算', '厳密な計算・集計', '独立した計算と照合'],
  ['文字', '文字数・数え上げ', '文字列処理で確認'],
  ['知識', '最新情報・事実', '一次資料に当たる'],
  ['長い手順', '厳密な手順の遂行', '途中結果・既知値を照合']
]
export function CapabilitiesAssessment({ children }) {
  const [task, setTask] = useState('0'), [focus, setFocus] = useState('0')
  const selected = tasks[Number(task)]
  return <LearningFigure diagram="capabilities-assessment" title="能力を条件と検証から見積もる" eyebrow="CAPABILITIES / ASSESSMENT"
    controls={({ stage, ready }) => stage === 1 ? <Select label="評価するタスク" value={task} onChange={setTask} ready={ready}>{tasks.map((t, i) => <option value={i} key={t[0]}>{t[0]}</option>)}</Select>
      : stage === 4 && <Select label="注目する判断" value={focus} onChange={setFocus} ready={ready}>{['厳密さ', '検証可能性', '代表実ケース', '失敗と回復'].map((t, i) => <option value={i} key={t}>{t}</option>)}</Select>}
    scene={state => <Canvas diagram="capabilities-assessment" {...state}>{f => <>
      {f.stage < 2 && <>
        <Text y={35}>{f.stage === 0 ? '自然な文章だけで、能力を判断しない' : selected[1]}</Text>
        <Box x={156} y={80} width={328} title={f.stage === 0 ? 'モデルの出力' : selected[0]} />
        <Wire id={state.id} d="M320 144V174H172V211" active phase={f.phase} /><Wire id={state.id} d="M320 174H468V211" active phase={f.phase} tone="amber" />
        <Box x={32} y={217} width={280} title="流暢さ" lines={['未評価']} height={86} />
        <Box x={328} y={217} width={280} title="正確さ" lines={['未評価・独立検証が必要']} height={86} tone="amber" />
        <Text y={355}>{f.stage === 0 ? '流暢さ ≠ 要求を満たす正確さ' : selected[2]}</Text>
        <Text y={398} small>表の傾向は保証ではない。実入力で確認する</Text>
      </>}
      {f.stage === 2 && <>
        <Text y={35}>道具に移した後も、結果を検証する</Text>
        {[
          ['計算・集計', 'コード・電卓'], ['知識', '検索・RAG'], ['状態変更', 'API・実行制御']
        ].map(([a, b], i) => <g key={a}>
          <Box x={32} y={82 + i * 82} width={174} title={a} height={55} />
          <Wire id={state.id} d={`M206 ${110 + i * 82}H250`} active phase={f.phase + i / 3} />
          <Box x={255} y={82 + i * 82} width={222} title={b} height={55} tone="violet" />
          <Wire id={state.id} d={`M477 ${110 + i * 82}H530V345H320V356`} active phase={f.phase} tone="amber" />
        </g>)}
        <Text y={383}>選択・引数・結果の解釈にも誤りが残る</Text>
      </>}
      {f.stage === 3 && <>
        <Text y={35}>「できた・できない」に条件を付ける</Text>
        <Tokens labels={['日付', 'モデル', '試し方']} y={83} selected={[0, 1, 2]} />
        <Box x={32} y={180} width={280} title="公開ベンチマーク" lines={['ハーネス・汚染に注意']} height={96} tone="violet" />
        <Box x={328} y={180} width={280} title="自社の実ケース" lines={['同じ条件で実測する']} height={96} />
        <Text y={327} small>{['思考量・品質・費用・待ち時間も記録', '新しいモデルや試し方で、再評価する']}</Text>
        <Wire id={state.id} d="M600 285V390H40V140" active phase={f.phase} tone="amber" />
      </>}
      {f.stage === 4 && <>
        <Text y={35}>四つの観点を残して、任せる範囲を決める</Text>
        {[
          ['1. 厳密さ', 'どこに正確さが必須か'], ['2. 検証可能性', '失敗を見つけられるか'],
          ['3. 代表実ケース', '面倒な入力も試す'], ['4. 失敗と回復', '損害・検知・戻し方']
        ].map(([title, detail], i) => <Box key={title} x={32 + (i % 2) * 296} y={80 + Math.floor(i / 2) * 125} width={280} height={98} title={title} lines={[detail]} active={Number(focus) === i} tone={Number(focus) === i ? 'amber' : 'teal'} />)}
        <Text y={363} small>{['10〜20件は初期試行の目安', '統計的な十分性や採否を自動的に決めない']}</Text>
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}
