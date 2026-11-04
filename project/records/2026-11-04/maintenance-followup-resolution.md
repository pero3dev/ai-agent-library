# Issue #343〜#349 の実施契約

2026-11-04開始。基点はmain `e617bcac093681aebdf935fe60ef586bb56f0e9b`。目的は7件の改善案を、依存関係に沿って実装・評価し、必要なGitHubと公開確認を経て閉じることです。

## 範囲と実施順

1. #343の記事単位coverageと集計を先に定義し、#345の記事ヘッダーで利用する。
2. #344の週次リンク監視を並行実装し、記事×URLの再確認候補を出す。
3. #346のiOS入力条件を特定して絞り込み、実PRで非起動・起動を確認する。
4. #348の旧証跡の容量・参照・例外を測定して移行を判断し、#347の索引整理に反映する。
5. #349の未見セットを比較前にcommitで固定し、developmentで選んだ候補を最後に一度評価する。

所有パスは各Issueに示された実装・試験と、当日の専用実施記録、`project/README.md`です。元の作業ディレクトリの未保存変更を維持し、専用worktreeで作業します。本文の鮮度観測、既存の評価ラベル変更、履歴改変、Registry公開は対象外です。

## 権限と完了条件

ユーザーの「#343〜#349をすべてCloseするまで自律的に作業」の依頼を、branch・commit・push・PR・merge・必要なworkflow起動・監視Issue更新・公開確認・Closeの許可根拠とします。他の進行中PRは統合しません。Release移行は測定後に必要性を判断します。

`AGENTS.md`、`CONTRIBUTING.md`、`harness/git-rules.md`、`harness/writing-rules.md`、ROADMAPの現在の入口と定期メンテナンス節を適用します。root/websiteのlockfile依存を準備し、`npm run check`、関連するサイト・Python・actionlintを検証します。静的・モック・実ネットワーク・実GitHub・公開表示の結果を区別し、個別Issueの完了条件と最終状態をread-backします。

## 対応記録

- [記事ごとの鮮度と記事ヘッダー](article-freshness-progress.md)
- [外部リンク監視](external-link-monitor.md)
- [iOS起動条件](ios-native-path-filter.md)
- [旧証跡の保存判断](legacy-evidence-retention.md)
- [索引の再構成](project-index-reorganization.md)
- [検索の比較評価](library-search-evaluation.md)

実施中。検証と公開の証拠は各記録とPR・Issueの完了コメントに追記します。
