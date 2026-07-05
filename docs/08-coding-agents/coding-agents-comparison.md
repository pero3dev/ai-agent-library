---
title: "主要コーディングエージェント比較"
category: "coding-agents"
level: "intermediate"
status: "published"
last_updated: "2026-07-06"
tags: ["coding-agents"]
---

# 主要コーディングエージェント比較

## この記事の目的

主要なコーディングエージェントを提供形態・実行環境・権限・データ取り扱い・契約の観点で横断比較し、候補を 2〜3 に絞り込めるようになります。本記事は各ツール別記事の要約集約であり、**優劣は付けません**。用途別の向き不向きとして整理します。

## 対象読者

- [選定基準](coding-agent-selection.md) の判断軸を踏まえて、具体的な候補を絞り込みたいエンジニア・テックリード

## 前提知識

- [AI コーディングエージェントの分類と全体像](coding-agents-overview.md)
- [コーディングエージェントの選定基準と使い分け](coding-agent-selection.md)

## 本文

> **最終確認日:** 2026-07-05 — 全表の内容はこの日付時点の各公式情報に基づきます(各ツール別記事の調査と同一時点)。この分野は月単位で変わるため、意思決定の際は必ず各ツールページと一次情報を確認してください。

### 概要と読み方

- 凡例: **○** = 公式に提供 / **△** = 限定的・条件付き / **—** = 提供なし / **?** = 未確認
- ○/△/— は「提供の有無」のみを表し、優劣・品質を意味しません。○ の中身(深さ)はツールごとに異なるため、詳細は各ツール別記事を参照してください
- 金額は記載しません。表 D の料金参照先(公式ページ)を確認してください
- 詳細な根拠・出典は各ツール別記事と `research/coding-agents/` の調査メモにあります

### 提供形態マトリクス

| ツール | 提供元 | CLI | IDE 拡張 | 専用 IDE | クラウド実行 | GitHub/PR 連携 | API・SDK | OSS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Claude Code](claude-code.md) | Anthropic | ○ | ○ | — | ○(Web、preview) | ○(Actions・レビュー) | ○(Agent SDK) | —(拡張機構あり) |
| [OpenAI Codex](openai-codex.md) | OpenAI | ○ | ○ | —(注 1) | ○ | ○(レビュー・Action) | ○(SDK) | △(CLI のみ) |
| [Gemini CLI](gemini-cli-and-code-assist.md) | Google | ○ | — | — | — | △(Actions 統合) | —(拡張機構あり) | ○ |
| [Gemini Code Assist](gemini-cli-and-code-assist.md) | Google | —(注 2) | ○ | — | — | ○(PR レビュー) | — | — |
| [Jules](gemini-cli-and-code-assist.md) | Google | △(Jules Tools) | — | — | ○ | ○(PR 作成) | ○(API、alpha) | — |
| [GitHub Copilot](github-copilot.md) | GitHub | ○ | ○ | — | ○(cloud agent) | ○ | ○(API) | — |
| [Cursor](cursor.md) | Anysphere | ○ | — | ○ | ○(Cloud Agents) | ○(Bugbot・@cursor) | ○(SDK・API) | — |
| [Windsurf / Devin Desktop](windsurf.md) | Cognition | ○(Devin CLI) | ○(Windsurf Plugins) | ○ | ○(Devin へ委任) | △(クラウド側が担当) | △(ACP ホスト) | — |
| [Devin](devin.md) | Cognition | ○(Devin CLI) | —(Desktop は別掲) | — | ○ | ○(App・レビュー) | ○(API・MCP) | — |
| [Aider](open-source-coding-agents.md) | コミュニティ | ○ | — | — | — | — | — | ○ |
| [Cline](open-source-coding-agents.md) | Cline Bot Inc. | ○ | ○ | — | — | — | ○(SDK) | ○ |
| [OpenHands](open-source-coding-agents.md) | All Hands AI | △(レガシー) | — | — | ○(Cloud) | ○ | ○(SDK) | ○ |
| [Goose](open-source-coding-agents.md) | AAIF(Linux Foundation) | ○ | — | —(注 1) | — | — | ○ | ○ |
| [opencode](open-source-coding-agents.md) | Anomaly | ○ | ○ | — | — | — | — | ○ |

- 注 1: Codex・Goose にはデスクトップアプリがありますが、IDE(エディタ)ではないため専用 IDE 欄は — としています
- 注 2: Code Assist ライセンスには Gemini CLI の利用クォータが含まれます(CLI 製品自体は Gemini CLI)
- Continue は Cursor による買収でリポジトリが read-only のため表から除外しています([OSS 系](open-source-coding-agents.md) 参照)

### 実行環境・権限・セキュリティ

商用 9 製品を対象とします(OSS 系の承認モデル比較は [OSS 系記事](open-source-coding-agents.md) 参照)。**学習利用の既定はプラン・設定で変わるため、必ず契約予定の条件で一次情報を確認してください。**

| ツール | 実行場所 | サンドボックス | 承認モデル(既定) | 学習利用の既定 |
| --- | --- | --- | --- | --- |
| Claude Code | ローカル(+ クラウド VM) | 内蔵(**既定オフ**。Win ネイティブ非対応) | 都度承認(6 モード、deny → ask → allow) | Consumer: ユーザー設定次第で利用 / Commercial: 不使用 |
| OpenAI Codex | ローカル(+ クラウドコンテナ) | **既定で有効**(workspace-write)+ ネットワーク既定オフ | サンドボックスモード × 承認ポリシーの 2 軸 | 個人: ChatGPT 設定に従い利用されうる / Business 以上: 不使用 |
| Gemini CLI | ローカル | オプトイン(5 方式から選択) | 都度承認(auto_edit / plan、全自動はフラグ限定) | ライセンス経由: 不使用 / 無料 API キー: 要確認 |
| Gemini Code Assist | ローカル IDE | ? | 承認制(自動承認はオプトイン) | 不使用(公式明記) |
| Jules | クラウド VM | VM 隔離 | 計画承認 → 自律実行 | プライベートリポジトリで不使用(公式明記) |
| GitHub Copilot | IDE ローカル + GitHub Actions | preview(ローカル / クラウド) | IDE: 承認制 / cloud agent: 事後型 + 多層ゲート(ブランチ・ワークフロー承認・FW) | Free/Pro/Pro+: **既定で利用**(オプトアウト可)/ Business 以上: 契約で禁止 |
| Cursor | ローカル(+ クラウド VM) | macOS / Linux(Run Modes 内) | Auto-review(許可リスト + 分類器) | Privacy Mode 無効時: 利用 / 有効時: 不使用(Enterprise は既定オン + 強制可) |
| Windsurf / Devin Desktop | ローカル | Devin Local が対応(組織強制可) | Cascade: 4 段階レベル / Devin Local: Deny・Ask・Allow × スコープ | 個人: 既定で利用(オプトアウト可、Chat は制約)/ Enterprise: 不使用 |
| Devin | クラウド VM(セッション毎隔離) | VM 隔離が前提 | **事前承認なし**(委任 → 事後レビュー + Enterprise Guardrails) | セルフサーブ: **既定で利用**(オプトアウト可)/ Enterprise: 不使用 |

### 機能比較

| ツール | リポジトリ理解 | 編集の巻き戻し | MCP | ルールファイル | 拡張機構 |
| --- | --- | --- | --- | --- | --- |
| Claude Code | オンデマンド検索(ripgrep)+ LSP プラグイン | チェックポイント(`/rewind`) | ○ | CLAUDE.md(AGENTS.md は import / symlink) | フック・サブエージェント・スキル・プラグイン・SDK |
| OpenAI Codex | オンデマンド(公式から推測) | git 前提(専用機構なし) | ○ | **AGENTS.md**(本家) | フック・スキル・サブエージェント・SDK |
| Gemini CLI | オンデマンド | checkpointing | ○ | GEMINI.md(AGENTS.md 互換設定可) | extensions・custom commands |
| Gemini Code Assist | ローカル認識 + リモートインデックス(Enterprise) | ? | ○ | GEMINI.md | — |
| Jules | VM クローン + 環境スナップショット | PR 単位 | ? | AGENTS.md | REST API |
| GitHub Copilot | **自動インデックス + セマンティック検索** | Keep / Undo + チェックポイント(VS Code) | ○ | copilot-instructions.md・AGENTS.md(CLAUDE.md / GEMINI.md も読む) | Skills・カスタムエージェント・Spaces |
| Cursor | **埋め込みインデックス** + オンデマンド併用 | チェックポイント | ○ | .cursor/rules・AGENTS.md | フック・SDK・マーケットプレイス |
| Windsurf / Devin Desktop | ローカル / リモートインデックス + Fast Context | プロンプト単位 revert | ○ | .devin/rules・AGENTS.md | Memories・Skills・**ACP ホスト** |
| Devin | 事前インデックス + DeepWiki | PR 単位 | ○(自身も MCP サーバー) | AGENTS.md + Knowledge / Playbooks | API・Devin MCP・スケジュール実行 |

### 導入・契約

| ツール | プラン体系(名称のみ) | 無料枠 | チーム管理(SSO・ポリシー・監査) | 料金参照先 |
| --- | --- | --- | --- | --- |
| Claude Code | Pro / Max / Team / Enterprise + API 従量 | —(Free では利用不可) | ○(Enterprise: SSO・managed settings・監査) | <https://claude.com/pricing> |
| OpenAI Codex | ChatGPT 各プラン + API 従量 | △(Free / Go は限定的) | ○(requirements.toml・Analytics / Compliance API) | <https://developers.openai.com/codex/pricing> |
| Gemini CLI / Code Assist | Code Assist Standard / Enterprise、API キー、Vertex AI | △(個人向けは 2026-06 再編。要確認) | ○(Google Cloud のライセンス管理) | <https://cloud.google.com/products/gemini/pricing> |
| Jules | Google AI プラン(Free / Pro / Ultra) | ○ | **—(個人向けのみ)** | Google AI プランのページ |
| GitHub Copilot | Free / Student / Pro / Pro+ / Max / Business / Enterprise | ○(限定) | ○(ポリシー・監査・メトリクス API) | <https://github.com/features/copilot/plans> |
| Cursor | Hobby / Pro / Pro+ / Ultra / Teams / Enterprise | ○(Hobby) | ○(SSO・SCIM・Privacy Mode 強制・監査) | <https://cursor.com/pricing> |
| Windsurf・Devin(統合体系) | Free / Pro / Max / Teams / Enterprise | ○ | ○(Enterprise: SSO・RBAC・監査・Guardrails) | <https://devin.ai/pricing> |
| OSS 系 | ソフトウェア無料 + モデル API 従量(BYOK) | ○(ソフトウェア自体) | —(自前で統制を設計) | 各モデルプロバイダーの料金 |

### 用途別の向き不向き

「どれが良いか」ではなく「この用途なら、この形態・ツールが向く(理由)」の整理です。

| ユースケース | 向いている形態・ツール(理由) | 注意が要る条件 |
| --- | --- | --- |
| 対話的なペアプログラミング | ターミナル型(Claude Code・Codex CLI・Gemini CLI)、IDE 型(Cursor・Copilot・Devin Desktop)— 往復が速く人が舵を切れる | 委任型の使い方とは依頼の設計が異なる([依頼設計](coding-agent-prompting.md)) |
| Issue からの修正 PR 自動化 | Copilot cloud agent(GitHub ネイティブ)、Devin(Linear / Jira 起点)、Claude Code GitHub Actions — フローのイベントが直接トリガーになる | CI 権限・ブランチ保護・レビュー体制の整備が前提([権限とセキュリティ](coding-agent-security.md)) |
| 独立タスクの並列一括処理(依存更新・移行) | クラウド実行型(Devin・Codex cloud・Cursor Cloud Agents・Jules)— 隔離・並列・手元を塞がない | 完了基準が機械検証できるタスクに限る。消費(クレジット・ACU)は依頼の質に依存 |
| PR レビューの補助 | Copilot code review・Codex レビュー・Gemini Code Assist・Cursor Bugbot・Devin Review — 人のレビュー前の一次チェック | 人のレビューの代替にしない(各社公式も限界を明記) |
| 機密性の高いコードベース(データ主権) | OSS 系 + BYOK(opencode・Cline・Goose)、OpenHands(自己ホスト基盤)— 経路を自分で決められる | 運用責任と存続性監視を自分で負う。商用でも Enterprise 契約 + ZDR(Zero Data Retention)で満たせる場合がある |
| 既存 IDE を変えられないチーム | IDE 拡張型(Copilot・Claude Code 拡張・Codex 拡張・Cline)+ ターミナル型 | 専用 IDE 型(Cursor・Devin Desktop)は移行が前提 |
| GitHub 以外の SCM | Devin(GitLab / Bitbucket / Azure DevOps)、ローカル完結のターミナル型全般 | GitHub 連携型(Copilot cloud agent 等)は価値が大きく下がる |
| 既存契約の範囲で始めたい | Codex(ChatGPT 契約に同梱)、Copilot(GitHub 契約に統合)、Gemini(Google Cloud 契約) | 「同梱だから」で選ばず、学習利用の既定・管理機能は個別に確認 |

## 実務での注意点

### アンチパターン

- **この表だけで最終決定する** — 表は 2026-07-05 時点のスナップショットで、○ の深さも表現できていません。→ 候補を絞る道具として使い、決定は各ツールページ + 一次情報 + 社内試用([評価](coding-agent-evaluation.md))で行います
- **「学習利用の既定」列を読み飛ばす** — 2026 年に複数ベンダーが既定を変更しており、個人プランと組織プランで正反対のことが常態です。→ 契約予定のプラン条件で必ず確認します
- **表の鮮度を確認せずに引用する** — 社内資料への転載は陳腐化した情報の拡散になりがちです。→ 転載ではなく本記事(と各ツールページ)への参照にし、最終確認日を併記します

### チェックリスト

- [ ] 候補ツールについて、表ではなく各ツールページと一次情報を確認したか
- [ ] 学習利用の既定を「契約予定のプラン」の条件で確認したか
- [ ] 落とせない制約([選定基準](coding-agent-selection.md))で絞ってから機能比較に進んだか
- [ ] 最終確認日(2026-07-05)以降の変更がないか、意思決定の直前に主要項目を再確認したか

## 関連トピック

- [コーディングエージェントの選定基準と使い分け](coding-agent-selection.md) — この表を使う前の絞り込み軸
- [コーディングエージェントの評価](coding-agent-evaluation.md) — 絞り込み後の社内評価
- 各ツール別記事: [Claude Code](claude-code.md) / [OpenAI Codex](openai-codex.md) / [Gemini CLI と Code Assist](gemini-cli-and-code-assist.md) / [GitHub Copilot](github-copilot.md) / [Cursor](cursor.md) / [Windsurf](windsurf.md) / [Devin](devin.md) / [OSS 系](open-source-coding-agents.md)

## 参考資料

各セルの根拠は各ツール別記事の「参考資料」(すべてアクセス日: 2026-07-05)と、リポジトリ内 `research/coding-agents/` の調査メモ(出典 URL・確度付き)を参照してください。代表的な一次情報:

- [Claude Code Docs](https://code.claude.com/docs/en/overview)(アクセス日: 2026-07-05)
- [OpenAI Codex Docs](https://developers.openai.com/codex)(アクセス日: 2026-07-05)
- [Gemini Code Assist Docs](https://docs.cloud.google.com/gemini/docs/codeassist/overview)(アクセス日: 2026-07-05)
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)(アクセス日: 2026-07-05)
- [Cursor Docs](https://cursor.com/docs)(アクセス日: 2026-07-05)
- [Devin Docs](https://docs.devin.ai/)(アクセス日: 2026-07-05)

## TODO・未確認事項

### 変わりやすい項目(定点観測)

> **TODO(要確認):** 全表(特に「学習利用の既定」「プラン体系」)を四半期ごとに各公式ページで再確認し、行単位で最終確認日を更新する(最終確認: 2026-07)

> **TODO(要確認):** 「?」セル(Code Assist のサンドボックス・ロールバック、Jules の MCP、Gemini 個人向けの現行無料枠)を各公式ドキュメントで確認する(最終確認: 2026-07)

> **TODO(要確認):** preview / beta 段階の機能(Claude Code Web、Copilot サンドボックス、Devin Local、Jules)の GA 化を確認する(最終確認: 2026-07)
