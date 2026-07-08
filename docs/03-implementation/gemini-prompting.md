---
title: "Gemini 特化プロンプティングガイド"
category: "implementation"
level: "intermediate"
status: "published"
last_updated: "2026-07-08"
tags: ["prompt-design", "model-selection"]
---

# Gemini 特化プロンプティングガイド

## この記事の目的

Google の Gemini ファミリーに対して、**公式ガイドが推奨する具体的なプロンプトの書き方**を根拠を持って選べるようになります。[汎用の基礎技法](prompt-engineering-fundamentals.md)と[上級パターン](prompt-engineering-patterns.md)がモデル中立の原理を扱うのに対し、本記事は「few-shot の常時推奨・thinking_level・サンプリングパラメータの扱い・マルチモーダル」といった、このモデル固有の作法に踏み込みます。

> **本記事は鮮度管理型です。** モデル世代・機能名(効果や API 仕様)は変化が速いため、本文冒頭の最終確認日と各公式ページを必ず確認してください。API のフィールド名は実装時に公式リファレンスで綴りを再確認してください。

## 対象読者

- Gemini を使ったアプリ・エージェントを実装し、そのモデルに合わせてプロンプト品質を上げたいエンジニア
- マルチモーダル・長コンテキストを活かしたい、または Gemini の世代交代に追従したいエンジニア

## 前提知識

- [プロンプトエンジニアリングの基礎技法](prompt-engineering-fundamentals.md) — 汎用技法(本記事はその Gemini 具体)
- [プロンプトエンジニアリングの上級パターン](prompt-engineering-patterns.md) — なぜ効くかの中立な原理
- [主要 LLM の全体像(モデルカタログ)](llm-landscape.md) — Gemini ファミリーの顔ぶれ・選び方

## 本文

> **最終確認日:** 2026-07-08 — 本記事の機能名・仕様・モデル別推奨は、この日付時点の Google 公式ドキュメント([参考資料](#参考資料))に基づきます。個別モデルの仕様は変わるため、断定は避け「〜時点」を明記しています。

### 概要: 汎用記事との分担

| 層 | 正本 | 本記事 |
| --- | --- | --- |
| 汎用技法(名前・使いどころ) | [基礎技法](prompt-engineering-fundamentals.md) | — |
| 中立な原理と検証(なぜ効くか) | [上級パターン](prompt-engineering-patterns.md) | — |
| **Gemini 固有の作法** | **本記事** | few-shot 重視・thinking_level・サンプリング・マルチモーダル・世代差 |
| モデルの選び方 | [モデル選定ガイド](model-selection.md) / [モデルカタログ](llm-landscape.md) | — |
| 世代交代への追従運用 | [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) | — |

Claude・OpenAI との横並び比較と移行は [モデル間の違いと移行](cross-model-prompting.md) が扱います。

### モデルファミリーの前提(プロンプトに効く差分だけ)

顔ぶれ・価格・選び方は [モデルカタログ](llm-landscape.md) が正本です。プロンプト設計に効く差分だけを押さえます(2026-07 時点)。

- **現行は Gemini 3 系**: 安定版の Gemini 3.5 Flash(主力)・3.1 Flash-Lite(軽量)と、プレビューの 3.1 Pro などがあります。旧世代の 2.5 系も提供中ですが、一部は退役予定です
- **思考は thinking_level で制御する**: 固定のトークン予算ではなく、相対的な思考量として制御します(後述)
- **マルチモーダルが最大の差別化点**: text / image / audio / video を同格の入力として扱えます。プロンプトはこれを前提に書きます
- **サンプリングパラメータは既定のまま**が公式推奨で、これは他社の慣行と逆向きです(後述)

### メッセージ構造とシステム指示

- **重要な指示は system instruction かプロンプト冒頭に置く**: 役割(ペルソナ)・振る舞いの制約・出力フォーマットを system instruction に寄せます
- **簡潔・直接に書く**: Gemini 3 は「ゴールを明確かつ簡潔に述べる」ことを推奨し、**過度に丁寧・説得的な言い回しは不要**とします(「あなたは超優秀なので、どうか…」的な誘導は効きません)
- **曖昧語を定義する**: 解釈の割れる語は明示的に説明します

### 構造化の推奨記法

- **XML タグまたは Markdown 見出しのどちらでもよい**: 一貫した区切りで各部を分離します。Gemini は両方を同格に例示します(Claude が XML を強調するのと対照的)
  - XML 例: `<role>` / `<constraints>` / `<context>` / `<task>`
  - Markdown 例: `# Identity` / `# Constraints`(箇条書き)
- **制約を明示する**: すべきこと・すべきでないことと、出力フォーマット(表・箇条書き・段落など)を指定します

### 例示(few-shot)

**few-shot の常時推奨が Gemini 最大の特徴**です。公式は「プロンプトには常に few-shot 例を入れることを推奨」「例のないプロンプトは効果が落ちやすい」と明言します。

- **例がフォーマット・言い回し・スコープ・パターンを規定する**: 言葉で説明しにくい出力の型を例で伝えます
- **全例で構造・フォーマットを統一する**: ばらつくと、望まない出力形式を招きます
- **数は実験で最適化する**: 少数でパターンを掴めることが多く、**多すぎると例へ過学習**します

汎用の例示設計([上級パターン](prompt-engineering-patterns.md))に加え、この「常時 few-shot + フォーマット統一」が Gemini 固有の勘所です。

### 思考の制御: thinking_level

Gemini 3 系の思考制御は **thinking_level**(相対的な思考量の許容)で行います(2026-07 時点)。

- **既定は動的思考(dynamic thinking)**: 複雑さに応じて思考量を自動調整します。thinking_level は minimal / low / medium / high で、モデルごとに既定と対応レベルが異なります(例: 3.5 Flash の既定は medium)
- **旧来の thinking_budget(数値)とは併用しない**: legacy の数値予算は引き続きサポートされますが、thinking_level と同一リクエストで混ぜないこと。数値予算より thinking_level への移行が公式方針です
- **複雑な CoT の作り込みをやめる**: 「ステップごとに考えて」を長々と書くより、`thinking_level: high` に任せるのが公式の推奨です([上級パターンの思考制御](prompt-engineering-patterns.md)の Gemini 版)
- **思考署名(thought signatures)は SDK 任せ**: マルチターンで推論を継続するために必要な暗号化状態で、SDK が自動処理します。手動設定は不要です

### 出力の制御: JSON スキーマ強制

- **機械処理する出力は JSON スキーマで強制する**: JSON MIME タイプ + スキーマを指定します(パラメータ名は世代・API 面で異なるため実装時に公式リファレンスで確認)。基本設計は [構造化出力](structured-output.md) が正本です
- **スキーマの `description` でモデルを誘導し、具体的な型(integer・enum)を使う**。ただし**非常に大きい・深くネストしたスキーマは拒否されうる**ため、アプリ側でも必ず検証します
- **構造化出力は組み込みツールと併用できる**(検索・コード実行・function calling など)
- **サンプリングパラメータは既定のまま**: Gemini 3.x では `temperature` を既定(1.0)から下げると **looping や性能劣化**を招きうると公式が警告します。決定性のために温度を下げる他社の慣行は Gemini では逆効果です
- **既定は簡潔**: 詳細・会話的な回答が欲しければ system instruction で明示的に要求します

### 長文・長コンテキストとマルチモーダル

- **資料を先・質問を最後に置く**: これは Google が最も一貫して繰り返す長文作法です。大きなデータブロックの後には転換句(「以上の情報に基づいて…」)を挟みます
- **コンテキストキャッシュを使う**: 繰り返し使う前置き資料をキャッシュしてコストを削ります
- **複数箇所の同時検索は精度が落ちうる**: 単一箇所の抽出は高精度でも、多数の情報を同時に探させると精度が変動します。タスクを分けることを検討します
- **マルチモーダルは各モダリティを本文で明示参照する**: text / image / audio / video を同格に扱い、指示側で「この画像の…」のように各入力を明確に指し示します。高解像度設定は PDF などでトークン消費が増える点に注意します

### ツール使用・エージェント文脈

- **関数宣言は明確・簡潔に、強い型付けで**: 目的・各パラメータの型と説明を書き、integer・enum などの具体型を使います
- **呼び出しモードを使い分ける**: auto(既定)/ any(必ず呼ぶ)/ none(呼ばない)/ validated(スキーマ遵守を保証)。並列呼び出しと合成(依存関数の逐次連鎖)に対応します
- **アクティブなツール数は 10〜20 個までに絞る**: 多すぎると選択が乱れます
- **エージェントの system instruction に設計軸を書く**: 自律度・リスク許容(低リスクな読み取りと高リスクな状態変更の区別)・明確化を求めるか仮定して進むか・エラー回復の粘り強さ、を明示します

### 世代交代で見直すこと

2.5 系から 3 系への移行で見直す点です(2026-07 時点)。

- **複雑な CoT スキャフォールドを `thinking_level: high` に置き換える**
- **決定性のための明示的な temperature 設定を外す**(既定に戻す)
- **thinking_budget(数値)を thinking_level(相対許容)へ**
- **既定が簡潔になった**: 2.5 で得ていた冗長さが要るなら明示的に要求します
- **API 面の移行**: 従来の `generateContent` から新しい Interactions API(ステートフル)への移行が進んでいます。一部機能は片方にのみあります

移行作業の運用(回帰評価・段階リリース)は [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) が正本です。

### 効かない・不要になった俗説

以下は Google 公式が非推奨・不要とするものです(2026-07 時点)。

- **過度に丁寧・説得的な前置き**: 直接的で構造化されたプロンプトが最良
- **手作りの CoT スキャフォールド**: `thinking_level` に任せる
- **決定性のための低 temperature の常用**: Gemini 3.x では looping・劣化を招きうる。サンプリングパラメータは既定維持
- **few-shot なしで済ませる**: 効果が落ちやすいと明言。常時例を入れる
- **例を大量に盛る**: 多すぎると例へ過学習

## 実務での注意点

### アンチパターン

- **他モデルの慣行で temperature を下げる** → Gemini 3.x では looping・性能劣化を招きうる → サンプリングパラメータは既定のまま、挙動はプロンプトで誘導する
- **few-shot 例なしで書く** → Gemini では効果が落ちやすい → 常に例を入れ、全例でフォーマットを統一する
- **複雑な CoT スキャフォールドを書き込む** → thinking と二重になり冗長 → `thinking_level: high` に任せる
- **質問を資料より前に置く** → 長コンテキストで品質が落ちる → 資料を先・質問を末尾に置き、転換句を挟む
- **マルチモーダル入力を本文で参照しない** → どの画像・音声を指すか曖昧になる → 指示側で各モダリティを明示参照する

### チェックリスト

- [ ] 役割・制約・出力形式を system instruction かプロンプト冒頭に置いた
- [ ] few-shot 例を入れ、全例で構造・フォーマットを統一した(多すぎない)
- [ ] 思考制御を thinking_level で行い、thinking_budget と併用していない
- [ ] `temperature` などサンプリングパラメータを既定のまま使っている
- [ ] 機械処理する出力を JSON スキーマで強制し、アプリ側でも検証している
- [ ] 長文は資料を先・質問を末尾に置き、転換句を挟んでいる
- [ ] マルチモーダル入力を指示側で明示参照している
- [ ] アクティブなツール数を 10〜20 個に絞っている

## 関連トピック

- [プロンプトエンジニアリングの基礎技法](prompt-engineering-fundamentals.md) — 汎用技法(本記事の前提)
- [プロンプトエンジニアリングの上級パターン](prompt-engineering-patterns.md) — なぜ効くかの中立な原理
- [モデル間の違いと移行(横断比較)](cross-model-prompting.md) — Claude・OpenAI との横並びと乗り換え
- [Claude 特化プロンプティングガイド](claude-prompting.md) — 対になるベンダー別ガイド
- [OpenAI(GPT 系)特化プロンプティングガイド](openai-prompting.md) — 対になるベンダー別ガイド
- [モデル選定ガイド](model-selection.md) / [モデルカタログ](llm-landscape.md) — Gemini の選び方
- [構造化出力](structured-output.md) — JSON スキーマ強制の設計
- [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) — 世代交代への追従運用

## 参考資料

- [Prompting strategies(Google Gemini API)](https://ai.google.dev/gemini-api/docs/prompting-strategies) — 構造化・few-shot・長文・マルチモーダルの指針(アクセス日: 2026-07-08)
- [Gemini 3 developer guide(Google)](https://ai.google.dev/gemini-api/docs/gemini-3) — 世代固有の推奨(thinking_level・サンプリング・移行)(アクセス日: 2026-07-08)
- [Thinking(Google Gemini API)](https://ai.google.dev/gemini-api/docs/thinking) — thinking_level・思考署名(アクセス日: 2026-07-08)
- [Structured output(Google Gemini API)](https://ai.google.dev/gemini-api/docs/structured-output) — JSON スキーマ強制(アクセス日: 2026-07-08)
- [Long context(Google Gemini API)](https://ai.google.dev/gemini-api/docs/long-context) / [Function calling(Google Gemini API)](https://ai.google.dev/gemini-api/docs/function-calling) — 長文配置・ツール使用(アクセス日: 2026-07-08)

## TODO・未確認事項

> **TODO(要確認):** Gemini(Interactions / generateContent)での応答書き出し指定(prefill 相当)の可否、および構造化出力・ツール関連のフィールド名の正確な綴りは、公式リファレンス(ai.google.dev/api)で確認する。本記事の要点は要約経由の一次情報整理に基づくため、実装時の綴りは一次リファレンスを正とする(最終確認: 2026-07)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** 四半期ごとに Google 公式の「Prompting strategies」「Gemini 3 developer guide」「Thinking」ページで次を再確認する(更新起点: `research/prompting/google.md`、最終確認: 2026-07):
>
> - 現行モデル世代とモデル ID(現在: 3.5 Flash が主力 GA、3.1 Pro はプレビュー、2.5 系は退役予定)
> - API 面(Interactions API が推奨 / generateContent が legacy への移行)
> - thinking 制御の書き方(thinking_level の値・モデル別既定、thinking_budget の扱い)
> - 構造化出力のフィールド名と対応スキーマ機能
> - サンプリングパラメータの推奨(現在は「既定維持」)
> - マルチモーダル解像度設定と画像セグメンテーションの対応世代
