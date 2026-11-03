/** 「> **TODO(要確認):** …」の表示先。remark-doc-decorations が自動変換する */
import type { ReactNode } from 'react'

export function TodoCallout({ children }: { children?: ReactNode }) {
  return (
    <aside className="todo-callout">
      <span className="todo-callout-label">TODO(要確認)</span>
      <div className="todo-callout-body">{children}</div>
    </aside>
  )
}
