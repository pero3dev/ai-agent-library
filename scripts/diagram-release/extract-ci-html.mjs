import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { parseArgs, repoRoot, outputRoot, insideExisting, newChild, relativePath } from './portable-paths.mjs'

// Offline extractor: list the tar and read only seven regular HTML members through
// stdout. No archive member path is used as a filesystem destination.
const args = parseArgs(process.argv.slice(2), ['repo', 'output', 'archive'])
if (args.help) { console.log('Offline only: node extract-ci-html.mjs --archive=<archive.tar inside output> --output=<evidence-directory> [--repo=<root; default cwd>]'); process.exit(0) }
assert.ok(args.archive && args.output, '--archive and --output are required')
const repo = await repoRoot(args.repo)
const ownedRoot = await outputRoot(args.output, repo)
const archive = await insideExisting(ownedRoot, args.archive)
const output = await newChild(ownedRoot, 'html-' + new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-'))
const tarOptions = { windowsHide: true, timeout: 120_000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }
const inventory = execFileSync('tar', ['-tf', archive], { ...tarOptions, encoding: 'utf8' })
await writeFile(join(output, 'tar-inventory.txt'), inventory)
const members = inventory.split(/\r?\n/).filter(Boolean)
const routes = [
  '/docs/llm-internals/inference-internals',
  '/docs/llm-foundations/how-llms-generate-text',
  '/docs/llm-foundations/tokenization',
  '/docs/llm-internals/mixture-of-experts-internals',
  '/docs/llm-internals/attention-variants-and-long-context',
  '/docs/llm-internals/transformer-architecture',
  '/docs/llm-foundations/llm-training-pipeline'
]
const hash = data => createHash('sha256').update(data).digest('hex')
const documents = []
for (const route of routes) {
  const stem = route.slice(1), paths = [stem + '.html', stem + '/index.html']
  const selected = members.filter(member => paths.includes(member.replace(/^\.\//, '')))
  assert.equal(selected.length, 1, `Expected one unambiguous HTML member for ${route}`)
  const member = selected[0]
  // Reject links/directories instead of following any archive indirection.
  const details = execFileSync('tar', ['-tvf', archive, '--', member], { ...tarOptions, encoding: 'utf8' }).trim()
  assert.ok(details.startsWith('-') && details.split(/\r?\n/).length === 1, `Not one regular file: ${member}`)
  const bytes = execFileSync('tar', ['-xOf', archive, '--', member], tarOptions)
  assert.ok(bytes.length > 100 && bytes.length < 32 * 1024 * 1024, 'Unexpected HTML size')
  const html = bytes.toString('utf8'); assert.ok(html.includes('<!DOCTYPE html>') || html.includes('<!doctype html>'), 'Expected exported HTML')
  const unescaped = html.replaceAll('\\"', '"')
  const ids = [...new Set([...unescaped.matchAll(/"b":"([A-Za-z0-9_-]+)"/g)].map(match => match[1]))]
  assert.equal(ids.length, 1, `Expected a single Flight build ID in ${member}`)
  const file = join(output, route.split('/').at(-1) + '.html')
  await writeFile(file, bytes)
  documents.push({ route, archiveMember: member, localFile: file, bytes: bytes.length, htmlSHA256: hash(bytes), buildId: ids[0] })
}
assert.equal(documents.length, 7, 'Expected inference, generation, tokenization, MoE, attention variants, Transformer and training artifact documents')
assert.equal(new Set(documents.map(item => item.buildId)).size, 1, 'The seven artifact documents belong to different builds')
const tarHash = createHash('sha256')
for await (const chunk of createReadStream(archive)) tarHash.update(chunk)
const result = { output, portableReferences: { relativeTo: 'explicit output directory', archive: relativePath(ownedRoot, archive), documents: documents.map(item => ({ route: item.route, file: relativePath(ownedRoot, item.localFile) })) }, evidenceClass: 'offline-github-pages-artifact-extraction', archive, archiveTarSHA256: tarHash.digest('hex'), expectedBuildId: documents[0].buildId, documents }
await writeFile(join(output, 'artifact-html.json'), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
