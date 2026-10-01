'use client'

import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { OVERVIEW_STAGES, overviewFrame } from '../../lib/overview-reading-model.mjs'
import './overview-reading.css'
export { Text, Box, Tokens, Wire, Select } from './learning-scene-primitives'

export function Canvas({ diagram, phase, id, children }) {
  const frame = overviewFrame(diagram, phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-overview-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function OverviewFigure({ diagram, title, scene, controls, children }) {
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="LEARNING / OVERVIEW" stages={OVERVIEW_STAGES[diagram]} renderScene={scene} renderControls={controls}
    footnote="本文の関係と確認手順を示す模式図です。図の距離や色は、能力や信頼性の数値尺度ではありません。" className="overview-reading-walkthrough">{children}</ReadingFigure>
}
