'use client'
import {lazy} from 'react'
import {DiagramBoundary} from './diagram-boundary'
import {ReadingArticleContents} from './reading-article-navigation'
const scenes={
 'catalogue-common-map':lazy(()=>import('./model-catalogue-scenes').then(m=>({default:m.CatalogueCommonMap}))),
 'catalogue-provider-boundaries':lazy(()=>import('./model-catalogue-scenes').then(m=>({default:m.CatalogueProviderBoundaries}))),
 'catalogue-openweight-licenses':lazy(()=>import('./model-catalogue-scenes').then(m=>({default:m.CatalogueOpenweightLicenses}))),
 'oss-layers-permission':lazy(()=>import('./oss-ecosystem-scenes').then(m=>({default:m.OssLayersPermission}))),
 'oss-provenance-maintenance':lazy(()=>import('./oss-ecosystem-scenes').then(m=>({default:m.OssProvenanceMaintenance}))),
 'local-runtime-selection':lazy(()=>import('./local-runtime-scenes').then(m=>({default:m.LocalRuntimeSelection}))),
 'local-quality-deployment':lazy(()=>import('./local-runtime-scenes').then(m=>({default:m.LocalQualityDeployment})))
}
export function CatalogueOssLocalWalkthrough({diagramId,children}){const Scene=Object.hasOwn(scenes,diagramId)?scenes[diagramId]:null;if(!Scene)return <>{children}</>;return <><ReadingArticleContents diagramId={diagramId}/><DiagramBoundary key={diagramId} fallback={children}><Scene>{children}</Scene></DiagramBoundary></>}
