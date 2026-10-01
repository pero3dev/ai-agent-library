'use client'
import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { DURABLE_CONTRACT_STAGES, durableContractFrame } from '../../lib/durable-tenant-api-model.mjs'
import './durable-contract.css'
export { Text, Box, Wire, Select } from './learning-scene-primitives'
export function ContractCanvas({diagram,phase,id,children}) {
  const frame=durableContractFrame(diagram,phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene" data-contract-diagram={diagram} data-stage={frame.stage}>{children(frame)}</SceneBase>
}
export function ContractFigure({diagram,title,scene,controls,children}) {
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="DURABLE / TENANT / API" stages={DURABLE_CONTRACT_STAGES[diagram]} renderScene={scene} renderControls={controls} className="durable-contract-walkthrough"
    footnote="設計上の状態と契約を読む模式図です。実ジョブ・承認・通知・API呼出しや課金は実行しません。">{children}</ReadingFigure>
}
