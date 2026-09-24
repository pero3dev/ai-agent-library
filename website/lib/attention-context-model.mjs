/** Uniform, continuous position mapping only; it does not model task quality. */
export const CONTEXT_STAGES = Object.freeze([
  { label: '学習範囲', title: '学習した位置の範囲を、入力と分けて見る。', formula: '上：入力の並び　／　下：位置符号化への割当て', detail: '同じ長い入力を全段階で保持します。下段の枠は学習時の位置の範囲であり、品質の合格範囲ではありません。' },
  { label: '外挿', title: 'そのままの位置では、学習範囲を越える。', formula: '入力を保ち、範囲外の位置もそのまま使う', detail: '外挿では、長い入力の後方が学習範囲の外へ対応します。色は範囲の内外を示し、品質の測定結果は示しません。' },
  { label: '補間', title: '全位置の目盛りを、学習範囲へ詰め直す。', formula: '入力は保持　／　割当て位置を一様に縮小', detail: 'すべての位置を同じ比率で対応づけます。入力の数と順序は保ち、位置を丸めたり統合したりしません。補間の模式図であり、追加学習や品質評価を代行しません。' },
  { label: '確認', title: '対応する長さと、使える品質・費用を確認する。', formula: '学習長・位置の拡張 ／ 実効品質 ／ 費用', detail: '選択した確認対象を強調します。中盤を含めて情報が使えるか、長い入力に必要な費用はどれほどかを、実タスクで確認します。図は合否や測定値を作りません。' }
].map(Object.freeze))

export const CONTEXT_CHECKS = Object.freeze([
  { id: 'training', label: '学習長と位置の拡張', caption: '学習した範囲と、位置を伸ばす方式を確認' },
  { id: 'quality', label: '中盤を含む実効品質', caption: '先頭・中盤・末尾の情報を、実タスクで評価' },
  { id: 'cost', label: '費用・待ち時間・KV', caption: '長い入力での費用・待ち時間・KVを確認' }
].map(Object.freeze))

// Eight distinct tokens provide legible correspondence, not a model limit.
const INPUT = Object.freeze(Array.from({ length: 8 }, (_, position) => Object.freeze({ id: `token-${position}`, position })))
export const CONTEXT_GEOMETRY = Object.freeze({ inputLength: 8, trainingLength: 4 })

export function mapContextPositions(tokens, { inputLength, trainingLength, interpolation = 1 } = {}) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new TypeError('A non-empty token array is required')
  if (![inputLength, trainingLength].every(value => Number.isFinite(value) && value > 0) || trainingLength > inputLength) throw new RangeError('Lengths must be positive, finite and ordered')
  if (!Number.isFinite(interpolation) || interpolation < 0 || interpolation > 1) throw new RangeError('Interpolation progress must be between zero and one')
  const scale = 1 + (trainingLength / inputLength - 1) * interpolation
  if (!(scale > 0)) throw new RangeError('Position scale must remain positive')
  const identities = new Set()
  let previous = -1
  return Array.from(tokens, token => {
    if (!token || typeof token.id !== 'string' || !token.id || identities.has(token.id)) throw new TypeError('Tokens require unique identities')
    if (!Number.isFinite(token.position) || token.position < 0 || token.position >= inputLength || token.position <= previous) throw new RangeError('Input positions must be strictly ordered within the input length')
    identities.add(token.id); previous = token.position
    return { ...token, assignedPosition: token.position * scale }
  })
}

/** The shared reading phase supplies all intermediate positions. */
export function contextFrame(stage, options = {}) {
  if (!Number.isInteger(stage) || stage < 0 || stage >= CONTEXT_STAGES.length) throw new RangeError('Unknown context stage')
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object')
  const { check = 'quality', phase = stage } = options
  if (!CONTEXT_CHECKS.some(item => item.id === check)) throw new RangeError('Unknown context check')
  if (!Number.isFinite(phase) || phase < 0 || phase > 3) throw new RangeError('Unknown context phase')
  // ReadingFigure changes its label at the midpoint. Keep extrapolation intact
  // through stage 1, then continuously reach the interpolation endpoint at 2.
  const interpolation = Math.max(0, Math.min(1, (phase - 1.5) * 2))
  const selected = CONTEXT_CHECKS.find(item => item.id === check)
  return {
    ...CONTEXT_STAGES[stage], stage, check: stage === 3 ? check : null,
    ...CONTEXT_GEOMETRY, interpolation,
    tokens: mapContextPositions(INPUT, { ...CONTEXT_GEOMETRY, interpolation }),
    checkCaption: selected.caption, qualityJudgment: null, costMeasurement: null
  }
}
