# Anthropic Claude モデルファミリー調査メモ(M-R1)

- **対象**: Anthropic の Claude モデルファミリー(2026-07 時点の現行世代)
- **調査日**: 2026-07-06
- **用途**: 「主要 LLM の全体像(モデルカタログ)」「モデル選定ガイド」執筆の一次資料
- **根拠の方針**: Anthropic 公式ドキュメント(platform.claude.com / claude.com)のみを根拠とします。第三者記事・ベンチマークまとめサイトは使用していません
- **確度表記**: 「公式明記」= 公式ページに明文あり / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 今回確認できず

主な出典(いずれも確認日 2026-07-06):

- モデル概要: https://platform.claude.com/docs/en/about-claude/models/overview
- 料金: https://platform.claude.com/docs/en/about-claude/pricing
- 非推奨・退役: https://platform.claude.com/docs/en/about-claude/model-deprecations
- Fable 5 / Mythos 5 紹介: https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5

## 1. 現行モデルファミリーの構成とティア構造

### 現行(Active)モデル

公式のモデル概要ページは現行世代として次の 4 + 1 モデルを提示しています(公式明記)。

| ティア | モデル | 公式の一言説明(原文) | 位置づけ |
| --- | --- | --- | --- |
| フロンティア(最上位) | Claude Fable 5 | "Next-generation intelligence for long-running agents" / "Anthropic's most capable widely released model" | 最も要求の厳しい推論・長時間エージェント向け。2026-06-09 に GA |
| フロンティア(限定提供) | Claude Mythos 5 | Fable 5 と同一の能力・スペック・価格。安全分類器(safety classifiers)を持たない | Project Glasswing(防御的サイバーセキュリティ用途)承認顧客のみ。招待制で GA ではない |
| 上位 | Claude Opus 4.8 | "For complex agentic coding and enterprise work" | 迷ったらまずこれ、と公式が案内(後述) |
| 中位 | Claude Sonnet 5 | "The best combination of speed and intelligence" | 速度と知能のバランス |
| 軽量 | Claude Haiku 4.5 | "The fastest model with near-frontier intelligence" | 最速・最低価格 |

- 相対レイテンシの公式表記: Fable 5 = Slower / Opus 4.8 = Moderate / Sonnet 5 = Fast / Haiku 4.5 = Fastest(出典: モデル概要、公式明記)
- Claude Mythos 5 は招待制の Claude Mythos Preview(`claude-mythos-preview`)の後継。Mythos Preview は 2026-06-30 退役と告知(出典: model-deprecations、公式明記)

### レガシー(提供中だが移行推奨)

モデル概要ページの "Legacy models" 表に掲載(公式明記): Claude Opus 4.7 / Opus 4.6 / Sonnet 4.6 / Sonnet 4.5 / Opus 4.5 / Opus 4.1(非推奨)。

### 非推奨・退役の日程(Anthropic 運営プラットフォーム基準)

ライフサイクル用語は Active → Legacy → Deprecated(退役日確定・移行先提示)→ Retired(利用不可)。退役の 60 日以上前に通知、と公式が明記しています(出典: model-deprecations)。

| モデル ID | 状態 | 退役日(確定 / 最短見込み) | 推奨移行先 |
| --- | --- | --- | --- |
| `claude-opus-4-1-20250805` | Deprecated(2026-06-05 告知) | **2026-08-05 退役** | `claude-opus-4-8` |
| `claude-mythos-preview` | 退役告知 | **2026-06-30 退役** | `claude-mythos-5` |
| `claude-opus-4-8` | Active | 2027-05-28 より前には退役しない | — |
| `claude-opus-4-7` | Active | 2027-04-16 より前には退役しない | — |
| `claude-opus-4-6` | Active | 2027-02-05 より前には退役しない | — |
| `claude-sonnet-4-6` | Active | 2027-02-17 より前には退役しない | — |
| `claude-sonnet-4-5-20250929` | Active | 2026-09-29 より前には退役しない | — |
| `claude-opus-4-5-20251101` | Active | 2026-11-24 より前には退役しない | — |
| `claude-haiku-4-5-20251001` | Active | 2026-10-15 より前には退役しない | — |

退役済み(主なもの): Claude Opus 4 / Sonnet 4(2026-06-15)、Haiku 3(2026-04-20)、Sonnet 3.7 / Haiku 3.5(2026-02-19)、Opus 3(2026-01-05)、Sonnet 3.5 系(2025-10-28)。いずれも公式明記。

- 付随する非推奨: Opus 4.7 の Fast mode は非推奨で **2026-07-24 に削除**(出典: pricing、公式明記)。API パラメータ `temperature` / `top_p` / `top_k` は Opus 4.7 以降(Opus 4.8・Sonnet 5 含む)で非デフォルト値を指定すると 400(出典: model-deprecations、公式明記)
- 注意: 上記日程は Anthropic 運営プラットフォーム(Claude API / Claude Platform on AWS / Microsoft Foundry)に適用。Amazon Bedrock と Google Cloud は独自の退役スケジュールを持つ(公式明記)

## 2. 各モデルの仕様

出典: モデル概要ページの比較表(確認日 2026-07-06、特記なき限り公式明記)。

### 現行モデル

| 項目 | Claude Fable 5 | Claude Opus 4.8 | Claude Sonnet 5 | Claude Haiku 4.5 |
| --- | --- | --- | --- | --- |
| Claude API ID(= エイリアス) | `claude-fable-5` | `claude-opus-4-8` | `claude-sonnet-5` | `claude-haiku-4-5`(正式 ID: `claude-haiku-4-5-20251001`) |
| コンテキストウィンドウ | 1M トークン | 1M トークン | 1M トークン | 200K トークン |
| 最大出力 | 128K トークン | 128K トークン | 128K トークン | 64K トークン |
| モダリティ | テキスト+画像入力 / テキスト出力 | 同左 | 同左 | 同左 |
| 拡張思考(extended thinking, budget_tokens 方式) | 非対応 | 非対応 | 非対応 | 対応 |
| 適応思考(adaptive thinking) | 対応(**常時オン**、無効化不可) | 対応 | 対応 | 非対応 |
| Reliable knowledge cutoff | 2026-01 | 2026-01 | 2026-01 | 2025-02 |
| Training data cutoff | 2026-01 | 2026-01 | 2026-01 | 2025-07 |

- Claude Mythos 5(`claude-mythos-5`)は Fable 5 と同一スペック・同一価格(公式明記)
- 「全現行モデルはテキスト・画像入力、テキスト出力、多言語、vision に対応」(モデル概要の冒頭、公式明記)。音声・動画入力の記載はなし → 非対応(公式から推測)
- 4.6 世代以降のモデル ID は日付なし形式だが、これも「固定スナップショット」であり evergreen ポインタではない(公式明記)
- Batch API では `output-300k-2026-03-24` ベータヘッダーで Opus 4.8/4.7/4.6・Sonnet 5/4.6 が最大 300K 出力に対応(公式明記)
- 新トークナイザ: Opus 4.7 以降の Opus、Fable 5 / Mythos 5 / Mythos Preview、Sonnet 5 は新トークナイザを使用し、同じテキストで約 30% 多くトークン化される(公式明記)。トークン数見積り・コスト比較時に要注意
- `effort` パラメータは Opus 4.8 で全サーフェスのデフォルトが `high`。Sonnet 5 も Claude API / Claude Code で `high` がデフォルト(公式明記)

### レガシーモデル(提供中)

| 項目 | Opus 4.7 | Opus 4.6 | Sonnet 4.6 | Sonnet 4.5 | Opus 4.5 | Opus 4.1(非推奨) |
| --- | --- | --- | --- | --- | --- | --- |
| Claude API ID | `claude-opus-4-7` | `claude-opus-4-6` | `claude-sonnet-4-6` | `claude-sonnet-4-5-20250929` | `claude-opus-4-5-20251101` | `claude-opus-4-1-20250805` |
| コンテキスト | 1M | 1M | 1M | 200K | 200K | 200K |
| 最大出力 | 128K | 128K | 128K | 64K | 64K | 32K |
| 拡張思考 | 非対応 | 対応 | 対応 | 対応 | 対応 | 対応 |
| 適応思考 | 対応 | 対応 | 対応 | 非対応 | 非対応 | 非対応 |
| Reliable cutoff | 2026-01 | 2025-05 | 2025-08 | 2025-01 | 2025-05 | 2025-01 |
| Training cutoff | 2026-01 | 2025-08 | 2026-01 | 2025-07 | 2025-08 | 2025-03 |

### Fable 5 / Mythos 5 固有の API 挙動(選定ガイドで触れるべき点)

出典: Introducing Claude Fable 5 and Claude Mythos 5(公式明記)。

- 適応思考のみ(`thinking` 未指定で自動適用。`{"type": "disabled"}` は不可)。思考の深さは `effort` で制御
- 生の思考過程(raw chain of thought)は返却されない。`thinking.display: "summarized"` で要約、既定の `"omitted"` では空文字列
- Fable 5 は安全分類器を持ち、拒否時は HTTP 200 + `stop_reason: "refusal"` を返す。出力前拒否は課金なし。サーバー側 `fallbacks`(ベータ)/ SDK ミドルウェア / fallback credit の 3 通りのリトライ手段が公式提供
- Fable 5 / Mythos 5 は **30 日データ保持が必須**(ゼロデータ保持=ZDR では利用不可)

## 3. 価格(1M トークンあたり、USD)

出典: https://platform.claude.com/docs/en/about-claude/pricing (確認日 2026-07-06、すべて公式明記)。
docs 本文には桁感のみ転記する方針。具体値は本メモを正とします。

### モデル別価格表

| モデル | 入力 | 5 分キャッシュ書込 | 1 時間キャッシュ書込 | キャッシュ読取 | 出力 | Batch 入力 | Batch 出力 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Fable 5 / Mythos 5 | $10 | $12.50 | $20 | $1 | $50 | $5 | $25 |
| Claude Opus 4.8 / 4.7 / 4.6 / 4.5 | $5 | $6.25 | $10 | $0.50 | $25 | $2.50 | $12.50 |
| Claude Opus 4.1(非推奨) | $15 | $18.75 | $30 | $1.50 | $75 | $7.50 | $37.50 |
| Claude Sonnet 5(〜2026-08-31、導入価格) | $2 | $2.50 | $4 | $0.20 | $10 | $1 | $5 |
| Claude Sonnet 5(2026-09-01〜、標準価格) | $3 | $3.75 | $6 | $0.30 | $15 | $1.50 | $7.50 |
| Claude Sonnet 4.6 / 4.5 | $3 | $3.75 | $6 | $0.30 | $15 | $1.50 | $7.50 |
| Claude Haiku 4.5 | $1 | $1.25 | $2 | $0.10 | $5 | $0.50 | $2.50 |

### 倍率・付帯ルール

- キャッシュ倍率: 5 分書込 = 基本入力の 1.25 倍 / 1 時間書込 = 2 倍 / 読取 = 0.1 倍(公式明記)
- Batch API: 入出力とも 50% 割引。キャッシュ倍率と併用可(公式明記)
- 1M コンテキストは追加課金なし(long-context premium なし)。「900K トークンのリクエストも 9K と同じ単価」(公式明記)
- データレジデンシ: `inference_geo: "us"` 指定で全カテゴリ 1.1 倍(Opus 4.6 / Sonnet 4.6 以降のみ対応)(公式明記)
- Fast mode(研究プレビュー、プレミアム価格): Opus 4.8 = $10 入力 / $50 出力。Opus 4.7 = $30 / $150 で **2026-07-24 に削除予定**(公式明記)
- 主なツール課金: Web 検索 $10 / 1,000 検索。Web フェッチは追加課金なし。コード実行は月 1,550 時間無料、超過 $0.05/時間・コンテナ(web search / web fetch 併用時は無料)(公式明記)
- Managed Agents はトークン課金 + セッション実行時間 $0.08/時間(running 状態のみ計測)(公式明記)
- Claude Platform on AWS / Microsoft Foundry は CCU(Claude Consumption Unit、$0.01/CCU)建てで請求。レートは Claude API と同一(公式明記)

## 4. 公式の推奨用途・位置づけ

出典: モデル概要と pricing ページ(公式明記)。

- **選定の出発点**(モデル概要 "Choosing a model" の原文趣旨): 「どれを使うか迷う場合、複雑なエージェンティックコーディングとエンタープライズ業務にはまず **Claude Opus 4.8** から。利用可能な最高の能力が必要なワークロードには **Claude Fable 5**」
- **Claude Fable 5**: 「Anthropic の最も高性能な一般提供モデル。最も要求の厳しい推論と長時間(long-horizon)エージェント処理向け」。長時間実行エージェント向けの次世代知能
- **Claude Mythos 5**: Fable 5 と同一能力で安全分類器なし。「防御的サイバーセキュリティワークフロー向けに Project Glasswing の一部として別枠提供。招待制でセルフサーブ申込不可」
- **Claude Opus 4.8**: 「複雑なエージェンティックコーディングとエンタープライズ業務向け」
- **Claude Sonnet 5**: 「速度と知能の最良の組み合わせ」
- **Claude Haiku 4.5**: 「ニアフロンティアの知能を持つ最速モデル」
- **コスト最適化の公式指針**(pricing ページ): 「単純なタスクには Haiku、本番ワークロードの大半には Sonnet、最も複雑な推論には Opus を選ぶ」
- ティアをまたぐ一般則として、公式は「エンゲージングで人間らしい応答」「推論・コーディング・多言語・長文コンテキスト・画像処理での高い性能」を Claude 4 系全体の特徴として記載

## 5. 提供経路(プラットフォーム対応)

出典: モデル概要・Fable 5 紹介・pricing(確認日 2026-07-06)。

| 経路 | 運営 | 対応状況 | モデル ID 形式 |
| --- | --- | --- | --- |
| Claude API(第一者) | Anthropic | 全モデル(公式明記) | `claude-opus-4-8` など |
| Claude Platform on AWS | Anthropic(AWS Marketplace 経由・CCU 課金) | 第一者と同等。退役日程も第一者に従う(公式明記) | 第一者と同一 ID(Bedrock 形式ではない) |
| Amazon Bedrock | AWS(パートナー運営) | 現行モデル対応(公式明記)。退役日程は AWS 独自 | `anthropic.` プレフィックス。例: `anthropic.claude-opus-4-8`、`anthropic.claude-haiku-4-5-20251001-v1:0`。Fable 5 / Opus 4.8 / Sonnet 5 は Messages-API 版 Bedrock エンドポイント経由(公式明記) |
| Google Cloud(Vertex AI) | Google(パートナー運営) | 現行モデル対応(公式明記)。退役日程は Google 独自 | プレフィックスなし。日付付きモデルは `@` 区切り(例: `claude-haiku-4-5@20251001`) |
| Microsoft Foundry | Microsoft(Azure Marketplace 経由・CCU 課金) | 現行モデル対応(公式明記)。退役日程は第一者に従う | 未確認(個別 ID 一覧は今回未取得) |

- 「モデルは Claude API、Claude Platform on AWS、Amazon Bedrock、Google Cloud、Microsoft Foundry を通じて利用可能」(モデル概要冒頭、公式明記)
- Claude Fable 5 は 2026-06-09 から上記 5 経路すべてで GA(公式明記)。Claude Mythos 5 は GA ではなく、Project Glasswing 承認顧客への限定提供(Anthropic / AWS / Google Cloud のアカウントチーム経由)(公式明記)
- Bedrock は global / regional の 2 種、Google Cloud は global / multi-region / regional の 3 種のエンドポイントを提供し、regional / multi-region は global 比 10% プレミアム(Sonnet 4.5 世代以降、公式明記)
- レガシーモデル(Opus 4.7 / 4.6、Sonnet 4.6 / 4.5 など)の Bedrock / Google Cloud ID はモデル概要の Legacy 表に記載あり。レガシーモデルの Foundry 対応可否は個別記載なし → **未確認**

## 6. 料金・モデル一覧の定点観測 URL

執筆後の更新チェックに使う公式 URL(いずれも 2026-07-06 アクセス確認済み)。

| 目的 | URL | 備考 |
| --- | --- | --- |
| モデル一覧・仕様(正本) | https://platform.claude.com/docs/en/about-claude/models/overview | 現行/レガシー比較表、ID、cutoff、thinking 対応 |
| API 料金(正本) | https://platform.claude.com/docs/en/about-claude/pricing | モデル別価格、キャッシュ/Batch/ツール課金 |
| 非推奨・退役日程 | https://platform.claude.com/docs/en/about-claude/model-deprecations | 退役日、推奨移行先、パラメータ非推奨 |
| 製品料金ページ(サブスク中心) | https://claude.com/pricing | API 料金は `#api` アンカー。トップはプラン(Free/Pro/Max/Team)中心 |
| モデル情報のプログラム取得 | Models API: `GET https://api.anthropic.com/v1/models` | `max_input_tokens` / `max_tokens` / `capabilities` を返す(公式明記) |

- 補足: タスク起点で示された docs.claude.com / platform.claude.com のうち、今回実際に取得できた正本は platform.claude.com 配下でした。anthropic.com/pricing は現在 claude.com/pricing が案内先になっています(docs の pricing ページが claude.com/pricing を「最新価格の参照先」として明記)

## 未確認事項・TODO

- Microsoft Foundry でのモデル別提供リスト(特にレガシーモデル)→ **未確認**。確認先: https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry

> **TODO(要確認):** Sonnet 5 の導入価格(2026-08-31 まで $2/$10)が終了する 2026-09-01 前後に pricing ページを再確認し、docs 本文の桁感記述に影響がないか確認する(最終確認: 2026-07-06)

> **TODO(要確認):** Opus 4.1(2026-08-05 退役)と Mythos Preview(2026-06-30 退役)の退役完了を model-deprecations ページで確認し、レガシー表の記述を更新する(最終確認: 2026-07-06)
