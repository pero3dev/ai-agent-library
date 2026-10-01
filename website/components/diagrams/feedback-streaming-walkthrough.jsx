'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'optimization-failure-cycle':lazy(()=>import('./optimization-scenes').then(m=>({default:m.OptimizationFailureCycle}))),
 'optimization-search-boundaries':lazy(()=>import('./optimization-scenes').then(m=>({default:m.OptimizationSearchBoundaries}))),
 'feedback-observation-design':lazy(()=>import('./feedback-verifier-scenes').then(m=>({default:m.FeedbackObservationDesign}))),
 'feedback-verifier-control':lazy(()=>import('./feedback-verifier-scenes').then(m=>({default:m.FeedbackVerifierControl}))),
 'stream-progress-surface':lazy(()=>import('./streaming-state-scenes').then(m=>({default:m.StreamProgressSurface}))),
 'stream-cancellation-state':lazy(()=>import('./streaming-state-scenes').then(m=>({default:m.StreamCancellationState})))
}
export function FeedbackStreamingWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
