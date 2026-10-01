'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { PROMPT_TOOL_OUTPUT_STAGES,promptToolOutputFrame } from '../../lib/prompt-tool-output-model.mjs'
import './prompt-tool-output.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function PromptCanvas({diagram,phase,id,children}){
 const frame=promptToolOutputFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-prompt-tool-output-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function PromptFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / CONTRACTS" stages={PROMPT_TOOL_OUTPUT_STAGES[diagram]} renderScene={scene} renderControls={controls} className="prompt-tool-output-walkthrough"
  footnote="原文の設計を読む模式図です。実API・LLM・承認操作は実行しません。">{children}</ReadingFigure>
}
