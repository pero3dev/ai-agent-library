'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes = {
  'harness-system-boundaries':lazy(() => import('./harness-design-scenes').then(m => ({default:m.HarnessSystemBoundaries}))),
  'harness-environment-evolution':lazy(() => import('./harness-design-scenes').then(m => ({default:m.HarnessEnvironmentEvolution}))),
  'loop-type-and-stopping':lazy(() => import('./loop-control-scenes').then(m => ({default:m.LoopTypeStopping}))),
  'loop-replanning-recovery':lazy(() => import('./loop-control-scenes').then(m => ({default:m.LoopReplanningRecovery})))
}
export function HarnessLoopWalkthrough({ diagramId, children }) {
  const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
  if(!Scene)return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
