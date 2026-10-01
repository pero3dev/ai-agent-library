'use client'
import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingArticleContents } from './reading-article-navigation'
const scenes={
  'durable-resume-design':lazy(()=>import('./durable-execution-scenes').then(m=>({default:m.DurableResumeDesign}))),
  'durable-side-effect-contract':lazy(()=>import('./durable-execution-scenes').then(m=>({default:m.DurableSideEffectContract}))),
  'durable-wait-and-progress':lazy(()=>import('./durable-execution-scenes').then(m=>({default:m.DurableWaitProgress}))),
  'tenant-data-and-settings':lazy(()=>import('./tenant-isolation-scenes').then(m=>({default:m.TenantDataSettings}))),
  'tenant-capacity-and-cost':lazy(()=>import('./tenant-isolation-scenes').then(m=>({default:m.TenantCapacityCost}))),
  'agent-api-job-states':lazy(()=>import('./agent-api-contract-scenes').then(m=>({default:m.AgentApiJobStates}))),
  'agent-api-events-and-idempotency':lazy(()=>import('./agent-api-contract-scenes').then(m=>({default:m.AgentApiEventsIdempotency}))),
  'agent-api-change-and-metering':lazy(()=>import('./agent-api-contract-scenes').then(m=>({default:m.AgentApiChangeMetering})))
}
export function DurableContractWalkthrough({diagramId,children}) {
  const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null
  if(!Scene)return <>{children}</>
  return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>
}
