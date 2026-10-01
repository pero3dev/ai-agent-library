'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'client-approval-contract':lazy(()=>import('./client-adoption-scenes').then(m=>({default:m.ClientApprovalContract}))),
 'client-staged-adoption':lazy(()=>import('./client-adoption-scenes').then(m=>({default:m.ClientStagedAdoption}))),
 'client-measured-evidence':lazy(()=>import('./client-adoption-scenes').then(m=>({default:m.ClientMeasuredEvidence})))
}
export function ClientAdoptionWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
