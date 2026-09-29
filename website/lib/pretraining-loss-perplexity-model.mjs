import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const PRETRAINING_LOSS_STAGES = Object.freeze([
  { label: '予測', title: '直前までを条件に、次のトークンを予測する。', detail: '固定した評価列 A B C の各位置で、正解トークンに与えた確率を見ます。学習では予測誤差を通じて重みを更新し、通常の推論では重みを固定します。次トークン予測は下流能力の総合得点ではありません。' },
  { label: '正解確率', title: '同じ位置の正解に、どれだけ確率を与えたか。', detail: '語彙 A・B・C・D に対する各確率行の和は 1。色の付いた列が、その位置の正解です。説明例 A と B を切り替えても、prefix・トークナイザ・評価列は同じです。学習途中の実測変化を表す例ではありません。' },
  { label: '損失', title: '各位置の −ln p を平均して、損失 L を得る。', detail: '対数は自然対数です。正解に与えた確率が低いほど、その位置の損失は大きくなります。位置ごとの値を平均します。矢印は計算の関係であり、説明例の切替を学習による改善の測定とは扱いません。' },
  { label: 'PPL', title: '平均損失に exp を適用すると、PPL になる。', detail: 'PPL = exp(L) は、正解確率の幾何平均の逆数です。確率の算術平均の逆数ではありません。L と PPL は同じ評価列で得た値の、別の表し方です。' },
  { label: '比較条件', title: '同じ条件で測った値だけを比較する。', detail: 'トークナイザまたは評価データが変われば、PPL の単純比較はできません。表示する 4 と 2 は元の説明例の値であり、異条件で再測定した値ではありません。PPL だけで下流能力やモデルの品質の順位を判定しません。' }
].map(Object.freeze))

const vocabulary = ['A', 'B', 'C', 'D']
const rows = {
  A: [[.5, .25, .125, .125], [.25, .25, .25, .25], [.375, .25, .125, .25]],
  B: [[.5, .25, .125, .125], [.25, .5, .125, .125], [.125, .125, .5, .25]]
}
export const COMPARISON_CONDITIONS = Object.freeze(['same', 'different-tokenizer', 'different-data'])

/** Cross entropy of correct-token probabilities in nats; zero is a valid boundary. */
export function lossAndPerplexity(probabilities) {
  if (!Array.isArray(probabilities) || probabilities.length === 0) throw new TypeError('probabilities must be a non-empty array')
  const negativeLogs = []
  for (let index = 0; index < probabilities.length; index++) {
    if (!Object.hasOwn(probabilities, index)) throw new TypeError('probabilities must not be sparse')
    const p = probabilities[index]
    if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('probability must be finite and between zero and one')
    negativeLogs.push(p === 1 ? 0 : -Math.log(p))
  }
  const loss = negativeLogs.reduce((sum, value) => sum + value, 0) / negativeLogs.length
  return { negativeLogs, loss, ppl: Math.exp(loss) }
}

function example(id) {
  const probabilityRows = rows[id].map(row => [...row]), correct = probabilityRows.map((row, index) => row[index])
  return { id, rows: probabilityRows, correct, ...lossAndPerplexity(correct) }
}

export function pretrainingLossFrame(phase, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('settings must be an object')
  const { probabilityExample = 'A', comparisonCondition = 'same' } = options
  if (!['A', 'B'].includes(probabilityExample) || !COMPARISON_CONDITIONS.includes(comparisonCondition)) throw new RangeError('Unknown loss choice')
  const normalized = clampPhase(phase, PRETRAINING_LOSS_STAGES.length), stage = stageForPhase(normalized, PRETRAINING_LOSS_STAGES.length)
  const activeExample = example(stage >= 1 && stage <= 3 ? probabilityExample : 'A')
  return {
    phase: normalized, stage, ...PRETRAINING_LOSS_STAGES[stage], vocabulary: [...vocabulary],
    tokenizerId: 'toy-tokenizer', evaluationId: 'toy-eval-abc',
    occurrences: ['A', 'B', 'C'].map((token, index) => ({ id: `eval-${index}`, token, prefix: vocabulary.slice(0, index), correctColumn: index, x: 120 + index * 200, probability: activeExample.correct[index], loss: activeExample.negativeLogs[index] })),
    activeExample, examples: [example('A'), example('B')],
    probabilityExample: stage >= 1 && stage <= 3 ? probabilityExample : null,
    comparisonCondition: stage === 4 ? comparisonCondition : null,
    comparisonAllowed: stage === 4 ? comparisonCondition === 'same' : null,
    displayedValuesCondition: 'original-toy-example', empiricalMeasurement: false,
    trainingWeights: 'updated', inferenceWeights: 'fixed', downstreamAbilityJudgment: null, ranking: null
  }
}
