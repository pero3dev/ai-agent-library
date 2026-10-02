'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'threat-boundary-cycle':lazy(()=>import('./threat-boundary-scenes').then(m=>({default:m.ThreatBoundaryCycle}))),
 'threat-trifecta-workflow':lazy(()=>import('./threat-boundary-scenes').then(m=>({default:m.ThreatTrifectaWorkflow}))),
 'injection-input-defense':lazy(()=>import('./injection-boundary-scenes').then(m=>({default:m.InjectionInputDefense}))),
 'injection-repeated-risk':lazy(()=>import('./injection-boundary-scenes').then(m=>({default:m.InjectionRepeatedRisk}))),
 'permission-gates-scope':lazy(()=>import('./permission-boundary-scenes').then(m=>({default:m.PermissionGatesScope}))),
 'permission-sandbox-mcp':lazy(()=>import('./permission-boundary-scenes').then(m=>({default:m.PermissionSandboxMcp})))
}
export function SecurityBoundariesWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
