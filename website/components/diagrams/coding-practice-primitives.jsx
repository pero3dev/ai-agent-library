'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CODING_PRACTICE_STAGES,codingPracticeFrame } from '../../lib/coding-practice-model.mjs'
import './coding-practice.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function PracticeCanvas({diagram,phase,id,children}){
 const frame=codingPracticeFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-coding-practice-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function PracticeFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / PRACTICE" stages={CODING_PRACTICE_STAGES[diagram]} renderScene={scene} renderControls={controls} className="coding-practice-walkthrough"
  footnote="本文の確認時点・条件に沿った模式図です。現在のレートや実測結果を作らず、送信・起動・課金・設定変更を実行しません。">{children}</ReadingFigure>
}
