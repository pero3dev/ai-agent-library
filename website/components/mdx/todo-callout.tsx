/** 「> **TODO(要確認):** …」の表示先。remark-doc-decorations が自動変換する */
import type { ReactNode } from 'react'

export function TodoCallout({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <aside className="todo-callout" id={id}>
      <span className="todo-callout-label">TODO(要確認)</span>
      <div className="todo-callout-body">{children}</div>
    </aside>
  )
}
