'use client'

import { useState } from 'react'
import { OverviewFigure, Canvas, Text, Box, Wire, Select } from './overview-reading-primitives'
import { SKILL_AREAS, skillRole } from '../../lib/overview-reading-model.mjs'

const entries = ['Agentとは何か','Workflow比較','ツール定義','評価の基礎','観測とトレース','脅威モデル','ユースケース','活用の全体像']
const practice = ['基礎概念全体','文脈・人の承認','プロンプト・モデル','Judge・回帰とCI','費用・インシデント','注入・ガードレール','PoCから本番','選定・安全']
export function SkillDevelopment({ children }) {
  const [role, setRole] = useState('engineer')
  const [area, setArea] = useState('0')
  return <OverviewFigure diagram="skill-development" title="役割の重点から、行動・学習パス・実践へ"
    controls={({ stage, ready }) => stage === 2 ? <Select label="学習の役割像" value={role} onChange={setRole} ready={ready}><option value="engineer">Agentエンジニア</option><option value="architect">Agentアーキテクト</option><option value="operations">評価・運用担当</option><option value="lead">テックリード・導入推進</option></Select>
      : stage === 3 && <Select label="伸ばすスキル領域" value={area} onChange={setArea} ready={ready}>{SKILL_AREAS.map((label, i) => <option key={label} value={i}>{`S${i + 1} ${label}`}</option>)}</Select>}
    scene={state => <Canvas diagram="skill-development" {...state}>{f => <>
      <Text y={35}>{['8領域を、技術と案件推進でつなぐ','年数や自己申告から、観察できる行動へ','目指す水準の目安。重点は役割で変わる','重点領域から、入門と実務の学習へ','改善を回せる実践題材の条件','実践と成果物で、担当できる範囲を広げる'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {['S1 概念','S2 設計','S3 実装','S4 評価','S5 運用'].map((label, i) => <g key={label}><Box x={32} y={66 + i * 65} width={260} height={51} title={label} />{i < 4 && <Wire id={state.id} d={`M162 ${117 + i * 65}V${123 + i * 65}`} active phase={f.phase} />}</g>)}
        <Box x={348} y={77} width={260} height={72} title="S6 セキュリティ" tone="violet" />
        <Box x={348} y={190} width={260} height={72} title="S8 ツール活用" tone="violet" />
        <Box x={348} y={303} width={260} height={72} title="S7 ビジネス実務" tone="amber" />
        <Wire id={state.id} d="M292 92H317V113H340" active phase={f.phase} tone="violet" /><Wire id={state.id} d="M292 92H307V226H340" active phase={f.phase} tone="violet" />
        <Wire id={state.id} d="M348 327H329V157H300" active phase={f.phase} tone="amber" dash /><Wire id={state.id} d="M292 287H317V353H340" active phase={f.phase} tone="amber" dash />
        <Text y={416} small>案件の要件→設計 ／ 評価の根拠→本番化判断</Text>
      </> : f.stage === 1 ? <>
        {[
          ['入門','用語と全体像を読む','他者の成果を理解'],['実務','自分で担当する','選択を根拠で説明'],['専門','組織の標準を設計','他者を指導する']
        ].map(([label, first, second], i) => <Box key={label} x={32 + i * 197} y={122} width={182} height={145} title={label} lines={[first, second]} tone={['teal','violet','amber'][i]} />)}
        <Text y={350} small>{['直近に実際にやったことと、成果物を確かめる', '確認期間は、担当業務と実践機会で調整する']}</Text>
      </> : f.stage === 2 ? <>
        {['入門','実務','専門'].map((label, i) => <Text key={label} x={305 + i * 119} y={73} small>{label}</Text>)}
        {skillRole(role).map((row, i) => <g key={row.id} data-skill-target={row.target}>
          <Text x={32} y={108 + i * 35} small anchor="start">{`${row.id} ${row.label}`}</Text>
          {['入門','実務','専門'].map((level, j) => <g key={level}><rect x={254 + j * 119} y={87 + i * 35} width="106" height="29" rx="6" fill={row.target === level ? '#243d46' : '#101e2e'} stroke={row.target === level ? '#74e3cf' : '#395368'} /><Text x={307 + j * 119} y={108 + i * 35} small>{row.target === level ? '目標' : ''}</Text></g>)}
        </g>)}
        <Text y={416} small>役割の目安。資格・採用・人事評価の点数ではない</Text>
      </> : f.stage === 3 ? <>
        <Box x={32} y={96} width={260} height={112} title={`S${Number(area) + 1} ${SKILL_AREAS[Number(area)]}`} lines={['重点領域を選ぶ']} tone="violet" /><Wire id={state.id} d="M292 152H340" active phase={f.phase} tone="violet" />
        <Box x={348} y={96} width={260} height={112} title={entries[Number(area)]} lines={['まず読む入口']} />
        <Wire id={state.id} d="M478 208V270" active phase={f.phase} /><Box x={348} y={278} width={260} height={112} title={practice[Number(area)]} lines={['実務へ進む学習パス']} tone="amber" />
        <Text x={157} y={332} small>{['リンクの正本は', '本文の対応表']}</Text>
      </> : f.stage === 4 ? <>
        {['失敗許容','検証可能','アクセス','反復性'].map((label, i) => <g key={label}><Box x={32 + i * 146} y={98} width={138} height={71} title={label} tone="amber" /><Wire id={state.id} d={`M${101 + i * 146} 169V215H${260 + i * 40}V249`} active phase={f.phase} tone="amber" /></g>)}
        <Box x={145} y={257} width={350} height={111} title="実践の題材" lines={['作る → 測る → 直す']} />
        <Text y={418} small>実題材の条件を確認する。図は採否を判定しない</Text>
      </> : <>
        <Box x={32} y={113} width={260} height={111} title="自分で作り・測る" lines={['最小ループ / 要件 / 評価']} /><Wire id={state.id} d="M292 168H340" active phase={f.phase} />
        <Box x={348} y={113} width={260} height={111} title="組織の標準を作る" lines={['ガイド / 評価基盤 / レビュー']} tone="violet" />
        <Wire id={state.id} d="M478 224V304H162V224" active phase={f.phase} tone="amber" dash /><Text y={352} small>実践・成果物・指導から、次の学習へ戻る</Text>
        <Text y={417} small>全領域を同時に専門へ伸ばす必要はない</Text>
      </>}
    </>}</Canvas>}>{children}</OverviewFigure>
}
