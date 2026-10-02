'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'regression-layer-scope':lazy(()=>import('./regression-lifecycle-scenes').then(m=>({default:m.RegressionLayerScope}))),
 'regression-gate-recovery':lazy(()=>import('./regression-lifecycle-scenes').then(m=>({default:m.RegressionGateRecovery}))),
 'online-sequence-signals':lazy(()=>import('./online-lifecycle-scenes').then(m=>({default:m.OnlineSequenceSignals}))),
 'online-comparison-release':lazy(()=>import('./online-lifecycle-scenes').then(m=>({default:m.OnlineComparisonRelease}))),
 'benchmark-map-provenance':lazy(()=>import('./benchmark-lifecycle-scenes').then(m=>({default:m.BenchmarkMapProvenance}))),
 'benchmark-reliability-cost':lazy(()=>import('./benchmark-lifecycle-scenes').then(m=>({default:m.BenchmarkReliabilityCost})))
}
export function EvaluationLifecycleWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
