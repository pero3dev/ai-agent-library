'use client'
import { useState } from 'react'
import { ContextFigure, ContextCanvas, Text, Box, Wire, Select } from './context-design-primitives'
const elements = ['システム指示','ツール定義','履歴・ツール結果','検索・参照資料','作業状態・計画','例示']
export function ContextInputDesign({ children }) {
  const [element, setElement] = useState('0')
  return <ContextFigure diagram="context-input-design" title="文言から、1回の入力全体の設計へ"
    controls={({ stage, ready }) => stage === 1 && <Select label="棚卸しする構成要素" value={element} onChange={setElement} ready={ready}>{elements.map((label, i) => <option key={label} value={i}>{label}</option>)}</Select>}
    scene={state => <ContextCanvas diagram="context-input-design" {...state}>{f => <>
      <Text y={35}>{['選ぶ・配置する・寿命を決める','実際の入力に、何が入っているか','必要だから残す。入るから入れない','制約と現在のタスクを、資料から分ける','固定部分に、毎周の値を混ぜない','設計の想像と、送信の実物を照合する'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={113} width={260} height={114} title="指示文の文言" lines={['コンテキストの一部分']} tone="violet" /><Wire id={state.id} d="M292 170H340" active phase={f.phase} />
        <Box x={348} y={113} width={260} height={114} title="呼び出しの入力全体" lines={['指示・定義・履歴・資料']} />
        <Text y={328} small>{['不要な情報・制約の埋没・履歴の汚染を調べる', '文言の調整だけでは、構成の問題は見えない']}</Text>
      </> : f.stage === 1 ? <>
        {elements.map((label, i) => <Box key={label} x={32 + (i % 2) * 292} y={79 + Math.floor(i / 2) * 100} width={284} height={77} title={label} active={Number(element) === i} tone={[0,1,5].includes(i) ? 'violet' : 'teal'} />)}
        <Text y={411} small>静的・準静的・動的な情報を、要素ごとに確認する</Text>
      </> : f.stage === 2 ? <>
        <Box x={32} y={106} width={260} height={164} title="この判断に必要" lines={['役割・制約・タスク', '関連する状態と資料']} />
        <Box x={348} y={106} width={260} height={164} title="不要な混入" lines={['使わない定義・無関係資料', '重複した情報']} tone="amber" />
        <Text y={344} small>{['必要な情報は残す。短さだけを最適化しない', '何を入れたかと、何が欠けたかを両方確認']}</Text>
      </> : f.stage === 3 ? <>
        <Box x={75} y={85} width={490} height={80} title="制約・現在のタスク" lines={['専用の見出し・タグで区別']} tone="amber" />
        <Box x={75} y={204} width={490} height={116} title="参照資料・履歴" lines={['重要な条件を中間へ埋め込まない']} tone="violet" />
        <Text y={384} small>長い資料を渡す場合も、守るべき条件を探せる構成へ</Text>
      </> : f.stage === 4 ? <>
        <Box x={32} y={105} width={260} height={164} title="固定ブロック" lines={['役割・制約・定義', '更新頻度は低い']} tone="violet" />
        <Box x={348} y={105} width={260} height={164} title="動的ブロック" lines={['日時・直近データ・状態', '毎周またはタスクで更新']} />
        <Text y={342} small>{['固定部分を再利用し、差分を調べやすくする', '実際のキャッシュ条件は、提供仕様で確認']}</Text>
      </> : <>
        <Box x={32} y={109} width={260} height={116} title="設計した構成" lines={['情報を入れる理由']} tone="violet" /><Wire id={state.id} d="M292 167H340" active phase={f.phase} />
        <Box x={348} y={109} width={260} height={116} title="実送信の全文" lines={['ダンプ・トレースで読む']} />
        <Wire id={state.id} d="M478 225V302H163V225" active phase={f.phase} tone="amber" dash /><Text y={349} small>不要な混入・欠けた状態を確認し、構成へ戻す</Text>
      </>}
    </>}</ContextCanvas>}>{children}</ContextFigure>
}
export function ContextCycleRetrieval({ children }) {
  return <ContextFigure diagram="context-cycle-retrieval" title="毎周の再構成と、情報を取得するタイミング"
    scene={state => <ContextCanvas diagram="context-cycle-retrieval" {...state}>{f => <>
      <Text y={35}>{['毎周、その判断に必要な情報を組み立てる','使い終わった情報の寿命を決める','毎回使う小さな情報は、先に渡す','資料が必要になったら、取得して渡す','目次を先に、本文を必要時に読む'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {['入力を組み立てる','モデルの判断','観測・進捗を得る'].map((label, i) => <g key={label}><Box x={32 + i * 197} y={127} width={182} height={101} title={label} tone={i === 2 ? 'amber' : 'teal'} />{i < 2 && <Wire id={state.id} d={`M${214 + i * 197} 178H${222 + i * 197}`} active phase={f.phase} />}</g>)}
        <Wire id={state.id} d="M517 228V310H123V228" active phase={f.phase} tone="amber" /><Text y={354} small>必要な観測と現在地を選び、次の周回へ戻す</Text>
      </> : f.stage === 1 ? <>
        {[['増えた履歴','圧縮・外部化'],['使い終えた資料','要点を残して破棄'],['外部の成果物','参照と読出し']].map(([a,b], i) => <g key={a}><Box x={32} y={81 + i * 100} width={260} height={75} title={a} tone="violet" /><Wire id={state.id} d={`M292 ${118 + i * 100}H340`} active phase={f.phase} /><Box x={348} y={81 + i * 100} width={260} height={75} title={b} /></g>)}
        <Text y={417} small>一度入れた情報を、すべて最後まで残さない</Text>
      </> : f.stage === 2 ? <>
        <Box x={32} y={112} width={260} height={162} title="毎回使う情報" lines={['役割・制約・出力形式', '小さな常用の用語定義']} tone="violet" /><Wire id={state.id} d="M292 193H340" active phase={f.phase} />
        <Box x={348} y={112} width={260} height={162} title="事前ロード" lines={['呼び出し前に入力へ']} />
        <Text y={361} small>必ず使う情報を、毎周検索し直す必要はない</Text>
      </> : <>
        <Box x={32} y={99} width={260} height={88} title={f.stage === 4 ? '目次・見出しを先に' : '必要な資料を判断'} lines={['軽い全体像と参照']} tone="violet" /><Wire id={state.id} d="M292 143H340" active phase={f.phase} />
        <Box x={348} y={99} width={260} height={88} title="読み出しツール" lines={['必要な箇所を取得']} />
        <Wire id={state.id} d="M478 187V264" active phase={f.phase} tone="amber" /><Box x={348} y={272} width={260} height={88} title="関連する本文" lines={['次の判断の入力へ']} tone="amber" />
        <Text x={157} y={319} small>{['タスクによって変わる', '大きな資料の一部分']}</Text>
        <Text y={417} small>取得漏れも観測し、読み出す構成を改善する</Text>
      </>}
    </>}</ContextCanvas>}>{children}</ContextFigure>
}
