'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={'support-scope-gates':lazy(()=>import('./support-case-scenes').then(m=>({default:m.SupportScopeGates}))),'support-rollout-return':lazy(()=>import('./support-case-scenes').then(m=>({default:m.SupportRolloutReturn}))),'analysis-error-context':lazy(()=>import('./analysis-case-scenes').then(m=>({default:m.AnalysisErrorContext}))),'analysis-validation-return':lazy(()=>import('./analysis-case-scenes').then(m=>({default:m.AnalysisValidationReturn}))),'mail-capability-path':lazy(()=>import('./mail-case-scenes').then(m=>({default:m.MailCapabilityPath}))),'mail-containment-return':lazy(()=>import('./mail-case-scenes').then(m=>({default:m.MailContainmentReturn})))}
export function CaseEvidenceWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
