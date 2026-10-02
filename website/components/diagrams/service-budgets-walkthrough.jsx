'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'cost-history-measurement':lazy(()=>import('./cost-budget-scenes').then(m=>({default:m.CostHistoryMeasurement}))),
 'cost-reduction-quality':lazy(()=>import('./cost-budget-scenes').then(m=>({default:m.CostReductionQuality}))),
 'cost-budget-cache-accounting':lazy(()=>import('./cost-budget-scenes').then(m=>({default:m.CostBudgetCacheAccounting}))),
 'latency-breakdown-tools':lazy(()=>import('./latency-budget-scenes').then(m=>({default:m.LatencyBreakdownTools}))),
 'latency-levers-priorities':lazy(()=>import('./latency-budget-scenes').then(m=>({default:m.LatencyLeversPriorities}))),
 'slo-indicators-reliability':lazy(()=>import('./slo-budget-scenes').then(m=>({default:m.SloIndicatorsReliability}))),
 'slo-budget-release-sla':lazy(()=>import('./slo-budget-scenes').then(m=>({default:m.SloBudgetReleaseSla})))
}
export function ServiceBudgetsWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
