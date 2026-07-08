# DATA-KNOWLEDGE-PLAN — データ・知識基盤 追加計画

> **ステータス: 完了(2026-07-07 作成。2026-07-08 に Phase AD(embeddings / vector-databases / data-preprocessing-for-llm)と Phase AE(graph-rag-and-knowledge-graphs / synthetic-data-for-training / data-governance-for-ai)を完了 = 全 6 本 published)。**
> RAG・記憶・学習の品質を下から決める**データ・知識基盤**(埋め込み・ベクトル DB・ナレッジグラフ・前処理・合成データ・データガバナンス)の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存の RAG・記憶系記事は「検索と生成の設計」を扱いますが、その**下層にある基盤の選定・構築・運用**は 1 段の言及にとどまっています。

| 既存 | カバー範囲 | ギャップ(本計画) |
| --- | --- | --- |
| [rag-implementation-patterns](docs/03-implementation/rag-implementation-patterns.md) | チャンキング・検索方式・リランキング(パイプラインの設計) | **埋め込みモデルの選定詳解**・**ベクトル DB の選定運用**・**チャンキング以前の前処理**・**グラフ型の知識表現** |
| [evaluation-datasets](docs/04-evaluation/evaluation-datasets.md) | 評価用データ(合成の危険を含む) | **学習用**合成データ(蒸留・SFT・選好データの生成と品質管理) |
| [fine-tuning-and-distillation](docs/03-implementation/fine-tuning-and-distillation.md) | FT の判断・手法概観 | 同上(データ生成側の詳解) |
| [conversation-data-management](docs/05-operations/conversation-data-management.md) | 会話データ(AI が生むデータ) | **知識源データ**(AI に食わせるデータ)のガバナンス |
| [case-study-knowledge-agent](docs/07-case-studies/case-study-knowledge-agent.md) | 「知識源の品質が Agent の品質」を物語で提示 | その一般化(オーナーシップ・カタログ・品質基準の設計論) |

### 配置

**新セクションは作らず、既存章に追加**します(#1〜5 → 03-implementation、#6 → 05-operations)。この領域は独立テーマではなく既存記事の直下の層であり、rag-implementation-patterns 等からの導線が最短になる配置を優先します。03 は既承認計画と合わせると最大 23 本まで育ちますが、セクション README の表で「データ・知識基盤」の並びを揃えて視認性を保ちます。

### 本計画の特徴: 調査タスクなしで着手可能

6 本すべて原則が安定した領域です。製品・モデルの具体名は本文に置かず(類型と選定軸で書く)、**専用の執筆前調査を設けません**(執筆時の部分確認のみ)。埋め込みモデルやベクトル DB の「カタログ化」は意図的にスコープ外とします(§4)。

## 2. 追加トピック一覧(6 本)

| # | 配置 | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- | --- |
| 1 | 03-implementation | `embeddings.md` | 埋め込み(embeddings)の選定と運用 | advanced | 安定(モデル名は不掲載) |
| 2 | 03-implementation | `vector-databases.md` | ベクトルデータベースの選定と運用 | intermediate | 安定(製品名は類型で) |
| 3 | 03-implementation | `data-preprocessing-for-llm.md` | LLM 向けデータ前処理パイプライン | intermediate | 安定 |
| 4 | 03-implementation | `graph-rag-and-knowledge-graphs.md` | GraphRAG とナレッジグラフ | advanced | 中 |
| 5 | 03-implementation | `synthetic-data-for-training.md` | 学習用合成データの実務 | advanced | 中(利用条件は TODO 前提) |
| 6 | 05-operations | `data-governance-for-ai.md` | AI のためのデータガバナンス | intermediate | 安定 |

## 3. 各ページの設計

### embeddings.md — 埋め込みの選定と運用(03)

- **目的**: RAG・記憶・分類の土台である埋め込みモデルを、根拠を持って選定・評価・運用できる
- **主要トピック**: 埋め込みの実体と類似度の意味(何が「近い」のか)/ 選定軸(対応言語・ドメイン適合・最大入力長・次元・コスト)/ 次元のトレードオフ(精度 vs 保存・検索コスト。次元削減の選択肢)/ 非対称検索(クエリと文書で扱いを変える・指示付き埋め込み)/ チャンクサイズとの相互作用 / 微調整はいつ効くか(語彙が特殊なドメイン)/ 評価(自社検索評価セットでの比較 — 公開ベンチマークの読み方は [agent-benchmarks-landscape](docs/04-evaluation/agent-benchmarks-landscape.md) と同じ規律)/ **運用の最重要問題: モデル更新 = 全再インデックス**(バージョン固定・移行の設計)
- **分担**: 検索パイプライン全体 = rag-implementation-patterns(正本)。モデルカタログは作らない(§4)

### vector-databases.md — ベクトルデータベースの選定と運用(03)

- **目的**: ベクトル検索基盤を、過剰でも過小でもない構成で選定・運用できる
- **主要トピック**: 選択肢の類型(専用ベクトル DB / 既存 DB のベクトル拡張 / マネージド検索サービス / ライブラリ内蔵)と判断軸(規模・チーム・既存資産)/ 近似最近傍探索の直感(再現率と速度のトレードオフ・インデックス方式の概観)/ メタデータフィルタとハイブリッド検索の対応力(権限反映・テナント分離の実装要件 — [multi-tenancy-and-isolation](docs/02-architecture/multi-tenancy-and-isolation.md) 接続)/ スケールとコスト構造(メモリ常駐 vs ディスク)/ 運用(再インデックス・バックアップ・監視)/ 「小規模なら単純解でよい」判断(数万件までの現実解)
- **分担**: 検索方式の使い分け = rag-implementation-patterns

### data-preprocessing-for-llm.md — LLM 向けデータ前処理パイプライン(03)

- **目的**: チャンキングの**前**にある工程(収集・抽出・クリーニング・重複排除・メタデータ付与)を、検索品質の上限を決める工程として設計できる
- **主要トピック**: 前処理パイプラインの全体像と「ゴミを入れればゴミが出る」構造 / フォーマット別抽出(HTML・Office・PDF。スキャン系の詳細は MULTIMODAL 計画の document-ai が採用されればそちらへ委譲)/ クリーニング(ボイラープレート・ナビゲーション除去・文字化け)/ 重複・準重複の排除(同一文書の版違い問題)/ メタデータ設計(出典・更新日・権限・オーナー — 取り込み時に付けないと後から付けられない)/ 増分更新と再処理の運用(鮮度管理の実装 — knowledge-agent 事例の技術側)
- **分担**: チャンキング以降 = rag-implementation-patterns(正本)

### graph-rag-and-knowledge-graphs.md — GraphRAG とナレッジグラフ(03)

- **目的**: ベクトル検索が苦手な質問(多段の関係・全体集約)に対する、グラフ型知識表現の使いどころを判断できる
- **主要トピック**: ナレッジグラフの基礎(エンティティ・関係・スキーマ)/ LLM によるグラフ構築(抽出・正規化・重複解決の現実と精度限界)/ GraphRAG の型(①エンティティ検索 + グラフ辿り ②コミュニティ要約型 ③ベクトル検索との併用)/ 向く質問と向かない質問(「A と B の関係は」「全体でいくつ」vs 単純な事実検索)/ 構築・維持コスト(グラフの鮮度・スキーマ変更)と「本当にグラフが要るか」の判断 / 評価
- **分担**: 通常の RAG = rag-implementation-patterns(まずそちらで足りるかを判断させる構成にする)

### synthetic-data-for-training.md — 学習用合成データの実務(03)

- **目的**: FT・蒸留・選好調整に使うデータを LLM で生成する際の、品質管理と落とし穴を押さえられる
- **主要トピック**: 用途の類型(SFT 用の指示応答・蒸留(教師出力)・選好ペア・既存データの拡張)/ 生成の型(シード拡張・ペルソナ多様化・自己生成 + フィルタ)/ 品質管理(検証器によるフィルタリング・多様性の測定・人手サンプリング検品)/ 劣化リスク(自己出力での学習を繰り返す崩壊・スタイルの単調化)/ 権利と規約(教師モデル出力の利用条件は提供者ごとに異なる — 断定せず確認先を示す)/ 評価データとの厳格な分離(汚染防止 — [evaluation-datasets](docs/04-evaluation/evaluation-datasets.md) と接続)
- **分担**: 評価用の合成データ = evaluation-datasets(正本)、FT の判断と手法 = fine-tuning-and-distillation(正本)

### data-governance-for-ai.md — AI のためのデータガバナンス(05)

- **目的**: 「AI の品質は知識源の品質」という構造を組織の仕組みに変える — オーナーシップ・カタログ・品質基準を設計できる
- **主要トピック**: AI 品質がデータ品質に律速される構造(knowledge-agent 事例の一般化)/ データオーナーシップ(文書・データセットの責任者と更新義務)/ AI 向けデータカタログ(所在・鮮度・権限・AI 利用可否のメタデータ)/ 品質基準(鮮度・正確性・一意性)とその計測 / AI 利用可否の分類(学習に使ってよいか・検索に載せてよいかのタグ)/ AI 導入をデータ衛生のフォーシング関数にする運用 / 既存のデータガバナンス組織との協働
- **分担**: 会話データ(AI が生むデータ)= conversation-data-management(対になる記事として相互リンク)、規制面 = compliance-and-governance

## 4. スコープ外(検討のうえ除外)

- **埋め込みモデル・ベクトル DB のカタログ化**(製品名・価格の一覧): 鮮度管理コストが高く、選定軸があれば公式情報で判断できるため。llm-landscape のような正本ページはこの領域には作らない
- **汎用データ基盤(DWH・ETL・データメッシュ)の一般論**: conversation-data-management と同じ境界。AI 固有の要件まで
- **統計・機械学習の特徴量エンジニアリング**: LLM 系に限定
- **アノテーション組織の運営詳解**: evaluation-datasets の範囲を超える分は将来の需要を見て判断

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AD・AE** を使います(AA〜AC は [DOMAIN-AGENTS-PLAN.md](DOMAIN-AGENTS-PLAN.md) が使用)。新セクションがないためスケルトンフェーズは不要です。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AD-1 | 埋め込み + ベクトル DB | `embeddings.md`, `vector-databases.md` | 調査不要 |
| AD-2 | 前処理パイプライン | `data-preprocessing-for-llm.md` | 調査不要 |
| AD-R | Phase AD レビュー(rag-implementation-patterns からの逆リンク・published 化・同期一式) | — | — |
| AE-1 | GraphRAG + 学習用合成データ | `graph-rag-and-knowledge-graphs.md`, `synthetic-data-for-training.md` | 調査不要(利用条件は TODO 前提) |
| AE-2 | データガバナンス | `data-governance-for-ai.md` | 調査不要 |
| AE-R | Phase AE レビュー + 統合(evaluation-datasets / fine-tuning / knowledge-agent 事例との相互リンク総点検・published 化・同期一式) | — | — |

完了時の規模: **92 → 98 本**(03: 15 → 20、05: 8 → 9。承認済み他計画とすべて完了なら 135 本)。

## 6. 執筆前調査

**なし**(全 6 本とも原則が安定。執筆時の部分確認のみ)。変化の速い要素は次の方針で扱います:

- 埋め込みモデル・ベクトル DB の製品動向 → 本文に具体名を置かず類型・選定軸で書く
- 教師モデル出力の学習利用条件 → 断定せず「利用中モデルの利用規約を確認」+ `TODO(要確認)`

## 7. 同期・派生作業

- **GLOSSARY 候補**(執筆時確定): 埋め込み(embedding)、ベクトルデータベース(vector database)、近似最近傍探索(ANN)、ナレッジグラフ(knowledge graph)、GraphRAG、モデル崩壊(model collapse)、データガバナンス(data governance)
- **逆リンク**(各 X-R で実施): rag-implementation-patterns → embeddings / vector-databases / data-preprocessing / graph-rag、evaluation-datasets → synthetic-data-for-training、fine-tuning-and-distillation → synthetic-data-for-training、long-term-memory-implementation → embeddings、multi-tenancy-and-isolation → vector-databases、case-study-knowledge-agent → data-governance-for-ai / data-preprocessing-for-llm、conversation-data-management → data-governance-for-ai(対の記事)
- **learning-roadmap**: 変更不要の見込み(セクション追加なし)
- **website**: 構造変更なし(sync が自動反映)。ビルド検証のみ
- **MULTIMODAL 計画との接続**: document-ai(12 章案)が採用された場合、data-preprocessing-for-llm から PDF・スキャン系の詳細を委譲するリンクを張る(未採用なら本記事内の記述で自己完結)

## 8. 未確定事項(着手時に確認)

1. **配置**: 推奨は既存章への追加(03 × 5 + 05 × 1)。新セクション案(データ基盤章)は導線が遠くなるため非推奨
2. **6 本の粒度**: 縮小案は 4 本(#3 前処理を #1〜2 に分散、#6 ガバナンスを見送り)。網羅性を優先するなら 6 本を推奨
3. **data-governance-for-ai の配置**: 推奨は 05-operations。組織論の色を強めるなら 09-business も候補

## 9. TODO

> **TODO(要確認):** 教師モデル出力の学習利用条件(蒸留の可否)は提供者・時期で変わる。synthetic-data-for-training の執筆時に、断定を避けた「確認先の示し方」を compliance-and-governance のベンダー契約チェックと整合させる(最終確認: 2026-07)
