'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
  'coding-support-forms':lazy(()=>import('./coding-classification-scenes').then(m=>({default:m.CodingSupportForms}))),
  'coding-trigger-execution-map':lazy(()=>import('./coding-classification-scenes').then(m=>({default:m.CodingTriggerExecutionMap}))),
  'coding-autonomy-learning':lazy(()=>import('./coding-classification-scenes').then(m=>({default:m.CodingAutonomyLearning}))),
  'coding-selection-constraints':lazy(()=>import('./coding-selection-scenes').then(m=>({default:m.CodingSelectionConstraints}))),
  'coding-selection-trial':lazy(()=>import('./coding-selection-scenes').then(m=>({default:m.CodingSelectionTrial}))),
  'coding-request-contract':lazy(()=>import('./coding-request-scenes').then(m=>({default:m.CodingRequestContract}))),
  'coding-request-verification-recovery':lazy(()=>import('./coding-request-scenes').then(m=>({default:m.CodingRequestVerificationRecovery})))
}
export function CodingDecisionsWalkthrough({diagramId,children}){
  const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
  if(!Scene)return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
