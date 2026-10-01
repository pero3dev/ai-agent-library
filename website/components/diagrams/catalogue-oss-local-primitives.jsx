'use client'
import {ReadingFigure} from './reading-figure'
import {SceneBase} from './concept-scene-primitives'
import {Box,Wire} from './learning-scene-primitives'
import {CATALOGUE_OSS_LOCAL_STAGES,catalogueOssLocalFrame} from '../../lib/catalogue-oss-local-model.mjs'
import './catalogue-oss-local.css'
export {Text,Box,Wire,Select,Tokens} from './learning-scene-primitives'
export function CatalogueCanvas({diagram,phase,id,children}){const frame=catalogueOssLocalFrame(diagram,phase);return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-catalogue-oss-local-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>}
export function CatalogueFigure({diagram,title,scene,controls,children}){return <ReadingFigure diagramId={diagram} title={title} eyebrow="IMPLEMENTATION / ECOSYSTEM" stages={CATALOGUE_OSS_LOCAL_STAGES[diagram]} renderScene={scene} renderControls={controls} className="catalogue-oss-local-walkthrough" footnote="原文の条件を読む模式図です。採用・外部送信・法的判定は実行しません。">{children}</ReadingFigure>}
export function Pair({left,right,id,phase,y=82,arrow=true}){return <><Box x={32} y={y} width={260} height={177} title={left[0]} lines={left.slice(1)} tone="violet"/>{arrow&&<Wire id={id} d={`M292 ${y+88}H340`} active phase={phase}/>}<Box x={348} y={y} width={260} height={177} title={right[0]} lines={right.slice(1)} tone="teal"/></>}
