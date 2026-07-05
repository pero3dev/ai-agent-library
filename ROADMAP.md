# ROADMAP — 執筆計画とタスク分割

このファイルは、ライブラリの執筆計画・優先トピック・Claude への作業依頼単位を管理します。
ドキュメントを追加・完成させたら、このファイルのタスクステータスを同じセッション内で更新してください。

ステータス凡例: `未着手` / `執筆中` / `レビュー待ち` / `完了`
(ファイル単位のステータスとの対応関係は [CLAUDE.md](CLAUDE.md) の「ステータス管理」を参照。ファイル単位の正本は各ドキュメントの front matter `status` です)

## 執筆の原則

- 1 セッション(1 回の作業依頼)で新規作成するのは **1〜3 ファイル** まで
- **実行順はこのフェーズ別タスク分割が唯一の正** です(下の「最重要トピック 10 選」は順序の指定ではありません)
- 各フェーズの最後にレビュータスク(X-R)を置く。**Phase N+1 のコンテンツ執筆を始める前に、Phase N の X-R を完了させる**(概念 → 設計 → 実装の依存順を守るためのゲート)
- GLOSSARY・セクション README・ステータスの更新は独立タスクにしない。各執筆タスクの完了条件に含まれる(CLAUDE.md 最重要ルール 5)

## 最重要トピック 10 選(選定記録)

他ドキュメントから参照される頻度(依存の根元)と実務上の重要度で選んだ 10 本です。
**執筆順を示すものではありません**。順序はフェーズ別タスク分割に従います。

| # | ファイル | 仮タイトル | 重要な理由 |
| --- | --- | --- | --- |
| 1 | `docs/00-overview/learning-roadmap.md` | AI Agent 学習ロードマップ | 全ドキュメントの入口。読む順序を定義する |
| 2 | `docs/01-concepts/what-is-an-ai-agent.md` | AI Agent とは何か | 全記事が前提とする定義を確立する |
| 3 | `docs/01-concepts/agent-loop.md` | Agent ループ(観測・思考・行動) | Agent の動作原理の核。実装・評価の前提 |
| 4 | `docs/01-concepts/tool-use.md` | ツール使用(Tool Use / Function Calling) | Agent を Agent たらしめる機構。実装章の前提 |
| 5 | `docs/01-concepts/memory-and-state.md` | メモリと状態管理 | コンテキスト設計・運用コストの前提知識 |
| 6 | `docs/02-architecture/workflow-vs-agent.md` | Workflow 型 vs Agent 型の使い分け | 実務で最初に問われる設計判断。過剰な Agent 化を防ぐ |
| 7 | `docs/02-architecture/context-engineering.md` | コンテキストエンジニアリング | 品質・コスト・安定性を左右する中心的設計領域 |
| 8 | `docs/03-implementation/tool-definition-design.md` | ツール定義の設計 | 実装品質に最も効くプラクティス集 |
| 9 | `docs/04-evaluation/agent-evaluation-basics.md` | Agent 評価の基礎 | 「作ったが品質が分からない」を防ぐ。運用の前提 |
| 10 | `docs/06-security/prompt-injection.md` | プロンプトインジェクション | Agent 固有の最重要脅威。設計初期から必要 |

## フェーズ別タスク分割(Claude への依頼単位)

各タスクは 1 セッションで完結する粒度に分割しています。依頼時は「Phase X-Y を実施してください」の形で指定できます。

### Phase 0: 構造設計 — ✅ 完了(2026-07-05)

- [x] ディレクトリ構成・README.md・CLAUDE.md・テンプレート・ROADMAP・GLOSSARY の作成
- [x] 構造設計のマルチエージェントレビューと反映

### Phase 1: 入口と土台 — ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 1-1 | 学習ロードマップ執筆 | `00-overview/learning-roadmap.md` | 完了 |
| 1-2 | Agent の定義と分類(会話型・ツール実行型・コンピュータ操作型を含む) | `01-concepts/what-is-an-ai-agent.md` | 完了 |
| 1-R | Phase 1 レビュー(リンク・テンプレート準拠・GLOSSARY 登録漏れの確認) | — | 完了 |

### Phase 2: 基礎概念(01-concepts)— ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 2-1 | Agent ループ + ツール使用(自前実装と MCP 等の標準プロトコルの関係を含む) | `agent-loop.md`, `tool-use.md` | 完了 |
| 2-2 | メモリと状態管理(セッション管理・履歴圧縮を含む)+ プランニング | `memory-and-state.md`, `planning-and-reasoning.md` | 完了 |
| 2-3 | RAG と Agent の関係 + シングル/マルチエージェント | `rag-vs-agent.md`, `single-vs-multi-agent.md` | 完了 |
| 2-4 | コンピュータ操作型・マルチモーダル Agent | `computer-use-and-multimodal-agents.md` | 完了 |
| 2-R | Phase 2 レビュー(相互リンク・用語統一・GLOSSARY 登録漏れ) | — | 完了 |

### Phase 3: アーキテクチャ(02-architecture)— ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 3-1 | Workflow vs Agent の設計判断 | `workflow-vs-agent.md` | 完了 |
| 3-2 | コンテキストエンジニアリング | `context-engineering.md` | 完了 |
| 3-3 | オーケストレーションパターン(直列・並列・階層。外部エージェント連携・A2A 等の標準プロトコルの概観を含む) | `orchestration-patterns.md` | 完了 |
| 3-4 | Human-in-the-Loop 設計 + エラー処理・リトライ設計 | `human-in-the-loop.md`, `error-handling-and-retries.md` | 完了 |
| 3-R | Phase 3 レビュー | — | 完了 |

### Phase 4: 実装(03-implementation)+ サンプルコード基盤 — ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 4-1 | ツール定義の設計 | `tool-definition-design.md` | 完了 |
| 4-2 | Agent 向けプロンプト設計 + 構造化出力 | `agent-prompt-design.md`, `structured-output.md` | 完了 |
| 4-3 | ツール接続標準(MCP とエコシステム) | `mcp-and-tool-protocols.md` | 完了 |
| 4-4 | ストリーミングと Agent の UX 実装パターン(進捗提示・中断・軌道修正) | `streaming-and-agent-ux.md` | 完了 |
| 4-5 | フレームワーク選定ガイド(変化が速いため TODO(要確認) 前提で骨子中心) | `framework-selection.md` | 完了 |
| 4-6 | examples/ 基盤整備(最初の Python サンプル 1 本 + 依存固定 + 実行手順) | `examples/python/tool-use/` | 完了 |
| 4-R | Phase 4 レビュー(docs ↔ examples の双方向リンク確認を含む) | — | 完了 |

### Phase 5: 評価(04-evaluation)— ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 5-1 | Agent 評価の基礎(何をどう測るか) | `agent-evaluation-basics.md` | 完了 |
| 5-2 | LLM-as-a-Judge + 軌跡(trajectory)評価 | `llm-as-a-judge.md`, `trajectory-evaluation.md` | 完了 |
| 5-3 | 回帰テストと CI 組み込み | `regression-testing.md` | 完了 |
| 5-R | Phase 5 レビュー | — | 完了 |

### Phase 6: 運用(05-operations)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 6-1 | 可観測性とトレーシング | `observability-and-tracing.md` | 未着手 |
| 6-2 | コスト管理 + レイテンシ最適化 | `cost-management.md`, `latency-optimization.md` | 未着手 |
| 6-3 | バージョニング・デプロイ(段階的リリース・ロールバック)・モデル更新追従 | `versioning-and-model-updates.md` | 未着手 |
| 6-4 | インシデント対応(暴走・コスト急騰・品質劣化時の停止と復旧) | `incident-response.md` | 未着手 |
| 6-R | Phase 6 レビュー | — | 未着手 |

### Phase 7: セキュリティ(06-security)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 7-1 | Agent の脅威モデル概観(脅威の列挙と分類) | `threat-model-overview.md` | 未着手 |
| 7-2 | プロンプトインジェクション | `prompt-injection.md` | 未着手 |
| 7-3 | ツール権限設計とサンドボックス(外部 MCP サーバーの信頼、コンピュータ操作型の隔離を含む)+ データ漏えい対策 | `tool-permissions-and-sandboxing.md`, `data-exfiltration.md` | 未着手 |
| 7-4 | ガードレール(入力・出力・アクションの 3 層防御の設計) | `guardrails.md` | 未着手 |
| 7-R | Phase 7 レビュー | — | 未着手 |

### Phase 8: ケーススタディと全体統合

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 8-1 | アンチパターン集(横断) | `07-case-studies/common-anti-patterns.md` | 未着手 |
| 8-2 | ケーススタディ 1〜2 本(題材は着手時に選定) | `07-case-studies/` | 未着手 |
| 8-3a | 全体リンク検査(front matter・docs ↔ examples を含む) | 全体 | 未着手 |
| 8-3b | GLOSSARY 完成(登録漏れの補完) | `GLOSSARY.md` | 未着手 |
| 8-3c | `TODO(要確認)` の棚卸し | 全体 | 未着手 |

## Claude への依頼テンプレート

```text
ROADMAP.md の Phase X-Y を実施してください。
CLAUDE.md の執筆ルールと templates/doc-template.md に従い、
完了後に ROADMAP のステータスとセクション README、GLOSSARY を更新してください。
```

## 定期メンテナンス(フェーズ完了後も継続)

- `TODO(要確認)` の全文検索 → 棚卸し(四半期ごと目安)
- モデル・フレームワーク情報の鮮度確認(front matter の `last_updated` が 6 か月以上前のものを優先)
- `examples/` の実行確認と各サンプル README の動作確認日の更新(四半期ごと目安)
