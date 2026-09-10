# 2026-09-10 鮮度更新の実施記録

2026-09-10 の[鮮度監査](freshness-audit.md)で洗い出した **107 件(訂正 56 件・補足 51 件)をすべて反映**しました。本文 49 記事、関連調査メモ、用語集、全 16 系統の観測予定、Python サンプルと CI / サイト依存を同期しています。記事は既存の published ステータスを維持しました。

元の[監査 JSON](../../../research/freshness-audit-data-2026-09-10.json)は監査時点のスナップショットです。`identified_not_applied` は当時の状態を表し、その後の適用結果は下記 5 台帳を正本とします。ID の集合を照合し、欠落・重複 0 件と各変更先の存在を確認しました。

## 主な更新

- **モデル・API**: Fable 5.1、Astra の非互換、Gemini 3.8、キャッシュの書込・読取課金、非同期ツールと履歴保持。Qwen・Kimi・Mistral・Gemma は配布物ごとのライセンス条件を分離
- **直近期日**: Bedrock Claude 3 Haiku の 9/10、Nova Sonic v1 / Premier の 9/14、Videos API / Sora 2 の 9/24、Canvas / Reel と旧 Gemini Omni preview の 9/30 をモデル ID・地域・新規採用制限と併記
- **製品・規制・研究**: コーディングツールの保持・学習・提供条件、法令と規格の版・適用段階、RPA の閉域条件、ロボティクス評価、環境指標、決済委任情報を更新
- **サンプル・依存**: Anthropic 1.4.0 / httpx2 2.12.0、MCP 2.2.0 へ移行。React 19.3.0 / xyflow 12.11.6 と公式 SHA 固定の Actions を更新。tool-use に API キー不要の `--mock` を追加

## 監査から精密化した点

一次資料を実装時に読み直し、元の提案をそのまま採用すると誤る次の点を補正しました。

| ID | 実装時の補正 |
| --- | --- |
| M06 | 入力項目の正式名は `configuration_update`。次の user メッセージより前に置き、元の request-level effort を保持する。TTL は最低利用可能時間であり削除期限ではない |
| A02 / FT02 | AWS が 9/7 に旧モデルの表を分割したため `model-lifecycle-legacy.html` を参照する。予定日を実 API の停止確認と混同しない |
| A03 | Google Transcribe / Transcribe Live の GA 日は公式 changelog の 8/26。監査にあった 8/19 は採用しない |
| GOV03 | PPC の 9/9 工程表は委員会議論・意見交換・ヒアリングの予定。正式パブコメの開始日ではない |
| TS-01 | 知財プリンシプル・コードの 10/26 は「届出」開始予定 |
| PH-03 | ER 1.6 の API 公開日・モデルカード日・停止予定日を分離し、停止予定日経過を実停止と断定しない |
| RPA01 | Blue Prism 2025.25 以前の該当部品は、将来の除外予定ではなく既にサポート対象外 |

独立した意味的レビューでは、更新箇所の周辺に残っていた履歴の一律要約推奨、Codex cloud の通信条件、キャッシュと履歴圧縮の混同、確認日の表示、略語と参考資料名も修正しました。Copilot の企業管理権限 GA と Continue の保守終了方針も追加反映しています。

## 検証

| 検証 | 結果 |
| --- | --- |
| 107 件と 5 台帳の照合 | 欠落 0・重複 0、各変更先の存在を確認 |
| Python サンプル | 17 回帰テスト成功。6 件のモック、Anthropic SDK の HTTP モック、MCP 新旧両方式の実 stdio 接続を含む |
| GitHub Actions | actionlint 1.7.12 成功。公式 Windows 配布物の SHA256 を照合 |
| サイト依存 | unit 23 件成功、npm audit 脆弱性 0 |
| 文書・編集フック | 編集フック 11 件成功、markdownlint / validator 215 ファイル / 相対リンク 225 ファイル・4,018 リンクを確認 |
| 静的サイト・ブラウザー | 223/223 ルート、229 HTML、全 16 セクションを検証。Edge のブラウザー回帰 17 件成功、代表 6 記事の更新本文も生成 HTML で確認 |
| 意味的レビュー | 49 記事を独立レビュー。must / should の全指摘を修正・再確認 |

検査の再実行方法はルートの `npm run check`、[Python 回帰手順](../../../examples/tests/README.md)、website の `npm test` / `npm run build:clean` / `npm run test:browser` です。静的ビルドとブラウザー検査には公開と同じ `/ai-agent-library` の basePath を使います。ローカルでは Playwright 専用 Chromium が未導入だったため `PLAYWRIGHT_CHANNEL=msedge` で検査しました。CI は専用 Chromium を導入して同じ検査を実行します。PR の CI と、マージ後の main CI・Pages デプロイを公開結果の正本とします。

## 残す確認事項

- 全 199 記事に対する日付・版・製品名・URL・TODO のリスク抽出と、全 16 系統の一次資料観測を行いました。199 記事のすべての主張を個別に再証明した結果ではありません
- 実モデル API、IdP の登録・失効、アカウントや地域別の機能、EOL 当日の実停止、実機ロボット、企業内ネットワークでの動作は未検証です
- 有償規格全文、法令の個別適用、今後の政令・最終規則・施行、研究の独立追試、取得できていないランキングは確認先と条件を残しました
- 調査メモの旧観測表は日付付き履歴です。新しい判断には 2026-09-10 の更新節と本文を使います。未再確認項目の最終確認月を一律には変更していません
- 更新後の `TODO(要確認)` は 184 件・122 記事です(7 月 93 件、8 月 39 件、9 月 52 件)。将来の観測・採用時確認を含むため、今回の未修正指摘の件数ではありません
- 次回の全系統観測は 2026-11 目安です。9 月の終了予定は[ROADMAP](../../../ROADMAP.md)の注目項目として先に追跡します

## 対応台帳

- [freshness-implementation-coding-2026-09-10](../../../research/freshness-implementation-coding-2026-09-10.json)
- [freshness-implementation-core-2026-09-10](../../../research/freshness-implementation-core-2026-09-10.json)
- [freshness-implementation-dependencies-2026-09-10](../../../research/freshness-implementation-dependencies-2026-09-10.json)
- [freshness-implementation-governance-2026-09-10](../../../research/freshness-implementation-governance-2026-09-10.json)
- [freshness-implementation-strategy-2026-09-10](../../../research/freshness-implementation-strategy-2026-09-10.json)

| ID | 更新内容 | 主な変更先 | 状態 |
| --- | --- | --- | --- |
| M01 | Claude Fable 5.1 とキャッシュ価格を同期 | [llm-landscape.md](../../../docs/03-implementation/llm-landscape.md) | 反映済み |
| M02 | Gemini 3.8 Flash を現行カタログとプロンプトへ反映 | [llm-landscape.md](../../../docs/03-implementation/llm-landscape.md) | 反映済み |
| M03 | Astra の移行条件を OpenAI 特化ガイドにも反映 | [openai-prompting.md](../../../docs/03-implementation/openai-prompting.md) | 反映済み |
| M04 | 非同期ツールと実行中の指示変更を具体化 | [streaming-and-agent-ux.md](../../../docs/03-implementation/streaming-and-agent-ux.md) | 反映済み |
| M05 | Fable 5.1 の tool_choice と思考履歴の非互換 | [claude-prompting.md](../../../docs/03-implementation/claude-prompting.md) | 反映済み |
| M06 | キャッシュの世代別課金と途中設定変更 | [cost-management.md](../../../docs/05-operations/cost-management.md) | 反映済み |
| M07 | Qwen3.8 のライセンス未確認を解消 | [llm-landscape.md](../../../docs/03-implementation/llm-landscape.md) | 反映済み |
| A01 | Videos API / Sora 2 APIモデルの9月24日終了を明記 | [video-ai-overview.md](../../../docs/12-multimodal/video-ai-overview.md) | 反映済み |
| A02 | Nova Canvas / Reel / Sonic の提供期限 | [image-generation-integration.md](../../../docs/12-multimodal/image-generation-integration.md) | 反映済み |
| A03 | 音声認識の新APIと終了日を音声記事へ同期 | [voice-agents.md](../../../docs/03-implementation/voice-agents.md) | 反映済み |
| A04 | 動画の能動的読解と Gemini Omni のGA | [video-ai-overview.md](../../../docs/12-multimodal/video-ai-overview.md) | 反映済み |
| A05 | Claude computer/browser use と Files/Skills GA | [computer-use-implementation.md](../../../docs/03-implementation/computer-use-implementation.md) | 反映済み |
| D01 | Anthropic Python SDK 1系への移行計画 | [requirements.txt](../../../examples/python/tool-use/requirements.txt) | 反映済み |
| D02 | MCP SDK 2系と入門・サンプルの版を揃える | [mcp-and-tool-protocols.md](../../../docs/03-implementation/mcp-and-tool-protocols.md) | 反映済み |
| D03 | GitHub Actions の Node 24 対応世代へ更新 | [ci.yml](../../../.github/workflows/ci.yml) | 反映済み |
| D04 | React / React Flow の互換更新候補 | [package.json](../../../website/package.json) | 反映済み |
| B01 | Terminal-Bench 4.0 と検証版の評価地図 | [agent-benchmarks-landscape.md](../../../docs/04-evaluation/agent-benchmarks-landscape.md) | 反映済み |
| M08 | Gemini の thinking_budget を一律の移行対象にしない | [gemini-prompting.md](../../../docs/03-implementation/gemini-prompting.md) | 反映済み |
| AU01 | OpenAI Connectors OAuth の未確認を解消 | [agent-identity-and-auth.md](../../../docs/06-security/agent-identity-and-auth.md) | 反映済み |
| AU02 | Google Agent Identity auth manager のGAを反映 | [agent-identity-and-auth.md](../../../docs/06-security/agent-identity-and-auth.md) | 反映済み |
| AU03 | OAuth 2.1 の改版を調査メモへ追記 | [agent-identity.md](../../../research/professional/agent-identity.md) | 反映済み |
| M09 | Mistral Medium 3.5 は重み公開済み・Modified MIT | [llm-landscape.md](../../../docs/03-implementation/llm-landscape.md) | 反映済み |
| M10 | Kimi K3 の重み公開と独自契約条件を確認 | [llm-landscape.md](../../../docs/03-implementation/llm-landscape.md) | 反映済み |
| M11 | DeepSeek V4 のGA・API・価格条件を更新 | [llm-landscape.md](../../../docs/03-implementation/llm-landscape.md) | 反映済み |
| AU04 | Okta XAA の提供と設定移行を追跡 | [agent-identity-and-auth.md](../../../docs/06-security/agent-identity-and-auth.md) | 反映済み |
| A06 | Eleven v3 のWebSocket経路をTTSと対話で分離 | [speech-synthesis-and-voice-design.md](../../../docs/12-multimodal/speech-synthesis-and-voice-design.md) | 反映済み |
| FT01 | Gemini 3系SFTの提供を一次資料で確定 | [fine-tuning-and-distillation.md](../../../docs/03-implementation/fine-tuning-and-distillation.md) | 反映済み |
| FT02 | Claude 3 Haiku の Bedrock FT 経路と本日のEOL | [fine-tuning-and-distillation.md](../../../docs/03-implementation/fine-tuning-and-distillation.md) | 反映済み |
| GOV01 | FISC 安全対策基準は第14版 | [industry-regulations-map.md](../../../docs/09-business/industry-regulations-map.md) | 反映済み |
| GOV02 | FDUA ガイドライン1.2を反映 | [industry-regulations-map.md](../../../docs/09-business/industry-regulations-map.md) | 反映済み |
| GOV03 | 個人情報保護法改正の法番号・段階施行・PPC予定 | [industry-regulations-map.md](../../../docs/09-business/industry-regulations-map.md) | 反映済み |
| GOV04 | California AI透明性法の義務主体と日付を分離 | [compliance-and-governance.md](../../../docs/06-security/compliance-and-governance.md) | 反映済み |
| GOV05 | FTC AI accuracy policy は提案段階 | [compliance-and-governance.md](../../../docs/06-security/compliance-and-governance.md) | 反映済み |
| GOV06 | Colorado ADMT とチャットボット規則案の工程 | [compliance-and-governance.md](../../../docs/06-security/compliance-and-governance.md) | 反映済み |
| GOV07 | EU AI Act の新禁止行為と既存モデル透明性の適用日 | [compliance-and-governance.md](../../../docs/06-security/compliance-and-governance.md) | 反映済み |
| GOV08 | EN18286:2026 の発行と整合規格の推定効を区別 | [ai-standards-and-certification.md](../../../docs/06-security/ai-standards-and-certification.md) | 反映済み |
| GOV09 | AISI 評価観点ガイド1.20とロボティクス版 | [ai-standards-and-certification.md](../../../docs/06-security/ai-standards-and-certification.md) | 反映済み |
| GOV10 | NISTの公開AI文書化ガイダンス・テンプレートZero Draft | [ai-standards-and-certification.md](../../../docs/06-security/ai-standards-and-certification.md) | 反映済み |
| GOV11 | 国内初の認証と認定を区別 | [ai-standards-and-certification.md](../../../docs/06-security/ai-standards-and-certification.md) | 反映済み |
| GOV12 | ISO42005/42006の発行年月を一次情報へ統一 | [standards.md](../../../research/ecosystem/standards.md) | 反映済み |
| GOV13 | FDA TPLC draft と PCCP final の版を更新 | [industry-regulations-map.md](../../../docs/09-business/industry-regulations-map.md) | 反映済み |
| TS-01 | 知財本部AIプリンシプル・コードの正式公開と申出開始予定を反映 | [ai-copyright-and-ip-map.md](../../../docs/09-business/ai-copyright-and-ip-map.md) | 反映済み |
| TS-02 | ISO 22144の段階をISO公式情報へ置換 | [content-provenance-and-detection.md](../../../docs/06-security/content-provenance-and-detection.md) | 反映済み |
| TS-03 | Anthropic RSP 3.4とAugust 2026 Risk Reportへ研究メモを更新 | [frontier-safety-overview.md](../../../docs/06-security/frontier-safety-overview.md) | 反映済み |
| TS-04 | PreparednessとFrontier Governanceの関連及び8月方針を補足 | [frontier-safety-overview.md](../../../docs/06-security/frontier-safety-overview.md) | 反映済み |
| TS-05 | 捜査機関のなりすましと被害回復詐欺を通報手順へ追加 | [deepfake-and-impersonation-defense.md](../../../docs/06-security/deepfake-and-impersonation-defense.md) | 反映済み |
| TS-07 | Claudeのtext watermarkとFiles API取得時C2PAを具体例へ追加 | [content-provenance-and-detection.md](../../../docs/06-security/content-provenance-and-detection.md) | 反映済み |
| PH-01 | Helixを旧35自由度・2層の例だけで説明しない | [physical-ai-overview.md](../../../docs/01-concepts/physical-ai-overview.md) | 反映済み |
| PH-02 | VLA共通ベンチマークが存在しないという断定を限定 | [physical-ai-overview.md](../../../docs/01-concepts/physical-ai-overview.md) | 反映済み |
| PH-03 | Gemini Robotics 2系の提供段階とER1.6の日付を更新 | [physical-ai-overview.md](../../../docs/01-concepts/physical-ai-overview.md) | 反映済み |
| PH-04 | GR00T N1.7の公開物とN2の予定を分離 | [physical-ai-overview.md](../../../docs/01-concepts/physical-ai-overview.md) | 反映済み |
| PH-05 | 世界モデルと行動方策を結合するWAMを整理へ追加 | [world-models-overview.md](../../../docs/01-concepts/world-models-overview.md) | 反映済み |
| PH-06 | PIの実顧客導入事例を介入付き運用として補足 | [physical-ai-overview.md](../../../docs/01-concepts/physical-ai-overview.md) | 反映済み |
| EG-01 | BISのUAE向け条件付き優遇を輸出規制監視へ追加 | [ai-geopolitics-map.md](../../../docs/09-business/ai-geopolitics-map.md) | 反映済み |
| EG-02 | 最終親会社の本社所在地を輸出相談用の事実リストへ追加 | [ai-geopolitics-map.md](../../../docs/09-business/ai-geopolitics-map.md) | 反映済み |
| EG-03 | EU dual-useのAnnex I更新を法令番号と日付で管理 | [ai-geopolitics-map.md](../../../docs/09-business/ai-geopolitics-map.md) | 反映済み |
| EG-04 | DPDP Rules最終原文の取得不能を解消し段階施行を整理 | [ai-geopolitics-map.md](../../../docs/09-business/ai-geopolitics-map.md) | 反映済み |
| EG-05 | CACの取得不能メモを越境データ専用索引へ更新 | [ai-geopolitics-map.md](../../../docs/09-business/ai-geopolitics-map.md) | 反映済み |
| EG-06 | AWS CCFTの後継をSustainability consoleへ具体化 | [green-ai.md](../../../docs/05-operations/green-ai.md) | 反映済み |
| EG-07 | SCI for AIを策定中からGSF批准済み仕様へ更新 | [green-ai.md](../../../docs/05-operations/green-ai.md) | 反映済み |
| EG-08 | CSRD簡素化を最終承認後の状態へ更新 | [green-ai.md](../../../docs/05-operations/green-ai.md) | 反映済み |
| EG-09 | EEDデータセンター報告FAQ1.8と格付けの実際の段階を追跡 | [green-ai.md](../../../docs/05-operations/green-ai.md) | 反映済み |
| EG-10 | クラウド環境報告を最新の実績年と公開版へ更新 | [green-ai.md](../../../docs/05-operations/green-ai.md) | 反映済み |
| EG-11 | IEAの2026年Energy and AI資料へ参照を追加 | [green-ai.md](../../../docs/05-operations/green-ai.md) | 反映済み |
| EG-12 | EU十分性認定の直近決定と再審査を研究メモへ追加 | [ai-geopolitics-map.md](../../../docs/09-business/ai-geopolitics-map.md) | 反映済み |
| T01 | Windsurfの現行契約と学習オプトアウト条件を更新 | [windsurf.md](../../../docs/08-coding-agents/windsurf.md) | 反映済み |
| T02 | Cursor Privacy Modeの保持例外とBYOKの経路を反映 | [cursor.md](../../../docs/08-coding-agents/cursor.md) | 反映済み |
| T03 | Claude Codeのmax-turns既定10という誤記を訂正 | [claude-code-in-practice.md](../../../docs/08-coding-agents/claude-code-in-practice.md) | 反映済み |
| T04 | Claude Codeのeffort変更時にキャッシュを維持できる条件を反映 | [claude-code-in-practice.md](../../../docs/08-coding-agents/claude-code-in-practice.md) | 反映済み |
| T05 | Claude Codeの主会話とsubagentのキャッシュTTL設定を追加 | [claude-code-in-practice.md](../../../docs/08-coding-agents/claude-code-in-practice.md) | 反映済み |
| T06 | Claude Codeのself-hosted environments public betaを追加 | [claude-code.md](../../../docs/08-coding-agents/claude-code.md) | 反映済み |
| T07 | Cursorのself-hosted machinesと共有poolを比較へ追加 | [cursor.md](../../../docs/08-coding-agents/cursor.md) | 反映済み |
| T08 | Copilot appとCLIのcontent exclusion GAをIDEと分けて記載 | [github-copilot.md](../../../docs/08-coding-agents/github-copilot.md) | 反映済み |
| T09 | Copilot code reviewのPR承認public previewを追加 | [github-copilot.md](../../../docs/08-coding-agents/github-copilot.md) | 反映済み |
| T10 | Copilot選択モデルの2026年10月2日廃止予定を追加 | [github-copilot.md](../../../docs/08-coding-agents/github-copilot.md) | 反映済み |
| T11 | Codexのpermission profiles betaと旧設定の関係を追加 | [openai-codex.md](../../../docs/08-coding-agents/openai-codex.md) | 反映済み |
| T12 | Codex Auto-reviewの対象範囲を権限説明へ追加 | [openai-codex.md](../../../docs/08-coding-agents/openai-codex.md) | 反映済み |
| T13 | Codex subagentの委任条件を提供面ごとに訂正 | [openai-codex-in-practice.md](../../../docs/08-coding-agents/openai-codex-in-practice.md) | 反映済み |
| T14 | Codexの5.4 mini退役を認証経路ごとに同期 | [openai-codex-in-practice.md](../../../docs/08-coding-agents/openai-codex-in-practice.md) | 反映済み |
| T15 | Codex Fastの速度・creditとAPI Priority料金を分離 | [openai-codex-in-practice.md](../../../docs/08-coding-agents/openai-codex-in-practice.md) | 反映済み |
| T16 | Kong AI Gateway 2.0と旧プラグイン・OSSライセンスを分離 | [llm-gateway.md](../../../docs/05-operations/llm-gateway.md) | 反映済み |
| T17 | TensorRT-LLMのLTX-2モデル配下のライセンス例外を追加 | [serving.md](../../../research/llmops/serving.md) | 反映済み |
| T18 | LM Studioの現行App Termsと有料機能条件を反映 | [serving.md](../../../research/llmops/serving.md) | 反映済み |
| T19 | Antigravityの組織向け導入経路を反映 | [gemini-cli-and-code-assist.md](../../../docs/08-coding-agents/gemini-cli-and-code-assist.md) | 反映済み |
| T20 | Gemini個人向け提供終了とAPIデータ利用条件を比較表へ同期 | [coding-agents-comparison.md](../../../docs/08-coding-agents/coding-agents-comparison.md) | 反映済み |
| T21 | Gemini APIのPaidデータ条件に該当する地域・課金設定を補足 | [gemini-cli-and-code-assist.md](../../../docs/08-coding-agents/gemini-cli-and-code-assist.md) | 反映済み |
| T22 | Copilot for JetBrainsの企業管理sandbox previewを追加 | [github-copilot.md](../../../docs/08-coding-agents/github-copilot.md) | 反映済み |
| T23 | Clineのdesktop提供面を任意の比較項目へ追加 | [open-source-coding-agents.md](../../../docs/08-coding-agents/open-source-coding-agents.md) | 反映済み |
| T24 | Gemma 4のApache 2.0を旧世代の独自規約から分離 | [llm-landscape.md](../../../docs/03-implementation/llm-landscape.md) | 反映済み |
| T25 | Microsoft Agent Framework 1.0の提供段階を調査メモへ追加 | [framework-selection.md](../../../docs/03-implementation/framework-selection.md) | 反映済み |
| T26 | Devinの監視対象にSWE-1.7を追加 | [devin.md](../../../docs/08-coding-agents/devin.md) | 反映済み |
| T27 | Devin Enterpriseのprivate MCP接続条件を追加 | [devin.md](../../../docs/08-coding-agents/devin.md) | 反映済み |
| T28 | Cursor Originとsubscriptionsを任意の自動化例へ追加 | [cursor.md](../../../docs/08-coding-agents/cursor.md) | 反映済み |
| RPA01 | WorkHQ の名称発表と Agentic Workflows の GA・サポート期限を区別 | [rpa-and-agents.md](../../../docs/13-domain-agents/rpa-and-agents.md) | 反映済み |
| RPA02 | WinActor 7.7 と AI 支援の利用上限切替・外部通信条件を補足 | [rpa-and-agents.md](../../../docs/13-domain-agents/rpa-and-agents.md) | 反映済み |
| RPA03 | UiPath Maestro の自己ホスト提供と TaaS の配置条件を補足 | [rpa-and-agents.md](../../../docs/13-domain-agents/rpa-and-agents.md) | 反映済み |
| RPA04 | Copilot Studio computer use の GA 条件と古い RPA 比較を同期 | [rpa-and-agents.md](../../../docs/13-domain-agents/rpa-and-agents.md) | 反映済み |
| RPA05 | Copilot Studio の harness と agent flows / workflows を区別 | [rpa-and-agents.md](../../../docs/13-domain-agents/rpa-and-agents.md) | 反映済み |
| RPA06 | Automation Anywhere の Mozart と機能ごとの提供状態を補足 | [rpa-and-agents.md](../../../docs/13-domain-agents/rpa-and-agents.md) | 反映済み |
| EM01 | Robin の査読出版と人が実験する検証範囲を更新 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
| EM02 | AI co-scientist の出版書誌と確認できた証拠の範囲を補足 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
| EM03 | A-Lab の訂正文に基づき新規性と成功数を修正 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
| EM04 | 1,000 人シミュレーション研究の論文リンク・版・評価指標を修正 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
| EM05 | PUBG Ally の出荷表現を期間限定ベータと実装構成へ修正 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
| EM06 | ChatGPT commerce の現行方針を商品発見と加盟店 checkout に更新 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
| EM07 | Agent 決済の実取引 pilot と一般提供を区別して補足 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
| EM08 | AP2 v0.2 の FIDO 寄贈と Mandate の現行構成を更新 | [emerging-agent-domains.md](../../../docs/13-domain-agents/emerging-agent-domains.md) | 反映済み |
