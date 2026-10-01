'use client'
import { useState } from 'react'
import { ContextFigure, ContextCanvas, Text, Box, Wire, Select } from './context-design-primitives'
import { RETAINED_CONTEXT, compactionRetention, contextTransfer } from '../../lib/context-design-model.mjs'

export function ContextCompactionDesign({ children }) {
  const [missing, setMissing] = useState('none')
  return <ContextFigure diagram="context-compaction-design" title="量と汚染に、圧縮・外部化・隔離を使い分ける"
    controls={({ stage, ready }) => stage === 2 && <Select label="圧縮で抜けた情報" value={missing} onChange={setMissing} ready={ready}><option value="none">必須情報を保持</option><option value="decisions">決定と理由が抜ける</option><option value="constraints">制約が抜ける</option></Select>}
    scene={state => <ContextCanvas diagram="context-compaction-design" {...state}>{f => <>
      <Text y={35}>{['溜まったものをまとめる／溜め込まない','上限の衝突より前に、区切りと閾値を設計','決定と試行錯誤を分け、保持情報を照合','細部へ戻れる参照を残し、要約を階層化','外に置いた情報を、必要時に読み返す'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={87} width={260} height={72} title="量が増える" tone="violet" /><Box x={348} y={87} width={260} height={72} title="汚染・不整合" tone="amber" />
        <Wire id={state.id} d="M162 159V217" active phase={f.phase} /><Wire id={state.id} d="M478 159V217" active phase={f.phase} tone="amber" />
        <Box x={32} y={225} width={260} height={112} title="圧縮・外部化" lines={['要約 / 外へ移す']} /><Box x={348} y={225} width={260} height={112} title="隔離・仕切り直し" lines={['分ける / 状態から再構築']} tone="amber" />
        <Text y={410} small>圧縮は事後策。外部化と隔離は事前の設計</Text>
      </> : f.stage === 1 ? <>
        {['作業中','フェーズの区切り','次の作業'].map((label, i) => <g key={label}><Box x={32 + i * 197} y={99} width={182} height={93} title={label} tone={i === 1 ? 'amber' : 'teal'} />{i < 2 && <Wire id={state.id} d={`M${214 + i * 197} 145H${222 + i * 197}`} active phase={f.phase} />}</g>)}
        <Box x={160} y={268} width={320} height={88} title="余裕のある使用率で圧縮" lines={['通常の区切り＋閾値の二段構え']} tone="amber" />
        <Text y={415} small>上限に衝突して、重要な作業の途中で圧縮しない</Text>
      </> : f.stage === 2 ? <g data-context-retention-matched={String(compactionRetention(missing).matched)}>
        {RETAINED_CONTEXT.map((label, i) => <Box key={label} x={32} y={68 + i * 62} width={284} height={50} title={label} tone={compactionRetention(missing).missing === label ? 'amber' : 'teal'} active={compactionRetention(missing).missing !== label} />)}
        <Box x={348} y={154} width={260} height={132} title={compactionRetention(missing).matched ? '保持リストと一致' : '不足を原資料で確認'} lines={compactionRetention(missing).matched ? ['重要情報を照合する'] : [compactionRetention(missing).missing]} tone={compactionRetention(missing).matched ? 'teal' : 'amber'} />
        <Text y={415} small>落とす生ログと、残す決定・制約を区別する</Text>
      </g> : f.stage === 3 ? <>
        <Box x={180} y={74} width={280} height={71} title="全体の要約" tone="violet" />
        {[162,478].map(x => <Wire key={x} id={state.id} d={`M320 145V177H${x}V211`} active phase={f.phase} />)}
        <Box x={32} y={219} width={260} height={91} title="サブタスクAの要約" lines={['元資料への参照']} /><Box x={348} y={219} width={260} height={91} title="サブタスクBの要約" lines={['元資料への参照']} />
        <Text y={364} small>{['近い履歴は詳しく、古い履歴はまとめる', '節目では原資料へ戻り、ドリフトを確かめる']}</Text>
      </> : <>
        <Box x={32} y={99} width={260} height={109} title="外部の状態・成果物" lines={['計画 / 決定 / ファイル']} tone="violet" /><Wire id={state.id} d="M292 153H340" active phase={f.phase} />
        <Box x={348} y={99} width={260} height={109} title="現在の入力" lines={['参照と必要な現在地']} />
        <Wire id={state.id} d="M478 208V294H162V208" active phase={f.phase} tone="amber" /><Text y={335} small>{['情報を捨てずに移し、必要なら読み出す', '状態を最新に保つ規律と、読出し手段が必要']}</Text>
      </>}
    </>}</ContextCanvas>}>{children}</ContextFigure>
}

export function ContextTrustRestart({ children }) {
  const [mode, setMode] = useState('waiting')
  return <ContextFigure diagram="context-trust-restart" title="文脈の分離と、親の権限・再構築の境界"
    controls={({ stage, ready }) => stage === 1 && <Select label="戻り値検証と親の承認" value={mode} onChange={setMode} ready={ready}><option value="invalid">戻り値の形式が不正</option><option value="waiting">形式は通る・親は承認待ち</option><option value="permitted">形式を確認・親の操作も許可</option></Select>}
    scene={state => <ContextCanvas diagram="context-trust-restart" {...state}>{f => <>
      <Text y={35}>{['別の文脈へ、独立して完結する探索を委譲','データの検証と、実行の許可を分ける','反復・矛盾から、外部の状態へ戻る','滑らかな要約でも、失われた情報はある','保持リストと実物を照合して、不足を戻す','通常の要約と、思考ブロックの契約を分ける'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={102} width={260} height={133} title="親の文脈" lines={['前提・目的・出力契約', '必要な範囲を渡す']} tone="violet" /><Wire id={state.id} d="M292 145H340" active phase={f.phase} />
        <Box x={348} y={102} width={260} height={133} title="子の探索" lines={['別の文脈 / 低い権限', '中間出力は子に保持']} />
        <Wire id={state.id} d="M348 203H300" active phase={f.phase} tone="amber" /><Text y={313} small>{['要点・出典参照・未確認事項をデータとして戻す', '子の要約を、信頼済みの命令へ昇格させない']}</Text>
      </> : f.stage === 1 ? <g data-context-execute={String(contextTransfer(mode).execute)} data-context-valid-data={String(contextTransfer(mode).validData)}>
        <Box x={32} y={80} width={260} height={91} title="子の戻り値" lines={['形式 / サイズ / 参照先']} tone="violet" /><Wire id={state.id} d="M292 125H340" active phase={f.phase} />
        <Box x={348} y={80} width={260} height={91} title={contextTransfer(mode).validData ? 'データとして確認' : '形式検証で拒否'} tone={contextTransfer(mode).validData ? 'teal' : 'amber'} />
        <Wire id={state.id} d="M478 171V219H162V249" active={contextTransfer(mode).validData} phase={f.phase} tone="amber" />
        <Box x={32} y={257} width={260} height={91} title="親の権限・承認" lines={['送信先・操作を別に制限']} tone="amber" /><Wire id={state.id} d="M292 302H340" active={contextTransfer(mode).execute} phase={f.phase} />
        <Box x={348} y={257} width={260} height={91} title={contextTransfer(mode).execute ? '許可した範囲で実行' : '実行経路は閉じる'} active={contextTransfer(mode).execute} />
        <Text y={414} small>形式検証は、内容の無害性を保証しない</Text>
      </g> : f.stage === 2 ? <>
        <Box x={32} y={81} width={260} height={91} title="反復・状態の矛盾" lines={['進捗のない往復を検知']} tone="amber" /><Wire id={state.id} d="M292 126H340" active phase={f.phase} tone="amber" />
        <Box x={348} y={81} width={260} height={91} title="外部の作業状態" lines={['決定 / 計画 / 成果物参照']} tone="violet" /><Wire id={state.id} d="M478 172V250" active phase={f.phase} />
        <Box x={348} y={258} width={260} height={100} title="新しい文脈" lines={['経緯と現在地から再構築']} />
        <Text x={155} y={314} small>{['全体の不整合を', '圧縮で固め直さない']}</Text>
      </> : f.stage === 3 ? <>
        {[
          ['決定が消える','同じ議論のループ'],['制約が消える','要件・禁止から逸脱'],['偽の連続性','損失に気づかない'],['作業途中の圧縮','直後の判断が乱れる']
        ].map(([label, line], i) => <Box key={label} x={32 + (i % 2) * 292} y={88 + Math.floor(i / 2) * 132} width={284} height={105} title={label} lines={[line]} tone="amber" />)}
        <Text y={416} small>保持する情報と、実行するタイミングを検証する</Text>
      </> : f.stage === 4 ? <>
        <Box x={32} y={108} width={260} height={123} title="必ず残すリスト" lines={['決定・制約・未解決・参照']} tone="violet" /><Wire id={state.id} d="M292 169H340" active phase={f.phase} />
        <Box x={348} y={108} width={260} height={123} title="圧縮後の実物" lines={['不足は元資料で確かめる']} />
        <Text y={321} small>{['安全に関わる制約は、固定部分にも保持を検討', '照合が通っても、将来の正しさを保証しない']}</Text>
      </> : <>
        <Box x={32} y={104} width={260} height={160} title="可視の状態" lines={['結論・未完了作業・承認', '再開の材料として保存']} />
        <Box x={348} y={104} width={260} height={160} title="思考ブロック" lines={['署名・暗号化・履歴の結合', '提供側の契約を確認']} tone="violet" />
        <Text y={341} small>{['同じように切り貼りできるとは限らない', 'モデル変更時も、可視の状態を別に保持する']}</Text>
      </>}
    </>}</ContextCanvas>}>{children}</ContextFigure>
}
