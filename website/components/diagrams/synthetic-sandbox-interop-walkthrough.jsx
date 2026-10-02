'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'synthetic-purpose-generation':lazy(()=>import('./synthetic-data-scenes').then(m=>({default:m.SyntheticPurposeGeneration}))),
 'synthetic-quality-separation':lazy(()=>import('./synthetic-data-scenes').then(m=>({default:m.SyntheticQualitySeparation}))),
 'sandbox-isolation-selection':lazy(()=>import('./sandbox-boundary-scenes').then(m=>({default:m.SandboxIsolationSelection}))),
 'sandbox-lifecycle-egress':lazy(()=>import('./sandbox-boundary-scenes').then(m=>({default:m.SandboxLifecycleEgress}))),
 'interop-tool-peer-structure':lazy(()=>import('./interop-boundary-scenes').then(m=>({default:m.InteropToolPeerStructure}))),
 'interop-trust-update':lazy(()=>import('./interop-boundary-scenes').then(m=>({default:m.InteropTrustUpdate})))
}
export function SyntheticSandboxInteropWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
