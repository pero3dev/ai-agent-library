'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {EVALUATION_EVIDENCE_STAGES,evaluationEvidenceFrame} from '../../lib/evaluation-evidence-model.mjs'
import './evaluation-evidence.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function EvidenceCanvas({diagram,phase,id,children}){const frame=evaluationEvidenceFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-evaluation-evidence-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function EvidenceFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="EVALUATION / EVIDENCE" stages={EVALUATION_EVIDENCE_STAGES[diagram]} renderScene={scene} renderControls={controls} className="evaluation-evidence-walkthrough" footnote="本文の条件を読む模式図です。件数は模式入力で、実Agent・judge採点・データ収集は実行しません。">{children}</ReadingFigure>}
export function EvidencePair({left,right,id,phase,y=86,arrow=true}){return <><Box x={32} y={y} width={260} height={177} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+88}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={177} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function EvidenceThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
