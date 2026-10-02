'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'judge-format-bias':lazy(()=>import('./judge-evidence-scenes').then(m=>({default:m.JudgeFormatBias}))),
 'judge-validation-split':lazy(()=>import('./judge-evidence-scenes').then(m=>({default:m.JudgeValidationSplit}))),
 'trajectory-path-review':lazy(()=>import('./trajectory-evidence-scenes').then(m=>({default:m.TrajectoryPathReview}))),
 'trajectory-record-constraints':lazy(()=>import('./trajectory-evidence-scenes').then(m=>({default:m.TrajectoryRecordConstraints}))),
 'dataset-source-synthetic':lazy(()=>import('./dataset-evidence-scenes').then(m=>({default:m.DatasetSourceSynthetic}))),
 'dataset-label-maintenance':lazy(()=>import('./dataset-evidence-scenes').then(m=>({default:m.DatasetLabelMaintenance})))
}
export function EvaluationEvidenceWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
