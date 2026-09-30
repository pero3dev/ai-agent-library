'use client'

import { useState } from 'react'
import { Canvas, LearningFigure, Text, Box, Tokens, Wire, Select } from './learning-scene-primitives'
import { demonstrationOrder } from '../../lib/learning-foundations-model.mjs'

export function IclHypotheses({ children }) {
  return <LearningFigure diagram="icl-hypotheses" title="重みを固定した三つの説明" eyebrow="ICL / HYPOTHESES"
    scene={state => <Canvas diagram="icl-hypotheses" {...state}>{f => <>
      <Box x={32} y={18} width={576} title="モデルの重みは固定" height={50} tone="violet" />
      {f.stage === 0 && <>
        <Tokens labels={['例1', '例2', '例3', '新入力']} y={108} selected={[3]} />
        <Wire id={state.id} d="M320 155V207" active phase={f.phase} />
        <Box x={160} y={212} width={320} title="同じモデルの順伝播" lines={['文脈を条件に出力する']} height={95} />
        <Text y={367}>{['文脈は変わる', '重みの更新経路はない']}</Text>
      </>}
      {f.stage === 1 && <>
        <Text y={111}>暗黙のベイズ推定という仮説</Text>
        <Box x={32} y={146} width={155} title="入力例" height={83} />
        <Box x={229} y={146} width={179} title="潜在タスク θ" lines={['事後分布']} height={83} tone="amber" />
        <Box x={451} y={146} width={157} title="出力予測" lines={['周辺化']} height={83} />
        <Wire id={state.id} d="M187 187H226" active phase={f.phase} /><Wire id={state.id} d="M408 187H448" active phase={f.phase + .3} />
        <Text y={290} small>{['p(θ | プロンプト) で候補を重み付け', '各候補の出力予測を積分してまとめる']}</Text>
        <Text y={380}>潜在タスク θ ≠ モデルの重み</Text>
      </>}
      {(f.stage === 2 || f.stage === 3) && <>
        <Text y={111}>学習則の模倣という仮説</Text>
        <Box x={32} y={132} width={140} title="入力例" height={61} />
        <Box x={209} y={132} width={220} title="内部表現の更新" height={61} tone="amber" />
        <Box x={467} y={132} width={141} title="出力" height={61} />
        <Wire id={state.id} d="M172 162H206" active phase={f.phase} /><Wire id={state.id} d="M429 162H464" active phase={f.phase} />
        {f.stage === 3 ? <>
          <Text y={242}>誘導ヘッドという候補</Text>
          <Tokens labels={['A', 'B', '…', 'A', 'B ?']} y={268} selected={[0, 1, 3, 4]} />
          <Wire id={state.id} d="M89 318V345H435V318" active phase={f.phase} />
          <Wire id={state.id} d="M204 318V368H551V318" active phase={f.phase} tone="amber" />
          <Text y={408} small>コピー経路も、全ICLを説明する証明ではない</Text>
        </> : <>
          <Box x={70} y={260} width={500} title="変わるのは順伝播内の状態" lines={['推論中に重みを再学習しない']} height={92} tone="violet" />
          <Text y={399} small>単純なタスクなど、研究条件に依存する見方</Text>
        </>}
      </>}
      {f.stage === 4 && <>
        <Text y={111}>排他的な三択ではなく、異なる観点</Text>
        {['ベイズ的な推論', '学習則の模倣', '誘導ヘッド'].map((label, i) => <g key={label}>
          <Box x={32} y={143 + i * 72} width={310} title={label} height={52} tone={['teal', 'amber', 'violet'][i]} />
          <Wire id={state.id} d={`M342 ${169 + i * 72}H398V241H437`} active phase={f.phase + i / 3} tone={['teal', 'amber', 'violet'][i]} />
        </g>)}
        <Box x={441} y={203} width={168} title="同じ ICL" height={77} />
        <Text y={394} small>相補的な候補。確定した万能の説明ではない</Text>
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}

export function IclDemonstrations({ children }) {
  const [axis, setAxis] = useState('order'), [order, setOrder] = useState('reverse'), [count, setCount] = useState('2')
  const labels = demonstrationOrder(axis, axis === 'order' ? order : count)
  return <LearningFigure diagram="icl-demonstrations" title="例の形式・数・順序を分けて比べる" eyebrow="ICL / DEMONSTRATIONS"
    controls={({ stage, ready }) => stage > 0 && <>
      <Select label="比較する軸" value={axis} onChange={setAxis} ready={ready}><option value="order">順序だけ</option><option value="count">例数だけ</option></Select>
      {axis === 'order' ? <Select label="例の順序" value={order} onChange={setOrder} ready={ready}><option value="original">元の順序</option><option value="reverse">逆順</option><option value="rotate">一つずらす</option></Select>
        : <Select label="例数" value={count} onChange={setCount} ready={ready}>{[2, 3, 4].map(i => <option key={i} value={i}>{i}件</option>)}</Select>}
    </>}
    scene={state => <Canvas diagram="icl-demonstrations" {...state}>{f => <>
      <Text y={35}>{f.stage === 0 ? '一つの例が伝える、複数の情報' : `変更するのは ${axis === 'order' ? '順序' : '例数'} だけ`}</Text>
      <Tokens labels={['A', 'B', 'C', 'D']} y={81} selected={[0, 1, 2, 3]} name="baseline" />
      {f.stage === 0 ? <>
        {['出力形式', 'ラベル空間', '入力分布'].map((label, i) => <Box key={label} x={32 + i * 198} y={200} width={181} title={label} tone={['teal', 'amber', 'violet'][i]} />)}
        <Wire id={state.id} d="M320 128V171H122V197" active phase={f.phase} /><Wire id={state.id} d="M320 171V197" active phase={f.phase} /><Wire id={state.id} d="M320 171H518V197" active phase={f.phase} />
        <Text y={335} small>{['ラベルの正しさだけで効き方は決まらない', '「ラベルは不要」という推奨でもない']}</Text>
      </> : <>
        <Text x={32} y={184} anchor="start" small>変更後（同じ例IDを保つ）</Text>
        <Tokens labels={labels} y={207} width={labels.length * 144} selected={labels.map((_, i) => i)} tone="amber" name="variant" />
        {f.stage === 2 ? <>
          <Box x={32} y={300} width={280} title="元条件：未計測" height={64} />
          <Box x={328} y={300} width={280} title="変更後：未計測" height={64} tone="amber" />
          <Text y={404} small>同じ評価入力・基準で比較する</Text>
        </> : <Text y={324} small>{['順序比較では集合を変えない', '例数比較では残す例の順序を変えない', '増やせば常に良くなるとは限らない']}</Text>}
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}

export function IclMemoryEvaluation({ children }) {
  return <LearningFigure diagram="icl-memory-evaluation" title="記憶・汎化・汚染を分ける" eyebrow="ICL / MEMORY & EVALUATION"
    scene={state => <Canvas diagram="icl-memory-evaluation" {...state}>{f => <>
      <Text y={35}>{['二つの集合を別々に評価', '同じ記号列の一致を調べる', '記憶・時間・規模は異なる観点', '訓練での改善から汎化を即断しない', '訓練と評価の重なりを確認'][f.stage]}</Text>
      {f.stage === 2 ? <>
        <Box x={32} y={72} width={576} title="逐語記憶：訓練の A B → 出力の A B" lines={['同じ記号の一致 ≠ 未見データへの汎化']} height={90} />
        <Box x={32} y={190} width={280} title="grokking" lines={['軸：学習時間', '汎化が遅れて現れる']} height={127} tone="amber" />
        <Box x={328} y={190} width={280} title="二重降下" lines={['軸：規模・データ量', '誤差が非単調になる']} height={127} tone="violet" />
        <Text y={378} small>{['どの学習でも起きる現象ではない', '模式的な関係であり、実測曲線ではない']}</Text>
      </> : <>
        <Box x={32} y={86} width={265} title="訓練で見た集合" lines={[f.stage === 1 ? 'A B' : '訓練データ']} height={98} />
        <Box x={343} y={86} width={265} title={f.stage === 4 ? '評価用の集合' : '未見の集合'} lines={[f.stage === 4 ? '混入がないか確認' : 'テストデータ']} height={98} tone="violet" />
        {f.stage === 4 ? <>
          <path d="M278 109H361V163H278Z" fill="#f1c27e" opacity=".2" stroke="#f1c27e" strokeWidth="2" />
          <Text y={224} small>重複があると、解く代わりに思い出せる可能性</Text>
          <Tokens labels={['非公開', '新しいデータ', '汚染検査']} y={264} selected={[0, 1, 2]} />
          <Text y={367} small>{['高スコアの意味を条件とともに読む', 'この図は実データの混入を検出していない']}</Text>
        </> : <>
          <Wire id={state.id} d="M164 184V247" active phase={f.phase} /><Wire id={state.id} d="M475 184V247" active phase={f.phase} tone="violet" />
          <Box x={32} y={253} width={265} title={f.stage === 1 ? '出力 A B' : '訓練側の指標'} lines={[f.stage === 1 ? '逐語的な一致' : '未計測']} height={90} />
          <Box x={343} y={253} width={265} title="汎化の評価" lines={['別途確認・未計測']} height={90} tone="violet" />
          <Text y={393} small>訓練側の結果を、テスト側へコピーしない</Text>
        </>}
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}
