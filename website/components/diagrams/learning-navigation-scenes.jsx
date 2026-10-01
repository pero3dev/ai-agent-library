'use client'

import { useState } from 'react'
import { OverviewFigure, Canvas, Text, Box, Wire, Select } from './overview-reading-primitives'
import { learningRoute } from '../../lib/overview-reading-model.mjs'

export function LearningSectionMap({ children }) {
  const [role, setRole] = useState('A')
  return <OverviewFigure diagram="learning-section-map" title="16章の関係と、自分の目的に沿う学習経路"
    controls={({ stage, ready }) => stage === 4 && <Select label="読者タイプの経路" value={role} onChange={setRole} ready={ready}>
      {['A 入門','B 設計担当','C 実装担当','D 運用・SRE','E セキュリティ','F Agent活用','G 全領域と案件推進','H 企業システム開発'].map(label => <option key={label[0]} value={label[0]}>{label}</option>)}
    </Select>}
    scene={state => <Canvas diagram="learning-section-map" {...state}>{f => <>
      <Text y={35}>{['開発ライフサイクルを、学習の土台にする','技術と並行して読む、横断的なテーマ','挙動の「なぜ」から、数式と原論文へ','必要な応用を、土台から選んで読む','本文のA〜Hから、学習経路を選ぶ'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {['00 全体像','01 概念','02 設計','03 実装','04 評価','05 運用'].map((label, i) => {
          const x = [32,235,438,438,235,32][i], y = i < 3 ? 95 : 252
          return <Box key={label} x={x} y={y} width={170} height={77} title={label} tone={i > 3 ? 'amber' : 'teal'} />
        })}
        <Wire id={state.id} d="M202 134H227" active phase={f.phase} /><Wire id={state.id} d="M405 134H430" active phase={f.phase} />
        <Wire id={state.id} d="M523 172V244" active phase={f.phase} /><Wire id={state.id} d="M438 291H413" active phase={f.phase} tone="amber" /><Wire id={state.id} d="M235 291H210" active phase={f.phase} tone="amber" />
        <Text y={397} small>矢印は理解を助ける関係。全章の読了順ではない</Text>
      </> : f.stage === 1 ? <>
        {[
          ['概念と設計','06 セキュリティ'],['01 概念','08 使う側'],['01 概念','09 案件推進'],['00 全体像','15 人との協働']
        ].map(([from, to], i) => <g key={to}><Box x={32} y={77 + i * 80} width={260} height={62} title={from} /><Wire id={state.id} d={`M292 ${108 + i * 80}H340`} active phase={f.phase} tone="violet" /><Box x={348} y={77 + i * 80} width={260} height={62} title={to} tone="violet" /></g>)}
        <Text y={417} small>06→08の安全 ／ 04→09の評価は、補助的な依存</Text>
      </> : f.stage === 2 ? <>
        {['01 概念','10 LLM基礎','11 内部構造'].map((label, i) => <g key={label}><Box x={32 + i * 203} y={153} width={170} height={91} title={label} tone={i ? 'violet' : 'teal'} />{i < 2 && <Wire id={state.id} d={`M${202 + i * 203} 198H${227 + i * 203}`} active phase={f.phase} tone="violet" dash />}</g>)}
        <Text y={316} small>{['10: 数式なしの直感で、挙動と設計を深める', '11: 数式と原論文で、学術的な下層を読む']}</Text>
        <Text y={406} small>任意の深掘り。概念と並行して読める</Text>
      </> : f.stage === 3 ? <>
        {[
          ['03 実装','12・13 応用','モダリティ / ドメイン'],['設計と実装','14 UX・プロダクト','体験を作り込む'],['実装・安全・運用','07 事例','実務の総仕上げ']
        ].map(([from, to, detail], i) => <g key={to}><Box x={32} y={80 + i * 110} width={260} height={88} title={from} /><Wire id={state.id} d={`M292 ${124 + i * 110}H340`} active phase={f.phase} tone="violet" dash /><Box x={348} y={80 + i * 110} width={260} height={88} title={to} lines={[detail]} tone="violet" /></g>)}
      </> : <>
        {learningRoute(role).map((label, i, route) => {
          const x = [32,348,348,32][i], y = i < 2 ? 107 : 276
          return <g key={label}><Box x={x} y={y} width={260} height={95} title={`${i + 1} ${label}`} tone={i === route.length - 1 ? 'amber' : 'teal'} />
            {i < route.length - 1 && <Wire id={state.id} d={['M292 155H340','M478 202V268','M348 324H300'][i]} active phase={f.phase} />}</g>
        })}
        <Text y={418} small>詳しい記事とリンクは、左の推奨ルート表で確認する</Text>
      </>}
    </>}</Canvas>}>{children}</OverviewFigure>
}

export function LearningPracticeLoop({ children }) {
  return <OverviewFigure diagram="learning-practice-loop" title="章の役割を選び、実装・評価・安全を往復する"
    scene={state => <Canvas diagram="learning-practice-loop" {...state}>{f => <>
      <Text y={35}>{['作る・使う・深める・応用する、という役割','評価と安全は、設計・実装と並行する','読んで、動かして、結果を確かめる'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {[
          ['01–06 作る','概念 / 設計 / 品質'],['08 使う','コーディングAgent'],['10–11 深める','LLMの原理と内部'],['12–14 応用','モダリティ / UX'],['07 事例','実務での総仕上げ'],['09・15 横断','案件推進 / 人の協働']
        ].map(([title, detail], i) => <Box key={title} x={32 + (i % 2) * 316} y={79 + Math.floor(i / 2) * 106} width={260} height={90} title={title} lines={[detail]} tone={i < 2 ? 'teal' : 'violet'} />)}
        <Text y={417} small>役割を選び、元の章別リンクへ進む</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={100} width={260} height={87} title="設計" /><Wire id={state.id} d="M292 144H340" active phase={f.phase} /><Box x={348} y={100} width={260} height={87} title="実装" />
        <Wire id={state.id} d="M162 187V272" both active phase={f.phase} tone="amber" /><Wire id={state.id} d="M478 187V272" both active phase={f.phase} tone="amber" />
        <Box x={32} y={280} width={260} height={87} title="06 安全を確認" lines={['設計初期から脅威を読む']} tone="amber" /><Box x={348} y={280} width={260} height={87} title="04 評価で確かめる" lines={['実装と同時に読み始める']} tone="amber" />
        <Text y={418} small>デモが動いたことだけで、学習を完了にしない</Text>
      </> : <>
        <Box x={32} y={100} width={260} height={91} title="01 概念を理解" /><Wire id={state.id} d="M292 146H340" active phase={f.phase} /><Box x={348} y={100} width={260} height={91} title="サンプルを動かす" />
        <Wire id={state.id} d="M478 191V269" active phase={f.phase} /><Box x={348} y={277} width={260} height={91} title="結果を評価" lines={['品質 / 安全 / 挙動']} tone="amber" />
        <Wire id={state.id} d="M348 323H162V191" active phase={f.phase} tone="amber" dash /><Text x={158} y={369} small>疑問の原理へ戻る</Text>
      </>}
    </>}</Canvas>}>{children}</OverviewFigure>
}
