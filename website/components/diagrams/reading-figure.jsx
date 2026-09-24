'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { clampPhase, stageForPhase, phaseAtElapsed, readingStageAtLine } from '../../lib/reading-clock.mjs'
import { ReadingStage } from './reading-step'

export { ReadingStep } from './reading-step'

const clamp = value => Math.max(0, Math.min(1, value))

function Icon({ name }) {
  const paths = {
    play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="4" />,
    back: <path d="m14 6-6 6 6 6M20 6l-6 6 6 6" />,
    next: <path d="m4 6 6 6-6 6M10 6l6 6-6 6" />,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    sync: <path d="M20 9a8 8 0 0 0-14-3L3 9m0-6v6h6m-5 6a8 8 0 0 0 14 3l3-3m0 6v-6h-6" />
  }
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

/** Shared reading controls; article scenes retain their own model and layout. */
export function ReadingFigure({ diagramId, title, eyebrow, stages, renderScene, renderControls, footnote, children, className = '' }) {
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = `${diagramId}-${instance}`
  if (!Array.isArray(stages) || stages.length === 0) throw new Error('ReadingFigure requires at least one stage')
  const count = stages.length
  const last = count - 1
  const root = useRef(null)
  const panel = useRef(null)
  const dialog = useRef(null)
  const opener = useRef(null)
  const animation = useRef(null)
  const playback = useRef(null)
  const phaseRef = useRef(0)
  const targetRef = useRef(0)
  const modeRef = useRef('reading')
  const visibleRef = useRef(true)
  const [phase, setPhase] = useState(0)
  const [mode, setMode] = useState('reading')
  const [reduced, setReduced] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [ready, setReady] = useState(false)
  const [fits, setFits] = useState(false)
  const stage = stageForPhase(phase, count)
  const playing = mode === 'playing'
  const sync = mode === 'reading'

  function update(value) {
    if (phaseRef.current === value) return
    phaseRef.current = value
    setPhase(value)
  }
  function stopAnimation() { cancelAnimationFrame(animation.current); animation.current = null }
  function finishTransition() {
    if (animation.current !== null && targetRef.current !== null) update(clampPhase(targetRef.current, count))
    stopAnimation()
  }
  function enterMode(next) {
    modeRef.current = next
    if (next !== 'playing') { cancelAnimationFrame(playback.current); playback.current = null }
    setMode(next)
  }
  function pause() { if (modeRef.current === 'playing') enterMode('manual') }
  function moveTo(value, animate = true) {
    stopAnimation()
    targetRef.current = value
    const from = phaseRef.current
    if (!animate || reduced || Math.abs(from - value) < 0.01) { update(value); return }
    const start = performance.now()
    const tick = now => {
      const t = clamp((now - start) / 800)
      update(from + (value - from) * (1 - (1 - t) ** 3))
      if (t < 1) animation.current = requestAnimationFrame(tick)
      else animation.current = null
    }
    animation.current = requestAnimationFrame(tick)
  }
  function seek(value, animate = true) {
    enterMode('manual')
    moveTo(clampPhase(value, count), animate)
  }

  useEffect(() => {
    setReady(true)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    change()
    media.addEventListener('change', change)
    return () => { media.removeEventListener('change', change); stopAnimation(); cancelAnimationFrame(playback.current) }
  }, [])

  useEffect(() => { if (reduced) finishTransition() }, [reduced])

  useEffect(() => {
    if (!sync || !ready) return
    let scheduled = null
    let disposed = false
    const track = () => {
      scheduled = null
      if (disposed || modeRef.current !== 'reading') return
      const node = root.current
      const bounds = node.getBoundingClientRect()
      if (bounds.top > window.innerHeight || bounds.bottom < 0) return
      const steps = [...node.querySelectorAll('[data-reading-step]')]
        .filter(element => element.closest('.reading-figure') === node)
        .map(element => {
          const rect = element.getBoundingClientRect()
          return { stage: Number(element.dataset.readingStep), top: rect.top, bottom: rect.bottom }
        })
      const current = readingStageAtLine(steps, Math.min(window.innerHeight * 0.4, 340), count)
      if (targetRef.current !== current) moveTo(current)
    }
    const schedule = () => { if (scheduled === null) scheduled = requestAnimationFrame(track) }
    track()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer = new ResizeObserver(schedule)
    observer.observe(root.current)
    return () => {
      disposed = true
      cancelAnimationFrame(scheduled)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [sync, ready, reduced, count])

  useEffect(() => {
    if (!playing) return
    if (document.hidden || (!visibleRef.current && !dialog.current?.open)) { pause(); return }
    stopAnimation()
    const startPhase = phaseRef.current >= last ? 0 : phaseRef.current
    update(startPhase)
    const start = performance.now()
    const tick = now => {
      if (modeRef.current !== 'playing') return
      // A frame timestamp can slightly precede the effect's performance.now().
      // Treat that first frame as elapsed zero rather than ending playback.
      const value = phaseAtElapsed(startPhase, Math.max(0, now - start), count, reduced)
      update(value)
      if (value >= last) enterMode('manual')
      else playback.current = requestAnimationFrame(tick)
    }
    playback.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(playback.current)
  }, [playing, reduced, count])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      // This observer has one target; queued transitions may arrive together.
      // Playback follows its latest visibility, not an older entry in the batch.
      const entry = entries.at(-1)
      if (!entry) return
      visibleRef.current = entry.isIntersecting
      if (!entry.isIntersecting && !dialog.current?.open) { pause(); finishTransition() }
    })
    observer.observe(panel.current)
    const visibility = () => { if (document.hidden) { pause(); finishTransition() } }
    document.addEventListener('visibilitychange', visibility)
    const print = () => flushSync(() => {
      pause()
      finishTransition()
      update(stageForPhase(phaseRef.current, count))
    })
    window.addEventListener('beforeprint', print)
    const measure = () => {
      const top = 5.1 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      setFits(panel.current.getBoundingClientRect().height <= window.innerHeight - top - 12)
    }
    const size = new ResizeObserver(measure)
    size.observe(panel.current)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      size.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('beforeprint', print)
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (expanded) dialog.current?.showModal()
    else if (dialog.current?.open) dialog.current.close()
  }, [expanded])

  function diagram(isExpanded = false) {
    const sceneId = `${id}${isExpanded ? '-large' : ''}`
    return <div className="aw-diagram" data-stage={stage} data-mode={mode}>
      <div className="aw-diagram-top">
        <span className="aw-eyebrow">{eyebrow}</span>
        <button type="button" className="aw-icon-button" aria-label={isExpanded ? '拡大図を閉じる' : '図を拡大'} onClick={event => {
          if (!isExpanded) opener.current = event.currentTarget
          setExpanded(!isExpanded)
        }} disabled={!ready}><Icon name={isExpanded ? 'close' : 'expand'} /></button>
      </div>
      <div className="aw-scene-heading">
        <span className="aw-scene-index">{String(stage + 1).padStart(2, '0')}<span> / {String(count).padStart(2, '0')}</span></span>
        <div><div className="aw-scene-title">{stages[stage].title}</div>{stages[stage].formula && <div className="aw-formula">{stages[stage].formula}</div>}</div>
      </div>
      {renderScene({ phase, stage, id: sceneId, ready })}
      {renderControls && <div className="rf-scene-controls">{renderControls({ ready, phase, stage })}</div>}
      <div className="aw-detail" aria-live={playing || (expanded && !isExpanded) ? 'off' : 'polite'}>{stages[stage].detail}</div>
      <div className="aw-timeline">
        <div className="aw-stages" role="group" aria-label="図解の段階">
          {stages.map((item, index) => <button key={index} type="button" onClick={() => seek(index)} aria-pressed={stage === index} disabled={!ready}><span className="aw-stage-dot" /><span>{item.label}</span></button>)}
        </div>
        <input type="range" min="0" max={last} step="0.01" value={phase} aria-label="図解の再生位置" aria-valuetext={`${stage + 1} / ${count}、${stages[stage].label}`} onChange={event => seek(Number(event.target.value), false)} disabled={!ready || count === 1} />
        <div className="aw-transport">
          <div className="aw-transport-buttons">
            <button type="button" className="aw-icon-button" aria-label="前の段階" onClick={() => seek(Math.ceil(phaseRef.current) - 1)} disabled={!ready || phase < 0.01}><Icon name="back" /></button>
            <button type="button" className="aw-play-button" aria-label={playing ? '図解を一時停止' : phase >= last ? '図解を最初から再生' : '図解を再生'} onClick={() => enterMode(playing ? 'manual' : 'playing')} disabled={!ready || count === 1}><Icon name={playing ? 'pause' : 'play'} /><span>{playing ? '停止' : '再生'}</span></button>
            <button type="button" className="aw-icon-button" aria-label="次の段階" onClick={() => seek(Math.floor(phaseRef.current) + 1)} disabled={!ready || phase >= last}><Icon name="next" /></button>
          </div>
          <button type="button" className="aw-sync-button" aria-pressed={sync} onClick={() => {
            stopAnimation()
            targetRef.current = null
            enterMode(sync ? 'manual' : 'reading')
          }} disabled={!ready}><Icon name="sync" />{sync ? '本文に連動中' : '本文に連動する'}</button>
        </div>
      </div>
      {footnote && <div className="aw-footnote">{footnote}</div>}
    </div>
  }

  return <section ref={root} className={`reading-figure ${className}`.trim()} aria-label={`${title}を動きで読む`} data-diagram-id={diagramId} data-ready={ready} data-current-stage={stage}>
    <div className="aw-intro"><div><span className="aw-kicker">INTERACTIVE READING</span><h4>{title}を、動きで読む。</h4></div><p>本文と図を、ひとつの流れで。<br />気になる瞬間は、止めて、戻して。</p></div>
    <div className="aw-layout">
      <ReadingStage.Provider value={stage}><div className="aw-prose">{children}</div></ReadingStage.Provider>
      <div ref={panel} className="aw-sticky" data-fits-viewport={fits}>{diagram()}</div>
    </div>
    <details className="rf-static-stages">
      <summary>図解の段階を一覧で読む</summary>
      <ol>{stages.map((item, index) => <li key={index}><strong>{item.label}</strong>{item.formula && <span className="rf-static-formula">{item.formula}</span>}<span>{item.detail}</span></li>)}</ol>
    </details>
    <noscript><p>動的図解の操作には JavaScript が必要です。本文と数式はこのまま読めます。</p></noscript>
    <dialog ref={dialog} className="aw-dialog" aria-label={`${title}の拡大図`} onCancel={() => setExpanded(false)} onClose={() => {
      setExpanded(false)
      pause()
      opener.current?.focus({ preventScroll: true })
    }}>{expanded && diagram(true)}</dialog>
  </section>
}
