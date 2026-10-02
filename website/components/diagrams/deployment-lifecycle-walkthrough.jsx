'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'deployment-state-execution':lazy(()=>import('./deployment-operation-scenes').then(m=>({default:m.DeploymentStateExecution}))),
 'deployment-capacity-fallback':lazy(()=>import('./deployment-operation-scenes').then(m=>({default:m.DeploymentCapacityFallback}))),
 'resident-maintenance-signals':lazy(()=>import('./resident-lifecycle-scenes').then(m=>({default:m.ResidentMaintenanceSignals}))),
 'resident-succession-retirement':lazy(()=>import('./resident-lifecycle-scenes').then(m=>({default:m.ResidentSuccessionRetirement}))),
 'mlops-common-differences':lazy(()=>import('./mlops-integration-scenes').then(m=>({default:m.MlopsCommonDifferences}))),
 'mlops-roles-training-join':lazy(()=>import('./mlops-integration-scenes').then(m=>({default:m.MlopsRolesTrainingJoin})))
}
export function DeploymentLifecycleWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
