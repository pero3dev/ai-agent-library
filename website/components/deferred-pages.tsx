'use client'

import dynamic from 'next/dynamic'

// Nextra page-map imports every app page into the shared layout. Keep each
// page-only client implementation behind a chunk boundary.
export const DependencyGraph = dynamic(() => import('./roadmap/dependency-graph').then(module => module.DependencyGraph), { loading: () => <p>依存マップを読み込み中…</p> })
export const GlossaryExplorer = dynamic(() => import('./glossary/glossary-explorer').then(module => module.GlossaryExplorer))
export const AudioLibrary = dynamic(() => import('./audio/audio-library').then(module => module.AudioLibrary))
export const RouteExplorer = dynamic(() => import('./home/route-explorer').then(module => module.RouteExplorer))
