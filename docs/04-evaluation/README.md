# 04-evaluation — 評価・テスト

Agent の品質をどう測り、どう継続的に保証するかを扱うセクションです。「作ったが品質が分からない」状態を防ぐことを目的とします。

- **置くもの**: 評価設計、メトリクス定義、テスト戦略、評価ハーネスの作り方
- **置かないもの**: 本番環境の監視(→ 05-operations。ただし評価と監視の接続は本セクションで扱う)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [agent-evaluation-basics.md](agent-evaluation-basics.md) | Agent 評価の基礎(何を・いつ・どう測るか) |
| [llm-as-a-judge.md](llm-as-a-judge.md) | LLM-as-a-Judge(設計・バイアス・検証) |
| [trajectory-evaluation.md](trajectory-evaluation.md) | 軌跡(trajectory)評価 — 最終出力だけでなく過程を評価する |
| [regression-testing.md](regression-testing.md) | 回帰テストと CI への組み込み |
| [evaluation-datasets.md](evaluation-datasets.md) | 評価データセットの構築と保守(収集・合成・アノテーション・ゴールデンセット) |
| [online-evaluation-and-ab-testing.md](online-evaluation-and-ab-testing.md) | オンライン評価と A/B テスト(本番シグナル・カナリア・自動ロールバック・落とし穴) |
| [agent-benchmarks-landscape.md](agent-benchmarks-landscape.md) | エージェントベンチマークの全体像(カテゴリ別の地図とスコアの読み方・鮮度管理型) |
| [evaluation-environments.md](evaluation-environments.md) | エージェント評価環境の構築(モック・状態付きサンドボックス・状態リセット・CI 統合・失敗の再現環境化) |
| [user-simulator-design.md](user-simulator-design.md) | ユーザーシミュレータの設計(ペルソナ・目標・暴走抑制・シナリオ生成・シミュレータ品質の検証) |
| [confidence-and-calibration.md](confidence-and-calibration.md) | 信頼度と較正(信頼度の取り出し・較正の測定・選択的予測・閾値設計・再較正) |
| [fairness-and-bias-evaluation.md](fairness-and-bias-evaluation.md) | 公平性・バイアスの評価(バイアスの類型・対照ペアテスト・層別評価・対応と限界) |
| [japanese-quality-evaluation.md](japanese-quality-evaluation.md) | 日本語品質の評価(敬語・文体一貫性・表記・judge の日本語能力検証・自動チェックとの分担) |
