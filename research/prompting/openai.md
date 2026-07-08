# PE-R2 調査メモ — OpenAI(GPT 系)公式プロンプト推奨

- **調査日**: 2026-07-08
- **性格**: 本メモは公開ドキュメントではなく、`docs/03-implementation/` のプロンプトエンジニアリング関連記事を執筆するための**非公開の一次情報整理**です。断定調で書いていますが、確度欄を必ず併読してください。
- **調査目的**: OpenAI(GPT 系)公式のプロンプトエンジニアリング推奨を、公式一次情報(platform / developers.openai.com、cookbook)ベースで整理する。特に「推論モデル(reasoning)と非推論モデルの書き分け」「Responses API と指示階層」「Structured Outputs」「prefill 可否」を重点確認する。
- **根拠の方針**: `developers.openai.com`(旧 `platform.openai.com/docs/*` からの 301/308 リダイレクト先。以下「公式 docs」)と `developers.openai.com/cookbook`(旧 `cookbook.openai.com`)のみを一次情報とする。個人ブログ・比較記事は補助的にのみ用い、確度を落とす。
- **確度凡例**:
  - **公式確認済み** = platform / developers.openai.com または cookbook を今回 WebFetch で直接確認
  - **ベンダー自己報告** = 公式が主張しているが検証手段が公式内に限られる性質のもの(ベンチ・挙動主張など)
  - **二次情報** = 公式を要約した技術ブログ/ミラー経由。裏取り未完了
  - **未確認** = 今回確認できず

- **鮮度に関する最重要注意**: 2026-07 時点の OpenAI 現行フロンティアは **GPT-5.5 / GPT-5.4 世代**であり、かつての o シリーズ(推論特化の別系統)は縮小・統合され、**推論は GPT-5.x 本体に `reasoning.effort` で統合**されている(別冊 `research/models/openai.md` M-R2 で確認済み)。以下、モデル名は記憶ではなく公式ページ由来のもののみ記載する。

主な出典(いずれも確認日 2026-07-08、全て公式確認済み):

| 略称 | URL |
| --- | --- |
| PE ガイド | https://developers.openai.com/api/docs/guides/prompt-engineering |
| Prompt guidance | https://developers.openai.com/api/docs/guides/prompt-guidance |
| Reasoning best practices | https://developers.openai.com/api/docs/guides/reasoning-best-practices |
| Reasoning models | https://developers.openai.com/api/docs/guides/reasoning |
| Using GPT-5.5(latest-model) | https://developers.openai.com/api/docs/guides/latest-model |
| Structured Outputs | https://developers.openai.com/api/docs/guides/structured-outputs |
| GPT-5 prompting guide(cookbook) | https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide |
| GPT-5.2 prompting guide(cookbook) | https://developers.openai.com/cookbook/examples/gpt-5/gpt-5-2_prompting_guide |

---

## 1. メッセージ構造(system / developer / user と指示階層)

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| ロールは `developer`(アプリ開発者の指示、`user` より優先)/ `user`(エンドユーザーの指示、`developer` の後)/ `assistant`(モデル生成)の 3 系統。原文 "instructions provided by the application developer, prioritized ahead of `user` messages" | PE ガイド / 2026-07-08 / 公式確認済み |
| OpenAI はロールを「プログラミング言語の関数とその引数のようなもの」と説明。developer メッセージ=関数定義(システム規則)、user メッセージ=引数(入力/設定) | PE ガイド / 2026-07-08 / 公式確認済み |
| Responses API の `instructions` パラメータはモデルへの高レベル指示で、"will take priority over a prompt in the `input` parameter"(= `input` 内のプロンプトより優先) | PE ガイド / 2026-07-08 / 公式確認済み |
| **推論モデルでは developer メッセージが従来の system メッセージを置き換える**。原文 "Developer messages are the new system messages: Starting with o1-2024-12-17, reasoning models support developer messages rather than system messages"。これは Model Spec の chain of command(指示階層)挙動と整合 | Reasoning best practices / 2026-07-08 / 公式確認済み |
| 指示階層の優先順位(高→低): ①安全・正直・プライバシー・許可の制約(譲らない、"do not yield")→ ②必須の出力フィールドと真の不変条件 → ③判断が要る場面の決定ルール → ④人格・文体ガイダンス(最下位)。原文 "User instructions override default style, tone, formatting, and initiative preferences"(ユーザー指示は既定の文体等を上書きできるが、上位のシステム/開発者制約は拘束的に残る) | Prompt guidance / 2026-07-08 / 公式確認済み |

**執筆上の含意**: 「system か developer か」は世代で用語が割れる。GPT-5.x/Responses 文脈では **developer メッセージ(または `instructions` パラメータ)を第一に**説明し、「かつての system メッセージに相当」と注記するのが安全。絶対不変条件(安全・スキーマ必須項目)を最上位に、文体は最下位に置く「重要度で階層化」を推奨として書ける。

---

## 2. 構造化の推奨記法(Markdown / 区切り / XML タグ)

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| プロンプトは **Markdown 見出しと XML タグ**でセクション化することを推奨。典型的な並び順: Identity(目的・文体・高レベル目標)→ Instructions → Examples → Context | PE ガイド / 2026-07-08 / 公式確認済み |
| 原文 "Markdown headers and lists can be helpful to mark distinct sections" / "XML tags can help delineate where one piece of content begins and ends"(= Markdown 見出し/リストは節分けに、XML タグは内容の境界明示に有効) | PE ガイド / 2026-07-08 / 公式確認済み |
| 推論モデル向けにも「区切り(delimiters)」を推奨。原文 "Use delimiters like markdown, XML tags, and section titles to clearly indicate distinct parts"(Markdown・XML タグ・節タイトルはいずれも可) | Reasoning best practices / 2026-07-08 / 公式確認済み |
| **過剰整形を戒める**。原文 "Use headers, bold text, bullets, and numbered lists sparingly" / "Let formatting serve comprehension. Use plain paragraphs as default"(見出し・太字・箇条書きは控えめに、既定は素のパラグラフ)。さらに "Never use nested bullets. Keep lists flat (single level)"(入れ子箇条書き禁止、リストはフラットに) | Prompt guidance / 2026-07-08 / 公式確認済み |
| GPT-5 系プロンプトでは XML 風の構造タグ(例 `<persistence>`, `<tool_preambles>`, `<code_editing_rules>`, `<output_contract>`, `<tool_usage_rules>`)でルールブロックを明示するのが有効。Cursor は "structured XML specs like `<[instruction]_spec>` improved instruction adherence" と報告 | GPT-5 / GPT-5.2 prompting guide / 2026-07-08 / 公式確認済み(Cursor 分はベンダー自己報告の孫引き) |
| Markdown は「意味的に正しい箇所でのみ」。原文 "Use Markdown **only where semantically correct**"、ファイル名・関数名・クラス名等はバッククォートで囲う | GPT-5 prompting guide / 2026-07-08 / 公式確認済み |

**執筆上の含意**: OpenAI の立場は「Markdown 見出しでも XML タグでもよい。XML タグは**内容ブロックの境界を明示**したいときに強い。ただし整形は理解のためであり、過剰なネスト/装飾は逆効果」。Anthropic ほど XML を前面に出さないが、GPT-5 系の実運用サンプルは XML 風タグ多用。JSON でプロンプト構造を組むことは(GPT-4.1 時代のガイド以来)積極推奨されていない点は §9 と併せて注記。

---

## 3. 例示(few-shot)の公式推奨

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| few-shot は「少数の入出力例でモデルを新タスクへ誘導する」手法で、ファインチューニングの代替。原文 "lets you steer a large language model toward a new task by including a handful of input/output examples" | PE ガイド / 2026-07-08 / 公式確認済み |
| **例示は多様な入力を見せる**。原文 "When providing examples, try to show a diverse range of possible inputs with desired outputs"。例は developer メッセージ内に含める | PE ガイド / 2026-07-08 / 公式確認済み |
| 推論モデルは**まず zero-shot、必要なら few-shot**。原文 "Try zero shot first, then few shot if needed: Reasoning models often don't need few-shot examples"。使う場合は "ensure that the examples align very closely with your prompt instructions"(例が指示と厳密に整合していること) | Reasoning best practices / 2026-07-08 / 公式確認済み |
| モデル階層で例示量が違う。GPT-5.4/5.5 は最小限の例でパターン推論可。**小型(gpt-5.4-mini / nano)は「最終フォーマットだけでなく正しい流れを見せる」**。原文 "Show the correct flow, not just the final format"(構造化タスクには正例を 1 つ) | Prompt guidance / 2026-07-08 / 公式確認済み |

**執筆上の含意**: OpenAI の推奨は「zero-shot → 足りなければ few-shot」。few-shot を足すときは**例と指示の不整合を作らない**(矛盾は特に推論モデルで害。§4 参照)。小型モデルほど例で「流れ」を明示する必要がある、という粒度差は執筆に使える。

---

## 4. 思考の制御(reasoning effort・推論モデル vs GPT 系の書き分け)

### 4.1 推論モデルと GPT モデルの役割の違い

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| 比喩: 推論モデル=「上級同僚(senior co-worker)。ゴールを渡せば詳細は任せられる」/ GPT モデル=「新人同僚(junior coworker)。明示的な指示で最も良く動く」 | PE ガイド / 2026-07-08 / 公式確認済み |
| 推論モデル(o シリーズ)=**"The Planners"**。"strategizing, planning solutions to complex problems, and making decisions based on large volumes of ambiguous information" に強い。数学・科学・工学・金融・法務など専門家級領域向け | Reasoning best practices / 2026-07-08 / 公式確認済み |
| GPT モデル=**"The Workhorses"**。"faster and tend to cost less" で "handle explicitly defined tasks well"。多くのワークフローは両者併用(o 系で計画/判断、GPT 系で実行) | Reasoning best practices / 2026-07-08 / 公式確認済み |

### 4.2 推論モデルへのプロンプト作法(=手順を細かく指示しない)

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| **簡潔・直接**。原文 "Keep prompts simple and direct: The models excel at understanding and responding to brief, clear instructions" | Reasoning best practices / 2026-07-08 / 公式確認済み |
| **CoT 指示は不要**。原文 "Avoid chain-of-thought prompts: Since these models perform reasoning internally, prompting them to 'think step by step' or 'explain your reasoning' is unnecessary" | Reasoning best practices / 2026-07-08 / 公式確認済み |
| **最終ゴールを具体的に**。"Be very specific about your end goal" / "Provide specific guidelines"。ただし中間手順は指定しない(内部推論に任せる) | Reasoning best practices / 2026-07-08 / 公式確認済み |
| GPT-5 系全般: **明確なゴール・強い制約・明示的な出力契約を与え、各中間ステップは規定しない**のが最良。原文(要約)"give them a clear goal, strong constraints, and an explicit output contract without prescribing every intermediate step" | 検索由来の PE 要約 + latest-model / 2026-07-08 / 公式確認済み(latest-model の outcome-first 記述で裏取り) |

### 4.3 reasoning effort パラメータ(GPT-5.x)

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| `reasoning.effort` の水準は `none` / `minimal` / `low` / `medium` / `high` / `xhigh`(モデル依存)。用途対応: low=効率重視で軽い遅延増、medium=大半のワークロードの既定、high=難しい推論・複雑デバッグ・深い計画、xhigh=ディープリサーチ・非同期ワークフロー | Reasoning models / 2026-07-08 / 公式確認済み |
| **GPT-5.5 の既定は `medium`**。"the best starting point for `gpt-5.5`'s full balance of quality, reliability and performance"。品質・信頼性・レイテンシ・コストの均衡点として推奨 | latest-model / Reasoning models / 2026-07-08 / 公式確認済み |
| effort レベル別ガイド(latest-model): `none` はレイテンシ最優先で推論/多段ツール連鎖が不要なタスク限定(軽量音声ターン・高速検索・分類)。`low` はレイテンシ重視だがツール/計画/検索/多段判断がまだ効くケース。`high`/`xhigh` は「eval で計測可能な品質向上が、追加のレイテンシ/コストを正当化できるときのみ」 | latest-model / 2026-07-08 / 公式確認済み |
| **過剰思考(overthinking)の警告**。原文 "Higher reasoning effort isn't automatically better. If the task has conflicting instructions, weak stopping criteria, or open-ended tool access, higher effort can lead to overthinking, unnecessary searching, or output quality regressions" | latest-model / 2026-07-08 / 公式確認済み |
| **effort は最後の微調整ノブ**。原文 "Reasoning effort is not one-size-fits-all. Treat it as a last-mile tuning knob, not the primary way to improve quality" | Prompt guidance / 2026-07-08 / 公式確認済み |
| GPT-5(旧世代)ガイドでは `reasoning_effort` を「モデルがどれだけ深く考え、どれだけ積極的にツールを呼ぶか」の制御とし、`minimal` を「推論パラダイムの利点を保ちつつ最速」と位置づけ。minimal では「モデルの内部計画余地が少ないため、プロンプト側での計画(prompted planning)がより重要」 | GPT-5 prompting guide / 2026-07-08 / 公式確認済み |
| 世代で既定 effort が異なる: GPT-5.2 の既定 reasoning_effort は `none`("Default reasoning level for GPT-5.2 is none")。GPT-5.5 は medium。移行時は「先行モデルのレイテンシ/深さプロファイルに合わせて effort を明示ピン留めせよ」 | GPT-5.2 prompting guide / 2026-07-08 / 公式確認済み |

**執筆上の含意**: 「推論モデルには手順を細かく書かない/CoT を書かない」は明確な公式推奨。GPT-5.x は「推論内蔵モデル」であり、effort で思考量を制御する。**記事の主要メッセージ**として「①推論内蔵モデルには step-by-step を書かず outcome/契約を書く、②effort は品質の主ノブではなく最後の微調整、③上げすぎは overthinking で逆効果」を安全に書ける。世代ごとの既定 effort 値は変動するので断定を避け「2026-07 時点」を付す。

---

## 5. 出力制御(Structured Outputs / JSON schema、stop、prefill)

### 5.1 Structured Outputs

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| Structured Outputs は「モデル出力が供給 JSON Schema に**必ず従う**ことを保証」。原文 "ensure the model will always generate responses that adhere to your supplied JSON Schema" | Structured Outputs / 2026-07-08 / 公式確認済み |
| JSON mode との違い: 原文 "Structured Outputs is the evolution of JSON mode. While both ensure valid JSON is produced, only Structured Outputs ensure schema adherence"(両者とも妥当 JSON は保証するが、スキーマ遵守は Structured Outputs のみ) | Structured Outputs / 2026-07-08 / 公式確認済み |
| 有効化: Chat Completions は `response_format: { type: "json_schema", json_schema: {...}, strict: true }`、Responses API は `text: { format: { type: "json_schema", strict: true, schema: ... } }` | Structured Outputs / 2026-07-08 / 公式確認済み |
| 対応モデル: "gpt-4o-mini, gpt-4o-2024-08-06, and later"。新規は "For new projects, start with gpt-5.5" を推奨 | Structured Outputs / 2026-07-08 / 公式確認済み |
| JSON Schema の多くをサポートするが「性能上・技術上の理由で一部機能は未対応」("some features are unavailable either for performance or technical reasons")。未対応機能の網羅列挙は今回の取得範囲では未取得(要フォロー) | Structured Outputs / 2026-07-08 / 公式確認済み(列挙部分は未確認) |
| function calling との使い分け: function calling はアプリ機能とモデルの橋渡し用、`response_format` の Structured Outputs は「ユーザーへの応答を構造化したいとき」向け | Structured Outputs / 2026-07-08 / 公式確認済み |
| 利点: 「一貫した書式のための強い言い回しのプロンプトが不要」("No need for strongly worded prompts to achieve consistent formatting")、型安全でリトライ不要 | Structured Outputs / 2026-07-08 / 公式確認済み |
| GPT-5.5 移行時の推奨: **出力スキーマはプロンプトから外し Structured Outputs を使う**("Remove output schema from prompts; use Structured Outputs instead") | latest-model / 2026-07-08 / 公式確認済み |
| verbosity(最終回答の長さ)制御: `text.verbosity` = low / medium(既定)/ high。「最終回答長は推論品質と別物として扱い、語数・セクション数・表幅・JSON-only 等を指定せよ」 | latest-model / GPT-5 prompting guide / 2026-07-08 / 公式確認済み |

### 5.2 stop / prefill

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| プロンプト側の「停止条件(stopping rules)」を明示せよ、という運用推奨あり。原文 "After each result, ask: 'Can I answer the user's core request now with useful evidence?'"。長時間ツールワークフローでは成功基準と停止規則を定義 | Prompt guidance / latest-model / 2026-07-08 / 公式確認済み |
| `stop`(停止シーケンス)API パラメータそのものの現行仕様は、今回のプロンプト系ページでは**明示的に扱われていない**(Chat Completions リファレンス側の管轄。今回未取得=未確認) | — / 2026-07-08 / 未確認 |
| **推論モデルの生の思考は API から見えない**。原文 "Reasoning tokens are not visible via the API"(コンテキストは消費し出力トークンとして課金) | Reasoning models / 2026-07-08 / 公式確認済み |
| **古典的な assistant prefill(部分的な assistant メッセージを最後に置いて続きを書かせる Anthropic 型)は、最新の推論モデル(o3 / o4-mini)ではサポートされない**、という記述が公式 reasoning ガイドにあるとされる | 検索(OpenAI reasoning ガイド要約)/ 2026-07-08 / 二次情報(直接引用は未取得。要フォロー) |
| 一方 Responses API の推論フローには `phase` フィールド(`"commentary"` / `"final_answer"`)があり、assistant 履歴を手動で差し戻す際は各 `phase` 値を保持する必要がある。これは「reasoning と最終回答の段の区別」を保持する仕組みで、Anthropic 型の自由 prefill とは別物 | Reasoning models / 2026-07-08 / 公式確認済み |

**執筆上の含意**: OpenAI での出力書式の第一選択は **Structured Outputs(strict JSON schema)**であり、「JSON を強く指示するプロンプト」は不要になった、という点を明確に書ける(§9 の俗説とも接続)。prefill は「OpenAI ではベンダー中立に『assistant 事前充填は前提にしない』」と書くのが安全。stop シーケンスは API リファレンス管轄なので本文で断定せず、必要なら別途確認。

---

## 6. 長文・長コンテキストの作法

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| コンテキスト長はモデルにより「低い 10 万台〜100 万トークン(新しめの GPT-4.1 系)」まで幅がある(注: GPT-5.5/5.4 は約 105 万・別冊 M-R2 参照) | PE ガイド / 2026-07-08 / 公式確認済み(GPT-4.1 の記述は世代注意) |
| 追加コンテキストの与え方として RAG(ベクトル DB 検索、または OpenAI の built-in file search ツール)を案内 | PE ガイド / 2026-07-08 / 公式確認済み |
| **コンパクション(Responses API)**: 「主要マイルストーン後に圧縮し、圧縮済み項目は不透明な状態として扱い、圧縮後もプロンプトが機能的に同一であるようにする」 | Prompt guidance / 2026-07-08 / 公式確認済み |
| GPT-5.4 は「長い多ターン会話でも一貫性・信頼性を保ちやすく、セッションが伸びても崩れにくい」("remain more coherent and reliable over longer, multi-turn conversations") | Prompt guidance / 2026-07-08 / 公式確認済み(ベンダー自己報告寄り) |
| 検索の無駄撃ち防止に「検索バジェット(retrieval budgets)」と明示的停止規則を設ける | Prompt guidance / 2026-07-08 / 公式確認済み |
| 多ターン状態管理は Responses API の `previous_response_id` を使う。ステートレス/ZDR では毎ターン関連 output items を差し戻す。ステートレスで推論を跨ぐには `include` に `"reasoning.encrypted_content"` を含める | latest-model / Reasoning models / 2026-07-08 / 公式確認済み |

**執筆上の含意**: OpenAI の長コンテキスト作法は「①必要な文脈は RAG/file search で供給、②長時間タスクはコンパクションで状態を圧縮しプロンプトを機能不変に保つ、③検索バジェットと停止規則で暴走を防ぐ」。GPT-4.1 時代の「重要指示を冒頭と末尾の両方に置く」系の助言は今回の GPT-5.x 系ページでは前面化していない(GPT-4.1 prompting guide は未フェッチ=未確認)。

---

## 7. ツール使用・function calling・エージェント文脈のプロンプト

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| **ツール固有の指示はツール記述(description)側に置く**。原文 "Put most tool-specific guidance in the tool descriptions themselves: what the tool does, when to use it, required inputs, side effects, retry safety, and common error modes" | latest-model / 2026-07-08 / 公式確認済み |
| ツール記述は簡潔に。"Describe tools crisply: 1–2 sentences for what they do and when to use them" | GPT-5.2 prompting guide / 2026-07-08 / 公式確認済み |
| **並列ツール呼び出し**を推奨。"When multiple retrieval or lookup steps are independent, prefer parallel tool calls to reduce wall-clock time" | Prompt guidance / 2026-07-08 / 公式確認済み |
| **ツール永続性(early stop 抑制)**: "Do not stop early when another tool call is likely to materially improve correctness or completeness"。行動前に前提となる探索/参照/記憶取得が要るかチェック | Prompt guidance / 2026-07-08 / 公式確認済み |
| エージェント永続性の定番句(GPT-5): "You are an agent - please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user" | GPT-5 prompting guide / 2026-07-08 / 公式確認済み |
| **ツールプリアンブル**(GPT-5): ツール呼び出し前にユーザーのゴールを言い換え、構造化した計画を提示してから実行。"Always begin by rephrasing the user's goal ... Then, immediately outline a structured plan" | GPT-5 prompting guide / 2026-07-08 / 公式確認済み |
| eagerness(探索積極性)は `reasoning_effort` を下げると探索深度が下がり効率/レイテンシ改善。上げるにはツール網羅・不確実時も止まらない指示 | GPT-5 prompting guide / 2026-07-08 / 公式確認済み |
| GPT-5.5 は大きなツール群・多段サービスワークフロー・長時間エージェントで特に有用で、ツール選択と引数指定がより精密。ホスト型ツール(web/file search, code interpreter, image generation, computer use)を優先せよ | latest-model / 2026-07-08 / 公式確認済み(能力主張はベンダー自己報告寄り) |
| コーディングエージェントでは「再利用・サブエージェント委譲・テスト期待・受け入れ基準・継続 vs 質問の判断」を明示せよ | latest-model / 2026-07-08 / 公式確認済み |
| エージェント/ツール連携の推奨 API は **Responses API**、オーケストレーションは Agents SDK パターン | latest-model / 2026-07-08 / 公式確認済み |

**執筆上の含意**: OpenAI のエージェントプロンプト原則は「①ツールの使い方はプロンプト本文でなく tool description に書く、②独立ステップは並列化、③停止規則と永続性のバランス(止まりすぎ/暴走の両方を明示制御)、④Responses API + Agents SDK」。GPT-5 系の「persistence」「tool preambles」タグは実装記事の具体例として引用可。

---

## 8. 世代間の移行注意

| 事実 | 出典 / 確認日 / 確度 |
| --- | --- |
| **GPT-5.5 はドロップイン置換ではない**。原文 "Treat it as a new model family to tune for, not a drop-in replacement for `gpt-5.2` or `gpt-5.4`. Begin migration with a fresh baseline instead of carrying over every instruction from an older prompt stack" | latest-model / 2026-07-08 / 公式確認済み |
| 移行の出発点: "Start with the smallest prompt that preserves the product contract, then tune reasoning effort, verbosity, tool descriptions, and output format against representative examples"(製品契約を保つ最小プロンプトから始め、代表例で微調整) | latest-model / 2026-07-08 / 公式確認済み |
| 移行時のプロンプト掃除: **現在日付を消す**(モデルが UTC 日付を把握済み)、**出力スキーマを消して Structured Outputs へ**、**キャッシュ最適化(静的を先・動的を後)** | latest-model / 2026-07-08 / 公式確認済み |
| GPT-5.2 移行のパラメータ対応: GPT-4o/4.1 から来るなら `reasoning_effort="none"`、GPT-5 から来るなら none/low/medium/high を保ちレイテンシ/品質プロファイル維持。GPT-5.2 の既定は none | GPT-5.2 prompting guide / 2026-07-08 / 公式確認済み |
| GPT-5.2 は GPT-5/5.1 比で「より慎重なスキャフォールディング」「概して低 verbosity」「指示遵守が強い(ユーザー意図からのドリフト減)」「対話フローでツール行動が増える傾向」「正確性・明示推論を好むグラウンディング傾斜」 | GPT-5.2 prompting guide / 2026-07-08 / 公式確認済み(挙動主張はベンダー自己報告) |
| GPT-5.5 は「プロンプトを字義通り・網羅的に解釈する("interprets prompts in a literal and thorough manner")」ため、製品が要求するなら具体的指示が効く。既定文体はより簡潔・直接で、顧客対応は明示的な人格・温かみ・理由・整形指示が要る | latest-model / 2026-07-08 / 公式確認済み |

**執筆上の含意**: 「新世代=既存プロンプトの流用禁止、最小プロンプトから再チューニング」「移行チェックリスト(日付削除・スキーマは Structured Outputs へ・キャッシュ順)」は実装記事にそのまま落とせる。既定 reasoning_effort が世代で変わる(5.2=none / 5.5=medium)点は移行の落とし穴として明記。

---

## 9. 「効かない/不要になった俗説」(公式が非推奨とするもの)

| 俗説 / 非推奨事項 | 公式の立場 | 出典 / 確認日 / 確度 |
| --- | --- | --- |
| 推論モデルに「ステップバイステップで考えて」と CoT を書く | **不要**。内部で推論するため "unnecessary" | Reasoning best practices / 2026-07-08 / 公式確認済み |
| どんなタスクにも few-shot を付ける | 推論モデルは多くの場合不要。zero-shot を先に試す | Reasoning best practices / 2026-07-08 / 公式確認済み |
| 全手順を細かく規定する(process-heavy) | outcome/成功基準の記述を推奨。"Reduce or remove detailed step-by-step process guidance" | latest-model / Prompt guidance / 2026-07-08 / 公式確認済み |
| 判断が要る所にも `ALWAYS` / `NEVER` を多用 | 真の不変条件にのみ使う。判断事項に絶対語を乱用しない | Prompt guidance / 2026-07-08 / 公式確認済み |
| 一貫した JSON のために「強い言い回し」で書式を指示 | 不要。Structured Outputs を使えばスキーマ遵守は保証 | Structured Outputs / 2026-07-08 / 公式確認済み |
| 出力スキーマをプロンプト本文に書き込む | GPT-5.5 では外して Structured Outputs へ | latest-model / 2026-07-08 / 公式確認済み |
| 現在日付をプロンプトに入れる | GPT-5.5 は UTC 日付を把握済み。削除推奨 | latest-model / 2026-07-08 / 公式確認済み |
| 矛盾/曖昧な指示を放置 | GPT-5 では特に有害。"expends reasoning tokens searching for a way to reconcile the contradictions" | GPT-5 prompting guide / 2026-07-08 / 公式確認済み |
| 「THOROUGH に」等の旧世代流の網羅指示 | GPT-5 では不要なツール過剰使用を招きうる | GPT-5 prompting guide / 2026-07-08 / 公式確認済み |
| reasoning_effort を上げれば品質が上がる | 誤り。上げすぎは overthinking で品質退行。eval で正当化できる時のみ | latest-model / 2026-07-08 / 公式確認済み |
| 入れ子箇条書き・重い整形で構造化 | 非推奨。フラットなリスト、既定は素のパラグラフ | Prompt guidance / 2026-07-08 / 公式確認済み |
| 再利用プロンプトオブジェクト(`v1/prompts` / saved prompt ID)に依存 | 非推奨化。2026-06-03 から de-emphasize、2026-11-30 に `v1/prompts` 停止予定。`instructions`/`input` を直接 Responses API へ渡す | PE ガイド / 2026-07-08 / 公式確認済み |

**補足(旧世代限定の作法)**: o1-2024-12-17 以降の推論モデルは既定で Markdown を抑制し、Markdown 出力が欲しければ developer メッセージ 1 行目に "Formatting re-enabled" を入れる、という指示があった。**これは o シリーズ時代の記述**で、GPT-5.x 系ページでは前面化していない(GPT-5.x にそのまま適用されるかは未確認)。出典: Reasoning best practices / 2026-07-08 / 公式確認済み(適用範囲は要注意)。

---

## 10. 変わりやすい項目(定点観測すべきもの)

| 監視対象 | なぜ変わるか | 定点観測 URL |
| --- | --- | --- |
| 現行フロンティア世代と既定 reasoning_effort(5.5=medium / 5.2=none 等) | 世代交代で既定値・推奨が変わる | latest-model / Reasoning models |
| reasoning effort の水準集合(none/minimal/low/medium/high/xhigh) | 水準が増減する(xhigh は比較的新しい) | Reasoning models |
| developer vs system メッセージの用語・優先順位 | Model Spec / chain of command 更新で変わりうる | Prompt guidance / Reasoning best practices |
| Structured Outputs の対応モデルと未対応スキーマ機能 | 拡張されやすい | Structured Outputs |
| prefill / phase の扱い、reasoning の差し戻し方式 | Responses API 進化で変わる | Reasoning models |
| 再利用プロンプト(`v1/prompts`)の停止スケジュール(2026-11-30 予定) | 退役期日が近い | PE ガイド / deprecations |
| GPT-5.x 各世代の prompting guide(cookbook) | 世代ごとに新ガイドが出る | cookbook /examples/gpt-5/ |
| 旧 `platform.openai.com/docs/*` → `developers.openai.com/api/docs/*` のリダイレクト | ドメイン移行済み。新ドメインを正とする | 両ドメイン |

---

## WebFetch 失敗・取得不能の記録

- **`openai.com/index/*`(公式ブログ本文)**: 今セッションでは直接フェッチを試行していない。別冊メモ(M-R2 / ファインチューニング)の記録どおり bot アクセスは 403 になりやすく、一次情報としては `developers.openai.com` docs / cookbook で代替した。GPT-5.5 の正式発表ブログ等が必要になれば手動確認が必要。
- **`cookbook.openai.com/...`**: `developers.openai.com/cookbook/...` へ 308 リダイレクトされる。GPT-5.2 prompting guide は新ドメインで取得成功。定点観測 URL は新ドメイン側を正とする。
- **`stop`(停止シーケンス)API パラメータの現行仕様**: プロンプト系ガイドでは扱われず、Chat Completions API リファレンス管轄。今回未取得=未確認。
- **古典的 assistant prefill の可否**: 「最新推論モデル(o3/o4-mini)では非対応」という記述は検索(公式 reasoning ガイド要約)経由で得たが、公式ページの当該原文は今回直接引用まで確定できていない(二次情報)。執筆前に Reasoning ガイド本文で要確認。
- **Structured Outputs の未対応スキーマ機能の網羅リスト**: 「一部機能は未対応」とだけ確認。具体列挙は今回のフェッチ範囲では未取得=未確認。
- **GPT-4.1 prompting guide(長コンテキスト作法・冒頭/末尾反復指示)**: 今回未フェッチ。GPT-4.1 は前世代のため優先度を下げた。長コンテキストの旧作法を記事化する場合は別途取得推奨。URL: https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide
- **GPT-5.5 専用の cookbook prompting guide の存在**: 未確認。GPT-5.5 のプロンプト指針は公式 docs の「Using GPT-5.5」(latest-model)を一次とした。Simon Willison が "GPT-5.5 prompting guide"(2026-04-25)を掲載しているが二次情報。
- **`reasoning.effort` の `minimal` と `none` の厳密な差**: Reasoning models ページに両者が列挙されるが、`minimal`(GPT-5 世代の呼称)と `none`(GPT-5.4/5.5 世代の呼称)の関係・共存が世代で揺れており、統一的定義は未確認。世代を明示して書くこと。
