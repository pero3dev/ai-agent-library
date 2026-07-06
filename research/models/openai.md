# OpenAI モデルファミリー調査メモ(M-R2)

- **対象**: OpenAI のモデルファミリー(2026-07 時点の現行世代)
- **調査日**: 2026-07-06
- **用途**: 「主要 LLM の全体像(モデルカタログ)」「モデル選定ガイド」執筆の一次資料
- **根拠の方針**: OpenAI 公式ドキュメント(developers.openai.com / openai.com)と Microsoft Learn(Azure 公式)のみを根拠とします。第三者記事・ベンチマークまとめサイトは使用していません
- **確度表記**: 「公式明記」= 公式ページに明文あり / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず
- **重要な注意**: 旧 `platform.openai.com/docs/*` は `developers.openai.com/api/docs/*` へ 301 リダイレクトされます(2026-07-06 確認)。定点観測 URL は新ドメイン側を正とします

主な出典(いずれも確認日 2026-07-06):

- モデル概要: https://developers.openai.com/api/docs/models
- 料金: https://developers.openai.com/api/docs/pricing
- 非推奨・退役: https://developers.openai.com/api/docs/deprecations
- GPT-5.5 利用ガイド: https://developers.openai.com/api/docs/guides/latest-model
- モデル選定ガイド: https://developers.openai.com/api/docs/guides/model-selection
- Azure(Microsoft Foundry)モデル一覧: https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure

## 1. 現行モデルファミリーの構成とティア構造

### テキスト・マルチモーダル(フロンティア)系

モデル概要ページ(公式明記)が現行フロンティアとして提示するのは **GPT-5.5 / GPT-5.4 世代** です。かつての o シリーズ(o3 など)のような「推論特化の別系統」は現行カタログの正面には存在せず、**推論(reasoning)は GPT-5.x 本体に統合され、`reasoning.effort` パラメータで制御する構成**になっています(公式から推測。根拠: モデル概要 + deprecations で o3/o3-pro の移行先が gpt-5.5/gpt-5.5-pro とされていること)。

| ティア | モデル(API ID) | 公式の一言説明(原文) |
| --- | --- | --- |
| フラッグシップ(最新) | `gpt-5.5` | "A new class of intelligence for coding and professional work" |
| フラッグシップ(低価格) | `gpt-5.4` | "A more affordable model for coding and professional work" |
| 高コンピュート(pro) | `gpt-5.5-pro` / `gpt-5.4-pro` | "uses more compute to think harder and provide consistently better answers"(5.5-pro ページ) |
| mini | `gpt-5.4-mini` | "Our strongest mini model yet for coding, computer use, and subagents" |
| nano | `gpt-5.4-nano` | "for tasks where speed and cost matter most like classification, data extraction, ranking, and sub-agents" |
| ChatGPT 追随エイリアス | `chat-latest` | "Default Latest Instant model used in ChatGPT"(スナップショットは随時更新) |

- 5.5 世代で 2026-07-06 時点にカタログ確認できたのは `gpt-5.5` と `gpt-5.5-pro` のみ。**mini / nano の最新版は 5.4 世代**(`gpt-5.4-mini` / `gpt-5.4-nano`)です(公式明記: モデル概要・料金ページ)
- `chat-latest` は Azure 側ドキュメントで「GPT-5.5 Instant」とも呼ばれると説明(出典: Microsoft Learn、公式明記)。OpenAI 公式は本番 API 用途には `gpt-5.5` の使用を推奨(出典: chat-latest モデルページ、公式明記)
- Codex(コーディングエージェント)向けの `-codex` 系統は縮小方向: `gpt-5.3-codex` は Deprecated で、公式は「GPT-5.4 は GPT-5.3-codex のフロンティアコーディング能力を取り込んだ最初のメインライン推論モデル」と説明(出典: https://developers.openai.com/codex/models 、公式明記)。研究プレビューとして `gpt-5.3-codex-spark`(テキストのみ・ほぼ即時応答・ChatGPT Pro 限定)が存在

### リアルタイム音声系(名前と位置づけ)

出典: モデル概要ページ(公式明記)。

- `gpt-realtime-2` — "our most capable realtime voice model"。**reasoning 対応の音声モデル**(speech-to-speech)
- `gpt-realtime-translate` — ストリーミング音声間翻訳
- `gpt-realtime-1.5` — 音声入出力(前世代)
- `gpt-realtime-mini` — 低コスト版
- `gpt-realtime-whisper` — ストリーミング音声認識(STT)
- ほか文字起こし系: `gpt-4o-transcribe` / `gpt-4o-mini-transcribe`(4o 系が残存)。`gpt-4o-mini-tts` は Deprecated 表示

### 画像・動画系(名前程度)

- 画像生成: `gpt-image-2` — "State-of-the-art image generation model"(公式明記)。旧 `gpt-image-1-mini` は退役予定(後述)
- 動画生成: `sora-2`(料金ページに掲載。Azure ではプレビュー提供)

### 非推奨・退役予定(deprecations ページ、公式明記)

一般提供(GA)モデルは退役の **最低 6 か月前** に告知、と公式が明記しています。2025〜2026 年の主なエントリ:

| 告知日 | 対象 | 退役日 | 推奨移行先 |
| --- | --- | --- | --- |
| 2026-06-11 | `gpt-5-2025-08-07` | **2026-12-11** | `gpt-5.5` |
| 2026-06-11 | `gpt-5-mini-2025-08-07` | **2026-12-11** | `gpt-5.4-mini` |
| 2026-06-11 | `gpt-5-nano-2025-08-07` | **2026-12-11** | `gpt-5.4-nano` |
| 2026-06-11 | `gpt-5-pro-2025-10-06` | **2026-12-11** | `gpt-5.5-pro` |
| 2026-06-11 | `o3-2025-04-16` | **2026-12-11** | `gpt-5.5` |
| 2026-06-11 | `o3-pro-2025-06-10` | **2026-12-11** | `gpt-5.5-pro` |
| 2026-05-08 | `gpt-5.2-chat-latest` / `gpt-5.3-chat-latest` | **2026-08-10** | `gpt-5.5`(chat-latest) |
| 2026-06-02 | `gpt-image-1-mini` | **2026-12-01** | `gpt-image-2` |
| 2026-06-03 | Reusable prompts(`v1/prompts`)/ Evals platform / Agent Builder | 2026-11-30 | アプリコードへ移行 / 代替ツール / Agents SDK 等 |

- **o シリーズは 2026-12-11 で事実上終息**(o3 / o3-pro とも GPT-5.5 系へ移行)。`o4-mini` はモデルページで Deprecated・後継 GPT-5 mini と表示されるが、**退役日そのものは未確認**(o4-mini ページに明示なし。deprecations ページの該当行も今回未取得)
- `gpt-4o` / `gpt-4.1` 系(テキスト)の現在の掲載状況・退役予定: **未確認**(今回の取得範囲に含まれず。transcribe 系の 4o 派生は現役掲載)
- 中間世代 `gpt-5.1` / `gpt-5.2` / `gpt-5.3`(メインライン)の API 提供状況: **未確認**(deprecations に chat-latest 変種のみ掲載。Codex では gpt-5.2 が Deprecated 表示)

## 2. 各モデルの仕様

出典: 各モデルページ(https://developers.openai.com/api/docs/models/<ID> 、確認日 2026-07-06、特記なき限り公式明記)。

| 項目 | `gpt-5.5` | `gpt-5.4` | `gpt-5.4-mini` | `gpt-5.4-nano` | `gpt-5.5-pro` | `chat-latest` | `gpt-realtime-2` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 最新スナップショット | `gpt-5.5-2026-04-23` | `gpt-5.4-2026-03-05` | `gpt-5.4-mini-2026-03-17` | `gpt-5.4-nano-2026-03-17` | `gpt-5.5-pro-2026-04-23` | (随時更新) | `gpt-realtime-2`(Azure 表記 2026-05-07) |
| コンテキストウィンドウ | 1,050,000 | 1,050,000 | 400,000 | 400,000 | 1,050,000 | 400,000 | 128,000 |
| 最大出力トークン | 128,000 | 128,000 | 128,000 | 128,000 | 128,000 | 128,000 | 32,000 |
| 入力モダリティ | テキスト+画像 | テキスト+画像 | テキスト+画像 | テキスト+画像 | テキスト+画像 | テキスト+画像 | 音声+テキスト+画像 |
| 出力モダリティ | テキスト | テキスト | テキスト | テキスト | テキスト | テキスト | 音声+テキスト |
| reasoning 対応 | ○ | ○ | ○ | ○ | ○ | 未確認 | ○(effort 制御あり) |
| effort 水準 | none/low/**medium(既定)**/high/xhigh | **none(既定)**/low/medium/high/xhigh | none(既定)〜xhigh | none(既定)〜xhigh | medium/**high(既定)**/xhigh | — | あり(水準の内訳は未確認) |
| knowledge cutoff | 2025-12-01 | 2025-08-31 | 2025-08-31 | 2025-08-31 | 2025-12-01 | 2025-08-31 | 2024-09-30 |

補足:

- effort に **`xhigh`** が加わり、`none` で推論なし動作も選べる 5 段階(+pro は medium 以上のみ)。GPT-5.5 の既定は medium、GPT-5.4 系の既定は none とページに表示 — **世代内で既定値が異なる点は執筆時に再確認推奨**(公式明記だが取得精度に注意)
- 1M 超級コンテキストには段階価格あり: **入力 272K トークン超のプロンプトは入力 2 倍・出力 1.5 倍**(gpt-5.5 / gpt-5.4 ページ、公式明記)。Azure 側では gpt-5.5 の内訳を「入力 922,000 / 出力 128,000」と表記
- 地域データレジデンシー(regional processing)エンドポイントは **+10% 課金**(gpt-5.5 / nano / 5.5-pro ページ、公式明記)
- 対応ツール(gpt-5.5): Web search / File search / Image generation / Code interpreter / Hosted shell / Apply patch / Skills / Computer use / MCP / Tool search(公式明記)。5.5-pro は Computer use 非対応、nano も Computer use の記載なし
- Azure 表記のスナップショット日付は `gpt-5.5 (2026-04-24)` と 1 日ずれあり(タイムゾーン差と推測。公式から推測)

## 3. 価格(1M トークンあたり、Standard ティア)

出典: https://developers.openai.com/api/docs/pricing (確認日 2026-07-06、公式明記)。**docs 本文には桁感のみ転記する方針**(このメモが具体値の正)。

| モデル | 入力 | キャッシュ入力 | 出力 |
| --- | --- | --- | --- |
| `gpt-5.5` | $5.00 | $0.50 | $30.00 |
| `gpt-5.5-pro` | $30.00 | — | $180.00 |
| `gpt-5.4` | $2.50 | $0.25 | $15.00 |
| `gpt-5.4-mini` | $0.75 | $0.075 | $4.50 |
| `gpt-5.4-nano` | $0.20 | $0.02 | $1.25 |
| `gpt-5.4-pro` | $30.00 | — | $180.00 |
| `chat-latest` | $5.00 | $0.50 | $30.00 |

- **Batch API は Standard の 50% 引き**(例: gpt-5.5 入力 $2.50 / 出力 $15.00。料金ページに Batch 表として明記)
- キャッシュ入力は通常入力の **1/10**(pro 系はキャッシュ価格の掲載なし)
- リアルタイム音声 `gpt-realtime-2`: テキスト 入力 $4.00 / キャッシュ $0.40 / 出力 $24.00、**音声 入力 $32.00 / キャッシュ $0.40 / 出力 $64.00**(モデルページ・料金ページ、公式明記)。`gpt-realtime-mini` 等の価格は未確認
- 画像 `gpt-image-2`: 入力 $8.00〜出力 $30.00 のレンジ表記(トークン種別の詳細内訳は未確認)。Batch は半額
- 動画 `sora-2`: $0.10/秒(720p)、Batch $0.05/秒(公式明記)
- 従量課金以外の付帯条件: 272K 超の長文入力割増(2 倍/1.5 倍)と地域処理 +10% は §2 参照
- 旧世代参考値(Deprecated): `o4-mini` 入力 $1.10 / キャッシュ $0.275 / 出力 $4.40(モデルページ、公式明記)

## 4. 公式の推奨用途・モデル選定ガイダンス

### モデル選定ガイド(model-selection、公式明記)

- 基本方針: **「まず精度目標を達成するまで最適化し、その後、精度を維持できる最も安く速いモデルへ」** の 2 段階アプローチ
- **最初は最上位モデル(gpt-5.5)で精度目標の達成可否を確認**し、達成後に小型モデルへの置換やファインチューニング(蒸留)でコストを下げる
- コスト・レイテンシ削減の 3 戦略: リクエスト数削減 / 入出力トークン削減 / 精度を維持できる小型モデルの選択
- ケーススタディとして「gpt-4o-mini のファインチューニングで gpt-4o と同等精度・コスト 1/50」の例を掲載(旧世代の例が残存している点に注意)

### 各モデルの公式ポジショニング(各モデルページ・Codex docs、公式明記)

| 用途 | 公式推奨 |
| --- | --- |
| 複雑なコーディング・エージェント・ナレッジワーク全般 | `gpt-5.5`("strongest for complex coding, computer use, knowledge work, and research workflows") |
| 同上をより低コストで | `gpt-5.4` |
| 軽量コーディング・サブエージェント・高スループット | `gpt-5.4-mini`("faster, lower-cost option for lighter coding tasks or subagents") |
| 分類・データ抽出・ランキング・サブエージェント(速度/コスト最優先) | `gpt-5.4-nano` |
| 難問(数分かかっても最高品質の回答が必要) | `gpt-5.5-pro`("tackle tough problems"、応答に数分かかる場合あり) |
| 音声エージェント(speech-to-speech) | `gpt-realtime-2`(指示追従とツール連携を強調) |
| ChatGPT と同じ最新挙動を試す(本番非推奨) | `chat-latest`(本番は `gpt-5.5` を推奨、と明記) |

### GPT-5.5 利用ガイドの要点(latest-model、公式明記)

- 得意領域: コーディングワークフロー、ツールを多用するエージェント、グラウンデッドなアシスタント、長文脈検索、仕様→計画策定、顧客向けアプリ
- effort 指針: 既定 medium から開始。`none` はレイテンシ最優先(軽量音声・高速検索・分類)に限定。`high`/`xhigh` は「評価で品質向上が実証できた場合のみ」。**effort を上げるほど良いわけではなく、過剰思考(overthinking)の害を公式が警告**
- プロンプトは手順指定より **成果・成功基準の記述(outcome-first)** が有効。旧モデルからは「ドロップイン置換ではなく再チューニングが必要」と明記。reasoning/ツール利用には Responses API を推奨

## 5. 提供経路(OpenAI API / Azure)

### OpenAI API

- 上記モデルはすべて OpenAI API(Responses / Chat Completions ほか)で提供(公式明記)。gpt-5.5 の対応エンドポイントとして Chat Completions / Responses / Realtime / Assistants / Batch / Fine-tuning ほかが列挙されています(モデルページ)
- reasoning・ツール利用の推奨 API は **Responses API**(latest-model ガイド、公式明記)

### Azure(Microsoft Foundry / Azure OpenAI)

出典: Microsoft Learn "Foundry Models sold by Azure"(ms.date 2026-05-13、ページ更新 2026-06-05、確認日 2026-07-06、公式明記)。

- **GPT-5.5 系**: `gpt-5.5`(2026-04-24)提供。一部クォータ階層では申請が必要(Tier 5/6 は既定でクォータ付与)
- **GPT-5.4 系**: `gpt-5.4` / `gpt-5.4-pro` / `gpt-5.4-mini` / `gpt-5.4-nano` 提供(スナップショット 2026-03-05 / 03-17)
- **chat-latest**: Foundry では製品名 `gpt-chat-latest`(OpenAI 側の「GPT-5.5 Instant / chat-latest」に相当)。Preview ライフサイクル扱い
- **リアルタイム音声**: `gpt-realtime`(2025-08-28 GA)/ `gpt-realtime-mini` / `gpt-realtime-1.5`(2026-02-23)/ `gpt-realtime-2`(2026-05-07)
- **画像**: `gpt-image-1` / `gpt-image-1-mini` / `gpt-image-1.5` / `gpt-image-2`
- **動画**: `sora` / `sora-2`(Sora はプレビュー)
- Azure 版 `gpt-5.5-pro` の掲載は今回の取得範囲では **未確認**(5.4-pro は明記あり)
- リージョン別の提供状況・デプロイ種別(Global Standard 等)の詳細は同ページのピボット表参照(今回は網羅取得せず)

## 6. 料金・モデル一覧の定点観測 URL

| 目的 | URL | 備考 |
| --- | --- | --- |
| モデル一覧(概要) | https://developers.openai.com/api/docs/models | 旧 platform.openai.com/docs/models は 301 でここへ |
| 全モデルカタログ | https://developers.openai.com/api/docs/models/all | レガシー含む一覧(今回詳細未取得) |
| 個別モデル仕様 | https://developers.openai.com/api/docs/models/<model-id> | 例: `/gpt-5.5`, `/gpt-5.4-mini`, `/chat-latest` |
| API 料金 | https://developers.openai.com/api/docs/pricing | Standard / Batch 両表 |
| 公開料金ページ | https://openai.com/api/pricing/ | 2026-07-06 時点で bot アクセスは 403(ブラウザ確認用) |
| 非推奨・退役 | https://developers.openai.com/api/docs/deprecations | GA モデルは 6 か月前告知 |
| GPT-5.5 利用ガイド | https://developers.openai.com/api/docs/guides/latest-model | effort・移行指針 |
| モデル選定ガイド | https://developers.openai.com/api/docs/guides/model-selection | 精度→コスト最適化の 2 段階 |
| Codex 向けモデル | https://developers.openai.com/codex/models | コーディング用途の推奨 |
| Azure モデル一覧 | https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure | 旧 azure/ai-foundry/openai/concepts/models から誘導 |

## 未確認事項(執筆前に要フォロー)

- `gpt-5.5` 系 mini / nano の投入予定(2026-07-06 時点では 5.4-mini / 5.4-nano が最新)
- `o4-mini` の退役確定日、`gpt-4o` / `gpt-4.1` テキスト系の現況
- `gpt-realtime-mini` / `gpt-realtime-translate` / `gpt-realtime-whisper` の価格・詳細仕様
- `gpt-image-2` のトークン種別ごとの価格内訳
- GPT-5.4 系の effort 既定値が本当に `none` か(GPT-5.5 の既定 medium との差異)
- GPT-5.5 の正式リリース日(公式発表 https://openai.com/index/introducing-gpt-5-5/ が 403 で取得不能。スナップショット名 `gpt-5.5-2026-04-23` から 2026 年 4 月下旬と推測 — 公式から推測)
- Azure での `gpt-5.5-pro` 提供有無、embeddings / moderation 系の現行モデル(今回調査対象外)
