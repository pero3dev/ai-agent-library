'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './attention-variants.css'
import './attention-kv.css'
import './attention-context.css'

const scenes = {
  'attention-kv-sharing': lazy(() => import('./attention-kv-walkthrough').then(module => ({ default: module.AttentionKV }))),
  'attention-compute-memory': lazy(() => import('./attention-compute-walkthrough').then(module => ({ default: module.AttentionComputeMemory }))),
  'attention-context-range': lazy(() => import('./attention-context-walkthrough').then(module => ({ default: module.AttentionContext })))
}

export function AttentionVariantsWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
