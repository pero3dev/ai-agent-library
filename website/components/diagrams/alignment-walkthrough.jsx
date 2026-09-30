'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
import './alignment-preference.css'
import './alignment-reward-risk.css'
import './alignment-feedback.css'

const scenes = {
  'alignment-preference': lazy(() => import('./alignment-preference-walkthrough').then(module => ({ default: module.AlignmentPreference }))),
  'alignment-reward-risk': lazy(() => import('./alignment-reward-risk-walkthrough').then(module => ({ default: module.AlignmentRewardRisk }))),
  'alignment-feedback': lazy(() => import('./alignment-feedback-walkthrough').then(module => ({ default: module.AlignmentFeedback })))
}

export function AlignmentWalkthrough({ diagramId, children }) {
  const Scene = Object.hasOwn(scenes, diagramId) ? scenes[diagramId] : null
  if (!Scene) return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId} /><DiagramBoundary key={diagramId} fallback={children}>
    <Scene>{children}</Scene>
  </DiagramBoundary></>
}
