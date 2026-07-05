# Windsurf(現: Devin Desktop / 提供元: Cognition)調査メモ — C-R6

- **対象**: Windsurf — **2026-06-02 に「Devin Desktop」へ改名済み**(提供元: Cognition)
- **調査日**: 2026-07-05
- **調査方法**: [CODING-AGENTS-PLAN.md](../../CODING-AGENTS-PLAN.md) §7 の 12 項目チェックリストに従い、公式サイト(windsurf.com / devin.ai / cognition.com)・公式ドキュメント(docs.devin.ai)・公式ブログ・利用規約のみを根拠として確認。第三者記事は根拠にしていません
- **記録様式**: `確認した事実 | 出典 URL | 確認日 | 確度(公式明記 / 公式から推測 / 第三者)`
- **最重要注記(執筆時必読)**:
  - windsurf.com は https://devin.ai/desktop へ **308 恒久リダイレクト**(確認日 2026-07-05)。同ページ冒頭に「Windsurf is now Devin Desktop」と明記
  - 旧 Windsurf のドキュメントは docs.devin.ai に統合済み(例: windsurf.com/security → docs.devin.ai/admin/security へ 308 リダイレクト。確認日 2026-07-05)
  - cognition.ai は cognition.com へ 301 リダイレクト(確認日 2026-07-05)
  - ただし **JetBrains 等の既存 IDE 向けプラグインは「Windsurf Plugins」ブランドのまま存続**(下記 §2)。「Windsurf」という名前が完全に消えたわけではない

## 提供体制の経緯(最重要確認項目)

2026-07-05 時点の結論: **提供元は Cognition。旧 Windsurf(専用 IDE)は「Devin Desktop」に改名され、Devin 製品ファミリーの一部として活発に開発継続中**(最新リリース v3.4.22 は 2026-07-04 付で、調査日前日まで更新が続いている)。

| 時期 | 出来事(確認した事実) | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| 〜2025 | 旧称 Codeium。会社としての「Windsurf」への改名発表ブログ「The Next Chapter: Renaming to Windsurf」が現存(掲載日は今回未確認)。個人向け利用規約上の提供主体(法人名)は 2026-04-14 更新版でも「Exafunction, Inc.」 | https://devin.ai/blog/windsurf-rebrand-announcement/ / https://devin.ai/windsurf/terms-of-service-individual/ | 2026-07-05 | 公式明記(法人名)/ 改名日は未確認 |
| 2025-07-11 | 公式ブログ「The Next Stage of Windsurf」: 創業者 Varun(Mohan)・Douglas(Chen)および R&D チームの一部が **Google に移籍**。残りのチームは「引き続き Windsurf 製品をエンタープライズ向けに構築する」と表明。Jeff Wang(事業責任者)が interim CEO に就任、Graham Moreno が President に昇進 | https://devin.ai/blog/windsurfs-next-stage/ | 2026-07-05 | 公式明記 |
| 2025-07-11 前後 | Google との取り決めが「非独占ライセンス契約」であるという記述は、上記公式ブログでは確認できず(移籍の事実のみ記載)。ライセンス契約の詳細は第三者報道由来のため本調査では根拠にしない | — | 2026-07-05 | 未確認 |
| 2025-07-14 | **Cognition が Windsurf 買収の確定契約を発表**。対象: Windsurf の IP・製品・商標・ブランド・事業(ARR $82M、エンタープライズ顧客 350 社以上と記載)。従業員は 100% が金銭的に参加し、ベスティング完全加速。「当面 Windsurf チームは従来どおり運営し、数か月かけて Windsurf の能力と IP を Cognition 製品に統合する」と明記 | https://cognition.com/blog/windsurf | 2026-07-05 | 公式明記 |
| 2025-07-14 | Windsurf 側の公式ブログ「The Next Chapter」でも買収を発表。「顧客とパイプラインは安定した体制のもとに残り、これまで以上の製品革新が期待できる」と記載 | https://devin.ai/blog/windsurfs-next-chapter/ | 2026-07-05 | 公式明記 |
| 2026-04-15 | **Windsurf 2.0** 発表: Agent Command Center(ローカル・クラウドの全エージェントを単一カンバンビューで管理)と「Devin in Windsurf」(クラウドの Devin へエディタから直接委任し、PR を Windsurf 内でレビュー)。「Devin はすべての Windsurf プランに含まれる」(クラウドアクセスは段階展開)と明記 | https://devin.ai/blog/windsurf-2-0/ | 2026-07-05 | 公式明記 |
| 2026-06-02 | **Windsurf → Devin Desktop に改名**(バージョン v3.0.12)。OTA 自動更新で配信され、「プラン・料金・拡張機能・設定はすべて自動で引き継がれる」と明記。エディタ・拡張・キーバインド・LSP・ワークフローは「Windsurf および VSCode と後方互換」 | https://devin.ai/blog/windsurf-is-now-devin-desktop/ / https://docs.devin.ai/desktop/changelog | 2026-07-05 | 公式明記 |
| 2026-06-02 | 同時に、中核エージェント **Cascade の後継として「Devin Local」を発表**(Rust で書き直し、Devin CLI と共通のエージェントハーネス)。レガシー Cascade はブログでは「2026-07-01 まで利用可能」、FAQ では「through July(7 月いっぱい)利用可能」と**表記が揺れている**。調査日(2026-07-05)時点でレガシー Cascade が実際に使えるかは未確認 | https://devin.ai/blog/windsurf-is-now-devin-desktop/ / https://docs.devin.ai/desktop/devin-desktop-faq | 2026-07-05 | 公式明記(揺れあり)|
| 2026-07 | 開発は活発に継続: Devin Desktop v3.4.22(2026-07-04)、v3.3.18(2026-06-23)等 | https://docs.devin.ai/desktop/changelog | 2026-07-05 | 公式明記 |

**Devin との関係(製品ラインの位置づけ)**: Cognition の製品ファミリーは 2026-07 時点で少なくとも次の 4 面で構成される。

| 製品面 | 内容 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- | --- |
| Devin(クラウド) | ベンダー管理環境で動く自律型エージェント(Web / GitHub / Slack 連携)。本調査の対象外(C-R7 devin.md で扱う) | https://docs.devin.ai/admin/security | 2026-07-05 | 公式明記 |
| Devin Desktop(旧 Windsurf) | 専用 IDE。「Manage fleets of local and cloud agents from one surface」「Plan, delegate, review, and ship without leaving your editor」と紹介 | https://devin.ai/desktop | 2026-07-05 | 公式明記 |
| Devin CLI | ローカルで動く CLI コーディングエージェント(「local command-line coding agent with deep Devin Cloud integration」)。Devin Local と同一のエージェントハーネスを共有 | https://docs.devin.ai/cli | 2026-07-05 | 公式明記 |
| Windsurf Plugins | 既存 IDE(JetBrains / VS Code / Vim 等)向けプラグイン群。ブランド名は Windsurf のまま。JetBrains プラグインは改名の「影響を受けず、引き続き動作する」と FAQ に明記 | https://docs.devin.ai/windsurf/plugins/compatibility / https://docs.devin.ai/desktop/devin-desktop-faq | 2026-07-05 | 公式明記 |

**サポート体制**: Devin Desktop FAQ が問い合わせ先として「account team または customer support」を案内。管理者向けに改名前の事前テスト版配布・MDM ポリシー更新(アプリ名 Windsurf → Devin)・ネットワーク許可リストへの docs.devin.ai 追加を案内しており、既存顧客の移行サポートが提供されている(出典: https://docs.devin.ai/desktop/devin-desktop-faq 、確認日 2026-07-05、公式明記)。

## 1. 実行環境

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Devin Desktop(IDE)はローカル実行。対応 OS: macOS(OS X Yosemite 以上)、Windows 10 以上、Linux(glibc ≥ 2.28、glibcxx ≥ 3.4.25。Ubuntu 20 / Debian 10 / Fedora 36 / RHEL 8 等) | https://docs.devin.ai/desktop | 2026-07-05 | 公式明記 |
| ローカルエージェント(Devin Local)は「Runs on your machine as the primary local agent」— ユーザーのマシン上で実行 | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| クラウド実行は Devin(クラウド)への委任として提供(「Devin in Windsurf」— エディタからクラウドに委任し PR をエディタ内でレビュー)。全プランに含まれる | https://devin.ai/blog/windsurf-2-0/ | 2026-07-05 | 公式明記 |
| クラウド側(Devin)の隔離単位(コンテナ / VM)と永続性は本メモでは未調査(C-R7 devin.md で扱う) | — | 2026-07-05 | 未確認 |
| Devin CLI は macOS / Linux / WSL(curl スクリプト)、macOS(Homebrew: `brew install --cask devin-cli`)、Windows(x86_64 / ARM64 インストーラーまたは PowerShell スクリプト)に対応 | https://docs.devin.ai/cli | 2026-07-05 | 公式明記 |

## 2. 対応 IDE / CLI

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 中核は**専用 IDE**(Devin Desktop)。エディタ・拡張・キーバインド・LSP は「Windsurf および VSCode と後方互換」と明記(VS Code 系エディタ基盤) | https://devin.ai/blog/windsurf-is-now-devin-desktop/ | 2026-07-05 | 公式明記 |
| 既存 IDE 向けには「Windsurf Plugins」を提供。対応: VS Code 1.89+、JetBrains IDE 2023.3+(リモート開発は 2025.1.3+)、Visual Studio 17.5.5+、NeoVim 0.6+、Vim 9.0.0185+、Emacs(libxml 付きビルド)、Xcode(全バージョン)、Sublime Text 3+、Eclipse 4.25+ | https://docs.devin.ai/windsurf/plugins/compatibility | 2026-07-05 | 公式明記 |
| プラグイン側で使える機能の範囲(補完のみか Cascade 相当のエージェント機能まであるか)は互換性ページには記載なし。docs には `windsurf/plugins/cascade/`(MCP・Memories)配下のページが存在するため、少なくとも JetBrains プラグインには Cascade 系機能があると推測される | https://docs.devin.ai/windsurf/plugins/cascade/mcp.md / https://docs.devin.ai/windsurf/plugins/cascade/memories.md | 2026-07-05 | 公式から推測 |
| CLI あり(Devin CLI)。Devin Local と同一ハーネス。Devin Desktop への統合は「レガシー Windsurf Enterprise および Devin Enterprise プラン」向けと記載 | https://docs.devin.ai/cli | 2026-07-05 | 公式明記 |
| JetBrains プラグインは Devin Desktop 改名の影響を受けず継続。ただし Devin Local(新ハーネス)は JetBrains プラグイン未対応(2026-07-05 時点) | https://docs.devin.ai/desktop/devin-desktop-faq / https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| ACP(Agent Client Protocol)対応により、Devin Desktop 内で他社エージェント(Codex CLI / Claude Agent / OpenCode / Junie / Gemini CLI)を実行可能(§6 参照) | https://docs.devin.ai/desktop/acp | 2026-07-05 | 公式明記 |

## 3. リポジトリ理解(インデックス方式)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| コンテキスト認識は「retrieval-augmented generation (RAG)」と「M-Query techniques」を使用と記載(概要ページ。方式の内部詳細は非公開) | https://docs.devin.ai/desktop/context-awareness/overview.md | 2026-07-05 | 公式明記 |
| **ローカルインデックス**が既定(「works great」と記載)。ローカルインデックスのデータ保存場所(端末内か否か)の明示的な記載は今回確認できず | https://docs.devin.ai/desktop/context-awareness/remote-indexing.md | 2026-07-05 | 公式明記(存在)/ 保存場所は未確認 |
| **リモートインデックス**(Teams / Enterprise 向け): GitHub / GitLab / Bitbucket のリポジトリから埋め込み(embeddings)を作成し、チームメンバー全員が共有インデックスにアクセス可能。「埋め込み作成完了後、コードはすべて削除する(once we finish creating embeddings for the codebase we delete all the code)」と明記。設定は https://windsurf.com/indexing から。ブランチ選択・自動再インデックス間隔(日数)を設定可能 | https://docs.devin.ai/desktop/context-awareness/remote-indexing.md | 2026-07-05 | 公式明記 |
| **Fast Context**: 専用訓練モデル「SWE-grep」「SWE-grep-mini」によるサブエージェント型のコードベース探索。埋め込み検索とエージェント探索の中間に位置づけられ、grep / read / glob 系ツールを最大 4 ターン・最大 8 並列で呼び出す。従来の検索より「20 倍高速」と公式記載 | https://docs.devin.ai/desktop/context-awareness/fast-context.md | 2026-07-05 | 公式明記 |
| 除外設定として `.windsurfignore` のドキュメントページが存在(詳細は今回未取得) | https://docs.devin.ai/desktop/context-awareness/windsurf-ignore.md | 2026-07-05 | 公式明記(存在のみ)|
| 大規模リポジトリ・モノレポでのファイル数上限などの明示的な制約値は確認できず。Pro ユーザーは「expanded context lengths, increased indexing limits」との記載あり(具体値なし) | https://docs.devin.ai/desktop/context-awareness/windsurf-overview.md | 2026-07-05 | 未確認(上限値)|

## 4. ファイル編集

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| エージェントがファイルを編集すると「diff zones」(エディタ内のインラインハイライト領域)が表示され、hunk ごとに accept / reject 可能 | https://docs.devin.ai/release-notes/overview(検索結果経由。個別ページ要再確認) | 2026-07-05 | 公式明記(出典ページの特定は要再確認)|
| Cascade の変更はプロンプト単位で revert 可能(元プロンプトにホバーして revert 矢印をクリック、または目次から)。「Reverts are currently irreversible(取り消しの取り消しは不可)」と明記 | https://docs.devin.ai/desktop/cascade/cascade | 2026-07-05 | 公式明記 |
| Devin CLI では revert プレビューに行差分統計(+N -M)と「View diff」ボタンを表示(restore / delete / recreate の全アクション対応) | https://docs.devin.ai/cli/changelog/stable | 2026-07-05 | 公式明記 |
| Devin Local(新ハーネス)側の編集適用方式・プレビュー・取り消しの詳細は Devin Local ページに記載なし | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 未確認 |

## 5. コマンド実行

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Cascade はユーザーの許可のもとターミナルコマンドを実行できる。**自動実行レベルは 4 段階**: Disabled(全コマンド手動承認)/ Allowlist Only(許可リスト外は手動承認)/ Auto(リスクありと判断したコマンドのみ手動承認)/ Turbo(拒否リスト内のみ手動承認) | https://docs.devin.ai/desktop/terminal.md | 2026-07-05 | 公式明記 |
| 許可 / 拒否リストは設定 `windsurf.cascadeCommandsAllowList` / `windsurf.cascadeCommandsDenyList` で構成。Teams / Enterprise 管理者は Admin Portal → Team Settings で組織全体のリストを設定可能 | https://docs.devin.ai/desktop/terminal.md | 2026-07-05 | 公式明記 |
| Devin Local の権限モデル: **Deny / Ask / Allow** の 3 段階ルールを、スコープ(ファイル読取 / ファイル書込 / コマンド実行 / HTTP 取得 / MCP ツール)ごとに、プロジェクト / ユーザー / 組織レベルで構成可能 | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| バックグラウンド実行: Devin Local はサブエージェントを「foreground or background」で実行可能。コマンド単体のバックグラウンド実行仕様はターミナルページに記載なし | https://docs.devin.ai/desktop/devin-local / https://docs.devin.ai/desktop/terminal.md | 2026-07-05 | 公式明記(サブエージェント)/ 未確認(コマンド単体)|

## 6. MCP・外部ツール連携

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| MCP クライアント対応。トランスポートは **stdio / Streamable HTTP / SSE** の 3 種。各トランスポートで OAuth 対応 | https://docs.devin.ai/desktop/cascade/mcp.md | 2026-07-05 | 公式明記 |
| 設定ファイル: `~/.codeium/windsurf/mcp_config.json`(JSON リスト)。`${env:VAR_NAME}` / `${file:/path/to/file}` の変数展開に対応 | https://docs.devin.ai/desktop/cascade/mcp.md | 2026-07-05 | 公式明記 |
| MCP Marketplace あり(設定 > Cascade > MCP Servers または右上メニュー)。公式 MCP には青チェックマーク表示。deeplink によるワンクリックインストール対応 | https://docs.devin.ai/desktop/cascade/mcp.md | 2026-07-05 | 公式明記 |
| ツール数上限: 「Cascade has a limit of 100 total tools」。MCP ごとに個別ツールのオン / オフ切替可能 | https://docs.devin.ai/desktop/cascade/mcp.md | 2026-07-05 | 公式明記 |
| 管理者制御: MCP アクセスのトグル、承認済みサーバーのホワイトリスト(正規表現マッチ。1 件でもホワイトリスト登録すると未登録サーバーは全ブロック)、カスタム MCP レジストリの構成が可能 | https://docs.devin.ai/desktop/cascade/mcp.md | 2026-07-05 | 公式明記 |
| Devin Local では既定で「MCP ツール呼び出し前に承認を求める」。設定はローカルの config ファイル(`.devin/config.json` 等) | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| **ACP(Agent Client Protocol)対応**: 「エディタとコーディングエージェント間の通信を標準化するオープンプロトコル」。Devin Desktop 内で Codex CLI / Claude Agent / OpenCode / Junie(JetBrains)/ Gemini CLI 等の ACP 対応エージェントを実行可能。設定は `~/.windsurf/acp/registry.json`、チーム管理者は「ACP Registry Config」で配布可能。エージェントバイナリの自動ダウンロードは非対応。外部エージェント使用時は Devin のプライバシーポリシー適用外・課金も第三者と直接、と明記 | https://docs.devin.ai/desktop/acp | 2026-07-05 | 公式明記 |
| CI 連携(GitHub Actions 等)の専用機能は Desktop docs では確認できず(クラウド側の Devin が GitHub / Slack 連携を担う) | — | 2026-07-05 | 未確認 |

## 7. 設定ファイル(ルールファイル)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **グローバルルール**: `global_rules.md`(場所: `~/.codeium/windsurf/memories/`)。全ワークスペースに常時適用。上限 6,000 文字 | https://docs.devin.ai/desktop/cascade/memories.md | 2026-07-05 | 公式明記 |
| **ワークスペースルール**: 推奨は `.devin/rules/*.md`。レガシー `.windsurf/rules/*.md` は後方互換のフォールバックとして読み込まれる。旧単一ファイル `.windsurfrules`(ワークスペースルート)もレガシー対応。上限 12,000 文字 / ファイル | https://docs.devin.ai/desktop/cascade/memories.md | 2026-07-05 | 公式明記 |
| ルールの探索範囲: 現在のワークスペース、サブディレクトリ、git ルートまでの親ディレクトリ | https://docs.devin.ai/desktop/cascade/memories.md | 2026-07-05 | 公式明記 |
| **AGENTS.md 対応あり**: 任意のディレクトリに配置可能。ルートレベルは常時オン、サブディレクトリのものは自動 glob 適用 | https://docs.devin.ai/desktop/cascade/memories.md | 2026-07-05 | 公式明記 |
| ルール適用モードは 4 種: `always_on`(毎回システムプロンプトに含める)/ `model_decision`(説明のみ常時提示、必要時に全文読込)/ `glob`(パターン一致ファイル編集時)/ `manual`(@メンション時のみ) | https://docs.devin.ai/desktop/cascade/memories.md | 2026-07-05 | 公式明記 |
| **Memories(自動生成)**: 会話中に Cascade が自動生成し、ワークスペース単位で `~/.codeium/windsurf/memories/` にローカル保存。クレジット不消費。チーム共有には Rules または AGENTS.md への転記を公式が推奨 | https://docs.devin.ai/desktop/cascade/memories.md | 2026-07-05 | 公式明記 |
| Devin Local はセッション間の Memories 永続化に未対応(preview の制限)。Workflows も未対応。代わりに Devin CLI と共通の **Skills**(モデルが呼び出す再利用可能な指示バンドル + 任意スクリプト)を使用 | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| ローカル設定パスの移行: 改名に伴い `~/.windsurf/` → `~/.devin/` 等へ移行し、レガシーパスは読み取り専用で互換維持(FAQ)。一方で MCP / Memories の docs は `~/.codeium/windsurf/` 配下を案内しており、**旧 Codeium 時代のパスが現役で混在**している点に注意 | https://docs.devin.ai/desktop/devin-desktop-faq / https://docs.devin.ai/desktop/cascade/mcp.md | 2026-07-05 | 公式明記 |

## 8. 権限管理(承認モデル)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| コマンド実行の承認: Cascade は自動実行レベル 4 段階(Disabled / Allowlist Only / Auto / Turbo)+ 許可 / 拒否リスト(§5 参照) | https://docs.devin.ai/desktop/terminal.md | 2026-07-05 | 公式明記 |
| Devin Local は Deny / Ask / Allow ルール × スコープ(読取 / 書込 / コマンド / HTTP / MCP)× 階層(プロジェクト / ユーザー / 組織)の permission scopes(§5 参照) | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| MCP ツールは Devin Local では既定で実行前承認 | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| 組織管理者はコマンド許可 / 拒否リストを組織全体に設定可能(Admin Portal)。MCP のホワイトリスト・カスタムレジストリも管理者制御可能(§6) | https://docs.devin.ai/desktop/terminal.md / https://docs.devin.ai/desktop/cascade/mcp.md | 2026-07-05 | 公式明記 |
| エンタープライズ管理者は Devin Local のサンドボックス実施を組織全体で強制可能 | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| 危険操作(rm 等)の既定分類・Auto レベルでの「リスク」判定基準の詳細は記載なし | https://docs.devin.ai/desktop/terminal.md | 2026-07-05 | 未確認 |

## 9. セキュリティ(サンドボックス・データ取り扱い・学習利用)

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| **サンドボックス**: Devin Local は OS レベルサンドボックスに対応。ファイルシステム分離(読み書き可能パスは permission scopes から導出)+ ネットワークフィルタリング(ドメインの allowlist / denylist) | https://docs.devin.ai/desktop/devin-local | 2026-07-05 | 公式明記 |
| **学習利用(個人向け規約、最終更新 2026-04-14)**: Autocomplete のユーザーコンテンツは既定で(判別系)モデル改善に使用され、設定の code sharing オプションで**オプトアウト可能**。Chat のデータは生成・判別モデルの改善に使用され、**オプトアウトするとチャット機能自体が使えなくなる**と記載 | https://devin.ai/windsurf/terms-of-service-individual/ | 2026-07-05 | 公式明記 |
| **Pro(有料)ユーザーの Zero Data Retention**: ユーザーコンテンツを「リアルタイムの提案生成のみに使用し、生成後に削除。学習利用しない。転送中は暗号化、保存時は保持しない」とする制限を選択可能。ただし「(no ZDR)」ラベル付きモデル使用時はプロバイダー側で保存があり得る。Memories / Rules 等の永続化が必要な機能を有効にした場合は当該データは保存される | https://devin.ai/windsurf/terms-of-service-individual/ | 2026-07-05 | 公式明記 |
| モデルプロバイダーとの関係では「Windsurf has zero data retention with all model providers」(全モデルプロバイダーと ZDR)と記載 | https://windsurf.com/security(現 docs.devin.ai/admin/security 系に統合。検索結果経由のため要再確認) | 2026-07-05 | 公式明記(出典ページの現行 URL は要再確認)|
| 有料プランでは Data Controls 設定ページから学習利用をオプトアウト可能。オプトアウト後は ZDR が有効化される。エンタープライズ顧客は「明示的な書面による事前同意なしにデータを学習に使わない」 | https://docs.devin.ai/admin/security | 2026-07-05 | 公式明記 |
| **リモートインデックスのデータ**: 埋め込み作成後にコードを全削除(§3 参照)。ローカルインデックスの保存場所の明記は未確認 | https://docs.devin.ai/desktop/context-awareness/remote-indexing.md | 2026-07-05 | 公式明記 / 未確認(ローカル)|
| **コンプライアンス認証**: SOC 2 Type II(2024-03 取得。Cognition のセキュリティページに記載。ページの主対象は Devin) | https://docs.devin.ai/admin/security | 2026-07-05 | 公式明記 |
| FedRAMP 環境向けの Devin Desktop セキュリティ管理者ガイドが存在(OIDC / SAML 2.0 SSO、IdP 経由の MFA 強制、RBAC を記載)。FedRAMP 認証の取得状況そのものの記載は未確認 | https://docs.devin.ai/desktop/security/security-admin-guide.md | 2026-07-05 | 公式明記(ガイド存在)/ 未確認(認証状況)|
| **エンドポイント管理ポリシー**: Windows(Group Policy: ADMX/ADML、MDM)、macOS(.mobileconfig、MDM)、Linux(/etc/windsurf/policies/policy.json、Ansible 等)で配布。制御項目: AllowedExtensions(拡張の発行者制限)、UpdateMode、EnableTelemetry、EnableFeedback | https://docs.devin.ai/desktop/enterprise-policies.md | 2026-07-05 | 公式明記 |
| 秘密情報の自動マスク機能の有無は確認できず | — | 2026-07-05 | 未確認 |
| データ利用ガイドラインの専用ページ(cognition.com/windsurf-data-use)は存在するが、リダイレクト先(old.cognition.ai)で本文が取得できず内容未確認 | https://cognition.com/windsurf-data-use/ | 2026-07-05 | 未確認(ページ存在のみ確認)|

## 10. チーム導入機能

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| Teams プラン: メンバー数無制限、共有・コラボレーション、集中請求、分析付き管理ダッシュボード、優先サポート | https://devin.ai/pricing | 2026-07-05 | 公式明記 |
| Enterprise プラン: 上記に加え、最優先サポート、専任アカウント管理、**SAML / OIDC SSO**、集中管理(centralized enterprise admin controls)、**専用デプロイオプション(Dedicated deployment option)** | https://devin.ai/pricing | 2026-07-05 | 公式明記 |
| 管理者による組織全体の制御: コマンド許可 / 拒否リスト、MCP ホワイトリスト・カスタムレジストリ、ACP レジストリ配布、Devin Local サンドボックス強制、端末管理ポリシー(§5, §6, §8, §9 参照) | (各節の出典) | 2026-07-05 | 公式明記 |
| リモートインデックス(コードベース共有インデックス)は Teams / Enterprise 向け(§3 参照) | https://docs.devin.ai/desktop/context-awareness/remote-indexing.md | 2026-07-05 | 公式明記 |
| 監査ログ(ユーザー操作・エージェント操作の記録)の明示的なドキュメントは今回確認できず | — | 2026-07-05 | 未確認 |
| Devin CLI の Desktop 統合は「レガシー Windsurf Enterprise / Devin Enterprise プラン」向けと記載(旧 Windsurf 契約が「Legacy Windsurf Enterprise」として存続していることの証跡でもある) | https://docs.devin.ai/cli | 2026-07-05 | 公式明記 |

## 11. 料金・利用制限

> 執筆時の注意: CLAUDE.md / PLAN の方針により、**金額は docs 本文に転記しない**。以下は調査記録としてのみ保持し、本文では参照先 URL + 確認日を示す。

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| プラン体系(2026-07-05 時点の記載): Free($0)/ Pro($20/月)/ Max($200/月)/ Teams($80/月 + $40/月/開発者)/ Enterprise(要相談)。改名後も「プラン・料金は変更なし」と FAQ に明記 | https://devin.ai/pricing / https://docs.devin.ai/desktop/devin-desktop-faq | 2026-07-05 | 公式明記 |
| 無料枠: 「Light quota to code with agents」「Limited model availability」「Unlimited inline edits」「Unlimited Tab completions」 | https://devin.ai/pricing | 2026-07-05 | 公式明記 |
| 課金単位: 個人プランは月額固定 + 従量(メッセージ単価は「使用モデル・タスクの規模と複雑さで変動」)。超過分は「API pricing」で追加購入。Teams はシート課金 | https://devin.ai/pricing | 2026-07-05 | 公式明記 |
| 旧 Windsurf の「クレジット」と Devin 側の「ACU」の関係: Desktop の changelog v3.3.18(2026-06-23)に「ACU usage がクライアントに表示される」とあり、Devin 側の課金単位(ACU)への統合が進んでいる様子。正確な換算・統合状況は未確認 | https://docs.devin.ai/desktop/changelog | 2026-07-05 | 公式から推測 |
| Devin(クラウド)側プランとの一体化: pricing ページは Devin ブランドの単一ページで、全プランに Devin Desktop が含まれる構成 | https://devin.ai/pricing | 2026-07-05 | 公式明記 |
| レート制限の具体値は記載なし | https://devin.ai/pricing | 2026-07-05 | 未確認 |

## 12. 代表的なユースケース

| 確認した事実 | 出典 URL | 確認日 | 確度 |
| --- | --- | --- | --- |
| 公式の位置づけ(2026-07 時点): 「Manage fleets of local and cloud agents from one surface」「Plan, delegate, review, and ship without leaving your editor」— 単なる AI IDE ではなく**複数エージェント(ローカル + クラウド)の管制塔**として訴求 | https://devin.ai/desktop | 2026-07-05 | 公式明記 |
| Agent Command Center: 全エージェントを単一カンバンビューでステータス管理。Spaces: セッション・PR・ファイル・コンテキストをグループ化しエージェント間でコンテキスト共有 | https://devin.ai/blog/windsurf-is-now-devin-desktop/ | 2026-07-05 | 公式明記 |
| IDE としての基本用途: Tab 補完(無制限)・inline edit(無制限)・エージェントチャット(Devin Local / Cascade) | https://devin.ai/pricing | 2026-07-05 | 公式明記 |
| クラウド委任: エディタから Devin(クラウド)にタスクを委任し、PR をエディタ内でレビュー(「Devin in Windsurf」) | https://devin.ai/blog/windsurf-2-0/ | 2026-07-05 | 公式明記 |
| ACP ホストとしての用途: 他社エージェント(Codex / Claude Agent / OpenCode / Junie / Gemini CLI)の実行環境として使う | https://docs.devin.ai/desktop/acp | 2026-07-05 | 公式明記 |
| 既存 IDE(JetBrains 等)ユーザー向け: Windsurf Plugins による補完(+ Cascade 系機能) | https://docs.devin.ai/windsurf/plugins/compatibility | 2026-07-05 | 公式明記 |
| コミュニティで定着した用途・評判: 本調査は公式情報のみを対象としたため未調査(執筆時に必要なら第三者情報として別途収集し、事実と区別して記載する) | — | 2026-07-05 | 未調査 |

## 執筆時の注意事項・未確認事項まとめ

1. **名称の扱いが最大の論点**: 計画上のファイル名は `windsurf.md` だが、2026-07 時点の正式名称は「Devin Desktop」。既存 IDE 向けプラグインのみ「Windsurf Plugins」ブランドが残る。docs 執筆時は冒頭で改名を明示し、`devin.md`(C-R7)との棲み分け(Desktop = 本ページ、クラウドの Devin = devin.md)をユーザーに確認するのが安全
2. **エージェントが移行期**: レガシー Cascade → Devin Local(preview)の置き換え中。Cascade 系ドキュメント(自動実行レベル・Memories・MCP 設定)と Devin Local 系(permission scopes・サンドボックス・Skills)が併存しており、執筆時はどちらの仕様かを明記する必要がある
3. Cascade の提供終了時期はブログ(2026-07-01 まで)と FAQ(7 月いっぱい)で表記が揺れており、2026-07-05 時点の実際の状態は未確認
4. 未確認のまま残した項目: ローカルインデックスの保存場所 / リポジトリ規模の上限値 / 監査ログ / 秘密情報マスク / FedRAMP 認証の取得状況 / Google とのライセンス契約の公式一次情報 / windsurf-data-use ページの本文 / diff zones の正確な出典ページ
5. 料金・プラン名・「preview」ステータス(Devin Local / Devin CLI)は変わりやすい。執筆時に https://devin.ai/pricing と https://docs.devin.ai/desktop/changelog を再確認すること
