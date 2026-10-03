---
title: "構造化出力"
category: "implementation"
level: "intermediate"
status: "published"
last_updated: "2026-10-03"
tags: ["structured-output", "function-calling"]
---

# 構造化出力

## この記事の目的

LLM の出力を後続のコードで安全に処理するために、出力をスキーマに従わせる手法(プロンプト指示・ツール定義の流用・ネイティブの構造化出力機能)を使い分け、検証と再生成のループを設計できるようになります。

## 対象読者

- LLM の出力をプログラムでパースして使うパイプライン・Agent を実装するエンジニア
- 「たまに JSON が壊れる」問題を仕組みで解決したいエンジニア

## 前提知識

- [ツール使用](../01-concepts/tool-use.md) — スキーマでモデルの出力を構造化する仕組み
- [Workflow 型 vs Agent 型の使い分け](../02-architecture/workflow-vs-agent.md) — 構造化出力が活きる固定パイプライン

## 本文

### 概要: 「読む出力」と「処理する出力」を区別する

人間が読む文章と違い、**後続の処理がコードである出力**(分類ラベル、抽出データ、評価スコア、ルーターの判定)は、形式が 1 文字ずれるだけで壊れます。構造化出力(structured output)とは、この種の出力を JSON Schema などの機械可読なスキーマに従わせる技術です。

### 詳細: 3 つの手法

| 手法 | 仕組み | 保証の強さ |
| --- | --- | --- |
| プロンプト指示 | 「次の JSON 形式で答えてください」と指示する | 弱い(逸脱・余計な前置き・コードフェンス混入が起きる) |
| ツール定義の流用 | 出力形式をツールの入力スキーマとして定義し、そのツールを呼ばせる | 通常はベストエフォート。対応モデル・対応スキーマ・strict 設定などが満たされ、正常に完了した呼出しでは強い形式保証を使える場合があります |
| ネイティブの構造化出力機能 | API に対応スキーマと設定を渡す | 正常完了した構造化応答に形式保証。拒否・打切り・設定エラーを別に処理する必要があります |

新規実装ではネイティブ機能の対応モデル・スキーマ制約・設定と例外状態を先に確認します。未対応の環境でツール流用や指示だけへ切り替える場合は、保証が同じとは扱わず、後段の検証で補います。OpenAI の具体例は 2026-10-03 の公式ガイドで確認しています。`strict: true` と対応 JSON Schema を使い、拒否や打切りがない正常完了した構造化応答が保証の対象です。

> **TODO(要確認):** 各社の構造化出力機能の名称・スキーマ制約(サポートされる JSON Schema のサブセット)・対応モデルを公式ドキュメントで確認する(最終確認: 2026-07)

### 詳細: スキーマ設計の勘所

- **最小のスキーマにする** — 使わないフィールドを要求しない。フィールドが多いほど品質は下がり、コストは上がります
- **enum を活用しつつ、逃げ道を用意する** — 分類ラベルを enum で固定するのは有効ですが、「その他 / 判定不能」の選択肢がないと、モデルはどれにも該当しない入力を**最も近いラベルに無理やり押し込みます**。強制は幻覚を生みます
- **判断の根拠フィールドを先に置く** — `{"reasoning": "...", "label": "..."}` のように理由を先に出力させると、結論だけを求めるより判定品質が上がる傾向があります
- **数値・日付は形式を固定する** — 「金額」を自由文字列にすると「1,280円」「¥1280」「約1300」が混在します。number 型・ISO 8601 などに固定します

### 詳細: 検証と再生成のループ

ネイティブ機能でも、業務ルールのレベル(合計値の整合、参照先の実在)までは保証されません。まず応答状態を分け、正常完了だけを構造・業務検証へ渡します。拒否や打切りをパース失敗として再生成すると、拒否を回避したり不完全な値を使ったりする危険があります。

```python
# ベンダー中立の擬似コード。adapter が API 固有の状態を正規化します
MAX_RETRIES = 2

def extract(text: str) -> dict:
    prompt = build_prompt(text)
    budget = INITIAL_OUTPUT_BUDGET
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = adapter.call(prompt, schema=EXPENSE_SCHEMA,
                                    strict=True, output_budget=budget)
        except UnsupportedSchemaOrSetting as error:
            # 運用担当が対応スキーマ/モデル/設定へ訂正。同じ設定で再送しません
            raise ConfigurationCorrectionRequired(error)
        if response.refusal:
            # 通知して停止。拒否を形式エラーとして再生成しません
            raise ExtractionRefused(response.refusal)
        if response.status == "incomplete":
            if response.reason == "output_limit" and attempt < MAX_RETRIES:
                budget = increase_within_cost_limit(budget)
                continue   # 打切り出力は利用せず、予算内で再生成します
            # 安全制約による打切り、理由不明、上限到達は停止・通知します
            raise ExtractionIncomplete(response.reason)
        if response.status != "completed":
            raise ExtractionFailed(response.status)
        result, errors = validate(response.output)  # スキーマ + 業務ルール
        if not errors:
            return result
        if attempt == MAX_RETRIES:
            raise ExtractionFailed(errors)
        prompt = build_retry_prompt(text, response.output, errors)
    raise ExtractionFailed(errors)
```

adapter の `output_limit` は API 固有の理由を正規化した名前です。予算を増やせない場合も停止します。再生成するのは訂正可能な正常応答の検証失敗、または理由と予算が明確な打切りだけで、共通の回数上限を消費します。後続の登録・送信などの副作用は検証成功後に行い、抽出の再生成と外部操作の再実行を分けます。

OpenAI Responses API の例では、`status == "incomplete"` と `incomplete_details.reason`(例: `max_output_tokens`)、出力中の `refusal` を正常完了と分けます。非対応スキーマを `strict: true` で渡すと設定エラーになります。JSON モードは JSON としての妥当性を目的とし、指定スキーマへの準拠保証とは別です。SDK・APIごとのフィールドは [OpenAI特化ガイド](openai-prompting.md) と公式資料で照合してください。

### 設計判断: どこまで構造化するか

すべての出力を構造化すべきではありません。ユーザーに読ませる文章を JSON に詰めると、文章品質が下がることがあります。使い分けの目安:

- 後続がコード → 構造化する
- 後続が人間 → 自由文で書かせる
- 両方(要約 + メタデータなど)→ 構造化フィールドの中に自由文フィールドを持たせる

## 実務での注意点

### アンチパターン

- **逃げ道のない enum** → 該当なしの入力が最も近いラベルに誤分類され、静かに品質が劣化する → 「その他」「判定不能」を必ず入れ、その割合を監視する
- **巨大な一発スキーマ** → 数十フィールドを 1 回の呼び出しで埋めさせると、後半のフィールドの品質が落ちる → 独立した関心事ごとに呼び出しを分ける([オーケストレーションパターン](../02-architecture/orchestration-patterns.md) の直列・並列)
- **検証なしのパース** → スキーマ準拠 = 内容が正しい、ではない → 業務ルール検証(値域・整合性・実在チェック)を必ず挟む
- **拒否・打切り・設定エラーをすべて再生成する** → 拒否の回避や同じ設定エラーの反復、不完全な値の利用につながる → 状態を先に分岐し、拒否は停止、打切りは理由別の上限付き処理、設定エラーは設定訂正へ渡す

### チェックリスト

- [ ] 後続処理がコードである出力に、指示だけでなくスキーマによる強制を使っている
- [ ] 分類 enum に「その他 / 判定不能」の逃げ道がある
- [ ] スキーマ検証 + 業務ルール検証を通ってから後続処理に渡している
- [ ] 対応モデル・スキーマ・strict 設定と正常完了という保証条件を確認した
- [ ] 正常完了・拒否・打切り・設定エラーの処理先を分け、拒否は自動再生成しない
- [ ] 打切り理由を確認し、予算内の再生成だけを許し、不完全な出力は後続へ渡さない
- [ ] 再生成にエラー内容を添え、回数上限がある
- [ ] 「その他」判定率・再生成率をモニタリングしている

## 関連トピック

- [ツール使用](../01-concepts/tool-use.md) — スキーマ強制の原型
- [Agent 向けプロンプト設計](agent-prompt-design.md) — 指示ベースの出力制御との使い分け
- [ツール定義の設計](tool-definition-design.md) — スキーマ設計の共通原則(enum・形式例)
- [LLM-as-a-Judge](../04-evaluation/llm-as-a-judge.md) — 評価スコアという構造化出力の代表例
- [ドキュメント AI(帳票・PDF の構造化)](../12-multimodal/document-ai.md) — 文書からの抽出結果を型で保証する応用(形式保証と内容保証の違い)
- [examples/python/structured-output/](../../examples/python/structured-output/README.md) — スキーマ検証 + リトライの最小実装(モック実行可)

## 参考資料

- [Structured outputs(Anthropic docs)](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — ネイティブ構造化出力の仕様(アクセス日: 2026-07-05)
- [Structured model outputs(OpenAI)](https://developers.openai.com/api/docs/guides/structured-outputs) — strict設定、拒否、incomplete、非対応スキーマの処理(アクセス日: 2026-10-03)

## TODO・未確認事項

> **TODO(要確認):** 各社の構造化出力機能の名称・スキーマ制約(サポートされる JSON Schema のサブセット)・対応モデルを公式ドキュメントで確認する(最終確認: 2026-07)
