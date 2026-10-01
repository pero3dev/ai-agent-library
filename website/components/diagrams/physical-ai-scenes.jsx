'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'

export function PhysicalAiBoundaries({ children }) {
  const [safety, setSafety] = useState('both')
  return <AgentConceptFigure diagram="physical-ai-boundaries" title="共通のAgentループに、物理世界の制約が加わる"
    controls={({ stage, ready }) => stage === 4 && <Select label="安全の層を確認する" value={safety} onChange={setSafety} ready={ready}>
      <option value="both">両方の責務</option><option value="semantic">意味的安全</option><option value="physical">物理的安全</option>
    </Select>}
    scene={state => <Canvas diagram="physical-ai-boundaries" {...state}>{f => <>
      <Text y={35}>{['共通のループ、異なる作用域','身体と世界の状態を、観測し直す','状況理解・計画と、高速制御を分ける','実時間・不可逆性・データの制約','意味的安全と物理的安全は別の層','経験データを作る経路','実演・修正・試行から改善する'][f.stage]}</Text>
      {f.stage < 3 ? <>
        <Box x={32} y={83} width={260} height={95} title={f.stage < 2 ? '観測と判断' : '状況理解・計画'} lines={['視覚・言語のモデル']} tone="violet" />
        <Wire id={state.id} d="M292 131H340" active phase={f.phase} tone="violet" />
        <Box x={348} y={83} width={260} height={95} title={f.stage < 2 ? '行動を出す' : '速い制御の層'} lines={[f.stage < 2 ? '身体への指示・制御' : '下位の制御・ローカル実行']} />
        <Wire id={state.id} d="M478 178V260" active phase={f.phase} />
        <Box x={348} y={268} width={260} height={88} title="身体と環境" lines={['行動と、その結果']} tone="amber" />
        <Wire id={state.id} d="M348 312H162V178" active phase={f.phase} tone="amber" dash />
        <Text x={156} y={352} small>再観測</Text>
        {f.stage === 2 && <Wire id={state.id} d="M608 313H628V131H608" active phase={f.phase} dash />}
        <Text y={413} small>{f.stage === 2 ? '階層数・周期は実装ごとに異なる' : '観測 → 判断 → 行動の骨格は共通'}</Text>
      </> : f.stage === 3 ? <>
        {[
          ['実時間', '計画を待たず制御を続ける'], ['不可逆性', '衝突・危害は取り消せない'], ['データ', '行動経験を収集・製造する']
        ].map(([label, detail], i) => <Box key={label} x={32} y={78 + i * 103} width={576} height={83} title={label} lines={[detail]} tone={['teal', 'coral', 'amber'][i]} />)}
        <Text y={411} small>図の再生速度は、実際の制御周期ではない</Text>
      </> : f.stage === 4 ? <>
        {[
          ['意味的安全', '危険な依頼への対応', '上位の判断・制約', 'semantic'], ['物理的安全', '衝突回避・力制限', '下位コントローラ', 'physical']
        ].map(([label, action, owner, key], i) => <g key={key} opacity={safety === 'both' || safety === key ? 1 : .3}>
          <Box x={32 + i * 316} y={100} width={260} height={146} title={label} lines={[action, owner]} tone={i === 0 ? 'violet' : 'amber'} />
        </g>)}
        <Box x={90} y={306} width={460} height={74} title="別の層で保護・評価する" tone="coral" />
        <Text y={418} small>ソフトウェアの再試行・巻戻しの直感だけで設計しない</Text>
      </> : f.stage === 5 ? <>
        {['実演収集', '人の動画', 'シミュレーション'].map((label, i) => <g key={label}>
          <Box x={32 + i * 197} y={100} width={182} height={84} title={label} tone={['teal', 'violet', 'amber'][i]} />
          <Wire id={state.id} d={`M${123 + i * 197} 184V228H${260 + i * 60}V271`} active phase={f.phase} />
        </g>)}
        <Box x={190} y={279} width={260} height={91} title="行動の学習データ" lines={['経路を組み合わせる']} />
        <Text y={416} small>実機中心とシミュレーション中心の経路を分けて読む</Text>
      </> : <>
        {['実演', '人の修正', '自律試行'].map((label, i) => <g key={label}>
          <Box x={32 + i * 197} y={120} width={182} height={79} title={label} tone={['teal', 'amber', 'violet'][i]} />
          {i < 2 && <Wire id={state.id} d={`M${214 + i * 197} 160H${222 + i * 197}`} active phase={f.phase} />}
        </g>)}
        <Wire id={state.id} d="M517 199V256H123V199" active phase={f.phase} tone="amber" dash />
        <Text y={294} small>経験とフィードバックを、次の改善へ</Text>
        <Box x={90} y={335} width={460} height={71} title="安全・介入・復旧も評価する" tone="coral" />
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

export function PhysicalAiEvidence({ children }) {
  return <AgentConceptFigure diagram="physical-ai-evidence" title="入出力の構造と、提供・評価・運用の証拠"
    scene={state => <Canvas diagram="physical-ai-evidence" {...state}>{f => <>
      <Text y={35}>{['視覚と言語から、身体への行動へ','基盤の知識を、実演で行動へ適応','提供条件は、個別の確認日で読む','実機の条件と、比較の条件をそろえる','デモと、運用の保証を分ける','どの作用域でループを回すか'][f.stage]}</Text>
      {f.stage === 0 ? <>
        <Box x={32} y={94} width={230} height={79} title="視覚入力" /><Box x={32} y={237} width={230} height={79} title="言語指示" tone="violet" />
        <Wire id={state.id} d="M262 134H302V204H340" active phase={f.phase} /><Wire id={state.id} d="M262 277H302V225H340" active phase={f.phase} tone="violet" />
        <Box x={348} y={163} width={260} height={101} title="VLA" lines={['視覚・言語・行動']} tone="violet" />
        <Wire id={state.id} d="M478 264V315" active phase={f.phase} tone="amber" /><Box x={348} y={323} width={260} height={67} title="身体への行動" tone="amber" />
        <Text y={420} small>行動表現の具体形式は、モデルにより異なる</Text>
      </> : f.stage === 1 ? <>
        <Box x={32} y={102} width={260} height={106} title="視覚・言語の基盤" lines={['Web規模の知識・意味理解']} tone="violet" />
        <Box x={348} y={102} width={260} height={106} title="ロボットの実演" lines={['身体・行動の経験']} tone="amber" />
        <Wire id={state.id} d="M162 208V246H275V276" active phase={f.phase} /><Wire id={state.id} d="M478 208V246H365V276" active phase={f.phase} tone="amber" />
        <Box x={170} y={284} width={300} height={100} title="行動への適応" lines={['身体・環境・タスクで評価']} />
      </> : f.stage === 2 ? <>
        {['一般API', '公開重み', '限定提供', '専用実証'].map((label, i) => <Box key={label} x={32 + i * 146} y={128} width={138} height={77} title={label} tone={i % 2 ? 'amber' : 'violet'} />)}
        <Box x={90} y={267} width={460} height={115} title="世代・提供範囲・移行を確認" lines={['本文の確認日＋公式の提供条件', '予定と確認済みの提供を分ける']} />
      </> : f.stage === 3 ? <>
        {['タスク', '身体', '実行条件', '報告主体'].map((label, i) => <Box key={label} x={32 + i * 146} y={93} width={138} height={69} title={label} />)}
        <Box x={90} y={226} width={460} height={110} title="同じ条件で比較する" lines={['学習データ / 評価スイート / 実行主体', '別の実機の汎用能力へ外挿しない']} tone="amber" />
        <Text y={398} small>世界モデルは、生成・予測・学習基盤の用途を分ける</Text>
      </> : f.stage === 4 ? <>
        {['自律デモ', '限定タスク運用', '汎用性の保証'].map((label, i) => <Box key={label} x={32 + i * 197} y={100} width={182} height={78} title={label} tone={['violet', 'teal', 'amber'][i]} />)}
        <Text y={239}>証拠の範囲を確認する</Text>
        <Box x={90} y={280} width={460} height={108} title="運用を含めて評価" lines={['人の介入率 / 復旧経路 / 対応費用', '契約 / 継続稼働 / 出荷 / 第三者評価']} />
      </> : <>
        {[
          ['ソフトウェア', 'API・コード', '権限・失敗への対応'], ['画面操作', '画面・マウス・キー', '誤操作・状態の変化'], ['物理世界', '観測・身体', '実時間・物理的危害']
        ].map(([label, action, condition], i) => <g key={label}>
          <Box x={32} y={80 + i * 102} width={260} height={84} title={label} lines={[action]} />
          <Wire id={state.id} d={`M292 ${122 + i * 102}H340`} active phase={f.phase} tone="amber" />
          <Box x={348} y={80 + i * 102} width={260} height={84} title={condition} tone="amber" />
        </g>)}
        <Text y={416} small>作用域の比較。図の位置は数値尺度ではない</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
