'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { ACTION_BOUNDARY_STAGES, actionBoundaryFrame } from '../../lib/action-boundaries-model.mjs'
import './action-boundaries.css'
export { Text, Box, Wire, Select } from './learning-scene-primitives'
export function ActionCanvas({ diagram, phase, id, children }) {
  const frame = actionBoundaryFrame(diagram, phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-action-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function ActionFigure({ diagram, title, scene, controls, children }) {
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="CONTROL / ARCHITECTURE" stages={ACTION_BOUNDARY_STAGES[diagram]} renderScene={scene} renderControls={controls} className="action-boundaries-walkthrough"
    footnote="実行順序・判断の位置・停止条件を読む模式図です。操作の承認や外部への実行は行いません。">{children}</ReadingFigure>
}
