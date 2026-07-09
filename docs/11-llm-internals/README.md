# 11-llm-internals — LLM 内部構造(学術編)

LLM の**モデル内部構造・学習理論・推論機構・解釈可能性**を、数式と原論文への参照を伴う学術的な粒度で扱うセクションです。[10-llm-foundations](../10-llm-foundations/README.md)(実務直感・数式なし)の「なぜ」をもう 1 段掘る下層に位置し、各記事は対応する 10 章記事から「さらに深く」たどれる入口として設計します。

- **置くもの**: Transformer の数式的構造、注意の変種、MoE の内部、スケーリング則、アラインメントの定式化、推論の計算量、解釈可能性、文脈内学習の理論。各記事は「結果の式 + 日本語の読み下し」を原則とし、原論文(arXiv 等)を参考資料に必須とする
- **置かないもの**: 線形代数・確率の教材化(前提知識として外部に委ねる)、分散学習インフラの実装(→ [05-operations](../05-operations/README.md) の GPU・セルフホスト)、フレームワーク/カーネルの実装コード、網羅的な論文サーベイの維持、非公開モデル内部の推測

## 数式の規約

- 数式は KaTeX 記法(`$...$` インライン / `$$...$$` ブロック)で書きます
- **各数式の直後に日本語の読み下しを添え、数式を読み飛ばしても本文が成立する**ようにします
- 導出は結論の解釈が変わる場合のみ最小限にとどめます

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [transformer-architecture.md](transformer-architecture.md) | Transformer アーキテクチャ詳解(埋め込み・位置符号化・自己注意の数式・多頭注意・FFN・残差ストリーム・正規化・パラメータの数え方) |
| [attention-variants-and-long-context.md](attention-variants-and-long-context.md) | 注意機構の変種と長コンテキスト技術(MQA/GQA/MLA・スパース/線形注意・位置の外挿・SSM・FlashAttention の発想) |
| [mixture-of-experts-internals.md](mixture-of-experts-internals.md) | MoE の内部構造(疎な活性化・ルーティング・負荷分散・専門化・総 vs アクティブパラメータの数理) |
| `pretraining-and-scaling-laws.md` | 事前学習とスケーリング則(次トークン予測・パープレキシティ・Chinchilla・データ側・創発性論争) |
| `alignment-theory.md` | アラインメントの理論(RLHF の定式化・DPO の導出・報酬の過剰最適化・RLVR) |
| `inference-internals.md` | 推論の内部機構(サンプリングの数理・プリフィル/デコードの計算量・投機的デコーディング・量子化) |
| `interpretability-basics.md` | LLM の解釈可能性の基礎(プロービング・帰属・回路・重ね合わせと SAE・応用と限界。鮮度管理型) |
| `in-context-learning-and-memorization.md` | 文脈内学習と記憶の科学(ICL の理論仮説・few-shot の研究知見・grokking・二重降下・データ汚染) |
