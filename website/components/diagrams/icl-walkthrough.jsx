'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'

const scenes = {
  'icl-hypotheses': lazy(() => import('./icl-scenes').then(module => ({ default: module.IclHypotheses }))),
  'icl-demonstrations': lazy(() => import('./icl-scenes').then(module => ({ default: module.IclDemonstrations }))),
  'icl-memory-evaluation': lazy(() => import('./icl-scenes').then(module => ({ default: module.IclMemoryEvaluation })))
}

export function IclWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
