#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverArticles } from './audio/core.mjs'
import { defaultStateDirectory, doctor, loadConfig, runProduction } from './audio/pipeline.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export function parseArguments(args) {
  const options = { mode: null }
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (['--plan', '--doctor', '--run'].includes(arg)) { if (options.mode) throw new Error('Choose one of --plan, --doctor or --run'); options.mode = arg.slice(2) }
    else if (arg === '--resume') options.resume = true
    else if (arg === '--retry-held') options.retry_held = true
    else if (['--section', '--limit', '--config', '--state-dir'].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Missing value: ${arg}`)
      options[arg.slice(2).replaceAll('-', '_')] = args[++index]
    } else if (arg === '--help') options.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!options.mode && !options.help) throw new Error('Choose --plan, --doctor or --run; no generation is implicit')
  if (options.section && !/^\d{2}-[a-z0-9-]+$/.test(options.section)) throw new Error('Invalid --section')
  if (options.limit !== undefined && (!/^\d+$/.test(options.limit) || Number(options.limit) < 1 || Number(options.limit) > 1999)) throw new Error('--limit must be 1..1999')
  return options
}
export async function main(args = process.argv.slice(2)) {
  const options = parseArguments(args)
  if (options.help) { console.log('node scripts/audio-run.mjs --plan|--doctor|--run [--section 01-concepts] [--limit N] [--resume] [--retry-held] [--config path] [--state-dir path]\n--plan is read-only. --run consumes existing Claude subscription usage and runs local synthesis. --resume continues incomplete jobs (the default). --retry-held explicitly retries held jobs; quota cooldown is preserved.'); return }
  const stateDir = options.state_dir ? path.resolve(options.state_dir) : await defaultStateDirectory(repoRoot)
  const config = await loadConfig(path.resolve(options.config ?? path.join(repoRoot, 'automation/audio/config.json')), process.env, stateDir)
  if (options.mode === 'plan') {
    const articles = await discoverArticles(repoRoot, options)
    console.log(JSON.stringify({ schema_version: 1, article_count: articles.length, articles: articles.map(({ source, ...article }) => article), max_articles_per_run: options.limit ? Number(options.limit) : config.max_articles_per_run }, null, 2)); return
  }
  if (options.mode === 'doctor') { const result = await doctor(config, { cwd: repoRoot, stateDir }); console.log(JSON.stringify(result, null, 2)); if (!result.passed) process.exitCode = 2; return }
  const result = await runProduction({ repoRoot, stateDir, config, section: options.section, limit: options.limit ? Number(options.limit) : config.max_articles_per_run, retryHeld: options.retry_held })
  console.log(JSON.stringify(result, null, 2))
  if (['paused', 'blocked'].includes(result.status)) process.exitCode = 2
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1 })
