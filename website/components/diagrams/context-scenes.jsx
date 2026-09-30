'use client'

import { useState } from 'react'
import { Canvas, LearningFigure, Text, Box, Tokens, Wire, Select, tones } from './learning-scene-primitives'
import { causalMask, prefixComparison } from '../../lib/learning-foundations-model.mjs'

function Matrix({ size, x, y, selected }) {
  const pitch = 28
  return <g data-mask-size={size}>{causalMask(size).flatMap((row, q) => row.map((allowed, k) => <rect key={`${q}-${k}`} data-query={q} data-key={k} data-allowed={String(allowed)}
    x={x + k * pitch} y={y + q * pitch} width="23" height="23" rx="4" fill={allowed ? (q === selected ? tones.teal : '#286458') : '#162233'} stroke={allowed ? '#74e3cf' : '#52657a'} opacity={q === selected || selected === undefined ? 1 : .6} />))}</g>
}
export function ContextCausalCost({ children }) {
  const [query, setQuery] = useState('3'), [length, setLength] = useState('6')
  return <LearningFigure diagram="context-causal-cost" title="参照範囲と入力・生成の負担" eyebrow="CONTEXT / CAUSAL COST"
    controls={({ stage, ready }) => stage === 0 ? <Select label="現在の参照位置" value={query} onChange={setQuery} ready={ready}>{[0, 1, 2, 3, 4, 5].map(i => <option key={i} value={i}>位置 {i}</option>)}</Select>
      : stage === 4 && <Select label="入力位置数" value={length} onChange={setLength} ready={ready}><option value="4">4位置</option><option value="6">6位置</option></Select>}
    scene={state => <Canvas diagram="context-causal-cost" {...state}>{f => <>
      {f.stage === 0 && <>
        <Text y={35}>密な因果注意：自分以前を参照</Text>
        <Tokens labels={['0', '1', '2', '3', '4', '5']} y={66} selected={[Number(query)]} muted={[0, 1, 2, 3, 4, 5].filter(i => i > Number(query))} />
        <Matrix size={6} x={68} y={147} selected={Number(query)} />
        <Text x={432} y={171}>{[`現在：位置 ${query}`, `参照可能：0〜${query}`]}</Text>
        <Text x={432} y={243} small>{['行：Query / 列：Key', '未来はマスク', '全方式に共通ではない']}</Text>
        <Text y={367} small>色のあるセルが許可された参照</Text>
      </>}
      {f.stage === 1 && <>
        <Text y={35}>関連を混ぜ、現在位置の表現へ</Text>
        <Tokens labels={['位置0', '名詞', '位置2', 'それ', '未来', '未来']} y={74} selected={[3]} muted={[4, 5]} />
        {[0, 1, 2, 3].map(i => <Wire key={i} id={state.id} d={`M${80 + i * 96} 121C${80 + i * 96} 170 320 185 320 236`} active phase={f.phase + i / 8} tone={i === 1 ? 'amber' : 'teal'} />)}
        <Box x={185} y={239} width={270} title="現在位置の表現" lines={['参照した情報を混ぜる']} height={90} />
        <Text y={370} small>{['線は模式表示。実際の重みではない', '参照できること ≠ 正しく使えること']}</Text>
      </>}
      {f.stage === 2 && <>
        <Text y={35}>長い入力では、参照する組も増える</Text>
        <Text x={168} y={85}>4位置</Text><Text x={450} y={85}>6位置</Text>
        <Matrix size={4} x={111} y={110} /><Matrix size={6} x={367} y={110} />
        <Text x={168} y={317}>10組</Text><Text x={450} y={317}>21組</Text>
        <Text y={367} small>{['密な因果注意におけるペア数', 'この比率は時間・料金・品質の比率ではない']}</Text>
      </>}
      {f.stage === 3 && <>
        <Text y={33}>prefill と decode は別の処理</Text>
        <Text x={35} y={74} anchor="start">入力を一括処理 → 応答開始</Text>
        <Tokens labels={['0', '1', '2', '3', '4', '5']} y={91} selected={[0, 1, 2, 3, 4, 5]} />
        <Text y={169} small>保存KV：0〜5 ／ 候補6は未保存</Text>
        <Text x={35} y={218} anchor="start">新しい位置6を処理 → 次の候補7</Text>
        <Tokens labels={['0', '1', '2', '3', '4', '5', '6']} y={235} selected={[6]} />
        <Text y={312} small>保存KV：0〜6 ／ 候補7は未保存</Text>
        <Box x={32} y={341} width={280} title="TTFT：未計測" tone="amber" />
        <Box x={328} y={341} width={280} title="生成速度：未計測" tone="violet" />
      </>}
      {f.stage === 4 && <>
        <Text y={35}>過去位置の K / V を保持する</Text>
        <Text x={32} y={83} anchor="start">K</Text><Tokens labels={Array.from({ length: Number(length) }, (_, i) => `K${i}`)} y={98} selected={Array.from({ length: Number(length) }, (_, i) => i)} name="keys" />
        <Text x={32} y={183} anchor="start">V</Text><Tokens labels={Array.from({ length: Number(length) }, (_, i) => `V${i}`)} y={198} selected={Array.from({ length: Number(length) }, (_, i) => i)} tone="violet" name="values" />
        <Text y={288}>{['Q・学習済み重みとは別', '時間・メモリ量は実装条件に依存']}</Text>
        <Text y={369} small>{['メモリ量・料金・品質：未計測', '列の長さだけから実際の値を計算しない']}</Text>
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}

export function ContextCacheQuality({ children }) {
  const [change, setChange] = useState('suffix'), [position, setPosition] = useState('3'), [documents, setDocuments] = useState('extra')
  const prefix = prefixComparison(change)
  return <LearningFigure diagram="context-cache-quality" title="接頭辞の再利用と長文の評価" eyebrow="CONTEXT / CACHE QUALITY"
    controls={({ stage, ready }) => stage === 1 || stage === 2 ? <Select label="入力の変更" value={change} onChange={setChange} ready={ready}><option value="front">先頭変更</option><option value="suffix">後方変更</option><option value="append">末尾追記</option></Select>
      : stage === 3 ? <Select label="重要情報の位置" value={position} onChange={setPosition} ready={ready}><option value="0">先頭</option><option value="3">中間</option><option value="5">末尾</option></Select>
        : stage === 4 && <Select label="追加する資料" value={documents} onChange={setDocuments} ready={ready}><option value="extra">追加資料あり</option><option value="needed">必要資料のみ</option></Select>}
    scene={state => <Canvas diagram="context-cache-quality" {...state}>{f => <>
      {f.stage === 0 && <>
        <Text y={35}>二つの「再利用」を区別する</Text>
        <Box x={32} y={80} width={576} title="同じ生成内の KV" lines={['過去のK/Vを保持 → 新しい入力位置を処理']} height={100} />
        <Wire id={state.id} d="M82 137C38 190 170 208 170 159" active phase={f.phase} />
        <Box x={32} y={218} width={576} title="別の要求の共通接頭辞" lines={['一致する先頭部分を、サービス側で再利用']} height={100} tone="violet" />
        <Text y={367} small>{['候補のKVは、候補を次入力として処理した後', 'ヒット条件・保持時間・割引はサービス別']}</Text>
      </>}
      {(f.stage === 1 || f.stage === 2) && <>
        <Text y={35}>先頭から一致する部分を再利用</Text>
        <Text x={34} y={84} anchor="start" small>固定部は先頭 ／ 可変部は後方</Text>
        <Tokens labels={prefix.original} y={110} width={490} selected={prefix.reused} name="original" />
        <Tokens labels={prefix.current} y={211} width={change === 'append' ? 572 : 490} selected={prefix.reused} name="changed" />
        <path d={`M${32 + prefix.prefix * (490 / 6)} 99V274`} stroke={tones.amber} strokeWidth="2" strokeDasharray="5 5" />
        <Text y={306}>{`保持 ${prefix.reused.length} ／ 再計算 ${prefix.recomputed.length} ／ 新規 ${prefix.added.length}`}</Text>
        <Text y={354} small>{['縦線：一致する接頭辞の境界', '再利用できる範囲と、実際のヒットは別']}</Text>
      </>}
      {f.stage === 3 && <>
        <Text y={35}>同じ重要情報の置き場所を変える</Text>
        <Tokens labels={Array.from({ length: 6 }, (_, i) => i === Number(position) ? '重要' : `位置${i}`)} y={97} selected={[Number(position)]} tone="amber" />
        <Wire id={state.id} d={`M${80 + Number(position) * 96} 144V197H320V237`} active tone="amber" phase={f.phase} />
        <Box x={165} y={241} width={310} title="回答の品質：未計測" lines={['同じ問いで比較する']} height={90} />
        <Text y={369} small>{['入ること ≠ 正しく使えること', '位置効果はモデルとタスクに依存']}</Text>
      </>}
      {f.stage === 4 && <>
        <Text y={35}>検索と統合は、別々に評価する</Text>
        {['先頭', '中間', '末尾'].map((label, i) => <Box key={label} x={32 + i * 197} y={64} width={182} title={label} height={50} active={false} />)}
        <Tokens labels={documents === 'extra' ? ['必要A', '必要B', '追加1', '追加2'] : ['必要A', '必要B']} y={151} selected={[0, 1]} />
        <Box x={32} y={244} width={280} title="情報を検索" lines={['結果・スコア：未計測']} height={94} />
        <Box x={328} y={244} width={280} title="複数箇所を統合" lines={['結果・スコア：未計測']} height={94} tone="violet" />
        <Text y={382} small>品質差の原因を、注意の希釈だけに帰さない</Text>
      </>}
      {f.stage === 5 && <>
        <Text y={35}>入力の選択と再利用は、別の判断</Text>
        <Box x={32} y={70} width={576} title="何を渡すか" height={125} />
        <Tokens labels={['必要A', '必要B', '畳む1', '畳む2']} y={125} start={48} width={544} selected={[0, 1]} muted={[2, 3]} />
        <Box x={32} y={218} width={576} title="何を再利用できるか" height={123} tone="violet" />
        <Tokens labels={['固定', '固定', '可変', '可変']} y={273} start={48} width={544} selected={[0, 1]} tone="violet" />
        <Text y={387} small>入力を選び直せば、一致する接頭辞も変わり得る</Text>
      </>}
    </>}</Canvas>}>{children}</LearningFigure>
}
