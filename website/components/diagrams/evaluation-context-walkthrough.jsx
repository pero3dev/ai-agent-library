'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'environment-layers-state':lazy(()=>import('./environment-context-scenes').then(m=>({default:m.EnvironmentLayersState}))),
 'environment-repro-fidelity':lazy(()=>import('./environment-context-scenes').then(m=>({default:m.EnvironmentReproFidelity}))),
 'simulator-roles-constraints':lazy(()=>import('./simulator-context-scenes').then(m=>({default:m.SimulatorRolesConstraints}))),
 'simulator-scenarios-validation':lazy(()=>import('./simulator-context-scenes').then(m=>({default:m.SimulatorScenariosValidation}))),
 'calibration-signals-bins':lazy(()=>import('./calibration-context-scenes').then(m=>({default:m.CalibrationSignalsBins}))),
 'calibration-abstain-update':lazy(()=>import('./calibration-context-scenes').then(m=>({default:m.CalibrationAbstainUpdate})))
}
export function EvaluationContextWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
