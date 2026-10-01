'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'framework-abstraction-selection':lazy(()=>import('./framework-selection-scenes').then(m=>({default:m.FrameworkAbstractionSelection}))),
 'framework-boundary-migration':lazy(()=>import('./framework-selection-scenes').then(m=>({default:m.FrameworkBoundaryMigration}))),
 'model-constraints-tier':lazy(()=>import('./model-selection-scenes').then(m=>({default:m.ModelConstraintsTier}))),
 'model-portfolio-updates':lazy(()=>import('./model-selection-scenes').then(m=>({default:m.ModelPortfolioUpdates}))),
 'tuning-choice-methods':lazy(()=>import('./tuning-distillation-scenes').then(m=>({default:m.TuningChoiceMethods}))),
 'distillation-data-lifecycle':lazy(()=>import('./tuning-distillation-scenes').then(m=>({default:m.DistillationDataLifecycle})))
}
export function FrameworkModelTuningWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
