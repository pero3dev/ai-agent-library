'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'cursor-runtime-data':lazy(()=>import('./cursor-product-scenes').then(m=>({default:m.CursorRuntimeData}))),
 'cursor-rules-security':lazy(()=>import('./cursor-product-scenes').then(m=>({default:m.CursorRulesSecurity}))),
 'cursor-connections-adoption':lazy(()=>import('./cursor-product-scenes').then(m=>({default:m.CursorConnectionsAdoption}))),
 'windsurf-runtime-migration':lazy(()=>import('./windsurf-product-scenes').then(m=>({default:m.WindsurfRuntimeMigration}))),
 'windsurf-rules-security':lazy(()=>import('./windsurf-product-scenes').then(m=>({default:m.WindsurfRulesSecurity}))),
 'windsurf-connections-adoption':lazy(()=>import('./windsurf-product-scenes').then(m=>({default:m.WindsurfConnectionsAdoption}))),
 'devin-delegation-runtime':lazy(()=>import('./devin-cloud-scenes').then(m=>({default:m.DevinDelegationRuntime}))),
 'devin-teaching-security':lazy(()=>import('./devin-cloud-scenes').then(m=>({default:m.DevinTeachingSecurity}))),
 'devin-connections-adoption':lazy(()=>import('./devin-cloud-scenes').then(m=>({default:m.DevinConnectionsAdoption})))
}
export function CodingIdeCloudWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
