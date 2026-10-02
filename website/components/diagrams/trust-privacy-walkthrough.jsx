'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'provenance-layers-loss':lazy(()=>import('./provenance-trust-scenes').then(m=>({default:m.ProvenanceLayersLoss}))),
 'provenance-detection-process':lazy(()=>import('./provenance-trust-scenes').then(m=>({default:m.ProvenanceDetectionProcess}))),
 'impersonation-callback-process':lazy(()=>import('./impersonation-process-scenes').then(m=>({default:m.ImpersonationCallbackProcess}))),
 'impersonation-report-monitor':lazy(()=>import('./impersonation-process-scenes').then(m=>({default:m.ImpersonationReportMonitor}))),
 'privacy-layers-fit':lazy(()=>import('./privacy-scope-scenes').then(m=>({default:m.PrivacyLayersFit}))),
 'privacy-unit-budget':lazy(()=>import('./privacy-scope-scenes').then(m=>({default:m.PrivacyUnitBudget}))),
 'privacy-basic-selection':lazy(()=>import('./privacy-scope-scenes').then(m=>({default:m.PrivacyBasicSelection})))
}
export function TrustPrivacyWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
