'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {QUALITY_TRACE_STAGES,qualityTraceFrame} from '../../lib/quality-trace-model.mjs'
import './quality-trace.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function QualityCanvas({diagram,phase,id,children}){const frame=qualityTraceFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-quality-trace-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function QualityFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="QUALITY / TRACE" stages={QUALITY_TRACE_STAGES[diagram]} renderScene={scene} renderControls={controls} className="quality-trace-walkthrough" footnote="本文の条件を読む模式図です。数は模式集計で、実採点・モデル呼出し・ログの収集や外部送信は行いません。">{children}</ReadingFigure>}
export function QualityPair({left,right,id,phase,y=86,arrow=true}){return <><Box x={32} y={y} width={260} height={177} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+88}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={177} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function QualityThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
