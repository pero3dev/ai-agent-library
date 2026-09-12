'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { renderMermaidChart } from '../../lib/mermaid-render.mjs'

export function Mermaid({ chart }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const containerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [svg, setSvg] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const root = document.documentElement
    let disposed = false
    let generation = 0
    let previousTheme

    async function renderChart() {
      const dark = root.classList.contains('dark') || root.getAttribute('data-theme') === 'dark'
      if (previousTheme === dark) return
      previousTheme = dark
      const current = ++generation
      const isCurrent = () => !disposed && generation === current
      setFailed(false)
      try {
        await document.fonts.ready
        const { default: mermaid } = await import('mermaid')
        const result = await renderMermaidChart(mermaid, {
          id: `mermaid-${id}`, chart, dark, container: containerRef.current, isCurrent
        })
        if (result !== null && isCurrent()) setSvg(result)
      } catch (error) {
        if (!isCurrent()) return
        setSvg('')
        setFailed(true)
        console.error('Error while rendering mermaid', error)
      }
    }

    const observer = new MutationObserver(renderChart)
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    renderChart()
    return () => {
      disposed = true
      observer.disconnect()
    }
  }, [chart, visible, id])

  return (
    <div data-mermaid-renderer="strict">
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} />
      {failed && <p role="status">図を表示できませんでした。</p>}
    </div>
  )
}
