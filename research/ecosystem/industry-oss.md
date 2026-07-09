## 調査メモ: AI 業界レイヤー + OSS エコシステムの現在地(EC-R1)

本メモは「AI 業界レイヤーマップ」「オープンソース AI エコシステム」2 本(いずれも鮮度管理型)の裏取り用です。方針は次の 3 点を厳守しています。
(1) **中立**: プレイヤー名は各層の「代表例」として挙げるにとどめ、優劣評価・戦略評論・投資助言・資本関係/買収/シェアの詳細には踏み込みません。
(2) **所在の特定**: 各項目に一次情報 URL・確認日・確度を付し、ライセンス/規約は「現行版の所在と読み方」を特定します(法的解釈はしません)。
(3) **確度の明示**: 確度は「公式確認済み(本文取得)| 公式ページ存在(内容未読)| 二次情報 | 未確認」の 4 段階。取得できなかったものは推測で埋めず確度を下げています。

確認日はすべて 2026-07-10。取得手段が WebFetch で本文を読めたものを「公式確認済み(本文取得)」、URL の存在を検索で確認したが本文未読のものを「公式ページ存在(内容未読)」としています。

---

## A. AI 業界のレイヤー構造(代表例)

> 注意: 以下の「代表例」は各層に該当する企業/製品の一部を例示するもので、網羅・序列・推奨ではありません。多くの公式ホームページ URL は「存在確認」レベル(本文未読)です。記事では URL を鵜呑みにせず執筆時に各自再確認してください。

### レイヤーの一般的な区分(枠組み)

- **確認先**: AI バリューチェーン/AI スタックを論じる二次情報(FourWeekMBA、Fast Company ほか)
- **一次情報 URL**: (該当なし。枠組み自体は業界共通の整理で、決まった一次情報源はない)
- **扱う範囲(中立記述)**: レイヤーの数え方・名称は論者により 3〜7 層と揺れる。本ライブラリでは実務判断に使いやすい 5 層 +(日本の)SIer 層で整理する。5 層: (1) 半導体/アクセラレータ (2) クラウド・データセンター (3) 基盤モデル提供 (4) ミドルウェア・ツール・オーケストレーション (5) アプリケーション。
- **確認日**: 2026-07-10
- **確度**: 二次情報(層分けは「一意の正解がない整理軸」であることを本文で明示する)
- **備考**: 「層をまたぐ垂直統合が起きている」という構造的事実は複数の二次情報で共通して指摘される。ただし特定企業の統合戦略の評価はしない。参考: https://fourweekmba.com/ai-value-chain/ 、 https://www.fastcompany.com/91194971/decoding-the-ai-stack-and-how-to-succeed-in-the-ai-value-chain

### (1) 半導体/アクセラレータ層

- **確認先**: 各社公式ホームページ(GPU/AI アクセラレータ提供、ファウンドリ)
- **一次情報 URL(代表例・存在確認レベル)**: NVIDIA https://www.nvidia.com/ 、 AMD https://www.amd.com/ 、 Intel https://www.intel.com/ 、 (クラウド自社設計アクセラレータ: Google TPU https://cloud.google.com/tpu 、 AWS Trainium/Inferentia https://aws.amazon.com/machine-learning/trainium/ )、 製造(ファウンドリ)TSMC https://www.tsmc.com/
- **扱う範囲(中立記述)**: 学習/推論に用いる GPU・専用アクセラレータの設計・製造を担う層。設計(ファブレス)と製造(ファウンドリ)がさらに分かれる点を「構造」として示す。
- **確認日**: 2026-07-10
- **確度**: 公式ページ存在(内容未読)。URL は代表例で、記事執筆時に各自確認
- **備考**: 具体的な性能・シェア・世代名(製品名やパラメータ搬送量など)は変化が速いため本文では扱わない。

### (2) クラウド・データセンター層

- **確認先**: ハイパースケーラ各社公式
- **一次情報 URL(代表例・存在確認レベル)**: AWS https://aws.amazon.com/ 、 Google Cloud https://cloud.google.com/ 、 Microsoft Azure https://azure.microsoft.com/
- **扱う範囲(中立記述)**: 学習/推論のスケーラブルな計算資源・基盤を提供する層。GPU クラウド専業(いわゆる「ネオクラウド」)もこの層の一形態として存在する、という構造にとどめる。
- **確認日**: 2026-07-10
- **確度**: 公式ページ存在(内容未読)
- **備考**: 個別事業者のシェア・データセンター投資額は扱わない。

### (3) 基盤モデル提供層

- **確認先**: 各モデルプロバイダ公式
- **一次情報 URL(代表例・存在確認レベル)**: OpenAI https://openai.com/ 、 Anthropic https://www.anthropic.com/ 、 Google(Gemini / DeepMind) https://deepmind.google/ 、 Meta(Llama) https://www.llama.com/ 、 Mistral AI https://mistral.ai/ 、 Cohere https://cohere.com/ 、 Alibaba Qwen https://github.com/QwenLM 、 DeepSeek https://www.deepseek.com/
- **扱う範囲(中立記述)**: 汎用/特化の基盤モデル(API 提供・オープンウェイト配布)を担う層。「API のみ提供(クローズド)」と「重みを配布(オープンウェイト)」という提供形態の違いを構造として示す(ライセンス類型は C 章)。
- **確認日**: 2026-07-10
- **確度**: 公式ページ存在(内容未読)。ただし Meta / Mistral / Google のライセンスは C 章で本文取得済み
- **備考**: モデル名・世代・ベンチマークは扱わない。プロバイダの列挙順に意味はない。

### (4) ミドルウェア・ツール・オーケストレーション層

- **確認先**: 各 OSS/製品の公式リポジトリ・サイト
- **一次情報 URL(代表例・存在確認レベル)**: LangChain / LangGraph https://github.com/langchain-ai/langchain (公式サイト https://www.langchain.com/ )、 LlamaIndex https://github.com/run-llama/llama_index 、 Microsoft Agent Framework(旧 AutoGen + Semantic Kernel の統合) https://github.com/microsoft/autogen 、 CrewAI https://github.com/crewAIInc/crewAI 、 推論サーバ vLLM https://github.com/vllm-project/vllm 、 Hugging Face Transformers https://github.com/huggingface/transformers
- **扱う範囲(中立記述)**: モデルとアプリの間に立ち、オーケストレーション/エージェント構築/推論最適化/ツール接続などを担う層。OSS が厚い層である点を示す(詳細は B 章と重複)。
- **確認日**: 2026-07-10
- **確度**: 公式リポジトリ存在(検索確認)。AutoGen が「メンテナンスモード・Agent Framework へ統合」との情報は二次情報のため、記事では「統合が進んでいる」程度に留めるか TODO(要確認)を付す
- **備考**: この層は「上下(モデル層・クラウド層)から機能を取り込まれやすい」という構造が二次情報で共通指摘されるが、個社の栄枯は評価しない。

### (5) アプリケーション層

- **確認先**: (層の説明のみ。個別プロダクトは列挙しない)
- **一次情報 URL**: (該当なし)
- **扱う範囲(中立記述)**: 特定業務・業界(金融・医療・製造・法務・カスタマーサポート等)向けの製品や、コンシューマ向けアプリなど、エンドユーザに価値を届ける層。垂直特化 SaaS と汎用アシスタントの両方を含む。
- **確認日**: 2026-07-10
- **確度**: 二次情報(枠組みのみ)
- **備考**: 個別サービス名は変化が速く、公平性の観点からも本文では代表例を絞りにくい。「層の役割」の説明にとどめるのが無難。

### 日本市場の構造(国産基盤モデル・SIer 層)

- **確認先**: LLM-jp 日本語 LLM カタログ(コミュニティ運営の中立的一覧)、各社公式
- **一次情報 URL**: カタログ https://llm-jp.github.io/awesome-japanese-llm/ (GitHub: https://github.com/llm-jp/awesome-japanese-llm )。 代表的な国産基盤モデル開発主体(カタログ掲載の公式リンク): 国立情報学研究所 LLM-jp/大規模言語モデル研究開発センター https://llm-jp.nii.ac.jp/ 、 SB Intuitions(Sarashina) https://www.sbintuitions.co.jp/ 、 Preferred Networks / PFN(PLaMo) https://www.preferred.jp/ 、 Stockmark https://stockmark.co.jp/ 、 CyberAgent(CALM) https://www.cyberagent.co.jp/ 、 rinna https://rinna.co.jp/
- **扱う範囲(中立記述)**: 日本市場には「フルスクラッチ開発の国産モデル」と「海外オープンモデルへの日本語継続事前学習/事後学習で作る派生モデル」という 2 系統がある、という**構造**を示す(カタログはこの区分で分類している: フルスクラッチ / 継続事前学習 / 事後学習のみ)。加えて SIer・システムインテグレータが「モデルを業務システムに実装する層」として存在する構造を示す。
- **確認日**: 2026-07-10
- **確度**: カタログ本文は公式確認済み(本文取得)。個社公式サイトは公式ページ存在(内容未読)
- **備考**: 「どのモデルが優れているか」「政府調達で何本選ばれたか」等の具体は変化が速く政策依存のため本文では扱わず、必要なら TODO(要確認)。海外モデルベースの代表として ELYZA(Meta Llama ベース)などが二次情報で挙がるが、ベース関係の断定は各社公式・モデルカードで確認する。SIer 層の代表例(NTT データ、野村総研、富士通、NEC 等)は「層の存在」を示す例示にとどめる。

### 層をまたぐ垂直統合(構造的事実)

- **確認先**: 複数の二次情報(AI スタック論)
- **一次情報 URL**: (特定の一次情報なし)
- **扱う範囲(中立記述)**: 「クラウド事業者が自社アクセラレータを設計する」「モデルプロバイダがアプリまで提供する」等、単一プレイヤーが複数層にまたがる例が存在する、という**事実**のみを示す。どの企業のどの統合が優れている/成功しているという評価はしない。
- **確認日**: 2026-07-10
- **確度**: 二次情報
- **備考**: 記事では「垂直統合が観察される」という構造記述に限定し、固有名詞での戦略評価を避ける。

---

## B. オープンソース AI エコシステム

### モデル/データセットハブ(Hugging Face)

- **確認先**: Hugging Face 公式(Hub ドキュメント・利用規約)
- **一次情報 URL**: 本体 https://huggingface.co/ 、 利用規約 https://huggingface.co/terms-of-service 、 モデルカード仕様(Hub docs) https://huggingface.co/docs/hub/model-cards 、 データセットカード https://huggingface.co/docs/hub/datasets-cards 、 コンテンツポリシー https://huggingface.co/content-guidelines (ToS から参照される。URL は要確認)
- **扱う範囲(中立記述)**: モデル/データセット/Spaces を共有するハブ。**規約構造**として、ToS 本体は「Definitions / Service Usage / Content Ownership / IP・DMCA / 免責」等の章立てを持ち、具体的な利用禁止事項・モデレーションは別文書(Content Policy / Code of Conduct)に委譲されている、という**所在**を示す。モデルカード/データセットカードは repo 内の `README.md`(先頭の YAML front matter = 機械可読メタデータ + 本文)として実装され、`license` フィールドでライセンスを宣言する仕組みである点を示す。
- **確認日**: 2026-07-10
- **確度**: ToS 章立て・モデルカード仕様は公式確認済み(本文取得)。Content Policy の個別 URL は未確認(内容未読)
- **備考**: 「規約の詳細本文」は変わりやすいので、記事では「ToS 本体 + 別紙 Content Policy/Code of Conduct という二層構造」という所在の特定にとどめ、条項の断定はしない。モデルカードの `license: other` + `license_name`/`license_link` で独自ライセンスを宣言できる仕組みは C 章(独自制限付きライセンス)と接続する。

### OSS フレームワーク/エージェント(類型ごとの代表例)

- **確認先**: 各 OSS 公式リポジトリ
- **一次情報 URL(代表例・存在確認レベル)**:
  - オーケストレーション/エージェント: LangChain・LangGraph https://github.com/langchain-ai/langchain 、 LlamaIndex https://github.com/run-llama/llama_index 、 Microsoft AutoGen / Agent Framework https://github.com/microsoft/autogen 、 CrewAI https://github.com/crewAIInc/crewAI
  - モデル実行/学習ライブラリ: Hugging Face Transformers https://github.com/huggingface/transformers
  - 高スループット推論サーバ: vLLM https://github.com/vllm-project/vllm
- **扱う範囲(中立記述)**: 「OSS が厚い層」であることと、類型(オーケストレーション/エージェント、推論サーバ、学習・変換ライブラリ、ローカル実行系)ごとに代表例が存在することを示す。個々の優劣・スター数・採用状況は扱わない。
- **確認日**: 2026-07-10
- **確度**: 公式リポジトリ存在(検索確認)。各リポジトリの現行ライセンスは記事執筆時に各自確認
- **備考**: これらのライセンスは多くが MIT/Apache 2.0 等の寛容型だが、リポジトリごとに異なりうるため断定しない。フレームワークの API・機能は変化が速いので機能詳細は本ライブラリの他ドキュメント/TODO に委ねる。

### ローカル実行系

- **確認先**: 各 OSS 公式(LLMOPS 調査と一部重複。ここでは現行の所在のみ)
- **一次情報 URL**: Ollama https://ollama.com/ (GitHub https://github.com/ollama/ollama )、 llama.cpp https://github.com/ggml-org/llama.cpp (ggml/GGUF フォーマットの本家)
- **扱う範囲(中立記述)**: 手元のマシンでモデルを動かす実行系。llama.cpp が C/C++ の推論エンジン(GGUF フォーマット)で、Ollama はその上に CLI・モデル管理を載せた利用しやすいラッパ、という**構造の所在**を示す。
- **確認日**: 2026-07-10
- **確度**: 公式リポジトリ存在(検索確認)。llama.cpp が MIT である点は二次情報レベル(記事では各自確認)
- **備考**: llama.cpp の GitHub 組織は `ggml-org`(旧 `ggerganov`)へ移行済みとの情報あり。リンクは `ggml-org/llama.cpp` を優先しつつ執筆時に最終確認。スター数等の数値は扱わない。

---

## C. モデルライセンスの類型と現行版(最重要)

> 記事の狙い: 「オープン(公開)= 商用自由 ではない」を、ライセンス**類型**と現行版の**所在**で示す。個別条項の法的解釈はせず、「何を確認すべきかの観点」を提示する。

### 類型 1: 寛容型(permissive)

- **確認先**: Apache Software Foundation / Open Source Initiative(OSI)公式条文
- **一次情報 URL**: Apache License 2.0 条文 https://www.apache.org/licenses/LICENSE-2.0 、 MIT License(OSI ページ) https://opensource.org/license/mit
- **扱う範囲(中立記述)**: 商用利用・改変・再配布・サブライセンスを広く許諾する類型。Apache 2.0 は「著作権ライセンス + 特許ライセンス(特許訴訟提起で失効)」を含み、条件として「ライセンス写しの提供・改変ファイルへの告知・著作権/特許/帰属表示の保持・NOTICE ファイルの同梱」を課す。MIT は「著作権表示とライセンス文の保持」が主条件で、追加の帰属義務は課さない。**利用者数の上限や用途制限は付かない**のが寛容型の特徴。
- **確認日**: 2026-07-10
- **確度**: 公式確認済み(本文取得)。両条文とも本文を取得
- **備考**: オープンウェイトモデルで寛容型の代表例として、Apache 2.0 を採用する系統(Mistral・Alibaba Qwen の一部)や MIT(DeepSeek、Microsoft Phi の一部)が二次情報で挙がる。**どのモデルがどのライセンスかはモデルカードで各自確認**(モデル世代ごとに変わりうる)。

### 類型 2: コピーレフト/振る舞い制限付きコピーレフト(OpenRAIL 系)

- **確認先**: Hugging Face 公式ブログ / Responsible AI Licenses(RAIL)公式
- **一次情報 URL**: 解説(HF 公式ブログ) https://huggingface.co/blog/open_rail 、 RAIL 公式 https://www.licenses.ai/ (FAQ https://www.licenses.ai/faq-2 )
- **扱う範囲(中立記述)**: OpenRAIL(Open Responsible AI License)は「ロイヤリティフリーで自由に使える・再配布できる」オープン性と、「特定の有害用途を禁止する**振る舞い制限(behavioral-use restrictions)**」を組み合わせた類型。制限条項は派生物にも引き継がれる(コピーレフト的伝播)。禁止用途の例として監視・差別的判断・偽情報生成・兵器開発などが典型的に列挙される。**用途制限が付くため OSI 定義上の「オープンソース」には該当しない**点が重要。
- **確認日**: 2026-07-10
- **確度**: 二次情報(HF ブログ・RAIL サイトの URL は公式だが、本メモでは本文未取得)。記事では条文本文を各自確認
- **備考**: 純粋な GPL 等の古典的コピーレフトがモデル重みに適用される例は限定的。ここでは「振る舞い制限付き」を実務上のコピーレフト類似カテゴリとして扱う。BigScience BLOOM が初期の OpenRAIL-M 適用例。

### 類型 3: 独自制限付き(利用規模・用途制限)= 「オープンウェイト」の中核

これが「オープン ≠ 商用自由」を最も端的に示す類型。**OSI 承認ライセンスではない**。

#### 3-a. Llama Community License(Meta)

- **確認先**: Meta 公式ライセンス / GitHub の LICENSE ファイル
- **一次情報 URL**: 一覧 https://www.llama.com/ (バージョン別。例: Llama 4 は https://developer.meta.com/ai/llama4/license/ へリダイレクト)。 GitHub 版(本文取得できた): https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE 。 Acceptable Use Policy(参照により組み込み) https://www.llama.com/llama4/use-policy/
- **扱う範囲(中立記述・確認すべき観点)**:
  - **利用規模の条件**: 直近暦月の月間アクティブユーザ(MAU)が **7 億(700 million)超**の製品/サービスでは、Meta から別途ライセンスを取得する必要があり、Meta は裁量で許諾を判断できる。→「規模」の観点。
  - **帰属**: 「Built with Llama」の明示表示義務。→「派生物・製品表示」の観点。
  - **再配布**: ライセンス写しの同梱、指定の Notice 文言(例: "Llama 4 is licensed under the Llama 4 Community License, Copyright © Meta Platforms, Inc.")の同梱、帰属表示の保持。→「再配布」の観点。
  - **用途**: Acceptable Use Policy が参照により組み込まれ、遵守が義務。→「用途」の観点。
  - 名称は "Community License Agreement" であり、Meta 自身の文言でも "open source" と断定しない(OSI・FSF は「オープンソースではない」との立場を二次情報で示している)。
- **確認日**: 2026-07-10
- **確度**: 公式確認済み(本文取得)。GitHub の LICENSE 本文で 700M MAU・Built with Llama・Notice 文言・AUP 組込みを確認
- **備考**: 数値(7 億 MAU)や版(Llama 4 は 2025-04-05 発効)はモデル世代で変わりうるため、記事では「規模条件が存在する」という**構造**を軸にし、具体数値には「執筆時点の版で確認」を添える。

#### 3-b. Gemma Terms of Use(Google)

- **確認先**: Google 公式(Gemma 規約・禁止利用ポリシー)
- **一次情報 URL**: 規約 https://ai.google.dev/gemma/terms 、 Prohibited Use Policy https://ai.google.dev/gemma/prohibited_use_policy
- **扱う範囲(中立記述・確認すべき観点)**:
  - **用途制限**: Prohibited Use Policy(参照組込み)違反や法令違反での利用を禁止。Google は違反と合理的に判断する利用を「(遠隔含め)制限」する権利を留保。→「用途」「継続利用可否」の観点。
  - **再配布・派生物**: 再配布/モデル派生物(蒸留を含む重み・パターン由来の派生も "Model Derivatives" に含む)の配布時は、利用制限を受領者の合意に含める・規約全文を提供・改変ファイルへの告知・「Gemma is provided under and subject to the Gemma Terms of Use」の Notice を同梱、が条件。→「再配布」「派生物の扱い」の観点。
  - **OSI 承認外**: これは Google 独自の Terms of Use で OSI 承認ライセンスではない。
- **確認日**: 2026-07-10
- **確度**: 公式確認済み(本文取得)。現行版は「Last modified April 1, 2026」と表示
- **備考**: 「Gemma の一部世代は Apache 2.0 で提供」との情報が取得結果に含まれたが未検証。世代でライセンスが異なりうるため、記事では断定せず「世代ごとにモデルカード/公式規約で確認」と書く(TODO 候補)。

#### 3-c. その他の独自制限付き(参考)

- **確認先**: 各モデルカードの `license` フィールド / 各社規約
- **一次情報 URL**: (モデルごとに異なる。Hugging Face のモデルカードから辿る)
- **扱う範囲(中立記述)**: 研究のみ可・商用別途契約・特定業界禁止など、独自条項を持つモデルライセンスが多数存在する、という**幅の広さ**を示す。個別列挙より「モデルカードの license を必ず読む」という行動指針を提示。
- **確認日**: 2026-07-10
- **確度**: 二次情報/未確認(個別モデル依存)
- **備考**: 「公開されている ≠ 自由に商用利用できる」の実例カテゴリとして言及。

### モデルカード/データシート(何を確認するか)

- **確認先**: Hugging Face 公式仕様 + 原典論文
- **一次情報 URL**: モデルカード(Hub) https://huggingface.co/docs/hub/model-cards 、 モデルカードのメタデータ仕様 https://github.com/huggingface/hub-docs/blob/main/modelcard.md 、 データセットカード https://huggingface.co/docs/hub/datasets-cards 。 原典: Model Cards for Model Reporting(Mitchell et al., 2018/2019) https://arxiv.org/abs/1810.03993 、 Datasheets for Datasets(Gebru et al.) https://arxiv.org/abs/1803.09010
- **扱う範囲(中立記述・標準的な確認項目)**:
  - **モデルカードで確認すべき項目**: モデルの説明、想定用途と非推奨用途、既知の限界・バイアス・倫理的配慮、学習データ、学習パラメータ/実験情報、評価結果、ライセンス(`license` フィールド)、ベースモデル(`base_model`)。
  - **データセットカード/データシートで確認すべき項目**: 動機(motivation)、構成(composition)、収集プロセス、ラベリング、推奨用途、配布・保守、ライセンス・言語・規模。
  - 業界統一の「唯一の標準」は未確立で、Model Cards・Datasheets・Data Nutrition Labels などの提案が併存する、という所在を示す。
- **確認日**: 2026-07-10
- **確度**: HF 仕様は公式確認済み(本文取得)。原典論文 arXiv ID は HF ドキュメント/HF papers 経由で確認(公式ページ存在)
- **備考**: 記事では「モデルを採用する前にモデルカードの license と intended/limitations を必ず読む」を実務チェックリストの核に据えられる。

---

## D. AI 標準化・ガバナンスの組織(参考・軽め)

### Open Source Initiative(OSI) — Open Source AI Definition

- **確認先**: OSI 公式
- **一次情報 URL**: Open Source AI Definition https://opensource.org/ai/open-source-ai-definition 、 OSI トップ https://opensource.org/
- **扱う範囲(中立記述)**: OSI が「オープンソース AI」の定義(OSAID)を策定。**現行版は 1.0**。4 つの自由(利用・研究・改変・共有)を無制限に認め、そのために「改変に必要な望ましい形態」= データ情報(training data の来歴・範囲・入手先等)・完全なコード(学習/推論)・パラメータ(重み・設定)へのアクセスを要件とする。この定義に照らすと、用途/規模制限を持つ「オープンウェイト」モデルは OSAID の「オープンソース」には該当しない、という**枠組み**を示す。
- **確認日**: 2026-07-10
- **確度**: 公式確認済み(本文取得)。定義 1.0 の 4 自由・3 要素を確認(公表日はページ上で明示されていなかった)
- **備考**: 「OSI が特定モデル(Llama 等)をオープンソースでないと公に述べた」という個別のやり取りは二次情報。記事では「OSAID という定義が存在し、オープンウェイトと区別される」という中立記述にとどめ、個別企業への断定的評価は避ける。

### 標準を担うその他の組織(参考)

- **確認先**: 各財団/団体公式
- **一次情報 URL**: Apache Software Foundation https://www.apache.org/ 、 Free Software Foundation https://www.fsf.org/ 、 Responsible AI Licenses(RAIL Initiative) https://www.licenses.ai/ 、 Linux Foundation / LF AI & Data https://lfaidata.foundation/
- **扱う範囲(中立記述)**: ライセンス条文(Apache/FSF)、責任ある AI ライセンス(RAIL)、AI・データ関連 OSS のホスティング/ガバナンス(LF AI & Data)など、標準・ガバナンスに関わる組織が複数存在する、という所在の提示にとどめる。
- **確認日**: 2026-07-10
- **確度**: 公式ページ存在(内容未読)。Apache は条文本文のみ取得済み
- **備考**: LF AI & Data の URL は存在確認レベル。記事で参照する場合は再確認。

---

## 記事執筆時の注意

### 断定を避けるべき点

- **プレイヤーは「代表例」**: 各層の企業/製品は例示であり、網羅・序列・推奨ではない旨を明記する。列挙順に意味を持たせない。
- **シェア・資本関係・買収・資金調達額は書かない**: 変化が速く、中立性を損なう。構造(層・提供形態・ライセンス類型)を軸にする。
- **ライセンスは「現行版を各自確認」**: 数値(Llama の 7 億 MAU など)・版・発効日・採用ライセンスはモデル世代で変わる。本文では「規模条件が存在する」等の**構造**を書き、具体値には「執筆時点の版で確認」を添える。誤った条項を書くより「モデルカード/公式規約で確認」と促す。
- **「オープン ≠ 商用自由」**: 「公開/ダウンロード可能」と「OSI 定義のオープンソース」と「商用利用の自由」は別物。オープンウェイト(重みは配布・用途/規模制限あり)と OSI オープンソース(4 自由 + データ情報/コード/パラメータ)の区別を必ず提示する。
- **法的解釈はしない**: 「何を確認すべきか(規模・用途・再配布・派生物の扱い)の観点」を示すにとどめ、個別ケースの適法性判断はしない。免責(本メモ/記事は法的助言ではない)を明記。
- **フレームワークの機能・状態は変わる**: AutoGen の統合状況、llama.cpp の GitHub 組織名(ggerganov → ggml-org)など、記事化時に再確認。断定が必要なら TODO(要確認)を残す。

### 変わりやすい項目(定点観測候補)

- 各層の代表プレイヤーの顔ぶれ(特に (4) ミドルウェア層と (5) アプリ層は流動的)。
- モデルライセンスの版・発効日・規模条件の数値(Llama Community License の MAU しきい値、Gemma Terms の最終改定日)。
- 各基盤モデルの採用ライセンス(同一ベンダでも世代で Apache 2.0 ↔ 独自規約が変わる)。
- OSI Open Source AI Definition の版(現行 1.0 → 改定の可能性)。
- Hugging Face の ToS / Content Policy / Code of Conduct の版と参照構造。
- OSS フレームワークの GitHub 組織移管・統合・メンテナンス状態(AutoGen/Agent Framework、llama.cpp の ggml-org 移管等)。
- 日本の国産基盤モデルの顔ぶれと政府調達/政策動向(変化が速く政策依存)。
- OpenRAIL / RAIL の条文更新と適用モデルの広がり。

### 確度サマリ(記事で一次情報として引ける度合い)

- **公式確認済み(本文取得)**: Apache License 2.0 条文、MIT License(OSI)、Gemma Terms of Use(2026-04-01 版)、Llama 4 Community License(GitHub LICENSE, 700M MAU・Built with Llama)、Hugging Face モデルカード仕様・ToS 章立て、OSI Open Source AI Definition 1.0、LLM-jp 日本語 LLM カタログ。
- **公式ページ存在(内容未読)/リポジトリ存在**: 各社公式ホームページ(半導体・クラウド・基盤モデル)、OSS フレームワーク/ローカル実行系の GitHub、OpenRAIL の HF ブログ・RAIL サイト、原典論文 arXiv。
- **二次情報**: 層分けの枠組み、垂直統合の観察、OpenRAIL 禁止用途の具体、日本モデルのベース関係、「OSI が Llama をオープンソースでないと述べた」個別発言。
- **未確認**: Hugging Face Content Policy の個別 URL、Gemma 一部世代の Apache 2.0 適用、SIer 層の個別代表例。
