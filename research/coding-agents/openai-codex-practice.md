# OpenAI Codex 実践・コスト観点 調査メモ(C-R12)

- **対象**: OpenAI Codex の実践運用(機能の使いどころ・コスト削減・業務効率化)。「OpenAI Codex 実践ガイド」執筆用の深掘り調査
- **調査日**: 2026-07-06
- **前提**: 選定観点の基礎調査は [openai-codex.md](openai-codex.md)(2026-07-05)にあり。本メモは重複を避け、既出事項は「既存メモ参照(§n)」と記す
- **調査方法**: developers.openai.com/codex 配下の公式ドキュメントのみを根拠とする(第三者記事は不使用)。help.openai.com は直接取得が 403 のため、該当箇所は検索スニペット経由の確認である旨を明記
- **確度の凡例**: 公式明記 / 公式から推測
- **補足**: developers.openai.com のドキュメントは URL 末尾に `.md` を付けると raw Markdown を取得できる(例: `/codex/pricing.md`)。定点観測に便利

## 1. 機能の使いどころ

### 1-1. ローカル ⇔ クラウドの使い分けとハンドオフ

公式の Workflows ページが面(surface)ごとの使い分けを明示しています(出典: <https://developers.openai.com/codex/workflows>、確認日: 2026-07-06、公式明記)。

| 面 | 公式が推す用途 |
| --- | --- |
| IDE 拡張 | ローカル探索(開いているファイルが自動でコンテキストに入る)。選択範囲ベースの指示でスコープを絞る |
| CLI | 再現手順を回す「タイトなループ」とトランスクリプト。`@` パス補完・`/mention` でファイル添付 |
| クラウド | 長時間の実装・並列実行。IDE のクラウドアイコンから委任 |

- **ローカル → クラウドの引き継ぎ**: コンポーザー下のクラウドアイコンで環境を選ぶと「Codex creates a new thread in the cloud that carries over the existing thread context」(既存スレッドの文脈を引き継いだ新スレッドがクラウド側に作られる)(同上、公式明記)
- **クラウド → ローカル**: IDE 拡張で進捗監視し「結果の diff をローカルに適用」(既存メモ参照 §2・§4)。CLI からは `codex cloud exec --env ENV_ID`(既存メモ参照 §5)
- **公式推奨パターン**: 「Delegate refactor to cloud」ワークフローは、リファクタ計画をローカルで詳細に作ってからクラウドに実行させる、という分担(同上、公式明記)
- Prompting ページも「Cloud threads run in isolated environments and are useful for parallel work or cross-device delegation」とし、並列作業・デバイス横断の委任をクラウドの用途と位置づけ(出典: <https://developers.openai.com/codex/prompting>、確認日: 2026-07-06、公式明記)
- デスクトップアプリはスレッド開始時に **Local / Worktree / Cloud** の 3 モードから選択する設計(§1-4 参照)
- モバイル: Remote connections で「ChatGPT モバイルアプリから接続ホスト上の Codex 作業を開始・操縦・承認・レビュー」できる(出典: <https://developers.openai.com/codex/app>、確認日: 2026-07-06、公式明記)

### 1-2. `codex exec` の入出力仕様(CI 利用)

出典: <https://developers.openai.com/codex/noninteractive>(確認日: 2026-07-06、いずれも公式明記)。

| 項目 | 仕様 |
| --- | --- |
| プロンプト入力 | 引数 1 つで渡す(`codex exec "..."`)。stdin をパイプしつつ引数も渡すと「引数 = 指示、stdin = コンテキスト」として扱う。`codex exec -` で stdin 全体をプロンプトとして強制読込 |
| 標準出力 | 進捗は stderr にストリーム、**最終メッセージのみ stdout**(パイプ前提の設計) |
| `--json` | stdout を JSON Lines に変更。`thread.started` / `turn.started` / 各 item / エラーなど全イベントを出力 |
| `--output-last-message <path>`(`-o`) | 最終メッセージをファイルにも書き出す |
| `--output-schema <path>` | 最終応答を指定 JSON Schema に準拠させる(構造化出力) |
| セッション再開 | `codex exec resume --last "..."` / `codex exec resume <SESSION_ID>` |
| CI 向けフラグ | `--ephemeral`(セッションのロールアウトファイルをディスクに残さない)、`--skip-git-repo-check`、`--ignore-user-config`、`--ignore-rules` |
| サンドボックス既定 | exec は **read-only が既定**。必要最小限の権限を明示指定せよという方針 |
| CI 認証 | `CODEX_API_KEY=<key> codex exec ...` のインライン環境変数(**exec のみ**サポート)。「リポジトリが制御するコードや信頼できないアクションに API キーを晒すな」と明記 |

- 終了コード(exit code)の一覧仕様: **未確認**(ページから抽出できず。執筆時に `codex exec --help` で実機確認を推奨)

### 1-3. `/review` の運用

- 対象指定(ブランチ・未コミット・特定コミット)は既存メモ参照(§4)
- `/review Focus on [specific area]` のように**カスタム観点を付けられる**(出典: <https://developers.openai.com/codex/workflows>、確認日: 2026-07-06、公式明記)
- 公式の反復パターン: 修正後に「`/review` を 2 回実行して修正を確認する」(同上、公式明記)
- Best practices は仕上げの信頼性向上策として、テスト・lint・型チェックの実行依頼とあわせて `/review` の利用、GitHub 利用者には PR レビュー(§4-4)の有効化を推奨(出典: <https://developers.openai.com/codex/learn/best-practices>、確認日: 2026-07-06、公式明記)
- コスト面: ローカルの `/review` は通常の利用制限にカウントされる。GitHub 経由のレビューだけが「Code Review 使用量」として扱われる(§2-1 参照)
- 別概念に注意: `approvals_reviewer = "auto_review"`(サンドボックス境界の承認を人間の代わりにレビュアーエージェントが判断する機能)は PR レビューとは別物。「Auto-review is a reviewer swap, not a permission grant」であり、権限を広げるものではない。`approval_policy` が対話型のときのみ機能(出典: <https://developers.openai.com/codex/concepts/sandboxing/auto-review>、確認日: 2026-07-06、公式明記)

### 1-4. デスクトップアプリ: worktree 並列と automations

出典: <https://developers.openai.com/codex/app/features>(確認日: 2026-07-06、いずれも公式明記)。

- スレッドは開始時に **Local / Worktree / Cloud** のモードを選ぶ。「Worktree creates a new Git worktree so changes stay isolated from your regular project」
- 公式の使い分け: 「現在の作業に触れずに新しいアイデアを試したいとき、または同一プロジェクトで独立タスクを並走させたいときに Worktree を使う」
- diff ペインで Git diff を確認し、**インラインコメントで Codex に修正指示**、チャンク/ファイル単位のステージ・リバートが可能。コミット・プッシュ・PR 作成までアプリ内で完結
- スレッド管理も Codex に依頼できる(関連スレッド検索・既存スレッド継続・ピン留め・アーカイブ)

automations(出典: <https://developers.openai.com/codex/app/automations>、確認日: 2026-07-06、いずれも公式明記):

| 種類 | 動作 | 向く用途 |
| --- | --- | --- |
| スレッド automation | 「heartbeat-style recurring wake-up calls attached to the current thread」。会話文脈を保持したまま定期的に同じスレッドを起こす | 長時間コマンドの監視、接続サービスのポーリングなど継続監視 |
| スタンドアロン / プロジェクト automation | 「start fresh runs on a schedule and report results in Triage」。毎回独立実行 | 実行ごとに独立させたい定期チェック、複数プロジェクト横断 |

- 作成方法: 通常のスレッドで「タスク・スケジュール・スレッド付随か独立か」を自然言語で説明すると Codex が automation を作成・更新。UI フォームもあり。カスタム周期は **cron 構文**で指定
- 「Triage」セクションが受信箱として機能し、発見事項のある実行が表示される(未読フィルタあり)
- Git リポジトリでは automation を**ローカルまたは専用 worktree** で実行可能。「Worktrees keep automation changes separate from unfinished local work」
- 公式ベストプラクティス: スケジュール化する前に「プロンプトを通常スレッドで手動テストする」。スレッド automation のプロンプトには「各 wake-up で何をすべきか・いつ止まるべきか」を書く
- automations の利用制限消費の扱い(専用枠か通常枠か): **未確認**

### 1-5. サブエージェント(config.toml の `[agents]`)

出典: <https://developers.openai.com/codex/subagents> / <https://developers.openai.com/codex/config-reference>(確認日: 2026-07-06、いずれも公式明記)。

```toml
[agents]
max_threads = 6                 # 同時に開けるエージェントスレッド数(既定 6)
max_depth = 1                   # 入れ子の深さ(既定 1 = 子まで。再帰スポーン防止)
job_max_runtime_seconds = 1800  # ワーカーの既定タイムアウト
```

- **カスタムエージェント**は独立 TOML ファイルで定義: `~/.codex/agents/`(個人)または `.codex/agents/`(プロジェクト)。必須フィールドは `name` / `description`(いつ使うかの案内)/ `developer_instructions`(中核指示)。任意で `model`、`model_reasoning_effort`、`sandbox_mode`、`nickname_candidates`、`[mcp_servers.<name>]`
- **組み込みエージェント**は 3 種: `default`(汎用)/ `worker`(実装実行向け)/ `explorer`(読み取り中心のコード探索)
- 起動は明示指示のみ: 「Codex only spawns a new agent when you explicitly ask it to do so」。例: 「Spawn one agent per point... wait for all of them」。`/agent` でアクティブなスレッドを切り替え
- カスタムエージェントは**親のサンドボックスポリシーを継承**する
- コスト警告(公式): 「Subagent workflows consume more tokens than comparable single-agent runs」。深い入れ子は「token usage, latency, and local resource consumption」を増やす → 軽量モデル(`gpt-5.4-mini`)をサブエージェントに割り当てるのが公式の想定(§2-3)

### 1-6. スキル

出典: <https://developers.openai.com/codex/skills>(確認日: 2026-07-06、いずれも公式明記)。

- スキルは「instructions, resources, and optional scripts」をパッケージ化してワークフローを確実に再現させる仕組み。オープンな agent skills 標準に準拠
- ディレクトリ構成: `SKILL.md`(必須。frontmatter に `name` と `description`)+ 任意の `scripts/` / `references/` / `assets/` / `agents/openai.yaml`(UI 設定・依存)
- 探索スコープ(優先順): カレントの `.agents/skills` → 親ディレクトリの `.agents/skills` → リポジトリルートの `.agents/skills` → `$HOME/.agents/skills`(個人)→ `/etc/codex/skills`(管理者)→ 組み込み
- 起動は 2 系統: **明示**(`/skills` または `$skill-name` 構文)と**暗黙**(タスクが `description` にマッチしたとき)。効率のため「最初は name / description / パスのみ読み、使うと決めてから SKILL.md 全文をロード」する遅延読込 → description の書き方がトリガー精度を決める
- 作成支援: `$skill-creator`(対話作成)、`$skill-installer`(キュレーション済みスキルの導入)。無効化は `~/.codex/config.toml` の `[[skills.config]]`
- 公式ベストプラクティス: 「Keep each skill scoped to one job」、決定的な動作が必要なとき以外はスクリプトより指示文を優先、典型プロンプトで description の発火をテスト
- Best practices ページの判断基準: 「If you keep reusing the same prompt or correcting the same workflow, it should probably become a skill」。候補例: ログのトリアージ、リリースノート、PR レビューチェックリスト、移行計画、デバッグ手順(出典: <https://developers.openai.com/codex/learn/best-practices>、確認日: 2026-07-06、公式明記)

### 1-7. フック

出典: <https://developers.openai.com/codex/hooks>(確認日: 2026-07-06、いずれも公式明記)。

- 「エージェントループに自分のスクリプトを注入する」拡張フレームワーク。設定場所は `~/.codex/hooks.json` / `~/.codex/config.toml` / `<repo>/.codex/hooks.json` / `<repo>/.codex/config.toml`。有効化フラグは `features.hooks`
- イベント: `SessionStart` / `SubagentStart` / `PreToolUse` / `PermissionRequest` / `PostToolUse` / `PreCompact` / `PostCompact` / `UserPromptSubmit` / `SubagentStop` / `Stop`
- 設定例(TOML):

```toml
[[hooks.PreToolUse]]
matcher = "^Bash$"

[[hooks.PreToolUse.hooks]]
type = "command"
command = '/usr/bin/python3 "$(git rev-parse --show-toplevel)/.codex/hooks/script.py"'
timeout = 30
statusMessage = "Checking Bash command"
```

- 入出力契約: stdin に JSON(`session_id` / `transcript_path` / `cwd` / `hook_event_name` / `model` / `turn_id` / `permission_mode`)。終了コード **0** = 成功(stdout のテキストが developer コンテキストとして追加)、**2** = ブロック(stderr がメッセージ)。JSON 出力で `continue` / `stopReason` / `systemMessage` 等を返せる。`PreToolUse` のブロックは `hookSpecificOutput.permissionDecision = "deny"` 形式
- 公式の用途例: 会話ログの外部分析基盤への送信、**API キーの誤ペースト検知(プロンプトスキャン)**、会話要約による永続メモリ生成、ターン終了時のカスタム検証、ディレクトリ別のプロンプト調整
- 制約: ハンドラは `type: "command"` のみ実行(`prompt` / `agent` はパースされるがスキップ)。Pre/PostToolUse は単純なシェル呼び出しのみ捕捉(WebSearch・非シェル/非 MCP ツールは対象外)。複数ヒットしたフックは並行起動され互いに止められない。既定タイムアウト 600 秒
- 信頼管理: 非管理フックは実行前にレビューが必要。`/hooks` コマンドで出所確認・信頼付与・個別無効化。`requirements.toml` 等で配布される管理フックは「trusted by policy, and can't be disabled」

### 1-8. AGENTS.md の階層運用の実践(Review guidelines 含む)

探索順・連結順・32 KiB 上限は既存メモ参照(§7)。実践面の追加事実:

- 推奨コンテンツ(Best practices): リポジトリレイアウト、ビルド・テスト・lint コマンド、エンジニアリング規約、禁止事項(do-not rules)、作業完了の検証方法。`/init` でスターターを生成。「A short, accurate `AGENTS.md` is more useful than a long file full of vague rules」(出典: <https://developers.openai.com/codex/learn/best-practices>、確認日: 2026-07-06、公式明記)
- 更新のトリガー(Customization ページ): 「Repeated mistakes(繰り返すミス)」「Too much reading(毎回読ませすぎ)」「Recurring PR feedback(PR で繰り返される指摘)」が出たら AGENTS.md に昇格させる(出典: <https://developers.openai.com/codex/concepts/customization>、確認日: 2026-07-06、公式明記)
- **コスト面の階層運用**: AGENTS.md を階層にネストして「注入されるコンテキストを絞る」ことが公式の節約テクとして明記(§2-2)
- **Review guidelines**: リポジトリトップの AGENTS.md に `## Review guidelines` セクションを書くと GitHub コードレビューの観点になる。例(公式): 「Don't log PII.」「Verify that authentication middleware wraps every route.」。「Codex applies guidance from the closest `AGENTS.md` to each changed file」— パッケージ固有の観点は深い階層に置く(出典: <https://developers.openai.com/codex/integrations/github>、確認日: 2026-07-06、公式明記)

### 1-9. カスタマイズ機構の使い分け(公式の指針)

出典: <https://developers.openai.com/codex/concepts/customization>(確認日: 2026-07-06、公式明記)。

| 機構 | 公式の「使うとき」 |
| --- | --- |
| AGENTS.md | 「そのリポジトリで毎回従わせたいルール」(ビルドコマンド・レビュー期待値・規約) |
| スキル | 反復可能なワークフロー(リリース手順・レビュー定型・ドキュメント更新)、例やスクリプトが要る手順 |
| MCP | 「ローカルリポジトリの外にある能力」(イシュートラッカー・デザインツール・ブラウザ・共有ドキュメント) |
| サブエージェント | ノイズの多い/専門化したタスクの委任(ロール別エージェント) |
| automations | 定期チェック(例: 日次でガイダンスの穴を探す) |

- 公式の導入順序: (1) AGENTS.md + 基盤(pre-commit・linter)→ (2) プラグイン/スキル → (3) MCP → (4) サブエージェント

## 2. コスト削減のレバー

### 2-1. 制限の構造(5 時間ウィンドウ・週次)

出典: <https://developers.openai.com/codex/pricing>(確認日: 2026-07-06、いずれも公式明記。数値は変動前提で執筆時に再確認すること)。

- 「The usage limits for local messages and cloud tasks share a **five-hour window**. Additional weekly limits may apply」— **ローカルメッセージとクラウドタスクは同一の 5 時間ウィンドウを共有**し、週次制限が追加で適用されうる
- プラン別の目安(5 時間あたりのローカルメッセージ数レンジ。2026-07-06 時点): Plus = GPT-5.5 で 15〜80 / GPT-5.4 で 20〜100 / GPT-5.4 mini で 60〜350。Pro 5x / Pro 20x はその 5 倍 / 20 倍。Business は Plus 相当
- 「usage is calculated as credits per million input tokens, cached input tokens, and output tokens」— 表向きは「メッセージ数」だが、内部の計量はトークンベースのクレジット
- 2026-04-02 に per-message 課金からトークン整合の課金へ変更された(出典: <https://help.openai.com/en/articles/20001106-codex-rate-card>、確認日: 2026-07-06、公式明記 — ただし直接取得が 403 のため検索スニペット経由。執筆時にブラウザで再確認)
- **Code Review の扱い**: 「Code Review usage applies only when Codex runs reviews through GitHub」— GitHub 経由のレビューのみ別枠計上。ローカルの `/review` は通常制限にカウント
- API キー認証は通常の API 従量課金で、含まれる制限枠は適用外(既存メモ参照 §11)

### 2-2. 公式が推奨する節約テクニック

pricing ページの「使用量を節約するには」に相当する公式推奨(出典: <https://developers.openai.com/codex/pricing>、確認日: 2026-07-06、公式明記):

1. **プロンプトサイズの制御**: 「Be precise with instructions... remove unnecessary context」
2. **AGENTS.md の削減**: ファイルをネストして注入コンテキストを絞る
3. **MCP サーバーの絞り込み**: 「Every MCP... adds more context... uses more of your limit」— 使っていない MCP は外す
4. **小さいモデルへの切替**: ルーチンタスクは GPT-5.4 mini へ

Best practices 由来の追加レバー(出典: <https://developers.openai.com/codex/learn/best-practices>、確認日: 2026-07-06、公式明記):

- **推論レベルをタスク難易度に合わせる**: 「Choose a reasoning level based on how hard the task is」— 速いタスクは Low、複雑な変更は Medium/High、長い推論が要る作業だけ Extra High
- **スレッドは「タスク単位」**: よくある間違いとして「One thread per project instead of per task」が明記されており、肥大化スレッドの継続はコンテキスト(=消費)を膨らませる
- サブエージェントの多用は逆効果になりうる: 「Subagent workflows consume more tokens than comparable single-agent runs」(出典: <https://developers.openai.com/codex/subagents>、確認日: 2026-07-06、公式明記)

### 2-3. クレジット消費の仕組み(モデル別レート)

出典: <https://developers.openai.com/codex/pricing>(確認日: 2026-07-06、公式明記。レートは改定されうるため執筆時に再確認)。

| モデル | 入力(credits / 1M tokens) | キャッシュ済み入力 | 出力 |
| --- | --- | --- | --- |
| GPT-5.5 | 125 | 12.50 | 750 |
| GPT-5.4 | 62.50 | 6.25 | 375 |
| GPT-5.4 mini | 18.75 | 1.875 | 113 |

- 目安: 「GPT-5.5 usage averages 5-45 credits per message」
- **キャッシュ済み入力は通常入力の 1/10** のレート → 同一スレッドの継続などプロンプトキャッシュが効く使い方はクレジット効率が良い(レートは公式明記。「継続スレッドはキャッシュが効きやすい」という運用解釈は公式から推測)
- **Fast mode は高レート**: 速度 1.5 倍の代わりに GPT-5.5 で **2.5 倍**、GPT-5.4 で **2 倍**のクレジット消費。`/fast on|off|status`、`service_tier = "fast"` + `[features].fast_mode = true`。ChatGPT サインイン限定で、API キー利用時は使えない(出典: <https://developers.openai.com/codex/speed>、確認日: 2026-07-06、公式明記)→ **急がないタスクで Fast mode を切るのは明確な節約レバー**(公式から推測)
- モデル選択: 「gpt-5.4-mini を『より速く低コストな選択肢』として軽いコーディングタスクやサブエージェントに」使うのが公式推奨。`gpt-5.3-codex-spark` は Pro 限定 research preview で「near-instant, real-time coding iteration」向け(能力は限定的)。切替は `/model`、`--model`/`-m` フラグ、`config.toml` の `model` キー。**クラウドタスクは現状モデル選択不可**(出典: <https://developers.openai.com/codex/models>、確認日: 2026-07-06、公式明記)
- spark のクレジットレート: **未確認**(pricing のレート表に記載なし)

### 2-4. コンテキスト管理と消費への影響

- 自動コンパクション: 「For extended tasks, Codex automatically compacts context by summarizing relevant details and removing less critical information」(出典: <https://developers.openai.com/codex/prompting>、確認日: 2026-07-06、公式明記)。手動は `/compact`(出典: <https://developers.openai.com/codex/learn/best-practices>、同日、公式明記)
- 関連 config キー(出典: <https://developers.openai.com/codex/config-reference>、確認日: 2026-07-06、公式明記): `model_auto_compact_token_limit`(自動コンパクション発動のトークン閾値。未設定ならモデル既定)/ `compact_prompt`(コンパクション用プロンプトの上書き)/ `tool_output_token_limit`(ツール出力 1 件あたりの履歴保存トークン上限)/ `model_context_window`
- コンパクション・`codex resume` がクレジット消費に与える影響の**定量的な公式記述はなし** → 「コンパクション自体にも要約生成の消費が発生する」「resume はキャッシュ済み入力レートの恩恵を受けやすい」は公式から推測の域。執筆時は断定を避けること
- 参考: Memories 機能(既定オフ)は `memories.min_rate_limit_remaining_percent`(既定 25)を持ち、「レート制限ウィンドウの残量が 25% を下回るとメモリ生成を開始しない」— 公式自身が制限残量を守る設計にしている(出典: <https://developers.openai.com/codex/config-reference> / <https://developers.openai.com/codex/memories>、確認日: 2026-07-06、公式明記)

### 2-5. クラウドタスクとローカルの消費の違い

- 両者は**同一の 5 時間ウィンドウを共有**する(§2-1)。消費レート面での区別の公式記載はなし(出典: <https://developers.openai.com/codex/pricing>、確認日: 2026-07-06、公式明記)
- クラウドはモデル選択不可(§2-3)のため、「軽いタスクを mini に切り替える」節約はローカル面でのみ可能(公式から推測)
- クラウドタスク 1 件あたりのクレジット換算の詳細(並列 attempts の課金など): **未確認**(レートカードの直接確認が必要)

### 2-6. 使用量の確認方法

- CLI: **`/status`** コマンドで残量確認(出典: <https://developers.openai.com/codex/pricing>、確認日: 2026-07-06、公式明記)
- Web: **Codex usage dashboard**(`chatgpt.com/codex/settings/usage`)(同上、公式明記)
- Codex settings > Usage パネルで、プラン・ロールに応じて残クレジット確認・クレジット購入・auto-reload 管理が可能(出典: <https://help.openai.com/en/articles/20001106-codex-rate-card>、確認日: 2026-07-06、公式明記 — 検索スニペット経由。執筆時に再確認)
- 組織全体は Analytics API(既存メモ参照 §10)

## 3. 公式ベストプラクティス

### 3-1. Best practices ページ(learn/best-practices)

出典: <https://developers.openai.com/codex/learn/best-practices>(確認日: 2026-07-06、いずれも公式明記)。

- **プロンプトの 4 要素**: Goal(何を変える/作るか)/ Context(関係するファイル・ドキュメント・エラー)/ Constraints(規約・アーキテクチャ・安全要件)/ **Done when**(テスト合格などの完了条件)
- **難しいタスクは計画から**: Plan mode(`/plan` または Shift+Tab)、「Codex に自分をインタビューさせて前提を明確化」、複数ステップ作業には `PLANS.md` テンプレートの設定
- **設定の一貫性**: `~/.codex/config.toml`(個人)と `.codex/config.toml`(リポジトリ)にモデル・推論レベル・サンドボックス・MCP の既定を置く。「Keep approval and sandboxing tight by default, then loosen permissions only for trusted repos」
- **信頼性向上**: テスト作成/実行・lint/format/型チェック・要求との一致確認・diff のレビューを Codex 自身に依頼。`/review` と GitHub PR レビューを併用
- **セッション制御**: 作業のまとまりごとに 1 スレッド。`/resume`、`/fork`、`/compact`、`/agent`、`/status`
- **automations との関係**: 「Skills define the method, automations define the schedule」(スキル = 方法、automations = スケジュール)
- **公式の「よくある間違い」リスト**: AGENTS.md を使わずプロンプトに詰め込む / ビルド・テストコマンドを教えない / 複数ステップ作業で計画を飛ばす / ワークフロー理解前にフル権限を与える / **git worktree なしでライブスレッドを並走させる** / 不安定なワークフローを自動化する / タスク単位でなくプロジェクト単位のスレッド運用

### 3-2. Prompting ページ

出典: <https://developers.openai.com/codex/prompting>(確認日: 2026-07-06、いずれも公式明記)。

- 「Codex produces higher-quality outputs when it can verify its work」— 再現手順・検証手順・lint 実行を含める
- 「Codex handles complex work better when you break it into smaller, focused steps」— 分割に迷ったらまず計画を提案させる
- **Goal mode**: 長時間タスク向けに永続目標を維持するモード。「The app should compile in strict mode without explicit `any` type definitions」のように**測定可能な完了条件**で書く。フォローアップで制約調整、サイドチャットで作業を中断せず状況確認、切断前に一時停止が可能

### 3-3. Workflows ページ(ユースケース別の型)

公式が 7 つの型を提示: コードベース説明 / バグ修正 / テスト作成 / スクリーンショットからのプロトタイプ / ライブ更新での UI 反復 / リファクタのクラウド委任 / コードレビュー(出典: <https://developers.openai.com/codex/workflows>、確認日: 2026-07-06、公式明記)。面別の使い分け・ハンドオフは §1-1、`/review` は §1-3 参照。

- バグ修正の型: 「明示的な制約の指定が、高レベルな説明よりも効く」。UI 反復の型: dev サーバーを起動したまま Codex に反復させるタイトなループ

## 4. 自動化

### 4-1. GitHub Action

出典: <https://developers.openai.com/codex/github-action>(確認日: 2026-07-06、いずれも公式明記)。

- Action 名: **`openai/codex-action@v1`**
- 主な入力: `openai-api-key`(GitHub Secrets 経由)/ `prompt` または `prompt-file` / `model`・`effort` / `sandbox`(`read-only` / `workspace-write` / `danger-full-access`)/ `output-file` / `codex-args`(追加 CLI フラグ)/ `safety-strategy`
- `safety-strategy`: `drop-sudo`(既定。昇格権限を落とす)/ `unprivileged-user` / `unsafe`。ランナーは Linux / macOS 対応、**Windows は `unsafe` が必要**
- 公式サンプルの型: PR イベントでチェックアウト → `prompt-file: .github/codex/prompts/review.md` で実行 → `final-message` 出力を `github-script` で PR コメントに投稿
- セキュリティ指針: API キーは Secrets に置く / ユーザー入力をサニタイズして**プロンプトインジェクションを防ぐ** / Action はジョブの最終ステップに置いて状態変更を隔離 / トリガーを信頼できるユーザーに制限
- 課金: API キー認証のため通常の API 従量課金(§2-1。公式から推測 — Action ページに明示の課金記述はなし)

### 4-2. Codex SDK による自動化パターン

出典: <https://developers.openai.com/codex/sdk>(確認日: 2026-07-06、いずれも公式明記)。

- インストール: TypeScript = `npm install @openai/codex-sdk`、Python = `pip install openai-codex`
- TypeScript: `new Codex()` → `codex.startThread()` → `await thread.run("...")`。再開は `codex.resumeThread(threadId)` 後に `run()`
- Python: `Codex()` コンテキストマネージャ → `codex.thread_start(model="gpt-5.4", sandbox=Sandbox.workspace_write)` → `thread.run("...")` → `result.final_response`。非同期は `AsyncCodex`
- サンドボックスは「`run(...)` に渡すとそのターン以降に適用」(ターン単位で切替可能)
- 公式が挙げる用途: CI/CD パイプライン、カスタムエージェント、社内ツール・ワークフローへの組み込み
- 構造化出力を CI で使う場合は `codex exec --output-schema`(§1-2)が対応。SDK 側の構造化出力 API の詳細: **未確認**
- Python SDK はローカルの Codex app-server を JSON-RPC で制御する方式(既存メモ参照 補足)

### 4-3. Slack / Linear 連携の実践

Slack(出典: <https://developers.openai.com/codex/integrations/slack>、確認日: 2026-07-06、いずれも公式明記):

- 前提: Plus / Pro / Business / Enterprise / Edu プラン、GitHub 接続、Codex cloud に環境が 1 つ以上、(ワークスペースポリシーによっては)管理者承認
- チャンネル/スレッドで `@Codex` メンション。「スレッドの過去メッセージを参照できるため、文脈の再説明は不要なことが多い」
- 環境選択は自動(アクセス可能な環境から最適なものを選択。曖昧なら直近使用の環境)。`@Codex fix the above in openai/codex` のようにリポジトリ指定も可。タスクは「環境の repo map の最初のリポジトリのデフォルトブランチ」に対して実行
- 結果: 👀 リアクション → タスクリンク返信 → スレッドに結果投稿。Enterprise 管理者は「回答の投稿」を無効化しタスクリンクのみに制限可能

Linear(出典: <https://developers.openai.com/codex/integrations/linear>、確認日: 2026-07-06、いずれも公式明記):

- 前提: Linear の有料プラン + 管理者がワークスペース設定で有効化。Codex settings のコネクタから「Codex for Linear」をインストールし、イシューコメントで `@Codex` メンションしてアカウント連携
- 委任方法は 2 つ: **イシューを Codex にアサイン**(チームメイトと同様)/ コメントで `@Codex` メンション(`in openai/codex` で環境固定可)
- 完了時は「サマリーと完了タスクへのリンクを投稿し、そこから PR を作成できる」。進捗はイシューの Activity とタスクリンクで追跡
- **Linear の triage ルールで、ステータス・優先度などの条件により自動で Codex にアサイン可能**(人手ゼロの自動委任パターン)

### 4-4. コードレビュー自動化(全 PR 自動レビュー)

出典: <https://developers.openai.com/codex/integrations/github>(確認日: 2026-07-06、いずれも公式明記)。

- 前提: 対象リポジトリで Codex cloud を構成済み。Codex settings の **Code review トグルをリポジトリ単位で有効化**
- 手動トリガー: PR に `@codex review` コメント(👀 リアクション → P0/P1 中心のレビュー投稿)。`@codex review for security regressions` のように**観点付き依頼**が可能
- **自動レビュー**: 設定で「Automatic reviews」を有効にすると**新規 PR すべて**をメンションなしでレビュー
- レビュー後のフォローアップ: `@codex fix the P1 issue` で修正タスクを起動。「review」を含まない `@codex` メンションは PR を文脈としたクラウドタスクになる
- レビュー観点のカスタマイズは AGENTS.md の `## Review guidelines`(§1-8)
- コスト: GitHub 経由のレビューは「Code Review 使用量」として計上(§2-1)。プラン要件は Plus / Pro 以上(既存メモ参照 §11)。**全 PR 自動レビュー時の消費レート・上限の詳細は未確認**(レートカード直接確認が必要)
- draft PR の扱い: **未確認**

### 4-5. 「プロアクティブなチームメイト」パターン(公式ユースケース)

出典: <https://developers.openai.com/codex/use-cases/proactive-teammate>(確認日: 2026-07-06、公式明記)。

- プラグイン/連携(Slack・Gmail・Google Calendar・Notion・GitHub・Linear・カスタム MCP)+ automations + 継続スレッドを組み合わせ、Codex に「変化に気づかせる」運用
- 公式の 5 ステップ: (1) プラグイン接続 → (2) スレッドでソース確認を依頼 → (3) 有用/ノイズのフィードバック → (4) そのスレッドに automation を付けてピン留め → (5) 同一スレッドでフォローアップ
- スターター例: 「Can you check @slack, @gmail, @google-calendar, and @notion and tell me what needs my attention?」

## 未確認事項・執筆時の再確認リスト

1. `codex exec` の終了コード仕様(§1-2)— 実機の `--help` で確認
2. automations の利用制限消費の扱い(§1-4)
3. `gpt-5.3-codex-spark` のクレジットレート(§2-3)
4. クラウドタスク 1 件あたりのクレジット換算・並列 attempts の課金(§2-5)
5. 全 PR 自動レビューの消費レートと draft PR の扱い(§4-4)
6. SDK の構造化出力 API(§4-2)
7. help.openai.com のレートカード・プラン記事(直接取得 403。検索スニペット経由の記述はブラウザで再確認): <https://help.openai.com/en/articles/20001106-codex-rate-card> / <https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan>
8. プラン別メッセージ数レンジ・クレジットレート・Fast mode 倍率は改定されやすい → 執筆直前に <https://developers.openai.com/codex/pricing> / <https://developers.openai.com/codex/speed> / <https://developers.openai.com/codex/models> を再取得(`.md` 付き URL が便利)
