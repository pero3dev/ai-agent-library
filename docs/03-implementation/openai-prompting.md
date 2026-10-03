---
title: "OpenAI(GPT 系)特化プロンプティングガイド"
category: "implementation"
level: "intermediate"
status: "published"
last_updated: "2026-10-03"
tags: ["prompt-design", "model-selection"]
---

# OpenAI(GPT 系)特化プロンプティングガイド

## この記事の目的

OpenAI の GPT ファミリーに対して、**公式ガイドが推奨する具体的なプロンプトの書き方**を根拠を持って選べるようになります。[汎用の基礎技法](prompt-engineering-fundamentals.md)と[上級パターン](prompt-engineering-patterns.md)がモデル中立の原理を扱うのに対し、本記事は「developer メッセージの指示階層・推論内蔵モデルへの書き分け・Structured Outputs」といった、このモデル固有の作法に踏み込みます。

> **本記事は鮮度管理型です。** モデル世代・機能名(効果や API 仕様)は変化が速いため、本文冒頭の最終確認日と各公式ページを必ず確認してください。

## 対象読者

- GPT 系を使ったアプリ・エージェントを実装し、そのモデルに合わせてプロンプト品質を上げたいエンジニア
- 推論内蔵モデル(reasoning)と軽量モデルで書き方を使い分けたい、または世代交代に追従したいエンジニア

## 前提知識

- [プロンプトエンジニアリングの基礎技法](prompt-engineering-fundamentals.md) — 汎用技法(本記事はその OpenAI 具体)
- [主要 LLM の全体像(モデルカタログ)](llm-landscape.md) — GPT ファミリーの顔ぶれ・選び方

## 本文

> **最終確認日:** 2026-10-03 — Structured Outputs の例外処理と Sol / Luna の EU 条件を確認しました。GPT-6 内の設定差・キャッシュ・設定更新・対象 ID 別の退役予定は 2026-09-28、非同期ツールは 2026-09-10 の確認です。従来の設計指針は各参考資料の確認日を参照し、未取得の現行原文は TODO に分けます。

### 概要: 汎用記事との分担

| 層 | 正本 | 本記事 |
| --- | --- | --- |
| 汎用技法(名前・使いどころ) | [基礎技法](prompt-engineering-fundamentals.md) | — |
| 中立な原理と検証(なぜ効くか) | [上級パターン](prompt-engineering-patterns.md) | — |
| **GPT 系固有の作法** | **本記事** | 指示階層・reasoning effort・Structured Outputs・世代差 |
| モデルの選び方 | [モデル選定ガイド](model-selection.md) / [モデルカタログ](llm-landscape.md) | — |
| 世代交代への追従運用 | [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) | — |

Claude・Gemini との横並び比較と移行は [モデル間の違いと移行](cross-model-prompting.md) が扱います。

### モデルファミリーの前提(プロンプトに効く差分だけ)

顔ぶれ・価格・選び方は [モデルカタログ](llm-landscape.md) が正本です。プロンプト設計に効く差分だけを押さえます(従来の設計指針は 2026-08、退役日程は 2026-09-28 確認)。

- **推論は本体に統合された**: かつての推論特化「o シリーズ」は縮小し、GPT 本体の **reasoning effort** で思考量を制御する形が標準です。2026-09-28 確認の API 退役表では o4-mini の対象 ID は 2026-10-23、o3 / o3-pro の対象 ID は 2026-12-11 終了予定です。モデル別の日程と移行先は [モデルカタログ](llm-landscape.md) と公式退役表で照合します
- **モデルは「同僚」で例える**: 公式は推論内蔵モデルを「ゴールを渡せば任せられる上級同僚」、軽量モデルを「明示的な指示で最も動く新人同僚」と説明します。書き方の粒度を変える指針です
- **一部の作法は不要になった**: 出力スキーマの強い言い回しや「ステップバイステップで考えて」は、Structured Outputs と推論内蔵化により不要・逆効果になりました(後述)

### Astra へ移行する場合

2026-09-28 確認の `gpt-6-astra` では次を確認します。他モデルの有効な設定まで一律に削除するのではなく、モデル別にリクエストを組み立てます。

| 確認点 | Astra の条件 |
| --- | --- |
| 思考量 | low / medium / high / xhigh / max。none / minimal は非対応。旧設定が none / minimal なら low から評価します |
| ツール呼出し | Responses API を使います。Chat Completions の提供と tool calling の対応は別です |
| サンプリング | temperature / top_p / top_logprobs は非対応。Chat Completions の logprobs と Responses の出力 logprobs の include も外します |
| EU データレジデンシー | Standard を使います。service_tier の fast / priority は非対応です |
| 指示への追従 | 通常の判断は任せ、追加確認が必要な条件を具体的に書きます。承認で止まり過ぎる場合は、ユーザーの依頼と SKILL.md / AGENTS.md の曖昧な規則を点検します |

委任の条件、必要な検証の範囲、完了基準も明示します。自律化の指示は、実行権限や必要な承認を省略する根拠にはしません。

同じ GPT-6 でも Sol / Luna は `none / low / medium / high / xhigh / max` に対応し、既定は `medium` です。Chat Completions の関数呼出し(function calling)は `none` の場合に限られるため、推論を有効にしたツール処理には Responses API を使います。Astra の `none` 非対応と区別して実装します。

Sol / Luna の EU データレジデンシーは、2026-10-03 に取得したモデルページと Your data が Standard / Flex / Batch 対応を案内します。Pricing の現取得本文では、以前の Standard 限定記述の残存を確認できませんでした。取得範囲と過去の観測は [調査メモ](https://github.com/pero3dev/ai-agent-library/blob/main/research/prompting/openai.md) に記録しました。利用前に対象モデル・アカウント・プロジェクト・API の適格条件を Your data と管理画面/公式サポートで確認し、全アカウントでの利用を保証しません。Fast の EU 非対応と、地域内保存(regional storage)・地域内処理(regional processing)は別の条件です。保存対応だけで処理対応とは判断しません。

### メッセージ構造と指示階層

GPT 系のプロンプトは**役割の階層**で設計します。

- **役割は developer / user / assistant**: `developer`(アプリ開発者の指示)は `user`(エンドユーザーの指示)より優先されます。推論モデルでは developer メッセージが従来の system メッセージを置き換えます(Responses API では `instructions` パラメータが `input` 内のプロンプトより優先)
- **指示は重要度で階層化する**: 上から (1) 安全・プライバシー等の譲れない制約、(2) 必須の出力項目・真の不変条件、(3) 判断が要る場面の決定ルール、(4) 人格・文体(最下位)。ユーザー指示は文体は上書きできても上位の制約は拘束されたままです(この 4 層の定式化は 2026-07 確認分。現行ガイドの原文は再確認できていません。後述の TODO 参照)
- **矛盾・曖昧を残さない**: GPT-5 系は矛盾した指示の解消に推論トークンを浪費し、特に脆弱です。判断が要る箇所への `ALWAYS` / `NEVER` の乱用も避け、真の不変条件にだけ使います

### 構造化の推奨記法

- **Markdown 見出しと XML タグの併用**: 節分けには Markdown 見出し・リスト、内容ブロックの境界明示には XML タグ、というように使い分けます(Claude ほど XML を前面に出さない立場です)
- **既定は素のパラグラフ**: 見出し・太字・箇条書きは控えめに。**入れ子の箇条書きは避け**、リストはフラットに保ちます。整形は理解のためであり、過剰な装飾は逆効果です
- **Markdown は意味的に正しい箇所だけ**: ファイル名・関数名などはバッククォートで囲みます。プロンプトを JSON で組み立てる方式は積極推奨されていません

### 例示(few-shot)

- **zero-shot を先に、足りなければ few-shot**: 推論内蔵モデルは例なしで足りることが多く、まず例なしで試します
- **例と指示を厳密に整合させる**: 例が指示と矛盾すると、特に推論モデルで害になります(前述の矛盾脆弱性)
- **軽量モデルには「流れ」を見せる**: 小型モデル(mini / nano)には最終フォーマットだけでなく、正しい処理の流れを 1 例示すのが効きます

### 思考の制御: reasoning effort と reasoning.mode

GPT-5.x は推論を内蔵し、**reasoning effort** で思考とツール使用の労力を制御します(2026-08 時点)。

- **effort は none / minimal / low / medium / high / xhigh / max**(集合はモデル依存。GPT-5.6 世代は `minimal` 非対応で none / low / medium / high / xhigh / max)。既定は世代で変わります(例: GPT-5.6 / 5.5 は `medium`、GPT-5.2 は `none`)。移行時は先行世代のプロファイルに合わせて明示ピン留めします
- **高コンピュート実行は `reasoning.mode` で指定する**: かつての専用 pro モデル(o3-pro / gpt-5-pro)は、`reasoning.mode`(`standard` / `pro`)のパラメータ指定に置き換わりました(公式の移行先は `gpt-5.6-sol` + `reasoning.mode: "pro"`)。effort とは独立したパラメータで、数分かけてでも最高品質の回答が要る難問にだけ使います
- **effort は品質の主ノブではなく最後の微調整ノブ**: 「上げれば品質が上がる」は誤りです。矛盾した指示・弱い停止条件・自由なツールアクセスがあると、高 effort は**過剰思考(overthinking)や無駄な探索、品質の退行**を招きます。上げるのは評価で正当化できるときだけです(この警告の定式化は 2026-07 確認分。`max` 追加後の現行原文は再確認できていません。後述の TODO 参照)
- **推論内蔵モデルには手順を細かく書かない**: 「ステップバイステップで考えて」は不要です。**ゴール・強い制約・明示的な出力契約**を与え、中間手順は内部推論に任せます([上級パターンの思考制御](prompt-engineering-patterns.md)の GPT 版)
- **生の思考は API から見えない**: 推論トークンは可視化されません。ステートレスで推論を跨ぐには暗号化済み推論内容を差し戻す必要があります

### 出力の制御: Structured Outputs

- **機械処理する出力は Structured Outputs を使う**: 対応モデル・対応 JSON Schema・`strict: true` などの条件を満たす正常完了した構造化応答で形式を保証します。拒否や打切りの応答までスキーマに従う保証ではなく、業務上の正しさも別途検証します。JSON モードの JSON 妥当性と区別し、基本設計は [構造化出力](structured-output.md) を参照します
- **状態を先に分岐する**: Responses API では出力中の `refusal` は停止・通知し、`status == "incomplete"` は `incomplete_details.reason` を確認します。`max_output_tokens` は予算内・回数上限内の再生成を検討できますが、安全制約や理由不明の打切りは停止します。`strict: true` に非対応スキーマを渡した設定エラーは設定訂正へ渡し、正常完了だけを構造・業務検証へ進めます
- **出力スキーマをプロンプト本文から外す**: 「一貫した書式のための強い言い回し」は不要になりました。スキーマは Structured Outputs 側に置きます
- **応答の長さは verbosity で制御する**: 最終回答の長さは推論品質とは別物として、`verbosity`(low / medium / high)や語数・セクション数の明示で制御します
- **prefill は前提にしない**: OpenAI は Anthropic 型の自由な応答書き出し指定(prefill)を主要技法として扱いません。出力形式は Structured Outputs、前置き除去は指示で行います

### 長文・長コンテキスト

- **必要な文脈は検索で供給する**: 長大な資料を丸ごと詰めるより、RAG やビルトインの file search で必要箇所を供給します
- **長時間タスクはコンパクションで状態を圧縮する**: Responses API のコンパクションで、圧縮後もプロンプトが機能的に同一であるように保ちます(コンテキスト管理の一般設計は [圧縮と隔離](../02-architecture/context-compaction-and-isolation.md))
- **検索バジェットと停止規則を設ける**: 「今の証拠でユーザーの要求に答えられるか」を各段で問わせ、無駄な探索の暴走を防ぎます

### ツール使用・エージェント文脈

- **ツール固有の指示はツール記述(description)に置く**: 何をする・いつ使う・必須入力・副作用・リトライ安全性・よくあるエラーを、プロンプト本文でなくツールの description に 1〜2 文で書きます
- **独立したステップは並列化する**: 独立した取得・参照は並列ツール呼び出しでレイテンシを削ります
- **永続性と早期停止のバランスを明示する**: 「別のツール呼び出しで正確性が上がるなら早く止めない」と「成功基準を満たしたら止める」を両方指定します
- **推奨は Responses API + Agents SDK**: エージェント/ツール連携はこの構成が公式の推奨です

### 非同期ツールと実行中の指示変更

Astra の非同期ツール使用(async tool calling)では、function / custom tool に `async: true` を指定し、アプリが処理を実行して元の `call_id` に結果を返します。モデルは待機中にも独立した作業を進められます。WebSocket 経由の実行中の指示変更(mid-turn steering)を使う場合は、処理中のツールと遅れて届く結果を管理し、変更後の目的に不要な結果を新しい判断へ混ぜません。実行の永続化や外部操作の取り消しを API が保証するという意味ではありません。設計例は [ストリーミングと Agent UX](streaming-and-agent-ux.md) を参照してください。

### キャッシュを保った設定変更

GPT-5.6 以降は `prompt_cache_options.ttl: "30m"` を使います。キャッシュ境界までの書込量を `usage.input_tokens_details.cache_write_tokens`、読取量を `cached_tokens` で分けて記録します。30 分は最短保持期間で、必ず 30 分後に削除されるという意味ではありません。

GPT-6 ファミリーの standard・単一エージェントのリクエストでは、元の request-level `reasoning.effort` を変えず、`{"type":"configuration_update","reasoning":{"effort":"high"}}` を input の次の user メッセージより前に追記して、以後の effort を変えられます。pro mode・複数エージェントには非対応です。連続する configuration_update、自動 compaction / truncation、単独の `/responses/compact` との併用もできません。これは許可された設定更新の仕組みで、過去の system / developer 本文や動的な日付を書き換えてもキャッシュが残るという仕様ではありません。

明示的に履歴を圧縮する場合は、`/responses` のリクエストに `compaction_trigger` item を含められます。圧縮後は次の user メッセージより前に、希望する effort の `configuration_update` を再追加します。自動圧縮との非互換と、明示圧縮後の再設定を分けて実装します。

### 世代交代で見直すこと

GPT-5.6 のような新世代は**ドロップイン置換ではなく、再チューニング前提**です(2026-08 時点)。

- **最小プロンプトから始める**: 製品契約を保つ最小のプロンプトから始め、代表例で effort・verbosity・ツール記述・出力形式を微調整します。旧プロンプトスタックを丸ごと持ち込まないこと
- **移行時のプロンプト掃除**: 現在日付を消す(モデルが UTC 日付を把握済み)、出力スキーマを消して Structured Outputs へ、キャッシュ最適化(静的を先・動的を後)
- **既定 effort の変化に注意**: 既定の reasoning effort は世代で変わります(例: 5.2 は none、5.5 / 5.6 は medium)。無指定のままだとレイテンシ・コストのプロファイルが変わります
- **逐語的な解釈**: 新世代はプロンプトを字義通り・網羅的に解釈します。既定文体は簡潔・直接なので、温かみや特定の人格が要るなら明示します

移行作業の運用(回帰評価・段階リリース)は [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) が正本です。

### 効かない・不要になった俗説

以下は OpenAI 公式が非推奨・不要とするものです(2026-08 時点)。

- **推論モデルへの「ステップバイステップで考えて」**: 内部で推論するため不要
- **一貫した JSON のための「強い言い回し」の書式指示**: 正常完了時の形式は対応スキーマと strict 設定で制御します。拒否・打切りへの処理は別に必要です
- **出力スキーマをプロンプト本文に書き込む**: 外して Structured Outputs へ
- **現在日付をプロンプトに入れる**: 新世代は UTC 日付を把握済み
- **判断が要る箇所への `ALWAYS` / `NEVER` 乱用**: 真の不変条件にだけ使う
- **reasoning effort を上げれば品質が上がるという思い込み**: 過剰思考で退行しうる
- **入れ子箇条書き・重い整形での構造化**: フラットなリスト・素のパラグラフが既定
- **再利用プロンプトオブジェクト(`v1/prompts`)への依存**: 非推奨化(`v1/prompts` は 2026-11-30 停止予定)。`instructions` / `input` を直接 Responses API に渡す

## 実務での注意点

### アンチパターン

- **推論内蔵モデルに CoT スキャフォールドと詳細手順を書く** → 過剰思考・冗長化し、ときに品質が下がる → ゴールと出力契約を書き、手順は任せる
- **reasoning effort を「品質のつまみ」として上げる** → overthinking・無駄な探索を招く → 最後の微調整ノブとして、評価で正当化できるときだけ上げる
- **JSON をプロンプトの強い言い回しで得ようとする** → 前置き・形式崩れが混ざる → Structured Outputs(strict schema)で強制する
- **Structured Outputs の拒否・打切りもJSONとして再生成する** → 例外状態を形式違反と混同する → 拒否は停止、打切りは理由と予算で判断し、設定エラーは設定を訂正する
- **矛盾・曖昧な指示を放置する** → GPT-5 系は矛盾解消に推論を浪費する → 指示を整合させ、絶対語は不変条件だけに使う
- **旧世代のプロンプトを新世代へ丸ごと流用する** → 逐語解釈・既定 effort 変化で挙動がずれる → 最小プロンプトから再チューニングする

### チェックリスト

- [ ] 指示を developer / user の役割と重要度で階層化した(安全・不変条件を最上位に)
- [ ] 矛盾・曖昧な指示がなく、絶対語(ALWAYS/NEVER)を不変条件に限定した
- [ ] 推論内蔵モデルに CoT 指示・詳細手順を書かず、ゴールと出力契約を与えた
- [ ] reasoning effort を明示ピン留めし、上げるのは評価で正当化できるときだけにした
- [ ] 機械処理する出力を Structured Outputs(strict schema)で強制している
- [ ] 正常完了を確認して構造・業務検証へ渡し、拒否・incomplete・設定エラーを別の処理にした
- [ ] Sol / Luna の EU 条件はモデルページ/Your dataで確認し、地域内保存と処理、Fastの非対応を区別した
- [ ] ツール固有の指示をツール記述(description)側に置いた
- [ ] 世代移行時に現在日付を削除し、出力スキーマを Structured Outputs へ移した
- [ ] 新世代へ移行する際、最小プロンプトから再チューニングする運用がある

## 関連トピック

- [プロンプトエンジニアリングの基礎技法](prompt-engineering-fundamentals.md) — 汎用技法(本記事の前提)
- [プロンプトエンジニアリングの上級パターン](prompt-engineering-patterns.md) — なぜ効くかの中立な原理
- [モデル間の違いと移行(横断比較)](cross-model-prompting.md) — Claude・Gemini との横並びと乗り換え
- [Claude 特化プロンプティングガイド](claude-prompting.md) — 対になるベンダー別ガイド
- [Gemini 特化プロンプティングガイド](gemini-prompting.md) — 対になるベンダー別ガイド
- [モデル選定ガイド](model-selection.md) / [モデルカタログ](llm-landscape.md) — GPT 系の選び方
- [構造化出力](structured-output.md) — Structured Outputs の設計
- [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) — 世代交代への追従運用

## 参考資料

- [GPT-6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol) — 世代内の effort・API 制約の違い / EU条件の参照先と取得範囲(アクセス日: 2026-10-03)
- [Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) — 世代内の effort・API 制約の違い / EU条件の参照先と取得範囲(アクセス日: 2026-10-03)
- [最新モデルガイド](https://developers.openai.com/api/docs/guides/latest-model) — 世代内の effort・API 制約の違い / 移行・設定の条件 / 最新世代への移行考慮点(アクセス日: 2026-09-28)
- [Reasoning models](https://developers.openai.com/api/docs/guides/reasoning) — GPT-6 の設定更新・保持条件・対象 ID 別の終了予定 / `compaction_trigger` と圧縮後の `configuration_update` 再追加 / 推論モデルへの書き方・effort・`reasoning.mode`(アクセス日: 2026-09-28)
- [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) — GPT-6 の設定更新・保持条件・対象 ID 別の終了予定 / 世代別の保持・課金・設定更新(アクセス日: 2026-09-28)
- [Deprecations](https://developers.openai.com/api/docs/deprecations) — GPT-6 の設定更新・保持条件・対象 ID 別の終了予定(アクセス日: 2026-09-28)
- [Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra) — 移行・設定の条件(アクセス日: 2026-09-10)
- [Async tool calling](https://developers.openai.com/api/docs/guides/async-tool-calling) — 非同期処理の契約(アクセス日: 2026-09-10)
- [Mid-turn steering](https://developers.openai.com/api/docs/guides/steering) — 非同期処理の契約(アクセス日: 2026-09-10)
- [Prompt engineering(OpenAI)](https://developers.openai.com/api/docs/guides/prompt-engineering) — 構造化・階層・整形の指針(アクセス日: 2026-07-08)
- [Prompt guidance(OpenAI)](https://developers.openai.com/api/docs/guides/prompt-guidance) — 構造化・階層・整形の指針(アクセス日: 2026-07-08)
- [Reasoning best practices(OpenAI)](https://developers.openai.com/api/docs/guides/reasoning-best-practices) — 推論モデルへの書き方・effort・`reasoning.mode`(アクセス日: 2026-07-08)
- [Structured Outputs(OpenAI)](https://developers.openai.com/api/docs/guides/structured-outputs) — strict設定と正常完了・拒否・打切り・設定エラーの区別(アクセス日: 2026-10-03)
- [Your data](https://developers.openai.com/api/docs/guides/your-data) — EU条件の参照先と取得範囲(アクセス日: 2026-10-03)
- [Pricing](https://developers.openai.com/api/docs/pricing) — EU条件の参照先と取得範囲(アクセス日: 2026-10-03)
- [GPT-5 prompting guide(OpenAI Cookbook)](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide) — エージェント・ツール文脈の実例(アクセス日: 2026-07-08)

## TODO・未確認事項

> **TODO(要確認):** Sol / Luna の EU データレジデンシーについて、対象アカウント・プロジェクト・APIの適格条件は実環境で未検証です。利用前に Your data と管理画面/公式サポートで確認する(最終確認: 2026-10)

> **TODO(要確認):** 停止シーケンス(`stop`)の現行 API 仕様、および Anthropic 型の assistant prefill の可否は、プロンプト系ガイドでは扱われず未確定です。必要時に公式 API リファレンスで確認する(最終確認: 2026-07)

> **TODO(要確認):** 過剰思考(overthinking)警告と指示階層(安全 > 不変条件 > 決定ルール > 文体)の現行原文を「Reasoning best practices」「Prompt guidance」で再確認する。2026-08-18 時点では要約経由でしか取得できず断定不可。GPT-5.6 世代版では overthinking 警告が「`max` は最難関タスクに留め `xhigh` と比較する」といった表現に変わっている可能性があります(最終確認: 2026-08)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** 四半期ごとに OpenAI 公式の「Prompt guidance」「Reasoning models」「Using the latest model」ページと GPT-5.x 系 cookbook で次を再確認する(更新起点: `research/prompting/openai.md`、最終確認: 2026-09):
>
> - 現行フロンティア世代と対応 effort(Astra は none / minimal 非対応、GPT-5.6 / 5.5 の既定は medium)
> - reasoning effort の水準集合(none / minimal / low / medium / high / xhigh / max。GPT-5.6 世代は `minimal` 非対応)と `reasoning.mode`(standard / pro)の対応モデル
> - developer / system メッセージの用語と指示階層(Model Spec の更新)
> - Structured Outputs の対応モデルと未対応スキーマ機能
> - 再利用プロンプトオブジェクト(`v1/prompts`)の停止(2026-11-30 予定のまま据え置き)
> - ドキュメントドメイン(`platform.openai.com` → `developers.openai.com` へ移行済み)
