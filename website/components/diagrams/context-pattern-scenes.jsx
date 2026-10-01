'use client'
import { useState } from 'react'
import { ContextFigure, ContextCanvas, Text, Box, Wire, Select } from './context-design-primitives'
import { budgetResponse, preprocessingShape } from '../../lib/context-design-model.mjs'

export function ContextLayoutBudget({ children }) {
  const [outcome, setOutcome] = useState('overflow')
  return <ContextFigure diagram="context-layout-budget" title="更新頻度による配置と、出力を残す予算"
    controls={({ stage, ready }) => stage === 4 && <Select label="縮退後の予算状態" value={outcome} onChange={setOutcome} ready={ready}><option value="summarized">履歴要約で収まる</option><option value="reduced">取得量を減らすと収まる</option><option value="overflow">まだ超過する</option></Select>}
    scene={state => <ContextCanvas diagram="context-layout-budget" {...state}>{f => <>
      <Text y={35}>{['全体構成と、個々の指示文の配置を分ける','前方には、更新の少ない固定部分','後方には、毎ターンの指示と状態','入力で埋め尽くさず、出力の枠を残す','縮退する順序と、停止する境界を決める','想像の配分と、送信した内訳を比べる'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {[['原則','何を入れるか'],['実践','どう並べ・測るか'],['理論','なぜ効くか']].map(([title, line], i) => <Box key={title} x={32 + i * 197} y={116} width={182} height={114} title={title} lines={[line]} tone={['violet','teal','amber'][i]} />)}
        <Text y={323} small>{['検索そのものと、履歴の圧縮には別の詳解', '図は、呼び出しへ渡す情報全体を扱う']}</Text>
      </> : f.stage < 3 ? <>
        {[
          ['前方・固定','指示 / 定義 / 例示','violet'],['中間・タスクごと','検索結果 / 参照資料','teal'],['後方・毎ターン','履歴 / 現在の指示','amber']
        ].map(([label, line, tone], i) => <Box key={label} x={112} y={78 + i * 103} width={416} height={85} title={label} lines={[line]} tone={tone} active={f.stage === 1 ? i === 0 : i > 0} />)}
        <Text y={412} small>{f.stage === 1 ? '可変値を、固定部分の接頭部へ混ぜない' : '長い資料の後に、現在の指示も短く再掲する'}</Text>
      </> : f.stage === 3 ? <>
        {['固定部分','検索・資料','直近＋要約','出力の余白'].map((label, i) => <Box key={label} x={32 + (i % 2) * 292} y={94 + Math.floor(i / 2) * 121} width={284} height={88} title={label} tone={i === 3 ? 'amber' : 'teal'} data-context-output-reserve={i === 3 ? 'true' : undefined} />)}
        <Text y={366} small>{['各要素の上限を決め、実トークン量を測る', '箱の大きさは実際の配分比率ではない']}</Text>
      </> : f.stage === 4 ? <>
        <g data-context-budget-stop={String(budgetResponse(outcome).stop)}>
          {['古い履歴を要約','検索件数を減らす','まだ超過なら停止'].map((label, i) => <g key={label}><Box x={112} y={78 + i * 100} width={416} height={77} title={label} tone={i === 2 ? 'amber' : 'teal'} active={outcome === 'overflow' || (outcome === 'reduced' ? i < 2 : i === 0)} />{i < 2 && <Wire id={state.id} d={`M320 ${155 + i * 100}V${170 + i * 100}`} active={outcome !== 'summarized' && (i === 0 || outcome === 'overflow')} phase={f.phase} tone="amber" />}</g>)}
          <Text y={410} small>{budgetResponse(outcome).steps[1]}</Text>
        </g>
      </> : <>
        {['固定部分','資料の取得量','履歴の増加','出力の枠'].map((label, i) => <Box key={label} x={32 + (i % 2) * 292} y={90 + Math.floor(i / 2) * 105} width={284} height={78} title={label} tone="violet" />)}
        <Text y={332} small>{['要素別のトークン内訳を、トレースに残す', '予算超過の原因から、配分と縮退を見直す']}</Text>
      </>}
    </>}</ContextCanvas>}>{children}</ContextFigure>
}

export function ContextInformationDesign({ children }) {
  const [shape, setShape] = useState('summary')
  const [present, setPresent] = useState('no')
  return <ContextFigure diagram="context-information-design" title="取得・前処理・統合を、失敗と計測から見直す"
    controls={({ stage, ready }) => stage === 2 ? <Select label="資料の加工形態" value={shape} onChange={setShape} ready={ready}><option value="full">全文</option><option value="excerpt">抜粋</option><option value="summary">要約</option><option value="structured">構造化</option></Select>
      : stage === 5 && <Select label="必要な情報は入力にあったか" value={present} onChange={setPresent} ready={ready}><option value="yes">あったが使われない</option><option value="no">取得されていない</option></Select>}
    scene={state => <ContextCanvas diagram="context-information-design" {...state}>{f => <>
      <Text y={35}>{['取得の回数だけでなく、条件から選ぶ','大きな資料は、目次と必要な本文へ','下流が求める精度から、加工形態を選ぶ','資料の出所・日付と、競合の扱いを渡す','1セクションずつ除き、評価条件を揃える','情報の欠落と、使われない情報を分ける','品質と費用を、同じ変更で一緒に測る'][f.stage]}</Text>
      {f.stage === 0 ? <>
        {['使用確率','サイズ','更新頻度','往復の許容'].map((label, i) => <Box key={label} x={32 + (i % 2) * 292} y={87 + Math.floor(i / 2) * 112} width={284} height={85} title={label} tone="violet" />)}
        <Text y={342} small>{['毎回使う・小さい情報は、事前ロードを検討', 'JITは鮮度と関連性を得る一方、往復が増える']}</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={108} width={260} height={112} title="目次を事前ロード" lines={['全体像・軽い参照']} tone="violet" /><Wire id={state.id} d="M292 164H340" active phase={f.phase} />
        <Box x={348} y={108} width={260} height={112} title="必要箇所を読み出す" lines={['本文は実行時に取得']} /><Text y={320} small>{['事前ロードとJITを組み合わせる', '取得漏れを確認し、選び方へ戻す']}</Text>
      </> : f.stage === 2 ? <>
        <Box x={32} y={106} width={260} height={158} title="下流の要求" lines={['正確な引用 / 概要 / 定型']} tone="violet" /><Wire id={state.id} d="M292 185H340" active phase={f.phase} />
        <Box x={348} y={106} width={260} height={158} title={preprocessingShape(shape)[0]} lines={preprocessingShape(shape).slice(1)} />
        <Text y={346} small>要約で消えた細部は、必要時に原資料へ戻る</Text>
      </> : f.stage === 3 ? <>
        <Box x={32} y={92} width={260} height={90} title="資料A・資料B" lines={['出所 / 更新日を添える']} tone="violet" /><Wire id={state.id} d="M292 137H340" active phase={f.phase} />
        <Box x={348} y={92} width={260} height={90} title="重複を除く" />
        <Wire id={state.id} d="M478 182V246" active phase={f.phase} tone="amber" /><Box x={348} y={254} width={260} height={115} title="競合の規則" lines={['優先 / 両論・確認', '古い資料の扱い']} tone="amber" />
        <Text x={160} y={308} small>{['モデル任せにせず', '振る舞いを設計']}</Text>
      </> : f.stage === 4 ? <>
        <Box x={32} y={96} width={260} height={135} title="元の構成" lines={['固定した評価セット']} tone="violet" />
        <Box x={348} y={96} width={260} height={135} title="1つだけ除いた構成" lines={['同じ評価条件']} />
        <Text y={304} small>{['品質の変化と、トークン費用を比較する', '下がらない要素は、その条件での削減候補', '複数を一度に変え、原因を混ぜない']}</Text>
      </> : f.stage === 5 ? <>
        <Box x={156} y={82} width={328} height={89} title={present === 'yes' ? '入力には、情報があった' : '入力に、情報がなかった'} tone="violet" />
        <Wire id={state.id} d="M320 171V247" active phase={f.phase} tone="amber" />
        <Box x={156} y={255} width={328} height={100} title={present === 'yes' ? '配置・希釈を調べる' : '取得戦略へ戻る'} lines={['失敗ケースの実送信で確認']} tone="amber" />
        <Text y={414} small>失敗を、文言の問題へ一律に帰属しない</Text>
      </> : <>
        <Box x={32} y={107} width={260} height={141} title="品質の変化" lines={['固定した評価条件で測る']} /><Box x={348} y={107} width={260} height={141} title="トークン費用" lines={['同じ構成変更で測る']} tone="amber" />
        <Text y={322} small>{['品質が変わらず、費用だけ増える要素を調べる', '情報を足すことを、品質向上と同一視しない']}</Text>
      </>}
    </>}</ContextCanvas>}>{children}</ContextFigure>
}
