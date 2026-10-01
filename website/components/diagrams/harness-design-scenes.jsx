'use client'
import { useState } from 'react'
import { HarnessFigure,HarnessCanvas,Text,Box,Wire,Select } from './harness-loop-primitives'
import { HARNESS_PARTS } from '../../lib/harness-loop-model.mjs'
export function HarnessSystemBoundaries({ children }) {
  const [part,setPart]=useState('0')
  return <HarnessFigure diagram="harness-system-boundaries" title="モデルの周囲を、一つのシステムとして設計する"
    controls={({stage,ready})=>stage===2&&<Select label="責務を確認する部品" value={part} onChange={setPart} ready={ready}>{HARNESS_PARTS.map((name,i)=><option key={name} value={i}>{name}</option>)}</Select>}
    scene={s=><HarnessCanvas diagram="harness-system-boundaries" {...s}>{f=><>
      <Text y={35}>{['モデルと、周囲の設計を分けて見る','文言 → 入力全体 → 外側のシステム','何を置き、どう噛み合わせるか','裁量を渡す部分と、強制する部分','観測した穴から、最小限の部品を足す'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={101} width={260} height={154} title="同じモデル" lines={['判断の中枢', '比較では条件を固定']} tone="violet"/><Wire id={s.id} d="M292 178H340" active phase={f.phase}/>
        <Box x={348} y={101} width={260} height={154} title="周囲のハーネス" lines={['制御・ツール・環境', '性能の変数として評価']}/>
        <Text y={343} small>{['最終得点が同じでも、経路やタスクの成否は違う', '図はベンチマークの得点を生成しない']}</Text>
      </>:f.stage===1?<>
        <rect x={32} y={82} width={576} height={278} rx="14" fill="#132c38" stroke="#74e3cf"/><Text y={115}>ハーネス：外側のシステム全体</Text>
        <rect x={83} y={144} width={474} height={180} rx="12" fill="#19263d" stroke="#baa7f3"/><Text y={178}>コンテキスト：入力全体の構成</Text>
        <Box x={164} y={211} width={312} height={81} title="プロンプトの文言" lines={['入力の一部分']} tone="amber"/>
        <Text y={408} small>内側の設計を、周囲の制御とつなぐ</Text>
      </>:f.stage===2?<>
        {HARNESS_PARTS.map((name,i)=><Box key={name} x={i===4?178:32+(i%2)*292} y={77+Math.floor(i/2)*105} width={284} height={78} title={name} active={Number(part)===i} tone={i===4?'amber':'teal'}/>)}
        <Text y={417} small>{['いつ考え・動き・止めるか','何に触れられるか','結果を返し、正しさを確かめる','どこで動き、状態を持つか','何を許し、被害の上限を決めるか'][Number(part)]}</Text>
      </>:f.stage===3?<>
        <Box x={32} y={109} width={260} height={163} title="モデルの裁量" lines={['次の一手・自然言語', '方針の組み立て']} tone="violet"/>
        <Box x={348} y={109} width={260} height={163} title="コードの強制" lines={['権限・上限・スキーマ', '危険操作の承認ゲート']} tone="amber"/>
        <Text y={347} small>{['判断の多様性と、破られて困る制約を分ける', '「必ず守る」という指示は、強制ではない']}</Text>
      </>:<>
        {['最小構成を動かす','失敗を観測','穴を埋める部品'].map((name,i)=><g key={name}><Box x={32+i*197} y={130} width={182} height={123} title={name} tone={i===1?'violet':'teal'}/>{i<2&&<Wire id={s.id} d={`M${214+i*197} 191H${222+i*197}`} active phase={f.phase}/>}</g>)}
        <Wire id={s.id} d="M517 253V311H123V253" active phase={f.phase} tone="amber"/><Text y={378} small>先回りで足し過ぎず、変えた効果を確かめる</Text>
      </>}
    </>}</HarnessCanvas>}>{children}</HarnessFigure>
}
export function HarnessEnvironmentEvolution({ children }) {
  const [choice,setChoice]=useState('hybrid'),[support,setSupport]=useState('evaluate')
  return <HarnessFigure diagram="harness-environment-evolution" title="働く環境と、評価しながら変えるハーネス"
    controls={({stage,ready})=>stage===1?<Select label="ハーネスの所有範囲" value={choice} onChange={setChoice} ready={ready}><option value="existing">既製</option><option value="custom">自作</option><option value="hybrid">ハイブリッド</option></Select>:stage===4?<Select label="更新後の補助的な足場" value={support} onChange={setSupport} ready={ready}><option value="evaluate">まだ必要か評価する</option><option value="remove">評価して不要なら減らす</option></Select>:null}
    scene={s=><HarnessCanvas diagram="harness-environment-evolution" {...s}>{f=><>
      <Text y={35}>{['手を動かす余地と、使い捨ての隔離','差別化する制御を、どこまで握るか','同じモデルと評価セットで、1変更を測る','最終出力と、そこまでの軌跡を見る','足場の削減と、安全の強制を分ける'][f.stage]}</Text>
      {f.stage===0?<>
        <Box x={32} y={107} width={260} height={164} title="作業空間" lines={['中間成果・調査結果', '状態を外部へ持つ']} tone="violet"/><Box x={348} y={107} width={260} height={164} title="セッションの隔離" lines={['使い捨ての環境', '前の副作用を漏らさない']} tone="amber"/>
        <Text y={347} small>{['すべてをコンテキストへ抱え込まない', '環境は、安全と性能の両方を支える']}</Text>
      </>:f.stage===1?<>
        <Box x={32} y={110} width={260} height={151} title={choice==='custom'?'周辺まで作り込む':'既製に任せる範囲'} lines={choice==='custom'?['再試行・監視・評価','ループ以外も必要']:['履歴・トレース・再開','デフォルト挙動を知る']} tone="violet"/>
        <Box x={348} y={110} width={260} height={151} title={choice==='existing'?'挙動を把握する':'自分で握る制御'} lines={choice==='existing'?['停止条件・圧縮','抽象の下を確認']:['権限・監査・独自フロー','責務の境界を決める']}/>
        <Text y={347} small>核心の差別化がどこかを確認し、所有範囲を選ぶ</Text>
      </>:f.stage===2?<>
        <Box x={94} y={79} width={452} height={75} title="モデルと評価セットを固定" tone="violet"/>
        <Wire id={s.id} d="M260 154V177H163V197M380 154V177H478V197" active phase={f.phase}/>
        <Box x={32} y={204} width={260} height={104} title="ハーネス A" lines={['変更前']}/><Box x={348} y={204} width={260} height={104} title="ハーネス B" lines={['1つの変更後']} tone="amber"/>
        <Text y={367} small>{['品質・費用・遅延を一緒に比較する', '図には測定結果を埋め込まない']}</Text>
      </>:f.stage===3?<>
        <Box x={32} y={109} width={260} height={129} title="最終出力" lines={['達成したかを確認']}/><Box x={348} y={109} width={260} height={129} title="途中の軌跡" lines={['無駄な往復・堂々巡り', '判断・実行・観測']} tone="violet"/>
        <Wire id={s.id} d="M478 238V293H388V238" active phase={f.phase} tone="amber" dash/><Text y={367} small>全体得点だけで、過程や個別タスクを隠さない</Text>
      </>:<>
        <Box x={32} y={91} width={260} height={145} title="弱点を補う足場" lines={support==='remove'?['不要な補助を減らす']:['細かな手順・過剰な分解','同じ条件で評価']} tone="violet"/>
        <Box x={348} y={91} width={260} height={145} title="維持する強制" lines={['権限・予算上限', '危険操作の承認']} tone="amber" data-harness-safety="retained"/>
        <Box x={109} y={288} width={422} height={81} title="モデル更新時に、評価して見直す"/>
      </>}
    </>}</HarnessCanvas>}>{children}</HarnessFigure>
}
