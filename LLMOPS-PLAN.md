# LLMOPS-PLAN — モデル運用・インフラ(LLMOps)追加計画

> **ステータス: 設計案(2026-07-07 作成、ユーザーの選定に基づく。着手指示待ち)。**
> モデルを「借りる・持つ・混ぜる」ためのインフラ層 — セルフホスト推論・ゲートウェイ・ローカル実行・キャッシュ・バッチ・既存 MLOps との統合 — の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存の 05-operations は「API 利用を前提とした Agent アプリの運用」(可観測性・コスト・デプロイ・インシデント)を完成させています。ギャップは**モデル提供層そのもののインフラ**です。

| 既存 | カバー範囲 | ギャップ(本計画) |
| --- | --- | --- |
| [deployment-and-scaling](docs/05-operations/deployment-and-scaling.md) | アプリ側の実行形態・容量・フォールバックの原則 | フォールバック・ルーティングを実装する**ゲートウェイという部品**の設計詳解 |
| [cost-management](docs/05-operations/cost-management.md) | トークン経済・プロンプトキャッシュ | **応答そのものの再利用(セマンティックキャッシュ)**・**バッチ API** の設計 |
| [model-selection](docs/03-implementation/model-selection.md) / [llm-landscape](docs/03-implementation/llm-landscape.md) | モデルの選び方・地図(API 前提) | **セルフホスト・ローカル実行**という提供形態の選択と運用 / **GPU・ハードウェアの基礎** |
| [versioning](docs/05-operations/versioning-and-model-updates.md) / [prompt-management](docs/03-implementation/prompt-management.md) / [observability](docs/05-operations/observability-and-tracing.md) | LLM アプリの資産・変更・観測(正本) | 既存 **MLOps 組織・基盤との統合**の設計(何を再利用し、何が別物か) |
| [fine-tuning-and-distillation](docs/03-implementation/fine-tuning-and-distillation.md) | オープンウェイトの自由(概念) | それを実際に「動かす」推論サービングの実務 |

SE 計画(閉域網)・compliance(データ所在)からの需要線もあります — 「API を使えない環境でどうするか」への技術的回答が本計画です。

### 配置

**新セクションは作らず、05-operations を中心に追加**します(#3 ローカル LLM のみ、モデル選定との近接性から 03-implementation)。05 は他計画と合わせ最大 15 本に育ちますが、インフラ系の並びを README 表で揃えます。

## 2. 追加トピック一覧(7 本)

| # | 配置 | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- | --- |
| 1 | 05-operations | `self-hosted-inference.md` | セルフホスト推論の実務 | advanced | 中(エンジン名は調査つきで) |
| 2 | 05-operations | `gpu-and-hardware-basics.md` | GPU・AI ハードウェアの基礎 | basic | 中(製品名は類型で) |
| 3 | 05-operations | `llm-gateway.md` | LLM ゲートウェイの設計 | intermediate | 中 |
| 4 | 03-implementation | `local-and-on-device-llm.md` | ローカル・オンデバイス LLM の実務 | intermediate | 中 |
| 5 | 05-operations | `semantic-caching.md` | セマンティックキャッシュと応答再利用 | intermediate | 安定 |
| 6 | 05-operations | `batch-processing.md` | バッチ処理の設計(バッチ API の活用) | intermediate | 安定 |
| 7 | 05-operations | `mlops-and-llmops.md` | MLOps と LLMOps の統合 | intermediate | 安定 |

## 3. 各ページの設計

### self-hosted-inference.md — セルフホスト推論の実務(05)

- **目的**: 「API を借りる」から「自分で提供する」に切り替える判断と、推論サービングの設計・運用ができる
- **主要トピック**: セルフホストの判断(データ主権・閉域網・コストの損益分岐・レイテンシ・カスタムモデル — 「原価が下がる」とは限らない構造)/ 推論サーバーの類型と代表例(高スループット系・軽量ローカル系。LO-R1 反映)/ スループットの作り(連続バッチング・KV キャッシュのメモリ管理 — 理論は [LLM-INTERNALS-PLAN.md](LLM-INTERNALS-PLAN.md) の inference-internals に委譲予定)/ GPU メモリの見積り(パラメータ × 精度 + KV キャッシュ)/ 量子化の運用判断(品質検証とセット)/ 監視(GPU 使用率・スループット・キュー)/ モデル更新の運用(重みの配布・切り替え)
- **分担**: どのモデルを選ぶか = model-selection / llm-landscape、アプリ側の容量設計 = deployment-and-scaling

### gpu-and-hardware-basics.md — GPU・AI ハードウェアの基礎(05)

- **目的**: インフラ選定の会話に参加できる最小限のハードウェア知識(VRAM・帯域・類型・調達)を持てる
- **主要トピック**: なぜ GPU か(並列行列積)/ VRAM とモデルサイズの関係(概算式と量子化の効果)/ メモリ帯域律速という直感(推論は帯域で決まる場面が多い)/ ハードの類型(データセンター GPU / コンシューマ GPU / NPU・端末アクセラレータ — 製品名でなく類型で)/ 調達の選択肢(クラウド GPU・専有・オンプレ購入)と TCO の考え方 / 「GPU を持つ」ことの運用負担
- **分担**: 詳細な理論 = LLM-INTERNALS(採用時)。本記事は選定会話に必要な範囲

### llm-gateway.md — LLM ゲートウェイの設計(05)

- **目的**: 複数モデル・複数プロバイダー・複数チームの利用を一元化するゲートウェイ層を設計できる
- **主要トピック**: ゲートウェイが解く問題(キー管理の一元化・モデル抽象化・使用量とコストの集計・監査ログ・レート制御)/ 構成の類型(薄い自作プロキシ / OSS ゲートウェイ / マネージド)と判断軸 / ルーティング設計(用途別のモデル振り分け — model-selection のティア混在の実装点)/ フォールバック・リトライ・サーキットブレーカの実装点(原則は deployment-and-scaling / error-handling が正本)/ マルチテナント制御との統合([multi-tenancy-and-isolation](docs/02-architecture/multi-tenancy-and-isolation.md) のクォータの実装点)/ 落とし穴(単一障害点化・抽象化によるモデル固有機能の喪失・ゲートウェイ自体の運用負担)
- **分担**: 上記のとおり原則系 3 本が正本。本記事は「それらを 1 つの部品に集約する」設計論

### local-and-on-device-llm.md — ローカル・オンデバイス LLM の実務(03)

- **目的**: 端末・エッジでの LLM 実行を、ユースケース選定から品質検証まで設計できる
- **主要トピック**: 向くユースケース(オフライン・プライバシー・低レイテンシ・ゼロ限界費用)/ 実行環境の類型(端末 CPU/GPU/NPU・エッジサーバー・ブラウザ)/ モデルと形式の選定(小型モデル・量子化フォーマットの類型)/ 品質ギャップの検証(クラウド上位モデルとの差を自社タスクで測る — 評価章接続)/ ハイブリッド構成(ローカル優先 + クラウド昇格の設計)/ 配布と更新(モデルファイルの配布・互換性)
- **分担**: 小型モデルの選定軸 = model-selection、セルフホスト(サーバー側)= self-hosted-inference

### semantic-caching.md — セマンティックキャッシュと応答再利用(05)

- **目的**: 「同じような質問に同じ答えを返す」キャッシュを、**誤ヒット(間違った答えを高速に返す)を制御しながら**設計できる
- **主要トピック**: キャッシュの階層(完全一致 → 正規化一致 → 意味的類似)/ セマンティックキャッシュの構造(埋め込み + しきい値)と本質的リスク(類似 ≠ 同一。誤ヒットの被害設計)/ キャッシュしてよい応答の判断(決定的・非パーソナライズ・鮮度不問)/ 無効化戦略(知識源更新・プロンプト変更・モデル更新との連動 — versioning 接続)/ テナント・ユーザー境界(multi-tenancy の原則の実装)/ 計測(ヒット率と品質低下の両方を見る)
- **分担**: プロンプトキャッシュ(入力側)= cost-management / attention-and-context(正本)。本記事は応答(出力側)の再利用

### batch-processing.md — バッチ処理の設計(05)

- **目的**: 「すぐ要らない大量処理」をバッチ API・オフライン実行で安く確実に流す設計ができる
- **主要トピック**: バッチ API の性質(納期保証と引き換えの割引・容量の別枠)/ 向くワークロード(評価スイート・埋め込み再計算・要約バックフィル・分類の一括処理)/ ジョブ設計(分割・失敗の部分再投入・冪等性 — async-and-durable の原則の適用)/ リアルタイム処理との振り分け(同じ処理の 2 経路化)/ コスト・納期の見積りと監視
- **分担**: 冪等性・再開 = async-and-durable-agents、コスト構造 = cost-management

### mlops-and-llmops.md — MLOps と LLMOps の統合(05)

- **目的**: 既存の ML 基盤・ML チームを持つ組織で、LLM アプリ運用(LLMOps)を二重投資なく統合できる
- **主要トピック**: 共通点(実験管理・バージョニング・監視・データパイプライン)と相違点(モデルを作らない前提・プロンプトという新資産・確率的な評価・変更サイクルの速さ)/ 再利用できる既存基盤(実験管理・特徴量ストア・監視)とできないもの / 役割分担(ML チーム / LLM アプリチーム / プラットフォームチーム)/ ツール類型(LLM 特化型 vs 既存 MLOps 拡張)/ FT を始めた時の合流点(fine-tuning 接続)
- **分担**: versioning・prompt-management・observability が個別領域の正本。本記事は組織・基盤の統合設計

## 4. スコープ外(検討のうえ除外)

- **学習(事前学習・FT)のインフラ**(GPU クラスタでの分散学習): fine-tuning-and-distillation と LLM-INTERNALS の除外判断を踏襲
- **特定クラウドの構成手順**(各社 GPU インスタンスのセットアップ): 類型と判断軸まで
- **推論エンジンのチューニング詳解**(カーネル・コンパイル最適化): 運用者が知るべき範囲まで
- **Kubernetes 等の汎用インフラ運用**: LLM 固有の要件まで

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AF・AG** を使います(AD・AE は [DATA-KNOWLEDGE-PLAN.md](DATA-KNOWLEDGE-PLAN.md) が使用)。新セクションがないためスケルトンフェーズは不要です。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AF-1 | セルフホスト推論(LO-R1 反映)+ GPU・ハードウェア基礎 | `self-hosted-inference.md`, `gpu-and-hardware-basics.md` | LO-R1 必須 |
| AF-2 | LLM ゲートウェイ(LO-R1 反映) | `llm-gateway.md` | — |
| AF-R | Phase AF レビュー(deployment / model-selection / multi-tenancy からの逆リンク・published 化・同期一式) | — | — |
| AG-1 | ローカル・オンデバイス LLM + セマンティックキャッシュ | `local-and-on-device-llm.md`, `semantic-caching.md` | LO-R1 を再利用 |
| AG-2 | バッチ処理 + MLOps 統合 | `batch-processing.md`, `mlops-and-llmops.md` | 調査不要 |
| AG-R | Phase AG レビュー + 統合(cost-management / versioning / SE 計画の閉域網記事(あれば)との相互リンク・published 化・同期一式・定期メンテナンス追加) | — | — |

完了時の規模: **92 → 99 本**(05: 8 → 14、03: 15 → 16。承認済み他計画とすべて完了なら 142 本)。

## 6. 執筆前調査

| ID | 対象 | 出力先 | 時期 |
| --- | --- | --- | --- |
| LO-R1 | サービング・ローカル実行・ゲートウェイの主要 OSS / 製品の現在地(推論エンジン・ローカル実行系・ゲートウェイ OSS の公式リポジトリ / ドキュメント。提供形態・ライセンス・主要機能のみ。ベンチマーク数値は扱わない) | `research/llmops/serving.md` | AF-1 着手時(必須。AG-1 でも再利用) |

代表例を名前で挙げる記事(self-hosted / local / gateway)があるため、async-and-durable-agents(P-R2)と同じ「調査メモに裏付けられた名前の列挙 + TODO 前提」方式を採ります。他 4 本は原則安定のため調査不要です。

## 7. 同期・派生作業

- **GLOSSARY 候補**(執筆時確定): LLM ゲートウェイ(LLM gateway)、セマンティックキャッシュ(semantic cache)、連続バッチング(continuous batching)、量子化(quantization — LLM-INTERNALS 採用時はそちらの inference-internals と分担)、小型言語モデル(SLM)、LLMOps
- **逆リンク**(各 X-R で実施): deployment-and-scaling → llm-gateway / self-hosted-inference、cost-management → semantic-caching / batch-processing、model-selection → local-and-on-device-llm / self-hosted-inference、llm-landscape → self-hosted-inference(オープンウェイトの受け皿)、multi-tenancy-and-isolation → llm-gateway、versioning-and-model-updates → mlops-and-llmops、fine-tuning-and-distillation → self-hosted-inference / mlops-and-llmops
- **他計画との接続**: SE 計画の `se-enterprise-constraints`(閉域網)から self-hosted-inference / local-and-on-device-llm への導線。LLM-INTERNALS 採用時は inference-internals(理論)↔ self-hosted-inference(運用)の対リンク
- **learning-roadmap**: 変更不要の見込み(セクション追加なし)
- **定期メンテナンス**(AG-R): 「サービング・ゲートウェイ OSS の定点観測」を ROADMAP に追加(research/llmops/ を更新起点に)

## 8. 未確定事項(着手時に確認)

1. **7 本の粒度**: 縮小案は 5 本(#2 GPU 基礎を #1 に統合、#6 バッチを cost-management の改訂で吸収)。網羅性を優先するなら 7 本を推奨
2. **local-and-on-device-llm の配置**: 推奨は 03(モデル選定との近接)。運用色を強めるなら 05 も可
3. **LO-R1 の範囲**: 推奨は「エンジン・ゲートウェイの提供形態とライセンスまで」(性能比較はしない)

## 9. TODO

> **TODO(要確認):** LO-R1(サービング・ゲートウェイ動向)は AF-1 着手時に実施する。推論エンジン・ローカル実行系は開発が活発で機能差が動きやすいため、本文は「代表例 + 選定軸」に留め、詳細は公式ドキュメント参照とする(最終確認: 2026-07)
