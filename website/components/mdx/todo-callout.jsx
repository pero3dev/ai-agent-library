/** 「> **TODO(要確認):** …」の表示先。remark-doc-decorations が自動変換する */
export function TodoCallout({ children }) {
  return (
    <aside className="todo-callout">
      <span className="todo-callout-label">TODO(要確認)</span>
      <div className="todo-callout-body">{children}</div>
    </aside>
  )
}
