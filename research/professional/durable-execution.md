# 耐久実行(durable execution)・ワークフローエンジンの AI エージェント文脈での動向 調査メモ

- **調査日**: 2026-07-06
- **調査目的**: `docs/02-architecture/async-and-durable-agents.md`(非同期・長時間タスクの設計)の執筆材料。記事本体は原則(チェックポイント・再開・冪等性・承認待ちの永続化)を扱い、フレームワーク動向は「2026-07 時点の概観 + TODO 前提」で軽く触れる方針。そのため本メモは「各エンジンが何を保証し、AI エージェント向けに何を公式に提供・表明しているか」に絞る
- **根拠の方針**: 各社公式ドキュメント(docs.temporal.io / learn.temporal.io / python.temporal.io / docs.restate.dev / inngest.com/docs / agentkit.inngest.com / developers.cloudflare.com / docs.aws.amazon.com / learn.microsoft.com / docs.langchain.com / openai.github.io)と公式ブログのみを根拠とします。個人ブログ・比較記事は使用していません
- **確度表記**: 「公式明記」= 公式ページに明文あり(URL に実際にアクセスして本文を確認済み) / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず(直接アクセス不可を含む)

---

## 1. 耐久実行の定義と保証(エンジン横断)

### 1.1 Temporal

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Temporal は durable execution を「アプリケーションが完走することを保証する(guaranteeing that it will run to completion)」能力として定義。Workflow Execution のライフサイクルで起きたすべてを記録する完全で永続的なログ = **Event History** を保持する | https://docs.temporal.io/evaluate/understanding-temporal | 2026-07-06 | 公式明記 |
| Worker がクラッシュすると、Event History を使ってコードを **replay** し、クラッシュ直前の状態を再現してから続行する。Workflow は外部作用を直接実行せず **Command** を発行し、Command は Event にマッピングされて永続化される | https://docs.temporal.io/evaluate/understanding-temporal | 2026-07-06 | 公式明記 |
| **Activity** は「Workflow 内の個々の作業単位」で、外部システムとの相互作用を担う。失敗時は設定に基づき自動再試行され、再試行の頻度・回数は開発者が完全に制御できる | https://docs.temporal.io/evaluate/understanding-temporal | 2026-07-06 | 公式明記 |
| **決定性要件**: 「Workflow コードは、同じ入力に対して常に同じ Workflow API 呼び出しを同じ順序で行わなければならない」。replay 時に生成された Command が既存の Event History と比較され、不一致なら **non-determinism error** になる | https://docs.temporal.io/workflow-definition | 2026-07-06 | 公式明記 |
| 非決定性の原因は (1) 実行中 Workflow がある状態でのコード変更、(2) 現在時刻・乱数などへの分岐依存。対策として SDK が提供する時刻・乱数・外部データ取得用 API を使う(結果が Event History に保存される)。Activity のスケジュール、Timer 開始、Child Workflow 起動などの Command を生む操作は、バージョニングなしに並べ替え・追加・削除してはならない | https://docs.temporal.io/workflow-definition | 2026-07-06 | 公式明記 |
| 外部からの入力手段は **Signal**(非同期)、**Update**(同期、ハンドラの結果を呼び出し元へ返す)、**Query**(読み取り専用、完了後の Workflow にも送れる)。Signal-With-Start で「未起動なら起動して Signal を送る」遅延初期化が可能 | https://docs.temporal.io/sending-messages | 2026-07-06 | 公式明記 |
| Event History の上限は **1 Workflow Execution あたり 51,200 イベントまたは 50 MB**。10,240 イベントまたは 10 MB で警告が出る | https://docs.temporal.io/workflow-execution/limits | 2026-07-06 | 公式明記 |
| 上限接近時の公式推奨対策(Continue-As-New で履歴をリセットする等)は、上記 limits ページの取得範囲では明記を確認できず | — | 2026-07-06 | 未確認 |

### 1.2 Restate

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Restate は durable execution を「ビジネスロジックの書き方を変えずに、任意のコード実行を信頼性のある耐障害なものにする能力」と定義。コード実行の各ステップを **journal(ジャーナル)** に記録し、「操作とその結果」の両方を保存する | https://docs.restate.dev/concepts/durable_execution/ | 2026-07-06 | 公式明記 |
| 「関数がクラッシュ・失敗すると、Restate はジャーナルを replay し、完了済みステップをスキップして中断箇所から正確に再開する」。インフラ障害、API タイムアウト、重複リクエスト(冪等性キー)、ネットワーク断・ゾンビプロセスへの耐性を掲げる | https://docs.restate.dev/concepts/durable_execution/ | 2026-07-06 | 公式明記 |
| **`ctx.run`** で「HTTP 呼び出しや DB 応答のような非決定的操作をラップし、結果を実行ログ(execution log)に保存する」。replay 時の決定性を守るための仕組み。`ctx.run` 内では Restate コンテキスト(`ctx.get`、`ctx.sleep`、ネストした `ctx.run` 等)は使用不可 | https://docs.restate.dev/develop/ts/journaling-results | 2026-07-06 | 公式明記 |
| `ctx.run` の失敗は既定で他のハンドラエラーと同様に再試行される(`TerminalError` を投げない限り)。`maxRetryAttempts` / `maxRetryDuration` 等で再試行ポリシーをカスタマイズでき、使い切ると `TerminalError` になり補償(compensation)パターンにつなげられる | https://docs.restate.dev/develop/ts/journaling-results | 2026-07-06 | 公式明記 |
| 外部シグナル待機は **Awakeable**。ハンドラが Awakeable を作成して ID と promise を受け取り、ID を外部システムへ渡して **suspend** する。外部からは SDK(`ctx.resolveAwakeable` / `ctx.rejectAwakeable`)または HTTP API(`/restate/awakeables/{id}/resolve`)で解決できる。「Restate の promise は永続的・分散的で、クラッシュを生き延びる」 | https://docs.restate.dev/develop/ts/awakeables | 2026-07-06 | 公式明記 |
| ジャーナルのサイズ上限・コストに関する公式記載 | — | 2026-07-06 | 未確認 |

### 1.3 Inngest

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Inngest は durable execution を「自動再試行と状態永続化により、失敗や中断をグレースフルに処理する耐障害なコード実行アプローチ」と定義 | https://www.inngest.com/docs/learn/how-functions-are-executed | 2026-07-06 | 公式明記 |
| 関数は **step** から構成される。step は「独立して実行・再試行できる作業単位」で、「成功済みの step は再実行されない」。全体 replay ではなく **step 単位のメモ化(memoization)**: 各 step の結果はマネージドな function state store に永続化され、再実行時は SDK が `step.run` の戻り値として保存済み結果を注入する | https://www.inngest.com/docs/learn/how-functions-are-executed | 2026-07-06 | 公式明記 |
| **決定性要件**: 「DB 呼び出しや API 呼び出しのような非決定的ロジックはすべて `step.run()` 内に置かなければならない」 | https://www.inngest.com/docs/learn/how-functions-are-executed | 2026-07-06 | 公式明記 |
| **`step.waitForEvent`** は特定イベントの受信まで関数を一時停止する。タイムアウト(例: 3 日)まで待ち、未受信なら `null` が返る。「AI エージェントワークフローで human in the loop を実装する」用途が公式に例示されている | https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event | 2026-07-06 | 公式明記 |

### 1.4 小括: 3 エンジンに共通する中核概念

- **実行の記録と再開**: 呼称は異なる(Temporal = Event History + replay / Restate = journal + replay / Inngest = step メモ化)が、いずれも「副作用の結果を永続ログに記録し、失敗後は完了済みの作業をスキップして再開する」点で一致します(公式明記の組み合わせ)。
- **決定性の扱い**: いずれも「オーケストレーション部分のコードは決定的でなければならず、非決定的な処理は結果が記録される単位(Activity / `ctx.run` / `step.run`)に隔離する」ことを要求します(各公式明記)。
- **待機プリミティブ**: 永続タイマー(sleep)と外部イベント待ち(Signal / Awakeable / waitForEvent)を全エンジンが提供します(セクション 4 参照)。

---

## 2. AI エージェント向けの公式ポジショニング(2026-07 時点)

### 2.1 Temporal

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Temporal は OpenAI Agents SDK(Python)との公式統合を提供。公式ブログ(2025-07-30 公開)で Public Preview を発表し、同ページの記載では **2026-03-23 に GA(一般提供)** となった。「すべてのエージェント呼び出しは Temporal Activity を通して実行される」「Temporal はアプリケーションの進捗を追跡し、すべての Activity 結果を保存する」。クラッシュ後の再開により「計算資源とトークンコストを節約できる」と明記 | https://temporal.io/blog/announcing-openai-agents-sdk-integration | 2026-07-06 | 公式明記 |
| Python SDK の `temporalio.contrib.openai_agents` モジュール: **モデル呼び出しは `ModelActivity` として Temporal Activity で実行**される。`OpenAIAgentsPlugin` をクライアントに設定して統合を有効化し、`activity_as_tool` で既存の Activity をエージェントのツールとして公開できる(Activity のシグネチャから OpenAI 互換のツールスキーマを自動生成) | https://python.temporal.io/temporalio.contrib.openai_agents.html | 2026-07-06 | 公式明記 |
| 公式チュートリアル「durable AI agent」: LLM 呼び出しとツール実行を Activity に置き(非決定的操作を Workflow ロジックから隔離)、**会話履歴を Workflow の状態として保持**する。ツール実行前のユーザー確認(confirm)を挟む構成も示される。「意思決定は Workflow、外部操作は Activity」という分離を明示 | https://learn.temporal.io/tutorials/ai/durable-ai-agent/ | 2026-07-06 | 公式明記 |
| docs.temporal.io に「AI Cookbook」セクション(`/ai-cookbook/openai-agents-sdk-python`、`/ai-cookbook/human-in-the-loop-python`、Vercel AI SDK 統合 `/develop/typescript/integrations/ai-sdk` 等)が存在することは検索結果のタイトルで確認できたが、直接アクセスは 404 となり本文を検証できなかった | https://docs.temporal.io/ai-cookbook | 2026-07-06 | 未確認(存在は検索結果のみ) |

**永続化対象(公式資料から)**: モデル呼び出し・ツール呼び出しの結果(Activity 結果として Event History に)、会話履歴(Workflow 状態として)、承認待ち(Signal/Update 待ちの Workflow として)。

### 2.2 Inngest(AgentKit / step.ai)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **AgentKit** は Inngest が開発する「単一のモデル推論呼び出しからツールを使うマルチエージェントシステムまでを構築するフレームワーク」。構成要素は **Agents / Networks / State / Routers** の 4 つ。State が「システムの進捗と共有コンテキストを追跡する永続メモリ」と位置づけられる | https://agentkit.inngest.com/overview | 2026-07-06 | 公式明記 |
| AgentKit の耐障害性が Inngest の durable execution に委譲されるかどうかは、overview ページ単体では明記を確認できず(Inngest Dev Server と組み合わせるとトレース・ログが得られるとの記載はあり) | https://agentkit.inngest.com/overview | 2026-07-06 | 公式から推測 |
| **`step.ai.infer()`** は推論リクエストを Inngest のインフラにオフロードし、完了まで関数実行を停止する(サーバーレスでは実行時間コストを節約)。**`step.ai.wrap()`** は既存 AI SDK(OpenAI、Anthropic、Vercel AI SDK)の呼び出しを step としてラップする(TypeScript のみ)。step 化により再試行・再開と AI 呼び出しの観測(プロンプト・トークンの監視)が得られる | https://www.inngest.com/docs/features/inngest-functions/steps-workflows/step-ai-orchestration | 2026-07-06 | 公式明記 |
| `step.waitForEvent` の公式ドキュメントが「AI エージェントワークフローの human in the loop」を明示的なユースケースとして挙げる | https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event | 2026-07-06 | 公式明記 |

**永続化対象**: 各 step(LLM 呼び出し含む)の結果は function state store に保存。会話状態は AgentKit の Network State として管理。

### 2.3 Restate

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Restate は公式ドキュメントに AI 専用セクション(`/ai`)を持つ。「LLM 呼び出しを `ctx.run()` でラップして耐久化する」「すべての LLM 呼び出しとツール実行ステップを永続化し、失敗時は中断箇所から再開する」と明記 | https://docs.restate.dev/ai | 2026-07-06 | 公式明記 |
| 公式パターン集: **Durable Agents**(クラッシュから自動回復)、**Durable Sessions**(会話コンテキストを Restate の K/V ストアに保存、並行制御つき)、**Human-in-the-Loop Approvals**、**Multi-Agent Orchestration**、**Observability & Control**(スタックしたエージェントのキャンセル等)の 5 つ + 並列化・割り込み・ロールバック等 | https://docs.restate.dev/ai | 2026-07-06 | 公式明記 |
| 任意の LLM SDK(OpenAI、Anthropic、Vercel AI SDK、Google Gen AI、LiteLLM)を利用可能で、上位フレームワーク(Vercel AI SDK、OpenAI Agents SDK、Google ADK、Pydantic AI、LangChain)との統合ガイドを公式提供 | https://docs.restate.dev/ai | 2026-07-06 | 公式明記 |

**永続化対象**: LLM 呼び出し結果・ツール実行結果(ジャーナル)、会話セッション(K/V ストア)、承認待ち(Awakeable)。

### 2.4 Cloudflare(Workflows / Durable Objects / Agents SDK)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Workflows** は「Cloudflare Workers 上で耐久性のあるマルチステップアプリケーションを構築する」機能。「複数ステップの連鎖、失敗タスクの自動再試行、分〜数週間にわたる状態の永続化」を掲げ、`step.sleep()` / `step.sleepUntil()` と外部イベント待ちを提供。ユースケースの筆頭に「信頼性のある AI アプリケーション」を明記 | https://developers.cloudflare.com/workflows/ | 2026-07-06 | 公式明記 |
| Workflows の **`step.waitForEvent`**: 既定タイムアウト 24 時間、**1 秒〜365 日**の範囲で指定可能。イベントは Workers API の `instance.sendEvent` または REST API で送信し、`waitForEvent` 到達前に送られたイベントもバッファされて配送される(`type` の一致が必要) | https://developers.cloudflare.com/workflows/build/events-and-parameters/ | 2026-07-06 | 公式明記 |
| **Agents SDK** は「永続メモリ・リアルタイム WebSocket・スケジュールタスクを持つステートフル AI エージェント」を構築・ホストするための SDK。「各エージェントセッションは永続的なアイデンティティ、ローカル SQL ストレージ、リアルタイム接続、スケジュールされた作業、回復可能な実行を持つ」 | https://developers.cloudflare.com/agents/ | 2026-07-06 | 公式明記 |
| 「**`Agent` クラスは `DurableObject` の拡張であり、エージェントは Durable Object そのもの**」(継承チェーンは DurableObject > Server > Agent)。ハイバネーション(既定有効)中も WebSocket 接続は維持され、Durable Object は無活動 70〜140 秒程度で退避(evict)される。`keepAliveWhile()` で長時間処理中の退避を防ぐ | https://developers.cloudflare.com/agents/concepts/agent-class/ | 2026-07-06 | 公式明記 |
| 状態永続化: 「各エージェントインスタンスは自身の SQL(SQLite)データベースを同一コンテキスト内に持つ」。`setState()` が SQLite への保存・全クライアントへのブロードキャスト・`onStateChanged()` 起動を行い、「状態は自動的に SQLite に保存され、再起動とハイバネーションを生き延びる」。会話履歴は SQL テーブルで管理する例が公式に示される | https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/ | 2026-07-06 | 公式明記 |
| **human-in-the-loop**: エージェントが「実行を一時停止し、人間の承認・確認・入力を待つ」ための公式ガイドあり。推奨は 2 パターン: (1) Workflows の承認ゲート(`waitForApproval()`、「数時間・数日・数週間待てる」、タイムアウト設定で無期限待機を防止)、(2) MCP の elicitation(`elicitInput()`)。承認の監査ログを SQL に記録することを推奨 | https://developers.cloudflare.com/agents/concepts/human-in-the-loop/ | 2026-07-06 | 公式明記 |

**永続化対象**: エージェント状態・会話履歴(Durable Object 内蔵 SQLite)、マルチステップ実行の進捗(Workflows の step 状態)、承認待ち(Workflows のイベント待ち)。

### 2.5 AWS Step Functions

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Step Functions は **Amazon Bedrock との最適化統合(optimized integration)** を提供: `InvokeModel`(推論)と `CreateModelCustomizationJob`(ファインチューニング、`.sync` 対応)。`InvokeModel` には S3 参照用の `Input` / `Output` フィールドが追加されており、**ペイロードが 256 KiB を超える場合は S3 経由を推奨**。プロンプトチェーンのサンプルプロジェクトも公式提供 | https://docs.aws.amazon.com/step-functions/latest/dg/connect-bedrock.html | 2026-07-06 | 公式明記 |
| サービス統合パターンは 3 種: **Request Response**、**Run a Job(`.sync`)**、**Wait for Callback(`.waitForTaskToken`)**。Bedrock は `.sync` と `.waitForTaskToken` の両方に対応。**Amazon Bedrock AgentCore も最適化統合の一覧に掲載**(Request Response のみ) | https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html | 2026-07-06 | 公式明記 |
| `.waitForTaskToken` は「人間の承認待ち、サードパーティ統合、レガシーシステム呼び出し」のためにワークフローを一時停止するパターンと明記。タスクトークン(`$$.Task.Token`)を外部へ渡し、`SendTaskSuccess` / `SendTaskFailure` が返るまで待つ。**実行の 1 年サービスクォータまで待機可能**。`HeartbeatSeconds` でスタック検出(未達なら `States.Timeout`)。Express Workflows は Request Response のみ対応 | https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html | 2026-07-06 | 公式明記 |
| Step Functions の実行履歴イベント数上限(25,000 イベント等)の一次情報 | — | 2026-07-06 | 未確認(今回のページでは確認せず) |

**永続化対象**: 状態マシンの実行状態と各 Task の入出力(LLM 応答含む)。会話状態の管理は Step Functions 自体の機能ではなく、状態データ or S3 で扱う設計になる(公式から推測)。

### 2.6 Azure(Durable Functions / Durable Task / Microsoft Agent Framework)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Durable Functions は「オーケストレーター・アクティビティ・エンティティ関数をコードで書き、サーバーレス環境でステートフルなワークフローを構築する」Azure Functions の拡張。「ランタイムが状態・チェックポイント・再試行・回復を管理する」。スタンドアロンの Durable Task SDK / Durable Task Scheduler という選択肢も公式に案内 | https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview | 2026-07-06 | 公式明記 |
| **決定性制約**: オーケストレーターは event sourcing により複数回 replay されるため決定的でなければならない。現在時刻(`CurrentUtcDateTime` 等の代替 API を使用)、GUID/UUID(`NewGuid()` 等)、乱数、I/O・HTTP、環境変数、静的変数、スレッド API、独自の async 操作はオーケストレーター内で禁止。**非決定的な処理はアクティビティ関数に置く**(アクティビティの戻り値は履歴に保存されるため replay 安全) | https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-code-constraints | 2026-07-06 | 公式明記 |
| **外部イベント**: `WaitForExternalEvent` で「人間の対話(human interaction)や外部トリガー」を待てる。送信側は `RaiseEventAsync`(または HTTP API)。配送は **at-least-once** のため一意 ID による重複排除を推奨。Consumption プランでは待機中の課金なし。「現実の承認シナリオでは durable timer とレースさせてタイムアウトを設ける」ことを公式にベストプラクティスとして明記 | https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-external-events | 2026-07-06 | 公式明記 |
| **Durable Task extension for Microsoft Agent Framework**: エージェントを登録するだけで「永続セッション・組み込み API エンドポイント・分散スケーリングを持つ durable なエージェント」になる。「永続的会話状態(プロセスクラッシュ・再起動・スケーリングを生き延びる)」「自動チェックポイントつきマルチエージェントオーケストレーション(完了済みエージェント呼び出しは回復時に再実行されない)」「数時間〜数週間の human-in-the-loop 承認」を掲げる。各エージェントセッションは durable entity として実装(entity-based agent loop) | https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-microsoft-agent-framework | 2026-07-06 | 公式明記 |
| 同拡張の HITL: ワークフローの一時停止ポイントを .NET は `RequestPort`、Python は `ctx.request_info()` で定義。承認用の HTTP エンドポイント(run / status / respond)が自動生成される | https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-microsoft-agent-framework | 2026-07-06 | 公式明記 |
| 同拡張の制約(公式明記): Durable Task Scheduler 使用時の **エンティティ状態(会話履歴含む)上限は 1 MB** で、履歴の圧縮(compaction)は手動(新セッション + 要約)。セッション TTL は既定 14 日(失効で会話履歴も削除)。すべてのやり取りが Scheduler 経由になるためインメモリ実行よりレイテンシが増える。ストリーミングは entity の request/response モデル上、コールバック経由 | https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-microsoft-agent-framework | 2026-07-06 | 公式明記 |

**永続化対象**: 会話状態(durable entity)、エージェント呼び出し・ツール呼び出しのチェックポイント(オーケストレーション履歴)、承認待ち(外部イベント / RequestPort)。

---

## 3. エージェントフレームワーク側のチェックポイント機能

### 3.1 LangGraph

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| LangGraph の永続化は 2 層: **checkpointer**(スレッド内のグラフ状態スナップショットを保存。「会話の継続、human-in-the-loop、タイムトラベル、耐障害性」を支える)と **store**(スレッド横断の K/V データ。ユーザー設定や事実の長期記憶)。スレッドは `thread_id` で識別 | https://docs.langchain.com/oss/python/langgraph/persistence | 2026-07-06 | 公式明記 |
| checkpointer のバックエンドとして `InMemorySaver`(非永続)、`SqliteSaver`、`PostgresSaver` / `AsyncPostgresSaver`(本番向け)が公式提供 | https://docs.langchain.com/oss/python/langgraph/persistence | 2026-07-06 | 公式明記 |
| **durability mode** は 3 段階: `"exit"`(グラフ終了時のみ永続化。最速だが実行中のクラッシュから回復不可)、`"async"`(次ステップ実行と並行して非同期書き込み。既定。クラッシュ時に書き込み漏れの小さいリスク)、`"sync"`(次ステップ開始前に同期書き込み。最高の耐久性)。`graph.stream(..., durability="sync")` のように指定 | https://docs.langchain.com/oss/python/langgraph/durable-execution | 2026-07-06 | 公式明記(ページは JS レンダリングのため本文全文は取得できず、検索結果に表示された同ページの記述で確認) |
| durable-execution ページにあるとされる決定性ガイダンス(副作用・非決定的操作を task/node にラップする等)の原文 | https://docs.langchain.com/oss/python/langgraph/durable-execution | 2026-07-06 | 未確認(本文を直接取得できず) |
| **`interrupt()`**: 「グラフ実行を任意の地点で一時停止し、外部入力を待つ」。「interrupt が発生すると、LangGraph は永続化レイヤーでグラフ状態を保存し、再開されるまで**無期限に**待つ」。再開は同じ `thread_id` で `Command(resume=...)` を渡し、「`Command(resume=...)` に渡した値が `interrupt()` の戻り値になる」 | https://docs.langchain.com/oss/python/langgraph/interrupts | 2026-07-06 | 公式明記 |

### 3.2 OpenAI Agents SDK

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Sessions** は複数のエージェント実行(run)にまたがる**会話履歴**を自動保持する機能。保存対象はユーザーメッセージ・アシスタント応答・ツール呼び出しと結果など。実行前に履歴を自動取得して入力に前置し、実行後に新規アイテムを自動保存する | https://openai.github.io/openai-agents-python/sessions/ | 2026-07-06 | 公式明記 |
| バックエンド: `SQLiteSession`、`OpenAIConversationsSession`(OpenAI サーバー管理)、拡張として SQLAlchemy / Redis / MongoDB / Dapr / 暗号化ラッパー等 | https://openai.github.io/openai-agents-python/sessions/ | 2026-07-06 | 公式明記 |
| Sessions は「会話履歴の永続化」であり、**実行途中の進捗(ツール実行の再開等)を保証する durable execution ではない**。sessions ページに durable execution / Temporal への言及はない。durable 化は Temporal 側の統合(セクション 2.1)として提供される | https://openai.github.io/openai-agents-python/sessions/ | 2026-07-06 | 公式明記(言及がないことの確認)+ 公式から推測(位置づけの整理) |
| OpenAI 公式ドキュメント側から Temporal 統合へ言及しているページの有無 | — | 2026-07-06 | 未確認 |

---

## 4. human-in-the-loop の待機プリミティブ(一覧)

すべて「プロセスを占有せずに承認待ちを永続化できる」公式機能です。

| エンジン / FW | プリミティブ名 | 待機可能期間 | 解決方法 | 出典 URL(確認日: 2026-07-06、確度: 公式明記) |
| --- | --- | --- | --- | --- |
| Temporal | Signal / Update | 明示の上限記載なし(Workflow が待ち続ける) | Client / CLI / 他 Workflow から Signal 送信、Update は結果を同期返却 | https://docs.temporal.io/sending-messages |
| LangGraph | `interrupt()` | 「無期限」と明記 | 同一 `thread_id` で `Command(resume=値)` | https://docs.langchain.com/oss/python/langgraph/interrupts |
| Inngest | `step.waitForEvent` | タイムアウト指定(例: 3 日)。未受信なら `null` | マッチするイベントの送信 | https://www.inngest.com/docs/features/inngest-functions/steps-workflows/wait-for-event |
| Restate | Awakeable | 明示の上限記載なし(suspend) | `ctx.resolveAwakeable(id, data)` / HTTP `/restate/awakeables/{id}/resolve` | https://docs.restate.dev/develop/ts/awakeables |
| Cloudflare Workflows | `step.waitForEvent` | 既定 24 時間、1 秒〜365 日 | `instance.sendEvent` / REST API(事前送信はバッファ) | https://developers.cloudflare.com/workflows/build/events-and-parameters/ |
| Cloudflare Agents | `waitForApproval()`(Workflows ベース)/ MCP `elicitInput()` | 「数時間・数日・数週間」+ タイムアウト設定 | 承認 API 呼び出し(SQL への監査記録を推奨) | https://developers.cloudflare.com/agents/concepts/human-in-the-loop/ |
| AWS Step Functions | `.waitForTaskToken` | 実行の 1 年クォータまで。`HeartbeatSeconds` でスタック検出 | `SendTaskSuccess` / `SendTaskFailure` にタスクトークンを添付 | https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html |
| Azure Durable Functions | `WaitForExternalEvent` | 無期限(タイマーとのレースを公式推奨)。Consumption プランは待機中課金なし | `RaiseEventAsync` / HTTP raise-event API(at-least-once、重複排除推奨) | https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-external-events |
| Microsoft Agent Framework(Durable 拡張) | `RequestPort`(.NET)/ `ctx.request_info()`(Python) | 「数時間〜数週間」 | 自動生成の `POST /api/workflows/{name}/respond/{id}` エンドポイント | https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-microsoft-agent-framework |

---

## 5. 注意点・制約(執筆の論点になるもの)

### 5.1 決定性要件と LLM 呼び出し(非決定的)の関係

各社とも扱いは一貫しており、「**LLM 呼び出しは非決定的操作として、結果が永続化される実行単位に隔離する**」のが公式の標準解です。

| エンジン | LLM 呼び出しの置き場所(公式) | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| Temporal | Activity(OpenAI Agents SDK 統合ではモデル呼び出しが `ModelActivity` として自動的に Activity 化。結果は Event History に保存され replay 時は再実行されない) | https://python.temporal.io/temporalio.contrib.openai_agents.html / https://learn.temporal.io/tutorials/ai/durable-ai-agent/ | 2026-07-06 | 公式明記 |
| Restate | `ctx.run()` でラップ(「LLM 呼び出しを ctx.run でラップして耐久化」と AI ドキュメントに明記) | https://docs.restate.dev/ai | 2026-07-06 | 公式明記 |
| Inngest | `step.run()` または専用の `step.ai.infer()` / `step.ai.wrap()`(結果はメモ化され再実行されない) | https://www.inngest.com/docs/learn/how-functions-are-executed / https://www.inngest.com/docs/features/inngest-functions/steps-workflows/step-ai-orchestration | 2026-07-06 | 公式明記 |
| Azure | アクティビティ関数(オーケストレーターでの I/O は禁止)。Agent Framework Durable 拡張ではエージェント呼び出し(`DurableAIAgent.RunAsync`)が自動チェックポイント対象 | https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-code-constraints / https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-microsoft-agent-framework | 2026-07-06 | 公式明記 |
| AWS Step Functions | Task 状態(`bedrock:invokeModel` 等)。オーケストレーション(状態遷移)はコードではなく状態マシン定義なので、決定性問題がそもそも利用者コードに現れない構造 | https://docs.aws.amazon.com/step-functions/latest/dg/connect-bedrock.html | 2026-07-06 | 公式明記(後段の構造的整理は公式から推測) |
| LangGraph | ノード実行後にチェックポイント保存(durability mode で書き込みタイミングを制御)。決定性ガイダンスの原文は未確認(セクション 3.1) | https://docs.langchain.com/oss/python/langgraph/persistence | 2026-07-06 | 公式明記 + 一部未確認 |

補足: 「LLM 出力のキャッシュ」を決定性対策として明示的に打ち出す表現は、今回確認した範囲では Inngest(step 結果のメモ化を「キャッシュ」と表現する検索結果あり)以外で公式明記を確認できませんでした。実態はどのエンジンも「結果の永続化 + replay 時のスキップ」であり、機能的にはキャッシュと同等です(公式から推測)。

### 5.2 履歴・状態サイズとコストの制約(公式明記があったもの)

| 事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Temporal: Event History は 51,200 イベント / 50 MB が上限(警告は 10,240 / 10 MB)。エージェントループのような反復の多いワークロードでは履歴が伸びやすい点が執筆時の論点 | https://docs.temporal.io/workflow-execution/limits | 2026-07-06 | 公式明記(後段の論点化は公式から推測) |
| Azure(Durable Task Scheduler + Agent Framework): エンティティ状態(会話履歴含む)は最大 1 MB。大きなツール応答を含む長い会話は上限に達しうる。履歴圧縮は手動(新セッション + 要約)。セッション TTL 既定 14 日 | https://learn.microsoft.com/en-us/azure/durable-task/sdks/durable-agents-microsoft-agent-framework | 2026-07-06 | 公式明記 |
| AWS: Bedrock `InvokeModel` のペイロードは 256 KiB 超なら S3(`Input` / `Output`)経由を推奨 = 状態データにそのまま大きな LLM 入出力を載せない設計誘導 | https://docs.aws.amazon.com/step-functions/latest/dg/connect-bedrock.html | 2026-07-06 | 公式明記 |
| Azure Durable Functions(Consumption プラン): 外部イベント待機中は課金されない。Cloudflare Workflows / Restate / Inngest も「待機中はコンピュートを消費しない」旨の記述あり(Restate は serverless での suspend によるコスト節約を明記) | https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-external-events / https://docs.restate.dev/develop/ts/awakeables | 2026-07-06 | 公式明記 |
| Restate・Inngest・LangGraph の履歴/状態サイズ上限の公式数値 | — | 2026-07-06 | 未確認 |

### 5.3 その他の設計上の注意(公式明記)

- **外部イベントの at-least-once 配送**(Azure): 承認イベントが重複しうるため一意 ID での重複排除を公式推奨。承認フローの冪等性設計の根拠に使えます(https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-external-events、2026-07-06、公式明記)。
- **実行中ワークフローとコード変更の衝突**(Temporal / Azure): 長時間実行の途中でコードを変えると replay が壊れるため、両者ともバージョニング戦略を必須の考慮点として明記(https://docs.temporal.io/workflow-definition / https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-code-constraints、2026-07-06、公式明記)。
- **Durable Object の退避(eviction)**(Cloudflare): 無活動 70〜140 秒程度で退避されるため、長時間処理には `keepAliveWhile()` が必要。「常駐プロセス」ではない点に注意(https://developers.cloudflare.com/agents/concepts/agent-class/、2026-07-06、公式明記)。

---

## 執筆時の注意(変わりやすい項目)

記事本文では以下を断定で書かず、`TODO(要確認)` 前提で扱うことを推奨します。

1. **各統合の提供ステータス**: Temporal × OpenAI Agents SDK は「2025-07 Public Preview → 2026-03-23 GA」と短期間で変わった実績があります。Vercel AI SDK 統合(TypeScript)や AI Cookbook の構成も流動的で、今回 docs.temporal.io の AI Cookbook 本文は直接取得できませんでした(未確認)。記事では「◯◯統合が存在する」レベルに留め、GA/プレビューの別は執筆時に再確認が必要です。
2. **数値上限**: Temporal の 51,200 イベント / 50 MB、Cloudflare waitForEvent の 365 日、Azure の 1 MB エンティティ上限・TTL 14 日などの数値は変更されやすく、引用時は必ず確認日を併記してください。
3. **製品の再編**: Microsoft は Durable Functions のドキュメントを `azure/durable-task` 配下へ再編中(canonical URL が移動済み)で、「Durable Functions / Durable Task SDK / Durable Task Scheduler / Agent Framework Durable 拡張」の関係が今後も変わる可能性があります。AWS も Bedrock AgentCore の統合が追加されるなど一覧が動いています。
4. **LangGraph のドキュメント URL**: langchain-ai.github.io から docs.langchain.com への移行が進行中で、旧 URL はリダイレクトされます。リンクは docs.langchain.com 側を使い、durability mode の記述(exit/async/sync)は執筆時に原文を再確認してください(今回、当該ページの全文取得ができず検索結果経由の確認に留まった項目があります)。
5. **各社の「AI エージェント」ページの位置づけ**: Restate の `/ai` セクション、Inngest の AgentKit、Cloudflare の Agents SDK はいずれも 2024〜2025 年に登場した新しい製品面で、パターン集や API 名(`waitForApproval()` 等)は改称されうる前提で書くのが安全です。
6. **記事本体への示唆(方針メモ)**: 原則パート(チェックポイント・再開・冪等性・承認待ち)は全エンジン共通の概念(結果の永続化 + 決定的 replay + 非決定処理の隔離 + 永続的な外部イベント待ち)として書けます。エンジン固有名(Event History / journal / step メモ化)は「呼称の対応表」として 1 表にまとめると、フレームワーク動向の変化に強い構成になります。
