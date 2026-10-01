'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'

const scenes = {
  'planning-patterns': lazy(() => import('./planning-scenes').then(module => ({ default: module.PlanningPatterns }))),
  'planning-maintenance': lazy(() => import('./planning-scenes').then(module => ({ default: module.PlanningMaintenance }))),
  'retrieval-paths': lazy(() => import('./retrieval-design-scenes').then(module => ({ default: module.RetrievalPaths }))),
  'retrieval-choice': lazy(() => import('./retrieval-design-scenes').then(module => ({ default: module.RetrievalChoice }))),
  'delegation-boundaries': lazy(() => import('./delegation-scenes').then(module => ({ default: module.DelegationBoundaries }))),
  'delegation-patterns': lazy(() => import('./delegation-scenes').then(module => ({ default: module.DelegationPatterns }))),
  'agent-components': lazy(() => import('./agent-structure-scenes').then(module => ({ default: module.AgentComponents }))),
  'agent-autonomy': lazy(() => import('./agent-structure-scenes').then(module => ({ default: module.AgentAutonomy }))),
  'tool-execution': lazy(() => import('./tool-use-scenes').then(module => ({ default: module.ToolExecution }))),
  'tool-contract': lazy(() => import('./tool-use-scenes').then(module => ({ default: module.ToolContract }))),
  'memory-layers': lazy(() => import('./memory-state-scenes').then(module => ({ default: module.MemoryLayers }))),
  'memory-lifecycle': lazy(() => import('./memory-state-scenes').then(module => ({ default: module.MemoryLifecycle })))
}

export function AgentConceptsWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
