'use client'

import { useId, useState } from 'react'

/**
 * チェックリスト(- [ ])のチェックボックスをクリック可能にする。
 * 状態はページ内のみ(永続化しない)— レビュー時にその場で使う想定
 */
export function ChecklistBox({ defaultChecked = 'false', children }) {
  const labelId = useId()
  const [checked, setChecked] = useState(defaultChecked === true || defaultChecked === 'true')
  return (
    <span className="checklist-item">
    <input
      type="checkbox"
      className="checklist-box"
      checked={checked}
      aria-labelledby={labelId}
      onChange={event => setChecked(event.target.checked)}
    />
    <span id={labelId}>{children}</span>
    </span>
  )
}
