import { clampPhase, stageForPhase } from './reading-clock.mjs'

/** All values are illustrative fixtures, not output from a trained model/API. */
export const GENERATION_STAGES = Object.freeze([
  { label: '全体', title: 'これまでの列から、次の1つを選んで戻す。', detail: '条件となる列、候補の分布、選択、末尾への追加が一巡します。図のA〜Dは説明用のトークンです。' },
  { label: '候補', title: '同じ入力に対する、次の候補の分布。', detail: '入力ABに対する説明用の分布です。棒の位置と候補の名前は保ちます。' },
  { label: '選ぶ', title: '選択済みの1つを、末尾へ運ぶ。', detail: '移動中の候補はまだ確定列に数えません。次の段階で追加を確定します。' },
  { label: '戻す', title: '追加した出力が、次の入力になる。', detail: 'Bを加えたABBには、ABとは異なる説明用の分布を対応させています。確定済みの列を取り消す処理ではありません。' },
  { label: '調整', title: '同じ入力ABで、選び方だけを変える。', detail: '温度は分布の形、top-pは残す候補を変えます。貪欲では最大スコアを直接選びます。品質や正確性の保証ではありません。' },
  { label: '分岐', title: '選択の違いと、スコアの違いを分ける。', detail: '片方では同じ分布から選ぶ位置だけ、もう片方では貪欲条件を保ってスコアだけを変えます。' },
  { label: '停止', title: '止まった理由と、返す内容を区別する。', detail: '自然終了、停止文字列、上限を同じ説明用の候補列で比べます。どの終了でも内容の検証は別に必要です。' },
  { label: '配信', title: '確定した内容を、順番に配信する。', detail: '生成済みと配信済みを分けます。配信の1まとまりが、生成の1トークンと同じとは限りません。' }
].map(Object.freeze))

export const GENERATION_TEMPERATURES = Object.freeze([0, 0.5, 1, 2])
export const GENERATION_TOP_P = Object.freeze([0.6, 0.8, 1])
export const GENERATION_VARIATIONS = Object.freeze(['sampling', 'logit'])
export const GENERATION_STOPS = Object.freeze(['natural', 'sequence', 'limit'])
export const GENERATION_TOKENS = Object.freeze([
  ...['A', 'B', 'C', 'D'].map((label, tokenId) => Object.freeze({ tokenId, label, piece: label, terminal: false })),
  Object.freeze({ tokenId: 4, label: 'EOS', piece: '', terminal: true })
])

const PREFIX_FIXTURES = Object.freeze({
  '0,1': Object.freeze([0.4, 0.3, 0.2, 0.1]),
  '0,1,0': Object.freeze([0.1, 0.1, 0.2, 0.6]),
  '0,1,1': Object.freeze([0.1, 0.2, 0.6, 0.1]),
  '0,1,2': Object.freeze([0.5, 0.2, 0.2, 0.1]),
  '0,1,3': Object.freeze([0.1, 0.5, 0.1, 0.3])
})
const STOP_PROBABILITIES = Object.freeze([
  Object.freeze([0.7, 0.1, 0.1, 0.05, 0.05]),
  Object.freeze([0.1, 0.65, 0.1, 0.1, 0.05]),
  Object.freeze([0.1, 0.1, 0.65, 0.1, 0.05]),
  Object.freeze([0.05, 0.05, 0.05, 0.05, 0.8])
])
const BASE_OPTIONS = Object.freeze({ temperature: 1, topP: 1, draw: 0.62 })
const near = (left, right) => Math.abs(left - right) <= 1e-12
const clamp01 = value => Math.max(0, Math.min(1, value))
const sum = values => values.reduce((total, value) => total + value, 0)

function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be finite`)
}
function logitsArray(logits) {
  if (!Array.isArray(logits) || logits.length === 0 || logits.length > GENERATION_TOKENS.length) throw new TypeError('logits must contain 1 to 5 values')
  logits.forEach(value => finite(value, 'logit'))
}
function probabilityArray(probabilities) {
  if (!Array.isArray(probabilities) || probabilities.length === 0) throw new TypeError('probabilities must be nonempty')
  probabilities.forEach(value => {
    finite(value, 'probability')
    if (value < 0 || value > 1) throw new RangeError('probabilities must be in [0,1]')
  })
  if (!near(sum(probabilities), 1)) throw new RangeError('probabilities must sum to 1')
}
function samplingOptions(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('options must be an object')
  const { temperature = 1, topP = 1, draw = 0.62 } = options
  finite(temperature, 'temperature'); finite(topP, 'topP'); finite(draw, 'draw')
  if (temperature < 0) throw new RangeError('temperature must be nonnegative')
  if (topP <= 0 || topP > 1) throw new RangeError('topP must be in (0,1]')
  if (draw < 0 || draw >= 1) throw new RangeError('draw must be in [0,1)')
  return { temperature, topP, draw }
}
function occurrence(tokenId, occurrenceId) {
  const token = GENERATION_TOKENS[tokenId]
  if (!token) throw new RangeError('Unknown token ID')
  return { tokenId, label: token.label, piece: token.piece, occurrenceId }
}
function prompt() { return [occurrence(0, 'prompt:0'), occurrence(1, 'prompt:1')] }
function clonePrefix(prefix) { return prefix.map(token => ({ ...token })) }

/** T=0 is deliberately excluded: greedy selection is a different branch. */
export function softmaxProbabilities(logits, temperature = 1) {
  logitsArray(logits); finite(temperature, 'temperature')
  if (temperature <= 0) throw new RangeError('softmax temperature must be positive')
  const maximum = Math.max(...logits)
  // Subtract before dividing: a tiny positive T must not create Infinity-Infinity.
  const exponents = logits.map(logit => Math.exp((logit - maximum) / temperature))
  const total = sum(exponents)
  return exponents.map(value => value / total)
}

/** Stable token-index tie breaking; inclusion boundary is cumulative >= topP. */
export function nucleusFilter(probabilities, topP = 1) {
  probabilityArray(probabilities); finite(topP, 'topP')
  if (topP <= 0 || topP > 1) throw new RangeError('topP must be in (0,1]')
  const order = probabilities.map((_, index) => index).sort((a, b) => probabilities[b] - probabilities[a] || a - b)
  const kept = probabilities.map(() => false)
  let retainedMass = 0
  for (const index of order) {
    if (probabilities[index] === 0) continue
    kept[index] = true
    retainedMass += probabilities[index]
    // p=1 retains all positive support even if accumulation rounds to 1 early.
    if (topP < 1 && retainedMass >= topP) break
  }
  return { order, kept, retainedMass, probabilities: probabilities.map((value, index) => kept[index] ? value / retainedMass : 0) }
}

/** Inverse CDF uses half-open intervals; a boundary belongs to the next bin. */
export function selectToken(probabilities, draw) {
  probabilityArray(probabilities); finite(draw, 'draw')
  if (draw < 0 || draw >= 1) throw new RangeError('draw must be in [0,1)')
  let cumulative = 0, lastPositive = -1
  for (const [index, probability] of probabilities.entries()) {
    if (probability === 0) continue
    lastPositive = index
    cumulative += probability
    if (draw < cumulative) return index
  }
  // The final bin closes at 1; this only absorbs floating-point summation error.
  return lastPositive
}

export function distributionFromLogits(logits, options = {}, { prefix = [], fixtureId = 'custom' } = {}) {
  logitsArray(logits)
  const { temperature, topP, draw } = samplingOptions(options)
  const greedy = temperature === 0
  const probabilities = softmaxProbabilities(logits, greedy ? 1 : temperature)
  let selectedTokenId, kept, retainedMass, selectionProbabilities
  if (greedy) {
    const maximum = Math.max(...logits)
    selectedTokenId = logits.findIndex(value => value === maximum)
    kept = logits.map((_, index) => index === selectedTokenId)
    retainedMass = probabilities[selectedTokenId]
    selectionProbabilities = kept.map(value => value ? 1 : 0)
  } else {
    const filtered = nucleusFilter(probabilities, topP)
    ;({ kept, retainedMass } = filtered)
    selectionProbabilities = filtered.probabilities
    selectedTokenId = selectToken(selectionProbabilities, draw)
  }
  return {
    fixtureId, prefix: clonePrefix(prefix), temperature, topP, draw,
    effectiveTopP: greedy ? null : topP,
    selectionKind: greedy ? 'greedy' : 'sampling', probabilityKind: greedy ? 'reference-t1' : 'temperature',
    selectedTokenId, selectedLabel: GENERATION_TOKENS[selectedTokenId].label, retainedMass,
    rows: logits.map((logit, tokenId) => ({
      tokenId, label: GENERATION_TOKENS[tokenId].label, logit, probability: probabilities[tokenId],
      kept: kept[tokenId], selectionProbability: selectionProbabilities[tokenId], selected: tokenId === selectedTokenId
    }))
  }
}

/** Exact prefix lookup; an unknown prefix is never replaced with the base row. */
export function distributionForPrefix(prefix, options = {}) {
  if (!Array.isArray(prefix)) throw new TypeError('prefix must be an array')
  const ids = prefix.map(item => typeof item === 'number' ? item : item?.tokenId)
  if (!ids.every(id => Number.isInteger(id) && id >= 0 && id < 4)) throw new RangeError('prefix contains an invalid token ID')
  const key = ids.join(',')
  if (!Object.hasOwn(PREFIX_FIXTURES, key)) throw new RangeError('Unknown illustrative prefix')
  const occurrences = ids.map((id, index) => typeof prefix[index] === 'number'
    ? occurrence(id, index < 2 ? `prompt:${index}` : `generated:${index - 2}`)
    : { ...prefix[index] })
  return distributionFromLogits(PREFIX_FIXTURES[key].map(Math.log), options, { prefix: occurrences, fixtureId: `prefix-${ids.map(id => GENERATION_TOKENS[id].label.toLowerCase()).join('')}` })
}

export function generationComparison(kind = 'sampling') {
  if (!GENERATION_VARIATIONS.includes(kind)) throw new RangeError('Unknown variation')
  const before = prompt()
  const distributions = kind === 'sampling'
    ? [0.22, 0.62].map(draw => distributionForPrefix(before, { ...BASE_OPTIONS, draw }))
    : [[1.000001, 1, 0, -1], [0.999999, 1, 0, -1]].map((logits, index) => distributionFromLogits(logits, { temperature: 0, topP: 1, draw: 0.62 }, { prefix: before, fixtureId: `near-logit-${index}` }))
  const [left, right] = distributions.map(distribution => {
    const nextPrefix = [...clonePrefix(before), occurrence(distribution.selectedTokenId, 'generated:0')]
    const next = distributionForPrefix(nextPrefix, BASE_OPTIONS)
    return { ...distribution, nextPrefix, nextProbabilities: next.rows.map(row => row.probability) }
  })
  return { kind, changedField: kind === 'sampling' ? 'draw' : 'logit-A', left, right }
}

/** Fixed demo policy: BC is withheld and removed, EOS is not visible text. */
export function stoppingTrace(kind = 'natural') {
  if (!GENERATION_STOPS.includes(kind)) throw new RangeError('Unknown stop example')
  const maxSelections = kind === 'limit' ? 2 : 4
  const stopSequence = kind === 'sequence' ? 'BC' : null
  const selectedTokens = [], events = [{
    step: 0, selectedToken: null, selectedCount: 0, textTokenCount: 0, generatedText: '', visibleText: '', pendingText: '', chunk: '', finished: false, reason: null
  }]
  let generatedText = '', visibleText = '', reason = null
  for (const [index, probabilities] of STOP_PROBABILITIES.entries()) {
    const tokenId = selectToken(probabilities, 0.25)
    const selectedToken = occurrence(tokenId, `stop:${index}`)
    const conditionPrefix = [...prompt(), ...selectedTokens.map(token => ({ ...token }))]
    selectedTokens.push(selectedToken)
    generatedText += selectedToken.piece
    const step = index + 1, previousVisible = visibleText
    const match = stopSequence === null ? -1 : generatedText.indexOf(stopSequence)
    // This demo's precedence resolves EOS on the budget boundary as natural.
    if (tokenId === 4) reason = 'natural'
    else if (match >= 0) reason = 'sequence'
    else if (step >= maxSelections) reason = 'limit'
    let pendingText
    if (reason === 'sequence') {
      visibleText = generatedText.slice(0, match)
      pendingText = ''
    } else {
      // Hold a possible BC delimiter prefix even across token/event boundaries.
      const hold = stopSequence !== null && !reason && generatedText.endsWith('B') ? 1 : 0
      const safeEnd = generatedText.length - hold
      if (step === 1 || step === 3 || reason !== null) visibleText = generatedText.slice(0, safeEnd)
      pendingText = generatedText.slice(visibleText.length)
    }
    if (!visibleText.startsWith(previousVisible)) throw new Error('A transmitted prefix cannot be retracted')
    events.push({
      step, selectedToken: { ...selectedToken }, selectedCount: step,
      textTokenCount: selectedTokens.filter(token => token.tokenId !== 4).length,
      conditionPrefix, probabilities: [...probabilities], draw: 0.25,
      generatedText, visibleText, pendingText, chunk: visibleText.slice(previousVisible.length),
      finished: reason !== null, reason
    })
    if (reason !== null) break
  }
  const textTokens = selectedTokens.filter(token => token.tokenId !== 4).map(token => ({ ...token }))
  const reasonLabels = { natural: '自然終了', sequence: '停止文字列', limit: '上限' }
  return {
    reason, reasonLabel: reasonLabels[reason], selectedTokens, textTokens, generatedText, visibleText,
    selectedCount: selectedTokens.length, textTokenCount: textTokens.length, finished: true,
    stopSequence, maxSelections, outputValidated: false, events
  }
}

export function generationFrame(phase, options = {}) {
  const sampling = samplingOptions(options)
  const { variation = 'sampling', stop = 'natural', streamStep } = options
  if (!GENERATION_VARIATIONS.includes(variation)) throw new RangeError('Unknown variation')
  if (!GENERATION_STOPS.includes(stop)) throw new RangeError('Unknown stop example')
  const boundedPhase = clampPhase(phase, GENERATION_STAGES.length)
  const stage = stageForPhase(boundedPhase, GENERATION_STAGES.length)
  const before = prompt()
  // Stages 0-3 always use the same fixture. Stage-4 selectors cannot rewrite them.
  const source = distributionForPrefix(before, BASE_OPTIONS)
  const selected = occurrence(source.selectedTokenId, 'generated:0')
  const after = [...clonePrefix(before), { ...selected }]
  const next = distributionForPrefix(after, BASE_OPTIONS)
  const appendProgress = clamp01(boundedPhase - 1.5)
  const appended = boundedPhase >= 2.5
  const loop = { before, after, selected, source, next, appendProgress, appended, committedPrefix: clonePrefix(appended ? after : before) }
  const activeDistribution = stage === 3 ? next : stage === 4 ? distributionForPrefix(before, sampling) : source
  const comparison = generationComparison(variation)
  const stopping = stoppingTrace(stop)
  const progress = clamp01(2 * (boundedPhase - 6.5))
  if (streamStep !== undefined && (!Number.isInteger(streamStep) || streamStep < 0 || streamStep >= stopping.events.length)) throw new RangeError('streamStep must identify an event')
  const eventIndex = streamStep ?? Math.floor(progress * (stopping.events.length - 1))
  const streaming = { ...stopping.events[eventIndex], events: stopping.events, eventIndex, eventCount: stopping.events.length, progress }
  return {
    ...GENERATION_STAGES[stage], phase: boundedPhase, stage,
    dataKind: 'illustrative', fixtureVersion: 1,
    loop, activeDistribution, comparison, stopping, streaming,
    controls: { temperature: sampling.temperature, topP: sampling.topP, draw: sampling.draw, variation, stop }
  }
}
