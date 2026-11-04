/** JSON objects stay unknown until the boundary's domain validator accepts them.
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** @param {unknown} value */
export function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : String(value)
}

/** @param {unknown} value @returns {value is Record<string, string>} */
export function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string')
}
