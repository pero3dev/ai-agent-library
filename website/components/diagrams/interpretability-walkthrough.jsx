'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'

const scenes = {
  'interpretability-evidence': lazy(() => import('./interpretability-scenes').then(module => ({ default: module.InterpretabilityEvidence }))),
  'interpretability-sae': lazy(() => import('./interpretability-scenes').then(module => ({ default: module.InterpretabilitySae })))
}

export function InterpretabilityWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
