'use client'

import { ReadingFigure } from './reading-figure'
import { SceneBase, Lines, Wire, Select, tones } from './concept-scene-primitives'
import { LEARNING_STAGES, learningFrame } from '../../lib/learning-foundations-model.mjs'
import './learning-scenes.css'

export { Wire, Select, tones }
export function Text({ x = 320, y, children, small = false, tone, anchor = 'middle' }) {
  const lines = Array.isArray(children) ? children : [children]
  return <g fill={tone ? tones[tone] : undefined}><Lines x={x} y={y} lines={lines} className={small ? 'lf-note' : 'lf-label'} anchor={anchor} gap={25} /></g>
}
export function Box({ x, y, width, height = 64, title, lines = [], tone = 'teal', active = true, ...props }) {
  const titleLines = []
  let line = '', units = 0
  for (const letter of String(title)) {
    const next = /[\u0020-\u007e]/.test(letter) ? .56 : 1
    if (units + next > (width - 24) / 22 && line) { titleLines.push(line); line = ''; units = 0 }
    line += letter; units += next
  }
  if (line) titleLines.push(line)
  return <g {...props} className="lf-box" data-active={String(active)}>
    <rect x={x} y={y} width={width} height={height} rx="11" fill={active ? '#17313c' : '#101e2e'} stroke={tones[tone]} strokeWidth={active ? 1.8 : 1} strokeOpacity={active ? .9 : .4} />
    <Text x={x + width / 2} y={y + 29}>{titleLines}</Text>
    {lines.length > 0 && <Text x={x + width / 2} y={y + 31 + titleLines.length * 25} small>{lines}</Text>}
  </g>
}
export function Tokens({ labels, y, start = 32, width = 576, selected = [], muted = [], tone = 'teal', name = 'tokens' }) {
  const pitch = width / labels.length
  return <g data-token-row={name}>{labels.map((label, i) => <g key={`${i}-${label}`} data-position={i} data-selected={String(selected.includes(i))} opacity={muted.includes(i) ? .3 : 1}>
    <rect x={start + i * pitch + 3} y={y} width={pitch - 6} height="47" rx="7" fill={selected.includes(i) ? '#214941' : '#112638'} stroke={selected.includes(i) ? tones[tone] : '#5f788e'} strokeWidth={selected.includes(i) ? 2 : 1} />
    <Text x={start + (i + .5) * pitch} y={y + 31} small>{label}</Text>
  </g>)}</g>
}
export function Canvas({ diagram, phase, id, children }) {
  const frame = learningFrame(diagram, phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-learning-diagram={diagram} data-stage={frame.stage}>
    {children(frame)}
  </SceneBase>
}
export function LearningFigure({ diagram, title, eyebrow, scene, controls, children, footnote }) {
  return <ReadingFigure diagramId={diagram} title={title} eyebrow={eyebrow} stages={LEARNING_STAGES[diagram]} renderScene={scene} renderControls={controls}
    footnote={footnote ?? '模式図です。実モデルの内部状態・精度・料金を測定した結果ではありません。'} className="learning-foundations-walkthrough">{children}</ReadingFigure>
}
