# Cursor(Anysphere)調査メモ — C-R5

- **対象**: Cursor(提供元: Anysphere)
- **調査日**: 2026-07-05
- **調査方法**: [CODING-AGENTS-PLAN.md](../../CODING-AGENTS-PLAN.md) §7 の 12 項目チェックリストに従い、公式ドキュメント(cursor.com/docs)・料金ページ・セキュリティ / データ取り扱いページのみを根拠として確認。第三者記事は根拠にしていません
- **記録様式**: `項目 | 確認した事実 | 出典 URL | 確認日 | 確度(公式明記 / 公式から推測 / 第三者)`
- **注記**: 旧 docs.cursor.com は cursor.com/docs へ 308 リダイレクト(確認日 2026-07-05)。出典はすべて新 URL で記載

## 1. 実行環境

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| IDE・CLI はローカル実行。IDE の対応 OS: macOS 12(Monterey)以降(Apple Silicon / Intel)、Windows 10 以降、Linux(Debian/Ubuntu・RHEL/Fedora・AppImage) | https://cursor.com/docs/get-started/installation | 2026-07-05 | 公式明記 |
| CLI の対応プラットフォーム: macOS / Linux / WSL(curl インストール)、Windows(PowerShell インストーラ) | https://cursor.com/docs/cli/overview | 2026-07-05 | 公式明記 |
| Cloud Agents は「isolated VMs in the cloud with full development environments」で動作。リポジトリをクローンし別ブランチで作業 | https://cursor.com/docs/cloud-agent | 2026-07-05 | 公式明記 |
| Cloud Agents の環境構築は「agent-led setup, a saved snapshot, or a Dockerfile」を `.cursor/environment.json` で指定 | https://cursor.com/docs/cloud-agent | 2026-07-05 | 公式明記 |
| Cloud Agents は並列実行無制限(「You can run as many agents as you want in parallel」)。ローカルマシンの接続は不要 | https://cursor.com/docs/cloud-agent | 2026-07-05 | 公式明記 |
| CLI の print モードは「scripts, CI pipelines, or automation」向けと明記(CI 実行に対応) | https://cursor.com/docs/cli/overview | 2026-07-05 | 公式明記 |
| VM の永続性(スナップショット保存以外のセッション間永続化)の詳細 | — | 2026-07-05 | 未確認 |

## 2. 対応 IDE / CLI

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 専用 IDE(既存 IDE の拡張ではない)。「Cursor is based upon the VS Code codebase」と公式明記(VS Code フォークという語は公式ページでは未使用) | https://cursor.com/docs/configuration/migrations/vscode | 2026-07-05 | 公式明記 |
| VS Code からの移行: 拡張機能・テーマ・設定・キーバインドをワンクリックでインポート可能 | https://cursor.com/docs/configuration/migrations/vscode | 2026-07-05 | 公式明記 |
| VS Code Marketplace との互換性・利用可否は移行ページに記載なし | https://cursor.com/docs/configuration/migrations/vscode | 2026-07-05 | 未確認 |
| CLI あり(`agent` コマンド)。対話モードと非対話(print)モード。動作モードは Agent / Plan / Ask の 3 種 | https://cursor.com/docs/cli/overview | 2026-07-05 | 公式明記 |
| Web(cursor.com/agents。任意のデバイス)・モバイル(iOS アプリ、Android は PWA)から Cloud Agents を操作可能 | https://cursor.com/docs/cloud-agent | 2026-07-05 | 公式明記 |
| PR レビュー製品 Bugbot あり(§6 参照) | https://cursor.com/docs/bugbot | 2026-07-05 | 公式明記 |

## 3. リポジトリ理解(インデックス方式)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 事前インデックス方式(埋め込み)。「Cursor breaks your code into meaningful chunks (functions, classes, logical blocks), converts each chunk into a vector embedding ... and stores the results in a vector database」 | https://cursor.com/docs/context/codebase-indexing | 2026-07-05 | 公式明記 |
| コード平文はサーバーに保存されない。「Code content is never stored in plaintext; it is held in memory during indexing, then discarded」「plaintext code for computing embeddings ceases to exist after the life of the request」 | https://cursor.com/docs/context/codebase-indexing / https://cursor.com/data-use | 2026-07-05 | 公式明記 |
| 埋め込みとメタデータ(ハッシュ・ファイル名)は Cursor のデータベースに保存され得る。「The embeddings and metadata about your codebase (hashes, file names) may be stored in our database」 | https://cursor.com/data-use | 2026-07-05 | 公式明記 |
| ファイルパスは送信前に暗号化。「File paths are encrypted before being sent to Cursor's servers」。検索時はクライアント側で復号(「decrypts the chunks on the client side」) | https://cursor.com/docs/context/codebase-indexing | 2026-07-05 | 公式明記 |
| `.gitignore` / `.cursorignore` に含まれるファイルはインデックス対象外 | https://cursor.com/docs/context/codebase-indexing | 2026-07-05 | 公式明記 |
| 大規模リポジトリ / モノレポでは `.cursorignore`(.gitignore 構文)で不要部分を除外することを公式が推奨 | https://cursor.com/docs/configuration/tools/large-codebases | 2026-07-05 | 公式明記 |
| 組織内でのインデックス再利用による高速化(チームメイトの既存インデックスを安全に再利用)を公式ブログが解説 | https://cursor.com/blog/secure-codebase-indexing | 2026-07-05 | 公式明記(公式ブログ) |
| マルチルートワークスペース対応(全コードベースが自動インデックスされ Agent から利用可能) | https://cursor.com/docs/context/codebase-indexing | 2026-07-05 | 公式明記 |
| Agent のツールにはセマンティック検索(インデックス利用)に加え、ファイル名検索・grep 的なパターン検索もあり(事前索引とオンデマンド検索の併用) | https://cursor.com/docs/agent/tools | 2026-07-05 | 公式明記 |
| リポジトリサイズの明示的な上限値 | — | 2026-07-05 | 未確認 |

## 4. ファイル編集

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Agent はファイル編集ツールを持ち「Suggest edits to files and apply them automatically」。複数ファイル編集に対応(diff ビューで変更を逐次表示) | https://cursor.com/docs/agent/tools | 2026-07-05 | 公式明記 |
| ロールバック手段: チェックポイント。「Agent が大きな変更を行う前に自動作成」され、チャットのタイムラインから任意の時点へ復元可能 | https://cursor.com/docs/agent/chat/checkpoints | 2026-07-05 | 公式明記 |
| チェックポイントはローカル保存で Git とは独立。「Agent の変更の取り消し専用。恒久的なバージョン管理には Git を使う」と公式が注記 | https://cursor.com/docs/agent/chat/checkpoints | 2026-07-05 | 公式明記 |
| レビュー支援: `@Branch` でブランチ全体の diff を Agent に渡してレビューさせる使い方を公式が案内 | https://cursor.com/docs/agent/review | 2026-07-05 | 公式明記 |

## 5. コマンド実行

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Agent はターミナル実行ツールを持つ(「Execute terminal commands and monitor output」) | https://cursor.com/docs/agent/tools | 2026-07-05 | 公式明記 |
| 既定ではターミナルコマンドは承認が必要(「terminal commands require approval by default」) | https://cursor.com/docs/agent/security | 2026-07-05 | 公式明記 |
| Run Mode は 3 種(Cursor 3.6 以降): **Auto-review**(推奨既定。許可リスト内は即実行、他はサンドボックス実行、それ以外は LLM 分類器が判定)/ **Allowlist**(許可リストのみ自動実行)/ **Run Everything**(全コマンド無承認。旧来の YOLO / auto-run に相当する全自動実行) | https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記(「YOLO」という名称は現行公式 docs では未使用 — 公式から推測) |
| 許可リストは `permissions.json` に自然文で記述(`allow_instructions` / `block_instructions`)。「許可リストはベストエフォートであり、セキュリティ境界ではない」と公式が明記 | https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記 |
| Auto-review の分類器は「allow the call, ask the agent to take a different approach, or ask you to approve」のいずれかを行う。誤判定があり得るとも明記 | https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記 |
| CLI にもサンドボックス設定あり(`/sandbox` または `--sandbox <mode>`) | https://cursor.com/docs/cli/overview | 2026-07-05 | 公式明記 |
| バックグラウンド実行: ローカルの明示的なバックグラウンドコマンド実行機能は docs で未確認(非同期実行は Cloud Agents が担う) | — | 2026-07-05 | 未確認 |

## 6. MCP・外部ツール連携

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| MCP クライアント対応。トランスポートは stdio / SSE / Streamable HTTP の 3 種 | https://cursor.com/docs/context/mcp | 2026-07-05 | 公式明記 |
| 設定場所: プロジェクト `.cursor/mcp.json`、グローバル `~/.cursor/mcp.json` | https://cursor.com/docs/context/mcp | 2026-07-05 | 公式明記 |
| OAuth 対応(SSE / Streamable HTTP)。静的 OAuth クライアント資格情報も設定可能。Marketplace からのワンクリックインストールあり | https://cursor.com/docs/context/mcp | 2026-07-05 | 公式明記 |
| 既定で MCP ツール使用前に承認を要求。「All MCP connections need your approval. After you approve an MCP connection, each tool call still needs individual approval」 | https://cursor.com/docs/context/mcp / https://cursor.com/docs/agent/security | 2026-07-05 | 公式明記 |
| フック機構あり: `hooks.json`(プロジェクト `.cursor/hooks.json` / ユーザー `~/.cursor/hooks.json` / チームはダッシュボード配布)。stdio 上の JSON でエージェントループを「observe, block, or modify」。exit code 2 でアクションをブロック | https://cursor.com/docs/agent/hooks | 2026-07-05 | 公式明記 |
| フックのイベント例: `sessionStart` / `beforeShellExecution` / `afterFileEdit`、Tab 用フック、`workspaceOpen` 等 | https://cursor.com/docs/agent/hooks | 2026-07-05 | 公式明記 |
| Cursor SDK(TypeScript / Python)でエージェントをプログラム構築可能。カスタムツール・カスタムストア(JSONL)・auto-review 連携・サブエージェントの多段ネスト(2026-06-04 の changelog) | https://cursor.com/changelog/sdk-updates-jun-2026 | 2026-07-05 | 公式明記(changelog) |
| Cloud Agents は API から起動可能(プログラマティック連携) | https://cursor.com/docs/cloud-agent | 2026-07-05 | 公式明記 |
| Slack / Linear の `@cursor`、GitHub PR・Issue / Bitbucket PR コメントの `@cursor` から Cloud Agents を起動可能 | https://cursor.com/docs/cloud-agent | 2026-07-05 | 公式明記 |
| CI 連携: CLI print モードの CI 利用を公式が明記。スケジュール / トリガー起動の「Automations」も提供 | https://cursor.com/docs/cli/overview / https://cursor.com/features | 2026-07-05 | 公式明記 |

## 7. 設定ファイル(ルールファイル)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| プロジェクトルール: `.cursor/rules` ディレクトリの `.mdc` ファイル(バージョン管理対象)。YAML frontmatter(`alwaysApply` / `description` / `globs`)で適用制御 | https://cursor.com/docs/rules | 2026-07-05 | 公式明記 |
| 適用モード 4 種: Always Apply / Apply Intelligently(description に基づき Agent が判断)/ Apply to Specific Files(glob)/ Apply Manually(`@ルール名`) | https://cursor.com/docs/rules | 2026-07-05 | 公式明記 |
| AGENTS.md 対応: 「Place it in your project root as an alternative to `.cursor/rules`」。サブディレクトリにも置け、階層的に結合され、より深い階層が優先 | https://cursor.com/docs/rules | 2026-07-05 | 公式明記 |
| 3 層構造: Team Rules(組織全体。ダッシュボードで集中管理・強制可)→ Project Rules → User Rules の順に適用され、先勝ち(Team が最優先) | https://cursor.com/docs/rules | 2026-07-05 | 公式明記 |
| User Rules は Inline Edit(Cmd/Ctrl+K)には適用されず Agent(Chat)のみ | https://cursor.com/docs/rules | 2026-07-05 | 公式明記 |
| 旧 `.cursorrules`(ルート単一ファイル)はレガシーで非推奨(現行 rules ページ本文には記載がなく、フォーラム回答等で deprecated と案内) | https://cursor.com/docs/rules | 2026-07-05 | 公式から推測(現行 docs に明示なし) |
| Bugbot 用ルール: `.cursor/BUGBOT.md`(レビュー観点のプロジェクト固有コンテキスト) | https://cursor.com/docs/bugbot | 2026-07-05 | 公式明記 |
| CLI 用設定: グローバル `~/.cursor/cli-config.json`、プロジェクト `<project>/.cursor/cli.json` | https://cursor.com/docs/cli/reference/permissions | 2026-07-05 | 公式明記 |
| チーム共有: Team Rules に加え、Teams プランに「Team marketplace for internal rules, skills, and plugins」あり | https://cursor.com/pricing | 2026-07-05 | 公式明記 |

## 8. 権限管理

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 承認モデルの中心は Run Modes(§5 参照): Auto-review(推奨既定)/ Allowlist / Run Everything。設定場所は Cursor Settings > Agents > Approvals & Execution | https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記 |
| 読み取り・コード検索は承認不要。機微データを露出し得る操作と設定ファイルの変更は明示承認が必要 | https://cursor.com/docs/agent/security | 2026-07-05 | 公式明記 |
| ネットワークは既定で制限(GitHub・直接リンク・Web 検索のみ。「Agents cannot make arbitrary network requests with default settings」) | https://cursor.com/docs/agent/security | 2026-07-05 | 公式明記 |
| ガードレールは「best-effort guardrails rather than a hard security boundary」と公式が明記(プロンプトインジェクションによる回避可能性に言及) | https://cursor.com/docs/agent/security / https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記 |
| CLI の許可 / 拒否リスト: `permissions.allow` / `permissions.deny`。deny が allow に優先。ルール型は `Shell()` / `Read()` / `Write()` / `WebFetch()` / `Mcp(server:tool)` | https://cursor.com/docs/cli/reference/permissions | 2026-07-05 | 公式明記 |
| チーム設定が個人・プロジェクト設定に優先(「Team settings take precedence over individual and project configuration」)。管理者は利用可能な Run Mode やサンドボックスのネットワーク規則を全体制御可能 | https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記 |

## 9. セキュリティ

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| サンドボックス方式: macOS は Seatbelt(`sandbox-exec`)、Linux は Landlock + seccomp(カーネル 6.2+ / Landlock v3 / 非特権ユーザー名前空間が必要)。サブプロセスツリー全体のファイル・ネットワーク・プロセス挙動を制限 | https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記 |
| サンドボックス内はワークスペース内の読み書きのみ許可。`.git/` と Cursor 設定ファイルは保護パス。任意のネットワーク宛先への接続は不可 | https://cursor.com/docs/agent/security/run-modes | 2026-07-05 | 公式明記 |
| Windows のサンドボックス対応 | — | 2026-07-05 | 未確認(docs は macOS / Linux のみ記載) |
| **学習利用の既定**: Privacy Mode 無効時は「we may use and store codebase data, prompts, editor actions, code snippets ... to improve our AI features and train our models」。Privacy Mode 有効時は「Customer Data will not be used for training by Cursor」 | https://cursor.com/data-use | 2026-07-05 | 公式明記 |
| Privacy Mode の既定: 個人(Free / Pro)はオプトイン(手動で有効化)。**Enterprise チームは既定でオン**。「New team members inherit the team's Privacy Mode settings」 | https://cursor.com/security / https://cursor.com/help/security-and-privacy/privacy | 2026-07-05 | 公式明記(個人の新規登録時の初期値の詳細は未確認) |
| モデルプロバイダーとはゼロデータ保持(ZDR)契約。「AI model providers will not store or train on your data」。ただし一部モデルは例外(例: Anthropic の Claude Fable 5 は有害性審査のため入出力を保存。学習・製品改善には不使用) | https://cursor.com/data-use / https://cursor.com/docs/enterprise/privacy-and-data-governance | 2026-07-05 | 公式明記 |
| Cloud Agents はコード保存を要する唯一の機能(「Cloud Agents are the only feature that requires Cursor to store code」) | https://cursor.com/docs/enterprise/privacy-and-data-governance | 2026-07-05 | 公式明記 |
| コンプライアンス: SOC 2 Type II(レポートは trust.cursor.com で請求可)、年 1 回以上の第三者ペネトレーションテスト、GDPR(DPA)、HIPAA BAA(Enterprise)。サブプロセッサ一覧は https://trust.cursor.com/subprocessors | https://cursor.com/security / https://cursor.com/docs/enterprise | 2026-07-05 | 公式明記 |
| 中国国内のインフラ不使用を明記。Enterprise 向けに CMEK(顧客管理暗号鍵)提供 | https://cursor.com/security / https://cursor.com/help/security-and-privacy/privacy | 2026-07-05 | 公式明記 |
| 秘密情報のマスク: フックで「Scan for PII or secrets」する運用を公式が例示(組み込みの自動マスク機能としては未確認) | https://cursor.com/docs/agent/hooks | 2026-07-05 | 公式明記(フックによる実現)/ 組み込みマスクは未確認 |

## 10. チーム導入機能

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| プラン: Teams(Standard / Premium)と Enterprise(§11 参照) | https://cursor.com/pricing | 2026-07-05 | 公式明記 |
| Teams: 集中請求・管理、Team Rules / marketplace、Bugbot、共有コンテキストの Cloud agents・Automations、利用分析、チーム全体の Privacy Mode、SAML/OIDC SSO | https://cursor.com/pricing | 2026-07-05 | 公式明記 |
| Enterprise: SCIM によるシート管理(自動プロビジョニング / デプロビジョニング)、プール型利用枠、請求書 / PO 支払い、リポジトリ / モデルのアクセス制御、高度なセキュリティと監査ログ、優先サポート | https://cursor.com/pricing / https://cursor.com/docs/enterprise | 2026-07-05 | 公式明記 |
| 監査ログは「authentication, user management, and administrative actions」を記録 | https://cursor.com/docs/enterprise | 2026-07-05 | 公式明記 |
| Privacy Mode の組織強制: 管理者が有効化し「Optionally enforce it so members can't disable it」 | https://cursor.com/docs/enterprise/privacy-and-data-governance | 2026-07-05 | 公式明記 |
| その他エンタープライズ統制: MDM(Allowed Team IDs)、モデルアクセス制御、リポジトリブロックリスト、Admin API、サービスアカウント、利用分析(AI/人間のコード比率を示す「Cursor Blame」等)、課金グループ | https://cursor.com/docs/enterprise | 2026-07-05 | 公式明記 |

## 11. 料金・利用制限

金額は本文に転記しない方針(参照先 URL + 確認日のみ記録)。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 個人プラン: Hobby(無料。Agent・Tab とも制限付き)/ Individual(Pro / Pro+ / Ultra の 3 ティア) | https://cursor.com/pricing | 2026-07-05 | 公式明記 |
| チーム: Teams(Standard / Premium、ユーザー単位課金)/ Enterprise(カスタム価格) | https://cursor.com/pricing | 2026-07-05 | 公式明記 |
| 課金単位: シート(サブスクリプション)+ モデル利用量。「Every plan includes a set amount of model usage」。超過分はオンデマンド(従量)で「billed in arrears」「at API rates with no markup」 | https://cursor.com/pricing / https://cursor.com/docs/models-and-pricing | 2026-07-05 | 公式明記 |
| 個人プランは 2 つの利用枠プール(Auto + Composer 選択時は大きめの枠 / フロンティアモデルは API 利用相当枠)。月次リセット | https://cursor.com/docs/models-and-pricing | 2026-07-05 | 公式明記 |
| オンデマンド利用は明示的な有効化が必要。支出上限(spend limit)を設定可能 | https://cursor.com/docs/models-and-pricing / https://cursor.com/help/account-and-billing/spend-limits | 2026-07-05 | 公式明記 |
| Cloud Agents は選択モデルの API 価格で課金。初回利用時に支出上限の設定を要求 | https://cursor.com/docs/cloud-agent | 2026-07-05 | 公式明記 |
| Bugbot は従量(usage-based)課金 | https://cursor.com/pricing / https://cursor.com/docs/bugbot | 2026-07-05 | 公式明記 |
| 料金参照先: https://cursor.com/pricing (プラン)/ https://cursor.com/docs/models-and-pricing (モデル別)/ https://cursor.com/docs/account/teams/pricing (チーム) | 同左 | 2026-07-05 | 公式明記 |

## 12. 代表的なユースケース

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 公式ポジショニング: 「Accelerate development by handing off tasks to Cursor, while you focus on making decisions」。タスク委任 + 人はレビュー・意思決定 | https://cursor.com/features | 2026-07-05 | 公式明記 |
| 提供面の全体像: Tab 補完 / IDE 内 Agent(Composer)/ Cloud Agents(非同期・並列)/ Bugbot(PR レビュー)/ CLI / Web・モバイル / Automations(スケジュール・トリガー起動の常駐エージェント) | https://cursor.com/features | 2026-07-05 | 公式明記 |
| モデル: OpenAI / Anthropic / Gemini / xAI の各モデルに加え自社モデル(Composer 系)を選択可能 | https://cursor.com/features | 2026-07-05 | 公式明記 |
| エンタープライズ採用の主張: 「Trusted by over half of the Fortune 500」(マーケティング文言として記録) | https://cursor.com/features | 2026-07-05 | 公式明記(自社主張) |
| コミュニティで定着した用途(評判)は本調査の対象外とし未記録。執筆時に必要なら第三者情報と明示して扱う | — | 2026-07-05 | — |

## 執筆時の注意(cursor.md 向けメモ)

- 「YOLO モード」という旧称は現行公式 docs に存在しない。現行の正式な概念は **Run Modes(Auto-review / Allowlist / Run Everything)**(Cursor 3.6 以降)。歴史的経緯として触れる場合も断定を避ける
- 「バックグラウンドエージェント(background agents)」も現行 docs では **Cloud Agents** に改称されている。旧称として言及する場合は注記する
- Privacy Mode は「コードを送らない」機能ではない(推論のためコード文脈はモデルプロバイダーに送信される)。「学習利用しない + ZDR」の機能である点を正確に書く
- インデックスの要点: 「埋め込み + 暗号化パスは保存 / コード平文は保存しない / Cloud Agents のみコード保存が必要」の 3 点セットで整理すると誤解が少ない

## 変わりやすい項目(定点観測候補)

- プラン名・ティア構成(Pro / Pro+ / Ultra、Teams Standard / Premium)と含まれる利用枠
- 既定 Run Mode(3.6 で Auto-review が既定化。バージョンアップで変わり得る)
- 自社モデル(Composer)の世代とモデルラインアップ
- ZDR 例外モデルの一覧(2026-07 時点では Claude Fable 5 が例外として明記)
- Bugbot の課金方式・対応プラットフォーム
- Cursor SDK の機能範囲(2026-06 に大幅更新があったばかり)
