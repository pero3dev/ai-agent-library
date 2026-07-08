# 03-implementation — 実装ガイド

「どう書くか」を扱うセクションです。実装パターン・コード例・フレームワークの比較を提供します。概念の説明は 01-concepts へのリンクで済ませ、重複解説しません。

- **置くもの**: 実装パターン、コード例(または `examples/` への参照)、ツール接続、ユーザー向け応答の実装パターン(ストリーミング・進捗提示・中断)、フレームワーク・モデルの選定ガイド
- **置かないもの**: 概念の再説明(→ 01-concepts)、動くコード一式(→ `examples/`)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [tool-definition-design.md](tool-definition-design.md) | ツール定義の設計(命名・スキーマ・説明文・エラー返却) |
| [agent-prompt-design.md](agent-prompt-design.md) | Agent 向けプロンプト設計(システムプロンプトの構造化) |
| [structured-output.md](structured-output.md) | 構造化出力(スキーマ強制・検証・リトライ) |
| [mcp-and-tool-protocols.md](mcp-and-tool-protocols.md) | ツール接続標準(MCP とエコシステム。自前ツールとの使い分け) |
| [streaming-and-agent-ux.md](streaming-and-agent-ux.md) | ストリーミングと Agent の UX 実装パターン(進捗提示・中断・軌道修正) |
| [framework-selection.md](framework-selection.md) | フレームワーク選定ガイド |
| [model-selection.md](model-selection.md) | モデル選定ガイド(判断軸・用途別の使い分け・ティア混在設計) |
| [llm-landscape.md](llm-landscape.md) | 主要 LLM の全体像(プロバイダー別カタログ。鮮度リスク集約ページ) |
| [rag-implementation-patterns.md](rag-implementation-patterns.md) | RAG 実装パターン(チャンキング・検索方式・リランキング・Agentic RAG・権限反映) |
| [long-term-memory-implementation.md](long-term-memory-implementation.md) | 長期記憶の実装(抽出・保存・想起・忘却・プライバシー) |
| [prompt-management.md](prompt-management.md) | プロンプト資産の管理とバージョニング(テンプレート化・変更フロー・実験の記録) |
| [computer-use-implementation.md](computer-use-implementation.md) | ブラウザ・コンピュータ操作の実装(要素特定・待機と検証・安全策) |
| [voice-agents.md](voice-agents.md) | 音声エージェントの実装(パイプライン vs speech-to-speech・会話制御・評価) |
| [fine-tuning-and-distillation.md](fine-tuning-and-distillation.md) | ファインチューニングと蒸留(選ぶ前の判断・手法概観・データ準備・運用) |
| [prompt-engineering-fundamentals.md](prompt-engineering-fundamentals.md) | プロンプトエンジニアリングの基礎技法(汎用技法カタログ。Agent 特化記事の前提) |
| [prompt-engineering-patterns.md](prompt-engineering-patterns.md) | プロンプトエンジニアリングの上級パターン(構造化・例示・思考・出力・長文・頑健性の詳解) |
| [prompt-optimization.md](prompt-optimization.md) | プロンプト最適化(評価駆動の改善サイクル・失敗モード別対策・自動最適化の原理) |
| [loop-feedback-and-verification.md](loop-feedback-and-verification.md) | ループ内フィードバックと検証器の設計(ツール結果整形・エラーメッセージ設計・検証器の 3 種と配置・自己修正・検証改竄対策) |
| [claude-prompting.md](claude-prompting.md) | Claude 特化プロンプティングガイド(XML・アダプティブ思考/effort・prefill 移行・長文配置・世代差。鮮度管理型) |
| [openai-prompting.md](openai-prompting.md) | OpenAI(GPT 系)特化プロンプティングガイド(指示階層・reasoning effort・Structured Outputs・世代差。鮮度管理型) |
| [gemini-prompting.md](gemini-prompting.md) | Gemini 特化プロンプティングガイド(few-shot 重視・thinking_level・サンプリング・マルチモーダル・世代差。鮮度管理型) |
| [cross-model-prompting.md](cross-model-prompting.md) | モデル間の違いと移行(横断比較。相違の構造マップ・移行チェックリスト・マルチプロバイダー設計。鮮度管理型) |
| [embeddings.md](embeddings.md) | 埋め込み(embeddings)の選定と運用(類似度の意味・選定軸・次元・非対称検索・モデル更新=全再インデックス) |
| [vector-databases.md](vector-databases.md) | ベクトルデータベースの選定と運用(類型・ANN・フィルタ/権限反映の対応力・スケール・小規模の現実解) |
| [data-preprocessing-for-llm.md](data-preprocessing-for-llm.md) | LLM 向けデータ前処理パイプライン(抽出・クリーニング・重複排除・メタデータ設計・増分更新) |
| [graph-rag-and-knowledge-graphs.md](graph-rag-and-knowledge-graphs.md) | GraphRAG とナレッジグラフ(グラフ型知識表現の使いどころ・構築の限界・型・「本当にグラフが要るか」の判断) |
| [synthetic-data-for-training.md](synthetic-data-for-training.md) | 学習用合成データの実務(用途の型・生成・品質管理・モデル崩壊・権利・評価データとの分離) |
| [slm-strategy.md](slm-strategy.md) | 小型言語モデル(SLM)の活用戦略(得意領域と崖・SLM ファースト・ルーティング・タスク特化・評価) |
| [local-and-on-device-llm.md](local-and-on-device-llm.md) | ローカル・オンデバイス LLM の実務(向くユースケース・実行環境の類型・量子化形式・品質ギャップ検証・ハイブリッド・配布) |
