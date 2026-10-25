import { readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Nextra 4.6.1 validates the theme props after removing children, although its
// schema requires that key with current Zod. Apply the upstream #4990 behavior
// only to a generated copy, keeping validation and installed dependencies intact.
// https://github.com/shuding/nextra/pull/4990
export function adaptNextraLayoutSource(source, { version, filename, outputFilename }) {
  if (version !== '4.6.1') throw new Error('Nextra theme version changed; layout adapter requires review')
  const validation = 'LayoutPropsSchema.safeParse(themeConfig)'
  const extraction = '({\n      footer,\n      navbar,\n      pageMap,\n      nextThemes,\n      banner,\n      ...rest\n    } = data);'
  for (const pattern of [validation, extraction]) {
    if (source.split(pattern).length !== 2) throw new Error('Nextra layout changed; children adapter requires review')
  }
  const adapted = source.replace(validation, 'LayoutPropsSchema.safeParse({ ...themeConfig, children })')
    .replace(extraction, extraction.replace('({\n', '({\n      children,\n'))
  return '// Generated from lockfile-installed nextra-theme-docs; MIT. See lib/nextra-generated-layout.mjs.\n' +
    adapted.replace(/from "(\.\.?\/[^\"]+)"/g, (_match, specifier) => {
      let target = relative(dirname(outputFilename), resolve(dirname(filename), specifier)).split(sep).join('/')
      if (!target.startsWith('.')) target = './' + target
      return `from ${JSON.stringify(target)}`
    })
}

export function generatedLayoutSource() {
  const entry = new URL(import.meta.resolve('nextra-theme-docs'))
  const filename = fileURLToPath(new URL('./layout.js', entry))
  const { version } = JSON.parse(readFileSync(new URL('../package.json', entry), 'utf8'))
  return adaptNextraLayoutSource(readFileSync(filename, 'utf8'), {
    version, filename,
    outputFilename: fileURLToPath(new URL('../generated/nextra-layout.mjs', import.meta.url))
  })
}
