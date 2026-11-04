// Project-owned adapter for generated Markdown. Implementation is regenerated
// from the lockfile-installed Nextra by sync-content; dependencies stay intact.
type LoaderContext = { async(): (error: unknown, result?: string) => void }

module.exports = async function generatedContentLoader(this: LoaderContext, code: string) {
  const callback = this.async()
  try {
    const { pathToFileURL }: typeof import('node:url') = require('node:url')
    const { resolve }: typeof import('node:path') = require('node:path')
    const { loader } = await import(pathToFileURL(resolve(__dirname, '../generated/nextra-loader.mjs')).href)
    callback(null, await loader.call(this, code))
  } catch (error) { callback(error) }
}
