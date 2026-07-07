import nextra from 'nextra'

// 注: 記事の自動装飾(TODO・アンチパターン・チェックリスト・用語リンク)は
// scripts/sync-content.mjs + lib/doc-decorations.mjs で sync 時に行う。
// Turbopack はローダーオプションの直列化を要求するため、mdxOptions に関数プラグインは渡せない。
const withNextra = nextra({
  // ドキュメント(content/)は /docs 配下で配信する(トップページ等のカスタムページと分離)
  contentDirBasePath: '/docs',
  // コードブロックは検索インデックスから除外(サンプルコードのノイズを避ける)
  search: { codeblocks: false }
})

// 公開ビルド用の環境変数(WEBSITE-PLAN §8 W5):
//   STATIC_EXPORT=1            → 静的エクスポート(out/ を生成。GitHub Pages 等の静的ホスティング用)
//   NEXT_PUBLIC_BASE_PATH      → サブパス配信時のベースパス(例: /ai-agent-library)。未設定ならルート配信
// ローカル開発(next dev / 通常の next build)ではどちらも未設定のままでよい。
const isExport = process.env.STATIC_EXPORT === '1'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default withNextra({
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  ...(isExport ? { output: 'export', images: { unoptimized: true } } : {})
})
