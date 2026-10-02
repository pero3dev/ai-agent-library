'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {DATA_RESILIENCE_STAGES,dataResilienceFrame} from '../../lib/data-resilience-model.mjs'
import './data-resilience.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function DataCanvas({diagram,phase,id,children}){const frame=dataResilienceFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-data-resilience-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function DataFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="OPERATIONS / DATA" stages={DATA_RESILIENCE_STAGES[diagram]} renderScene={scene} renderControls={controls} className="data-resilience-walkthrough" footnote="本文の条件を読む模式図です。図は会話を収集・削除・送信せず、利用の許可・法的適合・障害注入を実行しません。">{children}</ReadingFigure>}
export function DataPair({left,right,id,phase,y=86,arrow=true}){return <><Box x={32} y={y} width={260} height={177} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+88}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={177} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function DataThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
