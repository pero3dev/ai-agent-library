'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'
import { delegatedExecution } from '../../lib/agent-design-model.mjs'

export function DelegationBoundaries({ children }) {
  const [approval, setApproval] = useState('waiting')
  const boundary = delegatedExecution(approval)
  return <AgentConceptFigure diagram="delegation-boundaries" title="子の文脈と、実行権限の境界を分ける"
    controls={({ stage, ready }) => stage === 4 && <Select label="危険なツールの承認" value={approval} onChange={setApproval} ready={ready}>
      <option value="waiting">承認待ち</option><option value="approved">承認済み</option><option value="denied">拒否</option>
    </Select>}
    scene={state => <Canvas diagram="delegation-boundaries" {...state}>{f => <>
      <Text y={35}>{['一つのループに、文脈とツールを集める','探索内容を子に置き、結果を親へ返す','独立した作業を、別の文脈で同時に進める','指示とツールを、作業に合わせて分ける','文脈の分離とは別に、実行を承認で制御する','子は親の全履歴を知っているとは限らない','子の完了から、親の統合へ'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <rect x="66" y="80" width="508" height="304" rx="18" className="ac-boundary" />
        <Text y={116}>一つのコンテキスト</Text>
        <Box x={92} y={156} width={205} height={92} title="Agentループ" lines={['判断 → 実行 → 観測']} tone="violet" />
        <Wire id={state.id} d="M297 202H340" active phase={f.phase} />
        <Box x={348} y={156} width={199} height={92} title="ツール群" lines={['同じ文脈で扱う']} />
        <Text y={323} small>まずプロンプト・ツール・検索を改善する</Text>
      </> : f.stage === 4 ? <>
        <Box x={32} y={85} width={252} height={92} title="子Agentの文脈" lines={['危険なツールを持つ範囲']} tone="violet" />
        <Wire id={state.id} d="M284 131H352" active phase={f.phase} tone="violet" />
        <Box x={360} y={85} width={248} height={92} title="アプリ側の承認" lines={[boundary.label]} tone="amber" data-approval={approval} />
        <g data-delegated-execution={String(boundary.execute)}>
          <Wire id={state.id} d="M483 177V245" active={boundary.execute} phase={f.phase} tone="amber" />
          <Box x={360} y={253} width={248} height={85} title="危険なツール実行" active={boundary.execute} tone={boundary.execute ? 'teal' : 'coral'} />
        </g>
        <Text x={159} y={257} small>{['子を分けることだけで', '権限は強制されない']}</Text>
        <Text y={391} small>{boundary.execute ? '承認境界を通過してから実行する' : '待機・拒否の要求を、そのまま実行しない'}</Text>
      </> : <>
        <rect x="176" y="68" width="288" height="90" rx="14" className="ac-boundary" />
        <Box x={194} y={80} width={252} height={65} title="親の文脈・ループ" tone="violet" />
        <Wire id={state.id} d="M265 158V186H173V207" active phase={f.phase} tone="violet" />
        <Wire id={state.id} d="M375 158V186H467V207" active phase={f.phase + .5} tone="violet" />
        <Text x={320} y={179} small>委譲情報</Text>
        {f.stage === 5 && <><Text x={102} y={95} small>{['目的', '制約']}</Text><Text x={538} y={95} small>{['出力形式', '完了条件']}</Text></>}
        {[0, 1].map(i => <g key={i}>
          <rect x={32 + i * 294} y="217" width="280" height="111" rx="14" className="ac-boundary" />
          <Box x={43 + i * 294} y={229} width={258} height={87} title={f.stage === 3 ? ['調査役', '執筆役'][i] : `子${i + 1}: 独立した文脈`} lines={[f.stage === 3 ? ['調査用の指示・ツール', '執筆用の指示・ツール'][i] : f.stage === 2 ? '独立サブタスクを同時実行' : '探索の履歴はここに置く']} />
          <Wire id={state.id} d={`M${173 + i * 294} 328V351H${265 + i * 110}V365`} active={f.stage === 1 || f.stage === 6} phase={f.phase + i * .5} />
        </g>)}
        <Box x={194} y={371} width={252} height={51} title={f.stage === 6 ? '統合・矛盾チェック' : '親へ結果を返す'} tone={f.stage === 6 ? 'amber' : 'violet'} />
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

export function DelegationPatterns({ children }) {
  const [signal, setSignal] = useState('0')
  return <AgentConceptFigure diagram="delegation-patterns" title="基本形と、分割を検討するシグナル"
    controls={({ stage, ready }) => stage === 4 && <Select label="分割を検討するシグナル" value={signal} onChange={setSignal} ready={ready}>
      <option value="0">圧縮で追いつかない文脈</option><option value="1">矛盾する役割要求</option><option value="2">独立した並列作業</option><option value="3">権限を分離する理由</option>
    </Select>}
    scene={state => <Canvas diagram="delegation-patterns" {...state}>{f => <>
      {f.stage === 0 ? <>
        <Text y={35}>親が分解・委譲し、結果を統合する</Text>
        <Box x={190} y={73} width={260} height={64} title="親Agent" tone="violet" />
        {[0, 1, 2].map(i => <g key={i}>
          <Wire id={state.id} d={`M${260 + i * 60} 137V171H${123 + i * 197}V201`} active phase={f.phase + i * .3} tone="violet" />
          <Box x={32 + i * 197} y={208} width={182} height={65} title={['調査A', '調査B', '検証'][i]} />
          <Wire id={state.id} d={`M${123 + i * 197} 273V308H${260 + i * 60}V337`} active phase={f.phase + i * .3} />
        </g>)}
        <Box x={190} y={344} width={260} height={65} title="統合・矛盾チェック" tone="amber" />
      </> : f.stage === 1 ? <>
        <Text y={35}>結果と必要な制約を、次の文脈へ渡す</Text>
        {['調査', '執筆', '校閲'].map((label, i) => <g key={label}>
          <rect x={23 + i * 202} y="144" width="188" height="142" rx="14" className="ac-boundary" />
          <Box x={32 + i * 202} y={166} width={170} height={94} title={label} lines={['独立した文脈']} tone={i === 1 ? 'violet' : 'teal'} />
          {i < 2 && <Wire id={state.id} d={`M${211 + i * 202} 213H${219 + i * 202}`} active phase={f.phase} />}
        </g>)}
        <Text y={351} small>次段が親の会話履歴を自動で知るわけではない</Text>
      </> : f.stage === 2 ? <>
        <Text y={35}>生成と批評を、別の文脈へ</Text>
        <Box x={32} y={140} width={250} height={94} title="生成Agent" lines={['作る']} tone="violet" />
        <Wire id={state.id} d="M282 185H351" active phase={f.phase} />
        <Box x={360} y={140} width={248} height={94} title="批評Agent" lines={['評価する']} tone="amber" />
        <Wire id={state.id} d="M484 234V287H157V234" active phase={f.phase} tone="amber" dash />
        <Text y={318} small>評価結果を次の修正へ</Text>
        <Text y={386} small>品質条件・回数上限・改善幅で止める</Text>
      </> : <>
        <Text y={35}>{f.stage === 3 ? '品質が低いだけなら、原因を先に切り分ける' : '分割の必要と代償を、同時に確認する'}</Text>
        {['文脈', '役割', '独立作業', '権限'].map((label, i) => <g key={label} opacity={f.stage === 3 || Number(signal) === i ? 1 : .3}>
          <Box x={32 + i * 146} y={91} width={138} height={65} title={label} tone={i === 3 ? 'amber' : 'violet'} />
        </g>)}
        <Box x={88} y={222} width={464} height={90} title={f.stage === 3 ? 'シングルの改善' : ['履歴の圧縮で足りない', '役割の矛盾を分ける', '依存しない作業を分ける', 'ツール権限の境界を強制'][Number(signal)]} lines={[f.stage === 3 ? 'プロンプト / ツール定義 / 検索品質' : '目的と境界が明確になってから分割を検討']} />
        <Text y={368} small>{['文脈断絶 / 統合 / 追跡 / 費用', 'Agentを増やすだけで品質は保証されない']}</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
