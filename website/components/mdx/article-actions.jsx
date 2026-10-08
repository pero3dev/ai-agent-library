'use client'

import { Button } from 'nextra/components'
import { useCopy } from 'nextra/hooks'

const options = [
  { id: 'copy', name: '記事を Markdown でコピー' },
  { id: 'chatgpt', name: 'ChatGPT で開く' },
  { id: 'claude', name: 'Claude で開く' }
]

/** 表示中の記事の装飾前 Markdown をコピーし、利用先を選べるようにする。 */
export function ArticleActions({ markdown }) {
  const { copy, isCopied } = useCopy()
  if (!markdown) return null
  const handleCopy = () => copy(markdown)
  const useArticle = value => {
    if (value === 'copy') return handleCopy()
    const target = value === 'chatgpt' ? 'https://chatgpt.com/?hints=search&prompt=' : 'https://claude.ai/new?q='
    const query = `Read from ${location.href} so I can ask questions about it.`
    window.open(`${target}${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer')
  }
  return <div className="article-actions" data-pagefind-ignore="all">
    <Button onClick={handleCopy}>{isCopied ? 'コピーしました' : '記事をコピー'}</Button>
    <select aria-label="記事の利用方法" value="" onChange={event => useArticle(event.target.value)}>
      <option value="" disabled>記事の利用方法</option>
      {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  </div>
}
