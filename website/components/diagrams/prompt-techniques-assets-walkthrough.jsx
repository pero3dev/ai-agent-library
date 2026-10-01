'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'prompt-basics-input':lazy(()=>import('./prompt-basics-scenes').then(m=>({default:m.PromptBasicsInput}))),
 'prompt-basics-chain':lazy(()=>import('./prompt-basics-scenes').then(m=>({default:m.PromptBasicsChain}))),
 'prompt-pattern-layout':lazy(()=>import('./prompt-pattern-scenes').then(m=>({default:m.PromptPatternLayout}))),
 'prompt-pattern-verification':lazy(()=>import('./prompt-pattern-scenes').then(m=>({default:m.PromptPatternVerification}))),
 'prompt-management-assets':lazy(()=>import('./prompt-management-scenes').then(m=>({default:m.PromptManagementAssets}))),
 'prompt-management-change':lazy(()=>import('./prompt-management-scenes').then(m=>({default:m.PromptManagementChange})))
}
export function PromptTechniquesAssetsWalkthrough({diagramId,children}){
 const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
 if(!Scene)return <>{children}</>
 return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
