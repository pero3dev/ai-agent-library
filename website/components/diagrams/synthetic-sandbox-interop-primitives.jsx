'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {SYNTHETIC_SANDBOX_INTEROP_STAGES,syntheticSandboxInteropFrame} from '../../lib/synthetic-sandbox-interop-model.mjs'
import './synthetic-sandbox-interop.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function BoundaryCanvas({diagram,phase,id,children}){const frame=syntheticSandboxInteropFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-synthetic-sandbox-interop-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function BoundaryFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / BOUNDARY" stages={SYNTHETIC_SANDBOX_INTEROP_STAGES[diagram]} renderScene={scene} renderControls={controls} className="synthetic-sandbox-interop-walkthrough" footnote="本文の条件を読む模式図です。生成・学習・コード実行・通信・削除・委譲は実行しません。">{children}</ReadingFigure>}
export function BoundaryPair({left,right,id,phase,y=86,arrow=true}){return <><Box x={32} y={y} width={260} height={177} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+88}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={177} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
