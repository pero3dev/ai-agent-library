import Link from 'next/link'
import { pageMetadata } from '../../lib/page-metadata.mjs'

export const metadata = pageMetadata('/about', 'このライブラリについて', 'AIによる執筆・独立レビュー・定期最新化の方法、確認範囲と限界、訂正方針、ライセンスを説明します。')

export default function AboutPage() {
  return <main id="nextra-skip-nav" tabIndex={-1} className="page-shell">
    <h1 className="page-title">このライブラリについて</h1>
    <p className="page-lead">日本語話者のエンジニアが、AI Agent の実務の設計判断を学ぶためのライブラリです。</p>
    <h2>制作とレビューの担い手</h2>
    <p>記事・サンプル・サイトは AI Agent(主に Codex)が執筆・編集します。公開前の内容レビューは、執筆と別の AI 実行による独立レビューです。定期最新化も Agent が一次情報の調査、編集、レビューを行います。AI 同士の確認には共通した誤りを見逃す限界があります。</p>
    <p>人(オーナー)は方針決定と公開判断を担当します。記事の人による全件レビューは行っていません。これは 2026-10-03 にオーナーへ確認した役割分担です。</p>
    <h2>確認方法と限界</h2>
    <p>変わりやすい仕様は一次資料と確認日を示し、裏付けが不足する記述は TODO(要確認) として残します。機械検査は記事の構成、リンク、サンプルのモック、サイトビルド、ブラウザー操作を確認します。内容の完全性や全 API・実機での正しさを保証する検査ではありません。実 API、実 Agent、実機の検証は、実施した記録に範囲と結果を分けて示します。</p>
    <p>記事の更新日だけでは一次情報を網羅した日を意味しません。系統ごとの確認範囲は <Link prefetch={false} href="/freshness">確認状況</Link> を参照してください。</p>
    <h2>訂正方針と報告先</h2>
    <p>記事の誤り・古い情報は <a href="https://github.com/pero3dev/ai-agent-library/issues/new?template=article-correction.yml">記事訂正フォーム</a> から報告できます。記事 URL、該当箇所、確認日、一次情報の出典があると確認しやすくなります。確認できた訂正を PR と検証記録に結び付けて反映し、裏付けが不足する点は未確認のまま明示します。学習テーマの希望は <a href="https://github.com/pero3dev/ai-agent-library/issues/new?template=content-request.yml">内容リクエスト</a> で受け付けます。</p>
    <p>脆弱性は公開フォームに書かず、<a href="https://github.com/pero3dev/ai-agent-library/blob/main/SECURITY.md">セキュリティの非公開報告案内</a>を使ってください。</p>
    <h2>ライセンス</h2>
    <p>学習記事などの散文 Markdown は CC BY 4.0、サンプルコードとサイト実装は MIT License です。再利用時は <a href="https://github.com/pero3dev/ai-agent-library/blob/main/LICENSE">LICENSE</a> の対象範囲と表示条件を確認してください。コード領域の README など宣言が重なる散文、共有画像、音声、第三者の依存・フォント・引用先には個別の確認が必要です。<a href="https://github.com/pero3dev/ai-agent-library/blob/main/project/records/2026-10-03/license-inventory.md">ライセンス棚卸し</a>に既存宣言・由来・未確認事項を記録しています。</p>
  </main>
}
