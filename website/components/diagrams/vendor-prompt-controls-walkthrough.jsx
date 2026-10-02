'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'claude-structure-examples':lazy(()=>import('./claude-prompt-controls-scenes').then(m=>({default:m.ClaudeStructureExamples}))),
 'claude-thinking-output':lazy(()=>import('./claude-prompt-controls-scenes').then(m=>({default:m.ClaudeThinkingOutput}))),
 'claude-history-migration':lazy(()=>import('./claude-prompt-controls-scenes').then(m=>({default:m.ClaudeHistoryMigration}))),
 'openai-instruction-contract':lazy(()=>import('./openai-prompt-controls-scenes').then(m=>({default:m.OpenaiInstructionContract}))),
 'openai-thinking-output':lazy(()=>import('./openai-prompt-controls-scenes').then(m=>({default:m.OpenaiThinkingOutput}))),
 'openai-history-migration':lazy(()=>import('./openai-prompt-controls-scenes').then(m=>({default:m.OpenaiHistoryMigration}))),
 'gemini-structure-examples':lazy(()=>import('./gemini-prompt-controls-scenes').then(m=>({default:m.GeminiStructureExamples}))),
 'gemini-thinking-context':lazy(()=>import('./gemini-prompt-controls-scenes').then(m=>({default:m.GeminiThinkingContext}))),
 'gemini-tool-migration':lazy(()=>import('./gemini-prompt-controls-scenes').then(m=>({default:m.GeminiToolMigration})))
}
export function VendorPromptControlsWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
