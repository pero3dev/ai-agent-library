'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire, tones } from './concept-scene-primitives'
import { TRAINING_RUNTIME_STAGES, trainingRuntimeFrame } from '../../lib/training-runtime-boundary-model.mjs'

function Node({ x, y, width, height, title, subtitle, tone = 'teal', emphasized = false, ...props }) {
  return <g {...props}>
    <rect x={x} y={y} width={width} height={height} rx="10" fill={emphasized ? '#1b3946' : '#132638'} stroke={tones[tone]} strokeWidth={emphasized ? 2.2 : 1} strokeOpacity={emphasized ? 1 : .65} />
    <text x={x + width / 2} y={y + 31} textAnchor="middle" className="tr-label">{title}</text>
    {subtitle && <text x={x + width / 2} y={y + 61} textAnchor="middle" className="tr-note">{subtitle}</text>}
  </g>
}
function Associations({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="tr-heading">工程と、確かめる性質を結ぶ</text>
    {['事前学習', 'SFT', '選好調整'].map((label, i) => <Node key={label} x={28 + i * 208} y={66} width={168} height={57} title={label} tone="violet" />)}
    {frame.associations.map((edge, i) => <path key={edge.source} d={`M${112 + i * 208} 130v17H320v22`} className="tr-association" data-association-source={edge.source} data-association-kind={edge.kind} data-sole-cause={edge.soleCause} />)}
    <Node x={210} y={176} width={220} height={61} title="学習で得た傾向" tone="violet" />
    {frame.traits.map((trait, i) => <g key={trait.id}>
      <path d={`M320 244v24H${112 + i * 208}v26`} className="tr-association" />
      <Node x={28 + i * 208} y={301} width={168} height={57} title={trait.label} tone={i === 0 ? 'amber' : i === 1 ? 'violet' : 'teal'} data-trait={trait.id} />
    </g>)}
    <text x="320" y="389" textAnchor="middle" className="tr-label" data-caveat="association">点線は関連。単独の原因ではない</text>
    <text x="320" y="419" textAnchor="middle" className="tr-note">工程ごとに、学習の目的も異なる</text>
  </>
}
function EvidenceFlow({ frame, id }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="tr-heading">根拠を渡し、出典と結果を確かめる</text>
    <Node x={28} y={71} width={175} height={97} title="根拠を渡す" subtitle="利用時の文脈へ" data-evidence-step="supply" />
    <Wire id={id} d="M210 117h29" active phase={frame.phase} />
    <Node x={247} y={71} width={146} height={97} title="モデル" subtitle="重みは固定" tone="violet" data-runtime-weights="fixed" />
    <Wire id={id} d="M400 117h30" active phase={frame.phase} />
    <Node x={438} y={71} width={174} height={97} title="応答候補" subtitle="根拠も確認" tone="amber" />
    <Wire id={id} d="M525 175v67" active phase={frame.phase} tone="amber" />
    <Node x={348} y={250} width={264} height={83} title="出典を照合" subtitle="回答 ↔ 情報源" tone="amber" data-evidence-step="source-check" />
    <Wire id={id} d="M341 291h-40" active phase={frame.phase} />
    <Node x={28} y={250} width={265} height={83} title="結果を検証" subtitle="実際の結果を確かめる" data-evidence-step="result-check" />
    <text x="320" y="375" textAnchor="middle" className="tr-label">根拠・出典・結果を、別々に確認</text>
    <text x="320" y="414" textAnchor="middle" className="tr-note">誤答の削減率や因果効果は算出しない</text>
  </>
}
function TraitChecks({ frame }) {
  return <>
    <text x="320" y="31" textAnchor="middle" className="tr-heading">性質ごとに、評価の観点を分ける</text>
    {frame.traits.map((trait, i) => <g key={trait.id} data-trait-row={trait.id} data-emphasized={trait.emphasized}>
      <rect x="28" y={62 + i * 94} width="584" height="82" rx="10" fill={trait.emphasized ? '#1b3946' : '#132638'} stroke={trait.emphasized ? tones.teal : '#68849b'} strokeWidth={trait.emphasized ? 2.2 : 1} />
      <text x="88" y={111 + i * 94} textAnchor="middle" className="tr-label">{trait.label}</text>
      <path d={`M153 ${75 + i * 94}v56`} stroke="#68849b" strokeOpacity=".6" />
      {trait.id === 'hallucination' ? <>
        {trait.checks.map((check, j) => <text key={check} x={238 + j * 145} y="94" textAnchor="middle" className="tr-note" data-trait-check={check}>{check}</text>)}
        <text x="384" y="128" textAnchor="middle" className="tr-note">次トークン予測 ≠ 事実検証</text>
      </> : trait.id === 'sycophancy' ? <>
        {trait.checks.map((check, j) => <text key={check} x={276 + j * 213} y="188" textAnchor="middle" className="tr-note" data-trait-check={check}>{check}</text>)}
        <text x="384" y="222" textAnchor="middle" className="tr-note">誤った前提への同調を確認</text>
      </> : <>
        {trait.checks.map((check, j) => <text key={check} x={276 + j * 219} y="282" textAnchor="middle" className="tr-note" data-trait-check={check}>{check}</text>)}
        <text x="384" y="316" textAnchor="middle" className="tr-note" data-caveat="refusal-factors">SFT・選好・実行時制御も影響</text>
      </>}
    </g>)}
    <text x="320" y="369" textAnchor="middle" className="tr-label">調整後も誤答は残る</text>
    <text x="320" y="410" textAnchor="middle" className="tr-note" data-caveat="research-scope">研究の対象条件を越えて一律に断定しない</text>
  </>
}
function Boundary({ frame, id }) {
  const selected = nodeId => frame.boundaryNodes.find(node => node.id === nodeId).emphasized
  return <>
    <text x="320" y="31" textAnchor="middle" className="tr-heading">モデルの外で、実行権限を確認</text>
    <Node x={28} y={65} width={168} height={95} title="プロンプト" subtitle="禁止文も入力" emphasized={frame.boundaryFocus === 'instruction'} data-node-id="instruction" />
    <Wire id={id} d="M203 112h29" active phase={frame.phase} />
    <Node x={240} y={65} width={190} height={95} title="学習された傾向" subtitle="指示に応答" tone="violet" emphasized={frame.boundaryFocus === 'instruction'} data-node-id="learned-tendencies" />
    <Wire id={id} d="M437 112h35" active phase={frame.phase} tone="violet" />
    <Node x={480} y={65} width={132} height={95} title="操作候補" subtitle="未実行" tone="amber" emphasized={selected('model-candidate')} data-boundary-node="model-candidate" data-node-owner="model" data-emphasized={selected('model-candidate')} />
    <rect x="28" y="216" width="584" height="141" rx="13" fill="#102b31" stroke={tones.teal} strokeDasharray="7 5" />
    <text x="320" y="245" textAnchor="middle" className="tr-note">モデル外：コード側の確認</text>
    <g data-edge-source="model-candidate" data-edge-target="permission-check" data-edge-meaning="candidate-only"><Wire id={id} d="M546 167v29H130v61" active phase={frame.phase} tone="amber" /></g>
    <Node x={48} y={266} width={164} height={77} title="権限確認" subtitle="許可時だけ先へ" emphasized={selected('permission-check')} data-boundary-node="permission-check" data-node-owner="outside-model" data-emphasized={selected('permission-check')} />
    <g data-edge-source="permission-check" data-edge-target="operation" data-edge-meaning="only-if-authorized"><Wire id={id} d="M219 303h36" active phase={frame.phase} /></g>
    <Node x={263} y={266} width={149} height={77} title="操作" subtitle="権限の範囲内" data-boundary-node="operation" data-node-owner="outside-model" data-emphasized="false" />
    <g data-edge-source="operation" data-edge-target="result-verification" data-edge-meaning="check-result"><Wire id={id} d="M419 303h44" active phase={frame.phase} /></g>
    <Node x={471} y={266} width={121} height={77} title="結果検証" subtitle="実行後も確認" emphasized={selected('result-verification')} data-boundary-node="result-verification" data-node-owner="outside-model" data-emphasized={selected('result-verification')} />
    <text x="320" y="389" textAnchor="middle" className="tr-note" data-caveat="prompt-limit">指示は実行を強制する仕組みではない</text>
    <text x="320" y="420" textAnchor="middle" className="tr-label" data-caveat="permission-boundary">モデルの拒否 ≠ 権限境界</text>
  </>
}
function RuntimeScene({ phase, id, settings }) {
  const frame = trainingRuntimeFrame(phase, settings)
  const Content = [Associations, EvidenceFlow, TraitChecks, Boundary][frame.stage]
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene training-runtime-scene" data-training-runtime-stage={frame.stage} data-permission-node={frame.permissionNode} data-output-route={frame.outputRoute.join(',')} data-judgment="none" data-operation-executed="false" data-trait-focus={frame.traitFocus || 'none'} data-boundary-focus={frame.boundaryFocus || 'none'}>
    <Content frame={frame} id={id} />
  </SceneBase>
}
export function TrainingRuntimeBoundary({ children }) {
  const [traitFocus, setTraitFocus] = useState('hallucination'), [boundaryFocus, setBoundaryFocus] = useState('permission')
  return <ReadingFigure diagramId="training-runtime-boundary" title="学習された性質と、実行時の境界" eyebrow="TRAINING / RUNTIME BOUNDARY" stages={TRAINING_RUNTIME_STAGES} className="training-runtime-walkthrough"
    renderScene={state => <RuntimeScene {...state} settings={{ traitFocus, boundaryFocus }} />}
    renderControls={({ ready, stage }) => <div className="training-runtime-controls">
      {stage === 2 && <div data-control="trait-focus"><Select label="確認する性質" value={traitFocus} onChange={setTraitFocus} ready={ready}><option value="hallucination">幻覚</option><option value="sycophancy">迎合</option><option value="refusal">拒否</option></Select></div>}
      {stage === 3 && <div data-control="boundary-focus"><Select label="確認する場所" value={boundaryFocus} onChange={setBoundaryFocus} ready={ready}><option value="instruction">指示</option><option value="permission">権限確認</option><option value="verification">結果検証</option></Select></div>}
    </div>}
    footnote="学習との関連と、利用時の確認を示す模式図です。実サービスへの操作、許可・拒否の判定、対策の効果測定は行いません。">{children}</ReadingFigure>
}
