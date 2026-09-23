'use client'

import { createContext, useContext } from 'react'

export const ReadingStage = createContext(0)

/** Keep original article nodes readable without loading the interactive figure. */
export function ReadingStep({ step, children, ...attributes }) {
  const activeStage = useContext(ReadingStage)
  return <div {...attributes} className="aw-reading-step" data-reading-step={step} data-reading-active={activeStage === Number(step)}>{children}</div>
}
