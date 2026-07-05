# GitHub Copilot 調査メモ(C-R4)

- **対象**: GitHub Copilot(コード補完 / Copilot Chat / エージェントモード / Copilot cloud agent(旧称 Copilot coding agent)/ Copilot code review / Copilot CLI ほか)
- **調査日**: 2026-07-05
- **調査方法**: [CODING-AGENTS-PLAN.md](../../CODING-AGENTS-PLAN.md) §7 のチェックリスト 12 項目。公式ドキュメント(docs.github.com)・GitHub 公式ブログ / Changelog・公式料金ページのみを根拠とし、第三者記事は根拠にしていない
- **確度の凡例**: 公式明記 / 公式から推測 / 第三者(本メモでは「第三者」を根拠とした事実は記載しない)

## 2026 年上半期の重要な名称・制度変更(執筆時の最重要注意)

執筆時に旧称・旧制度と混同しやすい変更が 3 件ある。

| 変更 | 内容 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 名称変更 | **「Copilot coding agent」は「Copilot cloud agent」に改称**された(2026-04 頃)。Changelog に「following the Copilot coding agent to Copilot cloud agent rename」と明記。docs の URL パスにも旧 `coding-agent` と新 `cloud-agent` が混在 | https://github.blog/changelog/2026-04-23-copilot-cloud-agent-fields-added-to-usage-metrics/ / https://github.blog/changelog/2026-04-01-research-plan-and-code-with-copilot-cloud-agent/ | 2026-07-05 | 公式明記 |
| 課金制度変更 | **「premium requests(プレミアムリクエスト)」制は 2026-06-01 に「GitHub AI Credits」制に置き換え**。1 credit = $0.01 USD。消費はトークン量(入力・出力・キャッシュ)×各モデルの公表 API レートで計算。premium requests は docs 上「legacy」扱い | https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/ / https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/copilot-requests | 2026-07-05 | 公式明記 |
| 学習利用ポリシー変更 | **2026-04-24 から Copilot Free / Pro / Pro+ の対話データが既定でモデル学習に利用される(オプトアウト方式)**。Business / Enterprise は対象外(契約で学習利用を禁止) | https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/ | 2026-07-05 | 公式明記 |

## 1. 実行環境

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 補完・Chat・エージェントモード | 開発者のローカル IDE 内で動作(モデル推論はクラウド側)。実行場所は IDE のプロセス | https://docs.github.com/en/copilot/get-started/features | 2026-07-05 | 公式から推測(明示的な実行場所の記述は薄い) |
| Copilot cloud agent の実行場所 | 「Copilot cloud agent has access to its own ephemeral development environment, powered by GitHub Actions」— **GitHub Actions 上のエフェメラル(使い捨て)開発環境**で実行。コード探索・変更・テスト / リンター実行が可能 | https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | 2026-07-05 | 公式明記 |
| cloud agent の制約 | 1 セッション最大 **59 分**(「hard limit that cannot be extended or bypassed」)。1 タスク = 1 リポジトリ・1 ブランチ / PR | 同上 | 2026-07-05 | 公式明記 |
| Copilot CLI の対応 OS | Linux / macOS / Windows(PowerShell および WSL) | https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli | 2026-07-05 | 公式明記 |
| サンドボックス(public preview) | 2026-06-02 発表。**ローカルサンドボックス**(CLI で `/sandbox enable`。Microsoft MXC 技術で macOS / Linux / Windows 共通の隔離)と**クラウドサンドボックス**(`copilot --cloud`。GitHub ホストの完全隔離・エフェメラルな Linux 環境)。クラウド側は既存の cloud agent ポリシーを自動適用 | https://github.blog/changelog/2026-06-02-cloud-and-local-sandboxes-for-github-copilot-now-in-public-preview/ | 2026-07-05 | 公式明記 |

## 2. 対応 IDE / CLI

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| コード補完の対応環境 | VS Code / Visual Studio / JetBrains IDEs / Azure Data Studio / Xcode / Vim・Neovim / Eclipse | https://docs.github.com/en/copilot/concepts/completions/code-suggestions / https://docs.github.com/en/copilot/reference/copilot-feature-matrix | 2026-07-05 | 公式明記 |
| Next edit suggestions | VS Code・Visual Studio は GA、JetBrains / Xcode / Eclipse は preview。Neovim 非対応 | https://docs.github.com/en/copilot/reference/copilot-feature-matrix | 2026-07-05 | 公式明記 |
| Copilot Chat / エージェントモード / MCP | VS Code / Visual Studio / JetBrains / Eclipse / Xcode で利用可。Neovim 非対応。Edit モードは VS Code / JetBrains のみ | 同上 | 2026-07-05 | 公式明記 |
| IDE 以外の面 | GitHub.com(Web)・GitHub Mobile・Windows Terminal(Terminal Chat)・GitHub Desktop(コミットメッセージ生成)・Copilot CLI(ターミナル)。さらに **GitHub Copilot App**(エージェント駆動開発用のデスクトップアプリ)が登場 | https://docs.github.com/en/copilot/get-started/features / https://docs.github.com/en/copilot/concepts/agents | 2026-07-05 | 公式明記 |
| 形態の整理 | 専用 IDE は持たない。「既存 IDE への拡張 + GitHub プラットフォーム(Web / Actions)+ CLI + デスクトップアプリ」の多面構成 | 上記各ページ | 2026-07-05 | 公式から推測(整理は執筆者による) |

## 3. リポジトリ理解

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 自動インデックス | Copilot Chat でリポジトリを文脈にした会話を始めると**自動でインデックスされる**(GitHub.com と VS Code)。初回は大規模リポジトリで最大 60 秒程度、以後は差分更新。インデックス可能なリポジトリ数に上限なし。設定不要 | https://docs.github.com/en/copilot/concepts/context/repository-indexing | 2026-07-05 | 公式明記 |
| セマンティック検索 | Copilot cloud agent は「semantic code search to find relevant code based on meaning, rather than relying solely on exact text matches with tools like grep」— **grep 系のオンデマンド検索とセマンティック検索の併用** | 同上 | 2026-07-05 | 公式明記 |
| インデックスと学習 | 「Copilot will not use your indexed repository for model training」 | 同上 | 2026-07-05 | 公式明記 |
| 補助的なコンテキスト機構 | Copilot Spaces(コンテキストの束ね)、Copilot Memory(public preview。リポジトリ情報を記憶し agent / code review を改善)、knowledge base 系 | https://docs.github.com/en/copilot/get-started/features / https://docs.github.com/en/copilot/concepts/context/spaces | 2026-07-05 | 公式明記 |
| モノレポ・大規模での制約 | 大規模リポジトリ固有の制約値(ファイル数上限等)は今回の調査範囲では確認できず | — | 2026-07-05 | 未確認 |

## 4. ファイル編集

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| IDE エージェントモード | 変更ファイルをインライン diff で確認し、編集単位で **Keep / Undo** を選択できる。VS Code は**チェックポイント**(会話の要所でファイルのスナップショットを自動作成し巻き戻し可能) | https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode | 2026-07-05 | 公式明記(VS Code 公式ドキュメント) |
| cloud agent の編集 | ブランチ作成・コミット・push まで自動化。PR 作成前に反復(iterate)することも即時 PR 作成も可能。2026-04 の更新で「Copilot can work on a branch without creating one(PR を作らずブランチ上で作業)」が可能に | https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent / https://github.blog/changelog/2026-04-01-research-plan-and-code-with-copilot-cloud-agent/ | 2026-07-05 | 公式明記 |
| cloud agent のロールバック | 変更は `copilot/` ブランチ + PR に閉じるため、PR の却下・ブランチ削除が実質のロールバック手段 | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations | 2026-07-05 | 公式から推測 |
| CLI の編集 | ファイル変更・コマンド実行の前に承認を求める(後述 §8) | https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli | 2026-07-05 | 公式明記 |

## 5. コマンド実行

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| IDE エージェントモード | ツール実行・端末コマンドは承認フローを経る(VS Code は「Approvals & Permissions」として体系化。自動承認設定あり) | https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode | 2026-07-05 | 公式明記(詳細な自動承認の粒度は追加確認推奨) |
| cloud agent | Actions 環境内で「execute automated tests and linters and more」。ただし **Copilot の push では GitHub Actions ワークフローは既定で起動せず**、write 権限者が「Approve and run workflows」を押すまで実行されない(自動実行への変更も可能) | https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent / https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations | 2026-07-05 | 公式明記 |
| Copilot CLI | シェル / Git / GitHub CLI 操作を実行可。既定の ask/execute モードに加え、**plan モード**(Shift+Tab。コードを書く前に計画を提示)。単発実行は `-p` / `--prompt` | https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli | 2026-07-05 | 公式明記 |
| バックグラウンド実行 | cloud agent 自体が非同期(バックグラウンド)実行の形態。IDE 内での長時間バックグラウンドタスクの仕様は未確認 | — | 2026-07-05 | 公式から推測 / 一部未確認 |

## 6. MCP・外部ツール連携

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| MCP クライアント対応面 | IDE(VS Code / Visual Studio / JetBrains / Xcode / Eclipse)でローカル・リモート MCP サーバーに対応。**Copilot CLI** はローカル + リモート対応で GitHub MCP server を内蔵。**GitHub.com 上の設定は Copilot cloud agent と Copilot code review の両方に適用**。GitHub Copilot App もアプリレベルの MCP 設定に対応 | https://docs.github.com/en/copilot/concepts/context/mcp | 2026-07-05 | 公式明記 |
| 認証 | リモート MCP サーバーは OAuth または PAT で認証 | 同上 | 2026-07-05 | 公式明記 |
| トランスポート種別 | docs は「local / remote」の区分で記述。stdio / Streamable HTTP / SSE という仕様名での明記は確認できず | 同上 | 2026-07-05 | 未確認(表現レベル) |
| cloud agent の既定 MCP | **GitHub MCP server と Playwright MCP server が既定で有効** | https://docs.github.com/en/copilot/concepts/agents/coding-agent/mcp-and-coding-agent / https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | 2026-07-05 | 公式明記 |
| MCP レジストリ | GitHub MCP Registry(パートナー・コミュニティの MCP サーバーのキュレーション一覧)が public preview | https://docs.github.com/en/copilot/concepts/context/mcp | 2026-07-05 | 公式明記 |
| 組織ポリシー | 「MCP servers in Copilot」ポリシーで組織 / エンタープライズが制御(Business / Enterprise のシート保有者にのみ適用。Free / Pro 個人には適用されない)。なお同ポリシーは Cursor / Windsurf 等サードパーティアプリからの GitHub MCP server 利用は制御しない | https://docs.github.com/en/copilot/concepts/context/mcp / https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies | 2026-07-05 | 公式明記 |
| 外部トリガー連携 | cloud agent は Issue 割当・agents panel・PR 上の `@copilot` メンション・Copilot Chat・**Azure Boards / JIRA / Linear / Slack / Teams**・スケジュール / イベント起動の自動化から起動可能。**REST API からのタスク開始**にも対応(2026-05-13) | https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent / https://github.blog/changelog/2026-05-13-start-copilot-cloud-agent-tasks-via-the-rest-api/ | 2026-07-05 | 公式明記 |
| サードパーティエージェント | GitHub 上で**サードパーティのコーディングエージェント(Anthropic Claude・OpenAI Codex)を有効化**できる(public preview)。「Coding agents have access to the same repositories that Copilot cloud agent has been enabled in」。パートナー製「Agent Apps」も存在 | https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies / https://docs.github.com/en/copilot/get-started/features | 2026-07-05 | 公式明記 |
| CI 連携 | 「Agentic workflows」(自然言語指示で GitHub Actions 上の反復作業を自動化)が機能一覧に掲載 | https://docs.github.com/en/copilot/concepts/agents | 2026-07-05 | 公式明記(詳細未調査) |

## 7. 設定ファイル

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| リポジトリ全体の指示 | `.github/copilot-instructions.md`。「apply to all requests made in the context of a repository」。**Copilot Chat・cloud agent・code review が対象** | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions | 2026-07-05 | 公式明記 |
| パス別の指示 | `.github/instructions/NAME.instructions.md`。frontmatter の `applyTo`(glob)で適用対象を指定、`excludeAgent` で対象機能を絞る。cloud agent と code review が対象 | 同上 | 2026-07-05 | 公式明記 |
| AGENTS.md 対応 | **`AGENTS.md` に対応**。リポジトリ内の任意の場所に置け、作業ファイルに最も近いものが優先(cloud agent)。**Copilot CLI も対応**: ルートの `AGENTS.md` を「primary instructions」として扱い、`AGENTS.md` と `.github/copilot-instructions.md` が両方あれば両方使う。`COPILOT_CUSTOM_INSTRUCTIONS_DIRS` 環境変数で探索ディレクトリ追加可 | 同上 / https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions | 2026-07-05 | 公式明記 |
| 他ツールのルールファイル互換 | **`CLAUDE.md` / `GEMINI.md`(リポジトリルートのみ)も cloud agent が読む** | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions | 2026-07-05 | 公式明記 |
| 階層と優先順位 | 「Personal instructions take the highest priority. Repository instructions come next, and then organization instructions are prioritized last」— **個人 > リポジトリ > 組織** | 同上 | 2026-07-05 | 公式明記 |
| CLI のユーザー設定 | `~/.copilot/` に設定・セッション履歴・ログを保存。`$HOME/.copilot/copilot-instructions.md` で個人指示、`.agent.md` ファイルでカスタムエージェント定義 | https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference | 2026-07-05 | 公式明記 |
| その他のカスタマイズ機構 | Prompt files(再利用可能プロンプトの Markdown)、Agent Skills(タスク特化の指示フォルダー)、Custom agents(cloud agent のカスタム版)、Copilot Spaces、Copilot Memory(public preview) | https://docs.github.com/en/copilot/get-started/features | 2026-07-05 | 公式明記 |

## 8. 権限管理

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| CLI の承認モデル | ファイル変更・コマンド実行系ツールは実行前に承認を要求。承認の粒度は「1 回のみ / セッション中許可 / 拒否して方針転換」。`--allow-tool` / `--deny-tool` フラグで事前許可・拒否リスト指定が可能 | https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli | 2026-07-05 | 公式明記 |
| IDE エージェントモード | 編集は Keep / Undo、ツール・コマンドは承認制。チェックポイントで巻き戻し(§4・§5 参照) | https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode | 2026-07-05 | 公式明記 |
| cloud agent の権限境界 | push 先は自分用の **`copilot/` ブランチのみ**。**依頼者は Copilot が作った PR を自分で承認できない**(Required approvals の統制を維持)。ブランチ保護・ルールセットは Copilot にも適用(commit author 制限ルールがあると PR 作成が阻害されるため、必要なら Copilot を bypass actor に追加) | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations / https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | 2026-07-05 | 公式明記 |
| ワークフロー実行の既定 | Copilot のコードがレビューされ「Approve and run workflows」が押されるまで Actions ワークフローは起動しない(既定)。自動実行への変更は設定で可能 | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations | 2026-07-05 | 公式明記 |

## 9. セキュリティ

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| cloud agent のネットワーク制御 | 情報漏えい(事故・悪意ある入力起因)対策として **GitHub が cloud agent のインターネットアクセスをファイアウォールで制限**。組織設定「Enable firewall」は Enabled / Disabled / Let repositories decide の 3 択。カスタマイズ・無効化の専用ページあり | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations / https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-firewall | 2026-07-05 | 公式明記 |
| 生成コードの自動スキャン | cloud agent は生成コードを **CodeQL(脆弱性)・secret scanning(秘密情報混入)・依存関係分析(既知脆弱性)**で自動チェック | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations | 2026-07-05 | 公式明記 |
| コンテンツ除外(content exclusion) | Business / Enterprise の機能。リポジトリ管理者・組織オーナーが除外パスを設定。補完(主要 IDE)と Chat(VS Code / Visual Studio / JetBrains / GitHub.com / Mobile)は尊重。**注意: Edit・Agent モードは現状未対応、cloud agent は「doesn't account for content exclusions(除外ファイルも見えて更新できる)」** | https://docs.github.com/en/copilot/concepts/context/content-exclusion / https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | 2026-07-05 | 公式明記 |
| 学習利用の既定(個人プラン) | **2026-04-24 以降、Free / Pro / Pro+ の対話データ(入力・受け入れ / 修正した出力・コード片・コンテキスト等)は既定でモデル学習に利用**。オプトアウトは Copilot settings の Privacy 配下。過去に product improvements をオプトアウト済みなら設定は引き継がれる。Issue / Discussion / プライベートリポジトリの保存データ(at rest)は対象外 | https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/ / https://docs.github.com/copilot/how-tos/manage-your-account/managing-copilot-policies-as-an-individual-subscriber | 2026-07-05 | 公式明記 |
| 学習利用(Business / Enterprise) | 「GitHub's agreements with Business and Enterprise customers prohibit using their Copilot interaction data for model training」— **契約で学習利用が禁止されており対象外** | https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/ | 2026-07-05 | 公式明記 |
| データ共有先 | 学習データは「GitHub affiliates(Microsoft を含む企業グループ)」と共有されうるが、サードパーティ AI プロバイダーには共有しない | 同上 | 2026-07-05 | 公式明記 |
| 公開コード一致フィルター | 「Suggestions matching public code」ポリシー(Allow / Block)。Block 時は候補と周辺コード約 150 文字を GitHub 上の公開コードと突合し、一致・近似一致の候補を非表示。組織 / エンタープライズのシートでは個人設定不可(上位から継承)。**cloud agent は Block でも一致コードを生成しうる**(セッションログに一致情報を表示) | https://docs.github.com/en/copilot/managing-copilot/managing-copilot-as-an-individual-subscriber/managing-copilot-policies-as-an-individual-subscriber | 2026-07-05 | 公式明記 |
| サンドボックス | ローカル(Microsoft MXC)/ クラウド(エフェメラル Linux)サンドボックスが public preview(§1 参照) | https://github.blog/changelog/2026-06-02-cloud-and-local-sandboxes-for-github-copilot-now-in-public-preview/ | 2026-07-05 | 公式明記 |
| コンプライアンス認証 | 正式な参照先は **GitHub Copilot Trust Center**(https://copilot.github.trust.page/)。ページが JS 描画のため機械取得できず、SOC / ISO 等の個別認証の記載内容は**未確認** | https://copilot.github.trust.page/ | 2026-07-05 | 未確認(参照先のみ確定) |
| プロンプト保持期間 | 面(IDE / Web)ごとのプロンプト・提案の保持期間の数値は今回の調査範囲では確認できず | — | 2026-07-05 | 未確認 |

## 10. チーム導入機能

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 管理機能の全体像 | Business / Enterprise プランで、ポリシー管理・アクセス(シート)管理・利用データの確認・監査ログ・コンテンツ除外(file exclusions)を提供 | https://docs.github.com/en/copilot/get-started/features | 2026-07-05 | 公式明記 |
| ポリシー管理 | 組織設定に **Policies タブ**(プライバシー・機能可用性。preview 機能・フィードバック収集・MCP・サードパーティエージェント等)と **Models タブ**(基本モデル以外のモデルの可用性。追加コストが発生しうる)。**エンタープライズオーナーが設定したポリシーは組織側で上書き不可** | https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies | 2026-07-05 | 公式明記 |
| 監査ログ | Copilot 関連イベントが組織の監査ログに記録される(例: `copilot.content_exclusion_changed`)。エンタープライズ向けに「Reviewing audit logs for GitHub Copilot」ページあり | https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs / https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization | 2026-07-05 | 公式明記 |
| 利用状況メトリクス | Copilot usage metrics(API)にユーザー単位の `used_copilot_cloud_agent` フィールド等が追加され、cloud agent のアクティブユーザーを集計可能(2026-04) | https://github.blog/changelog/2026-04-23-copilot-cloud-agent-fields-added-to-usage-metrics/ / https://github.blog/changelog/2026-04-10-copilot-usage-metrics-now-aggregate-copilot-cloud-agent-active-user-counts/ | 2026-07-05 | 公式明記 |
| SSO | Copilot 固有の SSO 機構はなく、GitHub 組織 / Enterprise Cloud 側の認証基盤(SAML / OIDC 等)に従う | — | 2026-07-05 | 公式から推測 |
| cloud agent の有効化 | 「Copilot cloud agent is available for all paid Copilot plans」だが、Business / Enterprise では**管理者による有効化が必要** | https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | 2026-07-05 | 公式明記 |

## 11. 料金・利用制限

> 金額は変動が激しいため docs 本文には転記しない(参照先 URL + 確認日を正とする)。以下は調査時点の記録。

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| プラン体系 | docs は **7 プラン**を列挙: Copilot **Free** / **Student**(学生無料)/ **Pro** / **Pro+** / **Max** / **Business** / **Enterprise**。※「Max」($100/月)は従来の Free/Pro/Pro+/Business/Enterprise 体系への追加プラン | https://docs.github.com/en/copilot/get-started/plans | 2026-07-05 | 公式明記 |
| 料金(2026-07-05 時点の料金ページ) | Free: $0(補完 2,000 回 / 月 + 限定的な chat・agent)。Pro: $10 / 月(AI Credits $15 / 月分)。Pro+: $39 / 月($70 / 月分)。Max: $100 / 月($200 / 月分、新モデル・新機能への優先アクセス)。Business: $19 / シート / 月。Enterprise: $39 / シート / 月 | https://github.com/features/copilot/plans | 2026-07-05 | 公式明記(数値は再確認推奨。2026-04 の発表時は Pro = $10 分・Pro+ = $39 分等で、料金ページの付与額はその後増額されている) |
| 課金単位 | **GitHub AI Credits**(1 credit = $0.01 USD)。トークン量(入力・出力・キャッシュ)× 各モデルの公表 API レートで消費。2026-06-01 発効(旧 premium requests 制を置換) | https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/ | 2026-07-05 | 公式明記 |
| Credits を消費する機能 | Chat・agent mode・code review・Copilot cloud agent・Copilot CLI・Copilot Apps。**コード補完と Next edit suggestions は全有料プランで無制限(Credits を消費しない)** | 同上 / https://github.com/features/copilot/plans | 2026-07-05 | 公式明記 |
| 超過時の挙動 | 旧制度のようなフォールバック(低性能モデルへの自動切替)は廃止。「governed by available credits and admin budget controls」— 追加購入の許可 / 支出上限は管理者が制御 | https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/ | 2026-07-05 | 公式明記 |
| code review の課金帰属 | 自動レビュー設定時、AI Credits の消費は **PR 作成者に帰属** | https://docs.github.com/en/copilot/concepts/code-review/code-review | 2026-07-05 | 公式明記 |
| 実行制限 | cloud agent は 1 セッション最大 59 分(§1) | https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | 2026-07-05 | 公式明記 |
| 料金参照先(正) | https://github.com/features/copilot/plans / https://docs.github.com/en/copilot/get-started/plans | — | 2026-07-05 | — |

## 12. 代表的なユースケース

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| cloud agent の公式想定用途 | リポジトリ調査(research)・実装計画の作成・バグ修正・機能実装・テストカバレッジ改善・ドキュメント更新・技術的負債対応 | https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent | 2026-07-05 | 公式明記 |
| code review の公式想定用途 | PR を多角的にレビューし、バグ・セキュリティ脆弱性・スタイル不整合を指摘して修正案を提示。「Copilot is not guaranteed to spot all problems... Always validate Copilot's feedback carefully」と限界も明記。依存管理ファイル(package.json 等)・ログ・SVG はレビュー対象外。**code review の指摘を cloud agent にそのまま適用させる連携**あり(2026-05-19) | https://docs.github.com/en/copilot/concepts/code-review/code-review / https://github.blog/changelog/2026-05-19-easily-apply-copilot-code-review-feedback-with-copilot-cloud-agent/ | 2026-07-05 | 公式明記 |
| CLI の公式想定用途 | ターミナルからの質問・コード作業・GitHub 操作(PR / Issue 作成、コミット要約、コード変更のレビュー) | https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli | 2026-07-05 | 公式明記 |
| Spark | 自然言語プロンプトからフルスタックアプリを構築・デプロイ(public preview) | https://docs.github.com/en/copilot/get-started/features | 2026-07-05 | 公式明記 |
| コミュニティで定着した用途 | 本調査は公式情報のみを対象としたため未調査。執筆時に「事実(公式)」と「評判(第三者)」を区別して扱うこと | — | 2026-07-05 | 未確認 |

## 補足: 執筆時に混同しやすい機能名の整理

公式名称ベースの整理(2026-07-05 時点)。ツールページ本文の用語定義に使う。

| 機能 | 実行場所 | トリガー | 備考 |
| --- | --- | --- | --- |
| コード補完 / Next edit suggestions | IDE 内 | 入力中 | AI Credits を消費しない(有料プランで無制限) |
| Copilot Chat | IDE / GitHub.com / Mobile / Windows Terminal | 質問 | ask / edit / agent のモードを持つ(IDE) |
| エージェントモード(agent mode) | **IDE 内**(同期・対話的) | チャットでモード選択 | 編集は Keep / Undo、コマンドは承認制 |
| **Copilot cloud agent**(旧: Copilot coding agent) | **GitHub Actions 上**(非同期) | Issue 割当・`@copilot`・agents panel・外部連携・API | `copilot/` ブランチ + PR。59 分 / セッション |
| Copilot code review | GitHub.com(+ 主要 IDE) | レビュアーに Copilot を指定 / 自動レビュー設定 | 除外: 依存管理ファイル・ログ・SVG |
| Copilot CLI | ローカルターミナル | `copilot` コマンド | 旧 gh 拡張とは別物のエージェント型 CLI。MCP 内蔵 |
| GitHub Copilot App | デスクトップアプリ | — | エージェント駆動開発 + PR ライフサイクル管理 |
| Spark / Agentic workflows / サードパーティエージェント | GitHub(Web / Actions) | — | いずれも preview 段階の周辺機能 |

## 補足: 未確認事項(執筆時の TODO 候補)

- Copilot Trust Center(https://copilot.github.trust.page/)記載のコンプライアンス認証(SOC / ISO 等)と IP 補償(indemnification)の適用条件 — ページが機械取得不能のため未確認(2026-07-05)
- プロンプト・提案の保持期間(面ごとの数値)— 未確認
- 大規模リポジトリ / モノレポでのインデックス制約値 — 未確認
- IDE エージェントモードの自動承認設定の粒度(VS Code「Approvals & Permissions」ページの詳細)— 追加確認推奨
- 料金ページの AI Credits 付与額は 2026-04 の発表値から増額されており変動が激しい — 執筆直前に https://github.com/features/copilot/plans を再確認すること
- Copilot Enterprise 固有機能(knowledge bases 等)の現行ラインアップ — 今回未調査
