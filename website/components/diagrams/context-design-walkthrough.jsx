'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes = {
  'context-input-design': lazy(() => import('./context-input-scenes').then(module => ({ default: module.ContextInputDesign }))),
  'context-cycle-retrieval': lazy(() => import('./context-input-scenes').then(module => ({ default: module.ContextCycleRetrieval }))),
  'context-layout-budget': lazy(() => import('./context-pattern-scenes').then(module => ({ default: module.ContextLayoutBudget }))),
  'context-information-design': lazy(() => import('./context-pattern-scenes').then(module => ({ default: module.ContextInformationDesign }))),
  'context-compaction-design': lazy(() => import('./context-compaction-scenes').then(module => ({ default: module.ContextCompactionDesign }))),
  'context-trust-restart': lazy(() => import('./context-compaction-scenes').then(module => ({ default: module.ContextTrustRestart })))
}
export function ContextDesignWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
