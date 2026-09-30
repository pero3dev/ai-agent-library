import { clampPhase, stageForPhase } from './reading-clock.mjs'

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export const ALIGNMENT_PREFERENCE_STAGES = deepFreeze([
  { label: '全体', title: '同じ選好から、二つの学習経路へ。', detail: 'RLHF は選好から報酬モデルを学び、その報酬と参照方策からの逸脱を使って方策を最適化します。DPO は選好ペアから方策を直接学習する経路です。RLVR の検証可能な報酬は、別の入口として区別します。' },
  { label: '選好ペア', title: '同じ入力 x に対する、二つの応答を比べる。', detail: 'y_w は好まれた応答、y_l は比較で選ばれなかった応答です。応答 ID と入力を固定して、後の式まで追います。人手などによる選好ラベルは、正しさの万能な判定ではありません。' },
  { label: '報酬差', title: '報酬の差を、選好確率へ変換する。', detail: 'Bradley–Terry 型の式では、同じ報酬モデルのスコア差にシグモイドを適用します。説明用に勝ちのスコアを ln 3、負けを 0 とすると、選好確率は 3/4 です。この固定スコア例は、後段の方策比による暗黙の報酬とは別の例です。' },
  { label: '報酬とKL', title: '報酬と、参照方策からの逸脱を分ける。', detail: 'RLHF の目的には報酬期待値と、固定した参照方策からの KL 罰則が別々に入ります。符号は報酬から β 倍の KL を引く形です。全応答の分布がないため、図は期待報酬・KL・目的値を計算しません。' },
  { label: '正則化', title: 'β は式の重み。学習結果の目盛りではない。', detail: '参照方策と説明用の分布を固定したまま、β の係数を比較します。大きな β が安全性・品質を保証したり、DPO の実際の更新量を単調に決めたりする図ではありません。最適化や学習の軌跡は実行・測定していません。' },
  { label: '暗黙の報酬', title: '応答ごとの比と、同じ入力の共通項。', detail: '同じ x の下で、各応答に β log(πθ/πref) と β log Z(x) を対応させます。固定確率の比は勝ちが 2、負けが 1/2。二つの Z(x) は同一ですが、その値は未知です。他の応答にも確率質量があり、この二行だけから全応答の KL は求めません。' },
  { label: 'DPO損失', title: '共通項を消し、この選好ペアの損失へ。', detail: '同じ x に対する二つの暗黙の報酬の差では、β log Z(x) が打ち消し合います。残った対数比の差を β 倍し、シグモイド、負の対数へ進みます。数値はこの一ペアの損失であり、L_DPO はペア全体の期待値または標本平均です。直接学習と、報酬再利用・オンライン探索の制御は別の設計です。' }
])

export const PREFERENCE_BETA_VALUES = Object.freeze([.5, 1, 2])

export const ALIGNMENT_PREFERENCE_FIXTURE = deepFreeze({
  id: 'alignment-fixed-pair-v1',
  description: '同じ入力に条件付けた応答全体の説明用確率。実モデルの測定値ではない。',
  inputId: 'x-0', policyId: 'pi-theta', referencePolicyId: 'pi-ref',
  rows: [
    { responseId: 'y-w', preference: 'winner', policyProbability: .5, referenceProbability: .25, ratio: 2, logRatio: Math.LN2 },
    { responseId: 'y-l', preference: 'loser', policyProbability: .125, referenceProbability: .25, ratio: .5, logRatio: -Math.LN2 }
  ],
  otherResponseMass: { policy: .375, reference: .5, individualProbabilities: null, klComputable: false },
  normalizer: { termId: 'z-x-0', inputId: 'x-0', value: null, formula: 'beta * log Z(x-0)', sameTermForBothRows: true },
  explicitRewardIllustration: { winner: Math.log(3), winnerExact: 'ln(3)', loser: 0, margin: Math.log(3), marginExact: 'ln(3)', probability: .75, probabilityExact: '3/4', relationToImplicitReward: '別の固定例。後段の暗黙報酬と同じ数値とは置かない。' }
})

function plainObject(value, keys, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${name} must be a plain object`)
  if (Reflect.ownKeys(value).some(key => !keys.includes(key))) throw new TypeError(`Unknown ${name} field`)
}

function finiteNumber(value, name) {
  if (typeof value !== 'number') throw new TypeError(`${name} must be a number`)
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`)
  return value
}

function probability(value, name) {
  finiteNumber(value, name)
  if (value <= 0 || value > 1) throw new RangeError(`${name} must be in (0, 1]`)
  return value
}

function sigmoid(value) {
  // Both branches avoid exp of a large positive value. Floating-point tails can round to 0/1.
  if (value >= 0) return 1 / (1 + Math.exp(-value))
  const e = Math.exp(value)
  return e / (1 + e)
}

function softplus(value) {
  return Math.max(value, 0) + Math.log1p(Math.exp(-Math.abs(value)))
}

/** A fixed score difference, not a measured preference or a training update. */
export function bradleyTerryTerms(winnerScore, loserScore) {
  finiteNumber(winnerScore, 'winnerScore')
  finiteNumber(loserScore, 'loserScore')
  const margin = finiteNumber(winnerScore - loserScore, 'score difference')
  return { margin, probability: sigmoid(margin) }
}

/** One preference pair conditioned on one x and one shared policy/reference context. */
export function dpoPairTerms(input) {
  plainObject(input, ['beta', 'winner', 'loser'], 'pair')
  const { beta, winner, loser } = input
  finiteNumber(beta, 'beta')
  if (beta <= 0) throw new RangeError('beta must be positive')
  for (const [name, row] of [['winner', winner], ['loser', loser]]) {
    plainObject(row, ['inputId', 'policyProbability', 'referenceProbability'], name)
    if (typeof row.inputId !== 'string') throw new TypeError('inputId must be a string')
    if (!row.inputId.trim()) throw new RangeError('inputId must not be empty')
    probability(row.policyProbability, `${name}.policyProbability`)
    probability(row.referenceProbability, `${name}.referenceProbability`)
  }
  if (winner.inputId !== loser.inputId) throw new RangeError('Normalizer cancellation requires the same input')
  if (winner.policyProbability + loser.policyProbability > 1
    || winner.referenceProbability + loser.referenceProbability > 1) throw new RangeError('Pair probability mass must not exceed one')
  const rows = [winner, loser].map((row, index) => {
    // A direct p/q may overflow or underflow even when log p - log q remains finite.
    const quotient = row.policyProbability / row.referenceProbability
    const logRatio = Math.log(row.policyProbability) - Math.log(row.referenceProbability)
    const weightedLogRatio = finiteNumber(beta * logRatio, 'weighted log ratio')
    const ratioRepresentable = Number.isFinite(quotient) && quotient > 0
    return { responseId: index === 0 ? 'y-w' : 'y-l', preference: index === 0 ? 'winner' : 'loser',
      inputId: row.inputId, policyProbability: row.policyProbability, referenceProbability: row.referenceProbability,
      ratio: ratioRepresentable ? quotient : null, ratioRepresentable, logRatio, weightedLogRatio }
  })
  const margin = finiteNumber(beta * (rows[0].logRatio - rows[1].logRatio), 'pair margin')
  return { inputId: winner.inputId, sameInput: true, normalizerCancels: true, normalizerValue: null, rows,
    margin, preferenceProbability: sigmoid(margin), pairLoss: softplus(-margin) }
}

export function alignmentPreferenceFrame(phase, options = {}) {
  plainObject(options, ['beta'], 'settings')
  const beta = Object.hasOwn(options, 'beta') ? options.beta : 1
  finiteNumber(beta, 'beta')
  if (!PREFERENCE_BETA_VALUES.includes(beta)) throw new RangeError('Unknown illustrative beta')
  const normalized = clampPhase(phase, ALIGNMENT_PREFERENCE_STAGES.length)
  const stage = stageForPhase(normalized, ALIGNMENT_PREFERENCE_STAGES.length)
  const left = Math.max(0, stage - .5), right = Math.min(ALIGNMENT_PREFERENCE_STAGES.length - 1, stage + .5)
  const effectiveBeta = stage >= 4 ? beta : 1
  const pairInput = ALIGNMENT_PREFERENCE_FIXTURE.rows.map(row => ({ inputId: 'x-0', policyProbability: row.policyProbability, referenceProbability: row.referenceProbability }))
  const pair = dpoPairTerms({ beta: effectiveBeta, winner: pairInput[0], loser: pairInput[1] })
  const explicitReward = { ...ALIGNMENT_PREFERENCE_FIXTURE.explicitRewardIllustration,
    ...bradleyTerryTerms(ALIGNMENT_PREFERENCE_FIXTURE.explicitRewardIllustration.winner, 0) }
  return {
    phase: normalized, stage, progress: (normalized - left) / (right - left),
    ...ALIGNMENT_PREFERENCE_STAGES[stage], stageLabel: ALIGNMENT_PREFERENCE_STAGES[stage].label,
    effectiveBeta, fixtureId: ALIGNMENT_PREFERENCE_FIXTURE.id,
    inputId: 'x-0', responseIds: ['y-w', 'y-l'], policyId: 'pi-theta', referencePolicyId: 'pi-ref', referenceFixed: true,
    rows: pair.rows, pair, explicitReward,
    normalizerTerms: ['y-w', 'y-l'].map(responseId => ({ responseId, termId: 'z-x-0', inputId: 'x-0', value: null, beta: effectiveBeta, cancelled: stage === 6 })),
    otherResponseMass: { ...ALIGNMENT_PREFERENCE_FIXTURE.otherResponseMass },
    routes: [{ id: 'rlhf', nodes: ['preference', 'reward-model', 'policy'] }, { id: 'dpo', nodes: ['preference', 'policy'] }],
    objectiveTerms: [{ id: 'reward', value: null }, { id: 'kl', value: null, coefficient: effectiveBeta }], objectiveOperator: 'minus',
    normalizerValue: null, expectedReward: null, klDivergence: null, rlhfObjective: null,
    lossScope: 'one-pair', dpoAggregation: 'expectation', empiricalMeasurement: false, trainingTrajectory: false,
    guaranteedUpdateMonotonicity: false, guaranteedQualityImprovement: false, optimizerResult: null,
    preferenceIsCorrectnessGuarantee: false, explicitAndImplicitExamplesIdentical: false
  }
}
