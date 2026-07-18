/**
 * GLOSSARY 登録語の本文初出に付く用語リンク。ホバー/フォーカスで要約をポップオーバー表示し、
 * クリックで該当ドキュメントへ移動する。remark-doc-decorations が自動変換する
 */
import Link from 'next/link'

export function GlossaryTerm({ href, summary, children }) {
  return (
    <Link className="glossary-term" href={href}>
      {children}
      <span className="glossary-term-popover" role="tooltip">
        {summary}
      </span>
    </Link>
  )
}
