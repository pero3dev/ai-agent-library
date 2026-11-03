import { readFile } from 'node:fs/promises'
import path from 'node:path'

/** Generated copy files are read only by the server page, one route at a time. */
export function copyFileForRoute(route: string) {
  if (!/^\/docs(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(route)) throw new Error(`Invalid article route: ${route}`)
  return `${route === '/docs' ? 'index' : route.slice('/docs/'.length)}.json`
}

export async function readArticleMarkdown(route: string, directory = path.join(process.cwd(), 'generated', 'markdown')) {
  const markdown: unknown = JSON.parse(await readFile(path.join(directory, copyFileForRoute(route)), 'utf8'))
  if (typeof markdown !== 'string') throw new Error(`Invalid article Markdown: ${route}`)
  return markdown
}
