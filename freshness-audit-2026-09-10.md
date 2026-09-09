# 2026-09-10 全系統の鮮度監査・更新候補一覧

基準日: **2026-09-10（日本時間）**。対象コミット: 7eba40d41b49e05afabc0fa97b052e9b17da95d0。記事の現記述・行番号はこのコミットに対するものです。日付が「現表示」「確認日」の場合、公開日や仕様変更日を意味しません。

**更新候補 107 件（訂正必要 56 件、補足推奨 51 件）を特定しました。** 優先度は P1 14 件 / P2 75 件 / P3 18 件です。関連対象は学習記事 48 本、research・サンプル・設定・ROADMAPを含め 94 ファイルです。対象記事のすべてで本文改稿が必須という意味ではありません。

## 調査範囲と判定の読み方

- 全199記事と16セクションREADMEを列挙し、モデル名、版、期限、規約、URL、TODOから鮮度リスクを抽出しました。TODO(要確認)は186件 / 121記事です。
- ROADMAPの定点観測16系統について、公式文書、リリースノート、法令・行政資料、原論文、公式リポジトリのLICENSE、パッケージレジストリを照合しました。変更候補の根拠URLは重複を除いて 206 本です。
- 全199記事の全主張を外部資料で逐条検証したものではありません。指摘が付かない記事は、リスク抽出で具体的な更新候補を記録していない状態です。記事単位の結果は[機械可読台帳](research/freshness-audit-data-2026-09-10.json)に残しました。
- 新規発表だけでなく、前回観測より前に公開されていた情報の取りこぼし、比較表の同期漏れ、以前取得できなかった一次資料への到達も含みます。Soraの終了告知、FISC第14版、Helix02等を9月の新発表とは扱いません。
- API実呼出し、課金を伴う学習、実機ロボット、各国法務判断、全ベンチマークの再実行は実施していません。一次資料での仕様確認と、実環境での動作・適合確認は分けています。
- 今回は洗い出しの成果物です。記事本文、front matter、依存バージョン、ROADMAPの完了状態は変更していません。先行する品質レビューの修正完了と、今回の鮮度更新の完了は別です。

| 分類 | 意味 |
| --- | --- |
| 訂正必要 | 現記述が一次資料と食い違う、確認済み事項を未確認としている、参照先や版の更新が必要です。researchだけの訂正も含みます。 |
| 補足推奨 | 新しい選択肢・条件を加えると設計判断に役立ちます。現行実装の故障や旧版のサポート終了を意味しません。 |
| 確認不能 | 一次資料未取得・取得範囲不足・資料間の不整合・実環境未検証です。後半の検証範囲に残し、変更なしと扱いません。 |

| 優先度 | 選定基準 |
| --- | --- |
| P1 | 近い終了期限、契約・保持・ライセンス・費用制御、法令や業界基準の採用判断を誤らせる項目です。まず訂正します。 |
| P2 | モデル/API互換性、提供段階、評価・設計判断、重要な調査TODOの解消です。関連する記事をまとめて更新します。 |
| P3 | 任意の新事例・参照情報・書誌・互換更新候補です。新しいという理由だけで導入を必須にしません。 |

## 期限が近い項目

公式に公表された予定・適用日です。日付が到来したサービスを実操作して停止確認したという意味ではありません。

| 日付 | 対象・必要な更新 | 指摘 |
| --- | --- | --- |
| 2026-09-10（本日） | Bedrock Claude 3 Haiku EOL。旧モデルのFT経路を新規採用可能な例として残さない | FT02 |
| 2026-09-14 | Nova Sonic v1 / Nova Premier EOL。Nova 2系列と分離 | A02 |
| 2026-09-16 | NIST AI文書化Zero Draftの意見期限。確定規格ではない | GOV10 |
| 2026-09中旬以降 | PPCの改正法関係の政令・規則・指針等の段階的な検討・意見募集予定 | GOV03 |
| 2026-09-23予定 | Colorado規則案の次回提示予定。意見期限は10/26 | GOV06 |
| 2026-09-24 | OpenAI Videos API / Sora 2 APIモデル終了 | A01 |
| 2026-09-30 | Nova Canvas / Reel・旧Gemini Omni Flash previewの終了。WorkHQの対象Studio/Worker版はサポート終了 | A02 / A04 / RPA01 |
| 2026-10 | WinActor AI連携の無制限利用から上限・追加パックへ変更 | RPA02 |
| 2026-10-02 | Copilotの一部選択モデル廃止。提供元API全体とは別 | T10 |
| 2026-10-26予定 | 日本のAIプリンシプル・コード届出開始 | TS-01 |
| 2026-12-02 | EU AI Actの既存生成AI向け経過措置・追加禁止行為に関する期限 | GOV07 |
| 2027-01-01 | Colorado ADMT/チャットボット、Californiaのプラットフォーム義務。撮影機器メーカーは2028-01-01 | GOV04 / GOV06 |
| 2027-01-17 | 改正個人情報保護法の一部罰則の施行。全面施行日とは別 | GOV03 |
| 2027-02-26 | OpenAIの旧音声認識API群終了 | A03 |

各日付の根拠と対象モデル・地域・義務主体は、下記の同じIDの詳細を参照してください。

## P1の着手一覧

| ID | 訂正項目 | 主な対象 |
| --- | --- | --- |
| M07 | Qwen3.8 のライセンス未確認を解消 | [docs/03-implementation/llm-landscape.md:97](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/llm-landscape.md:104](docs/03-implementation/llm-landscape.md) |
| A01 | Videos API / Sora 2 APIモデルの9月24日終了を明記 | [research/multimodal/generation.md:85](research/multimodal/generation.md) / [research/multimodal/generation.md:89](research/multimodal/generation.md) |
| A02 | Nova Canvas / Reel / Sonic の提供期限 | [research/multimodal/generation.md:33](research/multimodal/generation.md) / [research/multimodal/generation.md:109](research/multimodal/generation.md) |
| M09 | Mistral Medium 3.5 は重み公開済み・Modified MIT | [docs/03-implementation/llm-landscape.md:104](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/llm-landscape.md:107](docs/03-implementation/llm-landscape.md) |
| M10 | Kimi K3 の重み公開と独自契約条件を確認 | [docs/03-implementation/llm-landscape.md:109](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/llm-landscape.md:167](docs/03-implementation/llm-landscape.md) |
| FT02 | Claude 3 Haiku の Bedrock FT 経路と本日のEOL | [research/professional/fine-tuning.md:110](research/professional/fine-tuning.md) / [docs/03-implementation/fine-tuning-and-distillation.md:73](docs/03-implementation/fine-tuning-and-distillation.md) |
| GOV01 | FISC 安全対策基準は第14版 | [docs/09-business/industry-regulations-map.md:72](docs/09-business/industry-regulations-map.md) / [docs/09-business/industry-regulations-map.md:157](docs/09-business/industry-regulations-map.md) |
| GOV02 | FDUA ガイドライン1.2を反映 | [docs/09-business/industry-regulations-map.md:74](docs/09-business/industry-regulations-map.md) / [research/supplementary/regulations.md](research/supplementary/regulations.md) |
| GOV03 | 個人情報保護法改正の法番号・段階施行・PPC予定 | [docs/09-business/industry-regulations-map.md:171](docs/09-business/industry-regulations-map.md) / [docs/09-business/industry-regulations-map.md:175](docs/09-business/industry-regulations-map.md) |
| GOV04 | California AI透明性法の義務主体と日付を分離 | [docs/06-security/compliance-and-governance.md:61](docs/06-security/compliance-and-governance.md) |
| TS-01 | 知財本部AIプリンシプル・コードの正式公開と申出開始予定を反映 | [docs/09-business/ai-copyright-and-ip-map.md:174](docs/09-business/ai-copyright-and-ip-map.md) / [docs/09-business/ai-copyright-and-ip-map.md:183](docs/09-business/ai-copyright-and-ip-map.md) |
| T01 | Windsurfの現行契約と学習オプトアウト条件を更新 | [docs/08-coding-agents/windsurf.md:77](docs/08-coding-agents/windsurf.md) / [docs/08-coding-agents/windsurf.md:106](docs/08-coding-agents/windsurf.md) |
| T02 | Cursor Privacy Modeの保持例外とBYOKの経路を反映 | [docs/08-coding-agents/cursor.md:56](docs/08-coding-agents/cursor.md) / [docs/08-coding-agents/cursor.md:70](docs/08-coding-agents/cursor.md) |
| T03 | Claude Codeのmax-turns既定10という誤記を訂正 | [docs/08-coding-agents/claude-code-in-practice.md:72](docs/08-coding-agents/claude-code-in-practice.md) / [docs/08-coding-agents/claude-code-in-practice.md:132](docs/08-coding-agents/claude-code-in-practice.md) |

## 全更新候補の詳細

各項目の「更新案」は今回の監査による提案です。「現記述」は対象箇所の要旨です。適用条件・例外を保持したまま編集してください。

### モデル・プロンプト・ライセンス

#### M07 / P1 / 訂正必要 — Qwen3.8 のライセンス未確認を解消

**対象:** [docs/03-implementation/llm-landscape.md:97](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/llm-landscape.md:104](docs/03-implementation/llm-landscape.md) / [research/models/open-weights.md](research/models/open-weights.md)

**現記述:** Qwen3.8はライセンス未確認。3.6までApache-2.0。

**確認結果・更新案:** 対象2.4T-A95B-FP8は独自Qwen3.8-Max License。一定規模製品の表示義務、MaaS/AI Work Assistant事業で連結年間収益5千万ドル超の場合の別契約、内部利用例外を整理。全Qwen系列へ一般化しない。

**資料の日付:** 2026-09-10現行資料確認（公開日未確認）。**アクセス日:** 2026-09-10。 [一次資料1（huggingface.co）](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B-FP8/blob/main/LICENSE)

#### M09 / P1 / 訂正必要 — Mistral Medium 3.5 は重み公開済み・Modified MIT

**対象:** [docs/03-implementation/llm-landscape.md:104](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/llm-landscape.md:107](docs/03-implementation/llm-landscape.md) / [research/models/open-weights.md:155](research/models/open-weights.md) / [research/models/open-weights.md:235](research/models/open-weights.md)

**現記述:** 最上位Medium3.5はプロプライエタリ/API専用。Mistralオープン系は追加条件なしと総括。

**確認結果・更新案:** 公式にMedium3.5-128Bの重み公開、256k contextを確認。Modified MITは会社/雇用主の前月連結月商2千万ドル超なら権利行使不可で別商用契約または公式ホスト利用が必要。Large3等Apache2.0とは個別に区別する。

**資料の日付:** 2026-04-28公開 / 2026-09-10条文確認。**アクセス日:** 2026-09-10。 [一次資料1（huggingface.co）](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B) / [一次資料2（huggingface.co）](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B/blob/main/LICENSE) / [一次資料3（docs.mistral.ai）](https://docs.mistral.ai/resources/changelogs)

#### M10 / P1 / 訂正必要 — Kimi K3 の重み公開と独自契約条件を確認

**対象:** [docs/03-implementation/llm-landscape.md:109](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/llm-landscape.md:167](docs/03-implementation/llm-landscape.md) / [research/models/open-weights.md:250](research/models/open-weights.md)

**現記述:** K2系を紹介、K3の重み公開は未一次確認。

**確認結果・更新案:** Moonshot公式配布とKimi K3 Licenseを確認。MaaS事業者の連結12か月収益2千万ドル超の別契約、一定規模製品のUI表示義務、内部利用/公式製品・認定推論パートナー例外を記録。Qwen3.8の5千万ドル/AI Work Assistant条件とは異なるため一括化しない。

**資料の日付:** 2026-09-10現表示。**アクセス日:** 2026-09-10。 [一次資料1（huggingface.co）](https://huggingface.co/moonshotai/Kimi-K3) / [一次資料2（huggingface.co）](https://huggingface.co/moonshotai/Kimi-K3/blob/main/LICENSE)

#### M01 / P2 / 訂正必要 — Claude Fable 5.1 とキャッシュ価格を同期

**対象:** [docs/03-implementation/llm-landscape.md:39](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/claude-prompting.md:90](docs/03-implementation/claude-prompting.md) / [research/models/anthropic.md](research/models/anthropic.md) / [research/prompting/anthropic.md](research/prompting/anthropic.md)

**現記述:** Fable 5を最高能力の例とし、キャッシュ読取を入力の約1割と一般化。

**確認結果・更新案:** 9/1公開のFable 5.1を追加。入力/出力$10/$50、読取$0.25/MTok(入力の2.5%)を他モデルの10%と分ける。常時adaptive thinkingと30日保持条件も同期。

**資料の日付:** 2026-09-01。**アクセス日:** 2026-09-10。 [一次資料1（platform.claude.com）](https://platform.claude.com/docs/en/models/overview) / [一次資料2（platform.claude.com）](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1)

#### M02 / P2 / 訂正必要 — Gemini 3.8 Flash を現行カタログとプロンプトへ反映

**対象:** [docs/03-implementation/llm-landscape.md:80](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/gemini-prompting.md:49](docs/03-implementation/gemini-prompting.md) / [docs/03-implementation/cross-model-prompting.md:54](docs/03-implementation/cross-model-prompting.md) / [research/models/google.md](research/models/google.md) / [research/prompting/google.md](research/prompting/google.md)

**現記述:** 3.7 Flashを最新とし、3.6/3.7の個別仕様に未確認が残る。

**確認結果・更新案:** 9/2 GAの3.8 Flash、入力1,048,576/出力65,536、low/medium/high・既定medium・minimal非対応を明記。3.7導入価格と3.8価格を混同しない。

**資料の日付:** 2026-09-02。**アクセス日:** 2026-09-10。 [一次資料1（ai.google.dev）](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) / [一次資料2（ai.google.dev）](https://ai.google.dev/gemini-api/docs/latest-model) / [一次資料3（ai.google.dev）](https://ai.google.dev/gemini-api/docs/changelog)

#### M03 / P2 / 訂正必要 — Astra の移行条件を OpenAI 特化ガイドにも反映

**対象:** [docs/03-implementation/openai-prompting.md:47](docs/03-implementation/openai-prompting.md) / [docs/03-implementation/openai-prompting.md:77](docs/03-implementation/openai-prompting.md) / [docs/03-implementation/cross-model-prompting.md:54](docs/03-implementation/cross-model-prompting.md) / [research/prompting/openai.md](research/prompting/openai.md)

**現記述:** モデル一覧はAstra対応だが特化ガイドは5.6中心。

**確認結果・更新案:** Astraのnone/minimal非対応、tool callingはResponses、sampling非対応、EU residencyのFast不可、承認で止まり過ぎる場合の指示調整をモデル別に追記。5.6の有効設定を一律削除しない。

**資料の日付:** 2026-09-10現行資料確認（公開日未確認）。**アクセス日:** 2026-09-10。 [一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/guides/latest-model) / [一次資料2（developers.openai.com）](https://developers.openai.com/api/docs/models/gpt-6-astra)

#### M04 / P2 / 補足推奨 — 非同期ツールと実行中の指示変更を具体化

**対象:** [docs/03-implementation/streaming-and-agent-ux.md](docs/03-implementation/streaming-and-agent-ux.md) / [docs/02-architecture/async-and-durable-agents.md](docs/02-architecture/async-and-durable-agents.md) / [docs/02-architecture/agent-api-design.md](docs/02-architecture/agent-api-design.md) / [docs/03-implementation/openai-prompting.md](docs/03-implementation/openai-prompting.md)

**現記述:** 中断・軌道修正は一般原則中心で新APIへの対応がない。

**確認結果・更新案:** async:trueのツール結果をcall_idで返す設計とWebSocketのmid-turn steeringを例示。未完了ツール、キャンセル、遅延結果、状態と承認の再評価を設計判断に加える。耐久実行の保証とは分離。

**資料の日付:** 2026-09-10現行資料確認（公開日未確認）。**アクセス日:** 2026-09-10。 [一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/guides/async-tool-calling) / [一次資料2（developers.openai.com）](https://developers.openai.com/api/docs/guides/steering)

#### M05 / P2 / 訂正必要 — Fable 5.1 の tool_choice と思考履歴の非互換

**対象:** [docs/03-implementation/claude-prompting.md:125](docs/03-implementation/claude-prompting.md) / [docs/03-implementation/cross-model-prompting.md:73](docs/03-implementation/cross-model-prompting.md) / [docs/02-architecture/context-compaction-and-isolation.md](docs/02-architecture/context-compaction-and-isolation.md) / [research/prompting/anthropic.md](research/prompting/anthropic.md)

**現記述:** 旧世代を前提に出力制御・履歴の再利用を説明。

**確認結果・更新案:** tool_choice any/toolが400、strict tool use等との違い、8/31以降新規アカウントで思考ブロック前のsystem/tools/履歴改変が400になる条件を追加。per-message effortとturn-scoped systemのbeta条件を記録。

**資料の日付:** 2026-09-01。**アクセス日:** 2026-09-10。 [一次資料1（platform.claude.com）](https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1) / [一次資料2（platform.claude.com）](https://platform.claude.com/docs/en/release-notes/overview)

#### M06 / P2 / 補足推奨 — キャッシュの世代別課金と途中設定変更

**対象:** [docs/05-operations/cost-management.md:51](docs/05-operations/cost-management.md) / [docs/03-implementation/openai-prompting.md:108](docs/03-implementation/openai-prompting.md) / [research/models/openai.md](research/models/openai.md) / [research/prompting/anthropic.md](research/prompting/anthropic.md)

**現記述:** 前方一致の原則のみ。OpenAI調査メモには5.6 pro価格など未確認が残る。

**確認結果・更新案:** OpenAIのprompt_cache_options.ttl、cache_write_tokens、境界と書込課金を実装時チェックに追加。config_update/Claude per-message effortでキャッシュを保持する条件と非対応条件を示す。system本文の書き換えと、API仕様が認めるeffort等の設定変更は別に扱う。設定変更の例から任意のプロンプト変更でキャッシュを保持できるとは一般化しない。

**資料の日付:** 2026-09-10現行資料確認（公開日未確認）。**アクセス日:** 2026-09-10。 [一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/guides/prompt-caching) / [一次資料2（developers.openai.com）](https://developers.openai.com/api/docs/guides/latest-model) / [一次資料3（platform.claude.com）](https://platform.claude.com/docs/en/release-notes/overview)

#### M08 / P2 / 訂正必要 — Gemini の thinking_budget を一律の移行対象にしない

**対象:** [docs/03-implementation/gemini-prompting.md:82](docs/03-implementation/gemini-prompting.md) / [docs/03-implementation/gemini-prompting.md:114](docs/03-implementation/gemini-prompting.md) / [docs/03-implementation/gemini-prompting.md:144](docs/03-implementation/gemini-prompting.md) / [research/prompting/google.md](research/prompting/google.md)

**現記述:** Thinkingガイドから数値予算の記述が消えたため継続対応不明、既存依存の移行を推奨。

**確認結果・更新案:** 公式Python SDKのThinkingConfigにはthinking_budgetが現存し、Live API公式も2.5 FlashのthinkingBudgetを説明している。3系thinking_level推奨は維持しつつ、モデル/API別の対応表に訂正する。SDKの型の存在だけで全モデルの受理は保証しない。GenerateContent RESTページは取得タイムアウトで、実呼出し互換性は未検証。

**資料の日付:** 2026-09-10現表示。**アクセス日:** 2026-09-10。 [一次資料1（raw.githubusercontent.com）](https://raw.githubusercontent.com/googleapis/python-genai/main/google/genai/types.py) / [一次資料2（ai.google.dev）](https://ai.google.dev/gemini-api/docs/live-api/capabilities)

#### M11 / P2 / 補足推奨 — DeepSeek V4 のGA・API・価格条件を更新

**対象:** [research/models/open-weights.md:111](research/models/open-weights.md) / [docs/03-implementation/llm-landscape.md:106](docs/03-implementation/llm-landscape.md)

**現記述:** 4/24版V4と旧モード区分、8/18は基本ライン変更なしのみ。

**確認結果・更新案:** 8/13 Pro GA、Pro/Flashのlow/high/max、Responses APIネイティブ対応、8/16 16:00 UTC導入のpeak/off-peak料金をメモへ追記。モデル名据置でも提供段階や経路・価格が変わる実例にする。

**資料の日付:** 2026-08-13 / 2026-08-16。**アクセス日:** 2026-09-10。 [一次資料1（api-docs.deepseek.com）](https://api-docs.deepseek.com/news/news260813/)

### コーディングエージェント

#### T01 / P1 / 訂正必要 — Windsurfの現行契約と学習オプトアウト条件を更新

**対象:** [docs/08-coding-agents/windsurf.md:77](docs/08-coding-agents/windsurf.md) / [docs/08-coding-agents/windsurf.md:106](docs/08-coding-agents/windsurf.md) / [docs/08-coding-agents/windsurf.md:145](docs/08-coding-agents/windsurf.md) / [docs/08-coding-agents/coding-agents-comparison.md:72](docs/08-coding-agents/coding-agents-comparison.md) / [research/coding-agents/data-handling-index.md:15](research/coding-agents/data-handling-index.md) / [research/coding-agents/data-handling-index.md:16](research/coding-agents/data-handling-index.md)

**現記述:** 旧4月規約を前提に、Chatの学習オプトアウトでは利用できないと説明しています。

**確認結果・更新案:** 旧規約URLは2026-06-30のCognition Platform Termsへ転送されます。§3.3.1の有料tierでの学習オプトアウト（Teamsは管理者のみ）と、§3.3.3の安全・不正・法的保持の例外へ更新します。Freeを含む全プラン対応やChat停止の継続は断定しません。既存契約の重大変更は掲載30日後の適用という条件も区別します。

**資料の日付:** 2026-06-30（既存契約の重大変更は掲載30日後）。**アクセス日:** 2026-09-10。 [一次資料1（cognition.com）](https://cognition.com/legal/platform-terms-of-service) / [一次資料2（docs.devin.ai）](https://docs.devin.ai/admin/security)

#### T02 / P1 / 訂正必要 — Cursor Privacy Modeの保持例外とBYOKの経路を反映

**対象:** [docs/08-coding-agents/cursor.md:56](docs/08-coding-agents/cursor.md) / [docs/08-coding-agents/cursor.md:70](docs/08-coding-agents/cursor.md) / [docs/08-coding-agents/cursor.md:71](docs/08-coding-agents/cursor.md) / [docs/08-coding-agents/cursor.md:93](docs/08-coding-agents/cursor.md) / [research/coding-agents/data-handling-index.md:14](research/coding-agents/data-handling-index.md)

**現記述:** Privacy Modeについて、学習・保持がないことを広く保証する説明になっています。

**確認結果・更新案:** 2026-09-03のData Useに基づき、不正分類器でフラグが立った場合の保持、非ZDRモデルのユーザー表示と管理者opt-in、暗号化された一時ファイルキャッシュを区別します。コード保存をCloud Agentsだけに限定せず、BYOKもCursor backend経由であることを反映します。

**資料の日付:** 2026-09-03。**アクセス日:** 2026-09-10。 [一次資料1（cursor.com）](https://cursor.com/data-use)

#### T03 / P1 / 訂正必要 — Claude Codeのmax-turns既定10という誤記を訂正

**対象:** [docs/08-coding-agents/claude-code-in-practice.md:72](docs/08-coding-agents/claude-code-in-practice.md) / [docs/08-coding-agents/claude-code-in-practice.md:132](docs/08-coding-agents/claude-code-in-practice.md) / [research/coding-agents/claude-code-practice.md](research/coding-agents/claude-code-practice.md)

**現記述:** --max-turnsの既定値を10としています。

**確認結果・更新案:** 現行CLIの既定値は無制限です。GitHub Actionのclaude_argsも既定は空であり、10は明示的に設定する例として扱います。既定の上限があるという前提で無人実行の費用・終了条件を設計しないよう訂正します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（code.claude.com）](https://code.claude.com/docs/en/cli-reference) / [一次資料2（code.claude.com）](https://code.claude.com/docs/en/github-actions) / [一次資料3（github.com）](https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md)

#### T04 / P2 / 訂正必要 — Claude Codeのeffort変更時にキャッシュを維持できる条件を反映

**対象:** [docs/08-coding-agents/claude-code-in-practice.md:62](docs/08-coding-agents/claude-code-in-practice.md) / [docs/08-coding-agents/claude-code-in-practice.md:92](docs/08-coding-agents/claude-code-in-practice.md) / [docs/08-coding-agents/claude-code-in-practice.md:99](docs/08-coding-agents/claude-code-in-practice.md) / [research/coding-agents/claude-code-practice.md](research/coding-agents/claude-code-practice.md)

**現記述:** effortの変更は常にキャッシュを失効させると説明しています。

**確認結果・更新案:** Claude Code v2.1.260以降でFable 5.1をAPI keyまたはClaude subscriptionで使用する場合、effort変更時もキャッシュを維持できます。Bedrock、Google Agent Platform、ゲートウェイ等は対象外であり、betaおよびHIPAAの条件も確認対象として明示します。モデル変更による失効と分けて説明します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（code.claude.com）](https://code.claude.com/docs/en/prompt-caching)

#### T05 / P2 / 補足推奨 — Claude Codeの主会話とsubagentのキャッシュTTL設定を追加

**対象:** [docs/08-coding-agents/claude-code-in-practice.md:60](docs/08-coding-agents/claude-code-in-practice.md) / [research/coding-agents/claude-code-practice.md:217](research/coding-agents/claude-code-practice.md)

**現記述:** 主会話1時間、subagent 5分という固定の整理です。

**確認結果・更新案:** v2.1.242以降のpromptCacheTtl / CLAUDE_CODE_PROMPT_CACHE_TTLと、subagentPromptCacheTtl / CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTLを追記します。旧ENABLE_PROMPT_CACHING_1Hは廃止と扱わず、設定の優先順位として整理します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（code.claude.com）](https://code.claude.com/docs/en/prompt-caching)

#### T06 / P2 / 補足推奨 — Claude Codeのself-hosted environments public betaを追加

**対象:** [docs/08-coding-agents/claude-code.md:48](docs/08-coding-agents/claude-code.md) / [docs/08-coding-agents/claude-code.md:55](docs/08-coding-agents/claude-code.md) / [docs/08-coding-agents/claude-code-in-practice.md:74](docs/08-coding-agents/claude-code-in-practice.md) / [docs/08-coding-agents/coding-agents-comparison.md:65](docs/08-coding-agents/coding-agents-comparison.md)

**現記述:** クラウド実行をAnthropicのVM上の実行として説明しています。

**確認結果・更新案:** Team / Enterprise向けで既定off、CLI v2.1.224以降のself-hosted environments public betaを追加します。web、app、CLI、Routinesのタスクを自社実行基盤に接続できますが、推論・キューには外向きHTTPSが必要です。ZDR組織、Security、Code Reviewは対象外であり、推論のオンプレミス化とは区別します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（code.claude.com）](https://code.claude.com/docs/en/self-hosted-environments)

#### T07 / P2 / 補足推奨 — Cursorのself-hosted machinesと共有poolを比較へ追加

**対象:** [docs/08-coding-agents/cursor.md:46](docs/08-coding-agents/cursor.md) / [docs/08-coding-agents/cursor.md:54](docs/08-coding-agents/cursor.md) / [docs/08-coding-agents/coding-agents-comparison.md:71](docs/08-coding-agents/coding-agents-comparison.md)

**現記述:** Cloud Agentの実行環境をCloud VMのみとして整理しています。

**確認結果・更新案:** 2026-09-02公開のself-hosted machines、My Machines、team poolによる自社実行基盤の選択肢を追加します。ツール実行環境の変更であり、モデル通信のオンプレミス化を意味しないことを明確にします。

**資料の日付:** 2026-09-02。**アクセス日:** 2026-09-10。 [一次資料1（cursor.com）](https://cursor.com/changelog) / [一次資料2（cursor.com）](https://cursor.com/docs/cloud-agent/self-hosted/integrations)

#### T08 / P2 / 補足推奨 — Copilot appとCLIのcontent exclusion GAをIDEと分けて記載

**対象:** [docs/08-coding-agents/github-copilot.md:74](docs/08-coding-agents/github-copilot.md) / [docs/08-coding-agents/github-copilot.md:98](docs/08-coding-agents/github-copilot.md) / [docs/08-coding-agents/github-copilot.md:144](docs/08-coding-agents/github-copilot.md) / [research/coding-agents/github-copilot.md](research/coding-agents/github-copilot.md)

**現記述:** Agent系のcontent exclusion非対応を広くまとめています。

**確認結果・更新案:** 2026-09-02にBusiness / EnterpriseのCopilot appとCLIでcontent exclusionがGAになりました。IDEのEdit / Agentは引き続き対象外です。cloud agentをappと同一視せず、その適用範囲の未確認TODOは維持します。

**資料の日付:** 2026-09-02。**アクセス日:** 2026-09-10。 [一次資料1（github.blog）](https://github.blog/changelog/2026-09-02-content-exclusions-generally-available-in-copilot-app-and-cli/) / [一次資料2（docs.github.com）](https://docs.github.com/en/copilot/concepts/context/content-exclusion)

#### T09 / P2 / 補足推奨 — Copilot code reviewのPR承認public previewを追加

**対象:** [docs/08-coding-agents/github-copilot.md:50](docs/08-coding-agents/github-copilot.md) / [docs/08-coding-agents/github-copilot.md:93](docs/08-coding-agents/github-copilot.md) / [docs/08-coding-agents/github-copilot-in-practice.md:41](docs/08-coding-agents/github-copilot-in-practice.md) / [docs/08-coding-agents/github-copilot-in-practice.md:79](docs/08-coding-agents/github-copilot-in-practice.md)

**現記述:** Copilotによるレビューを人の承認に先立つレビューとして扱っています。

**確認結果・更新案:** 2026-09-01のpublic previewではCopilotのPR approvalをrequired approvalsへ算入できます。既定off、管理者によるpath指定、新規commitによる承認失効を説明します。人による承認を必須にする運用方針は、製品が承認できるかという能力と分けて記載します。

**資料の日付:** 2026-09-01。**アクセス日:** 2026-09-10。 [一次資料1（github.blog）](https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests/)

#### T10 / P2 / 補足推奨 — Copilot選択モデルの2026年10月2日廃止予定を追加

**対象:** [docs/08-coding-agents/github-copilot.md:140](docs/08-coding-agents/github-copilot.md) / [docs/08-coding-agents/github-copilot.md:142](docs/08-coding-agents/github-copilot.md) / [research/coding-agents/github-copilot.md](research/coding-agents/github-copilot.md)

**現記述:** 2026-09-03に告知されたCopilotの選択モデル廃止予定が未反映です。

**確認結果・更新案:** 2026-10-02のGemini 3.5 / 3.6 Flash、Kimi K2.7 Code、Claude Opus 4.7の廃止と、Gemini 3.8 Flash、Kimi K3、Claude Opus 5への移行先を追加します。Copilot上の提供終了であり、ベンダーAPI自体の退役とは混同しません。

**資料の日付:** 2026-09-03告知、2026-10-02廃止予定。**アクセス日:** 2026-09-10。 [一次資料1（github.blog）](https://github.blog/changelog/2026-09-03-upcoming-deprecation-of-selected-github-copilot-models/)

#### T11 / P2 / 補足推奨 — Codexのpermission profiles betaと旧設定の関係を追加

**対象:** [docs/08-coding-agents/openai-codex.md:71](docs/08-coding-agents/openai-codex.md) / [docs/08-coding-agents/openai-codex.md:79](docs/08-coding-agents/openai-codex.md) / [docs/08-coding-agents/coding-agents-comparison.md:66](docs/08-coding-agents/coding-agents-comparison.md) / [research/coding-agents/openai-codex.md](research/coding-agents/openai-codex.md)

**現記述:** 権限を従来のsandboxとapprovalの組み合わせで説明しています。

**確認結果・更新案:** permission profiles betaのdefault_permissions、[permissions]、:read-only、:workspaceを追加し、旧設定との併存および優先関係を整理します。管理者のallowed_permission_profilesは0.138.0以降であり、network.enabledとfeatures.network_proxyは別の設定です。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（learn.chatgpt.com）](https://learn.chatgpt.com/docs/permissions)

#### T12 / P2 / 補足推奨 — Codex Auto-reviewの対象範囲を権限説明へ追加

**対象:** [docs/08-coding-agents/openai-codex.md:71](docs/08-coding-agents/openai-codex.md) / [docs/08-coding-agents/openai-codex.md:79](docs/08-coding-agents/openai-codex.md) / [research/coding-agents/openai-codex.md](research/coding-agents/openai-codex.md)

**現記述:** 操作承認の判断先をユーザーのみとして説明しています。

**確認結果・更新案:** Auto-reviewを追加し、その対象は承認要求が生じる操作であると明示します。approval neverやfull accessの操作全般について安全を保証する仕組みとは説明しません。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（learn.chatgpt.com）](https://learn.chatgpt.com/docs/sandboxing/auto-review)

#### T13 / P2 / 訂正必要 — Codex subagentの委任条件を提供面ごとに訂正

**対象:** [docs/08-coding-agents/openai-codex-in-practice.md:52](docs/08-coding-agents/openai-codex-in-practice.md) / [research/coding-agents/openai-codex-practice.md](research/coding-agents/openai-codex-practice.md)

**現記述:** ユーザーによる直接の明示指示がある場合だけsubagentを使うと説明しています。

**確認結果・更新案:** AGENTS.mdやskillsの委任指示も使用根拠になります。Work Ultraの能動委任も含め、提供面ごとの挙動を分けて説明し、直接のユーザー指示だけに限定する記述を訂正します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（learn.chatgpt.com）](https://learn.chatgpt.com/docs/agent-configuration/subagents)

#### T14 / P2 / 訂正必要 — Codexの5.4 mini退役を認証経路ごとに同期

**対象:** [docs/08-coding-agents/openai-codex-in-practice.md:68](docs/08-coding-agents/openai-codex-in-practice.md) / [docs/08-coding-agents/openai-codex.md:95](docs/08-coding-agents/openai-codex.md)

**現記述:** 実践記事は5.4 miniを2026-08-31退役予定として扱い、認証経路の区別が十分に同期されていません。

**確認結果・更新案:** ChatGPT sign-inでの提供終了とAPI key経由の提供を分けます。製品記事に既にある区別を実践記事へ同期し、過ぎた終了日を今後の予定として書かないよう更新します。

**資料の日付:** 2026-08-31提供終了（ChatGPT sign-in）。**アクセス日:** 2026-09-10。 [一次資料1（learn.chatgpt.com）](https://learn.chatgpt.com/docs/models)

#### T15 / P2 / 訂正必要 — Codex Fastの速度・creditとAPI Priority料金を分離

**対象:** [docs/08-coding-agents/openai-codex-in-practice.md:72](docs/08-coding-agents/openai-codex-in-practice.md) / [docs/08-coding-agents/openai-codex-in-practice.md:106](docs/08-coding-agents/openai-codex-in-practice.md) / [research/coding-agents/openai-codex-practice.md](research/coding-agents/openai-codex-practice.md)

**現記述:** Fastの速度を1.5倍、消費を2〜2.5倍と一般化しています。

**確認結果・更新案:** 速度1.5倍の記載は5.6 / 5.5 / 5.4等の対象モデルに限定します。Astra Fastは利用可能な場合に2.5倍creditですが、速度も同じ倍率と明記されてはいません。API Priorityの2倍料金とは別の体系として説明します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（learn.chatgpt.com）](https://learn.chatgpt.com/docs/agent-configuration/speed) / [一次資料2（learn.chatgpt.com）](https://learn.chatgpt.com/docs/models)

#### T19 / P2 / 訂正必要 — Antigravityの組織向け導入経路を反映

**対象:** [docs/08-coding-agents/gemini-cli-and-code-assist.md:45](docs/08-coding-agents/gemini-cli-and-code-assist.md) / [docs/08-coding-agents/gemini-cli-and-code-assist.md:87](docs/08-coding-agents/gemini-cli-and-code-assist.md)

**現記述:** 組織利用をCode Assistへ一本化し、Antigravityの組織対応を将来の確認事項として扱っています。

**確認結果・更新案:** 現行pricingにはOrganizationとGoogle Cloud統合の導入経路があります。実在する選択肢を分けて説明し、組織利用の経路が未提供であるかのような整理を訂正します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（antigravity.google）](https://antigravity.google/pricing)

#### T20 / P2 / 訂正必要 — Gemini個人向け提供終了とAPIデータ利用条件を比較表へ同期

**対象:** [docs/08-coding-agents/coding-agents-comparison.md:67](docs/08-coding-agents/coding-agents-comparison.md) / [docs/08-coding-agents/coding-agents-comparison.md:95](docs/08-coding-agents/coding-agents-comparison.md) / [docs/08-coding-agents/gemini-cli-and-code-assist.md:43](docs/08-coding-agents/gemini-cli-and-code-assist.md) / [docs/08-coding-agents/gemini-cli-and-code-assist.md:76](docs/08-coding-agents/gemini-cli-and-code-assist.md)

**現記述:** 無料APIの学習利用や個人向け提供の再編を未確認として扱う記述が比較表等に残っています。

**確認結果・更新案:** 本体記事で確認済みの情報を同期します。Gemini Code Assist for individualsのIDE / CLIは2026-06-18に終了したことを2026-09-02更新の廃止案内で確認できます。2026-03-23規約のUnpaid Servicesでは改善利用、Paid Servicesではその目的に不使用という区分を反映します。地域等による例外はT21で分けます。

**資料の日付:** 個人向け終了2026-06-18、廃止案内更新2026-09-02、規約発効2026-03-23。**アクセス日:** 2026-09-10。 [一次資料1（developers.google.com）](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals) / [一次資料2（ai.google.dev）](https://ai.google.dev/gemini-api/terms)

#### T21 / P3 / 補足推奨 — Gemini APIのPaidデータ条件に該当する地域・課金設定を補足

**対象:** [docs/08-coding-agents/gemini-cli-and-code-assist.md:76](docs/08-coding-agents/gemini-cli-and-code-assist.md) / [docs/08-coding-agents/gemini-cli-and-code-assist.md:143](docs/08-coding-agents/gemini-cli-and-code-assist.md) / [research/coding-agents/data-handling-index.md](research/coding-agents/data-handling-index.md)

**現記述:** 無料利用と有料利用の二分だけでデータ利用条件を整理しています。

**確認結果・更新案:** 2026-03-23発効の規約ではEEA、Switzerland、UKの無料利用にもPaid Servicesのデータ条件が適用されます。また実際の請求発生だけでなくCloud Billing有効化等の条件があるため、支払額のみで分類しないよう補足します。

**資料の日付:** 2026-03-23。**アクセス日:** 2026-09-10。 [一次資料1（ai.google.dev）](https://ai.google.dev/gemini-api/terms)

#### T22 / P3 / 補足推奨 — Copilot for JetBrainsの企業管理sandbox previewを追加

**対象:** [docs/08-coding-agents/github-copilot.md:70](docs/08-coding-agents/github-copilot.md) / [docs/08-coding-agents/github-copilot.md:76](docs/08-coding-agents/github-copilot.md) / [docs/08-coding-agents/github-copilot.md:142](docs/08-coding-agents/github-copilot.md)

**現記述:** 2026-09-08公開のJetBrains向けenterprise-managed sandboxが未反映です。

**確認結果・更新案:** public previewのenterprise-managed sandboxと管理者overrideを補足します。JetBrains向けの提供であり、すべてのIDEでGAしたとは扱いません。

**資料の日付:** 2026-09-08。**アクセス日:** 2026-09-10。 [一次資料1（github.blog）](https://github.blog/changelog/2026-09-08-enterprise-managed-sandbox-in-copilot-for-jetbrains/)

#### T23 / P3 / 補足推奨 — Clineのdesktop提供面を任意の比較項目へ追加

**対象:** [docs/08-coding-agents/open-source-coding-agents.md:41](docs/08-coding-agents/open-source-coding-agents.md) / [docs/08-coding-agents/coding-agents-comparison.md:50](docs/08-coding-agents/coding-agents-comparison.md)

**現記述:** Clineの提供面をIDE / CLI / SDKで整理しています。

**確認結果・更新案:** 公式リポジトリとreleasesにあるdesktopも選択肢へ追加できます。2026-09-09のdesktop-v0.0.24を確認しましたが、GAかどうかは未確認であり、安定提供の断定は避けます。

**資料の日付:** 2026-09-09（desktop-v0.0.24）。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/cline/cline) / [一次資料2（github.com）](https://github.com/cline/cline/releases)

#### T26 / P3 / 補足推奨 — Devinの監視対象にSWE-1.7を追加

**対象:** [docs/08-coding-agents/devin.md:139](docs/08-coding-agents/devin.md) / [research/coding-agents/devin.md:19](research/coding-agents/devin.md) / [research/coding-agents/devin.md:33](research/coding-agents/devin.md) / [research/coding-agents/devin.md:207](research/coding-agents/devin.md)

**現記述:** SWE-1.6を直近モデルの監視対象として記載しています。

**確認結果・更新案:** 2026-07-08の公式発表とpricingに掲載されているSWE-1.7を監視対象へ追加します。SWE-1.6の提供終了までは確認していないため、新世代の追加と旧世代の廃止を分けます。

**資料の日付:** 2026-07-08。**アクセス日:** 2026-09-10。 [一次資料1（cognition.com）](https://cognition.com/blog/swe-1-7) / [一次資料2（devin.ai）](https://devin.ai/pricing)

#### T27 / P3 / 補足推奨 — Devin Enterpriseのprivate MCP接続条件を追加

**対象:** [docs/08-coding-agents/devin.md:78](docs/08-coding-agents/devin.md) / [research/coding-agents/devin.md](research/coding-agents/devin.md)

**現記述:** 2026-08-21の企業向け接続・設定の追加が未反映です。

**確認結果・更新案:** Enterprise向けprivate MCP、private tunnel、custom CA、企業設定のorg overrideを補足できます。Enterpriseの提供範囲であり、全プランの機能とは説明しません。

**資料の日付:** 2026-08-21。**アクセス日:** 2026-09-10。 [一次資料1（docs.devin.ai）](https://docs.devin.ai/release-notes/overview)

#### T28 / P3 / 補足推奨 — Cursor Originとsubscriptionsを任意の自動化例へ追加

**対象:** [docs/08-coding-agents/cursor.md](docs/08-coding-agents/cursor.md) / [research/coding-agents/cursor.md](research/coding-agents/cursor.md)

**現記述:** Cursorの基本動作は維持できますが、2026年8月の新しい開始・起動方法は未反映です。

**確認結果・更新案:** 2026-08-27のSCM未接続で開始するOriginと、2026-08-19のPR / Slack / schedule subscriptionsを具体例の候補として追加できます。既存の基本動作の誤りを直す必須修正とは区別します。

**資料の日付:** Origin 2026-08-27、subscriptions 2026-08-19。**アクセス日:** 2026-09-10。 [一次資料1（cursor.com）](https://cursor.com/changelog)

### 認証・相互運用

#### AU01 / P2 / 訂正必要 — OpenAI Connectors OAuth の未確認を解消

**対象:** [docs/06-security/agent-identity-and-auth.md:184](docs/06-security/agent-identity-and-auth.md) / [research/professional/agent-identity.md:164](research/professional/agent-identity.md)

**現記述:** ConnectorsのOAuth認可ガイドを未確認として残す。

**確認結果・更新案:** 公式ガイドがauthorizationへOAuth access tokenを渡し、クライアント登録と認可はアプリ側で行うと明記。スコープで利用ツールが変わる点も記録しTODOを解消できる。ChatGPTの接続設定とはAPI面を分け、実際のIdP登録・refresh・失効テストは別途必要。

**資料の日付:** 2026-09-10現表示。**アクセス日:** 2026-09-10。 [一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)

#### AU02 / P2 / 訂正必要 — Google Agent Identity auth manager のGAを反映

**対象:** [docs/06-security/agent-identity-and-auth.md:131](docs/06-security/agent-identity-and-auth.md) / [research/professional/agent-identity.md:203](research/professional/agent-identity.md)

**現記述:** Agent IdentityはGA、Auth managerはPreview。

**確認結果・更新案:** 8/22リリースノートはauth managerおよびAgent Identity APIsのGAを明記。新APIとlegacy IAM Connectors APIの役割、8/14 GAのVPC Service Controls/組織制約も更新候補。個別手順ページのPreview表示が残る場合は製品全体の提供区分と機能別条件を分ける。

**資料の日付:** 2026-08-22。**アクセス日:** 2026-09-10。 [一次資料1（docs.cloud.google.com）](https://docs.cloud.google.com/iam/docs/release-notes) / [一次資料2（docs.cloud.google.com）](https://docs.cloud.google.com/iam/docs/auth-manager-overview)

#### AU04 / P2 / 補足推奨 — Okta XAA の提供と設定移行を追跡

**対象:** [research/professional/agent-identity.md:204](research/professional/agent-identity.md) / [docs/06-security/agent-identity-and-auth.md:132](docs/06-security/agent-identity-and-auth.md)

**現記述:** 8月OIN開始予定など予定ベースで段階的提供と整理。

**確認結果・更新案:** 2026.08.0 Preview環境リリースノートはManaged connectionタブによるXAA設定の廃止予定とResource Serverへの再設定を案内する。既存設定が止まる条件をresearchの監視項目へ追加。時期はupcoming releaseのみで未確定、全環境GAとはしない。

**資料の日付:** 2026.08.0 / 2026-09-10現表示。**アクセス日:** 2026-09-10。 [一次資料1（help.okta.com）](https://help.okta.com/oie/en-us/content/topics/releasenotes/preview.htm)

#### D02 / P2 / 補足推奨 — MCP SDK 2系と入門・サンプルの版を揃える

**対象:** [examples/python/mcp-server/requirements.txt:3](examples/python/mcp-server/requirements.txt) / [examples/python/mcp-server/mcp_server.py:105](examples/python/mcp-server/mcp_server.py) / [examples/tests/test_regressions.py](examples/tests/test_regressions.py) / [docs/03-implementation/mcp-and-tool-protocols.md:42](docs/03-implementation/mcp-and-tool-protocols.md)

**現記述:** mcp1.28.1・FastMCP、入門TODOは7月。認証・相互運用記事のみ7/28仕様を反映。

**確認結果・更新案:** 現行2.2.0のMCPServer/Client構成とMRTR、statelessを入門にも接続。1.x継続なら保守系・対応リビジョンを明記。2.2のredirect/issuer/legacy idle制限と未実装拡張も確認して移行テストする。

**資料の日付:** v2.2.0 2026-09-07。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/modelcontextprotocol/python-sdk/blob/main/docs/whats-new.md) / [一次資料2（github.com）](https://github.com/modelcontextprotocol/python-sdk/blob/main/VERSIONING.md) / [一次資料3（github.com）](https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.2.0) / [一次資料4（blog.modelcontextprotocol.io）](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

#### AU03 / P3 / 補足推奨 — OAuth 2.1 の改版を調査メモへ追記

**対象:** [research/professional/agent-identity.md:19](research/professional/agent-identity.md) / [research/professional/agent-identity.md:199](research/professional/agent-identity.md)

**現記述:** OAuth2.1はdraft-15、2026-03-02版。

**確認結果・更新案:** 9/2版draft-16へ参照を更新。依然Internet-DraftでありRFC成立としない。identity-chainingは-17/RFC Editor待ち、ID-JAGは-04で今回変更なし。

**資料の日付:** 2026-09-02。**アクセス日:** 2026-09-10。 [一次資料1（datatracker.ietf.org）](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) / [一次資料2（datatracker.ietf.org）](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/) / [一次資料3（datatracker.ietf.org）](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/)

### 音声・動画・computer use・ファインチューニング

#### A01 / P1 / 訂正必要 — Videos API / Sora 2 APIモデルの9月24日終了を明記

**対象:** [research/multimodal/generation.md:85](research/multimodal/generation.md) / [research/multimodal/generation.md:89](research/multimodal/generation.md) / [docs/12-multimodal/video-ai-overview.md:90](docs/12-multimodal/video-ai-overview.md) / [docs/12-multimodal/video-ai-overview.md:127](docs/12-multimodal/video-ai-overview.md) / [ROADMAP.md](ROADMAP.md)

**現記述:** 8/18再確認で変更なし・API提供の代表と記載し、終了日がない。

**確認結果・更新案:** 3/24告知のVideos APIとSora 2 aliases/snapshotsの9/24終了を明記。新規採用例から移行・終了例へ。アプリの状態をAPI終了だけで推定しない。

**資料の日付:** 告知2026-03-24 / 終了2026-09-24。**アクセス日:** 2026-09-10。 [一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/deprecations) / [一次資料2（developers.openai.com）](https://developers.openai.com/api/reference/typescript/resources/videos/methods/create)

#### A02 / P1 / 訂正必要 — Nova Canvas / Reel / Sonic の提供期限

**対象:** [research/multimodal/generation.md:33](research/multimodal/generation.md) / [research/multimodal/generation.md:109](research/multimodal/generation.md) / [research/professional/voice-agents.md:34](research/professional/voice-agents.md) / [research/multimodal/realtime-tts.md](research/multimodal/realtime-tts.md) / [docs/12-multimodal/image-generation-integration.md](docs/12-multimodal/image-generation-integration.md) / [docs/12-multimodal/video-ai-overview.md](docs/12-multimodal/video-ai-overview.md) / [ROADMAP.md](ROADMAP.md)

**現記述:** Reel9/30だけ把握しCanvasは未確認、Sonic旧新を並べる。

**確認結果・更新案:** AWS lifecycle表でCanvas v1:0、Reel v1:0/v1:1は9/30、Sonic v1/Premierは9/14予定。モデルIDと地域を分けて更新。旧版とNova 2を混同せず、後継は別途適合評価。

**資料の日付:** 終了2026-09-14 / 2026-09-30。**アクセス日:** 2026-09-10。 [一次資料1（docs.aws.amazon.com）](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html)

#### FT02 / P1 / 訂正必要 — Claude 3 Haiku の Bedrock FT 経路と本日のEOL

**対象:** [research/professional/fine-tuning.md:110](research/professional/fine-tuning.md) / [docs/03-implementation/fine-tuning-and-distillation.md:73](docs/03-implementation/fine-tuning-and-distillation.md) / [ROADMAP.md](ROADMAP.md)

**現記述:** Claude第一者ではFTなし、BedrockのClaude3 HaikuのみGAで利用可能と説明。

**確認結果・更新案:** AWSはClaude3 HaikuのLegacy開始2026-03-10、EOL2026-09-10を公表。Legacy移行後は新規FTジョブ/新規Provisioned Throughput作成不可とするため、新規採用経路の説明を訂正する。モデルID/region/既存custom deploymentを分ける。本日実際にAPIが停止したかは呼出し検証していない。

**資料の日付:** Legacy2026-03-10 / EOL2026-09-10。**アクセス日:** 2026-09-10。 [一次資料1（docs.aws.amazon.com）](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html) / [一次資料2（docs.aws.amazon.com）](https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-fine-tuning.html)

#### A03 / P2 / 訂正必要 — 音声認識の新APIと終了日を音声記事へ同期

**対象:** [research/professional/voice-agents.md:33](research/professional/voice-agents.md) / [docs/03-implementation/voice-agents.md:139](docs/03-implementation/voice-agents.md) / [research/models/openai.md](research/models/openai.md) / [research/multimodal/realtime-tts.md](research/multimodal/realtime-tts.md)

**現記述:** OpenAI8/26告知は一覧だけ9月確認、音声起点メモは8/18。GoogleパイプラインはCloud STT/TTS中心。

**確認結果・更新案:** whisper-1等の2027/2/26終了とgpt-live-transcribe/gpt-transcribeへの移行を同期。Gemini3.5 Transcribe/Liveの8/19公開を追加し、Developer API Live全体のGAと混同しない。

**資料の日付:** 2026-08-19 / 2026-08-26。**アクセス日:** 2026-09-10。 [一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/deprecations) / [一次資料2（ai.google.dev）](https://ai.google.dev/gemini-api/docs/changelog)

#### A04 / P2 / 補足推奨 — 動画の能動的読解と Gemini Omni のGA

**対象:** [docs/12-multimodal/video-ai-overview.md:41](docs/12-multimodal/video-ai-overview.md) / [research/multimodal/generation.md:90](research/multimodal/generation.md) / [docs/12-multimodal/realtime-multimodal-agents.md](docs/12-multimodal/realtime-multimodal-agents.md)

**現記述:** 固定FPSでの動画読解、Veo中心の生成比較。

**確認結果・更新案:** 9/1 agentic video understandingを固定フレームとの別方式として追加。8/27 GAのgemini-omni-1.1-flashと旧preview9/30停止を追跡。公表された削減率を一般保証にしない。

**資料の日付:** 2026-08-27 / 2026-09-01。**アクセス日:** 2026-09-10。 [一次資料1（ai.google.dev）](https://ai.google.dev/gemini-api/docs/changelog)

#### A05 / P2 / 補足推奨 — Claude computer/browser use と Files/Skills GA

**対象:** [docs/03-implementation/computer-use-implementation.md](docs/03-implementation/computer-use-implementation.md) / [docs/01-concepts/computer-use-and-multimodal-agents.md](docs/01-concepts/computer-use-and-multimodal-agents.md) / [research/prompting/anthropic.md](research/prompting/anthropic.md)

**現記述:** 実装原則中心で8/19以降のGA toolset/API境界を未反映。

**確認結果・更新案:** computer_toolset_20260801/browser_toolset_20260801、まとめて行う操作、ページ要素参照、upload opt-inと旧版移行を代表実装に追加。Files/Skills GAとbeta互換レスポンスの違いも関連メモに記録。

**資料の日付:** 2026-08-19。**アクセス日:** 2026-09-10。 [一次資料1（platform.claude.com）](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool) / [一次資料2（platform.claude.com）](https://platform.claude.com/docs/en/build-with-claude/skills-guide) / [一次資料3（platform.claude.com）](https://platform.claude.com/docs/en/release-notes/overview)

#### A06 / P2 / 訂正必要 — Eleven v3 のWebSocket経路をTTSと対話で分離

**対象:** [research/multimodal/realtime-tts.md:62](research/multimodal/realtime-tts.md) / [docs/12-multimodal/speech-synthesis-and-voice-design.md](docs/12-multimodal/speech-synthesis-and-voice-design.md)

**現記述:** WebSocket TTS対応とeleven_v3を同じ行で紹介し、経路の違いが不明。

**確認結果・更新案:** 単一音声TTS stream-inputはeleven_v3非対応。v3はText to Dialogue WebSocket別経路でvoices/inputs構造も異なる。製品単位の対応表をモデル/endpoint単位へ改める。本文のベンダー中立なストリーミング原則は維持。

**資料の日付:** 2026-09-10現表示。**アクセス日:** 2026-09-10。 [一次資料1（elevenlabs.io）](https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/tts-vs-ttd-websockets) / [一次資料2（elevenlabs.io）](https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tts)

#### FT01 / P2 / 訂正必要 — Gemini 3系SFTの提供を一次資料で確定

**対象:** [research/professional/fine-tuning.md:76](research/professional/fine-tuning.md) / [research/professional/fine-tuning.md:93](research/professional/fine-tuning.md) / [docs/03-implementation/fine-tuning-and-distillation.md:72](docs/03-implementation/fine-tuning-and-distillation.md) / [docs/03-implementation/fine-tuning-and-distillation.md:146](docs/03-implementation/fine-tuning-and-distillation.md)

**現記述:** Google tuning本文を未取得、Gemini3系SFTは未提供と二次情報が示唆すると記録。

**確認結果・更新案:** 公式本文でGemini3.5 Flash/3.1 Flash-Liteと2.5系列のSFT対応を確認。6/22 release notesの3系Public Preview、us-central1/europe-west4 tuningとus/eu servingを記録。全フロンティア対応や全手法GAとは一般化しない。蒸留の詳細・GAは別途未確認。

**資料の日付:** 2026-06-22 / 2026-09-10本文取得。**アクセス日:** 2026-09-10。 [一次資料1（docs.cloud.google.com）](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning/supervised-tuning) / [一次資料2（docs.cloud.google.com）](https://docs.cloud.google.com/gemini-enterprise-agent-platform/release-notes)

### 規制・業界ガイドライン・認証

#### GOV01 / P1 / 訂正必要 — FISC 安全対策基準は第14版

**対象:** [docs/09-business/industry-regulations-map.md:72](docs/09-business/industry-regulations-map.md) / [docs/09-business/industry-regulations-map.md:157](docs/09-business/industry-regulations-map.md) / [research/supplementary/regulations.md](research/supplementary/regulations.md)

**現記述:** 第13版(2025-03)を現行版とする。

**確認結果・更新案:** 第14版が2026-03-25発刊。AI/生成AI・サイバー・PQC拡充の公表情報を反映する。有償全文は未取得で条項差分まで確認済みとはしない。

**資料の日付:** 2026-03-25。**アクセス日:** 2026-09-10。 [一次資料1（www.fisc.or.jp）](https://www.fisc.or.jp/publication/book/007219.php) / [一次資料2（www.fisc.or.jp）](https://www.fisc.or.jp/topics/2026.php)

#### GOV02 / P1 / 訂正必要 — FDUA ガイドライン1.2を反映

**対象:** [docs/09-business/industry-regulations-map.md:74](docs/09-business/industry-regulations-map.md) / [research/supplementary/regulations.md](research/supplementary/regulations.md)

**現記述:** 1.1(2025-07)を紹介。

**確認結果・更新案:** 8/5公表の1.2へ更新。エージェントの接続先・権限・行動のリスク、AIレジリエンス/ガバナンスの拡充を追跡対象にする。

**資料の日付:** 2026-08-05。**アクセス日:** 2026-09-10。 [一次資料1（www.fdua.org）](https://www.fdua.org/news/202608051) / [一次資料2（www.fdua.org）](https://www.fdua.org/news/20260812)

#### GOV03 / P1 / 訂正必要 — 個人情報保護法改正の法番号・段階施行・PPC予定

**対象:** [docs/09-business/industry-regulations-map.md:171](docs/09-business/industry-regulations-map.md) / [docs/09-business/industry-regulations-map.md:175](docs/09-business/industry-regulations-map.md) / [docs/06-security/compliance-and-governance.md:59](docs/06-security/compliance-and-governance.md) / [docs/06-security/compliance-and-governance.md:162](docs/06-security/compliance-and-governance.md) / [ROADMAP.md:706](ROADMAP.md)

**現記述:** 法案の成立/法番号や施行令・指針を未確認とする。

**確認結果・更新案:** 7/10成立・7/17公布の令和8年法律第56号、PPC9/9工程表を反映。主な施行は公布から2年以内の政令指定日(未確定)、一部罰則は2027-01-17。9月中旬以降の子ども/顔特徴データ/統計・委託/漏えい/課徴金の順次意見募集は予定として追跡。将来時点のe-Gov統合条文を現行条文と誤認しない。

**資料の日付:** 公布2026-07-17 / 工程表2026-09-09。**アクセス日:** 2026-09-10。 [一次資料1（www.ppc.go.jp）](https://www.ppc.go.jp/personalinfo/legal/r8kaiseihogohou/) / [一次資料2（www.ppc.go.jp）](https://www.ppc.go.jp/files/pdf/260909_kongonosusumekatanitsuite.pdf) / [一次資料3（www.ppc.go.jp）](https://www.ppc.go.jp/files/pdf/260717_houritsu.pdf) / [一次資料4（laws.e-gov.go.jp）](https://laws.e-gov.go.jp/document?lawid=415AC0000000057_20270117_508AC0000000056)

#### GOV04 / P1 / 訂正必要 — California AI透明性法の義務主体と日付を分離

**対象:** [docs/06-security/compliance-and-governance.md:61](docs/06-security/compliance-and-governance.md)

**現記述:** プラットフォーム義務が2027〜2028年と一括記載。

**確認結果・更新案:** BPC22757.3.1/.3.2のオンライン/生成AIホスティングプラットフォームは2027-01-01、.3.3の撮影機器メーカーは2028-01-01。基礎義務2026-08-02と合わせ主体別に訂正する。

**資料の日付:** 2026-09-10現行条文確認。**アクセス日:** 2026-09-10。 [一次資料1（leginfo.legislature.ca.gov）](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=8.&title=&part=&chapter=25.&article=)

#### GOV05 / P2 / 訂正必要 — FTC AI accuracy policy は提案段階

**対象:** [docs/06-security/compliance-and-governance.md:164](docs/06-security/compliance-and-governance.md) / [research/professional/compliance.md](research/professional/compliance.md)

**現記述:** FTC policy statementの一次確認が未了。

**確認結果・更新案:** 7/1に提案を公表し7/31までコメント募集。final policyとは区別する。州法が既に全面無効化されたとも書かない。

**資料の日付:** 2026-07-01。**アクセス日:** 2026-09-10。 [一次資料1（www.ftc.gov）](https://www.ftc.gov/news-events/news/press-releases/2026/07/ftc-seeks-public-comment-policy-statement-addressing-ai-accuracy) / [一次資料2（www.ftc.gov）](https://www.ftc.gov/system/files/ftc_gov/pdf/ai-policy-statement_0.pdf) / [一次資料3（www.ftc.gov）](https://www.ftc.gov/legal-library/browse/policy-statements)

#### GOV06 / P2 / 補足推奨 — Colorado ADMT とチャットボット規則案の工程

**対象:** [docs/06-security/compliance-and-governance.md:61](docs/06-security/compliance-and-governance.md) / [research/professional/compliance.md](research/professional/compliance.md)

**現記述:** 改正法と規則制定の概要のみ。

**確認結果・更新案:** AG8/11ドラフト、次回9/23予定、10/26コメント期限、義務2027-01-01を記録。ADMT SB26-189とチャットボット/未成年保護HB26-1263を分ける。HB署名日は公式資料間に差があり未確定、xAI訴訟の最終判断も未確認。

**資料の日付:** 2026-08-11。**アクセス日:** 2026-09-10。 [一次資料1（coag.gov）](https://coag.gov/ai/) / [一次資料2（leg.colorado.gov）](https://leg.colorado.gov/bills/sb26-189) / [一次資料3（leg.colorado.gov）](https://leg.colorado.gov/bills/hb26-1263)

#### GOV07 / P2 / 訂正必要 — EU AI Act の新禁止行為と既存モデル透明性の適用日

**対象:** [docs/06-security/compliance-and-governance.md:52](docs/06-security/compliance-and-governance.md) / [docs/06-security/compliance-and-governance.md:55](docs/06-security/compliance-and-governance.md) / [research/professional/compliance.md](research/professional/compliance.md)

**現記述:** 禁止行為は施行済みと総括し既存生成AIの表示期限を12月と記す。

**確認結果・更新案:** Regulation(EU)2026/1744原文を確認。Article111(4)の期限を2026-12-02と精密化。新規追加Art5(1)(ba)/(bb)等にも12/2適用があるため全禁止行為を一括しない。非同意親密画像/児童性的虐待コンテンツの条文範囲を区別。高リスク2027-12-02/2028-08-02は維持。

**資料の日付:** 公布2026-07-24 / 発効2026-07-27。**アクセス日:** 2026-09-10。 [一次資料1（eur-lex.europa.eu）](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1744)

#### GOV08 / P2 / 訂正必要 — EN18286:2026 の発行と整合規格の推定効を区別

**対象:** [docs/06-security/ai-standards-and-certification.md:133](docs/06-security/ai-standards-and-certification.md) / [docs/06-security/ai-standards-and-certification.md:141](docs/06-security/ai-standards-and-certification.md) / [research/ecosystem/standards.md](research/ecosystem/standards.md)

**現記述:** prEN18286をdraft/最終化待ちとして扱う。

**確認結果・更新案:** 7月にEN18286:2026発行、AI Act17のQMSを支援。規格発行・EC評価・OJ引用は別段階で、発行だけで適合推定効が生じるとはしない。他prEN18228/18282/18229-1はEnquiry。

**資料の日付:** 2026-07。**アクセス日:** 2026-09-10。 [一次資料1（www.cencenelec.eu）](https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-07-30-ai-quality-management/) / [一次資料2（digital-strategy.ec.europa.eu）](https://digital-strategy.ec.europa.eu/en/policies/ai-act-standardisation)

#### GOV09 / P2 / 補足推奨 — AISI 評価観点ガイド1.20とロボティクス版

**対象:** [docs/06-security/ai-standards-and-certification.md:137](docs/06-security/ai-standards-and-certification.md) / [research/ecosystem/standards.md](research/ecosystem/standards.md) / [docs/06-security/frontier-safety-overview.md:73](docs/06-security/frontier-safety-overview.md) / [docs/06-security/frontier-safety-overview.md:127](docs/06-security/frontier-safety-overview.md) / [research/trust/frontier-safety.md:79](research/trust/frontier-safety.md)

**現記述:** 2025年の評価観点ガイド中心。

**確認結果・更新案:** 7/7の1.20(エージェント関連更新)と7/23ロボティクスガイドを追記。規格認証と評価ガイドの位置づけを分け、physical-ai側の資料とも同期する。 Agentの観測と制御・自律挙動・外部相互作用の項目をfrontier-safetyからも参照する。

**資料の日付:** 2026-07-07 / 2026-07-23。**アクセス日:** 2026-09-10。 [一次資料1（aisi.go.jp）](https://aisi.go.jp/output/output_information/260707/) / [一次資料2（aisi.go.jp）](https://aisi.go.jp/output/output_framework/guide_to_evaluation_perspective_on_ai_safety/) / [一次資料3（www.ipa.go.jp）](https://www.ipa.go.jp/pressrelease/2026/press20260723.html)

#### GOV10 / P2 / 補足推奨 — NISTの公開AI文書化ガイダンス・テンプレートZero Draft

**対象:** [docs/06-security/ai-standards-and-certification.md:51](docs/06-security/ai-standards-and-certification.md) / [docs/06-security/ai-standards-and-certification.md:145](docs/06-security/ai-standards-and-certification.md) / [research/ecosystem/standards.md](research/ecosystem/standards.md)

**現記述:** NISTはRMF更新中心で監視。

**確認結果・更新案:** 7/29公開のAI documentation template Zero Draftと9/16コメント期限を監視対象へ追加。確定済み認証規格とはしない。

**資料の日付:** 2026-07-29 / 締切2026-09-16。**アクセス日:** 2026-09-10。 [一次資料1（www.nist.gov）](https://www.nist.gov/artificial-intelligence/ai-standards)

#### GOV13 / P2 / 訂正必要 — FDA TPLC draft と PCCP final の版を更新

**対象:** [docs/09-business/industry-regulations-map.md:171](docs/09-business/industry-regulations-map.md) / [research/supplementary/regulations.md](research/supplementary/regulations.md)

**現記述:** TPLCのfinal化不明、PCCPは2024-12-03版が現行との記録。

**確認結果・更新案:** FDA公式索引でTPLC2025-01-07はDraftのまま、PCCPは2025-08-18 Finalと確認。必要に応じCDS2026-01-29 Finalも追記し文書ごとのdraft/finalを分ける。

**資料の日付:** 2025-08-18 / 2026-09-10現表示。**アクセス日:** 2026-09-10。 [一次資料1（www.fda.gov）](https://www.fda.gov/medical-devices/digital-health-center-excellence/guidances-digital-health-content)

#### GOV11 / P3 / 訂正必要 — 国内初の認証と認定を区別

**対象:** [docs/06-security/ai-standards-and-certification.md:72](docs/06-security/ai-standards-and-certification.md) / [docs/06-security/ai-standards-and-certification.md:145](docs/06-security/ai-standards-and-certification.md) / [research/ecosystem/standards.md](research/ecosystem/standards.md)

**現記述:** 初認証/初認定の公式表現が矛盾するとの未確認。

**確認結果・更新案:** SGSの2025-04はSGSグループの国内初認証、JIPDEC2026-01-14は認証機関2社の初認定。7/7名簿はSGS/TUVの2社。用語・主体・日付を分けて未確認を解消できる。

**資料の日付:** 2026-01-14 / 名簿2026-07-07。**アクセス日:** 2026-09-10。 [一次資料1（www.sgs.com）](https://www.sgs.com/ja-jp/news/2025/04/sgs-issues-its-first-ever-iso-iec-42001-certification-in-japan) / [一次資料2（www.jipdec.or.jp）](https://www.jipdec.or.jp/news/pressrelease/20260114.html) / [一次資料3（isms.jp）](https://isms.jp/aims/lst/isr/index.html)

#### GOV12 / P3 / 訂正必要 — ISO42005/42006の発行年月を一次情報へ統一

**対象:** [research/ecosystem/standards.md](research/ecosystem/standards.md)

**現記述:** ISO42005を二次情報の2025-04として記録。

**確認結果・更新案:** ISO公式は42005が2025-05、42006が2025-07でともにpublished。本文の年/役割は維持できる。有償全文の要求条項は未精査。

**資料の日付:** 2025-05 / 2025-07。**アクセス日:** 2026-09-10。 [一次資料1（www.iso.org）](https://www.iso.org/standard/42005) / [一次資料2（www.iso.org）](https://www.iso.org/standard/42006)

### ベンチマーク

#### B01 / P2 / 訂正必要 — Terminal-Bench 4.0 と検証版の評価地図

**対象:** [docs/04-evaluation/agent-benchmarks-landscape.md:55](docs/04-evaluation/agent-benchmarks-landscape.md) / [docs/04-evaluation/agent-benchmarks-landscape.md:62](docs/04-evaluation/agent-benchmarks-landscape.md) / [docs/04-evaluation/agent-benchmarks-landscape.md:132](docs/04-evaluation/agent-benchmarks-landscape.md) / [research/professional/benchmarks.md](research/professional/benchmarks.md) / [ROADMAP.md](ROADMAP.md)

**現記述:** Terminal-Bench3.0を現行後継とする。WebArenaはほぼ飽和と要約。

**確認結果・更新案:** 公式現行はTerminal-Bench4.0、FrontierBench URLはtbenchへredirect。版・harness・費用を更新。WebArena-Verifiedの監査済みtaskとnetwork trace評価を補足し旧版飽和を全派生に拡張しない。数値ランキングは未取得。

**資料の日付:** 2026-09-10現行資料確認（公開日未確認）。**アクセス日:** 2026-09-10。 [一次資料1（www.tbench.ai）](https://www.tbench.ai/) / [一次資料2（github.com）](https://github.com/ServiceNow/webarena-verified/blob/main/README.md)

### 来歴・安全・著作権

#### TS-01 / P1 / 訂正必要 — 知財本部AIプリンシプル・コードの正式公開と申出開始予定を反映

**対象:** [docs/09-business/ai-copyright-and-ip-map.md:174](docs/09-business/ai-copyright-and-ip-map.md) / [docs/09-business/ai-copyright-and-ip-map.md:183](docs/09-business/ai-copyright-and-ip-map.md) / [research/trust/copyright.md:115](research/trust/copyright.md)

**現記述:** 官邸から内閣官房への移転中、プリンシプル・コード（仮称）の策定待ちとして扱っている。

**確認結果・更新案:** 専用ページに日本語・英語の正式コード、開示事項の具体例、様式を公開済み。申出受付開始は2026-10-26予定であり、2026-09-10時点では未開始。旧『策定待ち』『移転中』を更新し、申出開始予定と公開済み資料を分ける。正式採択日・公開日は専用ページから特定できず、2026-08-18の第13回検討会開催日と同一視しない。Web取得失敗後、PowerShell Invoke-WebRequestで公式ページHTTP200と本文・PDFリンクを確認。PDF本文自体は未精読。

**資料の日付:** 公開日未特定。申出開始予定2026-10-26。専用ページ掲載状況を2026-09-10確認。**アクセス日:** 2026-09-10。 [一次資料1（www.cas.go.jp）](https://www.cas.go.jp/jp/seisakukaigi/titeki2/ai_principle_code/index.html) / [一次資料2（www.cas.go.jp）](https://www.cas.go.jp/jp/seisakukaigi/titeki2/ai_kentoukai/kaisai/index.html) / [一次資料3（www.cas.go.jp）](https://www.cas.go.jp/jp/seisakukaigi/titeki2/ai_kentoukai/kaisai/pdf/ai_principle_code.pdf)

#### TS-02 / P2 / 訂正必要 — ISO 22144の段階をISO公式情報へ置換

**対象:** [docs/06-security/content-provenance-and-detection.md:47](docs/06-security/content-provenance-and-detection.md) / [docs/06-security/content-provenance-and-detection.md:83](docs/06-security/content-provenance-and-detection.md) / [docs/06-security/content-provenance-and-detection.md:128](docs/06-security/content-provenance-and-detection.md) / [research/trust/provenance.md:39](research/trust/provenance.md) / [ROADMAP.md:710](ROADMAP.md)

**現記述:** researchは二次情報をもとにISO/DIS 22144のfast trackと記載。本文の国際標準化進行中という一般説明は矛盾しない。

**確認結果・更新案:** ISO公式ページの表示はISO/CD 22144、Under development、stage30.99（CD approved for registration as DIS）。完成した国際規格ではない。researchの版名・段階を公式表示へ訂正し、本文ではC2PA仕様公開とISO規格成立を区別する。段階の履歴日2024-10-28と2026年の確認日を混同しない。

**資料の日付:** 公式掲載状態2026-09-10。stage30.99履歴日2024-10-28。**アクセス日:** 2026-09-10。 [一次資料1（www.iso.org）](https://www.iso.org/standard/90726.html)

#### TS-03 / P2 / 訂正必要 — Anthropic RSP 3.4とAugust 2026 Risk Reportへ研究メモを更新

**対象:** [docs/06-security/frontier-safety-overview.md:35](docs/06-security/frontier-safety-overview.md) / [docs/06-security/frontier-safety-overview.md:73](docs/06-security/frontier-safety-overview.md) / [docs/06-security/frontier-safety-overview.md:89](docs/06-security/frontier-safety-overview.md) / [docs/06-security/frontier-safety-overview.md:127](docs/06-security/frontier-safety-overview.md) / [research/trust/frontier-safety.md:24](research/trust/frontier-safety.md) / [research/trust/frontier-safety.md:108](research/trust/frontier-safety.md) / [research/trust/frontier-safety.md:134](research/trust/frontier-safety.md)

**現記述:** researchのRSP確認は3.3（2026-05-26）まで。本文の共通枠組みの概説はおおむね維持できる。

**確認結果・更新案:** RSPは3.4が2026-07-08発効。公式ページ更新日2026-08-14。August2026 Risk Reportも2026-08-14公表、coverage dateは2026-07-15。v3.4は自動化R&D閾値、内部非墨消し版を少なくとも200人に配布する扱い、報告対象日と公表日の区別、墨消し表示、部分ごとの外部レビュー等を変更。版・発効日・報告日・対象日を別欄にし、モデルカードだけでなくRisk Reportも確認先に追加する。186頁の報告書は表紙・対象日・構成を確認した範囲であり、全リスク評価結果は精査していない。

**資料の日付:** RSP3.4発効2026-07-08、Risk Report公表2026-08-14、対象日2026-07-15。**アクセス日:** 2026-09-10。 [一次資料1（www.anthropic.com）](https://www.anthropic.com/responsible-scaling-policy) / [一次資料2（www.anthropic.com）](https://www.anthropic.com/aug-2026-risk-report)

#### TS-04 / P2 / 補足推奨 — PreparednessとFrontier Governanceの関連及び8月方針を補足

**対象:** [docs/06-security/frontier-safety-overview.md:39](docs/06-security/frontier-safety-overview.md) / [docs/06-security/frontier-safety-overview.md:70](docs/06-security/frontier-safety-overview.md) / [research/trust/frontier-safety.md:32](research/trust/frontier-safety.md)

**現記述:** Preparedness v2（2025-04-15）中心で、researchには旧403取得失敗も残る。

**確認結果・更新案:** Preparedness更新記事を直接取得できた。2026-05-28公開のFrontier Governance FrameworkはPreparednessを基礎に法制度・カリフォルニアやEU Codeとの整合を説明。2026-08-18のcyber能力に関する記事は訓練・研究・配備の隔離、監視、alignment等の強化と将来のPreparedness改定予定を示す。取得不能メモを解消し、制度との接続と公表文書の種類を補足する。8月記事を新Preparedness版が発行済みという根拠にしない。

**資料の日付:** 2025-04-15、2026-05-28、2026-08-18。**アクセス日:** 2026-09-10。 [一次資料1（openai.com）](https://openai.com/index/updating-our-preparedness-framework/) / [一次資料2（openai.com）](https://openai.com/index/openai-frontier-governance-framework/) / [一次資料3（openai.com）](https://openai.com/index/pacing-model-development-cyber-capabilities/)

#### TS-05 / P2 / 補足推奨 — 捜査機関のなりすましと被害回復詐欺を通報手順へ追加

**対象:** [docs/06-security/deepfake-and-impersonation-defense.md:32](docs/06-security/deepfake-and-impersonation-defense.md) / [docs/06-security/deepfake-and-impersonation-defense.md:63](docs/06-security/deepfake-and-impersonation-defense.md) / [docs/06-security/deepfake-and-impersonation-defense.md:111](docs/06-security/deepfake-and-impersonation-defense.md) / [docs/06-security/deepfake-and-impersonation-defense.md:118](docs/06-security/deepfake-and-impersonation-defense.md) / [research/trust/provenance.md:106](research/trust/provenance.md)

**現記述:** 2025-05-15のFBI警告と独立経路による本人確認が中心。

**確認結果・更新案:** FBI/IC3は2026-07-20、偽IC3苦情フォーム、FBI幹部を装うdeepfake、被害回復を装った再被害を警告。通報先自体が偽装されるケースを追加し、既知の公式URLから通報先へ直接到達する手順を訓練に含める。2025年の警告が誤りになったわけではない。

**資料の日付:** 2026-07-20。**アクセス日:** 2026-09-10。 [一次資料1（www.ic3.gov）](https://www.ic3.gov/PSA/2026/PSA260720)

#### TS-07 / P2 / 補足推奨 — Claudeのtext watermarkとFiles API取得時C2PAを具体例へ追加

**対象:** [docs/06-security/content-provenance-and-detection.md:47](docs/06-security/content-provenance-and-detection.md) / [docs/06-security/content-provenance-and-detection.md:83](docs/06-security/content-provenance-and-detection.md) / [research/trust/provenance.md](research/trust/provenance.md)

**現記述:** 来歴とwatermarkを一般的に整理しているが、2026-09-01のClaude対応は未反映。

**確認結果・更新案:** Claude Fable5.1/Mythos5.1の生成textはAnthropicのtext watermarkを持つ。code executionが生成した対応image/video/audioファイルはClaude APIのFiles APIで取得したときC2PA Content Credentialsを持つ。一般的なC2PA説明に具体例を追加し、対応媒体・生成経路・取得経路・後工程での保持を確認する設計判断へつなげる。全生成物や通常textにC2PAが付くと一般化しない。rootからの共有後、この担当でも公式release notes本文を独立取得した。

**資料の日付:** 2026-09-01。**アクセス日:** 2026-09-10。 [一次資料1（platform.claude.com）](https://platform.claude.com/docs/en/release-notes/overview)

### フィジカルAI・世界モデル

#### PH-01 / P2 / 訂正必要 — Helixを旧35自由度・2層の例だけで説明しない

**対象:** [docs/01-concepts/physical-ai-overview.md:40](docs/01-concepts/physical-ai-overview.md) / [docs/01-concepts/physical-ai-overview.md:62](docs/01-concepts/physical-ai-overview.md) / [research/supplementary/physical-ai.md:24](research/supplementary/physical-ai.md) / [research/supplementary/physical-ai.md:62](research/supplementary/physical-ai.md) / [research/supplementary/physical-ai.md:189](research/supplementary/physical-ai.md)

**現記述:** Helixを上半身35自由度、低速の計画と高速の制御という2層の代表として記載。

**確認結果・更新案:** Helix02は2026-01-27公開で全身制御、S2/S1/S0の3階層。公式説明はS1が200Hz、S0が1kHz。本文の共通原理は『計画と高速制御の分離』とし、階層数は実装で異なると明確化。旧Helixの35自由度は世代を限定する。4分間の自律デモはベンダー発表の実証であり、汎用作業のSLAや第三者検証ではない。

**資料の日付:** 2026-01-27。**アクセス日:** 2026-09-10。 [一次資料1（www.figure.ai）](https://www.figure.ai/news/helix-02)

#### PH-02 / P2 / 訂正必要 — VLA共通ベンチマークが存在しないという断定を限定

**対象:** [docs/01-concepts/physical-ai-overview.md:64](docs/01-concepts/physical-ai-overview.md) / [research/supplementary/physical-ai.md:14](research/supplementary/physical-ai.md) / [research/supplementary/physical-ai.md:214](research/supplementary/physical-ai.md)

**現記述:** VLAには共通ベンチマーク/リーダーボードがなく比較できないと読める記述。

**確認結果・更新案:** LIBEROは130タスク・4スイートの公開評価基盤を提供し、openpiにはπ0.5-LIBERO checkpointがある。Isaac Lab-Arenaも評価基盤を公開。『特定の課題・embodiment・シミュレーションでの共通比較は存在するが、異なる実機の汎用能力を一つの数値で比べる基盤は未成熟』へ変更し、評価条件の一致を確認させる。LIBERO公式サイト本文は取得失敗したが著者公式GitHubを取得。

**資料の日付:** 各公式リポジトリの掲載状態2026-09-10。LIBEROは2023公開の既存基盤。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/Lifelong-Robot-Learning/LIBERO) / [一次資料2（raw.githubusercontent.com）](https://raw.githubusercontent.com/Physical-Intelligence/openpi/main/README.md) / [一次資料3（developer.nvidia.com）](https://developer.nvidia.com/isaac/lab-arena)

#### PH-03 / P2 / 補足推奨 — Gemini Robotics 2系の提供段階とER1.6の日付を更新

**対象:** [docs/01-concepts/physical-ai-overview.md:55](docs/01-concepts/physical-ai-overview.md) / [docs/01-concepts/physical-ai-overview.md:120](docs/01-concepts/physical-ai-overview.md) / [research/supplementary/physical-ai.md:33](research/supplementary/physical-ai.md)

**現記述:** Gemini Robotics/ERの旧世代を中心に、一般API提供と限定利用を区別。researchのER1.6の日付は2026-06としている。

**確認結果・更新案:** Gemini Robotics2/ER2/On-Device2は2026-07-30公開。ER2はAI Studio、Enterprise Agent Platformはprivate preview、Robotics2とOn-Device2はearly-access partner経由として提供段階を分ける。旧ER1.6の公式モデルカード日付は2026-04-20で、researchの2026-06も訂正対象。モデル紹介と商用一般提供を同一視しない。

**資料の日付:** Robotics2系2026-07-30、ER1.6モデルカード2026-04-20。**アクセス日:** 2026-09-10。 [一次資料1（deepmind.google）](https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/) / [一次資料2（deepmind.google）](https://deepmind.google/models/model-cards/) / [一次資料3（deepmind.google）](https://deepmind.google/blog/gemini-robotics-er-1-6/)

#### PH-04 / P2 / 補足推奨 — GR00T N1.7の公開物とN2の予定を分離

**対象:** [docs/01-concepts/physical-ai-overview.md:60](docs/01-concepts/physical-ai-overview.md) / [docs/01-concepts/physical-ai-overview.md:120](docs/01-concepts/physical-ai-overview.md) / [research/supplementary/physical-ai.md:54](research/supplementary/physical-ai.md)

**現記述:** researchの公開基盤はGR00T N1.6を中心に整理。

**確認結果・更新案:** 公式Isaac-GR00TリポジトリはN1.7のGA、重み・reference codeのApache2.0、ONNX/TensorRT、評価情報を掲載。2026-07-07公式記事もend-to-end開発手順を説明。2026-03-16のN2 preview発表は年末提供予定であり、GAとして扱わない。researchと参考資料を公開済みartifactへ更新する。

**資料の日付:** N1.7開発記事2026-07-07、N2 preview発表2026-03-16。GA掲載状況2026-09-10。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/NVIDIA/Isaac-GR00T) / [一次資料2（developer.nvidia.com）](https://developer.nvidia.com/blog/develop-humanoid-robot-policies-end-to-end-with-nvidia-isaac-gr00t/) / [一次資料3（nvidianews.nvidia.com）](https://nvidianews.nvidia.com/news/nvidia-expands-open-model-families-to-power-the-next-wave-of-agentic-physical-and-healthcare-ai)

#### PH-05 / P2 / 補足推奨 — 世界モデルと行動方策を結合するWAMを整理へ追加

**対象:** [docs/01-concepts/world-models-overview.md:34](docs/01-concepts/world-models-overview.md) / [docs/01-concepts/world-models-overview.md:63](docs/01-concepts/world-models-overview.md) / [docs/01-concepts/world-models-overview.md:97](docs/01-concepts/world-models-overview.md) / [docs/01-concepts/physical-ai-overview.md:64](docs/01-concepts/physical-ai-overview.md) / [research/supplementary/physical-ai.md:176](research/supplementary/physical-ai.md)

**現記述:** 世界モデルの3用途を分け、主に評価/学習基盤としてVLAの直接行動生成と区別。

**確認結果・更新案:** DreamZero（2026-02-17論文）は事前学習video diffusionをもとに将来videoと連続actionを共同生成するWorld Action Model。3用途は排他的分類ではなく、予測と行動方策が結合する設計もあると補足する。研究論文・公開研究実装の段階であり商用一般提供としない。

**資料の日付:** 2026-02-17。**アクセス日:** 2026-09-10。 [一次資料1（arxiv.org）](https://arxiv.org/abs/2602.15922) / [一次資料2（research.nvidia.com）](https://research.nvidia.com/labs/gear/publications/) / [一次資料3（github.com）](https://github.com/dreamzero0/dreamzero/blob/main/README.md)

#### PH-06 / P3 / 補足推奨 — PIの実顧客導入事例を介入付き運用として補足

**対象:** [docs/01-concepts/physical-ai-overview.md:61](docs/01-concepts/physical-ai-overview.md) / [docs/01-concepts/physical-ai-overview.md:66](docs/01-concepts/physical-ai-overview.md) / [research/supplementary/physical-ai.md:132](research/supplementary/physical-ai.md) / [research/supplementary/physical-ai.md:212](research/supplementary/physical-ai.md)

**現記述:** researchにThe Physical Intelligence Layerの本文未取得、最新モデルの提供方法が未確認として残る。

**確認結果・更新案:** 2026-02-24公式記事を取得。Weaveの顧客ランドリーとUltraの顧客倉庫でπ0.6を使う実導入、遠隔介入/HITLを説明。パートナー自身の執筆による実例として研究メモを更新し、実機運用での介入率・回復経路の重要性を補強する。一般に購入可能なAPI、完全自律、第三者保証のSLAとは解釈しない。

**資料の日付:** 2026-02-24。**アクセス日:** 2026-09-10。 [一次資料1（www.pi.website）](https://www.pi.website/blog/partner)

### 輸出・越境データ・環境

#### EG-01 / P2 / 補足推奨 — BISのUAE向け条件付き優遇を輸出規制監視へ追加

**対象:** [docs/09-business/ai-geopolitics-map.md:66](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:183](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:189](docs/09-business/ai-geopolitics-map.md) / [research/strategy/geopolitics.md:39](research/strategy/geopolitics.md)

**現記述:** BISは入口リンクのみ、researchはAI Diffusion非執行等を中心に整理。

**確認結果・更新案:** BISは2026-07-10、UAEをD:3/D:4から除外しA:5へ追加、条件を満たす承認済み企業のadvanced AI chip/serverにlicense-free eligibilityを与えるfavorable treatmentを発表。国名だけでなく企業・条件・規則の照合を確認項目へ追加する。『UAE向けすべて免許不要』とはしない。発表の法令リンク2026-14132はアクセス制限、GovInfoミラーも取得不能。正確な法令発効日は未確認。Justiaは2026-07-14掲載と表示するが二次情報のため発効根拠には採用していない。

**資料の日付:** BIS発表2026-07-10。法令の発効日は未確認。**アクセス日:** 2026-09-10。 [一次資料1（www.bis.gov）](https://www.bis.gov/news-updates) / [一次資料2（www.federalregister.gov）](https://www.federalregister.gov/d/2026-14132)

#### EG-02 / P2 / 補足推奨 — 最終親会社の本社所在地を輸出相談用の事実リストへ追加

**対象:** [docs/09-business/ai-geopolitics-map.md:66](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:70](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:118](docs/09-business/ai-geopolitics-map.md) / [research/strategy/geopolitics.md:39](research/strategy/geopolitics.md)

**現記述:** 相手方・用途の情報収集を勧めるがultimate parentの本社所在地は明示していない。

**確認結果・更新案:** BISの2026-05-31 guidanceは、D:5/Macauに本社またはultimate parentを持つentityに対するadvanced computing関連の許可要件が、第三国所在でもAI Diffusion非執行とは別に継続すると説明。法務に渡す事実へ直接相手方と最終親会社の本社所在を追加し、対象ECCN・用途・取引条件を照合する。あらゆるクラウドサービスが自動的に対象と一般化しない。公式PDF1頁を取得。

**資料の日付:** 2026-05-31。**アクセス日:** 2026-09-10。 [一次資料1（media.bis.gov）](https://media.bis.gov/media/documents/bis-guidance-may-31-2026.pdf)

#### EG-04 / P2 / 訂正必要 — DPDP Rules最終原文の取得不能を解消し段階施行を整理

**対象:** [docs/09-business/ai-geopolitics-map.md:81](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:179](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:189](docs/09-business/ai-geopolitics-map.md) / [research/strategy/geopolitics.md:102](research/strategy/geopolitics.md)

**現記述:** MeitY Rules本文にアクセスできず、段階施行の詳細を要確認としている。

**確認結果・更新案:** MeitYの最終Gazette原文を取得。G.S.R.846(E)文書日2025-11-13、PIBの2025-11-17解説は通知日2025-11-14と説明。英語p24 Rule1(2)はRules1,2,17–21を公布時、1(3)はRule4を公布1年後、1(4)はRules3,5–16,22,23を公布18か月後に施行。旧取得不能TODOを正式原文と段階ごとの対象へ更新する。発表時のfull operationalisationを全条文即日施行と読まない。日単位の各期限は公布日と通知日の取り扱いも含め別途専門確認とし、文書日から自動計算して断定しない。

**資料の日付:** 通知文書2025-11-13、PIB記載の通知日2025-11-14、PIB解説2025-11-17。**アクセス日:** 2026-09-10。 [一次資料1（www.meity.gov.in）](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) / [一次資料2（www.pib.gov.in）](https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=156054&lang=1&reg=3) / [一次資料3（www.meity.gov.in）](https://www.meity.gov.in/static/uploads/2026/04/46face7d48c8f6a97030f713ad5fdab4.pdf)

#### EG-05 / P2 / 訂正必要 — CACの取得不能メモを越境データ専用索引へ更新

**対象:** [docs/09-business/ai-geopolitics-map.md:80](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:185](docs/09-business/ai-geopolitics-map.md) / [research/strategy/geopolitics.md:93](research/strategy/geopolitics.md)

**現記述:** CAC公式本文が取得不能で国外アクセスの制約が残ると記述。

**確認結果・更新案:** CACトップと越境データの公式専用索引を取得できた。索引は2025-06-27の『数据出境安全评估申报指南（第三版）』や標準契約・認証を掲載。2026-08-12の個人情報保護政策法規FAQページも取得。取得不能の一律メモを到達できた正式入口・文書名へ更新し、個別条項の適用確認は残す。FAQの全文解釈や全規制の横断比較は未実施。

**資料の日付:** 第三版ガイド掲載2025-06-27、FAQ2026-08-12。**アクセス日:** 2026-09-10。 [一次資料1（www.cac.gov.cn）](https://www.cac.gov.cn/) / [一次資料2（www.cac.gov.cn）](https://www.cac.gov.cn/wxzw/sjzl/sjcjaqpg/A09370801index_1.htm) / [一次資料3（www.cac.gov.cn）](https://www.cac.gov.cn/2026-08/12/c_1788195297373459.htm)

#### EG-06 / P2 / 訂正必要 — AWS CCFTの後継をSustainability consoleへ具体化

**対象:** [docs/05-operations/green-ai.md:80](docs/05-operations/green-ai.md) / [docs/05-operations/green-ai.md:82](docs/05-operations/green-ai.md) / [docs/05-operations/green-ai.md:146](docs/05-operations/green-ai.md) / [research/strategy/green-ai.md:34](research/strategy/green-ai.md) / [research/strategy/green-ai.md:70](research/strategy/green-ai.md) / [research/strategy/green-ai.md:186](research/strategy/green-ai.md)

**現記述:** CCFTの2026-06-30廃止予告と後継確認TODOが残り、Scopeの説明も旧範囲を前提にしている。

**確認結果・更新案:** AWS Sustainability consoleは2026-03-31 GA。無料でBilling権限を要しない専用console、Scope1/2/3、market-based/location-based、service/region粒度、API/CSVを提供。現行user guideは月次排出量と年次water withdrawalsも説明。後継名・取得経路・測定境界を具体化する。旧CCFT release notesは取得時もwill be deprecated June30と未来形を残しており、実際の旧UI閉鎖は操作検証していない。後継の利用可能と旧画面停止の実確認を混同しない。

**資料の日付:** 後継GA2026-03-31、旧CCFT廃止予告日2026-06-30。**アクセス日:** 2026-09-10。 [一次資料1（aws.amazon.com）](https://aws.amazon.com/about-aws/whats-new/2026/03/aws-launches-sustainability-console/) / [一次資料2（aws.amazon.com）](https://aws.amazon.com/sustainability/tools/console/) / [一次資料3（docs.aws.amazon.com）](https://docs.aws.amazon.com/sustainability/latest/userguide/getting-started.html) / [一次資料4（docs.aws.amazon.com）](https://docs.aws.amazon.com/ccft/latest/releasenotes/what-is-ccftrn.html)

#### EG-07 / P2 / 訂正必要 — SCI for AIを策定中からGSF批准済み仕様へ更新

**対象:** [docs/05-operations/green-ai.md:80](docs/05-operations/green-ai.md) / [docs/05-operations/green-ai.md:134](docs/05-operations/green-ai.md) / [research/strategy/green-ai.md:123](research/strategy/green-ai.md)

**現記述:** SCI for AIを策定中として扱っている。

**確認結果・更新案:** GSF公式トップはSCI for AIをRatified December2025と表示し、規格ページもQ4 2025 ratification/Q1 2026 publicationの工程を示す。GSF仕様として批准済みへ更新し、AI lifecycleに応じた境界定義を紹介する。基本SCIのISO/IEC21031:2024とGSFのAI拡張は別であり、AI拡張までISO規格化済みとは記さない。

**資料の日付:** 批准2025-12。現行仕様掲載状況2026-09-10。**アクセス日:** 2026-09-10。 [一次資料1（greensoftware.foundation）](https://greensoftware.foundation/) / [一次資料2（greensoftware.foundation）](https://greensoftware.foundation/standards/sci-ai/)

#### EG-08 / P2 / 補足推奨 — CSRD簡素化を最終承認後の状態へ更新

**対象:** [docs/05-operations/green-ai.md:88](docs/05-operations/green-ai.md) / [docs/05-operations/green-ai.md:148](docs/05-operations/green-ai.md) / [research/strategy/green-ai.md:154](research/strategy/green-ai.md)

**現記述:** CSRD/ESRSの簡素化が動いていると抽象的に記載し、researchも提案段階中心。

**確認結果・更新案:** Councilは2026-02-24に簡素化法制を最終承認。公式発表は企業の対象閾値を従業員1000人超かつ純売上€450m超と説明し、第三国企業・移行措置は別条件。researchを提案段階から最終承認へ更新し、本文は改正法令と加盟国での国内法化確認を促す。今回、確定法令番号と各国の適用日は未照合のため、具体的な義務判定に使えるところまで確認済みとはしない。

**資料の日付:** 2026-02-24。**アクセス日:** 2026-09-10。 [一次資料1（www.consilium.europa.eu）](https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/)

#### EG-03 / P3 / 補足推奨 — EU dual-useのAnnex I更新を法令番号と日付で管理

**対象:** [docs/09-business/ai-geopolitics-map.md:68](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:172](docs/09-business/ai-geopolitics-map.md) / [research/strategy/geopolitics.md:55](research/strategy/geopolitics.md)

**現記述:** EU dual-useの公式入口のみを掲載。

**確認結果・更新案:** EC公式入口が示す更新はDelegated Regulation(EU)2025/2003でAnnex Iを改正。採択2025-09-08、OJ公布2025-11-14、翌日発効2025-11-15。researchに法令番号を固定し、同ページのSeptember2024 Excelは法令の代替にしない。今回取得した公式入口の掲載状況であり、2026年の更新が全世界で存在しないと断定するものではない。251頁PDFの冒頭・発効規定を確認した範囲。

**資料の日付:** 採択2025-09-08、公布2025-11-14、発効2025-11-15。**アクセス日:** 2026-09-10。 [一次資料1（policy.trade.ec.europa.eu）](https://policy.trade.ec.europa.eu/help-exporters-and-importers/exporting-dual-use-items_en) / [一次資料2（eur-lex.europa.eu）](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202502003)

#### EG-09 / P3 / 補足推奨 — EEDデータセンター報告FAQ1.8と格付けの実際の段階を追跡

**対象:** [docs/05-operations/green-ai.md:137](docs/05-operations/green-ai.md) / [docs/05-operations/green-ai.md:148](docs/05-operations/green-ai.md) / [research/strategy/green-ai.md:101](research/strategy/green-ai.md) / [research/strategy/green-ai.md:163](research/strategy/green-ai.md)

**現記述:** EED databaseの入口のみを示し、格付けパッケージを策定監視項目とする。

**確認結果・更新案:** EC hubに2026-07-28掲載のFAQは本文表紙v1.8 July2026。500kW以上の年次報告を説明。URLのfilenameに1v7とあっても本文版を優先する。格付けpackageはページ上preparingのままで、意見募集は2026-03-26〜2026-04-23。researchへFAQ版を追記し、Q2予定が経過しただけで採択済みとしない。79頁のFAQ全論点を法律レビューしたわけではない。

**資料の日付:** FAQ本文版2026-07、hub掲載2026-07-28。**アクセス日:** 2026-09-10。 [一次資料1（energy.ec.europa.eu）](https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficiency-targets-directive-and-rules/energy-efficiency-directive/energy-performance-data-centres_en) / [一次資料2（energy.ec.europa.eu）](https://energy.ec.europa.eu/document/download/2597a32b-c791-4d87-a9da-57b64a3c4d7d_en?filename=2026_07_03+FAQ+on+European+database+on+data+centres+1v7-AA(1).pdf)

#### EG-10 / P3 / 補足推奨 — クラウド環境報告を最新の実績年と公開版へ更新

**対象:** [docs/05-operations/green-ai.md:82](docs/05-operations/green-ai.md) / [docs/05-operations/green-ai.md:144](docs/05-operations/green-ai.md) / [research/strategy/green-ai.md:16](research/strategy/green-ai.md)

**現記述:** researchにMicrosoft2025 fact sheetやAmazon2024 summaryなど旧年の資料が残る。

**確認結果・更新案:** Googleは2025実績を扱う2026 Environmental Report、Microsoftは2026 Environmental Sustainability Report、Amazon hubは2025 Sustainability Reportを掲載。研究メモの参照を更新して公表年と実績年を分ける。環境数値を比較掲載するには年度・組織境界・保証対象・推計方法を追加確認する。今回の資料存在確認だけでベンダー間数値の比較可能性を保証しない。

**資料の日付:** Google/Microsoft2026報告、Amazon2025報告。掲載状況2026-09-10。**アクセス日:** 2026-09-10。 [一次資料1（sustainability.google）](https://sustainability.google/google-2026-environmental-report/) / [一次資料2（www.microsoft.com）](https://www.microsoft.com/en-us/corporate-responsibility/topics/sustainability/report/) / [一次資料3（www.microsoft.com）](https://www.microsoft.com/en-us/corporate-responsibility/reports-hub) / [一次資料4（sustainability.aboutamazon.com）](https://sustainability.aboutamazon.com/reports)

#### EG-11 / P3 / 補足推奨 — IEAの2026年Energy and AI資料へ参照を追加

**対象:** [docs/05-operations/green-ai.md:59](docs/05-operations/green-ai.md) / [docs/05-operations/green-ai.md:135](docs/05-operations/green-ai.md) / [research/strategy/green-ai.md:83](research/strategy/green-ai.md)

**現記述:** 本文はIEA2025 Energy and AIが主参照で、researchの2026年資料は取得不能。

**確認結果・更新案:** 2026-04-16公開のKey Questions on Energy and AIとexecutive summaryを取得。参考資料へ追加しresearchの旧アクセス不能を解消する。タスク当たり効率と利用量・タスク構成の変化を分ける設計判断を補強する。今回マクロ予測の全数値や前提を再計算していない。

**資料の日付:** 2026-04-16。**アクセス日:** 2026-09-10。 [一次資料1（www.iea.org）](https://www.iea.org/reports/key-questions-on-energy-and-ai) / [一次資料2（www.iea.org）](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary)

#### EG-12 / P3 / 補足推奨 — EU十分性認定の直近決定と再審査を研究メモへ追加

**対象:** [docs/09-business/ai-geopolitics-map.md:79](docs/09-business/ai-geopolitics-map.md) / [docs/09-business/ai-geopolitics-map.md:174](docs/09-business/ai-geopolitics-map.md) / [research/strategy/geopolitics.md:68](research/strategy/geopolitics.md)

**現記述:** 十分性認定の公式入口を掲載するのみ。

**確認結果・更新案:** EC公式一覧にBrazilの2026-01-26 decisionとKoreaの2026-07-23 first reviewを掲載。本文の一般説明は維持できるが、researchの直近監視例へ追加し、認定決定と既存決定の再審査を区別する。個々のデータ移転が無条件で許されるとの記述にはしない。

**資料の日付:** Brazil決定2026-01-26、Korea再審査2026-07-23。**アクセス日:** 2026-09-10。 [一次資料1（commission.europa.eu）](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en) / [一次資料2（eur-lex.europa.eu）](https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX:32026D0179)

### サービング・OSS・フレームワーク

#### T16 / P2 / 訂正必要 — Kong AI Gateway 2.0と旧プラグイン・OSSライセンスを分離

**対象:** [docs/05-operations/llm-gateway.md:50](docs/05-operations/llm-gateway.md) / [research/llmops/serving.md:146](research/llmops/serving.md) / [research/llmops/serving.md:175](research/llmops/serving.md) / [research/llmops/serving.md:203](research/llmops/serving.md)

**現記述:** Kong AI Gateway製品全体をOSSとして整理し、旧プラグイン中心の説明をしています。

**確認結果・更新案:** 2026-09-01 GAのAI Gateway 2.0は独立したruntime、control plane、Admin API、versionを持ちます。従来のKong Gateway 3.xプラグインと分け、Kong coreのApacheライセンスを製品全体に適用しません。旧プラグインの廃止は意味しません。無印AI ProxyのFree / OSS利用範囲は未確定として残します。

**資料の日付:** 2026-09-01。**アクセス日:** 2026-09-10。 [一次資料1（konghq.com）](https://konghq.com/blog/product-releases/kong-ai-gateway-2-0-ga) / [一次資料2（developer.konghq.com）](https://developer.konghq.com/ai-gateway/)

#### T17 / P2 / 訂正必要 — TensorRT-LLMのLTX-2モデル配下のライセンス例外を追加

**対象:** [research/llmops/serving.md:48](research/llmops/serving.md) / [research/llmops/serving.md:191](research/llmops/serving.md)

**現記述:** TensorRT-LLM全体を無条件にApacheライセンスとしています。

**確認結果・更新案:** 主ライセンスはApacheですが、tensorrt_llm/_torch/visual_gen/models/ltx2/にはLTX-2 Community Licenseの例外があります。導入日を推測せず、取得する構成物に応じて個別ライセンスを確認する形へ訂正します。

**資料の日付:** 公開日不明（2026-09-10に現行一次資料を確認）。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/NVIDIA/TensorRT-LLM/blob/main/LICENSE)

#### T18 / P2 / 訂正必要 — LM Studioの現行App Termsと有料機能条件を反映

**対象:** [research/llmops/serving.md:105](research/llmops/serving.md) / [research/llmops/serving.md:197](research/llmops/serving.md)

**現記述:** 2025-07-01の無償提供を基準に整理しています。

**確認結果・更新案:** 2026-08-23のApp Termsには有料機能、subscription、usage credit等があります。personal / internal businessの許諾と再配布・SaaS制限の継続を併記し、すべての無料機能が終了したとは書きません。

**資料の日付:** 2026-08-23。**アクセス日:** 2026-09-10。 [一次資料1（lmstudio.ai）](https://lmstudio.ai/app-terms)

#### T24 / P2 / 訂正必要 — Gemma 4のApache 2.0を旧世代の独自規約から分離

**対象:** [research/ecosystem/industry-oss.md:176](research/ecosystem/industry-oss.md) / [research/ecosystem/industry-oss.md:250](research/ecosystem/industry-oss.md) / [docs/03-implementation/llm-landscape.md:104](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/llm-landscape.md:109](docs/03-implementation/llm-landscape.md) / [docs/03-implementation/open-source-ai-ecosystem.md](docs/03-implementation/open-source-ai-ecosystem.md)

**現記述:** Gemmaを独自規約として一括で整理し、Apacheの適用を未確認として扱っています。

**確認結果・更新案:** 公式条文で確認できるGemma 4のApache 2.0と旧世代のGemma Termsを分けます。Termsは2026-04-01版ですが、Gemma 4への適用開始日をこの日と推測しません。

**資料の日付:** Terms 2026-04-01版（Gemma 4の適用開始日は未確認）。**アクセス日:** 2026-09-10。 [一次資料1（ai.google.dev）](https://ai.google.dev/gemma/terms) / [一次資料2（ai.google.dev）](https://ai.google.dev/gemma/apache_2)

#### T25 / P3 / 補足推奨 — Microsoft Agent Framework 1.0の提供段階を調査メモへ追加

**対象:** [research/ecosystem/industry-oss.md:57](research/ecosystem/industry-oss.md) / [research/ecosystem/industry-oss.md:60](research/ecosystem/industry-oss.md) / [research/ecosystem/industry-oss.md:107](research/ecosystem/industry-oss.md) / [docs/03-implementation/framework-selection.md](docs/03-implementation/framework-selection.md)

**現記述:** AutoGenのmaintenance移行後の後継について、提供段階が具体化されていません。

**確認結果・更新案:** 2026-04-03公開のMicrosoft Agent Framework 1.0はproduction-readyで、安定した.NET / Python APIと長期supportを示します。AutoGenのmaintenance継続と併記します。フレームワーク選定の一般原則を述べる本文の改稿は必須ではなく、研究メモや具体例の更新候補です。

**資料の日付:** 2026-04-03。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/microsoft/autogen) / [一次資料2（devblogs.microsoft.com）](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/) / [一次資料3（github.com）](https://github.com/microsoft/agent-framework)

### RPA・先端応用

#### EM01 / P2 / 訂正必要 — Robin の査読出版と人が実験する検証範囲を更新

**対象:** [research/domain-agents/emerging.md:35](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:78](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:120](research/domain-agents/emerging.md)

**現記述:** Robin を査読前の研究として記録しています。

**確認結果・更新案:** 「A multi-agent system for automating scientific discovery」は 5/19 に Nature で公開され、655 巻 497–505 ページに収録されています。人が実験してデータを返す semi-autonomous の構成、ripasudil / KL001 の in vitro 検証を記載します。独立追試、臨床効果、完全無人化の証明とは扱いません。

**資料の日付:** 2026-05-19。**アクセス日:** 2026-09-10。 [一次資料1（www.nature.com）](https://www.nature.com/articles/s41586-026-10652-y) / [一次資料2（www.natureasia.com）](https://www.natureasia.com/en/info/press-releases/detail/9330)

#### EM03 / P2 / 訂正必要 — A-Lab の訂正文に基づき新規性と成功数を修正

**対象:** [research/domain-agents/emerging.md:37](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:82](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:83](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:119](research/domain-agents/emerging.md)

**現記述:** 「17 日で 41 の新規化合物」を記録し、訂正については二次情報を根拠としています。

**確認結果・更新案:** 1/19 公開の Author Correction を著者機関 UC の全文で確認しました。新規性は予測プラットフォームにとっての新規性であり、科学的な新発見とは限りません。学習データ混入の Zn2Cr3FeO8 を除外し、残る 40 件のうち 36 件を再確認、4 件は XRD 同定が不確定なため成功数から除外しています。撤回や全件失敗という表現も不適切です。

**資料の日付:** 2026-01-19（公開）、2026-02-05（号）。**アクセス日:** 2026-09-10。 [一次資料1（www.nature.com）](https://www.nature.com/articles/s41586-025-09992-y) / [一次資料2（escholarship.org）](https://escholarship.org/content/qt4kb4s6pg/qt4kb4s6pg_noSplash_e2c3d812b2171874cfeca482fc6c214c.pdf) / [一次資料3（repositories.cdlib.org）](https://repositories.cdlib.org/uc/item/4kb4s6pg)

#### EM04 / P2 / 訂正必要 — 1,000 人シミュレーション研究の論文リンク・版・評価指標を修正

**対象:** [research/domain-agents/emerging.md:43](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:91](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:125](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:156](research/domain-agents/emerging.md)

**現記述:** 旧題と 85% の値を記載し、Project Sid の arXiv ID 2411.00114 へ誤ってリンクしています。

**確認結果・更新案:** 正しい arXiv ID は 2411.10109 です。6/28 の v3 は「LLM Agents Grounded in Self-Reports Enable General-Purpose Simulation of Individuals」です。GSS に対する本人の 2 週間後の再回答一致度を基準とした比率は、面接 83%、質問 82%、両方 86%、人口統計 74% です。旧 85% は初期版の履歴として区別し、一般的な行動予測の正答率とは表現しません。査読誌への掲載は未確認です。

**資料の日付:** 2026-06-28（v3）。**アクセス日:** 2026-09-10。 [一次資料1（arxiv.org）](https://arxiv.org/abs/2411.10109) / [一次資料2（arxiv.org）](https://arxiv.org/abs/2411.10109v3)

#### EM05 / P2 / 訂正必要 — PUBG Ally の出荷表現を期間限定ベータと実装構成へ修正

**対象:** [research/domain-agents/emerging.md:47](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:93](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:121](research/domain-agents/emerging.md)

**現記述:** PUBG Ally を 2025 年に出荷済みの事例として記録しています。

**確認結果・更新案:** 公式情報で確認できるのは 2026-06-17〜30 の Arcade における 2 週間の public beta です。6/17 の告知と 6/25 の技術記事に基づき、行動木による即応とローカル SLM による認知・対話という構成を記載し、Audio2Face だけの説明と区別します。9/10 時点での恒常提供は未確認です。

**資料の日付:** 2026-06-17（告知）、2026-06-25（技術記事）。**アクセス日:** 2026-09-10。 [一次資料1（www.nvidia.com）](https://www.nvidia.com/en-us/geforce/news/pubg-ally-ai-teammate-beta-available-now/) / [一次資料2（developer.nvidia.com）](https://developer.nvidia.com/blog/how-krafton-built-pubg-ally-a-co-playable-character-powered-by-nvidia-ace/) / [一次資料3（www.nvidia.com）](https://www.nvidia.com/en-us/geforce/news/nvidia-ace-autonomous-ai-companions-pubg-naraka-bladepoint/)

#### EM06 / P2 / 訂正必要 — ChatGPT commerce の現行方針を商品発見と加盟店 checkout に更新

**対象:** [research/domain-agents/emerging.md:55](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:106](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:107](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:122](research/domain-agents/emerging.md)

**現記述:** 2025 年 9 月の Etsy 単品 Instant Checkout を現行例とし、その後の縮小は二次情報で記録しています。

**確認結果・更新案:** 3/24 の OpenAI 一次情報に基づき、商品発見への重点移動、加盟店独自の checkout 体験を認める方針、ACP feeds による販促拡張へ更新します。ChatGPT 内の購入がすべて廃止されたという表現は避けます。

**資料の日付:** 2026-03-24。**アクセス日:** 2026-09-10。 [一次資料1（openai.com）](https://openai.com/index/powering-product-discovery-in-chatgpt/) / [一次資料2（openai.com）](https://openai.com/index/buy-it-in-chatgpt/)

#### EM07 / P2 / 補足推奨 — Agent 決済の実取引 pilot と一般提供を区別して補足

**対象:** [research/domain-agents/emerging.md:55](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:108](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:122](research/domain-agents/emerging.md)

**現記述:** Mastercard / Visa の実購買の状況を未確認としています。

**確認結果・更新案:** 6/2 の Worldline / ING / Mastercard は、オランダの実カード会員と加盟店を使った production での実取引ですが、最終的な人の明示承認を伴う pilot です。4/8 の Visa Connect も特定パートナーの pilot として扱います。6/10 の Visa と OpenAI、Mastercard Agent Pay for Machines の追加発表を補足します。全地域 GA や継続的な大量の実利用は未確認です。

**資料の日付:** 2026-04-08、2026-06-02、2026-06-10。**アクセス日:** 2026-09-10。 [一次資料1（www.mastercard.com）](https://www.mastercard.com/news/europe/en/newsroom/press-releases/en/2026/worldline-ing-and-mastercard-complete-a-live-end-to-end-european-agentic-payment-in-production/) / [一次資料2（investor.visa.com）](https://investor.visa.com/news/news-details/2026/Visa-Opens-the-Door-to-AI-Driven-Shopping-for-Businesses-Worldwide/) / [一次資料3（usa.visa.com）](https://usa.visa.com/about-visa/newsroom/press-releases.releaseid.22496.html) / [一次資料4（www.mastercard.com）](https://www.mastercard.com/us/en/news-and-trends/press/2026/june/mastercard-launches-agent-pay-for-machines.html)

#### EM08 / P2 / 訂正必要 — AP2 v0.2 の FIDO 寄贈と Mandate の現行構成を更新

**対象:** [research/domain-agents/emerging.md:57](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:103](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:104](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:123](research/domain-agents/emerging.md)

**現記述:** 初期の Intent / Cart Mandate を中心に記載し、FIDO への移管は検索結果だけで記録しています。

**確認結果・更新案:** 4/28 の Google 本文に基づき、FIDO への寄贈と v0.2 公開を確認済みとして更新します。現仕様の Checkout / Payment Mandate、Human Present / Not Present、open / closed の委任を整理します。docs 本文 68 行目の決定的な検証という説明は、現仕様でも MUST に対応しており変更不要です。

**資料の日付:** 2026-04-28。**アクセス日:** 2026-09-10。 [一次資料1（ap2-protocol.org）](https://ap2-protocol.org/ap2/specification/) / [一次資料2（blog.google）](https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/)

#### RPA01 / P2 / 補足推奨 — WorkHQ の名称発表と Agentic Workflows の GA・サポート期限を区別

**対象:** [research/domain-agents/rpa.md:12](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:96](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:127](research/domain-agents/rpa.md) / [docs/13-domain-agents/rpa-and-agents.md:145](docs/13-domain-agents/rpa-and-agents.md) / [ROADMAP.md:711](ROADMAP.md)

**現記述:** WorkHQ は 4/29 発表としており、GA を未確認としています。

**確認結果・更新案:** Agentic Workflows は 3/27 GA です。Next Generation（現 WorkHQ）、Blue Prism Cloud、Enterprise 7.4.1 以降という対象条件と、名称発表を分けて記録します。Design Studio 3.20.0–3.21.0 / Digital Worker 2.38.0–2.39.0 は 9/30 にサポート終了しますが、2025.25 以前の同梱版は対象外です。SS&C AI Gateway の Qwen3-30B-A3B は 6/12 頃の廃止通知まで確認でき、実停止日は未確認です。

**資料の日付:** 2026-03-27（GA）、2026-07-20（ページ）、2026-09-30（対象版サポート終了）。**アクセス日:** 2026-09-10。 [一次資料1（documentation.blueprism.com）](https://documentation.blueprism.com/workhq/en-us/announcements/announcements.htm)

#### RPA02 / P2 / 補足推奨 — WinActor 7.7 と AI 支援の利用上限切替・外部通信条件を補足

**対象:** [research/domain-agents/rpa.md:109](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:129](research/domain-agents/rpa.md) / [docs/13-domain-agents/rpa-and-agents.md:145](docs/13-domain-agents/rpa-and-agents.md) / [ROADMAP.md:711](ROADMAP.md)

**現記述:** WinActor 7.6 を監視対象とし、AI 支援の無制限期間から利用上限への切替を記録していません。

**確認結果・更新案:** 2025-09-04 告知の脚注では無制限期間は 2026 年 9 月末までで、10 月から上限と追加パックへ切り替わります。現行 7.7 の AI ヘルプ、VBScript から Python への移行支援を補足します。正確なリリース日、上限数量、価格は未確認です。AI 連携は NTT-AT サーバーと Azure OpenAI への外部通信を伴うため、閉域 RPA と混同しないよう条件を記載します。

**資料の日付:** 2025-09-04（告知）、2026-09 末（無制限期間終了）。**アクセス日:** 2026-09-10。 [一次資料1（www.ntt-at.co.jp）](https://www.ntt-at.co.jp/news/2025/detail/release250904.html) / [一次資料2（winactor.biz）](https://winactor.biz/product/winactor_v7.html) / [一次資料3（winactor.biz）](https://winactor.biz/use/manual.html)

#### RPA03 / P2 / 補足推奨 — UiPath Maestro の自己ホスト提供と TaaS の配置条件を補足

**対象:** [research/domain-agents/rpa.md:51](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:52](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:126](research/domain-agents/rpa.md) / [docs/13-domain-agents/rpa-and-agents.md:145](docs/13-domain-agents/rpa-and-agents.md)

**現記述:** UiPath の 5/5 発表を中心に記録しています。

**確認結果・更新案:** Maestro Automation Suite 2.2510.2 は 4/15 に EKS / AKS / OpenShift の自己ホストを提供し、2.2510.3 は 7/23 にリソース使用を改善しています。TaaS はクラスタ内の Kubernetes deployments であり、名称だけで外部 SaaS と判定できません。一方、全機能や利用モデルが閉域に収まるという一般化は避け、配置と外部接続を個別に確認します。

**資料の日付:** 2026-04-15、2026-07-23。**アクセス日:** 2026-09-10。 [一次資料1（docs.uipath.com）](https://docs.uipath.com/maestro/automation-suite/2.2510/release-notes/2-2510-2) / [一次資料2（docs.uipath.com）](https://docs.uipath.com/maestro/automation-suite/2.2510/release-notes/2-2510-3) / [一次資料3（docs.uipath.com）](https://docs.uipath.com/automation-suite/automation-suite/2.2510/installation-guide-eks-aks/kubernetes-cluster-and-nodes)

#### RPA04 / P2 / 訂正必要 — Copilot Studio computer use の GA 条件と古い RPA 比較を同期

**対象:** [research/domain-agents/rpa.md:66](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:68](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:124](research/domain-agents/rpa.md) / [ROADMAP.md:711](ROADMAP.md)

**現記述:** 1/20 時点の古い比較表に基づく「GA のみなら RPA」という条件が、次の行の computer use GA 記録と矛盾しています。

**確認結果・更新案:** 5/13 の公式告知と 7/3 更新の computer use 資料では、OpenAI CUA / Sonnet 4.5 は GA、Sonnet 4.6 / Opus 4.6 は Experimental です。古い GA 条件を現行の選定理由から除き、モデルごとの提供状態を分けます。全地域の展開完了は未検証です。

**資料の日付:** 2026-05-13（告知）、2026-07-03（資料更新）。**アクセス日:** 2026-09-10。 [一次資料1（learn.microsoft.com）](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/agent-tools) / [一次資料2（learn.microsoft.com）](https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use) / [一次資料3（techcommunity.microsoft.com）](https://techcommunity.microsoft.com/blog/copilot-studio-blog/computer-using-agents-in-microsoft-copilot-studio-are-now-generally-available/4519427/replies/4527780)

#### RPA05 / P2 / 補足推奨 — Copilot Studio の harness と agent flows / workflows を区別

**対象:** [research/domain-agents/rpa.md:22](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:62](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:64](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:124](research/domain-agents/rpa.md)

**現記述:** generative orchestration と agent flows を中心に説明しています。

**確認結果・更新案:** 8/27 の harness 資料に沿い、GitHub Copilot harness、standard、Copilot chat の 3 種類を整理します。agent flows は standard（classic）に属し、新 workflows は別の仕組みです。Power Automate から agent flow への一方向変換と、新 workflows へは変換できない条件を区別します。容量を使い切ると新規実行がブロックされるため、容量監視も更新候補に含めます。

**資料の日付:** 2026-08-27（harness 資料）、2026-08-03（flows 資料）。**アクセス日:** 2026-09-10。 [一次資料1（learn.microsoft.com）](https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview) / [一次資料2（learn.microsoft.com）](https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview)

#### RPA06 / P2 / 補足推奨 — Automation Anywhere の Mozart と機能ごとの提供状態を補足

**対象:** [research/domain-agents/rpa.md:22](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:79](research/domain-agents/rpa.md) / [research/domain-agents/rpa.md:124](research/domain-agents/rpa.md)

**現記述:** APA、PRE、Studio を中心に記録しています。

**確認結果・更新案:** Mozart Orchestrator を追加し、5/19 発表時点で AI Evaluations は GA、Enterprise Claw / AAI Code は public preview、Context Intelligence Graph は preview で Q3 GA 予定、Process Simulation は別の予定であることを区別します。9/10 時点の GA 完了を予定から推定しません。30% の精度改善はベンダー内部評価として扱います。

**資料の日付:** 2026-05-19。**アクセス日:** 2026-09-10。 [一次資料1（www.automationanywhere.com）](https://www.automationanywhere.com/products/agentic-process-automation-system) / [一次資料2（www.automationanywhere.com）](https://www.automationanywhere.com/company/press-room/automation-anywhere-unveils-2026-platform-enhancements-run-ai-driven-processes) / [一次資料3（www.automationanywhere.com）](https://www.automationanywhere.com/company/press-room?year=2026)

#### EM02 / P3 / 補足推奨 — AI co-scientist の出版書誌と確認できた証拠の範囲を補足

**対象:** [research/domain-agents/emerging.md:33](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:74](research/domain-agents/emerging.md) / [research/domain-agents/emerging.md:118](research/domain-agents/emerging.md)

**現記述:** Co-Scientist の出版状況は DeepMind の表明を主な根拠としています。

**確認結果・更新案:** 出版社書誌では 5/19 公開、7/1 Version of Record、7/9 号の Nature 655 巻 487–496 ページです。DOI 検索と広報から scientist-in-the-loop と 3 件の生物医学的検証を確認しました。通常の本文取得は認証エラー、PMC は CAPTCHA のため、全論文を直接精査したとはしません。91% 等の結果に対する独立追試は未確認です。

**資料の日付:** 2026-05-19（公開）、2026-07-01（Version of Record）、2026-07-09（号）。**アクセス日:** 2026-09-10。 [一次資料1（www.nature.com）](https://www.nature.com/articles/s41586-026-10644-y) / [一次資料2（doi.org）](https://doi.org/10.1038/s41586-026-10644-y) / [一次資料3（www.natureasia.com）](https://www.natureasia.com/en/info/press-releases/detail/9330)

### 依存パッケージ・CI

#### D01 / P2 / 補足推奨 — Anthropic Python SDK 1系への移行計画

**対象:** [examples/python/tool-use/requirements.txt:1](examples/python/tool-use/requirements.txt) / [examples/python/structured-output/requirements.txt:3](examples/python/structured-output/requirements.txt) / [examples/python/rag-basics/requirements.txt:4](examples/python/rag-basics/requirements.txt) / [examples/python/evaluation-harness/requirements.txt:3](examples/python/evaluation-harness/requirements.txt) / [examples/python/multi-agent/requirements.txt:3](examples/python/multi-agent/requirements.txt) / [examples/tests/test_regressions.py:17](examples/tests/test_regressions.py) / [examples/tests/README.md:12](examples/tests/README.md)

**現記述:** 0.116.0固定でhttpx.MockTransportを利用。

**確認結果・更新案:** 現行1.4.0(9/4)を候補に、httpx2への移行、削除API、テストtransportの変更を確認。固定旧版の既存テストは成功済みで、現行サンプルの故障とは判定しない。

**資料の日付:** v1.0 2026-08-20 / v1.4.0 2026-09-04。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/anthropics/anthropic-sdk-python/blob/main/MIGRATION.md) / [一次資料2（github.com）](https://github.com/anthropics/anthropic-sdk-python/releases/tag/v1.4.0) / [一次資料3（pypi.org）](https://pypi.org/project/anthropic/)

#### D03 / P2 / 補足推奨 — GitHub Actions の Node 24 対応世代へ更新

**対象:** [.github/workflows/ci.yml](.github/workflows/ci.yml)

**現記述:** checkout/setup-node v4、setup-python v5、Pages v3/v4をSHA固定。直前CIでNode20廃止・Node24強制の注記が発生。

**確認結果・更新案:** 現行checkout7.0.1/setup-node7/setup-python7/upload-pages-artifact5/deploy-pages5.0.1の移行差分を読み、SHA固定を維持して更新検証。CI成功中なので障害発生とはしない。

**資料の日付:** 2026-09-10現行資料確認（公開日未確認）。**アクセス日:** 2026-09-10。 [一次資料1（github.com）](https://github.com/actions/checkout/releases/tag/v7.0.1) / [一次資料2（github.com）](https://github.com/actions/setup-node/releases/tag/v7.0.0) / [一次資料3（github.com）](https://github.com/actions/setup-python/releases/tag/v7.0.0) / [一次資料4（github.com）](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) / [一次資料5（github.com）](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) / [一次資料6（github.com）](https://github.com/pero3dev/ai-agent-library/actions/runs/34393561986)

#### D04 / P3 / 補足推奨 — React / React Flow の互換更新候補

**対象:** [website/package.json](website/package.json) / [website/package-lock.json](website/package-lock.json)

**現記述:** React/react-dom19.2.7、@xyflow/react12.11.2。

**確認結果・更新案:** npm outdatedで19.3.0/12.11.6を確認。新しいだけで必須にせず変更履歴とNextra互換性を評価し、依存マップ/検索/keyboard/Mermaid回帰を更新時に実施。Next16.3.4等はoutdated対象外。

**資料の日付:** 2026-09-10現行資料確認（公開日未確認）。**アクセス日:** 2026-09-10。 [一次資料1（www.npmjs.com）](https://www.npmjs.com/package/react) / [一次資料2（www.npmjs.com）](https://www.npmjs.com/package/@xyflow/react)

## 16系統の検証範囲・変更なし・確認不能

「変更なし」は記載した個別の主張だけを再確認した意味です。古い公表物が掲載されていることから、別経路にも新しい資料がないとは結論していません。

### 検証範囲: LLMモデル + ベンダー別プロンプティング

モデルカタログ、各社prompting、移行・キャッシュ・モデル調査メモ

確認した差分: M01–M11、Astra/Gemini/Claudeの最新モデル固有条件とオープンウェイトの個別ライセンスを確認。

- **変更なし:** Astraモデル一覧の導入自体は既に反映。モデル選定・前方一致キャッシュ・回帰評価の原則は維持。
- **確認不能・未検証:** モデル全リージョン/全価格/全sampling組合せの実呼出し、Metaの全ライセンス再取得、モデル間の品質比較は未実施。

[一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/guides/latest-model) / [一次資料2（platform.claude.com）](https://platform.claude.com/docs/en/models/overview) / [一次資料3（ai.google.dev）](https://ai.google.dev/gemini-api/docs/changelog) / [一次資料4（huggingface.co）](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B-FP8/blob/main/LICENSE) / [一次資料5（docs.mistral.ai）](https://docs.mistral.ai/resources/changelogs)

### 検証範囲: 認証・相互運用

認証記事、MCP入門/サンプル、相互運用、IETF/ベンダー/プロトコル調査メモ

確認した差分: AU01–AU04、D02。Google Auth manager GA、OpenAI OAuth guide到達、MCP SDK2.2を確認。

- **変更なし:** OAuth2.1はdraft、ID-JAG-04、identity-chaining-17/RFC Editor待ち。MCP現行7/28、A2A1.0/AAIFの大枠は維持可能。Entra GAと一部Previewの混在も継続。
- **確認不能・未検証:** IETF全個人ドラフトの採択/失効、全ベンダーtenantでのGA機能・認証フロー、AP2の実取引は未検証。

[一次資料1（datatracker.ietf.org）](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) / [一次資料2（datatracker.ietf.org）](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/) / [一次資料3（datatracker.ietf.org）](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/) / [一次資料4（learn.microsoft.com）](https://learn.microsoft.com/en-us/entra/agent-id/whats-new-agent-id) / [一次資料5（docs.cloud.google.com）](https://docs.cloud.google.com/iam/docs/release-notes) / [一次資料6（a2a-protocol.org）](https://a2a-protocol.org/latest/blog/category/announcements/)

### 検証範囲: 音声API / FT提供メニュー

voice-agents、fine-tuning-and-distillation、関連research

確認した差分: A02/A03/FT01。音声廃止計画とGoogle3系SFT対応を確認。 FT02のClaude3 Haiku EOL/Legacy時FT制限も確認。

- **変更なし:** OpenAIのself-service FT新規ジョブ終了2027-01-06、FT推論はベースモデル寿命と別管理という記述は維持。
- **確認不能・未検証:** Google蒸留ページ取得失敗、全FT手法のGA/全クラウドモデル対応や学習品質は未検証。

[一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/deprecations) / [一次資料2（docs.cloud.google.com）](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/tuning/supervised-tuning) / [一次資料3（docs.cloud.google.com）](https://docs.cloud.google.com/gemini-enterprise-agent-platform/release-notes) / [一次資料4（ai.google.dev）](https://ai.google.dev/gemini-api/docs/changelog)

### 検証範囲: ベンチマーク

agent-benchmarks-landscapeと研究メモ、評価関連記事への波及

確認した差分: B01。Terminal-Bench4.0とWebArena-Verifiedの版/評価方式を確認。

- **変更なし:** BFCL V4、HAL更新停止、GAIA2公式dataset800シナリオ/10universesとself-published leaderboardの扱いを確認。
- **確認不能・未検証:** SWE-bench Pro/OSWorld2.0/GAIA2等の全スコアは収集していない。AndroidWorld等を実行していない。ランキング順位/飽和率の確定更新は別途必要。

[一次資料1（www.tbench.ai）](https://www.tbench.ai/) / [一次資料2（github.com）](https://github.com/ServiceNow/webarena-verified/blob/main/README.md) / [一次資料3（gorilla.cs.berkeley.edu）](https://gorilla.cs.berkeley.edu/leaderboard.html) / [一次資料4（hal.cs.princeton.edu）](https://hal.cs.princeton.edu/) / [一次資料5（huggingface.co）](https://huggingface.co/datasets/meta-agents-research-environments/gaia2/blob/main/README.md)

### 検証範囲: 画像・動画生成API + リアルタイム / TTS

12-multimodal、computer-use、generation/realtime-tts調査メモ

確認した差分: A01/A02/A04/A05/A06。Sora/Nova終了、Omni GA、agentic video、Claude toolsets、Eleven v3 endpointを確認。

- **変更なし:** Gemini Developer API LiveのPreview、Live3.1/2.5のthinking方式の差を確認。
- **確認不能・未検証:** ElevenLabs全changelogはサイズ超過。全音声ベンダーの料金/日本語品質、Azure/GCP/AWSの全voice/model、日本語発音辞書の網羅照合は未実施。Deepgram changelog入口のみで全更新の影響は未精査。

[一次資料1（developers.openai.com）](https://developers.openai.com/api/docs/deprecations) / [一次資料2（docs.aws.amazon.com）](https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle.html) / [一次資料3（ai.google.dev）](https://ai.google.dev/gemini-api/docs/changelog) / [一次資料4（ai.google.dev）](https://ai.google.dev/gemini-api/docs/live-api/capabilities) / [一次資料5（elevenlabs.io）](https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/tts-vs-ttd-websockets)

### 検証範囲: 来歴・フロンティア安全・なりすまし・著作権

- **変更なし / C2PA仕様版:** 公式GitHubの現行公開仕様リンクは2.4で、対応する公式仕様ページを取得した。既存researchの2.4は維持できる。ISO段階は別論点としてTS-02で要更新。 [一次資料1（github.com）](https://github.com/c2pa-org/specifications) / [一次資料2（spec.c2pa.org）](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html)
- **要更新 / ISO・RSP・Preparedness・Japan AISI・なりすまし・Claude来歴機能:** TS-02〜TS-05 / TS-07 / GOV09。公式一次資料により版の訂正、以前の取得不能の解消、2026-07〜09の新資料を確認。記事のベンダー中立な基本構造は維持しつつ参照と限定条件を更新する。 [一次資料1（www.iso.org）](https://www.iso.org/standard/90726.html) / [一次資料2（www.anthropic.com）](https://www.anthropic.com/responsible-scaling-policy) / [一次資料3（openai.com）](https://openai.com/index/openai-frontier-governance-framework/) / [一次資料4（aisi.go.jp）](https://aisi.go.jp/output/output_information/260707/) / [一次資料5（www.ic3.gov）](https://www.ic3.gov/PSA/2026/PSA260720) / [一次資料6（platform.claude.com）](https://platform.claude.com/docs/en/release-notes/overview)
- **変更なし / Google DeepMind Frontier Safety Framework:** 公式frontier-safety入口と更新記事はFSF3.1（2026-04-17）を示し、既存researchの版とTCL導入の説明に差分なし。すべてのモデル別評価結果を検証したものではない。 [一次資料1（deepmind.google）](https://deepmind.google/frontier-safety/) / [一次資料2（deepmind.google）](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/)
- **変更なし / 米英評価機関の改称と外部評価:** NIST公式はCAISI、英国公式はAI Security Instituteを用い、既存記述と一致。CAISIの公式hubは2026-07-23 Kimi K3、2026-07-17 GLM5.2の評価も掲載。これらを認証取得と呼ばない。 [一次資料1（www.nist.gov）](https://www.nist.gov/caisi) / [一次資料2（www.aisi.gov.uk）](https://www.aisi.gov.uk/about)
- **要更新 / 日本のAIプリンシプル・コード:** TS-01。正式コードと様式の公開、2026-10-26申出開始予定を公式専用ページで確認。専用ページはWebツール失敗後にInvoke-WebRequestで取得。正式公開日、PDF全条項の解釈は未確認。 [一次資料1（www.cas.go.jp）](https://www.cas.go.jp/jp/seisakukaigi/titeki2/ai_principle_code/index.html)
- **変更なし / USCO Copyright and AI報告書:** USCO公式AIページはPart3を2025-05-09公開のPre-Publication Versionとして継続掲載し、正式版は将来公開という説明が残る。Part1は2024-07-31、Part2は2025-01-29。Part3正式版が出たとはしない。 [一次資料1（www.copyright.gov）](https://www.copyright.gov/ai/)
- **変更なし / 文化庁のAIと著作権資料:** 文化庁公式は『AIと著作権に関する考え方』2024-03-15、『チェックリスト＆ガイダンス』2024-07-31を掲載し、既存researchの参照版と一致。個別訴訟や全法解釈が変わらないという意味ではない。 [一次資料1（www.bunka.go.jp）](https://www.bunka.go.jp/seisaku/chosakuken/aiandcopyright.html)
- **確認不能 / JPOのAI関連発明事例:** 公式検索結果から英語のAI関連発明事例ページ更新2026-05-25、研修教材2026-02-25を確認したが、日本語入口の直接取得はInternalErrorで本文差分は未精査。改訂された法解釈があるとは結論しない。 [一次資料1（www.jpo.go.jp）](https://www.jpo.go.jp/system/patent/gaiyo/sesaku/ai/index.html) / [一次資料2（www.jpo.go.jp）](https://www.jpo.go.jp/e/system/laws/rule/guideline/patent/ai_jirei_e.html) / [一次資料3（www.jpo.go.jp）](https://www.jpo.go.jp/e/news/kokusai/developing/training/e-learning/study_2026-01.html)
- **確認不能 / FTCなりすまし規則の個人への拡張:** FY2026予算資料や2026-08-14規制agendaの検索結果を得たが、個人への拡張に関する最終規則本文・発効日を一次確認できなかった。既存のSNPRM段階という説明を無条件に変更なしとは分類しない。 [一次資料1（www.govinfo.gov）](https://www.govinfo.gov/content/pkg/FR-2026-08-14/pdf/2026-16617.pdf)
- **確認不能 / NIST AI100-4全文、C2PA全実装・各権利訴訟:** NIST AI100-4の改版有無と全本文、各生成サービスの全対応媒体、個別著作権訴訟・和解・補償条項はこの担当の一次比較を完了していない。抽出した主要監視項目の検証をもってこれらの現在性まで保証しない。

### 検証範囲: 輸出規制・越境データ・環境

- **要更新 / BIS・EU dual-use・DPDP・CAC・十分性認定:** EG-01〜EG-05、EG-12。主に公式入口のままになった研究メモの更新と取得不能TODOの解消。UAE発効日やCSRD等の法務判断に必要な未確認境界は各findingに明記した。 [一次資料1（www.bis.gov）](https://www.bis.gov/news-updates) / [一次資料2（media.bis.gov）](https://media.bis.gov/media/documents/bis-guidance-may-31-2026.pdf) / [一次資料3（policy.trade.ec.europa.eu）](https://policy.trade.ec.europa.eu/help-exporters-and-importers/exporting-dual-use-items_en) / [一次資料4（www.meity.gov.in）](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) / [一次資料5（www.cac.gov.cn）](https://www.cac.gov.cn/wxzw/sjzl/sjcjaqpg/A09370801index_1.htm) / [一次資料6（commission.europa.eu）](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en)
- **変更なし / OFACとCSLの入口:** OFAC Sanctions List Serviceと米商務省Consolidated Screening Listの公式入口を取得し、既存の確認先は有効。個別entityの追加削除・全リストの現時点照合を実施したという意味ではない。 [一次資料1（ofac.treasury.gov）](https://ofac.treasury.gov/sanctions-list-service) / [一次資料2（www.trade.gov）](https://www.trade.gov/consolidated-screening-list)
- **確認不能 / BIS Entity List・METI外国ユーザーリスト最新版:** BIS Entity List本文およびMETI外国ユーザーリストの現行PDF取得に失敗。METI検索で2026-04-24更新の関連QAを得たが、最新リストの版・内容の根拠には採用していない。 [一次資料1（www.bis.gov）](https://www.bis.gov/entity-list) / [一次資料2（www.meti.go.jp）](https://www.meti.go.jp/policy/anpo/law_document/tutatu/t04shinsei/t04shinsei_ulkohyo.pdf)
- **確認不能 / 2026-08末の米国remote-access AI chip規制報道:** The Information等の二次報道のみを検索で確認し、規則本文・公布・施行を一次確認できなかった。BIS5月guidanceと同一の新規則として扱わず、施行済みという本文追記は推奨しない。
- **要更新 / AWS・SCI for AI・CSRD・EED・IEA・環境報告:** EG-06〜EG-11。AWS後継GAとSCI for AI批准は旧TODOを具体的に解消できる。CSRDは最終承認を確認したが各国適用日は未確認。EED格付けは現公式ページにpreparingと記載する範囲までで、予定経過から採択を推測していない。 [一次資料1（aws.amazon.com）](https://aws.amazon.com/sustainability/tools/console/) / [一次資料2（greensoftware.foundation）](https://greensoftware.foundation/standards/sci-ai/) / [一次資料3（www.consilium.europa.eu）](https://www.consilium.europa.eu/en/press/press-releases/2026/02/24/council-signs-off-simplification-of-sustainability-reporting-and-due-diligence-requirements-to-boost-eu-competitiveness/) / [一次資料4（energy.ec.europa.eu）](https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficiency-targets-directive-and-rules/energy-efficiency-directive/energy-performance-data-centres_en) / [一次資料5（www.iea.org）](https://www.iea.org/reports/key-questions-on-energy-and-ai)
- **変更なし / Meta環境報告の掲載版:** Meta公式は2025 Sustainability Report（公開2025-09-12）を掲載しており、その入口は有効。別経路にも2026報告が存在しないという結論ではない。 [一次資料1（sustainability.atmeta.com）](https://sustainability.atmeta.com/)
- **確認不能 / OpenAI/Anthropicの包括的環境報告・旧CCFT停止・ベンダー比較値:** OpenAI/Anthropicの包括的環境報告は一次資料を特定できず、非開示と断定しない。AWS旧CCFT画面が実際に停止したかは未操作。各ベンダーの環境報告は存在・年度を確認したが、全測定境界・保証・数値整合は未比較。 [一次資料1（docs.aws.amazon.com）](https://docs.aws.amazon.com/ccft/latest/releasenotes/what-is-ccftrn.html)

### 検証範囲: フィジカルAI・世界モデル

- **要更新 / Helix・Gemini Robotics・GR00T・LIBERO・DreamZero・PI顧客事例:** PH-01〜PH-06。Helixの世代と階層、VLAベンチマーク不存在の断定は訂正必要。モデル世代や提供段階、WAMとの重なり、介入込み実運用は補足推奨。 [一次資料1（www.figure.ai）](https://www.figure.ai/news/helix-02) / [一次資料2（deepmind.google）](https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/) / [一次資料3（github.com）](https://github.com/NVIDIA/Isaac-GR00T) / [一次資料4（github.com）](https://github.com/Lifelong-Robot-Learning/LIBERO) / [一次資料5（arxiv.org）](https://arxiv.org/abs/2602.15922) / [一次資料6（www.pi.website）](https://www.pi.website/blog/partner)
- **変更なし / openpiの公開チェックポイント:** 公式READMEはπ0/π0-FAST/π0.5と関連checkpointを公開しており、公開重みを限定して紹介する既存整理を維持できる。π0.7の重みが会社全体のどの経路にも非公開という結論ではない。 [一次資料1（raw.githubusercontent.com）](https://raw.githubusercontent.com/Physical-Intelligence/openpi/main/README.md)
- **変更なし / Cosmos3の公開docsとモデル構成:** 公式docsはCosmos3、Reasoner+Generator構成、language/image/video/audio/action sequenceを扱うモデルと公開artifactを掲載（docs更新2026-08-18）。researchは既にCosmos3を収録しており、世代名の訂正は不要。全API互換や全ライセンス条項は検証していない。 [一次資料1（docs.nvidia.com）](https://docs.nvidia.com/cosmos/latest/cosmos3/index.html)
- **参考・監視 / Figure Index:** 2026-08-25公式発表のIndexはphysical AI向けデータ基盤の参考事例。既存本文の訂正根拠としては採用せず、今後の監視資料として記録する。数値やデータの一般公開を確認したとはしない。 [一次資料1（www.figure.ai）](https://www.figure.ai/news/introducing-index)
- **確認不能 / GR00T N2一般提供・π0.7公開重み・Helix外販・Genie最新版・実機出荷数:** N2は公式previewと年末予定までを確認。π0.7の一般公開重み、Helixの外部提供条件、Genieの最新世代比較、Tesla/1X/Agility等の出荷実績はこの担当で最新一次情報の検証を完了していない。予定やデモを出荷・GA・汎用能力の証明へ読み替えない。 [一次資料1（nvidianews.nvidia.com）](https://nvidianews.nvidia.com/news/nvidia-expands-open-model-families-to-power-the-next-wave-of-agentic-physical-and-healthcare-ai) / [一次資料2（raw.githubusercontent.com）](https://raw.githubusercontent.com/Physical-Intelligence/openpi/main/README.md)

### 検証範囲: コーディングエージェント

docs/08-coding-agents/およびresearch/coding-agents/の製品、規約、権限、提供面に関する主要監視項目を一次資料と照合。全記事の全事実や全設定の実挙動を検証したものではありません。

確認した差分: T01–T15、T19–T23、T26–T28。データ利用・保持の例外、無人実行の既定値、キャッシュ条件、自社実行基盤、Copilotの提供範囲、Codexの権限と委任条件、モデル提供・料金条件、各製品の追加機能を確認しました。

- **変更なし:** GitHub Sparkの2026-08-31終了（既存deploy継続）およびGitHub Modelsの2026-07-30終了は既に反映済みです。Claude Codeのauto既定に関するPro / Max / TeamとEnterprise / APIの区別、webのresearch preview、Cascadeが2つのlocal agentsの一方である説明を維持できます。Devin Fusionはpreviewであり、2026-08-07発表の最大60%という効果は条件付きの自己報告として扱います。Devin / Cursorのplan構成、JulesのPublic Betaおよびprivate repositoryを学習に使わない条件は維持できます。Aiderは0.86.0（2025-08-09）、ContinueはREADMEで非積極保守・read-only・finalの方針を示しますが、GitHubのarchivedフラグはfalseです。OpenHands / Goose / opencodeは公式releasesの継続を確認しました。活動の継続は安全性の保証ではありません。
- **確認不能・未検証:** Fusionのplan別GA、Code Assist GitHub reviewのconsumer終了日とEnterprise GA、Copilot cloud agentのcontent exclusion、Julesの企業向けGA、Goose / opencode等のすべての権限既定は未確認です。サービス全提供面の実行や全記事の全行検証は実施していません。

[一次資料1（github.blog）](https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com/) / [一次資料2（code.claude.com）](https://code.claude.com/docs/en/permission-modes) / [一次資料3（code.claude.com）](https://code.claude.com/docs/en/claude-code-on-the-web) / [一次資料4（docs.devin.ai）](https://docs.devin.ai/desktop/cascade/cascade) / [一次資料5（cognition.com）](https://cognition.com/blog/devin-fusion) / [一次資料6（devin.ai）](https://devin.ai/pricing) / [一次資料7（cursor.com）](https://cursor.com/pricing) / [一次資料8（jules.google）](https://jules.google/docs/faq/) / [一次資料9（github.com）](https://github.com/Aider-AI/aider) / [一次資料10（github.com）](https://github.com/continuedev/continue) / [一次資料11（github.com）](https://github.com/OpenHands/OpenHands) / [一次資料12（github.com）](https://github.com/block/goose) / [一次資料13（github.com）](https://github.com/anomalyco/opencode)

### 検証範囲: サービング・ゲートウェイ・ローカル推論

self-hosted-inference、llm-gateway、local-and-on-device-llmとresearch/llmops/serving.mdについて、提供形態、ライセンス、API互換の主要条件を一次資料と照合。

確認した差分: T16–T18。Kong AI Gateway 2.0の独立製品化、TensorRT-LLM配下のライセンス例外、LM Studioの有料機能を含む現行App Termsを確認しました。versionが新しいだけで必須更新とはしていません。

- **変更なし:** TGIの2026-03-21 archive / read-onlyは既に反映されています。Ollama Responsesは0.13.3以降でstatelessのみであり、previous_response_id、conversation、tool_choice、logprobsは非対応です。公式リポジトリの主ライセンスはvLLM / SGLang / LMDeployがApache 2.0、TritonがBSD 3-Clause、Ollama / llama.cpp / mlx-lm / PortkeyがMIT、LiteLLMがMITとenterprise別LICENSEという整理を維持できます。LM Studioのpersonal / internal business許諾と再配布・SaaS制限の骨格は維持できますが、料金条件はT18で分けます。
- **確認不能・未検証:** 無印Kong AI ProxyのFree / OSS利用範囲の明示、全endpoint / backendの実互換、TensorRT-LLMのライセンス例外が導入された日は未確認です。各プロジェクトの全依存物・重みのライセンスや実際の推論性能を保証する検証ではありません。

[一次資料1（github.com）](https://github.com/huggingface/text-generation-inference) / [一次資料2（docs.ollama.com）](https://docs.ollama.com/api/openai-compatibility.md) / [一次資料3（github.com）](https://github.com/vllm-project/vllm) / [一次資料4（github.com）](https://github.com/sgl-project/sglang) / [一次資料5（github.com）](https://github.com/InternLM/lmdeploy) / [一次資料6（github.com）](https://github.com/triton-inference-server/server) / [一次資料7（github.com）](https://github.com/ollama/ollama) / [一次資料8（github.com）](https://github.com/ggml-org/llama.cpp) / [一次資料9（github.com）](https://github.com/ml-explore/mlx-lm) / [一次資料10（github.com）](https://github.com/Portkey-AI/gateway) / [一次資料11（github.com）](https://github.com/BerriAI/litellm) / [一次資料12（lmstudio.ai）](https://lmstudio.ai/app-terms)

### 検証範囲: AI業界マップ・OSSエコシステム・フレームワーク選定

docs/09-business/ai-industry-map.md、docs/03-implementation/open-source-ai-ecosystem.md、framework-selection.md、llm-landscape.md、research/ecosystem/industry-oss.mdの主要な提供形態・ライセンス・後継フレームワークの監視項目を一次資料と照合。

確認した差分: T24–T25。Gemma 4に適用するApache 2.0と旧世代の規約の区別、Microsoft Agent Framework 1.0のproduction-readyという提供段階を確認しました。

- **変更なし:** OSAID 1.0の4つの自由と必要情報、Hugging Faceのサービス規約・content policyと個別モデルライセンスの2層、AutoGenのmaintenanceおよび後継推奨の整理を維持できます。一般原則の構造を覆す差分は確認していませんが、これは各記事の全行の現在性を検証したという意味ではありません。
- **確認不能・未検証:** Llama 4の現行条文における700M MAU条件は2026年8月のメモに依拠しており、今回の変更なし確認には含めません。すべての買収・統合に関する市場調査は対象外です。

[一次資料1（opensource.org）](https://opensource.org/ai/open-source-ai-definition) / [一次資料2（huggingface.co）](https://huggingface.co/terms-of-service) / [一次資料3（huggingface.co）](https://huggingface.co/content-policy) / [一次資料4（github.com）](https://github.com/microsoft/autogen) / [一次資料5（ai.google.dev）](https://ai.google.dev/gemma/terms) / [一次資料6（ai.google.dev）](https://ai.google.dev/gemma/apache_2) / [一次資料7（devblogs.microsoft.com）](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/)

### 検証範囲: 一般規制

compliance-and-governance.md と research/professional/compliance.md。GOV03–GOV07 の確認結果。

確認した差分: APPI 改正の成立・公布、米国州法の適用主体・規則案、FTC の提案段階、EU 規則本文を確認しました。GOV03–GOV07 は主台帳に収録済みです。

- **変更なし:** EU 高リスク義務の 2027-12-02 / 2028-08-02、透明性義務の 2026-08-02 と 7/20 ガイド、AI 事業者ガイドライン 1.2（3/31）、PPC のプロンプトへの個人データ入力に関する注意の整理は維持できます。
- **確認不能・未検証:** NTIA / 商務省の EO14365 に基づく州法評価の完成リスト、APPI 全面施行の政令、Colorado の xAI 訴訟最終判決は未確認です。HB26-1263 の署名日は公式資料間で相違があり断定しません。

[一次資料1（eur-lex.europa.eu）](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1744) / [一次資料2（digital-strategy.ec.europa.eu）](https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems) / [一次資料3（www.meti.go.jp）](https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/pdf/20260331_1.pdf) / [一次資料4（www.ppc.go.jp）](https://www.ppc.go.jp/news/careful_information/230602_AI_utilize_alert/)

### 検証範囲: 業界規制

industry-regulations-map.md、research/supplementary/regulations.md、hr-and-recruitment-ai.md。GOV01 / GOV02 / GOV03 / GOV13 の確認結果。

確認した差分: FISC 第 14 版、FDUA 1.2、APPI 改正、FDA ガイダンスの出版状態を確認しました。該当 GOV 指摘は主台帳に収録済みです。

- **変更なし:** 厚労省の医療情報システム安全管理ガイドライン 7.0 は 2026 年 6 月の案内と 5 PDF で確認しました。金融庁 AI DP 1.1（3/3）、DS920 2.0（6/12）、FDA TPLC 2025-01-07 の Draft 状態は維持できます。HR 関連の PPC / EEOC / NYC 等の公的参照先も内容と役割を確認しました。
- **確認不能・未検証:** 厚労省 7.0 の AI 固有記述は未精査であり、AI の文字列検索で不一致だったことだけで記述がないとは断定しません。7 月予定の Q&A 実体、取得できなかった経産省医療提供事業者ガイドライン、HAIP / JaDHA の後継版の有無、FISC 第 14 版の有償全文の条項差分は未確認です。

[一次資料1（www.mhlw.go.jp）](https://www.mhlw.go.jp/stf/shingi/0000516275_00006.html) / [一次資料2（www.fsa.go.jp）](https://www.fsa.go.jp/news/r7/sonota/20260303/aidp.html) / [一次資料3（www.digital.go.jp）](https://www.digital.go.jp/en/news/decb64eb-f26e-41cb-8d37-f3dd173108b8) / [一次資料4（www.fda.gov）](https://www.fda.gov/medical-devices/digital-health-center-excellence/guidances-digital-health-content) / [一次資料5（www.ppc.go.jp）](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/) / [一次資料6（www.eeoc.gov）](https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada) / [一次資料7（home4.nyc.gov）](https://home4.nyc.gov/site/dca/about/automated-employment-decision-tools.page)

### 検証範囲: AI規格・認証

AI 規格・認証の記事と research/ecosystem/standards.md。GOV08–GOV12 の確認結果。

確認した差分: EN 18286:2026、AISI ガイド 1.20、NIST の公開文書 Zero Draft、AIMS 認定・認証の役割、ISO 規格書誌を確認しました。GOV08–GOV12 は主台帳に収録済みです。

- **変更なし:** ISO 42001:2023 / 42005:2025 / 42006:2025 の書誌と scope を確認しました。NIST AI RMF 1.0 は改訂作業中であり、2.0 が発行済みとはしません。ISMS-AC の認定、2 つの認証機関、各組織の AIMS 認証という構造は維持できます。
- **確認不能・未検証:** 有償 ISO / JIS の逐条比較、EN 18286 の官報（OJ）引用完了、NIST 重要インフラ Profile の Final は未確認です。規格の発行、EC 評価、OJ 引用を区別し、Profile は Concept Note の確認までとします。

[一次資料1（www.iso.org）](https://www.iso.org/standard/42001) / [一次資料2（www.iso.org）](https://www.iso.org/standard/42005) / [一次資料3（www.iso.org）](https://www.iso.org/standard/42006) / [一次資料4（www.nist.gov）](https://www.nist.gov/itl/ai-risk-management-framework) / [一次資料5（isms.jp）](https://isms.jp/aims/lst/isr/index.html)

### 検証範囲: RPA・自動化

docs/13-domain-agents/rpa-and-agents.md と research/domain-agents/rpa.md。RPA01–RPA06 の確認結果。

確認した差分: WorkHQ / Agentic Workflows、WinActor、UiPath Maestro、Copilot Studio computer use と harness、Automation Anywhere の提供状態と期限を確認しました。主な更新対象は research の製品情報です。

- **変更なし:** Maestro の RPA / Agent / 人の統合、Power Automate から agent flow への不可逆変換と課金変更、Microsoft の本番 BYO / hosted prototype 指針は維持できます。監督機能を必ず停止する安全装置とみなさない説明、Automation Anywhere を既存 RPA / BPM に接続して全面置換を避ける方針も維持できます。
- **確認不能・未検証:** Microsoft computer use の全商用リージョン展開完了、UiPath 全構成の air gap、WinActor 7.7 の発売日と 10 月以降の上限・価格、Automation Anywhere の Q3 GA 予定の完了、ISO / FedRAMP / AIUC 認証の個別 scope の第三者照合は未確認です。

[一次資料1（documentation.blueprism.com）](https://documentation.blueprism.com/workhq/en-us/announcements/announcements.htm) / [一次資料2（docs.uipath.com）](https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/overview) / [一次資料3（learn.microsoft.com）](https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-overview) / [一次資料4（learn.microsoft.com）](https://learn.microsoft.com/en-us/microsoft-copilot-studio/faqs-computer-use) / [一次資料5（www.automationanywhere.com）](https://www.automationanywhere.com/products/agentic-process-automation-system)

### 検証範囲: 先端応用

docs/13-domain-agents/emerging-agent-domains.md と research/domain-agents/emerging.md。EM01–EM08 の確認結果。

確認した差分: 科学 Agent の出版状態と A-Lab 訂正、個人シミュレーション論文の版と評価、PUBG Ally の期間限定ベータ、ChatGPT commerce の方針、カード実取引 pilot、AP2 v0.2 を確認しました。 書誌の補足観測として、Project Sidの初回公開日2024-10-31も確認しました（メモの11月表記は出典整理時に精密化できます）。

- **変更なし:** docs 68 行目の AP2 の決定的検証は現仕様の MUST と対応しています。FIDO への寄贈は 4/28 の本文で確認しました。Sakana AI Scientist-v2 の 3 論文中 1 件が workshop 受理水準という結果は著者報告であり、システム論文の査読採録とは区別します。Project Sid（2411.00114）は Minecraft / PIANO の 10–1,000+ Agent のデモで、研究デモという位置づけは維持できます。Virtual Agent Economies（2509.10147）は 2025-09-12 v1 の概念論文です。
- **確認不能・未検証:** 科学 Agent の独立追試・臨床効果、Virtual Lab の 92 個 / 2 個等の全実験詳細、NPC の恒常提供と inZOI / NARAKA の全条件、x402 の Base 1.19 億 / Solana 3,500 万 / 年換算 6 億ドルという計数範囲の裏付け、カード決済の全地域 GA と継続取引量、1,000 人論文の査読誌掲載は未確認です。暗号 AI 市場の時価総額・下落は古い二次情報の snapshot であり、実利用の根拠にはできません。

[一次資料1（ap2-protocol.org）](https://ap2-protocol.org/ap2/specification/) / [一次資料2（blog.google）](https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/) / [一次資料3（arxiv.org）](https://arxiv.org/abs/2504.08066) / [一次資料4（sakana.ai）](https://sakana.ai/ai-scientist-first-publication/) / [一次資料5（arxiv.org）](https://arxiv.org/abs/2411.00114) / [一次資料6（arxiv.org）](https://arxiv.org/abs/2509.10147)

## 反映する場合の作業単位

記事は1回の変更で1〜3本を目安にまとめ、同じ事実を載せる比較表・research・TODOを同期します。P1の訂正を先行し、新機能の紹介や依存移行を後続に分けると検証範囲を保てます。

| 順序 | 作業単位 | 対象と受け入れ条件 |
| --- | --- | --- |
| 1 | 終了期限と契約・ライセンス | A01/A02/FT02、M07/M09/M10/T24、T01/T02/T03。動画・FT、モデル一覧、各製品記事の順で小分けに訂正。期限・ID・地域・tier・例外を原文に照合 |
| 2 | 法令・業界基準 | GOV01–13。compliance、industry-regulations、standardsを分割。成立・公布・施行、draft/final、発行・認定・官報引用を区別。有償本文や未確定政令はTODO維持 |
| 3 | ベンダー別プロンプト | M01–06/M08/M11。OpenAI/Claude/Geminiを各記事単位で更新し、cross-modelとcost-managementへ同期。旧モデルの有効設定を削除しない |
| 4 | コーディングエージェント | T04–15/T19–23/T26–28。製品・実践・比較を組にして提供面とGA/beta、権限・認証・保持条件を揃える |
| 5 | 認証・接続仕様とサンプル | AU01–04/D01/D02。MCP1系継続と2系移行を選び、SDK更新時はstdio/HTTP/OAuth、timeout/permission、mock transportの回帰を実施 |
| 6 | 音声・マルチモーダル | A03–06/FT01。voice、speech、realtime/video、computer-useを分割。モデル×API×機能の対応と移行先を明示。実呼出し未検証を区別 |
| 7 | ベンチマーク・研究事例 | B01/EM01–08。現行版・公開/査読/訂正・評価条件を更新。ランキング値を取れない場合は数値を断定しない |
| 8 | フィジカルAI・安全・著作権 | PH/TS/GOV09。physical/world-model、provenance/frontier/deepfake、copyrightを分割。demo/pilot/GA/出荷、来歴経路、評価締切を分ける |
| 9 | 輸出・越境・環境 | EG01–12。geopolitics/green-aiとresearch。原文未取得の発効日、リスト内容、企業比較指標は追跡課題として残す |
| 10 | RPA・サービング・エコシステム | RPA01–06/T16–18/T25。researchの旧例と内部矛盾を先に更新。全構成の閉域実行や全製品ライセンスを一括保証しない |
| 11 | CI・Web依存 | D03/D04。変更履歴と互換性を確認してからSHA/lockを更新。CI全体・静的ビルド・主要ブラウザー導線を検証。最新版への追従自体は障害修正ではない |

本文の事実・推奨・コードを実質変更した記事だけlast_updatedを更新します。既存のpublishedを機械的に変更せず、ROADMAPのタスク完了は実際の更新と検証を終えてから記録します。TODOの確認月だけを一括で進める処理は行いません。

記事更新後はテンプレート検証、相対リンク、TODO書式・同期を確認します。Python依存を変えるときはサンプル6件と回帰テストを実行し、実行した範囲に限ってREADMEの動作確認日を更新します。

## 再開用データと成果物の境界

- [機械可読台帳](research/freshness-audit-data-2026-09-10.json): 全199記事のリスク走査、全指摘、一次資料、確認不能の境界を保持します。
- このレポートと台帳は同じ調査スナップショットです。指摘の重複は統合し、AISIのTS-06はGOV09へまとめました。
- [前回メンテナンス記録](research/review-maintenance-2026-09-10.md)と今回の監査を混同せず、更新実施時に対応IDの完了証拠を残してください。
