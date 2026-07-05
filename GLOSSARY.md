# GLOSSARY — 用語集

AI Agent 関連の用語を五十音順・アルファベット順に整理し、詳細を解説するドキュメントへの入口を提供します。

## 運用ルール

- 各エントリは **1〜2 文の要約 + 詳細ドキュメントへの相対リンク** で構成する(ここに長文解説は書かない)
- 新しい用語を本文で初めて導入したドキュメントの執筆セッションで、ここにエントリを追加する
- **登録基準**: 次のいずれかに該当する用語のみ登録する(本文に登場するすべての技術用語を載せない)
  1. いずれかのドキュメントの H1 または主要な H3 で定義される概念
  2. front matter の `tags` に使われる語
  3. 複数のドキュメントから参照される語
- 表記は「日本語訳(English)」を基本とし、日本語訳が定着していない用語は英語見出しにする
- 詳細ドキュメントが未執筆の用語は、リンクの代わりに `(執筆予定: ファイル名)` と書く

## エントリの書式

```markdown
### 用語名(English Term)

1〜2 文の要約。→ [詳細ドキュメント](docs/01-concepts/xxx.md)
```

---

## あ行〜わ行

### オーケストレーション(Orchestration)

複数の LLM 呼び出しや Agent の実行順序とデータの流れを制御すること。直列・並列・ルーティングなどの定番パターンがある。→ [オーケストレーションパターン](docs/02-architecture/orchestration-patterns.md)

### ガードレール(Guardrails)

モデルの判断の外側でコードとして強制される制御。入力・出力・アクションの 3 層に配置し、プロンプトでの指示(お願い)と区別される。→ [ガードレール](docs/06-security/guardrails.md)

### 回帰テスト(Regression Testing)

プロンプト・ツール・モデルの変更で既存の品質が壊れていないかを、評価データセットの再実行と前回比較で検知するテスト。→ [回帰テストと CI 組み込み](docs/04-evaluation/regression-testing.md)

### 可観測性(Observability)

トレース・メトリクス・ログといった外部出力から、システム内部で何が起きたかを説明できる性質。Agent では技術メトリクスに加えて品質シグナルの設計が必要になる。→ [可観測性とトレーシング](docs/05-operations/observability-and-tracing.md)

### 軌跡評価(Trajectory Evaluation)

最終出力だけでなく、Agent ループの実行記録(軌跡: 思考・ツール呼び出し・結果の列)に対して経路の正しさ・効率・安全性を評価すること。→ [軌跡(trajectory)評価](docs/04-evaluation/trajectory-evaluation.md)

### 脅威モデル(Threat Model)

システムの攻撃面を棚卸しし、脅威を列挙・分類してリスクを優先順位付けする作業とその成果物。構成変更のたびに見直す。→ [Agent の脅威モデル概観](docs/06-security/threat-model-overview.md)

### キルスイッチ(Kill Switch)

インシデント時にデプロイなしで Agent を止める・自律度を下げるための、事前に用意された停止手段。全停止・縮退・ツール単位の無効化など粒度を分けて設計する。→ [インシデント対応](docs/05-operations/incident-response.md)

### 構造化出力(Structured Output)

LLM の出力を JSON Schema などの機械可読なスキーマに従わせる技術。後続の処理がコードである出力(分類・抽出・スコア)に使う。→ [構造化出力](docs/03-implementation/structured-output.md)

### コーディングエージェント(Coding Agent)

コードベースを読み、ファイルを編集し、コマンドを実行して検証するループで開発タスクを遂行する Agent。コード補完と異なり「タスク単位の委任」を受けられる。→ [AI コーディングエージェントの分類と全体像](docs/08-coding-agents/coding-agents-overview.md)

### コンテキストエンジニアリング(Context Engineering)

LLM に渡す情報の全体(システムプロンプト・ツール定義・履歴・資料・状態)を、構成要素の選択・配置・ライフサイクルとして設計する営み。→ [コンテキストエンジニアリング](docs/02-architecture/context-engineering.md)

### コンピュータ操作型 Agent(Computer Use Agent)

画面(スクリーンショット)を観測し、マウス・キーボード操作で GUI を直接操作する Agent の類型。→ [コンピュータ操作型・マルチモーダル Agent](docs/01-concepts/computer-use-and-multimodal-agents.md)

### サンドボックス(Sandbox)

モデルが生成したコードの実行やコンピュータ操作を、本番システムから隔離された使い捨て環境(ネットワーク・資源制限付き)で行う仕組み。→ [ツール権限設計とサンドボックス](docs/06-security/tool-permissions-and-sandboxing.md)

### 静かな失敗(Silent Failure)

エラーを出さずに完走しながら、誤った結果を返す・誤った副作用を残す失敗。技術メトリクスに現れないため、品質シグナルによる検知設計が必要になる。→ [可観測性とトレーシング](docs/05-operations/observability-and-tracing.md)

### ストリーミング(Streaming)

LLM の応答を生成と同時に逐次受信・表示する方式。Agent の体感品質を左右する基本技術。→ [ストリーミングと Agent の UX 実装パターン](docs/03-implementation/streaming-and-agent-ux.md)

### 致命的三重奏(Lethal Trifecta)

非公開データへのアクセス・信頼できないコンテンツへの接触・外部への送信能力の 3 つが 1 つの Agent に揃うと、データ持ち出しが構造的に可能になるという設計チェックの枠組み。→ [Agent の脅威モデル概観](docs/06-security/threat-model-overview.md)

### ツール使用(Tool Use / Function Calling)

LLM が検索・API 呼び出し・コード実行などの外部機能を呼び出して行動する仕組み。Agent を Agent たらしめる中核機構。→ [ツール使用](docs/01-concepts/tool-use.md)

### データ漏えい(Data Exfiltration)

Agent を経由して機微データが外部に出ること。間接プロンプトインジェクションによる攻撃系と、権限・ログ設計の不備による事故系がある。→ [データ漏えい対策](docs/06-security/data-exfiltration.md)

### 評価ハーネス(Evaluation Harness)

Agent の評価を繰り返し実行可能にする仕組み一式。データセット・実行系・採点系・レポートの 4 点で構成される。→ [Agent 評価の基礎](docs/04-evaluation/agent-evaluation-basics.md)

### プランニング(Planning)

タスクをステップに分解し、実行順序を決め、進捗に応じて見直す働き。逐次判断・事前計画・リフレクションの 3 パターンが基本形。→ [プランニングと推論](docs/01-concepts/planning-and-reasoning.md)

### プロンプトインジェクション(Prompt Injection)

モデルへの入力に紛れ込ませた指示で、開発者の意図した挙動を上書きする攻撃。ユーザー入力による直接型と、Agent が読む外部コンテンツ経由の間接型がある。→ [プロンプトインジェクション](docs/06-security/prompt-injection.md)

### プロンプトキャッシュ(Prompt Caching)

プロンプトの固定部分(前方一致)の処理結果を再利用し、入力コストと応答開始までの時間を削減する仕組み。固定部分を先頭に置くプロンプト構造が前提。→ [コスト管理](docs/05-operations/cost-management.md)

### マルチエージェント(Multi-Agent)

複数の Agent ループが、それぞれ独立したコンテキストを持って分担・協調する構成。→ [シングルエージェントとマルチエージェント](docs/01-concepts/single-vs-multi-agent.md)

### マルチモーダル(Multimodal)

テキスト以外の入力(画像・音声など)を理解できるモデルの能力。コンピュータ操作型 Agent の前提となる。→ [コンピュータ操作型・マルチモーダル Agent](docs/01-concepts/computer-use-and-multimodal-agents.md)

### メモリ(Memory)

Agent が「覚えている」ように見えるデータの総称。短期記憶(コンテキスト)・作業状態・長期記憶(外部ストレージ)の 3 層に分けて設計する。→ [メモリと状態管理](docs/01-concepts/memory-and-state.md)

### ルールファイル(Rules File)

コーディングエージェントがセッション開始時に読み込む、プロジェクト固有の指示書(AGENTS.md・CLAUDE.md など)。恒常的な規約を毎回の依頼文から分離する。→ [ルールファイルと設定の設計](docs/08-coding-agents/coding-agent-rules-and-config.md)

## A–Z

### A2A(Agent2Agent Protocol)

組織・システムの境界を越えてエージェント同士が発見・通信・タスク委譲を行うための標準プロトコルの一つ。2026 年時点では成熟途上。→ [オーケストレーションパターン](docs/02-architecture/orchestration-patterns.md)

### Agent ループ(Agent Loop)

LLM が「観測 → 思考 → 行動」のサイクルを繰り返し、完了・失敗・上限のいずれかの停止条件まで自律的に処理を続ける制御構造。→ [Agent ループ](docs/01-concepts/agent-loop.md)

### AI Agent(AI エージェント)

LLM を判断の中枢に置き、ツールを使いながら、目標達成までの手順を実行時に自律的に決めて実行するシステム。→ [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)

### BYOK(Bring Your Own Key)

自分で契約したモデル API のキーをツールに持ち込んで使う方式。データの経路とモデル選択を利用者が制御でき、オープンソース系コーディングエージェントの標準形。→ [オープンソースのコーディングエージェント](docs/08-coding-agents/open-source-coding-agents.md)

### Human-in-the-Loop(HITL)

人間の判断(事前承認・事後レビュー・エスカレーション・監視と中断)を Agent の実行フローに組み込む設計。→ [Human-in-the-Loop 設計](docs/02-architecture/human-in-the-loop.md)

### LLM-as-a-Judge

コードでは採点できない開放的な出力を、基準を与えた別の LLM に判定させる評価手法。judge 自体の検証(人手ラベルとの一致率測定)を前提とする。→ [LLM-as-a-Judge](docs/04-evaluation/llm-as-a-judge.md)

### MCP(Model Context Protocol)

ツールやデータソースを LLM アプリケーションに接続するための標準プロトコル。概要は [ツール使用](docs/01-concepts/tool-use.md)、接続の実務は [ツール接続標準(MCP とエコシステム)](docs/03-implementation/mcp-and-tool-protocols.md)

### RAG(検索拡張生成 / Retrieval-Augmented Generation)

外部の知識ソースを検索し、結果を LLM の入力に加えて回答の根拠にする手法。検索の判断を Agent に任せる構成は Agentic RAG と呼ばれる。→ [RAG と Agent の関係・使い分け](docs/01-concepts/rag-vs-agent.md)

### TTFT(Time To First Token)

最初のトークンが出るまでの時間。ストリーミング表示の体感と全体レイテンシを左右する主要指標の一つ。→ [レイテンシ最適化](docs/05-operations/latency-optimization.md)

### Workflow 型(ワークフロー)

処理手順を開発者がコードで固定し、LLM を各ステップの部品(分類・要約・生成など)として使う構成。Agent との対比概念。→ [Workflow 型 vs Agent 型の使い分け](docs/02-architecture/workflow-vs-agent.md)
