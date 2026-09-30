'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './reasoning-sequence.css'
import './reasoning-evaluation.css'

const scenes = {
  'reasoning-sequence': lazy(() => import('./reasoning-sequence-walkthrough').then(module => ({ default: module.ReasoningSequence }))),
  'reasoning-evaluation': lazy(() => import('./reasoning-evaluation-walkthrough').then(module => ({ default: module.ReasoningEvaluation })))
}

export function ReasoningWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
