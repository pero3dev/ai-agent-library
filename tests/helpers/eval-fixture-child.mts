function evaluationEnvironmentChild(os: typeof import('node:os'), fs: typeof import('node:fs'), path: typeof import('node:path')) {
  fs.writeFileSync(path.join(os.tmpdir(), 'child-check.txt'), 'ok')
  fs.writeFileSync(path.join(process.env.npm_config_cache!, 'seed-check.txt'), 'ok')
  console.log(JSON.stringify({ temp: os.tmpdir(), cache: process.env.npm_config_cache, disabled: process.env.NODE_DISABLE_COMPILE_CACHE, parent: process.env.HARNESS_TEST_PARENT }))
}

export function evaluationEnvironmentChildSource(): string {
  // Keep the original CommonJS loader and environment; only invoke checked TS code.
  return `(${evaluationEnvironmentChild.toString()})(require('node:os'),require('node:fs'),require('node:path'))`
}
