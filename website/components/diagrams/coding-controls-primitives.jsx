'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CODING_CONTROL_STAGES,codingControlFrame } from '../../lib/coding-controls-model.mjs'
import './coding-controls.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function ControlCanvas({diagram,phase,id,children}){
  const frame=codingControlFrame(diagram,phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-control-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function ControlFigure({diagram,title,scene,controls,children}){
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / CONTROL" stages={CODING_CONTROL_STAGES[diagram]} renderScene={scene} renderControls={controls} className="coding-controls-walkthrough"
    footnote="指示と権限・無人実行の境界を読む模式図です。実コマンド・承認・定期実行・通知は実行しません。">{children}</ReadingFigure>
}
