'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './training-stages.css'
import './training-runtime-boundary.css'

const scenes = {
  'training-stages': lazy(() => import('./training-stages-walkthrough').then(module => ({ default: module.TrainingStages }))),
  'training-runtime-boundary': lazy(() => import('./training-runtime-boundary-walkthrough').then(module => ({ default: module.TrainingRuntimeBoundary })))
}

export function TrainingWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
