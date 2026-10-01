'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
 'claude-surfaces-runtime':lazy(()=>import('./claude-product-scenes').then(m=>({default:m.ClaudeSurfacesRuntime}))),
 'claude-config-permission':lazy(()=>import('./claude-product-scenes').then(m=>({default:m.ClaudeConfigPermission}))),
 'claude-integrations-adoption':lazy(()=>import('./claude-product-scenes').then(m=>({default:m.ClaudeIntegrationsAdoption}))),
 'codex-surfaces-runtime':lazy(()=>import('./codex-product-scenes').then(m=>({default:m.CodexSurfacesRuntime}))),
 'codex-config-permission':lazy(()=>import('./codex-product-scenes').then(m=>({default:m.CodexConfigPermission}))),
 'codex-integrations-adoption':lazy(()=>import('./codex-product-scenes').then(m=>({default:m.CodexIntegrationsAdoption}))),
 'google-products-runtime':lazy(()=>import('./google-product-scenes').then(m=>({default:m.GoogleProductsRuntime}))),
 'google-config-data':lazy(()=>import('./google-product-scenes').then(m=>({default:m.GoogleConfigData}))),
 'google-integrations-adoption':lazy(()=>import('./google-product-scenes').then(m=>({default:m.GoogleIntegrationsAdoption})))
}
export function CodingProductsWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
