'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {SECURITY_ADVERSITY_STAGES,securityAdversityFrame} from '../../lib/security-adversity-model.mjs'
import './security-adversity.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function AdversityCanvas({diagram,phase,id,children}){const frame=securityAdversityFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-security-adversity-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function AdversityFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="SECURITY / ADVERSITY" stages={SECURITY_ADVERSITY_STAGES[diagram]} renderScene={scene} renderControls={controls} className="security-adversity-walkthrough" footnote="本文の条件を読む模式図です。図は攻撃・資産審査・権限付与・更新を実行しません。">{children}</ReadingFigure>}
export function AdversityPair({left,right,id,phase,y=86,height=177,arrow=true}){return <><Box x={32} y={y} width={260} height={height} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+height/2}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={height} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function AdversityThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
