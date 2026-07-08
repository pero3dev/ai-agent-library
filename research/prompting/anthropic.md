# PE-R1 調査メモ — Anthropic(Claude)公式プロンプト推奨

- **調査日**: 2026-07-08
- **調査目的**: `docs/03-implementation/` 配下のプロンプトエンジニアリング系ドキュメント執筆材料。Anthropic(Claude)公式のプロンプトエンジニアリング推奨を、公式一次情報のみで整理する
- **性質**: これは公開しない執筆用の整理メモです。断定調で書いてある事実も、最終的な docs 本文では確度と `TODO(要確認)` の要否を各自で再判断してください
- **根拠の方針**: `platform.claude.com`(Claude 公式ドキュメント)を WebFetch で直接取得した内容のみを「公式確認済み」として採用します。既知の現行事実(Claude Code の claude-api スキル由来)は、可能な範囲で公式ページで裏取りし出典を付しています
- **確度表記**:
  - **公式確認済み** = 公式ページを WebFetch で直接確認
  - **ベンダー自己報告** = 公式の主張だが第三者検証がない性質の記述(内部評価など)
  - **二次情報** = 公式以外
  - **未確認** = 今回確認できず

> **重要な構成上の発見(2026-07-08 時点)**: Anthropic の旧・個別テクニックページ(`be-clear-and-direct`, `use-xml-tags`, `prefill-claudes-response` など)は**単一の「Prompting best practices」ページに統合**されており、正本(living reference)は以下です。
> - 入口: `prompt-engineering/overview`
> - **正本**: `prompt-engineering/claude-prompting-best-practices`(全モデル共通テクニック + モデル別ガイド + 移行考慮点)
> - モデル別: `prompting-claude-opus-4-8`, `prompting-claude-sonnet-5`, `prompting-claude-fable-5`
> 旧 URL(`prefill-claudes-response` など)は overview / best-practices にフォールバックされます(§失敗記録参照)。

---

## 0. 現行モデルと参照ページ(前提の裏取り)

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| 「Prompting best practices」が対象とする現行モデルは **Claude Fable 5, Claude Mythos 5, Claude Opus 4.8, Claude Opus 4.7, Claude Opus 4.6, Claude Sonnet 5, Claude Sonnet 4.6, Claude Haiku 4.5**。モデルID例: `claude-opus-4-8`, `claude-sonnet-5`, `claude-fable-5` | `.../prompt-engineering/claude-prompting-best-practices` / 2026-07-08 / 公式確認済み |
| ページは 3 部構成:①モデル別ガイダンス → ②全現行モデル共通テクニック → ③旧世代からの移行考慮点、と明記 | 同上 / 2026-07-08 / 公式確認済み |
| プロンプトエンジニアリングは「成功基準が明確で、経験的にテストでき、改善したい初稿プロンプトがある」ことが前提。レイテンシ・コストはプロンプトより**モデル選択**で改善する方がよい場合がある、と明記 | `.../prompt-engineering/overview` / 2026-07-08 / 公式確認済み |

---

## 1. メッセージ構造・システムプロンプトの作法

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| **役割はシステムプロンプトで与える**。「Give Claude a role」= system プロンプトで役割を設定すると、用途に合わせて挙動とトーンが絞られる。**一文でも効果がある**("You are a helpful coding assistant specializing in Python.")。API 上は最上位の `system` フィールドを使う | `.../claude-prompting-best-practices`(Give Claude a role)/ 2026-07-08 / 公式確認済み |
| **指示に「なぜ」を添える**とよい(Add context to improve performance)。例: 「NEVER use ellipses」より「読み上げ(TTS)されるので省略記号を使わないで」。Claude は説明から一般化できる | 同上(Add context)/ 2026-07-08 / 公式確認済み |
| **明確・直接的に**(Be clear and direct)。「文脈のない同僚に見せて混乱するならモデルも混乱する」を黄金律とする。順序や網羅性が重要なら**番号付き/箇条書きの手順**で与える。期待する出力形式・制約を具体的に | 同上(Be clear and direct)/ 2026-07-08 / 公式確認済み |
| **モデルへの自己認識付与**: アプリで正しく名乗らせたい/モデル文字列を使わせたい場合は system に明記する(例: "The current model is Claude Opus 4.8", "The exact model string ... is claude-opus-4-8") | 同上(Model self-knowledge)/ 2026-07-08 / 公式確認済み |
| **ミッドセッション(会話途中)のシステムメッセージは Claude Opus 4.8 のみ対応**。`messages` 配列でユーザーターン直後に `role: "system"` を置ける(配置ルールあり)。開始時から効かせたい指示は最上位 `system` を使う。全履歴を作り直すコードパスを単純化でき、以前ターンのプロンプトキャッシュヒットを維持できる | `.../models/migration-guide`(Mid-Conversation System Messages)/ 2026-07-08 / 公式確認済み |

**設計判断メモ**: 役割・グローバル指示は最上位 `system`、途中で差し込む指示は(Opus 4.8 なら)mid-conversation system か、それ以外のモデルではユーザーターンへ注入(後述 prefill 移行の項)。

---

## 2. 構造化の推奨記法(XML タグ)

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| **XML タグ推奨は健在**。「Structure prompts with XML tags」= 指示・文脈・例・変数入力が混在するプロンプトを Claude が曖昧さなく解析するのに役立つ。各種コンテンツを**それぞれのタグで囲む**(`<instructions>`, `<context>`, `<input>` など)と誤解が減る | `.../claude-prompting-best-practices`(Structure prompts with XML tags)/ 2026-07-08 / 公式確認済み |
| ベストプラクティス: **一貫した記述的なタグ名**を使う。自然な階層があるなら**入れ子**にする(`<documents>` の中に `<document index="n">`) | 同上 / 2026-07-08 / 公式確認済み |
| 出力形式の誘導にも XML を使う: 「\<smoothly_flowing_prose_paragraphs> タグの中に散文で書いて」のように**XML 形式インジケータ**で出力を囲ませる | 同上(Control the format of responses)/ 2026-07-08 / 公式確認済み |
| 例示は `<example>`(複数なら `<examples>`)タグで囲み、指示と区別させる。長文資料は `<document>` / `<document_content>` / `<source>` で構造化(§3・§6 参照) | 同上 / 2026-07-08 / 公式確認済み |

**設計判断メモ**: Anthropic は依然として **XML タグを第一の構造化手段**として推奨。JSON より「区切り目的の軽量マークアップ」として XML を使う姿勢は世代を越えて一貫しています。

---

## 3. 例示(few-shot / multishot)の公式推奨

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| **例示は出力の形式・トーン・構造を操る最も信頼できる手段の一つ**(few-shot / multishot)。良い例を数個入れると精度と一貫性が上がる | `.../claude-prompting-best-practices`(Use examples effectively)/ 2026-07-08 / 公式確認済み |
| 良い例の 3 条件: **Relevant(実ユースケースを反映)/ Diverse(エッジケースを含め、意図しないパターンを拾わせない多様性)/ Structured(`<example>` タグで囲む)** | 同上 / 2026-07-08 / 公式確認済み |
| **3〜5 個**が最良。Claude 自身に「例の妥当性・多様性を評価させる」「初期セットから追加例を生成させる」こともできる | 同上(Tip)/ 2026-07-08 / 公式確認済み |
| **思考と併用可**: few-shot 例の中で `<thinking>` タグを使って推論パターンを見せると、Claude は自分の拡張思考ブロックにそのスタイルを一般化する | 同上(Leverage thinking)/ 2026-07-08 / 公式確認済み |

---

## 4. 思考の制御(アダプティブ思考・effort・「考えさせる」プロンプト)

### 4.1 アダプティブ思考(adaptive thinking)

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| **アダプティブ思考が推奨**。`thinking: {type: "adaptive"}` で Claude がリクエストの複雑さに応じて**いつ・どれだけ考えるかを動的に決める**。手動の思考トークン予算(budget_tokens)を設定しない | `.../build-with-claude/adaptive-thinking` / 2026-07-08 / 公式確認済み |
| 対応: **Opus 4.8 / 4.7 / 4.6, Sonnet 5 / 4.6** で利用可。**Fable 5 / Mythos 5 は常時オンでアダプティブが唯一のモード**(`thinking:{type:"disabled"}` 不可)。**Opus 4.8 / 4.7 はアダプティブが唯一のモード**で、明示的に `type:"adaptive"` を設定しない限り思考はオフ。手動 `type:"enabled"` は **400 エラー** | 同上(Supported models)/ 2026-07-08 / 公式確認済み |
| **Sonnet 5** はアダプティブが既定オン(オフにするには `type:"disabled"` を明示)。**Opus 4.6 / Sonnet 4.6** は明示設定しない限りオフだが、手動 `enabled`+`budget_tokens` も受理(ただし非推奨) | 同上 / 2026-07-08 / 公式確認済み |
| Claude は **`effort` パラメータとクエリ複雑度**の 2 要素で思考量を調整。既定 effort(`high`)ではほぼ必ず思考する。低 effort では簡単な問いで思考を省く場合がある | 同上(How adaptive thinking works)/ 2026-07-08 / 公式確認済み |
| アダプティブは**インターリーブ思考(ツール呼び出しの合間の思考)を自動で有効化**する。エージェント用途に有効 | 同上 / 2026-07-08 / 公式確認済み |
| Anthropic 内部評価では「アダプティブ思考は拡張思考より確実に性能が良い」。最も賢い応答のためにアダプティブへの移行を推奨 | `.../claude-prompting-best-practices`(Leverage thinking)/ 2026-07-08 / ベンダー自己報告 |

### 4.2 effort パラメータ(`output_config.effort`)

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| レベルは **`low` / `medium` / `high`(既定)/ `xhigh` / `max`** の 5 段階。`high` は「パラメータ未指定と完全に同じ挙動」 | `.../build-with-claude/effort` / 2026-07-08 / 公式確認済み |
| **`xhigh` は一部モデル限定**: Fable 5, Mythos 5, Opus 4.8, Opus 4.7, Sonnet 5 で利用可。**`max` はアダプティブ対応の全モデル**で利用可 | 同上(Effort levels 表)/ 2026-07-08 / 公式確認済み |
| effort は**思考トークンだけでなく応答全体(テキスト・ツール呼び出し・関数引数)に効く**。低 effort ならツール呼び出しも減る。思考が有効でなくても効く | 同上(How effort works)/ 2026-07-08 / 公式確認済み |
| effort は**厳密なトークン予算ではなく挙動シグナル**。低 effort でも十分難しい問題なら思考する(ただし高 effort より少なく) | 同上(Note)/ 2026-07-08 / 公式確認済み |
| **モデル別の推奨開始点**: Opus 4.8 / 4.7 は「コーディング・エージェント用途は `xhigh`、他の知的タスクは最低 `high`」。Sonnet 5 は既定 `high`。Fable 5 は「まず既定 `high`、最も要求の高い作業は `xhigh`」 | 同上(各 Recommended effort 節)/ 2026-07-08 / 公式確認済み |
| **`xhigh` / `max` 実行時は `max_tokens` を大きく**(64k から調整推奨)。思考とツール・サブエージェントの余地を確保 | `.../prompting-claude-opus-4-8`(Note)/ 2026-07-08 / 公式確認済み |
| Claude Code の「ultracode」は API の追加 effort レベルではない。`xhigh` + マルチエージェント起動許可(mid-conversation system message 経由)の組み合わせ | `.../build-with-claude/effort`(Note)/ 2026-07-08 / 公式確認済み |

### 4.3 「考えさせる/考えさせない」プロンプト

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| アダプティブ思考の**トリガーはプロンプトで誘導可能**。思考が多すぎる場合は「Extended thinking adds latency and should only be used when it will meaningfully improve answer quality... When in doubt, respond directly.」、増やしたい場合は「This task involves multi-step reasoning. Think carefully before responding.」 | `.../adaptive-thinking`(Tuning thinking behavior)/ 2026-07-08 / 公式確認済み |
| **ユーザーターン単位でも誘導可**。ユーザーメッセージ末尾に "Please think hard before responding." で思考促進、"Answer directly without deliberating." で抑制。system と独立に効く | 同上 / 2026-07-08 / 公式確認済み |
| **細かい手順指示より一般的な指示**が良い。「think thoroughly」の方が人手のステップ列より良い推論を生むことが多い(Claude の推論は人が指示する以上に及ぶ) | `.../claude-prompting-best-practices`(Leverage thinking)/ 2026-07-08 / 公式確認済み |
| **自己チェックさせる**: 「Before you finish, verify your answer against [test criteria].」でエラーを確実に拾える(コード・数学で特に有効) | 同上 / 2026-07-08 / 公式確認済み |
| **思考オフ時の手動 CoT はフォールバック**として有効。`<thinking>` と `<answer>` で推論と最終出力を分離 | 同上 / 2026-07-08 / 公式確認済み |
| 思考オフ時、**Claude Opus 4.5 は "think" とその変化形に特に敏感**。"consider" / "evaluate" / "reason through" などの代替語を検討 | 同上(Note)/ 2026-07-08 / 公式確認済み |
| **`budget_tokens` は非推奨/廃止**: Opus 4.6・Sonnet 4.6 では機能するが非推奨。**Opus 4.7 以降・Fable 5・Mythos 5 では 400 エラー**。ハード上限が必要なら `effort` を下げるか `max_tokens` を使う | 同上 & `.../adaptive-thinking`(Warning)/ 2026-07-08 / 公式確認済み |
| 思考表示: 最新モデル(Fable 5, Mythos 5, Sonnet 5, Opus 4.8, Opus 4.7)は `thinking.display` の既定が **`"omitted"`**(思考テキストが空)。要約を見たいなら `display:"summarized"` を明示。Opus 4.6 / Sonnet 4.6 は既定 `"summarized"` | `.../adaptive-thinking`(Controlling thinking display)/ 2026-07-08 / 公式確認済み |

---

## 5. 出力制御(prefill・構造化出力・停止シーケンス)

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| **prefill(応答書き出し指定)は非対応化**。「Claude 4.6 モデル以降および Claude Mythos Preview では、最終 assistant ターンの prefill(部分的な assistant メッセージを与えて続きを書かせる)はサポート外」。該当モデルへの prefill 付きリクエストは **400 エラー**。モデルの知能・指示追従が向上し、多くの prefill 用途はもう不要 | `.../claude-prompting-best-practices`(Migrating away from prefilled responses)/ 2026-07-08 / 公式確認済み |
| prefill の代替(用途別移行先): **①出力形式強制 → 構造化出力(`output_config.format`)or「スキーマに従え」と指示**、②前置き除去 → system で「前置きなしで直接答えよ」or XML タグ or ツール呼び出し、③不当な拒否回避 → 拒否判断が改善済みなので不要、④継続 → 中断テキストをユーザーメッセージに移してから続けさせる or リトライ、⑤コンテキスト再注入 → ユーザーターンへ注入 or ツール/コンパクション経由 | 同上(各 Accordion)/ 2026-07-08 / 公式確認済み |
| 会話の**最終 assistant ターン以外**への assistant メッセージ追加は影響なし。**旧世代モデルは prefill を引き続きサポート** | 同上 / 2026-07-08 / 公式確認済み |
| **構造化出力**: パラメータは **`output_config.format`**(制約付きデコードでスキーマ準拠を保証。`JSON.parse` 失敗が無くなる)。**ベータの `output_format` から改名**され、ベータヘッダ不要。旧 `output_format` と旧ヘッダ `structured-outputs-2025-11-13` は移行期間中は動作。分類は「enum フィールドを持つツール」or 構造化出力を使う | `.../build-with-claude/structured-outputs` / 2026-07-08 / 公式確認済み |
| 構造化出力 GA 対応: Fable 5, Mythos 5, Opus 4.8, Mythos Preview, Opus 4.7, Opus 4.6, Sonnet 5, Sonnet 4.6, Sonnet 4.5, Opus 4.5, Haiku 4.5。**ツールの厳密スキーマ検証は `strict: true`**(併用可) | 同上 / 2026-07-08 / 公式確認済み |
| **出力形式の誘導 4 手法**: ①「するな」でなく「せよ」で書く(× "Do not use markdown" → ○ "compose ... in smoothly flowing prose paragraphs")、②XML 形式インジケータ、③**プロンプトのスタイルを望む出力スタイルに合わせる**(プロンプトから markdown を除くと出力の markdown も減る)、④詳細プロンプトで明示 | `.../claude-prompting-best-practices`(Control the format of responses)/ 2026-07-08 / 公式確認済み |
| 最新モデルは**数式に LaTeX を既定使用**。プレーンテキストが良ければ明示的に指示 | 同上(LaTeX output)/ 2026-07-08 / 公式確認済み |
| **停止シーケンス(`stop_sequences`)** は Messages API の標準パラメータだが、「Prompting best practices」ページではプロンプト技法として特筆されていない(prefill・構造化出力に置き換わっている印象) | 出典: 上記各ページに記載なし / 2026-07-08 / 未確認(プロンプトページ上の扱い)。API 標準機能自体は別途要裏取り |

---

## 6. 長文・長コンテキストの作法

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| 対象は大きな文書・データ豊富な入力(**20k+ トークン**) | `.../claude-prompting-best-practices`(Long context prompting)/ 2026-07-08 / 公式確認済み |
| **①長文データは上に**: 長文書・入力をクエリ・指示・例より**プロンプト上部**に置く。全モデルで性能向上 | 同上 / 2026-07-08 / 公式確認済み |
| **クエリを末尾に置くと応答品質が最大 30% 向上**(複雑・複数文書入力で特に。Anthropic のテスト値) | 同上(Note)/ 2026-07-08 / ベンダー自己報告 |
| **②文書は XML で構造化**: 複数文書は `<document>` タグで囲み、`<document_content>` と `<source>`(その他メタデータ)サブタグを付ける | 同上 / 2026-07-08 / 公式確認済み |
| **③引用でグラウンディング**: 長文タスクでは、作業前に**関連箇所を引用させてから**本題に入らせる(`<quotes>` タグに置かせる例あり)。ノイズを切り分けられる | 同上 / 2026-07-08 / 公式確認済み |
| Opus 4.8 は **1M トークンコンテキストを既定提供**(ベータヘッダ不要・長コンテキスト割増なし) | `.../models/migration-guide`(1M Context Window)/ 2026-07-08 / 公式確認済み |

---

## 7. ツール使用・エージェント文脈のプロンプト

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| 最新モデルは**精密な指示追従に訓練**されており、明示的な指示から利益を得る。「Can you suggest some changes」だと**提案だけで実装しない**ことがある。行動させたいなら「Change this function...」のように明示 | `.../claude-prompting-best-practices`(Tool usage)/ 2026-07-08 / 公式確認済み |
| 既定で行動的にしたいなら `<default_to_action>`、逆に慎重にしたいなら `<do_not_act_before_instructions>` のスニペットを system に入れる(いずれも公式提示) | 同上 / 2026-07-08 / 公式確認済み |
| **Opus 4.5 / 4.6 は system プロンプトへの反応が強く、旧世代向けの過剰プロンプトで over-trigger する**。「CRITICAL: You MUST use this tool when...」を「Use this tool when...」に**トーンダウン**せよ | 同上 / 2026-07-08 / 公式確認済み |
| **並列ツール呼び出し**: 独立した呼び出しは並列実行される。`<use_parallel_tool_calls>` スニペットで ~100% に引き上げ/抑制の調整が可能 | 同上(Optimize parallel tool calling)/ 2026-07-08 / 公式確認済み |
| **サブエージェントはネイティブにオーケストレーション**。明示指示なしで委任する。ただし **Opus 4.6 は多用癖**があり、直接 grep で足りる探索にもサブエージェントを立てがち。過剰時は「いつ使う/使わないか」を明示 | 同上(Subagent orchestration)/ 2026-07-08 / 公式確認済み |
| ツール定義側の作法: 「モデルがツールを使わない場合は、**なぜ・どう使うべきかを明確に記述**する」。effort を上げるとツール使用が増える(特に Opus 4.8) | `.../prompting-claude-opus-4-8`(Tool use triggering)/ 2026-07-08 / 公式確認済み |
| エージェント長期タスク: **インクリメンタルな進捗**重視。状態管理は**構造化データ = JSON、進捗ノート = 自由文、状態追跡 = git** を使い分ける。コンテキスト圧縮/新規ウィンドウ開始、テストを `tests.json` 等で保持、`init.sh` 等の QoL スクリプト、といった具体策を提示 | `.../claude-prompting-best-practices`(Agentic systems / State management)/ 2026-07-08 / 公式確認済み |
| **破壊的操作の確認**を促すスニペット、**過剰エンジニアリング抑制**(`Avoid over-engineering`)、**テスト通過に固執させない**、**未読コードを推測させない**(`<investigate_before_answering>`)など、エージェントコーディング向けの system スニペットが多数提示されている | 同上(Balancing autonomy / Overeagerness / Avoid focusing on passing tests / Minimizing hallucinations)/ 2026-07-08 / 公式確認済み |
| **プロンプトチェイニング**は、アダプティブ思考+サブエージェントで多段推論が内部処理される今も「中間出力を検査/特定パイプラインを強制したい時」に有用。最頻出は**自己修正**(下書き → レビュー → 改善を別 API 呼び出しで) | 同上(Chain complex prompts)/ 2026-07-08 / 公式確認済み |

---

## 8. 世代間の移行注意(何が変わったか)

| 事実 | 出典URL / 確認日 / 確度 |
| --- | --- |
| **より literal(逐語的)な指示解釈**: Opus 4.7 / 4.8 は Opus 4.6 より逐語的・明示的に解釈。**指示を暗黙に一般化しない/求めていない要求を推測しない**。広く適用したいなら**スコープを明示**(例: "Apply this formatting to every section, not just the first one") | `.../prompting-claude-opus-4-8`(More literal instruction following)& `.../models/migration-guide` / 2026-07-08 / 公式確認済み |
| **冗長性はタスク複雑度で自動調整**(固定の冗長性を既定にしない)。単純な検索は短く、オープンな分析は長く。特定の冗長性が必要なら明示調整 | 同上 / 2026-07-08 / 公式確認済み |
| **トーンはより直接的・opinionated**、validation フレーズ・絵文字は控えめ。プロダクトの声が重要なら再調整 | 同上 / 2026-07-08 / 公式確認済み |
| **ツール使用は控えめ**(推論寄り)。増やすには effort を上げる/「いつ・どう使うか」を明示 | 同上 / 2026-07-08 / 公式確認済み |
| **サブエージェント起動は控えめ**(Opus 4.8)。望むなら明示ガイダンス | `.../prompting-claude-opus-4-8`(Controlling subagent spawning)/ 2026-07-08 / 公式確認済み |
| **進捗更新は内蔵で高品質化**。「3 ツールごとに要約」等の強制スキャフォールドは**外してよい** | 同上(User-facing progress updates)/ 2026-07-08 / 公式確認済み |
| API 変更: **`temperature` / `top_p` / `top_k` の非既定値は 400 エラー**(Fable 5, Mythos 5, Sonnet 5, Opus 4.8, Opus 4.7)。挙動誘導はプロンプトで行う | `.../adaptive-thinking`(Validation changes)& `.../models/migration-guide` / 2026-07-08 / 公式確認済み |
| **新トークナイザ**(Opus 4.7 以降): テキスト処理で従来比 **1x〜1.35x(最大約 +35%)**のトークン数になり得る。`max_tokens` とコンパクション閾値に余裕を | `.../models/migration-guide`(Token Counting)/ 2026-07-08 / 公式確認済み(数値はベンダー自己報告) |
| 移行チェックリスト(Opus 4.7/4.8): モデル名更新 / サンプリングパラメータ削除 / `budget_tokens`→アダプティブ+effort / prefill 削除 / 思考表示の明示オプトイン / `max_tokens` 再調整(新トークナイザ)/ プロンプト挙動レビュー / 1M コンテキストのベータヘッダ削除 / effort 再評価 | 同上(Migration Checklist)/ 2026-07-08 / 公式確認済み |

---

## 9. 「効かない/不要になった俗説」(旧テクニックの陳腐化)

執筆時に「もう不要」「かえって逆効果」と書いてよい項目(すべて公式確認済み)。

| 陳腐化した/逆効果の技法 | 現行の推奨 | 出典URL / 確認日 |
| --- | --- | --- |
| **prefill(応答書き出し)依存** | 4.6 以降は 400 エラー。構造化出力 / system 指示 / XML / ツール呼び出しへ | `.../claude-prompting-best-practices`, `.../models/migration-guide` / 2026-07-08 |
| **`budget_tokens` 依存** | 4.7 以降・Fable/Mythos は 400。effort or `max_tokens` へ | `.../adaptive-thinking`, `.../effort` / 2026-07-08 |
| **過度な "CRITICAL" / "MUST" / 全大文字強調** | 4.5/4.6 以降は over-trigger。「Use this tool when...」程度に | `.../claude-prompting-best-practices`(Tool usage)/ 2026-07-08 |
| **「If in doubt, use [tool]」「Default to using [tool]」** | 現行は適切にトリガーするため over-trigger の原因。ターゲット化した「〜が理解を深める時に使う」へ | 同上(Overthinking and excessive thoroughness)/ 2026-07-08 |
| **anti-laziness / 「もっと徹底的に」系プロンプト** | 4.6 以降はより能動的。ダイヤルダウンせよ | 同上(Migration considerations)/ 2026-07-08 |
| **「するな(否定)」中心の形式指示** | 「せよ(肯定)」+ ポジティブ例の方が効く(特に Opus 4.8 の冗長性抑制) | `.../prompting-claude-opus-4-8`(Response length)/ 2026-07-08 |
| **手書きの詳細ステップで思考を縛る** | 「think thoroughly」等の一般指示の方が良い推論を生むことが多い | `.../claude-prompting-best-practices`(Leverage thinking)/ 2026-07-08 |
| **温度(temperature)でデザイン多様性を出す** | 4.8 では 400 エラー。「先に 4 案提示させる」方式へ | `.../prompting-claude-opus-4-8`(Design and frontend defaults)/ 2026-07-08 |

**注意(誤解しやすい点)**: 「XML タグ」「few-shot」「役割付与」「長文は上・クエリは下」といった**古典的テクニックは陳腐化していない**。陳腐化したのは主に「モデルの弱さを補うための強制系ハック(prefill・過剰強調・anti-laziness)」です。

---

## 10. 変わりやすい項目(定点観測すべきもの)

docs 本文で断定を避けるか `TODO(要確認)` を付けるべき、変化の速い項目。

1. **モデル世代とラインナップ**: 2026-07-08 時点は Fable 5 / Mythos 5 / Opus 4.8・4.7・4.6 / Sonnet 5・4.6 / Haiku 4.5。世代交代が速いので「〜時点」を明記。
2. **effort の仕様**: レベル名(low〜max)・`xhigh` の対応モデル・モデル別既定・推奨開始点は改版され得る。
3. **アダプティブ思考の対応と既定**: どのモデルが「常時オン/既定オン/明示オン/手動不可」かはモデルごとに異なり変わる。`budget_tokens` の廃止範囲も拡大中。
4. **prefill の対応**: 「4.6 以降で最終ターン prefill 不可」。旧世代は可。境界がずれる可能性。
5. **構造化出力パラメータ**: `output_format`(ベータ)→ `output_config.format` の移行期間中。旧パラメータ/旧ヘッダのサポート打ち切り時期は要監視。
6. **思考表示の既定**: 最新モデルは `display:"omitted"` 既定(旧: `"summarized"`)。サイレント変更なので注意喚起価値あり。
7. **トークナイザ変更**: Opus 4.7 以降で +最大 35%。コスト・`max_tokens` 見積りに影響。
8. **ミッドセッション system メッセージ**: 現状 Opus 4.8 のみ。対応モデル拡大の可能性。
9. **サンプリングパラメータの 400 化**: 対象モデルが世代ごとに増減し得る。
10. **ドキュメント構成自体**: 個別テクニックページ → 単一「best practices」ページへの統合が進行中。URL・参照先が動く(§失敗記録)。

---

## WebFetch 失敗・取得不能の記録

| 対象 URL | 結果 | メモ |
| --- | --- | --- |
| `.../prompt-engineering/prefill-claudes-response` | **取得はできたが内容は「Prompt engineering overview」ページ**が返った | 旧・個別 prefill ページは廃止/統合済み。prefill の実質的内容は best-practices の "Migrating away from prefilled responses" 節にある |
| `.../prompt-engineering/be-clear-and-direct` | **取得できたが「Prompting best practices」ページ**が返った | 旧・個別ページは best-practices に統合。内容は §1・§2 で採録済み |
| `.../prompt-engineering/use-xml-tags` | **取得できたが「Prompting best practices」ページ**が返った | 同上。内容は §2 で採録済み |
| `.../prompt-engineering/system-prompts` | **個別取得せず** | best-practices の "Give Claude a role" と migration-guide の mid-conversation system で代替済み。独立ページの現存は未確認 |
| `.../prompt-engineering/chain-of-thought` | **個別取得せず** | best-practices の "Leverage thinking" / adaptive-thinking で代替済み。独立ページの現存は未確認 |
| `.../prompt-engineering/use-examples-multishot` | **個別取得せず** | best-practices の "Use examples effectively" で代替済み。独立ページの現存は未確認 |
| `.../prompt-engineering/long-context-tips` | **個別取得せず** | best-practices の "Long context prompting" で代替済み。独立ページの現存は未確認 |
| `stop_sequences` のプロンプト面での扱い | **確認できず** | best-practices・structured-outputs いずれのページにも停止シーケンスをプロンプト技法として扱う記述なし。Messages API の標準パラメータとしての最新仕様は別途 API リファレンスで要確認 |
| `prompting-claude-sonnet-5` / `prompting-claude-fable-5` | **個別取得せず** | best-practices・effort・adaptive-thinking から Sonnet 5 / Fable 5 の要点は間接採録済み。深掘りが必要なら追加取得を推奨 |

> **TODO(要確認):** `stop_sequences` の現行 Messages API 仕様(最新モデルでの対応可否)を API リファレンスで確認する(最終確認: 2026-07)。また Sonnet 5 / Fable 5 の個別プロンプトページ本文を必要に応じて追加取得する(最終確認: 2026-07)。
