import Link from 'next/link'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './docs.css'
import { AudioProvider } from '../components/audio/audio-provider'
import '../components/audio/audio.css'

// 公開 URL(OG タグの絶対 URL 解決に使用)。CI は vars.SITE_URL から NEXT_PUBLIC_SITE_URL を渡す
// (公開先: https://pero3dev.github.io/ai-agent-library/)。ローカルは localhost:3000
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
    <Link className="nav-extra-link audio-nav-link" href="/audio">
      音声で学ぶ
    </Link>
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
        <AudioProvider>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          footer={footer}
          // 「Edit this page」「Feedback」は既定で上流 shuding/nextra を指す 404 リンクになる。
          // content/ は sync の生成物で docs/ 正本へ 1:1 対応しないため、両リンクを無効化する(C12)。
          // docsRepositoryBase も既定(shuding/nextra)を実リポジトリに上書きし、設定 JSON から上流参照を消す
          docsRepositoryBase="https://github.com/pero3dev/ai-agent-library"
          editLink={null}
          feedback={{ content: null }}
        >
          {children}
        </Layout>
        </AudioProvider>
      </body>
    </html>
  )
}
