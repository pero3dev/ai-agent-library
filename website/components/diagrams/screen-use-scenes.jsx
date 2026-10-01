'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'
import { screenExecution, screenRoute } from '../../lib/screen-loop-model.mjs'

function Screen({ shifted = false }) {
  return <g data-screen-layout={shifted ? 'changed' : 'original'}>
    <rect x="48" y="82" width="340" height="256" rx="13" fill="#101e2e" stroke="#789ab1" />
    <rect x="48" y="82" width="340" height="34" rx="13" fill="#223a4e" />
    <Text x={218} y={106} small>操作対象の画面</Text>
    <rect x="74" y="143" width="286" height="49" rx="7" fill="#17313c" />
    <Text x={217} y={174} small>入力欄</Text>
    {shifted && <><rect x="74" y="204" width="286" height="40" rx="7" fill="#393123" /><Text x={217} y={231} small>追加された表示</Text></>}
    <rect x="254" y={shifted ? 266 : 214} width="106" height="42" rx="7" fill="#214941" stroke="#74e3cf" />
    <Text x={307} y={shifted ? 295 : 243} small>送信</Text>
    <circle cx="307" cy="236" r="14" fill="none" stroke="#f1c27e" strokeWidth="3" />
    <path d="M307 221V210M307 251V262M292 236H281M322 236H333" stroke="#f1c27e" />
  </g>
}

export function ScreenObservation({ children }) {
  const [shifted, setShifted] = useState('original')
  return <AgentConceptFigure diagram="screen-observation" title="画面の観測・操作・確認と、座標の脆さ"
    controls={({ stage, ready }) => stage === 3 && <Select label="画面の配置" value={shifted} onChange={setShifted} ready={ready}><option value="original">元の配置</option><option value="changed">表示が追加された配置</option></Select>}
    scene={state => <Canvas diagram="screen-observation" {...state}>{f => <>
      <Text y={35}>{['画像を読み、アプリが操作する','操作の後に、画面を観測し直す','画像・推論・描画待ちが積み重なる','同じ座標でも、対象は同じとは限らない','指定方法と、結果確認を分ける','見た目の成功から、データ側の照合へ'][f.stage]}</Text>
      {f.stage === 3 ? <>
        <Screen shifted={shifted === 'changed'} />
        <Box x={425} y={130} width={183} height={116} title="古い座標" lines={['位置を保持', '対象は動く']} tone="amber" />
        <Wire id={state.id} d="M425 236H334" active phase={f.phase} tone="amber" />
        <Text y={394} small>{shifted === 'changed' ? '配置が変わったら、再観測して対象を確認する' : '輪は操作要求に含まれる座標を示す'}</Text>
      </> : f.stage === 4 ? <>
        <Box x={32} y={91} width={260} height={118} title="APIの指定" lines={['型 / 識別子 / 引数', '契約で形式を検証']} />
        <Box x={348} y={91} width={260} height={118} title="画面の指定" lines={['画面 / 座標 / 時点', '配置と描画を再確認']} tone="violet" />
        <Wire id={state.id} d="M162 209V261H320V282" active phase={f.phase} /><Wire id={state.id} d="M478 209V261H320V282" active phase={f.phase} tone="violet" />
        <Box x={94} y={290} width={452} height={99} title="業務上の正しさを照合" lines={['妥当な引数でも、誤送信は起こり得る']} tone="amber" />
      </> : f.stage === 5 ? <>
        <Box x={32} y={110} width={245} height={123} title="画面の表示" lines={['成功らしく見える', '入力ずれは隠れ得る']} tone="violet" />
        <Wire id={state.id} d="M277 171H350" active phase={f.phase} />
        <Box x={358} y={110} width={250} height={123} title="データ側の照合" lines={['照会API / DB確認', '成功条件と突合']} />
        <Text y={328} small>{['観測した表示と、確認した実結果を区別する', '最終スクリーンショットだけで完了にしない']}</Text>
      </> : <>
        <Box x={32} y={89} width={246} height={88} title="画面を取得" lines={['画像として観測']} tone="violet" />
        <Wire id={state.id} d="M278 132H354" active phase={f.phase} tone="violet" />
        <Box x={362} y={89} width={246} height={88} title="モデルの判断" lines={['操作の要求を返す']} />
        <Wire id={state.id} d="M485 177V251" active phase={f.phase} />
        <Box x={362} y={259} width={246} height={88} title="アプリが操作" lines={['クリック / 入力 / キー']} tone="amber" />
        <Wire id={state.id} d="M362 303H286" active phase={f.phase} tone="amber" />
        <Box x={32} y={259} width={246} height={88} title="描画と遷移を待つ" lines={['変化後の状態を確認']} tone="violet" />
        <Wire id={state.id} d="M155 259V177" active={f.stage > 0} phase={f.phase} tone="violet" dash />
        <Text y={405} small>{f.stage === 2 ? '費用は観測回数・解像度・ツール往復で測る' : '画面の理解と、外界の操作は別の責務'}</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

export function ScreenBoundaries({ children }) {
  const [approval, setApproval] = useState('waiting')
  const [condition, setCondition] = useState('hybrid')
  return <AgentConceptFigure diagram="screen-boundaries" title="画面の信頼・権限・承認と、GUI区間の限定"
    controls={({ stage, ready }) => stage === 2 ? <Select label="不可逆操作の承認" value={approval} onChange={setApproval} ready={ready}><option value="waiting">待機</option><option value="approved">許可</option><option value="denied">拒否</option></Select>
      : stage === 3 && <Select label="利用できるインターフェース" value={condition} onChange={setCondition} ready={ready}><option value="api">公式APIがある</option><option value="hybrid">一部だけGUIが必要</option><option value="gui">GUIだけ</option></Select>}
    scene={state => <Canvas diagram="screen-boundaries" {...state}>{f => {
      const permission = screenExecution(approval)
      return <>
        <Text y={35}>{['画面・API結果は非信頼データ','権限は、実行できる副作用の範囲にもなる','承認待機と拒否では実行しない','GUIが必要な範囲を限定する','往復と、画面への依存を減らす','まとめる操作と、分ける境界'][f.stage]}</Text>
        {f.stage === 0 ? <>
          <Box x={32} y={95} width={260} height={95} title="依頼の指示" lines={['目的 / 制約']} />
          <Box x={348} y={95} width={260} height={95} title="画面・API結果" lines={['内容に指示が混ざり得る']} tone="amber" />
          <Wire id={state.id} d="M162 190V258H277" active phase={f.phase} /><Wire id={state.id} d="M478 190V258H355" active phase={f.phase} tone="amber" dash />
          <Box x={159} y={280} width={322} height={104} title="指示とデータを分ける" lines={['認可 / 送信先制限 / 必要な承認']} />
          <Text x={320} y={265} small>信頼の境界</Text>
        </> : f.stage === 1 || f.stage === 2 ? <>
          <rect x="28" y="74" width="584" height="295" rx="17" fill="none" stroke="#789ab1" strokeDasharray="6 5" />
          <Text y={104} small>専用環境・専用アカウント・最小権限</Text>
          <Box x={51} y={151} width={237} height={97} title="送信・購入・削除" lines={['不可逆な操作要求']} tone="amber" />
          <Wire id={state.id} d="M288 199H341" active={f.stage === 2 && permission.execute} phase={f.phase} tone="amber" />
          <Box x={349} y={151} width={237} height={97} title={f.stage === 1 ? '必要な承認' : permission.result} lines={[f.stage === 2 && permission.execute ? '許可後に実行する' : '実行の手前で止める']} tone={f.stage === 2 && permission.execute ? 'teal' : 'amber'} data-screen-execute={String(f.stage === 2 && permission.execute)} />
          <Text y={312} small>人が即座に停止できる手段を用意する</Text>
          <Text y={404} small>図の切替は、実環境の承認や実行ではない</Text>
        </> : f.stage === 3 ? <>
          {['公式APIがある', '一部だけGUI', 'GUIだけ'].map((label, i) => <g key={label} opacity={condition === ['api','hybrid','gui'][i] ? 1 : .3}><Box x={32 + i * 197} y={92} width={182} height={79} title={label} tone="violet" /><Wire id={state.id} d={`M${123 + i * 197} 171V218H320V248`} active={condition === ['api','hybrid','gui'][i]} phase={f.phase} tone="violet" /></g>)}
          <Box x={133} y={256} width={374} height={110} title={screenRoute(condition)[0]} lines={[screenRoute(condition)[1], '認可・必要な承認・結果確認']} />
        </> : <>
          <Box x={32} y={100} width={240} height={94} title="APIの操作区間" lines={['定型操作をまとめる']} />
          <Box x={367} y={100} width={240} height={94} title="GUIの操作区間" lines={['必要な区間だけ残す']} tone="violet" />
          <Wire id={state.id} d="M272 147H359" active phase={f.phase} />
          {f.stage === 5 ? <><Box x={32} y={270} width={240} height={99} title="安定した操作" lines={['まとめ実行を検討']} /><Box x={367} y={270} width={240} height={99} title="状態変化・送信" lines={['分割 / 承認 / 確認']} tone="amber" /></>
            : <Box x={96} y={274} width={448} height={100} title="画面の取得と操作の往復を減らす" lines={['要素参照でも、誤操作対策は残る']} tone="amber" />}
        </>}
      </>
    }}</Canvas>}>{children}</AgentConceptFigure>
}
