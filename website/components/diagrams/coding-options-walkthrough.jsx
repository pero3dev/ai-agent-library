'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'copilot-surfaces-flow':lazy(()=>import('./copilot-options-scenes').then(m=>({default:m.CopilotSurfacesFlow}))),
 'copilot-policy-boundaries':lazy(()=>import('./copilot-options-scenes').then(m=>({default:m.CopilotPolicyBoundaries}))),
 'copilot-adoption-budget':lazy(()=>import('./copilot-options-scenes').then(m=>({default:m.CopilotAdoptionBudget}))),
 'oss-freedom-responsibility':lazy(()=>import('./oss-options-scenes').then(m=>({default:m.OssFreedomResponsibility}))),
 'oss-evaluation-controls':lazy(()=>import('./oss-options-scenes').then(m=>({default:m.OssEvaluationControls}))),
 'comparison-matrix-meaning':lazy(()=>import('./comparison-options-scenes').then(m=>({default:m.ComparisonMatrixMeaning}))),
 'comparison-contract-use':lazy(()=>import('./comparison-options-scenes').then(m=>({default:m.ComparisonContractUse})))
}
export function CodingOptionsWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
