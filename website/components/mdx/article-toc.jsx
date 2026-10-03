'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ArticleTocContext = createContext({ headings: [], activeId: '' })

export function ArticleTocProvider({ headings, children }) {
  const [activeId, setActiveId] = useState(headings[0]?.id || '')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!headings.length) return
    const nodes = headings.map(heading => document.getElementById(heading.id)).filter(Boolean)
    let frame = 0

    const update = () => {
      frame = 0
      const navbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nextra-navbar-height')) || 64
      const threshold = navbarHeight + 32
      let id = headings[0].id
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= threshold) id = node.id
        else break
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        id = headings.at(-1).id
      }
      setActiveId(previous => previous === id ? previous : id)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }

    update()
    setReady(true)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('hashchange', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('hashchange', schedule)
    }
  }, [headings])

  const value = useMemo(() => ({ headings, activeId, ready }), [headings, activeId, ready])
  return <ArticleTocContext.Provider value={value}>{children}</ArticleTocContext.Provider>
}

export function CurrentSectionToc() {
  const { headings, activeId, ready } = useContext(ArticleTocContext)
  // Keep Nextra's complete TOC available when JavaScript is unavailable.
  if (!ready || !headings.length) return null

  // A heading belongs to the most recent H2, including articles that contain H4.
  const groups = []
  let activeGroup = null
  for (const heading of headings) {
    if (heading.depth === 2 || !groups.length) groups.push({ heading, children: [] })
    else if (heading.depth === 3) groups.at(-1).children.push(heading)
    if (heading.id === activeId) activeGroup = groups.at(-1)
  }
  activeGroup ||= groups[0]

  return (
    <div className="article-section-toc">
      <p className="article-toc-title">この記事の目次</p>
      <p className="article-toc-hint">現在の節の小見出しを表示</p>
      <ul>
        {groups.map(group => {
          const current = group === activeGroup
          return (
            <li key={group.heading.id} data-current-section={current || undefined}>
              <a href={`#${group.heading.id}`} aria-current={activeId === group.heading.id ? 'location' : undefined}>
                {group.heading.value}
              </a>
              {current && group.children.length > 0 && (
                <ul className="article-toc-children">
                  {group.children.map(heading => (
                    <li key={heading.id}>
                      <a href={`#${heading.id}`} aria-current={activeId === heading.id ? 'location' : undefined}>
                        {heading.value}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
