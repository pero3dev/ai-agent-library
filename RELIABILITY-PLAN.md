# RELIABILITY-PLAN — AI 信頼性エンジニアリング 追加計画

> **ステータス: 完了(2026-07-07 作成。2026-07-08 に Phase AX を完了 = ai-slo-design / chaos-engineering-for-ai / long-running-agents の 3 本 published)。**
> 運用の残りギャップ — 品質の SLO 化・カオスエンジニアリング・常駐エージェントのライフサイクル — を SRE の語彙で埋める追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存の 05-operations は観測・コスト・デプロイ・インシデントを整備済みですが、SRE 実践の中核である **SLO(目標の宣言と運用)** と **プロアクティブな回復力検証(カオス工学)**、そして**長期間動き続ける個体の管理**が未カバーです。

| # | ギャップ | 既存の最近接(正本のまま) |
| --- | --- | --- |
| 1 | 品質・信頼性を SLO として宣言・計測・運用する方法論 | observability(計測)・online-evaluation(品質シグナル)・incident-response(発火後) |
| 2 | 障害・劣化を意図的に注入して回復力を検証する演習 | red-teaming(セキュリティ演習)・error-handling(個別の備え) |
| 3 | 数週間〜数か月動く常駐エージェントの劣化・世代交代 | async-and-durable(実行の永続化)・long-term-memory(記憶の忘却) |

## 2. 追加トピック一覧(3 本、すべて 05-operations)

| # | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- |
| 1 | `ai-slo-design.md` | AI 品質の SLO 設計 | advanced | 安定 |
| 2 | `chaos-engineering-for-ai.md` | AI システムのカオスエンジニアリング | advanced | 安定 |
| 3 | `long-running-agents.md` | 常駐エージェントのライフサイクル管理 | advanced | 中 |

## 3. 各ページの設計

### ai-slo-design.md — AI 品質の SLO 設計

- **目的**: 「品質はなんとなく監視している」から「目標を宣言し、予算で管理する」へ — 非決定的なシステムの SLO/SLI を設計できる
- **主要トピック**: AI の SLI 候補(タスク成功率・回答品質のサンプリング判定合格率・幻覚率・エスカレーション率・レイテンシ/コストの複合)と測定の信頼性(judge ベース SLI の較正 — llm-as-a-judge 前提)/ SLO の水準設定(ベースライン → 現実的な目標。100% を狙わない設計)/ エラーバジェットの運用(品質バジェットを使い切ったら変更凍結・改善優先という判断の型)/ 対外 SLA への昇格(何を約束できて何を約束できないか — agent-api-design の契約面と接続)/ モデル更新・プロンプト変更と SLO の関係(versioning 接続)
- **分担**: 計測基盤 = observability、品質シグナル = online-evaluation(いずれも正本)。本記事は「目標と予算の運用」

### chaos-engineering-for-ai.md — AI システムのカオスエンジニアリング

- **目的**: 「フォールバックが本当に動くか」を本番相当環境で意図的に検証する演習を設計・運用できる
- **主要トピック**: AI 固有の注入対象(プロバイダー障害・レート制限・レイテンシ急増 / モデルの劣化応答・拒否・形式崩れ / ツール障害・タイムアウト / 検索の空振り・知識源の欠落)/ 仮説駆動の演習設計(「X が落ちても Y が守られる」を仮説にする — red-teaming の演習運営と同型)/ 実施環境の選択(評価環境(EVAL 計画の evaluation-environments を再利用)→ ステージング → 本番の限定実験)/ 定常化(ゲームデー・自動注入)/ 発見の還流(error-handling・incident-response の手順改善へ)
- **分担**: 攻撃の演習 = red-teaming-agents(セキュリティ)、個別のリトライ設計 = error-handling-and-retries(正本)。本記事は信頼性の検証演習

### long-running-agents.md — 常駐エージェントのライフサイクル管理

- **目的**: 数週間〜数か月単位で動き続けるエージェント(常駐アシスタント・監視エージェント・継続タスク)の劣化と世代交代を運用できる
- **主要トピック**: 長期運用で起きる劣化の類型(記憶・コンテキストの肥大と汚染 / 蓄積した設定・指示の矛盾(呪文の地層の実行時版)/ 外部環境とのずれ(ツール・データの変化)/ 品質の緩やかなドリフト)/ 定期メンテナンスの設計(記憶の棚卸し・仕切り直し・ヘルスチェック)/ 世代交代(新個体への引き継ぎ — 何を移し何を捨てるか・並行稼働での検証)/ 個体差の管理(同じ設定でも履歴で挙動が分かれる問題)/ 退役の設計
- **分担**: 実行の永続化 = async-and-durable-agents、記憶の忘却 = long-term-memory-implementation、圧縮 = DEEP-DIVE 計画の compaction(採用時)。本記事はライフサイクル全体の運用

## 4. スコープ外(検討のうえ除外)

- **SRE 一般論の教材化**(SLO・カオス工学の一般理論): AI 固有の面に限定し、一般論は外部の確立した文献に委ねる
- **特定のカオス注入ツールの解説**: 演習の設計まで
- **HA 構成・マルチリージョンの一般インフラ設計**: deployment-and-scaling の範囲を超えるものは扱わない

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AX** を使います(AW は [HUMAN-AI-PLAN.md](HUMAN-AI-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AX-1 | SLO 設計 + カオスエンジニアリング | `ai-slo-design.md`, `chaos-engineering-for-ai.md` | 調査不要 |
| AX-2 | 常駐エージェントのライフサイクル | `long-running-agents.md` | 調査不要 |
| AX-R | Phase AX レビュー(observability / online-evaluation / incident-response / error-handling からの逆リンク・published 化・同期一式) | — | — |

完了時の規模: **92 → 95 本**(05: 8 → 11)。

## 6. 執筆前調査

**なし**(3 本とも方法論であり原則安定。SRE の一般概念は確立領域)。

## 7. 同期・派生作業

- **GLOSSARY 候補**: SLO(Service Level Objective)、エラーバジェット(error budget)、カオスエンジニアリング(chaos engineering)、ドリフト(drift)
- **逆リンク**: observability-and-tracing → ai-slo-design、online-evaluation-and-ab-testing → ai-slo-design(ガードレールメトリクスの目標化)、incident-response → chaos-engineering(演習との対)、error-handling-and-retries → chaos-engineering、deployment-and-scaling → chaos-engineering(フォールバック検証)、async-and-durable-agents / long-term-memory-implementation → long-running-agents
- **他計画との接続**: EVAL-QUALITY の evaluation-environments(注入演習の実行環境)、agent-api-design(SLA 面)
- **learning-roadmap / website**: 構造変更なし

## 8. 未確定事項(着手時に確認)

1. **3 本の粒度**: 縮小案は 2 本(#3 を async-durable と long-term-memory の増補に分割吸収)。SRE 文脈のまとまりを重視するなら 3 本を推奨
2. **ai-slo-design の位置**: 推奨は 05。評価色を強めるなら 04 も可(online-evaluation の隣)

## 9. TODO

> **TODO(要確認):** judge ベースの SLI を扱う際、判定コスト・判定器の較正という前提条件を llm-as-a-judge と整合させる(執筆時のレビュー観点に含める)(最終確認: 2026-07)
