# iOS完成版TODOの自律実施

## 作業契約

- 目的: [完成版TODO](../../plans/engineering/ios-app-completion.md)の優先度と依存に沿い、M0の基準化から実施可能な作業を継続する。
- 許可根拠: ユーザーが、コミット・PR・mainマージを含む計画の追記後に、TODO順で可能な限り自律的に作業を進め続けるよう明示依頼した。既存の同じiPhoneでの署名・導入・試験の許可も引き継ぐ。
- 開始状態: `main`、HEAD `405e29273a7a3257adeb370c6ac3196d35693d4d`。既存のiOS実装・生成処理・試験・計画・記録は未コミット。受入済み版は0.2.2（4）。
- 所有範囲: iOS一式、`scripts/build-ios*`・`scripts/lib/ios*`と関連単体試験、既存iOS対応の共通設定・配置検査・ライセンス、関連する計画・調査・記録。無関係な他者の差分を取り込まない。
- 分担: 親がGit統合・検証・PR・main反映と記録、独立した読取担当が生成処理とSwiftアプリをそれぞれレビューする。後続実装の担当はファイル境界を分ける。
- 検証: lockfileの依存準備、共通検査、生成・CoreSmoke・SDK build/testと既存実機受入の版を区別する。PRの最終headで必須CI・レビューを確認し、実merge SHA・main CI・影響する公開内容を確認する。
- 終了条件: 各単位は検証・レビュー・commit・PR・main反映を追跡する。本人の契約・有料登録・設備更新・実機操作が必要な部分だけ明示し、依存しない作業を継続する。
- 外部操作: 計画に沿う同じGitHubリポジトリへのbranch・commit・push・PR・mainマージを実施する。契約承諾・課金・OS更新・一般公開申請・タグ公開は、この依頼だけで実施しない。
- 適用規約: [AGENTS](../../../AGENTS.md)、[ROADMAP](../../../ROADMAP.md)、[Git共通規約](../../../harness/git-rules.md)、[形式契約](../../../harness/git-conventions.json)、[開発と検証](../../../CONTRIBUTING.md)、[project索引](../../README.md)。

## 進行

M0の所有差分とremote・既存PR・worktreeを照合し、独立レビューを開始した。GitHubの対象は公開リポジトリ`pero3dev/ai-agent-library`、default branchは`main`。現時点でiOSの既存open PRは検索で見つからなかった。結果は[JSON](ios-autonomous-progress.json)へ更新する。

M1の未採択事項は選択肢を具体化し、採用前提を必要としないM2等の実装を止めない。現在のPersonal Teamとローカル試験の範囲を、App Store公開準備の完了とは扱わない。

ユーザーの追加指示により、新たな実機操作が必要な検査は未完了として記録し、依存しない作業を続ける。重大な影響・契約・費用等の本人判断が必要な場合だけ確認する。

M0レビューで、取り込んだ音声metadataの極端な時間が整数変換でクラッシュする経路と、同じrevision・pathを使う別packageの画像cache混同を発見した。共有の24時間上限と安全な表示変換、canonical root・対象SHAを含むcache keyと回帰試験で対処する。修正を含むソース版は0.2.3（5）とし、0.2.2（4）の既存実機受入と区別する。新しい端末操作は行わない。

両指摘を修正し、独立した再レビューで解消を確認した。CoreSmokeは通常3記事とfixture付き4記事の双方で成功。iOS SDKのbuild-for-testingとRelease buildが成功し、Releaseは3記事・140ファイルのSHAが一致、TestContentを含まなかった。新しいXCTest3件を含むターゲットのcompileまでであり、新規XCTestの実行と実機受入は未実施。通常記事の再生成では既存の`c10353c1…`と同じ版を再現した。

共通依存の監査で既存markdown-itのhighを検出したため、先に[限定依存修正PR #240](https://github.com/pero3dev/ai-agent-library/pull/240)を作成した。実CIでbase lockfileのhigh監査によるHarness policyの失敗を確認し、既存サイト依存の監査でも別のhigh・criticalを検出した。依存修正を分離して準備し、保護設定・監査の回避は行わない。接続の権限制約によりmain保護設定の詳細は取得できなかったが、branch APIでprotectedと11個の必須チェックの全員への適用を確認した。
