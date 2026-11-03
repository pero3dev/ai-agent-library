export function publicUrl(route, env = process.env) {
  const configured = env.NEXT_PUBLIC_SITE_URL
  if (env.STATIC_EXPORT === '1' && !configured) throw new Error('静的公開ビルドには NEXT_PUBLIC_SITE_URL が必要です')
  const url = new URL(configured || 'http://localhost:3000')
  const base = (env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
  const sitePath = url.pathname.replace(/\/$/, '')
  const prefix = sitePath || base
  if (sitePath && base && sitePath !== base) throw new Error('SITE_URL のパスと BASE_PATH が一致しません')
  url.pathname = `${prefix}${route === '/' ? '/' : route}`
  url.search = ''; url.hash = ''
  return url.href
}

export function pageMetadata(route, title, description, modified) {
  const url = publicUrl(route)
  return {
    title, description, alternates: { canonical: url },
    openGraph: { url, title, description, type: modified ? 'article' : 'website', ...(modified ? { modifiedTime: modified } : {}) }
  }
}

export function plainSummary(text, title) {
  const section = text.match(/^## この記事の目的\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1]
  const paragraph = (section || text.replace(/^---[\s\S]*?---\s*/, '').replace(/^# .+\n/, '')).trim().split(/\n\s*\n/)[0]
  const plain = paragraph.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`>#]/g, '').replace(/\s+/g, ' ').trim()
  return (plain || title).slice(0, 180)
}

export function publicSectionIndex(text, repoRel, texts, getTitle) {
  const dir = repoRel.slice(0, repoRel.lastIndexOf('/') + 1)
  return text.replace(/## 収録予定ドキュメント/g, '## この章の記事')
    .replace(/^ファイル名がリンクになっているものは執筆済みです[^\n]*\n?/gm, '')
    .replace(/\| ファイル \|/g, '| 記事 |')
    .replace(/\[([^\]]+\.md)\]\(([^)]+\.md)\)/g, (match, _label, target) => {
      const source = texts.get(`${dir}${target.replace(/^\.\//, '')}`)
      return source ? `[${getTitle(source)}](${target})` : match
    })
}
