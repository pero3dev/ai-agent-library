# ROADMAP — 現在の作業と定期メンテナンス

記事の公開状態は各記事のfront matter、タスク単位の状態は対応する表が正本です。初版と記事拡張の完了フェーズは[執筆履歴](project/plans/content/roadmap-history.md)へ分離しました。

## 作業に応じた入口

- 記事の新設・通常改訂: [AGENTS](AGENTS.md)、[執筆規約](harness/writing-rules.md)、[執筆履歴のタスク表](project/plans/content/roadmap-history.md#フェーズ別タスク分割作業依頼単位)
- 定期最新化・定点観測: 下記の台帳と[運用手順](freshness-automation.md)
- サイト・ハーネス・レビュー対応: [計画と実施記録](project/README.md)

## 執筆の原則

新規記事は1作業単位につき原則1〜3本です。既存記事の編集と索引等の同期は別に数え、大きな依頼は単位を順に完了します。既存フェーズを指定するときは履歴のタスクIDと全成果物を確認し、公開済み改訂も最終内容を独立レビューします。セクションREADME・用語集・公開状態・タスク状態の同期を執筆の完了条件に含めます。

199本・16章の初版/拡張は完了しています。2026-10-03のGLOSSARY見出しは165語です。本文の定期最新化、週次観測、レビュー対応、サイトとサンプルの保守は継続します。

## 作業依頼テンプレート

```text
ROADMAPと執筆履歴のタスクX-Yを確認して実施してください。
AGENTS.md、harness/writing-rules.mdとtemplates/doc-template.mdに従い、
記事・対応タスク・セクションREADME・用語集を同期してください。
```

## 定期メンテナンス(フェーズ完了後も継続)

全系統の実施計画と進捗は [2026q3.md](project/plans/maintenance/2026q3.md) を参照してください。2026-09-10 に全 16 系統を一次資料で観測し、[鮮度監査](project/records/2026-09-10/freshness-audit.md)の 107 件を本文・調査メモ・依存設定へ反映しました。対応範囲、確認時に補正した日付・条件、検証結果は[更新記録](project/records/2026-09-10/freshness-update.md)で追跡します。全 199 記事のすべての主張や、実 API・実機動作を再検証したという意味ではありません。

四半期の一巡に加え、定期実行では下表の目標周期で巡回します。以下の終了予定・制度適用日は四半期を待たずに確認します。`TODO(要確認)` は残す理由と確認先を追跡し、本文の更新日だけで最終確認月を進めません。

### 定期実行の対象台帳

以下の表が定点観測の系統 ID・対象記事・調査起点・目標周期の正本です。対象はリポジトリ相対パスで、`;` は複数指定、`*` は同じディレクトリ内の一致を表します。`README.md` は記事数に含めません。複数の系統に関係する記事は重複して所属できます。実装・基礎・ケーススタディも含めた全学習記事の所属を `node scripts/freshness-registry.mjs` で検証します。

1 回の実行では 1〜3 系統を選び、モデル・コーディングを毎週、残る系統を古い観測から順に巡回します。周期は観測の目標であり、公開日・記事の更新日ではありません。系統を選んだだけで全記事の再検証を完了した扱いにはせず、実際に確認した記事・主張・一次情報と未確認範囲を各実行の記録に残します。`last_verified_at` は観測の完了記録から更新し、front matter の `last_updated` で代用しません。

<!-- freshness-registry:start -->

| ID | 系統 | 記事対象 | 調査起点 | 周期(日) |
| --- | --- | --- | --- | --- |
| `coding-agents` | コーディングエージェント | `docs/08-coding-agents/*.md` | `research/coding-agents/*.md`; `research/se/enterprise-offerings.md` | 7 |
| `models-prompting` | モデル・プロンプティング・基礎理論 | `docs/00-overview/*.md`; `docs/01-concepts/*.md`; `docs/10-llm-foundations/*.md`; `docs/11-llm-internals/*.md`; `docs/03-implementation/*prompt*.md`; `docs/03-implementation/llm-landscape.md`; `docs/03-implementation/model-selection.md`; `docs/03-implementation/structured-output.md` | `research/models/*.md`; `research/prompting/*.md`; `research/internals/interpretability.md`; `research/review-sources-foundations-2026-09-10.md` | 7 |
| `identity-protocols` | エージェント認証・連携プロトコル | `docs/06-security/agent-identity-and-auth.md`; `docs/03-implementation/agent-interop-protocols.md`; `docs/03-implementation/mcp-and-tool-protocols.md`; `docs/02-architecture/agent-api-design.md`; `docs/02-architecture/multi-tenancy-and-isolation.md` | `research/professional/agent-identity.md`; `research/infra/agent-protocols.md` | 42 |
| `compliance` | 規制動向・データ統治 | `docs/06-security/compliance-and-governance.md`; `docs/06-security/privacy-enhancing-technologies.md`; `docs/05-operations/data-governance-for-ai.md`; `docs/05-operations/conversation-data-management.md`; `docs/09-business/agent-liability-and-accountability.md`; `docs/09-business/ai-usage-policy.md` | `research/professional/compliance.md` | 42 |
| `voice-fine-tuning` | 音声 API・FT・学習データ | `docs/03-implementation/voice-agents.md`; `docs/03-implementation/fine-tuning-and-distillation.md`; `docs/03-implementation/data-preprocessing-for-llm.md`; `docs/03-implementation/synthetic-data-for-training.md`; `docs/09-business/own-model-strategy.md` | `research/professional/voice-agents.md`; `research/professional/fine-tuning.md` | 42 |
| `benchmarks` | ベンチマーク・評価・人による検証 | `docs/04-evaluation/*.md`; `docs/15-human-ai/*.md` | `research/professional/benchmarks.md`; `research/review-sources-learning-2026-09-10.md` | 42 |
| `industry-regulations` | 業界規制 | `docs/09-business/industry-regulations-map.md`; `docs/13-domain-agents/legal-review-agents.md`; `docs/13-domain-agents/hr-and-recruitment-ai.md`; `docs/13-domain-agents/education-agents.md` | `research/supplementary/regulations.md` | 42 |
| `physical-ai` | フィジカル AI・世界モデル | `docs/01-concepts/physical-ai-overview.md`; `docs/01-concepts/world-models-overview.md` | `research/supplementary/physical-ai.md` | 42 |
| `serving-gateways` | サービング・運用・実行設計 | `docs/05-operations/*.md`; `docs/02-architecture/*.md`; `docs/03-implementation/local-and-on-device-llm.md`; `docs/03-implementation/slm-strategy.md`; `docs/03-implementation/code-execution-sandboxes.md` | `research/llmops/serving.md`; `research/professional/durable-execution.md` | 42 |
| `multimodal-generation` | マルチモーダル・生成 API・UX | `docs/12-multimodal/*.md`; `docs/14-ux-and-product/*.md`; `docs/01-concepts/computer-use-and-multimodal-agents.md`; `docs/03-implementation/computer-use-implementation.md`; `docs/03-implementation/streaming-and-agent-ux.md` | `research/multimodal/*.md`; `research/review-sources-applications-2026-09-10.md` | 42 |
| `trust-ip` | 来歴・安全性・知財 | `docs/06-security/*.md`; `docs/09-business/ai-copyright-and-ip-map.md` | `research/trust/*.md` | 42 |
| `rpa-automation` | RPA・業務自動化 | `docs/13-domain-agents/rpa-and-agents.md`; `docs/13-domain-agents/spreadsheet-agents.md`; `docs/07-case-studies/case-study-expense-agent.md` | `research/domain-agents/rpa.md` | 42 |
| `emerging-domains` | 先端応用・業務エージェント・事例 | `docs/13-domain-agents/*.md`; `docs/07-case-studies/*.md` | `research/domain-agents/emerging.md`; `research/review-sources-applications-2026-09-10.md` | 42 |
| `geopolitics-green-ai` | 輸出規制・環境開示 | `docs/09-business/ai-geopolitics-map.md`; `docs/05-operations/green-ai.md` | `research/strategy/*.md` | 42 |
| `industry-oss` | AI 業界・OSS・実装と事業採用 | `docs/09-business/*.md`; `docs/03-implementation/open-source-ai-ecosystem.md`; `docs/03-implementation/framework-selection.md`; `docs/03-implementation/embeddings.md`; `docs/03-implementation/graph-rag-and-knowledge-graphs.md`; `docs/03-implementation/long-term-memory-implementation.md`; `docs/03-implementation/loop-feedback-and-verification.md`; `docs/03-implementation/rag-implementation-patterns.md`; `docs/03-implementation/tool-definition-design.md`; `docs/03-implementation/vector-databases.md` | `research/ecosystem/industry-oss.md`; `research/review-sources-foundations-2026-09-10.md`; `research/review-sources-applications-2026-09-10.md` | 42 |
| `standards` | AI 規格・認証・情報の確認方法 | `docs/06-security/ai-standards-and-certification.md`; `docs/00-overview/research-literacy.md` | `research/ecosystem/standards.md` | 42 |

<!-- freshness-registry:end -->

### 公開観測の状況

部分観測と宣言範囲の完了を区別します。2026-10-08（日本時間）時点のコミット対象を集計しています。集計方法と停止検知は[freshness-automation](freshness-automation.md#公開観測の台帳)を参照してください。

<!-- freshness-observation-summary:start -->
| 系統 | 宣言範囲の最終完了日 | 最新の部分観測 | 次回目標 |
| --- | --- | --- | --- |
| `coding-agents` | 記録なし | 2026-10-08 | 未確定(完了範囲の記録が必要) |
| `models-prompting` | 記録なし | 2026-10-08 | 未確定(完了範囲の記録が必要) |
| `identity-protocols` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `compliance` | 記録なし | 2026-10-08 | 未確定(完了範囲の記録が必要) |
| `voice-fine-tuning` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `benchmarks` | 記録なし | 2026-09-28 | 未確定(完了範囲の記録が必要) |
| `industry-regulations` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `physical-ai` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `serving-gateways` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `multimodal-generation` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `trust-ip` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `rpa-automation` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `emerging-domains` | 記録なし | 2026-09-21 | 未確定(完了範囲の記録が必要) |
| `geopolitics-green-ai` | 記録なし | 2026-09-21 | 未確定(完了範囲の記録が必要) |
| `industry-oss` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
| `standards` | 記録なし | 記録なし | 未確定(完了範囲の記録が必要) |
<!-- freshness-observation-summary:end -->

### 次回確認する注目事項

<!-- freshness-watchlist:start -->

- `TODO(要確認)` の全文検索と棚卸し。9 月の[分類記録](research/review-maintenance-2026-09-10.md)を起点に、未観測・継続仕様確認・採用時確認・研究確認を区別する
- モデル・フレームワーク情報の鮮度確認。観測記録の `last_verified_at` が古い対象を優先し、front matter の `last_updated` は本文変更の補助情報として扱う
- **08-coding-agents のツール情報** — 起点: `research/coding-agents/`。次の確認: Copilot の 2026-10-19 モデル廃止と 2026-10-22 機能既定ポリシーの適用(10 月 2 日分は実施告知を再確認済み)、PR 承認・JetBrains sandbox の preview 後の扱い、Claude Code の runner と auto の提供条件、Codex の GPT-5.5 の 2026-10-14 の終了実施・延期(ChatGPT / Work / Codex、API は対象外)と認証方式別モデル・credits、Devin Fusion / SWE-1.7、Cursor の非 ZDR opt-in、Continue の既存ユーザー向けサポート保証(保守方針と非アーカイブ属性は部分再確認済み)
- **モデルガイド・モデル特化プロンプティング** — 起点: `research/models/`・`research/prompting/`。次の確認: Fable 5.1 の保持・思考履歴・beta 制御の提供経路別条件、GPT-6.1 Sol と従来 GPT-6 Astra / Sol / Luna の effort・API 制約と `configuration_update`、5.6 以降の TTL・書込課金、Gemini 3.8 の API 別思考制御、3.8 / 3.7 の導入価格の 2026-12-31 後、Gemini 2.5 の過去利用者限定と未定の終了日、GPT-5.4-Cyber の 2026-10-01 の実停止・延期(未確認)、o4-mini の 2026-10-23、`v1/prompts` の 2026-11-30、2026-12-11 の対象モデルの終了実施を期日後に確認。Qwen3.8・Kimi K3・Mistral Medium 3.5 の独自契約は配布物と事業条件ごとに再確認
- **エージェント認証・連携プロトコル** — 起点: `research/professional/agent-identity.md`・`research/infra/agent-protocols.md`。次の確認: OAuth 2.1 draft-16 以降と IESG 提出、identity-chaining の RFC 番号、MCP 2026-07-28 と Python SDK v2 の相互運用、AP2 v0.2 の Mandate と FIDO での改版、Google auth manager の機能別提供条件、Okta XAA の Resource Server への設定移行日
- **規制動向** — 起点: `research/professional/compliance.md`。次の確認: 令和 8 年法律第 56 号の主な施行政令、PPC 2026-10-01 の基本的な考え方②以後の課徴金等の議論と正式パブコメ・最終化、EU AI Act の個別整合規格の発行・官報引用、California の主体別適用(今回公式本文取得失敗)、FTC 政策声明案の最終化と商務省州法リスト(取得失敗)、Colorado の 2026-09-23 予定の実施・延期(未確認)と 2026-10-06 中間案以後の最終化・10 月 26 日期日後の受付/審理延長、DOJ 訴訟の裁判判断
- **音声 API・FT 提供状況** — 起点: `research/professional/voice-agents.md`・`fine-tuning.md`。次の確認: Bedrock Claude 3 Haiku の 2026-09-10 EOL と既存 custom deployment、Nova Sonic v1 / Premier の 2026-09-14 EOL、OpenAI FT の 2027-01-06 終了、旧 realtime 系の 2027-01-20 と文字起こし系の 2027-02-26 終了。Google 3 系 SFT の preview・地域・SLA と Developer API Live の機能別 GA を分離
- **エージェントベンチマーク** — 起点: `research/professional/benchmarks.md`。次の確認: Terminal-Bench 4.0 の版・effort 別結果・費用算定範囲と欠測条件、WebArena-Verified の課題と評価器、SWE-bench Pro・HAL・GAIA2・AndroidWorld・BFCL・安全性評価。取得していないランキング数値は記載しない
- **業界規制** — 起点: `research/supplementary/regulations.md`。次の確認: FISC 第 14 版と FDUA 第 1.2 版の個別適用、厚労省第 7.0 版・DS-920 第 2.0 版・金融庁 AI DP の次期改訂、改正個人情報保護法の施行規則
- **フィジカル AI** — 起点: `research/supplementary/physical-ai.md`。次の確認: π0.5 / π0.6、GR00T N1.7、Gemini Robotics ER の提供・移行、DreamZero の追試、LIBERO / Isaac Lab-Arena の再現条件、AISI Robotics Initiative。公開評価基盤の存在と、異なる身体構成の実機能力を横並びに比較できるかを分ける
- **サービング・ゲートウェイ OSS** — 起点: `research/llmops/serving.md`。次の確認: Kong AI Gateway 2.0 と従来の 3.x plugin の提供条件、AI Proxy の Free / OSS 範囲、TensorRT-LLM の構成物別ライセンス、LM Studio の App Terms と有料機能、TGI のアーカイブ後の代替、Ollama API 対応・GPT4All の保守状態
- **生成 AI・リアルタイム/TTS API** — 起点: `research/multimodal/generation.md`・`realtime-tts.md`。次の確認: Videos API / Sora 2 の 2026-09-24、Nova Canvas / Reel と旧 Gemini Omni preview の 2026-09-30 終了。新規採用は後継の適合評価を行う。能動的な動画読解の対象・課金、Eleven v3 の TTD WebSocket と単一音声 TTS の別経路、来歴・同意要件を確認
- **来歴・フロンティア安全・なりすまし・知財** — 起点: `research/trust/`。次の確認: ISO/CD 22144 の進捗、RSP と Risk Report の対象範囲・版、Preparedness / FSF、各国安全機関、知財プリンシプル・コードの 2026-10-26 届出開始、米著作権局 Part 3 最終版、公的な詐欺対策の更新
- **RPA/自動化ベンダーの Agent 統合** — 起点: `research/domain-agents/rpa.md`。次の確認: WorkHQ の公開条件と旧部品のサポート終了、UiPath のオンプレ / air-gapped 機能別制限、Copilot Studio computer use の地域別 GA、Automation Anywhere の提供境界、WinActor の 2026-10 以降の上限・価格
- **先端応用** — 起点: `research/domain-agents/emerging.md`。次の確認: Robin / AI co-scientist の独立追試、A-Lab 訂正後の評価、1,052 人研究 v3 の査読誌掲載、PUBG Ally ベータ後の継続提供、AP2 の実取引と Mandate 検証、MCP / A2A の AAIF と AP2 の FIDO における仕様統治
- **輸出規制・環境開示** — 起点: `research/strategy/geopolitics.md`・`green-ai.md`。次の確認: BIS の管理品目と個別輸出要件、EU Annex I の 2026-09-14 採択分の官報掲載・発効、CAC の越境データ経路、インド DPDP、AWS Sustainability の Marketplace 算定範囲と CCFT 非推奨化後の実画面移行、SCI for AI と基本 SCI の規格上の違い、CSRD / EED の適用範囲。統計は推計年・公表年・算定境界を揃える
- **AI 業界マップ・OSS エコシステム** — 起点: `research/ecosystem/industry-oss.md`。次の確認: Microsoft Agent Framework 1.0 の後続と AutoGen maintenance、Gemma 4 の Apache 2.0 と旧世代規約、OSAID 改定、Hugging Face 規約・組織移管
- **AI 規格・認証** — 起点: `research/ecosystem/standards.md`。次の確認: ISO / JIS 42001 と認定機関、NIST AI RMF の改訂、JTC 21 の整合規格と OJ 引用。発行・認証・認定・EU の適合推定を別々に追跡
- `examples/` の全 6 件を実行確認し README の動作確認日・確認方式を更新する。依存更新時はモックだけでなく SDK の transport と MCP stdio を検査する

<!-- freshness-watchlist:end -->
