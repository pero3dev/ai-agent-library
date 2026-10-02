'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'cross-provider-map':lazy(()=>import('./cross-provider-scenes').then(m=>({default:m.CrossProviderMap}))),
 'cross-provider-migration':lazy(()=>import('./cross-provider-scenes').then(m=>({default:m.CrossProviderMigration}))),
 'mcp-connection-versions':lazy(()=>import('./mcp-integration-scenes').then(m=>({default:m.McpConnectionVersions}))),
 'mcp-tool-authority':lazy(()=>import('./mcp-integration-scenes').then(m=>({default:m.McpToolAuthority}))),
 'evaluation-layers-graders':lazy(()=>import('./evaluation-basics-scenes').then(m=>({default:m.EvaluationLayersGraders}))),
 'evaluation-harness-decision':lazy(()=>import('./evaluation-basics-scenes').then(m=>({default:m.EvaluationHarnessDecision})))
}
export function ModelMcpEvaluationWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
