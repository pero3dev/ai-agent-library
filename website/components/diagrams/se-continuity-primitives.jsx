'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { SE_CONTINUITY_STAGES,seContinuityFrame } from '../../lib/se-continuity-model.mjs'
import './se-continuity.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function ContinuityCanvas({diagram,phase,id,children}){
 const frame=seContinuityFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-se-continuity-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function ContinuityFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="SE / CONTINUITY" stages={SE_CONTINUITY_STAGES[diagram]} renderScene={scene} renderControls={controls} className="se-continuity-walkthrough"
  footnote="原文に沿った模式図です。承認・本番操作・契約判定は行いません。">{children}</ReadingFigure>
}
