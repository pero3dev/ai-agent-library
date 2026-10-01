'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CODING_DECISION_STAGES,codingDecisionFrame } from '../../lib/coding-decisions-model.mjs'
import './coding-decisions.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function CodingCanvas({diagram,phase,id,children}){
  const frame=codingDecisionFrame(diagram,phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-coding-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function CodingFigure({diagram,title,scene,controls,children}){
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / DECISION" stages={CODING_DECISION_STAGES[diagram]} renderScene={scene} renderControls={controls} className="coding-decisions-walkthrough"
    footnote="分類と仕事の設計を読む模式図です。製品の推薦順位や測定値ではなく、実ジョブ・コマンドを起動しません。">{children}</ReadingFigure>
}
