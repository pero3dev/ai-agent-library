import { clampPhase, stageForPhase } from './reading-clock.mjs'

export const SPECULATIVE_TOKENS = Object.freeze(['A', 'B', 'C', 'D'])
export const SPECULATIVE_CASES = Object.freeze([
  { id: 'first-reject', label: '先頭で止まる' },
  { id: 'middle-reject', label: '途中で止まる' },
  { id: 'all-accept', label: 'すべて採用' }
])
export const SPECULATIVE_STAGES = Object.freeze([
  { label: '下書き', title: 'まだ確定していない候補', detail: '下書きモデルが、直前までの候補を条件に3個を順に選びます。確定済みのABと候補ABCを分けて保持します。' },
  { label: '検証', title: '本命で複数位置をまとめて検証', detail: '本命は同じ条件prefixに対する分布を用意します。複数位置の計算をまとめることと、先頭から順に受理することは別です。' },
  { label: '貪欲', title: '先頭から一致する分を採用', detail: '貪欲法は本命の選択と順に比較し、最初の不一致を本命の選択で置換します。後続下書きは捨てます。各ケースは下書き分布が異なる固定例です。' },
  { label: '受理', title: '確率的な受理は、一致判定と別', detail: '同じprefixの本命pと下書きqから受理率min(1,p(x)/q(x))を求め、固定のuと比較します。最初の棄却後は判定を続けません。' },
  { label: '補正', title: '不足する確率を補って確定', detail: '棄却した位置のmax(p−q,0)を正規化し、補正分布から選びます。全受理なら補正せず、その先のprefixで本命から追加の1個を選びます。' },
  { label: '確認', title: '確定列と、保証の条件を確認', detail: '確率的な手順は同じprefixの有効p/qと正しい補正が条件です。貪欲法では同じ同率規則による本命の貪欲列と一致します。実速度や品質の保証ではありません。' }
])

// Hand-defined conditional model. These rows are not observed LLM outputs.
const P = [[1, 2, 6, 1], [2, 1, 3, 4], [4, 1, 2, 3], [3, 2, 1, 4]]
const Q = [[4, 3, 2, 1], [1, 4, 3, 2], [2, 1, 4, 3], [1, 3, 4, 2]]
const CASE_DRAWS = { 'first-reject': [.5, .1, .4], 'middle-reject': [.1, .5, .4], 'all-accept': [.1, .1, .4] }
const modeIsValid = mode => { if (!['sampling', 'greedy'].includes(mode)) throw new RangeError('unknown speculative mode') }
const caseIsValid = id => { if (!Object.hasOwn(CASE_DRAWS, id)) throw new RangeError('unknown speculative case') }
const drawIsValid = u => { if (!Number.isFinite(u) || u < 0 || u >= 1) throw new RangeError('draw must be in [0, 1)') }
const prefixIsValid = prefix => {
  if (typeof prefix !== 'string' || !/^AB[ABCD]*$/.test(prefix)) throw new RangeError('prefix must start with AB and contain known tokens')
}
const tokenIsValid = tokenId => { if (!Number.isInteger(tokenId) || tokenId < 0 || tokenId > 3) throw new RangeError('unknown token ID') }
const distributionIsValid = p => {
  if (!Array.isArray(p) || p.length !== 4 || Array.from(p).some(x => !Number.isFinite(x) || x < 0) || Math.abs(p.reduce((a, b) => a + b, 0) - 1) > 1e-12) throw new RangeError('expected four normalized probabilities')
}
const argmax = p => p.indexOf(Math.max(...p))
const oneHot = p => p.map((_, i) => Number(i === argmax(p)))
const occurrence = (tokenId, occurrenceId, origin) => ({ tokenId, value: SPECULATIVE_TOKENS[tokenId], occurrenceId, origin })

export function speculativeDistributions(prefix) {
  prefixIsValid(prefix)
  const row = prefix.length === 2 ? 0 : (SPECULATIVE_TOKENS.indexOf(prefix.at(-1)) + 1) % 4
  return { prefix, p: P[row].map(n => n / 10), q: Q[row].map(n => n / 10) }
}

export function selectSpeculativeToken(probabilities, u) {
  distributionIsValid(probabilities); drawIsValid(u)
  let cumulative = 0
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i]
    if (u < cumulative && probabilities[i] > 0) return i
  }
  // Normalization tolerance may leave the final representable draw above the sum.
  return probabilities.findLastIndex(p => p > 0)
}

export function speculativeAcceptance(p, q, tokenId) {
  distributionIsValid(p); distributionIsValid(q); tokenIsValid(tokenId)
  if (q[tokenId] === 0) throw new RangeError('proposal must have positive q probability')
  return Math.min(1, p[tokenId] / q[tokenId])
}

export function acceptsSpeculativeToken(p, q, tokenId, u) {
  drawIsValid(u)
  return u < speculativeAcceptance(p, q, tokenId)
}

export function speculativeResidual(p, q) {
  distributionIsValid(p); distributionIsValid(q)
  const positive = p.map((value, i) => Math.max(value - q[i], 0))
  const mass = positive.reduce((a, b) => a + b, 0)
  return { mass, probabilities: mass === 0 ? null : positive.map(value => value / mass) }
}

/** One block, with stable provenance. Draw overrides exist for finite-path tests. */
export function simulateSpeculativeBlock({ prefix = 'AB', mode = 'sampling', caseId = 'middle-reject', draftCount = 3,
  proposalDraws = [.2, .3, .5], acceptanceDraws = CASE_DRAWS[caseId], correctionDraw = .6, bonusDraw = .8 } = {}) {
  prefixIsValid(prefix); modeIsValid(mode); caseIsValid(caseId)
  if (![2, 3].includes(draftCount)) throw new RangeError('draftCount must be 2 or 3')
  for (const draws of [proposalDraws, acceptanceDraws]) {
    if (!Array.isArray(draws) || draws.length < draftCount || draws.length > 3) throw new RangeError('draw array must cover the draft')
    for (const u of draws) drawIsValid(u)
  }
  drawIsValid(correctionDraw); drawIsValid(bonusDraw)
  const id = `${mode}/${caseId}/${prefix}`
  const initialPrefix = [...prefix].map((value, i) => occurrence(SPECULATIVE_TOKENS.indexOf(value), `source/${i}`, 'source'))
  const draft = []
  let candidatePrefix = prefix
  for (let index = 0; index < draftCount; index++) {
    const { p, q } = speculativeDistributions(candidatePrefix)
    const qRef = mode === 'greedy' && (caseId === 'all-accept' || (caseId === 'middle-reject' && index === 0)) ? p : q
    const targetDistribution = mode === 'greedy' ? oneHot(p) : p
    const proposalDistribution = mode === 'greedy' ? oneHot(qRef) : qRef
    const tokenId = mode === 'greedy' ? argmax(qRef) : selectSpeculativeToken(qRef, proposalDraws[index])
    const token = occurrence(tokenId, `${id}/draft/${index}`, 'draft')
    draft.push({ ...token, index, prefixBefore: candidatePrefix, targetDistribution, proposalDistribution,
      targetReference: mode === 'greedy' ? p : null, proposalReference: mode === 'greedy' ? qRef : null,
      proposalDraw: mode === 'sampling' ? proposalDraws[index] : null,
      acceptanceRate: mode === 'sampling' ? speculativeAcceptance(p, qRef, tokenId) : null,
      acceptanceDraw: null, status: 'discarded' })
    candidatePrefix += token.value
  }
  const committedSuffix = []
  let firstRejectedIndex = null, correction = null, bonus = null
  for (const token of draft) {
    const accepted = mode === 'greedy' ? token.targetDistribution[token.tokenId] === 1
      : acceptsSpeculativeToken(token.targetDistribution, token.proposalDistribution, token.tokenId, acceptanceDraws[token.index])
    token.acceptanceDraw = mode === 'sampling' ? acceptanceDraws[token.index] : null
    token.status = accepted ? 'accepted' : 'rejected'
    if (accepted) { committedSuffix.push(occurrence(token.tokenId, token.occurrenceId, 'draft')); continue }
    firstRejectedIndex = token.index
    const residual = mode === 'sampling' ? speculativeResidual(token.targetDistribution, token.proposalDistribution)
      : { mass: null, probabilities: token.targetDistribution }
    if (!residual.probabilities) throw new Error('rejection has no residual mass')
    const tokenId = mode === 'sampling' ? selectSpeculativeToken(residual.probabilities, correctionDraw) : argmax(token.targetDistribution)
    const replacement = occurrence(tokenId, `${id}/correction/${token.index}`, 'correction')
    correction = { prefixBefore: token.prefixBefore, distribution: residual.probabilities, mass: residual.mass,
      draw: mode === 'sampling' ? correctionDraw : null, occurrence: replacement }
    committedSuffix.push(replacement)
    break
  }
  const acceptedDraftCount = draft.filter(token => token.status === 'accepted').length
  if (firstRejectedIndex === null) {
    const { p } = speculativeDistributions(candidatePrefix)
    const distribution = mode === 'sampling' ? p : oneHot(p)
    const tokenId = mode === 'sampling' ? selectSpeculativeToken(distribution, bonusDraw) : argmax(p)
    const extra = occurrence(tokenId, `${id}/bonus/${draftCount}`, 'bonus')
    bonus = { prefixBefore: candidatePrefix, distribution, draw: mode === 'sampling' ? bonusDraw : null, occurrence: extra }
    committedSuffix.push(extra)
  }
  return { mode, caseId, draftCount, initialPrefix, draft, firstRejectedIndex, acceptedDraftCount, correction, bonus,
    committedSuffix, nextPrefix: [...initialPrefix, ...committedSuffix] }
}

export function speculativeFrame(phase, { mode = 'sampling', caseId = 'middle-reject' } = {}) {
  modeIsValid(mode); caseIsValid(caseId)
  const bounded = clampPhase(phase, SPECULATIVE_STAGES.length), stage = stageForPhase(bounded, SPECULATIVE_STAGES.length)
  const effectiveMode = stage === 2 ? 'greedy' : stage === 5 ? mode : 'sampling'
  const effectiveCase = stage < 2 ? 'middle-reject' : caseId
  const result = simulateSpeculativeBlock({ mode: effectiveMode, caseId: effectiveCase })
  const left = Math.max(0, stage - .5), right = Math.min(5, stage + .5)
  const progress = (bounded - left) / (right - left)
  const focusIndex = Math.min(result.firstRejectedIndex ?? 2, Math.floor(progress * 3))
  const comparison = result.draft[result.firstRejectedIndex ?? 2]
  return { ...SPECULATIVE_STAGES[stage], ...result, stage, phase: bounded, progress, focusIndex, comparison,
    visibleSuffix: stage < 2 ? [] : stage === 3 ? result.committedSuffix.filter(token => token.origin === 'draft') : result.committedSuffix,
    modeFixtureNote: effectiveMode === 'greedy' ? '下書き分布が異なる固定例' : '同じ下書きABC・受理用uだけ変更' }
}
