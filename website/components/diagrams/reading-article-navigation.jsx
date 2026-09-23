'use client'

import { createContext, useContext } from 'react'

export const ReadingArticleNavigation = createContext({ firstDiagramId: null, items: [] })

export function ReadingArticleNavigationProvider({ firstDiagramId, items, children }) {
  return <ReadingArticleNavigation.Provider value={{ firstDiagramId, items }}>{children}</ReadingArticleNavigation.Provider>
}

/** Render outside the lazy figure so loading or failure cannot move the article. */
export function ReadingArticleContents({ diagramId }) {
  const navigation = useContext(ReadingArticleNavigation)
  if (navigation.firstDiagramId !== diagramId || navigation.items.length === 0) return null
  return <nav className="rf-article-toc" aria-label="この記事の目次">
    <details><summary>この記事の目次</summary><ol>{navigation.items.map(item => <li key={item.id} data-depth={item.depth}><a href={`#${encodeURIComponent(item.id)}`}>{item.label}</a></li>)}</ol></details>
  </nav>
}
