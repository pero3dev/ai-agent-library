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

export default withNextra({
  reactStrictMode: true
})
