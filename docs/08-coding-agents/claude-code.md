---
title: "Claude Code"
category: "coding-agents"
level: "basic"
status: "published"
last_updated: "2026-10-03"
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

> **最終確認日:** 承認モードと開始時の選択条件は 2026-10-03、self-hosted environments は 2026-09-10、その他は 2026-08-18 — 部分更新です。公式資料の読み合わせであり、実 Agent の起動試験は行っていません。主な出典は「参考資料」を参照してください。

### 概要

Claude Code は Anthropic が提供するコーディングエージェントです。ターミナル CLI を中核としつつ、2026 年時点では「同一エンジンに複数の面から接続する」構成に発展しています。5 分類([全体像](coding-agents-overview.md))では、ターミナル型を起点に、IDE 統合(拡張)・クラウド実行・GitHub 連携・SDK のすべてに面を持つツールです。

特徴は次の 3 点に集約されます。

- **権限システムが第一層** — 実行前に権限を照合し、選択されたモードとルールで、人への確認・自動許可・拒否を分けます。手動承認モードの動作と、どのモードで開始するかは別の仕様です
- **拡張機構の厚さ** — ルールファイル(CLAUDE.md)・フック・サブエージェント・スキル・プラグイン・MCP により、チーム標準を配布できます
- **エンジンの再利用性** — 同じエージェントを CLI・IDE・Web・CI・SDK から使え、設定・ルールが共通で機能します

### 提供形態と実行環境

| 面 | 内容 | 実行場所 |
| --- | --- | --- |
| CLI | `claude` コマンド。対話型 + 非対話(`-p`)実行 | ローカル |
| IDE 拡張 | VS Code 拡張(Cursor にも導入可)・JetBrains プラグイン | ローカル |
| デスクトップアプリ | セッション管理・diff レビュー用 GUI(macOS / Windows / Linux) | ローカル |
| Web + iOS(Claude Code on the web) | ブラウザからセッション作成・監視 | Anthropic 管理 VM、または自社実行基盤(public beta) |
| Remote Control | ローカルで実行中のセッションをブラウザ・スマホから操作 | ローカル(操作のみリモート) |
| CI 連携 | GitHub Actions・GitLab CI/CD、PR 自動レビュー、Slack 連携 | CI ランナー |
| Agent SDK | Python / TypeScript ライブラリとして同じエージェントループを組み込み | 任意 |

- 対応 OS は macOS / Windows(ネイティブ・WSL)/ 主要 Linux。2026-08 時点で Web 版は research preview 表記です
- Anthropic 管理のクラウド実行では全アウトバウンド通信がセキュリティプロキシを経由し、GitHub の実トークンはサンドボックス内に渡されません。セッション終了後に VM は破棄されます

**自社実行基盤(self-hosted environments)** は Team / Enterprise 向けの public beta で、既定は off、runner ホストに CLI v2.1.224 以降が必要です。runner は Linux / macOS に対応し、Windows ネイティブでは使えません(Windows 上では Linux コンテナを利用)。開発者の操作端末とは別の条件です。Web・アプリ・CLI・Routines から開始した cloud session を自社の runner へ送れます。リポジトリや生成ファイルは自社ホストに置けますが、会話・ツール結果は推論のため Anthropic API へ送られ、セッション履歴・キューも Anthropic 側で管理されます。外向き HTTPS が必要で、推論のオンプレミス化ではありません。ZDR 組織、Claude Security、Code Review は対象外です。

### リポジトリ理解・編集・実行の仕組み

- **リポジトリ理解**: 事前インデックスを作らず、ripgrep ベースのオンデマンド検索(グロブ・正規表現)で探索します(公式のアーキテクチャ説明に索引構築の工程は登場しません)。型付き言語ではコードインテリジェンスプラグイン(LSP 連携)を追加でき、シンボル単位の参照検索が可能になります
- **ファイル編集**: 編集前スナップショットによるチェックポイント機構があり、`/rewind` でファイル状態を巻き戻せます(git とは独立。外部作用は対象外)。IDE 拡張ではインライン diff でプレビューできます
- **コマンド実行**: Manual(`default`)では、事前許可のない操作に人への確認を求めます。読み取り専用コマンドや許可ルール等の例外があり、すべてを都度確認するわけではありません。`auto` は分類器による審査で通常の確認を減らします。開始モードの条件は次節を参照してください。バックグラウンド実行にも対応します
- **大規模リポジトリ対策**: サブディレクトリ CLAUDE.md のオンデマンド読込、パス限定ルール(`.claude/rules/` の `paths`)、探索のサブエージェント委譲(要約のみ本体へ)などで対応します

### 設定ファイルとカスタマイズ

- ルールファイルは **CLAUDE.md**。管理ポリシー → ユーザー → プロジェクト → ローカルの 4 階層が**連結**して読み込まれます(上書きではなく追記)
- **AGENTS.md は直接読み込みません**。`@AGENTS.md` インポートまたはシンボリックリンクでの共用が公式の推奨です(マルチツール環境では要注意。[ルールファイルと設定の設計](coding-agent-rules-and-config.md))
- `@import` 構文による分割、`.claude/rules/*.md` によるトピック別・パス限定ルール、自動メモリ(Claude 自身が学習メモを蓄積)があります
- 公式が明文化している使い分け: **技術的強制は managed settings(権限・サンドボックス)、行動指針は CLAUDE.md**。CLAUDE.md はコンテキストであり、権限を変える強制層ではありません

### 権限管理とセキュリティ

- **権限モード** は Manual(`default`)、`acceptEdits`、`plan`、`auto`、`dontAsk`、`bypassPermissions` の6種です。Manualは許可されていない操作に確認、autoは分類器レビューを使います。`auto` は安全性の保証ではなく、`bypassPermissions` を使うなら隔離環境が必要です。モードの動作と組み込み開始モードを区別します
- **OS サンドボックス**(macOS Seatbelt / Linux・WSL2 bubblewrap)を内蔵しますが**既定では無効**です。有効化すると境界内の Bash を自動実行に切り替えられます。ネイティブ Windows は非対応です。「権限 = 常時オン、サンドボックス = オプトイン」という関係を混同しないでください
- サンドボックスのネットワークはドメイン単位のデフォルト拒否 + 初回承認です。既定では TLS を終端しないため、公式自身が限界(広いドメイン許可は持ち出し経路になり得る)と、より強い保証にはカスタムプロキシ + TLS 検査を推奨することを明記しています
- 認証情報保護(`sandbox.credentials` による読取拒否・環境変数マスク)、WebFetch の隔離コンテキスト処理、コマンドインジェクション検出、fail-closed 照合などの防御があります
- **データ学習の既定はプランで正反対になり得ます**: Consumer(Free/Pro/Max)はユーザーの設定がオンだと学習に使用(保持 5 年、オフで 30 日)。Commercial(Team/Enterprise/API)は明示オプトインしない限り学習に**使用しません**(標準保持 30 日、Enterprise は ZDR の個別適用可)。組織導入ではこの差が選定の重要事実です

**開始モードの確認(2026-10-03)**。明示設定がない場合の組み込み既定は、公式 Permission modes の表を上から照合します。

| 条件 | 組み込み開始モード |
| --- | --- |
| いずれかの設定が `permissions.disableAutoMode: "disable"` | Manual(`default`) |
| `claude -p` / Agent SDK、機能フラグ取得あり | Manual |
| `claude -p` / Agent SDK、機能フラグ取得なし(例: 第三者プロバイダー/telemetry off) | v2.1.285以降はauto、以前はManual。組織がauto既定を制限する場合はManual |
| 対話端末 / VS Code | v2.1.283以降はプラン・プロバイダーを問わずauto。以前はPro/Max/Teamかつ機能フラグ取得ありでauto、それ以外はManual |

古い版で組み込みauto既定を使える最小版はmacOS/Linux/WSLでv2.1.228、ネイティブWindowsでv2.1.233です。さらにautoは対応モデル・プロバイダー・組織設定・サーバー側の提供条件を満たす必要があります。選ばれたautoが利用できない場合はManualへ戻ります。初回のインストール/更新直後は機能フラグの到着前に選択され、表と違う場合があるため、実セッションの表示を確認します。

端末は起動フラグ→設定の `permissions.defaultMode` →組み込み既定の順です。ただしプロジェクトの `.claude/settings.json` / `.claude/settings.local.json` に書いたautoは開始設定として効きません。VS Codeは通常、拡張の `claudeCode.initialPermissionMode` →直前に選択した対象モード→managed/userのdefaultMode→組み込み既定の順で、プロジェクト設定から開始モードを読みません。`claudeCode.claudeProcessWrapper` が設定されている場合は後ろ2項目を読まず、上位2項目がなければManualになります。Desktop/Webなど別の実行面と例外条件は公式の各タブで確認します。手動承認を必要とする組織では、既定を推測せず明示設定と起動後の表示で確認してください。

### 外部連携(MCP・CI・API)

- **MCP クライアント**: stdio / HTTP(streamable)/ SSE(非推奨)/ WebSocket に対応し、リモートサーバーの OAuth 認証も可能です。設定は local / project(`.mcp.json`)/ user の 3 層 + 組織 managed 構成で、プロジェクトスコープのサーバーは初回承認制です([MCP とツール接続標準](../03-implementation/mcp-and-tool-protocols.md))
- **フック**: ツール実行前後・セッション開始終了などのイベントでシェル・HTTP・サブエージェントを起動でき、権限判定の拡張(PreToolUse での deny/ask)にも使えます
- **GitHub Actions / GitLab CI**: Issue・PR の `@claude` メンションや自動レビューを CI 上で実行します
- **Agent SDK**: Claude Code と同じツール群・権限・フック・MCP を Python / TypeScript から利用できます(エージェントを「作る」側との接続点)

### チーム導入と提供プラン

- 認証経路はサブスクリプション(Pro / Max / Team / Enterprise)と API 従量(Console)、および Bedrock / Vertex / Foundry 経由があります。Free プランでは利用できません
- Team プランは standard / premium の両シート種別とも Claude Code を含みます(両者の差は使用量枠〔premium は standard の約 5 倍〕です。なお Enterprise で Web 版を利用するには premium seat が必要です)
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
- [ ] 実行面・版・機能フラグ・組織設定から開始モードを確認し、起動後の実表示とauto利用条件を照合したか
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

- [Self-hosted environments](https://code.claude.com/docs/en/self-hosted-environments) / [Quickstart](https://code.claude.com/docs/en/self-hosted-environments-quickstart) — public beta の対象・実行場所と推論通信の境界(アクセス日: 2026-09-10)

- [Claude Code Docs(公式)](https://code.claude.com/docs/en/overview) — 機能・提供形態の一次情報(アクセス日: 2026-08-18)
- [Permissions](https://code.claude.com/docs/en/permissions) — 権限ルールの仕様(アクセス日: 2026-07-05)
- [Permission modes](https://code.claude.com/docs/en/permission-modes) — Manual/autoの動作、実行面・版・機能フラグ・組織設定別の開始条件とfallback(アクセス日: 2026-10-03)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing) — サンドボックスの仕様と限界(アクセス日: 2026-07-05)
- [Data usage](https://code.claude.com/docs/en/data-usage) — データ保持・学習利用の既定(アクセス日: 2026-08-18)
- [料金ページ](https://claude.com/pricing) — プラン体系(アクセス日: 2026-08-18)
- [Anthropic Trust Center](https://trust.anthropic.com/) — コンプライアンス認証(アクセス日: 2026-07-05)

## TODO・未確認事項

### 変わりやすい項目(定点観測)

> **TODO(要確認):** Claude Code on the web(research preview)と Agent teams(experimental)のステータス変化を公式ドキュメントで確認する(2026-08-18確認: 両者とも継続。最終確認: 2026-08)

> **TODO(要確認):** autoの開始条件・対応モデル・組織制御・機能フラグとfallbackを公式 Permission modes で継続観測する。実セッションの表示と挙動は利用する版・実行面で確認する(最終確認: 2026-10)

> **TODO(要確認):** サブスクリプションの使用量制限の具体的構造・対象プランを公式ヘルプセンターで確認する(2026-08-18 確認: 5 時間窓 + 週次上限・チャット製品と共通プール・超過後 usage credits の構造に変更なし。数値は流動的なため本文には構造のみ記載。最終確認: 2026-08)
