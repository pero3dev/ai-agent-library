'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'gateway-crossroads-topology':lazy(()=>import('./gateway-operation-scenes').then(m=>({default:m.GatewayCrossroadsTopology}))),
 'gateway-routing-boundaries':lazy(()=>import('./gateway-operation-scenes').then(m=>({default:m.GatewayRoutingBoundaries}))),
 'cache-levels-semantic-risk':lazy(()=>import('./response-cache-scenes').then(m=>({default:m.CacheLevelsSemanticRisk}))),
 'cache-reuse-invalidation':lazy(()=>import('./response-cache-scenes').then(m=>({default:m.CacheReuseInvalidation}))),
 'batch-route-capacity':lazy(()=>import('./batch-operation-scenes').then(m=>({default:m.BatchRouteCapacity}))),
 'batch-results-deadlines':lazy(()=>import('./batch-operation-scenes').then(m=>({default:m.BatchResultsDeadlines})))
}
export function GatewayReuseWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
