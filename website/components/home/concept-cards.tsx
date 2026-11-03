import Link from 'next/link'
import glossaryData from '../../generated/glossary.json'
import type { GlossaryEntry } from '../../lib/content-types'
import { FEATURED_TERMS } from './data'

const glossary: GlossaryEntry[] = glossaryData

/** 重要概念カード。データは GLOSSARY.md から sync が生成した glossary.json(単一ソース) */
export function ConceptCards() {
  const terms = FEATURED_TERMS.map(name => glossary.find(g => g.name === name)).filter((term): term is GlossaryEntry => term !== undefined)

  return (
    <div className="concept-grid">
      {terms.map(term => (
        <Link key={term.name} href={term.href ?? '/glossary'} className="concept-card">
          <span className="concept-name">{term.name}</span>
          {term.english && <span className="concept-english">{term.english}</span>}
          <p className="concept-summary">{term.summary}</p>
        </Link>
      ))}
    </div>
  )
}
