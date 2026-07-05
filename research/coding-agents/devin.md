# Devin(Cognition)調査メモ — 調査日: 2026-07-05

[CODING-AGENTS-PLAN.md](../../CODING-AGENTS-PLAN.md) §7 の調査チェックリスト(12 項目)に基づく執筆前調査メモです(タスク C-R7)。すべて公式情報(docs.devin.ai / devin.ai / cognition.com)のみを根拠としています。第三者記事は使用していません。

- 対象: **Devin**(提供元: Cognition。旧 Cognition AI / Cognition Labs)
- 公式サイト: <https://devin.ai> / <https://cognition.com>(cognition.ai は cognition.com へ 301 リダイレクト)
- 公式ドキュメント: <https://docs.devin.ai>(全ページ索引: <https://docs.devin.ai/llms.txt>)
- Web アプリ: <https://app.devin.ai>
- 記録様式: `確認した事実 | 出典 URL | 確認日 | 確度(公式明記 / 公式から推測 / 第三者)`

## 前提: 製品ライン全体像(Windsurf 買収後の再編)

執筆時に最も注意すべき点。「Devin」は 2026-07 時点で単一製品ではなく、**Devin ブランドに統一された製品ファミリー**です。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Cognition は 2025-07-14 に Windsurf の買収を発表(IP・商標・ブランド・全従業員。当時 ARR $82M・350 社超のエンタープライズ顧客と公表)。「Devin as the leading fully autonomous agent with Windsurf's IDE product」を統合する方針を明言 | <https://cognition.com/blog/windsurf> | 2026-07-05 | 公式明記 |
| 2026-06-02 に **Windsurf は「Devin Desktop」へ改称**。「Devin Desktop is the new name for Windsurf. It's the same IDE, same editor, and has the same features, but unified under the Devin brand.」 | <https://docs.devin.ai/desktop/devin-desktop-faq.md> | 2026-07-05 | 公式明記 |
| 製品ラインは「Devin Cloud / Devin Desktop / Devin CLI / Devin Review」の 4 本柱に統一(「We're unifying all of our products under the Devin brand」) | <https://docs.devin.ai/desktop/devin-desktop-faq.md> | 2026-07-05 | 公式明記 |
| Windsurf の IDE 内エージェント **Cascade** は「Devin Local」に置き換え(「improved harness, up to 30% better token efficiency, subagent support, and sandboxing」)。既存の Windsurf ルール類は継続して読み込まれ、`.devin/` 形式のルールが追加サポートされる | <https://docs.devin.ai/desktop/devin-desktop-faq.md> | 2026-07-05 | 公式明記 |
| 旧 Windsurf の JetBrains 等向けプラグインは「Windsurf Plugins」として docs 上に存続 | <https://docs.devin.ai/windsurf/plugins/getting-started.md>(llms.txt 索引で確認) | 2026-07-05 | 公式明記 |
| 周辺プロダクト: **DeepWiki**(リポジトリ自動ドキュメント化)、**Ask Devin**(コードベース Q&A)、**Devin API**(v3 が現行)、**Devin MCP** / **DeepWiki MCP**(MCP サーバー)、**Cognition for Government**(FedRAMP 関連の政府向け提供、2026-02-25 発表) | <https://docs.devin.ai/llms.txt> / <https://cognition.com/> | 2026-07-05 | 公式明記 |
| モデル面: 独自モデル「SWE 1.6」を料金ページに記載。「Devin Fusion」を 2026-06-29 に発表(「Frontier Performance at 35% Lower Cost」)。Pro 以上で OpenAI / Claude / Gemini のフロンティアモデルにもアクセス可 | <https://devin.ai/pricing> / <https://cognition.com/>(ブログ一覧) | 2026-07-05 | 公式明記 |

**執筆上の含意**: 本ライブラリでは `windsurf.md`(旧 Windsurf = 現 Devin Desktop)と `devin.md`(クラウド自律型 = Devin Cloud)の 2 ページが同じ Cognition 製品ファミリーを分担する構図になる。`devin.md` は Devin Cloud を主軸とし、Desktop / CLI / Review は製品ライン整理として言及、IDE の詳細は `windsurf.md` に委ねるのが妥当。

## 1. 実行環境

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Devin(Cloud)は「cloud-based AI software engineer that runs in a virtual machine」。実体は「a Linux-based virtual machine with your repositories cloned, tools installed, dependencies resolved, and configuration applied」 | <https://docs.devin.ai/cli/index.md> / <https://docs.devin.ai/onboard-devin/environment.md> | 2026-07-05 | 公式明記 |
| セッションごとに隔離: 「Each Devin session runs on its own isolated machine」 | <https://docs.devin.ai/enterprise/deployment/overview.md> | 2026-07-05 | 公式明記 |
| 永続性: 環境設定は **snapshot**(事前ビルドされた凍結イメージ)として保存。各セッションはスナップショットの新しいコピーから起動し、セッション内の変更はスナップショットへ戻らない(毎回クリーンな状態から開始) | <https://docs.devin.ai/onboard-devin/environment.md> | 2026-07-05 | 公式明記 |
| 環境定義は 2 方式: 宣言的な YAML「**Blueprints**」(推奨・バージョン管理可・Git バックド対応)と、Web UI ウィザードの「Classic」 | <https://docs.devin.ai/onboard-devin/environment.md> / <https://docs.devin.ai/onboard-devin/environment/blueprints.md>(索引で確認) | 2026-07-05 | 公式明記 |
| VM の OS は Linux が既定。**Windows VM も限定提供**(「Devin supports Windows as a build and session platform」「currently available on a limited basis」、シェルは Git Bash、Linux 比で約 9% 多く ACU / クォータを消費) | <https://docs.devin.ai/onboard-devin/environment/windows-support.md> | 2026-07-05 | 公式明記 |
| Android エミュレータ対応の環境ドキュメントあり(詳細未読) | <https://docs.devin.ai/onboard-devin/environment/android-emulation.md>(索引で確認) | 2026-07-05 | 公式明記 |
| 並列実行: 「Carve out independent tasks and run them simultaneously」— 複数セッションの同時実行と API によるプログラマティックなオーケストレーションを公式に推奨 | <https://docs.devin.ai/essential-guidelines/when-to-use-devin.md> | 2026-07-05 | 公式明記 |
| 同時セッション数の上限値(プラン別)は未確認 | — | 2026-07-05 | 未確認 |
| VM のスペック(CPU / RAM)は公式ドキュメントに明記なし | — | 2026-07-05 | 未確認 |
| ローカル実行系: Devin CLI(ローカルの端末で動作)、Devin Desktop 内の Devin Local(ローカルエージェント)。クラウドへの引き継ぎ(handoff)機構あり | <https://docs.devin.ai/cli/index.md> / <https://docs.devin.ai/desktop/getting-started.md> / <https://docs.devin.ai/cli/handoff.md>(索引で確認) | 2026-07-05 | 公式明記 |
| デプロイ形態(Enterprise): ① Enterprise Cloud(マルチテナント SaaS。brain と Devbox が Cognition のクラウド)② Customer Dedicated(シングルテナント。brain は Cognition Cloud、**Devbox は顧客専用のシングルテナント VPC**。AWS PrivateLink または IPSec トンネル接続) | <https://docs.devin.ai/enterprise/deployment/overview.md> | 2026-07-05 | 公式明記 |

## 2. 対応 IDE / CLI

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 主要な利用面: ① Web アプリ(app.devin.ai)② Slack / Microsoft Teams ③ Devin CLI ④ Devin Desktop(専用 IDE)⑤ API | <https://docs.devin.ai/get-started/devin-intro.md> | 2026-07-05 | 公式明記 |
| セッション内に「interactive VSCode environment」が組み込まれており、ユーザーは Devin の編集をリアルタイムに確認・介入できる(Devin IDE) | <https://docs.devin.ai/work-with-devin/devin-session-tools.md> | 2026-07-05 | 公式明記 |
| **Devin Desktop**(旧 Windsurf)は専用 IDE。対応 OS: macOS(OS X Yosemite 以降)、Windows 10 以降、Linux(glibc ≥ 2.28) | <https://docs.devin.ai/desktop/getting-started.md> | 2026-07-05 | 公式明記 |
| **Devin CLI**: 「A local command-line coding agent with deep Devin Cloud integration」。macOS / Linux / WSL(curl スクリプト)、Homebrew、Windows(x86_64 / ARM64 インストーラ、PowerShell スクリプト)。Enterprise では Devin Desktop に同梱 | <https://docs.devin.ai/cli/index.md> | 2026-07-05 | 公式明記 |
| CLI の制約(2026-07 時点): 「Devin CLI does not yet support Knowledge, Playbooks, or Secrets from your Devin account」 | <https://docs.devin.ai/cli/index.md> | 2026-07-05 | 公式明記 |
| CLI は ACP(Agent Client Protocol)経由で JetBrains / Zed から利用可能。Devin Desktop 側にも ACP ドキュメントあり | <https://docs.devin.ai/cli/acp/jetbrains.md> / <https://docs.devin.ai/desktop/acp.md>(索引で確認) | 2026-07-05 | 公式明記 |
| 旧 Windsurf 系の IDE プラグイン(JetBrains / VS Code / Visual Studio / Eclipse のトラブルシュートページが存在)は「Windsurf Plugins」として提供継続 | <https://docs.devin.ai/windsurf/plugins/getting-started.md>(索引で確認) | 2026-07-05 | 公式明記 |

## 3. リポジトリ理解

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **事前インデックス方式**: 「Indexing your repositories allows Devin to understand your codebase and enables powerful features like Ask Devin and DeepWiki」。Organization Settings > Repositories からブランチ単位でインデックスを作成 | <https://docs.devin.ai/onboard-devin/index-repo.md> | 2026-07-05 | 公式明記 |
| インデックスは環境設定と別物: 「Repository indexing is separate from environment configuration」(インデックス = コード理解、環境 = 実行環境) | <https://docs.devin.ai/onboard-devin/index-repo.md> | 2026-07-05 | 公式明記 |
| **DeepWiki**: 「automatically indexes your repos and produces wikis with architecture diagrams, links to sources, and summaries of your codebase」。公開 GitHub リポジトリ向け無償版が <https://deepwiki.com>。プライベートリポジトリの完全版は Devin アプリ内。`.devin/wiki.json` で生成を制御可能 | <https://docs.devin.ai/work-with-devin/deepwiki.md> | 2026-07-05 | 公式明記 |
| **Ask Devin**: インデックスとウィキを使ったコードベース Q&A(「advanced code search」+ wiki コンテキスト) | <https://docs.devin.ai/work-with-devin/deepwiki.md> / <https://docs.devin.ai/onboard-devin/index-repo.md> | 2026-07-05 | 公式明記 |
| インデックス API あり(v3: Index Repository / Bulk Index / Indexing Status) | <https://docs.devin.ai/api-reference/v3/repositories/put-organizations-index-repository.md>(索引で確認) | 2026-07-05 | 公式明記 |
| モノレポ・大規模リポジトリ固有の制約は公式ドキュメントに明記なし(「インデックス所要時間はリポジトリサイズに依存」のみ) | <https://docs.devin.ai/onboard-devin/index-repo.md> | 2026-07-05 | 未確認(記載なし) |
| セッション実行時は VM 内にリポジトリがクローンされており、シェルでのオンデマンド検索も可能(VM 環境の性質から) | <https://docs.devin.ai/onboard-devin/environment.md> | 2026-07-05 | 公式から推測 |

## 4. ファイル編集

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Devin は VM 内の組み込み VSCode(IDE)でコードを編集。人間は「check in on Devin's edits in real time」でき、セッションを停止して IDE を直接引き継げる(「Click to stop the session to take over and start using the IDE yourself」) | <https://docs.devin.ai/work-with-devin/devin-session-tools.md> | 2026-07-05 | 公式明記 |
| 成果物は Git ブランチ + Pull Request として提出(「pushing branches, opening pull requests, and participating in PR discussions」= 通常のコントリビューターとして動作) | <https://docs.devin.ai/integrations/gh.md> | 2026-07-05 | 公式明記 |
| PR 作成時は `PULL_REQUEST_TEMPLATE/devin_pr_template.md` → 標準テンプレートの順で探索。なければ既定フォーマット | <https://docs.devin.ai/integrations/pr-templates.md>(gh.md 経由で確認) | 2026-07-05 | 公式明記 |
| 変更のロールバック: セッションは毎回クリーンなスナップショットから起動するため VM 側の変更は残らない。リポジトリ側の変更は PR / ブランチ経由のため Git の通常手段でレビュー・差し戻し可能 | <https://docs.devin.ai/onboard-devin/environment.md> | 2026-07-05 | 公式から推測 |
| Progress Tab に「All shell commands, code edits, and browser activity will be logged in one unified view」(全編集の追跡ビュー) | <https://docs.devin.ai/work-with-devin/devin-session-tools.md> | 2026-07-05 | 公式明記 |

## 5. コマンド実行

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 「Devin's shell provides full command-line access to the development environment」— VM 内でフルのシェルアクセスを持ち、テスト実行・ビルド等を自律的に行う | <https://docs.devin.ai/work-with-devin/devin-session-tools.md> | 2026-07-05 | 公式明記 |
| ブラウザ操作も可能(Interactive Browser / Desktop タブ。「directly view and interact with Devin's browser and desktop environment」)。Computer Use のドキュメントページあり | <https://docs.devin.ai/work-with-devin/devin-session-tools.md> / <https://docs.devin.ai/work-with-devin/computer-use.md>(索引で確認) | 2026-07-05 | 公式明記 |
| クラウドセッションでは**コマンド実行前の人間の承認ステップはない**(自律実行が前提。人間は Progress Tab で追跡・停止・介入する事後型) | <https://docs.devin.ai/work-with-devin/devin-session-tools.md> / <https://docs.devin.ai/get-started/devin-intro.md> | 2026-07-05 | 公式から推測(承認ゲートの記載が存在しないことに基づく) |
| Devin CLI 側には Permissions / Sandbox のリファレンスページがあり、ローカル実行では権限制御・サンドボックス機構を持つ(詳細未読) | <https://docs.devin.ai/cli/reference/permissions.md> / <https://docs.devin.ai/cli/sandbox.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| テスト・動作確認は「CI passes or deployment testing」で検証する運用を公式が推奨。テスト実行の動画記録機能(Testing & Video Recordings)あり | <https://docs.devin.ai/get-started/devin-intro.md> / <https://docs.devin.ai/work-with-devin/testing-and-recordings.md>(索引で確認) | 2026-07-05 | 公式明記 |
| スケジュール実行: cron 式(例: `0 9 * * 1-5`)またはプリセットで定期セッションを自動起動(「Scheduled Sessions」)。用途例: 依存関係の定期更新、レポート、監視 | <https://docs.devin.ai/product-guides/scheduled-sessions.md> | 2026-07-05 | 公式明記 |

## 6. MCP・外部ツール連携

### MCP

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Devin(Cloud)は MCP クライアント。トランスポートは **STDIO**(`npx` / `uvx` / Docker などローカル CLI 型)・**SSE**(レガシー、非推奨化中)・**HTTP**(Streamable HTTP、推奨)の 3 種 | <https://docs.devin.ai/work-with-devin/mcp.md> | 2026-07-05 | 公式明記 |
| **MCP Marketplace**: AlloyDB / Asana / Atlassian / BigQuery / Figma / Linear / Notion / PostgreSQL / Sentry / Slack / Stripe / Vercel など 30 以上の事前設定済み MCP。多くは「Enable」+ セッション中の OAuth 認証のみで利用可 | <https://docs.devin.ai/work-with-devin/mcp.md> | 2026-07-05 | 公式明記 |
| カスタム MCP サーバーの追加は「Manage MCP Servers」権限を持つ組織管理者のみ(一般ユーザーはリクエスト送信) | <https://docs.devin.ai/work-with-devin/mcp.md> | 2026-07-05 | 公式明記 |
| Devin 自身も MCP サーバーとして公開(**Devin MCP**)。DeepWiki にも公開版 **DeepWiki MCP** あり | <https://docs.devin.ai/work-with-devin/devin-mcp.md> / <https://docs.devin.ai/work-with-devin/deepwiki-mcp.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| Devin CLI / Devin Desktop(Cascade / Devin Local)にもそれぞれ MCP 設定機構あり | <https://docs.devin.ai/cli/extensibility/mcp/overview.md> / <https://docs.devin.ai/desktop/cascade/mcp.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |

### 外部サービスからの委任(トリガー面)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Slack / Microsoft Teams**: 「kick off runs directly via Slack by tagging @Devin」(Teams も同様)。セッション開始と進捗通知を チャット内で完結 | <https://docs.devin.ai/integrations/overview.md> | 2026-07-05 | 公式明記 |
| **Linear**: ① チケットを Devin にアサイン(既定 Playbook 使用)② `!plan` / `!implement` / `!triage` / `!review` ラベルで対応 Playbook 起動 ③ コメントで @mention(コメント内容を指示として使用)。Devin の Todo リストが Linear の plan UI に同期、活動フィードに実行コマンド・編集ファイル・進捗を投稿、stop シグナルで停止可能。PR URL は自動でセッションに追加 | <https://docs.devin.ai/integrations/linear.md> | 2026-07-05 | 公式明記 |
| **Jira**: ① Devin サービスアカウントへのチケットアサイン ② Playbook ラベル(`!plan` 等)③ `devin` ラベル ④ コメントで @mention。PR リンクは Jira 課題に remote link + コメントとして自動追加。セッションへの直リンクも投稿 | <https://docs.devin.ai/integrations/jira.md> | 2026-07-05 | 公式明記 |
| **GitHub**: GitHub App として連携し「work in your repositories as a regular contributor」。PR コメントに自動応答(「Devin automatically responds to PR comments as long as the session has not been archived」)。GitHub Enterprise Server / Cloud with Data Residency 対応 | <https://docs.devin.ai/integrations/gh.md> | 2026-07-05 | 公式明記 |
| **GitLab / Bitbucket / Azure DevOps** 対応(セルフホスト SCM 含む。GitLab Self-Managed / GitHub Enterprise Server / Azure DevOps の Enterprise 向け個別ガイドあり) | <https://docs.devin.ai/integrations/overview.md> / <https://docs.devin.ai/enterprise/integrations/git-integrations.md>(索引で確認) | 2026-07-05 | 公式明記 |
| **API / CI 連携**: 「Programmatic session creation for CI/CD pipeline integration」 | <https://docs.devin.ai/integrations/overview.md> | 2026-07-05 | 公式明記 |
| **Devin API**(現行 v3): セッション作成・メッセージ送受・Knowledge / Playbook / Secret 管理・組織横断管理(Enterprise API)。認証はサービスユーザー資格情報(`cog_` プレフィックス)。`create_as_user_id` で組織内ユーザーの代理セッション作成可。Personal Access Token は「coming soon」。v1 / v2 はレガシー(廃止移行中) | <https://docs.devin.ai/api-reference/overview.md> | 2026-07-05 | 公式明記 |
| API のレート制限の具体値は未確認 | <https://docs.devin.ai/api-reference/overview.md> | 2026-07-05 | 未確認 |

## 7. 設定ファイル

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **AGENTS.md 対応**: 「Devin supports AGENTS.md - a simple, open standard for providing context and instructions to AI agents」。プロジェクトルート(または任意の場所)に置くと「Devin will look for the file before it starts coding」 | <https://docs.devin.ai/onboard-devin/agents-md.md> | 2026-07-05 | 公式明記 |
| **Knowledge**: 「a collection of tips, advice, and instructions that Devin can reference in all sessions」。手動作成に加え、チャットのフィードバックから **Devin が自動で Knowledge を提案**。トリガー記述(retrieval 条件)を各エントリに付与。スコープは Organization / Enterprise(全組織)/ リポジトリ単位のピン留め | <https://docs.devin.ai/product-guides/knowledge.md> | 2026-07-05 | 公式明記 |
| **Playbooks**: セッションに添付する再利用可能な手順書テンプレート。`<filename>.devin.md` ファイルとして保存可。マクロ(例: `!data-tutorial`)で呼び出し。Team / Community ライブラリから選択可。Linear / Jira のラベル(`!implement` 等)とも対応付け | <https://docs.devin.ai/product-guides/using-playbooks.md> / <https://docs.devin.ai/integrations/linear.md> | 2026-07-05 | 公式明記 |
| **Blueprints**: 実行環境(VM)の宣言的 YAML 定義。Git バックド(リポジトリ管理)対応。Enterprise 用の Blueprint 管理 API あり | <https://docs.devin.ai/onboard-devin/environment.md> / <https://docs.devin.ai/onboard-devin/environment/git-backed-blueprints.md>(索引で確認) | 2026-07-05 | 公式明記 |
| **Skills**: Cloud 側(product-guides/skills)・CLI 側(extensibility/skills)・Desktop 側(cascade/skills)にそれぞれ Skills 機構あり(詳細未読) | <https://docs.devin.ai/product-guides/skills.md> ほか(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| Devin Desktop は旧 Windsurf ルールを継続して読み、`.devin/` 配下の新形式も追加サポート。CLI にも Rules & AGENTS.md・設定ファイル(グローバル / ローカルの優先順位)機構あり | <https://docs.devin.ai/desktop/devin-desktop-faq.md> / <https://docs.devin.ai/cli/extensibility/rules.md>(索引で確認) | 2026-07-05 | 公式明記 |
| Knowledge / Playbook は API(v3)で組織横断的に CRUD 可能 → 組織での集中管理・配布が可能 | <https://docs.devin.ai/api-reference/overview.md> | 2026-07-05 | 公式明記 |

## 8. 権限管理(承認・介入のモデル)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 基本モデルは「委任 → 自律実行 → 事後レビュー」型。人間の関与点は公式ガイドで ① 事前: Ask Devin で「scope the approach ... before a single line of code is written」+ 明確な完了基準の付与 ② 実行中: Session Insights で「investigate the session timeline and identify actionable feedback」、Progress Tab での追跡、セッション停止と IDE の引き継ぎ ③ 事後: PR レビュー(Devin は PR コメントに自動応答、Auto-Fix 有効時は「without you needing to be in the loop」) | <https://docs.devin.ai/essential-guidelines/when-to-use-devin.md> / <https://docs.devin.ai/work-with-devin/devin-session-tools.md> | 2026-07-05 | 公式明記 |
| コマンド実行単位の事前承認(Claude Code の許可プロンプトに相当するもの)はクラウドセッションには存在しない | 上記各ページに記載なし | 2026-07-05 | 公式から推測(記載の不存在に基づく) |
| **AI Guardrails**(Enterprise): 「Guardrails run as an additional layer of oversight on messages sent to Devin. They analyze user messages in real time」。プロンプトインジェクション・データ持ち出し・ポリシー違反を検知し、`log_only` / `warn_user` / `block_message` / `kill_session` の 4 段階で対応。違反は監査ログ(`ai_guardrail_violation`)と Guardrail Violations API に記録 | <https://docs.devin.ai/enterprise/features/ai-guardrails.md> | 2026-07-05 | 公式明記 |
| **Git Permissions API**(v3)でリポジトリアクセス権を組織単位に制御可能。Enterprise は Repository Permissions でリポジトリ割り当て | <https://docs.devin.ai/api-reference/v3/git-permissions/organizations-git-providers-permissions.md>(索引で確認) / <https://docs.devin.ai/onboard-devin/environment.md> | 2026-07-05 | 公式明記(存在のみ) |
| GitHub App の要求権限が公開されている: read(Dependabot alerts / Actions / metadata ほか)、read & write(checks / commit statuses / contents / discussions / issues / pull requests / projects / workflows) | <https://docs.devin.ai/integrations/gh.md> | 2026-07-05 | 公式明記 |
| main へのマージ防護は Devin 側でなく Git ホスティング側のブランチ保護で行う想定(「enabling branch protection rules on your main branch to ensure all required checks pass before Devin can merge changes」を公式推奨) | <https://docs.devin.ai/integrations/gh.md> | 2026-07-05 | 公式明記 |
| Devin CLI にはローカル向けの Permissions リファレンスと Sandbox 機構、Enterprise 向け Controls(管理者による制御)がある(詳細未読) | <https://docs.devin.ai/cli/reference/permissions.md> / <https://docs.devin.ai/cli/enterprise/controls.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| Devin Review の Auto-Fix 有効化は組織管理者のみ可能。「per-PR spending limits measured in ACUs」を設定可 | <https://docs.devin.ai/work-with-devin/devin-review.md> | 2026-07-05 | 公式明記 |

## 9. セキュリティ

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 「Cognition obtained SOC 2 Type II certification and conducted Security Training in March 2024」。Trust Center: <https://trust.cognition.ai> | <https://docs.devin.ai/admin/security.md> | 2026-07-05 | 公式明記 |
| **学習利用(重要)**: 有償プランでも**既定ではデータが学習改善に使われ得る**。「(you can) opt out at any time on the Data Controls settings page. After you opt out, your data will not be used for training and Zero Data Retention will be enabled with our model providers」。**Enterprise は既定で学習不使用**(「we will never train on your data without your express prior written consent」) | <https://docs.devin.ai/admin/security.md> | 2026-07-05 | 公式明記 |
| データ保持: 「Cognition only retains data processed through Devin for the duration of the relationship with a given Customer, unless otherwise specified by the Customers」 | <https://docs.devin.ai/admin/security.md> | 2026-07-05 | 公式明記 |
| 隔離: セッションごとに専用の隔離マシン。「All data stays encrypted in transit and at rest」。通信は「secure WebSocket」。Cognition のテナントは Azure ホスト(クロステナント通信基盤) | <https://docs.devin.ai/enterprise/deployment/overview.md> | 2026-07-05 | 公式明記 |
| ネットワーク: Customer Dedicated 構成で AWS PrivateLink(推奨)/ IPSec / OpenVPN による社内リソース接続。IP Access List 機能(API あり)。VPN 設定ガイドあり | <https://docs.devin.ai/enterprise/deployment/overview.md> / <https://docs.devin.ai/enterprise/security-access/ip-access-lists.md>(索引で確認) / <https://docs.devin.ai/onboard-devin/vpn.md>(索引で確認) | 2026-07-05 | 公式明記 |
| **Secrets**: Settings の Secrets 機能で認証情報を管理。「All secrets are encrypted at rest」、セッション内では通常の環境変数として参照。ブラウザ認証用に Site Cookies(Chrome 拡張でエクスポート)も登録可。組織スコープと個人スコープあり | <https://docs.devin.ai/product-guides/secrets.md> | 2026-07-05 | 公式明記 |
| モデル / エージェントに対する秘密値のマスキング有無は公式に明記なし | <https://docs.devin.ai/product-guides/secrets.md> | 2026-07-05 | 未確認 |
| Customer Managed Keys(CMK)のドキュメントあり(Enterprise、詳細未読) | <https://docs.devin.ai/enterprise/security-access/security/customer-managed-keys.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| 政府向け: Federal ドキュメント一式(Security / Compliance / Terms)と「Cognition for Government」(2026-02-25 発表)。Devin Desktop 側に FedRAMP Security Admin Guide あり | <https://docs.devin.ai/federal/introduction.md>(索引で確認) / <https://cognition.com/>(ブログ一覧) / <https://docs.devin.ai/desktop/security/security-admin-guide.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| Security Swarm(セキュリティ関連機能)・Code Scans API(検出・修復)あり(詳細未読) | <https://docs.devin.ai/work-with-devin/security-swarm.md> / <https://docs.devin.ai/api-reference/v3/code-scans/enterprise-code-scans-findings.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |

## 10. チーム導入機能

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Teams プラン: 「Unlimited team members」「Centralized billing」「Admin dashboard with analytics」「Priority support」 | <https://devin.ai/pricing> | 2026-07-05 | 公式明記 |
| Enterprise プラン: 「SAML/OIDC SSO」「Centralized enterprise admin controls」「Dedicated deployment option」「Dedicated account management」 | <https://devin.ai/pricing> | 2026-07-05 | 公式明記 |
| SSO: Okta / Entra ID / SAML / OIDC の個別セットアップガイドあり。IdP グループ連携(IdP Groups API)、SCIM は Desktop 側ドキュメントに記載(SSO & SCIM) | <https://docs.devin.ai/enterprise/security-access/sso/guide.md> / <https://docs.devin.ai/desktop/accounts/sso-scim.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| RBAC: Custom Roles & RBAC(Enterprise)。API v3 に Roles / Users / Service Users / IDP Groups 管理エンドポイント | <https://docs.devin.ai/enterprise/security-access/custom-roles.md>(索引で確認) / <https://docs.devin.ai/api-reference/overview.md> | 2026-07-05 | 公式明記(存在のみ) |
| 監査ログ: Organization / Enterprise の Audit Logs API(Guardrail 違反も `ai_guardrail_violation` として記録) | <https://docs.devin.ai/api-reference/v3/audit-logs/enterprise-audit-logs.md>(索引で確認) / <https://docs.devin.ai/enterprise/features/ai-guardrails.md> | 2026-07-05 | 公式明記 |
| 利用状況の可視化: Metrics API(DAU / WAU / MAU、セッション数、PR 数、消費量の日次集計、ユーザー別・セッション別消費)。Session Insights でセッション単位の消費とタイムラインを確認 | <https://docs.devin.ai/api-reference/overview.md>(v3 索引)/ <https://docs.devin.ai/admin/billing/usage.md> | 2026-07-05 | 公式明記 |
| Enterprise は複数 Organization を持てる階層構造(Enterprise API が組織横断管理を提供。組織の作成・削除・グループ制限等) | <https://docs.devin.ai/api-reference/overview.md> / <https://docs.devin.ai/enterprise/getting-started/organizations.md>(索引で確認) | 2026-07-05 | 公式明記 |

## 11. 料金・利用制限

> 方針(PLAN §7): 金額は本文(docs/)に転記しない。ここでは参照先 URL と確認日を正とする。料金参照先: <https://devin.ai/pricing>(確認日: 2026-07-05)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| セルフサーブのプラン名(2026-07-05 時点): **Free / Pro / Max / Teams**、加えて **Enterprise**(カスタム)。旧 Windsurf と統合された単一の料金体系で、クォータは「Devin sessions, CLI, and Desktop access」を横断してカバー | <https://devin.ai/pricing> / <https://docs.devin.ai/admin/billing/self-serve.md> | 2026-07-05 | 公式明記 |
| 参考価格(転記禁止対象・記録のみ): Free $0 / Pro $20 月 / Max $200 月 / Teams $80 月〜 + Full Seat $40 月(Flex Seat は無料でチーム共有クレジット使用)。Enterprise はカスタム | <https://devin.ai/pricing> / <https://docs.devin.ai/admin/billing/self-serve.md> | 2026-07-05 | 公式明記 |
| 課金単位: **セルフサーブ = 含有クォータ + オンデマンドクレジット**(「a mix of included quota and on-demand credits」。クレジットは月をまたいで繰越・失効なし、Teams ではメンバー間共有)。**Enterprise = ACU(Agent Compute Units)**(「Devin Enterprise customers are billed in Agent Compute Units (ACUs) at the rate set in their order form」) | <https://docs.devin.ai/admin/billing.md> / <https://docs.devin.ai/admin/billing/self-serve.md> | 2026-07-05 | 公式明記 |
| 消費の仕組み: 「Number and complexity of actions Devin takes (planning, context gathering, task execution, browser actions, code execution, and so on)」+ VM 時間 + 帯域で加算。**1 ACU が何に相当するかの具体的定義は公式ドキュメントに記載なし** | <https://docs.devin.ai/admin/billing/usage.md> | 2026-07-05 | 公式明記(定義の不在も明記) |
| アイドル制御: 「Devin typically sleeps automatically after roughly 0.1 ACUs (or the equivalent quota / on-demand credit) of inactivity」。スリープ中の消費はゼロ | <https://docs.devin.ai/admin/billing/usage.md> | 2026-07-05 | 公式明記 |
| クォータ構造: Pro / Teams Full Seat は日次 + 週次の許容量(「The daily allowance is more than 1/7 of the weekly」)。Max は週次のみ(日次上限なし) | <https://docs.devin.ai/admin/billing/self-serve.md> | 2026-07-05 | 公式明記 |
| Free プランの範囲: 「Light quota to code with agents」「Limited model availability」「Unlimited inline edits」「Unlimited Tab completions」(Tab 補完は旧 Windsurf 由来の機能。クラウドエージェント Devin Cloud へのアクセスは Pro 以上に記載) | <https://devin.ai/pricing> | 2026-07-05 | 公式明記 |
| Devin Review は「per-PR spending limits measured in ACUs」を設定可能(Individual / Teams プランにも支出制御の記述) | <https://docs.devin.ai/work-with-devin/devin-review.md> | 2026-07-05 | 公式明記 |
| API のレート制限、並列セッション数上限の具体値は未確認 | — | 2026-07-05 | 未確認 |
| 補足: かつての「ACU ベースのセルフサーブ課金(Core プラン等)」から、2026-07 時点では上記のクォータ + クレジット制へ移行している(現行ドキュメントに旧体系の記載なし)。改定時期は未確認 | <https://docs.devin.ai/admin/billing.md> | 2026-07-05 | 公式から推測 |

## 12. 代表的なユースケース

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 公式の位置づけ: 「the AI software engineer, built to help ambitious engineering teams crush their backlogs」。タスク規模の目安は「if a task would take you three hours or less, Devin can most likely do it」 | <https://docs.devin.ai/get-started/devin-intro.md> / <https://docs.devin.ai/essential-guidelines/when-to-use-devin.md> | 2026-07-05 | 公式明記 |
| 適性: 「Devin can handle the majority of engineering tasks, including medium and hard complexity work」。テストスイート・CI チェック等の**検証可能な完了基準があるタスク**が最適。大きな仕事は複数セッションに分割(Session Insights のサイズ表示で XS / S / M 推奨) | <https://docs.devin.ai/essential-guidelines/when-to-use-devin.md> | 2026-07-05 | 公式明記 |
| 公式が挙げる用途: 機能実装、バグ再現・修正、Linear / Jira チケット処理、テスト作成、コードマイグレーション、リファクタリング、フレームワークアップグレード、PR レビュー、ドキュメント保守、社内ツール開発 | <https://docs.devin.ai/get-started/devin-intro.md> | 2026-07-05 | 公式明記 |
| 公式ユースケース集(examples): エンジニアリングバックログ解消、COBOL モダナイゼーション、Java アップグレード、JavaScript → TypeScript 移行、NoSQL → SQL 移行、SAS → PySpark 移行 — **移行・モダナイゼーション系が厚い** | <https://docs.devin.ai/use-cases/index.md>(索引で確認) | 2026-07-05 | 公式明記 |
| 運用モデル: 独立したタスクを切り出して並列実行、スケジュールセッションで定常タスクを自動化、Auto-Triage / Automations 機能(索引で確認、詳細未読)。人間は事前スコーピングと事後レビューに集中 | <https://docs.devin.ai/essential-guidelines/when-to-use-devin.md> / <https://docs.devin.ai/product-guides/scheduled-sessions.md> / <https://docs.devin.ai/product-guides/auto-triage.md>(索引で確認) | 2026-07-05 | 公式明記 |
| データ分析向けの Data Analyst Agent もあり(索引で確認、詳細未読) | <https://docs.devin.ai/work-with-devin/data-analyst.md>(索引で確認) | 2026-07-05 | 公式明記(存在のみ) |
| コミュニティでの定着用途(評判)は本調査では扱っていない(第三者情報のため) | — | 2026-07-05 | — |

## 執筆時の注意・未確認事項まとめ

- **未確認**: VM スペック、並列セッション数の上限、API レート制限の具体値、モノレポでのインデックス制約、秘密値のモデルに対するマスキング、セルフサーブ課金体系の改定時期、Devin Fusion の詳細(モデルの位置づけ)
- **鮮度リスク大(定点観測候補)**: プラン名と価格(2026-06 の Windsurf 統合直後で変動余地大)、ACU とクォータ / クレジットの仕組み、製品名(Windsurf → Devin Desktop 改称直後。docs 内に旧名残存: `.codeium/windsurf` パス、`windsurf-*` ページ名)、Devin Fusion / SWE 1.6 などモデルライン、Windows VM サポートの提供範囲(現在は限定提供)、CLI の機能ギャップ(Knowledge / Playbooks / Secrets 未対応)
- **執筆方針メモ**: ① `devin.md` は Devin Cloud(自律型)を主軸に、Desktop / CLI / Review は「Devin ブランドの製品ファミリー」として整理し、IDE 詳細は `windsurf.md` と相互リンク ② 承認モデルは「コマンド単位の事前承認なし・委任 → 自律実行 → 事後レビュー + Enterprise Guardrails」として、Claude Code 等の都度承認型との対比で書くと分かりやすい ③ 学習利用の既定(有償セルフサーブでも既定オン・オプトアウト方式、Enterprise のみ既定オフ)は選定上の重要事実として明記する
