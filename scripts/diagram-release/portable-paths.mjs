import assert from 'node:assert/strict'
import { lstat, mkdir, readFile, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const kitRoot = dirname(fileURLToPath(import.meta.url))
export function parseArgs(argv, values, flags = ['help']) {
  const args = Object.create(null)
  for (const arg of argv) {
    const match = /^--([a-z][a-z-]*)(?:=(.*))?$/.exec(arg)
    assert.ok(match, 'Use --name=value or a documented boolean flag')
    const [, key, value] = match
    assert.ok(!Object.hasOwn(args, key), `Duplicate option: --${key}`)
    assert.ok(values.includes(key) || flags.includes(key), `Unknown option: --${key}`)
    assert.ok(flags.includes(key) ? value === undefined : typeof value === 'string' && value.trim().length > 0, `Invalid value: --${key}`)
    args[key] = value ?? true
  }
  return args
}
export function assertInside(root, target, allowRoot = false) {
  const rel = relative(root, target)
  assert.ok((allowRoot || rel) && !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`), 'Path must remain inside the explicit output directory')
  return target
}
// Reject every existing symlink/junction ancestor before creating anything.
// This guards accidental redirection; do not use a directory writable by an
// untrusted concurrent process (these checks are not a filesystem sandbox).
export async function noLinks(target) {
  let current = resolve(target)
  while (true) {
    try { assert.ok(!(await lstat(current)).isSymbolicLink(), 'Symlink/junction paths are not allowed') }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return resolve(target)
}
export async function repoRoot(value = process.cwd()) {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 22, 'Node.js 22 or newer is required')
  const root = await realpath(resolve(value))
  for (const file of ['AGENTS.md', '.github/workflows/ci.yml', 'website/package.json', 'website/package-lock.json']) {
    assert.ok((await lstat(join(root, file))).isFile(), 'Use --repo=<repository-root>, or run from the repository root')
  }
  const pkg = JSON.parse(await readFile(join(root, 'website/package.json'), 'utf8'))
  assert.equal(pkg.name, 'ai-agent-library-website', 'Unexpected repository')
  return root
}
export async function canonicalProspective(value) {
  let ancestor = resolve(value)
  const suffix = []
  while (true) {
    try { return join(await realpath(ancestor), ...suffix) }
    catch (error) {
      if (error.code !== 'ENOENT') throw error
      const parent = dirname(ancestor)
      if (parent === ancestor) throw error
      suffix.unshift(basename(ancestor)); ancestor = parent
    }
  }
}
export async function outputRoot(value, repo, create = true) {
  assert.ok(typeof value === 'string' && value.trim(), '--output=<evidence-directory> is required')
  const root = resolve(value)
  assert.notEqual(root, parse(root).root, 'The filesystem root cannot be the output directory')
  const protectedRoots = await Promise.all([realpath(repo), realpath(kitRoot)])
  const outsideProtected = candidate => {
    for (const protectedRoot of protectedRoots) {
      const rel = relative(protectedRoot, candidate)
      assert.ok(rel && (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)), 'Output must be outside the repository and kit directories')
    }
  }
  await noLinks(root)
  // Resolve existing ancestors before mkdir, including Windows short names.
  outsideProtected(root)
  outsideProtected(await canonicalProspective(root))
  if (create) await mkdir(root, { recursive: true })
  assert.ok((await lstat(root)).isDirectory(), 'Output must be a directory')
  const actual = await realpath(root)
  outsideProtected(actual)
  return actual
}
export async function insideExisting(root, value, kind = 'file') {
  const target = assertInside(root, resolve(value))
  await noLinks(target)
  const actual = assertInside(root, await realpath(target))
  const info = await lstat(actual)
  assert.ok(kind === 'directory' ? info.isDirectory() : info.isFile(), `Expected a regular ${kind}`)
  return actual
}
export async function newChild(root, name) {
  assert.match(name, /^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Unsafe output child name')
  const child = assertInside(root, join(root, name))
  await noLinks(child)
  await mkdir(child) // Exclusive: never overwrite or reuse an earlier run.
  return child
}
export async function lockedPlaywright(repo) {
  const website = join(repo, 'website')
  const lock = JSON.parse(await readFile(join(website, 'package-lock.json'), 'utf8'))
  const pkg = JSON.parse(await readFile(join(website, 'package.json'), 'utf8'))
  const version = lock.packages?.['node_modules/@playwright/test']?.version
  assert.equal(pkg.devDependencies?.['@playwright/test'], version, 'Playwright package and lockfile must agree; run npm ci in website')
  const require = createRequire(pathToFileURL(join(website, 'package.json')))
  const modules = await realpath(join(website, 'node_modules'))
  const checkPackage = async (resolver, name, entry) => {
    const manifestFile = await realpath(resolver.resolve(name + '/package.json'))
    assertInside(modules, manifestFile)
    const installed = JSON.parse(await readFile(manifestFile, 'utf8'))
    const lockedVersion = lock.packages?.['node_modules/' + name]?.version
    assert.ok(lockedVersion, `Missing locked package: ${name}`)
    assert.equal(installed.version, lockedVersion, `Installed ${name} differs from website lockfile; run npm ci in website`)
    assertInside(dirname(manifestFile), await realpath(resolver.resolve(entry)))
    return createRequire(pathToFileURL(manifestFile))
  }
  const testRequire = await checkPackage(require, '@playwright/test', '@playwright/test')
  const playwrightRequire = await checkPackage(testRequire, 'playwright', 'playwright/test')
  await checkPackage(playwrightRequire, 'playwright-core', 'playwright-core')
  return require('@playwright/test')
}
export const relativePath = (root, file) => relative(root, file).split(sep).join('/')

// The collector uses this small, offline bridge for the same path checks.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), ['repo', 'output', 'existing', 'directory', 'new-child'])
  if (args.help) console.log('Offline path bridge: --repo=<root> --output=<directory> [--existing=<file>|--directory=<directory>|--new-child=<name>]')
  else {
    const repo = await repoRoot(args.repo)
    const output = await outputRoot(args.output, repo)
    const result = { repo, output }
    if (args.existing) result.existing = await insideExisting(output, args.existing)
    if (args.directory) result.directory = await insideExisting(output, args.directory, 'directory')
    if (args['new-child']) result.child = await newChild(output, args['new-child'])
    console.log(JSON.stringify(result))
  }
}
