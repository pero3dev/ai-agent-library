'use client'

import { AgentConceptFigure, Canvas, Text, Box, Wire } from './agent-concepts-primitives'

export function AiDesignLineage({ children }) {
  return <AgentConceptFigure diagram="ai-design-lineage" title="年表ではなく、賢さの源の移動を追う"
    scene={state => <Canvas diagram="ai-design-lineage" {...state}>{f => <>
      <Text y={35}>何を学ばせ、何を使い回すか</Text>
      {['賢さの源', 'ルールと学習', '特徴を学ぶ', 'Transformer', '基盤の再利用', '指示と対話', 'ツールとループ', '判断の教訓'].map((label, i) => <g key={label}>
        <rect x="22" y={65 + i * 42} width="193" height="36" rx="8" fill={f.stage === i ? '#214941' : '#101e2e'} stroke={f.stage === i ? '#74e3cf' : '#2e4558'} />
        <Text x={35} y={90 + i * 42} anchor="start" small>{`${i + 1}  ${label}`}</Text>
      </g>)}
      {f.stage === 0 ? <>
        {[
          ['人が記述', 'ルール・知識を書き込む'], ['データから学習', '規則性・特徴を学ばせる'], ['基盤を再利用', '多くの用途へ適応する']
        ].map(([title, detail], i) => <g key={title}><Box x={250} y={75 + i * 108} width={358} height={81} title={title} lines={[detail]} tone={['amber', 'teal', 'violet'][i]} />{i < 2 && <Wire id={state.id} d={`M430 ${156 + i * 108}V${177 + i * 108}`} active phase={f.phase} tone="violet" />}</g>)}
      </> : f.stage === 1 ? <>
        <Text x={429} y={88} small>ルールを記述する</Text>
        <Box x={250} y={108} width={146} height={66} title="人の知識" tone="amber" /><Wire id={state.id} d="M396 141H448" active phase={f.phase} tone="amber" /><Box x={456} y={108} width={152} height={66} title="明示ルール" tone="amber" />
        <Text x={429} y={231} small>規則性を学ばせる</Text>
        <Box x={250} y={251} width={146} height={66} title="データ" /><Wire id={state.id} d="M396 284H448" active phase={f.phase} /><Box x={456} y={251} width={152} height={66} title="学習モデル" />
        <Text x={429} y={375} small>重心が変わっても、組合せは残る</Text>
      </> : f.stage === 2 ? <>
        <Box x={250} y={93} width={358} height={79} title="人が特徴量を設計" lines={['何を手がかりにするか']} tone="amber" active={false} />
        <Wire id={state.id} d="M430 172V218" active phase={f.phase} tone="violet" />
        <Box x={250} y={226} width={358} height={105} title="多層のネットワーク" lines={['手がかりの発見も学習する', 'データと計算の規模へ']} />
      </> : f.stage === 3 || f.stage === 4 ? <>
        <Box x={250} y={79} width={358} height={85} title={f.stage === 3 ? '大規模な並列学習' : 'データ / パラメータ / 計算'} lines={[f.stage === 3 ? 'Transformer＋事前学習' : '規模を上げて事前学習']} />
        <Wire id={state.id} d="M430 164V208" active phase={f.phase} />
        <Box x={287} y={216} width={284} height={65} title="汎用的な基盤" tone="violet" />
        <Wire id={state.id} d="M378 281V312H327V333" active phase={f.phase} tone="violet" /><Wire id={state.id} d="M481 281V312H532V333" active phase={f.phase} tone="violet" />
        <Box x={250} y={340} width={154} height={59} title="用途A" tone="violet" /><Box x={456} y={340} width={152} height={59} title="用途B" tone="violet" />
      </> : f.stage === 5 ? <>
        {[
          ['事前学習の基盤', '続きを生成する'], ['指示チューニング', '指示 → 望ましい応答'], ['選好調整', '好みを反映して対話へ']
        ].map(([title, detail], i) => <g key={title}><Box x={250} y={75 + i * 109} width={358} height={82} title={title} lines={[detail]} tone={['teal', 'violet', 'amber'][i]} />{i < 2 && <Wire id={state.id} d={`M430 ${157 + i * 109}V${178 + i * 109}`} active phase={f.phase} />}</g>)}
      </> : f.stage === 6 ? <>
        <Box x={250} y={92} width={146} height={68} title="モデル" tone="violet" /><Wire id={state.id} d="M396 126H448" active phase={f.phase} tone="violet" /><Box x={456} y={92} width={152} height={68} title="アプリ" />
        <Text x={430} y={192} small>要求を検証して実行</Text>
        <Wire id={state.id} d="M532 160V240" active phase={f.phase} /><Box x={456} y={248} width={152} height={68} title="ツール" />
        <Wire id={state.id} d="M456 282H323V160" active phase={f.phase} dash /><Text x={336} y={330} small>観測を次の判断へ</Text>
        <Text x={429} y={381} small>一回の応答から、目標へ進むループへ</Text>
      </> : <>
        <Box x={250} y={88} width={358} height={90} title="系譜に位置づける" lines={['過去のどの流れの続きか']} />
        <Wire id={state.id} d="M430 178V230" active phase={f.phase} />
        <Box x={250} y={238} width={358} height={107} title="実用の条件を確認" lines={['デモと運用を分ける', '不足する条件を確かめる']} tone="amber" />
        <Text x={429} y={385} small>未来の能力予測は断定しない</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
