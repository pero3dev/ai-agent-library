/** Pure presentation-clock helpers. They never run a model or move the page. */
function lastStage(stageCount) {
  if (!Number.isInteger(stageCount) || stageCount < 1) throw new RangeError('stageCount must be a positive integer')
  return stageCount - 1
}

export function clampPhase(phase, stageCount) {
  const last = lastStage(stageCount)
  if (!Number.isFinite(phase)) throw new TypeError('phase must be finite')
  return Math.max(0, Math.min(last, phase))
}

/** Labels, values, descriptions and scenes all use the same midpoint. */
export function stageForPhase(phase, stageCount) {
  return Math.round(clampPhase(phase, stageCount))
}

export function phaseAtElapsed(startPhase, elapsedMs, stageCount, reducedMotion = false) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new RangeError('elapsedMs must be non-negative and finite')
  const phase = clampPhase(clampPhase(startPhase, stageCount) + elapsedMs / 4500, stageCount)
  return reducedMotion ? Math.floor(phase) : phase
}

/** Rectangles belong to one figure, in prose order; missing prose stages are valid. */
export function readingStageAtLine(steps, line, stageCount) {
  const last = lastStage(stageCount)
  if (!Number.isFinite(line)) throw new TypeError('line must be finite')
  if (steps.length === 0) return 0
  let stage = 0
  for (const step of steps) {
    if (!Number.isInteger(step.stage) || step.stage < 0 || step.stage > last
      || !Number.isFinite(step.top) || !Number.isFinite(step.bottom) || step.bottom < step.top) {
      throw new RangeError('reading steps must have a valid stage and rectangle')
    }
    if (step.top <= line) stage = step.stage
  }
  return steps.at(-1).bottom < line ? last : stage
}
