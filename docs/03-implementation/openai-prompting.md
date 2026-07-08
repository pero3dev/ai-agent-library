---
title: "OpenAI(GPT 系)特化プロンプティングガイド"
category: "implementation"
level: "intermediate"
status: "published"
last_updated: "2026-07-08"
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
- [プロンプトエンジニアリングの上級パターン](prompt-engineering-patterns.md) — なぜ効くかの中立な原理
- [主要 LLM の全体像(モデルカタログ)](llm-landscape.md) — GPT ファミリーの顔ぶれ・選び方

## 本文

> **最終確認日:** 2026-07-08 — 本記事の機能名・仕様・モデル別推奨は、この日付時点の OpenAI 公式ドキュメント([参考資料](#参考資料))に基づきます。個別モデルの仕様は変わるため、断定は避け「〜時点」を明記しています。

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

顔ぶれ・価格・選び方は [モデルカタログ](llm-landscape.md) が正本です。プロンプト設計に効く差分だけを押さえます(2026-07 時点)。

- **推論は本体に統合された**: かつての推論特化「o シリーズ」は縮小し、GPT-5.x 本体の **reasoning effort** で思考量を制御する形が標準です(2026-07 時点で o 系は退役が進行中。退役日程は [モデルカタログ](llm-landscape.md) を参照)
- **モデルは「同僚」で例える**: 公式は推論内蔵モデルを「ゴールを渡せば任せられる上級同僚」、軽量モデルを「明示的な指示で最も動く新人同僚」と説明します。書き方の粒度を変える指針です
- **一部の作法は不要になった**: 出力スキーマの強い言い回しや「ステップバイステップで考えて」は、Structured Outputs と推論内蔵化により不要・逆効果になりました(後述)

### メッセージ構造と指示階層

GPT 系のプロンプトは**役割の階層**で設計します。

- **役割は developer / user / assistant**: `developer`(アプリ開発者の指示)は `user`(エンドユーザーの指示)より優先されます。推論モデルでは developer メッセージが従来の system メッセージを置き換えます(Responses API では `instructions` パラメータが `input` 内のプロンプトより優先)
- **指示は重要度で階層化する**: 上から (1) 安全・プライバシー等の譲れない制約、(2) 必須の出力項目・真の不変条件、(3) 判断が要る場面の決定ルール、(4) 人格・文体(最下位)。ユーザー指示は文体は上書きできても上位の制約は拘束されたままです
- **矛盾・曖昧を残さない**: GPT-5 系は矛盾した指示の解消に推論トークンを浪費し、特に脆弱です。判断が要る箇所への `ALWAYS` / `NEVER` の乱用も避け、真の不変条件にだけ使います

### 構造化の推奨記法

- **Markdown 見出しと XML タグの併用**: 節分けには Markdown 見出し・リスト、内容ブロックの境界明示には XML タグ、というように使い分けます(Claude ほど XML を前面に出さない立場です)
- **既定は素のパラグラフ**: 見出し・太字・箇条書きは控えめに。**入れ子の箇条書きは避け**、リストはフラットに保ちます。整形は理解のためであり、過剰な装飾は逆効果です
- **Markdown は意味的に正しい箇所だけ**: ファイル名・関数名などはバッククォートで囲みます。プロンプトを JSON で組み立てる方式は積極推奨されていません

### 例示(few-shot)

- **zero-shot を先に、足りなければ few-shot**: 推論内蔵モデルは例なしで足りることが多く、まず例なしで試します
- **例と指示を厳密に整合させる**: 例が指示と矛盾すると、特に推論モデルで害になります(前述の矛盾脆弱性)
- **軽量モデルには「流れ」を見せる**: 小型モデル(mini / nano)には最終フォーマットだけでなく、正しい処理の流れを 1 例示すのが効きます

### 思考の制御: reasoning effort

GPT-5.x は推論を内蔵し、**reasoning effort** で思考とツール使用の労力を制御します(2026-07 時点)。

- **effort は none / minimal / low / medium / high / xhigh**(モデル依存)。既定は世代で変わります(例: GPT-5.5 は `medium`、GPT-5.2 は `none`)。移行時は先行世代のプロファイルに合わせて明示ピン留めします
- **effort は品質の主ノブではなく最後の微調整ノブ**: 「上げれば品質が上がる」は誤りです。矛盾した指示・弱い停止条件・自由なツールアクセスがあると、高 effort は**過剰思考(overthinking)や無駄な探索、品質の退行**を招きます。上げるのは評価で正当化できるときだけです
- **推論内蔵モデルには手順を細かく書かない**: 「ステップバイステップで考えて」は不要です。**ゴール・強い制約・明示的な出力契約**を与え、中間手順は内部推論に任せます([上級パターンの思考制御](prompt-engineering-patterns.md)の GPT 版)
- **生の思考は API から見えない**: 推論トークンは可視化されません。ステートレスで推論を跨ぐには暗号化済み推論内容を差し戻す必要があります

### 出力の制御: Structured Outputs

- **機械処理する出力は Structured Outputs で強制する**: 供給した JSON Schema への遵守を保証します(妥当な JSON だけを保証する JSON モードの発展形。`strict: true` + `json_schema`)。基本設計は [構造化出力](structured-output.md) が正本です
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

### 世代交代で見直すこと

GPT-5.5 のような新世代は**ドロップイン置換ではなく、再チューニング前提**です(2026-07 時点)。

- **最小プロンプトから始める**: 製品契約を保つ最小のプロンプトから始め、代表例で effort・verbosity・ツール記述・出力形式を微調整します。旧プロンプトスタックを丸ごと持ち込まないこと
- **移行時のプロンプト掃除**: 現在日付を消す(モデルが UTC 日付を把握済み)、出力スキーマを消して Structured Outputs へ、キャッシュ最適化(静的を先・動的を後)
- **既定 effort の変化に注意**: 既定の reasoning effort は世代で変わります(例: 5.2 は none、5.5 は medium)。無指定のままだとレイテンシ・コストのプロファイルが変わります
- **逐語的な解釈**: 新世代はプロンプトを字義通り・網羅的に解釈します。既定文体は簡潔・直接なので、温かみや特定の人格が要るなら明示します

移行作業の運用(回帰評価・段階リリース)は [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) が正本です。

### 効かない・不要になった俗説

以下は OpenAI 公式が非推奨・不要とするものです(2026-07 時点)。

- **推論モデルへの「ステップバイステップで考えて」**: 内部で推論するため不要
- **一貫した JSON のための「強い言い回し」の書式指示**: Structured Outputs でスキーマ遵守が保証されるため不要
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
- **矛盾・曖昧な指示を放置する** → GPT-5 系は矛盾解消に推論を浪費する → 指示を整合させ、絶対語は不変条件だけに使う
- **旧世代のプロンプトを新世代へ丸ごと流用する** → 逐語解釈・既定 effort 変化で挙動がずれる → 最小プロンプトから再チューニングする

### チェックリスト

- [ ] 指示を developer / user の役割と重要度で階層化した(安全・不変条件を最上位に)
- [ ] 矛盾・曖昧な指示がなく、絶対語(ALWAYS/NEVER)を不変条件に限定した
- [ ] 推論内蔵モデルに CoT 指示・詳細手順を書かず、ゴールと出力契約を与えた
- [ ] reasoning effort を明示ピン留めし、上げるのは評価で正当化できるときだけにした
- [ ] 機械処理する出力を Structured Outputs(strict schema)で強制している
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

- [Prompt engineering(OpenAI)](https://developers.openai.com/api/docs/guides/prompt-engineering) / [Prompt guidance(OpenAI)](https://developers.openai.com/api/docs/guides/prompt-guidance) — 構造化・階層・整形の指針(アクセス日: 2026-07-08)
- [Reasoning best practices(OpenAI)](https://developers.openai.com/api/docs/guides/reasoning-best-practices) / [Reasoning models(OpenAI)](https://developers.openai.com/api/docs/guides/reasoning) — 推論モデルへの書き方・effort(アクセス日: 2026-07-08)
- [Using the latest model(OpenAI)](https://developers.openai.com/api/docs/guides/latest-model) — 最新世代への移行考慮点(アクセス日: 2026-07-08)
- [Structured Outputs(OpenAI)](https://developers.openai.com/api/docs/guides/structured-outputs) — スキーマ強制出力(アクセス日: 2026-07-08)
- [GPT-5 prompting guide(OpenAI Cookbook)](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide) — エージェント・ツール文脈の実例(アクセス日: 2026-07-08)

## TODO・未確認事項

> **TODO(要確認):** 停止シーケンス(`stop`)の現行 API 仕様、および Anthropic 型の assistant prefill の可否は、プロンプト系ガイドでは扱われず未確定です。必要時に公式 API リファレンスで確認する(最終確認: 2026-07)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** 四半期ごとに OpenAI 公式の「Prompt guidance」「Reasoning models」「Using the latest model」ページと GPT-5.x 系 cookbook で次を再確認する(更新起点: `research/prompting/openai.md`、最終確認: 2026-07):
>
> - 現行フロンティア世代と既定 reasoning effort(現在: GPT-5.5 = medium、旧世代で異なる)
> - reasoning effort の水準集合(none / minimal / low / medium / high / xhigh)
> - developer / system メッセージの用語と指示階層(Model Spec の更新)
> - Structured Outputs の対応モデルと未対応スキーマ機能
> - 再利用プロンプトオブジェクト(`v1/prompts`)の停止(2026-11-30 予定)
> - ドキュメントドメイン(`platform.openai.com` → `developers.openai.com` へ移行済み)
