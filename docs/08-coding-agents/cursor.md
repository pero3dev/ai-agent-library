---
title: "Cursor"
category: "coding-agents"
level: "basic"
status: "published"
last_updated: "2026-09-10"
tags: ["coding-agents", "mcp"]
---

# Cursor

## この記事の目的

専用 IDE 型コーディングエージェントの代表である Cursor(Anysphere)の、インデックス方式・権限モデル・データ取り扱いを理解し、自分のチーム・用途に合うかを判断できるようになります。専用 IDE という形態の含意(移行コスト・データの流れ)を評価できることが目標です。

## 対象読者

- 専用 IDE 型のコーディングエージェントを検討しているエンジニア
- Cursor の組織導入でデータ取り扱い(Privacy Mode・インデックス)の評価を行う担当者

## 前提知識

- [AI コーディングエージェントの分類と全体像](coding-agents-overview.md)
- [コーディングエージェントの選定基準と使い分け](coding-agent-selection.md)

## 本文

> **最終確認日:** Data Use、self-hosted machines、Origin・subscriptions は 2026-09-10、その他は 2026-08-18 — 本記事の製品仕様・提供形態はこの日付時点の公式情報に基づきます。主な出典は「参考資料」を参照してください。

### 概要

Cursor は Anysphere が提供する専用 IDE 型のコーディングエージェントです。VS Code のコードベースを基にした独立 IDE を中核に、CLI・クラウド実行(Cloud Agents)・PR レビュー(Bugbot)へ面を広げています。5 分類([全体像](coding-agents-overview.md))では IDE 統合型(専用 IDE)を中心に、ターミナル型・クラウド実行型・GitHub 連携型を持ちます。

特徴は次の 3 点です。

- **事前インデックス方式のリポジトリ理解** — コードを埋め込み(ベクトル)化してセマンティック検索する方式の代表例です
- **マルチモデル** — OpenAI / Anthropic / Gemini / xAI のモデルと自社モデル(Composer 系)を切り替えられます
- **編集体験への投資** — Tab 補完・インライン編集・Agent の統合など、IDE ならではの操作性が中心的価値です

### 提供形態と実行環境

| 面 | 内容 | 実行場所 |
| --- | --- | --- |
| Cursor IDE | 専用 IDE(VS Code コードベース由来)。拡張・設定・キーバインドのインポート可 | ローカル |
| CLI(`agent`) | 対話 + 非対話(print)モード。CI 利用を公式が明記 | ローカル / CI |
| Cloud Agents | 隔離 VM で並列実行。self-hosted machines も選択可能(旧称: background agents) | Cursor のクラウド / 自社実行基盤 |
| Web / モバイル | cursor.com/agents から Cloud Agents を操作(iOS アプリあり) | クラウド |
| Bugbot | PR の自動レビュー。GitHub(GitHub Enterprise Server 含む)/ GitLab(Self-Hosted 含む)/ Bitbucket(Data Center 含む)/ Azure DevOps(限定提供)の 4 プラットフォームに対応 | クラウド |
| Automations / SDK | スケジュール・トリガー起動、TypeScript / Python SDK | クラウド / 任意 |

対応 OS は macOS / Windows / Linux です。Cursor 管理の Cloud Agents の環境は `.cursor/environment.json`(スナップショット / Dockerfile)で定義します。2026-09-02 には self-hosted machines が追加され、My Machines や team pool から自社ホストを使う経路も選べます。これはツール実行場所の選択であり、モデル通信がオンプレミスになることを意味しません。

### リポジトリ理解・編集・実行の仕組み

- **リポジトリ理解(この製品の要)**: コードを意味のある単位に分割してベクトル埋め込み化し、Cursor 側のベクトルデータベースに保存する**事前インデックス方式**です。データの流れは次の 3 点で整理できます: ①埋め込みとメタデータ(ハッシュ・暗号化されたファイルパス)はサーバーに保存される ②インデックス処理のコード平文は恒久保存されない ③Cloud Agents のチェックアウトに加え、遅延削減用の**暗号化された一時ファイルキャッシュ**もサーバーにあります(クライアント生成鍵は要求中のみサーバーに存在)。「コード保存は Cloud Agents だけ」とは整理できません。`.gitignore` / `.cursorignore` のファイルはインデックス対象外で、モノレポでは `.cursorignore` による絞り込みが公式推奨です
- **ファイル編集**: 複数ファイル編集と diff ビュー、大きな変更前に自動作成されるチェックポイント(git とは独立、チャットのタイムラインから復元)があります
- **コマンド実行**: 既定で承認制です。承認の中心概念は **Run Modes** の 3 種(Cursor 3.6 以降): Auto-review(推奨既定。許可リスト内は即実行、その他はサンドボックス実行または LLM 分類器が判定)/ Allowlist(許可リストのみ自動)/ Run Everything(全自動)。なお旧称「YOLO モード」は現行ドキュメントには存在しません

### 設定ファイルとカスタマイズ

- プロジェクトルールは `.cursor/rules/*.mdc`(frontmatter で Always / Intelligently / glob / Manual の 4 適用モードを指定)です。**AGENTS.md にも対応**しており、ルート・サブディレクトリに置いて階層的に結合されます(深い階層が優先)
- ルールは **Team Rules(組織ダッシュボードで集中管理・強制可)→ Project Rules → User Rules** の 3 層で、Team が最優先です
- Bugbot 専用のレビュー観点ファイル `.cursor/BUGBOT.md`、CLI 用の設定・権限ファイル(`~/.cursor/cli-config.json` 等)、フック(`hooks.json`。エージェントループの観測・ブロック・変更)、Teams プランの社内マーケットプレイス(ルール・スキル配布)があります

### 権限管理とセキュリティ

- 読み取り・検索は承認不要、状態を変える操作は Run Modes に従います。**ネットワークは既定で制限**されており(GitHub・Web 検索等のみ)、任意の宛先への通信はできません
- サンドボックスは macOS = Seatbelt、Linux = Landlock + seccomp です(Windows の対応は公式ドキュメントで未確認)。ワークスペース内のみ読み書き可、`.git/` と Cursor 設定ファイルは保護されます
- **公式自身が「許可リスト・ガードレールはベストエフォートであり、ハードなセキュリティ境界ではない」と明記**しています。プロンプトインジェクションによる回避可能性まで公式が言及している点は誠実であり、利用側はこの前提で権限を設計すべきです([権限とセキュリティ](coding-agent-security.md))
- **データ学習の既定は Privacy Mode に依存します**: 無効時はコード・プロンプト等を学習・改善に利用し得ます。有効時は Cursor が学習に使わず、モデルプロバイダーとは ZDR 契約があります。ただし 2026-09-03 更新の Data Use は、不正検知でフラグが立った入出力の調査目的の保持と、非 ZDR モデルの表示または管理者 opt-in を明記しています。学習不使用、通常時の保持方針、安全性審査の例外を分けて確認します。Enterprise は Privacy Mode を既定オンにし、無効化を禁止できます
- Privacy Mode でも推論用のコード送信は行われます。**BYOK も最終プロンプトを組み立てる Cursor backend 経由**です。通信経路と、学習・保持の条件を別々に評価します
- コンプライアンスは SOC 2 Type II、GDPR(DPA)、HIPAA BAA(Enterprise)、顧客管理暗号鍵(CMEK)等が公表されています

### 外部連携(MCP・CI・API)

- **MCP クライアント**: stdio / SSE / Streamable HTTP の 3 トランスポート + OAuth。設定は `.cursor/mcp.json`(プロジェクト)と `~/.cursor/mcp.json`(グローバル)。既定では MCP 接続とツール呼び出しの両方が承認制です
- 2026-08-27 の Origin の開始方法では、SCM(ソースコード管理)を接続せずに作業を始め、後からリポジトリを作れます。2026-08-19 の subscriptions は Cloud Agents が PR・Slack スレッド・スケジュールを監視して再開する機能です。起動条件だけでなく終了条件・CI・レビューの責任を決めて使います
- Slack / Linear / GitHub / Bitbucket の `@cursor` メンションから Cloud Agents を起動でき、API からのプログラム起動、CLI の CI 組み込み、Automations(定期実行)があります
- Cursor SDK(TypeScript / Python)でカスタムエージェント・カスタムツールを構築できます

### チーム導入と提供プラン

- 個人プランは Hobby(無料)/ Pro / Pro+ / Ultra、チームは Teams(Standard / Premium)/ Enterprise です
- 課金は「シート + 含有利用枠、超過はオンデマンド従量(API 価格)」の構造です。オンデマンドは明示的な有効化と支出上限の設定が可能で、Cloud Agents・Bugbot は従量です。具体額は公式料金ページ(参考資料)で確認してください
- 組織統制は SAML / OIDC SSO(Teams)、SCIM・監査ログ・リポジトリ / モデルアクセス制御・MDM・Admin API(Enterprise)、Privacy Mode の組織強制、Run Modes・サンドボックス規則の集中管理(チーム設定が個人設定に優先)です

### 代表的なユースケースと向き不向き

**公式ポジショニング**: 「タスクを Cursor に委任し、人は意思決定に集中する」— Tab 補完から Cloud Agents への委任まで、IDE を中心に段階的に自律性を上げる使い方です。

**向き不向き(特性として)**:

- 向く: エディタ体験(補完 + インライン編集 + Agent の統合)を重視する開発者、複数ベンダーのモデルを使い分けたいチーム、セマンティック検索による大規模コード探索に価値を感じる場合
- 注意が要る: **専用 IDE への移行が前提**です(VS Code からの設定移行機能はありますが、組織の標準 IDE ポリシーとの整合が要ります)。インデックス方式は埋め込み・メタデータのサーバー保存を伴うため、データ持ち出しの制約が厳しい組織では Privacy Mode を含めた評価が必須です。Cloud Agents のチェックアウト、一時ファイルキャッシュ、安全性調査時の保持をそれぞれ確認します

## 実務での注意点

### アンチパターン

- **Privacy Mode を確認せずに個人プランで業務コードを扱う** — 無効時は学習利用が既定です。→ 業務利用は Privacy Mode 有効化(組織なら強制)を導入条件にします
- **Run Everything(全自動)を通常環境で常用する** — 公式が「ガードレールはハード境界ではない」と明記している以上、全自動はサンドボックス・隔離環境とセットで使うべきです
- **旧称(YOLO・background agents)の情報で設定を探す** — 現行は Run Modes / Cloud Agents に再編されています。→ 現行ドキュメントの概念で確認します

### チェックリスト

- [ ] Privacy Mode の状態(個人: 手動有効化 / Enterprise: 既定オン + 強制)を確認したか
- [ ] インデックスのデータフロー(埋め込み・一時キャッシュ・Cloud Agents のチェックアウト・保持例外)を組織のデータポリシーと突き合わせたか
- [ ] Run Mode の既定(Auto-review)と許可リストの内容をチームで統一したか
- [ ] `.cursorignore` で機密・不要領域をインデックスから除外したか
- [ ] オンデマンド課金の支出上限を設定したか

## 関連トピック

- [主要コーディングエージェント比較](coding-agents-comparison.md) — 他ツールとの横断比較
- [ルールファイルと設定の設計](coding-agent-rules-and-config.md) — .cursor/rules と AGENTS.md の使い分け
- [コーディングエージェントの権限とセキュリティ](coding-agent-security.md) — 「ベストエフォートなガードレール」を前提とした権限設計
- [Windsurf](windsurf.md) — 同じ専用 IDE 型の対抗製品

## 参考資料

- [Cursor changelog](https://cursor.com/changelog) — self-hosted machines、Origin、subscriptions(アクセス日: 2026-09-10)
- [Self-hosted integrations](https://cursor.com/docs/cloud-agent/self-hosted/integrations) — My Machines と team pool(アクセス日: 2026-09-10)

- [Cursor Docs(公式)](https://cursor.com/docs) — 機能・設定の一次情報(アクセス日: 2026-08-18)
- [Codebase Indexing](https://cursor.com/docs/context/codebase-indexing) — インデックス方式とデータの流れ(アクセス日: 2026-07-05)
- [Run Modes](https://cursor.com/docs/agent/security/run-modes) — 承認モデルとサンドボックスの仕様(アクセス日: 2026-08-18)
- [Bugbot](https://cursor.com/docs/bugbot) — PR 自動レビューの対応プラットフォーム(アクセス日: 2026-08-18)
- [Data Use](https://cursor.com/data-use) — 2026-09-03 更新の学習・保持例外・BYOK・一時キャッシュ(アクセス日: 2026-09-10)
- [Security](https://cursor.com/security) — コンプライアンス認証・インフラ(アクセス日: 2026-07-05)
- [料金ページ](https://cursor.com/pricing) — プラン体系(アクセス日: 2026-08-18)

## TODO・未確認事項

- Windows でのサンドボックス対応、リポジトリサイズの明示的上限、個人新規登録時の Privacy Mode 初期値は公式情報で確認できていません(未確認)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** プラン構成(Pro / Pro+ / Ultra、Teams Standard / Premium)と含有利用枠を公式料金ページで確認する(2026-08-18 確認: 構成に変更なし。インド限定の低価格プラン Cursor Start が 2026-07-28 に新設されたがグローバル構成は不変。最終確認: 2026-08)

> **TODO(要確認):** Run Mode と非 ZDR モデルの表示・管理者 opt-in、保持ポリシーの変化を公式ドキュメント・Data Use で確認する。2026-09-10 に保持例外と一時キャッシュを反映済み。Run Mode の既定は 2026-08 の確認範囲であり、個別モデルの保持期間は採用時に確認する(最終確認: 2026-09)

> **TODO(要確認):** Cursor SDK の機能範囲(2026-06 に大幅更新)と Bugbot の課金方式を確認する(2026-08-18 確認: SDK の 2026-06 以降の変化は一次情報で確認できず。Bugbot の対応プラットフォームは 4 つへの拡大を確認し本文へ反映済み。最終確認: 2026-08)
