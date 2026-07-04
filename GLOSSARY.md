# GLOSSARY — 用語集

AI Agent 関連の用語を五十音順・アルファベット順に整理し、詳細を解説するドキュメントへの入口を提供します。

## 運用ルール

- 各エントリは **1〜2 文の要約 + 詳細ドキュメントへの相対リンク** で構成する(ここに長文解説は書かない)
- 新しい用語を本文で初めて導入したドキュメントの執筆セッションで、ここにエントリを追加する
- **登録基準**: 次のいずれかに該当する用語のみ登録する(本文に登場するすべての技術用語を載せない)
  1. いずれかのドキュメントの H1 または主要な H3 で定義される概念
  2. front matter の `tags` に使われる語
  3. 複数のドキュメントから参照される語
- 表記は「日本語訳(English)」を基本とし、日本語訳が定着していない用語は英語見出しにする
- 詳細ドキュメントが未執筆の用語は、リンクの代わりに `(執筆予定: ファイル名)` と書く

## エントリの書式

```markdown
### 用語名(English Term)

1〜2 文の要約。→ [詳細ドキュメント](docs/01-concepts/xxx.md)
```

---

## あ行〜わ行

### エージェントループ(Agent Loop)

LLM が「観測 → 思考 → 行動」のサイクルを繰り返し、完了・失敗・上限のいずれかの停止条件まで自律的に処理を続ける制御構造。概要は [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)。詳細は(執筆予定: `docs/01-concepts/agent-loop.md`)

### コンピュータ操作型エージェント(Computer Use Agent)

画面(スクリーンショット)を観測し、マウス・キーボード操作で GUI を直接操作する Agent の類型。概要は [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)。詳細は(執筆予定: `docs/01-concepts/computer-use-and-multimodal-agents.md`)

### ツール使用(Tool Use / Function Calling)

LLM が検索・API 呼び出し・コード実行などの外部機能を呼び出して行動する仕組み。Agent を Agent たらしめる中核機構。概要は [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)。詳細は(執筆予定: `docs/01-concepts/tool-use.md`)

## A–Z

### AI Agent(AI エージェント)

LLM を判断の中枢に置き、ツールを使いながら、目標達成までの手順を実行時に自律的に決めて実行するシステム。→ [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)

### Workflow 型(ワークフロー)

処理手順を開発者がコードで固定し、LLM を各ステップの部品(分類・要約・生成など)として使う構成。Agent との対比概念。概要は [AI Agent とは何か](docs/01-concepts/what-is-an-ai-agent.md)。詳細は(執筆予定: `docs/02-architecture/workflow-vs-agent.md`)
