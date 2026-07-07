import Link from 'next/link'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './docs.css'

// 公開 URL(OG タグの絶対 URL 解決に使用)。ホスティング確定後に SITE_URL を設定する
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AI Agent Library',
    template: '%s — AI Agent Library'
  },
  description:
    'エンジニアが AI Agent の概念・設計・実装・評価・運用・セキュリティを体系的に学ぶためのドキュメントライブラリ',
  openGraph: {
    siteName: 'AI Agent Library',
    type: 'website',
    locale: 'ja_JP'
  },
  twitter: {
    card: 'summary_large_image'
  }
}

const navbar = (
  <Navbar logo={<b>AI Agent Library</b>}>
    <Link className="nav-extra-link" href="/roadmap">
      依存マップ
    </Link>
    <Link className="nav-extra-link" href="/glossary">
      用語集
    </Link>
    <Link className="nav-extra-link" href="/tags">
      タグ
    </Link>
  </Navbar>
)
const footer = <Footer>AI Agent Library — 実務の設計判断のための学習ドキュメント</Footer>

export default async function RootLayout({ children }) {
  return (
    <html lang="ja" dir="ltr" suppressHydrationWarning>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
