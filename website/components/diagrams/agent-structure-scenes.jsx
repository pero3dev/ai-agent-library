'use client'

import { useState } from 'react'
import { AgentConceptFigure, Canvas, Text, Box, Wire, Select } from './agent-concepts-primitives'

export function AgentComponents({ children }) {
  const [termination, setTermination] = useState('continue')
  const stopped = termination !== 'continue'
  return <AgentConceptFigure diagram="agent-components" title="4要素の役割と、情報が戻る経路"
    controls={({ stage, ready }) => stage === 3 && <Select label="ループ制御の判断" value={termination} onChange={setTermination} ready={ready}>
      <option value="continue">継続</option><option value="complete">完了</option><option value="failure">失敗</option><option value="limit">上限</option>
    </Select>}
    scene={state => <Canvas diagram="agent-components" {...state}>{f => <>
      <rect className="ac-boundary" x="20" y="61" width="600" height="348" rx="18" />
      <Text y={34}>ユーザー / トリガー → 目標</Text>
      <Wire id={state.id} d="M320 43V76" active={f.stage === 0} phase={f.phase} />
      <Box x={240} y={83} width={160} height={82} title="LLM" lines={['次の行動を判断']} active={f.stage < 3} />
      <Box x={42} y={196} width={160} height={90} title="メモリ・状態" lines={['履歴・中間成果物']} active={f.stage === 1} tone="violet" />
      <Wire id={state.id} d="M240 124H122V190" active={f.stage === 1} both phase={f.phase} tone="violet" />
      <Box x={438} y={196} width={160} height={90} title="ツール群" lines={['アプリ側が実行']} active={f.stage === 2} />
      <Wire id={state.id} d="M400 109H518V190" active={f.stage === 2} phase={f.phase} />
      <Text x={480} y={153} small>要求</Text>
      <Wire id={state.id} d="M438 255H420V149H406" active={f.stage === 2} phase={f.phase} tone="amber" />
      <Text x={390} y={190} small>観測</Text>
      <Box x={240} y={313} width={160} height={80} title="ループ制御" lines={[f.stage === 3 ? ({ continue: '次の周回へ', complete: '完了で停止', failure: '失敗で停止', limit: '上限で停止' })[termination] : '継続 / 停止']} active={f.stage === 3} tone="amber" />
      <Wire id={state.id} d="M320 165V306" active={f.stage === 3} phase={f.phase} tone="amber" />
      <Wire id={state.id} d="M240 355H220V150H234" active={f.stage === 3 && !stopped} phase={f.phase} />
      <Wire id={state.id} d="M400 355H438" active={f.stage === 3 && stopped} phase={f.phase} tone="coral" />
      <Text x={522} y={355} small>{termination === 'complete' ? ['応答 / 成果物'] : stopped ? ['停止理由を残す'] : ['継続時は', '判断へ戻る']}</Text>
      <Text x={124} y={345} small>{f.stage === 4 ? ['権限制御', 'ガードレール', '監視'] : ['4要素を', 'アプリが接続']}</Text>
      {f.stage === 4 && <rect x="20" y="61" width="600" height="348" rx="18" fill="none" stroke="#f1c27e" strokeWidth="3" />}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}

const modes = ['固定パイプライン', 'ルーティング', '単一Agentループ', 'マルチエージェント']
export function AgentAutonomy({ children }) {
  const [target, setTarget] = useState('0'), [condition, setCondition] = useState('0')
  return <AgentConceptFigure diagram="agent-autonomy" title="任せる判断の範囲を見分ける"
    controls={({ stage, ready }) => stage === 4 ? <Select label="行動する対象" value={target} onChange={setTarget} ready={ready}>
      {['会話型', 'ツール実行型', 'コンピュータ操作型'].map((name, i) => <option value={i} key={name}>{name}</option>)}
    </Select> : stage === 5 && <Select label="タスクの手順" value={condition} onChange={setCondition} ready={ready}>
      {['すべて列挙できる', '入口の振り分けだけ判断', '可変で探索的'].map((name, i) => <option value={i} key={name}>{name}</option>)}
    </Select>}
    scene={state => <Canvas diagram="agent-autonomy" {...state}>{f => <>
      {(f.stage === 0 || f.stage === 2) && <>
        <Text y={35}>青緑: 固定した処理　紫: LLMに任せる判断</Text>
        {modes.map((mode, i) => <g key={mode} opacity={f.stage === i ? 1 : .35}>
          <Text x={25} y={93 + i * 79} anchor="start" small>{mode}</Text>
          <Box x={228} y={63 + i * 79} width={100} height={53} title={i === 0 ? '処理' : '判断'} tone={i === 0 ? 'teal' : 'violet'} />
          <Wire id={state.id} d={`M328 ${90 + i * 79}H359`} active={f.stage === i} phase={f.phase} />
          <Box x={366} y={63 + i * 79} width={100} height={53} title={i < 2 ? '処理' : i === 2 ? 'ツール' : '分担'} tone={i === 3 ? 'violet' : 'teal'} />
          <Wire id={state.id} d={`M466 ${90 + i * 79}H497`} active={f.stage === i} phase={f.phase} />
          <Box x={504} y={63 + i * 79} width={106} height={53} title={i === 3 ? '統合' : '結果'} />
          {i > 0 && <Wire id={state.id} d={i === 1 ? 'M278 142L299 127M278 142L257 127' : `M558 ${118 + i * 79}V${131 + i * 79}H278V${118 + i * 79}`} active={f.stage === i} phase={f.phase} tone="violet" dash />}
        </g>)}
        <Text y={412} small>必要な自律性と、制御・評価の負担を一緒に考える</Text>
      </>}
      {f.stage === 1 && <>
        <Text y={35}>判断するのは入口。選んだ先は固定手順</Text>
        <Box x={170} y={73} width={300} height={83} title="LLMが分岐先を選ぶ" lines={['入口の振り分け']} tone="violet" />
        <Wire id={state.id} d="M278 156V193H176V225" active phase={f.phase} tone="violet" />
        <Wire id={state.id} d="M362 156V193H464V225" active={false} tone="violet" />
        <Box x={42} y={232} width={268} height={82} title="固定手順A" lines={['選択後はコードで進む']} />
        <Box x={330} y={232} width={268} height={82} title="固定手順B" lines={['もう一方の分岐先']} active={false} />
        <Wire id={state.id} d="M176 314V349H320V363" active phase={f.phase} />
        <Text y={393} small>手順全体を選び直すAgentループとは区別する</Text>
      </>}
      {f.stage === 3 && <>
        <Text y={35}>判断する単位を分け、結果を統合する</Text>
        <Box x={202} y={72} width={236} height={67} title="親Agent" tone="violet" />
        <Wire id={state.id} d="M278 139V178H173V211" active phase={f.phase} tone="violet" />
        <Wire id={state.id} d="M362 139V178H467V211" active phase={f.phase + .5} tone="violet" />
        <Box x={42} y={218} width={262} height={80} title="子Agent①" lines={['分担した判断と作業']} tone="violet" />
        <Box x={336} y={218} width={262} height={80} title="子Agent②" lines={['別の判断と作業']} tone="violet" />
        <Wire id={state.id} d="M173 298V330H278V350" active phase={f.phase} />
        <Wire id={state.id} d="M467 298V330H362V350" active phase={f.phase + .5} />
        <Box x={202} y={357} width={236} height={55} title="結果を統合" />
      </>}
      {f.stage === 4 && <>
        <Text y={35}>対象の類型は、自律性とは別の軸</Text>
        {[
          ['会話型', '対話＋限定ツール', '履歴・脱線・根拠'],
          ['ツール実行型', 'API・コード・データ', '権限・影響範囲・時間'],
          ['コンピュータ操作型', '画面＋マウス・キー', '誤操作・遅延・攻撃']
        ].map(([title, action, risk], i) => <g key={title} opacity={Number(target) === i ? 1 : .35}>
          <Box x={32} y={76 + i * 106} width={270} height={86} title={title} lines={[action]} />
          <Wire id={state.id} d={`M302 ${117 + i * 106}H333`} active={Number(target) === i} phase={f.phase} tone="amber" />
          <Box x={340} y={76 + i * 106} width={270} height={86} title="考慮すること" lines={[risk]} tone="amber" />
        </g>)}
        <Text y={412} small>類型に合わせて権限・評価・待ち時間を設計</Text>
      </>}
      {f.stage === 5 && <>
        <Text y={35}>「必要か」を手順の条件から考える</Text>
        {[
          ['すべて列挙できる', '固定パイプライン'], ['入口だけ判断する', 'ルーティング'], ['可変で探索的', 'Agentループを検討']
        ].map(([input, output], i) => <g key={input} opacity={Number(condition) === i ? 1 : .35}>
          <Box x={32} y={85 + i * 90} width={255} height={66} title={input} />
          <Wire id={state.id} d={`M287 ${118 + i * 90}H337`} active={Number(condition) === i} phase={f.phase} />
          <Box x={344} y={85 + i * 90} width={265} height={66} title={output} tone="violet" />
        </g>)}
        <Text y={389} small>{['左で足りるなら左を選ぶ', '権限・停止・失敗時の経路も設計する']}</Text>
      </>}
    </>}</Canvas>}>{children}</AgentConceptFigure>
}
