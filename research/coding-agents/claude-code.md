# Claude Code(Anthropic)執筆前調査メモ

- **対象ツール**: Claude Code(提供元: Anthropic)
- **調査日**: 2026-07-05
- **調査方法**: CODING-AGENTS-PLAN.md §7 の調査チェックリスト 12 項目に従い、公式ドキュメント(code.claude.com/docs)・公式料金ページ(claude.com/pricing)・公式ヘルプセンター(support.claude.com)・Trust Center 関連の公式情報のみを根拠として確認
- **確度の凡例**: 「公式明記」= 公式ページに明文あり / 「公式から推測」= 公式記述からの合理的推測(明文なし) / 「第三者」= 第三者情報のみ(本文の根拠にしない)
- **記録様式**: `確認した事実 | 出典 URL | 確認日 | 確度`

> **注**: 本メモは docs/ 規約(テンプレート・固定 H2)の対象外です(CODING-AGENTS-PLAN.md §13)。

---

## 1. 実行環境

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 提供面は「ターミナル CLI / VS Code 拡張 / JetBrains プラグイン / デスクトップアプリ / Web(claude.ai/code)」の 5 系統 + CI(GitHub Actions・GitLab CI/CD)・Slack・Chrome 連携。すべて同一の Claude Code エンジンに接続し、CLAUDE.md・設定・MCP サーバーが共通で機能する | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| 実行環境は 3 種: **Local**(既定。自分のマシン)/ **Cloud**(Anthropic 管理 VM)/ **Remote Control**(実行はローカル、操作はブラウザから) | https://code.claude.com/docs/en/how-claude-code-works | 2026-07-05 | 公式明記 |
| 対応 OS(CLI): macOS 13.0+ / Windows 10 1809+・Windows Server 2019+ / Ubuntu 20.04+ / Debian 10+ / Alpine 3.19+。ハードウェアは 4GB+ RAM、x64 または ARM64。シェルは Bash・Zsh・PowerShell・CMD | https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |
| Windows はネイティブ動作と WSL の両対応。ネイティブでは Git for Windows があれば Bash ツール、なければ PowerShell ツールを使用。サンドボックスはネイティブ Windows 非対応(WSL2 なら対応) | https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |
| インストール方法: ネイティブインストーラ(curl/irm。自動更新あり)、Homebrew、WinGet、apt/dnf/apk(署名付きリポジトリ)、npm(`@anthropic-ai/claude-code`、Node.js 22+ 前提だが実行はネイティブバイナリ)。リリースは GPG 署名付き manifest で検証可能 | https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |
| クラウド実行(Claude Code on the web)は「セッションごとに新しい Anthropic 管理 VM」にリポジトリをクローンして実行。ブラウザを閉じてもセッションは継続し、モバイルアプリから監視可能 | https://code.claude.com/docs/en/claude-code-on-the-web | 2026-07-05 | 公式明記 |
| クラウド環境の全アウトバウンド通信はセキュリティプロキシを経由(監査ログ・不正利用防止)。GitHub 操作は専用プロキシ経由で、実トークンはサンドボックス内に入らない。セッション終了後に環境は自動破棄 | https://code.claude.com/docs/en/security (Cloud execution security) | 2026-07-05 | 公式明記 |
| クラウド VM の永続性: セッション単位で使い捨て(fresh VM)。セッション自体は保存され再開・共有・削除が可能 | https://code.claude.com/docs/en/claude-code-on-the-web | 2026-07-05 | 公式明記 |
| デスクトップアプリは macOS(Intel/Apple Silicon)・Windows(x64/ARM64)・Linux 向けに提供。有料サブスクリプションが必要 | https://code.claude.com/docs/en/overview, https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |
| スケジュール実行: **Routines**(Anthropic 管理インフラで cron/API/GitHub イベント起動)と、デスクトップアプリのローカルスケジュールタスク、CLI 内 `/loop` の 3 通り | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| 利用可能地域は「Anthropic supported countries」に依存 | https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |

**メモ**: クラウド実行の隔離単位は公式に「isolated, Anthropic-managed VM」と明記(コンテナか VM かの実装詳細はこれ以上公開されていない)。

## 2. 対応 IDE / CLI

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| CLI あり(フル機能のリファレンス実装)。`claude` コマンドで起動、`-p` で非対話(headless)実行、Unix パイプに対応 | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| VS Code 拡張(`anthropic.claude-code`): インライン diff、@メンション、プラン確認、会話履歴。**Cursor にも同じ拡張をインストール可能** | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| JetBrains プラグイン: IntelliJ IDEA・PyCharm・WebStorm ほか JetBrains IDE 対応。対話的 diff 表示・選択範囲の共有。CLI の別途インストールが必要 | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| 専用 IDE ではなく「既存 IDE への拡張」+ 独立したデスクトップアプリ(IDE ではなくセッション管理・diff レビュー用 GUI)という構成 | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| Web 版はデスクトップブラウザと Claude iOS アプリで利用可能 | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| セッションはサーフェス間を移動可能: Web→CLI(`claude --teleport`)、CLI→Web(`claude --cloud`)、CLI→デスクトップ(`/desktop`)、ローカルセッションをスマホから継続(Remote Control) | https://code.claude.com/docs/en/overview, https://code.claude.com/docs/en/claude-code-on-the-web | 2026-07-05 | 公式明記 |

## 3. リポジトリ理解

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 「gather context → take action → verify results」のエージェントループで動作。検索は組み込みツール(パターンでのファイル検索 = Glob、正規表現の内容検索 = Grep)による**オンデマンド探索** | https://code.claude.com/docs/en/how-claude-code-works | 2026-07-05 | 公式明記 |
| 検索は ripgrep に依存(ネイティブバイナリに同梱) | https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |
| 事前の埋め込みインデックスを構築するという記述は公式ドキュメントに存在しない。ツール一覧・動作説明はすべてオンデマンド検索(grep/glob/read)ベース | https://code.claude.com/docs/en/how-claude-code-works | 2026-07-05 | 公式から推測(「インデックスなし」の明文はないが、公式のアーキテクチャ説明に索引構築工程が一切登場しない) |
| 型付き言語向けに「code intelligence プラグイン」(LSP 連携)を追加すると、テキスト検索の代わりにシンボル単位のジャンプ・参照検索・編集後の型エラー報告が可能 | https://code.claude.com/docs/en/features-overview | 2026-07-05 | 公式明記 |
| 大規模リポジトリ/モノレポ対策: サブディレクトリの CLAUDE.md は該当ディレクトリのファイルを読むときにオンデマンド読込、`claudeMdExcludes` で他チームの CLAUDE.md を除外、`.claude/rules/` の `paths` frontmatter でパス限定ルール、探索をサブエージェントに委譲(要約のみ本体コンテキストへ) | https://code.claude.com/docs/en/memory, https://code.claude.com/docs/en/features-overview | 2026-07-05 | 公式明記 |
| コンテキスト管理: 自動コンパクション(上限接近時に古いツール出力の削除→会話要約)、`/context` で使用量可視化、プロンプトキャッシュを自動利用 | https://code.claude.com/docs/en/how-claude-code-works, https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |

## 4. ファイル編集

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| ファイル操作ツール: Read / Write(新規作成)/ Edit(既存ファイルへの精密な編集)。複数ファイルにまたがる協調的な編集が可能 | https://code.claude.com/docs/en/how-claude-code-works, https://code.claude.com/docs/en/agent-sdk/overview | 2026-07-05 | 公式明記 |
| **チェックポイント(rewind)**: すべてのファイル編集は可逆。編集前に対象ファイルのスナップショットを取得し、`Esc` 2 回または `/rewind` で以前の状態に復元できる。チェックポイントはセッションローカルで git とは独立。ファイル変更のみが対象(DB・API・デプロイ等の外部作用は対象外) | https://code.claude.com/docs/en/how-claude-code-works | 2026-07-05 | 公式明記 |
| 編集は既定で承認制(permission mode `default`)。「Yes, don't ask again」の効力はファイル編集についてはセッション終了まで | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| VS Code / JetBrains 拡張ではインライン diff・対話的 diff ビューで変更をプレビュー可能。デスクトップアプリは視覚的 diff レビュー用途 | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| セッションは `~/.claude/projects/` 配下の JSONL に保存され、resume・fork(`--fork-session` / `/branch`)が可能 | https://code.claude.com/docs/en/how-claude-code-works | 2026-07-05 | 公式明記 |
| 並行作業: git worktree による並列セッション、`/rewind` との併用が公式に案内されている | https://code.claude.com/docs/en/how-claude-code-works | 2026-07-05 | 公式明記 |

## 5. コマンド実行

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Bash ツールでシェル実行が可能(ビルド・テスト・git・パッケージマネージャ等「コマンドラインでできることすべて」)。Windows ネイティブでは Git Bash 経由、なければ PowerShell ツール | https://code.claude.com/docs/en/how-claude-code-works, https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |
| 実行前確認: システムを変更しうる Bash コマンドは承認必須。`ls`・`cat`・`git status` 等の組み込み読み取り専用コマンド集合はどのモードでもプロンプトなしで実行(この集合は変更不可、ask/deny ルールで上書きは可能) | https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/security | 2026-07-05 | 公式明記 |
| 複合コマンド(`&&`、`;`、`|` 等)はサブコマンドごとに独立してルール照合される(`safe-cmd && other-cmd` はすり抜け不可)。`timeout` 等のプロセスラッパーは剥がして照合 | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| バックグラウンド実行に対応(Bash の `run_in_background` パラメータ。権限ルール `Bash(run_in_background:true)` で個別制御可能)。Agent SDK には出力を監視する Monitor ツールもある | https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/agent-sdk/overview | 2026-07-05 | 公式明記 |
| 不審な Bash コマンドの検出(許可済みでも手動承認を要求)、未照合コマンドは承認要求にフォールバック(fail-closed) | https://code.claude.com/docs/en/security | 2026-07-05 | 公式明記 |
| サンドボックス有効時は、境界内の Bash コマンドをプロンプトなしで自動実行できる(auto-allow モード)。詳細は §9 | https://code.claude.com/docs/en/sandboxing | 2026-07-05 | 公式明記 |

## 6. MCP・外部ツール連携

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| MCP クライアント対応。トランスポートは **stdio / HTTP(streamable-http)/ SSE(非推奨)/ WebSocket** の 4 種。リモートは HTTP 推奨 | https://code.claude.com/docs/en/mcp | 2026-07-05 | 公式明記 |
| リモート MCP サーバーの OAuth 2.0 認証に対応(`/mcp` パネル、v2.1.186 以降は `claude mcp login <name>`) | https://code.claude.com/docs/en/mcp | 2026-07-05 | 公式明記 |
| MCP の設定スコープは local / project(`.mcp.json`、バージョン管理でチーム共有)/ user の 3 層 + 企業向け managed 構成(managed-mcp.json、`allowManagedMcpServersOnly` 等)。同名サーバーは local > project > user で解決 | https://code.claude.com/docs/en/mcp, https://code.claude.com/docs/en/features-overview | 2026-07-05 | 公式明記 |
| `.mcp.json` のプロジェクトスコープサーバーは初回使用前に承認プロンプトあり(`claude mcp reset-project-choices` でリセット) | https://code.claude.com/docs/en/mcp | 2026-07-05 | 公式明記 |
| MCP ツール定義は既定で遅延読込(tool search)。ツール名のみ常駐し、スキーマは使用時にロード(コンテキスト節約) | https://code.claude.com/docs/en/costs, https://code.claude.com/docs/en/features-overview | 2026-07-05 | 公式明記 |
| **フック**: ライフサイクルイベント(PreToolUse・PostToolUse・SessionStart・SessionEnd・UserPromptSubmit・Stop・ConfigChange・InstructionsLoaded 等)でシェルコマンド・HTTP リクエスト・プロンプト・サブエージェントを起動。PreToolUse フックは権限判定の拡張(deny / ask 強制 / 許可)にも使える。フックは全ソースからマージされて発火 | https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/features-overview | 2026-07-05 | 公式明記 |
| **サブエージェント**: `.claude/agents/` 定義。隔離されたコンテキストで自走し要約のみ返す。実験的な「Agent teams」(独立セッション群の相互通信、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`、既定無効)もある | https://code.claude.com/docs/en/features-overview, https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |
| **スキル**: `.claude/skills/<name>/SKILL.md`。`/name` で起動、または説明文に基づき Claude が自動ロード。`disable-model-invocation: true` で手動専用化。プラグインで名前空間化して配布可能 | https://code.claude.com/docs/en/features-overview | 2026-07-05 | 公式明記 |
| **プラグイン / マーケットプレイス**: スキル・フック・サブエージェント・MCP サーバーを 1 パッケージで配布。組織は `strictKnownMarketplaces`・`blockedMarketplaces` 等で制限可能 | https://code.claude.com/docs/en/features-overview, https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| **CI 連携**: GitHub Actions(`anthropics/claude-code-action@v1`。issue/PR の `@claude` メンション、または prompt 指定の自動化。GitHub ホストランナー上で実行)、GitLab CI/CD、PR ごとの自動レビュー(GitHub Code Review)、Slack 連携(@Claude メンション→PR) | https://code.claude.com/docs/en/github-actions, https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| **Agent SDK**(旧 Claude Code SDK): Python(3.10+)/ TypeScript。Claude Code と同じツール群・エージェントループ・権限・フック・MCP・サブエージェント・セッション管理をライブラリとして提供。GitHub Actions 連携もこの SDK 上に構築されている | https://code.claude.com/docs/en/agent-sdk/overview, https://code.claude.com/docs/en/github-actions | 2026-07-05 | 公式明記 |
| Agent SDK で作った製品に claude.ai ログイン/サブスクリプションのレート枠を使わせることは原則不可(API キー認証を使う) | https://code.claude.com/docs/en/agent-sdk/overview | 2026-07-05 | 公式明記 |
| **Channels**: Telegram・Discord・iMessage・任意 webhook からのイベントをセッションに push する機構(MCP サーバーがチャネルとして動作)。組織は `channelsEnabled`・`allowedChannelPlugins` で制御 | https://code.claude.com/docs/en/overview, https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |

## 7. 設定ファイル

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| ルールファイルは **CLAUDE.md**。階層(読込順): ①管理ポリシー(macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`、Linux/WSL `/etc/claude-code/CLAUDE.md`、Windows `C:\Program Files\ClaudeCode\CLAUDE.md`)→ ②ユーザー `~/.claude/CLAUDE.md` → ③プロジェクト `./CLAUDE.md` または `./.claude/CLAUDE.md` → ④ローカル `./CLAUDE.local.md`(gitignore 推奨) | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |
| 読込モデル: 起動ディレクトリから上位に遡って発見した CLAUDE.md を全て**連結**(上書きではなく追記。ルート側→作業ディレクトリ側の順)。サブディレクトリの CLAUDE.md は該当ディレクトリのファイルを読むときにオンデマンド読込 | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |
| `@path/to/import` 構文で他ファイルをインポート可能(相対/絶対、再帰は最大 4 ホップ、コードブロック内は除外)。外部インポートは初回に承認ダイアログ | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |
| **AGENTS.md は直接読まない**。`@AGENTS.md` インポートまたはシンボリックリンクでの共用を公式が案内。`/init` は既存の AGENTS.md・.cursorrules・.windsurfrules 等を読んで CLAUDE.md に取り込む | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |
| `.claude/rules/*.md` でルールをトピック分割。YAML frontmatter の `paths`(glob)でパス限定ロードが可能。`~/.claude/rules/` はユーザー横断ルール | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |
| **auto memory**: Claude が自分で学習メモを書く機構(既定オン、v2.1.59+)。`~/.claude/projects/<project>/memory/MEMORY.md`(先頭 200 行 / 25KB を毎セッション読込)+トピックファイル | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |
| **settings.json の優先順位**: ①管理設定(MDM 配布ファイル / server-managed / Claude apps gateway。最優先・上書き不可)→ ②CLI 引数 → ③`.claude/settings.local.json` → ④`.claude/settings.json`(チーム共有)→ ⑤`~/.claude/settings.json` | https://code.claude.com/docs/en/permissions (Settings precedence) | 2026-07-05 | 公式明記 |
| 管理設定は MDM/OS ポリシー配布のほか、**server-managed settings**(claude.ai から配信。クラウドセッションにも適用)と自己ホスト型 Claude apps gateway で配布可能 | https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/claude-code-on-the-web | 2026-07-05 | 公式明記 |
| 管理設定専用キーの例: `allowManagedPermissionRulesOnly`、`allowManagedMcpServersOnly`、`strictKnownMarketplaces`、`strictPluginOnlyCustomization`、`allowManagedHooksOnly`、`forceRemoteSettingsRefresh`(fail-closed 起動)等 | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| 管理設定の `claudeMd` キーで組織 CLAUDE.md を settings 内に直接記述可能。管理ポリシー CLAUDE.md は個人設定で除外不可 | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |
| 用途の使い分けが公式に明文化: 「技術的強制は managed settings(permissions.deny・sandbox 等)、行動指針は CLAUDE.md」。CLAUDE.md はコンテキストであり強制層ではない(強制はフック/権限ルールで) | https://code.claude.com/docs/en/memory | 2026-07-05 | 公式明記 |

## 8. 権限管理

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **権限モード**は 6 種: `default`(初回使用時に確認。v2.1.200+ では「Manual」表記)/ `acceptEdits`(編集と mkdir 等を自動承認)/ `plan`(読み取り専用の探索・計画)/ `auto`(バックグラウンド安全性チェック付き自動承認。research preview)/ `dontAsk`(事前許可済み以外を自動拒否)/ `bypassPermissions`(プロンプトをスキップ。隔離環境専用) | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| ルールは **allow / ask / deny** の 3 種で、評価順は「deny → ask → allow」固定(具体性より順序が優先)。deny はどのスコープからでも最終的にブロック | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| ルール構文: `Tool` または `Tool(specifier)`。Bash はワイルドカード(`Bash(npm run *)`)、Read/Edit は gitignore 形式のパス(`//`絶対・`~/`ホーム・`/`設定基点)、WebFetch は `domain:`、MCP は `mcp__server__tool`、サブエージェントは `Agent(名前)` | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| 既定の危険操作の扱い: 読み取り専用は承認不要、Bash は承認必須(記憶はプロジェクト×コマンド単位で永続)、ファイル編集の記憶はセッション限り。`bypassPermissions` でも `rm -rf /`・`rm -rf ~` はサーキットブレーカーとして必ず確認 | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| `curl`・`wget` などネットワーク取得コマンドは既定で自動承認されない | https://code.claude.com/docs/en/security | 2026-07-05 | 公式明記 |
| `disableBypassPermissionsMode` / `disableAutoMode` を managed settings に置くことで bypass/auto モードを組織的に禁止できる。`--dangerously-skip-permissions` は root/sudo では拒否 | https://code.claude.com/docs/en/permissions, https://code.claude.com/docs/en/sandboxing | 2026-07-05 | 公式明記 |
| **ワークスペーストラスト**: プロジェクトの `.claude/settings.json` にある allow ルール・additionalDirectories は、フォルダのトラストダイアログを承諾するまで適用されない(deny/ask は即適用) | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| 権限ルールはモデルではなく Claude Code(クライアント)が強制。CLAUDE.md の指示は挙動を形作るだけで権限を変えない | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| PreToolUse フックで実行時の権限判定を拡張可能(deny 優先の原則は維持される) | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |

## 9. セキュリティ

### サンドボックス

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Bash ツール用の OS レベルサンドボックスを内蔵: macOS = Seatbelt、Linux/WSL2 = bubblewrap(+ネットワーク中継に socat、任意で seccomp フィルタ)。ネイティブ Windows・WSL1 は非対応 | https://code.claude.com/docs/en/sandboxing | 2026-07-05 | 公式明記 |
| 既定境界: 書込は作業ディレクトリ+セッション一時ディレクトリのみ、読取はほぼ全域(→ `sandbox.credentials` / `denyRead` で `~/.ssh` 等を保護する必要あり)。ネットワークはドメイン単位の deny-by-default で、初回接続時に承認プロンプト(プロキシがホスト名で判定) | https://code.claude.com/docs/en/sandboxing | 2026-07-05 | 公式明記 |
| サンドボックスは**既定では無効**(`/sandbox` または `sandbox.enabled: true` で有効化。managed settings で組織強制可能: `failIfUnavailable`・`allowUnsandboxedCommands: false`) | https://code.claude.com/docs/en/sandboxing | 2026-07-05 | 公式明記 |
| 認証情報保護: `sandbox.credentials` でファイル読取拒否・環境変数の unset(`deny`)/ センチネル置換+プロキシでの実値注入(`mask`、TLS 終端が必要、v2.1.199+)。`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` で全サブプロセスから Anthropic・クラウド認証情報を除去 | https://code.claude.com/docs/en/sandboxing | 2026-07-05 | 公式明記 |
| 限界も明記: 既定では TLS を終端しないためドメインフロンティング等の抜け道があり得る、`github.com` などの広いドメイン許可はデータ持ち出し経路になり得る、より強い保証にはカスタムプロキシ+TLS 検査を推奨 | https://code.claude.com/docs/en/sandboxing (Security limitations) | 2026-07-05 | 公式明記 |
| 代替の隔離手段として dev container・カスタムコンテナ・VM の比較ページあり。サンドボックス基盤は OSS の `@anthropic-ai/sandbox-runtime` としても公開 | https://code.claude.com/docs/en/sandboxing | 2026-07-05 | 公式明記 |

### プロンプトインジェクション・その他の防御

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 防御策: 権限システム、コンテキスト解析による有害指示の検出、入力サニタイズ、WebFetch の隔離コンテキスト(取得内容を別コンテキストで処理)、コマンドインジェクション検出(許可済みでも不審なら手動承認)、fail-closed 照合、初回コードベース・新規 MCP サーバーのトラスト確認 | https://code.claude.com/docs/en/security | 2026-07-05 | 公式明記 |
| WebFetch は取得前にホスト名のみを api.anthropic.com の安全性ブロックリストに照会(プロバイダ非依存で常時実行。`skipWebFetchPreflight` でオプトアウト) | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |
| 認証情報の保存: macOS は Keychain、Linux は `~/.claude/.credentials.json`(mode 0600)、Windows はユーザープロファイルの ACL | https://code.claude.com/docs/en/authentication | 2026-07-05 | 公式明記 |
| 脆弱性報告は HackerOne プログラム経由 | https://code.claude.com/docs/en/security | 2026-07-05 | 公式明記 |

### データ保持・学習利用ポリシー(重要)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **Consumer(Free/Pro/Max)**: 「モデル改善のためのデータ利用を許可するか」をユーザーが選択。**設定がオンのとき、Claude Code の利用データも新モデルの学習に使われる**。設定は claude.ai/settings/data-privacy-controls でいつでも変更可能 | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |
| **Commercial(Team/Enterprise/API/サードパーティプラットフォーム/Claude Gov)**: 顧客が明示的にオプトイン(例: Development Partner Program)しない限り、Claude Code に送られたコード・プロンプトで生成モデルを**学習しない** | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |
| データ保持: Consumer は学習許可オンで **5 年**、オフで **30 日**。Commercial は標準 **30 日**、Claude for Enterprise では適格アカウントに **Zero Data Retention(ZDR)** を個別有効化可能(標準 Enterprise には含まれない) | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |
| `/feedback` で送った transcript は 5 年保持。セッション品質サーベイで共有した transcript は最大 6 か月保持(学習には使われない) | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |
| ローカルにもセッション transcript を平文で保存(`~/.claude/projects/`、既定 30 日、`cleanupPeriodDays` で調整) | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |
| テレメトリ(運用メトリクス。コード・ファイルパスは含まない)と Sentry エラー報告は Anthropic API 利用時は既定オン(`DISABLE_TELEMETRY` / `DISABLE_ERROR_REPORTING` でオプトアウト)。Bedrock/Vertex/Foundry 経由では既定オフ。`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` で非必須通信を一括停止 | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |
| 通信は TLS 1.2+ で暗号化。Anthropic API 側の保存は AES-256 ディスク暗号化 | https://code.claude.com/docs/en/data-usage | 2026-07-05 | 公式明記 |

### コンプライアンス認証

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Trust Center(trust.anthropic.com)で SOC 2 Type 2 レポート・ISO 27001 証明書等を提供、とドキュメントに明記 | https://code.claude.com/docs/en/security | 2026-07-05 | 公式明記 |
| Anthropic の保有認証: SOC 2 Type I & Type II、ISO 27001:2022、ISO/IEC 42001:2023、HIPAA 対応構成(BAA 提供可) | https://support.anthropic.com/en/articles/10015870-what-certifications-has-anthropic-obtained (検索経由で確認) | 2026-07-05 | 公式明記(ヘルプセンター) |
| trust.anthropic.com 本体は JavaScript 必須の SPA のため機械取得不可。全文リストは要ブラウザ確認 | https://trust.anthropic.com | 2026-07-05 | 未確認(ページ取得不可のため上記 2 出典で代替) |

## 10. チーム導入機能

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| チーム向け認証経路は 6 つ: Claude for Teams / Claude for Enterprise / Claude Console(API 課金)/ Claude apps gateway(自己ホスト、IdP サインイン)/ Amazon Bedrock / Google Cloud's Agent Platform / Microsoft Foundry | https://code.claude.com/docs/en/authentication | 2026-07-05 | 公式明記 |
| **Claude for Enterprise** が追加で提供: SSO、ドメインキャプチャ、ロールベース権限、コンプライアンス API、組織全体の managed policy settings | https://code.claude.com/docs/en/authentication | 2026-07-05 | 公式明記 |
| Console 側は SSO 設定・一括招待・ロール割当(「Claude Code」ロール = Claude Code 用 API キーのみ作成可 / 「Developer」ロール)。初回認証時に専用ワークスペース「Claude Code」が自動作成され、組織の集中コスト管理に使われる | https://code.claude.com/docs/en/authentication, https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |
| ポリシー集中管理: managed settings(MDM 配布 / server-managed settings / apps gateway)。Team・Enterprise の Owner は claude.ai/admin-settings/claude-code で Remote Control・Web セッションを組織単位で有効/無効化できる | https://code.claude.com/docs/en/permissions | 2026-07-05 | 公式明記 |
| 監査・モニタリング: OpenTelemetry メトリクスによる利用監視、`ConfigChange` フックで設定変更の監査/ブロック、クラウドセッションは全操作が監査ログ記録 | https://code.claude.com/docs/en/security | 2026-07-05 | 公式明記 |
| コスト管理: Console のワークスペース支出上限・利用レポート、Pro/Max は `/usage-credits` で使用クレジットの月次上限、Bedrock/Vertex/Foundry では apps gateway か LLM ゲートウェイで per-user 帰属・上限 | https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |
| チーム規模別の TPM/RPM 推奨値の公式表あり(例: 1–5 人 200k–300k TPM/人 → 500+ 人 10k–15k TPM/人) | https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |
| Web(クラウド実行)の対象: Pro・Max・Team ユーザーおよび「premium seats または Chat + Claude Code seats を持つ Enterprise ユーザー」で research preview | https://code.claude.com/docs/en/claude-code-on-the-web | 2026-07-05 | 公式明記 |

## 11. 料金・利用制限

> **方針**: 金額は本文(docs/)に転記しない。以下は research 記録のみ。料金参照先 URL = https://claude.com/pricing (アクセス日: 2026-07-05)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 課金は 2 系統: ①サブスクリプション(Pro / Max / Team / Enterprise。定額+使用量上限)②Claude Console(API トークン従量)。加えて Bedrock/Vertex/Foundry 経由の従量 | https://code.claude.com/docs/en/costs, https://code.claude.com/docs/en/authentication | 2026-07-05 | 公式明記 |
| **Free**: $0。Claude Code は**含まれない**(認証には Pro/Max/Team/Enterprise/Console が必要) | https://claude.com/pricing, https://code.claude.com/docs/en/setup | 2026-07-05 | 公式明記 |
| **Pro**: 年払い $17/月($200 一括。月払い $20)。Claude Code を含む | https://claude.com/pricing | 2026-07-05 | 公式明記 |
| **Max**: $100/月から。「Pro の 5x または 20x の使用量」の 2 段階 | https://claude.com/pricing | 2026-07-05 | 公式明記 |
| **Team**: standard seat 年払い $20/席/月(月払い $25)、premium seat 年払い $100/席/月(月払い $125)。「Claude Code と Claude Cowork を含む」 | https://claude.com/pricing | 2026-07-05 | 公式明記 |
| **Enterprise**: 「Seat price + usage at API rates($20/seat)」の表示。詳細は営業問い合わせ | https://claude.com/pricing | 2026-07-05 | 公式明記 |
| API 従量利用時の実績目安(公式): 平均約 **$13/開発者/稼働日**、月 $150–250/開発者、90% のユーザーは日 $30 未満 | https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |
| サブスクリプションの使用量制限: 「Usage limits apply」(料金ページ)。制限の構造(5 時間単位のリセット+週次上限、Claude チャット/Cowork と共通プール)は公式ヘルプセンター記事が正: 「Use Claude Code with your Pro or Max plan」(11145838)、「How do usage and length limits work?」(11647753) | https://support.claude.com/en/articles/11145838, https://support.claude.com/en/articles/11647753 | 2026-07-05 | 公式明記(記事の存在と管轄を確認。**具体的な回数・時間値は記事本文を直接再確認するまで転記しない**) |
| Pro/Max は上限到達後に追加の使用クレジット(usage credits)を購入して継続でき、`/usage-credits` で月次支出上限を設定可能 | https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |
| `/usage` コマンドでプラン使用量バー・スキル/サブエージェント/MCP 別の内訳を確認可能 | https://code.claude.com/docs/en/costs | 2026-07-05 | 公式明記 |

## 12. 代表的なユースケース

### 公式が想定する用途(公式明記)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 後回しにしがちな作業の自動化: 未テストコードのテスト作成、プロジェクト全体の lint 修正、マージコンフリクト解消、依存関係更新、リリースノート作成 | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| 自然言語での機能実装・バグ修正(計画→複数ファイル編集→動作検証)、エラーメッセージからの根本原因調査 | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| git 操作: コミット・ブランチ作成・PR 作成。CI での PR 自動レビュー・issue トリアージ(GitHub Actions / GitLab CI/CD / GitHub Code Review) | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| MCP 経由のワークフロー: issue トラッカーからの機能実装、監視データ分析、DB 照会、デザイン連携、Slack からのバグ報告→PR | https://code.claude.com/docs/en/mcp, https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| CLI パイプ/スクリプト自動化(Unix 哲学。ログを流し込んで異常検知、CI での翻訳 PR 等)、スケジュール実行(Routines) | https://code.claude.com/docs/en/overview | 2026-07-05 | 公式明記 |
| 長時間タスクのクラウド実行(Web)+モバイルからの監視、並列タスク、エージェントチームによる並行開発・競合仮説デバッグ | https://code.claude.com/docs/en/overview, https://code.claude.com/docs/en/features-overview | 2026-07-05 | 公式明記 |
| コーディング以外の CLI 作業(ドキュメント作成、ビルド、調査)にも公式が言及 | https://code.claude.com/docs/en/how-claude-code-works | 2026-07-05 | 公式明記 |

### コミュニティで定着した用途(参考・評判)

- 「ターミナル常駐の汎用エージェントとして、コード以外の事務・調査作業にも使う」「CLAUDE.md +スキルでチーム標準を配る」等の運用が広く語られているが、**第三者情報のため本文の根拠にはしない**(確度: 第三者/未確認)。執筆時は公式ユースケースのみ断定形で書く。

---

## 執筆時の注意点(調査から得られた執筆ガイド)

1. **提供面の説明は 2026 年時点の姿で書く**: 2025 年までの「CLI + IDE 拡張 + Actions + SDK」に加え、2025〜2026 年に Web(クラウド VM)・デスクトップアプリ・Remote Control・Slack・Chrome・Channels・Routines・Agent teams が追加されている。plan §5.3 の想定(CLI / IDE / Web / Actions / SDK)より面が増えている点に注意。
2. **「サンドボックスは既定オフ」「権限は既定オン」**: 権限システム(承認制)が常時の第一層で、OS サンドボックスはオプトイン。混同しやすい。
3. **permission modes の名称変化**: `default` は v2.1.200+ で「Manual」と表示され `manual` エイリアスあり。`auto` / `dontAsk` は比較的新しいモード(auto は research preview)。
4. **AGENTS.md 非対応(直接読込しない)は明文**。「@import か symlink で共用」という公式推奨をそのまま書ける。
5. **データ学習は Consumer と Commercial で正反対の既定**になり得る(Consumer はユーザー設定次第で学習に使用/Commercial は原則不使用)。この対比は本章の比較表 B の重要セル。
6. **料金・制限は変動が激しい**: 金額は本文に書かず参照 URL + 確認日のみ。使用量制限の具体値(プロンプト数等)は公式ヘルプ記事にも数値が流動的にしか書かれないため、構造(5 時間+週次、製品横断プール)だけを記す。
7. モデル名(Sonnet/Opus/Haiku の世代)はすぐ古くなるため、ツール別ページでは「/model で切替可能」の仕組みのみ書き、特定モデル名は避けるか TODO(要確認)を付ける。

## TODO(要確認)

> **TODO(要確認):** サブスクリプションの使用量制限の具体値(5 時間ウィンドウあたりのプロンプト数・週次上限)を support.claude.com の記事 11145838 / 11647753 で執筆直前に再確認する(数値は流動的。最終確認: 2026-07)

> **TODO(要確認):** trust.anthropic.com の認証一覧(CSA STAR 等の有無)をブラウザで直接確認する(SPA のため機械取得不可。最終確認: 2026-07)

> **TODO(要確認):** Team プランで Claude Code 利用に premium seat が必須かどうか(料金ページの表記は「Team は Claude Code を含む」だが、standard/premium seat と Claude Code 利用可否の対応関係の明文を確認する)(最終確認: 2026-07)

> **TODO(要確認):** Claude Code on the web の research preview 表記が GA に変わっていないか、対象プランの変更がないかを確認する(最終確認: 2026-07)

> **TODO(要確認):** 権限モード `auto` (research preview) と Agent teams (experimental) のステータス変化を確認する(最終確認: 2026-07)

## 主な出典一覧

- Claude Code Docs 総覧: https://code.claude.com/docs/en/overview (アクセス日: 2026-07-05)
- セットアップ/OS 要件: https://code.claude.com/docs/en/setup (アクセス日: 2026-07-05)
- 動作原理: https://code.claude.com/docs/en/how-claude-code-works (アクセス日: 2026-07-05)
- 権限: https://code.claude.com/docs/en/permissions (アクセス日: 2026-07-05)
- サンドボックス: https://code.claude.com/docs/en/sandboxing (アクセス日: 2026-07-05)
- CLAUDE.md/メモリ: https://code.claude.com/docs/en/memory (アクセス日: 2026-07-05)
- 機能拡張総覧: https://code.claude.com/docs/en/features-overview (アクセス日: 2026-07-05)
- MCP: https://code.claude.com/docs/en/mcp (アクセス日: 2026-07-05)
- セキュリティ: https://code.claude.com/docs/en/security (アクセス日: 2026-07-05)
- データ利用: https://code.claude.com/docs/en/data-usage (アクセス日: 2026-07-05)
- コスト: https://code.claude.com/docs/en/costs (アクセス日: 2026-07-05)
- 認証/チーム: https://code.claude.com/docs/en/authentication (アクセス日: 2026-07-05)
- Web 版: https://code.claude.com/docs/en/claude-code-on-the-web (アクセス日: 2026-07-05)
- GitHub Actions: https://code.claude.com/docs/en/github-actions (アクセス日: 2026-07-05)
- Agent SDK: https://code.claude.com/docs/en/agent-sdk/overview (アクセス日: 2026-07-05)
- 料金: https://claude.com/pricing (アクセス日: 2026-07-05)
- 使用量制限(ヘルプ): https://support.claude.com/en/articles/11145838 / https://support.claude.com/en/articles/11647753 (アクセス日: 2026-07-05)
- 認証取得状況(ヘルプ): https://support.anthropic.com/en/articles/10015870-what-certifications-has-anthropic-obtained (アクセス日: 2026-07-05)
- Trust Center: https://trust.anthropic.com (アクセス日: 2026-07-05、SPA のため内容は間接確認)
