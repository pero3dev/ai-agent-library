# 調査メモ: Gemini CLI / Gemini Code Assist / Jules(C-R3)

- **対象**: Google の 3 製品 — Gemini CLI(OSS ターミナルエージェント)/ Gemini Code Assist(IDE 拡張 + GitHub コードレビュー)/ Jules(非同期クラウドエージェント)
- **調査日**: 2026-07-05
- **調査方法**: [CODING-AGENTS-PLAN.md](../../CODING-AGENTS-PLAN.md) §7 のチェックリスト 12 項目。公式ドキュメント・公式ブログ・公式リポジトリのみを根拠とし、第三者記事は根拠にしていません
- **記録様式**: `項目 | 確認した事実 | 出典 URL | 確認日 | 確度(公式明記 / 公式から推測 / 第三者)`

> **最重要(執筆前に必読):** 2026-06-18 に個人向け(consumer)提供が大きく再編されました。**Gemini Code Assist for individuals(個人無料版)、Google AI Pro / Ultra 経由の利用は、Gemini Code Assist IDE 拡張・Gemini CLI ともに提供停止**され、移行先として **Antigravity ファミリー(Antigravity CLI 含む)** が案内されています。Code Assist Standard / Enterprise ライセンスと有料 API キー経由の利用は継続です。2026 年 1 月以前の知識(「Gemini CLI は個人 Google アカウントで無料 60 req/分・1,000 req/日」等)のまま書くと誤りになります。詳細は各節参照。

## 3 製品の関係(読者の混乱点の整理)

| 観点 | Gemini CLI | Gemini Code Assist | Jules |
| --- | --- | --- | --- |
| 形態 | OSS(Apache 2.0)のターミナル型エージェント | IDE 拡張(VS Code / JetBrains 等)+ GitHub PR レビュー | ベンダークラウド VM で動く非同期エージェント |
| 主な入口 | シェル(CLI) | IDE・GitHub PR | Web アプリ・Jules Tools CLI・REST API |
| 実行場所 | ローカル | ローカル IDE(推論はクラウド) | Google のクラウド VM |
| 契約体系(2026-07 時点) | Code Assist Standard/Enterprise ライセンス、または有料 Gemini API キー / Vertex AI | Standard / Enterprise(組織向けシート課金)のみ | 個人向け Google AI プラン(Free / Pro / Ultra) |
| 関係 | Code Assist ライセンスで CLI のクォータが付与される。Code Assist の agent mode は Gemini CLI ベース(下記) | agent mode・カスタムコマンドが「Gemini CLI ベース」と公式ドキュメントに記載 | 独立製品。Gemini CLI や Code Assist ライセンスとは別体系 |

- Code Assist と Gemini CLI の連動: Code Assist Standard/Enterprise の機能一覧に「Quota for using Gemini CLI」があり、ライセンス保持者は `GOOGLE_CLOUD_PROJECT` を設定して Gemini CLI を利用する | https://docs.cloud.google.com/gemini/docs/codeassist/overview および https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記
- Code Assist の agent mode のドキュメントに「Gemini CLI-based custom command」「Gemini CLI commands」の記載あり。ただし「agent mode は Gemini CLI で動いている(powered by)」という直接の一文はこのページでは確認できず | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式から推測
- Jules は Gemini CLI / Code Assist と契約・課金体系が独立。公式ブログでは Gemini CLI と Jules を「組み合わせて使う」例(issue 分析 → Jules へ委譲)が紹介されている(拡張としての統合ではなくコンポーザビリティの例示) | https://developers.googleblog.com/en/meet-jules-tools-a-command-line-companion-for-googles-async-coding-agent/ | 2026-07-05 | 公式明記
- 2026-06-18 の consumer 提供終了と Antigravity への移行(3 製品の地図を変える変更。Jules への影響は言及なし) | https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals および https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/ | 2026-07-05 | 公式明記

---

## Gemini CLI

### 1. 実行環境

- ローカルのターミナルで動作。npx / npm / Homebrew / MacPorts / Anaconda でインストール | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記
- サンドボックスの選択肢に macOS Seatbelt / Docker・Podman / Windows Native Sandbox(icacls)/ gVisor(Linux)/ LXC(Linux・実験的)があり、macOS・Linux・Windows で動作すると判断できる | https://geminicli.com/docs/cli/sandbox/ | 2026-07-05 | 公式から推測(OS 対応の一覧ページ自体は未確認)

### 2. 対応 IDE / CLI

- CLI 専用(IDE 拡張は Code Assist が担当)。公式ドキュメントサイトは https://geminicli.com/docs/ | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記
- Code Assist の agent mode が Gemini CLI ベースであるため、IDE からは Code Assist 経由で同等機能に触れる構図 | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式から推測

### 3. リポジトリ理解

- 事前インデックスではなく、ファイル操作・シェルコマンド・検索ツールによるオンデマンド探索 + Google Search グラウンディング | https://github.com/google-gemini/gemini-cli(README の機能一覧) | 2026-07-05 | 公式から推測(「インデックスを作らない」という明文は未確認)
- 大規模リポジトリ・モノレポでの制約: 未確認

### 4. ファイル編集

- 編集系ツールを承認モード配下で実行。`auto_edit` は編集ツールのみ自動承認 | https://geminicli.com/docs/cli/settings/ | 2026-07-05 | 公式明記
- checkpointing(会話とファイル状態の保存・復元)あり | https://github.com/google-gemini/gemini-cli および https://geminicli.com/docs/cli/checkpointing/ | 2026-07-05 | 公式明記(checkpointing の詳細ページ内容は未読)

### 5. コマンド実行

- シェルコマンド実行ツールを内蔵。実行前確認は承認モードに従う(下記 8) | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記
- バックグラウンド実行の可否: 未確認

### 6. MCP・外部ツール連携

- MCP クライアント対応。`settings.json` の `mcpServers` に設定。トランスポートは stdio(`command`)/ SSE(`url`)/ streamable HTTP(`httpUrl`)の 3 種 | https://geminicli.com/docs/tools/mcp-server/ | 2026-07-05 | 公式明記
- MCP サーバー単位の `trust`(確認ダイアログのバイパス)、`includeTools` / `excludeTools` によるツールフィルタ、リモートサーバーの OAuth(`authProviderType`: `dynamic_discovery` / `google_credentials` / `service_account_impersonation`) | https://geminicli.com/docs/tools/mcp-server/ | 2026-07-05 | 公式明記
- MCP の resources(`@server://resource/path`)と prompts(スラッシュコマンド化)にも対応 | https://geminicli.com/docs/tools/mcp-server/ | 2026-07-05 | 公式明記
- 拡張機構: extensions(配布可能)と custom commands | https://github.com/google-gemini/gemini-cli および https://geminicli.com/docs/extensions | 2026-07-05 | 公式明記
- CI 連携: GitHub Actions 統合(PR レビュー・issue トリアージ)が README に記載 | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記(Action 本体のリポジトリ・仕様は未確認)

### 7. 設定ファイル

- コンテキストファイルは `GEMINI.md`。読み込み階層: ① グローバル `~/.gemini/GEMINI.md` → ② ワークスペースの各ディレクトリと親ディレクトリ → ③ 作業ディレクトリとその祖先(信頼されたルートまで)を just-in-time でスキャン。見つかった全ファイルを連結して毎プロンプトに送付 | https://geminicli.com/docs/cli/gemini-md/ | 2026-07-05 | 公式明記
- `@file.md` 構文でインポート可(相対・絶対パス)。`/memory show` で連結結果を表示、`/memory reload` で再読込 | https://geminicli.com/docs/cli/gemini-md/ | 2026-07-05 | 公式明記
- ファイル名は `settings.json` の `"context": { "fileName": [...] }` で変更・複数指定可(例: `AGENTS.md` を追加)→ **AGENTS.md との互換はこの設定で実現** | https://geminicli.com/docs/cli/gemini-md/ | 2026-07-05 | 公式明記
- `settings.json` の階層: ユーザー `~/.gemini/settings.json` とワークスペース `<project>/.gemini/settings.json`(ワークスペースが優先)。システム全体(`/etc/` 等)の設定ファイルはドキュメントの該当ページでは確認できず | https://geminicli.com/docs/cli/settings/ | 2026-07-05 | 公式明記(システム設定の不存在は未確認)

### 8. 権限管理

- 承認モード: `general.defaultApprovalMode` に `"default"`(都度確認)/ `"auto_edit"`(編集ツールのみ自動承認)/ `"plan"`(読み取り専用)。**YOLO(全自動承認)は CLI フラグ(`--yolo` または `--approval-mode=yolo`)でのみ有効化可能**(settings.json では設定不可) | https://geminicli.com/docs/cli/settings/ | 2026-07-05 | 公式明記
- フォルダ信頼(folder trust): `security.folderTrust.enabled`(既定 `true`) | https://geminicli.com/docs/cli/settings/ | 2026-07-05 | 公式明記
- MCP ツールは既定で実行前確認(`trust: false`) | https://geminicli.com/docs/tools/mcp-server/ | 2026-07-05 | 公式明記
- ツール単位の許可 / 拒否リスト(`tools.allowed` 等)の有無: 未確認(設定リファレンスには `tools.sandboxAllowedPaths`、`security.toolSandboxing` などのキーを確認)

### 9. セキュリティ

- サンドボックス方式(オプトイン): ① macOS Seatbelt(`sandbox-exec`、既定プロファイル `permissive-open`)② コンテナ(Docker / Podman、既定イメージ `ghcr.io/google/gemini-cli:latest`)③ Windows Native Sandbox(icacls)④ gVisor / runsc(Linux、最も強い隔離)⑤ LXC / LXD(Linux、実験的) | https://geminicli.com/docs/cli/sandbox/ | 2026-07-05 | 公式明記
- 有効化は `-s` / `--sandbox` フラグ、`GEMINI_SANDBOX=true|docker|podman|sandbox-exec|runsc|lxc`、または `settings.json` の `tools.sandbox`。カスタムイメージは `.gemini/sandbox.Dockerfile` + `BUILD_SANDBOX=1` | https://geminicli.com/docs/cli/sandbox/ | 2026-07-05 | 公式明記
- ネットワーク制御: Seatbelt プロファイルに `permissive-proxied` / `restrictive-proxied`(プロキシ経由に制限)等のバリエーション | https://geminicli.com/docs/cli/sandbox/ | 2026-07-05 | 公式明記
- データ学習利用: **認証方式に依存**。Code Assist Standard/Enterprise ライセンス経由は「Gemini はプロンプトと応答をモデルの学習に使わない」(Gemini for Google Cloud データガバナンス)が適用 | https://docs.cloud.google.com/gemini/docs/discover/data-governance | 2026-07-05 | 公式明記
- 無料の個人 Google アカウントログイン(旧・Code Assist for individuals 相当)は 2026-06-18 に終了したため、「無料版はデータが学習に使われ得る」という従来の説明は過去形で書く必要がある。無料 Gemini API キー利用時の学習利用ポリシーは Gemini API の利用規約に従う(本調査では未確認)。リポジトリ内の ToS/プライバシー文書(旧 `docs/tos-privacy.md`)は 404 で現所在未確認 | https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals | 2026-07-05 | 公式明記(API キー時のポリシーは未確認)

### 10. チーム導入機能

- 組織導入は Gemini Code Assist Standard / Enterprise ライセンス経由(`GOOGLE_CLOUD_PROJECT` を設定して認証)。ライセンス管理・シート割当は Google Cloud 側で行う | https://github.com/google-gemini/gemini-cli および https://docs.cloud.google.com/gemini/docs/codeassist/set-up-gemini | 2026-07-05 | 公式明記(set-up ページの詳細は未読)
- agent mode / Gemini CLI のクォータ: Standard = 最大 1,500 リクエスト/ユーザー/日、Enterprise = 最大 2,000 リクエスト/ユーザー/日 | https://docs.cloud.google.com/gemini/docs/quotas | 2026-07-05 | 公式明記

### 11. 料金・利用制限

- ソフトウェア自体は OSS(Apache 2.0)で無料。API 利用料は認証方式に依存 | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記
- **個人 Google アカウント(OAuth)の無料枠(60 リクエスト/分・1,000 リクエスト/日)は 2026-06-18 に提供終了**(Google AI Pro / Ultra 経由も同様)。移行先は Antigravity ファミリー(Antigravity CLI)。料金は https://antigravity.google/pricing を参照 | https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals | 2026-07-05 | 公式明記
- **注意(矛盾の記録)**: GitHub リポジトリの README(main、2026-07-05 閲覧)には「Free tier: 60 requests/min and 1,000 requests/day」の記載が残っており、廃止ページと矛盾。廃止ページ(2026-06-23 更新)を正とする | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記(矛盾あり)
- 継続利用の経路: ① Gemini API キー(README には「1000 requests/day with Gemini 3(無料枠)」と記載 — 上記矛盾と同様に要再確認)② Vertex AI(従量、高レート)③ Code Assist Standard/Enterprise ライセンス | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記(無料 API キー枠の現況は要確認)

### 12. 代表的なユースケース

- 公式想定: ターミナルでのコーディング支援、MCP によるカスタム統合、GEMINI.md によるプロジェクト適応、GitHub Actions での PR レビュー・issue トリアージ、スクリプトからの利用 | https://github.com/google-gemini/gemini-cli | 2026-07-05 | 公式明記
- コミュニティ評判(参考): 公式ブログに「100,000 GitHub stars, 6,000 merged pull requests」との言及(人気の傍証) | https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/ | 2026-07-05 | 公式明記

---

## Gemini Code Assist

### 1. 実行環境

- IDE 拡張としてローカル IDE 内で動作(推論は Google のクラウド)。GitHub コードレビューは GitHub 上のクラウドサービスとして動作 | https://docs.cloud.google.com/gemini/docs/codeassist/overview | 2026-07-05 | 公式明記
- agent mode は「マシンのファイルシステムとターミナル操作、設定済みツールにアクセスする」と明記(= ローカル実行の権限を持つ) | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式明記

### 2. 対応 IDE / CLI

- 対応 IDE: VS Code / JetBrains IDEs(IntelliJ、PyCharm 等)/ Android Studio / Cloud Shell Editor / Cloud Workstations | https://docs.cloud.google.com/gemini/docs/codeassist/overview | 2026-07-05 | 公式明記
- CLI は持たない(Gemini CLI が対応物。Code Assist ライセンスに CLI クォータが含まれる) | https://docs.cloud.google.com/gemini/docs/codeassist/overview | 2026-07-05 | 公式明記

### 3. リポジトリ理解

- local codebase awareness: 「Gemini の大きなコンテキストウィンドウでローカルコードベースを深く理解」(Standard / Enterprise) | https://docs.cloud.google.com/gemini/docs/codeassist/overview | 2026-07-05 | 公式明記
- code customization(**Enterprise 限定**): GitHub / GitLab / Bitbucket のプライベートリポジトリを接続してモデルの提案を組織のコードベースに適応(リモートインデックス) | https://docs.cloud.google.com/gemini/docs/codeassist/overview | 2026-07-05 | 公式明記

### 4. ファイル編集

- agent mode で複数ステップのタスク・複数ファイル変更を実行し、変更を承認制で適用 | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式明記
- ロールバック手段の詳細: 未確認

### 5. コマンド実行

- agent mode がターミナル操作(シェル実行)を行える。「Be extremely careful where and when you auto-approve changes.(自動承認する場所とタイミングには細心の注意を)」という警告が明記 | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式明記

### 6. MCP・外部ツール連携

- agent mode で MCP サーバーを設定してエージェントの能力を拡張可能。IntelliJ ではコマンドパレット経由の MCP 設定やスラッシュコマンドなど一部機能が未対応 | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式明記

### 7. 設定ファイル

- VS Code: `GEMINI.md` を階層的に利用(グローバル `~/.gemini/GEMINI.md` またはプロジェクト階層内)。IntelliJ: プロジェクトルートの `GEMINI.md` または `AGENT.md` | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式明記
- GitHub コードレビューのカスタマイズ: リポジトリごとにスタイルガイドを追加可能。設定は(consumer 版)codeassist.google/code-review の設定ページ、(enterprise 版)Google Cloud コンソール。`config.yaml` / `styleguide.md` という具体的ファイル名は今回の取得内容では確認できず | https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code | 2026-07-05 | 公式明記(ファイル名は未確認)

### 8. 権限管理

- VS Code: 信頼済みワークスペースで「yolo mode(全エージェント操作を自動許可)」を使用可。IntelliJ: Agent オプションの「Auto-approve changes」チェックボックス | https://docs.cloud.google.com/gemini/docs/codeassist/use-agentic-chat-pair-programmer | 2026-07-05 | 公式明記
- 既定は承認制(自動承認はオプトイン) | 同上 | 2026-07-05 | 公式から推測

### 9. セキュリティ

- データ学習利用: 「**Gemini はあなたのプロンプトや応答をモデルの学習データとして使用しません**」(例外はオプトインの Trusted Tester Program のみ)。Cloud Data Processing Addendum(CDPA)準拠 | https://docs.cloud.google.com/gemini/docs/discover/data-governance | 2026-07-05 | 公式明記
- Standard の説明に「enterprise-grade security」「source citations(出典表示)」「IP indemnification(知財補償)」 | https://developers.google.com/gemini-code-assist/docs/overview(現 docs.cloud.google.com 配下) | 2026-07-05 | 公式明記
- GitHub コードレビューは `.github/workflows` ディレクトリ内のファイルについて要約・提案を生成しない(ワークフロー改ざん対策と推測される) | https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code | 2026-07-05 | 公式明記(理由づけは推測)
- コンプライアンス認証の個別リスト: 未確認(CDPA への言及のみ)

### 10. チーム導入機能

- エディションは **Standard** と **Enterprise** の 2 つ(組織向け)。Enterprise = Standard 全機能 + code customization + Google Cloud サービス統合(Apigee、Application Integration、Gemini Cloud Assist 等) | https://docs.cloud.google.com/gemini/docs/codeassist/overview | 2026-07-05 | 公式明記
- **個人向け無料版(Gemini Code Assist for individuals)は 2026-06-18 で提供終了**。組織向け 2 エディションのみが継続 | https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals | 2026-07-05 | 公式明記
- ライセンス管理・割当は Google Cloud で実施(set-up / manage-licenses / admin ドキュメントあり)。SSO・監査ログの詳細: 未確認 | https://docs.cloud.google.com/gemini/docs/codeassist/set-up-gemini | 2026-07-05 | 公式明記(詳細未読)

### 11. 料金・利用制限

- 課金単位: ユーザー/月のシートライセンス。月次または年次コミット(いずれも請求は月次)。Enterprise は最低 10 ライセンスとの記載(検索結果経由のため要再確認)。**金額は本文に転記しない** | 料金参照先: https://cloud.google.com/products/gemini/pricing | 2026-07-05 | 公式から推測(料金ページ本体の全文は取得失敗。構造はドキュメント・検索スニペットから)
- クォータ(1 ユーザー/日): コード生成・補完 6,000 / チャット等 960 / agent mode・Gemini CLI は Standard 1,500・Enterprise 2,000 | https://docs.cloud.google.com/gemini/docs/quotas | 2026-07-05 | 公式明記
- GitHub コードレビュー: consumer 版は 33 PR/日で **2026-07-17 にサンセット予定**。enterprise 版(Google Cloud 経由)は 100+ PR/日(Preview) | https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code | 2026-07-05 | 公式明記

### 12. 代表的なユースケース

- 公式想定: SDLC 全体(build / deploy / operate)の AI 支援 — コード補完・生成、チャット、agent mode によるマルチステップタスク、GitHub PR の自動要約・レビュー | https://docs.cloud.google.com/gemini/docs/codeassist/overview および https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code | 2026-07-05 | 公式明記
- 対応プラットフォーム(コードレビュー): GitHub.com / GitHub Enterprise Cloud / GitHub Enterprise Server。GitLab / Bitbucket のレビュー対応は言及なし(code customization のソース接続とは別の話であることに注意) | https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code | 2026-07-05 | 公式明記
- PR 上では `/gemini` タグをコメントに付けて PR の文脈で質問できる | 同上 | 2026-07-05 | 公式明記

---

## Jules

### 1. 実行環境

- Google のクラウド上の「安全な短命の仮想マシン(VM)」で実行。OS は Ubuntu Linux。Node.js / Python / Go / Java / Rust などの開発ツールがプリインストール | https://jules.google/docs/environment | 2026-07-05 | 公式明記
- タスクごとに新しい VM でリポジトリを clone し、依存をインストールして変更を加える。VM はインターネットアクセスあり | https://jules.google/docs/faq | 2026-07-05 | 公式明記
- 環境セットアップスクリプトを設定でき(例: `npm install && npm run test`)、検証後に**環境のスナップショット**が保存され、同リポジトリの以降のタスクで再利用される | https://jules.google/docs/environment | 2026-07-05 | 公式明記

### 2. 対応 IDE / CLI

- インターフェイス: ① Web アプリ(jules.google.com)② Jules Tools CLI(`npm install -g @google/jules`)③ REST API(alpha)。IDE 拡張は持たない | https://jules.google/docs および https://developers.googleblog.com/en/meet-jules-tools-a-command-line-companion-for-googles-async-coding-agent/ | 2026-07-05 | 公式明記
- Jules Tools は「ダッシュボード + コマンド面」を提供し、スクリプト化・他 CLI(gh、jq 等)との合成を想定 | https://developers.googleblog.com/en/meet-jules-tools-a-command-line-companion-for-googles-async-coding-agent/ | 2026-07-05 | 公式明記

### 3. リポジトリ理解

- GitHub リポジトリを VM に clone して全体にアクセスする方式(事前インデックスの言及なし)。リポジトリ・ブランチは repo selector で選択(既定ブランチがプリセット) | https://jules.google/docs | 2026-07-05 | 公式明記
- 対応プラットフォームは GitHub のみ(GitLab 等への言及なし)。得意言語として JavaScript/TypeScript、Python、Go、Java、Rust | https://jules.google/docs/faq | 2026-07-05 | 公式明記

### 4. ファイル編集

- ワークフロー: プロンプト → Jules が計画(plan)を提示 → ユーザーが承認 → VM 内でコード変更 → **diff を提示** → PR を作成しマージへ | https://jules.google/ および https://jules.google/docs | 2026-07-05 | 公式明記

### 5. コマンド実行

- VM 内で依存インストール・テスト・リンターなどを実行(セットアップスクリプトに「パッケージインストール、リンター、テストのコマンドを必ず含める」ことを公式が推奨) | https://jules.google/docs/environment | 2026-07-05 | 公式明記

### 6. MCP・外部ツール連携

- MCP 対応: 言及なし(未確認) | — | 2026-07-05 | 未確認
- REST API(`https://jules.googleapis.com/v1alpha/`、alpha)で Sources / Sessions / Activities を操作。CI/CD(GitHub Actions 等)や Slack / Linear / GitHub への組み込みを想定 | https://developers.google.com/jules/api | 2026-07-05 | 公式明記
- 認証は `X-Goog-Api-Key` ヘッダーの API キー(Web アプリ設定で発行、ユーザーあたり最大 3 個) | https://developers.google.com/jules/api | 2026-07-05 | 公式明記

### 7. 設定ファイル

- **リポジトリルートの `AGENTS.md` を自動で読み込む**(コードベース内のエージェント・ツールを記述し、計画と補完の質を高める)。GEMINI.md ではない点に注意 | https://jules.google/docs | 2026-07-05 | 公式明記
- 環境設定(セットアップスクリプト + スナップショット)はリポジトリごとに Web アプリで構成 | https://jules.google/docs/environment | 2026-07-05 | 公式明記

### 8. 権限管理

- **計画承認モデル**: 「コード変更が行われる前に」生成された計画をユーザーがレビュー・承認する(human-in-the-loop) | https://jules.google/docs | 2026-07-05 | 公式明記
- GitHub 連携時にアクセスを「全リポジトリまたは特定リポジトリ」に限定可能 | https://jules.google/docs | 2026-07-05 | 公式明記
- 計画承認をスキップする自動実行モードの有無: 未確認

### 9. セキュリティ

- 「**Jules はプライベートリポジトリのコンテンツで学習(train)しません。プライバシーは Jules の中核原則です**」(FAQ) | https://jules.google/docs/faq | 2026-07-05 | 公式明記
- 無料プランと有料プランでの学習利用ポリシーの差: FAQ 上は区別の記載なし。詳細は jules.google.com/legal 参照とされるが本調査では未取得 | https://jules.google/docs/faq | 2026-07-05 | 未確認(要 legal ページ確認)
- タスクは隔離された短命 VM で実行(上記 1)。秘密情報(環境変数・シークレット)の取り扱い: 未確認

### 10. チーム導入機能

- **個人向けのみ**: 有料プランは Google AI Plans のサブスクリプション経由で、「現在は個人 Google アカウント(@gmail.com)のみ利用可能」。組織・チーム向け提供(SSO・集中管理・監査ログ)の言及なし | https://jules.google/docs/usage-limits | 2026-07-05 | 公式明記(チーム機能の不存在は公式から推測)

### 11. 料金・利用制限

- プランと制限: **Jules(無料)= 15 タスク/日・同時 3 / Jules in Pro = 100 タスク/日・同時 15 / Jules in Ultra = 300 タスク/日・同時 60**。Pro / Ultra はそれぞれ Google AI Pro / Google AI Ultra プランの特典として提供 | https://jules.google/docs/usage-limits | 2026-07-05 | 公式明記
- モデル: 無料プランは Gemini 2.5 Pro、有料プランは Gemini 3 Pro(「最新モデルへの優先アクセス」) | https://jules.google/ および https://jules.google/docs/usage-limits | 2026-07-05 | 公式明記
- 金額は本文に転記しない。料金参照先: Google AI プランのページ(https://one.google.com/about/google-ai-plans/ — 本調査では未取得) | — | 2026-07-05 | 未確認(URL 要検証)
- 製品ステータス: 「Jules is currently in Public Beta」(FAQ)。トップページには「experimental coding agent」の表現も残る | https://jules.google/docs/faq および https://jules.google/docs | 2026-07-05 | 公式明記(表現に揺れあり)

### 12. 代表的なユースケース

- 公式想定: バグ修正、テスト作成、機能追加、ドキュメント作成、依存関係の更新(dependency bump)など「やりたくないコーディングタスク」の非同期委任。タグライン「Jules does coding tasks you don't want to do.」 | https://jules.google/ および https://developers.googleblog.com/en/meet-jules-tools-a-command-line-companion-for-googles-async-coding-agent/ | 2026-07-05 | 公式明記
- API / CLI 経由で CI/CD・issue トリアージへの組み込み(公式ブログで Gemini CLI との組み合わせ例) | https://developers.googleblog.com/en/meet-jules-tools-a-command-line-companion-for-googles-async-coding-agent/ | 2026-07-05 | 公式明記

---

## 執筆時の注意(gemini-cli-and-code-assist.md 向け)

1. **鮮度の崖が 2026-06-18**: 個人無料枠・Google AI Pro/Ultra 経由の Gemini CLI / Code Assist IDE 拡張は提供終了。本文は「2026 年 7 月時点では組織向け(Standard / Enterprise)と有料 API キー / Vertex AI が継続経路。個人向けは Antigravity ファミリーへ移行」と書く
2. **公式情報間の矛盾**: gemini-cli の README には旧無料枠(60 req/分・1,000 req/日)の記載が残存(2026-07-05 時点)。廃止ページ(更新 2026-06-23)を正とし、README を根拠に無料枠を現在形で書かない
3. **Jules は再編の対象外(言及なし)**: 個人向け Google AI プラン特典として Free / Pro / Ultra が継続提供中(2026-07-05 確認)。ただし consumer 製品の再編が続いているため定点観測必須
4. **GitHub PR レビューの二本立て**: consumer 版(codeassist.google/code-review、33 PR/日)は 2026-07-17 サンセット予定。enterprise 版(Google Cloud 経由、100+ PR/日)は Preview。執筆時期によっては consumer 版は過去形になる
5. **ルールファイルの不統一**: Gemini CLI = `GEMINI.md`(階層 + import + `context.fileName` で AGENTS.md 互換可)/ Code Assist agent mode = `GEMINI.md`(IntelliJ は `AGENT.md` も可)/ Jules = `AGENTS.md`。同じ Google 製品群でファイル名が揃っていない点は読者に明示する価値がある
6. **Antigravity の扱い**: 本調査の対象外だが、consumer 移行先として言及が不可避。詳細(料金・無料枠)は https://antigravity.google/pricing を執筆時に別途確認する

## TODO(要確認)

> **TODO(要確認):** Antigravity / Antigravity CLI の製品内容・無料枠・料金を公式ページ(https://antigravity.google/pricing、https://antigravity.google/docs/gcli-migration)で確認する(最終確認: 2026-07-05 時点では未調査)

> **TODO(要確認):** 無料 Gemini API キーで Gemini CLI を使う場合のデータ学習利用ポリシーを Gemini API 利用規約(https://ai.google.dev/gemini-api/terms)で確認する(最終確認: 2026-07-05 時点では未確認)

> **TODO(要確認):** Gemini CLI リポジトリの ToS・プライバシー文書の現所在(旧 docs/tos-privacy.md は 404)と認証方式別のデータ取り扱い一覧を確認する(最終確認: 2026-07-05)

> **TODO(要確認):** Jules の legal ページ(jules.google.com/legal)で無料/有料プランのデータ利用ポリシーの差の有無を確認する(最終確認: 2026-07-05)

> **TODO(要確認):** Code Assist Enterprise の最低ライセンス数(10)と課金条件を料金ページ本体(https://cloud.google.com/products/gemini/pricing)で再確認する(最終確認: 2026-07-05、検索スニペット経由のため)

> **TODO(要確認):** Code Assist GitHub コードレビューの設定ファイル名(config.yaml / styleguide.md 等)をカスタマイズ用ドキュメントで確認する(最終確認: 2026-07-05)
