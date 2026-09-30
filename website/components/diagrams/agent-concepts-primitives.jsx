'use client'

import { ReadingFigure } from './reading-figure'
import { SceneBase } from './concept-scene-primitives'
import { AGENT_CONCEPT_STAGES, agentConceptFrame } from '../../lib/agent-concepts-model.mjs'
import './agent-concepts.css'
export { Text, Box, Tokens, Wire, Select } from './learning-scene-primitives'

export function Canvas({ diagram, phase, id, children }) {
  const frame = agentConceptFrame(diagram, phase)
  return <SceneBase id={id} title={frame.title} detail={frame.detail} className="aw-scene lf-scene ac-scene" data-agent-diagram={diagram} data-stage={frame.stage}>
    {children(frame)}
  </SceneBase>
}
export function AgentConceptFigure({ diagram, title, scene, controls, children }) {
  return <ReadingFigure diagramId={diagram} title={title} eyebrow="AGENT / CONCEPTS" stages={AGENT_CONCEPT_STAGES[diagram]} renderScene={scene} renderControls={controls}
    footnote="本文の役割・情報の受け渡しを示す模式図です。実APIは実行せず、性能・費用の実測値も示していません。" className="agent-concepts-walkthrough">{children}</ReadingFigure>
}
