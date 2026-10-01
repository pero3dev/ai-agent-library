'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
  'coding-rules-content':lazy(()=>import('./coding-rules-scenes').then(m=>({default:m.CodingRulesContent}))),
  'coding-rules-scope-maintenance':lazy(()=>import('./coding-rules-scenes').then(m=>({default:m.CodingRulesScopeMaintenance}))),
  'coding-security-threat-paths':lazy(()=>import('./coding-security-scenes').then(m=>({default:m.CodingSecurityThreatPaths}))),
  'coding-security-permission-modes':lazy(()=>import('./coding-security-scenes').then(m=>({default:m.CodingSecurityPermissionModes}))),
  'coding-security-defense-audit':lazy(()=>import('./coding-security-scenes').then(m=>({default:m.CodingSecurityDefenseAudit}))),
  'coding-automation-task-design':lazy(()=>import('./coding-automation-scenes').then(m=>({default:m.CodingAutomationTaskDesign}))),
  'coding-automation-runtime-recovery':lazy(()=>import('./coding-automation-scenes').then(m=>({default:m.CodingAutomationRuntimeRecovery})))
}
export function CodingControlsWalkthrough({diagramId,children}){
  const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
  if(!Scene)return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
