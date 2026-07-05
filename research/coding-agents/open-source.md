# OSS コーディングエージェント調査メモ(Aider / Cline / Continue / OpenHands / Goose / opencode)

- **調査日**: 2026-07-05
- **対象**: `docs/08-coding-agents/open-source-coding-agents.md`(1 ページ俯瞰記事)の執筆前調査
- **方針**: [CODING-AGENTS-PLAN.md](../../CODING-AGENTS-PLAN.md) §7 の情報源優先順位に従い、公式サイト・公式ドキュメント・公式リポジトリ(GitHub API メタデータ含む)のみを根拠とする。確度は「公式明記 / 公式から推測 / 第三者」の 3 区分。未確認事項は「未確認」と明記
- **注意**: 俯瞰記事用のため 8 観点(①形態 ②ライセンス・開発主体 ③対応モデル ④リポジトリ理解・編集 ⑤コマンド実行・承認 ⑥MCP ⑦ルール・設定 ⑧活発さ)に絞る。§7 の 12 項目フル調査ではない

## Aider

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| ①形態 | ターミナルで動く AI ペアプログラミング CLI。watch モードで任意の IDE・エディタと連携可能。GUI・IDE 拡張の公式提供はなし | https://aider.chat | 2026-07-05 | 公式明記 |
| ②ライセンス・主体 | Apache-2.0。GitHub org は Aider-AI。企業ではなく個人主導コミュニティ OSS(Paul Gauthier 氏発、今回は主体の詳細未確認) | https://github.com/Aider-AI/aider(GitHub API) | 2026-07-05 | 公式明記(ライセンス)/ 公式から推測(主体) |
| ③対応モデル | 「ほぼあらゆる LLM に接続可能、ローカルモデル含む」。Claude・DeepSeek・OpenAI 各モデルを明記。Ollama の専用ドキュメントあり。BYOK 前提 | https://aider.chat / https://aider.chat/docs/llms/ollama.html | 2026-07-05 | 公式明記 |
| ④理解・編集 | リポジトリ全体の「repo map(コードベースの地図)」を作成し大規模プロジェクトに対応。編集は **Git 自動コミット**(コミットメッセージ自動生成)が特徴で、diff・revert は Git 標準ツールで行う。`/undo` で aider のコミットを取り消し | https://aider.chat / https://aider.chat/docs/usage/commands.html | 2026-07-05 | 公式明記 |
| ⑤実行・承認 | エージェントが自律的にシェル実行**しない**設計。ユーザーが `/run`(実行して出力をチャットに追加)・`/test` を明示的に呼ぶ。6 ツール中もっとも人間主導 | https://aider.chat/docs/usage/commands.html | 2026-07-05 | 公式明記 |
| ⑥MCP | 公式ドキュメント(aider.chat)に MCP の記載を確認できず。**未確認(非対応の可能性が高い)** | https://aider.chat/docs/(サイト内検索 2026-07-05 時点で言及なし) | 2026-07-05 | 公式から推測 |
| ⑦ルール・設定 | CLI 引数 / `.aider.conf.yml`(ホームまたはリポジトリルート)/ `AIDER_` 環境変数・`.env` の 4 方式が等価。コーディング規約は `CONVENTIONS.md` 等を `--read` で読み込ませる方式 | https://aider.chat/docs/config.html | 2026-07-05 | 公式明記 |
| ⑧活発さ | 最新リリース v0.86.0(2025-08-09)。最終 push 2026-05-22(モデルリスト追加程度)。**リリースが約 11 か月停止しており開発ペースは大きく低下**。Stars 約 47.1k | GitHub API(repos/Aider-AI/aider, releases/latest) | 2026-07-05 | 公式明記(日付)/ 公式から推測(停滞という評価) |

## Cline

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| ①形態 | VS Code 拡張が中核。加えて JetBrains プラグイン・CLI(ヘッドレス実行で CI/CD 利用可)・SDK。リポジトリ説明は「Autonomous coding agent as an SDK, IDE extension, or CLI assistant」 | https://github.com/cline/cline | 2026-07-05 | 公式明記 |
| ②ライセンス・主体 | Apache-2.0。開発主体は Cline Bot Inc.(コントリビューター 322 名超) | https://github.com/cline/cline | 2026-07-05 | 公式明記 |
| ③対応モデル | ベンダーロックインなしを標榜。Anthropic / OpenAI / Google / AWS Bedrock / Azure / GCP Vertex / OpenRouter / OpenAI 互換 API。ローカルモデル(Ollama・LM Studio)対応。BYOK | https://github.com/cline/cline | 2026-07-05 | 公式明記 |
| ④理解・編集 | プロジェクト構造を読んで複数ファイルを協調編集。すべての編集が **diff ビューとして表示され、レビュー・修正・取り消し可能**。Plan モード(戦略検討)と Act モード(実行)の切替 | https://github.com/cline/cline | 2026-07-05 | 公式明記 |
| ⑤実行・承認 | ターミナルコマンド実行に対応。**アクションごとの human-in-the-loop 承認が基本で、auto-approve(自動承認)へ切替可能** | https://github.com/cline/cline | 2026-07-05 | 公式明記 |
| ⑥MCP | 対応。MCP サーバーで機能拡張する設計を README に明記 | https://github.com/cline/cline | 2026-07-05 | 公式明記 |
| ⑦ルール・設定 | `.clinerules` ファイルでプロジェクト固有のコーディング規約・慣習を指定 | https://github.com/cline/cline | 2026-07-05 | 公式明記 |
| ⑧活発さ | 非常に活発。最新リリース cli-v3.0.37(2026-07-04)、最終 push 2026-07-05、リリース 308 本、Stars 約 64.3k | GitHub API(repos/cline/cline, releases/latest) | 2026-07-05 | 公式明記 |

## Continue

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| ①形態 | VS Code 拡張 / JetBrains プラグイン / CLI(`cn`、npm の `@continuedev/cli`)。JetBrains 版はドキュメントが CLI 利用を推奨 | https://docs.continue.dev / https://github.com/continuedev/continue | 2026-07-05 | 公式明記 |
| ②ライセンス・主体 | Apache-2.0(© 2023-2026 Continue Dev, Inc.)。**公式サイトが「Continue has been acquired by Cursor(Cursor による買収)」を告知**。買収の時期・条件は未確認 | https://continue.dev / https://github.com/continuedev/continue | 2026-07-05 | 公式明記(買収の事実)/ 未確認(時期) |
| ③対応モデル | `config.yaml` の models ブロックで任意プロバイダーを BYOK 接続。Ollama はローカルモデルの自動検出(autodetect)に対応 | https://docs.continue.dev/customize/models / https://docs.continue.dev/customize/model-providers/top-level/ollama | 2026-07-05 | 公式明記 |
| ④理解・編集 | エージェントは「モデル + ルール + ツール(MCP サーバー)」の合成として構成。編集方式・インデックス方式の詳細は今回未確認 | https://docs.continue.dev/reference | 2026-07-05 | 公式明記(構成)/ 未確認(編集方式) |
| ⑤実行・承認 | Agent モードでツール実行が可能。承認モデルの詳細(ツールポリシー等)は今回未確認 | https://docs.continue.dev | 2026-07-05 | 未確認 |
| ⑥MCP | 対応。「任意の MCP サーバー」を利用可能と明記 | https://docs.continue.dev(MCP 関連ページ) | 2026-07-05 | 公式明記 |
| ⑦ルール・設定 | `config.yaml`(models / rules / prompts / mcpServers のブロック構成)。旧 `config.json` からの移行ガイドあり | https://docs.continue.dev/reference / https://docs.continue.dev/reference/yaml-migration | 2026-07-05 | 公式明記 |
| ⑧活発さ | **リポジトリは「no longer actively maintained / read-only」を公式表明**。最終リリース v2.0.0(vscode 向け 2026-06-19。テレメトリ削除・認証切り出しを実施した「final release」)。Stars 約 34.7k。**新規採用は非推奨の状態** | https://github.com/continuedev/continue / GitHub API(releases/latest) | 2026-07-05 | 公式明記 |

## OpenHands(旧 OpenDevin)

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| ①形態 | 単一エージェントから「セルフホスト可能な developer control center(エージェント実行基盤)」へ拡張。提供面: Agent Canvas(ブラウザ UI + バックエンドサーバー)/ OpenHands Cloud(マネージド。GitHub・GitLab・Bitbucket・Slack・Jira・Linear 連携)/ Enterprise(K8s でのセルフホスト)/ Software Agent SDK(Python)。CLI とローカル GUI は「レガシー」扱い。OpenHands 製エージェントだけでなく Claude Code・Codex・Gemini 等の他社エージェントも実行対象にできる | https://github.com/All-Hands-AI/OpenHands / https://docs.openhands.dev/ | 2026-07-05 | 公式明記 |
| ②ライセンス・主体 | MIT。ただし `enterprise/` ディレクトリのみ別ライセンス(購入が必要)= **オープンコア**。GitHub org は OpenDevin → All-Hands-AI → OpenHands と変遷(旧 URL はリダイレクトで確認)。開発主体は All Hands AI / OpenHands コミュニティ | LICENSE(GitHub API repos/OpenHands/OpenHands/contents/LICENSE)/ https://docs.openhands.dev/ | 2026-07-05 | 公式明記 |
| ③対応モデル | 「LLM Profiles」設定で任意の LLM に接続(「any LLM」)。CLI は「Claude, GPT, or any other LLM」と明記。BYOK。ローカルモデルの明示的な言及は今回未確認 | https://github.com/All-Hands-AI/OpenHands / https://docs.openhands.dev/ | 2026-07-05 | 公式明記(any LLM)/ 未確認(ローカル) |
| ④理解・編集 | 実行環境が特徴: Agent Server バックエンドをローカル直接 / Docker コンテナ / VM / クラウドから選択でき、**サンドボックス実行が第一級の設計**。インデックス方式等の詳細は今回未確認 | https://github.com/All-Hands-AI/OpenHands | 2026-07-05 | 公式明記(実行環境)/ 未確認(理解方式) |
| ⑤実行・承認 | confirmation mode 3 種: Always Confirm(毎回確認)/ Always Approve(全自動)/ **LLM-Based Approval(セキュリティアナライザーがアクションのリスクを評価し、高リスクのみ人間確認)**。プラガブルなセキュリティアナライザー機構 | https://docs.openhands.dev/sdk/arch/security / https://docs.openhands.dev/openhands/usage/cli/terminal | 2026-07-05 | 公式明記 |
| ⑥MCP | 対応(SDK ガイドと CLI 向け MCP Servers ドキュメントあり)。加えて ACP(Agent Client Protocol)にも言及 | https://docs.openhands.dev/sdk/guides/mcp / https://docs.openhands.dev/openhands/usage/cli/mcp-servers | 2026-07-05 | 公式明記 |
| ⑦ルール・設定 | 環境変数リファレンス、File-Based Agents、Agent Skills & Context のドキュメントあり。`.openhands/microagents` や AGENTS.md 対応の現行仕様は今回未確認 | https://docs.openhands.dev/openhands/usage/environment-variables / https://docs.openhands.dev/sdk/guides/skill | 2026-07-05 | 公式明記(存在)/ 未確認(詳細) |
| ⑧活発さ | 活発。最新リリース cloud-1.40.0(2026-06-26)、最終 push 2026-07-05、リリース 105 本、Stars 約 79.5k | GitHub API(repos/OpenHands/OpenHands, releases/latest) | 2026-07-05 | 公式明記 |

## Goose

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| ①形態 | ネイティブデスクトップアプリ(macOS / Linux / Windows)+ CLI + 組み込み用 API の 3 面。**コーディング専用ではなく「マシン上で動く汎用 AI エージェント」**(研究・執筆・自動化・データ分析も守備範囲)と自己定義 | https://goose-docs.ai | 2026-07-05 | 公式明記 |
| ②ライセンス・主体 | Apache-2.0。Block 発のプロジェクトだが、**現在は Linux Foundation 傘下の Agentic AI Foundation(AAIF)に移管**され「ベンダー中立・コミュニティガバナンス」を明言。GitHub org は block/goose → aaif-goose/goose に移転(リダイレクト確認)。docs も block.github.io/goose → goose-docs.ai に移転 | https://goose-docs.ai / GitHub API(orgs/aaif-goose) | 2026-07-05 | 公式明記 |
| ③対応モデル | 15+ プロバイダー(Anthropic / OpenAI / Google / Ollama / OpenRouter / Azure / Bedrock 等)。BYOK に加え、**ACP(Agent Client Protocol)経由で既存サブスクリプションの利用**も可能。ローカルは Ollama を明記 | https://goose-docs.ai | 2026-07-05 | 公式明記 |
| ④理解・編集 | ファイルの編集・作成・削除・テスト実行まで行う(リポジトリ説明)。インデックス方式等の特筆事項は公式に確認できず(オンデマンド型と推測) | https://github.com/block/goose(リポジトリ説明) | 2026-07-05 | 公式明記(能力)/ 公式から推測(方式) |
| ⑤実行・承認 | permission mode 4 種: **Autonomous(既定。自由に編集・実行)**/ Smart Approve / Approve(ツール呼び出しごとに Allow・Deny)/ Chat(ツール実行なし)。`/mode` で随時切替。**既定が Autonomous である点は俯瞰記事の注意点に使える** | https://goose-docs.ai/docs/guides/goose-permissions/ | 2026-07-05 | 公式明記 |
| ⑥MCP | **拡張機構そのものが MCP ベース**。「70+ extensions(DB・API・ブラウザ・GitHub・Google Drive 等)を MCP オープン標準で接続」 | https://goose-docs.ai | 2026-07-05 | 公式明記 |
| ⑦ルール・設定 | `.goosehints` と **AGENTS.md の両方を各ディレクトリ階層で自動探索・読み込み**(git リポジトリで作業ディレクトリからルートまで階層的に、さらにサブディレクトリのヒントも自動発見)。recipes(ポータブルな YAML 設定)でタスク定義を共有可能 | https://goose-docs.ai/docs/guides/context-engineering/using-goosehints/ | 2026-07-05 | 公式明記 |
| ⑧活発さ | 活発。最新リリース v1.41.0(2026-07-03)、最終 push 2026-07-05、Stars 約 50.7k | GitHub API(repos/block/goose → aaif-goose/goose, releases/latest) | 2026-07-05 | 公式明記 |

## opencode

| 項目 | 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| ①形態 | ターミナル TUI が中核で、デスクトップアプリ・IDE 拡張も提供(「terminal, IDE, or desktop」)。クライアント/サーバー構造。LSP 対応・マルチセッション | https://opencode.ai / https://opencode.ai/docs | 2026-07-05 | 公式明記 |
| ②ライセンス・主体 | MIT。開発主体は Anomaly(GitHub org: anomalyco、https://anoma.ly)。**旧 sst/opencode からの org 移転をリダイレクトで確認**(SST チーム発) | GitHub API(repos/sst/opencode → anomalyco/opencode, orgs/anomalyco) | 2026-07-05 | 公式明記(移転の事実)/ 公式から推測(SST 発という経緯) |
| ③対応モデル | Models.dev 経由で **75+ プロバイダー**(ローカルモデル含む)。無料モデル同梱。BYOK に加え **GitHub Copilot・ChatGPT Plus/Pro のサブスクリプション接続**に対応。「コード・コンテキストデータを保存しない」と明記 | https://opencode.ai | 2026-07-05 | 公式明記 |
| ④理解・編集 | LSP 統合。Plan モード(変更を無効化し実装案のみ提示)と Build モード(変更を実行)を Tab キーで切替。インデックス方式の特筆事項は未確認 | https://opencode.ai/docs | 2026-07-05 | 公式明記(モード)/ 未確認(理解方式) |
| ⑤実行・承認 | `opencode.json` の `permission` 設定で allow / ask / deny をツール別(read / edit / bash / webfetch / external_directory 等)に指定。**bash はコマンドパターン別**(例: `"git *": "allow"`、`"rm *": "deny"`。最後にマッチしたルール優先)。**既定はほぼ allow**(doom_loop・external_directory は ask、`.env` は deny)。TUI の承認は once / always / reject | https://opencode.ai/docs/permissions | 2026-07-05 | 公式明記 |
| ⑥MCP | 対応(MCP servers を設定項目として明記) | https://opencode.ai/docs | 2026-07-05 | 公式明記 |
| ⑦ルール・設定 | `opencode.json`(設定・権限)+ **AGENTS.md**(ルールファイル) | https://opencode.ai/docs | 2026-07-05 | 公式明記 |
| ⑧活発さ | 非常に活発。最新リリース v1.17.13(2026-07-01)、最終 push 2026-07-05、**Stars 約 182.5k(6 ツール中最多)**、コントリビューター 900 名(公式サイト表記) | GitHub API(repos/sst/opencode → anomalyco/opencode, releases/latest)/ https://opencode.ai | 2026-07-05 | 公式明記 |

## 横断比較メモ

### 共通点(OSS 系というカテゴリの特徴として書ける)

- **マルチプロバイダー・BYOK が全ツール共通のアイデンティティ**。自分の API キー(または既存サブスクリプション)で任意のモデルに接続でき、Ollama 等のローカルモデル対応も標準的(Aider・Cline・Continue・Goose・opencode で公式明記。OpenHands は「any LLM」とのみ)。データ主権・モデル選択の自由が OSS を選ぶ動機と直結する
- **ライセンスは寛容型のみ**(Apache-2.0: Aider・Cline・Continue・Goose / MIT: OpenHands・opencode)。ただし OpenHands は enterprise/ を除くオープンコア
- **MCP 対応が事実上の標準**(5/6 ツールで公式明記)。例外は Aider(記載なし)。Goose は拡張機構自体が MCP ベースで最も深い統合
- **ルールファイルの収斂傾向**: AGENTS.md 対応を Goose・opencode が明記。一方 Cline(.clinerules)・Continue(config.yaml の rules)・Aider(CONVENTIONS.md + --read)は独自形式。俯瞰記事では「ルールファイルの互換性」を選定軸に使える

### 相違点(分類・比較の軸として書ける)

- **形態の分布**: CLI/TUI 中核 = Aider・opencode・Goose(+デスクトップ)/ IDE 拡張中核 = Cline・Continue / 実行基盤・プラットフォーム = OpenHands(単体エージェントから control center へ拡張)。1 ツール多形態化(Cline は拡張 + CLI + SDK、opencode は TUI + デスクトップ + IDE)が進行
- **承認モデルの既定値が対照的**:
  - Aider: エージェントが自律実行しない(人が `/run` を打つ)— 最も保守的
  - Cline: アクションごとの承認が基本、auto-approve へ opt-in
  - OpenHands: 3 モード(毎回確認 / 全自動 / **LLM ベースのリスク評価で高リスクのみ確認**)
  - Goose: **既定が Autonomous**(全自動)で、承認モードへは opt-in
  - opencode: **既定がほぼ allow**、opencode.json でコマンドパターン単位の細粒度制御
  - → 「OSS 系は既定の安全度がツールごとに大きく違う」は記事の実務的な注意点に使える(docs/06-security との接続点)
- **サンドボックス**: OpenHands のみ Docker/VM/クラウドの隔離実行が第一級。他はローカル直接実行が基本

### プロジェクト存続性・ガバナンス(2025〜2026 年の変動が激しい — 記事の主要メッセージ候補)

| ツール | 2026-07-05 時点の状態 |
| --- | --- |
| Aider | リリース約 11 か月停止(v0.86.0 = 2025-08)。コミットは散発的に継続 |
| Cline | Cline Bot Inc. により活発に開発中 |
| Continue | **Cursor に買収され、リポジトリは read-only(final release v2.0.0)**。新規採用は事実上終了状態 |
| OpenHands | org 改称(OpenDevin → All-Hands-AI → OpenHands)+ オープンコア化 + プラットフォーム化。活発 |
| Goose | **Block から Linux Foundation 傘下 AAIF へ移管**(ベンダー中立ガバナンス)。活発 |
| opencode | **SST から Anomaly へ org 移転**。6 ツール中最大の Stars(182k)で非常に活発 |

- → 「OSS を選ぶ = ガバナンス・存続性の変化リスクを自分で監視する責任を負う」という評価軸(計画 §5.3 の『OSS 系という選択肢の評価軸』)を裏付ける一次事実が揃った。買収(Continue)・財団移管(Goose)・組織移転(opencode)・停滞(Aider)の 4 パターンが 1 年以内に実例として発生している
- **商業化パターン**: ホスティング/オープンコア(OpenHands Cloud・Enterprise)、企業スポンサー(Cline Bot Inc.、Anomaly)、財団化(Goose)— 「無料 ≠ 運用コストゼロ」(API 従量課金 + 自己運用負担)の整理に使える

### 執筆時の注意・TODO

> **TODO(要確認):** Aider の MCP 対応有無を GitHub リポジトリの issue / リリースノートで再確認する(公式 docs に記載がないことのみ確認済み)(最終確認: 2026-07)

> **TODO(要確認):** Continue の Cursor による買収の公表時期と、拡張・CLI の今後のサポート方針を公式アナウンスで確認する(最終確認: 2026-07)

> **TODO(要確認):** OpenHands のローカルモデル対応と `.openhands` ディレクトリ・microagents の現行仕様を docs.openhands.dev で確認する(最終確認: 2026-07)

> **TODO(要確認):** 各ツールの Stars・リリース日は変動が速いため、執筆直前に GitHub API で再取得する(最終確認: 2026-07-05)
