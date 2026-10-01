'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'

const scenes = {
  'learning-section-map': lazy(() => import('./learning-navigation-scenes').then(module => ({ default: module.LearningSectionMap }))),
  'learning-practice-loop': lazy(() => import('./learning-navigation-scenes').then(module => ({ default: module.LearningPracticeLoop }))),
  'skill-development': lazy(() => import('./skill-development-scenes').then(module => ({ default: module.SkillDevelopment }))),
  'information-evidence': lazy(() => import('./information-reading-scenes').then(module => ({ default: module.InformationEvidence }))),
  'information-maintenance': lazy(() => import('./information-reading-scenes').then(module => ({ default: module.InformationMaintenance })))
}
export function OverviewReadingWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
