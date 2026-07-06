---
title: "Claude Code"
category: "coding-agents"
level: "basic"
status: "published"
last_updated: "2026-07-06"
tags: ["coding-agents", "mcp"]
---

# Claude Code

## この記事の目的

Anthropic のコーディングエージェント Claude Code の提供形態・権限モデル・データ取り扱いを理解し、自分のチーム・用途に合うかを判断できるようになります。

> **注記(透明性):** 本ライブラリ自体が Claude Code を使って執筆されています。本記事は他ツールの記事と同じく公式情報のみを根拠とし、同じテンプレート・同じ基準で書いていますが、読者はこの点を踏まえて読んでください。

## 対象読者

- コーディングエージェントの候補として Claude Code を評価しているエンジニア
- ターミナル型エージェントの権限設計・チーム展開を検討しているテックリード

## 前提知識

- [AI コーディングエージェントの分類と全体像](coding-agents-overview.md)
- [コーディングエージェントの選定基準と使い分け](coding-agent-selection.md)

## 本文

> **最終確認日:** 2026-07-05 — 本記事の製品仕様・提供形態はこの日付時点の公式情報に基づきます。主な出典は「参考資料」を参照してください。

### 概要

Claude Code は Anthropic が提供するコーディングエージェントです。ターミナル CLI を中核としつつ、2026 年時点では「同一エンジンに複数の面から接続する」構成に発展しています。5 分類([全体像](coding-agents-overview.md))では、ターミナル型を起点に、IDE 統合(拡張)・クラウド実行・GitHub 連携・SDK のすべてに面を持つツールです。

特徴は次の 3 点に集約されます。

- **権限システムが第一層** — すべての編集・コマンド実行が承認制(既定)で、allow / ask / deny ルールで細かく制御できます
- **拡張機構の厚さ** — ルールファイル(CLAUDE.md)・フック・サブエージェント・スキル・プラグイン・MCP により、チーム標準を配布できます
- **エンジンの再利用性** — 同じエージェントを CLI・IDE・Web・CI・SDK から使え、設定・ルールが共通で機能します

### 提供形態と実行環境

| 面 | 内容 | 実行場所 |
| --- | --- | --- |
| CLI | `claude` コマンド。対話型 + 非対話(`-p`)実行 | ローカル |
| IDE 拡張 | VS Code 拡張(Cursor にも導入可)・JetBrains プラグイン | ローカル |
| デスクトップアプリ | セッション管理・diff レビュー用 GUI(macOS / Windows / Linux) | ローカル |
| Web + iOS(Claude Code on the web) | ブラウザからセッション作成・監視 | Anthropic 管理 VM(セッションごとに使い捨て) |
| Remote Control | ローカルで実行中のセッションをブラウザ・スマホから操作 | ローカル(操作のみリモート) |
| CI 連携 | GitHub Actions・GitLab CI/CD、PR 自動レビュー、Slack 連携 | CI ランナー |
| Agent SDK | Python / TypeScript ライブラリとして同じエージェントループを組み込み | 任意 |

- 対応 OS は macOS / Windows(ネイティブ・WSL)/ 主要 Linux。2026-07 時点で Web 版は research preview 表記です
- クラウド実行では全アウトバウンド通信がセキュリティプロキシを経由し、GitHub の実トークンはサンドボックス内に渡されません。セッション終了後に VM は破棄されます

### リポジトリ理解・編集・実行の仕組み

- **リポジトリ理解**: 事前インデックスを作らず、ripgrep ベースのオンデマンド検索(グロブ・正規表現)で探索します(公式のアーキテクチャ説明に索引構築の工程は登場しません)。型付き言語ではコードインテリジェンスプラグイン(LSP 連携)を追加でき、シンボル単位の参照検索が可能になります
- **ファイル編集**: 編集前スナップショットによるチェックポイント機構があり、`/rewind` でファイル状態を巻き戻せます(git とは独立。外部作用は対象外)。IDE 拡張ではインライン diff でプレビューできます
- **コマンド実行**: シェル実行は既定で承認制です。読み取り専用コマンド(`ls`・`git status` 等)は自動、複合コマンド(`&&` 等)はサブコマンドごとに独立して権限照合されます。バックグラウンド実行にも対応します
- **大規模リポジトリ対策**: サブディレクトリ CLAUDE.md のオンデマンド読込、パス限定ルール(`.claude/rules/` の `paths`)、探索のサブエージェント委譲(要約のみ本体へ)などで対応します

### 設定ファイルとカスタマイズ

- ルールファイルは **CLAUDE.md**。管理ポリシー → ユーザー → プロジェクト → ローカルの 4 階層が**連結**して読み込まれます(上書きではなく追記)
- **AGENTS.md は直接読み込みません**。`@AGENTS.md` インポートまたはシンボリックリンクでの共用が公式の推奨です(マルチツール環境では要注意。[ルールファイルと設定の設計](coding-agent-rules-and-config.md))
- `@import` 構文による分割、`.claude/rules/*.md` によるトピック別・パス限定ルール、自動メモリ(Claude 自身が学習メモを蓄積)があります
- 公式が明文化している使い分け: **技術的強制は managed settings(権限・サンドボックス)、行動指針は CLAUDE.md**。CLAUDE.md はコンテキストであり、権限を変える強制層ではありません

### 権限管理とセキュリティ

- **権限モード** は 6 種(既定の Manual = 都度承認、acceptEdits、plan = 読み取り専用、auto = research preview、dontAsk、bypassPermissions = 隔離環境専用)。ルールは allow / ask / deny で、評価順は deny → ask → allow 固定です
- **OS サンドボックス**(macOS Seatbelt / Linux・WSL2 bubblewrap)を内蔵しますが**既定では無効**です。有効化すると境界内の Bash を自動実行に切り替えられます。ネイティブ Windows は非対応です。「権限 = 常時オン、サンドボックス = オプトイン」という関係を混同しないでください
- サンドボックスのネットワークはドメイン単位のデフォルト拒否 + 初回承認です。既定では TLS を終端しないため、公式自身が限界(広いドメイン許可は持ち出し経路になり得る)と、より強い保証にはカスタムプロキシ + TLS 検査を推奨することを明記しています
- 認証情報保護(`sandbox.credentials` による読取拒否・環境変数マスク)、WebFetch の隔離コンテキスト処理、コマンドインジェクション検出、fail-closed 照合などの防御があります
- **データ学習の既定はプランで正反対になり得ます**: Consumer(Free/Pro/Max)はユーザーの設定がオンだと学習に使用(保持 5 年、オフで 30 日)。Commercial(Team/Enterprise/API)は明示オプトインしない限り学習に**使用しません**(標準保持 30 日、Enterprise は ZDR の個別適用可)。組織導入ではこの差が選定の重要事実です

### 外部連携(MCP・CI・API)

- **MCP クライアント**: stdio / HTTP(streamable)/ SSE(非推奨)/ WebSocket に対応し、リモートサーバーの OAuth 認証も可能です。設定は local / project(`.mcp.json`)/ user の 3 層 + 組織 managed 構成で、プロジェクトスコープのサーバーは初回承認制です([MCP とツール接続標準](../03-implementation/mcp-and-tool-protocols.md))
- **フック**: ツール実行前後・セッション開始終了などのイベントでシェル・HTTP・サブエージェントを起動でき、権限判定の拡張(PreToolUse での deny/ask)にも使えます
- **GitHub Actions / GitLab CI**: Issue・PR の `@claude` メンションや自動レビューを CI 上で実行します
- **Agent SDK**: Claude Code と同じツール群・権限・フック・MCP を Python / TypeScript から利用できます(エージェントを「作る」側との接続点)

### チーム導入と提供プラン

- 認証経路はサブスクリプション(Pro / Max / Team / Enterprise)と API 従量(Console)、および Bedrock / Vertex / Foundry 経由があります。Free プランでは利用できません
- Enterprise では SSO・ロールベース権限・コンプライアンス API・組織全体の managed policy settings が提供されます。managed settings は MDM 配布のほかサーバー配信(クラウドセッションにも適用)が可能で、`disableBypassPermissionsMode` などで危険なモードを組織的に禁止できます
- 監視は OpenTelemetry メトリクス、クラウドセッションの監査ログ、ワークスペース単位の支出上限などで行います
- 料金・使用量制限の具体値は変動が激しいため本記事には記載しません。公式料金ページ(参考資料)で確認してください。構造としては「定額プラン + 使用量上限(時間窓 + 週次、チャット製品と共通プール)+ 上限後の追加クレジット」です

### 代表的なユースケースと向き不向き

**公式が想定する用途**: テスト作成・lint 修正・マージコンフリクト解消・依存更新などの後回し作業の自動化、自然言語での機能実装・バグ修正、git / PR 操作、CI での自動レビュー、MCP 経由の社内ツール連携ワークフロー、CLI パイプによるスクリプト自動化、クラウドでの長時間・並列タスクです。

**向き不向き(特性として)**:

- 向く: ターミナル中心の開発者、権限を細かく統制したい組織、チーム標準(ルール・スキル・フック)を配布したい場合、既存 IDE を変えたくないチーム
- 注意が要る: 専用 IDE の GUI 体験(補完・タブ操作)を求める場合は主目的と異なります。ネイティブ Windows でサンドボックスを前提にする構成は組めません(WSL2 が必要)。Anthropic モデル前提のため、モデル選択の自由度を最優先する場合は BYOK 型の検討が必要です

## 実務での注意点

### アンチパターン

- **CLAUDE.md に権限制御を書いて安心する** — CLAUDE.md は行動指針(コンテキスト)であり強制層ではありません。→ 禁止事項は権限ルール(deny)・managed settings・フックで技術的に強制します
- **`bypassPermissions` を通常の開発機で常用する** — 承認という第一層を外した状態は、インジェクション成立時に無防備です。→ 使うなら隔離環境(コンテナ・使い捨て VM)に限定します
- **AGENTS.md を置いただけで Claude Code にも効いていると思い込む** — 直接は読み込まれません。→ `@AGENTS.md` インポートかシンボリックリンクを設定します

### チェックリスト

- [ ] 契約プラン(Consumer / Commercial)のデータ学習・保持の既定を確認したか
- [ ] 自動承認(acceptEdits・サンドボックス auto-allow)の範囲が可逆な操作に限定されているか
- [ ] `~/.ssh`・認証情報ファイルが読み取り除外(deny・`sandbox.credentials`)されているか
- [ ] 組織導入で managed settings(危険モードの禁止・MCP 制限)を配布したか
- [ ] マルチツール環境でルールファイルの正本(AGENTS.md ⇔ CLAUDE.md)の同期方法を決めたか

## 関連トピック

- [Claude Code 実践ガイド](claude-code-in-practice.md) — 導入後の使いこなし(スキル・サブエージェント・コスト削減・自動化)
- [主要コーディングエージェント比較](coding-agents-comparison.md) — 他ツールとの横断比較
- [ルールファイルと設定の設計](coding-agent-rules-and-config.md) — CLAUDE.md の内容設計
- [コーディングエージェントの権限とセキュリティ](coding-agent-security.md) — 権限モデル設計の一般論
- [MCP とツール接続標準](../03-implementation/mcp-and-tool-protocols.md) — MCP 連携の仕組み

## 参考資料

- [Claude Code Docs(公式)](https://code.claude.com/docs/en/overview) — 機能・提供形態の一次情報(アクセス日: 2026-07-05)
- [Permissions](https://code.claude.com/docs/en/permissions) — 権限モデルの仕様(アクセス日: 2026-07-05)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing) — サンドボックスの仕様と限界(アクセス日: 2026-07-05)
- [Data usage](https://code.claude.com/docs/en/data-usage) — データ保持・学習利用の既定(アクセス日: 2026-07-05)
- [料金ページ](https://claude.com/pricing) — プラン体系(アクセス日: 2026-07-05)
- [Anthropic Trust Center](https://trust.anthropic.com/) — コンプライアンス認証(アクセス日: 2026-07-05)

## TODO・未確認事項

### 変わりやすい項目(定点観測)

> **TODO(要確認):** Claude Code on the web(research preview)と権限モード `auto`(research preview)・Agent teams(experimental)のステータス変化を公式ドキュメントで確認する(最終確認: 2026-07)

> **TODO(要確認):** サブスクリプションの使用量制限の具体的構造・対象プランを公式ヘルプセンターで確認する(数値は流動的なため本文には構造のみ記載。最終確認: 2026-07)

> **TODO(要確認):** Team プランのシート種別(standard / premium)と Claude Code 利用可否の対応関係を公式料金ページで確認する(最終確認: 2026-07)
