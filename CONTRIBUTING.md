# コントリビューションガイド

このリポジトリは、日本語話者のソフトウェアエンジニア向けの AI Agent 学習ドキュメントライブラリです。
成果物は Markdown ドキュメント(`docs/`)で、`examples/` に動くサンプルコード、`website/` に公開サイト(Nextra)があります。

## まず読むもの

- **[AGENTS.md](AGENTS.md)** — 作業の入口と共通契約の正本。人が書く場合も同じ規約を使います
- **[harness/writing-rules.md](harness/writing-rules.md)** — 文体・命名・状態・同期更新・サンプルの詳細規約
- **[templates/doc-template.md](templates/doc-template.md)** — docs の新規学習記事を作るベースです(固定 H2 セクションの削除・改名は不可)
- **[ROADMAP.md](ROADMAP.md)** — フェーズと担当タスク、定期メンテナンスの一覧

## ドキュメントを追加・変更するとき

1. `docs/<NN-section>/` にケバブケースの英語ファイル名で作成(本文は日本語)
2. テンプレートの固定 8 セクションをすべて残す
3. 変化の速い情報(モデル名・料金・最新 API・ベンチマーク)は作業日の一次情報で確認し、出典・アクセス日・条件を明記する。裏付けのない内容を `TODO(要確認)` に残す(書式は執筆規約を参照)
4. 同期更新を同じ変更でまとめて行う: セクション README のリンク化 / ROADMAP のステータス / GLOSSARY / front matter の `status`・`last_updated`

## 提出前のセルフチェック

Node.js と npm を準備し、ルート直下で lockfile の依存をインストールしてから実行します。CI の Node.js 版は [.github/workflows/ci.yml](.github/workflows/ci.yml) が正本です。

```bash
npm ci
npm run check      # 単体試験、Markdown lint、記事規約、相対リンク、TODO 棚卸し、ハーネス検査
npm run check:ci   # CI 共通の検査一覧・必要環境・未実施の表示
npm run check:ci -- --run articles,links,harness  # ID を明示したローカル実行
```

個別に実行する場合:

```bash
node scripts/validate-docs.mjs --all   # front matter / 固定 H2 / TODO(要確認) 書式
node scripts/check-links.mjs           # 相対リンク切れ + セクション README 収録表の漏れ
node scripts/todo-report.mjs           # TODO(要確認) の棚卸し
```

`npm run check` の構成は [package.json](package.json) が正本です。これは CI 全体や有料 API の実行を意味しません。CI はこれに加えて依存監査、Actionlint、Python サンプル検証、サイトビルド・ブラウザー試験などを実行します。サイト、依存、サンプル、CI を変更した場合は、対応する CI ジョブと各 README の検証も行ってください。

`docs/` の `.md` 編集フックは `validate-docs` を呼ぶ補助です。クライアントの設定・信頼・実行面によって発火しない場合があるため、提出前の明示実行を省略しません。フック単体試験の成功と実クライアントでの発火確認は区別して報告します。

## サイト(website/)を変更するとき

- 正本は `docs/`。`website/content/` `website/generated/` `website/out/` は生成物です(直接編集しない)
- 手書き上書きページのみ `website/content-src/` に置きます
- ローカル確認: `cd website && npm ci && npm run dev`
- 公開相当のビルド: `cd website && npm run build:clean`(`sync` → クリーンビルド → Pagefind → ルート網羅チェック)

## サンプルコード(examples/)を変更するとき

- 各サンプルは自己完結。`README.md`(実行方法・**動作確認日**)と依存固定ファイルを必ず含めます
- API キーはコードに書かず環境変数参照。`--mock` 対応サンプルは API キーなしで動作確認できます

## ハーネスを変更するとき

共通契約は `AGENTS.md`、詳細執筆規約は `harness/writing-rules.md`、共通スキルは `.agents/skills/` が正本です。`CLAUDE.md` と対応する `.claude/skills/` の 4 スキルは決定生成します。Codex 専用の定期最新化スキルは複製しません。

```bash
node scripts/sync-harness.mjs --write  # 正本から Claude 互換入口を更新
node scripts/sync-harness.mjs --check  # 不一致・未管理の互換ファイルを検出
node --test scripts/sync-harness.test.mjs
```

生成先は手修正しません。共通規約や手順を変更したら正本を編集して再生成します。未管理の互換ファイルは自動削除せず、所有者と必要な互換性を確認します。製品固有の hooks・agents・権限設定は各製品のディレクトリで保守します。

### 診断・対象の抽出・稼働状況

```bash
npm run check:harness
npm run harness:doctor
npm run harness:context -- --profile article-update --task 2-1
npm run harness:health
npm run harness:run -- status
```

`check:harness` は共通正本の同期、設定の構文と必須項目、スキル・担当の参照、hook command、生成物の Git 追跡、教材設定の不活性を検査します。Markdown のリンク解析と設定の YAML/TOML 解析は root lockfile の固定依存を使うため、`npm ci` が必要です。記事の編集フックが使う基本検証は Node.js 標準ライブラリで動きます。

`harness:doctor` は版の取得、必要な設定値と由来、Git 状態を表示します。個人設定は `.codex/config.toml` の model・sandbox・approval・hooks・当該 project trust のみを表示し、認証ファイルや会話履歴は読みません。親セッションによる上書き、hook trust・実発火、モデルの利用可否を設定値だけで成功扱いにしません。PATH の Codex と共通 Git ディレクトリに追加した公式 CLI は別の実行ファイルとして確認します。

Node.js は 22 以降、Python は 3.11 以降が必要です。診断は版の取得成功と要求版への適合を分けます。Python の PATH が要求を満たさない Windows 環境では、既存の `py -3.11`、`py -3` を順に確認します。`check:ci` の Python 検査も同じ選択を使い、環境のインストールや PATH の変更は行いません。選ばれた Python に `examples/tests/requirements.txt` の依存を準備してください。

共通 Git ディレクトリの `harness-tools/python/` に専用 venv がある場合は優先します。`harness:doctor` と `check:ci` の `--python <実行ファイルの絶対パス>` でも明示できます。専用 venv を準備する場合は、Python 3.11 以降の `-m venv <共通Gitディレクトリ>/harness-tools/python` で作成し、その venv の Python で `-X utf8 -m pip install -r examples/tests/requirements.txt` を実行します。個人のグローバル環境は変更しません。

実 Agent の結果は `harness:doctor -- --observations <記録.json>` で渡せます。形式は `schema_version: 1` と `observations` 配列で、各項目は `kind` / `surface` / `binary`(任意) / `version`(任意) / `result`(`passed`・`failed`・`unknown`) / `observed_at`(ISO 日時) / `evidence`(根拠の位置)です。診断時に再実行した証拠にはせず、観測した製品・版・日時の結果として表示します。

`harness:context` は profile、commit、必要な規約、指定した ROADMAP タスクの状態と成果物を返します。ROADMAP の全文を作業コンテキストへ複製しません。実際のタスク表を解析し、未作成の記事は作成予定・未検出として表示します。曖昧な記事名や重複タスクはエラーにします。終了条件と許可根拠は実際の依頼を作業契約へ記録します。

`harness:health` は既存 runtime の読み取り用 status と定期タスクの Status を再利用し、設定、アプリ登録、起動、完了、保存済みの公開証拠、滞留、復旧待ちを分けます。取得できない面は `unknown` と表示します。新しい GitHub 公開確認を行うコマンドではありません。

検査一覧は [harness/verification.json](harness/verification.json) が正本です。`check:harness` は一覧の command / cwd と CI の実行 step の一致も検査します。`check:ci` の既定動作は一覧表示で、各結果は `not-run` です。`--run` には必要な検査 ID を明示します。別 OS の検査、必要環境のない検査、失敗した検査を完了扱いにしません。公開ジョブと有料 API は実行対象に含めません。サイトの静的ビルドを選ぶときは `STATIC_EXPORT=1` と公開先の base path を設定してください。CI では Ubuntu の全体検証に加え、Windows のパス・フック・排他・中断再開を限定して検証します。

新しい規約を、その変更自身の承認根拠に使いません。静的・単体・モック試験で確認した範囲と、実 Agent・GitHub・公開先で確認した範囲を分けます。教材用の自動認識される設定は `.example` 等で保存し、動作試験時だけ所有する隔離ディレクトリへ展開します。

### 作業の保存と再開

`harness:run` は `harness/profiles.json` の作業区分と、JSON の作業契約を使います。契約には `profile`、`goal`、`authorization`、重複しない相対パスの `owned_paths`、終了条件の `completion` を記録します。安定した `task_key` を指定すると同じ未完了作業を検出できます。定期最新化は既存の `freshness-run` を使い、共通の排他を共有します。

```bash
npm run harness:run -- start --contract /absolute/path/task.json
npm run harness:run -- checkpoint --run-id <run-id> --attempt-id <attempt-id>
npm run harness:run -- suspend --run-id <run-id> --attempt-id <attempt-id> --usage-limit
npm run harness:run -- resume --run-id <run-id> --dry-run
npm run harness:run -- resume --run-id <run-id> --apply
```

開始・再開で返された `attempt_id` を保存処理へ渡します。外部待ちは理由と次回確認時刻を持ち、解消した証拠がある場合だけ `resume --ready --wait-reason <理由>` で進めます。復元は所有する隔離ブランチで行い、main の変更や他者の未保存差分を照合します。利用制限を指定した試験は、実際に契約枠を使い切った試験と区別します。

完了前に候補をコミットし、`verify` を実行します。`finish` はその tree に結び付いた検証と、作業区分に必要な内容レビューを要求します。`new-doc` の draft PR で公開レビューの記録を省略できても、共通 runtime の内容レビュー契約は残ります。レビュー記録は `decision: approved`、`tree_sha`、作業 run と異なる `reviewer_run_id` を持ち、checkpoint の JSON で引き渡します。`merged` / `published` の完了には、`pr_url`、`head_sha`、必要な `publication_urls` を記録し、実 GitHub と公開先を再照合します。

保存先は common Git directory 配下です。クライアントの sandbox が `.git` を読み取り専用にする実行面では、明示した作業領域の権限を確認します。`start` が拒否された場合を、中断保存や再開の成功と表示しません。

### ハーネスの評価

```bash
npm run eval:harness
npm run eval:harness -- --mode prepare --ref <比較対象のcommit>
npm run eval:harness -- --mode agent --ref <比較対象のcommit> --binary /absolute/path/codex
npm run eval:harness -- --mode collect --run /absolute/path/evaluation
```

既定はオフラインの回帰試験です。`agent` は明示したネイティブ Codex と既存の ChatGPT 認証・モデル設定で、固定した新規 draft 執筆課題を実行します。独立した Git fixture を common Git directory に作成し、API キーへの切替、リモートの作成・更新、成果物の自動コミットは行いません。`prepare` は実 Agent を起動しません。実行ログはローカルに留め、`collect` が返す版・thread・使用量・所要時間・変更範囲と、別に行う内容レビューを評価記録へまとめます。終了コードやコマンド数だけで品質の合格を決めません。

準備時にfixture直下の `.harness-eval-scratch/` を予約し、tempとnpmキャッシュを作ります。この領域だけをfixtureの `.git/info/exclude` へ追加し、既存の同名ファイルやリンクには上書きしません。`agent` の依存準備とAgent・子プロセスは同じ限定環境を使い、親の環境変数や個人設定を変更しません。`prepare` を使って手動起動する場合は、返された `execution_contract.environment` をその子プロセスだけに重ねます。

`collect` は全パスと全コマンドをローカルの `summary.json` に保存します。標準出力は件数・先頭10パス・完全記録の位置を表示し、縮約の有無を明示します。`dependency_install` の成功は依存準備の結果であり、Agentの起動や記事品質の成功を意味しません。

比較時は同じ課題・モデル設定・開始条件を使い、単一試行から一般的な成功率を推定しません。発火していない hook、未取得の使用量、権限や認証で起動できなかった面は明示します。実クライアントの hook、読み取り専用担当、停止・再開、定期起動は、固定執筆課題とは別の受入シナリオです。

### ローカル記録の保管と棚卸し

完了 run とそのログは完了後 90 日間、WIP ref は対象作業の完了後 90 日間保持します。未完了・要判断の記録は期間で削除しません。共通 Git ディレクトリの状態・ログ領域が 500 MiB を超えた場合は、`harness:health` の容量表示を使って棚卸しします。容量超過を理由に自動削除することはありません。

削除する前に run の状態、対応する PR、公開結果、残すべき検証証拠を照合します。ファイル削除は resolved 絶対パスが common Git 配下の所有する状態・ログ領域に収まることを確認してから行います。WIP ref も所有する作業との対応を確認します。認証情報や会話全文を、公開する記録やログへ含めません。

## ライセンス

コントリビューションは、ドキュメントは CC BY 4.0、コードは MIT([LICENSE](LICENSE))で受け入れられます。
