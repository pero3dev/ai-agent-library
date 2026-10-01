'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'embedding-choice-asymmetry':lazy(()=>import('./embedding-scenes').then(m=>({default:m.EmbeddingChoiceAsymmetry}))),
 'embedding-chunk-deploy':lazy(()=>import('./embedding-scenes').then(m=>({default:m.EmbeddingChunkDeploy}))),
 'vector-choice-approximation':lazy(()=>import('./vector-scenes').then(m=>({default:m.VectorChoiceApproximation}))),
 'vector-filter-operations':lazy(()=>import('./vector-scenes').then(m=>({default:m.VectorFilterOperations}))),
 'preprocess-extraction-quality':lazy(()=>import('./preprocessing-scenes').then(m=>({default:m.PreprocessExtractionQuality}))),
 'preprocess-metadata-lineage':lazy(()=>import('./preprocessing-scenes').then(m=>({default:m.PreprocessMetadataLineage})))
}
export function RetrievalDataWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
