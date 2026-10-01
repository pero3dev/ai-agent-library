'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'se-common-principles':lazy(()=>import('./se-map-scenes').then(m=>({default:m.SeCommonPrinciples}))),
 'se-v-model-map':lazy(()=>import('./se-map-scenes').then(m=>({default:m.SeVModelMap}))),
 'se-upstream-review':lazy(()=>import('./se-upstream-scenes').then(m=>({default:m.SeUpstreamReview}))),
 'se-document-delivery':lazy(()=>import('./se-upstream-scenes').then(m=>({default:m.SeDocumentDelivery}))),
 'se-test-design-generation':lazy(()=>import('./se-test-scenes').then(m=>({default:m.SeTestDesignGeneration}))),
 'se-test-oracle-evidence':lazy(()=>import('./se-test-scenes').then(m=>({default:m.SeTestOracleEvidence})))
}
export function SeProcessWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
