import Link from 'next/link'
import sections from '../../generated/sections.json'

/** 8 セクションのカードグリッド。データは sync が生成した sections.json */
export function SectionGrid() {
  return (
    <div className="section-grid">
      {sections.map(section => (
        <Link key={section.slug} href={section.route} className="section-card">
          <div className="section-card-head">
            <span className="section-num">{section.num}</span>
            <span className="section-count">{section.count} 本</span>
          </div>
          <h3 className="section-title">{section.title.replace(/^\d\d\.\s*/, '')}</h3>
          <p className="section-desc">{section.description}</p>
        </Link>
      ))}
    </div>
  )
}
