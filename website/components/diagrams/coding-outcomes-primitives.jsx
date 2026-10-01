'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CODING_OUTCOME_STAGES,codingOutcomeFrame } from '../../lib/coding-outcomes-model.mjs'
import './coding-outcomes.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function OutcomeCanvas({diagram,phase,id,children}){
  const frame=codingOutcomeFrame(diagram,phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-outcome-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function OutcomeFigure({diagram,title,scene,controls,children}){
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / OUTCOME" stages={CODING_OUTCOME_STAGES[diagram]} renderScene={scene} renderControls={controls} className="coding-outcomes-walkthrough"
    footnote="導入と測定・消費の関係を読む模式図です。実測値・料金・成果を生成せず、実行や契約変更を送信しません。">{children}</ReadingFigure>
}
