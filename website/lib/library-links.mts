import { publicUrl } from './page-metadata.mjs'

/** The static export uses flat .html files, so the Markdown variant replaces that extension. */
export function markdownRoute(route: string) {
  const normalized = route.replace(/\/$/, '')
  return normalized ? `${normalized}.md` : '/index.md'
}

/** A chapter covers its pages only when the same build exports that chapter's index. */
export function llmsRoute(route: string, availableLlmsRoutes: ReadonlySet<string> = new Set()) {
  const chapter = route.match(/^\/docs\/([^/]+)(?:\/|$)/)?.[1]
  const candidate = chapter ? `/docs/${chapter}/llms.txt` : '/llms.txt'
  return availableLlmsRoutes.has(candidate) ? candidate : '/llms.txt'
}

function attribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/** Add discoverability only for Markdown files that the same build actually exports. */
export function addLibraryDiscoveryLinks(
  html: string,
  route: string,
  markdownAvailable = false,
  env: Readonly<Record<string, string | undefined>> = process.env,
  availableLlmsRoutes: ReadonlySet<string> = new Set()
) {
  if (!/<\/head\s*>/i.test(html)) throw new Error(`HTML head missing: ${route}`)
  const links = [
    `<link rel="describedby" href="${attribute(publicUrl(llmsRoute(route, availableLlmsRoutes), env))}"/>`,
    ...(markdownAvailable ? [`<link rel="alternate" type="text/markdown" href="${attribute(publicUrl(markdownRoute(route), env))}"/>`] : [])
  ]
  const missing = links.filter(link => !html.includes(link))
  return html.replace(/<\/head\s*>/i, `${missing.join('')}</head>`)
}
