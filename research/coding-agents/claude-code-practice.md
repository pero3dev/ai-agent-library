# Claude Code(Anthropic)実践・コスト観点 調査メモ(C-R11)

- **対象ツール**: Claude Code(提供元: Anthropic)
- **調査日**: 2026-07-06
- **目的**: 「Claude Code 実践ガイド」(機能の使いどころ・コスト削減・業務効率化)の執筆素材。公式ドキュメント(code.claude.com/docs)のみを根拠とする
- **前提**: 選定観点の調査メモ [claude-code.md](claude-code.md)(2026-07-05)が既にあり、そちらでカバー済みの事実は本メモでは「既存メモ §N 参照」と記して重複記載しない
- **確度の凡例**: 「公式明記」= 公式ページに明文あり / 「公式から推測」= 公式記述からの合理的推測 / 「未確認」= 裏取り未了
- **記録様式**: `確認した事実 | 出典 URL | 確認日 | 確度`

> **注**: 本メモは docs/ 規約(テンプレート・固定 H2)の対象外です(CODING-AGENTS-PLAN.md §13)。

---

## 1. 機能の使いどころ

### 1.1 スキル(カスタムスラッシュコマンドの後継)

存在・配置場所の基本は既存メモ §6 参照。以下は作り方・運用の詳細。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **カスタムスラッシュコマンドはスキルに統合済み**。`.claude/commands/deploy.md` と `.claude/skills/deploy/SKILL.md` はどちらも `/deploy` を作り同じように動く。既存の `.claude/commands/` は動作継続。スキルは追加機能(補助ファイル用ディレクトリ、起動制御 frontmatter、Claude による自動ロード)を持つため新規はスキル推奨 | https://code.claude.com/docs/en/skills | 2026-07-06 | 公式明記 |
| **作りどき(公式基準)**: 「同じ指示・チェックリスト・複数手順をチャットに繰り返し貼っているとき」「CLAUDE.md の一節が事実でなく手順書に育ったとき」。CLAUDE.md と違いスキル本文は使用時のみロードされるため、長い参照資料でも未使用時はほぼコストゼロ | https://code.claude.com/docs/en/skills | 2026-07-06 | 公式明記 |
| Agent Skills オープン標準(agentskills.io)準拠。Claude Code 独自拡張は invocation control・subagent 実行・動的コンテキスト注入 | https://code.claude.com/docs/en/skills | 2026-07-06 | 公式明記 |
| frontmatter は全フィールド任意(`description` のみ推奨)。主要フィールド: `name`(表示名)/ `description` + `when_to_use`(合計 1,536 文字で一覧上は切り詰め)/ `argument-hint` / `arguments`(名前付き位置引数)/ `disable-model-invocation` / `user-invocable` / `allowed-tools`(権限の事前付与。ツール制限ではない)/ `disallowed-tools` / `model`(そのターン限りの上書き)/ `effort` / `context: fork` / `agent` / `hooks` / `paths`(glob でロード条件を限定)/ `shell`(bash/powershell) | https://code.claude.com/docs/en/skills#frontmatter-reference | 2026-07-06 | 公式明記 |
| 起動制御の 3 パターン: 既定 = ユーザーも Claude も起動可(description が常駐)/ `disable-model-invocation: true` = 手動専用(**description がコンテキストに載らない**。deploy・commit 等の副作用ワークフロー向け)/ `user-invocable: false` = Claude 専用(背景知識向け。`/` メニューから隠れる) | https://code.claude.com/docs/en/skills#control-who-invokes-a-skill | 2026-07-06 | 公式明記 |
| 引数: `$ARGUMENTS`(全引数)、`$ARGUMENTS[N]` / `$N`(位置)、`$name`(`arguments` 宣言)。ほか `${CLAUDE_SESSION_ID}`、`${CLAUDE_SKILL_DIR}`、`${CLAUDE_PROJECT_DIR}`(v2.1.196+)、`${CLAUDE_EFFORT}` | https://code.claude.com/docs/en/skills#available-string-substitutions | 2026-07-06 | 公式明記 |
| **動的コンテキスト注入**: `` !`command` ``(行頭または空白直後のみ)と ```` ```! ```` ブロック。スキル内容送信前にシェル実行され出力で置換(プリプロセスであり Claude は実行しない)。組織は `disableSkillShellExecution: true` で無効化可 | https://code.claude.com/docs/en/skills#inject-dynamic-context | 2026-07-06 | 公式明記 |
| **スキル本文のライフサイクル**: 起動するとレンダリング済み内容が 1 メッセージとして会話に入り**セッション中残り続ける**(毎ターンの継続コスト)。自動コンパクション時は「各スキル最新起動分の先頭 5,000 トークン、合計 25,000 トークン」の予算内で要約後に再添付(最近起動したものから優先) | https://code.claude.com/docs/en/skills#skill-content-lifecycle | 2026-07-06 | 公式明記 |
| `context: fork` + `agent: Explore` 等でサブエージェント内実行(会話履歴は見えない。明示的なタスク型スキル向け。ガイドラインだけのスキルを fork すると意味のある出力が返らない) | https://code.claude.com/docs/en/skills#run-skills-in-a-subagent | 2026-07-06 | 公式明記 |
| 補助ファイル: `SKILL.md` は 500 行以下推奨、詳細資料は別ファイルに分けて SKILL.md から参照(必要時のみロード)。スクリプト同梱・実行も可(HTML レポート生成などの視覚出力パターンを公式が例示) | https://code.claude.com/docs/en/skills#add-supporting-files | 2026-07-06 | 公式明記 |
| スキル一覧のコンテキスト予算: モデルコンテキストの 1%(`skillListingBudgetFraction` / `SLASH_COMMAND_TOOL_CHAR_BUDGET` で調整)。溢れると使用頻度の低いスキルから description が削られる。`/doctor` で短縮・脱落を確認可。`skillOverrides` 設定で `on` / `name-only` / `user-invocable-only` / `off` を skill 単位に制御(`/skills` メニューの Space で切替) | https://code.claude.com/docs/en/skills#skill-descriptions-are-cut-short | 2026-07-06 | 公式明記 |
| ネスト配置: サブディレクトリの `.claude/skills/` も対象ファイル操作時にオンデマンド発見(モノレポ向け)。名前衝突時は `apps/web:deploy` のようにディレクトリ修飾名になる | https://code.claude.com/docs/en/skills#where-skills-live | 2026-07-06 | 公式明記 |
| スキル評価: `skill-creator` プラグイン(公式マーケットプレイス)がスキル有/無の A/B 比較・pass rate・トークン/時間オーバーヘッド計測・description チューニングを自動化 | https://code.claude.com/docs/en/skills#run-evals-with-skill-creator | 2026-07-06 | 公式明記 |
| バンドルスキル: `/code-review`・`/batch`・`/debug`・`/loop`・`/claude-api` に加え、アプリ実行検証系の `/run`・`/verify`・`/run-skill-generator`(v2.1.145+。`/run-skill-generator` はビルド・起動手順を per-project スキルとして記録)。`disableBundledSkills` で無効化可 | https://code.claude.com/docs/en/skills#bundled-skills | 2026-07-06 | 公式明記 |
| 権限との関係: 権限ルール `Skill(name)` / `Skill(name *)` で個別 allow/deny、`Skill` を deny すると全スキル無効。プロジェクトスキルの `allowed-tools` はワークスペーストラスト承諾後に有効(リポジトリを信頼する前にスキルをレビューせよ、と明記) | https://code.claude.com/docs/en/skills#restrict-claudes-skill-access | 2026-07-06 | 公式明記 |

### 1.2 サブエージェント

概要・Agent teams は既存メモ §6 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **使いどき(公式基準)**: 「副次タスクがメイン会話を検索結果・ログ・二度と参照しないファイル内容で溢れさせるとき」。同種のワーカーを同じ指示で繰り返し起動するならカスタム定義を作る | https://code.claude.com/docs/en/sub-agents | 2026-07-06 | 公式明記 |
| 5 つの効用: コンテキスト温存 / ツール制約の強制 / 設定の再利用 / 挙動の特化 / **安価なモデル(Haiku 等)へのルーティングによるコスト制御** | https://code.claude.com/docs/en/sub-agents | 2026-07-06 | 公式明記 |
| 組み込み: **Explore**(読み取り専用。v2.1.198+ はメイン会話のモデルを継承、Claude API では Opus 上限。CLAUDE.md と git status を読まず軽量)/ **Plan**(plan モード時の調査用、読み取り専用)/ **general-purpose**(全ツール)/ statusline-setup(Sonnet)/ claude-code-guide(Haiku)。`Explore` という名前のカスタム定義(例: `model: haiku`)で組み込みを上書きして低コスト固定にできる | https://code.claude.com/docs/en/sub-agents#built-in-subagents | 2026-07-06 | 公式明記 |
| frontmatter(必須は `name`・`description` のみ): `tools` / `disallowedTools` / `model`(`sonnet`・`opus`・`haiku`・`fable`・フル ID・`inherit`。既定 `inherit`)/ `permissionMode` / `maxTurns` / `skills`(**全文をプリロード**)/ `mcpServers`(インライン定義でメイン会話のコンテキストを消費させずに済む)/ `hooks` / `memory`(`user`・`project`・`local`)/ `background` / `effort` / `isolation: worktree` / `color` / `initialPrompt` | https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields | 2026-07-06 | 公式明記 |
| モデル解決順: ① `CLAUDE_CODE_SUBAGENT_MODEL` 環境変数 → ② 起動時の `model` パラメータ → ③ frontmatter の `model` → ④ メイン会話のモデル。組織の `availableModels` allowlist に反する値はスキップされ継承モデルで実行 | https://code.claude.com/docs/en/sub-agents#choose-a-model | 2026-07-06 | 公式明記 |
| v2.1.198+ で**既定バックグラウンド実行**(結果が即必要なときのみフォアグラウンド)。バックグラウンドでも権限プロンプトはメインセッションに表面化(v2.1.186+)。Ctrl+B で実行中タスクをバックグラウンド化 | https://code.claude.com/docs/en/sub-agents#run-subagents-in-foreground-or-background | 2026-07-06 | 公式明記 |
| サブエージェントの初期コンテキスト: 自身のシステムプロンプト+委譲メッセージ+ CLAUDE.md 階層+起動時 git status +プリロードスキル(Explore/Plan は CLAUDE.md・git status を省略)。会話履歴・既読ファイルは見えない | https://code.claude.com/docs/en/sub-agents#what-loads-at-startup | 2026-07-06 | 公式明記 |
| resume 可能(`SendMessage`)。Explore/Plan は one-shot で resume 不可。ネスト起動は v2.1.172+ で深さ 5 まで。トランスクリプトは `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` に独立保存(メイン会話のコンパクション影響なし) | https://code.claude.com/docs/en/sub-agents#resume-subagents | 2026-07-06 | 公式明記 |
| **fork**(`/fork`、v2.1.161+ 既定有効): 会話全体を継承するサブエージェント。システムプロンプト・ツールが親と同一のため**親のプロンプトキャッシュを初回リクエストから再利用**でき、同じ文脈を要するタスクでは新規サブエージェントより安い | https://code.claude.com/docs/en/sub-agents#fork-the-current-conversation | 2026-07-06 | 公式明記 |
| 永続メモリ(`memory` フィールド): `project` スコープ推奨(バージョン管理で共有可)。MEMORY.md 先頭 200 行 / 25KB をシステムプロンプトに注入。「作業後にメモリ更新を指示する」運用を公式が推奨 | https://code.claude.com/docs/en/sub-agents#enable-persistent-memory | 2026-07-06 | 公式明記 |
| メイン会話との使い分け: 頻繁な対話・フェーズ間でコンテキスト共有・小さな変更・レイテンシ重視 → メイン会話 / 冗長出力・ツール制約・自己完結の要約可能タスク → サブエージェント / 再利用プロンプトは Skills / コンテキスト内の小質問は `/btw`(ツールなし・履歴に残らない) | https://code.claude.com/docs/en/sub-agents#choose-between-subagents-and-main-conversation | 2026-07-06 | 公式明記 |
| `/agents` の対話ウィザードは v2.1.198 で廃止(Claude に書かせるか `.claude/agents/` を直接編集)。ファイル変更は数秒で自動検知(初回ディレクトリ作成時のみ再起動要) | https://code.claude.com/docs/en/sub-agents#quickstart-create-your-first-subagent | 2026-07-06 | 公式明記 |
| ベストプラクティス(公式 Tip): 1 タスク特化で設計 / description を詳しく(委譲判断に使われる。"use proactively" を入れると能動委譲を促せる)/ ツールは最小限 / バージョン管理にチェックイン | https://code.claude.com/docs/en/sub-agents#example-subagents | 2026-07-06 | 公式明記 |

### 1.3 フック

イベント一覧の概要・PreToolUse での権限拡張は既存メモ §6・§8 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **使いどき(公式基準)**: 「LLM が選ぶことに頼らず、必ず起きてほしい決定論的な処理」。判断が要る場合は `type: "prompt"`(単発 LLM 評価、既定 Haiku)や `type: "agent"`(ツール付き複数ターン検証。実験的)を使う | https://code.claude.com/docs/en/hooks-guide | 2026-07-06 | 公式明記 |
| フックの type は 5 種: `command`(シェル)/ `http`(POST)/ `mcp_tool` / `prompt` / `agent`。タイムアウト既定: command・http・mcp_tool = 10 分、prompt = 30 秒、agent = 60 秒(`timeout` フィールドで上書き) | https://code.claude.com/docs/en/hooks-guide#how-hooks-work | 2026-07-06 | 公式明記 |
| 公式ユースケース例: 入力待ち通知(`Notification`)/ 編集後の自動フォーマット(`PostToolUse` + `Edit\|Write` matcher + prettier)/ 保護ファイルへの編集ブロック(`PreToolUse` + exit 2)/ **コンパクション後のコンテキスト再注入**(`SessionStart` + matcher `compact`)/ 設定変更の監査(`ConfigChange`)/ direnv 連携(`SessionStart` + `CwdChanged` + `CLAUDE_ENV_FILE`)/ ExitPlanMode の自動承認(`PermissionRequest`) | https://code.claude.com/docs/en/hooks-guide#what-you-can-automate | 2026-07-06 | 公式明記 |
| 制御方法: exit 0 = 異議なし(通常の権限フローへ。stdout は `UserPromptSubmit`・`SessionStart` 等でコンテキストに追加)/ exit 2 = ブロック(stderr が Claude へのフィードバックになる)/ JSON 出力(`permissionDecision`: `allow`・`deny`・`ask`・`defer`(-p 専用)) | https://code.claude.com/docs/en/hooks-guide#read-input-and-return-output | 2026-07-06 | 公式明記 |
| 複数フックは並列実行され全て完走後にマージ。判定は最も制限的なものが勝つ(deny → defer → ask → allow の順) | https://code.claude.com/docs/en/hooks-guide#combine-results-from-multiple-hooks | 2026-07-06 | 公式明記 |
| `if` フィールド(v2.1.85+)で権限ルール構文によるツール名+引数のフィルタ(例: `"if": "Bash(git *)"`)。best-effort であり、確実な allow/deny は権限システムで行えと明記 | https://code.claude.com/docs/en/hooks-guide#filter-by-tool-name-and-arguments-with-the-if-field | 2026-07-06 | 公式明記 |
| **PreToolUse の deny は `bypassPermissions` でもブロックされる**(ユーザーがモード変更で回避できないポリシー強制層)。逆に hook の allow は設定の deny ルールを覆せない | https://code.claude.com/docs/en/hooks-guide#hooks-and-permission-modes | 2026-07-06 | 公式明記 |
| 制約: `PermissionRequest` フックは `-p`(非対話)では発火しない → 自動化では `PreToolUse` を使う。`Stop` フックは 8 回連続ブロックで上書きされる(`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` で変更可、`stop_hook_active` を見て早期 exit する実装を推奨)。`PostToolUse` は実行済みのため取り消し不可 | https://code.claude.com/docs/en/hooks-guide#limitations | 2026-07-06 | 公式明記 |
| 配置スコープ: `~/.claude/settings.json` / `.claude/settings.json`(コミット可)/ `.claude/settings.local.json` / managed / プラグイン `hooks/hooks.json` / スキル・エージェントの frontmatter。`/hooks` で閲覧(読み取り専用)。`disableAllHooks: true` で無効化 | https://code.claude.com/docs/en/hooks-guide#configure-hook-location | 2026-07-06 | 公式明記 |
| デバッグ: `Ctrl+O`(transcript に 1 行サマリ)、`claude --debug-file /tmp/claude.log`、`/debug` | https://code.claude.com/docs/en/hooks-guide#debug-techniques | 2026-07-06 | 公式明記 |

### 1.4 プラグイン

配布・組織制限は既存メモ §6 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **standalone(`.claude/`)との使い分け(公式表)**: 単一プロジェクト・個人用・実験・短いスキル名(`/hello`)→ standalone / チーム・コミュニティ共有・複数プロジェクト再利用・バージョン付きリリース・名前空間許容(`/plugin:hello`)→ プラグイン。「まず `.claude/` で試作し、共有段階でプラグイン化」を公式推奨 | https://code.claude.com/docs/en/plugins#when-to-use-plugins-vs-standalone-configuration | 2026-07-06 | 公式明記 |
| 構成: `.claude-plugin/plugin.json`(name・description・version)+ プラグインルート直下に `skills/`・`commands/`(旧式)・`agents/`・`hooks/hooks.json`・`.mcp.json`・`.lsp.json`(code intelligence)・`monitors/`(バックグラウンド監視)・`bin/`(PATH 追加)・`settings.json`(`agent` キー等)。**`.claude-plugin/` の中に置くのは plugin.json のみ**(よくある間違いとして明記) | https://code.claude.com/docs/en/plugins#plugin-structure-overview | 2026-07-06 | 公式明記 |
| 開発フロー: `claude plugin init <name>`(`~/.claude/skills/` にスキャフォールド、`<name>@skills-dir` として自動ロード)または `claude --plugin-dir ./my-plugin` でロード → `/reload-plugins` で再読込 → `claude plugin validate` で検証 | https://code.claude.com/docs/en/plugins#test-your-plugins-locally | 2026-07-06 | 公式明記 |
| 配布: マーケットプレイス経由。公式 2 系統 = `claude-plugins-official`(Anthropic キュレーション・自動登録)と `claude-community`(審査制のコミュニティ投稿)。チーム内配布は private リポジトリのマーケットプレイスで可 | https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-community-marketplace | 2026-07-06 | 公式明記 |
| セキュリティ制約: プラグイン由来のサブエージェントは `hooks`・`mcpServers`・`permissionMode` frontmatter が無視される(必要なら `.claude/agents/` にコピー) | https://code.claude.com/docs/en/sub-agents#choose-the-subagent-scope | 2026-07-06 | 公式明記 |
| 型付き言語には公式マーケットプレイスの code intelligence(LSP)プラグインを推奨(TypeScript・Python・Rust 等は既製あり。カスタムは `.lsp.json`) | https://code.claude.com/docs/en/plugins#add-lsp-servers-to-your-plugin | 2026-07-06 | 公式明記 |

### 1.5 plan モードの推奨ワークフロー

モード一覧は既存メモ §8 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 入り方: `Shift+Tab` でサイクル(`default` → `acceptEdits` → `plan`)、単発は prompt の `/plan` プレフィックス、起動時 `claude --permission-mode plan`、恒常は `permissions.defaultMode: "plan"` | https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode | 2026-07-06 | 公式明記 |
| plan モード中の調査は **Plan サブエージェント**に委譲され、探索出力は別コンテキストに隔離される(メイン会話は読み取り専用のまま) | https://code.claude.com/docs/en/sub-agents#built-in-subagents | 2026-07-06 | 公式明記 |
| プラン承認時の選択肢: 「auto モードで開始」「accept edits で開始」「各編集を手動レビュー」「フィードバックを添えて計画継続」「Ultraplan で(ブラウザレビュー)精緻化」。承認するとその選択肢の権限モードに切り替わる。`Ctrl+G` でプランをテキストエディタで直接編集可。`showClearContextOnPlanAccept` 有効時は承認時に計画コンテキストのクリアも提案 | https://code.claude.com/docs/en/permission-modes#review-and-approve-a-plan | 2026-07-06 | 公式明記 |
| **公式推奨 4 フェーズワークフロー**: ① Explore(plan モードでファイル読解)→ ② Plan(実装計画を作らせる)→ ③ Implement(plan モードを出て実装+テスト)→ ④ Commit(コミット・PR 作成)。各フェーズのプロンプト例つき | https://code.claude.com/docs/en/best-practices#explore-first-then-plan-then-code | 2026-07-06 | 公式明記 |
| **plan モードを使わない基準も明記**: 「スコープが明確で修正が小さいタスク(typo 修正・ログ追加・リネーム)は直接やらせる。**diff を一文で説明できるならプランは省け**」。計画が有効なのは、アプローチが不確か・複数ファイル変更・不慣れなコードのとき | https://code.claude.com/docs/en/best-practices#explore-first-then-plan-then-code | 2026-07-06 | 公式明記 |
| コスト面: plan モードの指示は会話メッセージとして追記されるためプロンプトキャッシュを壊さない。ただし `opusplan` モデル設定では plan モード出入りのたびにモデルが切り替わりキャッシュが無効化される(§2.4 参照) | https://code.claude.com/docs/en/prompt-caching | 2026-07-06 | 公式明記 |
| headless では `--permission-mode` フラグが `-p` と併用可 | https://code.claude.com/docs/en/permission-modes#switch-permission-modes | 2026-07-06 | 公式明記 |

### 1.6 /rewind(チェックポイント)と worktree 並列

チェックポイントの基本(git 独立・外部作用対象外)は既存メモ §4 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| チェックポイントは**ユーザープロンプトごと**に作成され、セッション横断で保持(resume 後も利用可)。30 日で自動クリーンアップ(設定可) | https://code.claude.com/docs/en/checkpointing | 2026-07-06 | 公式明記 |
| `/rewind`(または入力欄が空のとき `Esc` 2 回)のメニュー選択肢は 5 つ: **Restore code and conversation** / **Restore conversation**(コードは維持)/ **Restore code**(会話は維持)/ **Summarize from here**(選択点以降を要約に圧縮)/ **Summarize up to here**(選択点以前を要約に圧縮) | https://code.claude.com/docs/en/checkpointing#rewind-and-summarize | 2026-07-06 | 公式明記 |
| Summarize 系は「対象を選べる部分 /compact」。元メッセージはトランスクリプトに残るため Claude は必要なら詳細を参照できる。要約の焦点を指示するテキストも付けられる | https://code.claude.com/docs/en/checkpointing#restore-vs-summarize | 2026-07-06 | 公式明記 |
| 制約: **bash コマンドによるファイル変更(rm・mv・cp 等)は追跡されない**。セッション外の手動変更・並行セッションの編集も対象外。「checkpoints = ローカル undo、git = 恒久履歴」という位置づけ | https://code.claude.com/docs/en/checkpointing#limitations | 2026-07-06 | 公式明記 |
| 運用推奨(best practices): 「リスクのある試行をやらせて、ダメなら巻き戻す」使い方を公式が推奨。Esc で即中断 → 文脈保持のまま軌道修正、が最初の手段 | https://code.claude.com/docs/en/best-practices#rewind-with-checkpoints | 2026-07-06 | 公式明記 |
| コスト面: `/rewind` は既にキャッシュ済みのプレフィックスへ切り詰めるため、次リクエストはキャッシュヒットする(コンパクションと違い新プレフィックスを作らない)。「捨てたい道に入り込んだら compact より rewind」が公式 Tip | https://code.claude.com/docs/en/prompt-caching#rewinding-the-conversation | 2026-07-06 | 公式明記 |
| **worktree 並列**: `claude --worktree <name>`(`-w`)で `.claude/worktrees/<name>/` に worktree +ブランチ `worktree-<name>` を作成して起動。名前省略で自動命名。別ターミナルで別名実行すれば衝突しない並列セッション。`"#1234"` や PR URL 指定で PR ブランチから作成可 | https://code.claude.com/docs/en/worktrees | 2026-07-06 | 公式明記 |
| ベースブランチ: 既定はリモートの default branch(`origin/HEAD`)。ローカル HEAD 起点にするには settings の `worktree.baseRef: "head"`(値は `"fresh"` / `"head"` のみ) | https://code.claude.com/docs/en/worktrees#choose-the-base-branch | 2026-07-06 | 公式明記 |
| `.worktreeinclude` ファイル(gitignore 構文)で `.env` 等 gitignored ファイルを新 worktree に自動コピー | https://code.claude.com/docs/en/worktrees#copy-gitignored-files-into-worktrees | 2026-07-06 | 公式明記 |
| クリーンアップ: 変更・新規コミットがなければ終了時に自動削除。あればキープ/削除のプロンプト。サブエージェント用 worktree は無変更なら自動削除+ `cleanupPeriodDays` 超過で自動掃除。`-p` 併用時は自動掃除なし(`git worktree remove` 手動)。`.claude/worktrees/` を `.gitignore` に追加推奨 | https://code.claude.com/docs/en/worktrees#clean-up-worktrees | 2026-07-06 | 公式明記 |
| サブエージェント隔離: 「use worktrees for your agents」と頼むか、frontmatter `isolation: worktree`。環境準備(依存インストール等)は worktree ごとに必要、と明記 | https://code.claude.com/docs/en/worktrees#isolate-subagents-with-worktrees | 2026-07-06 | 公式明記 |
| 非 git VCS(SVN 等)は `WorktreeCreate` / `WorktreeRemove` フックで代替可能(この場合 `.worktreeinclude` は処理されない) | https://code.claude.com/docs/en/worktrees#non-git-version-control | 2026-07-06 | 公式明記 |

### 1.7 headless(`claude -p`)の入出力仕様

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| `-p`(`--print`)で非対話実行。全 CLI オプションが併用可。stdin パイプ対応(**v2.1.128+ で stdin は 10MB 上限**。超える場合はファイルに書いてパスを渡す) | https://code.claude.com/docs/en/headless | 2026-07-06 | 公式明記 |
| **`--bare`**: hooks・skills・plugins・MCP・auto memory・CLAUDE.md の自動発見をスキップし起動を高速化。「CI・スクリプトでどのマシンでも同じ結果」を得る用途に公式推奨。**将来 `-p` の既定になる予定**と明記。必要なコンテキストは `--append-system-prompt(-file)` / `--settings` / `--mcp-config` / `--agents` / `--plugin-dir` / `--plugin-url` で明示注入。認証は `ANTHROPIC_API_KEY` か `apiKeyHelper`(OAuth・キーチェーンは読まない) | https://code.claude.com/docs/en/headless#start-faster-with-bare-mode | 2026-07-06 | 公式明記 |
| `--output-format`: `text`(既定)/ `json`(`result`・`session_id`・メタデータ。**`total_cost_usd` とモデル別コスト内訳を含み、呼び出し単位のコスト追跡に使える**)/ `stream-json`(NDJSON ストリーミング。`--verbose` `--include-partial-messages` 併用でトークン単位のデルタ) | https://code.claude.com/docs/en/headless#get-structured-output | 2026-07-06 | 公式明記 |
| スキーマ準拠出力: `--output-format json` + `--json-schema '<JSON Schema>'` → 応答の `structured_output` フィールドに構造化結果 | https://code.claude.com/docs/en/headless#get-structured-output | 2026-07-06 | 公式明記 |
| stream-json のシステムイベント: `system/init`(model・tools・MCP・plugins・plugin_errors。プラグイン未ロード時に CI を fail させる用途を公式例示)、`system/api_retry`(attempt・retry_delay_ms・error 分類)、`system/plugin_install` | https://code.claude.com/docs/en/headless#stream-responses | 2026-07-06 | 公式明記 |
| セッション継続: `--continue`(直近)/ `--resume <session_id>`(json 出力の `session_id` を `jq -r '.session_id'` で取得して指定)。セッション ID の解決は同一プロジェクトディレクトリ(+その worktree)にスコープ | https://code.claude.com/docs/en/headless#continue-conversations | 2026-07-06 | 公式明記 |
| 権限制御: `--allowedTools "Bash,Read,Edit"`(権限ルール構文。`Bash(git diff *)` の**末尾スペース+`*` がプレフィックスマッチ**で、`git diff*` だと `git diff-index` にもマッチする点を明記)/ `--permission-mode`(`dontAsk` = 事前許可外は自動拒否で CI 向き、`acceptEdits` = 編集+ mkdir 等自動承認) | https://code.claude.com/docs/en/headless#auto-approve-tools | 2026-07-06 | 公式明記 |
| `-p` でもユーザー起動スキル(`/skill-name`)をプロンプト文字列に含めて使用可。対話ダイアログを開く組み込みコマンド(`/login` 等)は不可。`/config key=value` 形式で設定変更可(v2.1.181+) | https://code.claude.com/docs/en/headless#create-a-commit | 2026-07-06 | 公式明記 |
| バックグラウンド Bash タスクは最終結果返却+stdin クローズの約 5 秒後に終了。バックグラウンドサブエージェントは完了まで待つ(v2.1.182+ 既定 10 分上限、`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` で調整) | https://code.claude.com/docs/en/headless#background-tasks-at-exit | 2026-07-06 | 公式明記 |
| 公式ユースケース例: ログのパイプ解析(`cat build-error.txt \| claude -p '...'`)、package.json スクリプト化した typo リンター(diff をパイプすれば Bash 権限不要)、セキュリティレビュー(`gh pr diff \| claude -p --append-system-prompt "You are a security engineer..."`)、ファンアウト移行(ファイルリストをループして 1 ファイル 1 呼び出し) | https://code.claude.com/docs/en/headless#examples, https://code.claude.com/docs/en/best-practices#fan-out-across-files | 2026-07-06 | 公式明記 |
| `--input-format`(stream-json 入力)の仕様は headless ページに記載なし。CLI リファレンス / Agent SDK ドキュメントでの確認が必要 | https://code.claude.com/docs/en/headless | 2026-07-06 | 未確認 |

### 1.8 auto memory の活用と制御

仕組みの基本(既定オン v2.1.59+、MEMORY.md 200 行 / 25KB)は既存メモ §7 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 制御 3 経路: `/memory` 内のトグル / settings の `"autoMemoryEnabled": false` / 環境変数 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` | https://code.claude.com/docs/en/memory#enable-or-disable-auto-memory | 2026-07-06 | 公式明記 |
| 保存場所は git リポジトリ単位(**全 worktree・サブディレクトリで共有**)。`autoMemoryDirectory` 設定で移動可(絶対パスまたは `~/`。プロジェクト settings の場合はワークスペーストラスト承諾後に有効)。**マシンローカルであり、他マシン・クラウド環境とは共有されない** | https://code.claude.com/docs/en/memory#storage-location | 2026-07-06 | 公式明記 |
| MEMORY.md はインデックスとして毎セッションロード、トピックファイル(`debugging.md` 等)は**オンデマンド読込**(起動時にはロードされない)。UI の「Writing memory」「Recalled memory」表示が読み書きのサイン | https://code.claude.com/docs/en/memory#how-it-works | 2026-07-06 | 公式明記 |
| 使い分け(公式表): CLAUDE.md = **あなたが書く指示・ルール**(コーディング規約・ワークフロー・アーキテクチャ)/ auto memory = **Claude が書く学習**(ビルドコマンド・デバッグ知見・発見した好み)。「always use pnpm を覚えて」→ auto memory へ、「add this to CLAUDE.md」→ CLAUDE.md へ、と保存先を発話で使い分けられる | https://code.claude.com/docs/en/memory#claude-md-vs-auto-memory | 2026-07-06 | 公式明記 |
| メモリファイルは平文 markdown でいつでも編集・削除可。`/memory` で一覧・エディタ起動(CLAUDE.md・rules・auto memory を横断) | https://code.claude.com/docs/en/memory#audit-and-edit-your-memory | 2026-07-06 | 公式明記 |
| どちらも「コンテキストであって強制設定ではない」。確実な強制は PreToolUse フックで、と明記(既存メモ §7 の CLAUDE.md 論点と同型) | https://code.claude.com/docs/en/memory#claude-md-vs-auto-memory | 2026-07-06 | 公式明記 |

---

## 2. コスト削減のレバー(重点)

### 2.1 コストの内訳・計測の前提

平均コスト実績($13/日等)・課金 2 系統・チーム TPM/RPM 推奨表・ワークスペース支出上限は既存メモ §10・§11 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 大原則: 「**トークンコストはコンテキストサイズに比例する**。Claude が処理するコンテキストが多いほどトークンを使う」。自動最適化はプロンプトキャッシュと自動コンパクションの 2 つ | https://code.claude.com/docs/en/costs#reduce-token-usage | 2026-07-06 | 公式明記 |
| `/usage` の Session ブロック(ドル表示)は**トークン数からのローカル推計**で実請求と異なり得る。正式な請求は Claude Console の Usage ページ。サブスク(Pro/Max)ではセッションコスト表示は請求に無関係(定額内) | https://code.claude.com/docs/en/costs#track-your-costs | 2026-07-06 | 公式明記 |
| `/usage` のプラン内訳(スキル/サブエージェント/プラグイン/MCP サーバー別の使用割合)は `d` / `w` キーで 24 時間 / 7 日を切替。**ローカルセッション履歴由来のため他デバイス・claude.ai 分は含まない**。VS Code 拡張にも同内訳あり(v2.1.174+) | https://code.claude.com/docs/en/costs#using-the-%2Fusage-command | 2026-07-06 | 公式明記 |
| アイドル時もバックグラウンドでトークン消費あり: `--resume` 用の会話要約ジョブ、`/usage` 等のステータス確認。**典型的にはセッションあたり $0.04 未満** | https://code.claude.com/docs/en/costs#background-token-usage | 2026-07-06 | 公式明記 |
| 新規導入時の見積り手順(公式): 小規模パイロット → 計測ツールでベースライン確立 → 展開 | https://code.claude.com/docs/en/costs | 2026-07-06 | 公式明記 |

### 2.2 公式のトークン削減テクニック(costs ページ「Reduce token usage」全項目)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **① コンテキストの能動管理**: 無関係な作業に移るときは `/clear`(古いコンテキストは以後の全メッセージでトークンを浪費する)。`/clear` 前に `/rename` しておき後で `/resume` で戻る運用を公式推奨。`/usage` かステータスラインで使用量を常時監視 | https://code.claude.com/docs/en/costs#manage-context-proactively | 2026-07-06 | 公式明記 |
| **② コンパクション指示のカスタマイズ**: `/compact Focus on code samples and API usage` のように残すものを指定。CLAUDE.md に `# Compact instructions` セクションを書けば恒常カスタマイズ可 | https://code.claude.com/docs/en/costs#manage-context-proactively | 2026-07-06 | 公式明記 |
| **③ モデル選択**: 「Sonnet は大半のコーディングをこなし Opus より安い。Opus は複雑なアーキテクチャ判断・多段推論に温存」。`/model` でセッション中切替、`/config` で既定設定。**単純なサブエージェントタスクには `model: haiku`** | https://code.claude.com/docs/en/costs#choose-the-right-model | 2026-07-06 | 公式明記 |
| **④ MCP オーバーヘッド削減**: ツール定義は既定遅延ロード(既存メモ §6)。`/context` で消費を確認。**`gh`・`aws`・`gcloud`・`sentry-cli` 等の CLI ツールの方が MCP サーバーよりコンテキスト効率が良い**(per-tool リスティングを追加しないため)。`/mcp` で未使用サーバーを無効化 | https://code.claude.com/docs/en/costs#reduce-mcp-server-overhead | 2026-07-06 | 公式明記 |
| **⑤ code intelligence プラグイン**(型付き言語): 「go to definition 1 回が、grep +候補ファイル複数読みの代替になる」。編集後の型エラーも自動報告されコンパイラ実行が不要に | https://code.claude.com/docs/en/costs#install-code-intelligence-plugins-for-typed-languages | 2026-07-06 | 公式明記 |
| **⑥ フック・スキルへの前処理オフロード**: フックが Claude の見る前にデータを前処理できる。公式例: 「10,000 行のログを読ませる代わりに hook が `ERROR` を grep して該当行だけ返す(数万→数百トークン)」「PreToolUse フックでテストコマンドを書き換え、失敗行だけ表示させる(`updatedInput` で `... 2>&1 \| grep -A 5 -E '(FAIL\|ERROR\|error:)' \| head -100` に変換)」。スキル例: `codebase-overview` スキルでアーキテクチャ知識を即時付与し、探索の読み込みを省く | https://code.claude.com/docs/en/costs#offload-processing-to-hooks-and-skills | 2026-07-06 | 公式明記 |
| **⑦ CLAUDE.md からスキルへ移す**: CLAUDE.md は毎セッションロードされるため、特定ワークフロー(PR レビュー・DB マイグレーション等)の詳細手順が入っていると無関係な作業中もトークンを消費。スキルは起動時のみロード。**CLAUDE.md は 200 行以下を目標** | https://code.claude.com/docs/en/costs#move-instructions-from-claude-md-to-skills | 2026-07-06 | 公式明記 |
| **⑧ extended thinking の調整**: 既定有効。**thinking トークンは output トークンとして課金**され、既定予算はモデルにより 1 リクエスト数万トークンになり得る。下げる手段: `/effort` か `/model` 内で effort を下げる / `/config` で thinking 無効化 / 固定予算モデルは `MAX_THINKING_TOKENS=8000` のように予算を下げる(adaptive reasoning モデルは非ゼロ予算を無視するので effort で調整)。Fable 5 は thinking 無効化不可 | https://code.claude.com/docs/en/costs#adjust-extended-thinking | 2026-07-06 | 公式明記 |
| **⑨ 冗長な操作をサブエージェントへ**: テスト実行・ドキュメント取得・ログ処理を委譲し、要約だけをメイン会話に戻す | https://code.claude.com/docs/en/costs#delegate-verbose-operations-to-subagents | 2026-07-06 | 公式明記 |
| **⑩ Agent teams のコスト**: teammates が plan モードで走る場合**標準セッションの約 7 倍のトークン**。対策: teammates は Sonnet / チームを小さく / spawn プロンプトを絞る(CLAUDE.md・MCP・スキルは自動ロードされるので重複させない)/ 終わった teammate はシャットダウン | https://code.claude.com/docs/en/costs#manage-agent-team-costs, https://code.claude.com/docs/en/costs#agent-team-token-costs | 2026-07-06 | 公式明記 |
| **⑪ 具体的なプロンプト**: 「improve this codebase」は広域スキャンを誘発。「add input validation to the login function in auth.ts」なら最小のファイル読みで済む | https://code.claude.com/docs/en/costs#write-specific-prompts | 2026-07-06 | 公式明記 |
| **⑫ 複雑タスクでの無駄防止**: plan モードで方向誤りの手戻りを防ぐ / 誤った方向に進んだら Escape で即止め `/rewind` / 検証ターゲット(テストケース・スクリーンショット・期待出力)を渡して自己検証させる / 1 ファイルずつ書いてテストする逐次進行 | https://code.claude.com/docs/en/costs#work-efficiently-on-complex-tasks | 2026-07-06 | 公式明記 |

### 2.3 コンパクションの制御と消費への影響

自動コンパクションの存在は既存メモ §3 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| コンパクションの内部動作: 要約生成リクエストは会話と同じプレフィックスを共有するため**既存キャッシュを読んで実行される**(フル再処理ではない)。時間の大半は要約生成。後続ターンは短い要約分だけ会話キャッシュを再構築するため「コンパクション直後のターンが遅い」わけではない | https://code.claude.com/docs/en/prompt-caching#compacting-the-conversation | 2026-07-06 | 公式明記 |
| 公式 Tip: 「オーバーヘッドの発生タイミングを選ぶため、**auto-compaction がタスク途中に発火するのを待たず、タスク間の自然な区切りで `/compact` を打つ**」。捨てたい経路に入り込んだ場合は `/compact` でなく `/rewind`(キャッシュ済みプレフィックスに戻るため安い) | https://code.claude.com/docs/en/prompt-caching#compacting-the-conversation | 2026-07-06 | 公式明記 |
| 部分コンパクション: `/rewind` メニューの Summarize from here / up to here(§1.6)。会話全体でなく選んだ側だけ圧縮 | https://code.claude.com/docs/en/checkpointing#restore-vs-summarize | 2026-07-06 | 公式明記 |
| コンパクション後に生き残るもの: プロジェクトルート CLAUDE.md はディスクから再読込・再注入(ネストされた CLAUDE.md は次にそのディレクトリのファイルを読むまで再注入されない)。起動済みスキルは 5,000 / 25,000 トークン予算で再添付(§1.1)。会話内でのみ与えた指示は消え得る → 永続化したい指示は CLAUDE.md へ | https://code.claude.com/docs/en/memory#instructions-seem-lost-after-%2Fcompact | 2026-07-06 | 公式明記 |
| コンパクション後の再注入は `SessionStart` フック(matcher: `compact`)でも可能(stdout がコンテキストに追加される) | https://code.claude.com/docs/en/hooks-guide#re-inject-context-after-compaction | 2026-07-06 | 公式明記 |
| 環境変数: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`(発火閾値の上書き。サブエージェントにも適用)、`CLAUDE_CODE_AUTO_COMPACT_WINDOW`(Sonnet 5 の 1M ウィンドウでは既定約 967K トークンで auto-compact) | https://code.claude.com/docs/en/sub-agents#auto-compaction, https://code.claude.com/docs/en/model-config#sonnet-5-context-window | 2026-07-06 | 公式明記 |
| コンパクション前後は `PreCompact` / `PostCompact` フックイベント(matcher: `manual` / `auto`)で捕捉可能。OTel にも `claude_code.compaction` イベント(pre_tokens・post_tokens) | https://code.claude.com/docs/en/hooks-guide#how-hooks-work, https://code.claude.com/docs/en/monitoring-usage | 2026-07-06 | 公式明記 |

### 2.4 プロンプトキャッシュの効き方(何が無効化するか)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| キャッシュは**プレフィックス完全一致**。リクエストは「システムプロンプト(ツール定義・output style 含む)→ プロジェクトコンテキスト(CLAUDE.md・auto memory・rules)→ 会話」の順に、変化しにくいものが先頭になるよう構成される。プレフィックス途中の変化は**それ以降すべて**を再計算させる(ファイル単位・セグメント単位のキャッシュはない) | https://code.claude.com/docs/en/prompt-caching#how-the-cache-is-organized | 2026-07-06 | 公式明記 |
| 料金影響: `cache_read_input_tokens` は**標準入力単価の約 10%** で課金。`cache_creation_input_tokens` はキャッシュ書込レート | https://code.claude.com/docs/en/prompt-caching#check-cache-performance | 2026-07-06 | 公式明記 |
| **キャッシュを無効化するアクション(公式リスト全 8 種)**: ① `/model` でのモデル切替(モデルごとに別キャッシュ。会話全履歴をキャッシュなしで再読) ② `/effort` 変更(effort もキャッシュキー。会話開始後は確認ダイアログが出る) ③ fast mode オン(初回のみ。ヘッダがキャッシュキーに入る) ④ MCP サーバーの接続/切断(**deferred ツール(既定)なら無害**。プレフィックスにロードされる場合のみ無効化。stdio プロセス終了・HTTP セッション失効・自動再接続でも起こり得る) ⑤ プラグインの有効/無効(**MCP サーバーを含むプラグインのみ**。skills・agents・hooks 等は追記のみでキャッシュ安全) ⑥ ツール名全体の deny ルール追加(`Bash` 等。組み込みツール定義がシステムプロンプト層のため。`Bash(rm *)` のようなスコープ付き deny は無害) ⑦ コンパクション(会話層のみ。設計上の意図的無効化) ⑧ Claude Code のアップグレード(システムプロンプト・ツール定義が変わる) | https://code.claude.com/docs/en/prompt-caching#actions-that-invalidate-the-cache | 2026-07-06 | 公式明記 |
| 派生的な注意: `opusplan` 設定では **plan モードの出入りごとにモデルスイッチ = キャッシュ無効化**。Fable 5 の automatic model fallback もモデルスイッチ。**アップグレード後に長いセッションを resume すると全履歴をキャッシュなしで再処理**(「最も高価なリクエストになり得る」と明記)。`DISABLE_AUTOUPDATER=1` で適用タイミングを制御可 | https://code.claude.com/docs/en/prompt-caching#switching-models, #upgrading-claude-code | 2026-07-06 | 公式明記 |
| **キャッシュを保つアクション**: リポジトリのファイル編集(読みは追記)/ CLAUDE.md の途中編集(ただし**反映もされない**。次の `/clear`・`/compact`・再起動でロード)/ output style 変更(同上)/ 権限モード切替(opusplan の plan だけ例外)/ スキル・コマンド起動(メッセージとして追記)/ `/recap` / `/rewind` / サブエージェント起動(親のプレフィックスは無傷) | https://code.claude.com/docs/en/prompt-caching#actions-that-keep-the-cache | 2026-07-06 | 公式明記 |
| **TTL**: 5 分と 1 時間の 2 種。**サブスクリプションでは自動的に 1 時間 TTL**(定額のため追加負担なし。ただし usage credits 消費中は 5 分に自動ダウン)。API キー・Bedrock 等では既定 5 分、`ENABLE_PROMPT_CACHING_1H=1` でオプトイン(書込単価は高くなる)。`FORCE_PROMPT_CACHING_5M=1` で強制 5 分。キャッシュヒットのたびにタイマーはリセット | https://code.claude.com/docs/en/prompt-caching#cache-lifetime | 2026-07-06 | 公式明記 |
| キャッシュのスコープ: 実質「1 マシン× 1 ディレクトリ」(システムプロンプトに作業ディレクトリ・OS・シェル・auto memory パスが埋め込まれるため)。**同一リポジトリでも worktree ごとに別キャッシュ**。同ディレクトリの並列セッションは共有。逐次セッションは起動時 git status が一致する場合のみ共有 | https://code.claude.com/docs/en/prompt-caching#cache-scope | 2026-07-06 | 公式明記 |
| サブエージェントは独自の会話・独自キャッシュ(初回はヒットなし)。**サブエージェントの TTL はサブスクでも 5 分固定**。fork は親キャッシュを初回から読む(§1.2) | https://code.claude.com/docs/en/prompt-caching#subagents-and-the-cache | 2026-07-06 | 公式明記 |
| 計測: statusline の `current_usage`(`cache_creation_input_tokens` / `cache_read_input_tokens`)。read:creation 比が高ければ良好。creation が毎ターン高いままなら何かがプレフィックスを変えている。組織横断は OTel(ユーザー・セッション別のキャッシュトークン) | https://code.claude.com/docs/en/prompt-caching#check-cache-performance | 2026-07-06 | 公式明記 |
| 公式 Tip(総括): 「**モデルと effort はセッション冒頭に決める。`/compact` はタスク間の自然な区切りに取っておく。タスク中の変更が少ないほどキャッシュヒット率は上がる**」 | https://code.claude.com/docs/en/prompt-caching#how-the-cache-is-organized | 2026-07-06 | 公式明記 |
| 無効化オプション: `DISABLE_PROMPT_CACHING`(全モデル)/ `DISABLE_PROMPT_CACHING_HAIKU` / `_SONNET` / `_OPUS` / `_FABLE`(デバッグ用。通常は有効のまま推奨) | https://code.claude.com/docs/en/prompt-caching#disable-prompt-caching | 2026-07-06 | 公式明記 |

### 2.5 `/model`・effort とモデル別単価の考え方

> モデル名・エイリアスの解決先(Opus 4.8 / Sonnet 5 等)は流動的。執筆時は仕組みのみ記載し具体名は避ける(既存メモの執筆ガイド 7 に同じ)。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| モデルエイリアス: `default`(上書き解除)/ `best` / `fable` / `sonnet` / `opus` / `haiku` / `sonnet[1m]` / `opus[1m]`(1M コンテキスト)/ **`opusplan`(plan モード= opus、実行= sonnet の自動ハイブリッド)**。エイリアスの解決先はプロバイダ・時期で変わる | https://code.claude.com/docs/en/model-config#model-aliases | 2026-07-06 | 公式明記 |
| 設定優先順: セッション中 `/model` > 起動時 `--model` > `ANTHROPIC_MODEL` > settings の `model`。v2.1.153+ では `/model` 選択がユーザー設定の既定として保存(`s` キーでセッション限り)。resume したセッションは保存時のモデルを維持 | https://code.claude.com/docs/en/model-config#setting-your-model | 2026-07-06 | 公式明記 |
| **effort level**: adaptive reasoning の制御。`low` / `medium` / `high`(多くのモデルで既定)/ `xhigh` / `max`(セッション限り・トークン無制限)+ `ultracode`(Claude Code 設定。xhigh +動的ワークフロー編成)。「低 effort は単純タスクを速く安く、高 effort は複雑問題に深い推論」。設定手段: `/effort`、`/model` 内スライダー、`--effort`、`CLAUDE_CODE_EFFORT_LEVEL`、settings `effortLevel`、スキル/サブエージェント frontmatter の `effort` | https://code.claude.com/docs/en/model-config#adjust-effort-level | 2026-07-06 | 公式明記 |
| 単発の深掘りはプロンプト中の `ultrathink` キーワード(セッション effort を変えずそのターンだけ深い推論を要求。キャッシュにも影響しない)。"think hard" 等の他フレーズはキーワードとして認識されない | https://code.claude.com/docs/en/model-config#use-ultrathink-for-one-off-deep-reasoning | 2026-07-06 | 公式明記 |
| 1M コンテキストは「標準単価・200K 超のプレミアムなし」。プランによりサブスク内包 or usage credits 必要(対応表あり)。`CLAUDE_CODE_DISABLE_1M_CONTEXT=1` で無効化 | https://code.claude.com/docs/en/model-config#extended-context | 2026-07-06 | 公式明記 |
| thinking 表示・制御: `Option+T` / `Alt+T` でセッション切替、`/config`(`alwaysThinkingEnabled`)、`MAX_THINKING_TOKENS=0` で無効(Fable 5 除く)。**折りたたまれていても thinking トークンは全額課金**と明記 | https://code.claude.com/docs/en/model-config#extended-thinking | 2026-07-06 | 公式明記 |
| 組織統制: `availableModels`(モデル allowlist。サブエージェント・スキル・fallback チェーンにも適用)、`enforceAvailableModels`(Default 選択肢にも適用)、Enterprise の organization default model / organization model restrictions / role 別 effort 上限 | https://code.claude.com/docs/en/model-config#restrict-model-selection | 2026-07-06 | 公式明記 |
| 可用性フォールバック: `--fallback-model sonnet,haiku` / settings `fallbackModel`(配列、最大 3)。過負荷・サーバーエラー時のみ切替、そのターン限り | https://code.claude.com/docs/en/model-config#fallback-model-chains | 2026-07-06 | 公式明記 |

### 2.6 測定(`/usage`・`/context`・OpenTelemetry)と使用クレジット上限

`/usage` の基本・`/usage-credits`・Console ワークスペースは既存メモ §10・§11 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| `/context` でコンテキスト消費の内訳を可視化(MCP ツール定義・スキル一覧等が何を食っているか)。v2.1.196+ では Skills 行が予算適用後のサイズを表示 | https://code.claude.com/docs/en/costs#reduce-mcp-server-overhead, https://code.claude.com/docs/en/skills#skill-descriptions-are-cut-short | 2026-07-06 | 公式明記 |
| ステータスラインに常時コンテキスト使用量を表示可(`/statusline`)。`current_usage` オブジェクトでキャッシュトークンも読める | https://code.claude.com/docs/en/costs#manage-context-proactively, https://code.claude.com/docs/en/prompt-caching#check-cache-performance | 2026-07-06 | 公式明記 |
| OTel 有効化: `CLAUDE_CODE_ENABLE_TELEMETRY=1` + `OTEL_METRICS_EXPORTER`(`otlp` / `prometheus` / `console`)+ `OTEL_LOGS_EXPORTER` + `OTEL_EXPORTER_OTLP_ENDPOINT` 等。管理者は managed settings の `env` ブロックで組織展開 | https://code.claude.com/docs/en/monitoring-usage | 2026-07-06 | 公式明記 |
| 主要メトリクス: `claude_code.cost.usage`(USD)と `claude_code.token.usage`(`type`: `input` / `output` / `cacheRead` / `cacheCreation`)。両方に `model`・`query_source`(main / subagent 等)・`agent.name`・`skill.name`・`plugin.name`・`mcp_server.name` 等の属性があり、**スキル別・サブエージェント別・MCP 別のコスト帰属が可能**。他に `session.count`・`lines_of_code.count`・`commit.count`・`pull_request.count`・`active_time.total`・`code_edit_tool.decision` | https://code.claude.com/docs/en/monitoring-usage | 2026-07-06 | 公式明記 |
| 主要イベント: `claude_code.api_request`(`cost_usd`・`input_tokens`・`cache_read_tokens` 等)、`claude_code.tool_result`、`claude_code.tool_decision`、`claude_code.compaction`(pre/post トークン)、`claude_code.skill_activated` 等。`OTEL_RESOURCE_ATTRIBUTES` で部署・コストセンター属性を全データに付与可 | https://code.claude.com/docs/en/monitoring-usage | 2026-07-06 | 公式明記 |
| プライバシー系フラグ: プロンプト本文等は既定で含まれない(`OTEL_LOG_USER_PROMPTS=1`・`OTEL_LOG_TOOL_DETAILS=1` 等でオプトイン)。カーディナリティ制御(`OTEL_METRICS_INCLUDE_SESSION_ID` 等)あり | https://code.claude.com/docs/en/monitoring-usage | 2026-07-06 | 公式明記 |
| Bedrock / Agent Platform / Foundry 経由では Anthropic へのメトリクス送信なし → per-user 帰属・上限は自己ホストの Claude apps gateway(OTLP メトリクス+ per-user spend limits)か LLM ゲートウェイで行う | https://code.claude.com/docs/en/costs#managing-costs-for-teams | 2026-07-06 | 公式明記 |
| usage credits の月次上限(`/usage-credits`)は**変更に billing アクセス権が必要**。上限到達時はクレジット残があれば CLI 内で「上限を上げる/外す」を促される(離脱せず継続可) | https://code.claude.com/docs/en/costs#managing-costs-for-teams | 2026-07-06 | 公式明記 |
| headless でのコスト計測: `--output-format json` の `total_cost_usd` +モデル別内訳で**呼び出し単位のスクリプト集計が可能**(§1.7) | https://code.claude.com/docs/en/headless#pipe-data-through-claude | 2026-07-06 | 公式明記 |

---

## 3. 公式ベストプラクティス

> **重要**: 旧エンジニアリングブログ https://www.anthropic.com/engineering/claude-code-best-practices は **308 Permanent Redirect で https://code.claude.com/docs/en/best-practices に統合済み**(2026-07-06 確認)。執筆時の出典は docs 側の best-practices ページを正とする。旧ブログ由来の「Explore→Plan→Code→Commit」「TDD」「視覚反復」「Safe YOLO」は現 docs では以下の形に再編されている。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 中核原則: 「ほとんどのベストプラクティスは 1 つの制約に基づく: **コンテキストウィンドウはすぐ埋まり、埋まるほど性能が落ちる**。コンテキストウィンドウが最重要の管理対象リソース」 | https://code.claude.com/docs/en/best-practices | 2026-07-06 | 公式明記 |
| **検証手段を与える(最上位のプラクティス)**: 「Claude が実行できるチェック(テスト・ビルド・スクリーンショット比較)を渡せ。見守るセッションと離席できるセッションの違いはそこにある」。チェックなしでは「できたように見える」が唯一のシグナルになり人間が検証ループになる。ゲートの強さ 4 段階: プロンプト内で「テストを実行して直せ」→ `/goal`(ターンごとに評価者が再チェック)→ Stop フック(スクリプトが通るまでターン終了をブロック)→ 検証サブエージェント/ワークフロー(別モデルが反証を試みる)。**「成功したと主張させるのではなく証拠(テスト出力・実行コマンドと結果・スクリーンショット)を出させる」** | https://code.claude.com/docs/en/best-practices#give-claude-a-way-to-verify-its-work | 2026-07-06 | 公式明記 |
| **旧「TDD」に相当する現行推奨**: 検証基準の事前提供(「validateEmail を書け。テストケース: ... 実装後にテストを実行」)、バグ修正では「**再現する失敗テストを先に書いてから直す**」プロンプト例、「ビルド失敗はエラーを貼り、根本原因を直し、エラーを抑制しない」 | https://code.claude.com/docs/en/best-practices#give-claude-a-way-to-verify-its-work, #provide-specific-context-in-your-prompts | 2026-07-06 | 公式明記 |
| **視覚反復(旧・スクリーンショットワークフロー)**: 「\[スクリーンショット貼付] このデザインを実装し、結果のスクリーンショットを撮って元と比較し、差分を列挙して直せ」。画像はドラッグ&ドロップ / Ctrl+V / パス指定で渡せる | https://code.claude.com/docs/en/best-practices#give-claude-a-way-to-verify-its-work, https://code.claude.com/docs/en/common-workflows#work-with-images | 2026-07-06 | 公式明記 |
| **Explore→Plan→Implement→Commit** 4 フェーズ(§1.5 に詳細)。小タスクはスキップの基準も明記 | https://code.claude.com/docs/en/best-practices#explore-first-then-plan-then-code | 2026-07-06 | 公式明記 |
| **具体的コンテキストの与え方**(before/after 表): タスクのスコープ指定 / 情報源の指定(「git 履歴を読んで API の経緯を要約」)/ 既存パターンの参照(「HotDogWidget.php が好例。同じパターンで実装」)/ 症状+場所+完了条件の記述 | https://code.claude.com/docs/en/best-practices#provide-specific-context-in-your-prompts | 2026-07-06 | 公式明記 |
| **CLAUDE.md のチューニング**: `/init` で生成 → 磨く。含める/含めないの公式対比表(推測不能なコマンド・独自スタイル・テスト手順・リポジトリ作法・環境の癖は含める / コードから分かること・一般常識・詳細 API doc・頻繁に変わる情報は除外)。「各行について『消したら Claude はミスするか?』と自問し、しないなら削る。**肥大化した CLAUDE.md は実際の指示を無視させる**」。強調(IMPORTANT / YOU MUST)は有効。git にチェックインしてチームで育てる | https://code.claude.com/docs/en/best-practices#write-an-effective-claude-md | 2026-07-06 | 公式明記 |
| **権限まわり(旧 Safe YOLO の現行形)**: 割り込み削減の 3 手段 = auto mode(分類器レビュー付き自動承認)/ `/permissions` の allowlist / `/sandbox`(OS 隔離)。`bypassPermissions`(旧 YOLO 相当)は「インターネットなしのコンテナ・VM 等の隔離環境のみ」で、代替として auto mode を推奨 | https://code.claude.com/docs/en/best-practices#configure-permissions, https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode | 2026-07-06 | 公式明記 |
| **コース修正**: `Esc` 即中断(文脈保持)→ `Esc Esc` / `/rewind` → 「Undo that」→ `/clear`。「**同じ問題で 2 回以上訂正したら、コンテキストは失敗アプローチで汚染されている。`/clear` して学びを織り込んだより良いプロンプトで再開する方がほぼ常に勝る**」 | https://code.claude.com/docs/en/best-practices#course-correct-early-and-often | 2026-07-06 | 公式明記 |
| **インタビューパターン**: 大きめの機能は「AskUserQuestion ツールで自分にインタビューさせ、SPEC.md に仕様を書かせてから、新セッションで実装」。仕様は自己完結(対象ファイル・スコープ外・E2E 検証手順)にする | https://code.claude.com/docs/en/best-practices#let-claude-interview-you | 2026-07-06 | 公式明記 |
| **マルチセッション**: worktree / デスクトップアプリ / Web(クラウド VM)/ agent teams の 4 択比較。品質目的の **Writer/Reviewer パターン**(別セッションの新鮮なコンテキストでレビューさせるとバイアスがない)、テストを書く Claude と通す Claude の分離 | https://code.claude.com/docs/en/best-practices#run-multiple-claude-sessions | 2026-07-06 | 公式明記 |
| **ファンアウト(headless)**: タスクリスト生成 → `claude -p` ループ(`--allowedTools` でスコープ制限)→ 2〜3 ファイルで試してプロンプトを磨いてから全量実行。パイプライン組込は `claude -p "<prompt>" --output-format json \| your_command` | https://code.claude.com/docs/en/best-practices#fan-out-across-files | 2026-07-06 | 公式明記 |
| **敵対的レビュー**: 完了扱いの前にサブエージェントに fresh context で diff レビューさせる(バンドル `/code-review`、または PLAN.md との照合プロンプト)。注意書き: 「gap を探せと言われたレビュアーは健全な作業にも gap を報告する。全部追うと過剰設計になる。正しさと要件に影響する gap だけ挙げさせよ」 | https://code.claude.com/docs/en/best-practices#add-an-adversarial-review-step | 2026-07-06 | 公式明記 |
| **5 つの失敗パターン**: kitchen sink セッション(→ タスク間 `/clear`)/ 訂正の繰り返し(→ 2 回で `/clear` +再プロンプト)/ 過剰 CLAUDE.md(→ 容赦なく削る・フック化)/ 検証なし信頼(→ 検証を必ず用意)/ 際限ない調査(→ スコープを絞るかサブエージェントへ) | https://code.claude.com/docs/en/best-practices#avoid-common-failure-patterns | 2026-07-06 | 公式明記 |
| common-workflows の内容: 日常タスクのプロンプトレシピ集(新規コードベース理解・バグ修正・リファクタ・テスト追加・PR 作成・ドキュメント・画像・`@` ファイル参照)+スケジュール実行の 4 択比較表(Routines / Desktop scheduled tasks / GitHub Actions / `/loop`)+ `claude --from-pr 123`(PR に紐づくセッションの再開) | https://code.claude.com/docs/en/common-workflows | 2026-07-06 | 公式明記 |
| スケジュールタスクのプロンプト作法: 「自律実行で確認質問ができないため、**成功の定義と結果の処理先を明示する**」(例: 「needs-review ラベルの PR をレビューし、問題にはインラインコメント、#eng-reviews に要約を投稿」) | https://code.claude.com/docs/en/common-workflows#run-claude-on-a-schedule | 2026-07-06 | 公式明記 |

---

## 4. 自動化(GitHub Actions・GitLab CI・Routines)

### 4.1 GitHub Actions

セットアップ・実行基盤の基本は既存メモ §6 参照。以下はコスト・運用の詳細。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| v1 で GA(beta から破壊的変更: `mode` 廃止=自動判定、`direct_prompt`→`prompt`、`max_turns`・`model`・`allowed_tools` 等は `claude_args` の CLI フラグへ移行) | https://code.claude.com/docs/en/github-actions#upgrading-from-beta | 2026-07-06 | 公式明記 |
| 入力パラメータ: `prompt`(平文またはスキル起動。省略時はコメントの trigger phrase に反応)/ `claude_args`(任意の CLI 引数パススルー)/ `plugin_marketplaces` / `plugins` / `anthropic_api_key` / `github_token` / `trigger_phrase`(既定 `@claude`)/ `use_bedrock` / `use_vertex` | https://code.claude.com/docs/en/github-actions#action-parameters | 2026-07-06 | 公式明記 |
| モード自動判定: issue/PR コメントイベント+prompt なし → `@claude` メンション応答(interactive)。`prompt` 指定 → 即時実行(automation。cron や PR オープン等の任意イベントで駆動) | https://code.claude.com/docs/en/github-actions | 2026-07-06 | 公式明記 |
| `claude_args` の主要フラグ: **`--max-turns`(既定 10)**・`--model`・`--allowedTools`・`--mcp-config`・`--append-system-prompt`・`--debug` | https://code.claude.com/docs/en/github-actions#pass-cli-arguments | 2026-07-06 | 公式明記 |
| **コスト構造は 2 層**: ① GitHub Actions 分(GitHub ホストランナーの分数消費)② API トークン。**公式の最適化 4 項目**: 具体的な `@claude` 指示で無駄な API 呼び出しを減らす / `--max-turns` で反復上限 / **workflow レベルのタイムアウトで暴走ジョブ防止** / GitHub の concurrency 制御で並列実行を制限 | https://code.claude.com/docs/en/github-actions#ci-costs | 2026-07-06 | 公式明記 |
| `prompt` にスキル起動を渡せる: リポジトリ内 `.claude/skills/` のスキルは `actions/checkout` 後に `/skill-name`、プラグインのスキルは `plugin_marketplaces` + `plugins` で導入して `/plugin-name:skill-name`(PR ごとの `/code-review` 実行例あり) | https://code.claude.com/docs/en/github-actions#using-skills | 2026-07-06 | 公式明記 |
| セキュリティ: API キーは必ず GitHub Secrets(`ANTHROPIC_API_KEY`)。Bedrock / Agent Platform では **OIDC / Workload Identity Federation で静的キーレス認証**を推奨、カスタム GitHub App 推奨。App 権限は Contents / Issues / Pull requests の Read & Write | https://code.claude.com/docs/en/github-actions#security-considerations, #using-with-amazon-bedrock-and-google-cloud | 2026-07-06 | 公式明記 |
| 挙動の制御は 2 経路: リポジトリルートの CLAUDE.md(規約・レビュー基準)+ workflow の `prompt`(ジョブ固有指示) | https://code.claude.com/docs/en/github-actions#customizing-claudes-behavior | 2026-07-06 | 公式明記 |
| トリガーなしで全 PR に自動レビューを付ける別機能として GitHub Code Review あり(参照のみ) | https://code.claude.com/docs/en/github-actions | 2026-07-06 | 公式明記 |

### 4.2 GitLab CI/CD

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **ベータ。メンテナンスは GitLab 社**(Anthropic ではない。サポートは GitLab issue 573776)。Agent SDK / CLI の上に構築 | https://code.claude.com/docs/en/gitlab-ci-cd | 2026-07-06 | 公式明記 |
| セットアップ: `.gitlab-ci.yml` に 1 ジョブ+ masked variable `ANTHROPIC_API_KEY`。ジョブ内で `curl -fsSL https://claude.ai/install.sh \| bash` → `claude -p "..." --permission-mode acceptEdits --allowedTools "Bash Read Edit Write mcp__gitlab"` 形式(= headless 実行そのもの) | https://code.claude.com/docs/en/gitlab-ci-cd#quick-setup | 2026-07-06 | 公式明記 |
| `@claude` メンション駆動は Comments(notes)webhook +リスナーがパイプライン trigger API を `AI_FLOW_INPUT` / `AI_FLOW_CONTEXT` / `AI_FLOW_EVENT` 変数付きで呼ぶ構成(GitHub Actions のような自動判定は組み込みでない) | https://code.claude.com/docs/en/gitlab-ci-cd#manual-setup-recommended-for-production | 2026-07-06 | 公式明記 |
| コスト: GitLab Runner 分+ API トークンの 2 層。最適化: 具体的な `@claude` 指示 / **`max_turns` と `timeout_minutes`(総実行時間上限)の設定** / concurrency 制限 / CLAUDE.md を簡潔に / runner での npm キャッシュ | https://code.claude.com/docs/en/gitlab-ci-cd#ci-costs, #common-parameters-and-variables | 2026-07-06 | 公式明記 |
| 認証: Claude API / Amazon Bedrock(OIDC)/ Google Cloud Agent Platform(WIF)。キーレス推奨 | https://code.claude.com/docs/en/gitlab-ci-cd#using-with-amazon-bedrock-and-google-cloud | 2026-07-06 | 公式明記 |
| ガバナンス: 隔離コンテナ実行・全変更が MR 経由(branch protection / approval 適用)・workspace スコープの書込制限 | https://code.claude.com/docs/en/gitlab-ci-cd#security-and-governance | 2026-07-06 | 公式明記 |

### 4.3 Routines(スケジュール/イベント駆動のクラウド実行)

存在(スケジュール実行 3 通り)は既存メモ §1 参照。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **research preview**。ルーチン=「プロンプト+リポジトリ+コネクタ」の保存済み構成を Anthropic 管理クラウドで自動実行(PC が閉じていても動く) | https://code.claude.com/docs/en/routines | 2026-07-06 | 公式明記 |
| トリガー 3 種(1 ルーチンに複数併用可): **Scheduled**(プリセット頻度または一回限り。**最短間隔 1 時間**、カスタム cron は CLI の `/schedule update` で設定、実行開始は stagger で数分遅れ得る)/ **API**(ルーチン専用の `/fire` エンドポイントに Bearer トークンで POST。`text` フィールドでアラート本文等を注入。**beta ヘッダ `experimental-cc-routine-2026-04-01` 必須**、トークンは一度しか表示されない)/ **GitHub**(Pull request / Release イベント。author・title・base/head branch・labels・draft・merged の 8 フィルタ× equals / contains / regex 等の演算子。**イベントごとに新セッション**、per-routine / per-account の hourly cap あり) | https://code.claude.com/docs/en/routines#configure-triggers | 2026-07-06 | 公式明記 |
| 対象: Pro / Max / Team / Enterprise +「Claude Code on the web」有効時。作成は claude.ai/code/routines・デスクトップアプリ・CLI `/schedule`(**サブスクログイン必須。Console API キーや Bedrock 等の認証では `/schedule` は非表示**)。Team/Enterprise Owner は admin-settings で組織一括無効化可 | https://code.claude.com/docs/en/routines | 2026-07-06 | 公式明記 |
| 実行モデル: **権限モード選択・承認プロンプトなしの完全自律実行**。到達範囲は「選んだリポジトリ+ branch-push 設定」「環境(network access・環境変数・setup script)」「含めたコネクタ」で決まる。**既定でプッシュ先は `claude/` プレフィックスブランチのみ**(リポジトリ単位で Allow unrestricted branch pushes で解除)。コネクタは既定で全部含まれるため不要なものを外せ、と明記 | https://code.claude.com/docs/en/routines#create-a-routine | 2026-07-06 | 公式明記 |
| ネットワーク: 既定環境は Trusted(パッケージレジストリ等の既定 allowlist のみ、他は 403)。Custom で許可ドメイン追加、Full で無制限。コネクタ通信は Anthropic サーバー経由のため allowlist 追加不要 | https://code.claude.com/docs/en/routines#environments-and-network-access | 2026-07-06 | 公式明記 |
| 帰属と共有: ルーチンは**個人アカウント所属**(チーム共有不可)。commit・PR は自分の GitHub ユーザー名義、Slack / Linear 等も自分のリンク済みアカウントとして動く | https://code.claude.com/docs/en/routines#create-a-routine | 2026-07-06 | 公式明記 |
| **コスト**: サブスクリプション使用量を対話セッションと同様に消費+**アカウント単位の日次実行数キャップ**。上限到達後は usage credits 有効なら従量で継続、無効なら拒否。**one-off 実行は日次キャップの対象外**(通常使用量は消費)。消費状況は claude.ai/code/routines か settings/usage で確認 | https://code.claude.com/docs/en/routines#usage-and-limits | 2026-07-06 | 公式明記 |
| 運用上の注意(公式): run 一覧の**グリーンステータスは「インフラエラーなく終了」の意味で、タスク成功を意味しない**。transcript を開いて実際の結果を確認する(ネットワークブロック・コネクタ欠如・タスク失敗はそこに出る) | https://code.claude.com/docs/en/routines#view-and-interact-with-runs | 2026-07-06 | 公式明記 |
| 公式ユースケース 6 例: バックログ整備(夜間+issue トラッカー連携)/ アラートトリアージ(監視ツール→ API トリガー→ドラフト PR)/ 独自チェックリストの PR レビュー(pull_request.opened)/ デプロイ検証(CD → API トリガー→ go/no-go 投稿)/ ドキュメントドリフト検出(週次)/ SDK 間の変更移植(merged PR → 並行 SDK へポート PR) | https://code.claude.com/docs/en/routines#example-use-cases | 2026-07-06 | 公式明記 |
| CLI からの管理: `/schedule`(自然言語で作成。「daily PR review at 9am」「in 2 weeks, ...」)、`/schedule list` / `update` / `run`。API・GitHub トリガーの追加は Web のみ | https://code.claude.com/docs/en/routines#create-from-the-cli | 2026-07-06 | 公式明記 |

---

## 執筆時の注意点(調査から得られた執筆ガイド)

1. **「実践ガイド」の軸は公式に揃っている**: コスト削減章は costs ページの「Reduce token usage」12 項目がそのまま骨格に使える(§2.2)。独自の推測を足さなくても公式明記だけで構成可能。
2. **プロンプトキャッシュは「何をすると高くなるか」の裏返しで書くと実務的**: 無効化 8 アクション(§2.4)のうち日常で踏みやすいのは「モデル/effort のセッション途中変更」「opusplan での plan トグル」「アップグレード直後の長セッション resume」。数値(10% 課金、TTL 5 分/1 時間)は流動的なので確認日併記。
3. **旧ブログの扱い**: anthropic.com/engineering/claude-code-best-practices は docs へ 308 リダイレクト。旧ブログを出典に書かない。「Explore→Plan→Code→Commit」は現 docs にも 4 フェーズとして現存、「TDD」「Safe YOLO」は表現が変わっている(§3 冒頭)。
4. **スキル=旧カスタムスラッシュコマンド**という統合関係は明記する価値が高い(読者の既存知識と接続できる)。`.claude/commands/` が動き続ける点も。
5. **コスト観点でのサブエージェントは両刃**: 隔離でメイン会話を守る一方、キャッシュは独自(TTL 5 分固定)・CLAUDE.md 再ロードあり。fork はキャッシュ再利用で安い、という対比が書ける。
6. **バージョン依存の機能が多い**(v2.1.x で細かく挙動が変わる)。ガイド本文ではバージョン番号を列挙せず「2026 年 7 月時点の docs による」とし、細部は出典リンクに委ねる。
7. **Routines・GitLab CI・auto mode は research preview / beta**。断定形で「使える」と書かず、状態を併記する。
8. **数値の扱い**: `--max-turns` 既定 10、スキル 1,536 文字上限、MEMORY.md 200 行 / 25KB、fork 深さ 5、stdin 10MB などは仕様変更されやすい。本文に書くなら確認日を、それ以外は仕組みのみ記述。

## TODO(要確認)

> **TODO(要確認):** headless の `--input-format`(stream-json 入力)の仕様を CLI リファレンス(https://code.claude.com/docs/en/cli-reference)で確認する(headless ページには記載なし。最終確認: 2026-07)

> **TODO(要確認):** Routines(research preview)・GitLab CI/CD(beta)・auto mode(research preview)のステータス変化を執筆直前に再確認する(最終確認: 2026-07)

> **TODO(要確認):** OpenTelemetry のメトリクス名・属性一覧は monitoring-usage ページの機械取得結果に基づく。執筆時に本文へ転記するメトリクス名(特に `claude_code.cost.usage` の属性)はページを直接再確認する(最終確認: 2026-07)

> **TODO(要確認):** プロンプトキャッシュの cache read 単価(「約 10%」)と 1 時間 TTL の書込割増率の最新値を https://platform.claude.com/docs/en/build-with-claude/prompt-caching で確認する(最終確認: 2026-07)

## 主な出典一覧

- コスト管理: https://code.claude.com/docs/en/costs (アクセス日: 2026-07-06)
- プロンプトキャッシュ: https://code.claude.com/docs/en/prompt-caching (アクセス日: 2026-07-06)
- モデル設定: https://code.claude.com/docs/en/model-config (アクセス日: 2026-07-06)
- 監視(OTel): https://code.claude.com/docs/en/monitoring-usage (アクセス日: 2026-07-06)
- スキル: https://code.claude.com/docs/en/skills (アクセス日: 2026-07-06)
- サブエージェント: https://code.claude.com/docs/en/sub-agents (アクセス日: 2026-07-06)
- フック(ガイド): https://code.claude.com/docs/en/hooks-guide (アクセス日: 2026-07-06)
- プラグイン: https://code.claude.com/docs/en/plugins (アクセス日: 2026-07-06)
- 権限モード / plan モード: https://code.claude.com/docs/en/permission-modes (アクセス日: 2026-07-06)
- チェックポイント: https://code.claude.com/docs/en/checkpointing (アクセス日: 2026-07-06)
- worktree: https://code.claude.com/docs/en/worktrees (アクセス日: 2026-07-06)
- headless: https://code.claude.com/docs/en/headless (アクセス日: 2026-07-06)
- メモリ / auto memory: https://code.claude.com/docs/en/memory (アクセス日: 2026-07-06)
- ベストプラクティス: https://code.claude.com/docs/en/best-practices (アクセス日: 2026-07-06。旧 anthropic.com/engineering/claude-code-best-practices はここへ 308 リダイレクト)
- 共通ワークフロー: https://code.claude.com/docs/en/common-workflows (アクセス日: 2026-07-06)
- GitHub Actions: https://code.claude.com/docs/en/github-actions (アクセス日: 2026-07-06)
- GitLab CI/CD: https://code.claude.com/docs/en/gitlab-ci-cd (アクセス日: 2026-07-06)
- Routines: https://code.claude.com/docs/en/routines (アクセス日: 2026-07-06)
