'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './generation.css'
import './tokenization.css'

const scenes = {
  'generation-token-loop': lazy(() => import('./generation-walkthrough').then(module => ({ default: module.Generation }))),
  'tokenization-counting': lazy(() => import('./tokenization-walkthrough').then(module => ({ default: module.Tokenization })))
}

export function FoundationsWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
