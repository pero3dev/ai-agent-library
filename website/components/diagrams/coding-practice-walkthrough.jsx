'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'claude-practice-mechanisms':lazy(()=>import('./claude-practice-scenes').then(m=>({default:m.ClaudePracticeMechanisms}))),
 'claude-practice-context-cache':lazy(()=>import('./claude-practice-scenes').then(m=>({default:m.ClaudePracticeContextCache}))),
 'claude-practice-automation-quality':lazy(()=>import('./claude-practice-scenes').then(m=>({default:m.ClaudePracticeAutomationQuality}))),
 'codex-practice-surfaces-config':lazy(()=>import('./codex-practice-scenes').then(m=>({default:m.CodexPracticeSurfacesConfig}))),
 'codex-practice-budget-context':lazy(()=>import('./codex-practice-scenes').then(m=>({default:m.CodexPracticeBudgetContext}))),
 'codex-practice-automation-quality':lazy(()=>import('./codex-practice-scenes').then(m=>({default:m.CodexPracticeAutomationQuality}))),
 'copilot-practice-functions-config':lazy(()=>import('./copilot-practice-scenes').then(m=>({default:m.CopilotPracticeFunctionsConfig}))),
 'copilot-practice-budget-cache':lazy(()=>import('./copilot-practice-scenes').then(m=>({default:m.CopilotPracticeBudgetCache}))),
 'copilot-practice-automation':lazy(()=>import('./copilot-practice-scenes').then(m=>({default:m.CopilotPracticeAutomation})))
}
export function CodingPracticeWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
