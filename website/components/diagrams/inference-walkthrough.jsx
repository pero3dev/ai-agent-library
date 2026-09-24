'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './inference-sampling.css'
import './inference-cache-batching.css'
import './inference-speculative.css'
import './inference-quantization.css'

const scenes = {
  'inference-sampling': lazy(() => import('./inference-sampling-walkthrough').then(module => ({ default: module.InferenceSampling }))),
  'inference-cache-batching': lazy(() => import('./inference-cache-batching-walkthrough').then(module => ({ default: module.InferenceCacheBatching }))),
  'inference-speculative': lazy(() => import('./inference-speculative-walkthrough').then(module => ({ default: module.InferenceSpeculative }))),
  'inference-quantization': lazy(() => import('./inference-quantization-walkthrough').then(module => ({ default: module.InferenceQuantization })))
}

export function InferenceWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
