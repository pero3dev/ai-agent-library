/** State deliberately installed by browser test init scripts and DOM probes. */
export {}

declare global {
  interface Window {
    copiedArticleMarkdown: string
    articleOpenArguments: Parameters<Window['open']>
    scrollTasks: number[]
    cspViolations: { directive: string; blocked: string }[]
    audioCspViolations: { directive: string; blocked: string }[]
    diagramCspViolations: string[]
  }
  interface HTMLElement {
    keyboardScrollEnded?: boolean
  }
}
