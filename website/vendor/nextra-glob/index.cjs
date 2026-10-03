const { glob, globSync } = require('tinyglobby')

// Nextra 4.6.1 uses the async function and .sync with cwd/onlyDirectories.
// Reject an expanded contract rather than silently changing upstream behavior.
function optionsFor(patterns, options = {}) {
  const list = typeof patterns === 'string' ? [patterns] : patterns
  if (!Array.isArray(list) || list.some(value => typeof value !== 'string')) {
    throw new TypeError('Nextra build glob patterns must be strings')
  }
  if (list.some(value => value.length > 4096)) {
    throw new RangeError('Nextra build glob pattern exceeds 4096 characters')
  }
  for (const key of Object.keys(options)) {
    if (!['cwd', 'onlyDirectories'].includes(key)) {
      throw new TypeError(`Unsupported Nextra build glob option: ${key}`)
    }
  }
  return { braceExpansion: true, expandDirectories: false, ...options }
}

function nextraGlob(patterns, options) {
  return glob(patterns, optionsFor(patterns, options)).then(withoutDirectorySuffix)
}
const withoutDirectorySuffix = paths => paths.map(value => value.endsWith('/') ? value.slice(0, -1) : value)
nextraGlob.sync = (patterns, options) => withoutDirectorySuffix(globSync(patterns, optionsFor(patterns, options)))
module.exports = nextraGlob
