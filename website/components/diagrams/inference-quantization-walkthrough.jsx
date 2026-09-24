'use client'

import { useState } from 'react'
import { ReadingFigure } from './reading-figure'
import { SceneBase, Select, Wire } from './concept-scene-primitives'
import { INFERENCE_QUANTIZATION_STAGES, INFERENCE_QUANTIZATION_TARGETS, INFERENCE_QUANTIZATION_BITS, inferenceQuantizationFrame } from '../../lib/inference-quantization-model.mjs'
import './inference-quantization.css'

function BitLane({ label, bits, y, high = false }) {
  return <g data-bit-lane={high ? 'outlier' : 'regular'} data-element-bits={bits}>
    <text x="30" y={y + 20} className="iq-note">{label} {bits}b</text>
    {Array.from({ length: 16 }, (_, index) => <rect key={index} x={214 + index * 24} y={y} width="20" height="24" rx="3"
      className={index < bits ? high ? 'iq-bit-high' : 'iq-bit' : 'iq-bit-empty'} data-active-bit={index < bits ? 'true' : 'false'} />)}
  </g>
}

export function InferenceQuantizationScene({ phase, id, settings }) {
  const frame = inferenceQuantizationFrame(phase, settings)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene iq-scene"
    data-inference-quantization-stage={frame.stage} data-quantization-target={frame.target} data-requested-bits={frame.requestedBits}
    data-effective-bits={frame.effectiveBits} data-mixed-precision={frame.mixed} data-quality-judgment="none" data-measurement-kind="conceptual">
    <text x="320" y="36" textAnchor="middle" className="iq-heading">{frame.stage === 0 ? '量子化する場所を選ぶ' : frame.stage === 3 ? '設定だけで、品質は決まらない' : '場所と値の印を保ち、表現だけ変える'}</text>
    {frame.regions.map(region => <g key={region.id} data-quantization-region={region.id} data-region-selected={region.selected}>
      <rect x={region.x} y="55" width="176" height="205" rx="11" className={region.selected ? 'iq-region-selected' : 'iq-region'} />
      {region.selected && <rect x={region.x + 4} y="59" width="168" height="197" rx="8" className="iq-selection-trace" strokeDashoffset={-frame.phase * 24} />}
      <text x={region.x + 88} y="84" textAnchor="middle" className="iq-label">{region.label}</text>
      <text x={region.x + 88} y="120" textAnchor="middle" className="iq-note">{region.detail}</text>
      {region.samples.map(sample => <g key={sample.occurrenceId} data-value-occurrence={sample.occurrenceId} data-value-bits={sample.bits}
        data-outlier={sample.outlier} data-high-precision-retained={sample.highPrecisionRetained}>
        <rect x={sample.x} y={sample.y} width={sample.width} height={sample.height}
          className={sample.highPrecisionRetained ? 'iq-value-high' : region.selected ? 'iq-value-selected' : 'iq-value'} />
        {sample.outlier && <path d={`M${sample.x + 11.5} ${sample.y - 12}l5 5-5 5-5-5Z`} className="iq-outlier-mark" />}
        <text x={sample.x + sample.width / 2} y="246" textAnchor="middle" className="iq-bit-label">{sample.bits}</text>
      </g>)}
    </g>)}
    {frame.stage === 0 ? <>
      <text x="320" y="300" textAnchor="middle" className="iq-note">棒の大小と◆は、値の模式例</text>
      <Wire id={id} d="M320 313v33" active phase={frame.phase} />
      <text x="320" y="379" textAnchor="middle">低bit化で、メモリ・転送量を減らす</text>
      <text x="320" y="413" textAnchor="middle" className="iq-note">三つの対象を、まとめて変えない</text>
    </> : frame.stage < 3 ? <>
      <text x="320" y="292" textAnchor="middle" className="iq-note">{frame.stage === 2 ? 'PTQは学習後 ／ ◆は高精度側へ残す' : '1要素の表現幅。メタデータ等は除く'}</text>
      <BitLane label="通常の値" bits={frame.representation.regularBits} y={315} />
      <BitLane label="◆の値" bits={frame.representation.outlierBits} y={358} high={frame.mixed} />
      <text x="320" y="416" textAnchor="middle" className="iq-note">{frame.stage === 2 && !frame.mixed ? '16bitでは、両方とも参照側の幅' : '実圧縮率・速度・品質は、この幅から求めない'}</text>
    </> : <g data-task-validation-required="true" data-task-validation-executed="false">
      <text x="320" y="294" textAnchor="middle" className="iq-note">同じ入力と成功条件で比べる</text>
      <rect x="38" y="317" width="234" height="53" rx="8" className="iq-region" />
      <rect x="368" y="317" width="234" height="53" rx="8" className="iq-region-selected" />
      <text x="155" y="351" textAnchor="middle">量子化前の出力</text>
      <text x="485" y="351" textAnchor="middle">量子化後の出力</text>
      <Wire id={id} d="M284 344h72" both active phase={frame.phase} />
      <text x="320" y="411" textAnchor="middle" className="iq-note">自社タスクで検証 ／ この図は合否を出さない</text>
    </g>}
  </SceneBase>
}

export function InferenceQuantization({ children }) {
  const [target, setTarget] = useState('weights'), [bits, setBits] = useState(8)
  const settings = { target, bits }
  return <ReadingFigure diagramId="inference-quantization" title="量子化する場所と、残す精度" eyebrow="INFERENCE / QUANTIZATION"
    stages={INFERENCE_QUANTIZATION_STAGES} className="inference-quantization-walkthrough"
    renderScene={state => <InferenceQuantizationScene {...state} settings={settings} />}
    renderControls={({ ready, stage }) => <div className="iq-controls">
      <Select label="量子化する対象" value={target} onChange={setTarget} ready={ready}>
        {INFERENCE_QUANTIZATION_TARGETS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </Select>
      {stage >= 1 && <Select label="通常部分のbit数" value={String(bits)} onChange={value => setBits(Number(value))} ready={ready}>
        {INFERENCE_QUANTIZATION_BITS.map(value => <option key={value} value={value}>{value} bit</option>)}
      </Select>}
    </div>}
    footnote="値の大小は模式例、bit幅は1要素だけの比較です。丸め・復元値、実モデルの圧縮率・速度・品質は計算しません。混合精度の適用方法は対象と方式で異なります。">{children}</ReadingFigure>
}
