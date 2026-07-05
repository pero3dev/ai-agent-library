---
title: "Gemini CLI と Gemini Code Assist"
category: "coding-agents"
level: "basic"
status: "published"
last_updated: "2026-07-06"
tags: ["coding-agents", "mcp"]
---

# Gemini CLI と Gemini Code Assist

## この記事の目的

Google のコーディングエージェント群 — Gemini CLI(OSS のターミナル型)・Gemini Code Assist(IDE 拡張 + GitHub PR レビュー)・Jules(非同期クラウド型)— の関係と役割分担を理解し、自分のチーム・用途に合うかを判断できるようになります。3 製品の関係は読者が最も混乱しやすいポイントであり、本記事はその整理を主眼とします。

## 対象読者

- Google Cloud / Google Workspace を利用中で、コーディングエージェントも Google 製品で揃えるか検討しているチーム
- Gemini CLI・Code Assist・Jules の違いが分からず選べないエンジニア

## 前提知識

- [AI コーディングエージェントの分類と全体像](coding-agents-overview.md)
- [コーディングエージェントの選定基準と使い分け](coding-agent-selection.md)

## 本文

> **最終確認日:** 2026-07-05 — 本記事の製品仕様・提供形態はこの日付時点の公式情報に基づきます。主な出典は「参考資料」を参照してください。

### 概要

Google のコーディングエージェントは 1 つの製品ではなく、**3 つの独立した製品**です。

| | Gemini CLI | Gemini Code Assist | Jules |
| --- | --- | --- | --- |
| 形態 | OSS(Apache-2.0)のターミナル型 | IDE 拡張 + GitHub PR レビュー | 非同期クラウド型(VM 実行) |
| 入口 | シェル(CLI) | IDE・GitHub PR | Web アプリ・CLI(Jules Tools)・REST API |
| 実行場所 | ローカル | ローカル IDE(推論はクラウド) | Google 管理の使い捨て VM |
| 契約(2026-07 時点) | Code Assist ライセンス、または有料 API キー / Vertex AI | Standard / Enterprise(組織向けシート課金)のみ | 個人向け Google AI プラン(Free / Pro / Ultra) |

3 製品は連動もしています: Code Assist のライセンスには Gemini CLI の利用クォータが含まれ、Code Assist の agent mode は Gemini CLI をベースにしています(公式ドキュメントの記載からの整理)。一方 Jules は契約体系が独立した別製品です。

**2026 年の最重要変化**: 2026-06-18 に個人向け提供が再編されました。**個人無料版(Gemini Code Assist for individuals)と、Google AI Pro / Ultra 経由の Gemini CLI・Code Assist IDE 拡張の利用は提供終了**し、個人向けの移行先として **Antigravity ファミリー(Antigravity CLI を含む)** が案内されています。「Gemini CLI は個人アカウントで無料枠が使える」という 2026 年前半までの情報は、すでに正しくありません(公式リポジトリの README には旧記載が残っていますが、廃止告知ページが正です)。

### 提供形態と実行環境

- **Gemini CLI**: ローカルのターミナルで動作します。npm / Homebrew 等でインストールし、コードは Apache-2.0 で公開されています
- **Gemini Code Assist**: VS Code / JetBrains / Android Studio / Cloud Shell / Cloud Workstations の拡張として動作します。agent mode はローカルのファイルシステム・ターミナルへのアクセス権を持ちます。GitHub PR レビューはクラウドサービスとして動作します(enterprise 版は Preview、consumer 版は 2026-07-17 にサンセット予定)
- **Jules**: タスクごとに Google のクラウド上の短命 Ubuntu VM でリポジトリをクローンして実行します。セットアップスクリプトの検証後に環境スナップショットが保存され、以降のタスクで再利用されます。対応 SCM は GitHub のみです

### リポジトリ理解・編集・実行の仕組み

- **Gemini CLI**: ファイル操作・シェル・検索ツールによるオンデマンド探索型です(事前インデックスの言及なし)。checkpointing(会話とファイル状態の保存・復元)を持ちます
- **Code Assist**: Standard 以上でローカルコードベース認識、**Enterprise 限定で code customization**(GitHub / GitLab / Bitbucket のプライベートリポジトリを接続し、組織のコードに提案を適応させるリモートインデックス)が使えます。ツール間で珍しい「組織コード全体への適応」機能です
- **Jules**: 「プロンプト → 計画の提示 → **人が計画を承認** → VM 内で変更 → diff 提示 → PR 作成」という計画承認型のワークフローです

### 設定ファイルとカスタマイズ

同じ Google 製品群でも**ルールファイルの名称が揃っていません**。マルチ製品併用時は注意してください。

| 製品 | ルールファイル |
| --- | --- |
| Gemini CLI | `GEMINI.md`(グローバル → 祖先 → 作業ディレクトリの階層連結、`@import` 対応)。`settings.json` の `context.fileName` で `AGENTS.md` を読ませる互換設定が可能 |
| Code Assist(agent mode) | `GEMINI.md`(IntelliJ は `AGENT.md` も可) |
| Jules | リポジトリルートの `AGENTS.md` を自動読込 |

Gemini CLI の設定はユーザー(`~/.gemini/settings.json`)とワークスペース(`.gemini/settings.json`)の 2 層で、拡張機構(extensions・custom commands)も持ちます。

### 権限管理とセキュリティ

- **Gemini CLI の承認モード**: `default`(都度確認)/ `auto_edit`(編集のみ自動)/ `plan`(読み取り専用)。全自動(YOLO)は CLI フラグでのみ有効化でき、設定ファイルには書けません。フォルダ信頼機構が既定で有効です
- **Gemini CLI のサンドボックス**(オプトイン)は選択肢が広いのが特徴です: macOS Seatbelt / Docker・Podman コンテナ / Windows ネイティブ / gVisor(最も強い隔離)/ LXC(実験的)。ネットワークをプロキシ経由に制限するプロファイルもあります
- **Code Assist** の自動承認(yolo mode / Auto-approve)はオプトインで、公式ドキュメント自身が「自動承認する場所とタイミングには細心の注意を」と警告しています
- **データ学習の既定**: Code Assist Standard / Enterprise 経由(Gemini CLI のライセンス利用を含む)は「プロンプトと応答をモデル学習に**使わない**」と公式明記(データ処理契約 CDPA(Cloud Data Processing Addendum)準拠、Enterprise は知財補償あり)。Jules も「プライベートリポジトリの内容で学習しない」と FAQ に明記。一方、**無料 API キーで Gemini CLI を使う場合のポリシーは Gemini API 利用規約に従うため、別途確認が必要**です
- Code Assist の GitHub コードレビューは `.github/workflows` 内のファイルに対する提案を生成しません(CI 改ざんに関わる部分の防御的挙動)

### 外部連携(MCP・CI・API)

- **Gemini CLI** は MCP クライアント対応が厚く、stdio / SSE / streamable HTTP の 3 トランスポート、サーバー単位の信頼設定・ツールフィルタ、リモートサーバーの OAuth、MCP resources / prompts まで対応します。GitHub Actions 統合(PR レビュー・Issue トリアージ)もあります
- **Code Assist** の agent mode も MCP サーバーを設定できます(IntelliJ は一部機能未対応)
- **Jules** は REST API(alpha)と Jules Tools CLI により、CI/CD・スクリプトからのタスク投入を想定した設計です。MCP 対応の言及はありません(未確認)

### チーム導入と提供プラン

- **組織導入の経路は Code Assist(Standard / Enterprise)に一本化**されています(2026-06-18 の個人向け終了以降)。シートライセンス課金で、ライセンス管理は Google Cloud 側で行います。agent mode / Gemini CLI の日次クォータはエディションにより異なります(具体値は公式のクォータページで確認してください)
- **Jules はチーム向け提供がありません**(2026-07 時点で個人 Google アカウントのみ。SSO・集中管理・監査ログの言及なし)。組織利用を前提にする場合はこの点が制約になります
- 料金の具体額は本記事には記載しません。公式料金ページ(参考資料)で確認してください

### 代表的なユースケースと向き不向き

**公式が想定する用途**: Gemini CLI はターミナルでのコーディング支援・MCP カスタム統合・GitHub Actions での自動化、Code Assist はソフトウェア開発ライフサイクル(SDLC)全体の支援(補完・チャット・agent mode・PR レビュー)、Jules はバグ修正・テスト作成・依存更新などの「やりたくないタスク」の非同期委任です。

**向き不向き(特性として)**:

- 向く: Google Cloud 中心の組織(契約・ガバナンスが Google Cloud に統合される)、OSS の CLI を拡張して使いたいチーム(Gemini CLI)、組織コードベースへの提案適応(Enterprise の code customization)に価値を感じる場合
- 注意が要る: **個人利用の経路が 2026 年に再編されたため、個人での試用は Antigravity 系か有料 API キーが前提**です。Jules は GitHub 専用・個人向けのみです。3 製品でルールファイル・契約体系が分かれるため、併用時の管理は他社の単一製品より複雑になります

## 実務での注意点

### アンチパターン

- **2026 年前半までの「個人無料枠」情報を前提に導入計画を立てる** — 個人向け提供は再編済みで、旧情報のままだと契約・費用の見積もりを誤ります。→ 廃止告知ページと現行の料金ページで最新の提供経路を確認します
- **3 製品を 1 つの製品の機能差分として扱う** — 契約体系・ルールファイル・実行場所がそれぞれ異なります。→ 製品ごとに選定チェックリスト([選定基準](coding-agent-selection.md))を通します
- **無料 API キー利用でデータポリシーを確認しない** — ライセンス経由と API キー経由でデータ取り扱いの根拠文書が異なります。→ 利用経路に対応する規約を確認します

### チェックリスト

- [ ] 利用予定の経路(Code Assist ライセンス / API キー / Vertex AI / Jules)を特定し、その経路のデータ学習ポリシーを確認したか
- [ ] 個人向け提供再編(2026-06-18)後の最新の提供条件を公式ページで確認したか
- [ ] 併用する製品間でルールファイル(GEMINI.md / AGENTS.md)の同期方法を決めたか
- [ ] Jules を使う場合、GitHub 専用・個人アカウント前提という制約がチーム方針と両立するか確認したか

## 関連トピック

- [主要コーディングエージェント比較](coding-agents-comparison.md) — 他ツールとの横断比較
- [ルールファイルと設定の設計](coding-agent-rules-and-config.md) — GEMINI.md / AGENTS.md の使い分け
- [コーディングエージェントの権限とセキュリティ](coding-agent-security.md) — サンドボックス・承認モデルの一般論
- [Devin](devin.md) — Jules と同じ非同期クラウド型の代表例

## 参考資料

- [google-gemini/gemini-cli(GitHub)](https://github.com/google-gemini/gemini-cli) — Gemini CLI のソースコードと README(アクセス日: 2026-07-05)
- [Gemini CLI ドキュメント](https://geminicli.com/docs/) — 設定・サンドボックス・MCP の仕様(アクセス日: 2026-07-05)
- [Gemini Code Assist overview](https://docs.cloud.google.com/gemini/docs/codeassist/overview) — エディションと機能(アクセス日: 2026-07-05)
- [個人向け提供終了の告知](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals) — 2026-06-18 の再編内容(アクセス日: 2026-07-05)
- [Gemini for Google Cloud のデータガバナンス](https://docs.cloud.google.com/gemini/docs/discover/data-governance) — 学習利用ポリシー(アクセス日: 2026-07-05)
- [Jules 公式ドキュメント](https://jules.google/docs) — 実行環境・計画承認・利用制限(アクセス日: 2026-07-05)

## TODO・未確認事項

- Jules の MCP 対応、秘密情報(環境変数)の扱い、無料 / 有料プランのデータポリシー差は公式情報で確認できていません(未確認)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** Antigravity / Antigravity CLI の製品内容・料金・無料枠を公式ページ(antigravity.google)で確認する。個人向けの移行先として言及が必要になるため(最終確認: 2026-07)

> **TODO(要確認):** Code Assist の GitHub コードレビュー consumer 版のサンセット(2026-07-17 予定)後の状況と enterprise 版(Preview)の GA 化を確認する(最終確認: 2026-07)

> **TODO(要確認):** 無料 Gemini API キー利用時のデータ学習ポリシーを Gemini API 利用規約で確認する(最終確認: 2026-07)

> **TODO(要確認):** Jules のステータス(Public Beta)とチーム向け提供の有無の変化を確認する(最終確認: 2026-07)
