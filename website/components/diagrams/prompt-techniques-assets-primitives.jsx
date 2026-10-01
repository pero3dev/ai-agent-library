'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import {PROMPT_TECHNIQUES_ASSETS_STAGES,promptTechniquesAssetsFrame} from '../../lib/prompt-techniques-assets-model.mjs'
import './prompt-techniques-assets.css'
export {Text,Box,Wire,Select} from './learning-scene-primitives'
export function TechniqueCanvas({diagram,phase,id,children}){
 const frame=promptTechniquesAssetsFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-prompt-techniques-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function TechniqueFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / PROMPT ASSETS" stages={PROMPT_TECHNIQUES_ASSETS_STAGES[diagram]} renderScene={scene} renderControls={controls} className="prompt-techniques-assets-walkthrough"
  footnote="原文の設計を読む模式図です。精度の実測や本番の変更は行いません。">{children}</ReadingFigure>
}
