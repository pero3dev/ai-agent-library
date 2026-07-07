# EXPANSION-PLAN — AI Agent プロフェッショナル化 拡張計画

> **ステータス: ✅ 完了(2026-07-06 着手、2026-07-07 に Phase D〜I の全 24 タスクを完了 = 新規 23 本 + learning-roadmap 改訂)。** 以後の変更は [ROADMAP.md](ROADMAP.md) の定期メンテナンスで管理します。
> 本計画は「AI Agent のプロフェッショナルになるために必要なトピック」を既存 60 本とのギャップ分析から徹底的に洗い出したものです。

## 1. 目標: 「プロフェッショナル」の定義とスキルマトリクス

本計画では「AI Agent プロフェッショナル」を次の 8 領域を実務レベルで扱える人と定義し、領域ごとにギャップを洗い出しました。

| # | スキル領域 | 現在の主担当セクション | カバレッジ評価(2026-07-06 時点) |
| --- | --- | --- | --- |
| S1 | 概念・原理の理解 | 01-concepts | **十分**(8 本。基礎は完成) |
| S2 | アーキテクチャ設計 | 02-architecture | **中**(同期・単発型は十分。非同期・長時間・マルチテナント・API 化が欠落) |
| S3 | 実装技術 | 03-implementation | **中**(ループ・ツール・モデル選定は十分。RAG 実装・記憶・音声・操作型・FT・プロンプト資産管理が欠落) |
| S4 | 評価・品質保証 | 04-evaluation | **中**(手法は十分。データセット構築・オンライン評価・ベンチマーク地図が欠落) |
| S5 | 運用・信頼性 | 05-operations | **中**(監視・コスト・インシデントは十分。デプロイ・スケーリング・改善ループが欠落) |
| S6 | セキュリティ・ガバナンス | 06-security | **中**(脅威・防御は十分。認証認可・レッドチーミング・規制対応が欠落) |
| S7 | ビジネス実務(案件推進) | **なし** | **欠落**(ユースケース選定・要件定義・PoC→本番・ROI を扱う場所がない) |
| S8 | ツール活用・生産性 | 08-coding-agents | **十分**(21 本。Phase A・B で完成) |

補助的な観測: 現在の level 分布は basic 16 / intermediate 43 / **advanced 1** で、プロフェッショナル向けの advanced 層が薄いことも本計画で補います。

## 2. 追加トピック全一覧(24 本 + 新セクション 1)

優先度: **P1** = プロフェッショナルに必須(これがないと実務が回らない)/ **P2** = 強く推奨(現場で頻出)/ **P3** = 発展(必要になったら)。

| # | 配置 | ファイル | 仮タイトル | level | 優先 | 領域 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 00-overview | `skill-map.md` | AI Agent プロフェッショナルのスキルマップ | basic | P1 | S7 |
| 2 | 09-business(新設) | `usecase-discovery.md` | ユースケース発見と要件定義 | intermediate | P1 | S7 |
| 3 | 09-business | `poc-to-production.md` | PoC から本番への進め方 | intermediate | P1 | S7 |
| 4 | 09-business | `roi-and-business-case.md` | ROI とビジネスケース | intermediate | P2 | S7 |
| 5 | 03-implementation | `rag-implementation-patterns.md` | RAG 実装パターン | advanced | P1 | S3 |
| 6 | 04-evaluation | `evaluation-datasets.md` | 評価データセットの構築と保守 | advanced | P1 | S4 |
| 7 | 05-operations | `deployment-and-scaling.md` | デプロイとスケーリング | advanced | P1 | S5 |
| 8 | 06-security | `agent-identity-and-auth.md` | エージェントの認証・認可 | advanced | P1 | S6 |
| 9 | 02-architecture | `async-and-durable-agents.md` | 非同期・長時間タスクの設計(耐久実行) | advanced | P2 | S2 |
| 10 | 03-implementation | `long-term-memory-implementation.md` | 長期記憶の実装 | advanced | P2 | S3 |
| 11 | 03-implementation | `prompt-management.md` | プロンプト資産の管理とバージョニング | intermediate | P2 | S3 |
| 12 | 06-security | `red-teaming-agents.md` | エージェントのレッドチーミング | advanced | P2 | S6 |
| 13 | 06-security | `compliance-and-governance.md` | コンプライアンスとガバナンス | intermediate | P2 | S6 |
| 14 | 04-evaluation | `online-evaluation-and-ab-testing.md` | オンライン評価と A/B テスト | advanced | P2 | S4 |
| 15 | 05-operations | `feedback-loops.md` | フィードバックループの運用 | intermediate | P2 | S5 |
| 16 | 03-implementation | `computer-use-implementation.md` | ブラウザ・コンピュータ操作の実装 | advanced | P2 | S3 |
| 17 | 03-implementation | `voice-agents.md` | 音声エージェントの実装 | advanced | P2 | S3 |
| 18 | 03-implementation | `fine-tuning-and-distillation.md` | ファインチューニングと蒸留 | advanced | P2 | S3 |
| 19 | 02-architecture | `multi-tenancy-and-isolation.md` | マルチテナント設計 | advanced | P3 | S2 |
| 20 | 02-architecture | `agent-api-design.md` | エージェントの API 設計 | intermediate | P3 | S2 |
| 21 | 04-evaluation | `agent-benchmarks-landscape.md` | エージェントベンチマークの全体像 | basic | P3 | S4 |
| 22 | 07-case-studies | `case-study-customer-support-agent.md` | ケーススタディ: カスタマーサポート Agent | intermediate | P2 | 横断 |
| 23 | 07-case-studies | `case-study-knowledge-agent.md` | ケーススタディ: 社内ナレッジ Agent(RAG 運用) | intermediate | P3 | 横断 |
| 24 | 00-overview | learning-roadmap.md の改訂 | 読者タイプ G(プロフェッショナル志向)の追加 | — | P1 | 横断 |

**新セクション**: `docs/09-business/`(ビジネス実務)を新設します。ユースケース選定・PoC 推進・ROI は既存のどのセクションにも収まらず(02 は技術設計、05 は稼働後)、S7 の欠落がプロフェッショナル化の最大ギャップのためです。代替案(07-case-studies への同居)は「事例」と「方法論」の混在になるため不採用を推奨します。

## 3. 各ページの設計

### 3.1 土台(P1)

#### skill-map.md — AI Agent プロフェッショナルのスキルマップ(00-overview)

- **目的**: 8 領域のスキルマトリクスで自己評価し、ライブラリ内の学習パスに接続できる。「何を学べばプロフェッショナルか」の正本
- **主要トピック**: 8 領域の定義と到達レベル(入門/実務/専門)、役割像(Agent エンジニア / アーキテクト / 評価・運用担当 / テックリード)ごとの重点、各領域 → 本ライブラリの該当ドキュメント対応表、学習の順序と実践課題例
- **H3 案**: 概要 / 8 つのスキル領域と到達レベル / 役割像別の重点マップ / ライブラリ内の学習パス対応 / 実践で伸ばす方法(社内題材の選び方)
- **備考**: learning-roadmap と相互リンク。Mermaid でスキルレーダー的な図(flowchart で領域関係)

#### usecase-discovery.md — ユースケース発見と要件定義(09-business)

- **目的**: 「Agent で何をやるか」を発見・選別し、着手前に成功基準を合意できる
- **主要トピック**: 向くユースケースの条件(検証可能・手順の変動・失敗許容度)と向かない条件、業務棚卸しからの候補抽出、価値×実現性の優先順位付け、要件定義の型(入出力・完了条件・人の関与点・データ要件)、ステークホルダーとの期待値調整(「魔法ではない」の合意形成)
- **H3 案**: 概要 / Agent に向く仕事・向かない仕事 / 候補の発見と優先順位付け / 要件定義の型 / 成功基準と期待値の合意
- **関連**: workflow-vs-agent(技術判断側)、poc-to-production

#### poc-to-production.md — PoC から本番への進め方(09-business)

- **目的**: 「デモは動くが本番に行けない」を防ぐ、段階的なプロジェクト推進を設計できる
- **主要トピック**: PoC の設計(問いを 1 つに絞る・使い捨て前提)、PoC → パイロット → 本番の関門(評価・セキュリティレビュー・運用体制)、「デモの罠」(ハッピーパス偏重)、段階的リリース、撤退基準の事前定義、体制(誰が作り誰が運用するか)
- **H3 案**: 概要 / PoC の設計 / 本番化の関門チェック / 段階的リリース / 撤退・ピボットの判断 / 体制と引き継ぎ
- **関連**: agent-evaluation-basics、human-in-the-loop、incident-response

#### rag-implementation-patterns.md — RAG 実装パターン(03-implementation)

- **目的**: 概念(rag-vs-agent)の先にある実装判断 — 取り込み・検索・生成の各段を設計できる
- **主要トピック**: 取り込みパイプライン(チャンキング戦略・メタデータ)、埋め込みモデル選定(model-selection と接続)、検索(ベクトル / キーワード / ハイブリッド、リランキング)、Agentic RAG(検索の判断をエージェントに委ねる)、引用と根拠提示、RAG の評価(検索精度と生成品質の分離)、鮮度運用(再インデックス)
- **H3 案**: 概要 / 取り込み(チャンキングとメタデータ) / 埋め込みと検索方式 / リランキングとハイブリッド検索 / Agentic RAG / 引用・根拠の提示 / RAG の評価と運用
- **備考**: examples/ に最小 RAG サンプル追加を検討(要判断)

#### evaluation-datasets.md — 評価データセットの構築と保守(04-evaluation)

- **目的**: 評価の土台となるデータセットを収集・合成・保守できる
- **主要トピック**: 収集源(本番ログ・失敗事例・想定シナリオ)、合成データの使いどころと危険、アノテーション設計(基準書・複数名一致率)、ゴールデンセットの規模と層別、汚染防止(学習データ・プロンプト混入)、保守(陳腐化・追加のワークフロー)
- **H3 案**: 概要 / 収集源と選び方 / 合成データ / アノテーションと品質 / ゴールデンセットの設計 / 保守と陳腐化対策

#### deployment-and-scaling.md — デプロイとスケーリング(05-operations)

- **目的**: エージェントを本番インフラに載せる際の構成を選定できる
- **主要トピック**: 実行形態の選択(リクエスト同期 / ジョブキュー / 常駐ワーカー / サーバーレスの制約 = 実行時間・状態)、状態の外部化、プロバイダーレート制限を前提とした容量設計(同時実行制御・バックプレッシャ)、マルチプロバイダー・フォールバック構成、ロールアウト(カナリア)
- **H3 案**: 概要 / 実行形態の選択 / 状態管理とスケールアウト / レート制限と容量設計 / フォールバックと多重化 / ロールアウト戦略
- **関連**: error-handling-and-retries、versioning-and-model-updates、async-and-durable-agents

#### agent-identity-and-auth.md — エージェントの認証・認可(06-security)

- **目的**: 「エージェントは誰として動くのか」を設計できる(2026 年時点で最重要の未整備領域)
- **主要トピック**: サービスアカウント型 vs ユーザー代理型(on-behalf-of)、OAuth・トークン委任の設計、権限の縮退(ユーザー権限 ∩ エージェント許可)、監査ログの帰属(人か Agent か)、MCP サーバー・外部ツールへの資格情報受け渡し、エージェント ID の標準化動向(TODO 前提)
- **H3 案**: 概要 / 2 つのアイデンティティモデル / トークンと委任の設計 / 権限の交差と最小化 / 監査と帰属 / 資格情報の受け渡し / 標準化の動向
- **関連**: tool-permissions-and-sandboxing、data-exfiltration、human-in-the-loop

### 3.2 強化(P2)

#### async-and-durable-agents.md(02)— 非同期・長時間タスクの設計

- 長時間タスクの中断・再開(チェックポイント)、キュー設計、冪等性、進捗通知、人の承認待ちの永続化、耐久実行(durable execution)の考え方とフレームワーク動向(TODO 前提)
- H3: 概要 / 同期の限界と非同期化の判断 / チェックポイントと再開 / 冪等性と重複実行 / 承認待ちの永続化 / 進捗の可視化

#### long-term-memory-implementation.md(03)— 長期記憶の実装

- memory-and-state(概念)の実装編。記憶の抽出(何を覚えるか)・保存形式(構造化 / ベクトル)・想起(いつ引くか)・陳腐化と忘却・ユーザー別記憶とプライバシー
- H3: 概要 / 抽出 / 保存 / 想起 / 更新と忘却 / プライバシーと削除要求

#### prompt-management.md(03)— プロンプト資産の管理

- プロンプトをコードと同格の資産として扱う: リポジトリ管理・テンプレート化・環境分離・変更フロー(レビュー + 回帰テスト)・実験管理、プロンプトレジストリ製品の動向(TODO 前提)
- H3: 概要 / 資産としてのプロンプト / バージョニングと環境 / 変更フロー / 実験と計測

#### red-teaming-agents.md(06)— エージェントのレッドチーミング

- 攻撃シナリオ設計(threat-model の実践編)、自動化(攻撃プロンプト生成・LLM vs LLM)、演習の運用(頻度・範囲・報告)、既知手法カタログの参照先、修正の優先順位付け
- H3: 概要 / 演習の設計 / 手動テストの型 / 自動化 / 結果の評価と修正 / 継続運用

#### compliance-and-governance.md(06)— コンプライアンスとガバナンス

- 規制の地図(EU AI Act 等の概観 — 変化前提で TODO 厚め)、個人データと会話ログ(保持・削除・越境)、AI 利用ポリシー策定、監査対応(記録すべきもの)、ベンダー契約の確認点(DPA・学習利用)
- H3: 概要 / 規制の全体像(2026 年時点) / データ保護と会話ログ / 社内ガバナンス / 監査への備え / ベンダー契約チェック
- 備考: 法的助言ではない旨の免責を冒頭に明記

#### online-evaluation-and-ab-testing.md(04)— オンライン評価と A/B テスト

- オフライン評価との補完関係、本番トラフィックでの品質シグナル、A/B・カナリアの設計(割付・停止基準)、ガードレールメトリクス、少トラフィック時の工夫
- H3: 概要 / オンラインで測るべきもの / A/B テストの設計 / カナリアと自動ロールバック / 落とし穴(多重比較・novelty 効果)

#### feedback-loops.md(05)— フィードバックループの運用

- 暗黙シグナル(再試行・放棄・修正)と明示シグナル(評価ボタン・報告)の収集、評価セットへの還流(evaluation-datasets と接続)、改善の優先順位付け、フィードバック疲れの回避
- H3: 概要 / シグナルの設計 / 収集の実装 / 評価・改善への還流 / 運用サイクル

#### computer-use-implementation.md(03)— ブラウザ・コンピュータ操作の実装

- computer-use(概念)の実装編。スクリーンショットループの実装、要素特定(座標 vs アクセシビリティツリー)、待機と検証、飛び道具(専用ブラウザツール・API 代替の優先)、安全策(確認ゲート・ドメイン制限)、評価(WebArena 系)
- H3: 概要 / 操作ループの実装 / 要素特定と安定化 / 「操作より API」の原則 / 安全策 / 評価とデバッグ

#### voice-agents.md(03)— 音声エージェントの実装

- パイプライン型(STT→LLM→TTS)vs speech-to-speech 型の選択、割り込み(barge-in)・ターンテイキング、レイテンシ設計、電話・WebRTC 接続、音声特有の評価(了解性・応答速度)、ツール呼び出しとの併用
- H3: 概要 / 2 つのアーキテクチャ / レイテンシ設計 / 会話制御 / ツール使用との統合 / 評価

#### fine-tuning-and-distillation.md(03)— ファインチューニングと蒸留

- プロンプト / RAG / FT の使い分け判断(FT は最後の手段になりやすい理由)、SFT・選好学習の概観、蒸留(上位モデル出力で小型を鍛える)、データ準備と評価、運用(モデル更新との共存)
- H3: 概要 / FT を選ぶ前のチェックリスト / 手法の概観 / 蒸留によるコスト削減 / データ準備 / 評価と運用

#### case-study-customer-support-agent.md(07)— ケーススタディ

- 構成事例(架空): 問い合わせ対応 Agent の段階導入。RAG + ツール(注文照会)+ エスカレーション設計 + オンライン評価。usecase-discovery〜feedback-loops の通し実例
- 既存 2 本と同形式(背景 → 設計 → 結果 → 教訓)

#### roi-and-business-case.md(09)— ROI とビジネスケース

- コスト側の全体(API 費 + 開発 + 運用 + レビュー人件費)、効果側の測り方(時間削減の罠・品質効果)、稟議の型(パイロットデータで語る)、失敗した投資の止め方
- H3: 概要 / コストの全体像 / 効果測定の設計 / ビジネスケースの組み立て / 継続判断

### 3.3 発展(P3)

- **multi-tenancy-and-isolation.md**(02): テナント分離(データ・プロンプト・レート・コスト)、noisy neighbor、テナント別設定の設計
- **agent-api-design.md**(02): エージェントを API として公開する際の設計(非同期ジョブ API・ストリーミング・冪等キー・部分結果・課金メータリング)
- **agent-benchmarks-landscape.md**(04): 公開ベンチマーク地図(SWE-bench 系・GAIA・WebArena・τ-bench 等)。llm-landscape と同じ鮮度管理型(最終確認日 + 定点観測)
- **case-study-knowledge-agent.md**(07): 社内ナレッジ RAG Agent の構成事例(権限反映検索・鮮度運用を主題に)

## 4. スコープ外(検討のうえ除外)

> **注**: 以下の 5 領域は本計画(プロフェッショナル必須の実務)からは除外しますが、除外理由に対処したうえで収録する別冊計画を [SUPPLEMENTARY-PLAN.md](SUPPLEMENTARY-PLAN.md) として作成済みです(2026-07-06)。

- **LLM 内部・学習理論**(Transformer 詳細・事前学習): ライブラリの前提(利用者視点)から外れる。fine-tuning 記事で必要最小限のみ
- **汎用 MLOps・データ基盤一般**: Agent 固有でない部分は外部参照に委ねる
- **ロボティクス・フィジカル AI**: 対象読者(ソフトウェアエンジニア)から遠い
- **特定業界の規制詳細**(金融・医療): compliance 記事で入口のみ示し、深掘りしない
- **プロンプトエンジニアリング一般論の再執筆**: agent-prompt-design / coding-agent-prompting で既カバー

## 5. フェーズ分割(ROADMAP 追記案)

1 セッション 1〜3 本の原則を維持。依存順(土台 → 実装 → 保証 → 発展)で並べています。

| フェーズ | 内容 | 成果物 | 優先 |
| --- | --- | --- | --- |
| D-0 | 09-business スケルトン(README・ROADMAP・ルート README・website SECTION_TITLES 等) | `09-business/README.md` ほか同期一式 | P1 |
| D-1 | スキルマップ + learning-roadmap 改訂 | `00-overview/skill-map.md` ほか | P1 |
| D-2 | ユースケース発見 + PoC→本番 | `usecase-discovery.md`, `poc-to-production.md` | P1 |
| D-R | Phase D レビュー | — | — |
| E-1 | RAG 実装パターン | `rag-implementation-patterns.md` | P1 |
| E-2 | 評価データセット + デプロイとスケーリング | `evaluation-datasets.md`, `deployment-and-scaling.md` | P1 |
| E-3 | エージェントの認証・認可 | `agent-identity-and-auth.md` | P1 |
| E-R | Phase E レビュー | — | — |
| F-1 | 非同期・耐久実行 + 長期記憶の実装 | `async-and-durable-agents.md`, `long-term-memory-implementation.md` | P2 |
| F-2 | プロンプト資産管理 + フィードバックループ | `prompt-management.md`, `feedback-loops.md` | P2 |
| F-R | Phase F レビュー | — | — |
| G-1 | レッドチーミング + コンプライアンス | `red-teaming-agents.md`, `compliance-and-governance.md` | P2 |
| G-2 | オンライン評価と A/B | `online-evaluation-and-ab-testing.md` | P2 |
| G-R | Phase G レビュー | — | — |
| H-1 | コンピュータ操作の実装 + 音声エージェント | `computer-use-implementation.md`, `voice-agents.md` | P2 |
| H-2 | ファインチューニングと蒸留 | `fine-tuning-and-distillation.md` | P2 |
| H-3 | ROI とビジネスケース + サポート Agent 事例 | `roi-and-business-case.md`, `case-study-customer-support-agent.md` | P2 |
| H-R | Phase H レビュー | — | — |
| I-1 | マルチテナント + Agent API 設計 | `multi-tenancy-and-isolation.md`, `agent-api-design.md` | P3 |
| I-2 | ベンチマーク地図 + ナレッジ Agent 事例 | `agent-benchmarks-landscape.md`, `case-study-knowledge-agent.md` | P3 |
| I-R | Phase I レビュー + 全体統合(learning-roadmap 最終化・依存マップ更新) | — | — |

完了時の規模: **60 → 83 本**(新規 23 本 + learning-roadmap 改訂 1 タスク。+ 新セクション 1)。P1 のみなら Phase D・E(+8 本)で「プロフェッショナルの背骨」が揃います。

## 6. 執筆前調査(変化の速いトピックのみ)

08 章・モデルガイドと同じ方式(公式一次情報 → `research/` にメモ)。対象は鮮度リスクの高い 6 本に限定します。

| ID | 対象 | 出力先 |
| --- | --- | --- |
| P-R1 | エージェント認証の標準化動向(OAuth 拡張・MCP 認証・各社 agent identity 機能) | `research/professional/agent-identity.md` |
| P-R2 | 耐久実行・ワークフローエンジンの動向(エージェント文脈) | `research/professional/durable-execution.md` |
| P-R3 | 音声エージェントの現行 API(リアルタイム音声の主要選択肢) | `research/professional/voice-agents.md` |
| P-R4 | 公開ベンチマーク一覧(リーダーボード・評価条件) | `research/professional/benchmarks.md` |
| P-R5 | 規制動向の一次情報(EU AI Act 施行状況ほか) | `research/professional/compliance.md` |
| P-R6 | FT・蒸留の各社公式メニュー(提供形態のみ) | `research/professional/fine-tuning.md` |

その他(RAG 実装・評価データセット・デプロイ等)は原則が安定しているため、執筆時の部分確認のみとします。

## 7. 同期・派生作業

- **GLOSSARY 候補**(執筆時確定): 耐久実行(durable execution)、リランキング(reranking)、チャンキング(chunking)、蒸留(distillation)、レッドチーミング(red teaming)、オンライン評価(online evaluation)、エージェント ID(agent identity)など
- **learning-roadmap**: 読者タイプ G(プロフェッショナル志向 = skill-map 起点の全周ルート)追加、依存図に 09 追加
- **website**: `SECTION_TITLES` に 09 追加、依存マップにノード追加(D-0 / I-R)、ホーム読者ルート更新
- **templates**: 変更不要(全ページ doc-template 準拠)。doc-template の category 列挙に `business` を追加(D-0)
- **examples**: RAG 最小サンプル(`examples/python/rag-basics/`)の追加を E-1 で判断(要ユーザー確認)

## 8. 決定ログと未確定事項

**決定済み**(2026-07-06、Phase D 着手時):

1. **新セクション名**: `09-business` を採用(推奨案どおり。キャリア面の skill-map は 00-overview 側に配置)
2. **実施範囲**: フェーズ単位で順次実施(Phase D から着手。以降は依頼単位で進める)

**決定済み**(2026-07-06、Phase E 着手時):

1. **examples の RAG サンプル**: 本計画には含めない(E-1 は記事のみ。動くサンプルはコーパス・ベクトル検索の依存が重く、既存 examples の「最小構成」方針に収まらないため。必要になったら独立タスクとして別途依頼)

**決定済み**(2026-07-07、Phase H 着手時):

1. **case-study の形式**: 既存 2 本と同じ「架空の構成事例」(冒頭注記付き)を継続(確立済みの形式であり、実在事例の引用は事実確認・許諾の負担が大きいため)

## 9. TODO

なし(P-R1〜P-R6 の調査はすべて実施済み。記録は `research/professional/` の各メモ、継続追跡は [ROADMAP.md](ROADMAP.md) の定期メンテナンスを参照)
