'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {FRAMEWORK_MODEL_TUNING_STAGES,frameworkModelTuningFrame} from '../../lib/framework-model-tuning-model.mjs'
import './framework-model-tuning.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function SelectionCanvas({diagram,phase,id,children}){const frame=frameworkModelTuningFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-framework-model-tuning-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function SelectionFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / SELECTION" stages={FRAMEWORK_MODEL_TUNING_STAGES[diagram]} renderScene={scene} renderControls={controls} className="framework-model-tuning-walkthrough" footnote="原文の設計を読む模式図です。API・学習・移行は実行しません。">{children}</ReadingFigure>}
