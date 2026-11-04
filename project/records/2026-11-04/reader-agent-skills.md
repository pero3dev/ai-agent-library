# 読者向けAgent Skillsとプラグイン

## 作業契約

- 目的: Issue [#335](https://github.com/pero3dev/ai-agent-library/issues/335) の読者向けスキル・参照生成・プラグイン・評価・導入手順を実装し、PR・main反映・公開確認・completed Closeまで進める。
- 入口: 本worktreeの `AGENTS.md`、`ROADMAP.md` のサイト・ハーネス入口、`CONTRIBUTING.md` のハーネス・配置・提出前・記録規約、`harness/structure.json`、`harness/git-rules.md` を適用する。
- 元HEAD: `d6b18856fc7ae5d0d53a44831874bcf199c327fb`。専用worktree `.local/reader-skills`、branch `feat/reader-agent-skills`。元worktreeの未保存変更は保持する。
- 所有範囲: `plugins/ai-agent-library/`、ルート `.claude-plugin/marketplace.json`、参照・同梱MCPの生成スクリプトと回帰、必要な配置・型・CI契約、ルート案内、本記録とproject索引。
- 外部操作の許可根拠: 「#335のIssueも」と、同セッションで承認済みのbranch・commit・push・PR・merge・公開確認・Closeまでの依頼。公式ディレクトリへの申請や外部マーケットプレイス登録は含まない。
- 既存の保守者向け `.agents/skills/` と生成された `.claude/skills/` は変更しない。読者向けスキルを分離し、ユーザーの常用設定や認証情報を上書きしない。
- 検証: 決定的な生成と `--check`、標準／Claudeのvalidate、発火すべき10件・対象外10件の評価、隔離した導入・実行の可能な範囲の確認、`npm ci` と `npm run check`、独立レビュー、PR必須CI、main CI・必要な公開確認。
- 終了条件: 6つのIssue完了条件を証拠付きで満たし、Issue本文とコメントのGET再確認を経てcompleted Closeする。静的検査・モデル評価・実ホスト導入を区別する。

## 配置と設計

4スキル `agent-design-review`、`agent-architecture-choice`、`agent-security-review`、`agent-eval-plan` を、`plugins/ai-agent-library/skills/` にまとめる。`SKILL.md` は手順とルーティングを手書きし、章別チェックリスト・判断表・アンチパターンは `docs/` から生成する。参照資料は命令として扱わず、出典・更新日・CC BY 4.0を保持する。

Claude Code用マーケットプレイスをルート `.claude-plugin/marketplace.json` に置く。プラグインは自己完結させ、#334のPython本体・MCP登録・固定依存を生成で同梱し、手編集による分岐を防ぐ。保守用スキルの自動探索と混在させない。

Codexの対応形式とClaudeの導入・評価コマンドは作業日の公式情報と手元CLIを確認して確定する。配布・導入評価は所有する隔離領域で行い、外部公開申請は実施しない。

## 検証結果

2026-11-04、Node 24.22.1、Python 3.12.14、Claude Code 2.1.310、Codex CLI 0.156.1で確認した。

- 生成対象は公開39記事・310項目。内訳は02設計12記事96項目、04評価12記事89項目、06安全性15記事125項目。重複配布を含む7参照ファイルを生成し、方式判断・アンチパターンの4原文抜粋も正本と一致した。生成MCP3ファイルとLICENSEは正本と全byte一致。`--write` と `--check` が成功した。
- 生成器単体21件はhostで20成功・Windows file-symlink権限による1 skip・失敗0。directory junction試験はhostで成功した。blockquote中のcheckbox・引用見出し等を実資料項目へ昇格しない回帰も含む。
- 公式 `skills-ref` 0.1.0（commit `69ef37e9424c0a7ea9dd2293b559e43ec8176379`）とskill-creatorのquick validatorで4スキルが成功。Windowsでは `PYTHONUTF8=1` を指定した。Claudeのplugin・marketplaceは `validate --strict` が成功した。公式directory申請用の任意icon adviceは対象外で、登録・申請はしていない。
- 所有する `CLAUDE_CONFIG_DIR` とconsumerディレクトリで、ローカルmarketplace add→install→detailsが成功。4スキル・MCP 1件、Python設定値の適用を確認。常用設定4ファイルの前後ハッシュは変わっていない。
- インストール済みMCPコピーを `mcp==2.2.0` SDKで実起動し、2026-07-28と2025-11-25両方式の4ツール列挙・正常call・未知slugのisError・出典・12,000文字上限を確認した（取得済みfixture、外部通信なし）。ClaudeのモデルによるMCP呼出を確認したという意味ではない。
- 新規プラグイン領域を配置・Markdownリンク・設定inventoryへ追加した。読者SKILLの名前・参照とmarketplace JSONの不正を検出し、保守用スキル同期とは混同しない回帰37件が成功した。保守者スキルには差分がない。
- `npm ci` と最終差分の `npm run check` が成功した。型・生成・記事・リンク・配置・ハーネスと単体試験を含む。生成差分と評価データの `--check` は既存harness CIの `npm run check:harness` に連結し、CIでモデルを呼び出さない。
- 最終候補を独立した2担当でレビューし、生成・スキル・プラグイン・配置契約と、評価処理・全20件の生ログ・公開要約をそれぞれ承認した。must・未解決shouldは0件。PR必須CI・main反映・公開GitHubからの導入結果は、確認後にIssueの証拠コメントへ記録する。

## 発火評価と適用範囲

[20ケースの要約](reader-skills-evaluation.json)を保存した。固定データは正例10件・対象外10件、全4スキルを含む。期待ラベルは実行前に採択理由とともに固定し、結果に合わせて変更していない。

Codex CLI 0.156.1の新規consumer `.agents/skills/` に4ディレクトリをコピーし、各自然依頼を独立した一時セッションで1回ずつ実行した。MCPは設定せず同梱参照を使う。成功した読込コマンドの実出力にSKILL本文全体が含まれることを観測代理とし、単なるファイル名一覧・grep・モデルの自己申告を発火として数えていない。後続grepのno-matchによるexit1と、先行して成功した本文読込を区別している。

結果はTP10・TN10・FP0・FN0、期待スキル一致10/10、正確なルーティング20/20、実行エラー0。観測開始は `2026-11-04T03:17:30.436Z`、最終ログ再採点は `2026-11-04T03:31:11.526Z`。モデルはCLI既定で指定せず、JSONLが実モデルIDを返さないため不明と記録した。各1回の設計者による20例で、実利用分布・発火の再現確率・レビュー品質全体・プラグインなしとの改善差を立証するものではない。

最初のread-only診断では2件のファイル読込がポリシー拒否された。所有fixtureのworkspace-writeと通常の自動承認レビューへ切り替え、新runで20件を実行した。初回2件は環境エラーとして別に保持し、モデルの誤選択や最終20件へ混ぜない。ルール・承認の無効化はしていない。CLIは `--ignore-user-config --ephemeral` で常用設定・履歴を混在させない。

生ログ・自然回答はローカル成果物 `issue335-evaluation/run-v2/` に保持する。生reportのSHA256は `b0f350e7a1b21a3dec96e6d51b84f6ad0c28dd7361aff6951996a6f8b12cc84b`。公開要約にはローカル絶対パスと全会話を含めず、再現には同梱20例とrunnerを使う。再採点は保存した `report.json`・ケース別events/stderr/answerを同じ相対配置で戻し、`--replay --output-dir` にその所有runを指定する。

Claude Codeは未認証（hostでauthMethod noneを確認）のため、実モデルの発火評価はしていない。Claudeの静的validate・隔離導入、Codexの実読込、SDKの実stdioを区別する。Claude固有userConfigのCodex互換を仮定せず、Codexには共通Agent SkillsのコピーとMCP別接続を案内する。

## 公開導入とWindows手順の補足

PR [#341](https://github.com/pero3dev/ai-agent-library/pull/341) は11必須チェックに成功し、mainの `82c23cff4f2440be2d3a6de94c8086f2bdcb0f81` へ反映された。実マージのtreeは独立レビュー済み候補と一致し、メッセージも共通formatterの内容と一致した。

新しい隔離設定で、公開GitHubのmarketplace add→install→detailsが成功した。marketplace checkoutとplugin cacheの取得元SHAは上記マージcommit、配布19ファイルは正本と全byte一致し、4スキル・MCP 1件とPython設定値を確認した。通常設定4ファイルの前後ハッシュも変わっていない。証拠はローカル成果物 `issue335-public-install-v3/` に保持する。

最初の補助スクリプトのGit候補選択ミスを補正した後、深い隔離パスではGit checkoutの `Filename too long` を観測した。Gitの子プロセスだけへ `core.longpaths=true` を渡したrunで公開導入が成功した。通常のWindows既定パスでの失敗を再現したという意味ではない。

この条件に当たる利用者向けに、短い所有パスへの `git -c core.longpaths=true clone` と、ローカルmarketplaceからの導入をREADMEへ補足する。補足の所有範囲はREADMEと本記録だけで、`docs/reader-skills-windows-install` を上記main SHAから分けた。実行手順の検証・独立レビュー・PR・main反映まで同じIssueの許可範囲で進め、公開確認後に証拠をIssueへ記録する。

補足手順は、短い所有ディレクトリへ3,260ファイルをcloneした後、新しい隔離設定でlocal marketplace add→install→detailsを実行して確認した。導入時にGitの長いパス設定は追加していない。取得元は上記マージSHAで、19ファイル全byte一致、4スキル・MCP 1件、Python設定値、通常設定4ファイルのハッシュ不変を確認した。証拠は `issue335-windows-local-install-v3/` に保持する。Claudeモデルの発火はこの検証にも含まない。

同じ所有cloneと隔離設定で `git pull --ff-only`、marketplace update、plugin updateも成功した。ローカルmarketplaceはフォルダーを直接参照するため、取得したリポジトリを先に更新し、新しいセッションで反映する手順もREADMEへ明記した。

## 一次情報

2026-11-04 02:54〜03:07 UTCに公式資料とローカルCLI helpを照合した。

- [Agent Skills仕様](https://agentskills.io/specification)、[公式skills-ref](https://github.com/agentskills/agentskills/tree/69ef37e9424c0a7ea9dd2293b559e43ec8176379/skills-ref)
- [Claude plugin manifest](https://code.claude.com/docs/en/plugins-reference)、[marketplace](https://code.claude.com/docs/en/plugin-marketplaces)、[plugin eval](https://code.claude.com/docs/en/plugin-evals)
- [Codexスキル](https://learn.chatgpt.com/docs/build-skills)、[OpenAI plugin形式](https://developers.openai.com/plugins/build/plugins)
