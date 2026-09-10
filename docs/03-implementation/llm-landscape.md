---
title: "主要 LLM の全体像(モデルカタログ)"
category: "implementation"
level: "basic"
status: "published"
last_updated: "2026-09-10"
tags: ["model-selection"]
---

# 主要 LLM の全体像(モデルカタログ)

## この記事の目的

主要プロバイダー(Anthropic / OpenAI / Google)とオープンウェイト系の現行モデルファミリーについて、ティア構成・特性・コスト帯・使用場面を一覧できるようになります。「どう選ぶか」の判断フレームは [モデル選定ガイド](model-selection.md) が担当し、本記事はその具体(地図)を提供します。

**本記事はこのライブラリで最も情報の鮮度リスクが高いページです。** モデルの顔ぶれ・価格は月単位で変わるため、意思決定の際は必ず本文冒頭の最終確認日と各公式ページを確認してください。

## 対象読者

- モデル選定・乗り換えの検討で、現行ラインアップの全体像を短時間で把握したいエンジニア
- 「モデル名は聞くが、各社のティア構造と使い分けの対応が頭に入っていない」人

## 前提知識

- [AI Agent とは何か](../01-concepts/what-is-an-ai-agent.md)
- [モデル選定ガイド](model-selection.md) — 判断軸と用途別の使い分け(本記事とセットで読みます)

## 本文

> **最終確認日:** 2026-09-10 — 主要 3 社の新世代と、以下に明記した公開ウェイトのライセンス差分を確認しました。価格は原則として桁感を示し、キャッシュの例外だけ具体値を併記します。全モデルの全提供経路を実行確認したものではありません。採用時には公式料金・対象配布物の LICENSE を照合してください。

### 地図の読み方: 各社に共通する構造

主要 3 社に共通する選定軸を押さえたうえで、2026-09-10 に確認した世代別の例外を見ます。

- **3 ティア構成**: 上位(最高性能)/ 中位(バランス・本番の主力)/ 軽量(速く安い)のファミリーを各社が持ちます
- **推論(thinking / reasoning)はモード統合**: 「推論専用の別モデル」は縮小し、汎用モデルの思考の深さをパラメータ(effort 等)で制御する形が標準になりました
- **1M 級コンテキストと画像入力が標準装備**(中位以上)。テキスト出力が基本で、音声・画像生成は別系統のモデルが担当します
- **課金項目を分ける**: 入力・出力・キャッシュ読取・書込・実行モードを別に見積もります。読取が入力の 1 割のモデルもありますが、Fable 5.1 は 2.5% です。長文の割増や割引の併用条件もモデルごとに異なります

差が出るのは、**モダリティの幅(動画・音声入力)/ 長コンテキストの割増の有無 / 提供経路とガバナンス / オープンウェイトかどうか**です。

### Anthropic(Claude ファミリー)

| ティア | モデル(2026-09-10 確認) | 位置づけ(公式表現の要旨) |
| --- | --- | --- |
| フロンティア | Claude Fable 5.1 | 2026-09-01 公開。要求の厳しい推論・長時間エージェント向け(常時 adaptive thinking) |
| 上位 | Claude Opus 5 | 複雑なエージェンティックコーディングとエンタープライズ業務。「迷ったらまず Opus 5」と公式が案内 |
| 中位 | Claude Sonnet 5 | 速度と知能のバランス。本番ワークロードの大半 |
| 軽量 | Claude Haiku 4.5 | ニアフロンティア知能の最速・最安モデル |

- **特性**: 中位以上は 1M トークン入力 / 128K 出力(Haiku は 200K / 64K)。画像入力対応(動画・音声入力は非対応)。**1M コンテキストに長文割増がない**のは 3 社の中で特徴的です
- **コスト帯**(2026-08 時点の桁感): 入力単価は軽量からフロンティアまで約 10 倍の幅(おおよそ \$1〜\$10 / 1M トークン)、出力はその約 5 倍
- **使用場面**: まず Opus 5 等で評価し、要求品質を満たせない難しい作業で Fable 5.1 を比較します。Fable 5.1 は入力 / 出力が \$10 / \$50、キャッシュ読取は \$0.25 / 1M トークンです。旧 Fable 5 の読取単価を引き継いで計算しません
- **補足**: 退役は 60 日以上前に通知するポリシーが明文化されています。Opus 5 の登場に伴い Opus 4.8 はレガシー(移行推奨)へ移り、Opus 4.1 は 2026-08-05 に退役済みです。Fable 5.1 は 30 日保持があり、Anthropic の明示的許可がない限りゼロデータ保持(ZDR)では利用できません。拒否応答の扱いも確認します。現行世代の一部(Opus 4.7 以降の Opus・Sonnet 5・Fable 5.1)は新トークナイザで**同じテキストが約 3 割多くトークン化される**ため、旧世代からの移行時はコスト見積りの再計算が必要です

### OpenAI(GPT ファミリー)

| ティア | モデル(2026-09-10 確認) | 位置づけ(公式表現の要旨) |
| --- | --- | --- |
| 最上位 | GPT-6 Astra(`gpt-6-astra`) | 複雑な推論・コード・コンピューター操作・調査など、難しい一連の作業向け |
| GPT-5.6 上位 | GPT-5.6 Sol(`gpt-5.6-sol`) | プロフェッショナルワーク向け。`gpt-5.6` は Sol のエイリアス |
| バランス | GPT-5.6 Terra(`gpt-5.6-terra`) | 能力とコストのバランスを取る候補 |
| 軽量 | GPT-5.6 Luna(`gpt-5.6-luna`) | コストを重視する大量処理の候補 |

- **特性**: Astra と GPT-5.6 系は約 1.05M のコンテキスト枠 / 最大 128K 出力、テキスト・画像入力に対応します。Astra の effort は low / medium / high / xhigh / max。モデルごとに許可値を確認し、GPT-5.6 の設定をそのまま移植しません
- **費用**: 軽量から最上位まで入力単価には数十倍の幅があります。Astra は 272K 入力トークン超でリクエスト全体の入力・キャッシュ単価と出力単価に割増があるため、長文・キャッシュ書き込み・実行モードの条件を含めて見積もります
- **選定**: 公式一覧は難しい作業に Astra、能力と費用のバランスに Terra、大量処理に Luna を案内しています。自社の品質基準・遅延・費用で候補を比較し、モデル名だけで一律に切り替えません
- **Codex との区別**: ChatGPT 認証の Codex では GPT-5.4 / 5.4 mini の退役日が 2026-08-31 と案内されています。この変更は API キー認証の Codex と OpenAI API の提供終了を意味しません([OpenAI Codex](../08-coding-agents/openai-codex.md))

- **API の終了予定**: 2026-09-10 の公式退役表では、GPT-5 初代・o3/o3-pro の対象スナップショットは 2026-12-11、旧音声・realtime 系の対象モデルは 2027-01-20 の終了予定です。8 月 26 日には `whisper-1`・`gpt-4o-transcribe` 系の対象モデルについて 2027-02-26 の終了予定も追加されています。名称が似たモデルを一括扱いせず、利用中の ID と表の行を照合します。

> **TODO(要確認):** 採用時に OpenAI のモデル別ページ・料金・退役日程で、対象 API モデル ID の提供状態、終了予定の変更、実行モード、長文・キャッシュの価格条件を確認する(最終確認: 2026-09)

### Google(Gemini ファミリー)

| ティア | モデル(2026-09-10 確認) | 位置づけ(公式表現の要旨) |
| --- | --- | --- |
| 上位 | Gemini 3.1 Pro(**プレビュー**) | 高度な問題解決。正確なツール使用が要るエージェント・ソフトウェアエンジニアリング |
| 主力 | Gemini 3.8 Flash(安定版) | 2026-09-02 GA。入力 1,048,576 / 出力 65,536 トークン、思考は low / medium / high(既定 medium、minimal 非対応) |
| 前世代の主力 | Gemini 3.7 Flash(安定版) | 2026-08 登場。2026-12-31 までの導入価格はこのモデルの条件で、3.8 へ流用しません |
| 準主力 | Gemini 3.6 Flash(安定版) | 3.7 の 1 世代前(2026-07-21 登場)。安定版として提供継続 |
| 軽量 | Gemini 3.5 Flash-Lite / 3.1 Flash-Lite(安定版) | 大量・低遅延処理、単純な抽出・翻訳、モデルルーティング |
| 移行期の旧世代 | Gemini 3.5 Flash、Gemini 2.5 Pro / Flash / Flash-Lite | 3.5 Flash はレガシー扱いに。2.5 系は**終了日未定**(2026-10-16 の提供終了告知は撤回)。移行先は 3.x 系 |

- **特性**: 主要モデルは共通して 1M 入力 / 64K 出力 / thinking 対応で(2026-07 確認分。3.6 / 3.7 Flash の個別仕様は未確認)、**動画・音声・PDF のネイティブ入力**が 3 社の中の最大の差別化点です。Pro 系のみ 200K トークン超で割増があります。Google Search グラウンディングの統合、Gemini API の無料枠(3.1 Pro を除く)も特徴です
- **コスト帯**(2026-08 時点の桁感): 入力単価は Flash-Lite から Pro(長文時)まで 10 倍超の幅(おおよそ \$0.25〜\$4 / 1M トークン)、出力はその約 5〜6 倍。3.7 Flash は 2026-12-31 までの導入価格で提供中です(2027-01-01 に引き上げ予定)
- **注意が 2 つ**: ①「Flash = 廉価版」は旧世代の話です。3.8 / 3.7 / 3.6 Flash は主力(中位)で、廉価枠は Flash-Lite(3.5 / 3.1)が担います ②最上位の 3.1 Pro は**プレビューのみで安定版がありません**(2026-08 時点)。本番の既定にする場合は安定版の Flash 系が基本です
- **補足**: knowledge cutoff が長く据え置かれる傾向があり(2026-07 確認分では全モデル 2025-01。3.6 / 3.7 Flash の値は未確認)、新しい知識は検索グラウンディングで補う想定とみられます

### オープンウェイト系

重みをダウンロードして自社ホストできるモデル群です。選ぶ動機(データ主権・カスタマイズ・コスト構造)と引き受ける責任は [OSS 系コーディングエージェントの議論](../08-coding-agents/open-source-coding-agents.md) と同型です。なお大型モデルの多くは MoE(Mixture of Experts: 推論のたびに一部のパラメータだけを起動する構造)です。

| ファミリー | 公開モデル例(2026-09-10 確認) | 規模 | ライセンス | コンテキスト長 |
| --- | --- | --- | --- | --- |
| Meta Llama | Llama 4(2025-04) | Maverick 総 400B(MoE) | 独自 Community License | Scout 10M / Maverick 1M |
| Alibaba Qwen | `Qwen3.8-2.4T-A95B-FP8` | 総 2.4T(MoE) | 独自 Qwen3.8-Max License | 採用する配布物の仕様を確認 |
| DeepSeek | V4(Pro / Flash) | Pro 総 1.6T(MoE) | **MIT** | 1M |
| Mistral | Medium 3.5 / Large 3 | Medium 3.5 は 128B dense、Large 3 は総 675B MoE | Medium 3.5 は Modified MIT、Large 3 は Apache-2.0 | Medium 3.5 は 256K |
| Moonshot | Kimi K3 | 公式配布物で確認 | 独自 Kimi K3 License | 公式配布物で確認 |
| Google | Gemma 4 | 対象サイズで確認 | Apache-2.0(旧 Gemma の独自規約とは別) | 対象モデルで確認 |
| OpenAI gpt-oss | gpt-oss-120b / 20b(2025-08) | 総 117B(80GB GPU 1 枚で動作) | Apache-2.0 | 131K |

押さえるべき論点は 4 つです。

1. **ライセンスは配布物ごとに読む** — Apache-2.0 / MIT にも通知などの義務があります。Qwen3.8、Kimi K3、Mistral Medium 3.5 はそれぞれ異なる独自条件があり、同じ系列の旧モデルの許諾を流用できません。Gemma 4 は Apache-2.0 で、旧 Gemma の独自規約とは分けます
2. **大型帯は MoE が標準** — セルフホストのコストは総パラメータ(メモリ)とアクティブパラメータ(速度)の両方で見ます。「総 117B だが 80GB GPU 1 枚で動く」(gpt-oss-120b)のような設計が普通になった一方、DeepSeek V4 は「軽量版」の Flash でも総 284B でマルチ GPU 前提です
3. **同じモデル ID でも API 条件は変わる** — DeepSeek V4 Pro は 2026-08-13 に GA となり、Pro / Flash の low / high / max と Responses API 対応を案内しました。8 月 16 日 16:00 UTC からは時間帯別料金も導入されています。重みの公開とホスト API の料金・提供段階を別々に追います
4. **重み公開と無条件の利用許諾を分ける** — Mistral Medium 3.5 と Kimi K3 の重みは公開済みです。ダウンロードできることだけで、商用サービスでの再提供まで許されると判断しません

独自条件の例を以下に示します。モデル提供サービス(Model as a Service、MaaS)はモデルの推論能力を外部へ提供する事業、業務支援 AI(AI Work Assistant)は AI に業務を補助・遂行させるサービスを指す言葉です。適用上の定義や対象範囲は契約ごとに異なるため、法的判断は採用する LICENSE 全文を基に行います。

| 配布物 | 個別契約・利用制限の主な条件 | 表示と例外 |
| --- | --- | --- |
| Qwen3.8-2.4T-A95B-FP8 | 本人または関連会社が MaaS / AI Work Assistant 事業を行い、合算収益が連続 12 か月で 5,000 万米ドル超の場合、商用利用前に別ライセンス | 対象製品が月間利用者 1 億超または月商 2,000 万米ドル超なら UI にモデル名表示。第三者へモデル・出力・能力を提供しない内部利用は別契約要件の例外 |
| Mistral Medium 3.5-128B | 会社・雇用主の前月の全世界連結月商が 2,000 万米ドル超なら、この Modified MIT に基づく権利を行使できません | 別商用契約または公式ホストの利用条件を検討します |
| Kimi K3 | 本人または関連会社が MaaS 事業を行い、合算収益が連続 12 か月で 2,000 万米ドル超なら商用利用前に別契約 | 対象製品が月間利用者 1 億超または月商 2,000 万米ドル超なら UI 表示。内部利用、公式製品・認定推論パートナー経由の利用は該当条項の例外 |

MaaS や AI Work Assistant の定義、集計主体、期間も異なります。Qwen の AI Work Assistant 条件を Kimi に足したり、Qwen の例外を全条項へ広げたりしません。その他の候補には Grok、Nova、GLM 系もあり、公開世代と提供経路を個別に確認します。

### 迷わないための早見表

公式のモデル位置づけを、本ライブラリの評価の開始候補として整理した表です。用途からの詳しい逆引きは [モデル選定ガイド](model-selection.md) を参照してください。新世代の差分は 2026-09-10 に確認しました。

| プロバイダー | 迷ったときの既定 | 単純・大量処理 | 最難関タスク |
| --- | --- | --- | --- |
| Anthropic | Opus 5(本番の大半は Sonnet 5) | Haiku 4.5 | Fable 5.1 |
| OpenAI | Astra / Sol で品質上限を比較 → Terra / Luna の費用と速度を評価 | `gpt-5.6-luna` | GPT-6 Astra(推論の強さも評価する) |
| Google | Gemini 3.8 Flash | Gemini 3.5 Flash-Lite | Gemini 3.1 Pro(プレビューである点に注意) |

## 実務での注意点

### アンチパターン

- **本記事(または任意の紹介記事)だけで採用を決める** — カタログはスナップショットです。→ 最終確認日を見て、公式のモデル一覧・料金・非推奨ページで現況を再確認します
- **プレビュー・実験段階のモデルを本番の既定にする** — 仕様・価格・提供自体が変わりえます(2026-08 時点では Gemini 3.1 Pro が該当)。→ 本番は安定版(GA)+ ID ピン止めを基本にします
- **旧世代の常識で名前を解釈する** — 「Flash = 廉価」「o シリーズ = 推論の本命」「Llama = 実質自由ライセンス」はいずれも 2026-08 時点では不正確です。→ 名前ではなく現行の公式ポジショニングで判断します
- **退役スケジュールを見ずに新規開発する** — 提供終了が告知済みのモデル(OpenAI o 系・gpt-5 初代〔2026-12-11 退役予定〕など)の上に新規システムを作ると、すぐ移行作業が発生します。逆に終了告知が撤回される例(Gemini 2.5 系の 2026-10-16 終了予定は撤回され終了日未定に)もあります。→ 最新の非推奨ページの確認を選定手順に含めます

### チェックリスト

- [ ] 採用候補の仕様・価格を公式ページで再確認したか(本記事の最終確認日以降の変更の有無)
- [ ] 候補のステータス(GA / プレビュー)と退役予定を確認したか
- [ ] 長コンテキスト割増・音声入力割増などの付帯価格条件を確認したか
- [ ] オープンウェイト採用時、ライセンス条項(商用条件・表示義務・命名義務)を原文で確認したか
- [ ] 提供経路(API 直 / Bedrock / Vertex / Azure)ごとの提供状況と退役日程の差を確認したか

## 関連トピック

- [モデル選定ガイド](model-selection.md) — 判断軸・用途別の使い分け(本記事とセット)
- [コスト管理](../05-operations/cost-management.md) — 料金構造(キャッシュ・バッチ)の原理
- [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) — 退役・世代交代への追従運用
- [コーディングエージェントのコスト最適化](../08-coding-agents/coding-agent-cost-optimization.md) — 「使う側」のモデル使い分け
- [Claude](claude-prompting.md) / [OpenAI(GPT 系)](openai-prompting.md) / [Gemini](gemini-prompting.md) 特化プロンプティングガイド — 各モデルへのプロンプトの書き方
- [セルフホスト推論の実務](../05-operations/self-hosted-inference.md) — オープンウェイトモデルを実際に動かす提供層
- [フロンティアセーフティの概観](../06-security/frontier-safety-overview.md) — 提供者の安全フレームワーク・システムカードの読み方(調達時の評価軸)
- [AI と地政学・輸出規制の入口マップ](../09-business/ai-geopolitics-map.md) — 供給集中・輸出管理という提供元選定の地政学リスクの確認先
- [AI 業界レイヤーマップ](../09-business/ai-industry-map.md) — モデル層の上下を含む業界全体の地図(本記事はモデル層の詳細)
- [オープンソース AI エコシステム](open-source-ai-ecosystem.md) — オープンウェイトのライセンス類型・ハブ・派生モデルの信頼(本記事のオープンウェイト節の詳解)

## 参考資料

- [Claude モデル一覧](https://platform.claude.com/docs/en/models/overview)(アクセス日: 2026-09-10)
- [Fable 5.1 の変更点](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)(アクセス日: 2026-09-10)
- [Gemini 3.8 Flash モデル仕様](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)(アクセス日: 2026-09-10)
- [Gemini 最新モデルへの移行](https://ai.google.dev/gemini-api/docs/latest-model)(アクセス日: 2026-09-10)
- [Gemini API リリースノート](https://ai.google.dev/gemini-api/docs/changelog)(アクセス日: 2026-09-10)
- [Qwen3.8-Max License](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B-FP8/blob/main/LICENSE)(アクセス日: 2026-09-10)
- [Mistral Medium 3.5 モデルカード](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)(アクセス日: 2026-09-10)
- [Mistral Medium 3.5 Modified MIT License](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B/blob/main/LICENSE)(アクセス日: 2026-09-10)
- [Mistral リリースノート](https://docs.mistral.ai/resources/changelogs)(アクセス日: 2026-09-10)
- [Kimi K3 モデルカード](https://huggingface.co/moonshotai/Kimi-K3)(アクセス日: 2026-09-10)
- [Kimi K3 License](https://huggingface.co/moonshotai/Kimi-K3/blob/main/LICENSE)(アクセス日: 2026-09-10)
- [DeepSeek V4 Pro GA と料金体系の告知](https://api-docs.deepseek.com/news/news260813/)(アクセス日: 2026-09-10)
- [旧世代 Gemma 利用規約](https://ai.google.dev/gemma/terms)(アクセス日: 2026-09-10)
- [Gemma 4 Apache License 2.0](https://ai.google.dev/gemma/apache_2)(アクセス日: 2026-09-10)

- [Claude モデル一覧](https://platform.claude.com/docs/en/about-claude/models/overview) / [料金](https://platform.claude.com/docs/en/about-claude/pricing) / [退役日程](https://platform.claude.com/docs/en/about-claude/model-deprecations)(アクセス日: 2026-08-18)
- [OpenAI モデル一覧](https://developers.openai.com/api/docs/models) / [GPT-6 Astra の仕様・価格条件](https://developers.openai.com/api/docs/models/gpt-6-astra) / [API 退役日程](https://developers.openai.com/api/docs/deprecations)(アクセス日: 2026-09-10)
- [OpenAI 料金](https://developers.openai.com/api/docs/pricing) — 採用時に実行モードを含めて確認する入口(アクセス日: 2026-08-18)
- [Gemini モデル一覧](https://ai.google.dev/gemini-api/docs/models) / [料金](https://ai.google.dev/gemini-api/docs/pricing) / [提供終了](https://ai.google.dev/gemini-api/docs/deprecations)(アクセス日: 2026-08-18)
- オープンウェイト系: [Meta Llama(Hugging Face)](https://huggingface.co/meta-llama) / [Qwen(GitHub)](https://github.com/QwenLM) / [DeepSeek(Hugging Face)](https://huggingface.co/deepseek-ai) / [Mistral モデル一覧](https://docs.mistral.ai/models/overview) / [gpt-oss(GitHub)](https://github.com/openai/gpt-oss)(アクセス日: Meta / Qwen / DeepSeek は 2026-08-18、Mistral / gpt-oss は 2026-07-06)

## TODO・未確認事項

- 表で未確認とした配布物のコンテキスト長と Llama 4 の各クラウドでの提供形態は、採用時の確認事項です。Qwen3.8・Kimi K3・Medium 3.5 の LICENSE は 2026-09-10 に確認済みです。

### 変わりやすい項目(定点観測)

> **TODO(要確認):** 全カタログ表のモデル名・ティア・価格・提供状態を各社公式ページで再確認する。Gemini 3.7 Flash の導入価格終了、Fable 5.1 の保持条件、時間帯別・長文・キャッシュ課金の変更を追跡する(最終確認: 2026-09)

> **TODO(要確認):** Gemini 3.1 Pro の GA 化、表で未確認とした公開ウェイトのコンテキスト長、独自ライセンスの改版を各モデルの公式仕様・LICENSE で確認する。全サイズ・全提供経路の互換性は未検証です(最終確認: 2026-09)
