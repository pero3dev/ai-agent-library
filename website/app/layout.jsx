import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './docs.css'

export const metadata = {
  title: {
    default: 'AI Agent Library',
    template: '%s — AI Agent Library'
  },
  description:
    'エンジニアが AI Agent の概念・設計・実装・評価・運用・セキュリティを体系的に学ぶためのドキュメントライブラリ'
}

const navbar = (
  <Navbar logo={<b>AI Agent Library</b>}>
    <a className="nav-extra-link" href="/roadmap">
      依存マップ
    </a>
    <a className="nav-extra-link" href="/glossary">
      用語集
    </a>
    <a className="nav-extra-link" href="/tags">
      タグ
    </a>
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
