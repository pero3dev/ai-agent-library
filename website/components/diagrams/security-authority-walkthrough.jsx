'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'identity-delegation-scope':lazy(()=>import('./identity-authority-scenes').then(m=>({default:m.IdentityDelegationScope}))),
 'identity-audit-credentials':lazy(()=>import('./identity-authority-scenes').then(m=>({default:m.IdentityAuditCredentials}))),
 'identity-standards-connection':lazy(()=>import('./identity-authority-scenes').then(m=>({default:m.IdentityStandardsConnection}))),
 'exfiltration-routes-url':lazy(()=>import('./exfiltration-authority-scenes').then(m=>({default:m.ExfiltrationRoutesUrl}))),
 'exfiltration-structure-authorization':lazy(()=>import('./exfiltration-authority-scenes').then(m=>({default:m.ExfiltrationStructureAuthorization}))),
 'guard-layers-enforcement':lazy(()=>import('./guard-authority-scenes').then(m=>({default:m.GuardLayersEnforcement}))),
 'guard-quality-response':lazy(()=>import('./guard-authority-scenes').then(m=>({default:m.GuardQualityResponse})))
}
export function SecurityAuthorityWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
