'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './transformer-scenes.css'
import './transformer-io.css'
import './transformer-position.css'

// Resolve each scene during server export; keep the article readable without JS.
const scenes = {
  'transformer-io': lazy(() => import('./transformer-io-walkthrough').then(module => ({ default: module.TransformerIO }))),
  'transformer-position': lazy(() => import('./transformer-position-walkthrough').then(module => ({ default: module.TransformerPosition }))),
  'transformer-block': lazy(() => import('./transformer-block-walkthrough').then(module => ({ default: module.TransformerBlock })))
}

export function TransformerWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
