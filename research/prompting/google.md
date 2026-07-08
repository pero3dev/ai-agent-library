# PE-R3 調査メモ — Google(Gemini)公式プロンプト推奨

- **調査日**: 2026-07-08
- **調査目的**: プロンプトエンジニアリング系ドキュメントの執筆材料。「Google(Gemini)公式が推奨するプロンプト設計」を、公式一次情報のみで整理する。**本メモは非公開の執筆用整理**であり、そのまま公開ドキュメントにはしない
- **根拠の方針**: `ai.google.dev`(Gemini API docs)および `cloud.google.com` / `docs.cloud.google.com`(Vertex / Gemini Enterprise Agent Platform)の公式ページを WebFetch / WebSearch で直接確認。二次情報(個人ブログ・まとめ)は確度を落として補助的にのみ扱う
- **鮮度の注意**: 調査者(Claude)の知識カットオフより現在(2026-07-08)が新しい。モデル名・機能名は記憶で断定せず公式ページで確認した。確認できない世代・機能は「未確認」とした
- **確度凡例**:
  - **公式確認済み** = `ai.google.dev` / `cloud.google.com` の公式ページを今回直接確認
  - **ベンダー自己報告** = 公式ブログ・リリースノートなど公式だが技術ドキュメント外の情報
  - **二次情報** = 一次情報に未到達で、まとめ記事等で補った情報
  - **未確認** = 今回確認できず(本文に断定を書かない)
- **重要な留意**: WebFetch の本文抽出は小型モデルによる要約を経ているため、**API のフィールド名・引数名の正確な綴りは実装時に公式リファレンスで再確認すること**(要約が SDK 名と REST 名を正規化している可能性)。特に構造化出力・ツール関連のフィールド名にはこの注記が当てはまる。

---

## 0. 前提: 現行モデル世代とプロンプト API 面(2026-07 時点)

プロンプト推奨は世代・API 面に強く依存するため、まず土台を固定する。

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| 2026-07 時点の現行フロンティア系は **Gemini 3 系**。GA(安定)は **Gemini 3.5 Flash**(モデル ID `gemini-3.5-flash`)と **Gemini 3.1 Flash-Lite**。プレビューに **Gemini 3.1 Pro**、**Gemini 3 Flash** などがある。**Gemini 2.5 系(Pro / Flash / Flash-Lite)** も引き続き提供・安定版として利用可 | https://ai.google.dev/gemini-api/docs/models / 2026-07-08 / 公式確認済み |
| Gemini 3.5 Flash は **入力 100 万(1M)トークンのコンテキストウィンドウ**、出力は最大 65k トークン。GA・本番利用可。既定の thinking は `medium` | https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5(検索経由要約)/ 2026-07-08 / ベンダー自己報告(リリースノート由来。数値は実装時に models ページで再確認) |
| **API 面が移行中**: 新しい **Interactions API** が「2026-06 時点で GA、新規プロジェクトの推奨インターフェース」。従来の **`generateContent` は legacy 扱いだが引き続きフルサポート** | https://ai.google.dev/gemini-api/docs/interactions-overview / 2026-07-08 / 公式確認済み |
| Interactions API のステートフル機能: `store=true`(既定、有料 55 日 / 無料 1 日 保持)、`previous_interaction_id` でサーバー側に会話履歴を保持。`store=false` で保存を無効化。パラメータ(`system_instruction` / `tools` / `generation_config` など)は原則 interaction スコープで毎回指定 | https://ai.google.dev/gemini-api/docs/interactions-overview / 2026-07-08 / 公式確認済み |

> **TODO(要確認):** Gemini 3.5 Flash の正確なコンテキスト長・出力上限・ナレッジカットオフを models ページ本体で確認する(今回 `models.md.txt` は数値を返さなかった)(最終確認: 2026-07-08)

---

## 1. メッセージ構造(system instruction の扱い)

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| **重要な指示は System Instruction かユーザープロンプト冒頭に置く**。原文: 「Place essential behavioral constraints, role definitions (persona), and output format requirements in the System Instruction or at the very beginning of the user prompt」。役割(ペルソナ)・振る舞い制約・出力フォーマットが対象 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| `system_instruction` は独立フィールドとして渡す。Interactions API では interaction ごとに `system_instruction` を指定(例: `"system_instruction": "You are a cat. Your name is Neko."`)。legacy generateContent でも system instruction フィールドあり | https://ai.google.dev/gemini-api/docs/interactions-overview, https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み(具体例文言は検索要約経由) |
| Gemini 3 の推奨スタイルは **簡潔・直接**。原文: 「Be precise and direct: State your goal clearly and concisely」「Avoid unnecessary or overly persuasive language」。冗長な言い回し・過度に説得的な言葉は不要 | https://ai.google.dev/gemini-api/docs/prompting-strategies, https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |

**小括**: Anthropic 同様「システム指示に役割・制約・出力形式を寄せる」が基本。Gemini 3 では「丁寧・説得的な前置きより、簡潔で直接的な指示」を明示的に推奨している点が特徴。

---

## 2. 構造化の推奨記法(区切り・見出し・制約の書き方)

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| **明確な区切り(delimiter)でプロンプトの各部を分離する**。原文: 「Use consistent structure: Employ clear delimiters to separate different parts」。推奨は **XML タグまたは Markdown 見出し** | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| XML 構造テンプレート例: `<role>…</role>` / `<constraints>1. … 2. …</constraints>` / `<context>[入力]</context>` / `<task>[要求]</task>` | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| Markdown 構造テンプレート例: `# Identity`(役割)/ `# Constraints`(制約、箇条書き) | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **曖昧語は定義する**。原文: 「Define parameters: Explicitly explain any ambiguous terms」 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **制約(constraints)を明示**する: 何をすべきか/すべきでないかを指定。出力フォーマットも指定(table / bulleted list / keywords / sentence / paragraph など) | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| Vertex / Gemini Enterprise Agent Platform 側の戦略一覧にも「Structure prompts」「Use system instructions」「Give clear and specific instructions」「Add contextual information」が並ぶ(古典的な入力/出力/例の**プレフィックス(prefix)**戦略は、今回の抽出では詳細本文を取得できず) | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/prompt-design-strategies / 2026-07-08 / 公式確認済み(戦略の見出しのみ。プレフィックス詳細は未取得) |

**小括**: Gemini 3 は **XML タグと Markdown 見出しの両方を公式に許容**(Anthropic が XML を強調するのと対照的に、Gemini は Markdown 見出しも同格で例示)。「一貫した区切り」が鍵。

> **TODO(要確認):** Vertex の「Use affixes / prefixes(input/output/example prefix)」の現行推奨本文を取得する(今回 cloud ページ本体を取得できず)(最終確認: 2026-07-08)

---

## 3. 例示(few-shot)の公式推奨

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| **常に few-shot 例を入れることを推奨**。原文: 「We recommend to always include few-shot examples in your prompts」。さらに「Prompts without few-shot examples are likely to be less effective」 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| few-shot 例は **フォーマット・言い回し・スコープ・パターン**を規定する(「formatting, phrasing, scoping, or general patterning」) | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **例の数は実験して最適化**。少数でパターンを掴めることが多いが、**多すぎると例へ過学習(overfitting)**する | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **全例で構造・フォーマットを統一する**。ばらつくと望まない出力形式を招く(「Make sure that the structure and formatting of few-shot examples are the same」) | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |

**小括**: Google は他社より **few-shot を明確に「常時推奨」**する傾向がはっきり確認できた。「例のフォーマット統一」「多すぎると過学習」が実務上の 2 大注意点。

---

## 4. 思考の制御(thinking / thinking budget)

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| Gemini 3 系の思考制御パラメータは **`thinking_level`**。値は **`minimal` / `low` / `medium` / `high`**。原文: 「Gemini 3 treats these levels as relative allowances for thinking rather than strict token guarantees」(=トークン厳密保証ではなく相対的な思考量の許容) | https://ai.google.dev/gemini-api/docs/gemini-3, https://ai.google.dev/gemini-api/docs/thinking / 2026-07-08 / 公式確認済み |
| モデル別の既定と対応(thinking ページの表): `gemini-3.5-flash` 既定 `medium`(minimal〜high 対応)、`gemini-3-flash-preview` 既定 `high`、`gemini-3-pro-preview` 既定 `high`(`low` / `high` のみ)、`gemini-3.1-pro-preview` 既定 `high`、`gemini-2.5-pro` / `2.5-flash` は「on」、`2.5-flash-lite` は「off」既定 | https://ai.google.dev/gemini-api/docs/thinking / 2026-07-08 / 公式確認済み |
| `minimal` は最速・最小思考で **Gemini 3.1 Flash-Lite と 3 Flash のみ**対応 | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **legacy の `thinking_budget` は引き続きサポートされるが、`thinking_level` と同一リクエストで併用しない**こと | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| Gemini は既定で**動的思考(dynamic thinking)**。原文: 「Gemini models engage in dynamic thinking by default, automatically adjusting the amount of reasoning effort based on the complexity of the request」 | https://ai.google.dev/gemini-api/docs/thinking / 2026-07-08 / 公式確認済み |
| **Thought signatures**(思考署名)= 「encrypted representations of the model's internal reasoning state」。マルチターンの推論継続に必要。SDK が自動処理(手動設定不要)。ステートレス運用では過去の thought ブロックを不変のまま再送する必要がある | https://ai.google.dev/gemini-api/docs/thinking, https://ai.google.dev/gemini-api/docs/function-calling / 2026-07-08 / 公式確認済み |
| **Thought summaries**(思考要約)は制御可能。既定では最終出力のみ返る。単純リクエストや明示無効時は空になりうる | https://ai.google.dev/gemini-api/docs/thinking / 2026-07-08 / 公式確認済み(`thinking_summaries` などの正確なフィールド名は要約経由のため要再確認) |

**小括**: **世代で書き方が変わる最重要ポイント**。Gemini 3 は `thinking_level`(相対的許容)、2.5 は on/off + level、budget は数値指定という**併存状態**。プロンプト設計としては「複雑な CoT の作り込みをやめ、`thinking_level: high` に任せる」が公式の移行方針(§8 参照)。

> **TODO(要確認):** `thinking_budget` の数値レンジ(-1=動的、0=無効、モデル別上限)の現行仕様を thinking ページ本文で確認する(今回の要約には数値レンジが含まれず)(最終確認: 2026-07-08)

---

## 5. 出力制御(構造化出力 / 停止 / prefill 相当)

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| **構造化出力**は「JSON スキーマ + JSON MIME タイプ」で強制。legacy generateContent では `generationConfig` の **`response_mime_type: "application/json"` + `response_schema`**。新 API では **`response_format`**(`mime_type: application/json` + `schema`)を使う | https://ai.google.dev/gemini-api/docs/structured-output, https://ai.google.dev/gemini-api/docs/interactions-overview / 2026-07-08 / 公式確認済み(新旧フィールド名は要約経由のため実装時に再確認) |
| サポートする JSON スキーマ型: `string` / `number` / `integer` / `boolean` / `object` / `array` / `null`。補助: `title` / `description`(モデル誘導に有効)、`enum`(分類・値制限)、`format`(`date-time` / `date` / `time`)、`properties` / `required`、`items`、`minimum` / `maximum`、`minItems` / `maxItems` | https://ai.google.dev/gemini-api/docs/structured-output / 2026-07-08 / 公式確認済み |
| ベストプラクティス: **`description` フィールドでモデルを誘導**、**具体的な型(`integer` / `enum`)を使う**、スキーマが正でも**アプリ側で必ず検証**しエラー処理を実装 | https://ai.google.dev/gemini-api/docs/structured-output / 2026-07-08 / 公式確認済み |
| 制限: **非常に大きい/深くネストしたスキーマは拒否されうる**。JSON スキーマの**サブセットのみ**対応 | https://ai.google.dev/gemini-api/docs/structured-output / 2026-07-08 / 公式確認済み |
| **構造化出力は組み込みツールと併用可**(Google Search / URL Context / Code Execution / File Search / Function Calling、Gemini 3 系で)。単一 API 呼び出しで `response_format` とツールを組み合わせられる | https://ai.google.dev/gemini-api/docs/structured-output, https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **停止制御**: `stop_sequences` で生成停止語を指定。`max_output_tokens` で長さ上限 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **出力の詳しさ(verbosity)**: Gemini 3 は既定で**直接的・簡潔**。原文: 「By default, Gemini 3 models provide direct and efficient answers」。会話的/詳細な回答が欲しければ**明示的に要求**する(例: system instruction に「All questions should be answered comprehensively with details, unless the user requests a concise response」) | https://ai.google.dev/gemini-api/docs/prompting-strategies, https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **temperature は既定 1.0 のまま推奨**。Gemini 3.x で 1.0 未満に下げると「looping や性能劣化」を招きうる(「Changing the temperature (setting it below 1.0) may lead to unexpected behavior, such as looping or degraded performance」)。topK / topP / temperature 等も**既定維持を強く推奨** | https://ai.google.dev/gemini-api/docs/gemini-3, https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **prefill(アシスタント発話の先頭を固定)相当**: Vertex の古典戦略に「Let the model complete partial input(部分入力の補完)」があるが、今回の抽出では現行本文を取得できず。Gemini 3 / Interactions API での可否は**未確認** | — / 2026-07-08 / 未確認 |

**小括**: 出力形式は **JSON スキーマ強制**が中核。**Gemini 3.x は「サンプリング系パラメータをいじらない」ことが強い公式推奨**で、これは他社(温度で決定性を上げる慣行)と逆向きなので要注意。

> **TODO(要確認):** Gemini(Interactions / generateContent)で「アシスタント応答の prefill(先頭固定)」が可能かを公式リファレンスで確認する(最終確認: 2026-07-08)

---

## 6. 長文・長コンテキスト・マルチモーダルの作法

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| コンテキストは **100 万(1M)トークン以上**(「50,000 lines of code」「8 average length English novels」に相当と例示) | https://ai.google.dev/gemini-api/docs/long-context / 2026-07-08 / 公式確認済み |
| **資料を先・指示/質問を最後に置く**。原文: 「the model's performance will be better if you put your query / question at the end of the prompt (after all the other context)」。大きなデータブロックの後は明確な**転換句**(「Based on the information above…」)を挟む | https://ai.google.dev/gemini-api/docs/long-context, https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **コンテキストキャッシュ**が長文運用の主要最適化。繰り返し使う前置き資料をキャッシュしてコスト削減 | https://ai.google.dev/gemini-api/docs/long-context / 2026-07-08 / 公式確認済み |
| 単一クエリ検索は**最大 99% 精度**の例があるが、**複数箇所を同時検索させると精度は低下**しうる(「Performance can vary to a wide degree depending on the context」) | https://ai.google.dev/gemini-api/docs/long-context / 2026-07-08 / 公式確認済み |
| **マルチモーダルは text / image / audio / video を「equal-class(同格)入力」として扱う**。原文: 「treat them as equal-class inputs」「Ensure your instructions clearly reference each modality as needed」。指示側で各モダリティを明確に参照する | https://ai.google.dev/gemini-api/docs/prompting-strategies, https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| Gemini 3 の **`media_resolution_high`** 設定を検証すること(高解像度で PDF のトークン消費が増えうる)。**画像セグメンテーションは Gemini 3 非対応**で、必要なら Gemini 2.5 を継続使用 | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |

**小括**: 「**資料先・質問後**」は Google が最も一貫して繰り返す長文作法。マルチモーダルは「モダリティを本文で明示参照」「各入力を同格に扱う」が要点。

---

## 7. ツール使用・function calling・エージェント文脈

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| **関数宣言は明確・簡潔に**: 目的の説明、各パラメータの型と説明を書く。名前は underscore か camelCase(スペース・特殊文字を避ける)。**強い型付け**(`integer` / `string` / `enum`)を使う | https://ai.google.dev/gemini-api/docs/function-calling / 2026-07-08 / 公式確認済み |
| **呼び出しモード**(`tool_choice` 相当): `auto`(既定・モデルが判断)/ `any`(必ず関数を呼ぶ)/ `none`(呼ばない)/ `validated`(プレビュー、スキーマ遵守を保証) | https://ai.google.dev/gemini-api/docs/function-calling / 2026-07-08 / 公式確認済み(フィールド名 `tool_choice` の綴りは要約経由。REST では `tool_config`/`function_calling_config.mode` の可能性あり、実装時要確認) |
| **並列(parallel)呼び出し**(独立した複数関数を同時)と**合成(compositional)呼び出し**(依存関数を逐次連鎖)に対応 | https://ai.google.dev/gemini-api/docs/function-calling / 2026-07-08 / 公式確認済み |
| **組み込みツール(`google_search` 等)とカスタム関数を併用可**。`previous_interaction_id` を渡すと組み込みツールのコンテキストが自動で引き継がれる | https://ai.google.dev/gemini-api/docs/function-calling / 2026-07-08 / 公式確認済み |
| プロンプト上の実務: 十分な文脈と指示を与える、実行前に関数呼び出しを検証、堅牢なエラー処理、**アクティブなツール数は 10〜20 個までに制限**を推奨 | https://ai.google.dev/gemini-api/docs/function-calling / 2026-07-08 / 公式確認済み |
| Gemini 3 系は内部思考で function calling を強化。**思考署名は SDK が自動処理**(手動設定不要) | https://ai.google.dev/gemini-api/docs/function-calling / 2026-07-08 / 公式確認済み |
| **エージェント的ワークフローの system instruction 設計軸**(prompting-strategies に列挙): 推論の分解・診断の深さ・情報網羅性の度合い / 新情報への適応 vs 計画厳守 / エラー回復の粘り強さ / 明確化を求める vs 仮定して進む / 低リスクな読み取りと高リスクな状態変更の区別 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| Gemini 3 系は **Computer Use / ツール組み合わせ / Maps grounding** に対応(2.5 からの新規) | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |

**小括**: エージェント文脈では「ツール数を絞る(10〜20)」「思考署名は SDK 任せ」「system instruction で自律度・リスク許容・明確化ポリシーを明示」が公式の勘所。

---

## 8. 世代間の移行注意(2.5 → 3、budget → level、generateContent → Interactions)

| 事実 | 出典 URL / 確認日 / 確度 |
| --- | --- |
| **複雑な chain-of-thought の作り込みをやめ、`thinking_level: "high"` に置き換える**(「Replace complex chain-of-thought engineering with thinking_level: high」) | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **決定性を狙った明示的な temperature 設定を外す**(既定 1.0 に戻す) | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **`media_resolution_high` を検証**(PDF のトークン消費増に注意)。**画像セグメンテーションが必要なら 2.5 を継続** | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **Gemini 3 は既定で簡潔**なので、2.5 で得ていた冗長さが欲しければ明示的に会話的トーンを要求 | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **`thinking_budget`(数値)→ `thinking_level`(相対許容)** へ。併用しない | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **`generateContent`(legacy)→ Interactions API(2026-06 GA・推奨)**。ステートフル運用(`store` / `previous_interaction_id`)が使えるが、一部機能(例: `video_metadata` の切り出し/フレームレート)は Interactions API 未対応で generateContent 側に残る | https://ai.google.dev/gemini-api/docs/interactions-overview / 2026-07-08 / 公式確認済み |

---

## 9. 「効かない/不要になった俗説」(公式が非推奨・不要とするもの)

| 項目 | 公式の立場 | 出典 URL / 確認日 / 確度 |
| --- | --- | --- |
| **過度に丁寧・説得的な前置き**(「あなたは超優秀で、どうかお願いします」的な誘導) | 不要。「Avoid unnecessary or overly persuasive language」。直接的で構造化されたプロンプトが最良 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **手作りの CoT スキャフォールド**(「ステップごとに考えて…」を長々と書く) | Gemini 3 では不要。`thinking_level` に任せる方針に置き換え | https://ai.google.dev/gemini-api/docs/gemini-3 / 2026-07-08 / 公式確認済み |
| **決定性のための低 temperature 常用** | Gemini 3.x では非推奨。1.0 未満で looping / 劣化を招きうる。サンプリング系は既定維持を強く推奨 | https://ai.google.dev/gemini-api/docs/gemini-3, https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **few-shot なしでいける** | 非推奨。few-shot なしは「効果が落ちやすい」と明言 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |
| **例を大量に盛る** | 逆効果。多すぎると例へ過学習 | https://ai.google.dev/gemini-api/docs/prompting-strategies / 2026-07-08 / 公式確認済み |

補足(Gemini 3 特有の運用 tip、公式確認済み): 最新情報の扱いでは system instruction に「現在年」節(例: 「Remember it is 2026 this year」)やナレッジカットオフ節を明示し、grounding を使う場合は「提供情報に限定する」旨を書くと安定する、と公式が例示。

---

## 10. 変わりやすい項目(定点観測すべきもの)

以下は世代・API 更新で高頻度に変化する。公開ドキュメント本文には断定を避け、更新監視の対象にする。

- **現行モデル世代とモデル ID**(2026-07: `gemini-3.5-flash` GA、`gemini-3.1-pro-preview` 等プレビュー。次世代でリネームされうる) — https://ai.google.dev/gemini-api/docs/models
- **API 面**(Interactions API が primary / generateContent が legacy。移行が進行中) — https://ai.google.dev/gemini-api/docs/interactions-overview
- **thinking 制御の書き方**(`thinking_level` の値・モデル別既定、`thinking_budget` の数値レンジ、`minimal` 対応モデル) — https://ai.google.dev/gemini-api/docs/thinking
- **構造化出力のフィールド名**(`response_format` vs `response_mime_type` + `response_schema`、対応スキーマ機能) — https://ai.google.dev/gemini-api/docs/structured-output
- **サンプリング系の推奨**(「既定維持」が現行の推奨。将来緩む可能性) — https://ai.google.dev/gemini-api/docs/gemini-3
- **マルチモーダル解像度設定**(`media_resolution_high` の挙動・PDF トークン消費、画像セグメンテーション対応世代) — https://ai.google.dev/gemini-api/docs/gemini-3
- **ナレッジカットオフの推奨クローズ文**(「現在年」やカットオフ節の推奨は世代で変わる) — https://ai.google.dev/gemini-api/docs/prompting-strategies

---

## WebFetch 失敗・取得不能の記録

| 対象 URL | 状況 | 影響 |
| --- | --- | --- |
| https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/gemini-3-prompting-guide | 本文が取得できずナビゲーションのみ返却。Cloud 側 Gemini 3 プロンプトガイド本文を確認できず | §2 の Vertex 固有の追加推奨(あれば)を補足できず。ai.google.dev 側 gemini-3 ガイドで代替済み |
| https://ai.google.dev/gemini-api/docs/models.md.txt | モデル名と短い説明のみ。**正確なコンテキスト長・出力上限・ナレッジカットオフ・thinking 可否のスペック表を取得できず** | §0 の数値は検索要約(ベンダー自己報告)に依存。実装前に models ページ本体で要再確認 |
| https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/prompt-design-strategies | 戦略の見出し一覧は取れたが、**prefix / partial-input completion(prefill 相当)の詳細本文を取得できず** | §2・§5 の「プレフィックス」「部分入力補完」の現行推奨を裏取りできず(未確認扱い) |
| Gemini 3.5 Flash の正確なスペック(context / output / cutoff) | models 本体が数値を返さず、`whats-new-gemini-3.5` は検索要約のみ確認 | §0 の 1M / 65k は「ベンダー自己報告」止まり。断定回避 |

### 抽出方法に由来する一般的注意(再掲)

- WebFetch の本文は小型モデルの要約を経ているため、**API フィールド名の綴り**(`response_format` / `response_mime_type` / `tool_choice` / `thinking_summaries` など)は SDK 名と REST 名が正規化されている可能性がある。**公開ドキュメント執筆時・実装時は必ず公式リファレンス(https://ai.google.dev/api)で綴りを再確認**すること。
- 引用(英語原文)は要約経由のものを含むため、逐語の完全一致は保証しない。ニュアンスは公式ページで最終確認する。
