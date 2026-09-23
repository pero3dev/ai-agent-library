'use client'

import { lazy } from 'react'
import { DiagramBoundary } from './diagram-boundary'
import { ReadingStep } from './reading-step'
import { ReadingArticleContents } from './reading-article-navigation'
import './reading-figure.css'
import '../attention/attention.css'

// Only the lightweight entry is shared by every MDX page. The rendered article
// loads its figure while retaining its server-rendered HTML and original prose.
const LazyAttentionWalkthrough = lazy(
  () => import('../attention/attention-walkthrough').then(module => ({ default: module.AttentionWalkthrough }))
)

export function AttentionWalkthrough({ children, ...props }) {
  return <><ReadingArticleContents diagramId="self-attention" /><DiagramBoundary fallback={children}>
    <LazyAttentionWalkthrough {...props}>{children}</LazyAttentionWalkthrough>
  </DiagramBoundary></>
}

export { ReadingStep }

export function AttentionStep({ step, children }) {
  return <ReadingStep step={step} data-attention-step={step}>{children}</ReadingStep>
}
