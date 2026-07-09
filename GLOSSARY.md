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

### アンサーエンジン(Answer Engine)

「検索結果の一覧を返す」代わりに「質問に対して出典付きの答えを返す」検索体験。RAG を土台とするが、答えを返す以上その根拠を示す責任がプロダクト側に生じる。出典必須・確度表示・「見つからない」を正しく言うことが生命線。→ [検索体験の再設計](docs/13-domain-agents/search-experience-redesign.md)

### インペインティング(Inpainting)

画像のマスクした領域だけを再生成する編集手法(画像の外側を拡張するのはアウトペインティング)。画像生成をゼロ生成だけでなく「既存画像を直す」用途に広げる。生成物の商用利用・来歴の論点はゼロ生成と同じく各社規約で要確認。→ [画像生成のプロダクト組み込み](docs/12-multimodal/image-generation-integration.md)

### 埋め込み(Embedding)

テキストや画像を、意味的な近さが距離に対応する数値ベクトルに変換したもの。RAG・記憶・分類の土台で、「何が近いか」はモデルで変わるため自社データで評価して選ぶ。モデル変更は全チャンクの再インデックスを伴う。→ [埋め込み(embeddings)の選定と運用](docs/03-implementation/embeddings.md)

### 影響調査(Impact Analysis)

コードやデータへの変更が、システムのどこに波及するかを事前に洗い出す作業。レガシー保守で特に重要。AI コーディングエージェントは波及範囲の「当たり付け」に使えるが、動的呼び出しやコード外連携(バッチ・DB トリガ・外部システム)を追い切れないため、「影響なし」の保証には使わない。→ [レガシーコード理解と仕様復元](docs/08-coding-agents/se-legacy-code-analysis.md)

### エージェント ID(Agent Identity)

エージェントに人間・汎用サービスアカウントと区別された固有のアイデンティティを与え、委任・権限・監査の単位にする考え方。2026 年時点で専用標準は未成立で、OAuth の委任表現と各社の ID 管理機能を組み合わせて実現する。→ [エージェントの認証・認可](docs/06-security/agent-identity-and-auth.md)

### エージェント経済(Agent Economy)

エージェント同士が人の監督を超える規模・速度で取引・交渉・決済を行う経済という構想。2026 年時点では、エージェント間の通信・決済の標準(MCP・A2A・各種決済プロトコル)は稼働し始めた一方、自律取引の経済そのものは概念段階にとどまる。「配管(標準)」と「経済(自律取引)」を段階として区別して読む。→ [先端応用の概観](docs/13-domain-agents/emerging-agent-domains.md)

### エージェントカード(Agent Card)

エージェント間連携で、相手のエージェントが「何者で・何ができ・どう認証するか」を書いた機械可読のメタデータ(名刺)。既知の場所で公開し、連携相手を機械的に発見・選択する土台になる。静的な秘密情報を埋め込まない・機微な内容は認証で保護する。→ [エージェント間連携プロトコル](docs/03-implementation/agent-interop-protocols.md)

### エージェントベンチマーク(Agent Benchmark)

エージェントの能力を測る公開ベンチマーク(コーディング・Web / コンピュータ操作・汎用アシスタント・対話ツール使用などのカテゴリがある)。ハーネス依存・汚染・飽和という限界を踏まえ、選定の参考情報として使い、自社品質は自前の評価で測る。→ [エージェントベンチマークの全体像](docs/04-evaluation/agent-benchmarks-landscape.md)

### エラーバジェット(Error Budget)

SLO の裏返しで、許容できる失敗の量(SLO が 99% なら 1% が予算)。残っていれば変更を進め、使い切ったら変更を凍結して品質改善に回す、という判断の型に使う。→ [AI 品質の SLO 設計](docs/05-operations/ai-slo-design.md)

### オーケストレーション(Orchestration)

複数の LLM 呼び出しや Agent の実行順序とデータの流れを制御すること。直列・並列・ルーティングなどの定番パターンがある。→ [オーケストレーションパターン](docs/02-architecture/orchestration-patterns.md)

### オープンウェイト(Open Weights)

モデルの重みが公開され、ダウンロードして自社インフラでホストできる LLM。ライセンス条件はモデルごとに大きく異なり、「オープン = 自由に商用可」ではない。→ [主要 LLM の全体像](docs/03-implementation/llm-landscape.md)

### 音声エージェント(Voice Agent)

音声で対話しツールで行動するエージェント。STT → LLM → TTS のパイプライン型と、音声を直接入出力する speech-to-speech 型の 2 アーキテクチャがあり、レイテンシ・ターンテイキング・中間テキストの制御性で選ぶ。→ [音声エージェントの実装](docs/03-implementation/voice-agents.md)

### 音声クローン(Voice Cloning)

特定の人の声を再現する音声合成機能。強力な一方で悪用リスクが大きく、提供各社は「本人の声のみ可」「同意文言の録音提出」「アクセス審査」「本人確認」などの統制を課す。実在の人の声には本人の明示的な同意が前提で、適法性・第三者の声の可否・商用条件は各社規約と地域法で要確認。→ [音声合成(TTS)と声の設計](docs/12-multimodal/speech-synthesis-and-voice-design.md)

### オンライン評価(Online Evaluation)

本番トラフィック上で品質シグナル(タスク成功の代理指標・フィードバック・サンプリング採点)を測る評価。手元のデータセットで測るオフライン評価を補完し、A/B テストやカナリアで真の効果を確定する。→ [オンライン評価と A/B テスト](docs/04-evaluation/online-evaluation-and-ab-testing.md)

### ガードレール(Guardrails)

モデルの判断の外側でコードとして強制される制御。入力・出力・アクションの 3 層に配置し、プロンプトでの指示(お願い)と区別される。→ [ガードレール](docs/06-security/guardrails.md)

### ガードレールメトリクス(Guardrail Metrics)

改善実験で主指標を追う一方、「悪化してはいけない」指標として監視するもの(コスト・レイテンシ・エラー率・安全性逸脱など)。主指標が上がっても閾値を超えたら失敗と見なす。→ [オンライン評価と A/B テスト](docs/04-evaluation/online-evaluation-and-ab-testing.md)

### 回帰テスト(Regression Testing)

プロンプト・ツール・モデルの変更で既存の品質が壊れていないかを、評価データセットの再実行と前回比較で検知するテスト。→ [回帰テストと CI 組み込み](docs/04-evaluation/regression-testing.md)

### 回転位置埋め込み(RoPE / Rotary Position Embedding)

クエリ・キーのベクトルを位置に応じて回転させ、内積に相対位置を自然に埋め込む位置符号化。2026 年時点の主流で、学習長を超える外挿(補間・周波数調整で拡張)の土台になる。→ [Transformer アーキテクチャ詳解](docs/11-llm-internals/transformer-architecture.md)

### 会話設計(Conversation Design)

エージェントの役割・トーン・話題の境界・会話の構造を意図的に設計する営み。「何でも答える汎用チャット」ではなく、ブランドと目的に沿った振る舞いをプロンプトに落とし込む。人間のふりをさせない・スコープ外は次へ導く断り方にする、が基本。→ [会話設計(ペルソナ・トーン・境界)](docs/14-ux-and-product/conversation-design.md)

### カオスエンジニアリング(Chaos Engineering)

システムに意図的に障害を注入し、回復力(フォールバックが本当に動くか)を検証する実践。AI ではプロバイダー障害・モデルの劣化応答・ツール障害・検索の空振りなどを注入対象にし、評価環境から段階的に試す。→ [AI システムのカオスエンジニアリング](docs/05-operations/chaos-engineering-for-ai.md)

### 可観測性(Observability)

トレース・メトリクス・ログといった外部出力から、システム内部で何が起きたかを説明できる性質。Agent では技術メトリクスに加えて品質シグナルの設計が必要になる。→ [可観測性とトレーシング](docs/05-operations/observability-and-tracing.md)

### 拡散モデル(Diffusion Model)

ノイズから徐々にデータ(画像・音声など)を生成する生成モデルの一種。マルチモーダルの「生成側」を担うことが多く、テキストを 1 トークンずつ生成する LLM の自己回帰生成とは仕組みが異なる。「入力理解」と「画像・音声生成」を別能力として区別する手がかりになる。→ [マルチモーダルモデルの仕組み(数式なしの直感)](docs/10-llm-foundations/multimodal-models.md)

### 機械翻訳後編集(MTPE / Machine Translation Post-Editing)

機械翻訳の出力を人が後から編集して仕上げる翻訳工程。人がどこをどこまで直すか(軽い後編集=意味が通ればよい / 重い後編集=公開品質)を重要度・リスクで使い分け、量産と品質を両立させる。用語集・対訳メモリの適用が体感品質を最も左右する。→ [執筆・翻訳ワークフローの設計](docs/13-domain-agents/writing-and-translation-workflows.md)

### 軌跡評価(Trajectory Evaluation)

最終出力だけでなく、Agent ループの実行記録(軌跡: 思考・ツール呼び出し・結果の列)に対して経路の正しさ・効率・安全性を評価すること。→ [軌跡(trajectory)評価](docs/04-evaluation/trajectory-evaluation.md)

### 脅威モデル(Threat Model)

システムの攻撃面を棚卸しし、脅威を列挙・分類してリスクを優先順位付けする作業とその成果物。構成変更のたびに見直す。→ [Agent の脅威モデル概観](docs/06-security/threat-model-overview.md)

### キルスイッチ(Kill Switch)

インシデント時にデプロイなしで Agent を止める・自律度を下げるための、事前に用意された停止手段。全停止・縮退・ツール単位の無効化など粒度を分けて設計する。→ [インシデント対応](docs/05-operations/incident-response.md)

### 近似最近傍探索(ANN / Approximate Nearest Neighbor)

ベクトル検索で、多少の取りこぼしと引き換えに最近傍を高速に探す方式。再現率(取りこぼさなさ)と速度・メモリのトレードオフを、インデックスのパラメータで調整する。→ [ベクトルデータベースの選定と運用](docs/03-implementation/vector-databases.md)

### グリーン AI(Green AI)

AI の環境負荷(電力・水・カーボン)を抑える取り組み。特別な技術より、コスト最適化(right-sizing・キャッシュ・バッチ)の多くがそのまま計算量=環境負荷の削減に効く。推計値は前提で大きく動くため断定せず、実削減と相殺(オフセット・証書)を区別する。→ [AI の環境負荷とグリーン AI](docs/05-operations/green-ai.md)

### 継続事前学習(Continued Pre-training)

既製モデルを大量のドメインコーパスで追加的に事前学習し、特定分野の言語・知識に適応させる手法。FT より重く、「自社モデルを持つ」段階の 1 つ。ベース世代の交代のたびに追従コストがかかる。→ [「自社モデルを持つか」の判断](docs/09-business/own-model-strategy.md)

### 検証器(Verifier)

ループの中でモデルの出力・行動の正しさを確かめる仕組み。決定的検証(テスト・lint・スキーマ)・モデル検証(judge)・人による検証(HITL)の 3 種があり、安くて確実なものから順に配置する。→ [ループ内フィードバックと検証器の設計](docs/03-implementation/loop-feedback-and-verification.md)

### 幻覚(Hallucination)

モデルが事実でない内容をもっともらしく生成する現象。「もっともらしい続きを生成する」という学習目的の自然な帰結であり、対策は指示の強化ではなく、根拠の外部供給(RAG)・出典要求・検証という構造側にある。→ [LLM の学習パイプライン(事前学習から選好調整まで)](docs/10-llm-foundations/llm-training-pipeline.md)

### 権限反映検索(Permission-aware Retrieval)

RAG の検索段で、質問したユーザーのアクセス権を必須フィルタとして反映し、権限外の文書を候補から構造的に除外する仕組み。生成段で伏せる方式は権限外の内容がプロンプトに載った時点で漏えいリスクになるため、検索基盤の層で強制する。→ [RAG 実装パターン](docs/03-implementation/rag-implementation-patterns.md)

### 較正(Calibration)

モデルの言う確信度と実際の正解率が一致している性質。「確信 80% のケースが実際に 8 割正解する」なら較正が良い。LLM は過信に寄りやすく、較正はモデル更新でずれるため再測定が要る。→ [信頼度と較正(calibration)](docs/04-evaluation/confidence-and-calibration.md)

### 合成データ(Synthetic Data)

LLM に生成させた評価・学習用のデータ。量とバリエーションを安く稼げる一方、分布の偏りと盲点の共有(生成モデルと評価対象が同系だと弱点が現れない)に注意が必要。→ [評価データセットの構築と保守](docs/04-evaluation/evaluation-datasets.md)

### 構造化出力(Structured Output)

LLM の出力を JSON Schema などの機械可読なスキーマに従わせる技術。後続の処理がコードである出力(分類・抽出・スコア)に使う。→ [構造化出力](docs/03-implementation/structured-output.md)

### コーディングエージェント(Coding Agent)

コードベースを読み、ファイルを編集し、コマンドを実行して検証するループで開発タスクを遂行する Agent。コード補完と異なり「タスク単位の委任」を受けられる。→ [AI コーディングエージェントの分類と全体像](docs/08-coding-agents/coding-agents-overview.md)

### ゴールデンセット(Golden Set)

正解・合格基準がアノテーション済みで、リリース判定や回帰テストの基準として層別・バージョン管理されながら維持される評価ケース集合。→ [評価データセットの構築と保守](docs/04-evaluation/evaluation-datasets.md)

### コンテキストエンジニアリング(Context Engineering)

LLM に渡す情報の全体(システムプロンプト・ツール定義・履歴・資料・状態)を、構成要素の選択・配置・ライフサイクルとして設計する営み。原則は [コンテキストエンジニアリング](docs/02-architecture/context-engineering.md)、実践パターンは [コンテキスト設計の実践パターン](docs/02-architecture/context-engineering-patterns.md)

### コンパクション(Compaction)

コンテキスト上限に近づいた際に、会話履歴を要約・圧縮して容量を確保する仕組み。トリガ設計と「必ず残す情報」の定義が要で、決定の消失は議論のループを招く。→ [コンテキストの圧縮と隔離](docs/02-architecture/context-compaction-and-isolation.md)

### コンピュータ操作型 Agent(Computer Use Agent)

画面(スクリーンショット)を観測し、マウス・キーボード操作で GUI を直接操作する Agent の類型。→ [コンピュータ操作型・マルチモーダル Agent](docs/01-concepts/computer-use-and-multimodal-agents.md)

### サプライチェーン攻撃(Supply Chain Attack)

外部から持ち込む AI 資産(モデル・重み・データセット・共有プロンプト/スキル・MCP サーバー・依存ライブラリ)の汚染・改ざんを通じてシステムを侵害する攻撃。実行時の防御以前に、導入前の出所確認・署名/ハッシュ検証・受け入れプロセス(審査 → 限定権限で試用 → 昇格)・資産台帳・更新の継続監視で守る。→ [AI サプライチェーンセキュリティ](docs/06-security/ai-supply-chain-security.md)

### 差分プライバシー(Differential Privacy)

集計や出力に「ある個人が含まれるかどうか」の影響がほぼ残らないようにする統計的なプライバシー保護。統計から特定個人の情報を逆算できないことを保証する方向の技術で、プライバシーを強めるほど結果の精度が落ちるトレードオフを持つ。高度な技術の前に、データ最小化・アクセス統制・マスキングを尽くす。→ [プライバシー強化技術の概観](docs/06-security/privacy-enhancing-technologies.md)

### サンドボックス(Sandbox)

モデルが生成したコードの実行やコンピュータ操作を、本番システムから隔離された使い捨て環境(ネットワーク・資源制限付き)で行う仕組み。→ [ツール権限設計とサンドボックス](docs/06-security/tool-permissions-and-sandboxing.md)

### 残差ストリーム(Residual Stream)

Transformer の層をまたいで貫く共有の通信路という見方。各注意ヘッド・FFN は、正規化した入力を副層に通した結果をこのストリームに足し込む(読み書きする)。回路・特徴を分析する解釈可能性研究の基礎的な視点。→ [Transformer アーキテクチャ詳解](docs/11-llm-internals/transformer-architecture.md)

### シャドー AI(Shadow AI)

組織の承認を経ずに、現場が個別に AI ツールを使うこと。禁止だけでは止まらず、多くは「安全に使える正規の経路がない」ことが原因。使いやすい正規の経路を用意し、責めずに正規化するのが現実的な向き合い方。→ [AI 利用ポリシー策定の実務](docs/09-business/ai-usage-policy.md)

### 静かな失敗(Silent Failure)

エラーを出さずに完走しながら、誤った結果を返す・誤った副作用を残す失敗。技術メトリクスに現れないため、品質シグナルによる検知設計が必要になる。→ [可観測性とトレーシング](docs/05-operations/observability-and-tracing.md)

### 蒸留(Distillation)

上位モデル(教師)の出力を学習データにして、小型モデル(生徒)をファインチューニングする手法。品質が確認できた特定タスクを、小型モデルで安く速く量産するためのコスト削減手段。→ [ファインチューニングと蒸留](docs/03-implementation/fine-tuning-and-distillation.md)

### 推論トークン(Reasoning Tokens)

推論モデルが答える前に生成する中間の思考のトークン。通常コストとして課金され、生成時間を延ばす。「考える時間」はタダではなく、思考量とコスト・レイテンシは直結する。→ [推論モデル(考える時間を使う LLM)](docs/10-llm-foundations/reasoning-models.md)

### 推論モデル(Reasoning Model)

応答の前に中間の思考(推論トークン)を生成してから答える LLM。多段推論・検証可能な問題で精度が上がる一方、単純タスクでは遅く高くなる(overthinking)。思考量は努力パラメータ等で制御する。→ [推論モデル(考える時間を使う LLM)](docs/10-llm-foundations/reasoning-models.md)

### スケーリング則(Scaling Laws)

損失がモデルサイズ・データ量・計算量に対して、滑らかなべき乗則で下がる経験則。計算最適(Chinchilla)はパラメータとデータをほぼ均等に増やすべきと修正した。べき指数・定数は構成依存の経験則で、普遍定数ではない。→ [事前学習とスケーリング則](docs/11-llm-internals/pretraining-and-scaling-laws.md)

### ストリーミング(Streaming)

LLM の応答を生成と同時に逐次受信・表示する方式。Agent の体感品質を左右する基本技術。→ [ストリーミングと Agent の UX 実装パターン](docs/03-implementation/streaming-and-agent-ux.md)

### 成果物 UI(Artifact UI)

会話ログではなく、編集中のドキュメント・キャンバス・コードといった成果物を画面の主役に置く UI 形態。AI の提案を成果物への差分・ハイライトで見せ、対話は補助線にする。制作系タスクで、チャットで説明されるより現物で見えるほうが速い。→ [チャットを超える UI(プロンプトレス設計)](docs/14-ux-and-product/beyond-chat-ui.md)

### 生成エージェント(Generative Agents)

記憶・内省・計画のアーキテクチャで人間らしい行動を模す LLM エージェント。仮想環境での行動の創発を示した査読付きの原典があり、社会シミュレーションや合成人格による調査に応用される。大規模な創発の逸話は再現性が未確立なものも多く、実証と構想を区別して読む。→ [先端応用の概観](docs/13-domain-agents/emerging-agent-domains.md)

### 世界モデル(World Model)

環境の生成的シミュレーション・行動結果の予測・エージェント訓練/評価インフラという 3 つの用法を持つモデル群の総称。「賢い個体そのもの」ではなく「賢い個体を作るための工場・練習場」として、学習・評価インフラの用法が先行して実用化しつつある。→ [世界モデルの概観](docs/01-concepts/world-models-overview.md)

### セマンティックキャッシュ(Semantic Cache)

入力を埋め込みベクトルにし、意味的に近い過去の質問があれば同じ応答を返す出力側キャッシュ。ヒット率は高いが「類似 ≠ 同一」による誤ヒット(似た別の質問に間違った答えを高速に返す)を抱え、しきい値はヒット率でなく誤ヒットの被害コストで決める。入力側のプロンプトキャッシュとは別物。→ [セマンティックキャッシュと応答再利用](docs/05-operations/semantic-caching.md)

### セマンティックレイヤー(Semantic Layer)

指標(メトリクス)・ディメンション・粒度の定義をコードで一元管理する層。データ分析エージェントに指標をその場で組み立てさせると集計の取り違え(重複カウント・粒度の混同)が起きるため、検証済みの定義を参照させて誤りの余地を構造的に減らす。→ [データ分析エージェント](docs/13-domain-agents/data-analysis-agents.md)

### 選好調整(Preference Tuning)

複数の応答への人間(または AI)の選好から「良い応答」の基準を学ばせる LLM の学習工程(RLHF・DPO など)。有用さ・無害さ・トーンを形作る一方、迎合(sycophancy)や過剰な拒否の由来にもなる。→ [LLM の学習パイプライン(事前学習から選好調整まで)](docs/10-llm-foundations/llm-training-pipeline.md)

### 選択的予測(Selective Prediction)

確信度が閾値を下回ったら答えずに棄権する(「わからない」と言う・人へエスカレーションする)設計。棄権を増やすと答えたケースの精度は上がるがカバレッジは下がるため、閾値は失敗コストで決める。→ [信頼度と較正(calibration)](docs/04-evaluation/confidence-and-calibration.md)

### 耐久実行(Durable Execution)

実行の各ステップの結果を永続ログに記録し、障害後は完了済みステップをスキップして途中から再開できる実行モデル。LLM 呼び出しなどの非決定的な処理を「結果が記録される単位」に隔離するのが要点。→ [非同期・長時間タスクの設計(耐久実行)](docs/02-architecture/async-and-durable-agents.md)

### 対照ペアテスト(Counterfactual Test)

入力の属性だけを入れ替え、それ以外を同じにしたペアで出力が変わるかを見る公平性評価の手法。属性を唯一の変数にできるため、品質・トーン・拒否率の不当な差の原因を切り分けられる。→ [公平性・バイアスの評価](docs/04-evaluation/fairness-and-bias-evaluation.md)

### チェックポイント(Checkpoint)

長時間タスクの「ここまで完了した」を再開可能な形で永続化したもの。ツール実行の完了やフェーズ境界などの意味のある単位で切る。信頼性とトークンコスト制御の両方の仕組み。→ [非同期・長時間タスクの設計(耐久実行)](docs/02-architecture/async-and-durable-agents.md)

### 致命的三重奏(Lethal Trifecta)

非公開データへのアクセス・信頼できないコンテンツへの接触・外部への送信能力の 3 つが 1 つの Agent に揃うと、データ持ち出しが構造的に可能になるという設計チェックの枠組み。→ [Agent の脅威モデル概観](docs/06-security/threat-model-overview.md)

### チャンキング(Chunking)

RAG の取り込みで、文書を検索・投入の単位に分割すること。分割のサイズと境界(構造・意味)の設計が検索品質の上限を決める。→ [RAG 実装パターン](docs/03-implementation/rag-implementation-patterns.md)

### ツール使用(Tool Use / Function Calling)

LLM が検索・API 呼び出し・コード実行などの外部機能を呼び出して行動する仕組み。Agent を Agent たらしめる中核機構。→ [ツール使用](docs/01-concepts/tool-use.md)

### ディープフェイク(Deepfake)

AI で合成した音声・映像で特定の人になりすますこと。声・顔が本人である証拠にならなくなるため、防御は「見破る(検出)」でなくプロセス(声/顔を本人確認に使わない・既知の正規連絡先へのコールバック検証・送金の多重承認)が中心。→ [ディープフェイク・なりすましへの防御](docs/06-security/deepfake-and-impersonation-defense.md)

### ディープリサーチ(Deep Research)

多段の調査(計画 → 検索 → 読解 → 統合 → レポート)を自律実行し、出典付きのレポートを生成するエージェントの類型。単発 RAG と違い、調査計画への分解・多段検索の打ち切り判断・全主張への出典紐付けが設計の中心になる。→ [ディープリサーチ型エージェントの設計](docs/13-domain-agents/deep-research-agents.md)

### データガバナンス(Data Governance)

知識源データ(社内文書・データセット)を組織で健全に保つ仕組み。オーナーシップ・データカタログ・品質基準・AI 利用可否の分類で、「AI の品質は知識源の品質」という律速を管理する。会話ログの管理・規制面とは別の記事が正本。→ [AI のためのデータガバナンス](docs/05-operations/data-governance-for-ai.md)

### データ主権(Data Sovereignty)

データがどの国・地域に置かれ、どの国の法域に服するかという概念。AI の処理・保存リージョンの選択や越境移転規制に直結する。適法性の判断は法務・貿易管理の領分で、本ライブラリは確認先の所在を示すにとどめる。→ [AI と地政学・輸出規制の入口マップ](docs/09-business/ai-geopolitics-map.md)

### データ漏えい(Data Exfiltration)

Agent を経由して機微データが外部に出ること。間接プロンプトインジェクションによる攻撃系と、権限・ログ設計の不備による事故系がある。→ [データ漏えい対策](docs/06-security/data-exfiltration.md)

### 電子透かし(Watermarking)

コンテンツの信号そのものに情報を埋め込む来歴/識別の手法。可視・不可視があり(SynthID 等)、付随メタデータ型の来歴(C2PA)より剥離・再エンコードに相対的に強い。ただし除去不能ではなく、改変耐性の主張はベンダーの自己申告として扱う。→ [生成物の来歴と検出](docs/06-security/content-provenance-and-detection.md)

### トークナイザ(Tokenizer)

テキストとトークン列を相互変換する部品。分割のされ方は言語・内容で大きく変わり、モデル(世代)ごとに異なるため、コスト・コンテキストの見積りは公式のカウント手段による実測を正とする。→ [トークナイザとトークン経済](docs/10-llm-foundations/tokenization.md)

### ドキュメント AI(Document AI)

スキャン文書・PDF・帳票から、後続処理(RAG・業務システム)が使える構造化データを取り出す技術・パイプライン。本文を起こすだけでなく「どの項目が・どの値か」を検証可能な形で抽出する。OCR・レイアウト解析・VLM 直読を使い分け、抽出結果は業務ルールで検証し信頼度で人手に振り分ける。→ [ドキュメント AI(帳票・PDF の構造化)](docs/12-multimodal/document-ai.md)

### ドリフト(Drift)

どこかで壊れたわけではないのに、時間とともに挙動・品質が想定から少しずつ外れる緩やかな劣化。常駐エージェントの長期運用で起き、急な故障として監視すると見逃すため SLI の推移で検知する。→ [常駐エージェントのライフサイクル管理](docs/05-operations/long-running-agents.md)

### ナレッジグラフ(Knowledge Graph)

知識をエンティティ(節点)と関係(辺)のネットワークで表したもの。ベクトル検索が返す断片と違い、つながりをたどれる。構築・維持コストが大きいため、通常の RAG で足りるかをまず判断する。→ [GraphRAG とナレッジグラフ](docs/03-implementation/graph-rag-and-knowledge-graphs.md)

### ハーネス(Harness)

モデルの外側 — ループ・ツール・フィードバック・環境・制御の総体。同じモデルでも作り込みで性能と信頼性が変わるため、モデルと並ぶ一級の設計対象として扱う。→ [ハーネスエンジニアリング](docs/02-architecture/harness-engineering.md)

### バックトラック(Backtrack)

ループが行き詰まったときに、失敗を認めてチェックポイントまで戻り、別経路でやり直す制御。失敗した経路の記録を残さないと同じ失敗を繰り返す。→ [ループエンジニアリング](docs/02-architecture/loop-engineering.md)

### パープレキシティ(Perplexity)

言語モデルの予測の鋭さを表す指標で、交差エントロピー損失を指数に乗せたもの。「次のトークンで平均何択くらい迷っているか」の目安。トークナイザ・評価データに依存するため、異なる条件間で直接比較できない。→ [事前学習とスケーリング則](docs/11-llm-internals/pretraining-and-scaling-laws.md)

### 評価ハーネス(Evaluation Harness)

Agent の評価を繰り返し実行可能にする仕組み一式。データセット・実行系・採点系・レポートの 4 点で構成される。→ [Agent 評価の基礎](docs/04-evaluation/agent-evaluation-basics.md)

### ファインチューニング(Fine-tuning)

既存モデルの重みを自分のデータで追加調整すること。知識の注入には向かず、形式・文体・ドメイン特化の挙動を安定させる手段。プロンプト・RAG・モデル変更を尽くした後の最後の手段になりやすい。→ [ファインチューニングと蒸留](docs/03-implementation/fine-tuning-and-distillation.md)

### フィードバックループ(Feedback Loop)

利用者からの明示シグナル(評価ボタン)と暗黙シグナル(修正・再試行・放棄)を収集し、評価データセットと改善へ還流させる循環。収集だけでなくトリアージと還流の運用まで含めて 1 つの仕組み。→ [フィードバックループの運用](docs/05-operations/feedback-loops.md)

### フィジカル AI(Physical AI)

物理世界を知覚し、物理世界に対して行動する AI の総称。2023 年以降は視覚・言語基盤モデルを行動出力に拡張するアプローチ(VLA)が主流で、ソフトウェア Agent と同型の「計画層 + 実行層」構造が現れている。→ [フィジカル AI とロボティクスの概観](docs/01-concepts/physical-ai-overview.md)

### プラットフォームチーム(Platform Team)

各プロダクトチームが AI を再発明せずに使えるよう、ゲートウェイ・評価基盤・ガードレール・共通テンプレートなどの共通機能を提供する基盤チーム。「縛る」のでなく「使いやすさで選ばれる」ことを目指し、迂回(シャドー利用)を招かない設計にする。→ [AI 時代のチームトポロジー](docs/09-business/ai-team-topologies.md)

### プランニング(Planning)

タスクをステップに分解し、実行順序を決め、進捗に応じて見直す働き。逐次判断・事前計画・リフレクションの 3 パターンが基本形。→ [プランニングと推論](docs/01-concepts/planning-and-reasoning.md)

### プリフィル(Prefill)

アシスタント応答の書き出しを開発者側で与えてから続きを生成させる技法。生成が与えた書き出しの続きとして条件付けられるため、前置きの除去や形式の強制に指示より強く効く(対応可否はモデルによる)。→ [プロンプトエンジニアリングの上級パターン](docs/03-implementation/prompt-engineering-patterns.md)

### プロアクティブ(Proactive)

利用者が頼む前にエージェント側から動く性質(通知・提案・先回り)。便利さとうるささが紙一重で、外し続けると正しい通知まで無視され信頼を損なう。確信度 × 重要度 × 頻度の掛け算で介入を絞り、ユーザー制御(頻度設定・ミュート・「なぜ出たか」の説明)を用意する。→ [プロアクティブエージェントの UX](docs/14-ux-and-product/proactive-agent-ux.md)

### フロンティアセーフティ(Frontier Safety)

最前線モデルの能力そのもの(サイバー・生物化学・AI 自己改善など)が重大被害に使われうるリスクを、提供者が管理する枠組み。共通構造は「能力閾値の設定 → 危険能力評価 → 到達時の対応措置 → 公表」の 4 段。安全の達成度は提供者の自己申告のため、選定・調達では複数(フレームワーク・システムカード・第三者評価)を突き合わせて評価軸にする。→ [フロンティアセーフティの概観](docs/06-security/frontier-safety-overview.md)

### プロンプトインジェクション(Prompt Injection)

モデルへの入力に紛れ込ませた指示で、開発者の意図した挙動を上書きする攻撃。ユーザー入力による直接型と、Agent が読む外部コンテンツ経由の間接型がある。→ [プロンプトインジェクション](docs/06-security/prompt-injection.md)

### プロンプトエンジニアリング(Prompt Engineering)

モデルへの入力(指示・例・データ・形式)を設計して、出力の品質・形式・安定性を高める技法の総称。技法の効果はモデル世代で変わるため、評価で検証してから採用する。→ [プロンプトエンジニアリングの基礎技法](docs/03-implementation/prompt-engineering-fundamentals.md)

### プロンプトキャッシュ(Prompt Caching)

プロンプトの固定部分(前方一致)の処理結果を再利用し、入力コストと応答開始までの時間を削減する仕組み。固定部分を先頭に置くプロンプト構造が前提。→ [コスト管理](docs/05-operations/cost-management.md)

### プロンプトレス UI(Prompt-less UI)

ユーザーに文章(プロンプト)を書かせず、ボタン・テンプレート・選択肢・文脈からの自動起動で AI を動かす設計。白紙のテキストボックスは多くの利用者に難しく、プロンプトを書けない利用者を排除するため、アクセシビリティの観点でも重要。→ [チャットを超える UI(プロンプトレス設計)](docs/14-ux-and-product/beyond-chat-ui.md)

### 閉域網(Air-gapped Network)

インターネットから物理的・論理的に隔離され、外部 API に到達できないネットワーク。クラウド型の AI コーディングエージェントは通信自体が通らず原理的に使えない。真の air-gapped 運用は、OSS エージェント + ローカル/自社ホストモデル(外部送信ゼロ)でのみ成立し、監査・SSO などの統制は運用側で担保する。→ [企業システム環境の制約と対応](docs/08-coding-agents/se-enterprise-constraints.md)

### 冪等性(Idempotency)

同じ操作を複数回実行しても結果が 1 回の実行と変わらない性質。再送・再開が前提の Agent 基盤では、内部のステップ実行と API 契約(冪等キー)の両方の層で必要になる。→ 内部は [非同期・長時間タスクの設計(耐久実行)](docs/02-architecture/async-and-durable-agents.md)、API 契約は [エージェントの API 設計](docs/02-architecture/agent-api-design.md)

### ヘッドレス実行(Headless Execution)

対話 UI を介さず、エージェントを 1 コマンド(非対話モード)で実行して結果を受け取る方式。スクリプト・CI からの自動化の基本要素。→ [自動化・業務効率化パターン](docs/08-coding-agents/coding-agent-automation-patterns.md)

### ベクトルデータベース(Vector Database)

埋め込みベクトルを格納し、近似最近傍探索で類似検索する基盤。専用 DB・既存 DB の拡張・マネージド・組み込みの類型があり、数万件規模なら単純解で足りることが多い。→ [ベクトルデータベースの選定と運用](docs/03-implementation/vector-databases.md)

### マルチエージェント(Multi-Agent)

複数の Agent ループが、それぞれ独立したコンテキストを持って分担・協調する構成。→ [シングルエージェントとマルチエージェント](docs/01-concepts/single-vs-multi-agent.md)

### マルチテナント(Multi-tenancy)

複数のテナント(顧客・部門)が同一の Agent 基盤を共有する構成。データ・プロンプト設定・レート容量・コストの 4 軸で分離を設計し、クロステナント混入とノイジーネイバーを構造的に防ぐ。→ [マルチテナント設計](docs/02-architecture/multi-tenancy-and-isolation.md)

### マルチモーダル(Multimodal)

テキスト以外の入力(画像・音声など)を理解できるモデルの能力。コンピュータ操作型 Agent の前提となる。→ [コンピュータ操作型・マルチモーダル Agent](docs/01-concepts/computer-use-and-multimodal-agents.md)

### マルチモーダル RAG(Multimodal RAG)

画像・図表・PDF を含む知識源で行う RAG。構成は 3 類型 —(1) ドキュメント AI でテキスト化して索引、(2) マルチモーダル埋め込みで画像を直接検索、(3) ページ画像を VLM で読みながら検索。知識源の性質(文字主体か図表主体か)で使い分け、検索と読解を分離して評価する。→ [マルチモーダル RAG](docs/12-multimodal/multimodal-rag.md)

### メタプロンプティング(Meta-prompting)

タスク記述からプロンプト自体を LLM に生成させる技法。叩き台の初速に効くが、生成物は仮説であり評価を通すまで改善とは呼べない。→ [プロンプト最適化(評価駆動の改善と自動化)](docs/03-implementation/prompt-optimization.md)

### メモリ(Memory)

Agent が「覚えている」ように見えるデータの総称。短期記憶(コンテキスト)・作業状態・長期記憶(外部ストレージ)の 3 層に分けて設計する。→ [メモリと状態管理](docs/01-concepts/memory-and-state.md)

### メモリポイズニング(Memory Poisoning)

エージェントの長期記憶に悪意ある指示や偽の事実を残し、後日のセッションで発火させる攻撃。記憶は「信頼できる自分の情報」として扱われ都度の入力より警戒が薄いため厄介で、時間差で効くため気づきにくい。記憶も外部入力として扱い、書き込みの検証・出所の記録・権限分離で守る。→ [新興攻撃パターンの体系](docs/06-security/advanced-attack-patterns.md)

### モダナイゼーション(Modernization)

古い技術資産(レガシーシステム)を新しい基盤・言語へ移す取り組み。一括置換より、モジュール単位の段階的移行が基本。成否は新旧の挙動の等価性で決まり、AI コーディングエージェントの変換は下書きであって、等価性は現行挙動を正としたテストで人が検証する。→ [レガシーコード理解と仕様復元](docs/08-coding-agents/se-legacy-code-analysis.md)

### モデル崩壊(Model Collapse)

モデルの出力を学習データにして次のモデルを訓練する、を繰り返すと分布の裾(まれなパターン)が失われ、出力が単調に崩れる現象。合成データは実データの代替ではなく補強にとどめ、実データを混ぜて避ける。→ [学習用合成データの実務](docs/03-implementation/synthetic-data-for-training.md)

### ユーザーシミュレータ(User Simulator)

対話型 Agent の評価で「ユーザー役」を務める LLM。ペルソナ・目標・持ち情報・忍耐度を設計し、目標と状態で縛って暴走を防ぐ。会話を採点する審判役(judge)とは別コンポーネント。→ [ユーザーシミュレータの設計](docs/04-evaluation/user-simulator-design.md)

### 輸出管理(Export Control)

安全保障の観点から、特定の貨物の輸出や技術の提供を国が管理する制度。先端半導体や、場合により AI モデル・重みも対象になり得る。該非判断は貿易管理部門・所管当局の領分で、本ライブラリは確認先の所在のみ示す。→ [AI と地政学・輸出規制の入口マップ](docs/09-business/ai-geopolitics-map.md)

### 来歴(Provenance)

デジタルコンテンツの作成・編集の履歴を、検証可能な形で記録・証明する考え方。C2PA / Content Credentials は署名付きメタデータで来歴を記録し改ざん検知可能にする(「栄養成分表示ラベル」)。ただし来歴は「履歴の検証」であって「AI 生成か否かの証明」ではなく、スクショ・再エンコードで剥がれうる(有無を単独の判断根拠にしない)。→ [生成物の来歴と検出](docs/06-security/content-provenance-and-detection.md)

### リバースエンジニアリング(Reverse Engineering)

完成物(ここではコード)から、設計意図や仕様を逆向きに読み解くこと。ドキュメントが失われたレガシーコードの理解・仕様復元で行う。AI が復元した仕様はドラフトであり、現行システムの実挙動が正(仕様とコードが食い違えばコードの挙動が正)。→ [レガシーコード理解と仕様復元](docs/08-coding-agents/se-legacy-code-analysis.md)

### 量子化(Quantization)

モデルの重みを低い数値精度(INT8・INT4 等)で表現してサイズを縮める手法。VRAM とメモリ帯域の負荷が下がり、同じ GPU により大きいモデル・多い同時実行を載せられる。精度を下げるほど品質が落ちうるため、量子化後の品質は自社タスクで検証してから使う。→ [GPU・AI ハードウェアの基礎](docs/05-operations/gpu-and-hardware-basics.md)

### リランキング(Reranking)

一次検索で広めに取った候補を、より精密なモデルで並べ直して上位数件に絞る 2 段目の検索処理。一次検索が再現率を、リランキングが精度を担当する分業になる。→ [RAG 実装パターン](docs/03-implementation/rag-implementation-patterns.md)

### ループエンジニアリング(Loop Engineering)

Agent ループの制御 — いつ考え・行動し・立ち止まり・止めるか — を設計対象として扱う営み。ループの型の選択・停止条件の詳解・迷走の検知と介入・バックトラックを含む。→ [ループエンジニアリング](docs/02-architecture/loop-engineering.md)

### ルールファイル(Rules File)

コーディングエージェントがセッション開始時に読み込む、プロジェクト固有の指示書(AGENTS.md・CLAUDE.md など)。恒常的な規約を毎回の依頼文から分離する。→ [ルールファイルと設定の設計](docs/08-coding-agents/coding-agent-rules-and-config.md)

### レッドチーミング(Red Teaming)

脅威モデルを机上で終わらせず、実際に攻撃を試して防御の穴を見つける演習。エージェントでは有害な出力よりも、騙されたモデルが権限で有害な行動を取れるかに重心を置く。→ [エージェントのレッドチーミング](docs/06-security/red-teaming-agents.md)

### 連合学習(Federated Learning)

データを 1 か所に集めず、各所に置いたまま学習し、モデルの更新分だけを持ち寄る手法。生データを外に出さずに学習したい(規制・データ主権)場面に効く。プライバシー強化技術の 1 つで、集計・学習・推論のうち「学習」に効く選択肢。→ [プライバシー強化技術の概観](docs/06-security/privacy-enhancing-technologies.md)

### 連続バッチング(Continuous Batching)

推論サーバーで複数リクエストをまとめて処理し、各リクエストの開始・終了が揃わなくても空いたスロットに次を詰めて GPU を遊ばせない方式。1 件ずつ処理するよりスループットが大きく上がる。高スループット系の推論エンジンが備える中核機能。→ [セルフホスト推論の実務](docs/05-operations/self-hosted-inference.md)

## A–Z

### A2A(Agent2Agent Protocol)

組織・システムの境界を越えてエージェント同士が発見・通信・タスク委譲を行うための標準プロトコル。Google 発で Linux Foundation へ移管され、エージェントカードによる発見・タスク委譲・長時間タスクを定める。MCP(ツールを呼ぶ)とは層が違い相補的で、相手を「部品」でなく自律主体として扱う。→ [エージェント間連携プロトコル](docs/03-implementation/agent-interop-protocols.md)

### Agent ループ(Agent Loop)

LLM が「観測 → 思考 → 行動」のサイクルを繰り返し、完了・失敗・上限のいずれかの停止条件まで自律的に処理を続ける制御構造。→ [Agent ループ](docs/01-concepts/agent-loop.md)

### AI Agent(AI エージェント)

LLM を判断の中枢に置き、ツールを使いながら、目標達成までの手順を実行時に自律的に決めて実行するシステム。→ [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)

### BYOK(Bring Your Own Key)

自分で契約したモデル API のキーをツールに持ち込んで使う方式。データの経路とモデル選択を利用者が制御でき、オープンソース系コーディングエージェントの標準形。→ [オープンソースのコーディングエージェント](docs/08-coding-agents/open-source-coding-agents.md)

### CoE(Center of Excellence)

AI 活用の知見・標準を集約する専門組織。導入初期や専門人材が少ない段階で、知見を貯めて標準を作るのに向く。組織が成熟したら分散・プラットフォーム型へ移行し、CoE がボトルネックにならないようにする。→ [AI 時代のチームトポロジー](docs/09-business/ai-team-topologies.md)

### DPO(Direct Preference Optimization)

報酬モデルの学習と強化学習の 2 段を、選好データから直接 1 段で最適化する選好調整の手法。「報酬モデルは方策に暗黙に含まれる」ことを使い、正規化定数を消去して選好から直接学ぶ。実装が軽い一方、明示的報酬モデルがないぶん細かい制御は RLHF に劣る。→ [アラインメントの理論](docs/11-llm-internals/alignment-theory.md)

### Few-shot(少数例示)

期待する入出力の例をプロンプトに数個含め、形式・粒度・判断基準を伝える技法。例が仕様書として働く一方、例の偏りは出力の偏りになり、毎回のトークンコストにもなる。→ [プロンプトエンジニアリングの基礎技法](docs/03-implementation/prompt-engineering-fundamentals.md)

### GraphRAG

ナレッジグラフを検索に使う RAG。多段の関係たどりや全体集約の問いに強い一方、構築・維持コストが大きい。エンティティ検索 + グラフ辿り / コミュニティ要約型 / ベクトル検索との併用の型がある。→ [GraphRAG とナレッジグラフ](docs/03-implementation/graph-rag-and-knowledge-graphs.md)

### Human-in-the-Loop(HITL)

人間の判断(事前承認・事後レビュー・エスカレーション・監視と中断)を Agent の実行フローに組み込む設計。→ [Human-in-the-Loop 設計](docs/02-architecture/human-in-the-loop.md)

### KV キャッシュ(KV Cache)

生成中に各トークンの中間表現(Key / Value)を保存・再利用する仕組みで、プロンプトキャッシュの実体。中間表現は先頭からの並びに依存するため、キャッシュは前方一致でしか効かない。→ [注意機構とコンテキストウィンドウの仕組み](docs/10-llm-foundations/attention-and-context.md)

### LLM-as-a-Judge

コードでは採点できない開放的な出力を、基準を与えた別の LLM に判定させる評価手法。judge 自体の検証(人手ラベルとの一致率測定)を前提とする。→ [LLM-as-a-Judge](docs/04-evaluation/llm-as-a-judge.md)

### LLM ゲートウェイ(LLM Gateway)

アプリと LLM プロバイダーの間に置く共通の中継層。キー管理・モデル抽象化(統一 API)・コスト集計・監査・レート制御・ルーティング・フォールバックを 1 か所に集約する。全トラフィックが通るため単一障害点化しやすく、冗長化とモデル固有機能の確保が要点。→ [LLM ゲートウェイの設計](docs/05-operations/llm-gateway.md)

### LLMOps

既存の MLOps を捨てず「差分」で捉える LLM アプリ運用。実験管理・監視・CI/CD の骨格は再利用でき、プロンプトという新資産・確率的で多面的な評価・速い変更サイクルが LLM 固有。FT を始めた瞬間に MLOps と合流する。→ [MLOps と LLMOps の統合](docs/05-operations/mlops-and-llmops.md)

### MCP(Model Context Protocol)

ツールやデータソースを LLM アプリケーションに接続するための標準プロトコル。概要は [ツール使用](docs/01-concepts/tool-use.md)、接続の実務は [ツール接続標準(MCP とエコシステム)](docs/03-implementation/mcp-and-tool-protocols.md)

### microVM(Micro VM)

軽量な仮想マシンで、VM の強い隔離を高速起動・低オーバーヘッドで得る技術。標準的なコンテナがカーネルを共有するのに対し、microVM は VM 境界でホストと分離するため、モデル生成コードなど信頼できないコードの実行に向く。→ [コード実行サンドボックスの実装](docs/03-implementation/code-execution-sandboxes.md)

### MoE(Mixture of Experts)

推論のたびに一部のパラメータ(エキスパート)だけを起動するモデル構造。総パラメータ(メモリ要件)とアクティブパラメータ(速度・計算量)を分けて評価する必要がある。内部構造(ルーティング・負荷分散・専門化)は [MoE の内部構造](docs/11-llm-internals/mixture-of-experts-internals.md)、選定上の意味は [主要 LLM の全体像](docs/03-implementation/llm-landscape.md)

### OCR(光学文字認識 / Optical Character Recognition)

画像中の文字を検出してテキスト化する技術。文字起こしの精度と座標(位置情報)が得られ、大量処理のコストが読みやすい。レイアウトの復元は別途必要。ドキュメント AI では、意味的な項目抽出が得意な VLM 直読と役割で使い分け、組み合わせることも多い。→ [ドキュメント AI(帳票・PDF の構造化)](docs/12-multimodal/document-ai.md)

### PoC(概念実証 / Proof of Concept)

本番導入を判断するために必要な「問い」を、期間を区切って検証する使い捨て前提の試作。デモの成功ではなく、本物のデータ分布での測定結果を成果物とする。→ [PoC から本番への進め方](docs/09-business/poc-to-production.md)

### RAG(検索拡張生成 / Retrieval-Augmented Generation)

外部の知識ソースを検索し、結果を LLM の入力に加えて回答の根拠にする手法。検索の判断を Agent に任せる構成は Agentic RAG と呼ばれる。→ [RAG と Agent の関係・使い分け](docs/01-concepts/rag-vs-agent.md)

### RLHF(Reinforcement Learning from Human Feedback)

人間の選好から報酬モデルを学び、KL 正則化付きでその報酬を最大化するよう方策(モデル)を最適化する選好調整の枠組み。有用さ・無害さ・トーンを形作る一方、迎合や報酬ハッキングの由来でもある。→ [アラインメントの理論](docs/11-llm-internals/alignment-theory.md)

### SFT(教師ありファインチューニング / Supervised Fine-tuning)

「指示 → 望ましい応答」の模範例で LLM を追加学習させ、指示に従う振る舞いの形式を教える学習工程。新しい知識の注入ではなく、既にある能力を応答の形に整えることが本質。→ [LLM の学習パイプライン(事前学習から選好調整まで)](docs/10-llm-foundations/llm-training-pipeline.md)

### SLM(Small Language Model / 小型言語モデル)

得意領域(分類・抽出・整形など範囲の狭いタスク)では上位モデルに迫り、多段推論・広い知識では急に落ちる小型モデル。既定を SLM にし、届かない分だけ上位へ昇格するルーティングで、品質を保ちつつコスト・レイテンシを下げる。→ [小型言語モデル(SLM)の活用戦略](docs/03-implementation/slm-strategy.md)

### SLO(Service Level Objective)

サービスの良し悪しを表す指標(SLI)の目標値。AI では品質そのもの(タスク成功率・サンプリング採点の合格率など)を SLI に含める。100% を狙わず、ベースラインから現実的な水準を設定する。→ [AI 品質の SLO 設計](docs/05-operations/ai-slo-design.md)

### Text-to-SQL

自然言語の質問を SQL に変換する技術。精度はモデルの能力よりスキーマと文脈の与え方(意味の付与・分析用ビュー・少数例)でほぼ決まる。実行が成功しても集計の意味が誤る「もっともらしい誤答」を、既知値との突合などで検証する設計が要る。→ [データ分析エージェント](docs/13-domain-agents/data-analysis-agents.md)

### TTFT(Time To First Token)

最初のトークンが出るまでの時間。ストリーミング表示の体感と全体レイテンシを左右する主要指標の一つ。→ [レイテンシ最適化](docs/05-operations/latency-optimization.md)

### VLA(Vision-Language-Action)モデル

視覚・言語の基盤モデルをロボットの実演データで拡張し、視覚入力と言語指示から直接ロボットの行動を出力するモデル。2026 年時点のフィジカル AI の中核類型で、共通ベンチマークは未確立のため性能の横並び比較はできない。→ [フィジカル AI とロボティクスの概観](docs/01-concepts/physical-ai-overview.md)

### VLM(視覚言語モデル / Vision-Language Model)

画像とテキストを一緒に扱える(画像を理解できる)モデル。大まかな内容は読めるが、細かい文字・数え上げ・精密な空間関係/座標で急に外す崖を持つ。図表読解・UI 解析・検品などに使い、重要な読み取りは検証・別手段と併用する。画像を「操作」する computer use とは区別する。→ [画像理解の実務パターン](docs/12-multimodal/vision-understanding-patterns.md)

### WebAssembly(Wasm)

サンドボックス実行を前提とした可搬なバイナリ形式。既定では何もできず、許可した能力(ファイル・ネットワーク等)だけを与える能力ベースの隔離が特徴で、軽量・高速に起動する。実行できる処理(ネイティブ依存・システムコール)に制約がある。→ [コード実行サンドボックスの実装](docs/03-implementation/code-execution-sandboxes.md)

### Workflow 型(ワークフロー)

処理手順を開発者がコードで固定し、LLM を各ステップの部品(分類・要約・生成など)として使う構成。Agent との対比概念。→ [Workflow 型 vs Agent 型の使い分け](docs/02-architecture/workflow-vs-agent.md)
