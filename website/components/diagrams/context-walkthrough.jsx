'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'

const scenes = {
  'context-causal-cost': lazy(() => import('./context-scenes').then(module => ({ default: module.ContextCausalCost }))),
  'context-cache-quality': lazy(() => import('./context-scenes').then(module => ({ default: module.ContextCacheQuality })))
}

export function ContextWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
