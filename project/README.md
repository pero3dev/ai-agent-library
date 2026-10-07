# project — 計画と実施記録

記事拡張、サイト、定期最新化、ハーネスの採択計画と実施記録をまとめます。作業の共通契約は [AGENTS.md](../AGENTS.md)、検証手順は [CONTRIBUTING.md](../CONTRIBUTING.md)、記事タスクと定点観測の正本は [ROADMAP.md](../ROADMAP.md) です。

計画本文の「現状」「未着手」「追加予定」は、各計画の作成・採択時点を表します。実施結果は後継記録で確認してください。計画の終了に合わせてファイルを移し直さず、状態と適用時点をこの索引で案内します。記事の公開状態は各記事の front matter が正本です。

## 構造・運用の計画

鮮度監視 Issue #220 は[2026-10-08の再開記録](records/2026-10-08/freshness-monitor-recovery.md)で、部分観測・未確認範囲・記事PR・依存監査による公開待ちを追跡します。宣言範囲の完了記録やScheduled起動の確認と区別します。

サイドバー下部にも背景の霧を透かす Issue #218 は[2026-10-04の実施記録](records/2026-10-04/sidebar-footer-fog.md)で、開閉・スクロール・両テーマの画面証拠と修正・公開の結果を追跡します。

サイト背景の霧とダークテーマの装飾色の Issue #215・#216 は[2026-10-04の実施記録](records/2026-10-04/site-fog-and-dark-callouts.md)で、実装・画面・検証・公開の証拠を追跡します。

第3回総合レビューの全43Issueは[解決記録](records/2026-10-03/third-review-resolution.md)で追跡します。[記事の修正](records/2026-10-03/third-review-article-remediation.md)、[サイトの修正](records/2026-10-03/third-review-website-remediation.md)、[前提知識55件の判断](records/2026-10-03/prerequisite-level-audit.md)、[タグ193件の判断](records/2026-10-03/tag-singleton-audit.md)、[公開記録の保持とパスの扱い](records/2026-10-03/public-records-retention.md)、[執筆履歴の移行](records/2026-10-03/roadmap-history-migration.json)から担当範囲と証拠を確認できます。IssueのCloseは[根拠と全完了条件の照合](../harness/git-rules.md#issueのcloseと解消の証拠)を満たしてから行います。

憲章・鮮度ティア・実行環境・計測の選択肢は[2026Q4判断メモ](plans/maintenance/2026q4-decision-memo.md)と[199記事の3層試算](plans/maintenance/2026q4-tier-proposal.json)にまとめました。提案であり、運用を変更した記録ではありません。

Git契約・単体試験・期限検出・週次監視は[ハーネスの修正と検証範囲](records/2026-10-03/third-review-harness-remediation.md)で追跡します。本文の訂正と一次資料の実取得は[今回の調査](../research/reviews/2026-10-03-article-remediation.md)に記録しています。

2026-10-03の総合レビューIssueを解決する作業は[実施記録](records/2026-10-03/issue-resolution.md)で追跡する。[公開資産の既存ライセンス棚卸し](records/2026-10-03/license-inventory.md)、[Pages診断・復旧の現行手順](../website/operations.md)、[公開正本による保守基準値](records/2026-10-03/maintenance-baseline.md)を作成し、記事・サイト・音声排他・依存を修正する。完了は各記録とPR/CI/公開証拠で確認する。

担当別の変更と検証範囲は[記事の修正](records/2026-10-03/article-issue-remediation.md)、[サイトの修正](records/2026-10-03/website-issue-remediation.md)、[音声・CI・依存の修正](records/2026-10-03/harness-audio-issue-remediation.md)に記録する。

動的図解の全記事展開は停止し、全ソース・未提出状態・保存時の表示をバックアップして機能削除へ移行した。[実施記録](records/2026-10-03/dynamic-diagram-removal.md)に保存先・復元確認・削除と公開の結果を記載する。本文・既存Mermaid・数式を保持する。

E1〜F2の[旧検証計画](records/2026-09-30/p1-kit-preparation/README.md)と[保存時の確認](records/2026-09-30/p1-kit-preparation-review.json)は経緯として残す。旧計画の全手順を今後の作業へ再適用しない。

| 計画 | 状態・適用時点 | 実施記録・現行の入口 |
| --- | --- | --- |
| R1-01 本文を主役にする三列 | 2026-10-03、main `d990973`へ反映。対応deployment `6823843847`のsuccessと公開先URLを実APIで確認 | [サンプル・公開の実施記録](records/2026-10-03/r1-01-layout-preview.md) |
| [動的図解のバックアップと機能削除](plans/engineering/dynamic-diagram-removal-and-recovery.md) | 2026-10-03、復元確認後にmain `42dcee2`へ反映。対応deployment `6822376321`のsuccessを実APIで確認 | [実施記録](records/2026-10-03/dynamic-diagram-removal.md) |
| [動的図解の全記事展開](plans/engineering/dynamic-diagrams.md) | 2026-10-03展開停止。削除前の4保存点を私有バックアップへ保存。旧計画・制作記録は経緯 | [展開状況](records/2026-09-24/dynamic-diagram-rollout.md)、[P0実施記録](records/2026-09-24/reading-diagram-foundation.md)、[Transformer制作](records/2026-09-24/transformer-reading-diagrams.md)、[注意変種制作](records/2026-09-24/attention-variants-reading-diagrams.md)、[MoE制作](records/2026-09-24/moe-reading-diagrams.md)、[文章生成・トークン化](records/2026-09-24/generation-tokenization-reading-diagrams.md)、[推論内部](records/2026-09-24/inference-reading-diagrams.md)、[学習パイプラインの制作](records/2026-09-24/training-reading-diagrams.md)、[事前学習の制作](records/2026-09-25/pretraining-reading-diagrams.md)、[推論図の表示間隔修正](records/2026-09-30/inference-score-spacing-fix.md)、[D1アラインメント制作](records/2026-09-30/alignment-reading-diagrams.md)、[D2推論モデル制作](records/2026-09-30/reasoning-reading-diagrams.md)、[残り7記事の具体案](records/2026-09-30/p1-interface-preparation/README.md)、[記事別棚卸し](plans/engineering/dynamic-diagram-inventory.md)、[計画作成記録](records/2026-09-24/dynamic-diagram-plan.md) |
| 自己注意の読書連動図解 | 2026-09-24実装・公開後、2026-10-03の機能削除対象へ移行。保存時の記録 | [実施記録](records/2026-09-24/self-attention-reader.md) |
| LLM 内部構造の数式表示修正 | 2026-09-23 数式・狭幅・強調表示を修正し、ローカル検証完了。公開状況はPRを参照 | [実施記録](records/2026-09-23/llm-internals-ui-fix.md)、[PR #50](https://github.com/pero3dev/ai-agent-library/pull/50) |
| GitHub 紹介ページの改善 | 2026-09-20 README・画像の独立レビューと PR 検証済み。共有画像の登録は認証待ち | [実施記録](records/2026-09-20/github-showcase.md)、[PR #48](https://github.com/pero3dev/ai-agent-library/pull/48) |
| Safari の音声読み込み失敗 | 2026-09-13 形式指定・再試行処理を修正。Windows と macOS WebKit の試験を通過。公開状況は [PR #45](https://github.com/pero3dev/ai-agent-library/pull/45)を参照 | [実施記録](records/2026-09-13/safari-audio-fix.md) |
| iPhone 幅のモバイルメニュー表示修正 | 2026-09-13 修正・ローカル検証完了。マージ状況は [PR #41](https://github.com/pero3dev/ai-agent-library/pull/41) を参照 | [実施記録](records/2026-09-13/mobile-menu-fix.md) |
| [音声学習機能](plans/engineering/audio-learning.md) | 2026-09-13 公開・定期運用開始。初回2記事を公開し、残りを順次制作 | [運用開始記録](records/2026-09-13/audio-learning-launch.md)、[制作・運用手順](../automation/audio/README.md)、[実装記録](records/2026-09-13/audio-learning-implementation.md)、[台本の共同編集者](records/2026-09-13/audio-script-authorship.md) |
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

新しい計画は `plans/content/`・`plans/maintenance/`・`plans/engineering/`、実施記録は `records/YYYY-MM-DD/` に用途を表す英語ケバブケースで置きます。外部資料の出典・主張・取得時刻・適用台帳は [research/](../research/README.md) に置き、記事テンプレートは使いません。新しい計画・記録はこの索引から辿れるようにします。ルートの README へ計画ファイルの長い列挙を戻しません。
