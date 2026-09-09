import { lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'

function assertWithin(root, file) {
  const relative = path.relative(root, file)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`static export の範囲外です: ${file}`)
  }
}

function readRegularFile(file) {
  if (!lstatSync(file).isFile()) throw new Error(`通常ファイルではありません: ${file}`)
  return readFileSync(file)
}

function existingContents(file) {
  try {
    return readRegularFile(file)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

/**
 * Next の Windows export が階層化した __next.* セグメントを、ブラウザーが要求する
 * ドット区切り名でも生成する。実セグメント名を使い、URL ルートからは推測しない。
 * 元ファイル・既存の正規出力は変更しない。リンクは辿らず、衝突は書き込み前に検査する。
 */
export function materializeExportSegments(outDir) {
  const root = path.resolve(outDir)
  if (!lstatSync(root).isDirectory()) throw new Error(`通常ディレクトリではありません: ${root}`)
  const realRoot = realpathSync(root)
  const targets = new Map()

  const visit = (dir, segment = null) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      assertWithin(root, file)
      if (entry.isSymbolicLink()) throw new Error(`static export のリンクは辿りません: ${file}`)
      if (entry.isDirectory()) {
        const nested = segment
          ? { parent: segment.parent, parts: [...segment.parts, entry.name] }
          : entry.name.startsWith('__next.') ? { parent: dir, parts: [entry.name] } : null
        visit(file, nested)
      } else if (segment && entry.isFile() && entry.name.endsWith('.txt')) {
        const target = path.join(segment.parent, [...segment.parts, entry.name].join('.'))
        assertWithin(root, target)
        const contents = readRegularFile(file)
        const previous = targets.get(target)
        if (previous && !previous.equals(contents)) throw new Error(`セグメントの出力名が衝突しました: ${target}`)
        targets.set(target, contents)
      }
    }
  }
  visit(root)

  // 既存ファイルとの不一致があれば、互換ファイルを一件も追加する前に失敗させる。
  const pending = []
  for (const [target, contents] of targets) {
    assertWithin(realRoot, realpathSync(path.dirname(target)))
    const existing = existingContents(target)
    if (existing === null) pending.push([target, contents])
    else if (!existing.equals(contents)) throw new Error(`既存のセグメントと内容が異なります: ${target}`)
  }

  for (const [target, contents] of pending) {
    assertWithin(realRoot, realpathSync(path.dirname(target)))
    // 検査後に作られたファイルやリンクも上書きしない。
    writeFileSync(target, contents, { flag: 'wx' })
  }
  return { created: pending.length, existing: targets.size - pending.length }
}
