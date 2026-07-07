# LLM-INTERNALS-PLAN — LLM 内部構造(学術編)追加計画

> **ステータス: 設計案(2026-07-07 作成、ユーザーの追加要望に基づく。着手指示待ち)。**
> LLM のモデル内部構造・学習理論・推論機構・解釈可能性を、**数式と原論文への参照を伴う学術的な粒度**で扱う新セクション `docs/11-llm-internals/` の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 経緯と位置づけ: 「直感の 10 章」の下に「学術の 11 章」を敷く

この領域はこれまで 2 段階の判断を経ています。

1. [EXPANSION-PLAN.md](EXPANSION-PLAN.md) §4 で「LLM 内部・学習理論」を利用者視点から外れるとして除外
2. [SUPPLEMENTARY-PLAN.md](SUPPLEMENTARY-PLAN.md) が「**数式ではなく実務の判断に効く直感**」に限定する条件付きで [docs/10-llm-foundations/](docs/10-llm-foundations/) を新設(5 本、完了)。ただし §4 で「モデルアーキテクチャの研究動向解説」「数学的基礎の教材化」は引き続き除外

本計画は 3 段階目です — **ユーザー要望により、学術的な内容を条件付きで収録**します。除外理由への対処:

| 従来の除外理由 | 本計画での対処 |
| --- | --- |
| 利用者視点から外れ、理論書になりがち | **10 章とレイヤ分離**する: 10 章 = 実務直感(数式なし)は不変。11 章 = その「なぜ」をもう 1 段掘る学術詳解。各記事は対応する 10 章記事から「さらに深く」リンクされる下層として位置づけ、実務記事からの直接依存は作らない |
| 研究動向の鮮度管理コストが便益を上回る | **安定した基礎(2017〜2023 年に確立した理論)を主軸**にする。動きの速い領域(解釈可能性・アーキテクチャ変種の最新)は該当記事に閉じ込め、鮮度管理型(最終確認日 + 定点観測)にする |
| 数学的基礎の教材化は外部に委ねる | 線形代数・確率の**教材化はしない**(前提知識として外部参照)。数式は「結果の式 + 日本語の読み下し」を原則とし、導出は含意が変わる場合のみ最小限に |
| 出典の信頼性 | 全記事で**原論文(arXiv 等)を参考資料に必須**とし、執筆時に公式ページで書誌(タイトル・著者・年)を確認してアクセス日を併記する |

## 2. 既存カバレッジとの関係(重複させない)

| 11 章の記事(予定) | 対応する既存記事(実務直感側 = 正本のまま) | 11 章が足すもの |
| --- | --- | --- |
| Transformer アーキテクチャ詳解 | [attention-and-context](docs/10-llm-foundations/attention-and-context.md)(注意の直感) | QKV・多頭注意の数式、残差ストリーム、FFN、正規化、パラメータの数え方 |
| 注意の変種と長コンテキスト | 同上(KV キャッシュ・長文劣化の直感) | MQA/GQA/MLA、スパース・線形注意、位置符号化(RoPE)と外挿、SSM 系代替 |
| MoE の内部構造 | [llm-landscape](docs/03-implementation/llm-landscape.md)(MoE の選定上の意味)、GLOSSARY の MoE | ルーティング・負荷分散・専門化の実態、メモリ vs 計算量の数理 |
| 事前学習とスケーリング則 | [llm-training-pipeline](docs/10-llm-foundations/llm-training-pipeline.md)(工程の直感) | 目的関数・パープレキシティ、スケーリング則の系譜、データ混合、創発性論争 |
| アラインメントの理論 | 同上(SFT・選好調整・迎合の直感) | RLHF の定式化(報酬モデル・KL 正則化)、DPO の導出、報酬の過剰最適化、検証可能報酬 |
| 推論の内部機構 | [how-llms-generate-text](docs/10-llm-foundations/how-llms-generate-text.md)(サンプリングの直感)、[latency-optimization](docs/05-operations/latency-optimization.md) | サンプリングの数理、プリフィル/デコードの計算量分析、投機的デコーディング、量子化 |
| 解釈可能性の基礎 | (対応する既存記事なし — 新規領域) | プロービング・帰属・回路・重ね合わせと SAE、診断への応用と限界 |
| 文脈内学習と記憶の科学 | [prompt-engineering-fundamentals](docs/03-implementation/prompt-engineering-fundamentals.md)(few-shot の実務)、[capabilities-and-limits](docs/10-llm-foundations/capabilities-and-limits.md) | ICL の理論仮説、記憶と汎化(grokking・二重降下)、汚染との関係 |

**新セクションにする理由**: 10-llm-foundations の憲章(「数式・実装に踏み込まない」)を壊さずに学術層を足すには、セクションを分けるのが最も安全です。読者層も異なります(10 = 全エンジニアの任意基礎、11 = 学術的関心を持つ層・研究文献への入口が欲しい層)。

## 3. 追加トピック一覧(8 本 + 新セクション 1)

| # | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- |
| 1 | `transformer-architecture.md` | Transformer アーキテクチャ詳解 | advanced | 安定 |
| 2 | `attention-variants-and-long-context.md` | 注意機構の変種と長コンテキスト技術 | advanced | 中(変種の顔ぶれは動く) |
| 3 | `mixture-of-experts-internals.md` | MoE の内部構造 | advanced | 安定 |
| 4 | `pretraining-and-scaling-laws.md` | 事前学習とスケーリング則 | advanced | 安定 |
| 5 | `alignment-theory.md` | アラインメントの理論(RLHF から DPO・RLVR まで) | advanced | 中 |
| 6 | `inference-internals.md` | 推論の内部機構(サンプリング・KV キャッシュ・量子化) | advanced | 安定 |
| 7 | `interpretability-basics.md` | LLM の解釈可能性の基礎 | advanced | **速い(鮮度管理型)** |
| 8 | `in-context-learning-and-memorization.md` | 文脈内学習と記憶の科学 | advanced | 中 |

**新セクション**: `docs/11-llm-foundations` ではなく **`docs/11-llm-internals/`(LLM 内部構造)**。website の表示名は「11. LLM 内部構造」。

## 4. 各ページの設計

全記事共通の設計原則:

- **数式の規約**: KaTeX 記法。各数式の直後に日本語の読み下しを併記する(数式を読み飛ばしても本文が成立すること)。導出は結論の解釈が変わる場合のみ最小限
- **原論文必須**: 主要な主張には原論文(arXiv・公式研究ページ)を参考資料に挙げ、執筆時に書誌を確認してアクセス日を併記
- **実務への出口**: 各記事末尾の「この理解が効く場面」で 10 章・実務記事へ接続(10 章と同じ様式)

### transformer-architecture.md — Transformer アーキテクチャ詳解

- **主要トピック**: 全体像(デコーダ専用型を主軸)/ トークン埋め込みと出力ヘッド(重み共有)/ 位置符号化(絶対・相対・回転位置埋め込み(RoPE))/ 縮小付き内積注意の数式(QKV・ソフトマックス・マスク)/ 多頭注意 / FFN(ゲート付き活性を含む)/ 残差ストリームという見方 / 正規化(LayerNorm / RMSNorm・Pre-LN)/ パラメータ数の数え方(モデルカードの読み解き)
- **H3 案**: 概要 / 埋め込みと位置 / 自己注意の数式 / 多頭注意 / FFN と残差ストリーム / 正規化と学習安定性 / パラメータの内訳 / この理解が効く場面

### attention-variants-and-long-context.md — 注意機構の変種と長コンテキスト技術

- **主要トピック**: KV キャッシュ削減系(MQA / GQA / 潜在注意)/ 局所・スパース・スライディングウィンドウ / 線形注意の考え方 / 位置の外挿と補間(RoPE スケーリング系)/ ハイブリッド・非 Transformer 系(状態空間モデル(SSM)の概観)/ 計算の工夫(オンラインソフトマックス = FlashAttention の発想)/ 「長コンテキスト対応」表記の中身を読む
- **鮮度**: 変種の顔ぶれ・採用状況は動くため、個別モデルの採用例は挙げず方式の原理に徹する

### mixture-of-experts-internals.md — MoE の内部構造

- **主要トピック**: 疎な活性化という発想 / ルーティング(top-k・ルータの学習)/ 負荷分散(補助損失・ドロップ)/ 専門家は何に「専門化」するか(研究知見)/ 総パラメータ vs アクティブパラメータの数理(メモリ・FLOPs・通信)/ 推論・提供コストへの含意(10 章 MoE 用語と llm-landscape の学術裏付け)

### pretraining-and-scaling-laws.md — 事前学習とスケーリング則

- **主要トピック**: 次トークン予測の目的関数(交差エントロピー・パープレキシティの意味)/ スケーリング則の系譜(パラメータ偏重 → 計算最適(Chinchilla)→ 推論時計算のスケーリングへ)/ データ側(トークン数・品質・混合・繰り返しの影響)/ 創発的能力の論争(指標の取り方による見かけ説を含む)/ 学習の計算量の目安
- **分担**: 分散学習インフラ(並列化の実装)はスコープ外(§5)

### alignment-theory.md — アラインメントの理論

- **主要トピック**: RLHF の定式化(選好データ → 報酬モデル → KL 正則化付き方策最適化)/ DPO の導出(報酬モデルを消去する変形)と実務的含意 / 報酬の過剰最適化(Goodhart)と正則化 / 検証可能報酬(RLVR)・プロセス報酬と推論モデルの学習 / 迎合・アラインメント税の研究知見(10 章 llm-training-pipeline の「なぜ」の裏付け)

### inference-internals.md — 推論の内部機構

- **主要トピック**: ロジット → 確率 → 選択の数理(温度・top-k / top-p・ペナルティ類の定義)/ プリフィルとデコードの計算量・メモリ分析(KV キャッシュのサイズ式)/ バッチングと連続バッチング(スループット vs レイテンシ)/ 投機的デコーディング(下書き + 検証)/ 量子化(重み・活性・KV。精度と品質のトレードオフの原理)/ API の価格構造・レイテンシ特性が「なぜそうなっているか」への接続

### interpretability-basics.md — LLM の解釈可能性の基礎(鮮度管理型)

- **主要トピック**: 行動の評価と機構の理解の違い / プロービングと表現の分析 / 帰属(注意重みは説明か、という論争を含む)/ 回路の発見(誘導ヘッドなど)/ 重ね合わせ仮説とスパースオートエンコーダ(SAE)による特徴抽出 / 実務への応用可能性と現在の限界(デバッグ・安全性監査への期待と現実)
- **鮮度**: 研究フロンティアのため、最終確認日 + 参考資料アクセス日 + 「変わりやすい項目(定点観測)」の 3 点セットを必須とする

### in-context-learning-and-memorization.md — 文脈内学習と記憶の科学

- **主要トピック**: 文脈内学習(ICL)はなぜ起きるか(主要な理論仮説の整理: 暗黙のベイズ推定・メタ学習・タスク表現)/ few-shot の例数・順序の効果に関する研究知見(実務側 prompt-engineering の裏付け)/ 記憶と汎化(逐語記憶の条件・grokking・二重降下)/ データ汚染とベンチマークへの含意([agent-benchmarks-landscape](docs/04-evaluation/agent-benchmarks-landscape.md) の理論的背景)

## 5. スコープ外(検討のうえ除外)

- **数学的基礎の教材化**(線形代数・確率・最適化の解説): 前提知識として記事冒頭で外部教材に委ねる
- **分散学習インフラ**(データ/テンソル/パイプライン並列・GPU クラスタ運用): 利用者視点を超える。スケーリング則の文脈で概念に触れるのみ
- **学習・推論エンジンの実装コード**(フレームワーク・カーネル実装): 原理までとする
- **網羅的な論文サーベイの維持**: 各記事は「代表的な原論文 + 入口」に限定し、文献レビューの網羅性は目指さない
- **特定モデルの内部の推測**: 公開情報(論文・技術報告)があるものだけを扱い、非公開モデルの内部は推測しない

## 6. フェーズ分割(ROADMAP 追記案)

フェーズ記号は、既存の調査タスク接頭辞(EXPANSION の P-R\*、SUPPLEMENTARY の Q-R\*)との紛らわしさを避けて **S〜U** を使います(M〜O は [DEEP-DIVE-PLAN.md](DEEP-DIVE-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| S-0 | 11-llm-internals スケルトン(セクション README・doc-template の category・website 反映 + **数式レンダリングの有効化検証**) | `11-llm-internals/README.md` ほか同期一式 | Nextra の LaTeX サポート(KaTeX)を有効化しビルド検証 |
| S-1 | Transformer アーキテクチャ詳解 | `transformer-architecture.md` | 安定領域 |
| S-2 | 注意の変種と長コンテキスト + MoE の内部構造 | `attention-variants-and-long-context.md`, `mixture-of-experts-internals.md` | 安定〜中 |
| S-R | Phase S レビュー(数式の読み下し・書誌の確認を含む) | — | — |
| T-1 | 事前学習とスケーリング則 + アラインメントの理論 | `pretraining-and-scaling-laws.md`, `alignment-theory.md` | 安定〜中 |
| T-R | Phase T レビュー | — | — |
| U-1 | 推論の内部機構 | `inference-internals.md` | 安定 |
| U-2 | 解釈可能性の基礎(IN-R1 反映・鮮度管理型)+ 文脈内学習と記憶の科学 | `interpretability-basics.md`, `in-context-learning-and-memorization.md` | 解釈可能性は調査必須 |
| U-R | Phase U レビュー + 全体統合(10 章 5 本からの「さらに深く」逆リンク一式・learning-roadmap の 12 セクション化・依存マップ更新) | — | — |

完了時の規模: **92 → 100 本**(+ 新セクション 1。[DEEP-DIVE-PLAN.md](DEEP-DIVE-PLAN.md) と両方完了なら 107 本)。

## 7. 執筆前調査

| ID | 対象 | 出力先 | 時期 |
| --- | --- | --- | --- |
| IN-R1 | 解釈可能性研究の現在地(SAE・回路研究・主要ラボの公式研究ページ。2026-07 時点) | `research/internals/interpretability.md` | U-2 着手時(必須) |
| — | 引用論文の書誌確認 | 各記事の執筆時に arXiv 公式ページで確認(専用メモは作らず、記事の参考資料にアクセス日を併記) | 全フェーズ |

古典(2017〜2023 年の確立した理論)は原論文が動かないため専用調査は不要です。変種・アラインメント最新手法は「原理 + TODO(要確認)」の型で書きます。

## 8. 同期・派生作業

- **GLOSSARY 候補**(執筆時確定): 残差ストリーム(residual stream)、スケーリング則(scaling laws)、RLHF、DPO、パープレキシティ(perplexity)、投機的デコーディング(speculative decoding)、量子化(quantization)、スパースオートエンコーダ(SAE)、文脈内学習(in-context learning)、RoPE。既存 MoE エントリはリンク先の拡張を検討
- **learning-roadmap / 依存マップ**(U-R): 12 セクション化。11 は「10 の任意の深掘り」として点線接続(`F10 -.-> I11`)、website の dependency-graph.jsx も同期
- **website**(S-0): sync-content の SECTION_TITLES に `'llm-internals': '11. LLM 内部構造'`、index.mdx に 11 の行、**nextra の `latex: true` を有効化**して数式レンダリングをビルド検証(W3 の教訓: Turbopack 制約があるため組み込みオプションで行い、カスタム remark プラグインは使わない)
- **doc-template**: category 列挙に `llm-internals` を追加(S-0)
- **10 章からの逆リンク**(U-R): 10 章 5 本の関連トピックに「学術的な詳解 → 11 章の対応記事」を追加
- **CLAUDE.md**: 数式の規約(KaTeX + 読み下し併記)を 1 行追記するかは S-0 で判断(セクション README への記載で足りる可能性が高い)

## 9. 未確定事項(着手時に確認)

1. **数式の深さ**: 推奨は「結果の式 + 日本語読み下し」(本計画の前提)。より軽く「図と言葉中心・数式は最小限」に倒す選択肢もある
2. **セクション名**: `11-llm-internals` 案(「LLM 内部構造」)。代替: `11-llm-theory`(理論寄りの含意が強くなる)
3. **8 本の粒度**: 縮小案は 5 本(#1+#2 を統合、#3 を #1 に吸収、#8 を #4 に吸収)。網羅性を優先するなら 8 本を推奨

## 10. TODO

> **TODO(要確認):** Nextra 4.6 系の LaTeX サポート(`latex: true`)が静的エクスポート + Turbopack 構成で動作するかを S-0 で検証する(最終確認: 2026-07)

> **TODO(要確認):** 解釈可能性(SAE・回路)の研究状況は変化が速い。IN-R1 を U-2 着手時に実施し、それ以外の章でも引用論文の書誌を執筆時に確認する(最終確認: 2026-07)
