'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { FEEDBACK_STREAMING_STAGES,feedbackStreamingFrame } from '../../lib/feedback-streaming-model.mjs'
import './feedback-streaming.css'
export { Text,Box,Wire,Select } from './learning-scene-primitives'
export function FeedbackCanvas({diagram,phase,id,children}){
 const frame=feedbackStreamingFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-feedback-streaming-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function FeedbackFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / FEEDBACK" stages={FEEDBACK_STREAMING_STAGES[diagram]} renderScene={scene} renderControls={controls} className="feedback-streaming-walkthrough"
  footnote="原文の設計を読む模式図です。実API・LLM・承認操作は実行しません。">{children}</ReadingFigure>
}
