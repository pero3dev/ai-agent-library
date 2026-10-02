'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {HARDWARE_SERVING_STAGES,hardwareServingFrame} from '../../lib/hardware-serving-model.mjs'
import './hardware-serving.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function HardwareCanvas({diagram,phase,id,children}){const frame=hardwareServingFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-hardware-serving-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function HardwareFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="OPERATIONS / HARDWARE" stages={HARDWARE_SERVING_STAGES[diagram]} renderScene={scene} renderControls={controls} className="hardware-serving-walkthrough" footnote="本文の条件を読む模式図です。図は購入・API・model配布・課金・環境計測・法的判断・報告を実行しません。">{children}</ReadingFigure>}
export function HardwarePair({left,right,id,phase,y=86,arrow=true}){return <><Box x={32} y={y} width={260} height={177} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+88}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={177} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function HardwareThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
