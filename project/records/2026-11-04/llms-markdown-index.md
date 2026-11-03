# AI向けのサイト出力

## 作業契約

- 目的: [Issue #333](https://github.com/pero3dev/ai-agent-library/issues/333)のllms.txt、記事Markdown、索引JSONを同じ公開ビルドから生成する。
- 起点: `origin/main` の `4a70ea5`。専用ブランチは `feat/llms-markdown-index`。元の作業ディレクトリにある図解等の未保存変更は対象外とし、隔離worktreeで作業する。
- 所有範囲: `website/lib/` の生成・発見用リンク、`website/scripts/` の同期と公開後処理、対応する単体・ブラウザー試験、`website/README.md`、互換入口を登録する `harness/typecheck.json`、この記録と `project/README.md` の索引。
- 検証: root・iOS型検査用tools・websiteのlockfile依存を準備し、`npm run check`、サイトの公開相当クリーンビルド・型検査・単体試験・公開安全性試験、Git形式検査、最終差分の独立レビュー、必須CIを確認する。
- 終了条件: 全published記事のMarkdown、階層llms.txt、互換性規則を持つ索引JSONが公開され、mainのCI・Pages・実URLを照合し、Issueをcompletedで閉じる。
- 外部操作の許可: 2026-11-04のユーザー依頼は、専用ブランチ・commit・push・PR・merge・Issue Closeまでの自律実行を明示している。外部への登録・通知、MCPとスキルの実装は含めない。
- 適用規約: `AGENTS.md`、`ROADMAP.md` のサイト作業入口、`CONTRIBUTING.md` のサイト変更・提出前確認、`harness/structure.json`、`harness/git-rules.md`。

## 設計と一次情報

[llms.txt v2の提案](https://llmstxt.org/)を2026-11-04に確認した。ルートとサブパスごとの目次、Markdownへのリンク、HTMLのalternateとdescribedbyを使う。既存サイトの静的HTML出力の拡張子を置き換える形で、記事URLの末尾に`.md`を付ける。標準化団体の規格やクライアントの対応保証とは扱わない。

本文はCC BY 4.0、コードはMITというライセンスを目次と索引に含める。既存のMarkdownコピー生成を再利用し、装飾前の本文を保持する。章READMEの収録順で決定的に生成し、draft・章README・試験fixtureを記事索引から除く。

## 検証と公開

実装の独立レビューはブロッカーなし。原本をmarkdown-itで別途解析し、published199記事の欠落がなく、チェックリスト1,380項目が記事別件数まで一致することを確認した。全199記事の公開Markdownは既存コピー機能用JSONの本文とバイト単位で一致し、用語164語には空の定義がなかった。

公開はクリーンビルドを使う。非クリーン出力だけを手動で再利用し、過去に記事0件だった章自体を削除した場合の古い章目次の掃除は保証しない。通常の`build:clean`では古い出力を除いて生成する。

検証環境はWindows、Node 24.22.1。システム既定のNode 24.14.0を変更せず、既存の対応版を検証子プロセスに指定した。sandbox側のPlaywright実行ファイルがないため、公開相当ビルドはホスト側の既存ブラウザーを使う。実施済み検査の結果と、PR・公開先の証拠をIssueの完了コメントにも記録する。

- `npm ci`をroot・website・iOS型検査用toolsで実施した。
- `npm run check`は成功。共通単体は1,556件中1,456成功・100skip・失敗0。別途、固定されたPOSIX専用Notice試験ファイルはWindowsで`not-run`と表示され、Linux/macOS CIの対象として残る。型検査・ソースcoverage・Markdown lint・記事規約・相対リンク・前提難易度・TODO棚卸し・ハーネス検査を通過した。
- websiteの`npm test`は110件成功・失敗0。新設の生成6件と発見リンク5件を含む。
- websiteの`npm run typecheck`は成功。新設ソース・ブラウザー試験・単体試験も既存strict設定で検査した。
