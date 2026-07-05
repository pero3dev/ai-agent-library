---
title: "Windsurf(現: Devin Desktop)"
category: "coding-agents"
level: "basic"
status: "published"
last_updated: "2026-07-06"
tags: ["coding-agents", "mcp"]
---

# Windsurf(現: Devin Desktop)

## この記事の目的

専用 IDE 型コーディングエージェント Windsurf — 2026 年 6 月に「Devin Desktop」へ改名 — の現在の提供体制・機能・データ取り扱いを理解し、自分のチーム・用途に合うかを判断できるようになります。買収・改名が続いた製品のため、**どの時点の情報を根拠にしているか**を特に慎重に扱います。

なお本記事は IDE 製品(Devin Desktop / Windsurf Plugins)を扱います。クラウドの自律型エージェント Devin 本体は [Devin](devin.md) を参照してください。

## 対象読者

- Windsurf の既存ユーザーで、買収・改名後の状況を再評価したいエンジニア
- 専用 IDE 型エージェントの候補として旧 Windsurf 系製品を検討しているチーム

## 前提知識

- [AI コーディングエージェントの分類と全体像](coding-agents-overview.md)
- [コーディングエージェントの選定基準と使い分け](coding-agent-selection.md)

## 本文

> **最終確認日:** 2026-07-05 — 本記事の製品仕様・提供形態はこの日付時点の公式情報に基づきます。主な出典は「参考資料」を参照してください。

### 概要

Windsurf は Codeium を前身とする専用 IDE 型のコーディングエージェントで、エージェント機能「Cascade」でこの分野を牽引した製品の 1 つです。2025〜2026 年に提供体制が大きく動きました。

| 時期 | 出来事(公式発表ベース) |
| --- | --- |
| 2025-07-11 | 創業者と R&D チームの一部が Google へ移籍(公式ブログで発表) |
| 2025-07-14 | **Cognition が Windsurf を買収**(IP・製品・商標・事業。公式発表) |
| 2026-04 | 「Windsurf 2.0」— Agent Command Center と「Devin in Windsurf」(エディタからクラウドの Devin へ委任) |
| 2026-06-02 | **「Devin Desktop」へ改名**(プラン・料金・拡張・設定は自動引き継ぎ)。中核エージェントも Cascade から「Devin Local」(Rust 製の新ハーネス、preview)へ移行開始 |

2026-07 時点の結論: **提供元は Cognition。製品は Devin ファミリーの一員として活発に開発が継続しています**(調査日前日まで新バージョンがリリースされています)。「Windsurf」の名前は、既存 IDE(JetBrains / VS Code / Vim 等)向けの「Windsurf Plugins」に残っています。

### 提供形態と実行環境

| 面 | 内容 | 実行場所 |
| --- | --- | --- |
| Devin Desktop(旧 Windsurf) | 専用 IDE(VS Code 系と後方互換)。macOS / Windows / Linux | ローカル |
| Devin Local(旧 Cascade の後継) | IDE 内エージェント(preview)。Devin CLI と共通ハーネス | ローカル |
| Windsurf Plugins | JetBrains / VS Code / Visual Studio / Vim / Emacs / Xcode 等の既存 IDE 向けプラグイン | ローカル |
| Devin CLI | ローカルの CLI エージェント(macOS / Linux / WSL / Windows) | ローカル |
| クラウド委任 | エディタから Devin(クラウド)へタスクを委任し PR をエディタ内レビュー(全プランに含まれる) | クラウド([Devin](devin.md)) |

現在の公式ポジショニングは「単なる AI IDE」ではなく、**ローカル・クラウドの複数エージェントを 1 画面(Agent Command Center)で管理する管制塔**です。ACP(Agent Client Protocol)対応により、**他社エージェント(Codex CLI・Claude Agent・Gemini CLI 等)を Devin Desktop 内で実行**することもできます(外部エージェント使用時は Devin のプライバシーポリシー適用外・課金も第三者と直接、と公式が明記)。

### リポジトリ理解・編集・実行の仕組み

- **リポジトリ理解**: ローカルインデックスが既定で、Teams / Enterprise 向けに**リモートインデックス**(GitHub / GitLab / Bitbucket から埋め込みを作成しチームで共有。埋め込み作成後にコードは全削除と公式明記)があります。さらに **Fast Context**(検索特化の専用モデル SWE-grep によるサブエージェント型探索)という独自機構を持ちます。除外は `.windsurfignore` で設定します
- **ファイル編集**: 編集はエディタ内の diff 領域で hunk 単位に承認・却下できます。Cascade の変更はプロンプト単位で巻き戻せます(巻き戻しの取り消しは不可)
- **コマンド実行**: Cascade の自動実行レベルは 4 段階(Disabled / Allowlist Only / Auto / Turbo)+ 許可・拒否リストです。新しい Devin Local は **Deny / Ask / Allow ルール × スコープ(読取 / 書込 / コマンド / HTTP / MCP)× 階層(プロジェクト / ユーザー / 組織)** の権限モデルに再設計されています

**移行期の注意**: 2026-07 時点はレガシー Cascade から Devin Local への移行期で、両方の仕様が公式ドキュメントに併存しています。設定を調べる際はどちらのエージェントの仕様かを確認してください。

### 設定ファイルとカスタマイズ

- ワークスペースルールは `.devin/rules/*.md` が推奨です(レガシー `.windsurf/rules/`・`.windsurfrules` は後方互換)。グローバルルールは `global_rules.md` です
- **AGENTS.md に対応**しています(ルートは常時適用、サブディレクトリは自動 glob 適用)
- ルール適用モードは 4 種(always_on / model_decision / glob / manual)です
- **Memories**: Cascade が会話から自動生成するメモがローカルに保存されます。チーム共有にはルールまたは AGENTS.md への転記が公式推奨です。なお Devin Local は preview 段階で Memories のセッション間永続化に未対応で、代わりに Devin CLI と共通の **Skills**(再利用可能な指示バンドル)を使います
- 改名に伴い設定パスが移行中で、`~/.devin/`・`~/.windsurf/`・旧 Codeium 時代の `~/.codeium/windsurf/` が**混在**しています。ドキュメント参照時は要注意です

### 権限管理とセキュリティ

- Devin Local は OS レベルサンドボックス(ファイルシステム分離 + ドメイン単位のネットワークフィルタ)に対応し、**エンタープライズ管理者はサンドボックスを組織全体に強制**できます
- 管理者制御: コマンド許可 / 拒否リストの組織配布、MCP のホワイトリスト・カスタムレジストリ、ACP レジストリの配布、端末管理ポリシー(拡張の発行者制限・テレメトリ制御を Group Policy / MDM で配布)
- **データ学習の既定はプラン・機能で異なります**: 個人向け規約(2026-04 更新)では、Autocomplete のデータは既定でモデル改善に使用(オプトアウト可)、**Chat はオプトアウトすると機能自体が使えなくなる**とされています。有料プランでは Data Controls から学習利用をオプトアウトでき、その場合 ZDR(Zero Data Retention)が有効になります。エンタープライズは書面同意なしに学習利用しないと明記されています
- コンプライアンスは SOC 2 Type II(Cognition のセキュリティページに記載)。SSO(SAML / OIDC)・RBAC は Enterprise 向けに提供されます

### 外部連携(MCP・CI・API)

- **MCP クライアント**: stdio / Streamable HTTP / SSE + OAuth。MCP Marketplace、ツール数上限(合計 100)、サーバー単位のツールのオン / オフがあります。Devin Local では MCP ツールは既定で実行前承認です
- **ACP(Agent Client Protocol)**: エディタとエージェント間のオープンプロトコルに対応し、他社エージェントのホストになれます(この分野では特徴的な設計判断です)
- CI 連携・GitHub 自動化はクラウド側の Devin が担当します([Devin](devin.md))

### チーム導入と提供プラン

- 料金ページは Devin ブランドに一体化されており、**全プランに Devin Desktop が含まれる**構成です(Free / Pro / Max / Teams / Enterprise)。改名時に「プラン・料金は変更なし」と公式 FAQ に明記されています。具体額は公式料金ページ(参考資料)で確認してください
- Teams は集中請求・管理ダッシュボード・リモートインデックス、Enterprise は SSO・集中管理・専用デプロイオプションが加わります
- 旧 Windsurf のクレジット制と Devin 側の ACU(課金単位)の統合が進行中の様子ですが、正確な換算・統合状況は未確認です

### 代表的なユースケースと向き不向き

**公式の位置づけ**: Tab 補完・インライン編集(無制限)+ IDE 内エージェント、そして「計画・委任・レビュー・出荷をエディタから出ずに行う」ローカル + クラウドのエージェント管制です。

**向き不向き(特性として)**:

- 向く: Devin(クラウド)と IDE を一体で使いたいチーム(委任 → エディタ内 PR レビューの往復が製品として統合されている)、ACP で複数エージェントを 1 つの IDE に集約したい場合、既存 IDE を変えられない人向けのプラグイン経路があること
- 注意が要る: **買収・改名・エージェント移行(Cascade → Devin Local)が直近で起きており、情報の鮮度リスクがこの章の中で最も高い製品です**。ドキュメント・設定パス・課金単位が移行期の混在状態にあるため、導入評価は最新の公式情報で行い、preview 段階の機能(Devin Local)への依存度を確認してください

## 実務での注意点

### アンチパターン

- **2025 年以前の「Windsurf」情報で評価する** — 提供元(Cognition)・製品名(Devin Desktop)・中核エージェント(Devin Local)・契約体系(Devin プランに統合)のすべてが変わりました。→ devin.ai / docs.devin.ai の現行情報のみを根拠にします
- **Chat の学習利用オプトアウトの扱いを個人プランで見落とす** — 個人向け規約ではオプトアウトと機能利用がトレードオフです。→ 業務利用は有料プラン + Data Controls(または Enterprise 契約)を前提にします
- **レガシー Cascade の設定情報を Devin Local に適用する** — 権限モデルが別物です(4 段階レベル vs Deny/Ask/Allow × スコープ)。→ どちらのエージェントの仕様かを確認してから設定します

### チェックリスト

- [ ] 評価に使った情報が改名(2026-06)後の公式ドキュメントか
- [ ] 利用プランの学習利用の既定とオプトアウト(Data Controls / ZDR)を確認したか
- [ ] リモートインデックス利用時のデータフロー(埋め込み共有・コード削除)を組織ポリシーと突き合わせたか
- [ ] Devin Local(preview)への依存箇所と、レガシー Cascade の提供終了影響を確認したか
- [ ] ACP で外部エージェントを使う場合、プライバシーポリシー適用外になることをチームが理解しているか

## 関連トピック

- [Devin](devin.md) — 同じ Cognition のクラウド自律型エージェント(委任先)
- [主要コーディングエージェント比較](coding-agents-comparison.md) — 他ツールとの横断比較
- [Cursor](cursor.md) — 同じ専用 IDE 型の対抗製品
- [コーディングエージェントの権限とセキュリティ](coding-agent-security.md) — サンドボックス・権限設計の一般論

## 参考資料

- [Devin Desktop(旧 Windsurf)公式ページ](https://devin.ai/desktop) — 現在の製品ポジション(アクセス日: 2026-07-05)
- [Windsurf is now Devin Desktop(改名告知)](https://devin.ai/blog/windsurf-is-now-devin-desktop/) — 改名と Devin Local の発表(アクセス日: 2026-07-05)
- [Cognition の買収発表](https://cognition.com/blog/windsurf) — 2025-07-14 の一次情報(アクセス日: 2026-07-05)
- [Devin Desktop ドキュメント](https://docs.devin.ai/desktop) — 機能・権限・管理の一次情報(アクセス日: 2026-07-05)
- [個人向け利用規約](https://devin.ai/windsurf/terms-of-service-individual/) — 学習利用の既定(アクセス日: 2026-07-05)
- [料金ページ](https://devin.ai/pricing) — Devin ファミリー統合後のプラン(アクセス日: 2026-07-05)

## TODO・未確認事項

- ローカルインデックスの保存場所、監査ログの提供状況、秘密情報の自動マスク、Google とのライセンス契約の一次情報は公式情報で確認できていません(未確認)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** レガシー Cascade の提供終了時期(公式内で「2026-07-01 まで」と「7 月いっぱい」の表記揺れあり)と Devin Local(preview)の GA 化を changelog で確認する(最終確認: 2026-07)

> **TODO(要確認):** プラン構成・クレジットと ACU の統合状況を料金ページで確認する(最終確認: 2026-07)

> **TODO(要確認):** 「Windsurf Plugins」ブランドの存続と機能範囲(Cascade 系機能の提供状況)を確認する(最終確認: 2026-07)
