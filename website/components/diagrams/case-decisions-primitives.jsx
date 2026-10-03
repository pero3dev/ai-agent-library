'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Text,Box,Wire} from './learning-scene-primitives'
import {CASE_DECISIONS_STAGES,caseDecisionsFrame} from '../../lib/case-decisions-model.mjs'
import './case-decisions.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function DecisionCanvas({diagram,phase,id,children}){const frame=caseDecisionsFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-case-decisions-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function DecisionFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="CASE STUDY / DECISION" stages={CASE_DECISIONS_STAGES[diagram]} renderScene={scene} renderControls={controls} className="case-decisions-walkthrough" footnote="架空の構成事例の判断を読む模式図です。実際の採否・承認・操作・費用対効果を確定しません。">{children}</ReadingFigure>}
export function DecisionPair({left,right,id,phase,y=86,height=177,arrow=true}){return <><Box x={32} y={y} width={260} height={height} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+height/2}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={height} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function DecisionThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
export function DecisionPanel({frame,panel,id}){const {stage,phase}=frame,p=typeof panel==='function'?panel(frame):panel;return <><Text y={38}>{p.caption}</Text>{p.columns.length===2?<DecisionPair left={p.columns[0]} right={p.columns[1]} id={id} phase={phase} arrow={p.flow!==false}/>:<><DecisionThree columns={p.columns}/>{p.flow&&<><Wire id={id} d="M208 180H230" active phase={phase}/><Wire id={id} d="M408 180H430" active phase={phase}/></>}{p.loop&&<Wire id={id} d="M520 269V330H120V269" active phase={phase}/>}</>}{p.status&&<Text y={340}>{p.status}</Text>}{p.note&&<Text y={374} small>{p.note}</Text>}</>}
