'use client'

import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, tones } from './concept-scene-primitives'
import { REASONING_SEQUENCE_STAGES, reasoningSequenceFrame } from '../../lib/reasoning-sequence-model.mjs'

function SequenceScene({ phase, id }) {
  const frame = reasoningSequenceFrame(phase)
  const node = name => frame.nodes.find(item => item.id === name)
  const paths = {
    'input-conditions-generation': 'M118 190H150',
    'conditions-following-prediction': 'M276 190H318',
    'answer-after-reasoning': 'M432 190H492'
  }
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene reasoning-sequence-scene"
    data-reasoning-sequence-stage={frame.stage} data-runtime-weights={frame.runtimeWeights}
    data-reasoning-content="not-reproduced" data-cost-estimate="none">
    <text x="320" y="31" textAnchor="middle" className="rs-heading">{['既生成の内容が、続きの条件になる', '既生成の記号を保ち、続きを生成', '学習側の調整と、今回の実行を分ける', '推論に続いて、最終回答を展開'][frame.stage]}</text>
    <g data-reasoning-node="runtime-model" data-visible="true">
      <rect x="24" y="52" width="592" height="40" rx="10" className="rs-runtime" data-emphasized={String(node('runtime-model').emphasized)} />
      <text x="320" y="79" textAnchor="middle" className="rs-label">推論時の重みは固定</text>
    </g>
    <g data-reasoning-node="reasoning-region" data-visible="true">
      <rect x="150" y="112" width="306" height="132" rx="14" className="rs-region" />
      <text x="303" y="140" textAnchor="middle" className="rs-label">推論の模式領域</text>
    </g>
    {frame.edges.filter(edge => edge.visible && edge.kind === 'flow').map(edge => <g key={edge.meaning}
      data-edge-source={edge.source} data-edge-target={edge.target} data-edge-meaning={edge.meaning}>
      <Wire id={id} d={paths[edge.meaning]} active phase={frame.phase} />
    </g>)}
    <g data-reasoning-node="input" data-visible="true">
      <rect x="24" y="158" width="94" height="70" rx="10" className="rs-box" />
      <text x="71" y="200" textAnchor="middle" className="rs-label">入力</text>
    </g>
    <g data-reasoning-node="prior-symbols" data-visible="true">
      <rect x="168" y="158" width="108" height="65" rx="9" className="rs-box" />
      <text x="222" y="182" textAnchor="middle" className="rs-label">既生成</text>
      <path d="M197 205h19m12 0h19" className="rs-symbol" data-decorative-symbol="prior-mark" />
    </g>
    <g data-reasoning-node="next-prediction" data-visible="true">
      <rect x="318" y="158" width="114" height="65" rx="9" className="rs-box" />
      <text x="375" y="182" textAnchor="middle" className="rs-label">後続予測</text>
      <path d="M351 205h19m12 0h19" className="rs-symbol" pathLength="1"
        strokeDasharray={`${frame.reasoning.markReveal} 1`} data-decorative-symbol="continuation-mark" />
    </g>
    <g data-reasoning-node="final-answer" data-visible="true" data-expanded={String(node('final-answer').expanded)}>
      <rect x="492" y="155" width="124" height="79" rx="10" className="rs-answer" />
      <text x="554" y="185" textAnchor="middle" className="rs-label">最終回答</text>
      {node('final-answer').expanded
        ? <path d="M516 207h76m-76 10h52" className="rs-answer-lines" />
        : <text x="554" y="218" textAnchor="middle" className="rs-note">未展開</text>}
    </g>
    <text x="320" y="269" textAnchor="middle" className="rs-note">既生成の内容 → 後続予測の条件</text>
    <text x="320" y="295" textAnchor="middle" className="rs-note" data-caveat="not-private-thought">{frame.reasoning.displayLabel}</text>
    {frame.trainingAdjustmentVisible && <>
      <g data-edge-source="training-adjustment" data-edge-target="runtime-model" data-edge-meaning="training-and-inference-configuration" data-runtime-update="false">
        <path d="M616 333H628V72H616" fill="none" stroke={tones.violet} strokeWidth="1.8" strokeDasharray="5 6" />
      </g>
      <g data-reasoning-node="training-adjustment" data-visible="true">
        <rect x="24" y="310" width="592" height="57" rx="10" className="rs-training" />
        <text x="320" y="334" textAnchor="middle" className="rs-label">学習・推論処理の調整</text>
        <text x="320" y="358" textAnchor="middle" className="rs-note">CoT 指示だけとは限らない</text>
      </g>
      <text x="320" y="391" textAnchor="middle" className="rs-note">通常モデルも中間の考察を書ける</text>
      <text x="320" y="419" textAnchor="middle" className="rs-note" data-caveat="reasoning-not-guaranteed">検証の正しさは保証されない</text>
    </>}
    {frame.stage < 2 && <>
      <text x="320" y="354" textAnchor="middle" className="rs-label">通常モデルも中間の考察を書ける</text>
      <text x="320" y="393" textAnchor="middle" className="rs-note">記号の個数・長さはトークン数ではない</text>
    </>}
    {frame.stage === 3 && <>
      {frame.resourceBands.map((band, index) => <g key={band.id} data-resource-band={band.id} data-measured="false">
        <rect x={24 + index * 306} y="318" width="286" height="50" rx="10" className="rs-resource" />
        <text x={167 + index * 306} y="351" textAnchor="middle" className="rs-label">{band.label}</text>
      </g>)}
      <text x="320" y="393" textAnchor="middle" className="rs-label">推論にも時間・費用がかかる</text>
      <text x="320" y="420" textAnchor="middle" className="rs-note" data-caveat="not-billing-formula">比率・実費は示さない</text>
    </>}
  </SceneBase>
}

export function ReasoningSequence({ children }) {
  return <ReadingFigure diagramId="reasoning-sequence" title="推論と最終回答の順序" eyebrow="REASONING / SEQUENCE"
    stages={REASONING_SEQUENCE_STAGES} className="reasoning-sequence-walkthrough" renderScene={state => <SequenceScene {...state} />}
    footnote="推論と回答の順序を示す模式図です。記号は実際の思考内容・トークン数を再現せず、時間・費用の比率も表しません。">
    {children}
  </ReadingFigure>
}
