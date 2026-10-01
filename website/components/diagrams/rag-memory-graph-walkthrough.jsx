'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'rag-ingestion-search':lazy(()=>import('./rag-pipeline-scenes').then(m=>({default:m.RagIngestionSearch}))),
 'rag-agent-evidence':lazy(()=>import('./rag-pipeline-scenes').then(m=>({default:m.RagAgentEvidence}))),
 'memory-extract-store':lazy(()=>import('./long-memory-scenes').then(m=>({default:m.MemoryExtractStore}))),
 'memory-recall-forget':lazy(()=>import('./long-memory-scenes').then(m=>({default:m.MemoryRecallForget}))),
 'graph-build-quality':lazy(()=>import('./knowledge-graph-scenes').then(m=>({default:m.GraphBuildQuality}))),
 'graph-types-investment':lazy(()=>import('./knowledge-graph-scenes').then(m=>({default:m.GraphTypesInvestment})))
}
export function RagMemoryGraphWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
