'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'

const scenes = {
  'multimodal-representation': lazy(() => import('./multimodal-scenes').then(module => ({ default: module.MultimodalRepresentation }))),
  'multimodal-input-tradeoffs': lazy(() => import('./multimodal-scenes').then(module => ({ default: module.MultimodalInputTradeoffs })))
}

export function MultimodalWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
