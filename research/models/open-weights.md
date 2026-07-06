# オープンウェイト LLM 主要ファミリー調査メモ(M-R4)

- **対象**: オープンウェイト LLM の主要ファミリー(Meta Llama / Alibaba Qwen / DeepSeek / Mistral / OpenAI gpt-oss)+ 一言で触れるその他の勢力(2026-07 時点)
- **調査日**: 2026-07-06
- **用途**: 「主要 LLM の全体像」のうちオープンウェイト系俯瞰の 1 節の一次資料。深掘りではなく「選択肢の地図」を提供する
- **根拠の方針**: 各ファミリーの公式サイト・公式 GitHub・公式 Hugging Face org・公式モデルカードのみを根拠とします。ベンチマークまとめサイト・第三者記事は根拠にしていません
- **確度表記**: 「公式明記」= 公式ページ・公式モデルカードに明文あり / 「公式から推測」= 公式情報からの合理的推測(または一次ページに直接アクセスできず間接確認)/ 「未確認」= 今回確認できず

## 俯瞰サマリー(執筆用の地図)

| ファミリー | 現行オープン世代(確認日時点) | 最大公開モデル | ライセンス | コンテキスト長 | reasoning |
| --- | --- | --- | --- | --- | --- |
| Meta Llama | Llama 4(2025-04) | Maverick 400B(A17B, MoE) | Llama 4 Community License(独自) | Scout 10M / Maverick 1M | 明示的な思考モードなし |
| Alibaba Qwen | Qwen3.5(2026-02)/ Qwen3.6(2026-04) | Qwen3.5-397B-A17B(MoE) | Apache-2.0 | 262K | 思考モードあり(系列による) |
| DeepSeek | V4(2026-04) | V4-Pro 1.6T(A49B, MoE) | MIT | 1M | 3 モード(Non-think / Think High / Think Max) |
| Mistral | Mistral 3(2025-12)+ 2026 追加 | Large 3 675B(A41B, MoE) | Apache-2.0(オープン系) | 未確認(本メモでは特定せず) | Ministral 3 に reasoning 変種 / Small 4 は統合型 |
| OpenAI gpt-oss | gpt-oss(2025-08) | gpt-oss-120b 117B(A5.1B, MoE) | Apache-2.0 | 131K | reasoning effort 3 段階 |

※ 表内の各事実の出典・確度は以下の各節を参照。

## Meta Llama

### 現行世代と構成

- 現行のオープンウェイト世代は **Llama 4**(2025-04 発表)。ネイティブマルチモーダル(テキスト+画像入力 / テキスト+コード出力)の MoE ファミリーです(公式明記)。
  - **Llama 4 Scout**: 総 109B / アクティブ 17B、16 エキスパート MoE。コンテキスト長 **10M トークン**。Int4 量子化で H100 1 枚に収まると公式が明記
  - **Llama 4 Maverick**: 総 400B / アクティブ 17B、128 エキスパート MoE。コンテキスト長 **1M トークン**(HF モデルカード明記)
  - **Llama 4 Behemoth**: 総約 2T / アクティブ 288B の教師モデル。発表時点で「学習中・プレビューのみ」であり、**2026-07-06 時点でも重みは未公開**(HF meta-llama org に存在しないことを確認。公式明記+観測)
  - 出典: https://ai.meta.com/blog/llama-4-multimodal-intelligence/(確認 2026-07-06)、https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E-Instruct、https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct(いずれも確認 2026-07-06)
- ティア構成は「単一 GPU 級(Scout)/ 大型(Maverick)/ 超大型・未公開(Behemoth)」の 3 段。小型(〜10B 帯)の Llama 4 系は確認できず。小型帯は旧世代 Llama 3.2 系が残る形(公式から推測)
- **注目すべき観測事実**: HF meta-llama org の最新更新は Llama 4 Scout / Maverick / Maverick-FP8 の 2025-05-22 表示で、**2026-07-06 時点で Llama 4 より新しい世代の公開はなし**(約 14 か月新規なし)。知識カットオフも 2024-08 と古め(Scout モデルカード明記)。出典: https://huggingface.co/meta-llama(確認 2026-07-06、観測事実)

### ライセンス

- **Llama 4 Community License Agreement**(独自ライセンス。Apache/MIT ではない)。商用利用可だが条件付き(公式明記):
  - 月間アクティブユーザー **7 億人超**の製品・サービスは Meta への個別ライセンス申請が必要
  - 「**Built with Llama**」の表示義務(Web サイト・製品ドキュメント)
  - 派生モデルの名称は「Llama」で始める必要がある
  - 出典: Scout の HF モデルカード内ライセンス条項(確認 2026-07-06、公式明記)。ライセンス全文: https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE

### 仕様の要点

- モダリティ: ネイティブマルチモーダル(テキスト・画像。発表ブログは動画にも言及)。出力はテキスト(公式明記)
- reasoning: gpt-oss / DeepSeek のような明示的な思考モードの記載は確認できず(未確認)

### 利用形態

- ダウンロード: llama.com および Hugging Face(公式明記)
- セルフホスト規模感: Scout は Int4 で H100 1 枚(公式明記)。Maverick は総 400B のためマルチ GPU 前提(公式から推測)
- マネージド提供: Meta 公式ブログは「主要なクラウド・データプラットフォームで順次提供」と記載(公式明記)。Amazon Bedrock / Azure AI Foundry / Vertex AI Model Garden での提供は各クラウド側の発表・カタログに基づく(今回の確認は検索経由のため「公式から推測」。執筆時に各クラウドのモデルカタログで一次確認を推奨)

### 公式の位置づけ

- 「ネイティブマルチモーダルなオープンウェイトモデル群」「クラス最高のマルチモーダルモデル」(発表ブログ、公式明記)。Maverick は画像理解とクリエイティブライティング向けと明記

### 定点観測 URL

- https://www.llama.com/ — **注意: 2026-07-06 時点で https://developer.meta.com/ai/ へ 301 リダイレクト**(サイト再編の模様。観測事実)
- https://huggingface.co/meta-llama
- https://ai.meta.com/blog/

## Alibaba Qwen

### 現行世代と構成

- オープンウェイトの現行は **Qwen3.5**(2026-02〜03)と、その後継の部分的リリースである **Qwen3.6**(2026-04)。いずれも重みを Hugging Face / ModelScope で公開(公式明記)
- **Qwen3.5 シリーズ**(出典: https://github.com/QwenLM/Qwen3.5、確認 2026-07-06、公式明記):
  - フラッグシップ **Qwen3.5-397B-A17B**(総 397B / アクティブ 17B、MoE。2026-02-16)
  - 中型 MoE: 122B-A10B / 35B-A3B、中型 dense: 27B(2026-02-24)
  - 小型 dense: 9B / 4B / 2B / 0.8B(2026-03-02)
  - 特徴として「Unified Vision-Language Foundation」「201 言語対応」を掲げ、「Towards Native Multimodal Agents」と位置づけ(公式明記)
  - コンテキスト長 262,144(リポジトリのデプロイ例より。公式から推測)
- **Qwen3.6 シリーズ**(出典: https://github.com/QwenLM/Qwen3.6、確認 2026-07-06、公式明記):
  - **Qwen3.6-35B-A3B**(MoE、2026-04-16。「Agentic Coding Power」を訴求、フロントエンド作業・リポジトリレベル推論に強みと明記)
  - **Qwen3.6-27B**(dense、2026-04-22)
  - コンテキスト長 262,144(デプロイ例より。公式から推測)。「thinking preservation」(会話履歴をまたいで思考コンテキストを保持)を新機能として記載
- **重要な観測事実(オープン/クローズドの分岐)**: 最上位の **Qwen3.7(Max / Plus)は 2026-05 に発表されたが、2026-07-06 時点で HF Qwen org に Qwen3.7 の重み公開は確認できず**。API 提供のみと推測(公式から推測)。「フラッグシップはクローズド、1 段下までをオープン」という構図になりつつある点は執筆時に言及価値あり
- 旧世代: Qwen3(2025-04、0.6B〜235B-A22B の dense + MoE、Apache-2.0)。出典: https://github.com/QwenLM/Qwen3(検索経由確認)
- 特化系ファミリーが非常に広い: Qwen3-Coder(-Next)/ Qwen3-VL / Qwen3-Omni / Qwen3-ASR / Qwen3Guard(安全分類)/ Qwen-Image など(HF org・公式ブログで名称確認のみ)

### ライセンス

- **Apache-2.0**。Qwen3.6 リポジトリに「All our open-weight models are licensed under Apache 2.0.」と明文あり(確認 2026-07-06、公式明記)。商用利用の追加条件なし

### 仕様の要点

- コンテキスト長: 262K(Qwen3.5 / 3.6。公式から推測=デプロイ例に基づく)
- モダリティ: Qwen3.5 は vision-language 統合を明記。特化系で音声(ASR)・画像生成もカバー
- reasoning: Qwen3 系は思考モードを持つ系列(Qwen3.6 の thinking 関連ドキュメントは「coming soon」表記。詳細は未確認)

### 利用形態

- セルフホスト: 0.8B〜397B(A17B)まで粒度が細かく、エッジ〜大規模まで選びやすいのが特徴(公式明記のラインナップからの整理)
- マネージド: Alibaba Cloud(Model Studio)経由の API 提供(公式から推測。今回一次ページ未確認)。HF / ModelScope でのダウンロードは公式明記

### 公式の位置づけ

- 「Towards Native Multimodal Agents」(Qwen3.5)、エージェンティックコーディング(Qwen3.6-35B-A3B)(いずれも公式明記)

### 定点観測 URL

- https://qwen.ai/blog — 注意: JS 描画のため機械的な取得が困難(観測事実)
- https://github.com/QwenLM(シリーズごとにリポジトリが分かれる: Qwen3 / Qwen3.5 / Qwen3.6)
- https://huggingface.co/Qwen

## DeepSeek

### 現行世代と構成

- 現行は **DeepSeek-V4**(2026-04-24 リリース)。**Pro / Flash の 2 ティアで、どちらも重みを公開**(公式明記):
  - **DeepSeek-V4-Pro**: 総 **1.6T / アクティブ 49B** の MoE。32T トークン超で事前学習(モデルカード明記)
  - **DeepSeek-V4-Flash**: 総 **284B / アクティブ 13B** の MoE。FP4+FP8 混合精度で公開。「Think Max モードでは思考予算を増やせば Pro 相当の推論性能」だが知識・複雑なエージェントタスクでは Pro に劣る、と公式が明記
  - 出典: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro、https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash(確認 2026-07-06、公式明記)
  - ※ HF org 一覧の表示パラメータ数(Pro 862B / Flash 158B)は量子化格納に対する自動集計であり、モデルカード記載の総パラメータ数(1.6T / 284B)と異なる(観測事実+推測)。執筆時はモデルカードの数値を採用のこと
- 蒸留系: V4-Pro-DSpark / V4-Flash-DSpark などの派生も同 org で公開(HF org で名称確認のみ)
- **R1 の扱い**: 独立した reasoning モデル(R1)の路線は V3.1(2025-08)以降「1 つのモデルで thinking / non-thinking を切り替えるハイブリッド」に統合。API の旧名 `deepseek-chat` / `deepseek-reasoner` は V4-Flash の non-thinking / thinking にマップされ、**2026-07-24 に旧名廃止予定**(公式 changelog 明記)。出典: https://api-docs.deepseek.com/updates(確認 2026-07-06)

### ライセンス

- **MIT License**(V4-Pro / V4-Flash ともモデルカード明記。確認 2026-07-06)。主要ファミリー中もっとも制約が緩い部類。商用利用の追加条件なし

### 仕様の要点

- コンテキスト長: **1M トークン**(V4 系、公式明記)。長文脈効率のための独自アーキテクチャ(Compressed Sparse Attention + Heavily Compressed Attention のハイブリッド、Manifold-Constrained Hyper-Connections)をモデルカードに明記
- reasoning: **Non-think / Think High / Think Max** の 3 モード(公式明記)。Think Max はコンテキスト窓 384K 以上を推奨(公式明記)
- モダリティ: V4 系はテキスト中心(VL 系・Janus 系は別モデル)。(公式から推測)

### 利用形態

- セルフホスト: Flash でも総 284B でマルチ GPU 必須、Pro(1.6T)はクラスタ級。個人・小規模でのフル自前運用は非現実的で、蒸留版(DSpark)か API が現実解(公式カードの規模からの推測)
- マネージド: 自社 API(**OpenAI ChatCompletions 互換 + Anthropic 互換インターフェース**の両対応、公式明記)。他社クラウドでの提供の公式言及は今回未確認

### 公式の位置づけ

- 長文脈の実用化と推論コスト効率(最大文脈で従来比 27% の単一トークン推論 FLOPs、公式明記)。「巨大クローズドモデルの計算効率的な代替」という打ち出し(モデルカードの記述より整理)

### 定点観測 URL

- https://api-docs.deepseek.com/updates(リリース changelog)
- https://huggingface.co/deepseek-ai
- https://www.deepseek.com/

## Mistral

### 現行世代と構成

- 現行の中核は **Mistral 3 ファミリー**(2025-12-02 発表)+ 2026 年の追加リリース(公式明記):
  - **Mistral Large 3**: 総 **675B / アクティブ 41B** の MoE。マルチモーダル(テキスト+画像理解)。「Mixtral 以来初の MoE」「フロンティア級の instruction-tuned オープンウェイトモデル」と公式が明記
  - **Ministral 3**: **14B / 8B / 3B** の dense 小型系。vision 対応、base / instruct / **reasoning** の 3 変種。「エッジに最先端の知能」「OSS モデル最良のコスト性能比」と位置づけ(公式明記)
  - **Mistral Small 4**(v26.03): 「instruct・reasoning・coding を 1 つに統合したハイブリッドモデル」(docs 原文)。マルチモーダル(公式明記)
  - **Devstral 2**: 自律的ソフトウェアエンジニアリング向けのオープンウェイト・エージェンティックコーディングモデル(公式明記)
  - 音声系: Voxtral Small(音声入力)/ **Voxtral TTS**(v26.03、TTS)/ Voxtral Mini Transcribe Realtime(v26.02、文字起こし)(公式明記)
  - 出典: https://mistral.ai/news/mistral-3/、https://docs.mistral.ai/models/overview、https://mistral.ai/models/(いずれも確認 2026-07-06)
- **API 専用(Premier)との二層構造に注意**: 最上位の **Mistral Medium 3.5(v26.04)はプロプライエタリ(API 専用)**(mistral.ai/models で確認、公式明記)。OCR 4 / Embed 系 / Moderation 2 も API 専用。「フロンティア級までオープン、最上位と業務特化は API」という構図
- Codestral(コード補完)の現在のオープン/Premier 区分はページ間で表示が揺れており**未確認**

### ライセンス

- オープン系は **Apache-2.0**(Mistral 3 発表・docs に明記。確認 2026-07-06)。商用利用の追加条件なし。※ 過去世代の一部にあった Mistral Research License 系の制約は Mistral 3 世代の主要モデルには適用されていない(公式から推測。個別モデル利用時はモデルカードで要確認)

### 仕様の要点

- コンテキスト長: 今回の一次確認では特定できず(**未確認**。docs のモデル別ページで執筆時に確認のこと)
- モダリティ: Large 3 / Small 4 / Ministral 3 はマルチモーダル(画像理解)、Voxtral 系で音声入出力(公式明記)
- reasoning: Ministral 3 の reasoning 変種、Small 4 の統合型ハイブリッド(公式明記)

### 利用形態

- セルフホスト: Ministral 3(3B〜14B)はエッジ・ローカル現実的。Large 3 は総 675B でマルチ GPU 前提(公式から推測)
- マネージド: **Mistral AI Studio(自社 API)、Amazon Bedrock、Azure Foundry、IBM watsonx、Together AI、Fireworks、Modal、OpenRouter、Hugging Face** など(Mistral 3 発表に明記。確認 2026-07-06)

### 公式の位置づけ

- エッジ(Ministral)からフロンティア級(Large 3)までを Apache-2.0 で提供する欧州系の主要プレイヤー。多言語(40+ 言語)とマルチモーダルを全ファミリーで強調(公式明記)

### 定点観測 URL

- https://mistral.ai/models/
- https://docs.mistral.ai/models/overview
- https://mistral.ai/news/

## OpenAI gpt-oss

### 現行世代と構成

- **gpt-oss-120b / gpt-oss-20b**(2025-08 リリース)。GPT-2 以来の OpenAI 製オープンウェイトモデル:
  - **gpt-oss-120b**: 総 **117B / アクティブ 5.1B** の MoE(128 エキスパート、トークンあたり 4 起動)。MXFP4 量子化で **80GB GPU 1 枚**(H100 / MI300X)で動作(公式明記)
  - **gpt-oss-20b**: 総 **21B / アクティブ 3.6B**。**16GB メモリ**のエッジデバイスで動作(公式明記)
  - 出典: https://github.com/openai/gpt-oss、https://huggingface.co/openai/gpt-oss-120b(確認 2026-07-06)
- 派生: **gpt-oss-safeguard-120b / 20b**(2025-10、安全分類特化の research preview、同じく Apache-2.0)。出典: https://openai.com/index/introducing-gpt-oss-safeguard/(検索経由で要旨確認)
- **2026-07-06 時点で後続のオープンウェイトモデルは未確認**。GitHub リポジトリの最新リリースは v0.0.9、活動は 2026-01 頃まで(観測事実)

### ライセンス

- **Apache-2.0**(公式明記。「コピーレフト制約・特許リスクなしで自由に構築可能」と公式が明記)

### 仕様の要点

- コンテキスト長: **131,072 トークン**(公式リポジトリの config.json の max_position_embeddings で確認。公式明記)
- モダリティ: テキストのみ(公式から推測。マルチモーダル対応の記載なし)
- reasoning: **reasoning effort 3 段階(low / medium / high)**、chain-of-thought へのフルアクセス(公式明記)。function calling / ブラウジング / Python 実行 / structured outputs をネイティブサポート(公式明記)
- **注意**: 独自の「harmony 応答フォーマット」必須。「このフォーマット以外では正しく動作しない」と公式が明記 — セルフホスト時の実装上の注意点として執筆価値あり

### 利用形態

- **OpenAI API では提供されず、ChatGPT でも使えない**(ヘルプセンター明記)。完全にダウンロード運用前提
- HF からダウンロードし、vLLM / Ollama / llama.cpp 等の OSS 推論スタックで運用(公式明記)
- 出典: https://help.openai.com/en/articles/11870455-openai-open-weight-models-gpt-oss(検索経由で要旨確認)。※ openai.com の紹介ページは bot アクセス 403 のため直接取得できず(観測事実)

### 公式の位置づけ

- 「o4-mini 近傍(120b)/ o3-mini 相当(20b)の推論性能を、単一 GPU / エッジで」という効率特化の打ち出し(introducing ブログの記述。間接確認のため公式から推測)。オンデバイス・ローカル推論・エージェント用途を明記

### 定点観測 URL

- https://openai.com/open-models/(ブラウザでは閲覧可、bot は 403)
- https://github.com/openai/gpt-oss
- https://huggingface.co/openai

## その他の勢力(一言ずつ)

- **Google Gemma**(オープンウェイト): 本調査の中心 5 ファミリー外だが、地図としては言及必須。現行 **Gemma 4**(2026-04): E2B / E4B(モバイル向け)〜 12B / 26B / 31B、12B はマルチモーダル。ライセンスは Apache ではなく独自の「**Gemma 利用規約**」(商用条件の詳細は今回未確認)。出典: https://deepmind.google/models/gemma(確認 2026-07-06、公式明記/規約詳細は未確認)
- **xAI Grok**: 主力モデルは API 専用。重み公開は旧世代 **Grok-1 / Grok-2** のみ(HF org で確認、Grok-2 は 2025-11 更新表示。ライセンス表示は org ページ上で未確認)。出典: https://huggingface.co/xai-org(確認 2026-07-06)
- **Amazon Nova**: **プロプライエタリ・Bedrock 経由 API 専用**(オープンウェイトではない)。Nova Lite / Pro / Premier に加え Nova 2 世代(Lite=reasoning、Sonic=speech-to-speech)。出典: https://aws.amazon.com/ai/generative-ai/nova/(確認 2026-07-06、公式明記)
- **Moonshot AI(Kimi)**: 中国系。**Kimi K2 系(総 1T〜1.1T の MoE)** の重みを HF 公開。2026 年は K2.5 / K2.6 / K2.7-Code と高頻度更新。ライセンスは org ページ上で表示未確認(K2 発表時は Modified MIT。**要確認**)。出典: https://huggingface.co/moonshotai(確認 2026-07-06)
- **Z.ai(智譜/GLM)**: 中国系。**GLM-5.1 / GLM-5.2(総 753〜754B)** の重みを HF 公開(2026)。ライセンス表示は未確認。出典: https://huggingface.co/zai-org(確認 2026-07-06)
- **Mistral の API 事業**: オープンウェイト提供と並行して自社 API(Mistral AI Studio)+ API 専用 Premier モデル(Medium 3.5 / OCR 4 等)を展開(上記 Mistral 節参照)

## 執筆上の示唆(俯瞰の論点候補)

1. **ライセンスは 3 類型で説明できる**: (a) Apache-2.0 / MIT(Qwen・DeepSeek・Mistral オープン系・gpt-oss — 商用追加条件なし)、(b) 独自コミュニティライセンス(Llama — 7 億 MAU 制限+表示義務+命名義務)、(c) 独自利用規約(Gemma・Grok-2)。「オープンウェイト=自由に商用可」ではない、が要点
2. **reasoning は「別モデル」から「モード切替」へ統合が進んだ**: DeepSeek R1 → V3.1 以降のハイブリッド化(V4 は 3 モード)、gpt-oss の reasoning effort、Mistral Small 4 の統合型。2026 年時点で「reasoning 専用オープンモデルを選ぶ」より「思考モードを持つ汎用モデルを選ぶ」が基本形
3. **大型帯は MoE が標準**。セルフホストのコストは総パラメータ(メモリ)とアクティブパラメータ(速度)の両方で見る必要がある — 例: gpt-oss-120b は総 117B だが 80GB GPU 1 枚、DeepSeek V4-Flash は「軽量版」でも総 284B
4. **「最上位だけクローズド」の分岐が観察される**: Qwen3.7 Max は API のみ(推測)、Meta は Behemoth 未公開のまま 1 年以上新世代なし、Mistral は Medium 3.5 を API 専用に。一方 DeepSeek は 1.6T の V4-Pro まで MIT で公開しており、対照的
5. コンテキスト長の目安: Llama 4 Scout 10M(最長)、DeepSeek V4 系 1M、Qwen3.5/3.6 262K、gpt-oss 131K

## 未確認事項(執筆時の TODO 候補)

- Mistral 3 各モデルの正確なコンテキスト長(docs のモデル別ページで確認する)
- Qwen3.7 の重み公開有無の公式言明(qwen.ai ブログが JS 描画のため一次確認できず。「API のみ」は HF org に不在という観測からの推測)
- Llama 4 の Bedrock / Vertex / Azure での提供形態の一次確認(各クラウドの公式モデルカタログで確認する)
- Gemma 利用規約の商用条件の詳細(ai.google.dev の利用規約ページ)
- Moonshot Kimi K2 系・Z.ai GLM-5 系の正確なライセンス(各モデルカードで確認する)
- Codestral の現行提供区分(オープン / Premier)
- gpt-oss のマネージド提供先(Azure / Bedrock 等での提供の公式言及。openai.com が bot 403 のため未確認)
