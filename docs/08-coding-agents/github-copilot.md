---
title: "GitHub Copilot"
category: "coding-agents"
level: "basic"
status: "published"
last_updated: "2026-07-06"
tags: ["coding-agents", "mcp"]
---

# GitHub Copilot

## この記事の目的

GitHub Copilot の多層的な機能群(補完 / Chat / エージェントモード / cloud agent / code review / CLI)を正確に区別し、権限・データ取り扱い・課金の観点から自分のチーム・用途に合うかを判断できるようになります。

## 対象読者

- GitHub を SCM として利用中で、Copilot のエージェント機能の導入を検討しているチーム
- 「Copilot = 補完ツール」の認識のままで、2026 年時点の機能群を再評価したいエンジニア

## 前提知識

- [AI コーディングエージェントの分類と全体像](coding-agents-overview.md)
- [コーディングエージェントの選定基準と使い分け](coding-agent-selection.md)

## 本文

> **最終確認日:** 2026-07-05 — 本記事の製品仕様・提供形態はこの日付時点の公式情報に基づきます。主な出典は「参考資料」を参照してください。

### 概要

GitHub Copilot は、コード補完から始まり、2026 年時点では GitHub プラットフォーム全体に組み込まれた機能群に発展しています。5 分類([全体像](coding-agents-overview.md))では、IDE 統合型・GitHub 連携型・クラウド実行型・ターミナル型(CLI)のすべてに面を持ちます。

執筆時点で押さえるべき 2026 年上半期の変化が 3 つあります。

1. **名称変更**: 非同期エージェント「Copilot coding agent」は「**Copilot cloud agent**」に改称されました(2026-04)
2. **課金変更**: プレミアムリクエスト制は「**GitHub AI Credits**」(トークン量 × 各モデルのレートで消費するクレジット制)に置き換わりました(2026-06)。補完は有料プランで無制限のままです
3. **学習ポリシー変更**: 2026-04-24 から **Free / Pro / Pro+ の対話データは既定でモデル学習に利用**されます(オプトアウト方式)。Business / Enterprise は契約で学習利用が禁止されており対象外です

### 提供形態と実行環境

機能名が似ていて混同しやすいため、公式名称で整理します。

| 機能 | 実行場所 | トリガー | 備考 |
| --- | --- | --- | --- |
| コード補完 / Next edit suggestions | IDE 内 | 入力中 | AI Credits を消費しない(有料プランで無制限) |
| Copilot Chat | IDE / GitHub.com / Mobile | 質問 | ask / edit / agent のモードを持つ |
| エージェントモード | IDE 内(同期・対話的) | チャットでモード選択 | 編集は Keep / Undo、コマンドは承認制 |
| **Copilot cloud agent** | GitHub Actions 上の使い捨て環境(非同期) | Issue 割当・`@copilot`・外部連携・REST API | `copilot/` ブランチ + PR。1 セッション最大 59 分 |
| Copilot code review | GitHub.com(+ 主要 IDE) | レビュアー指定 / 自動レビュー設定 | 依存管理ファイル・ログ・SVG は対象外 |
| Copilot CLI | ローカルターミナル | `copilot` コマンド | エージェント型 CLI。GitHub MCP server 内蔵 |

- 対応 IDE は VS Code / Visual Studio / JetBrains / Xcode / Eclipse など広範です(機能ごとに対応状況が異なります)
- cloud agent の起動は Issue 割当・PR メンションに加え、Jira / Linear / Slack / Teams / Azure Boards 連携、スケジュール起動、REST API に対応します
- ローカル / クラウドのサンドボックスが public preview で追加されています(2026-06)

### リポジトリ理解・編集・実行の仕組み

- **リポジトリ理解**: リポジトリは**自動でインデックス**されます(設定不要、差分更新)。cloud agent は grep 系検索に加えて**セマンティック検索**を併用すると公式に明記されています。インデックスされたリポジトリは学習には使われません
- **ファイル編集**: IDE エージェントモードは編集単位の Keep / Undo と、VS Code のチェックポイント(スナップショットからの巻き戻し)を持ちます。cloud agent の変更は `copilot/` ブランチと PR に閉じるため、PR の却下がロールバック手段です
- **コマンド実行**: IDE・CLI とも承認制が既定です。cloud agent は Actions 環境内でテスト・リンターを実行できますが、**Copilot が push したコードでワークフローは既定で自動起動せず**、人が「Approve and run workflows」を押すまで実行されません

### 設定ファイルとカスタマイズ

- リポジトリ全体の指示は `.github/copilot-instructions.md`(Chat・cloud agent・code review に適用)、パス別指示は `.github/instructions/*.instructions.md`(`applyTo` グロブ)です
- **AGENTS.md に対応**しています(作業ファイルに最も近いものが優先。CLI はルートの AGENTS.md を主指示として扱います)。さらに **`CLAUDE.md` / `GEMINI.md`(ルートのみ)も cloud agent が読みます** — 他ツールからの移行・併用がしやすい設計です
- 指示の優先順位は「個人 > リポジトリ > 組織」です
- そのほか Prompt files・Agent Skills・カスタムエージェント・Copilot Spaces・Copilot Memory(preview)などのカスタマイズ機構があります

### 権限管理とセキュリティ

- **CLI**: 実行前承認が既定で、`--allow-tool` / `--deny-tool` による許可・拒否リスト、計画を先に出す plan モードがあります
- **cloud agent の権限境界**は多層です: push は `copilot/` ブランチのみ、**依頼者は Copilot の PR を自分で承認できない**(レビュー統制の維持)、ブランチ保護の適用、ワークフロー実行の人手ゲート、**ファイアウォールによるインターネットアクセス制限**(組織で強制可能)、生成コードの CodeQL・secret scanning・依存関係分析による自動チェック
- **コンテンツ除外(content exclusion)の重要な注意**: Business / Enterprise で設定できる除外パスは補完と Chat では尊重されますが、**IDE の Edit・Agent モードは 2026-07 時点で未対応、cloud agent は除外ファイルも見えて更新できる**と公式に明記されています。「除外設定があるから安全」とは言えません
- **データ学習の既定**: Free / Pro / Pro+ は既定で学習利用(オプトアウト可)、Business / Enterprise は契約で禁止。学習データは Microsoft を含むグループ会社と共有されえますが、サードパーティ AI プロバイダーには共有されません
- 公開コード一致フィルター(候補を公開コードと突合して非表示にする Block 設定)がありますが、**cloud agent は Block 設定でも一致コードを生成しうる**(ログに一致情報を表示)点に注意が必要です

### 外部連携(MCP・CI・API)

- MCP クライアントは IDE 各種・CLI で利用でき、**GitHub.com 上の MCP 設定は cloud agent と code review の両方に適用**されます。cloud agent には GitHub MCP server と Playwright MCP server が既定で有効です
- 組織は「MCP servers in Copilot」ポリシーで制御できます(適用は Business / Enterprise のシート保有者のみ。また Cursor 等サードパーティアプリからの GitHub MCP server 利用はこのポリシーの対象外です)
- GitHub 上で**サードパーティのコーディングエージェント(Claude・Codex)を有効化**する仕組み(public preview)があり、GitHub がエージェントの実行プラットフォームになる方向性が見えます
- cloud agent の REST API、利用状況メトリクス API(cloud agent のアクティブユーザー集計)があります

### チーム導入と提供プラン

- プランは Free / Student / Pro / Pro+ / Max / Business / Enterprise の 7 種です(2026-07 時点)。具体額と AI Credits 付与量は変動が激しいため公式料金ページ(参考資料)で確認してください
- 課金は「シート + AI Credits(トークン量 × 各モデルのレートで消費)」の構造です。補完・Next edit suggestions は Credits を消費しません。自動 code review の消費は **PR 作成者に帰属**します。超過時は管理者の予算制御に従います(旧制度のような低性能モデルへの自動フォールバックは廃止)
- 組織管理は Policies タブ(機能可用性・preview 機能・MCP・サードパーティエージェント)と Models タブで行い、**エンタープライズのポリシーは組織側で上書きできません**。監査ログ・利用メトリクスも GitHub 標準の仕組みに統合されています

### 代表的なユースケースと向き不向き

**公式が想定する用途**: cloud agent はリポジトリ調査・実装計画・バグ修正・機能実装・テストカバレッジ改善・技術的負債対応、code review は人のレビュー前の多角的チェック(公式自身が「すべての問題を見つける保証はない。フィードバックは必ず検証を」と明記)、CLI はターミナルからの GitHub 操作・コード作業です。

**向き不向き(特性として)**:

- 向く: GitHub 中心の開発フロー(Issue → PR → レビューにエージェントが自然に組み込まれる)、既存の GitHub 組織管理(シート・監査・ポリシー)に統合したい組織、補完からエージェントまで 1 契約で段階導入したいチーム
- 注意が要る: GitHub 以外の SCM では価値が大きく下がります。コンテンツ除外がエージェント系機能で効かない点は機密領域があるリポジトリで要検討です。個人プラン(Free/Pro/Pro+)の学習利用の既定は 2026-04 に変わったため、個人利用者は設定確認が必要です

## 実務での注意点

### アンチパターン

- **旧名称・旧制度の知識で設計する** — coding agent(現 cloud agent)・プレミアムリクエスト(現 AI Credits)・学習ポリシーはすべて 2026 年上半期に変わりました。→ 直近の公式 Changelog を確認してから導入設計します
- **コンテンツ除外を機密保護として過信する** — Edit / Agent モードと cloud agent には効きません。→ 機密ファイルはリポジトリ分離・権限設計([権限とセキュリティ](coding-agent-security.md))で守ります
- **cloud agent のワークフロー自動実行を安易に有効化する** — 人手ゲートは生成コードが CI 権限で走ることへの防御層です。→ 無効化する場合は CI トークンのスコープと保護ルールを先に確認します

### チェックリスト

- [ ] 個人プラン利用者の学習利用オプトアウト設定を確認したか(組織プランなら契約上対象外であることを確認したか)
- [ ] コンテンツ除外が効かない機能(Edit / Agent / cloud agent)を前提にした機密管理になっているか
- [ ] cloud agent のファイアウォール・ワークフロー承認ゲートを組織ポリシーで管理しているか
- [ ] AI Credits の予算制御(管理者側の上限)を設定したか
- [ ] AGENTS.md / copilot-instructions.md の使い分けと優先順位(個人 > リポジトリ > 組織)を理解して配置したか

## 関連トピック

- [主要コーディングエージェント比較](coding-agents-comparison.md) — 他ツールとの横断比較
- [ルールファイルと設定の設計](coding-agent-rules-and-config.md) — copilot-instructions.md / AGENTS.md の内容設計
- [コーディングエージェントの権限とセキュリティ](coding-agent-security.md) — CI 上で動くエージェントの権限設計
- [チーム導入とレビュー体制](coding-agent-team-adoption.md) — シート管理・ポリシー展開の一般論

## 参考資料

- [GitHub Copilot features](https://docs.github.com/en/copilot/get-started/features) — 機能群の一次情報(アクセス日: 2026-07-05)
- [About Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) — 非同期エージェントの仕様と制約(アクセス日: 2026-07-05)
- [Risks and mitigations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations) — cloud agent のセキュリティ設計(アクセス日: 2026-07-05)
- [学習ポリシー変更の告知](https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/) — 2026-04-24 発効の内容(アクセス日: 2026-07-05)
- [AI Credits への移行告知](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) — 課金制度の一次情報(アクセス日: 2026-07-05)
- [Copilot plans(料金)](https://github.com/features/copilot/plans) — プラン体系(アクセス日: 2026-07-05)
- [GitHub Copilot Trust Center](https://copilot.github.trust.page/) — コンプライアンス情報の参照先(アクセス日: 2026-07-05)

## TODO・未確認事項

- Trust Center 記載の個別認証(SOC / ISO)と IP 補償の適用条件、プロンプト保持期間、大規模リポジトリのインデックス制約値は未確認です

### 変わりやすい項目(定点観測)

> **TODO(要確認):** AI Credits のプラン別付与量と料金を公式料金ページで確認する(2026-04 の発表値から既に増額されており変動が速い。最終確認: 2026-07)

> **TODO(要確認):** preview 段階の機能群(サンドボックス・Copilot Memory・サードパーティエージェント・Spark・Agentic workflows)のステータス変化を Changelog で確認する(最終確認: 2026-07)

> **TODO(要確認):** コンテンツ除外の Edit / Agent モード対応状況の変化を公式ドキュメントで確認する(最終確認: 2026-07)
