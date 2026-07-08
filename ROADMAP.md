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

### Phase 6: 運用(05-operations)— ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 6-1 | 可観測性とトレーシング | `observability-and-tracing.md` | 完了 |
| 6-2 | コスト管理 + レイテンシ最適化 | `cost-management.md`, `latency-optimization.md` | 完了 |
| 6-3 | バージョニング・デプロイ(段階的リリース・ロールバック)・モデル更新追従 | `versioning-and-model-updates.md` | 完了 |
| 6-4 | インシデント対応(暴走・コスト急騰・品質劣化時の停止と復旧) | `incident-response.md` | 完了 |
| 6-R | Phase 6 レビュー | — | 完了 |

### Phase 7: セキュリティ(06-security)— ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 7-1 | Agent の脅威モデル概観(脅威の列挙と分類) | `threat-model-overview.md` | 完了 |
| 7-2 | プロンプトインジェクション | `prompt-injection.md` | 完了 |
| 7-3 | ツール権限設計とサンドボックス(外部 MCP サーバーの信頼、コンピュータ操作型の隔離を含む)+ データ漏えい対策 | `tool-permissions-and-sandboxing.md`, `data-exfiltration.md` | 完了 |
| 7-4 | ガードレール(入力・出力・アクションの 3 層防御の設計) | `guardrails.md` | 完了 |
| 7-R | Phase 7 レビュー | — | 完了 |

### Phase 8: ケーススタディと全体統合 — ✅ 完了(2026-07-05)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 8-1 | アンチパターン集(横断) | `07-case-studies/common-anti-patterns.md` | 完了 |
| 8-2 | ケーススタディ 2 本(経費精算の段階的 Agent 化 / メール漏えいインシデント) | `07-case-studies/case-study-expense-agent.md`, `case-study-email-assistant-incident.md` | 完了 |
| 8-3a | 全体リンク検査(front matter・docs ↔ examples を含む) | 全体 | 完了 |
| 8-3b | GLOSSARY 完成(登録漏れの補完) | `GLOSSARY.md` | 完了 |
| 8-3c | `TODO(要確認)` の棚卸し | 全体 | 完了 |
| 8-R | Phase 8 レビュー(全体統合の最終確認) | — | 完了 |

### Phase A: AI コーディングエージェント章(08-coding-agents)— ✅ 完了(2026-07-06)

設計書は [CODING-AGENTS-PLAN.md](CODING-AGENTS-PLAN.md)。ツール別ページの執筆前に、設計書 §11 の調査タスク(C-R1〜C-R10)で公式情報の裏取りを実施済み(記録: `research/coding-agents/`、調査日 2026-07-05)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| A-0 | 章スケルトン(セクション README、ROADMAP・ルート README・doc-template の category・website 反映) | `08-coding-agents/README.md` ほか同期一式 | 完了 |
| A-1 | 分類と全体像 + 選定基準 | `coding-agents-overview.md`, `coding-agent-selection.md` | 完了 |
| A-2 | ツール別: Claude Code / OpenAI Codex / Gemini | `claude-code.md`, `openai-codex.md`, `gemini-cli-and-code-assist.md` | 完了 |
| A-3 | ツール別: GitHub Copilot / Cursor / Windsurf | `github-copilot.md`, `cursor.md`, `windsurf.md` | 完了 |
| A-4 | ツール別: Devin / OSS 系俯瞰 | `devin.md`, `open-source-coding-agents.md` | 完了 |
| A-5 | ルールファイルと設定 + 依頼設計 | `coding-agent-rules-and-config.md`, `coding-agent-prompting.md` | 完了 |
| A-6 | セキュリティ + チーム導入 | `coding-agent-security.md`, `coding-agent-team-adoption.md` | 完了 |
| A-7 | 評価 + 比較表(全ツールページ完了後) | `coding-agent-evaluation.md`, `coding-agents-comparison.md` | 完了 |
| A-R | フェーズレビュー(published 化、比較表と各ページの整合、learning-roadmap への組み込み、GLOSSARY、website 反映確認) | — | 完了 |

### Phase B: コーディングエージェント章の拡張 — 実践・コスト最適化・自動化 — ✅ 完了(2026-07-06)

設計は [CODING-AGENTS-PLAN.md](CODING-AGENTS-PLAN.md) §14。ツール別実践ページの執筆前に追加調査(C-R11〜C-R13)を実施済み(記録: `research/coding-agents/*-practice.md`、調査日 2026-07-06)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| B-1 | 横断 2 本(コスト最適化・自動化パターン) | `coding-agent-cost-optimization.md`, `coding-agent-automation-patterns.md` | 完了 |
| B-2 | Claude Code 実践ガイド(C-R11 反映) | `claude-code-in-practice.md` | 完了 |
| B-3 | OpenAI Codex 実践ガイド(C-R12 反映) | `openai-codex-in-practice.md` | 完了 |
| B-4 | GitHub Copilot 実践ガイド(C-R13 反映) | `github-copilot-in-practice.md` | 完了 |
| B-R | フェーズレビュー(既存ページとの相互リンク・README / GLOSSARY / website 反映・published 化) | — | 完了 |

### Phase C: 主要 AI モデルガイド(03-implementation)— ✅ 完了(2026-07-06)

主要 LLM の特性・コスト・使用場面を扱う 2 本を 03-implementation に追加(モデル名を具体的に扱う正本。08 章はここへリンクする)。執筆前調査(M-R1〜M-R4: Anthropic / OpenAI / Google / オープンウェイト)は `research/models/` に記録済み(調査日 2026-07-06)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| C-1 | モデル選定ガイド(判断軸 7 つ・用途別の使い分け・ティア混在設計) | `03-implementation/model-selection.md` | 完了 |
| C-2 | 主要 LLM の全体像(プロバイダー別カタログ。鮮度リスクをここに閉じ込める) | `03-implementation/llm-landscape.md` | 完了 |
| C-R | フェーズレビュー(08 章からの導線・README / GLOSSARY / website 反映・published 化) | — | 完了 |

### Phase D: プロフェッショナル化拡張 — 土台(09-business 新設・スキルマップ・ビジネス実務)— ✅ 完了(2026-07-06)

設計は [EXPANSION-PLAN.md](EXPANSION-PLAN.md)(Phase D〜I・24 本の全体計画)。Phase D は原則が安定した方法論のみを扱うため執筆前調査は不要(調査タスク P-R1〜P-R6 は該当フェーズの着手時に実施)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| D-0 | 09-business スケルトン(セクション README・doc-template の category・website 反映・ルート README) | `09-business/README.md` ほか同期一式 | 完了 |
| D-1 | スキルマップ + learning-roadmap 改訂(読者タイプ G・依存図への 09 追加。learning-roadmap は既 published の改訂で status は据え置き) | `00-overview/skill-map.md` ほか | 完了 |
| D-2 | ユースケース発見と要件定義 + PoC から本番への進め方 | `usecase-discovery.md`, `poc-to-production.md` | 完了 |
| D-R | フェーズレビュー(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase E: プロフェッショナル化拡張 — P1 実装・保証(advanced 4 本)— ✅ 完了(2026-07-06)

設計は [EXPANSION-PLAN.md](EXPANSION-PLAN.md)。E-3 の執筆前に調査タスク P-R1(エージェント認証の標準化動向)を実施(記録: `research/professional/agent-identity.md`、調査日 2026-07-06)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| E-1 | RAG 実装パターン(examples の RAG サンプルは見送り。決定ログ参照) | `03-implementation/rag-implementation-patterns.md` | 完了 |
| E-2 | 評価データセット + デプロイとスケーリング | `04-evaluation/evaluation-datasets.md`, `05-operations/deployment-and-scaling.md` | 完了 |
| E-3 | エージェントの認証・認可(P-R1 反映・鮮度管理型) | `06-security/agent-identity-and-auth.md` | 完了 |
| E-R | フェーズレビュー(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase F: プロフェッショナル化拡張 — P2 前半(非同期・記憶・プロンプト資産・改善ループ)— ✅ 完了(2026-07-06)

設計は [EXPANSION-PLAN.md](EXPANSION-PLAN.md)。F-1 の執筆前に調査タスク P-R2(耐久実行・ワークフローエンジンの動向)を実施(記録: `research/professional/durable-execution.md`、調査日 2026-07-06)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| F-1 | 非同期・耐久実行(P-R2 反映) + 長期記憶の実装 | `02-architecture/async-and-durable-agents.md`, `03-implementation/long-term-memory-implementation.md` | 完了 |
| F-2 | プロンプト資産管理 + フィードバックループ | `03-implementation/prompt-management.md`, `05-operations/feedback-loops.md` | 完了 |
| F-R | フェーズレビュー(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase G: プロフェッショナル化拡張 — P2 後半(レッドチーミング・コンプライアンス・オンライン評価)— ✅ 完了(2026-07-07)

設計は [EXPANSION-PLAN.md](EXPANSION-PLAN.md)。G-1 の執筆前に調査タスク P-R5(規制動向の一次情報)を実施(記録: `research/professional/compliance.md`、調査日 2026-07-07)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| G-1 | レッドチーミング + コンプライアンスとガバナンス(P-R5 反映・鮮度管理型) | `06-security/red-teaming-agents.md`, `06-security/compliance-and-governance.md` | 完了 |
| G-2 | オンライン評価と A/B テスト | `04-evaluation/online-evaluation-and-ab-testing.md` | 完了 |
| G-R | フェーズレビュー(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase H: プロフェッショナル化拡張 — P2 応用(操作型・音声・FT・ROI・事例)— ✅ 完了(2026-07-07)

設計は [EXPANSION-PLAN.md](EXPANSION-PLAN.md)。執筆前に調査タスク P-R3(音声 API の動向)・P-R6(FT・蒸留の提供形態)を実施(記録: `research/professional/voice-agents.md`, `fine-tuning.md`、調査日 2026-07-07)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| H-1 | コンピュータ操作の実装 + 音声エージェント(P-R3 反映) | `03-implementation/computer-use-implementation.md`, `voice-agents.md` | 完了 |
| H-2 | ファインチューニングと蒸留(P-R6 反映) | `03-implementation/fine-tuning-and-distillation.md` | 完了 |
| H-3 | ROI とビジネスケース + サポート Agent 事例 | `09-business/roi-and-business-case.md`, `07-case-studies/case-study-customer-support-agent.md` | 完了 |
| H-R | フェーズレビュー(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase I: プロフェッショナル化拡張 — P3 発展(マルチテナント・API 設計・ベンチマーク・事例)— ✅ 完了(2026-07-07)

設計は [EXPANSION-PLAN.md](EXPANSION-PLAN.md)。I-2 の執筆前に調査タスク P-R4(公開ベンチマークの一覧・リーダーボード・評価方法論)を実施(記録: `research/professional/benchmarks.md`、調査日 2026-07-07)。これで EXPANSION-PLAN の全 24 タスク(新規 23 本 + learning-roadmap 改訂)が完了。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| I-1 | マルチテナント設計 + エージェントの API 設計 | `02-architecture/multi-tenancy-and-isolation.md`, `agent-api-design.md` | 完了 |
| I-2 | ベンチマーク地図(P-R4 反映・鮮度管理型)+ ナレッジ Agent 事例 | `04-evaluation/agent-benchmarks-landscape.md`, `07-case-studies/case-study-knowledge-agent.md` | 完了 |
| I-R | フェーズレビュー + 全体統合(learning-roadmap・依存マップの最終確認、skill-map の advanced 例示更新、published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase J: 別冊拡張 — LLM 基礎(10-llm-foundations 新設)— ✅ 完了(2026-07-07)

設計は [SUPPLEMENTARY-PLAN.md](SUPPLEMENTARY-PLAN.md)(Phase J〜L・11 本の別冊計画)。LLM 基礎は原理が安定しているため執筆前調査は不要(調査タスク Q-R1〜Q-R3 は該当フェーズの着手時に実施)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| J-0 | 10-llm-foundations スケルトン(セクション README・doc-template の category・website 反映・ルート README) | `10-llm-foundations/README.md` ほか同期一式 | 完了 |
| J-1 | 生成の仕組み + トークナイザ | `how-llms-generate-text.md`, `tokenization.md` | 完了 |
| J-2 | 注意機構 + 学習パイプライン | `attention-and-context.md`, `llm-training-pipeline.md` | 完了 |
| J-3 | 能力と限界 | `capabilities-and-limits.md` | 完了 |
| J-R | フェーズレビュー + 既存記事からの逆リンク(context-engineering・cost-management・guardrails・tool-use)+ learning-roadmap の 11 セクション化(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase K: 別冊拡張 — プロンプト技法・会話データ基盤 — ✅ 完了(2026-07-07)

設計は [SUPPLEMENTARY-PLAN.md](SUPPLEMENTARY-PLAN.md)。調査タスク Q-R3(会話データの規制要件)は独立実施せず、P-R5 の調査メモ(`research/professional/compliance.md`)と `compliance-and-governance.md` を規制面の正本として参照(決定ログ参照)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| K-1 | プロンプト技法カタログ(汎用。Agent 特化記事との分担明記) | `03-implementation/prompt-engineering-fundamentals.md` | 完了 |
| K-2 | 会話データの管理基盤(収集・機微処理・保持と削除・活用・アクセス統制) | `05-operations/conversation-data-management.md` | 完了 |
| K-R | フェーズレビュー + 逆リンク(agent-prompt-design・coding-agent-prompting・observability・compliance)(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase L: 別冊拡張 — フィジカル AI 概観・業界規制マップ(最終フェーズ)— ✅ 完了(2026-07-07)

設計は [SUPPLEMENTARY-PLAN.md](SUPPLEMENTARY-PLAN.md)。執筆前に調査タスク Q-R1(フィジカル AI / VLA の現在地)・Q-R2(業界規制の一次情報所在)を実施(記録: `research/supplementary/physical-ai.md`, `regulations.md`、調査日 2026-07-07)。L-2(金融・医療の考慮点 2 本)は縮小決定により収録しない(決定ログ参照。ユーザー確認済み)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| L-1 | フィジカル AI 概観(Q-R1 反映)+ 業界規制の入口マップ(Q-R2 反映・免責 + 鮮度管理型) | `01-concepts/physical-ai-overview.md`, `09-business/industry-regulations-map.md` | 完了 |
| L-2 | 金融・医療の考慮点 | —(縮小決定により対象外) | 対象外 |
| L-R | フェーズレビュー + 全体統合(learning-roadmap・依存マップの最終確認、逆リンク、published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase M: 詳解拡張 — プロンプトエンジニアリング(DEEP-DIVE 第 1 弾)— ✅ 完了(2026-07-07)

設計は [DEEP-DIVE-PLAN.md](DEEP-DIVE-PLAN.md)(M〜O・7 本)。原理が安定した領域のため執筆前調査は不要(自動最適化のフレームワーク動向のみ TODO 前提)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| M-1 | プロンプト上級パターン + プロンプト最適化 | `03-implementation/prompt-engineering-patterns.md`, `prompt-optimization.md` | 完了 |
| M-R | フェーズレビュー + 逆リンク(fundamentals・agent-prompt-design)(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase N: 詳解拡張 — コンテキストエンジニアリング(DEEP-DIVE 第 2 弾)— ✅ 完了(2026-07-07)

設計は [DEEP-DIVE-PLAN.md](DEEP-DIVE-PLAN.md)。原則が安定した領域のため執筆前調査は不要。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| N-1 | コンテキスト実践パターン + 圧縮と隔離 | `02-architecture/context-engineering-patterns.md`, `context-compaction-and-isolation.md` | 完了 |
| N-R | フェーズレビュー + 逆リンク(context-engineering・memory-and-state・coding-agent-cost-optimization)(published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase O: 詳解拡張 — ハーネス・ループエンジニアリング(DEEP-DIVE 第 3 弾)— ✅ 完了(2026-07-08)

設計は [DEEP-DIVE-PLAN.md](DEEP-DIVE-PLAN.md)。原理が安定した領域のため執筆前調査は不要(ハーネス依存の実証は `research/professional/benchmarks.md` を根拠に再利用)。これで DEEP-DIVE 計画の全 7 本(M〜O)が完了。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| O-1 | ハーネスエンジニアリング + ループエンジニアリング | `02-architecture/harness-engineering.md`, `loop-engineering.md` | 完了 |
| O-2 | ループ内フィードバックと検証器 | `03-implementation/loop-feedback-and-verification.md` | 完了 |
| O-R | フェーズレビュー + 三層の相互リンク総点検(agent-loop・planning-and-reasoning・framework-selection・tool-definition-design・agent-benchmarks-landscape からの逆リンク、published 化・README / GLOSSARY / website 反映確認) | — | 完了 |

### Phase BA: モデル特化プロンプティング(MODEL-PROMPTING)— ✅ 完了(2026-07-08)

設計は [MODEL-PROMPTING-PLAN.md](MODEL-PROMPTING-PLAN.md)。全 4 本が鮮度管理型・調査必須。執筆前に PE-R1〜R3(Anthropic / OpenAI / Google の公式プロンプト推奨)を実施(記録: `research/prompting/`、調査日 2026-07-08)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| BA-1 | Claude 特化ガイド(PE-R1 反映) | `03-implementation/claude-prompting.md` | 完了 |
| BA-2 | OpenAI + Gemini 特化ガイド(PE-R2・R3 反映) | `openai-prompting.md`, `gemini-prompting.md` | 完了 |
| BA-3 | 横断比較・移行(3 本完成後) | `cross-model-prompting.md` | 完了 |
| BA-R | フェーズレビュー(3 本の骨格一貫性・fundamentals / patterns / agent-prompt-design / llm-landscape / model-selection / versioning / prompt-management からの逆リンク・published 化・定期メンテナンス統合) | — | 完了 |

### Phase AD: データ・知識基盤 — 埋め込み・ベクトル DB・前処理(DATA-KNOWLEDGE 第 1 弾)— ✅ 完了(2026-07-08)

設計は [DATA-KNOWLEDGE-PLAN.md](DATA-KNOWLEDGE-PLAN.md)。原則が安定した領域のため執筆前調査は不要(製品名は本文に置かず、類型・選定軸で記述)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AD-1 | 埋め込み + ベクトル DB | `03-implementation/embeddings.md`, `vector-databases.md` | 完了 |
| AD-2 | 前処理パイプライン | `data-preprocessing-for-llm.md` | 完了 |
| AD-R | フェーズレビュー(rag-implementation-patterns・long-term-memory-implementation・multi-tenancy-and-isolation・case-study-knowledge-agent からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase AE: データ・知識基盤 — GraphRAG・合成データ・データガバナンス(DATA-KNOWLEDGE 第 2 弾)— ✅ 完了(2026-07-08)

設計は [DATA-KNOWLEDGE-PLAN.md](DATA-KNOWLEDGE-PLAN.md)。原則が安定した領域のため執筆前調査は不要(教師モデル出力の利用条件のみ TODO 前提)。これで DATA-KNOWLEDGE 計画の全 6 本(AD + AE)が完了。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AE-1 | GraphRAG + 学習用合成データ | `03-implementation/graph-rag-and-knowledge-graphs.md`, `synthetic-data-for-training.md` | 完了 |
| AE-2 | データガバナンス | `05-operations/data-governance-for-ai.md` | 完了 |
| AE-R | フェーズレビュー + 統合(evaluation-datasets・fine-tuning-and-distillation・rag-implementation-patterns・case-study-knowledge-agent・conversation-data-management・compliance-and-governance からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase AK: 評価・品質の深掘り — 評価環境・シミュレータ・較正(EVAL-QUALITY 第 1 弾)— ✅ 完了(2026-07-08)

設計は [EVAL-QUALITY-PLAN.md](EVAL-QUALITY-PLAN.md)。原則が安定した領域のため執筆前調査は不要(`research/professional/benchmarks.md` の τ-bench・評価環境の知見を再利用)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AK-1 | 評価環境 + ユーザーシミュレータ | `04-evaluation/evaluation-environments.md`, `user-simulator-design.md` | 完了 |
| AK-2 | 信頼度と較正 | `confidence-and-calibration.md` | 完了 |
| AK-R | フェーズレビュー(agent-evaluation-basics・regression-testing・human-in-the-loop・evaluation-datasets からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase AL: 評価・品質の深掘り — 公平性・日本語品質(EVAL-QUALITY 第 2 弾)— ✅ 完了(2026-07-08)

設計は [EVAL-QUALITY-PLAN.md](EVAL-QUALITY-PLAN.md)。原則が安定した領域のため執筆前調査は不要(日本語ベンチマーク名は TODO 前提)。これで EVAL-QUALITY 計画の全 5 本(AK + AL)が完了。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AL-1 | 公平性 + 日本語品質 | `04-evaluation/fairness-and-bias-evaluation.md`, `japanese-quality-evaluation.md` | 完了 |
| AL-R | フェーズレビュー + 統合(agent-evaluation-basics・online-evaluation-and-ab-testing からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase AX: AI 信頼性エンジニアリング — SLO・カオス・常駐(RELIABILITY)— ✅ 完了(2026-07-08)

設計は [RELIABILITY-PLAN.md](RELIABILITY-PLAN.md)。SRE の方法論を AI 固有の面に適用するため執筆前調査は不要(EVAL-QUALITY の evaluation-environments を注入演習の実行環境として参照)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AX-1 | SLO 設計 + カオスエンジニアリング | `05-operations/ai-slo-design.md`, `chaos-engineering-for-ai.md` | 完了 |
| AX-2 | 常駐エージェントのライフサイクル | `long-running-agents.md` | 完了 |
| AX-R | フェーズレビュー(observability-and-tracing・online-evaluation-and-ab-testing・incident-response・error-handling-and-retries・deployment-and-scaling・async-and-durable-agents・long-term-memory-implementation からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase AQ: 基礎・理論の拡張 前半 — 推論モデル・SLM 戦略(FOUNDATIONS-EXTENSION 第 1 弾)— ✅ 完了(2026-07-08)

設計は [FOUNDATIONS-EXTENSION-PLAN.md](FOUNDATIONS-EXTENSION-PLAN.md)。原則が安定した領域のため執筆前調査は不要(推論モデルの提供形態は TODO 前提・類型で記述)。散在していた「推論モデル」の言及を reasoning-models に正本化。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AQ-1 | 推論モデル + SLM 戦略 | `10-llm-foundations/reasoning-models.md`, `03-implementation/slm-strategy.md` | 完了 |
| AQ-R | フェーズレビュー(model-selection・capabilities-and-limits・prompt-engineering-fundamentals・latency-optimization・fine-tuning-and-distillation からの逆リンク・published 化・同期一式) | — | 完了 |

残りは Phase AR(世界モデル + AI の歴史 + マルチモーダル内部)。**これで PRIORITY-MAP 第 2 波(基盤の深掘り)が完了。**

### Phase AR: 基礎・理論の拡張 後半 — 世界モデル・AI の歴史・マルチモーダル(FOUNDATIONS-EXTENSION 第 2 弾)— ✅ 完了(2026-07-08)

設計は [FOUNDATIONS-EXTENSION-PLAN.md](FOUNDATIONS-EXTENSION-PLAN.md)。執筆前調査は不要(世界モデルは `research/supplementary/physical-ai.md` を再利用)。#5 マルチモーダルは LLM-INTERNALS(11 章)が未採用のため、計画の**縮小案**どおり数式なしの直感版 `multimodal-models.md` を 10 章に配置。**これで FOUNDATIONS-EXTENSION 計画(全 5 本)が完了。**

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AR-1 | 世界モデル + AI の歴史 | `01-concepts/world-models-overview.md`, `01-concepts/ai-history-and-lineage.md` | 完了 |
| AR-2 | マルチモーダルモデルの仕組み(数式なし直感版・10 章) | `10-llm-foundations/multimodal-models.md` | 完了 |
| AR-R | フェーズレビュー(physical-ai-overview・what-is-an-ai-agent・computer-use-and-multimodal-agents・attention-and-context・how-llms-generate-text からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase V: SE 実践シリーズ 前半 — 工程別マップ・上流・テスト(SE-CODING-AGENTS 第 1 弾)— ✅ 完了(2026-07-08)

設計は [SE-CODING-AGENTS-PLAN.md](SE-CODING-AGENTS-PLAN.md)。日本の企業システム開発の**工程**(V 字モデル)に軸を置き、08 章のツール基礎の上に「工程の層」を足す SE 実践シリーズの前半 3 本。調査不要。08 章 README の収録表に「SE 実践シリーズ」区切り行を追加(sync の収録表パースは `[x.md](` 行のみ拾うため区切り行は無視され安全と確認 = §9 TODO 解消)。残りは Phase X(レガシー・保守 + 制約・顧客合意、SE-R1 調査必須)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| V-1 | 工程別活用マップ(シリーズの背骨) | `08-coding-agents/se-process-map.md` | 完了 |
| V-2 | 上流・テスト工程 | `08-coding-agents/se-requirements-and-design.md`, `08-coding-agents/se-test-process.md` | 完了 |
| V-R | フェーズレビュー(08 README のシリーズ区切り・usecase-discovery / regression-testing からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase X: SE 実践シリーズ 後半 — レガシー・保守・制約・顧客合意(SE-CODING-AGENTS 第 2 弾)— ✅ 完了(2026-07-08)

設計は [SE-CODING-AGENTS-PLAN.md](SE-CODING-AGENTS-PLAN.md)。SE 実践シリーズの後半 4 本で、下流工程(レガシー理解・保守運用)と商流・環境(企業制約・顧客合意)を扱う。**これで SE-CODING-AGENTS 計画(全 7 本)が完了。**se-enterprise-constraints は鮮度管理型で、執筆前調査 SE-R1(`research/se/enterprise-offerings.md`、エンタープライズ提供形態の一次情報・2026-07-08)を反映。learning-roadmap に**読者タイプ H(企業システム開発)**を追加し website の READER_ROUTES も同期。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| SE-R1 | エンタープライズ提供形態の執筆前調査 | `research/se/enterprise-offerings.md` | 完了 |
| X-1 | 下流工程(レガシー理解 + 保守・運用) | `08-coding-agents/se-legacy-code-analysis.md`, `08-coding-agents/se-maintenance-and-operations.md` | 完了 |
| X-2 | 制約と導入(企業制約〔SE-R1 反映〕 + 顧客合意形成) | `08-coding-agents/se-enterprise-constraints.md`, `08-coding-agents/se-client-adoption.md` | 完了 |
| X-R | フェーズレビュー + 統合(読者タイプ H 追加・website 同期・coding-agent-security / industry-regulations-map / roi-and-business-case / coding-agent-team-adoption / coding-agent-automation-patterns からの逆リンク・GLOSSARY 4 語・published 化・同期一式) | — | 完了 |

### Phase AF: モデル運用・インフラ 前半 — セルフホスト・GPU 基礎・ゲートウェイ(LLMOPS 第 1 弾)— ✅ 完了(2026-07-08)

設計は [LLMOPS-PLAN.md](LLMOPS-PLAN.md)。モデルを「借りる・持つ・混ぜる」インフラ層の前半。執筆前調査 LO-R1(`research/llmops/serving.md`、推論エンジン・ローカル実行系・ゲートウェイ OSS の提供形態/ライセンス/機能・公式のみ・2026-07-08、ベンチマークは扱わない)を self-hosted-inference / llm-gateway に反映。05 章 README に「LLMOps」区切り行を追加。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| LO-R1 | サービング・ローカル・ゲートウェイ OSS の執筆前調査 | `research/llmops/serving.md` | 完了 |
| AF-1 | セルフホスト推論 + GPU・ハードウェア基礎 | `05-operations/self-hosted-inference.md`, `05-operations/gpu-and-hardware-basics.md` | 完了 |
| AF-2 | LLM ゲートウェイ | `05-operations/llm-gateway.md` | 完了 |
| AF-R | フェーズレビュー(deployment / model-selection / multi-tenancy 等からの逆リンク・published 化・同期一式) | — | 完了 |

### Phase AG: モデル運用・インフラ 後半 — ローカル・キャッシュ・バッチ・MLOps(LLMOPS 第 2 弾)— ✅ 完了(2026-07-08)

設計は [LLMOPS-PLAN.md](LLMOPS-PLAN.md)。後半 4 本(ローカル/オンデバイス・セマンティックキャッシュ・バッチ処理・MLOps 統合)。local-and-on-device-llm は LO-R1 を再利用、他 3 本は調査不要。**これで LLMOPS 計画(全 7 本)が完了。**ROADMAP 定期メンテナンスに「サービング・ゲートウェイ OSS の定点観測」を追加。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AG-1 | ローカル・オンデバイス LLM + セマンティックキャッシュ | `03-implementation/local-and-on-device-llm.md`, `05-operations/semantic-caching.md` | 完了 |
| AG-2 | バッチ処理 + MLOps 統合 | `05-operations/batch-processing.md`, `05-operations/mlops-and-llmops.md` | 完了 |
| AG-R | フェーズレビュー + 統合(cost-management / versioning / fine-tuning / slm-strategy / se-enterprise-constraints との相互リンク・GLOSSARY 5 語〔LLM ゲートウェイ・セマンティックキャッシュ・連続バッチング・量子化・LLMOps〕・published 化・同期一式・定点観測追加) | — | 完了 |

### Phase Y: モダリティ応用 前半 — ドキュメント AI・画像理解・マルチモーダル RAG(MULTIMODAL 第 1 弾)— ✅ 完了(2026-07-08)

設計は [MULTIMODAL-PLAN.md](MULTIMODAL-PLAN.md)。**新セクション `12-multimodal`(モダリティ応用)を新設**し(Y-0 スケルトン)、理解系 3 本を追加。調査不要(Y 系は原則安定)。既存の voice-agents / computer-use-implementation(03)は正本のまま維持し、12 章から参照。website は sync の SECTION_TITLES に `multimodal` を追加、dependency-graph に 12 のノード + `implementation -.-> multimodal` の点線を追加、doc-template の category に `multimodal` を追加。learning-roadmap の 12 セクション化・依存マップの本格更新は Phase Z(Z-R)で実施。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| Y-0 | 12-multimodal スケルトン | `12-multimodal/README.md`・doc-template category・sync SECTION_TITLES・dependency-graph・ルート README 構成 | 完了 |
| Y-1 | ドキュメント AI + 画像理解 | `12-multimodal/document-ai.md`, `12-multimodal/vision-understanding-patterns.md` | 完了 |
| Y-2 | マルチモーダル RAG | `12-multimodal/multimodal-rag.md` | 完了 |
| Y-R | フェーズレビュー(rag-implementation-patterns / structured-output / computer-use-and-multimodal-agents からの逆リンク・GLOSSARY 4 語〔VLM・ドキュメント AI・OCR・マルチモーダル RAG〕・published 化・同期一式) | — | 完了 |

残りは Phase Z(画像生成・動画・音声合成・リアルタイム、MM-R2・MM-R3 調査必須)。

### Phase Z: モダリティ応用 後半 — 画像生成・動画・音声合成・リアルタイム(MULTIMODAL 第 2 弾)— ✅ 完了(2026-07-08)

設計は [MULTIMODAL-PLAN.md](MULTIMODAL-PLAN.md)。生成系・リアルタイム系 4 本(すべて鮮度管理型)。執筆前調査 MM-R2(`research/multimodal/generation.md`、画像・動画生成の提供形態/商用利用/来歴・公式のみ・優劣比較なし)を image-generation / video に、MM-R3(`research/multimodal/realtime-tts.md`、リアルタイム視覚ストリーミング + 単体 TTS の日本語/クローン・P-R3 音声メモの差分)を speech-synthesis / realtime に反映。**これで MULTIMODAL 計画(全 7 本)+ 新セクション 12 が完了。**learning-roadmap を 12 セクション化(Mermaid に `I3 -.-> MM12`・読みどころ追加)。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| MM-R2 | 画像・動画生成の提供状況調査 | `research/multimodal/generation.md` | 完了 |
| MM-R3 | リアルタイム視覚 + 単体 TTS 調査 | `research/multimodal/realtime-tts.md` | 完了 |
| Z-1 | 画像生成の組み込み + 動画概観 | `12-multimodal/image-generation-integration.md`, `12-multimodal/video-ai-overview.md` | 完了 |
| Z-2 | 音声合成と声の設計 + リアルタイムマルチモーダル | `12-multimodal/speech-synthesis-and-voice-design.md`, `12-multimodal/realtime-multimodal-agents.md` | 完了 |
| Z-R | フェーズレビュー + 統合(learning-roadmap 12 セクション化・voice-agents / conversation-data-management からの逆リンク・GLOSSARY 2 語〔インペインティング・音声クローン〕・published 化・同期一式・定点観測追加) | — | 完了 |

### Phase AH: セキュリティ発展層 — サプライチェーン・新興攻撃・プライバシー技術(TRUST-SECURITY 第 1 弾)— ✅ 完了(2026-07-08)

設計は [TRUST-SECURITY-PLAN.md](TRUST-SECURITY-PLAN.md)。06-security の発展層 3 本(既存 8 本「脅威 → 防御」の後ろに「発展層」として並べる)。調査不要(AH 系は原則安定・部分確認のみ)。**防御側に徹し、攻撃手順・ペイロードは書かない**方針(red-teaming で確立した方針を継承)。06 章 README に「発展層」区切り行を追加。

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| AH-1 | サプライチェーン + 新興攻撃パターン | `06-security/ai-supply-chain-security.md`, `06-security/advanced-attack-patterns.md` | 完了 |
| AH-2 | プライバシー強化技術 | `06-security/privacy-enhancing-technologies.md` | 完了 |
| AH-R | フェーズレビュー(threat-model-overview・prompt-injection・tool-permissions-and-sandboxing・long-term-memory-implementation・rag-implementation-patterns・conversation-data-management からの逆リンク・GLOSSARY 4 語〔サプライチェーン攻撃・メモリポイズニング・差分プライバシー・連合学習〕・published 化・同期一式) | — | 完了 |

残りは Phase AI(来歴と検出 + ディープフェイク防御 + フロンティアセーフティ、TS-R2・TS-R3 調査必須)・Phase AJ(著作権・知財マップ + 責任と説明責任、TS-R1 調査必須・免責方式)。

## 未着手の拡張計画(残 9 計画)

2026-07-08 時点で、DEEP-DIVE(Phase M〜O・7 本)・MODEL-PROMPTING(Phase BA・4 本)・DATA-KNOWLEDGE(Phase AD・AE・6 本)・EVAL-QUALITY(Phase AK・AL・5 本)・RELIABILITY(Phase AX・3 本)・FOUNDATIONS-EXTENSION(Phase AQ・AR・5 本)・**SE-CODING-AGENTS(Phase V・X・7 本)**・**LLMOPS(Phase AF・AG・7 本)**・**MULTIMODAL(Phase Y・Z・新セクション 12 + 7 本)**が完了し、さらに第 3 波の **TRUST-SECURITY 前半(Phase AH・3 本)**に着手しました(PRIORITY-MAP 第 2 波完了 + 第 3 波の SE-CODING-AGENTS・LLMOPS・MULTIMODAL 完了)。残る拡張計画は 9 本(うち TRUST-SECURITY は Phase AI・AJ の 5 本が残り。計 50 本 + examples 5 件、フェーズ記号 AI・AJ・S〜AZ)です。各計画の内容は各 `*-PLAN.md` を、**推奨実施順は [PRIORITY-MAP.md](PRIORITY-MAP.md) を参照**してください(次は TRUST-SECURITY を進める AI〔来歴・ディープフェイク・フロンティアセーフティ、TS-R2・TS-R3 調査〕等)。着手したフェーズは従来どおり本ファイルにタスク表を追記して管理します。

## Claude への依頼テンプレート

```text
ROADMAP.md の Phase X-Y を実施してください。
CLAUDE.md の執筆ルールと templates/doc-template.md に従い、
完了後に ROADMAP のステータスとセクション README、GLOSSARY を更新してください。
```

## 定期メンテナンス(フェーズ完了後も継続)

- `TODO(要確認)` の全文検索 → 棚卸し(四半期ごと目安)
- モデル・フレームワーク情報の鮮度確認(front matter の `last_updated` が 6 か月以上前のものを優先)
- **08-coding-agents のツール情報の定点観測**(各ページの「変わりやすい項目」と比較表。製品名・プラン・学習ポリシーの変化が速いため四半期ごと必須。`research/coding-agents/` の調査メモを更新起点にする)
- **モデルガイド(model-selection / llm-landscape)+ モデル特化プロンプティング(claude / openai / gemini / cross-model-prompting)の定点観測**(モデル名・価格帯・退役日程・各社の思考制御/構造化出力/prefill などプロンプト仕様。四半期ごと必須。`research/models/` と `research/prompting/` の調査メモを更新起点にする。直近の注目: Sonnet 5 導入価格終了 2026-09 / Gemini 2.5 系終了 2026-10 / OpenAI o 系退役 2026-12 / OpenAI `v1/prompts` 停止 2026-11-30)
- **エージェント認証の標準動向の定点観測**(`06-security/agent-identity-and-auth.md` の「変わりやすい項目」。四半期ごと。`research/professional/agent-identity.md` を更新起点にする。直近の注目: OAuth 2.1 の IESG 提出予定 2026-12 / MCP 認可仕様の次期リビジョン)
- **規制動向の定点観測**(`06-security/compliance-and-governance.md` の「変わりやすい項目」。四半期ごと。`research/professional/compliance.md` を更新起点にする。直近の注目: EU omnibus 官報公布 / EU 透明性義務 2026-08-02 適用 / 日本の個情法改正案の成立 / California SB 942 系 2026-08-02 施行)
- **音声 API・FT 提供状況の定点観測**(`03-implementation/voice-agents.md` と `fine-tuning-and-distillation.md` の TODO・変わりやすい項目。四半期ごと。`research/professional/voice-agents.md`, `fine-tuning.md` を更新起点にする。直近の注目: OpenAI FT プラットフォーム縮小の帰趨 / Gemini Live の GA 化)
- **エージェントベンチマーク動向の定点観測**(`04-evaluation/agent-benchmarks-landscape.md` の「変わりやすい項目」。四半期ごと。`research/professional/benchmarks.md` を更新起点にする。直近の注目: SWE-bench Pro / Terminal-Bench 2.x への重心移行の定着 / OSWorld 2.0・GAIA2・τ³-bench のスコア推移)
- **業界規制の定点観測**(`09-business/industry-regulations-map.md` の全表の版数。四半期ごと。`research/supplementary/regulations.md` を更新起点にする。直近の注目: 厚労省ガイドライン第 7.0 版の詳細 / DS-920 第 2.0 版の運用 / 金融庁 AI DP の次期改訂 / 個情法改正案の成立)
- **フィジカル AI の定点観測**(`01-concepts/physical-ai-overview.md` の「変わりやすい項目」。四半期ごと。`research/supplementary/physical-ai.md` を更新起点にする。直近の注目: モデル世代・提供形態の変化 / 共通ベンチマークの成立)
- **サービング・ゲートウェイ OSS の定点観測**(`05-operations/self-hosted-inference.md`・`llm-gateway.md` と `03-implementation/local-and-on-device-llm.md` の「変わりやすい項目」。推論エンジン・ローカル実行系・ゲートウェイ OSS は開発が活発で機能差・ライセンスが動きやすいため四半期ごと。`research/llmops/serving.md` を更新起点にする。直近の注目: OpenAI 互換 API の対応範囲拡大 / OSS コアとエンタープライズ機能の境界 / 量子化形式の追随)
- **生成 AI(画像・動画)・リアルタイム/TTS API の定点観測**(`12-multimodal/` の生成系・リアルタイム系(image-generation-integration・video-ai-overview・speech-synthesis-and-voice-design・realtime-multimodal-agents)の「変わりやすい項目」。生成モデルの顔ぶれ・尺/解像度・商用利用条件・来歴(C2PA/透かし)・リアルタイム映像入力仕様・音声クローンの同意要件は変化が非常に速いため四半期ごと。`research/multimodal/generation.md`・`realtime-tts.md` を更新起点にする。直近の注目: Imagen の 2026-08-17 停止と Nano Banana 移行 / 動画生成の尺・音声同期 / 各社の来歴機能の対象拡大)
- `examples/` の実行確認と各サンプル README の動作確認日の更新(四半期ごと目安)
