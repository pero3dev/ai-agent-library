# GitHub Copilot 実践・コスト観点 調査メモ(C-R13)

- **対象**: GitHub Copilot の実践・コスト観点(機能の使いどころ / AI Credits によるコスト削減 / 公式ベストプラクティス / 自動化)。「GitHub Copilot 実践ガイド」執筆の下調べ
- **調査日**: 2026-07-06
- **調査方法**: docs.github.com(how-tos / concepts / tutorials / reference / REST)のみを根拠とし、第三者記事は根拠にしていない
- **確度の凡例**: 公式明記 / 公式から推測(未確認は「未確認」と明記)
- **既存メモとの関係**: 選定観点(実行環境・IDE 対応・設定ファイルの仕様・権限・セキュリティ・プラン体系など)は [github-copilot.md](github-copilot.md)(2026-07-05 調査)を参照。本メモは重複部分を再掲せず「既存メモ参照」と記す

## 1. 機能の使いどころ(公式ガイダンス)

### 1.1 タスク種別ごとのツール選択(公式マッピング)

公式に「Choosing the right AI tool for your task」という専用ページがあり、SDLC フェーズ別にツールを対応付けている(比較表はなく散文)。

| フェーズ / タスク | 推奨ツール(公式の記述) | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 計画・技術選定 | Copilot Chat(ブレインストーミング・技術選定支援)、cloud agent(「research a repository and create a detailed implementation plan」) | https://docs.github.com/en/copilot/concepts/ai-tools | 2026-07-06 | 公式明記 |
| コーディング(打鍵中) | インライン補完、Next edit suggestions(「predicts the next edit you are likely to make」) | 同上 | 2026-07-06 | 公式明記 |
| 対話しながらの実装 | Chat の ask モード(会話型ペアプロ)、edit モード(「more granular control over the edits that Copilot proposes」— 対象ファイルを自分で選び、承認可否も自分で判断) | 同上 | 2026-07-06 | 公式明記 |
| 反復作業の自動化 | Chat の agent モード(「automating repetitive tasks and managing your workflow」。複数ステップの計画・ツール実行・反復を自律実行) | 同上 | 2026-07-06 | 公式明記 |
| レビュー | Copilot code review(IDE 内または PR コメント) | 同上 | 2026-07-06 | 公式明記 |
| テスト | Chat(ユニット / 結合テスト生成・失敗のデバッグ) | 同上 | 2026-07-06 | 公式明記 |
| 運用(Issue 対応) | cloud agent(Issue を自律解決して PR 化) | 同上 | 2026-07-06 | 公式明記 |
| 選択基準の性格 | 明示的なランキング基準はなく「フェーズ × 制御の強さ(自動補完 / 対話 / 自律)」で選ぶ構成 | 同上 | 2026-07-06 | 公式から推測(整理は執筆者による) |

### 1.2 cloud agent に「向くタスク / 向かないタスク」(公式明記)

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 向くタスク | バグ修正・UI 変更・テストカバレッジ改善・ドキュメント更新・アクセシビリティ改善・技術的負債対応など「well-defined and scoped issues」 | https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results | 2026-07-06 | 公式明記 |
| 向かないタスク(公式列挙) | (1) 「Broad-scoped, context-rich refactoring problems requiring cross-repository knowledge」、深いドメイン知識・大規模な設計一貫性が要る変更 (2) 本番クリティカルな問題・「security, personally identifiable information, authentication repercussions」に触れるタスク・インシデント対応 (3) 要件が曖昧・オープンエンドなタスク (4) 開発者自身の学習が目的の Issue | 同上 | 2026-07-06 | 公式明記 |
| 段階的運用 | いきなり PR を作らせず「research → plan → ブランチ上で反復変更 → diff を確認してから PR 化」の流れが可能(既存メモ §4 参照) | 同上 | 2026-07-06 | 公式明記 |

### 1.3 CLI の使いどころ(plan モード / delegate)

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| plan モードが向く場面 | 「Complex multi-file changes」「Refactoring with many touch points」「New feature implementation」は plan モード推奨。「Quick bug fixes」「Single file changes」は不要と明記。根拠は「Models achieve higher success rates when given a concrete plan to follow」 | https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-best-practices | 2026-07-06 | 公式明記 |
| 複雑タスクの推奨手順 | explore → plan → review → implement → verify → commit | 同上 | 2026-07-06 | 公式明記 |
| `/delegate`(CLI → cloud agent 委譲) | 「Offload work to run in the cloud」。向くのは付随的タスク・ドキュメント更新・別モジュールのリファクタリング・長時間処理など「asynchronously」に回せる仕事。GitHub へのサインインが必要 | 同上 | 2026-07-06 | 公式明記 |
| コンテキスト管理 | 無関係なタスク間では `/clear` / `/new` でセッションを分ける(「Keep sessions focused」)。`/context` でトークン使用の内訳を可視化。セッション状態は `~/.copilot/session-state/{session-id}/` | 同上 | 2026-07-06 | 公式明記 |

### 1.4 カスタマイズ機構の実践

設定ファイルの仕様(配置場所・優先順位・AGENTS.md / CLAUDE.md 互換)は既存メモ §7 参照。ここでは実践に効く差分のみ。

| 機構 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| custom instructions の機能別対応表 | 公式に対応マトリックスあり。要点: `.github/copilot-instructions.md` は全環境・全機能対応。`.instructions.md`(applyTo)は VS Code / Visual Studio / JetBrains / Eclipse / Xcode / CLI 対応で **GitHub.com 上の Chat は非対応**。personal instructions は GitHub.com Chat と JetBrains Chat のみ。organization instructions は GitHub.com(Chat・cloud agent・code review)中心。`CLAUDE.md` / `GEMINI.md` は GitHub.com / VS Code の cloud agent のみで、他環境は `AGENTS.md` のみ。Eclipse の code review は custom instructions 非対応 | https://docs.github.com/en/copilot/reference/custom-instructions-support | 2026-07-06 | 公式明記 |
| code review と custom instructions | 「When reviewing a pull request, Copilot uses the custom instructions in the base branch of the pull request」— レビュー時は **PR のベースブランチ側**の指示が使われる | https://docs.github.com/en/copilot/concepts/code-review/coding-guidelines | 2026-07-06 | 公式明記 |
| prompt files | 再利用プロンプト。`.github/prompts/NAME.prompt.md`(public preview)。Chat と同じ書式(`#file:` 参照可)で、チャットから `/NAME` で呼び出す。**対応面は VS Code / Visual Studio / JetBrains のみ** | https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files/your-first-prompt-file | 2026-07-06 | 公式明記 |
| Agent Skills | 「folders of instructions, scripts, and resources that Copilot can load when relevant」。`SKILL.md` + 補助資料の構成。配置: プロジェクト用 `.github/skills` / `.claude/skills` / `.agents/skills`、個人用 `~/.copilot/skills` / `~/.agents/skills`。対応面: cloud agent・code review・CLI・GitHub Copilot app・VS Code / JetBrains の agent モード。仕様は「open standard used across multiple AI systems」 | https://docs.github.com/en/copilot/concepts/agents/about-agent-skills / https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills | 2026-07-06 | 公式明記 |
| custom agents | cloud agent の「specialized versions」。agent profile(YAML frontmatter 付き Markdown)で定義。配置: リポジトリ `.github/agents/NAME.md`、組織は `.github` / `.github-private` リポジトリの `/agents/`、エンタープライズは指定 `.github-private` の `/agents/`。設定項目: name(任意)/ description / prompt / tools(既定は全ツール)/ `mcp-servers`。呼び出し面: agents タブ / パネル・Issue 割当・PR。対応面: GitHub.com・IDE(VS Code / JetBrains / Eclipse / Xcode)・CLI。「public preview for JetBrains IDEs, Eclipse, and Xcode」 | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents / https://docs.github.com/en/copilot/reference/custom-agents-configuration | 2026-07-06 | 公式明記(model 指定が可能かはこのページでは確認できず = 未確認) |
| Copilot Spaces の使い分け | Space には instructions(自由記述)+ ソースを添付。**リポジトリ添付は全体をロードせず検索で関連部分のみ取得**(大規模向き)、**ファイル添付は全文が毎クエリのコンテキストに載る**(常に優先させたい少数ファイル向き)。テキスト(議事録・メモ等)の直貼りも可 | https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/create-copilot-spaces | 2026-07-06 | 公式明記 |
| Copilot Memory | public preview。リポジトリレベルの事実 + 個人の嗜好を「memories」として保存。利用機能: **cloud agent・code review・CLI**。機能間で共有される(例: cloud agent が発見した DB 接続の扱いを code review が指摘に活用)。リポジトリ事実の作成は「write access を持ち Memory を有効化したユーザーの操作」起点のみ。事実は同一リポジトリの操作でしか使われない。**未使用の記憶は 28 日で自動削除** | https://docs.github.com/en/copilot/concepts/agents/copilot-memory | 2026-07-06 | 公式明記 |

## 2. コスト削減のレバー(重点)

### 2.1 AI Credits の消費の仕組み(詳細)

制度の概要(2026-06-01 発効、1 credit = $0.01)は既存メモ §11 参照。以下は実践に効く詳細。

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 計算式 | 消費トークン(入力 / 出力 / キャッシュ)× モデルごとの単価 → AI Credits に換算。「The cost of an interaction depends on two things: the model and the number of tokens consumed」 | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals | 2026-07-06 | 公式明記 |
| **モデル乗数は廃止** | 「model multipliers」は **旧 premium requests 制(legacy)の概念で、usage-based billing には適用されない**。執筆時に乗数表を載せないこと | https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/model-multipliers-for-annual-plans | 2026-07-06 | 公式明記 |
| Credits を消費する機能 | Copilot Chat・Copilot CLI・Copilot cloud agent・**Copilot Spaces**・**Spark**・**サードパーティコーディングエージェント**(既存メモの列挙に Spaces / Spark / third-party を追加確認) | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises | 2026-07-06 | 公式明記 |
| 無料(消費しない)操作 | 「Code completions and next edit suggestions are not billed in AI credits. They remain unlimited for all paid Copilot plans」 | https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing | 2026-07-06 | 公式明記 |
| キャッシュトークンの単価 | キャッシュ済みトークンは「10% of the normal input price」。キャッシュが無効化される操作: セッション途中のモデル切替、非アクティブセッションへの復帰(OpenAI 系 24 時間 / その他 1 時間)、reasoning level やツール構成の途中変更 | https://docs.github.com/en/copilot/tutorials/optimize-ai-usage | 2026-07-06 | 公式明記 |
| 消費が増える要因 | 会話の長さ、エージェント機能(「can involve multiple model calls within a single task」)、モデル選択 | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals | 2026-07-06 | 公式明記 |

### 2.2 モデル選択と Credits 差

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| モデルの 3 階層 | 公式は Lightweight(例: GPT-5 mini / GPT-5.4 nano・mini / Gemini 3 Flash 系 / Claude Haiku 4.5)、Versatile(GPT-5.4 / Claude Sonnet 系 / Kimi K2.7 Code)、Powerful(GPT-5.3-Codex / GPT-5.5 / Claude Opus 系 / Gemini Pro 系)に区分 | https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing | 2026-07-06 | 公式明記(**モデル名・単価は変動が激しい。docs 本文には転記せず参照先 URL を正とする**) |
| 単価差の規模感(調査時点の記録) | 最安例 GPT-5.4 nano: $0.20 / $0.02(cached)/ $1.25(1M トークンあたり入力 / キャッシュ / 出力)。最高例 Claude Opus 4.8(fast): $10.00 / $1.00 / $50.00。**両端で約 40〜50 倍の差** | 同上 | 2026-07-06 | 公式明記(数値は執筆直前に再確認必須) |
| auto model selection の割引 | 有料プランでは「a 10% discount on model costs while using auto model selection in Copilot Chat, Copilot CLI, or Copilot cloud agent」 | https://docs.github.com/en/copilot/tutorials/optimize-ai-usage | 2026-07-06 | 公式明記 |
| Free プランのモデル制約 | Copilot Free / Student は「access to models through auto model selection only」(手動のモデル選択不可) | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals | 2026-07-06 | 公式明記 |
| タスク別モデル選択の公式指針 | Reasoning 系 =「architecture decisions, complex debugging, system design」向け。中位 =「the plan is already clear and the agent needs to execute efficiently」。軽量 =「refactoring, formatting, documentation updates, and other routine, well-scoped changes」向け | https://docs.github.com/en/copilot/tutorials/optimize-ai-usage | 2026-07-06 | 公式明記 |

### 2.3 Credits の付与構造(base + flex)とプール

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 個人プランの付与(調査時点) | Pro: base 1,000 + flex 500 = 1,500 / 月。Pro+: 3,900 + 3,100 = 7,000。Max: 10,000 + 10,000 = 20,000。base を先に消費し、超えたら flex が自動適用 | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals | 2026-07-06 | 公式明記(数値は変動注意) |
| flex allotment の位置づけ | 「designed to adapt as the economics of AI evolve, including model pricing, new models, and improvements in efficiency」— 将来調整されうる可変枠 | 同上 | 2026-07-06 | 公式明記 |
| Business / Enterprise の付与(調査時点) | Business: 1,900 credits / ユーザー / 月、Enterprise: 3,900(**2026 年 6〜9 月のプロモーション期間中はそれぞれ 3,000 / 7,000**) | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises | 2026-07-06 | 公式明記(数値・期間は変動注意) |
| プール制 | 組織 / エンタープライズでは Credits は「pooled at the billing entity level」— 例: Business 100 シートなら 190,000 credits を全員で共有(個人別割当ではない) | 同上 | 2026-07-06 | 公式明記 |
| 繰越なし・リセット | 「Included AI credits do not carry over between months. Unused credits are forfeited」。毎月 1 日 00:00:00 UTC にリセット | 同上 / individuals ページ | 2026-07-06 | 公式明記 |

### 2.4 cloud agent / code review と IDE の消費の違い

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| cloud agent の二重消費 | cloud agent セッションは「uses GitHub Actions minutes **and** GitHub AI Credits」— AI Credits に加えて **GitHub Actions 分**も消費する(Actions 分はアカウントの無料枠を他のワークフローと共有) | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automations / https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing | 2026-07-06 | 公式明記 |
| code review の二重消費 | code review も「token consumption is billed in AI credits, and the agentic infrastructure that powers the review consumes GitHub Actions minutes」 | https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing(enterprise-cloud 版で確認) | 2026-07-06 | 公式明記 |
| IDE の agent モード | Chat の一形態として AI Credits を消費(トークンベース)。Actions 分の消費は公式記述になし(IDE 内実行のため発生しないと解される) | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals | 2026-07-06 | 公式から推測(Actions 分について) |
| コスト規模の目安(公式の表現) | 「a quick chat question using a lightweight model might cost a fraction of a credit, while a long coding agent session using a frontier model across multiple files will cost more」— cloud agent の長時間セッション × 高級モデルが最も高くつく | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises | 2026-07-06 | 公式明記 |
| code review の課金帰属 | 自動レビューの消費は PR 作成者に帰属(既存メモ §11 参照) | — | — | 既存メモ参照 |

### 2.5 消費を減らす具体策(公式チュートリアル「Optimizing your AI usage」)

出典はすべて https://docs.github.com/en/copilot/tutorials/optimize-ai-usage(確認日 2026-07-06、公式明記)。

- モデルの使い分け: 「Always plan with a strong reasoning model, then implement the work with a cheaper model」— **計画は強いモデル、実装は安いモデル**。フェーズ間でセッションを分ける
- reasoning level: 「Use the regular level by default and raise it only for harder tasks」(上げるとトークン消費増)
- サブエージェント: 「their context is scoped to a single focused task, a lighter model is often sufficient」— サブエージェントには軽量モデルを割当
- コンテキスト衛生: タスク切替時に `/new` / `/clear`、CLI では `/compact` で履歴要約してコンテキスト縮小
- custom instructions の整備自体がコスト削減策: 構造の説明を指示ファイルに書いておけば、エージェントの探索的なファイル読み(入力トークン)を減らせる
- ツールセット: 「only the toolsets relevant to the task」だけ有効化(ツール定義もトークンを消費)
- キャッシュ温存: モデル・reasoning level・ツール構成をセッション途中で変えない(§2.1 の無効化条件)
- ガードレール: ユニットテスト・linter・セキュリティスキャンでフィードバックループを作り、エラーの複利化と再試行サイクルを減らす
- セッション上限: セッション単位の Credits 上限(session limit)を設定し「avoid unexpected costs」(CLI ベストプラクティスにも同旨)

### 2.6 予算制御(budgets)

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 4 階層の予算 | (1) user-level budget(ULB)(2) cost center budget (3) organization budget (4) enterprise budget。ULB は「プール消費 + 従量」の全期間有効、他 3 つは**プール枯渇後の従量フェーズのみ**有効 | https://docs.github.com/en/copilot/concepts/billing/budgets-for-usage-based-billing | 2026-07-06 | 公式明記 |
| ULB の 3 種と優先順位 | universal ULB(全ライセンスユーザー既定)< cost center ULB < individual ULB(個人指定が最優先で他を上書き) | 同上 | 2026-07-06 | 公式明記 |
| ULB は常にハードストップ | 「ULBs always enforce a hard stop; there is no option to allow usage to continue beyond the limit」。$0 予算は即ブロック | 同上 | 2026-07-06 | 公式明記 |
| 他の予算の超過時挙動 | 「Stop usage when budget limit is reached」有効時のみブロック。無効なら「charges continue to accrue without a cap」 | 同上 | 2026-07-06 | 公式明記 |
| 複数予算の競合 | 「whichever budget has the least capacity remaining blocks the user first」— 残枠が最少の予算が先に効く | 同上 | 2026-07-06 | 公式明記 |
| 設定権限 | organization budget は組織オーナーが設定できる唯一の予算。他はエンタープライズ管理者が管理 | 同上 | 2026-07-06 | 公式明記 |
| 個人の超過時の選択肢 | (1) プランのアップグレード(差額のみ)(2) 追加利用の予算設定(1 credit = $0.01。「additional usage may be capped」)(3) 月次リセットを待つ | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals | 2026-07-06 | 公式明記 |
| 組織の超過時ポリシー | 「Allow additional usage」(公表単価で従量課金)か「Block additional usage」(翌サイクルまで停止)の二択 | https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises | 2026-07-06 | 公式明記 |

### 2.7 使用量の確認方法

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| AI usage ダッシュボード | GitHub の Settings > Billing 配下の「AI usage」ページで機能別・モデル別の消費を確認できる | https://docs.github.com/en/copilot/tutorials/optimize-ai-usage | 2026-07-06 | 公式明記 |
| CSV エクスポート | 使用量レポート(CSV)をダウンロード可能。公式は「The AI usage dashboard and the usage export CSV are the best tools for sizing budgets」と、**予算サイズ決定の一次資料**に位置づけ | https://docs.github.com/en/copilot/tutorials/budgets/getting-started-with-budget-controls | 2026-07-06 | 公式明記(CSV の列仕様は未確認) |
| REST API(課金系) | enhanced billing platform の usage API に **AI credit usage レポート取得エンドポイント**あり(組織向け / ユーザー向け。ユーザー向けは過去 24 か月分) | https://docs.github.com/en/rest/billing/usage | 2026-07-06 | 公式明記 |
| REST API(利用動向系) | Copilot usage metrics API(日次集計レポートを署名付き URL で取得。機能別利用・アクティブユーザー等)。「recommended for new integrations」。課金額ではなく**採用状況**の把握用 | https://docs.github.com/en/rest/copilot/copilot-usage-metrics / https://docs.github.com/en/copilot/concepts/copilot-usage-metrics/copilot-metrics | 2026-07-06 | 公式明記 |
| 使い分け | コスト管理 = billing usage API / AI usage ページ、導入効果測定 = usage metrics ダッシュボード / API、という 2 系統 | 上記各ページ | 2026-07-06 | 公式から推測(整理は執筆者による) |

## 3. 公式ベストプラクティス

### 3.1 プロンプトエンジニアリング(Chat 全般)

出典: https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering(確認日 2026-07-06、公式明記)

- 構成: まず「a broad description of the goal or scenario」を与え、その後に具体的要件を列挙する
- 複雑なタスクは分割する(例: ワードサーチパズル生成を一括で頼まず、小タスクに分けて順に依頼)
- 要件は具体的に。入力データ・期待する出力・実装の**例**を与える
- 曖昧語を避ける(「what does this do」の "this" が何を指すか一意でない質問をしない)
- コンテキストの明示: 対象ファイルを開く / コードを選択する。VS Code は `@workspace`、JetBrains は `@project` で手動指定
- 望む結果が出なければプロンプトを言い換えて反復。前回の応答を参照して修正依頼する

### 3.2 Copilot 全体のベストプラクティス

出典: https://docs.github.com/en/copilot/get-started/best-practices(確認日 2026-07-06、公式明記)

- 得意領域(公式列挙): 「Writing tests and repetitive code」「Debugging and correcting syntax」「Explaining and commenting code」「Generating regular expressions」
- 使うべきでない場面: コーディング・技術と無関係な用途、自身の専門性の代替(「you are in charge, and Copilot is a powerful tool at your service」)
- 出力の検証: 「Understand suggested code before you implement it」、機能性・セキュリティ・可読性・保守性の観点でレビュー、「Use automated tests and tooling to check Copilot's work」
- 改善ループ: 提案の採否・評価アイコンでフィードバックを返す

### 3.3 cloud agent へのタスクの渡し方

出典: https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results(確認日 2026-07-06、公式明記)

- 良いタスク定義の 3 要素: (1) 「A clear description of the problem to be solved or the work required」(2) 「Complete acceptance criteria on what a good solution looks like」(例: ユニットテストの要否)(3) 「Directions about which files need to be changed」。ただしセマンティックコード検索があるため厳密なファイルパス指定は必須ではない
- PR への修正依頼はコメントで `@copilot` にメンション。**「Start a review」でコメントをまとめて送る**(1 件ずつ「Add single comment」で送ると個別対応になり非効率)
- Copilot への反応をトリガーできるのは write 権限保持者のみ
- `copilot-setup-steps.yml` で依存関係を事前インストールし「so it can hit the ground running」(エージェントの環境構築試行 = 無駄な消費を削減)
- 向く / 向かないタスクは §1.2、コスト面の含意は §2.5 参照

### 3.4 CLI のベストプラクティス

出典: https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-best-practices(確認日 2026-07-06、公式明記)

- 指示ファイルは簡潔に: 「Keep instructions concise and actionable. Lengthy instructions can dilute effectiveness」。リポジトリ指示はグローバル指示より常に優先
- 承認管理: `--allow-tool='shell(git:*)'` / `--deny-tool='shell(git push)'` の粒度指定、`/reset-allowed-tools` でリセット
- 安全原則: 「Review all proposed changes before accepting」「never commit secrets」
- モデル切替: 「Switch models mid-session with `/model` as task complexity changes」(※ただし §2.1 のとおりモデル切替はキャッシュを無効化するため、コスト観点ではセッション分割が望ましい — この緊張関係は執筆時に明記する価値あり)
- セッション単位の Credits 上限設定でコスト暴走を防止

## 4. 自動化

### 4.1 Issue 割当 → cloud agent の運用

起動経路の一覧(Issue 割当・`@copilot`・agents panel・外部連携)は既存メモ §6 参照。実践差分:

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| API 経由の Issue 割当 | REST / GraphQL で Issue を Copilot に割当可能(GraphQL: `createIssue` / `addAssigneesToAssignable` 等)。割当時パラメータで `target_repo`・`base_branch`・`custom_instructions`・**`custom_agent`**・`model` を指定できる(public preview) | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api | 2026-07-06 | 公式明記 |
| タスク分割指針 | 「向くタスク」(§1.2)+ タスク定義 3 要素(§3.3)が公式の分割基準。大きな作業は well-scoped な Issue 単位に割ってから割り当てる | §1.2 / §3.3 の出典 | 2026-07-06 | 公式明記 |
| custom agents との組合せ | custom agent は agents タブ / パネル・Issue 割当・PR から選択して起動できる(§1.4)。API の `custom_agent` パラメータでも指定可 | §1.4 / 上記 API ページ | 2026-07-06 | 公式明記 |

### 4.2 Copilot automations(スケジュール / イベント起動)

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 概要 | 「Automations let you run Copilot cloud agent automatically, on a schedule or in response to events in a repository」。リポジトリの **Agents タブ > Automations** または GitHub Copilot app から作成 | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automations / https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/create-automations | 2026-07-06 | 公式明記 |
| トリガー | スケジュール(hourly / daily / weekly)、Issue 作成時、PR オープン時、PR 同期(synchronize)時。イベント系は検索クエリ・変更ファイル条件でフィルター可 | 同上 | 2026-07-06 | 公式明記 |
| 課金帰属 | 「This usage is billed to the user who created the automation」— **自動化の作成者**の Actions 分 + AI Credits を消費 | 同上 | 2026-07-06 | 公式明記 |
| 権限とインジェクション対策 | write 権限者なら作成可。**既定で write 権限のないユーザー起因のイベントは無視**(prompt injection 対策と明記) | 同上 | 2026-07-06 | 公式明記 |
| 制約 | リポジトリは **private または internal のみ**(public 不可)。cloud agent の有効化が前提。対応プラン: Pro / Pro+ / Max / Business / Enterprise。automation は作成者にのみ表示(結果のセッション・PR は他者にも見える) | 同上 | 2026-07-06 | 公式明記 |

### 4.3 code review の自動化

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 個人設定 | 自分の PR への自動レビューを個人設定で有効化(**Pro / Pro+ / Max プランのみ**の記載) | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/configure-automatic-review | 2026-07-06 | 公式明記 |
| リポジトリ / 組織単位 | **branch ruleset** の「Automatically request Copilot code review」で設定。組織レベルでは対象リポジトリをパターンで包含 / 除外可 | 同上 | 2026-07-06 | 公式明記 |
| オプション | 「Review new pushes」(未選択なら初回のみレビュー)、「Review draft pull requests」(人間のレビュー前に早期発見する用途と説明) | 同上 | 2026-07-06 | 公式明記 |
| レビュー強度(effort level) | Low(「Standard review (default)」)/ Medium(「Deeper analysis of complex logic, security-sensitive code, and cross-service changes」)。**Medium は Actions 分と AI Credits の消費が増える**と明記。High の記載はこのページにはなし | 同上 | 2026-07-06 | 公式明記(High の有無は未確認) |
| レビューガイドライン | 現行 docs では **custom instructions がレビュー基準カスタマイズの正**(ベースブランチの指示を使用。§1.4)。組織レベルの custom instructions も code review に適用可。旧「coding guidelines」機能(Enterprise 向け・リポジトリ設定で作成)が現行制度でどう扱われているかは今回の取得内容からは確定できず | https://docs.github.com/en/copilot/concepts/code-review/coding-guidelines / https://docs.github.com/en/copilot/tutorials/use-custom-instructions | 2026-07-06 | 一部未確認(coding guidelines の現行位置づけ) |

### 4.4 Agentic Workflows(現行仕様)

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 概要・状態 | 「AI-powered repository automations that you define in markdown and run as GitHub Actions workflows」。**public preview** | https://docs.github.com/en/copilot/concepts/agents/about-github-agentic-workflows | 2026-07-06 | 公式明記 |
| 定義形式 | Markdown ファイル。YAML frontmatter(トリガー・権限・許可する書き込み操作)+ 本文は自然言語指示。例として `on: daily` | 同上 | 2026-07-06 | 公式明記 |
| エンジン | frontmatter の `engine` で選択: 「GitHub Copilot (requires a GitHub Copilot plan), Anthropic Claude, OpenAI Codex, Google Gemini」 | 同上 | 2026-07-06 | 公式明記 |
| 安全モデル | 「Read-only by default」。書き込み(Issue 作成・コメント・PR)は frontmatter で宣言した「validated `safe-outputs`」経由のみ。「Secrets stay outside the agent runtime」、出力のスキャン(threat detection)、「Firewalled execution」 | 同上 | 2026-07-06 | 公式明記 |
| 課金 | Actions 分 + AI エンジンの推論(AI Credits)。**既定で 1 run あたり 1,000 AI Credits の上限** | 同上 | 2026-07-06 | 公式明記 |
| 用途例 | Issue トリアージ・ラベリング、CI 失敗調査、ステータスレポート、ドキュメント更新、テストカバレッジ改善 | 同上 | 2026-07-06 | 公式明記 |
| automations との違い | automations は「cloud agent を定型プロンプトで起動する」軽量機能(UI 完結・トリガー 4 種)、Agentic Workflows は「Actions ワークフローとしてエンジン選択・safe-outputs 制御まで書ける」上級機能、という関係 | §4.2 / 本節の出典 | 2026-07-06 | 公式から推測(整理は執筆者による) |

### 4.5 REST API からのタスク起動

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| エンドポイント | 作成 `POST /agents/repos/{owner}/{repo}/tasks`、一覧 `GET /agents/repos/{owner}/{repo}/tasks` / `GET /agents/tasks`、状態取得 `GET /agents/repos/{owner}/{repo}/tasks/{task-id}`。**public preview** | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api / https://docs.github.com/en/rest/agent-tasks/agent-tasks | 2026-07-06 | 公式明記 |
| パラメータ | 必須 `prompt`、任意 `base_ref` / `model` / `create_pull_request` | 同上 | 2026-07-06 | 公式明記 |
| 認証 | **user-to-server トークンのみ**(PAT / OAuth app / GitHub App の user-to-server)。「Server-to-server tokens ... are not supported」。fine-grained PAT は metadata:read + actions / contents / issues / pull requests の read-write。classic は `repo` スコープ | 同上 | 2026-07-06 | 公式明記 |
| 対象プラン | 「only available to users with a Copilot Business or Copilot Enterprise subscription」(タスク作成エンドポイント) | https://docs.github.com/en/rest/agent-tasks/agent-tasks | 2026-07-06 | 公式明記 |
| タスク状態 | queued / in_progress / completed / failed / idle / waiting_for_user / timed_out / cancelled | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api | 2026-07-06 | 公式明記 |
| 完了通知 | Webhook の有無・ポーリング以外の完了検知手段は今回の取得内容では確認できず | — | 2026-07-06 | 未確認 |

### 4.6 CLI の GitHub Actions 内自動化

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 非対話実行 | `copilot -p PROMPT [OPTIONS]`。ツール許可は `--allow-tool`(例: `--allow-tool='shell(git:*)'`、`--allow-tool='write'`)、`--no-ask-user` で対話プロンプト抑止 | https://docs.github.com/en/copilot/how-tos/copilot-cli/automate-copilot-cli/automate-with-actions | 2026-07-06 | 公式明記 |
| 認証 | 組織所有リポジトリでは `GITHUB_TOKEN` 利用が推奨(「No PAT or stored secrets required」)。個人のシートに課金させたい場合は「Copilot Requests」権限付き PAT を `COPILOT_GITHUB_TOKEN` として渡す | 同上 | 2026-07-06 | 公式明記 |
| 公式サンプル | cron スケジュール(`30 17 * * *`)+ `workflow_dispatch` で日次のコード変更サマリーを生成するワークフロー | 同上 | 2026-07-06 | 公式明記 |
| 位置づけ | 多くのケースでは「GitHub Agentic Workflows」の方が推奨(「include additional guardrails suited for automated environments」) | 同上 | 2026-07-06 | 公式明記 |

## 補足: 執筆時の注意・未確認事項(TODO 候補)

- モデル名・単価・Credits 付与量・プロモーション期間は変動が激しい。**docs 本文には具体値を転記せず**、https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing と https://github.com/features/copilot/plans を参照先として示す(既存メモ §11 と同方針)
- 「モデル乗数(multiplier)」は legacy 制度の用語。2026-06-01 以降の記事で乗数表を載せると誤りになる点を執筆時に明記する
- 未確認: AI usage エクスポート CSV の列仕様 / code review effort level に High があるか / 旧 coding guidelines 機能の現行位置づけ / custom agents での model 指定可否 / cloud agent タスク完了の Webhook 通知 / automations の実行回数上限
- CLI ベストプラクティスの「/model で途中切替」推奨と、コスト最適化ページの「途中のモデル切替はキャッシュを無効化」は緊張関係にある。実践ガイドでは「タスクが変わるならセッションを分けて切替」と統合して書くのが安全(公式から推測)
- 本メモの引用は WebFetch による要約経由のため、執筆時に重要数値(単価・付与量・上限)は該当ページを直接再確認すること
