'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'fairness-types-measurement':lazy(()=>import('./fairness-quality-scenes').then(m=>({default:m.FairnessTypesMeasurement}))),
 'fairness-japanese-remediation':lazy(()=>import('./fairness-quality-scenes').then(m=>({default:m.FairnessJapaneseRemediation}))),
 'japanese-axes-exceptions':lazy(()=>import('./japanese-quality-scenes').then(m=>({default:m.JapaneseAxesExceptions}))),
 'japanese-judge-division':lazy(()=>import('./japanese-quality-scenes').then(m=>({default:m.JapaneseJudgeDivision}))),
 'trace-hierarchy-versions':lazy(()=>import('./trace-quality-scenes').then(m=>({default:m.TraceHierarchyVersions}))),
 'trace-signals-data-response':lazy(()=>import('./trace-quality-scenes').then(m=>({default:m.TraceSignalsDataResponse})))
}
export function QualityTraceWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
