// Project-owned adapter for generated Markdown. Implementation is regenerated
// from the lockfile-installed Nextra by sync-content; dependencies stay intact.
module.exports = async function generatedContentLoader(code) {
  const callback = this.async()
  try {
    const { pathToFileURL } = require('node:url')
    const { resolve } = require('node:path')
    const { loader } = await import(pathToFileURL(resolve(__dirname, '../generated/nextra-loader.mjs')).href)
    callback(null, await loader.call(this, code))
  } catch (error) { callback(error) }
}
