# project — 計画と実施記録

記事拡張、サイト、定期最新化、ハーネスの採択計画と実施記録をまとめます。作業の共通契約は [AGENTS.md](../AGENTS.md)、検証手順は [CONTRIBUTING.md](../CONTRIBUTING.md)、記事タスクと定点観測の正本は [ROADMAP.md](../ROADMAP.md) です。

計画本文の「現状」「未着手」「追加予定」は、各計画の作成・採択時点を表します。実施結果は後継記録で確認してください。計画の終了に合わせてファイルを移し直さず、状態と適用時点をこの索引で案内します。記事の公開状態は各記事の front matter が正本です。

## 構造・運用の計画

| 計画 | 状態・適用時点 | 実施記録・現行の入口 |
| --- | --- | --- |
| Git操作の規約整備 | 2026-09-12 実施中 | [実施記録](records/2026-09-12/git-conventions.md)、[Git共通規約](../harness/git-rules.md) |
| [プロジェクト構造の整理](plans/engineering/structure-cleanup.md) | 2026-09-11 S0〜S5完了 | [実施記録](records/2026-09-11/structure-cleanup.md)、[配置・棚卸し手順](../CONTRIBUTING.md#配置の維持) |
| [サイト構築](plans/engineering/website.md) | 2026-07-07 全フェーズ完了 | [サイトの開発手順](../website/README.md) |
| [記事の定期最新化](plans/engineering/freshness-automation.md) | 2026-09-10 導入完了 | [導入記録](records/2026-09-10/freshness-automation-setup.md)、[現行運用](../freshness-automation.md) |
| [ハーネス整備](plans/engineering/harness-improvement.md) | 2026-09-10 H0〜H6 の実装・受入完了 | [実施記録・実行面ごとの制約](records/2026-09-10/harness-acceptance.md)、[現行手順](../CONTRIBUTING.md#ハーネスを変更するとき) |
| [2026Q3 メンテナンス](plans/maintenance/2026q3.md) | 2026-08-18 計画、2026-09-10 に全 16 系統の差分反映を完了 | [更新記録](records/2026-09-10/freshness-update.md)、[以後の定点観測](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続) |

## 完了した記事拡張計画

22 計画と、そのうち後続の拡張を横断した [実施順の記録](plans/content/priority-map.md) を保持します。各フェーズの成果物・完了状態は [ROADMAP.md](../ROADMAP.md#フェーズ別タスク分割claude-への依頼単位) で確認できます。以後の記事保守は定点観測と [research の調査記録](../research/README.md) に接続します。

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
