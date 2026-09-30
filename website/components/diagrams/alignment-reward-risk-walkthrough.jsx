'use client'

import { ReadingFigure } from './reading-figure'
import { SceneBase, Wire, tones } from './concept-scene-primitives'
import { ALIGNMENT_REWARD_RISK_STAGES, alignmentRewardRiskFrame } from '../../lib/alignment-reward-risk-model.mjs'

function RewardRiskScene({ phase, id }) {
  const frame = alignmentRewardRiskFrame(phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail}
    className="aw-scene alignment-reward-risk-scene"
    data-alignment-reward-risk-stage={frame.stage}
    data-empirical-measurement={String(frame.empiricalMeasurement)} data-quality-guarantee={String(frame.safetyGuarantee)}>
    <text x="320" y="38" textAnchor="middle" className="arr-heading">同じ出力を、二つの経路で評価</text>

    <Wire id={id} d="M140 171H166" active phase={frame.phase} />
    {frame.proxyEmphasis && <path d="M298 171H320V134H340" fill="none" stroke={tones.teal} strokeWidth="7" opacity=".45" />}
    <Wire id={id} d="M298 171H320V134H340" active phase={frame.phase} />
    <Wire id={id} d="M298 171H320V278H340" tone="violet" active phase={frame.phase} />
    <g data-policy-id={frame.policyId}>
      <rect x="22" y="132" width="118" height="78" rx="12" className="arr-box" />
      <text x="81" y="162" textAnchor="middle" className="arr-label">方策</text>
      <text x="81" y="191" textAnchor="middle" className="arr-note">πθ</text>
    </g>
    <g data-risk-output-id={frame.outputId}>
      <rect x="166" y="143" width="132" height="56" rx="12" className="arr-box" />
      <text x="232" y="178" textAnchor="middle" className="arr-label">同じ出力</text>
    </g>
    <g data-evaluation-lane={frame.lanes[0].id} data-value="unknown">
      <rect x="340" y="91" width="278" height="86" rx="12" className="arr-box arr-proxy" />
      <text x="479" y="124" textAnchor="middle" className="arr-label">代理報酬</text>
      <text x="479" y="155" textAnchor="middle" className="arr-note">学習した報酬モデル</text>
    </g>
    <g data-evaluation-lane={frame.lanes[1].id} data-value="unknown">
      <rect x="340" y="223" width="278" height="110" rx="12" className="arr-box arr-quality" />
      <text x="479" y="255" textAnchor="middle" className="arr-label">別の品質評価</text>
      <text x="479" y="286" textAnchor="middle" className="arr-note">（真の良さそのもの</text>
      <text x="479" y="314" textAnchor="middle" className="arr-note">ではない）</text>
    </g>

    {frame.stage === 0 && <>
      <text x="161" y="281" textAnchor="middle" className="arr-note">同じ出力を保ち</text>
      <text x="161" y="312" textAnchor="middle" className="arr-note">評価の観点を分ける</text>
      <text x="320" y="387" textAnchor="middle" className="arr-note">図に評価値は置かない</text>
    </>}
    {frame.stage === 1 && <>
      <text x="320" y="74" textAnchor="middle" className="arr-label" data-risk-emphasis="proxy">代理への最適化</text>
      <rect x="22" y="265" width="280" height="82" rx="12" className="arr-box arr-symptoms" />
      <text x="162" y="294" textAnchor="middle" className="arr-note">起こりうる症状</text>
      <text x="92" y="326" textAnchor="middle" className="arr-label" data-risk-symptom={frame.symptoms[0]}>冗長</text>
      <text x="232" y="326" textAnchor="middle" className="arr-label" data-risk-symptom={frame.symptoms[1]}>体裁</text>
      <text x="320" y="393" textAnchor="middle" className="arr-label" data-quality-divergence="true">代理と品質がずれうる</text>
    </>}
    {frame.stage === 2 && <>
      <Wire id={id} d="M81 265V210" tone="amber" active phase={frame.phase} />
      <g data-risk-constraint="kl" data-reference-policy-id={frame.referencePolicyId}>
        <rect x="22" y="265" width="280" height="82" rx="12" className="arr-box arr-constraint" />
        <text x="162" y="295" textAnchor="middle" className="arr-note">参照方策 πref</text>
        <text x="162" y="327" textAnchor="middle" className="arr-label">参照方策からの KL</text>
      </g>
      <Wire id={id} d="M618 376H630V134H618" tone="amber" active phase={frame.phase} />
      <g data-risk-reassessment={String(frame.reassessment)}>
        <rect x="340" y="352" width="278" height="48" rx="12" className="arr-box arr-constraint" />
        <text x="479" y="383" textAnchor="middle" className="arr-label">報酬モデルを再評価</text>
      </g>
      <text x="162" y="393" textAnchor="middle" className="arr-note" data-risk-guarantee="false">抑制であり保証ではない</text>
    </>}
  </SceneBase>
}

export function AlignmentRewardRisk({ children }) {
  return <ReadingFigure diagramId="alignment-reward-risk" title="代理報酬と評価のずれ" eyebrow="ALIGNMENT / REWARD RISK"
    stages={ALIGNMENT_REWARD_RISK_STAGES} className="alignment-reward-risk-walkthrough"
    renderScene={state => <RewardRiskScene {...state} />}
    footnote="関係を示す模式図。実測の品質曲線・転換点・最適値は示しません。">
    {children}
  </ReadingFigure>
}
