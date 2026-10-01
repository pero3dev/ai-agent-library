'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
  'coding-team-rollout':lazy(()=>import('./coding-team-scenes').then(m=>({default:m.CodingTeamRollout}))),
  'coding-team-review':lazy(()=>import('./coding-team-scenes').then(m=>({default:m.CodingTeamReview}))),
  'coding-team-governance':lazy(()=>import('./coding-team-scenes').then(m=>({default:m.CodingTeamGovernance}))),
  'coding-evaluation-experiment':lazy(()=>import('./coding-evaluation-scenes').then(m=>({default:m.CodingEvaluationExperiment}))),
  'coding-evaluation-effects':lazy(()=>import('./coding-evaluation-scenes').then(m=>({default:m.CodingEvaluationEffects}))),
  'coding-cost-consumption':lazy(()=>import('./coding-cost-scenes').then(m=>({default:m.CodingCostConsumption}))),
  'coding-cost-context':lazy(()=>import('./coding-cost-scenes').then(m=>({default:m.CodingCostContext}))),
  'coding-cost-limits':lazy(()=>import('./coding-cost-scenes').then(m=>({default:m.CodingCostLimits})))
}
export function CodingOutcomesWalkthrough({diagramId,children}){
  const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
  if(!Scene)return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
