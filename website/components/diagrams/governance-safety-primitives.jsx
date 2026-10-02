'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {GOVERNANCE_SAFETY_STAGES,governanceSafetyFrame} from '../../lib/governance-safety-model.mjs'
import './governance-safety.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function GovernanceCanvas({diagram,phase,id,children}){const frame=governanceSafetyFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-governance-safety-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function GovernanceFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="GOVERNANCE / SCOPE" stages={GOVERNANCE_SAFETY_STAGES[diagram]} renderScene={scene} renderControls={controls} className="governance-safety-walkthrough" footnote="原文の時点と範囲を読む模式図です。法的適合・認証・modelの安全を判定しません。">{children}</ReadingFigure>}
export function GovernancePair({left,right,id,phase,y=86,height=177,arrow=true}){return <><Box x={32} y={y} width={260} height={height} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+height/2}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={height} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function GovernanceThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
