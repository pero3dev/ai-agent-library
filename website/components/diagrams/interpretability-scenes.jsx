'use client'

import { useState } from 'react'
import { Canvas, LearningFigure, Text, Box, Tokens, Wire, Select, tones } from './learning-scene-primitives'
import { sparseReconstruction } from '../../lib/learning-foundations-model.mjs'

export function InterpretabilityEvidence({ children }) {
  const [intervention, setIntervention] = useState('stop')
  return <LearningFigure diagram="interpretability-evidence" title="観察と因果的な利用を分ける" eyebrow="INTERPRETABILITY / EVIDENCE"
    controls={({ stage, ready }) => stage === 3 && <Select label="比較する介入" value={intervention} onChange={setIntervention} ready={ready}><option value="stop">部品を停止</option><option value="replace">活性を差し替え</option></Select>}
    scene={state => <Canvas diagram="interpretability-evidence" {...state}>{f => <>
      <Text y={35}>{['行動を観察する ／ 内部を調べる', '読める情報と、使った情報は別', '帰属の手がかりを比べる', '同じ入力で一つの部品だけを変える', '候補回路の範囲を保つ'][f.stage]}</Text>
      {f.stage < 2 && <>
        <Box x={32} y={93} width={130} title="入力" /><Box x={207} y={93} width={223} title="内部表現" tone="violet" /><Box x={477} y={93} width={131} title="出力" />
        <Wire id={state.id} d="M162 125H204" active phase={f.phase} /><Wire id={state.id} d="M430 125H474" active phase={f.phase} />
        {f.stage === 1 ? <>
          <Wire id={state.id} d="M318 157V238" active phase={f.phase} tone="amber" />
          <Box x={172} y={244} width={296} title="別に学習するプローブ" lines={['表現から情報を取り出せるか']} height={95} tone="amber" />
          <Text y={393} small>プローブの成功 ≠ 本体の因果的な利用</Text>
        </> : <>
          <Box x={32} y={241} width={278} title="外側：行動評価" lines={['応答・正しさを観察']} height={93} />
          <Box x={329} y={241} width={279} title="内側：機構の分析" lines={['表現・部品・経路を調べる']} height={93} tone="violet" />
          <Text y={393} small>一つの観測だけで説明を確定しない</Text>
        </>}
      </>}
      {f.stage === 2 && <>
        <Text x={32} y={92} anchor="start">注意分布の手がかり</Text>
        <Tokens labels={['入力1', '入力2', '入力3', '入力4']} y={117} selected={[1, 2]} />
        <Text x={32} y={231} anchor="start">別の帰属方法の手がかり</Text>
        <Tokens labels={['入力1', '入力2', '入力3', '入力4']} y={256} selected={[0, 2]} tone="amber" />
        <Text y={365} small>{['どちらも説明を確定する印ではない', '条件を揃えた分析には有用な場合もある']}</Text>
      </>}
      {f.stage === 3 && <>
        {['通常の部品', intervention === 'stop' ? '部品を停止' : '活性を差し替え'].map((label, i) => <g key={label} data-intervention-lane={i}>
          <Box x={32} y={83 + i * 142} width={140} title="同じ入力" />
          <Box x={207} y={83 + i * 142} width={223} title={label} tone={i ? 'coral' : 'teal'} />
          <Box x={477} y={83 + i * 142} width={131} title="出力" lines={['未計測']} height={94} />
          <Wire id={state.id} d={`M172 ${115 + i * 142}H204`} active phase={f.phase} /><Wire id={state.id} d={`M430 ${115 + i * 142}H474`} active phase={f.phase} tone={i ? 'coral' : 'teal'} />
        </g>)}
        <Text y={391} small>差の方向・大きさ・副作用を実際に調べる</Text>
      </>}
      {f.stage === 4 && <>
        <Tokens labels={['A', 'B', '…', 'A', 'B ?']} y={94} selected={[0, 1, 3, 4]} />
        <Wire id={state.id} d="M89 141V190H435V141" active phase={f.phase} />
        <Wire id={state.id} d="M204 141V215H551V141" active phase={f.phase} tone="amber" />
        <Box x={32} y={260} width={576} title="誘導ヘッド：特定のコピー機構の候補" lines={['全モデル・全タスクの説明とは区別']} height={96} tone="violet" />
        <Text y={404} small>観察・介入の条件と、説明できる範囲を記す</Text>
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}

export function InterpretabilitySae({ children }) {
  const [strength, setStrength] = useState('1')
  const model = sparseReconstruction(Number(strength))
  return <LearningFigure diagram="interpretability-sae" title="重なった特徴と疎な再構成" eyebrow="INTERPRETABILITY / SPARSE FEATURES"
    controls={({ stage, ready }) => stage === 2 && <Select label="模式係数 a₄" value={strength} onChange={setStrength} ready={ready}><option value="0">0：不活性</option><option value="1">1</option><option value="2">2</option></Select>}
    scene={state => <Canvas diagram="interpretability-sae" {...state}>{f => <>
      <Text y={35}>{['一つの次元に、複数の特徴', '少数の特徴を同時に使うという仮説', '非負の疎な係数から、近似再構成', '抽出した特徴は、理解の手がかり'][f.stage]}</Text>
      {f.stage < 2 && <>
        <circle cx="320" cy="214" r="98" fill="none" stroke="#6a8097" strokeDasharray="4 5" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const angle = i * Math.PI / 4, active = f.stage === 0 || [0, 3, 6].includes(i)
          const x = 320 + Math.cos(angle) * 113, y = 214 + Math.sin(angle) * 113
          return <g key={i} opacity={active ? 1 : .25}><Wire id={state.id} d={`M320 214L${x} ${y}`} active={active} phase={f.phase + i / 4} tone={i % 2 ? 'violet' : 'teal'} /><Text x={320 + Math.cos(angle) * 145} y={222 + Math.sin(angle) * 145} small>{`f${i + 1}`}</Text></g>
        })}
        <circle cx="320" cy="214" r="12" fill={tones.amber} />
        <Text y={401} small>{f.stage === 0 ? 'ニューロンと概念を一対一に固定しない' : '玩具モデル由来の見方。実測された特徴ではない'}</Text>
      </>}
      {f.stage === 2 && <>
        <Tokens labels={model.coefficients.map((a, i) => `a${i + 1}`)} y={77} selected={model.coefficients.flatMap((a, i) => a > 0 ? [i] : [])} name="coefficients" />
        <Tokens labels={model.coefficients.map(String)} y={136} selected={model.coefficients.flatMap((a, i) => a > 0 ? [i] : [])} name="coefficient-values" />
        <Text y={219}>x ≈ Σ aᵢ dᵢ ／ aᵢ ≥ 0</Text>
        <Box x={32} y={253} width={280} title="非零の方向を合成" lines={['大半の係数は 0']} height={92} />
        <Box x={328} y={253} width={280} title="残差が残る" lines={['元の活性と完全一致しない']} height={92} tone="amber" />
        <Text y={394} small>係数は説明用。特徴の解釈にも検証が必要</Text>
      </>}
      {f.stage === 3 && <>
        <Box x={115} y={91} width={410} title="疎な特徴・説明の候補" lines={['仮説づくり・異常検知・監査の補助']} height={98} />
        <path d="M32 244H608" stroke={tones.coral} strokeWidth="2" strokeDasharray="6 6" />
        <Text y={233} small>未解決の境界</Text>
        <Tokens labels={['網羅性', '評価', '規模']} y={275} selected={[]} />
        <Text y={378}>{['完全な機構理解・安全性の保証', 'には、そのままつながらない']}</Text>
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}
