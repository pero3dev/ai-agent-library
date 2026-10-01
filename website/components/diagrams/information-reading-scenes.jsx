'use client'

import { useState } from 'react'
import { OverviewFigure, Canvas, Text, Box, Wire, Select } from './overview-reading-primitives'
import { claimQuestions } from '../../lib/overview-reading-model.mjs'

export function InformationEvidence({ children }) {
  const [kind, setKind] = useState('number')
  return <OverviewFigure diagram="information-evidence" title="情報の入口から、原典と検証条件へ"
    controls={({ stage, ready }) => stage === 4 && <Select label="確かめる主張の種類" value={kind} onChange={setKind} ready={ready}><option value="number">数値</option><option value="demo">デモ</option><option value="forecast">予測</option></Select>}
    scene={state => <Canvas diagram="information-evidence" {...state}>{f => <>
      <Text y={35}>{['全部追う前に、仕事に効く対象を絞る','発信源との関係と、検証の根拠を分ける','詳しく読む価値を、まず選別する','採用前に、自分の条件への適用を確かめる','強い主張ほど、示した条件へ戻る'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={112} width={260} height={112} title="ニュース・論文" lines={['ツールなども含む', '入口は広く、対象は絞る']} tone="violet" /><Wire id={state.id} d="M292 168H340" active phase={f.phase} />
        <Box x={348} y={112} width={260} height={112} title="自分の仕事への影響" lines={['業務 / 設計判断 / 学習']} />
        <Text y={321} small>{['影響が薄いものは「存在を知る」まで', '確認する価値がある対象を、次の段階へ']}</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={93} width={260} height={101} title="二次情報" lines={['解説・ニュース・SNS']} tone="violet" /><Wire id={state.id} d="M292 143H340" active phase={f.phase} />
        <Box x={348} y={93} width={260} height={101} title="原典" lines={['仕様・論文・原主張']} />
        <Wire id={state.id} d="M478 194V250" active phase={f.phase} tone="amber" /><Box x={348} y={258} width={260} height={101} title="第三者の実測" lines={['方法・条件・限界を確認']} tone="amber" />
        <Text x={155} y={287} small>{['実測の結果については', '第三者も一次情報']}</Text>
        <Text y={413} small>発信源への近さだけでは、信頼順位は決まらない</Text>
      </> : f.stage === 2 ? <>
        {['アブストラクト','図表','限界節'].map((label, i) => <g key={label}><Box x={32 + i * 197} y={118} width={182} height={102} title={label} tone={i === 2 ? 'amber' : 'teal'} />{i < 2 && <Wire id={state.id} d={`M${214 + i * 197} 169H${221 + i * 197}`} active phase={f.phase} />}</g>)}
        <Wire id={state.id} d="M517 220V292H348" active phase={f.phase} tone="amber" /><Box x={94} y={300} width={452} height={72} title="詳しく読む価値を判断する" tone="violet" />
        <Text y={417} small>限界の記載は、適用の落とし穴を知る手がかり</Text>
      </> : f.stage === 3 ? <>
        {[
          ['実験方法','比較条件'],['データ分割','ばらつき'],['コード・データ','独立した再現']
        ].map(([label, line], i) => <g key={label}><Box x={32} y={78 + i * 88} width={260} height={74} title={label} lines={[line]} /><Wire id={state.id} d={`M292 ${115 + i * 88}H320V236H340`} active phase={f.phase} /></g>)}
        <Box x={348} y={178} width={260} height={118} title="自社の条件で検証" lines={['自己報告・査読も区別']} tone="amber" />
        <Text y={412} small>最初の選別を、そのまま採用判断にしない</Text>
      </> : <>
        <Box x={140} y={79} width={360} height={75} title={{ number: '数値の主張', demo: 'デモが示すもの', forecast: '将来の予測' }[kind]} tone="violet" />
        {claimQuestions(kind).map((label, i) => <g key={label}><Wire id={state.id} d={`M320 154V193H${174 + (i % 2) * 292}V${i < 2 ? 211 : 315}`} active phase={f.phase} tone="amber" /><Box x={32 + (i % 2) * 292} y={i < 2 ? 219 : 323} width={284} height={65} title={label} tone="amber" /></g>)}
        <Text y={417} small>図は確認観点を示す。主張の正しさを判定しない</Text>
      </>}
    </>}</Canvas>}>{children}</OverviewFigure>
}

export function InformationMaintenance({ children }) {
  return <OverviewFigure diagram="information-maintenance" title="情報を追う仕組みと、学習投資の二層"
    scene={state => <Canvas diagram="information-maintenance" {...state}>{f => <>
      <Text y={35}>{['観測する対象と担当を、明文化する','確認日と更新起点を残して、共有する','原理と具体に、違う時間軸で投資する','追った情報を、仕事と学習の判断へ戻す'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {['何を','どの一次情報で','どの周期で','誰が'].map((label, i) => <Box key={label} x={32 + (i % 2) * 292} y={94 + Math.floor(i / 2) * 123} width={284} height={89} title={label} tone={i < 2 ? 'teal' : 'violet'} />)}
        <Text y={379} small>{['個人の記憶から、チームの定点観測へ', '図の操作は、実際の定期タスクを作成しない']}</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={112} width={260} height={111} title="確認した内容と日付" lines={['いつ / 何を確かめたか']} /><Wire id={state.id} d="M292 168H340" active phase={f.phase} />
        <Box x={348} y={112} width={260} height={111} title="一次情報メモ" lines={['更新の起点を保持']} tone="violet" />
        <Wire id={state.id} d="M478 223V280" active phase={f.phase} tone="amber" /><Box x={348} y={288} width={260} height={82} title="チームで共有" tone="amber" />
        <Text x={161} y={335} small>{['同じ調査を', '重複して追わない']}</Text>
      </> : f.stage === 2 ? <>
        <Box x={32} y={104} width={260} height={163} title="原理への投資" lines={['ループ / 能力と限界', '長く効かせるために学ぶ']} />
        <Box x={348} y={104} width={260} height={163} title="具体への投資" lines={['モデル / 価格 / API', '今使うために確かめる']} tone="amber" />
        <Text y={332} small>{['追う対象は、話題性でなく仕事への影響で選ぶ', 'すべてを追わず、原理に学習の軸足を置く']}</Text>
      </> : <>
        <Box x={167} y={87} width={306} height={78} title="原典と条件を確かめる" />
        {['情報の選別','論文の判断','チーム運用','学習の配分'].map((label, i) => <g key={label}><Wire id={state.id} d={`M320 165V205H${174 + (i % 2) * 292}V${i < 2 ? 229 : 326}`} active phase={f.phase} tone="violet" /><Box x={32 + (i % 2) * 292} y={i < 2 ? 237 : 334} width={284} height={62} title={label} tone="violet" /></g>)}
      </>}
    </>}</Canvas>}>{children}</OverviewFigure>
}
