'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'hardware-weights-runtime':lazy(()=>import('./hardware-capacity-scenes').then(m=>({default:m.HardwareWeightsRuntime}))),
 'hardware-bottleneck-purchase':lazy(()=>import('./hardware-capacity-scenes').then(m=>({default:m.HardwareBottleneckPurchase}))),
 'serving-engines-throughput':lazy(()=>import('./self-serving-scenes').then(m=>({default:m.ServingEnginesThroughput}))),
 'serving-memory-rollout':lazy(()=>import('./self-serving-scenes').then(m=>({default:m.ServingMemoryRollout}))),
 'environment-scope-mechanisms':lazy(()=>import('./environment-boundary-scenes').then(m=>({default:m.EnvironmentScopeMechanisms}))),
 'environment-measure-report':lazy(()=>import('./environment-boundary-scenes').then(m=>({default:m.EnvironmentMeasureReport}))),
 'environment-honest-claims':lazy(()=>import('./environment-boundary-scenes').then(m=>({default:m.EnvironmentHonestClaims})))
}
export function HardwareServingWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
