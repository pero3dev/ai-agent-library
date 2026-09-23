/**
 * A deterministic, single-head causal self-attention teaching model.
 * These small matrices are illustrative data, not a trace from a trained model.
 * Every visible result is calculated from X and the three projection matrices.
 */

function matrixShape(matrix, name) {
  if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0]) || matrix[0].length === 0) {
    throw new TypeError(`${name} must be a non-empty matrix`)
  }
  const columns = matrix[0].length
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== columns) {
      throw new TypeError(`${name} must be rectangular`)
    }
    for (const value of row) {
      if (!Number.isFinite(value)) throw new TypeError(`${name} must contain only finite numbers`)
    }
  }
  return [matrix.length, columns]
}

/** Multiply two finite, rectangular matrices. Inputs are never changed. */
export function matrixMultiply(left, right) {
  const [rows, shared] = matrixShape(left, 'left')
  const [rightRows, columns] = matrixShape(right, 'right')
  if (shared !== rightRows) throw new RangeError('Matrix inner dimensions must match')
  return Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => {
    let sum = 0
    for (let index = 0; index < shared; index++) sum += left[row][index] * right[index][column]
    if (!Number.isFinite(sum)) throw new RangeError('Matrix multiplication exceeded finite numeric range')
    return sum
  }))
}

/**
 * Stable softmax of one score row. -Infinity is a mask and maps to exact zero.
 * At least one finite score is required; an entirely masked row is undefined.
 */
export function rowSoftmax(row) {
  if (!Array.isArray(row) || row.length === 0) throw new TypeError('Softmax requires a non-empty row')
  let maximum = -Infinity
  for (const value of row) {
    if (!Number.isFinite(value) && value !== -Infinity) {
      throw new TypeError('Softmax scores must be finite numbers or -Infinity')
    }
    maximum = Math.max(maximum, value)
  }
  if (maximum === -Infinity) throw new RangeError('Softmax needs at least one unmasked score')
  const exponentials = row.map(value => value === -Infinity ? 0 : Math.exp(value - maximum))
  const total = exponentials.reduce((sum, value) => sum + value, 0)
  return exponentials.map(value => value / total)
}

function transpose(matrix) {
  return matrix[0].map((_, column) => matrix.map(row => row[column]))
}

/**
 * Compute softmax(causalMask(Q Kᵀ / √dₖ)) V, where Q=XWQ, K=XWK, V=XWV.
 * input is n×d, WQ and WK are d×dₖ, and WV is d×dᵥ.
 * All input matrices are copied so callers cannot change a computed trace.
 * Positional encoding, multiple heads, output projection and residuals are
 * outside this deliberately limited visualization of one attention head.
 */
export function createAttentionSample({ input, WQ, WK, WV } = {}) {
  const [tokenCount, inputDimension] = matrixShape(input, 'input')
  const [queryInputDimension, keyDimension] = matrixShape(WQ, 'WQ')
  const [keyInputDimension, keyOutputDimension] = matrixShape(WK, 'WK')
  const [valueInputDimension, valueDimension] = matrixShape(WV, 'WV')
  if ([queryInputDimension, keyInputDimension, valueInputDimension].some(size => size !== inputDimension)) {
    throw new RangeError('Projection input dimensions must match input columns')
  }
  if (keyDimension !== keyOutputDimension) throw new RangeError('Query and key dimensions must match')

  const copied = Object.fromEntries(Object.entries({ input, WQ, WK, WV }).map(([name, matrix]) => [
    name, matrix.map(row => [...row])
  ]))
  const Q = matrixMultiply(copied.input, copied.WQ)
  const K = matrixMultiply(copied.input, copied.WK)
  const V = matrixMultiply(copied.input, copied.WV)
  const scores = matrixMultiply(Q, transpose(K))
  const scaledScores = scores.map(row => row.map(score => score / Math.sqrt(keyDimension)))
  const maskedScores = scaledScores.map((row, query) => row.map((score, key) => key > query ? -Infinity : score))
  const weights = maskedScores.map(rowSoftmax)
  const output = matrixMultiply(weights, V)
  return { ...copied, Q, K, V, scores, scaledScores, maskedScores, weights, output, tokenCount, keyDimension, valueDimension }
}

function freezeTrace(trace) {
  for (const value of Object.values(trace)) {
    if (Array.isArray(value)) {
      value.forEach(Object.freeze)
      Object.freeze(value)
    }
  }
  return Object.freeze(trace)
}

/** Shared immutable example: 4 illustrative token positions, not word embeddings. */
export const ATTENTION_SAMPLE = freezeTrace(createAttentionSample({
  input: [
    [1, 0.2, -0.4, 0.6],
    [0.3, 1, 0.5, -0.2],
    [-0.4, 0.6, 1, 0.3],
    [0.7, -0.2, 0.4, 1]
  ],
  WQ: [
    [0.8, -0.2, 0.4],
    [0.3, 0.9, -0.1],
    [-0.4, 0.5, 0.8],
    [0.5, -0.3, 0.6]
  ],
  WK: [
    [0.6, 0.3, -0.2],
    [-0.1, 0.7, 0.5],
    [0.5, -0.4, 0.9],
    [0.8, 0.2, 0.4]
  ],
  WV: [
    [0.7, -0.4, 0.2],
    [0.2, 0.8, -0.3],
    [-0.5, 0.3, 0.9],
    [0.4, -0.2, 0.6]
  ]
}))
