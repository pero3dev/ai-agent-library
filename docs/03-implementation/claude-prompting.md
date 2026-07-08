---
title: "Claude 特化プロンプティングガイド"
category: "implementation"
level: "intermediate"
status: "published"
last_updated: "2026-07-08"
tags: ["prompt-design", "model-selection"]
---

# Claude 特化プロンプティングガイド

## この記事の目的

Anthropic の Claude ファミリーに対して、**公式ガイドが推奨する具体的なプロンプトの書き方**を根拠を持って選べるようになります。[汎用の基礎技法](prompt-engineering-fundamentals.md)と[上級パターン](prompt-engineering-patterns.md)がモデル中立の原理を扱うのに対し、本記事は「Claude では XML タグ・アダプティブ思考・prefill の扱い」といった、このモデル固有の作法に踏み込みます。

> **本記事は鮮度管理型です。** モデル世代・機能名(効果や API 仕様)は変化が速いため、本文冒頭の最終確認日と各公式ページを必ず確認してください。

## 対象読者

- Claude を使ったアプリ・エージェントを実装し、そのモデルに合わせてプロンプト品質を上げたいエンジニア
- 他モデル向けに書いたプロンプトを Claude 向けに調整する、または Claude の世代交代に追従したいエンジニア

## 前提知識

- [プロンプトエンジニアリングの基礎技法](prompt-engineering-fundamentals.md) — 汎用技法(本記事はその Claude 具体)
- [プロンプトエンジニアリングの上級パターン](prompt-engineering-patterns.md) — なぜ効くかの中立な原理
- [主要 LLM の全体像(モデルカタログ)](llm-landscape.md) — Claude ファミリーの顔ぶれ・選び方

## 本文

> **最終確認日:** 2026-07-08 — 本記事の機能名・仕様・モデル別推奨は、この日付時点の Anthropic 公式ドキュメント([参考資料](#参考資料))に基づきます。個別モデルの仕様は変わるため、断定は避け「〜時点」を明記しています。

### 概要: 汎用記事との分担

| 層 | 正本 | 本記事 |
| --- | --- | --- |
| 汎用技法(名前・使いどころ) | [基礎技法](prompt-engineering-fundamentals.md) | — |
| 中立な原理と検証(なぜ効くか) | [上級パターン](prompt-engineering-patterns.md) | — |
| **Claude 固有の作法** | **本記事** | XML・思考制御・prefill 移行・長文配置・世代差 |
| モデルの選び方 | [モデル選定ガイド](model-selection.md) / [モデルカタログ](llm-landscape.md) | — |
| 世代交代への追従運用 | [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) | — |

OpenAI・Gemini との横並び比較と移行は [モデル間の違いと移行](cross-model-prompting.md) が扱います。本記事は Claude 単体の作法に集中します。

### モデルファミリーの前提(プロンプトに効く差分だけ)

顔ぶれ・価格・選び方は [モデルカタログ](llm-landscape.md) が正本です。ここではプロンプト設計に効く差分だけを押さえます(2026-07 時点)。

- **思考は「モード」ではなくパラメータで制御する**: 推論専用の別モデルはなく、汎用モデルの思考の深さを**アダプティブ思考**と **effort** で制御します(後述)
- **世代でプロンプトの効き方が変わる**: 最新世代(Opus 4.7 以降)は指示をより**逐語的に**解釈し、旧世代向けの「補助」が過剰・不要になります(後述の移行)
- **一部の作法は API で強制される**: 応答の書き出し指定(prefill)や `temperature` などの非既定値は、最新世代では拒否(400 エラー)されます。プロンプト側で代替する必要があります

### メッセージ構造とシステムプロンプト

- **役割はシステムプロンプトで与える**: 用途に合わせて挙動とトーンを絞れます。**一文でも効果があり**(「あなたは Python に詳しいコーディング支援です」)、大げさな人格設定より判断基準を書く方が効きます([上級パターンの役割設計](prompt-engineering-patterns.md))
- **指示に「なぜ」を添える**: 「省略記号を使うな」より「読み上げられるので省略記号を使わないで」の方が、Claude は理由から一般化して従います
- **明確・直接に書く**: 公式の黄金律は「文脈のない同僚に見せて混乱するならモデルも混乱する」。順序や網羅性が重要なら番号付き・箇条書きの手順で与えます
- **会話の途中で指示を差し込む**: セッション中に方針を変える指示は、`messages` 配列に `role: "system"` のメッセージとして追加できます(**2026-07 時点では Opus 4.8 のみ対応**)。開始時から効かせる指示は最上位の `system` を使います

### 構造化: XML タグが第一選択

Claude では、指示・文脈・例・入力の区切りに **XML タグ**を使うのが一貫した公式推奨です。マークダウン主体の他社ガイドとの明確な差分です。

- **役割ごとにタグで囲む**: `<instructions>` / `<context>` / `<input>` のように種類別のタグで囲むと、混在したプロンプトを曖昧さなく解析できます
- **一貫した記述的なタグ名 + 自然な入れ子**: `<documents>` の中に `<document index="1">` のように階層を表現します
- **出力形式の誘導にも使う**: `<prose>` のような形式インジケータのタグで出力を囲ませると、形式が安定します

### 例示(few-shot)

Claude 公式は例示を「出力の形式・トーン・構造を操る最も信頼できる手段の一つ」と位置づけます。汎用の例示設計([上級パターン](prompt-engineering-patterns.md))に加え、Claude 固有の作法は次のとおりです。

- **良い例の 3 条件**: Relevant(実ユースケースを反映)/ Diverse(エッジケースを含め、意図しないパターンを拾わせない)/ Structured(`<example>` タグで囲む)
- **3〜5 個が目安**。数より代表性・多様性です
- **思考と併用する**: 例の中で `<thinking>` タグを使って推論の型を見せると、Claude は自分の思考にそのスタイルを一般化します

### 思考の制御: アダプティブ思考と effort

Claude の思考制御は、固定のトークン予算ではなく **2 つのつまみ**で行います(2026-07 時点)。

| つまみ | 何をするか | 補足 |
| --- | --- | --- |
| アダプティブ思考(`thinking: {type: "adaptive"}`) | 複雑さに応じて「いつ・どれだけ考えるか」をモデルが動的に決める | Fable 5 は常時オン。Opus 4.8/4.7 は明示設定しないと思考オフ。Sonnet 5 は既定オン |
| effort(`output_config.effort`) | 思考だけでなく応答全体(テキスト・ツール呼び出し)の労力を `low`〜`max` で調整 | `high` が既定(= 未指定と同じ)。コーディング・エージェント用途は `xhigh` 推奨 |

- **固定のトークン予算(`budget_tokens`)は使わない**: 旧世代の手法で、**最新世代では 400 エラー**になります。ハード上限が要るなら effort を下げるか `max_tokens` を使います
- **プロンプトでも思考を誘導できる**: 思考が多すぎるなら「When in doubt, respond directly.」、増やしたいなら「Think carefully before responding.」をユーザーターン末尾に添えます
- **手順を細かく指示するより「よく考えて」**: Claude の推論は人が指示する以上に及ぶため、詳細なステップ列より一般的な指示の方が良い結果になりがちです(推論モデル一般の原則の Claude 版。[上級パターンの思考制御](prompt-engineering-patterns.md))
- **自己検証をさせる**: 「終える前に、次の基準で答えを検証して」はコード・数学で有効です(ただし検証可能な基準を渡すこと)

### 出力の制御: prefill から構造化出力へ

- **prefill(応答の書き出し指定)は最新世代で非対応**: Claude 4.6 以降では最終アシスタントターンの prefill が **400 エラー**になります(旧世代は引き続き可)。用途別の代替は次のとおりです。

| prefill の旧用途 | Claude での代替 |
| --- | --- |
| 出力形式(JSON 等)の強制 | 構造化出力(`output_config.format`)/ 「スキーマに従え」と指示 |
| 前置き(「はい、〜」)の除去 | system で「前置きなしで直接答えよ」/ XML 形式タグ |
| 中断した応答の継続 | 中断テキストをユーザーターンに移して続けさせる |

- **機械処理する出力は構造化出力で強制する**: パラメータは `output_config.format`。制約付きデコードでスキーマ準拠を保証します(基本は [構造化出力](structured-output.md) が正本。ここでは Claude のパラメータ名だけ押さえます)
- **形式は「するな」でなく「せよ」で誘導**: 「markdown を使うな」より「散文の段落で書いて」。加えて、プロンプト自体のスタイルが出力に伝染します(プロンプトから markdown を除くと出力の markdown も減る)
- **数式は既定で LaTeX**: プレーンテキストが要るなら明示的に指示します

### 長文・長コンテキストの作法

大きな文書(20k トークン超)を扱うときの Claude 固有の配置作法です。

- **長文データは上、クエリは末尾**: 長い資料を指示・例より前に置き、質問を末尾に置くと応答品質が上がります(公式テストで最大 30% 向上との自己報告)
- **文書は XML で構造化**: 複数文書は `<document>` で囲み、`<document_content>` と `<source>` のサブタグを付けます
- **引用でグラウンディングする**: 作業前に関連箇所を `<quotes>` に引用させてから本題に入らせると、ノイズを切り分けられます(汎用の「引用させてから答えさせる」の Claude 版。[上級パターンの長文処理](prompt-engineering-patterns.md))

### ツール使用・エージェント文脈

- **行動させたいなら明示する**: 最新モデルは精密な指示追従に振れており、「変更を提案できますか」だと提案だけで実装しないことがあります。「この関数を変更して」と行動を明示します
- **強調のトーンを下げる**: 「CRITICAL: You MUST use this tool...」は最新モデルでは過剰反応(over-trigger)を招きます。「Use this tool when...」程度に抑えます
- **ツールを使ってほしいのに使わないなら、定義側に「いつ・どう使うか」を書く**: effort を上げるとツール使用も増えます(特に Opus 4.8)
- **サブエージェント委任は控えめが既定**: 最新世代は明示指示なしでは委任を控えます。並列で回したいなら「独立した作業は委任する」と明示します(コンテキスト分離の設計は [圧縮と隔離](../02-architecture/context-compaction-and-isolation.md))

### 世代交代で見直すこと

Claude はモデル更新のたびにプロンプトを見直す前提です(2026-07 時点で最新世代に共通する変化)。

- **逐語的な解釈**: 指示を暗黙に一般化しなくなりました。広く適用したい規則はスコープを明示します(「最初のセクションだけでなく全セクションに適用して」)
- **冗長性の自動調整**: タスクの複雑さで応答長を変えます。固定の長さが要るなら明示します
- **補助プロンプトを外す**: 「3 ツールごとに進捗を要約」のような強制スキャフォールドや anti-laziness 系の指示は、内蔵の挙動改善により不要・逆効果になりがちです
- **API の非互換に対応**: `temperature` / `top_p` / `top_k` の非既定値は最新世代で 400 エラーです。挙動誘導はプロンプトで行います。新トークナイザ(Opus 4.7 以降)で同じ文章が最大約 35% 多くトークン化されるため、`max_tokens` に余裕を持たせます

移行作業の運用(回帰評価・段階リリース)は [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) が正本です。

### 効かない・不要になった俗説

以下は Claude 公式が明示的に非推奨・非対応としたもの(またはその副作用)です。**逆に、XML タグ・few-shot・役割付与・長文配置は陳腐化していません** — 陳腐化したのは「モデルの弱さを補う強制系ハック」です。

- **prefill 依存**: 最新世代で 400。構造化出力・system 指示へ
- **`budget_tokens` 依存**: 最新世代で 400。effort へ
- **過度な `CRITICAL` / `MUST` / 全大文字強調**: over-trigger を招く
- **「If in doubt, use [tool]」「Default to using [tool]」**: 過剰なツール起動の原因
- **temperature でのデザイン多様性**: 400 エラー。「先に複数案を提示させる」方式へ

## 実務での注意点

### アンチパターン

- **他モデル向けのマークダウン主体プロンプトをそのまま流用する** → Claude は XML タグの方が構造を正確に読む → 区切りを XML タグに置き換えて回帰評価する
- **prefill・`budget_tokens`・`temperature` を最新世代に送る** → 400 エラーで動かない、または静かに無効化される → 構造化出力・effort・プロンプト誘導へ移行する
- **旧世代向けの強い強調(CRITICAL/MUST)を残す** → 最新世代で過剰反応し、意図しないツール起動や冗長化を招く → トーンを下げ、必要な箇所だけ明示する
- **モデル更新後に無検証で使い続ける** → 逐語的解釈・冗長性調整・トークナイザ変更で挙動とコストがずれる → 更新時に評価セットで再検証する
- **バージョン固有の書き方を「Claude 一般の作法」と誤解する** → 世代交代で崩れる → 「〜時点」で記録し、公式の移行ガイドを追う

### チェックリスト

- [ ] 指示・文脈・例・入力を XML タグで区切っている
- [ ] 役割をシステムプロンプトで与え、重要な指示に「なぜ」を添えた
- [ ] 思考制御をアダプティブ思考 + effort で行い、`budget_tokens` を使っていない
- [ ] 最終ターンの prefill・非既定サンプリングパラメータを最新世代に送っていない
- [ ] 機械処理する出力を `output_config.format`(構造化出力)で強制している
- [ ] 長文は上・クエリは末尾に配置し、文書を XML で構造化した
- [ ] 使用モデルの世代と、その世代向けの公式プロンプト推奨を確認した
- [ ] モデル更新時に評価セットで再検証する運用がある

## 関連トピック

- [プロンプトエンジニアリングの基礎技法](prompt-engineering-fundamentals.md) — 汎用技法(本記事の前提)
- [プロンプトエンジニアリングの上級パターン](prompt-engineering-patterns.md) — なぜ効くかの中立な原理
- [モデル間の違いと移行(横断比較)](cross-model-prompting.md) — OpenAI・Gemini との横並びと乗り換え
- [OpenAI(GPT 系)特化プロンプティングガイド](openai-prompting.md) — 対になるベンダー別ガイド
- [Gemini 特化プロンプティングガイド](gemini-prompting.md) — 対になるベンダー別ガイド
- [モデル選定ガイド](model-selection.md) / [モデルカタログ](llm-landscape.md) — Claude の選び方
- [バージョニングとモデル更新追従](../05-operations/versioning-and-model-updates.md) — 世代交代への追従運用
- [構造化出力](structured-output.md) — `output_config.format` の設計

## 参考資料

- [Prompt engineering overview(Anthropic)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview) — プロンプト設計の入口(アクセス日: 2026-07-08)
- [Claude prompting best practices(Anthropic)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — 全モデル共通技法 + モデル別ガイド + 移行考慮点の正本(アクセス日: 2026-07-08)
- [Adaptive thinking(Anthropic)](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) / [Effort(Anthropic)](https://platform.claude.com/docs/en/build-with-claude/effort) — 思考制御の仕様(アクセス日: 2026-07-08)
- [Structured outputs(Anthropic)](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — `output_config.format` の仕様(アクセス日: 2026-07-08)
- [Model migration guide(Anthropic)](https://platform.claude.com/docs/en/about-claude/models/migration-guide) — 世代間の変更点(prefill 廃止・サンプリング・トークナイザ)(アクセス日: 2026-07-08)

## TODO・未確認事項

> **TODO(要確認):** `stop_sequences` の現行 Messages API での扱い(最新モデルでの対応可否)を公式 API リファレンスで確認する。best practices ページ上ではプロンプト技法として特筆されず、prefill・構造化出力に置き換わっている(最終確認: 2026-07)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** 四半期ごとに Anthropic 公式の「Claude prompting best practices」「adaptive thinking」「effort」ページで次を再確認する(更新起点: `research/prompting/anthropic.md`、最終確認: 2026-07):
>
> - モデル世代・ラインアップ(現在: Fable 5 / Opus 4.8・4.7 / Sonnet 5 / Haiku 4.5)
> - アダプティブ思考の対応と既定(常時オン / 既定オン / 明示オン / 手動不可の別)、`budget_tokens` 廃止の範囲
> - effort のレベル名・`xhigh` の対応モデル・モデル別推奨開始点
> - prefill 非対応の境界(現在: 4.6 以降)、`output_format` → `output_config.format` の旧名サポート終了
> - ミッドセッション system メッセージの対応モデル(現在: Opus 4.8 のみ)
> - 公式ドキュメント構成(個別テクニックページ → 単一 best practices ページへの統合が進行中)
