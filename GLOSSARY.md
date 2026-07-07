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

### エージェント ID(Agent Identity)

エージェントに人間・汎用サービスアカウントと区別された固有のアイデンティティを与え、委任・権限・監査の単位にする考え方。2026 年時点で専用標準は未成立で、OAuth の委任表現と各社の ID 管理機能を組み合わせて実現する。→ [エージェントの認証・認可](docs/06-security/agent-identity-and-auth.md)

### エージェントベンチマーク(Agent Benchmark)

エージェントの能力を測る公開ベンチマーク(コーディング・Web / コンピュータ操作・汎用アシスタント・対話ツール使用などのカテゴリがある)。ハーネス依存・汚染・飽和という限界を踏まえ、選定の参考情報として使い、自社品質は自前の評価で測る。→ [エージェントベンチマークの全体像](docs/04-evaluation/agent-benchmarks-landscape.md)

### オーケストレーション(Orchestration)

複数の LLM 呼び出しや Agent の実行順序とデータの流れを制御すること。直列・並列・ルーティングなどの定番パターンがある。→ [オーケストレーションパターン](docs/02-architecture/orchestration-patterns.md)

### オープンウェイト(Open Weights)

モデルの重みが公開され、ダウンロードして自社インフラでホストできる LLM。ライセンス条件はモデルごとに大きく異なり、「オープン = 自由に商用可」ではない。→ [主要 LLM の全体像](docs/03-implementation/llm-landscape.md)

### 音声エージェント(Voice Agent)

音声で対話しツールで行動するエージェント。STT → LLM → TTS のパイプライン型と、音声を直接入出力する speech-to-speech 型の 2 アーキテクチャがあり、レイテンシ・ターンテイキング・中間テキストの制御性で選ぶ。→ [音声エージェントの実装](docs/03-implementation/voice-agents.md)

### オンライン評価(Online Evaluation)

本番トラフィック上で品質シグナル(タスク成功の代理指標・フィードバック・サンプリング採点)を測る評価。手元のデータセットで測るオフライン評価を補完し、A/B テストやカナリアで真の効果を確定する。→ [オンライン評価と A/B テスト](docs/04-evaluation/online-evaluation-and-ab-testing.md)

### ガードレール(Guardrails)

モデルの判断の外側でコードとして強制される制御。入力・出力・アクションの 3 層に配置し、プロンプトでの指示(お願い)と区別される。→ [ガードレール](docs/06-security/guardrails.md)

### ガードレールメトリクス(Guardrail Metrics)

改善実験で主指標を追う一方、「悪化してはいけない」指標として監視するもの(コスト・レイテンシ・エラー率・安全性逸脱など)。主指標が上がっても閾値を超えたら失敗と見なす。→ [オンライン評価と A/B テスト](docs/04-evaluation/online-evaluation-and-ab-testing.md)

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

### 幻覚(Hallucination)

モデルが事実でない内容をもっともらしく生成する現象。「もっともらしい続きを生成する」という学習目的の自然な帰結であり、対策は指示の強化ではなく、根拠の外部供給(RAG)・出典要求・検証という構造側にある。→ [LLM の学習パイプライン(事前学習から選好調整まで)](docs/10-llm-foundations/llm-training-pipeline.md)

### 権限反映検索(Permission-aware Retrieval)

RAG の検索段で、質問したユーザーのアクセス権を必須フィルタとして反映し、権限外の文書を候補から構造的に除外する仕組み。生成段で伏せる方式は権限外の内容がプロンプトに載った時点で漏えいリスクになるため、検索基盤の層で強制する。→ [RAG 実装パターン](docs/03-implementation/rag-implementation-patterns.md)

### 合成データ(Synthetic Data)

LLM に生成させた評価・学習用のデータ。量とバリエーションを安く稼げる一方、分布の偏りと盲点の共有(生成モデルと評価対象が同系だと弱点が現れない)に注意が必要。→ [評価データセットの構築と保守](docs/04-evaluation/evaluation-datasets.md)

### 構造化出力(Structured Output)

LLM の出力を JSON Schema などの機械可読なスキーマに従わせる技術。後続の処理がコードである出力(分類・抽出・スコア)に使う。→ [構造化出力](docs/03-implementation/structured-output.md)

### コーディングエージェント(Coding Agent)

コードベースを読み、ファイルを編集し、コマンドを実行して検証するループで開発タスクを遂行する Agent。コード補完と異なり「タスク単位の委任」を受けられる。→ [AI コーディングエージェントの分類と全体像](docs/08-coding-agents/coding-agents-overview.md)

### ゴールデンセット(Golden Set)

正解・合格基準がアノテーション済みで、リリース判定や回帰テストの基準として層別・バージョン管理されながら維持される評価ケース集合。→ [評価データセットの構築と保守](docs/04-evaluation/evaluation-datasets.md)

### コンテキストエンジニアリング(Context Engineering)

LLM に渡す情報の全体(システムプロンプト・ツール定義・履歴・資料・状態)を、構成要素の選択・配置・ライフサイクルとして設計する営み。→ [コンテキストエンジニアリング](docs/02-architecture/context-engineering.md)

### コンパクション(Compaction)

コンテキスト上限に近づいた際に、会話履歴を要約・圧縮して容量を確保する仕組み。コーディングエージェントでは品質とコストの両方に影響する。→ [コーディングエージェントのコスト最適化](docs/08-coding-agents/coding-agent-cost-optimization.md)

### コンピュータ操作型 Agent(Computer Use Agent)

画面(スクリーンショット)を観測し、マウス・キーボード操作で GUI を直接操作する Agent の類型。→ [コンピュータ操作型・マルチモーダル Agent](docs/01-concepts/computer-use-and-multimodal-agents.md)

### サンドボックス(Sandbox)

モデルが生成したコードの実行やコンピュータ操作を、本番システムから隔離された使い捨て環境(ネットワーク・資源制限付き)で行う仕組み。→ [ツール権限設計とサンドボックス](docs/06-security/tool-permissions-and-sandboxing.md)

### 静かな失敗(Silent Failure)

エラーを出さずに完走しながら、誤った結果を返す・誤った副作用を残す失敗。技術メトリクスに現れないため、品質シグナルによる検知設計が必要になる。→ [可観測性とトレーシング](docs/05-operations/observability-and-tracing.md)

### 蒸留(Distillation)

上位モデル(教師)の出力を学習データにして、小型モデル(生徒)をファインチューニングする手法。品質が確認できた特定タスクを、小型モデルで安く速く量産するためのコスト削減手段。→ [ファインチューニングと蒸留](docs/03-implementation/fine-tuning-and-distillation.md)

### ストリーミング(Streaming)

LLM の応答を生成と同時に逐次受信・表示する方式。Agent の体感品質を左右する基本技術。→ [ストリーミングと Agent の UX 実装パターン](docs/03-implementation/streaming-and-agent-ux.md)

### 選好調整(Preference Tuning)

複数の応答への人間(または AI)の選好から「良い応答」の基準を学ばせる LLM の学習工程(RLHF・DPO など)。有用さ・無害さ・トーンを形作る一方、迎合(sycophancy)や過剰な拒否の由来にもなる。→ [LLM の学習パイプライン(事前学習から選好調整まで)](docs/10-llm-foundations/llm-training-pipeline.md)

### 耐久実行(Durable Execution)

実行の各ステップの結果を永続ログに記録し、障害後は完了済みステップをスキップして途中から再開できる実行モデル。LLM 呼び出しなどの非決定的な処理を「結果が記録される単位」に隔離するのが要点。→ [非同期・長時間タスクの設計(耐久実行)](docs/02-architecture/async-and-durable-agents.md)

### チェックポイント(Checkpoint)

長時間タスクの「ここまで完了した」を再開可能な形で永続化したもの。ツール実行の完了やフェーズ境界などの意味のある単位で切る。信頼性とトークンコスト制御の両方の仕組み。→ [非同期・長時間タスクの設計(耐久実行)](docs/02-architecture/async-and-durable-agents.md)

### 致命的三重奏(Lethal Trifecta)

非公開データへのアクセス・信頼できないコンテンツへの接触・外部への送信能力の 3 つが 1 つの Agent に揃うと、データ持ち出しが構造的に可能になるという設計チェックの枠組み。→ [Agent の脅威モデル概観](docs/06-security/threat-model-overview.md)

### チャンキング(Chunking)

RAG の取り込みで、文書を検索・投入の単位に分割すること。分割のサイズと境界(構造・意味)の設計が検索品質の上限を決める。→ [RAG 実装パターン](docs/03-implementation/rag-implementation-patterns.md)

### ツール使用(Tool Use / Function Calling)

LLM が検索・API 呼び出し・コード実行などの外部機能を呼び出して行動する仕組み。Agent を Agent たらしめる中核機構。→ [ツール使用](docs/01-concepts/tool-use.md)

### データ漏えい(Data Exfiltration)

Agent を経由して機微データが外部に出ること。間接プロンプトインジェクションによる攻撃系と、権限・ログ設計の不備による事故系がある。→ [データ漏えい対策](docs/06-security/data-exfiltration.md)

### トークナイザ(Tokenizer)

テキストとトークン列を相互変換する部品。分割のされ方は言語・内容で大きく変わり、モデル(世代)ごとに異なるため、コスト・コンテキストの見積りは公式のカウント手段による実測を正とする。→ [トークナイザとトークン経済](docs/10-llm-foundations/tokenization.md)

### 評価ハーネス(Evaluation Harness)

Agent の評価を繰り返し実行可能にする仕組み一式。データセット・実行系・採点系・レポートの 4 点で構成される。→ [Agent 評価の基礎](docs/04-evaluation/agent-evaluation-basics.md)

### ファインチューニング(Fine-tuning)

既存モデルの重みを自分のデータで追加調整すること。知識の注入には向かず、形式・文体・ドメイン特化の挙動を安定させる手段。プロンプト・RAG・モデル変更を尽くした後の最後の手段になりやすい。→ [ファインチューニングと蒸留](docs/03-implementation/fine-tuning-and-distillation.md)

### フィードバックループ(Feedback Loop)

利用者からの明示シグナル(評価ボタン)と暗黙シグナル(修正・再試行・放棄)を収集し、評価データセットと改善へ還流させる循環。収集だけでなくトリアージと還流の運用まで含めて 1 つの仕組み。→ [フィードバックループの運用](docs/05-operations/feedback-loops.md)

### フィジカル AI(Physical AI)

物理世界を知覚し、物理世界に対して行動する AI の総称。2023 年以降は視覚・言語基盤モデルを行動出力に拡張するアプローチ(VLA)が主流で、ソフトウェア Agent と同型の「計画層 + 実行層」構造が現れている。→ [フィジカル AI とロボティクスの概観](docs/01-concepts/physical-ai-overview.md)

### プランニング(Planning)

タスクをステップに分解し、実行順序を決め、進捗に応じて見直す働き。逐次判断・事前計画・リフレクションの 3 パターンが基本形。→ [プランニングと推論](docs/01-concepts/planning-and-reasoning.md)

### プロンプトインジェクション(Prompt Injection)

モデルへの入力に紛れ込ませた指示で、開発者の意図した挙動を上書きする攻撃。ユーザー入力による直接型と、Agent が読む外部コンテンツ経由の間接型がある。→ [プロンプトインジェクション](docs/06-security/prompt-injection.md)

### プロンプトエンジニアリング(Prompt Engineering)

モデルへの入力(指示・例・データ・形式)を設計して、出力の品質・形式・安定性を高める技法の総称。技法の効果はモデル世代で変わるため、評価で検証してから採用する。→ [プロンプトエンジニアリングの基礎技法](docs/03-implementation/prompt-engineering-fundamentals.md)

### プロンプトキャッシュ(Prompt Caching)

プロンプトの固定部分(前方一致)の処理結果を再利用し、入力コストと応答開始までの時間を削減する仕組み。固定部分を先頭に置くプロンプト構造が前提。→ [コスト管理](docs/05-operations/cost-management.md)

### 冪等性(Idempotency)

同じ操作を複数回実行しても結果が 1 回の実行と変わらない性質。再送・再開が前提の Agent 基盤では、内部のステップ実行と API 契約(冪等キー)の両方の層で必要になる。→ 内部は [非同期・長時間タスクの設計(耐久実行)](docs/02-architecture/async-and-durable-agents.md)、API 契約は [エージェントの API 設計](docs/02-architecture/agent-api-design.md)

### ヘッドレス実行(Headless Execution)

対話 UI を介さず、エージェントを 1 コマンド(非対話モード)で実行して結果を受け取る方式。スクリプト・CI からの自動化の基本要素。→ [自動化・業務効率化パターン](docs/08-coding-agents/coding-agent-automation-patterns.md)

### マルチエージェント(Multi-Agent)

複数の Agent ループが、それぞれ独立したコンテキストを持って分担・協調する構成。→ [シングルエージェントとマルチエージェント](docs/01-concepts/single-vs-multi-agent.md)

### マルチテナント(Multi-tenancy)

複数のテナント(顧客・部門)が同一の Agent 基盤を共有する構成。データ・プロンプト設定・レート容量・コストの 4 軸で分離を設計し、クロステナント混入とノイジーネイバーを構造的に防ぐ。→ [マルチテナント設計](docs/02-architecture/multi-tenancy-and-isolation.md)

### マルチモーダル(Multimodal)

テキスト以外の入力(画像・音声など)を理解できるモデルの能力。コンピュータ操作型 Agent の前提となる。→ [コンピュータ操作型・マルチモーダル Agent](docs/01-concepts/computer-use-and-multimodal-agents.md)

### メモリ(Memory)

Agent が「覚えている」ように見えるデータの総称。短期記憶(コンテキスト)・作業状態・長期記憶(外部ストレージ)の 3 層に分けて設計する。→ [メモリと状態管理](docs/01-concepts/memory-and-state.md)

### リランキング(Reranking)

一次検索で広めに取った候補を、より精密なモデルで並べ直して上位数件に絞る 2 段目の検索処理。一次検索が再現率を、リランキングが精度を担当する分業になる。→ [RAG 実装パターン](docs/03-implementation/rag-implementation-patterns.md)

### ルールファイル(Rules File)

コーディングエージェントがセッション開始時に読み込む、プロジェクト固有の指示書(AGENTS.md・CLAUDE.md など)。恒常的な規約を毎回の依頼文から分離する。→ [ルールファイルと設定の設計](docs/08-coding-agents/coding-agent-rules-and-config.md)

### レッドチーミング(Red Teaming)

脅威モデルを机上で終わらせず、実際に攻撃を試して防御の穴を見つける演習。エージェントでは有害な出力よりも、騙されたモデルが権限で有害な行動を取れるかに重心を置く。→ [エージェントのレッドチーミング](docs/06-security/red-teaming-agents.md)

## A–Z

### A2A(Agent2Agent Protocol)

組織・システムの境界を越えてエージェント同士が発見・通信・タスク委譲を行うための標準プロトコルの一つ。2026 年時点では成熟途上。→ [オーケストレーションパターン](docs/02-architecture/orchestration-patterns.md)

### Agent ループ(Agent Loop)

LLM が「観測 → 思考 → 行動」のサイクルを繰り返し、完了・失敗・上限のいずれかの停止条件まで自律的に処理を続ける制御構造。→ [Agent ループ](docs/01-concepts/agent-loop.md)

### AI Agent(AI エージェント)

LLM を判断の中枢に置き、ツールを使いながら、目標達成までの手順を実行時に自律的に決めて実行するシステム。→ [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)

### BYOK(Bring Your Own Key)

自分で契約したモデル API のキーをツールに持ち込んで使う方式。データの経路とモデル選択を利用者が制御でき、オープンソース系コーディングエージェントの標準形。→ [オープンソースのコーディングエージェント](docs/08-coding-agents/open-source-coding-agents.md)

### Few-shot(少数例示)

期待する入出力の例をプロンプトに数個含め、形式・粒度・判断基準を伝える技法。例が仕様書として働く一方、例の偏りは出力の偏りになり、毎回のトークンコストにもなる。→ [プロンプトエンジニアリングの基礎技法](docs/03-implementation/prompt-engineering-fundamentals.md)

### Human-in-the-Loop(HITL)

人間の判断(事前承認・事後レビュー・エスカレーション・監視と中断)を Agent の実行フローに組み込む設計。→ [Human-in-the-Loop 設計](docs/02-architecture/human-in-the-loop.md)

### KV キャッシュ(KV Cache)

生成中に各トークンの中間表現(Key / Value)を保存・再利用する仕組みで、プロンプトキャッシュの実体。中間表現は先頭からの並びに依存するため、キャッシュは前方一致でしか効かない。→ [注意機構とコンテキストウィンドウの仕組み](docs/10-llm-foundations/attention-and-context.md)

### LLM-as-a-Judge

コードでは採点できない開放的な出力を、基準を与えた別の LLM に判定させる評価手法。judge 自体の検証(人手ラベルとの一致率測定)を前提とする。→ [LLM-as-a-Judge](docs/04-evaluation/llm-as-a-judge.md)

### MCP(Model Context Protocol)

ツールやデータソースを LLM アプリケーションに接続するための標準プロトコル。概要は [ツール使用](docs/01-concepts/tool-use.md)、接続の実務は [ツール接続標準(MCP とエコシステム)](docs/03-implementation/mcp-and-tool-protocols.md)

### MoE(Mixture of Experts)

推論のたびに一部のパラメータ(エキスパート)だけを起動するモデル構造。総パラメータ(メモリ要件)とアクティブパラメータ(速度・計算量)を分けて評価する必要がある。→ [主要 LLM の全体像](docs/03-implementation/llm-landscape.md)

### PoC(概念実証 / Proof of Concept)

本番導入を判断するために必要な「問い」を、期間を区切って検証する使い捨て前提の試作。デモの成功ではなく、本物のデータ分布での測定結果を成果物とする。→ [PoC から本番への進め方](docs/09-business/poc-to-production.md)

### RAG(検索拡張生成 / Retrieval-Augmented Generation)

外部の知識ソースを検索し、結果を LLM の入力に加えて回答の根拠にする手法。検索の判断を Agent に任せる構成は Agentic RAG と呼ばれる。→ [RAG と Agent の関係・使い分け](docs/01-concepts/rag-vs-agent.md)

### SFT(教師ありファインチューニング / Supervised Fine-tuning)

「指示 → 望ましい応答」の模範例で LLM を追加学習させ、指示に従う振る舞いの形式を教える学習工程。新しい知識の注入ではなく、既にある能力を応答の形に整えることが本質。→ [LLM の学習パイプライン(事前学習から選好調整まで)](docs/10-llm-foundations/llm-training-pipeline.md)

### TTFT(Time To First Token)

最初のトークンが出るまでの時間。ストリーミング表示の体感と全体レイテンシを左右する主要指標の一つ。→ [レイテンシ最適化](docs/05-operations/latency-optimization.md)

### VLA(Vision-Language-Action)モデル

視覚・言語の基盤モデルをロボットの実演データで拡張し、視覚入力と言語指示から直接ロボットの行動を出力するモデル。2026 年時点のフィジカル AI の中核類型で、共通ベンチマークは未確立のため性能の横並び比較はできない。→ [フィジカル AI とロボティクスの概観](docs/01-concepts/physical-ai-overview.md)

### Workflow 型(ワークフロー)

処理手順を開発者がコードで固定し、LLM を各ステップの部品(分類・要約・生成など)として使う構成。Agent との対比概念。→ [Workflow 型 vs Agent 型の使い分け](docs/02-architecture/workflow-vs-agent.md)
