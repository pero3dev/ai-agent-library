/**
 * GLOSSARY 登録語の本文初出に付く用語リンク。ホバー/フォーカスで要約をポップオーバー表示し、
 * クリックで該当ドキュメントへ移動する。remark-doc-decorations が自動変換する
 */
'use client'
import Link from 'next/link'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

export function GlossaryTerm({ href, summary, children }) {
  const tooltipId = useId()
  const termId = useId()
  const term = useRef(null)
  const tooltip = useRef(null)
  const closeTimer = useRef(null)
  const focusActive = useRef(false)
  const pointerInside = useRef(false)
  const [offset, setOffset] = useState(0)
  const [maxWidth, setMaxWidth] = useState(null)
  const [placement, setPlacement] = useState('above')
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [viewportRevision, setViewportRevision] = useState(0)
  const open = (hovered || focused) && !dismissed
  useLayoutEffect(() => {
    if (!open) return
    const bounds = tooltip.current?.getBoundingClientRect()
    if (!bounds?.width) return
    const scale = bounds.width / tooltip.current.offsetWidth
    const maximum = Math.floor((innerWidth - 16) / scale)
    if (maxWidth !== maximum) { setMaxWidth(maximum); return }
    const correction = Math.max(8 - bounds.left, Math.min(0, innerWidth - 8 - bounds.right))
    if (Math.abs(correction) > 0.5) setOffset(current => current + correction / scale)
    const termBounds = term.current.getBoundingClientRect()
    setPlacement(termBounds.top < bounds.height + 16 ? 'below' : 'above')
  }, [open, offset, maxWidth, viewportRevision])
  useEffect(() => {
    if (!open) return
    const dismiss = event => {
      if (event.key === 'Escape') setDismissed(true)
    }
    const resize = () => { setOffset(0); setViewportRevision(current => current + 1) }
    window.addEventListener('keydown', dismiss)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('keydown', dismiss)
      window.removeEventListener('resize', resize)
    }
  }, [open])
  useEffect(() => () => clearTimeout(closeTimer.current), [])
  return (
    <Link ref={term} className="glossary-term" href={href}
      aria-labelledby={termId} aria-describedby={tooltipId}
      onPointerEnter={() => {
        clearTimeout(closeTimer.current)
        if (!pointerInside.current && !focusActive.current) setDismissed(false)
        pointerInside.current = true
        setHovered(true)
      }}
      onPointerLeave={() => {
        pointerInside.current = false
        closeTimer.current = setTimeout(() => { setHovered(false); if (!focusActive.current) setDismissed(false) }, 150)
      }}
      onFocus={() => { focusActive.current = true; if (!hovered) setDismissed(false); setFocused(true) }}
      onBlur={() => { focusActive.current = false; setFocused(false); if (!hovered) setDismissed(false) }}>
      <span id={termId}>{children}</span>
      <span id={tooltipId} ref={tooltip} className="glossary-term-popover" role="tooltip"
        data-open={open || undefined} data-placement={placement} style={{ marginLeft: offset, maxWidth: maxWidth ?? undefined }}>
        {summary}
      </span>
    </Link>
  )
}
