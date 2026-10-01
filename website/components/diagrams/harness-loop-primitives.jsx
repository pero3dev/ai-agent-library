'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { HARNESS_LOOP_STAGES, harnessLoopFrame } from '../../lib/harness-loop-model.mjs'
import './harness-loop.css'
export { Text, Box, Wire, Select } from './learning-scene-primitives'
export function HarnessCanvas({ diagram, phase, id, children }) {
  const frame = harnessLoopFrame(diagram, phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-harness-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function HarnessFigure({ diagram, title, scene, controls, children }) {
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="HARNESS / CONTROL" stages={HARNESS_LOOP_STAGES[diagram]} renderScene={scene} renderControls={controls} className="harness-loop-walkthrough"
    footnote="部品と制御の責務を読む模式図です。品質・費用の測定値や、実行を戻す操作ではありません。">{children}</ReadingFigure>
}
