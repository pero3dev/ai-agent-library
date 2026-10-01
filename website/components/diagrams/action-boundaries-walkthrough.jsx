'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes = {
  'orchestration-basics': lazy(() => import('./orchestration-design-scenes').then(m => ({ default: m.OrchestrationBasics }))),
  'orchestration-composition': lazy(() => import('./orchestration-design-scenes').then(m => ({ default: m.OrchestrationComposition }))),
  'human-intervention-positions': lazy(() => import('./human-intervention-scenes').then(m => ({ default: m.HumanInterventionPositions }))),
  'human-approval-lifecycle': lazy(() => import('./human-intervention-scenes').then(m => ({ default: m.HumanApprovalLifecycle }))),
  'error-layer-routing': lazy(() => import('./error-recovery-scenes').then(m => ({ default: m.ErrorLayerRouting }))),
  'retry-and-recovery-boundaries': lazy(() => import('./error-recovery-scenes').then(m => ({ default: m.RetryRecoveryBoundaries })))
}
export function ActionBoundariesWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
