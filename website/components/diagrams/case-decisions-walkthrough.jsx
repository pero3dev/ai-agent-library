'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={'expense-migration-evidence':lazy(()=>import('./expense-decision-scenes').then(m=>({default:m.ExpenseMigrationEvidence}))),'expense-write-regression':lazy(()=>import('./expense-decision-scenes').then(m=>({default:m.ExpenseWriteRegression}))),'pilot-criteria-value':lazy(()=>import('./pilot-decision-scenes').then(m=>({default:m.PilotCriteriaValue}))),'pilot-withdrawal-assets':lazy(()=>import('./pilot-decision-scenes').then(m=>({default:m.PilotWithdrawalAssets}))),'helpdesk-action-boundary':lazy(()=>import('./helpdesk-decision-scenes').then(m=>({default:m.HelpdeskActionBoundary}))),'helpdesk-authority-trace':lazy(()=>import('./helpdesk-decision-scenes').then(m=>({default:m.HelpdeskAuthorityTrace})))}
export function CaseDecisionsWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
