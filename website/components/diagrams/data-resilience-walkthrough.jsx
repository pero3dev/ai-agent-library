'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'conversation-collection-layers':lazy(()=>import('./conversation-data-scenes').then(m=>({default:m.ConversationCollectionLayers}))),
 'conversation-retention-deletion':lazy(()=>import('./conversation-data-scenes').then(m=>({default:m.ConversationRetentionDeletion}))),
 'conversation-use-access':lazy(()=>import('./conversation-data-scenes').then(m=>({default:m.ConversationUseAccess}))),
 'governance-ownership-catalogue':lazy(()=>import('./knowledge-governance-scenes').then(m=>({default:m.GovernanceOwnershipCatalogue}))),
 'governance-quality-permission':lazy(()=>import('./knowledge-governance-scenes').then(m=>({default:m.GovernanceQualityPermission}))),
 'chaos-hypothesis-targets':lazy(()=>import('./chaos-resilience-scenes').then(m=>({default:m.ChaosHypothesisTargets}))),
 'chaos-environment-learning':lazy(()=>import('./chaos-resilience-scenes').then(m=>({default:m.ChaosEnvironmentLearning})))
}
export function DataResilienceWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
