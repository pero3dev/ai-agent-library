'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './moe-scenes.css'
import './moe-parameters.css'

const scenes = {
  'moe-routing-load': lazy(() => import('./moe-routing-walkthrough').then(module => ({ default: module.MoERouting }))),
  'moe-parameters-communication': lazy(() => import('./moe-parameters-walkthrough').then(module => ({ default: module.MoEParameters })))
}

export function MoEWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
