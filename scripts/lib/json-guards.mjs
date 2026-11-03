/** JSON objects stay unknown until the boundary's domain validator accepts them.
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** @param {unknown} value */
export function errorMessage(value) {
  return value instanceof Error ? value.message : String(value)
}

/** @param {unknown} value @returns {value is Record<string, string>} */
export function isStringRecord(value) {
  return isRecord(value) && Object.values(value).every(item => typeof item === 'string')
}
