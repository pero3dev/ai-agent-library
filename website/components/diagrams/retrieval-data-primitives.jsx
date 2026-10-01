'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {RETRIEVAL_DATA_STAGES,retrievalDataFrame} from '../../lib/retrieval-data-model.mjs'
import './retrieval-data.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function RetrievalCanvas({diagram,phase,id,children}){
 const frame=retrievalDataFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-retrieval-data-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function RetrievalFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / RETRIEVAL" stages={RETRIEVAL_DATA_STAGES[diagram]} renderScene={scene} renderControls={controls} className="retrieval-data-walkthrough" footnote="原文の設計を読む模式図です。検索・API・認可操作は実行しません。">{children}</ReadingFigure>
}
