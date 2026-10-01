'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'
import { worldModelUsage, worldEvaluation } from '../../lib/agent-lineage-model.mjs'

export function WorldModelUsages({ children }) {
  const [usage, setUsage] = useState('combined')
  const [role, setRole] = useState('infrastructure')
  return <AgentConceptFigure diagram="world-model-usages" title="生成・予測・学習基盤の用途と、その重なり"
    controls={({ stage, ready }) => stage === 4 ? <Select label="世界モデルの使う用途" value={usage} onChange={setUsage} ready={ready}>
      <option value="environment">生成環境</option><option value="prediction">行動結果の予測</option><option value="infrastructure">学習・評価基盤</option><option value="combined">用途を結合</option>
    </Select> : stage === 5 && <Select label="評価する役割" value={role} onChange={setRole} ready={ready}>
      <option value="infrastructure">学習・評価基盤</option><option value="policy">行動方策への組込み</option>
    </Select>}
    scene={state => <Canvas diagram="world-model-usages" {...state}>{f => {
      const selected = worldModelUsage(f.stage === 0 || f.stage === 5 ? 'combined' : f.stage === 4 ? usage : ['','environment','prediction','infrastructure'][f.stage])
      return <>
        <Text y={35}>{f.stage === 5 ? '利用する役割で、評価の責務を分ける' : '用途は排他的ではない'}</Text>
        {f.stage === 5 ? <>
          <Box x={180} y={86} width={280} height={86} title={role === 'policy' ? '行動方策へ組み込む' : '学習・評価に使う'} lines={['用途に合わせて評価する']} tone="violet" />
          <Wire id={state.id} d="M320 172V221" active phase={f.phase} tone="amber" />
          {worldEvaluation(role).map((label, i, rows) => <Box key={label} x={32 + i * 576 / rows.length} y={229} width={576 / rows.length - 14} height={91} title={label} tone="amber" />)}
          <Text y={383} small>予測した結果は、実世界の確認済み結果ではない</Text>
        </> : f.stage === 1 ? <>
          <Box x={32} y={95} width={252} height={82} title="生成した環境" lines={['現在の生成状態']} tone="violet" />
          <Wire id={state.id} d="M284 136H347" active phase={f.phase} tone="violet" />
          <Box x={355} y={95} width={252} height={82} title="Agentの行動" lines={['環境の中で試す']} />
          <Wire id={state.id} d="M481 177V260" active phase={f.phase} />
          <Box x={355} y={268} width={252} height={88} title="次の生成状態" lines={['実世界の結果とは別']} tone="violet" />
          <Wire id={state.id} d="M355 312H157V177" active phase={f.phase} dash />
          <Text y={413} small>環境の一貫性・忠実度を別に確かめる</Text>
        </> : f.stage === 2 ? <>
          <Box x={32} y={92} width={240} height={83} title="現在の状態" /><Box x={32} y={237} width={240} height={83} title="候補行動" tone="amber" />
          <Wire id={state.id} d="M272 134H311V188H345" active phase={f.phase} /><Wire id={state.id} d="M272 279H311V221H345" active phase={f.phase} tone="amber" />
          <Box x={353} y={155} width={255} height={111} title="行動結果を予測" lines={['世界モデルを使う', '実際の実行とは分ける']} tone="violet" />
          <Wire id={state.id} d="M480 266V327" active phase={f.phase} tone="violet" /><Box x={353} y={335} width={255} height={65} title="予測した次の状態" tone="violet" />
        </> : f.stage === 3 ? <>
          <Box x={32} y={110} width={260} height={120} title="生成環境・世界モデル" lines={['合成データ・経験を作る']} tone="violet" />
          <Wire id={state.id} d="M292 172H340" active phase={f.phase} />
          <Box x={348} y={110} width={260} height={120} title="学習・評価" lines={['データと環境を利用']} />
          <Box x={90} y={296} width={460} height={87} title="実世界での試行を補う" lines={['忠実度と生成効率を評価する']} tone="amber" />
        </> : <>
          <Box x={208} y={74} width={224} height={63} title="世界モデル" tone="violet" />
          {[
            ['生成環境', 'その中で行動する', selected.environment], ['行動結果', '候補行動から予測', selected.prediction], ['学習・評価', '環境・経験を供給', selected.infrastructure]
          ].map(([title, detail, active], i) => <g key={title} opacity={active ? 1 : .3}>
            <Wire id={state.id} d={`M${268 + i * 52} 137V169H${123 + i * 197}V200`} active={active} phase={f.phase + i * .3} tone={i === 1 ? 'amber' : 'teal'} />
            <Box x={32 + i * 197} y={208} width={182} height={95} title={title} lines={[detail]} tone={i === 1 ? 'amber' : 'teal'} />
          </g>)}
          {f.stage === 4 && <><Wire id={state.id} d="M123 303V337H517V303" active={selected.environment && selected.infrastructure} phase={f.phase} dash /><Text y={370} small>選んだ用途の接続と、評価の責務を確認する</Text></>}
          {f.stage === 0 && <Text y={370} small>環境を作る ／ 次を予測する ／ 学習・評価を支える</Text>}
        </>}
      </>
    }}</Canvas>}>{children}</AgentConceptFigure>
}

export function WorldModelEvidence({ children }) {
  return <AgentConceptFigure diagram="world-model-evidence" title="予測・生成環境と、実際の結果確認を分ける"
    scene={state => <Canvas diagram="world-model-evidence" {...state}>{f => <>
      <Text y={35}>{['まず状態付きサンドボックスで評価する','予測は、承認や結果確認を置き換えない','将来映像と行動の共同生成: 研究例','証拠と、用途・条件を分けて読む'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={111} width={260} height={118} title="実環境のサンドボックス" lines={['状態を持つ環境を用意', '実行して結果を検証']} />
        <Box x={348} y={111} width={260} height={118} title="生成した評価環境" lines={['生成環境を用意', '忠実度・一貫性を評価']} tone="violet" />
        <Text y={323} small>{['本物の環境で足りるかを先に検討', '生成的な環境を使うこと自体が目的ではない']}</Text>
      </> : f.stage === 1 ? <>
        {['候補行動', '予測結果', '承認・実行', '実結果確認'].map((label, i) => <g key={label}><Box x={32 + i * 146} y={149} width={138} height={77} title={label} tone={i === 1 ? 'violet' : i === 2 ? 'amber' : 'teal'} />{i < 3 && <Wire id={state.id} d={`M${170 + i * 146} 187H${172 + i * 146}`} active phase={f.phase} tone={i === 1 ? 'amber' : 'teal'} />}</g>)}
        <Text y={318} small>{['実行する前に結果を予測する', '危険な操作の承認と実結果の確認は残る']}</Text>
      </> : f.stage === 2 ? <>
        <Box x={32} y={100} width={223} height={104} title="現在の観測と指示" lines={['映像 / 目標']} />
        <Wire id={state.id} d="M255 152H300" active phase={f.phase} />
        <Box x={308} y={91} width={300} height={122} title="World Action Model" lines={['将来映像と行動を共同生成']} tone="violet" />
        <Wire id={state.id} d="M398 213V263" active phase={f.phase} tone="violet" /><Wire id={state.id} d="M521 213V263" active phase={f.phase} tone="violet" />
        <Box x={281} y={271} width={185} height={74} title="将来映像" tone="violet" /><Box x={483} y={271} width={125} height={74} title="行動" tone="amber" />
        <Text y={402} small>研究論文・公開研究実装 ≠ 商用一般提供</Text>
      </> : <>
        {['論文・研究実装', '操作できるデモ', '商用の提供条件'].map((label, i) => <Box key={label} x={32 + i * 197} y={90} width={182} height={83} title={label} tone={['violet', 'teal', 'amber'][i]} />)}
        <Text y={230}>それぞれ、示す範囲が違う</Text>
        <Box x={90} y={271} width={460} height={111} title="用途と条件を確認する" lines={['一貫性 / 忠実度 / 実用スケール', '提供形態 / 評価の主体']} />
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
