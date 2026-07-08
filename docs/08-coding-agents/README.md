# 08-coding-agents — AI コーディングエージェント

Claude Code や GitHub Copilot などの AI コーディングエージェントを、実務で安全かつ効果的に使うためのセクションです。ツール紹介にとどまらず、選定基準・設定・依頼設計・セキュリティ・チーム導入・評価までを体系化します。

- **置くもの**: 提供形態の分類と選定基準、ツール非依存の活用設計(ルールファイル・依頼設計・権限・チーム導入・評価)、主要ツールの事実整理(公式情報ベース・最終確認日付き)
- **置かないもの**: Agent を「作る」側の設計・実装(→ [02-architecture](../02-architecture/README.md) / [03-implementation](../03-implementation/README.md))、エージェント一般のセキュリティ原則(→ [06-security](../06-security/README.md))

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [coding-agents-overview.md](coding-agents-overview.md) | AI コーディングエージェントの分類と全体像(提供形態 5 分類・自律性の軸) |
| [coding-agent-selection.md](coding-agent-selection.md) | 選定基準と使い分け(判断軸・併用パターン・選定プロセスの設計) |
| [coding-agent-rules-and-config.md](coding-agent-rules-and-config.md) | ルールファイルと設定の設計(AGENTS.md・CLAUDE.md・.cursor/rules 等) |
| [coding-agent-prompting.md](coding-agent-prompting.md) | コーディングエージェントへの依頼設計(タスク分割・コンテキスト・完了条件) |
| [coding-agent-security.md](coding-agent-security.md) | 権限・秘密情報・破壊的操作への対策 |
| [coding-agent-team-adoption.md](coding-agent-team-adoption.md) | チーム導入とレビュー体制(ガバナンス・教育・コスト管理) |
| [coding-agent-evaluation.md](coding-agent-evaluation.md) | コーディングエージェントの評価(公開ベンチマークの限界と社内評価の設計) |
| [coding-agents-comparison.md](coding-agents-comparison.md) | 主要ツール比較(用途別の向き不向き。優劣は付けない) |
| [claude-code.md](claude-code.md) | Claude Code(CLI を中心に IDE・クラウド・CI へ展開) |
| [openai-codex.md](openai-codex.md) | OpenAI Codex(CLI / IDE 拡張 / クラウド) |
| [gemini-cli-and-code-assist.md](gemini-cli-and-code-assist.md) | Gemini CLI と Gemini Code Assist(Jules の概説を含む) |
| [github-copilot.md](github-copilot.md) | GitHub Copilot(補完からコーディングエージェントまで) |
| [cursor.md](cursor.md) | Cursor(専用 IDE 型) |
| [windsurf.md](windsurf.md) | Windsurf(現: Devin Desktop。専用 IDE 型) |
| [devin.md](devin.md) | Devin(クラウド完全自律型) |
| [open-source-coding-agents.md](open-source-coding-agents.md) | オープンソースのコーディングエージェント俯瞰(Aider / Cline / OpenHands 等) |
| [coding-agent-cost-optimization.md](coding-agent-cost-optimization.md) | コスト最適化(課金モデル別の方針・コンテキスト管理・モデル使い分け) |
| [coding-agent-automation-patterns.md](coding-agent-automation-patterns.md) | 自動化・業務効率化パターン(委任・CI 組み込み・定期実行・並列化) |
| [claude-code-in-practice.md](claude-code-in-practice.md) | Claude Code 実践ガイド(機能の使いどころ・コスト削減・効率化) |
| [openai-codex-in-practice.md](openai-codex-in-practice.md) | OpenAI Codex 実践ガイド(同上) |
| [github-copilot-in-practice.md](github-copilot-in-practice.md) | GitHub Copilot 実践ガイド(同上) |
| **── SE 実践シリーズ ──** | 日本の企業システム開発(SIer・情シス)の**工程と商流**に軸を置く実践記事群。上記のツール選定・設定・依頼設計・セキュリティを前提にする(設計は `SE-CODING-AGENTS-PLAN.md`) |
| [se-process-map.md](se-process-map.md) | SE 工程別活用マップ(V 字モデルで各工程の使いどころ・人が握る責任を一望。シリーズの背骨) |
| [se-requirements-and-design.md](se-requirements-and-design.md) | 要件定義・設計工程での活用(観点出し・設計書ドラフト・整合性チェック・Excel 設計書文化への現実解) |
| [se-test-process.md](se-test-process.md) | テスト工程での活用(テスト観点/ケース生成・自己検証の罠・品質保証責任は人) |

執筆順・タスク分割はリポジトリ直下の `CODING-AGENTS-PLAN.md`・`SE-CODING-AGENTS-PLAN.md` と `ROADMAP.md`(Phase A・V)を参照してください。ツール別ページの製品情報は変化が速いため、各ページ本文冒頭の「最終確認日」を必ず確認してください(執筆前調査の出典記録はリポジトリの `research/coding-agents/` にあります)。
