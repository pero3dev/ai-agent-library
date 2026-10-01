'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { CLIENT_ADOPTION_STAGES,clientAdoptionFrame } from '../../lib/client-adoption-model.mjs'
import './client-adoption.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function ClientCanvas({diagram,phase,id,children}){
 const frame=clientAdoptionFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-client-adoption-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function ClientFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="SE / ADOPTION" stages={CLIENT_ADOPTION_STAGES[diagram]} renderScene={scene} renderControls={controls} className="client-adoption-walkthrough"
  footnote="原文の合意形成の模式図です。契約・法的適合・価格の判定は行いません。">{children}</ReadingFigure>
}
