import { existsSync, lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'

// A fixed repository path is read as data. Markdown links never choose files to read.
export const ROADMAP_HISTORY = 'project/plans/content/roadmap-history.md'

export function roadmapSource(readText, hasFile) {
  return ['ROADMAP.md', ...(hasFile(ROADMAP_HISTORY) ? [ROADMAP_HISTORY] : [])]
    .map(file => readText(file)).join('\n\n')
}

export function readRoadmapSource(root) {
  const readText = file => {
    const absolute = path.join(root, file)
    let current = root
    for (const part of file.split('/')) {
      current = path.join(current, part)
      if (lstatSync(current).isSymbolicLink()) throw new Error(`ROADMAP の読取先にリンクは使えません: ${file}`)
    }
    return readFileSync(absolute, 'utf8')
  }
  return roadmapSource(readText, file => existsSync(path.join(root, file)))
}
