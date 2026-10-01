'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { SE_PROCESS_STAGES,seProcessFrame } from '../../lib/se-process-model.mjs'
import './se-process.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function SeCanvas({diagram,phase,id,children}){
 const frame=seProcessFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-se-process-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function SeFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="CODING / SE PROCESS" stages={SE_PROCESS_STAGES[diagram]} renderScene={scene} renderControls={controls} className="se-process-walkthrough"
  footnote="本文の役割分担を示す模式図です。検出率・削減工数・欠陥ゼロを保証せず、実行や外部送信を起動しません。">{children}</ReadingFigure>
}
