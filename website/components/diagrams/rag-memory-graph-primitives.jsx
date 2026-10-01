'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {RAG_MEMORY_GRAPH_STAGES,ragMemoryGraphFrame} from '../../lib/rag-memory-graph-model.mjs'
import './rag-memory-graph.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function RagMemoryCanvas({diagram,phase,id,children}){
 const frame=ragMemoryGraphFrame(diagram,phase)
 return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-rag-memory-graph-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function RagMemoryFigure({diagram,title,scene,controls,children}){
 return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / KNOWLEDGE" stages={RAG_MEMORY_GRAPH_STAGES[diagram]} renderScene={scene} renderControls={controls} className="rag-memory-graph-walkthrough" footnote="原文の設計を読む模式図です。検索・記憶・認可操作は実行しません。">{children}</ReadingFigure>
}
