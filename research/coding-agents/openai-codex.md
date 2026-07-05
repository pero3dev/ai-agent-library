# OpenAI Codex 調査メモ(C-R2)

- **対象**: OpenAI Codex(CLI / IDE 拡張 / デスクトップアプリ / クラウド / GitHub コードレビュー / SDK の製品群)
- **調査日**: 2026-07-05
- **調査方法**: [CODING-AGENTS-PLAN.md](../../CODING-AGENTS-PLAN.md) §7 の 12 項目チェックリスト。公式情報(developers.openai.com / github.com/openai / openai.com / help.openai.com)のみを根拠とし、第三者記事は使用していません
- **確度の凡例**: 公式明記 / 公式から推測 / 第三者(本メモでは第三者根拠なし)

## 前提: 製品構成の全体像

「Codex」は単一製品ではなく、同じエージェントを複数の面(surface)で提供する製品群です(確認日: 2026-07-05、出典: <https://developers.openai.com/codex>、公式明記)。

| 面 | 実行場所 | 備考 |
| --- | --- | --- |
| Codex CLI | ローカル(ターミナル) | OSS(Apache-2.0、Rust 製)。`github.com/openai/codex` |
| IDE 拡張 | ローカル(IDE 内) | VS Code 系 + JetBrains。クラウドタスクの委任・監視も可能 |
| Codex アプリ | ローカル(デスクトップ) | macOS / Windows。並列スレッド・worktree・automations |
| Codex cloud(Web) | OpenAI 管理のクラウドコンテナ | ChatGPT アカウントで利用。GitHub 連携で PR 作成 |
| コードレビュー | クラウド(GitHub 連携) | PR コメントで `@codex review`。自動レビュー設定可 |
| GitHub Action / `codex exec` / SDK | CI・自前インフラ | 自動化用の面 |
| Slack / Linear 連携 | クラウド | `@Codex` メンションでクラウドタスク起動 |
| Codex Security | クラウド + IDE プラグイン | 脆弱性スキャンの別機能群(2026-07 時点でドキュメントあり) |

このほかドキュメントナビには Chrome 拡張・App Server・Amazon Bedrock デプロイ・Remote connections の項目があります(詳細未調査。出典: <https://developers.openai.com/codex>、確認日: 2026-07-05、公式明記〔ナビ項目として存在〕)。

## 1. 実行環境

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| CLI はローカルのターミナルで動作する軽量コーディングエージェント("Lightweight coding agent that runs in your terminal")。CLI・IDE 拡張・デスクトップアプリの 3 形態で配布 | <https://github.com/openai/codex> | 2026-07-05 | 公式明記 |
| 対応 OS: macOS(Apple Silicon / x86_64)、Linux(x86_64 / arm64)、Windows(PowerShell インストール)。npm / Homebrew / バイナリで配布 | <https://github.com/openai/codex> | 2026-07-05 | 公式明記 |
| クラウド実行は「OpenAI 管理の隔離コンテナで実行され、ホストシステムへのアクセスを防ぐ」("Runs in isolated OpenAI-managed containers") | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| クラウドは 2 フェーズ: セットアップフェーズ(依存関係取得のためネットワークあり)→ エージェントフェーズ(既定でオフライン。インターネットアクセスは明示的に有効化) | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| クラウドタスクはバックグラウンド・並列実行可。結果は PR として提出 | <https://developers.openai.com/codex/cloud> | 2026-07-05 | 公式明記 |
| CI では GitHub Action と非対話モード `codex exec` が利用可能 | <https://developers.openai.com/codex/sdk> / <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| クラウド環境のキャッシュ・永続性の仕様 | — | 2026-07-05 | 未確認 |

## 2. 対応 IDE / CLI

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| CLI あり(Rust 96% で実装。OSS) | <https://github.com/openai/codex> | 2026-07-05 | 公式明記 |
| IDE 拡張: VS Code(+ Insiders)、Cursor、Windsurf(VS Code 互換エディタ)、JetBrains(IntelliJ / PyCharm / WebStorm / Rider)。「macOS、Windows、Linux で利用可能」 | <https://developers.openai.com/codex/ide> | 2026-07-05 | 公式明記 |
| 専用 IDE はなし。既存 IDE への拡張方式 | <https://developers.openai.com/codex/ide> | 2026-07-05 | 公式から推測(専用 IDE の記載が存在しないことによる) |
| デスクトップアプリ(Codex app): macOS(Apple Silicon / Intel)と Windows(Microsoft Store)。並列スレッド・Git worktree 内蔵・automations(定期実行)・computer use / ブラウザ操作 | <https://developers.openai.com/codex/app> | 2026-07-05 | 公式明記 |
| IDE 拡張は「長いジョブをクラウド環境へオフロードし、IDE を離れずに進捗監視・結果レビュー」が可能 | <https://developers.openai.com/codex/ide> | 2026-07-05 | 公式明記 |

## 3. リポジトリ理解

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| CLI は「リポジトリを読み、編集し、コマンドを実行する」対話ループで動作。`@` ファイルピッカーや `--path` によるオンデマンド探索 | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| 事前の埋め込みインデックス(コードベースインデックス)を構築するという記述は公式ドキュメントに見当たらない → オンデマンド検索型と判断 | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式から推測 |
| AGENTS.md 等のプロジェクトガイダンスをセッション最初のターンで取り込む(1 ファイルあたり既定 32 KiB 上限、`project_doc_max_bytes` で変更可) | <https://developers.openai.com/codex/guides/agents-md> | 2026-07-05 | 公式明記 |
| クラウドは GitHub アカウント接続でリポジトリを扱い、PR を作成する(コンテナ内にリポジトリを取得して作業する構造) | <https://developers.openai.com/codex/cloud> | 2026-07-05 | 公式明記(後半のクローン方式の詳細は公式から推測) |
| 大規模リポジトリ・モノレポ固有の制約の記載 | — | 2026-07-05 | 未確認 |

## 4. ファイル編集

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| TUI 上で構文ハイライト付きの diff を表示してレビューできる | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| 「行動のトランスクリプトを提示するので、通常の git ワークフローで変更をレビューまたはロールバックできる」= ロールバックは git 前提(専用 undo 機構の記載なし) | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| `/review` コマンドでブランチ・未コミット変更・特定コミットを対象にコードレビューを実行可能 | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| IDE 拡張はクラウド変更をプレビューし、「結果の diff をローカルに適用」できる | <https://developers.openai.com/codex/ide> | 2026-07-05 | 公式明記 |
| デスクトップアプリは diff 検査・ステージ・コミット・プッシュまで可能。worktree で並列変更を分離 | <https://developers.openai.com/codex/app> | 2026-07-05 | 公式明記 |

## 5. コマンド実行

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| シェルコマンド実行・テスト実行が可能。実行はサンドボックスと承認ポリシー(§8)で制御 | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| 実行中に Tab で追加コマンドをキューに積める(作業の継続投入) | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| `codex exec` で非対話実行(最終プランと結果を stdout に出力)。`codex cloud exec --env ENV_ID` でクラウド環境上の実行も可能 | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| クラウドではユーザー定義のセットアップスクリプト実行後にエージェントが作業 | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| `codex resume`(セッション再開ピッカー)/ `codex resume --last`。再開時は元のトランスクリプト・プラン履歴・承認状態を保持 | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |

## 6. MCP・外部ツール連携

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| MCP クライアント対応。トランスポートは STDIO と Streamable HTTP(SSE の記載なし) | <https://developers.openai.com/codex/mcp> | 2026-07-05 | 公式明記 |
| MCP サーバーの追加は `codex mcp add <name> -- <command>` または `~/.codex/config.toml`(信頼済みプロジェクトではプロジェクト側 `.codex/config.toml`)を直接編集 | <https://developers.openai.com/codex/mcp> | 2026-07-05 | 公式明記 |
| 「Codex は CLI と IDE 拡張の両方で MCP サーバーをサポート」。クラウド実行時の MCP 対応は明記なし | <https://developers.openai.com/codex/mcp> | 2026-07-05 | 公式明記(クラウドの扱いは未確認) |
| Codex 自身を MCP サーバーとして公開する機能がドキュメントナビ(Automation > MCP Server)に存在。詳細未調査 | <https://developers.openai.com/codex> | 2026-07-05 | 公式明記(ナビ項目として存在) |
| GitHub Action、Slack 連携(`@Codex` メンション → クラウドタスク作成 → スレッドに結果)、Linear 連携ページあり | <https://developers.openai.com/codex/integrations/slack> | 2026-07-05 | 公式明記(Linear は連携ページの存在のみ確認) |
| 拡張機構としてフック(Hooks)・プラグイン・スキル(Skills)・サブエージェントのドキュメントが Configuration 配下に存在。詳細未調査 | <https://developers.openai.com/codex> | 2026-07-05 | 公式明記(ナビ項目として存在) |
| ファーストパーティの Web 検索ツールを同梱(既定はキャッシュモード、ライブモードあり) | <https://developers.openai.com/codex/cli/features> | 2026-07-05 | 公式明記 |
| Agents SDK との併用ガイド「Use Codex with the Agents SDK」あり | <https://developers.openai.com/codex/guides/agents-sdk> | 2026-07-05 | 公式明記(ページの存在のみ確認) |

## 7. 設定ファイル

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 個人設定は `~/.codex/config.toml`。プロジェクト上書きは `.codex/config.toml` | <https://developers.openai.com/codex/config-basic> | 2026-07-05 | 公式明記 |
| AGENTS.md の探索順: グローバル(`~/.codex/AGENTS.override.md` → `~/.codex/AGENTS.md`)→ プロジェクト(Git ルートから現在のディレクトリへ各階層で `AGENTS.override.md` → `AGENTS.md` → フォールバック名)。ルートから下方向へ連結され「現在のディレクトリに近いファイルほど後に現れるため先のガイダンスを上書きする」 | <https://developers.openai.com/codex/guides/agents-md> | 2026-07-05 | 公式明記 |
| 読み込み量の制御: `project_doc_max_bytes`(既定 32 KiB)、`project_doc_fallback_filenames`(代替ファイル名) | <https://developers.openai.com/codex/guides/agents-md> / <https://developers.openai.com/codex/config-reference> | 2026-07-05 | 公式明記 |
| AGENTS.md は Codex 固有ではなくオープンな標準(公式サイト <https://agents.md> を案内) | <https://developers.openai.com/codex/guides/agents-md> | 2026-07-05 | 公式明記 |
| チーム共有: `.codex` ディレクトリに `config.toml`・`rules/`・`skills/` をリポジトリへコミットして標準化 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| 組織の管理設定: `requirements.toml` を Codex Policies ページから配布し、ChatGPT 認証のローカル各面(アプリ / CLI / IDE)に強制適用 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| サブエージェントのロール定義は `config.toml` の `[agents]` で構成 | <https://developers.openai.com/codex/subagents> | 2026-07-05 | 公式明記 |

## 8. 権限管理

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| サンドボックスモード(ファイル権限): `read-only`(読み取りのみ。編集・コマンド・ネットワークは承認要)/ `workspace-write`(Auto。ワークスペース内の読み書き・コマンド実行可、外への escape とネットワークは承認要。既定)/ `danger-full-access`(サンドボックスなし) | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| 承認ポリシー: `untrusted`(既知の安全な読み取り操作のみ自動。状態を変更しうるコマンドは承認要)/ `on-request`(承認要求をユーザーへルーティング)/ `never`(承認プロンプトなし) | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| エスケープハッチ: `--dangerously-bypass-approvals-and-sandbox`(別名 `--yolo`)、`--sandbox danger-full-access`。「サンドボックスなし・承認なし」は Elevated Risk と明記 | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| IDE 拡張では `Chat` / `Agent` / `Agent (Full Access)` の切り替え UI | <https://developers.openai.com/codex/ide> | 2026-07-05 | 公式明記 |
| 組織は `requirements.toml` で `allowed_sandbox_modes` / `allowed_approval_policies` / `allowed_web_search_modes` / 機能フラグ(`browser_use` / `computer_use`)を制限可能 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| 許可 / 拒否のコマンド単位リスト(Claude Code の permissions 相当)の有無 | — | 2026-07-05 | 未確認(config-reference の精査が必要) |

## 9. セキュリティ

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| ローカルサンドボックス実装: macOS = Seatbelt ポリシー(`sandbox-exec`)、Linux = `bwrap` + `seccomp`、Windows = ネイティブ実装(unelevated / elevated モード)または WSL2 経由で Linux 実装 | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| ネットワークは「既定でオフ」。`workspace-write` でも `network_access = true` を明示しない限り無効 | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| クラウド: OpenAI 管理コンテナ、エージェントフェーズは既定オフライン(§1 参照) | <https://developers.openai.com/codex/agent-approvals-security> | 2026-07-05 | 公式明記 |
| 学習利用の既定(個人): ChatGPT のトレーニングデータ設定が Codex 経由のコンテンツにも適用される。個人向けサービスでは学習に使われる場合があり、プライバシーポータルの「do not train on my content」でオプトアウト可能 | <https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance> | 2026-07-05 | 公式明記(Help Center。直接取得が 403 のため検索経由で確認。執筆時に再確認推奨) |
| Codex には「full environments での学習を許可する」独立の設定が Codex Settings にある | <https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan> | 2026-07-05 | 公式明記(同上の注意) |
| Business / Enterprise / Edu / API 経由のデータは既定で学習に使用しない | <https://help.openai.com/en/articles/8798634-managing-data-sharing-and-privacy-in-chatgpt-business> | 2026-07-05 | 公式明記(同上の注意) |
| Enterprise: 保存時 AES-256・転送時 TLS 1.2+ の暗号化、Zero Data Retention(ZDR)対応、保持・所在は ChatGPT Enterprise ポリシー準拠。セキュリティホワイトペーパーあり | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| 秘密情報の自動マスク機能の有無 | — | 2026-07-05 | 未確認 |
| 別機能「Codex Security」: 接続リポジトリをコミット単位でスキャンし、隔離環境で検証してから脆弱性を報告。cloud 版は Enterprise / Edu / Business / Pro 向け | <https://developers.openai.com/codex/security> | 2026-07-05 | 公式明記 |

## 10. チーム導入機能

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| ワークスペース設定に「Allow members to use Codex Local」(新規ワークスペースでは既定有効)と「Allow members to use Codex cloud」のトグル。cloud は ChatGPT GitHub Connector の有効化が前提 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| コードレビューは Settings → Code review でリポジトリ単位に設定可能 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| `requirements.toml` による集中ポリシー(§8 参照)。ChatGPT 認証のローカル面すべてに適用 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| SSO / MFA は企業のセキュリティポリシーに準拠。CLI 向けデバイスコード認証。アクセストークンの失効期限を管理者が設定可能 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| Analytics API: `https://api.chatgpt.com/v1/analytics/codex`(スコープ `codex.enterprise.analytics.read`)。利用状況・コードレビューの計測 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| Compliance API: イベント種別 `CODEX_LOG` / `CODEX_SECURITY_LOG`。ワークスペースのログ・タスク・環境を追跡 | <https://developers.openai.com/codex/enterprise> | 2026-07-05 | 公式明記 |
| 上記管理機能の Business プランと Enterprise プランの差分 | — | 2026-07-05 | 未確認(enterprise ドキュメントは「Enterprise admins 向け」とのみ記載) |

## 11. 料金・利用制限

金額は本文に転記しない方針(CODING-AGENTS-PLAN.md §7-11)。参照先 URL と構造のみ記録します。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 「Codex は ChatGPT Free、Go、Plus、Pro、Business、Edu、Enterprise プランに含まれる」(Free / Go はより限定的なアクセス) | <https://developers.openai.com/codex/pricing> | 2026-07-05 | 公式明記 |
| 利用制限は「5 時間ウィンドウあたりのメッセージ数」構造(プラン・モデルにより幅がある)。Pro には 5x / 20x のティアあり(2026-07 時点の表記) | <https://developers.openai.com/codex/pricing> | 2026-07-05 | 公式明記 |
| 上限超過分はクレジット購入で利用可(モデル別に入出力トークンあたりのクレジット消費が定義される) | <https://developers.openai.com/codex/pricing> | 2026-07-05 | 公式明記 |
| API キー認証では「Codex が使ったトークン分だけ API 料金に基づき支払う」従量課金が可能 | <https://developers.openai.com/codex/pricing> | 2026-07-05 | 公式明記 |
| GitHub でのコードレビューは Plus / Pro(以上)が必要 | <https://developers.openai.com/codex/pricing> | 2026-07-05 | 公式明記 |
| 料金の定点観測 URL: 上記 pricing ページ、ChatGPT プラン別の解説 <https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan> 、レートカード <https://help.openai.com/en/articles/20001106-codex-rate-card> | — | 2026-07-05 | 公式明記(help.openai.com は直接取得 403。URL の存在は確認済み) |

## 12. 代表的なユースケース

公式ドキュメントの Use cases に列挙されているもの(出典: <https://developers.openai.com/codex/use-cases>、確認日: 2026-07-05、公式明記)。

| ユースケース(公式) | 推奨される面 |
| --- | --- |
| GitHub PR のレビュー(人のレビュー前に回帰・問題を検出) | GitHub 連携 |
| コードベースのリファクタリング(デッドコード除去・レガシーパターンの近代化) | IDE 拡張 / CLI |
| 大規模コードベースの理解(リクエストフローの追跡・モジュールの把握) | IDE 拡張 |
| コード移行(チェックポイント制御でレガシースタックを移行) | CLI / クラウド |
| ドキュメントの最新化 | CLI / クラウド |
| 脆弱性バックログの修正(Security プラグイン併用) | クラウド |
| コード変更のセキュリティスキャン | IDE 拡張 / GitHub |
| アプリ / Web サイトのデプロイ(プレビュー URL 取得まで) | クラウド |

- コードレビューの動作: PR コメントで `@codex review` をメンション → 👀 リアクション → レビュー投稿。全 PR の自動レビュー設定も可能。「P0 / P1 の問題のみフラグする」方針。変更ファイルに最も近い AGENTS.md の Review guidelines に従う(出典: <https://developers.openai.com/codex/integrations/github>、確認日: 2026-07-05、公式明記)
- コミュニティで定着した用途は本調査の対象外(第三者情報を根拠にしない方針のため未記録)

## 補足: 名称の変遷と SDK(執筆時の注意)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 「Codex」の名称は 2 回使われている。2021 年の Codex は自然言語からコードを生成する**モデル**(API 提供、GitHub Copilot 初期の基盤)。旧 codex 系モデルは API から非推奨化済み | <https://platform.openai.com/docs/deprecations> | 2026-07-05 | 公式明記 |
| 2025-05 に同名の「Codex」が**クラウドソフトウェアエンジニアリングエージェント**として再発表(初期は codex-1 = o3 の SWE 最適化版)。2025-06-03 に ChatGPT Plus へ展開 | <https://openai.com/index/introducing-codex/> | 2026-07-05 | 公式明記 |
| `codex-mini-latest` モデルは 2026-02-12 に API から削除(2025-11-17 通知) | <https://platform.openai.com/docs/deprecations> | 2026-07-05 | 公式明記 |
| 2026-07 時点の推奨モデル: `gpt-5.5`(推奨)/ `gpt-5.4` / `gpt-5.4-mini`(サブエージェント・高速用途)/ `gpt-5.3-codex-spark`(research preview、Pro 限定)。`gpt-5.2` / `gpt-5.3-codex` は ChatGPT サインインでは非推奨(API キーでは利用可の場合あり) | <https://developers.openai.com/codex/models> | 2026-07-05 | 公式明記 |
| Codex SDK: TypeScript(Node.js 18+)と Python(3.10+)。スレッド開始・`run()` 複数回・スレッド ID による再開・サンドボックスレベル指定が可能。Python SDK は「ローカルの Codex app-server を JSON-RPC で制御」 | <https://developers.openai.com/codex/sdk> | 2026-07-05 | 公式明記 |
| CLI の OSS ライセンスは Apache-2.0 | <https://github.com/openai/codex> | 2026-07-05 | 公式明記 |

## 変わりやすい項目(執筆時の定点観測候補)

- モデル名とプラン別レート制限(§11・補足): `gpt-5.5` 系の世代交代が速い → <https://developers.openai.com/codex/models> / <https://developers.openai.com/codex/pricing>
- プラン構成(Free / Go への提供範囲、Pro の 5x / 20x ティア): <https://developers.openai.com/codex/pricing>
- 製品面の追加(2026-07 時点でアプリ・Chrome 拡張・Codex Security・computer use など拡大中): <https://developers.openai.com/codex> / <https://developers.openai.com/codex/changelog>
- help.openai.com の記事(直接取得が 403 だったため、執筆時にブラウザで本文再確認): プラン別利用条件・学習利用設定・レートカード

## 未確認事項(執筆前に追加調査するもの)

1. クラウド環境のコンテナキャッシュ・永続性の仕様(§1)
2. 大規模リポジトリ・モノレポでの制約(§3)
3. コマンド単位の許可 / 拒否リスト設定の有無(§8。config-reference の精査)
4. 秘密情報の自動マスク機能(§9)
5. Business と Enterprise の管理機能差分(§10)
6. クラウド実行時の MCP 対応可否(§6)
7. Codex を MCP サーバーとして使う機能の詳細(§6)
8. Chrome 拡張・App Server・Bedrock デプロイの位置づけ(前提の表)
