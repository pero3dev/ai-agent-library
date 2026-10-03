import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Nextra has no switch for its Git timestamp lookup. Its inputs in this site
// are regenerated content/, so Git history is not the source of article dates.
// Keep every compiler operation and warning; replace only the repository
// initialization used exclusively by getLastCommitTime.
export function generatedContentLoaderSource() {
  const require = createRequire(import.meta.url)
  const packageRoot = dirname(require.resolve('nextra/package.json'))
  const filename = join(packageRoot, 'dist/server/loader.js')
  const source = readFileSync(filename, 'utf8')
  const start = source.indexOf('const repository = await (async () => {')
  const end = source.indexOf('\nconst GIT_ROOT =', start)
  if (start < 0 || end < 0 || !source.slice(start, end).endsWith('})();')) throw new Error('Nextra loader changed; generated-content adapter requires review')
  return (source.slice(0, start) + 'const repository = undefined;' + source.slice(end))
    .replace(/from "(\.\.?\/[^\"]+)"/g, (_match, specifier) => `from "${new URL(specifier, pathToFileURL(filename)).href}"`)
}
