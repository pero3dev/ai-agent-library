'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './pretraining-loss-perplexity.css'
import './pretraining-scaling.css'
import './pretraining-data.css'
import './pretraining-metrics.css'
import './pretraining-compute.css'

const scenes = {
  'pretraining-loss-perplexity': lazy(() => import('./pretraining-loss-perplexity-walkthrough').then(module => ({ default: module.PretrainingLoss }))),
  'pretraining-scaling': lazy(() => import('./pretraining-scaling-walkthrough').then(module => ({ default: module.PretrainingScaling }))),
  'pretraining-data': lazy(() => import('./pretraining-data-walkthrough').then(module => ({ default: module.PretrainingData }))),
  'pretraining-metrics': lazy(() => import('./pretraining-metrics-walkthrough').then(module => ({ default: module.PretrainingMetrics }))),
  'pretraining-compute': lazy(() => import('./pretraining-compute-walkthrough').then(module => ({ default: module.PretrainingCompute })))
}

export function PretrainingWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
