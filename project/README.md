# project — 計画と実施記録

共通契約は[AGENTS](../AGENTS.md)、検証手順は[CONTRIBUTING](../CONTRIBUTING.md)、記事と定点観測の正本は[ROADMAP](../ROADMAP.md)です。

## 進行中の作業

2026-11-04確認。以下は現在の作業への入口です。各記録にある候補・過去の試験結果と、採用済みの動作を区別してください。

| 作業 | 状態と入口 |
| --- | --- |
| Issue #343〜#349 | 対応中。[依存順・所有範囲・完了条件](records/2026-11-04/maintenance-followup-resolution.md) |
| 定期最新化 | 継続。[監視Issue #220](https://github.com/pero3dev/ai-agent-library/issues/220)と[現行手順](../freshness-automation.md)で確認する |
| iOS最低OSの試行 | [PR #301](https://github.com/pero3dev/ai-agent-library/pull/301)はDraft。未受入範囲はPR本文と対応記録で確認する |

## 領域別の実施記録

各リンクは記録作成時点の実装・検証・残件を案内します。後続の結果は記録内の追補と対応PRで照合し、索引だけで完了や公開を推定しません。同じ原本への重複した長文案内は一つにまとめています。

### 記事・調査

- [2026-10-08の再開記録](records/2026-10-08/freshness-monitor-recovery.md) — 2026-10-08の実施・検証記録。
- [第3回レビューの記事修正記録](records/2026-10-03/third-review-article-remediation.md) — 2026-10-03の実施・検証記録。
- [第3回レビューの記事修正の一次情報](../research/reviews/2026-10-03-article-remediation.md) — 関連する計画・運用の入口。
- [記事Issueの修正記録](records/2026-10-03/article-issue-remediation.md) — 2026-10-03の実施・検証記録。
- [TypeScript段階移行の一次資料調査](../research/typescript-migration-2026-11-03.md) — 関連する計画・運用の入口。
- [現行運用](../freshness-automation.md) — 関連する計画・運用の入口。

### サイト

- [記事単位の確認進捗と記事ヘッダー](records/2026-11-04/article-freshness-progress.md) — 確認日と更新日の区別、所属系統、未確認事項への静的リンク。
- [AI向けサイト出力](records/2026-11-04/llms-markdown-index.md) — 2026-11-04の実施・検証記録。
- [遅延する図の寸法予約と見出し位置の安定化](records/2026-10-25/website-mermaid-layout-stability.md) — 2026-10-25の実施・検証記録。
- [2026-10-04の実施記録](records/2026-10-04/site-fog-and-dark-callouts.md) — 2026-10-04の実施・検証記録。
- [サイトの修正](records/2026-10-03/third-review-website-remediation.md) — 2026-10-03の実施・検証記録。
- [前提知識55件の判断](records/2026-10-03/prerequisite-level-audit.md) — 2026-10-03の実施・検証記録。
- [Pages診断・復旧の現行手順](../website/operations.md) — 関連する計画・運用の入口。
- [サイトの修正](records/2026-10-03/website-issue-remediation.md) — 2026-10-03の実施・検証記録。
- [動的図解のバックアップと機能削除](records/2026-10-03/dynamic-diagram-removal.md) — 2026-10-03の実施・検証記録。
- [サンプル・公開の実施記録](records/2026-10-03/r1-01-layout-preview.md) — 2026-10-03の実施・検証記録。
- [展開状況](records/2026-09-24/dynamic-diagram-rollout.md) — 2026-09-24の実施・検証記録。
- [P0実施記録](records/2026-09-24/reading-diagram-foundation.md) — 2026-09-24の実施・検証記録。
- [Transformer制作](records/2026-09-24/transformer-reading-diagrams.md) — 2026-09-24の実施・検証記録。
- [注意変種制作](records/2026-09-24/attention-variants-reading-diagrams.md) — 2026-09-24の実施・検証記録。
- [MoE制作](records/2026-09-24/moe-reading-diagrams.md) — 2026-09-24の実施・検証記録。
- [文章生成・トークン化](records/2026-09-24/generation-tokenization-reading-diagrams.md) — 2026-09-24の実施・検証記録。
- [推論内部](records/2026-09-24/inference-reading-diagrams.md) — 2026-09-24の実施・検証記録。
- [学習パイプラインの制作](records/2026-09-24/training-reading-diagrams.md) — 2026-09-24の実施・検証記録。
- [事前学習の制作](records/2026-09-25/pretraining-reading-diagrams.md) — 2026-09-25の実施・検証記録。
- [D1アラインメント制作](records/2026-09-30/alignment-reading-diagrams.md) — 2026-09-30の実施・検証記録。
- [D2推論モデル制作](records/2026-09-30/reasoning-reading-diagrams.md) — 2026-09-30の実施・検証記録。
- [記事別棚卸し](plans/engineering/dynamic-diagram-inventory.md) — 関連する計画・運用の入口。
- [動的図解の全記事展開の計画作成](records/2026-09-24/dynamic-diagram-plan.md) — 2026-09-24の実施・検証記録。
- [GitHub 紹介ページの改善](records/2026-09-20/github-showcase.md) — 2026-09-20の実施・検証記録。
- [サイトの開発手順](../website/README.md) — 関連する計画・運用の入口。

### iOS

- [Appメモリ計測の手動起動](records/2026-11-04/ios-app-memory-manual-dispatch.md) — 対象ソースの照合と計測の検証範囲。
- [native回帰の起動条件](records/2026-11-04/ios-native-path-filter.md) — 推移的入力の一覧と実PRでの条件検証。
- [通常検証とguard順序のpreview16](records/2026-11-04/ios-storage-scope-ui-regression.md) — 2026-11-04の実施・検証記録。
- [モーダル提示境界の診断](records/2026-11-04/ios-native-modal-presentation-boundaries.md) — 2026-11-04の実施・検証記録。
- [保存処理のprocess内協調候補](records/2026-11-04/ios-storage-mutation-coordinator.md) — 2026-11-04の実施・検証記録。
- [自分のPRで長文Clockを選ぶCI候補](records/2026-11-04/ios-own-pr-long-scroll-selection.md) — 2026-11-04の実施・検証記録。
- [自用の読書位置・復旧機能の受入](records/2026-11-04/ios-personal-reading-recovery-acceptance.md) — 2026-11-04の実施・検証記録。
- [保存コンテンツの容量表示候補](records/2026-11-02/ios-storage-usage-preview.md) — 2026-11-02の実施・検証記録。
- [書き出し取消UIの確認方式](records/2026-11-03/ios-export-picker-snapshot.md) — 2026-11-03の実施・検証記録。
- [到達済み見出しの読書位置修正](records/2026-11-03/ios-reached-heading-reading-position.md) — 2026-11-03の実施・検証記録。
- [b05後の標準macos-15候補と別ARM459診断](records/2026-11-02/ios-native-owned-simulator.md) — 2026-11-02の実施・検証記録。
- [改訂回帰のcontainer再取得監査](records/2026-11-02/ios-reader-valid-revision-ui.md) — 2026-11-02の実施・検証記録。
- [改訂回帰の証跡ファイル名の追補](records/2026-11-02/ios-reader-valid-revision-ui.md#pr326%E5%88%9D%E5%9B%9E%E3%81%AE%E8%A8%BC%E8%B7%A1%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%90%8D%E3%81%A8%E8%BF%BD%E8%A3%9C%E5%80%99%E8%A3%9C) — 2026-11-02の実施・検証記録。
- [Simulator一覧の読取上限と共有期限の整合](records/2026-11-02/ios-simulator-inventory-read-budget.md) — 2026-11-02の実施・検証記録。
- [回転UIの共有時間枠の追加配分](records/2026-11-02/ios-reader-rotation-ui-budget.md) — 2026-11-02の実施・検証記録。
- [DEBUG文字サイズ指定の本文テストへの引継ぎ](records/2026-11-02/ios-dynamic-type-sheet-font-fix.md) — 2026-11-02の実施・検証記録。
- [復旧確認タイトルの失敗時診断](records/2026-11-02/ios-recovery-confirmation-diagnostics.md) — 2026-11-02の実施・検証記録。
- [文字サイズの実環境診断](records/2026-11-02/ios-dynamic-type-environment-probe.md) — 2026-11-02の実施・検証記録。
- [タグ検索の前面readiness](records/2026-11-02/ios-tag-search-readiness.md) — 2026-11-02の実施・検証記録。
- [Notice対応Core観測とmainの受入追補](records/2026-10-31/ios-notice-core-hosted-observation.md) — 2026-10-31の実施・検証記録。
- [文字サイズ変更後の読書位置復帰](records/2026-10-31/ios-dynamic-type-reading-restore.md) — 2026-10-31の実施・検証記録。
- [全記事Bのcanary準備と採用](records/2026-11-01/ios-clipboard-canary-seed.md) — 2026-11-01の実施・検証記録。
- [Native UI失敗添付の小規模保存](records/2026-11-01/ios-native-failure-compact.md) — 2026-11-01の実施・検証記録。
- [読書記録の書き出し取消後の保持](records/2026-10-31/ios-reading-export-cancellation.md) — 2026-10-31の実施・検証記録。
- [固定列幅表の回転後の読書位置回帰](records/2026-10-31/ios-reader-rotation-regression.md) — 2026-10-31の実施・検証記録。
- [以前選択した保存記事版へのfallback](records/2026-10-31/ios-previous-stored-version-fallback.md) — 2026-10-31の実施・検証記録。
- [現在の記事版にない読書記録の件数と保管案内](records/2026-10-31/ios-unavailable-reading-records.md) — 2026-10-31の実施・検証記録。
- [Aboutの版情報・診断・通信と保存説明](records/2026-10-30/ios-safe-diagnostics.md) — 2026-10-30の実施・検証記録。
- [本文リンクと健全な旧読書記録のUI回帰](records/2026-10-30/ios-native-body-link-regression.md) — 2026-10-30の実施・検証記録。
- [保存記事版の参照保持](records/2026-10-30/ios-snapshot-lease-accounting.md) — 2026-10-30の実施・検証記録。
- [保存済みCoreホスト観測の検証器](records/2026-10-30/ios-core-observation-verification.md) — 2026-10-30の実施・検証記録。
- [本文検索の読書開始余白](records/2026-10-30/ios-native-search-reading-start-clearance.md) — 2026-10-30の実施・検証記録。
- [同梱ライセンスの生成元照合](records/2026-10-30/ios-native-upstream-license-audit.md) — 2026-10-30の実施・検証記録。
- [自用初版の記事更新方式](records/2026-10-30/ios-personal-bundled-update-policy.md) — 2026-10-30の実施・検証記録。
- [読書UI待機の診断候補](records/2026-10-30/ios-reader-wait-diagnostics.md) — 2026-10-30の実施・検証記録。
- [長文の固定区間スクロールClock](records/2026-10-30/ios-long-scroll-clock.md) — 2026-10-30の実施・検証記録。
- [自分用候補の現況](records/2026-10-30/ios-personal-use-candidate-checkpoint.md) — 2026-10-30の実施・検証記録。
- [単体失敗後のinventory収集](records/2026-10-29/ios-full-core-failure-inventory.md) — 2026-10-29の実施・検証記録。
- [読書位置としおりの明示復旧UI回帰](records/2026-10-29/ios-reading-recovery-position-ui.md) — 2026-10-29の実施・検証記録。
- [表示サイズ別プレビュー](records/2026-10-29/ios-figure-preview-images.md) — 2026-10-29の実施・検証記録。
- [固定契約後のApp memory収集](records/2026-10-28/ios-app-memory-observation.md#%E5%9B%BA%E5%AE%9A%E5%A5%91%E7%B4%84%E5%BE%8C%E3%81%AE%E5%88%9D%E5%9B%9Ehosted%E5%8F%8E%E9%9B%86%E6%88%90%E5%8A%9F) — 2026-10-28の実施・検証記録。
- [iPhone AppIconとビルド後監査](records/2026-10-26/ios-app-icon-native-assets.md) — 2026-10-26の実施・検証記録。
- [App memory観測](records/2026-10-28/ios-app-memory-observation.md#%E5%AE%8C%E5%85%A8summary%E3%81%AE%E5%8F%96%E5%BE%97%E3%81%A8csv%E5%8F%8E%E9%8C%B2%E5%89%8D%E3%81%AE%E5%A4%B1%E6%95%97) — 2026-10-28の実施・検証記録。
- [App memory固定契約](records/2026-10-28/ios-app-memory-observation.md#%E5%AE%9Fcsv%E3%81%AE%E7%85%A7%E5%90%88%E3%81%A8%E5%9B%BA%E5%AE%9A%E5%A5%91%E7%B4%84) — 2026-10-28の実施・検証記録。
- [App memory採用と工程配分](records/2026-10-28/ios-app-memory-observation.md#main%E5%8F%8D%E6%98%A0%E5%BE%8C%E3%81%AE%E5%A4%B1%E6%95%97%E3%81%A8%E7%94%9F%E6%88%90%E7%9B%A3%E6%9F%BB%E3%81%AE%E5%B7%A5%E7%A8%8B%E4%B8%8A%E9%99%90) — 2026-10-28の実施・検証記録。
- [App本文表示時のメモリ観測](records/2026-10-28/ios-app-memory-observation.md) — 2026-10-28の実施・検証記録。
- [Core host観測](records/2026-10-26/ios-published-core-benchmark.md) — 2026-10-26の実施・検証記録。
- [現行CoreのHosted観測](records/2026-10-27/ios-core-hosted-observation.md) — 2026-10-27の実施・検証記録。
- [読書記録の破損保全と明示復旧](records/2026-10-27/ios-reading-state-recovery.md) — 2026-10-27の実施・検証記録。
- [読書記録の手動書き出し](records/2026-10-28/ios-reading-backup-export.md) — 2026-10-28の実施・検証記録。
- [読書exportの採用追記](records/2026-10-28/ios-reading-backup-export.md#pr293%E3%81%AE%E6%8E%A1%E7%94%A8%E8%BF%BD%E8%A8%98) — 2026-10-28の実施・検証記録。
- [読書記録の手動復元](records/2026-10-28/ios-reading-manual-restore.md) — 2026-10-28の実施・検証記録。
- [iOS26の本文待機診断](records/2026-10-28/ios-runtime26-wait-trace.md) — 2026-10-28の実施・検証記録。
- [コードコピー回帰検査](records/2026-10-27/ios-code-copy-ui-ci.md) — 2026-10-27の実施・検証記録。
- [読書記録復旧のUI回帰](records/2026-10-27/ios-reading-recovery-ui.md) — 2026-10-27の実施・検証記録。
- [更新復旧試験の実行元](records/2026-10-28/ios-destination-artifacts-ui.md) — 2026-10-28の実施・検証記録。
- [iOS TODOと統合状況のチェックポイント](records/2026-10-26/ios-todo-integration-checkpoint.md) — 2026-10-26の実施・検証記録。
- [iOS自分用初版の方針](records/2026-10-28/ios-personal-use-scope.md) — 2026-10-28の実施・検証記録。
- [block内部の読書位置候補](records/2026-10-26/ios-intrablock-reading-progress.md) — 2026-10-26の実施・検証記録。
- [フォルダー選択取消の追随preview](records/2026-10-26/ios-picker-cancel-ui.md) — 2026-10-26の実施・検証記録。
- [本文検索の到着と復帰](records/2026-10-26/ios-search-hit-ui-regression.md) — 2026-10-26の実施・検証記録。
- [補助画面と保存分離UI回帰](records/2026-10-25/ios-filtered-actions-ui.md) — 2026-10-25の実施・検証記録。
- [保持回帰3件](records/2026-10-25/ios-storage-retention-regression.md) — 2026-10-25の実施・検証記録。
- [SDK27互換性preflight](records/2026-10-26/ios-sdk27-compatibility-preflight.md) — 2026-10-26の実施・検証記録。
- [Archive互換性の事前検証](records/2026-10-25/ios-sdk26-archive-preflight.md) — 2026-10-25の実施・検証記録。
- [性能観測基盤](records/2026-10-25/ios-published-readiness-observation.md) — 2026-10-25の実施・検証記録。
- [検索UIのClock観測候補](records/2026-10-28/ios-search-ui-clock.md) — 2026-10-28の実施・検証記録。
- [検索Clockの採用追記](records/2026-10-28/ios-search-ui-clock.md#pr292%E3%81%AE%E6%8E%A1%E7%94%A8%E3%81%A8%E5%AE%9F%E8%A6%B3%E6%B8%AC%E3%81%AE%E8%BF%BD%E8%A8%98) — 2026-10-28の実施・検証記録。
- [main49のApp起動観測](records/2026-10-28/ios-published-launch-readiness.md) — 2026-10-28の実施・検証記録。
- [入口統合の記録](records/2026-10-25/ios-published-development-default.md) — 2026-10-25の実施・検証記録。
- [章リンクの記録](records/2026-10-25/ios-native-chapter-link.md) — 2026-10-25の実施・検証記録。
- [検索索引の記録](records/2026-10-25/ios-normalized-search-index.md) — 2026-10-25の実施・検証記録。
- [同梱版選択の記録](records/2026-10-25/ios-bundled-content-activation.md) — 2026-10-25の実施・検証記録。
- [ネイティブ学習UIの記録](records/2026-10-25/ios-native-learning-ui.md) — 2026-10-25の実施・検証記録。
- [consumerの記録](records/2026-10-25/ios-learning-index-consumer.md) — 2026-10-25の実施・検証記録。
- [学習案内の生成記録](records/2026-10-25/ios-learning-index-generation.md) — 2026-10-25の実施・検証記録。
- [候補UIの記録](records/2026-10-25/ios-published-candidate-ui.md) — 2026-10-25の実施・検証記録。
- [準備記録](records/2026-10-25/ios-published-library-profile.md) — 2026-10-25の実施・検証記録。
- [性能準備の記録](records/2026-10-25/ios-empty-search-performance.md) — 2026-10-25の実施・検証記録。
- [復旧の記録](records/2026-10-25/ios-load-recovery.md) — 2026-10-25の実施・検証記録。
- [同梱記事の欠損と正常版への更新のUI回帰](records/2026-10-26/ios-missing-package-ui.md) — 2026-10-26の実施・検証記録。
- [章・難易度によるネイティブ一覧の絞り込み](records/2026-10-25/ios-category-level-filter.md) — 2026-10-25の実施・検証記録。
- [全記事の生成記録](records/2026-10-25/ios-all-article-package.md) — 2026-10-25の実施・検証記録。
- [0.2.4の実施記録](records/2026-10-25/ios-search-hit-navigation.md) — 2026-10-25の実施・検証記録。
- [照合の実施記録](records/2026-10-25/ios-reading-revision-restore.md) — 2026-10-25の実施・検証記録。
- [Hosted Simulator CI](records/2026-10-25/ios-native-ci.md) — 2026-10-25の実施・検証記録。
- [パッケージ契約](records/2026-10-25/ios-native-package-contract.md) — 2026-10-25の実施・検証記録。
- [音声offline identity契約](records/2026-10-26/ios-audio-offline-identity.md) — 2026-10-26の実施・検証記録。
- [通常1本の実MP3照合](records/2026-10-28/ios-agent-loop-audio-byte-audit.md) — 2026-10-28の実施・検証記録。
- [専用のCI追加記録](records/2026-10-25/ios-native-ui-ci.md) — 2026-10-25の実施・検証記録。
- [新runtimeの代表UI検査](records/2026-10-26/ios-runtime26-smoke.md) — 2026-10-26の実施・検証記録。
- [runtimeの照合記録](records/2026-10-25/ios-native-runtime-audit.md) — 2026-10-25の実施・検証記録。
- [自律実施記録](records/2026-10-25/ios-autonomous-progress.md) — 2026-10-25の実施・検証記録。
- [main前提の限定復旧](records/2026-10-25/ios-main-recovery.md) — 2026-10-25の実施・検証記録。
- [本文の目次移動の回復](records/2026-10-25/ios-toc-placement-recovery.md) — 2026-10-25の実施・検証記録。
- [前面の可視範囲判定](records/2026-10-25/ios-foreground-viewport-regression.md) — 2026-10-25の実施・検証記録。
- [専用テスト記事の実施記録](records/2026-10-25/ios-native-fixtures.md) — 2026-10-25の実施・検証記録。
- [実機チェック表](records/2026-10-25/ios-native-fixture-checklist.md) — 2026-10-25の実施・検証記録。
- [詳細確認の記録](records/2026-10-24/ios-native-detailed-validation.md) — 2026-10-24の実施・検証記録。
- [手動チェック表](records/2026-10-24/ios-native-manual-checklist.md) — 2026-10-24の実施・検証記録。
- [開発・起動手順](../ios/README.md) — 関連する計画・運用の入口。
- [2026-10-24の実施記録](records/2026-10-24/ios-native-reader.md) — 2026-10-24の実施・検証記録。
- [2026-10-23の実施記録](records/2026-10-23/ios-prototype.md) — 2026-10-23の実施・検証記録。
- [2026-10-24の確認記録](records/2026-10-24/ios-device-validation.md) — 2026-10-24の実施・検証記録。
- [完成版TODO](plans/engineering/ios-app-completion.md) — 関連する計画・運用の入口。
- [コミットとmainへのマージの計画](plans/engineering/ios-app-completion.md#%E3%82%B3%E3%83%9F%E3%83%83%E3%83%88%E3%81%A8main%E3%81%B8%E3%81%AE%E3%83%9E%E3%83%BC%E3%82%B8%E3%81%AE%E8%A8%88%E7%94%BB) — 関連する計画・運用の入口。
- [追記の記録](records/2026-10-25/ios-delivery-checkpoints.md) — 2026-10-25の実施・検証記録。
- [作成記録](records/2026-10-24/ios-completion-planning.md) — 2026-10-24の実施・検証記録。
- [時計由来APIのPrivacy候補](records/2026-10-26/ios-privacy-clock-reason-candidate.md) — 2026-10-26の実施・検証記録。
- [2026-10-21の実現性調査](../research/ios-app-feasibility-2026-10-21.md) — 関連する計画・運用の入口。
- [作業記録](records/2026-10-21/ios-app-feasibility.md) — 2026-10-21の実施・検証記録。
- [専用Dynamic Type UI試験の工程配分候補](records/2026-11-01/ios-dynamic-type-ui-budget.md) — 2026-11-01の実施・検証記録。

### 音声

- [Windowsの音声ロック取得の限定再試行](records/2026-11-04/windows-audio-mutex-acquire.md) — PR #350で採用された変更の根拠と検証範囲。
- [音声・CI・依存の修正](records/2026-10-03/harness-audio-issue-remediation.md) — 2026-10-03の実施・検証記録。
- [Safari の音声読み込み失敗の調査・修正](records/2026-09-13/safari-audio-fix.md) — 2026-09-13の実施・検証記録。
- [運用開始記録](records/2026-09-13/audio-learning-launch.md) — 2026-09-13の実施・検証記録。
- [制作・運用手順](../automation/audio/README.md) — 関連する計画・運用の入口。
- [音声学習機能の実装記録](records/2026-09-13/audio-learning-implementation.md) — 2026-09-13の実施・検証記録。
- [台本の共同編集者](records/2026-09-13/audio-script-authorship.md) — 2026-09-13の実施・検証記録。

### ハーネス・CI・運用

- [外部リンク監視](records/2026-11-04/external-link-monitor.md) — 週次の差分検出、取得未確認の分類、単一Issueと初回測定。
- [検索の比較評価](records/2026-11-04/library-search-evaluation.md) — 未見セットを先に固定し、本文採点の改善幅と容量・時間を評価。
- [索引の再構成](records/2026-11-04/project-index-reorganization.md) — 既存リンクの保持と手書き索引を続ける判断。
- [旧証跡の保存判断](records/2026-11-04/legacy-evidence-retention.md) — 容量・参照・例外を測り、Git内保持を選択。
- [読者向けAgent Skillsとプラグイン](records/2026-11-04/reader-agent-skills.md) — 2026-11-04の実施・検証記録。
- [ライブラリ検索MCPサーバー](records/2026-11-04/library-mcp-server.md) — 2026-11-04の実施・検証記録。
- [Linuxブラウザー依存物のEC2ミラー対応候補](records/2026-11-04/ci-playwright-ec2-mirror.md) — 2026-11-04の実施・検証記録。
- [AGENTS.md](../AGENTS.md) — 関連する計画・運用の入口。
- [CONTRIBUTING.md](../CONTRIBUTING.md) — 関連する計画・運用の入口。
- [ROADMAP.md](../ROADMAP.md) — 関連する計画・運用の入口。
- [Playwright依存取得を制限する候補](records/2026-10-27/ci-playwright-dependency-download.md) — 2026-10-27の実施・検証記録。
- [PR #242](https://github.com/pero3dev/ai-agent-library/pull/242) — 関連する計画・運用の入口。
- [PR #243](https://github.com/pero3dev/ai-agent-library/pull/243) — 関連する計画・運用の入口。
- [限定依存修正の記録](records/2026-10-25/markdown-parser-security-update.md) — 2026-10-25の実施・検証記録。
- [2026-10-08総合レビューの是正](records/2026-10-08/comprehensive-review-remediation.md) — 2026-10-08の実施・検証記録。
- [2026-10-04の実施記録](records/2026-10-04/sidebar-footer-fog.md) — 2026-10-04の実施・検証記録。
- [第3回総合レビューの全Issue解決](records/2026-10-03/third-review-resolution.md) — 2026-10-03の実施・検証記録。
- [タグ193件の判断](records/2026-10-03/tag-singleton-audit.md) — 2026-10-03の実施・検証記録。
- [公開記録の保持とパスの扱い](records/2026-10-03/public-records-retention.md) — 2026-10-03の実施・検証記録。
- [執筆履歴の移行](records/2026-10-03/roadmap-history-migration.json) — 2026-10-03の実施・検証記録。
- [根拠と全完了条件の照合](../harness/git-rules.md#issue%E3%81%AEclose%E3%81%A8%E8%A7%A3%E6%B6%88%E3%81%AE%E8%A8%BC%E6%8B%A0) — 関連する計画・運用の入口。
- [2026Q4判断メモ](plans/maintenance/2026q4-decision-memo.md) — 関連する計画・運用の入口。
- [199記事の3層試算](plans/maintenance/2026q4-tier-proposal.json) — 関連する計画・運用の入口。
- [ハーネスの修正と検証範囲](records/2026-10-03/third-review-harness-remediation.md) — 2026-10-03の実施・検証記録。
- [2026-10-03 総合レビュー Issue の解決](records/2026-10-03/issue-resolution.md) — 2026-10-03の実施・検証記録。
- [公開資産の既存ライセンス棚卸し](records/2026-10-03/license-inventory.md) — 2026-10-03の実施・検証記録。
- [公開正本による保守基準値](records/2026-10-03/maintenance-baseline.md) — 2026-10-03の実施・検証記録。
- [旧検証計画](records/2026-09-30/p1-kit-preparation/README.md) — 2026-09-30の実施・検証記録。
- [保存時の確認](records/2026-09-30/p1-kit-preparation-review.json) — 2026-09-30の実施・検証記録。
- [TypeScriptソースへの全面移行 — 作業記録](records/2026-11-04/typescript-source-migration.md) — 2026-11-04の実施・検証記録。
- [TypeScript全面移行の分類・検証結果](records/2026-11-04/typescript-source-migration.json) — 2026-11-04の実施・検証記録。
- [TypeScript 段階移行 — 実施記録](records/2026-11-03/typescript-migration-implementation.md) — 2026-11-03の実施・検証記録。
- [TypeScript段階移行の計画作成](records/2026-11-03/typescript-migration-plan.md) — 2026-11-03の実施・検証記録。
- [棚卸しJSON](records/2026-11-03/typescript-migration-inventory.json) — 2026-11-03の実施・検証記録。
- [推論図の表示間隔修正](records/2026-09-30/inference-score-spacing-fix.md) — 2026-09-30の実施・検証記録。
- [残り7記事の具体案](records/2026-09-30/p1-interface-preparation/README.md) — 2026-09-30の実施・検証記録。
- [自己注意の読書連動図解](records/2026-09-24/self-attention-reader.md) — 2026-09-24の実施・検証記録。
- [LLM 内部構造の数式表示修正](records/2026-09-23/llm-internals-ui-fix.md) — 2026-09-23の実施・検証記録。
- [PR #50](https://github.com/pero3dev/ai-agent-library/pull/50) — 関連する計画・運用の入口。
- [PR #48](https://github.com/pero3dev/ai-agent-library/pull/48) — 関連する計画・運用の入口。
- [iPhone 幅でのモバイルメニュー表示修正](records/2026-09-13/mobile-menu-fix.md) — 2026-09-13の実施・検証記録。
- [セキュリティレビューへの対応](records/2026-09-12/security-remediation.md) — 2026-09-12の実施・検証記録。
- [Git操作の規約整備](records/2026-09-12/git-conventions.md) — 2026-09-12の実施・検証記録。
- [Git共通規約](../harness/git-rules.md) — 関連する計画・運用の入口。
- [プロジェクト構造整理の実施記録](records/2026-09-11/structure-cleanup.md) — 2026-09-11の実施・検証記録。
- [配置・棚卸し手順](../CONTRIBUTING.md#%E9%85%8D%E7%BD%AE%E3%81%AE%E7%B6%AD%E6%8C%81) — 関連する計画・運用の入口。
- [コントリビューションガイド](../CONTRIBUTING.md#%E3%83%8F%E3%83%BC%E3%83%8D%E3%82%B9%E3%82%92%E5%A4%89%E6%9B%B4%E3%81%99%E3%82%8B%E3%81%A8%E3%81%8D) — 関連する計画・運用の入口。

## 構造・運用の計画

以下は採択・実施時点の状態です。完了した計画も移動せず、実施記録と現行の入口を辿ります。

| 計画 | 状態・適用時点 | 実施記録・現行の入口 |
| --- | --- | --- |
| TypeScriptソースへの全面移行 | 2026-11-04、自前JS実装と埋め込みNode実装をTSへ移行。実装・ローカル検証完了、提出後のCI・公開確認は対応PRの最終証跡で照合 | [実施記録](records/2026-11-04/typescript-source-migration.md)、[TypeScript全面移行の分類・検証結果](records/2026-11-04/typescript-source-migration.json) |
| [TypeScript 段階移行](plans/engineering/typescript-migration.md) | 2026-11-03計画採択、P0〜P6の型検査と互換入口を実装。計画本文は作成時点の提案を保持、外部確認は対応PRの最終証跡で照合 | [実施記録](records/2026-11-03/typescript-migration-implementation.md)、[TypeScript段階移行の計画作成](records/2026-11-03/typescript-migration-plan.md)、[棚卸しJSON](records/2026-11-03/typescript-migration-inventory.json)、[TypeScript段階移行の一次資料調査](../research/typescript-migration-2026-11-03.md) |
| R1-01 本文を主役にする三列 | 2026-10-03、main `d990973`へ反映。対応deployment `6823843847`のsuccessと公開先URLを実APIで確認 | [サンプル・公開の実施記録](records/2026-10-03/r1-01-layout-preview.md) |
| [動的図解のバックアップと機能削除](plans/engineering/dynamic-diagram-removal-and-recovery.md) | 2026-10-03、復元確認後にmain `42dcee2`へ反映。対応deployment `6822376321`のsuccessを実APIで確認 | [実施記録](records/2026-10-03/dynamic-diagram-removal.md) |
| [動的図解の全記事展開](plans/engineering/dynamic-diagrams.md) | 2026-10-03展開停止。保存後の制作記録は履歴として保持 | [展開状況](records/2026-09-24/dynamic-diagram-rollout.md)。関連制作記録はサイト欄を参照 |
| 自己注意の読書連動図解 | 2026-09-24実装・公開後、2026-10-03の機能削除対象へ移行。保存時の記録 | [実施記録](records/2026-09-24/self-attention-reader.md) |
| LLM 内部構造の数式表示修正 | 2026-09-23 数式・狭幅・強調表示を修正し、ローカル検証完了。公開状況はPRを参照 | [実施記録](records/2026-09-23/llm-internals-ui-fix.md)、[PR #50](https://github.com/pero3dev/ai-agent-library/pull/50) |
| GitHub 紹介ページの改善 | 2026-09-20 README・画像の独立レビューと PR 検証済み。共有画像の登録は認証待ち | [実施記録](records/2026-09-20/github-showcase.md)、[PR #48](https://github.com/pero3dev/ai-agent-library/pull/48) |
| Safari の音声読み込み失敗 | 2026-09-13 形式指定・再試行処理を修正。Windows と macOS WebKit の試験を通過。公開状況は [PR #45](https://github.com/pero3dev/ai-agent-library/pull/45)を参照 | [実施記録](records/2026-09-13/safari-audio-fix.md) |
| iPhone 幅のモバイルメニュー表示修正 | 2026-09-13 修正・ローカル検証完了。マージ状況は [PR #41](https://github.com/pero3dev/ai-agent-library/pull/41) を参照 | [実施記録](records/2026-09-13/mobile-menu-fix.md) |
| [音声学習機能](plans/engineering/audio-learning.md) | 2026-09-13 公開・定期運用開始。初回2記事を公開し、残りを順次制作 | [運用開始記録](records/2026-09-13/audio-learning-launch.md)、[制作・運用手順](../automation/audio/README.md)、[音声学習機能の実装記録](records/2026-09-13/audio-learning-implementation.md)、[台本の共同編集者](records/2026-09-13/audio-script-authorship.md) |
| セキュリティレビューへの対応 | 2026-09-12 SEC-01〜07 の修正反映済み。導入後の受入は実施記録を参照 | [実施記録](records/2026-09-12/security-remediation.md) |
| Git操作の規約整備 | 2026-09-12 G1〜G4 の実装・受入完了 | [実施記録](records/2026-09-12/git-conventions.md)、[Git共通規約](../harness/git-rules.md) |
| [プロジェクト構造の整理](plans/engineering/structure-cleanup.md) | 2026-09-11 S0〜S5完了 | [実施記録](records/2026-09-11/structure-cleanup.md)、[配置・棚卸し手順](../CONTRIBUTING.md#配置の維持) |
| [サイト構築](plans/engineering/website.md) | 2026-07-07 全フェーズ完了 | [サイトの開発手順](../website/README.md) |
| [記事の定期最新化](plans/engineering/freshness-automation.md) | 2026-09-10 導入完了 | [導入記録](records/2026-09-10/freshness-automation-setup.md)、[現行運用](../freshness-automation.md) |
| [ハーネス整備](plans/engineering/harness-improvement.md) | 2026-09-10 H0〜H6 の実装・受入完了 | [実施記録・実行面ごとの制約](records/2026-09-10/harness-acceptance.md)、[現行手順](../CONTRIBUTING.md#ハーネスを変更するとき) |
| [2026Q3 メンテナンス](plans/maintenance/2026q3.md) | 2026-08-18 計画、2026-09-10 に全 16 系統の差分反映を完了 | [更新記録](records/2026-09-10/freshness-update.md)、[以後の定点観測](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続) |

## 完了した記事拡張計画

22 計画と、そのうち後続の拡張を横断した [実施順の記録](plans/content/priority-map.md) を保持します。各フェーズの成果物・完了状態は [執筆履歴](plans/content/roadmap-history.md#フェーズ別タスク分割作業依頼単位) で確認できます。以後の記事保守は[ROADMAPの定点観測](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続)と [research の調査記録](../research/README.md) に接続します。

| 計画 | 対応フェーズ | 完了日 |
| --- | --- | --- |
| [コーディングエージェント章](plans/content/coding-agents.md) | A・B | 2026-07-06 |
| [プロフェッショナル化拡張](plans/content/expansion.md) | D〜I | 2026-07-07 |
| [周辺・基礎領域](plans/content/supplementary.md) | J〜L | 2026-07-07 |
| [プロンプト・コンテキスト・ハーネス・ループ詳解](plans/content/deep-dive.md) | M〜O | 2026-07-08 |
| [モデル特化プロンプティング](plans/content/model-prompting.md) | BA | 2026-07-08 |
| [データ・知識基盤](plans/content/data-knowledge.md) | AD・AE | 2026-07-08 |
| [評価・品質](plans/content/eval-quality.md) | AK・AL | 2026-07-08 |
| [信頼性エンジニアリング](plans/content/reliability.md) | AX | 2026-07-08 |
| [基礎・理論の拡張](plans/content/foundations-extension.md) | AQ・AR | 2026-07-08 |
| [SE 向けコーディングエージェント活用](plans/content/se-coding-agents.md) | V・X | 2026-07-08 |
| [モデル運用・インフラ](plans/content/llmops.md) | AF・AG | 2026-07-08 |
| [マルチモーダル応用](plans/content/multimodal.md) | Y・Z | 2026-07-08 |
| [セキュリティ・信頼・法務](plans/content/trust-security.md) | AH〜AJ | 2026-07-08 |
| [ドメイン別エージェント](plans/content/domain-agents.md) | AA〜AC | 2026-07-09 |
| [ケーススタディとサンプル](plans/content/cases-examples.md) | AU・AV | 2026-07-09 |
| [UX・プロダクト](plans/content/ux-product.md) | AM・AN | 2026-07-09 |
| [組織・プロセス](plans/content/org-process.md) | AO・AP | 2026-07-09 |
| [エージェント基盤](plans/content/agent-infra.md) | AY | 2026-07-09 |
| [AI 戦略・調達・持続性](plans/content/ai-strategy.md) | AZ | 2026-07-09 |
| [LLM 内部構造](plans/content/llm-internals.md) | S〜U | 2026-07-09 |
| [人と AI の協働](plans/content/human-ai.md) | AW | 2026-07-09 |
| [業界・エコシステム](plans/content/ecosystem.md) | AS・AT | 2026-07-10 |

## 2026-09-10 の監査・修正・導入記録

| 記録 | 読み方・後続との関係 |
| --- | --- |
| [プロジェクトレビュー](records/2026-09-10/review.md) | レビュー時点の指摘と失敗を保持。修正結果は次の記録で追跡 |
| [レビュー指摘の修正](records/2026-09-10/review-remediation.md) | 指摘の対応、追加論点、検証範囲 |
| [鮮度監査](records/2026-09-10/freshness-audit.md) | 一次資料の観測と、更新前に特定した 107 件 |
| [鮮度更新の実施](records/2026-09-10/freshness-update.md) | 107 件の適用結果と未検証範囲。監査 JSON の当時の状態は上書きしない |
| [定期最新化の導入](records/2026-09-10/freshness-automation-setup.md) | PR #11・#12 時点の構成と受入。以後の変更はハーネス実施記録を参照 |
| [ハーネス整備の受入](records/2026-09-10/harness-acceptance.md) | H0〜H6、必須 9 チェック、実 Agent・定期起動・公開の証拠と制約 |
| [サンプル監査出力](records/2026-09-10/evidence/examples-audit.json)、[サイト監査出力](records/2026-09-10/evidence/website-audit.txt) | レビュー時に取得した生出力。取得後のパスや結果へ書き換えない |

## 追加するときの配置

新しい計画は`plans/content/`・`plans/maintenance/`・`plans/engineering/`、実施記録は`records/YYYY-MM-DD/`に置きます。出典・主張・取得時刻は[research](../research/README.md)、学習記事は`docs/`を正本とします。

新しい記録は該当領域へ1〜2文とリンクを追加します。進行中の作業が完了したら状態を更新し、詳細な履歴や試験ログを索引へ積み上げません。
