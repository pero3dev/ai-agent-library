'use client'
import { useState } from 'react'
import { ActionFigure, ActionCanvas, Text, Box, Wire, Select } from './action-boundaries-primitives'
export function OrchestrationBasics({ children }) {
  const [route, setRoute] = useState('standard')
  return <ActionFigure diagram="orchestration-basics" title="5つの形で、順序とデータの流れを変える"
    controls={({ stage, ready }) => stage === 3 && <Select label="振り分ける入力" value={route} onChange={setRoute} ready={ready}><option value="standard">定型</option><option value="open">非定型</option></Select>}
    scene={s => <ActionCanvas diagram="orchestration-basics" {...s}>{f => <>
      <Text y={35}>{['部品の種類と、つなぎ方を分けて考える','結果を渡すたびに、検証する','独立して進め、統合へ集める','分類の判断も、評価の対象にする','親が分解し、入力に応じて委譲する','評価基準と、反復の上限を決める'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={106} width={260} height={148} title="構成の部品" lines={['1回のLLM呼び出し', 'またはAgent']} tone="violet" />
        <Wire id={s.id} d="M292 180H340" active phase={f.phase} />
        <Box x={348} y={106} width={260} height={148} title="つなぎ方の設計" lines={['実行順序', 'データの受渡し']} />
        <Text y={343} small>{['部品が同じでも、品質・費用・堅牢性が変わる', '箱の形だけで、WorkflowとAgentを区別しない']}</Text>
      </> : f.stage === 1 ? <>
        {['抽出','変換','整形'].map((label,i) => <g key={label}><Box x={32+i*197} y={113} width={182} height={93} title={label} />{i < 2 && <Wire id={s.id} d={`M${214+i*197} 158H${222+i*197}`} active phase={f.phase} />}</g>)}
        <Box x={117} y={249} width={406} height={85} title="中間出力を検証" lines={['前段の誤りを早く見つける']} tone="amber" />
        <Text y={392} small>段数の待ち時間と、誤りの伝搬が増える</Text>
      </> : f.stage === 2 || f.stage === 4 ? <>
        <Box x={190} y={73} width={260} height={73} title={f.stage === 2 ? '独立した処理へ分割' : '親が動的に分解'} tone="violet" />
        <Wire id={s.id} d="M260 146V173H163V197M380 146V173H478V197" active phase={f.phase} />
        <Box x={32} y={204} width={260} height={67} title={f.stage === 2 ? '独立処理 A' : 'ワーカー A'} /><Box x={348} y={204} width={260} height={67} title={f.stage === 2 ? '独立処理 B' : 'ワーカー B'} />
        <Wire id={s.id} d="M163 271V300H260V322M478 271V300H380V322" active phase={f.phase} />
        <Box x={190} y={329} width={260} height={64} title="統合" tone="amber" />
        <Text y={424} small>{f.stage === 2 ? '共有状態への書込みは、統合へ集約' : '分解・委譲指示の質と費用を確認'}</Text>
      </> : f.stage === 3 ? <>
        <Box x={32} y={145} width={230} height={95} title="ルーター" lines={['入力を分類']} tone="violet" />
        <Wire id={s.id} d="M262 192H302V128H340" active={route === 'standard'} phase={f.phase} />
        <Wire id={s.id} d="M262 192H302V277H340" active={route === 'open'} phase={f.phase} />
        <Box x={348} y={80} width={260} height={95} title="定型の専用処理" active={route === 'standard'} /><Box x={348} y={228} width={260} height={95} title="非定型の専用処理" active={route === 'open'} tone="amber" />
        <Text y={389} small>{['誤分類は、下流の失敗として現れる', '図の選択は分類器の正解判定ではない']}</Text>
      </> : <>
        <Box x={32} y={105} width={260} height={99} title="生成・修正" lines={['成果物を作る']} /><Wire id={s.id} d="M292 153H340" active phase={f.phase} />
        <Box x={348} y={105} width={260} height={99} title="評価役" lines={['品質基準で検査']} tone="violet" />
        <Wire id={s.id} d="M478 204V260H163V204" active phase={f.phase} tone="amber" dash />
        <Box x={112} y={303} width={416} height={78} title="上限に達したら停止" lines={['評価役の判断も検証する']} tone="amber" />
      </>}
    </>}</ActionCanvas>}>{children}</ActionFigure>
}
export function OrchestrationComposition({ children }) {
  const [route,setRoute] = useState('standard')
  return <ActionFigure diagram="orchestration-composition" title="判断の位置を絞り、組織の境界を越える"
    controls={({ stage, ready }) => stage === 0 && <Select label="合成経路の入力" value={route} onChange={setRoute} ready={ready}><option value="standard">定型をWorkflowへ</option><option value="open">非定型をAgentへ</option></Select>}
    scene={s => <ActionCanvas diagram="orchestration-composition" {...s}>{f => <>
      <Text y={35}>{['判断が必要な場所に、自律性を置く','並列の出力を、統合して評価する','固定手順と、分解の判断を分ける','外部への送信と、戻り値の検証','測ったボトルネックだけ、1つずつ変える'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={153} width={182} height={80} title="ルーター" tone="violet" />
        <Wire id={s.id} d="M214 193H256V127H292" active={route === 'standard'} phase={f.phase} /><Wire id={s.id} d="M214 193H256V278H292" active={route === 'open'} phase={f.phase} />
        <Box x={300} y={87} width={308} height={83} title="固定Workflow" lines={['定型の手順']} active={route === 'standard'} /><Box x={300} y={235} width={308} height={83} title="Agentの判断" lines={['非定型の分解・委譲']} active={route === 'open'} tone="amber" />
        <Text y={383} small>入力の特性に合わせ、必要な経路へ振り分ける</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={95} width={260} height={89} title="独立した生成 A" /><Box x={32} y={227} width={260} height={89} title="独立した生成 B" />
        <Wire id={s.id} d="M292 139H316V209H340M292 271H316V209H340" active phase={f.phase} />
        <Box x={348} y={161} width={260} height={89} title="統合と評価" lines={['出力をまとめて検品']} tone="amber" />
        <Text y={383} small>並列ノードで、共有状態へ書き込まない</Text>
      </> : f.stage === 2 ? <>
        <Box x={32} y={138} width={260} height={131} title="親の分解判断" lines={['必要な仕事を決める']} tone="violet" /><Wire id={s.id} d="M292 204H340" active phase={f.phase} />
        <Box x={348} y={138} width={260} height={131} title="直列ワーカー" lines={['抽出 → 変換 → 整形', '固定手順で実行']} />
        <Text y={358} small>不確実性を、親の判断に絞る構成もある</Text>
      </> : f.stage === 3 ? <>
        <Box x={32} y={106} width={260} height={153} title="自システム" lines={['委譲するデータを確認', '戻り値を検証']} /><Wire id={s.id} d="M292 154H340" active phase={f.phase} tone="amber" /><Wire id={s.id} d="M348 218H300" active phase={f.phase} tone="amber" />
        <Box x={348} y={106} width={260} height={153} title="外部エージェント" lines={['信頼境界の外', '成果物は外部入力']} tone="amber" />
        <Text y={343} small>{['委譲は外部送信。発見・通信だけでは信頼できない', '送る範囲と、返ってきた情報を別々に確認']}</Text>
      </> : <>
        {['最小の直列','品質・費用・遅延','1か所を変更'].map((label,i) => <g key={label}><Box x={32+i*197} y={136} width={182} height={114} title={label} tone={i === 1 ? 'violet' : 'teal'} />{i < 2 && <Wire id={s.id} d={`M${214+i*197} 192H${222+i*197}`} active phase={f.phase} />}</g>)}
        <Wire id={s.id} d="M517 250V309H123V250" active phase={f.phase} tone="amber" /><Text y={370} small>追加したパターンの弱点を監視し、もう一度測る</Text>
      </>}
    </>}</ActionCanvas>}>{children}</ActionFigure>
}
