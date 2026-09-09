import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="nextra-skip-nav" tabIndex={-1} className="page-shell">
      <h1 className="page-title">ページが見つかりません</h1>
      <p className="page-lead">ページの移動や URL の入力間違いの可能性があります。</p>
      <p><Link href="/docs">ドキュメント一覧へ戻る</Link></p>
    </main>
  )
}
