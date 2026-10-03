'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {CASE_EVIDENCE_STAGES,caseEvidenceFrame} from '../../lib/case-evidence-model.mjs'
import './case-evidence.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function CaseCanvas({diagram,phase,id,children}){const frame=caseEvidenceFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-case-evidence-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function CaseFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="CASE STUDY / DESIGN" stages={CASE_EVIDENCE_STAGES[diagram]} renderScene={scene} renderControls={controls} className="case-evidence-walkthrough" footnote="架空の構成事例を読む模式図です。実測値を生成せず、実SQL・送信・デプロイを実行しません。">{children}</ReadingFigure>}
export function CasePair({left,right,id,phase,y=86,height=177,arrow=true}){return <><Box x={32} y={y} width={260} height={height} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+height/2}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={height} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
export function CaseThree({columns,y=92}){return <>{columns.map((column,i)=><Box key={column[0]} x={32+i*200} y={y} width={176} height={177} title={column[0]} lines={column.slice(1)} tone={i===0?'violet':i===1?'teal':'amber'}/>)}</>}
