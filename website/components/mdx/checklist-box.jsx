'use client'

import { useState } from 'react'

/**
 * チェックリスト(- [ ])のチェックボックスをクリック可能にする。
 * 状態はページ内のみ(永続化しない)— レビュー時にその場で使う想定
 */
export function ChecklistBox({ defaultChecked = false }) {
  const [checked, setChecked] = useState(Boolean(defaultChecked))
  return (
    <input
      type="checkbox"
      className="checklist-box"
      checked={checked}
      onChange={event => setChecked(event.target.checked)}
    />
  )
}
