/**
 * GLOSSARY 登録語の本文初出に付く用語リンク。ホバー/フォーカスで要約をポップオーバー表示し、
 * クリックで該当ドキュメントへ移動する。remark-doc-decorations が自動変換する
 */
'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'

export function GlossaryTerm({ href, summary, children }) {
  const tooltip = useRef(null)
  const [offset, setOffset] = useState(0)
  const fitToViewport = () => {
    const bounds = tooltip.current?.getBoundingClientRect()
    if (!bounds?.width) return
    const correction = Math.max(8 - bounds.left, Math.min(0, innerWidth - 8 - bounds.right))
    if (correction) setOffset(current => current + correction)
  }
  return (
    <Link className="glossary-term" href={href} onPointerEnter={fitToViewport} onFocus={fitToViewport}>
      {children}
      <span ref={tooltip} className="glossary-term-popover" role="tooltip" style={{ marginLeft: offset }}>
        {summary}
      </span>
    </Link>
  )
}
