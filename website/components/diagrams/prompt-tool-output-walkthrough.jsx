'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'prompt-structure-boundaries':lazy(()=>import('./prompt-design-scenes').then(m=>({default:m.PromptStructureBoundaries}))),
 'prompt-cause-revision':lazy(()=>import('./prompt-design-scenes').then(m=>({default:m.PromptCauseRevision}))),
 'tool-definition-contract':lazy(()=>import('./tool-definition-scenes').then(m=>({default:m.ToolDefinitionContract}))),
 'tool-result-maintenance':lazy(()=>import('./tool-definition-scenes').then(m=>({default:m.ToolResultMaintenance}))),
 'structured-method-schema':lazy(()=>import('./structured-output-scenes').then(m=>({default:m.StructuredMethodSchema}))),
 'structured-validation-loop':lazy(()=>import('./structured-output-scenes').then(m=>({default:m.StructuredValidationLoop})))
}
export function PromptToolOutputWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
