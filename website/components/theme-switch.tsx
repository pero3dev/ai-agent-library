'use client'

import { useTheme } from 'next-themes'
import { useMounted } from 'nextra/hooks'

const options = [
  { id: 'light', name: 'ライト' },
  { id: 'dark', name: 'ダーク' },
  { id: 'system', name: 'システム設定' }
]

// 表示を縮めても操作の目的と現在値をテキストとして残す。
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  const value = mounted ? theme : 'system'
  return <select
    className="site-theme-switch"
    aria-label="表示テーマ"
    disabled={!mounted}
    value={value}
    onChange={event => setTheme(event.target.value)}
  >{options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
}
