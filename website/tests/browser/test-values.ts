/** Fail explicitly when a test prerequisite is absent, while narrowing its type. */
export function requireValue<T>(value: T | null | undefined, description: string): T {
  if (value === null || value === undefined) throw new Error(`Missing test prerequisite: ${description}`)
  return value
}
