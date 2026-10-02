'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'slm-quality-components':lazy(()=>import('./slm-strategy-scenes').then(m=>({default:m.SlmQualityComponents}))),
 'slm-routing-cost':lazy(()=>import('./slm-strategy-scenes').then(m=>({default:m.SlmRoutingCost}))),
 'computer-observation-permission':lazy(()=>import('./computer-action-scenes').then(m=>({default:m.ComputerObservationPermission}))),
 'computer-stability-evidence':lazy(()=>import('./computer-action-scenes').then(m=>({default:m.ComputerStabilityEvidence}))),
 'voice-architecture-latency':lazy(()=>import('./voice-action-scenes').then(m=>({default:m.VoiceArchitectureLatency}))),
 'voice-interruption-tools':lazy(()=>import('./voice-action-scenes').then(m=>({default:m.VoiceInterruptionTools}))),
 'voice-evaluation-providers':lazy(()=>import('./voice-action-scenes').then(m=>({default:m.VoiceEvaluationProviders})))
}
export function SlmComputerVoiceWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
