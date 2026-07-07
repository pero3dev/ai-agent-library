# 05-operations — 運用・監視

Agent システムを本番で動かし続けるための実務を扱うセクションです。

- **置くもの**: 可観測性、コスト管理、デプロイ(段階的リリース・ロールバック)、バージョニング、インシデント対応、モデル更新への追従
- **置かないもの**: 開発時の評価設計(→ 04-evaluation)、セキュリティ脅威対応(→ 06-security)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [observability-and-tracing.md](observability-and-tracing.md) | 可観測性とトレーシング(何をログ・トレースすべきか) |
| [cost-management.md](cost-management.md) | コスト管理(トークン・キャッシュ・モデル使い分け) |
| [latency-optimization.md](latency-optimization.md) | レイテンシ最適化 |
| [versioning-and-model-updates.md](versioning-and-model-updates.md) | プロンプト/モデルのバージョニング・デプロイ(段階的リリース・ロールバック)・モデル更新追従 |
| [incident-response.md](incident-response.md) | インシデント対応(暴走・コスト急騰・品質劣化時の停止と復旧手順) |
| [deployment-and-scaling.md](deployment-and-scaling.md) | デプロイとスケーリング(実行形態・状態外部化・レート制限前提の容量設計・多重化) |
| [feedback-loops.md](feedback-loops.md) | フィードバックループの運用(シグナル設計・収集・評価への還流・運用サイクル) |
| [conversation-data-management.md](conversation-data-management.md) | 会話データの管理基盤(収集・マスキング・保持と削除・活用・アクセス統制) |
