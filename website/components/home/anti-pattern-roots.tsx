import Link from 'next/link'
import { ANTI_PATTERN_ROOTS } from './data'

/** アンチパターンの 3 つの共通根。原本: docs/07-case-studies/common-anti-patterns.md */
export function AntiPatternRoots() {
  return (
    <div className="root-grid">
      {ANTI_PATTERN_ROOTS.map((root, i) => (
        <div key={root.title} className="root-card">
          <span className="root-num">{i + 1}</span>
          <h3 className="root-title">{root.title}</h3>
          <p className="root-body">{root.body}</p>
          <Link className="root-link" href={root.href}>
            {root.linkLabel} →
          </Link>
        </div>
      ))}
    </div>
  )
}
