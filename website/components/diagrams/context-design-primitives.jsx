'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CONTEXT_DESIGN_STAGES, contextDesignFrame } from '../../lib/context-design-model.mjs'
import './context-design.css'
export { Text, Box, Tokens, Wire, Select } from './learning-scene-primitives'
export function ContextCanvas({ diagram, phase, id, children }) {
  const frame = contextDesignFrame(diagram, phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-context-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function ContextFigure({ diagram, title, scene, controls, children }) {
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="CONTEXT / ARCHITECTURE" stages={CONTEXT_DESIGN_STAGES[diagram]} renderScene={scene} renderControls={controls} className="context-design-walkthrough"
    footnote="構成・保持情報・信頼境界を示す模式図です。箱の面積は実トークン量や品質の尺度ではありません。">{children}</ReadingFigure>
}
