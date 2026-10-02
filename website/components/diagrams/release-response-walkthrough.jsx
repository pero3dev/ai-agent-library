'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'version-composition-pinning':lazy(()=>import('./version-release-scenes').then(m=>({default:m.VersionCompositionPinning}))),
 'version-rollout-migration':lazy(()=>import('./version-release-scenes').then(m=>({default:m.VersionRolloutMigration}))),
 'incident-detection-containment':lazy(()=>import('./incident-response-scenes').then(m=>({default:m.IncidentDetectionContainment}))),
 'incident-effects-learning':lazy(()=>import('./incident-response-scenes').then(m=>({default:m.IncidentEffectsLearning}))),
 'feedback-signals-collection':lazy(()=>import('./feedback-operation-scenes').then(m=>({default:m.FeedbackSignalsCollection}))),
 'feedback-triage-release':lazy(()=>import('./feedback-operation-scenes').then(m=>({default:m.FeedbackTriageRelease})))
}
export function ReleaseResponseWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
