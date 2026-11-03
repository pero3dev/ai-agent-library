/** @param {unknown} error */
export const errorMessage = error => error instanceof Error ? error.message : String(error)
/** @param {unknown} error */
export const errorCode = error => error instanceof Error && 'code' in error ? String(error.code) : undefined
