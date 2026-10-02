'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'red-exercise-design':lazy(()=>import('./red-exercise-scenes').then(m=>({default:m.RedExerciseDesign}))),
 'red-results-return':lazy(()=>import('./red-exercise-scenes').then(m=>({default:m.RedResultsReturn}))),
 'supply-asset-integrity':lazy(()=>import('./supply-admission-scenes').then(m=>({default:m.SupplyAssetIntegrity}))),
 'supply-admission-update':lazy(()=>import('./supply-admission-scenes').then(m=>({default:m.SupplyAdmissionUpdate}))),
 'attack-delayed-paths':lazy(()=>import('./attack-propagation-scenes').then(m=>({default:m.AttackDelayedPaths}))),
 'attack-propagation-controls':lazy(()=>import('./attack-propagation-scenes').then(m=>({default:m.AttackPropagationControls})))
}
export function SecurityAdversityWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
