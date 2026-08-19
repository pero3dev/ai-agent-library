# MAINTENANCE-2026Q3-PLAN — 全系統一括最新化計画(2026-08)

2026-08-18 時点の計画です。ライブラリ全体(199 本・16 セクション)の鮮度基準日は 2026-07 で、`TODO(要確認)` は 181 件・121 ファイルすべてが「最終確認: 2026-07」です。本計画は、ROADMAP.md「定期メンテナンス」節の全 16 系統 + 横断タスクを前倒しで一括実施し、鮮度基準日を 2026-08 に揃えるものです。

- 系統リストの正本は [ROADMAP.md](ROADMAP.md) の「定期メンテナンス」節(本書はその実施計画。系統の定義は複製しない)
- 実施は `/quarterly-maintenance` スキル(1 セッション 1〜3 系統)+ freshness-checker サブエージェントを使う
- 実施済みバッチは本書末尾の進捗表を更新する

## なぜ今か(期日ベースの根拠)

ROADMAP の「直近の注目」に挙がった期日のうち、すでに到来済み・直近のものがあります:

| 期日 | イベント | 影響する系統 |
| --- | --- | --- |
| 2026-06-30(経過) | AWS CCFT 後継移行(廃止予定日) | 輸出規制・環境開示(green-ai) |
| 2026-08-02(経過) | EU AI Act 透明性義務 適用 / California SB 942 系 施行 | 規制動向(compliance) |
| 2026-08-17(経過) | Imagen 停止・Nano Banana 移行 | 生成 AI・リアルタイム/TTS |
| 2026-09(来月) | Sonnet 5 導入価格終了 | モデルガイド・プロンプティング |
| 2026-10〜12 | Gemini 2.5 系終了 / OpenAI `v1/prompts` 停止 / o 系退役 / OAuth 2.1 IESG 提出 | モデル / 認証・プロトコル |

## Phase 0 — 前提整備(バッチ開始前に 1 回)

1. **ブランチ整理(要ユーザー承認)**: `fix/website-pipeline-batch-a` は main より 3 コミット先行(3c41f93 開発環境整備 / d1eceb2 監査バッチ A / ba9408e 監査バッチ B)で未 push。push → PR → main マージ → CI デプロイ(GitHub Pages)確認まで済ませ、以後のバッチは main を起点にする
2. **未追跡ファイルの扱い(ユーザー判断・本計画では触らない)**: `.claude/settings.json` の変更、`.agents/` `.codex/` `AGENTS.md`(Codex 並行環境とみられる)をコミットするか ignore するか決める
3. 本計画ファイルをコミットし、ROADMAP「定期メンテナンス」節の冒頭に本書への参照を 1 行追加する

## バッチ構成(M1〜M6・各 1 セッション想定)

系統の詳細(対象 docs・research メモ・直近の注目)は ROADMAP の該当行を正とします。ここでは分担と順序のみ定めます。

### M1 — 期日到来・直近期日(最優先)

| 系統 | 主対象 | 起点メモ |
| --- | --- | --- |
| モデルガイド + モデル特化プロンプティング | 10-llm-foundations, 02-architecture ほか | `research/models/` `research/prompting/` |
| 生成 AI(画像・動画)・リアルタイム/TTS | 12-multimodal 4 本 | `research/multimodal/` |
| 規制動向 | compliance-and-governance | `research/professional/compliance.md` |

### M2 — 変化の速い開発ツール・評価系

| 系統 | 主対象 | 起点メモ |
| --- | --- | --- |
| 08-coding-agents ツール情報(四半期必須) | 08 章全ページ + 比較表 | `research/coding-agents/` |
| エージェントベンチマーク動向 | agent-benchmarks-landscape | `research/professional/benchmarks.md` |
| 音声 API・FT 提供状況 | voice-agents, fine-tuning-and-distillation | `research/professional/voice-agents.md` `fine-tuning.md` |

### M3 — プロトコル・インフラ

| 系統 | 主対象 | 起点メモ |
| --- | --- | --- |
| エージェント認証・連携プロトコル | agent-identity-and-auth, agent-interop-protocols | `research/professional/agent-identity.md` `research/infra/agent-protocols.md` |
| サービング・ゲートウェイ OSS | self-hosted-inference, llm-gateway, local-and-on-device-llm | `research/llmops/serving.md` |
| AI 業界マップ・OSS エコシステム | ai-industry-map, open-source-ai-ecosystem | `research/ecosystem/industry-oss.md` |

### M4 — 規制・ガバナンス

| 系統 | 主対象 | 起点メモ |
| --- | --- | --- |
| 業界規制 | industry-regulations-map(全表の版数) | `research/supplementary/regulations.md` |
| 来歴標準・フロンティアセーフティ・なりすまし・著作権/知財 | 06-security 発展層 3 本 + ai-copyright-and-ip-map | `research/trust/` 3 メモ |
| AI 規格・認証 | ai-standards-and-certification | `research/ecosystem/standards.md` |

### M5 — 戦略・ドメイン

| 系統 | 主対象 | 起点メモ |
| --- | --- | --- |
| 輸出規制・環境開示(CCFT 廃止日経過) | ai-geopolitics-map, green-ai | `research/strategy/` 2 メモ |
| RPA/自動化ベンダーの Agent 統合動向 | rpa-and-agents | `research/domain-agents/rpa.md` |
| フィジカル AI | physical-ai-overview | `research/supplementary/physical-ai.md` |

### M6 — 先端応用 + 横断仕上げ

| タスク | 内容 |
| --- | --- |
| 先端応用の定点観測 | emerging-agent-domains(`research/domain-agents/emerging.md`) |
| examples 実行確認 | `/examples-check` で全 6 件実行 → 各 README の動作確認日更新 |
| 横断棚卸し | `todo-report` で 2026-07 残の理由確認 / `last_updated` 6 か月超の確認 / `validate-docs --all` + `check-links` 全体 / GLOSSARY 追補漏れ確認 |
| サイト反映 | main マージ後に `build:clean` で再ビルド → デプロイ反映確認(basePath ビルドは PowerShell) |

## 各バッチの標準手順(quarterly-maintenance スキル準拠)

1. freshness-checker サブエージェントを系統ごとに並列起動(ROADMAP の系統定義・対象 docs・research メモ・直近の注目リストを渡す)→ 一次情報との差分レポートを得る
2. research/ メモを更新(調査の生データはここが起点)
3. docs 本文の「変わりやすい項目」を差分反映し、`TODO(要確認)` の最終確認日を「最終確認: 2026-08」に更新
4. 事実・推奨の実質変更があったファイルのみ front matter `last_updated` を更新(日付更新だけなら不要)。新用語があれば GLOSSARY へ
5. `node scripts/validate-docs.mjs --all` / `node scripts/check-links.mjs` / `node scripts/todo-report.mjs` で検証
6. ROADMAP 該当系統の「直近の注目」を次回(2026-11 目安)向けに書き換え
7. 本書の進捗表を更新してコミット(1 バッチ 1 コミット目安)

## 完了条件(Definition of Done)

- [ ] 全 16 系統の対象 docs・research メモの最終確認日が 2026-08 になっている
- [ ] `todo-report` で「最終確認: 2026-07」が残るのは系統対象外(実装選定時確認型)のみで、残す理由を M6 で確認済み
- [ ] validate-docs --all / check-links がクリーン
- [ ] ROADMAP「直近の注目」が全系統 2026-08 版に更新済み(次回 2026-11 目安を明記)
- [ ] examples 全 6 件の動作確認日が更新済み
- [ ] main にマージされ、公開サイトの再ビルド・デプロイが確認済み

## スコープ外(別途判断)

- 監査バッチ C(タグ語彙の棚卸し・鮮度メタデータの機械化・テスト追加)— 内容更新とは独立したパイプライン改善。本計画完了後に要否を判断
- 新規記事の追加(全 20 拡張計画は完結済み。定点観測で「1 記事に値する新動向」が見つかった場合のみ、別途計画を立てて提案)

## 進捗表

| バッチ | 状態 | 実施日 | コミット |
| --- | --- | --- | --- |
| Phase 0 | 完了 | 2026-08-18 | PR #2(rebase マージ・main 570f055)。CI の npm audit ゲート検出の website 依存脆弱性 7 件も解消。マージ後のデプロイ成功確認済み |
| M1 | 完了 | 2026-08-18 | モデルガイド・プロンプティング 6 本(Opus 5 / GPT-5.6 世代 / Gemini 3.7 Flash / Sonnet 5 価格恒久化 / 2.5 系終了撤回)/ 生成 AI・リアルタイム 4 本(本文差分ゼロ・Imagen 停止確認)/ 規制動向(EU 2026/1744 発効・個情法改正成立・SB 942 施行) |
| M2 | 完了 | 2026-08-18 | coding-agents 13 本 + 比較表(Claude Code auto 既定化・Copilot 学習対象 Max 追加・Spark 終了・Codex docs 移転/5.6 世代・Devin Fusion・Antigravity 確定)/ ベンチマーク(TB 3.0・HAL 一時停止)/ 音声・FT(Vertex Live GA・FT 終了日程 2027-01-06) |
| M3 | 完了 | 2026-08-18 | 認証・プロトコル(MCP 2026-07-28 大改版反映・A2A の AAIF 編入・AP2 FIDO 寄贈)/ サービング OSS(TGI アーカイブ反映・TODO 4 件解消)/ 業界マップ・OSS(本文差分ゼロ・確度更新) |
| M4 | 未着手 | — | — |
| M5 | 未着手 | — | — |
| M6 | 未着手 | — | — |

## 依頼テンプレート

```text
MAINTENANCE-2026Q3-PLAN.md のバッチ M1 を実施してください。
/quarterly-maintenance で対象 3 系統を実施し、完了後に ROADMAP の「直近の注目」と本計画の進捗表を更新してください。
```
