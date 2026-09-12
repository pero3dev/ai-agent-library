# research — 調査と観測の記録

記事の根拠となる一次資料、確認日、主張の範囲、変更を適用した結果を保存します。記事は [docs/](../docs/)、プロジェクトの採択計画と実施履歴は [project/](../project/README.md)、観測する系統の正本は [ROADMAP の定期メンテナンス](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続) です。

各メモは、記載した確認日・出典・対象範囲の記録です。メモの存在だけで、記事全体やすべての外部仕様を検証済みとは扱いません。学習記事の固定 H2 テンプレートは適用せず、[調査記録の規約](../harness/writing-rules.md#調査記録と運用文書) に従います。

## 継続して参照する調査メモ

| 領域 | 主な内容・入口 |
| --- | --- |
| [coding-agents/](coding-agents/README.md) | ツール別の公式仕様、実践、料金・データ取り扱いの索引 |
| [models/](models/README.md) | モデル・API の提供条件、終了予定、互換性 |
| [prompting/](prompting/) | Anthropic・OpenAI・Google のモデル別プロンプティング |
| [professional/](professional/) | ベンチマーク、認証、耐久実行、音声、FT、規制の調査 |
| [supplementary/](supplementary/) | 業界別規制とフィジカル AI |
| [se/](se/) | 企業向けコーディングエージェントの提供条件 |
| [llmops/](llmops/) | モデル配信・推論基盤 |
| [multimodal/](multimodal/) | 画像・動画生成とリアルタイム音声 |
| [domain-agents/](domain-agents/) | RPA と先端応用。実証と構想を分けるための調査 |
| [trust/](trust/) | 著作権、フロンティア安全性、来歴 |
| [infra/](infra/) | エージェント間プロトコル |
| [strategy/](strategy/) | 地政学・環境開示の確認先 |
| [internals/](internals/) | 解釈可能性の研究・提供状況 |
| [ecosystem/](ecosystem/) | 業界・OSS・規格認証 |

## 日付付きの監査と適用結果

| 記録 | 用途 |
| --- | --- |
| [音声学習機能の実現性](audio-learning-feasibility-2026-09-13.md) | 2026-09-13 の公式資料・初期判断と、実生成・Releases配信・Chrome再生の後続確認。iPhone実機受入は未実施 |
| [参考資料の対応索引](review-sources-index-2026-09-10.md) | 2026-09-10 のレビュー S02。記事別の根拠追加・限定条件の修正への入口 |
| [TODO の分類と確認条件](review-maintenance-2026-09-10.md)、[棚卸し JSON](review-todo-inventory-2026-09-10.json) | 最新化前の 186 件・121 記事を分類した履歴。後続の完了状態とは区別 |
| [鮮度監査 JSON](freshness-audit-data-2026-09-10.json) | 2026-09-10 の監査時に特定した 107 件。`identified_not_applied` は当時の状態 |
| 適用台帳: [基盤](freshness-implementation-core-2026-09-10.json)、[コーディング](freshness-implementation-coding-2026-09-10.json)、[ガバナンス](freshness-implementation-governance-2026-09-10.json)、[戦略](freshness-implementation-strategy-2026-09-10.json)、[依存](freshness-implementation-dependencies-2026-09-10.json) | 監査の ID ごとに変更先・適用結果・確認した条件を追跡 |

監査と適用結果の関係は [鮮度更新の実施記録](../project/records/2026-09-10/freshness-update.md) で確認できます。過去の JSON や生ログに含まれるパス・digest・当時の判定は更新しません。後続の結果は別の記録へ追加し、取得時点と適用時点を区別します。

## 定期最新化のレビュー根拠

[freshness-runs/](freshness-runs/) は、記事の差分、出典、主張、独立レビューを結び付ける機械可読の根拠記録です。配置・形式・digest は policy の契約に従います。ローカルの作業 run 状態や会話全文を保存する場所ではありません。

運用は [freshness-automation.md](../freshness-automation.md) と [freshness-maintenance スキル](../.agents/skills/freshness-maintenance/SKILL.md) を参照してください。根拠の変更後に以前のレビュー判定を再利用しません。
