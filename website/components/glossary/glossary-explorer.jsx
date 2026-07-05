'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

/** 用語カードグリッド + テキストフィルタ。データは GLOSSARY.md 由来の glossary.json(単一ソース) */
export function GlossaryExplorer({ entries }) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? entries.filter(e =>
          [e.name, e.english ?? '', e.summary].some(v => v.toLowerCase().includes(q))
        )
      : entries
    // GLOSSARY.md と同じ二部構成(五十音 / A–Z)。先頭文字が ASCII なら A–Z 側
    const jp = filtered.filter(e => !/^[\x21-\x7e]/.test(e.name))
    const az = filtered.filter(e => /^[\x21-\x7e]/.test(e.name))
    return [
      { label: 'あ行〜わ行', items: jp },
      { label: 'A–Z', items: az }
    ].filter(g => g.items.length > 0)
  }, [entries, query])

  return (
    <div className="glossary-explorer">
      <input
        type="search"
        className="glossary-filter"
        placeholder="用語・英語表記・説明で絞り込み…"
        value={query}
        onChange={event => setQuery(event.target.value)}
        aria-label="用語の絞り込み"
      />
      {groups.length === 0 && <p className="glossary-empty">「{query}」に一致する用語はありません。</p>}
      {groups.map(group => (
        <section key={group.label} className="glossary-group">
          <h2 className="glossary-group-title">{group.label}</h2>
          <div className="glossary-grid">
            {group.items.map(entry => (
              <Link key={entry.name} href={entry.href ?? '#'} className="glossary-card">
                <span className="glossary-card-name">{entry.name}</span>
                {entry.english && <span className="glossary-card-english">{entry.english}</span>}
                <p className="glossary-card-summary">{entry.summary}</p>
                <span className="glossary-card-more">解説記事へ →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
