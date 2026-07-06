# Google Gemini モデルファミリー調査メモ(M-R3)

- **対象**: Google の Gemini モデルファミリー(2026-07 時点の現行世代)
- **調査日**: 2026-07-06
- **用途**: 「主要 LLM の全体像(モデルカタログ)」「モデル選定ガイド」執筆の一次資料
- **根拠の方針**: Google 公式ドキュメント(ai.google.dev / cloud.google.com / docs.cloud.google.com)のみを根拠とします。第三者記事・ベンチマークまとめサイトは使用していません
- **確度表記**: 「公式明記」= 公式ページに明文あり / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず
- **価格の転記方針**: 本メモには具体値を記録します。docs 本文には桁感のみ転記します(価格は変動が速いため)

主な出典(いずれも確認日 2026-07-06):

- モデル一覧: https://ai.google.dev/gemini-api/docs/models (各モデル詳細は `/gemini-api/docs/models/<モデルID>` 配下)
- 料金(Gemini API): https://ai.google.dev/gemini-api/docs/pricing
- 非推奨・提供終了: https://ai.google.dev/gemini-api/docs/deprecations
- レート制限・ティア: https://ai.google.dev/gemini-api/docs/rate-limits
- Vertex AI モデル一覧: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models
- Vertex AI 料金: https://cloud.google.com/vertex-ai/generative-ai/pricing

## 1. 現行モデルファミリーの構成

### テキスト生成の主力モデル(Gemini API モデル一覧ページ、公式明記)

| ティア | モデル | API モデル ID | ステータス | 公式の一言説明(要旨) |
| --- | --- | --- | --- | --- |
| フロンティア(Flash 系最上位) | Gemini 3.5 Flash | `gemini-3.5-flash` | 安定版(Stable) | 「最も知的なモデル。実タスク向けにフロンティア級知能を高速・低コストで」 |
| 上位(Pro) | Gemini 3.1 Pro | `gemini-3.1-pro-preview` | **プレビュー** | 「高度な知能、複雑な問題解決、強力なエージェント能力」 |
| 中位(旧 Flash) | Gemini 3 Flash | `gemini-3-flash-preview` | プレビュー | 「マルチモーダル理解で世界最高のモデル」(モデルページ原文) |
| 軽量 | Gemini 3.1 Flash-Lite | `gemini-3.1-flash-lite` | 安定版 | 「フロンティアクラスの性能を軽量に。低遅延・低コスト」 |
| 旧世代(移行推奨) | Gemini 2.5 Pro / Flash / Flash-Lite | `gemini-2.5-pro` / `gemini-2.5-flash` / `gemini-2.5-flash-lite` | GA(2026-10-16 以降に提供終了予定) | 2.5 Flash は「低レイテンシ・高ボリューム向けの最良コスト性能比」 |

- **ティア構造の注意**: 2026-07 時点でバージョン番号がティア間で非対称です。Flash 系の最新安定版は 3.5、Pro と Flash-Lite の最新は 3.1(Pro はプレビューのみ)。テキスト生成モデルとしての「Gemini 3.1 Flash」はモデル一覧に存在しません(3.1 Flash の名を持つのは Image / Live / TTS 系のみ)。(出典: モデル一覧、**公式から推測**(一覧への不記載に基づく))
- Pro ティアの安定版(GA)が存在せず、最上位テキストモデルがプレビュー提供という状態です(出典: モデル一覧、公式明記)

### 周辺モデル(名前と ID のみ)

- **画像生成(Nano Banana ファミリー)**: Nano Banana Pro(`gemini-3-pro-image`)/ Nano Banana 2 / Nano Banana Lite / Nano Banana(Gemini 2.5 ベース、`gemini-2.5-flash-image`)。一覧にある画像系 ID: `gemini-3.1-flash-image`、`gemini-3.1-flash-lite-image`、`gemini-3-pro-image`、`gemini-2.5-flash-image`(名前と ID の対応は Pro と 2.5 以外は**公式から推測**)
- **動画生成**: Veo 3.1(`veo-3.1-generate-preview`)/ Veo 3.1 Lite(いずれもプレビュー)
- **音声・リアルタイム**: Gemini 3.1 Flash Live(`gemini-3.1-flash-live-preview`)/ Gemini 3.1 Flash TTS(`gemini-3.1-flash-tts-preview`)/ Gemini 3.5 Live Translate(`gemini-3.5-live-translate-preview`)/ Gemini 2.5 Flash Live・TTS 系(`gemini-2.5-flash-native-audio-preview-12-2025` ほか)
- **音楽生成**: Lyria 3 Pro / Lyria 3 Clip(プレビュー)、Lyria RealTime(実験版)
- **埋め込み**: Gemini Embedding 2(`gemini-embedding-2`)、Gemini Embedding 001(`gemini-embedding-001`)
- **エージェント・特殊用途**: Computer Use(`gemini-2.5-computer-use-preview-10-2025`)、Deep Research / Deep Research Max(`deep-research-preview-04-2026` / `deep-research-max-preview-04-2026`)、Antigravity Agent(`antigravity-preview-05-2026`)、Gemini Robotics-ER 1.6(`gemini-robotics-er-1.6-preview`)
- **Gemini Omni Flash**(`gemini-omni-flash`): モデル一覧に記載あり。カテゴリ分類(動画生成系か汎用マルチモーダルか)は今回の取得内容からは判別できず(**未確認**)

### 非推奨・提供終了の日程(deprecations ページ、公式明記)

「表の提供終了日はモデルが廃止されうる最も早い日付であり、事前通知の上で確定する」と明記されています。

| モデル ID | 提供終了日(最短) | 推奨移行先 | 備考 |
| --- | --- | --- | --- |
| `gemini-3-pro-preview` | 2026-03-09 | `gemini-3.1-pro-preview` | 調査日時点で終了日経過(終了済みと推測) |
| `gemini-3.1-flash-lite-preview` | 2026-05-25 | `gemini-3.1-flash-lite` | 同上 |
| `gemini-2.0-flash` | 2026-06-01 | `gemini-3.5-flash` | 同上 |
| `gemini-2.0-flash-lite` | 2026-06-01 | `gemini-3.1-flash-lite` | 同上 |
| `gemini-2.5-pro` | **2026-10-16** | `gemini-3.1-pro-preview` | 現在は GA 提供中 |
| `gemini-2.5-flash` | **2026-10-16** | `gemini-3.5-flash` | 同上 |
| `gemini-2.5-flash-lite` | **2026-10-16** | `gemini-3.1-flash-lite` | 同上 |
| `text-embedding-004` | 2026-01-14 | `gemini-embedding-2` | |
| `imagen-3.0-generate-002` | 2025-11-10 | Imagen 4 系 | Imagen 4 自体も 2026-08-17 廃止予定(料金ページに明記) |
| `veo-2.0-generate-001` / `veo-3.0-generate-001` | 2026-06-30 | `veo-3.1-generate-preview` | |

- Gemini 1.5 系は非推奨ページの表に記載なし(すでに退役済みと**公式から推測**)
- **執筆上の含意**: 2.5 系 3 モデルが 2026-10-16 に一斉終了しうるため、モデルカタログでは 2.5 系を「移行期の旧世代」として扱うのが安全です

## 2. 各モデルの仕様

出典: 各モデルの詳細ページ(`https://ai.google.dev/gemini-api/docs/models/<モデルID>`、確認日 2026-07-06、特記なき限り公式明記)。

| 項目 | Gemini 3.5 Flash | Gemini 3.1 Pro | Gemini 3 Flash | Gemini 3.1 Flash-Lite | Gemini 2.5 Flash | Gemini 2.5 Pro |
| --- | --- | --- | --- | --- | --- | --- |
| API モデル ID | `gemini-3.5-flash` | `gemini-3.1-pro-preview` | `gemini-3-flash-preview` | `gemini-3.1-flash-lite` | `gemini-2.5-flash` | `gemini-2.5-pro` |
| コンテキストウィンドウ(入力) | 1,048,576 | 1,048,576 | 1,048,576 | 1,048,576 | 1,048,576 | 1,048,576 |
| 最大出力トークン | 65,536 | 65,536 | 65,536 | 65,536 | 65,536 | 65,536 |
| 入力モダリティ | テキスト・画像・動画・音声・PDF | 同左 | 同左 | 同左 | テキスト・画像・動画・音声(PDF の明記は未確認) | テキスト・画像・動画・音声・PDF |
| 出力モダリティ | テキストのみ | テキストのみ | テキストのみ | テキストのみ | テキストのみ | テキストのみ |
| thinking(思考)対応 | 対応 | 対応 | 対応 | 対応(高レベル思考設定あり) | 対応 | 対応 |
| knowledge cutoff | 2025-01 | 2025-01 | 2025-01 | 2025-01 | 2025-01 | 2025-01 |
| 最終更新(モデルページ表記) | 2026-05 | 2026-02 | 2025-12 | (未取得) | — | — |
| ステータス | 安定版 | プレビュー | プレビュー | 安定版 | GA(終了予定 2026-10-16) | GA(終了予定 2026-10-16) |

- **共通の特徴**: 現行の主要テキストモデルはすべて約 1M トークン入力・64K トークン出力・thinking 対応・「テキスト+画像+動画+音声+PDF」入力。動画・音声をネイティブ入力できる点が他社比の特徴です(出典: 各モデルページ、公式明記)
- **対応機能**(3.5 Flash の例): function calling、コンテキストキャッシュ、Batch API、コード実行、File Search、構造化出力、Search / Maps グラウンディング、URL コンテキスト、computer use(プレビュー)。非対応: 音声生成・画像生成・Live API(専用モデルに分離)(公式明記)
- 3.1 Flash-Lite は computer use 非対応(公式明記)
- knowledge cutoff が全モデル 2025-01 で据え置かれている点は執筆時に注記する価値があります(グラウンディング機能で補う設計と**公式から推測**)
- 2.5 Pro のモデルページに「Interactions API が GA となり、推奨される主流 API」との記載あり(従来の generateContent 系との関係は**未確認**)

## 3. 価格(Gemini API、USD / 1M トークン、有料ティア)

出典: https://ai.google.dev/gemini-api/docs/pricing (確認日 2026-07-06、公式明記)。キャッシュ保存料は全モデル共通で **$1.00 / 1M トークン / 時間**。

| モデル | 入力 | 出力 | キャッシュ読み取り | Batch(50% 割引) | 無料枠 |
| --- | --- | --- | --- | --- | --- |
| Gemini 3.5 Flash | $1.50 | $9.00 | $0.15 | 入 $0.75 / 出 $4.50 | あり |
| Gemini 3.1 Pro Preview | $2.00(≤200K)/ $4.00(>200K) | $12.00(≤200K)/ $18.00(>200K) | $0.20 / $0.40(Vertex 料金表の値) | 入 $1.00–2.00 / 出 $6.00–9.00 | **なし** |
| Gemini 3 Flash Preview | $0.50(テキスト等)/ $1.00(音声) | $3.00 | (未取得) | 50% 適用 | (未確認) |
| Gemini 3.1 Flash-Lite | $0.25(テキスト・画像・動画)/ $0.50(音声) | $1.50 | $0.025 / $0.05(音声)(Vertex 料金表の値) | 入 $0.125 / 出 $0.75 | あり |
| Gemini 2.5 Flash | $0.30(テキスト等)/ $1.00(音声) | $2.50 | $0.03 / $0.10(音声) | 入 $0.15 / 出 $1.25 | あり |
| Gemini 2.5 Flash-Lite | $0.10(テキスト等)/ $0.30(音声) | $0.40 | $0.01 / $0.03(音声)(Vertex 料金表の値) | 入 $0.05 / 出 $0.20 | あり |
| Gemini 2.5 Pro | $1.25(≤200K)/ $2.50(>200K) | $10.00(≤200K)/ $15.00(>200K) | $0.125 / $0.25 | 入 $0.625–1.25 | あり |

### 価格構造の要点

- **長コンテキスト割増**: Pro 系のみ、プロンプト 200K トークン超で入力が 2 倍・出力も割増(3.1 Pro: 出力 $12→$18、2.5 Pro: $10→$15)。Flash / Flash-Lite 系は単一価格(公式明記)
- **音声入力の割増**: Flash / Flash-Lite 系はテキスト・画像・動画入力と音声入力で単価が別建て(音声が約 2〜3 倍)(公式明記)
- **Batch API**: 全対象モデルで標準価格の 50%(公式明記)
- **Priority(優先処理)**: 標準価格の 1.8 倍(Gemini API 料金ページと Vertex 料金表の双方に記載、公式明記)。**Flex 推論の価格は情報が割れており未確認**(Vertex 料金表では Flex/Batch 同列で 50% 割引、Gemini API 料金ページの取得結果では「標準と同額」との要約。要再確認)
- **世代間の価格傾向**: 3.5 Flash($1.50/$9.00)は 2.5 Flash($0.30/$2.50)の約 4〜5 倍で、「Flash = 廉価」という旧来の位置づけから「Flash = 主力」へ移行。廉価枠は Flash-Lite が担う構図です(価格表からの**公式から推測**)
- **グラウンディング(Google Search / Maps)**: Gemini 3 系は月 5,000 プロンプト無料、以降 $14 / 1,000 クエリ。Gemini 2.5 系は 1,500 RPD 無料、以降 $35 / 1,000(公式明記)
- **周辺モデルの価格(参考)**: Nano Banana Pro(`gemini-3-pro-image`)出力 $0.134 / 枚(1K・2K)、$0.24(4K)。Nano Banana(2.5 Flash Image)$0.039 / 枚。Veo 3.1 $0.10〜0.60 / 秒。Gemini Embedding 2 テキスト $0.20。Imagen 4 $0.02〜0.06 / 枚(2026-08-17 廃止予定)(公式明記)

## 4. 公式の推奨用途(モデルの位置づけ)

出典: 各モデル詳細ページとモデル一覧の説明文(確認日 2026-07-06、公式明記。引用は原文)。

- **Gemini 3.5 Flash**: "frontier-level intelligence optimized for real-world tasks at higher speed and lower cost"。エージェント時代向け設計で、**サブエージェントの展開やマルチステップワークフロー**に有効と明記。迷ったらまずこれ、に相当する主力
- **Gemini 3.1 Pro(Preview)**: "better thinking, improved token efficiency"。**ソフトウェアエンジニアリング**と "agentic workflows requiring precise tool usage and reliable multi-step execution"(正確なツール使用・確実な多段実行が必要なエージェント)向け
- **Gemini 3 Flash(Preview)**: "the best model in the world for multimodal understanding"。マルチモーダル理解・エージェント処理・コード生成
- **Gemini 3.1 Flash-Lite**: 低遅延・低コストのマルチモーダル。**高頻度・軽量タスク、単純なデータ抽出、翻訳、文字起こし、軽量エージェント、ドキュメント処理、モデルルーティング**
- **Gemini 2.5 Flash**: 「低レイテンシ・高ボリュームタスク向けの最良コスト性能比」(移行期の旧主力)
- **Gemini 2.5 Pro**: "state-of-the-art thinking model" として、コード・数学・STEM の複雑推論、長コンテキストでの大規模データ・コードベース・文書分析(移行先は 3.1 Pro)

**モデル選定ガイドへの示唆(公式から推測)**: Google の公式ラインアップは「Pro = 最高知能(ただしプレビュー)/ Flash = 主力バランス / Flash-Lite = 大量・低遅延」の 3 ティア。Anthropic・OpenAI との比較では「1M コンテキスト」「動画・音声のネイティブ入力」「グラウンディング統合」が差別化軸です。

## 5. 提供経路(Gemini API / Vertex AI)と無料枠

- **Gemini API(ai.google.dev / Google AI Studio)**: 上記全モデルを提供。無料枠(Free tier)あり(出典: 料金ページ、公式明記)
  - ティア構造: Free → Tier 1(課金アカウント設定)→ Tier 2 / 3(累積支出条件)。支出ベースのレート制限あり(Tier 1: $10 / 10 分、Tier 2・3: $200 / 10 分)(出典: rate-limits、公式明記)
  - 無料枠対象(料金ページで "Free of charge" 表記): 3.5 Flash、3.1 Flash-Lite、2.5 Pro / Flash / Flash-Lite。**3.1 Pro Preview は無料枠なし**(公式明記)
  - モデル別の具体的な RPM / TPM / RPD 値はドキュメントに掲載されず、Google AI Studio 内(https://aistudio.google.com/rate-limit)で確認する方式(公式明記)
- **Vertex AI(Google Cloud)**: 3.1 Pro、3.5 Flash、3 Flash、3.1 Flash-Lite、2.5 系、画像・動画・埋め込み系を提供し、主要モデルは Gemini API とほぼ同一のラインアップ(出典: Vertex モデル一覧、公式明記)
  - 標準価格は Gemini API と一致(3.5 Flash・3.1 Pro・2.5 系で突合済み)(両料金ページ、公式明記)
  - **非グローバルエンドポイント(リージョン指定)は 2026-07-01 からグローバル価格の +10%**(出典: Vertex 料金ページ、公式明記)
  - Vertex 側の無料枠の記載は確認できず(**未確認**。無料枠は Gemini API 側の提供と**公式から推測**)
  - 注意: Vertex AI の生成 AI ドキュメント・料金ページは「Agent Platform」表記への移行が進んでおり、URL も docs.cloud.google.com へリダイレクトされています(ブランド改称の詳細は**未確認**)

## 6. 料金・モデル一覧の定点観測 URL

| 目的 | URL | 備考 |
| --- | --- | --- |
| モデル一覧(Gemini API) | https://ai.google.dev/gemini-api/docs/models | 各モデル詳細は `/models/<モデルID>` |
| 料金(Gemini API) | https://ai.google.dev/gemini-api/docs/pricing | 無料枠の有無もここに記載 |
| 非推奨・提供終了 | https://ai.google.dev/gemini-api/docs/deprecations | 終了日は「最短日付」方式 |
| レート制限・ティア | https://ai.google.dev/gemini-api/docs/rate-limits | 具体値は AI Studio 内 https://aistudio.google.com/rate-limit |
| Vertex AI モデル一覧 | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models | cloud.google.com からリダイレクト |
| Vertex AI 料金 | https://cloud.google.com/vertex-ai/generative-ai/pricing | エンドポイント別(グローバル / リージョン)価格 |
| 更新履歴 | https://ai.google.dev/gemini-api/docs/changelog | 今回未取得(**未確認**) |

## 未確認事項・執筆時の注意

- Flex 推論の割引率(標準同額か 50% か)— 両料金ページの取得結果が食い違うため要再確認
- Gemini 3 Flash Preview の無料枠有無・キャッシュ価格
- Gemini 2.5 Flash の PDF 入力対応の明記(他モデルは明記あり)
- Nano Banana 2 / Lite と API モデル ID(`gemini-3.1-flash-image` 等)の正式な対応関係
- Gemini Omni Flash の位置づけ(カテゴリ・用途)
- Vertex AI 料金表で 3.1 Pro の出力に 200K 超の split が表示されなかった点(Gemini API 側は $12/$18 と明記。Vertex 側の表示は取得漏れの可能性)
- 「Agent Platform」への改称の正式アナウンス
- Gemini 1.5 系の退役完了日
- 本メモの事実はすべて 2026-07-06 に上記公式ページから取得したものであり、プレビューモデル(特に 3.1 Pro)は仕様・価格が変わりやすい点に注意
