/** @param {unknown} error */
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)
/** @param {unknown} error */
export const errorCode = (error: unknown) => error instanceof Error && 'code' in error ? String(error.code) : undefined
