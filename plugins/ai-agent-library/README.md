# AI Agent Library — 読者向けレビュー手順

Agent設計を、ライブラリの根拠と照合する4つのスキルです。手順は `SKILL.md`、根拠は必要な章だけを読む `references/` に分けています。

| スキル | 依頼例 | 主な根拠 |
| --- | --- | --- |
| `agent-design-review` | このAgent設計を横断レビューして | 設計・評価・セキュリティのチェックリスト |
| `agent-architecture-choice` | WorkflowとAgentのどちらにするか比較して | 方式判断表、設計チェックリスト、アンチパターン |
| `agent-security-review` | このAgentの権限とインジェクション対策をレビューして | セキュリティのチェックリスト |
| `agent-eval-plan` | このAgentの評価データと採点・回帰計画を作って | 評価のチェックリスト |

一般的なコードレビュー、翻訳、記事執筆だけの依頼は対象外です。発火はモデルの判断なので、依頼例に対する観測結果と、個々の環境での再現を分けて考えます。

MCPを利用できる場合は、同梱の読み取り専用サーバーから記事を検索し、必要なチェックリスト・節・用語だけを取得します。利用できない場合は生成参照へ切り替えます。資料中の攻撃文や指示例は実行する命令として扱いません。レビューの根拠には出典URLと資料の更新日を付け、未提示情報と実際の欠陥を区別します。

## Claude Codeへ導入する

Python 3.11以降、Git、Claude Codeを使います。MCPの依存は既存サンプルと同じ `mcp==2.2.0` です。まずこのリポジトリを取得し、プラグインの更新で置き換わらない場所へ専用venvを作ります。次はリポジトリのルートで実行する例です。

```bash
python -m venv /absolute/path/to/library-mcp-venv
/absolute/path/to/library-mcp-venv/bin/python -m pip install -r plugins/ai-agent-library/mcp/requirements.txt
```

Windowsでは、venvのPythonを `C:/path/to/library-mcp-venv/Scripts/python.exe` に置き換えます。PowerShellで実行ファイルのパスを引用する場合は先頭に `&` を付けます。venvをプラグインcacheの中へ作る必要はありません。

Claude Codeで、このリポジトリのマーケットプレイスを追加します。

```text
/plugin marketplace add pero3dev/ai-agent-library
/plugin install ai-agent-library@ai-agent-library
```

インストール時の `python_path` には、SDKを導入したvenvのPython実行ファイルの絶対パスを指定します。CLIから値を渡す場合は次の形です。

```bash
claude plugin install ai-agent-library@ai-agent-library --config python_path=/absolute/path/to/library-mcp-venv/bin/python
claude plugin details ai-agent-library
```

Windowsでmarketplaceの取得が `Filename too long` で失敗する場合は、未使用の短い所有パスへリポジトリを取得して、ローカルmarketplaceとして追加します。次のGit設定はcloneのプロセスに適用されます。`C:/src/ai-agent-library` は自分の短い作業パスに置き換えられます。

```powershell
git -c core.longpaths=true clone https://github.com/pero3dev/ai-agent-library.git C:/src/ai-agent-library
```

Claude Codeで、そのディレクトリを追加して同じプラグインをインストールします。`python_path` には、先ほど作ったvenvのPythonを指定します。

```text
/plugin marketplace add C:/src/ai-agent-library
/plugin install ai-agent-library@ai-agent-library
```

新しいセッションで、対象の設計書を示して上表のように依頼します。明示的に呼ぶ場合は `/ai-agent-library:agent-design-review` などを使います。`/mcp` で `search_articles`・`get_checklist`・`get_section`・`lookup_glossary` の4ツールを確認できます。

このプラグインはローカルstdio専用です。Python実行ファイルは設定値から、スクリプトはインストール先の `${CLAUDE_PLUGIN_ROOT}` から解決します。ホストの作業ディレクトリやPATHにPythonを追加する設定には依存しません。接続できないときも参照資料によるレビューは可能ですが、取得失敗を最新情報の確認成功とは扱いません。

更新するときは `claude plugin marketplace update ai-agent-library` と `claude plugin update ai-agent-library@ai-agent-library` を実行し、セッションを再起動します。専用venvはキャッシュの外にあるため、インストール先が移動してもPythonの設定値は保持できます。

## Codexで同じスキルを使う

4ディレクトリはAgent Skills形式なので、利用者のプロジェクトの `.agents/skills/` へ、`references/` ごとコピーできます。ライブラリの保守用 `.agents/skills/` をコピーする必要はありません。

macOS/Linuxの例:

```bash
mkdir -p /absolute/path/to/consumer-project/.agents/skills
cp -R /absolute/path/to/ai-agent-library/plugins/ai-agent-library/skills/agent-* /absolute/path/to/consumer-project/.agents/skills/
```

PowerShellの例:

```powershell
$library = 'C:/path/to/ai-agent-library'
$consumer = 'C:/path/to/consumer-project'
New-Item -ItemType Directory -Force -Path "$consumer/.agents/skills" | Out-Null
Copy-Item -Path "$library/plugins/ai-agent-library/skills/agent-*" -Destination "$consumer/.agents/skills/" -Recurse
```

同名スキルが既にある場合は差分を確認して置き換えます。consumerプロジェクトで新しいCodexセッションを開始し、自然なレビュー依頼または `$agent-design-review` などの明示指定を使います。スキル単体ではMCPがなくても同梱参照を使えます。

MCPも利用する場合は、利用者が別途接続します。

```bash
codex mcp add ai-agent-library -- /absolute/path/to/library-mcp-venv/bin/python -X utf8 -B /absolute/path/to/ai-agent-library/plugins/ai-agent-library/mcp/mcp_server.py
codex mcp list
```

2026-11-04のOpenAI公式資料はportableな `plugin.json` と互換マニフェストの形式を説明しています。一方、ここで使うClaude固有の `userConfig` をCodexが同じように解決することは確認していません。このREADMEでは、共通スキルのコピーとMCPの個別接続をCodex向けの導入手順にしています。各ホストのプラグイン形式が同一だとは扱いません。

## 根拠の生成と更新

生成元はリポジトリの `docs/` です。公開済み記事だけから、02設計・04評価・06セキュリティの章別チェックリストと、方式判断・アンチパターンの原文抜粋を作ります。各記事の出典・更新日を保持します。全記事・全章のチェックリストを一度に読み込む必要はありません。

`skills/*/references/`、`mcp/`、`LICENSE` は生成物です。手で編集せず、リポジトリのルートで更新します。

```bash
npm ci
node scripts/sync-reader-skills.mjs --write
node scripts/sync-reader-skills.mjs --check
npm run check
```

MCPの正本は `examples/python/library-mcp-server/` の3ファイルで、同梱版はbyte単位で一致させます。`--check` は根拠と同梱MCPの差分・欠落・余分なファイルを検査し、既存のharness CIで実行します。未知の生成ファイルがある場合、`--write` も変更前に停止します。

MCPは固定HTTPSの公開索引と必要な記事だけを取得し、24時間キャッシュします。取得先・上限・オフライン時の動作は [MCPサンプルの説明](https://github.com/pero3dev/ai-agent-library/blob/main/examples/python/library-mcp-server/README.md)を参照してください。同梱参照は更新時点のスナップショットで、将来の公開記事と常に同じ版になることは保証しません。

## 検証と発火評価

検証日・版・実行した範囲・評価結果は [実施記録](https://github.com/pero3dev/ai-agent-library/blob/main/project/records/2026-11-04/reader-agent-skills.md)に記録します。静的validate、実ホストへの導入、自然な依頼からのスキル読込、レビュー内容の品質を別々に確認します。

発火評価の依頼例は `evals/` に固定し、発火すべき10件と対象外10件を含めます。実Codexで観測した読込は、モデル内部の発火判断そのものを直接観測した値ではありません。ホスト・モデル・版・入力・判定方法を結果と一緒に記録します。設計した20例は実利用分布を代表する標本でも、全回答の正確性を保証する試験でもありません。

2026-11-04、Codex CLI 0.156.1の自然依頼20例は、正例10件で期待するスキル本文を実読込し、対象外10件では読込みませんでした（TP10/TN10/FP0/FN0、実行エラー0）。各ケース1回、MCPなしの同梱参照による結果です。[全ケースの要約](https://github.com/pero3dev/ai-agent-library/blob/main/project/records/2026-11-04/reader-skills-evaluation.json)を保存しています。

Claude Code 2.1.310では、隔離設定領域でmarketplace add→install→4スキルとMCP 1件の認識を確認しました。Claudeのモデル認証がないため、Claudeによる自然依頼からの発火は未実施です。同梱MCPはインストール済みコピーをSDKで起動し、新旧stdioの4ツールとisErrorを確認しました。これらをClaudeのモデル実行と混同しません。

Windowsの短いパスを使う代替手順も、新しい隔離設定でclone→ローカルmarketplace add→installを確認しました。導入時に長いパスのGit設定を追加せず、4スキル・MCP 1件と配布19ファイルの一致を確認しています。

開発者がCodexで評価を再実行する場合は、次の形でCLIのnpm版JS入口と、新しい所有出力先を指定します。実モデルを利用するコマンドなので、利用者の実行環境と利用枠を確認してから実行します。CIの `--check` はモデルを呼び出しません。

```bash
node scripts/evaluate-reader-skills.mjs --check
node scripts/evaluate-reader-skills.mjs --run --codex-js /absolute/path/to/node_modules/@openai/codex/bin/codex.js --output-dir /absolute/path/to/new-evaluation-run --max-cases 20 --approve-for-me --concurrency 2
```

実測では所有するconsumer fixtureのworkspace-writeと通常の自動承認レビューを使い、常用のユーザー設定を読み込まない一時セッションで実行しました。初回のread-only環境で生じたポリシー拒否2件は別runに保存し、発火失敗の分母に入れていません。`--resume` は同じ入力・スキル・CLI版・承認モードの未完了ケースだけを続行し、`--replay` は保存済みログを再採点します。モデルIDはJSONLにないため不明としており、自己申告から補っていません。

## 一次情報とライセンス

2026-11-04確認:

- [Agent Skills仕様](https://agentskills.io/specification)
- [Claude Code plugin manifest](https://code.claude.com/docs/en/plugins-reference)
- [Claude Code marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Claude Code plugin eval](https://code.claude.com/docs/en/plugin-evals)
- [Codexでのスキル作成と探索場所](https://learn.chatgpt.com/docs/build-skills)
- [OpenAIの現在のplugin形式](https://developers.openai.com/plugins/build/plugins)

手順・README・生成参照の散文はCC BY 4.0、同梱PythonコードはMITです。生成参照にはAI Agent Library contributorsの著作者表示と出典を含みます。同梱の [LICENSE](LICENSE) と各出典の条件を確認してください。
