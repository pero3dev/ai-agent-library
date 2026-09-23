'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './concept-scenes.css'

// Keep the dispatcher in the MDX map, but load only the selected article scene.
// Let the route's server renderer resolve the scene before exporting its HTML.
// A local Suspense shell would need JavaScript to reveal its hidden streamed body.
const AgentLoop = lazy(() => import('./agent-loop-walkthrough').then(module => ({ default: module.AgentLoop })))
const WorkflowComparison = lazy(() => import('./workflow-walkthrough').then(module => ({ default: module.WorkflowComparison })))

export function ReadingWalkthrough({ diagramId, children }) {
  const Scene = diagramId === 'agent-loop' ? AgentLoop : diagramId === 'workflow-comparison' ? WorkflowComparison : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
