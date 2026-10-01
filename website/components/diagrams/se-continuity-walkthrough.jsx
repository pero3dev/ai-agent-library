'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'legacy-observation-draft':lazy(()=>import('./legacy-continuity-scenes').then(m=>({default:m.LegacyObservationDraft}))),
 'legacy-measure-migrate':lazy(()=>import('./legacy-continuity-scenes').then(m=>({default:m.LegacyMeasureMigrate}))),
 'maintenance-hypothesis-change':lazy(()=>import('./maintenance-continuity-scenes').then(m=>({default:m.MaintenanceHypothesisChange}))),
 'maintenance-production-boundary':lazy(()=>import('./maintenance-continuity-scenes').then(m=>({default:m.MaintenanceProductionBoundary}))),
 'enterprise-constraints-topology':lazy(()=>import('./enterprise-continuity-scenes').then(m=>({default:m.EnterpriseConstraintsTopology}))),
 'enterprise-contract-route':lazy(()=>import('./enterprise-continuity-scenes').then(m=>({default:m.EnterpriseContractRoute})))
}
export function SeContinuityWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
