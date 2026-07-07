# SUPPLEMENTARY-PLAN — 周辺・基礎領域 拡張計画(EXPANSION-PLAN 除外項目の別冊)

> **ステータス: 設計案(2026-07-06 作成、未承認)。**
> [EXPANSION-PLAN.md](EXPANSION-PLAN.md) §4 で「検討のうえ除外」とした 5 領域を、**除外理由に対処したうえで収録する**ための別冊計画です。
> 位置づけ: EXPANSION-PLAN が「プロフェッショナルに必須の実務」を担うのに対し、本計画は「理解を深くする基礎」と「隣接領域の地図」を担います。優先度は全体として EXPANSION-PLAN より低く、**着手は EXPANSION の P1(Phase D〜E)完了後を推奨**します。

## 1. 方針: 「除外理由」への対処法

除外した理由は領域ごとに異なるため、対処法(= 収録の条件)を先に定義します。これが本計画の設計原則です。

| 除外領域 | 除外した理由 | 収録の条件(対処法) |
| --- | --- | --- |
| A. LLM 内部・学習理論 | 利用者視点から外れ、理論書になりがち | **「設計・デバッグの判断に効く範囲」に限定**する。数式ではなく「なぜそう振る舞うか」の直感を提供し、各記事を既存の実務記事(コスト・キャッシュ・幻覚対策)へ接続する |
| B. 汎用 MLOps・データ基盤 | Agent 固有でない部分が大半 | **Agent 固有の部分(会話ログという特殊なデータ)だけを切り出す**。汎用基盤(ETL・DWH 一般)は外部参照に委ねる |
| C. ロボティクス・フィジカル AI | 対象読者(ソフトウェアエンジニア)から遠い | **概観 1 本のみ**。「ソフトウェア Agent の知識がどこまで通用し、何が違うか」という接続視点で書き、実装には踏み込まない |
| D. 特定業界の規制詳細 | 変化が速く、法的助言リスクがある | **「入口マップ」方式**: 何をどの一次情報で確認しに行くかだけを示し、規制内容の解説はしない。免責を冒頭に明記し、鮮度管理(最終確認日 + 定点観測 TODO)を必須にする |
| E. プロンプトエンジニアリング一般論 | Agent 向け(agent-prompt-design 等)で既カバー | **「技法カタログ」として 1 本に集約**し、既存記事の前提(初学者の入口)として位置づける。既存記事との重複は「Agent 特化は既存が正、汎用技法は本記事が正」で分担 |

## 2. 追加トピック一覧(11 本 + 新セクション 1)

| # | 配置 | ファイル | 仮タイトル | level | 優先 | 領域 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 10-llm-foundations(新設) | `how-llms-generate-text.md` | LLM はどうやってテキストを生成するか | basic | S1 | A |
| 2 | 10-llm-foundations | `tokenization.md` | トークナイザとトークン経済 | basic | S1 | A |
| 3 | 10-llm-foundations | `attention-and-context.md` | 注意機構とコンテキストウィンドウの仕組み | intermediate | S1 | A |
| 4 | 10-llm-foundations | `llm-training-pipeline.md` | LLM の学習パイプライン(事前学習から選好調整まで) | intermediate | S1 | A |
| 5 | 10-llm-foundations | `capabilities-and-limits.md` | LLM の能力と限界の由来 | intermediate | S2 | A |
| 6 | 05-operations | `conversation-data-management.md` | 会話データの管理基盤 | advanced | S2 | B |
| 7 | 03-implementation | `prompt-engineering-fundamentals.md` | プロンプトエンジニアリングの基礎技法 | basic | S2 | E |
| 8 | 01-concepts | `physical-ai-overview.md` | フィジカル AI とロボティクスの概観 | basic | S3 | C |
| 9 | 09-business(EXPANSION で新設予定) | `industry-regulations-map.md` | 業界別規制の入口マップ | intermediate | S2 | D |
| 10 | 09-business | `finance-agent-considerations.md` | 金融ドメインで Agent を作るときの考慮点 | advanced | S3 | D |
| 11 | 09-business | `healthcare-agent-considerations.md` | 医療ドメインで Agent を作るときの考慮点 | advanced | S3 | D |

優先度: **S1** = 本計画の中核(基礎理解の底上げ効果が大きい)/ **S2** = 推奨 / **S3** = 需要が確認できたら。

**新セクション**: `docs/10-llm-foundations/`(LLM 基礎)を新設します。5 本規模で、01-concepts(Agent の概念)とは主題が異なるためです(01 は「Agent とは何か」、10 は「LLM 自体がなぜそう振る舞うか」)。セクション番号は EXPANSION-PLAN の `09-business` が先行する前提です(09 が不採用なら本セクションを 09 に繰り上げ)。

## 3. 各ページの設計

### 3.1 LLM 基礎(10-llm-foundations、5 本)

全記事共通の設計原則: **数式・実装ではなく「実務の判断に効く直感」**。各記事の末尾で「この理解が効く場面」として既存記事へ接続します。

#### how-llms-generate-text.md — LLM はどうやってテキストを生成するか

- **目的**: 「次トークン予測の繰り返し」というモデルの実体を理解し、温度・サンプリングなどの推論パラメータを設計判断として扱えるようになる
- **主要トピック**: 次トークン予測と自己回帰生成、確率分布とサンプリング(temperature / top-p の意味と使いどころ)、決定性が保証されない理由、停止条件、ストリーミングがなぜ可能か
- **H3 案**: 概要 / 次トークン予測という実体 / サンプリングと温度 / 「同じ入力で違う出力」の理由 / この理解が効く場面(構造化出力・再現性・評価のばらつき)
- **接続先**: [構造化出力](docs/03-implementation/structured-output.md)、[Agent 評価の基礎](docs/04-evaluation/agent-evaluation-basics.md)(非決定性)

#### tokenization.md — トークナイザとトークン経済

- **目的**: 課金・コンテキスト・多言語効率の単位である「トークン」を正しく見積もれるようになる
- **主要トピック**: サブワード分割の直感、日本語・コードのトークン効率(英語との差)、トークナイザがモデル間で異なる影響(移行時のコスト再見積り — Claude 新トークナイザの実例)、トークン数の数え方(API・ツール)、「文字数 ≠ トークン数」の落とし穴
- **H3 案**: 概要 / トークンとは何か / 言語・内容による効率差 / モデル間の互換性 / 見積りと計測の実務
- **接続先**: [コスト管理](docs/05-operations/cost-management.md)、[主要 LLM の全体像](docs/03-implementation/llm-landscape.md)

#### attention-and-context.md — 注意機構とコンテキストウィンドウの仕組み

- **目的**: 「なぜ長いコンテキストで品質と速度が落ちるのか」「なぜプロンプトキャッシュは前方一致なのか」を仕組みから説明できるようになる
- **主要トピック**: 注意機構の直感(全トークン間の参照)、コンテキスト長と計算量・メモリの関係、KV キャッシュ(= プロンプトキャッシュの実体。前方一致・無効化の理由)、位置と想起の偏り(lost in the middle)、長コンテキスト対応の工夫(概観)
- **H3 案**: 概要 / 注意機構の直感 / コンテキスト長のコスト構造 / KV キャッシュとプロンプトキャッシュ / 長文での品質劣化 / この理解が効く場面
- **接続先**: [コンテキストエンジニアリング](docs/02-architecture/context-engineering.md)(既存の実務原則の理論的裏付け)、[レイテンシ最適化](docs/05-operations/latency-optimization.md)

#### llm-training-pipeline.md — LLM の学習パイプライン

- **目的**: 事前学習 → SFT → 選好調整という工程を理解し、「なぜ指示に従うのか」「幻覚・迎合はどこから来るのか」を説明できるようになる
- **主要トピック**: 事前学習(次トークン予測と知識の獲得、knowledge cutoff の意味)、指示チューニング(SFT)、選好調整(RLHF / DPO の直感)、幻覚・迎合(sycophancy)の由来、システムプロンプトが効く理由と限界
- **H3 案**: 概要 / 事前学習 / 指示チューニング / 選好調整 / この工程から生まれる性質(幻覚・迎合・拒否) / この理解が効く場面
- **接続先**: [ガードレール](docs/06-security/guardrails.md)(指示は「お願い」である理由)、[ファインチューニングと蒸留](EXPANSION-PLAN.md の #18)(前提知識)

#### capabilities-and-limits.md — LLM の能力と限界の由来

- **目的**: 「なぜ計算が苦手でコードが得意か」「なぜツールを持たせると解決するか」を構造から理解し、能力の見積りを誤らなくなる
- **主要トピック**: 得意・不得意の由来(パターン補完 vs 厳密計算)、ツール使用が限界を補う構図(01 の tool-use の理論的裏付け)、スケーリングと世代差の見方、ベンチマークと実能力の乖離、「できそうでできないこと」の見抜き方
- **H3 案**: 概要 / 得意と不得意の構造 / ツールによる補完 / 世代差とスケーリングの読み方 / 能力見積りの実務
- **接続先**: [ツール使用](docs/01-concepts/tool-use.md)、[モデル選定ガイド](docs/03-implementation/model-selection.md)

### 3.2 Agent 固有のデータ基盤(05-operations、1 本)

#### conversation-data-management.md — 会話データの管理基盤

- **目的**: 会話ログという「機微情報を含む非構造データ」を、分析・改善に使える形で安全に管理できるようになる
- **主要トピック**: 収集設計(トレースとの関係 — observability の下流)、個人情報のマスキング・仮名化、保持期間と削除(ユーザー削除要求への対応)、分析への活用(失敗抽出 → 評価セットへ。EXPANSION の feedback-loops / evaluation-datasets と接続)、アクセス制御(誰が会話を読めるか)
- **H3 案**: 概要 / 収集とトレースの関係 / 機微情報の処理 / 保持・削除の設計 / 分析・改善への活用 / アクセス統制
- **境界**: 汎用データ基盤(DWH・ETL 製品選定)は扱わない(除外理由 B への対処)

### 3.3 プロンプト技法カタログ(03-implementation、1 本)

#### prompt-engineering-fundamentals.md — プロンプトエンジニアリングの基礎技法

- **目的**: 汎用のプロンプト技法を名前と使いどころで整理し、Agent 向け記事(agent-prompt-design 等)を読む前提を揃える
- **主要トピック**: 明確な指示・役割付与・区切りの基本、few-shot(例示)の設計、思考の誘導(段階的推論)と限界(推論モデル時代の位置づけの変化)、タスク分解、出力形式の指定(構造化出力への接続)、反復改善の進め方、技法の効果は**モデル世代で変わる**という注意
- **H3 案**: 概要 / 基本原則 / 例示(few-shot) / 思考の誘導と推論モデル / 分解と連鎖 / 形式指定 / 技法の陳腐化との付き合い方
- **分担**: Agent のシステムプロンプト設計は [agent-prompt-design](docs/03-implementation/agent-prompt-design.md)、コーディングエージェントへの依頼は [coding-agent-prompting](docs/08-coding-agents/coding-agent-prompting.md) が正。本記事は汎用技法のみ(除外理由 E への対処)

### 3.4 フィジカル AI 概観(01-concepts、1 本)

#### physical-ai-overview.md — フィジカル AI とロボティクスの概観

- **目的**: ソフトウェア Agent の知識が物理世界の Agent(ロボット)にどこまで通用し、何が本質的に違うかを説明できるようになる
- **主要トピック**: フィジカル AI の全体像(VLA: Vision-Language-Action モデルの位置づけ)、ソフトウェア Agent との共通構造(観測 → 思考 → 行動ループ)と相違(失敗の不可逆性・リアルタイム制約・シミュレーション)、コンピュータ操作型 Agent との連続性、2026 年時点の成熟度(調査前提・TODO 厚め)
- **H3 案**: 概要 / ソフトウェア Agent との共通点 / 本質的に違う点 / VLA モデルの概観 / 現在地と展望
- **境界**: 実装(ROS・制御)には踏み込まない(除外理由 C への対処)

### 3.5 業界規制(09-business、3 本)

> 3 本共通: 冒頭に「本記事は法的助言ではない」免責を明記。規制の**内容解説はせず**、「何を・どの一次情報で確認するか」のマップに徹する。ツールページと同じ鮮度 3 点セット(最終確認日 / 出典アクセス日 / 定点観測 TODO)を必須とする(除外理由 D への対処)。

#### industry-regulations-map.md — 業界別規制の入口マップ

- **目的**: 自分の業界で Agent を作るとき、着手前に確認すべき規制・ガイドラインの「在り処」が分かる
- **主要トピック**: 横断規制(AI 規制・個人情報保護)と業界規制の 2 層構造、業界別の確認先マップ(金融・医療・公共・教育など: 主務官庁・業界ガイドラインの名前と URL)、社内の確認体制(法務・コンプラとの協働の型)、EXPANSION の compliance-and-governance(横断)との分担
- **H3 案**: 概要と免責 / 規制の 2 層構造 / 業界別の確認先マップ / 法務と協働するための準備 / 更新の追い方

#### finance-agent-considerations.md / healthcare-agent-considerations.md(S3・需要確認後)

- **目的**: 規制の厳しい 2 大ドメインで、Agent 設計に固有の考慮点(説明責任・記録・人の最終判断・データ域外移転)を設計に落とせる
- **形式**: 「規制解説」ではなく「設計チェックリスト + 確認先」。国内(日本)を主、海外は参照のみ
- **備考**: 執筆には当該ドメイン知識の裏取りが重く、**ユーザー(またはドメイン有識者)のレビューを完了条件に含める**ことを推奨

## 4. それでもスコープ外とするもの

本計画でも収録しないと判断したもの(将来の再検討は可):

- **自前での事前学習・大規模学習インフラ**(GPU クラスタ運用・分散学習)— 利用者視点を大きく超える
- **モデルアーキテクチャの研究動向解説**(論文追跡)— 鮮度管理コストが便益を上回る
- **ロボットの制御・ハードウェア実装** — 概観(physical-ai-overview)まで
- **国別・網羅的な法規制データベース化** — 入口マップまで(内容解説はしない)
- **数学的基礎(線形代数・確率)の教材化** — 外部教材に委ねる

## 5. フェーズ分割(ROADMAP 追記案)

EXPANSION-PLAN のフェーズ(D〜I)と記号が衝突しないよう、**Phase J〜L** を使用します。着手推奨順は「EXPANSION P1(D〜E)→ 本計画 J → EXPANSION P2 と並行可」です。

| フェーズ | 内容 | 成果物 | 優先 |
| --- | --- | --- | --- |
| J-0 | 10-llm-foundations スケルトン(README・同期一式・website 反映) | `10-llm-foundations/README.md` ほか | S1 |
| J-1 | 生成の仕組み + トークナイザ | `how-llms-generate-text.md`, `tokenization.md` | S1 |
| J-2 | 注意機構 + 学習パイプライン | `attention-and-context.md`, `llm-training-pipeline.md` | S1 |
| J-3 | 能力と限界 | `capabilities-and-limits.md` | S2 |
| J-R | Phase J レビュー(既存記事からの逆リンク追加: context-engineering → attention 等) | — | — |
| K-1 | プロンプト技法カタログ | `prompt-engineering-fundamentals.md` | S2 |
| K-2 | 会話データの管理基盤 | `conversation-data-management.md` | S2 |
| K-R | Phase K レビュー | — | — |
| L-1 | フィジカル AI 概観 + 業界規制の入口マップ | `physical-ai-overview.md`, `industry-regulations-map.md` | S2〜S3 |
| L-2 | 金融・医療の考慮点(需要確認後。ドメインレビュー必須) | `finance-agent-considerations.md`, `healthcare-agent-considerations.md` | S3 |
| L-R | Phase L レビュー + learning-roadmap / 依存マップへの 10 セクション統合 | — | — |

完了時の規模: EXPANSION 全量と合わせて **84 → 95 本**(新セクション計 2)。

## 6. 執筆前調査

LLM 基礎(J)は原理が安定しているため個別調査は不要(執筆時の部分確認のみ)。調査が必要なのは次の 3 件です。

| ID | 対象 | 出力先 |
| --- | --- | --- |
| Q-R1 | フィジカル AI / VLA の現在地(主要プレイヤーの公式情報のみ・概観レベル) | `research/supplementary/physical-ai.md` |
| Q-R2 | 業界規制の一次情報 URL 集(官庁・業界団体の現行ガイドライン所在確認) | `research/supplementary/regulations.md` |
| Q-R3 | 会話データ関連の規制要件(個人情報保護の現行運用。EXPANSION P-R5 と統合可) | `research/supplementary/data-regulations.md` |

## 7. 同期・派生作業

- **GLOSSARY 候補**: トークナイザ(tokenizer)、KV キャッシュ(KV cache)、SFT(教師ありファインチューニング)、選好調整(preference tuning / RLHF)、幻覚(hallucination — 既出なら再利用)、VLA(Vision-Language-Action)、few-shot
- **既存記事への逆リンク**(J-R で実施): context-engineering → attention-and-context、cost-management → tokenization、guardrails → llm-training-pipeline、tool-use → capabilities-and-limits(いずれもリンク追加のみ)
- **learning-roadmap / 依存マップ**: 10-llm-foundations は「01 の前提を深める任意の基礎」として点線接続(L-R)
- **doc-template**: category 列挙に `llm-foundations` を追加(J-0)
- **website**: SECTION_TITLES に 10 追加、依存マップにノード追加(J-0 / L-R)

## 8. 未確定事項(ユーザー判断待ち)

1. **着手順**: 推奨は「EXPANSION P1(D〜E)→ 本計画 J」だが、基礎(J)を先行させる選択もある(チームの学習用途が主目的なら J 先行が合理的)
2. **新セクション名と番号**: `10-llm-foundations` 案(09-business の採否に依存)
3. **業界規制 2 本(L-2)の扱い**: 計画に含めたが、ドメイン有識者レビューを完了条件にできない場合は「入口マップ 1 本まで」に縮小することを推奨
4. **フィジカル AI**: 概観 1 本で十分か(需要があれば将来 VLA 実装入門等に拡張)

## 9. TODO

> **TODO(要確認):** Q-R1〜Q-R3 の調査は各フェーズ着手時に実施する(本計画作成時点では未調査)(最終確認: 2026-07)

> **TODO(要確認):** 本計画のセクション番号(10-llm-foundations)は EXPANSION-PLAN の 09-business 採否確定後に最終化する(最終確認: 2026-07)
