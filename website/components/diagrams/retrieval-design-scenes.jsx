'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'
import { retrievalPath } from '../../lib/agent-design-model.mjs'

function SearchPath({ kind, state, continueSearch }) {
  const path = retrievalPath(kind)
  if (kind === 'agentic') return <>
    <Box x={32} y={89} width={177} height={66} title="質問" />
    <Wire id={state.id} d="M209 122H274" active phase={state.phase} />
    <Box x={281} y={78} width={275} height={88} title="次の判断" lines={['検索先・ツール・続行を選ぶ']} tone="violet" />
    <Wire id={state.id} d="M383 166V223" active={continueSearch} phase={state.phase} tone="violet" />
    <Box x={281} y={231} width={275} height={89} title="検索ツール" lines={['クエリと回数も判断の対象']} active={continueSearch} />
    <Wire id={state.id} d="M556 277H599V122H556" active={continueSearch} phase={state.phase} dash />
    <Text x={597} y={205} small>結果</Text>
    <Wire id={state.id} d="M281 123H246V272H209" active={!continueSearch} phase={state.phase} tone="amber" />
    <Box x={32} y={239} width={177} height={69} title="回答" active={!continueSearch} tone="amber" />
    <Text y={374} small>{continueSearch ? '途中結果から、必要な次の検索を選ぶ' : '完了・停止条件に合わせて探索を止める'}</Text>
    <Text y={406} small>処理数 / 費用 / 停止条件を制限する</Text>
  </>
  if (kind === 'workflow') return <>
    {path.nodes.map((label, i) => {
      const coords = [[32, 81], [234, 81], [436, 81], [436, 233], [234, 233]][i]
      return <Box key={label} x={coords[0]} y={coords[1]} width={172} height={76} title={label} tone={i === 1 || i === 4 ? 'violet' : 'teal'} />
    })}
    <Wire id={state.id} d="M204 119H228" active phase={state.phase} /><Wire id={state.id} d="M406 119H430" active phase={state.phase} />
    <Wire id={state.id} d="M522 157V226" active phase={state.phase} /><Wire id={state.id} d="M436 271H412" active phase={state.phase} />
    <Text x={132} y={256} small>{['順序・分岐は', '事前に定義']}</Text>
    <Text y={371} small>LLMを処理の一部に使っても、経路はコードで決める</Text>
    <Text y={405} small>必要なら、事前定義した上限付き再検索も組み込む</Text>
  </>
  return <>
    {path.nodes.map((label, i) => <Box key={label} x={32 + i * 202} y={160} width={172} height={91} title={label} lines={i === 1 ? [kind === 'full' ? '全文を渡す' : '外部知識を得る'] : []} tone={i === 2 ? 'violet' : 'teal'} />)}
    {[0, 1].map(i => <Wire key={i} id={state.id} d={`M${204 + i * 202} 205H${228 + i * 202}`} active phase={state.phase} />)}
    <Text y={331} small>{kind === 'full' ? ['小さく静的な知識ソースなら評価できる', '入力費用・必要箇所の参照・将来の増大を確認'] : ['検索 → 生成をコードで固定する', '少ない処理段数で定型質問を扱う出発点']}</Text>
  </>
}

export function RetrievalPaths({ children }) {
  const [continuation, setContinuation] = useState('continue')
  return <AgentConceptFigure diagram="retrieval-paths" title="検索の有無と経路の決定主体を分ける"
    controls={({ stage, ready }) => stage === 3 && <Select label="探索の継続" value={continuation} onChange={setContinuation} ready={ready}>
      <option value="continue">次の検索が必要</option><option value="stop">完了・停止条件</option>
    </Select>}
    scene={state => <Canvas diagram="retrieval-paths" {...state}>{f => f.stage === 0 ? <>
      <Text y={34}>RAG: 知識　／　Agent: 制御</Text>
      <Text x={173} y={98} small>コードで経路を決める</Text><Text x={472} y={98} small>モデルが経路を選ぶ</Text>
      <Text x={17} y={145} small anchor="start">検索あり</Text>
      <Box x={32} y={164} width={276} height={87} title="固定RAG / Workflow" lines={['経路を誰が決めるか']} />
      <Box x={332} y={164} width={276} height={87} title="Agentic RAG" lines={['途中結果から次の手を選ぶ']} tone="violet" />
      <Text x={17} y={288} small anchor="start">検索なし</Text>
      <Box x={32} y={304} width={276} height={87} title="全文投入など" lines={['知識の与え方として検討']} />
      <Box x={332} y={304} width={276} height={87} title="検索なしのAgent" lines={['制御の軸は独立']} tone="violet" />
    </> : <>
      <Text y={35}>{['', '固定RAG', '複数ステップの固定Workflow', 'Agentic RAG', '検索なし: 全文投入'][f.stage]}</Text>
      <SearchPath kind={['', 'simple', 'workflow', 'agentic', 'full'][f.stage]} state={state} continueSearch={continuation === 'continue'} />
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

export function RetrievalChoice({ children }) {
  return <AgentConceptFigure diagram="retrieval-choice" title="段数ではなく、経路を決められるかで構成を比べる"
    scene={state => <Canvas diagram="retrieval-choice" {...state}>{f => f.stage < 4 ? <>
      <Text y={35}>質問と知識の条件から、構成を検討する</Text>
      {[
        ['定型的な質問', '固定RAG'], ['手順・分岐を定義できる', '固定Workflow'], ['探索経路が大きく変わる', 'Agenticを比較評価'], ['知識が小さく静的', '全文投入も評価']
      ].map(([condition, design], i) => <g key={condition} opacity={i === f.stage ? 1 : .28}>
        <Box x={32} y={71 + i * 77} width={282} height={60} title={condition} />
        <Wire id={state.id} d={`M314 ${101 + i * 77}H350`} active={i === f.stage} phase={f.phase} />
        <Box x={358} y={71 + i * 77} width={250} height={60} title={design} tone={i === 2 ? 'violet' : 'teal'} />
      </g>)}
      <Text y={414} small>対応率・費用・遅延・失敗影響も比較する</Text>
    </> : <>
      <Text y={35}>構成を変えても、検索の土台は残る</Text>
      <Box x={32} y={89} width={263} height={153} title="検索品質" lines={['インデックス', 'チャンク分割', 'クエリ']} />
      <Wire id={state.id} d="M295 165H338" active phase={f.phase} />
      <Box x={346} y={89} width={262} height={153} title="回答品質" lines={['検索結果を根拠に生成', '出典を付けて返す']} tone="violet" />
      <Box x={95} y={294} width={450} height={79} title="別々に評価して改善する" lines={['Agent化だけで悪い検索は直らない']} tone="amber" />
      <Text y={417} small>未対応質問のログも、構成を見直す材料にする</Text>
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
