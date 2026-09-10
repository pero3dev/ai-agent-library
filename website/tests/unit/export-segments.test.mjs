import assert from 'node:assert/strict'
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { materializeExportSegments } from '../../lib/export-segments.mjs'

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'export-segments-'))
  // mkdtemp が作った固定のルートだけを削除する。リンク先は削除しない。
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(root).startsWith('export-segments-'))
    rmSync(root, { recursive: true, force: true })
  })
  const out = path.join(root, 'out')
  mkdirSync(out)
  const put = (relative, contents) => {
    const file = path.join(out, ...relative.split('/'))
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, contents)
    return file
  }
  return { root, out, put }
}

test('Windows export の実際の階層を通常・動的・多段セグメントの配信名へ複製する', t => {
  const { out, put } = fixture(t)
  const cases = [
    ['roadmap/__next.roadmap/__PAGE__.txt', 'roadmap/__next.roadmap.__PAGE__.txt'],
    ['docs/concepts/tool-use/__next.docs/$oc$mdxPath/__PAGE__.txt', 'docs/concepts/tool-use/__next.docs.$oc$mdxPath.__PAGE__.txt'],
    ['foo/bar/__next.foo/bar/@panel/__PAGE__.txt', 'foo/bar/__next.foo.bar.@panel.__PAGE__.txt']
  ]
  for (const [source] of cases) put(source, `0:{"segment":"${source}"}\n1:日本語\n`)
  put('roadmap/__next._tree.txt', 'existing tree')
  put('assets/nested/notes.txt', 'ordinary asset')
  put('roadmap/__next.roadmap/preview.json', '{}')

  assert.deepEqual(materializeExportSegments(out), { created: 3, existing: 0 })
  for (const [source, target] of cases) {
    assert.deepEqual(readFileSync(path.join(out, target)), readFileSync(path.join(out, source)))
  }
  assert.equal(readFileSync(path.join(out, 'roadmap/__next._tree.txt'), 'utf8'), 'existing tree')
  assert.equal(readFileSync(path.join(out, 'assets/nested/notes.txt'), 'utf8'), 'ordinary asset')
  assert.ok(!readdirSync(path.join(out, 'roadmap')).includes('__next.roadmap.preview.json'))
})

test('Linux の正規出力は no-op で内容も更新時刻も変えない', t => {
  const { out, put } = fixture(t)
  const files = [
    put('roadmap/__next.roadmap.__PAGE__.txt', 'page'),
    put('roadmap/__next._index.txt', 'index'),
    put('roadmap/__next._full.txt', 'full'),
    put('__next.__PAGE__.txt', 'root page')
  ]
  for (const file of files) utimesSync(file, 1_600_000_000, 1_600_000_000)
  const before = files.map(file => [readFileSync(file), statSync(file).mtimeMs])
  assert.deepEqual(materializeExportSegments(out), { created: 0, existing: 0 })
  assert.deepEqual(files.map(file => [readFileSync(file), statSync(file).mtimeMs]), before)
})

test('同じ内容の正規出力は許容し、再実行しても上書きしない', t => {
  const { out, put } = fixture(t)
  put('roadmap/__next.roadmap/__PAGE__.txt', Buffer.from([0, 1, 255, 10]))
  assert.equal(materializeExportSegments(out).created, 1)
  const target = path.join(out, 'roadmap/__next.roadmap.__PAGE__.txt')
  utimesSync(target, 1_600_000_000, 1_600_000_000)
  const modified = statSync(target).mtimeMs
  assert.deepEqual(materializeExportSegments(out), { created: 0, existing: 1 })
  assert.equal(statSync(target).mtimeMs, modified)
})

test('異なる既存内容との衝突は、他の互換ファイルも追加する前に失敗する', t => {
  const { out, put } = fixture(t)
  put('a/__next.a/__PAGE__.txt', 'new a')
  put('z/__next.z/__PAGE__.txt', 'new z')
  const target = put('z/__next.z.__PAGE__.txt', 'keep existing z')
  assert.throws(() => materializeExportSegments(out), /既存のセグメントと内容が異なります/)
  assert.equal(readFileSync(target, 'utf8'), 'keep existing z')
  assert.ok(!readdirSync(path.join(out, 'a')).includes('__next.a.__PAGE__.txt'))
})

test('異なる階層が同じ出力名になる場合も、異なる内容なら失敗する', t => {
  const { out, put } = fixture(t)
  put('route/__next.foo/a.b/__PAGE__.txt', 'one')
  put('route/__next.foo/a/b/__PAGE__.txt', 'two')
  assert.throws(() => materializeExportSegments(out), /セグメントの出力名が衝突しました/)
  assert.ok(!readdirSync(path.join(out, 'route')).includes('__next.foo.a.b.__PAGE__.txt'))
})

test('出力先と同名のディレクトリは上書きしない', t => {
  const { out, put } = fixture(t)
  put('route/__next.route/__PAGE__.txt', 'page')
  const target = path.join(out, 'route/__next.route.__PAGE__.txt')
  mkdirSync(target)
  assert.throws(() => materializeExportSegments(out), /通常ファイルではありません/)
  assert.ok(statSync(target).isDirectory())
})

test('出力範囲外へのディレクトリリンクを辿らず、外部ファイルを作らない', t => {
  const { root, out, put } = fixture(t)
  const outside = path.join(root, 'outside')
  mkdirSync(outside)
  writeFileSync(path.join(outside, '__PAGE__.txt'), 'outside')
  put('a/__next.a/__PAGE__.txt', 'in range')
  symlinkSync(outside, path.join(out, '__next.escape'), 'junction')
  assert.throws(() => materializeExportSegments(out), /リンクは辿りません/)
  assert.deepEqual(readdirSync(outside), ['__PAGE__.txt'])
  assert.ok(!readdirSync(path.join(out, 'a')).includes('__next.a.__PAGE__.txt'))
})

test('出力ルート自体がリンクなら失敗し、リンク先を変更しない', t => {
  const { root, out } = fixture(t)
  const linked = path.join(root, 'linked-out')
  symlinkSync(out, linked, 'junction')
  assert.ok(lstatSync(linked).isSymbolicLink())
  assert.throws(() => materializeExportSegments(linked), /通常ディレクトリではありません/)
  assert.deepEqual(readdirSync(out), [])
})
