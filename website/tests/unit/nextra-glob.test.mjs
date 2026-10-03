import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import glob from '../../vendor/nextra-glob/index.cjs'

test('Nextra resolves the audited build glob adapter', () => {
  const require = createRequire(import.meta.url)
  const nextraRequire = createRequire(require.resolve('nextra'))
  const adapter = nextraRequire.resolve('fast-glob')
  assert.equal(JSON.parse(readFileSync(path.join(path.dirname(adapter), 'package.json'), 'utf8')).name, '@ai-agent-library/nextra-glob')
})

test('Nextra content directory detection supports an empty brace choice without expanding directories', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'nextra-glob-'))
  try {
    await mkdir(path.join(cwd, 'src/content'), { recursive: true })
    await writeFile(path.join(cwd, 'src/content/article.mdx'), '# article')
    assert.deepEqual(glob.sync(['{src/,}content'], { cwd, onlyDirectories: true }), ['src/content'])
    await mkdir(path.join(cwd, 'content'))
    assert.deepEqual(new Set(glob.sync(['{src/,}content'], { cwd, onlyDirectories: true })), new Set(['src/content', 'content']))
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

test('Nextra page collection includes Markdown/meta and excludes private and dynamic app routes', async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'nextra-glob-'))
  const files = ['content/概念/article.mdx', 'content/chapter/notes.md', 'content/_meta.js',
    'app/docs/page.jsx', 'app/docs/_meta.ts', 'app/_meta.global.js',
    'app/_private/page.jsx', 'app/[[...mdxPath]]/page.jsx', 'app/[slug]/page.tsx',
    'content/chapter/image.png', 'unrelated/page.jsx']
  try {
    for (const relative of files) {
      const file = path.join(cwd, relative)
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, 'fixture')
    }
    const patterns = ['content/**/_meta.{js,jsx,ts,tsx}', 'content/**/*.{md,mdx}',
      'app/**/page.{js,jsx,jsx,tsx,md,mdx}', 'app/**/_meta.{js,jsx,ts,tsx}',
      'app/_meta.global.{js,jsx,ts,tsx}', '!app/**/{_,[}*/*']
    const expected = files.slice(0, 6).sort()
    assert.deepEqual((await glob(patterns, { cwd })).sort(), expected)
    assert.deepEqual(glob.sync(patterns, { cwd }).sort(), expected)
  } finally { await rm(cwd, { recursive: true, force: true }) }
})

test('unsupported APIs and excessively nested input fail before pattern processing', () => {
  assert.throws(() => glob.sync('**', { objectMode: true }), /Unsupported/)
  assert.throws(() => glob.sync(42), TypeError)
  assert.throws(() => glob.sync('{'.repeat(10000) + 'a,b' + '}'.repeat(10000)), /4096/)
})
