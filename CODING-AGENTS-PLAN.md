# CODING-AGENTS-PLAN — AI コーディングエージェント章 追加計画

> **ステータス: Phase A 全体完了(2026-07-06)。** 全 16 本を執筆・レビュー・公開済み(調査 C-R1〜C-R10 は 2026-07-05 実施、記録は `research/coding-agents/`)。
> §13 の判断事項はすべて推奨案どおり確定: ①章番号は `08` 追加 ②Jules は `gemini-cli-and-code-assist.md` 内で概説 ③`research/` は新設して git 管理。
> 追加の判断記録: Windsurf は調査で「2026-06-02 に Devin Desktop へ改名済み」と判明したため、ファイル名は計画どおり `windsurf.md` を維持しつつ、タイトルを「Windsurf(現: Devin Desktop)」とし、クラウドの Devin 本体(`devin.md`)と分担した。
> 以降の保守は [ROADMAP.md](ROADMAP.md) の「定期メンテナンス」(ツール情報の定点観測)に従う。

## 1. 現状確認(前提)

- docs/ は `00-overview` 〜 `07-case-studies` の 8 セクション・37 本(すべて `published`)で初版一巡済み
- 全ドキュメントは [templates/doc-template.md](templates/doc-template.md) の固定 H2 構造に準拠。ステータス正本は front matter の `status`
- 本章と関係が深い既存資産(重複させず、リンクで接続する):
  - [06-security/](docs/06-security/) — 脅威モデル・プロンプトインジェクション・ツール権限とサンドボックス・データ漏えい
  - [03-implementation/mcp-and-tool-protocols.md](docs/03-implementation/mcp-and-tool-protocols.md) — MCP の仕組み(本章では「各ツールが MCP をどう使えるか」だけを扱う)
  - [02-architecture/human-in-the-loop.md](docs/02-architecture/human-in-the-loop.md) — 承認設計の一般論
  - [04-evaluation/](docs/04-evaluation/)・[05-operations/cost-management.md](docs/05-operations/cost-management.md) — 評価・コストの一般論
- website(Nextra)は sync スクリプトが docs/ を自動取り込みするため、新セクション追加の手動対応は限定的(§12)

### 既存規約との整合で決めておくこと

| 論点 | 方針 |
| --- | --- |
| ベンダー中立原則(CLAUDE.md はサンプルコードの文脈で規定) | 本章は**製品解説そのものが目的**のため、ツール別ページはベンダー固有で書く。横断ページ(選定・設定・プロンプト・セキュリティ・チーム導入・評価)は特定ツール非依存の原則で書き、ツール名は例として挙げるにとどめる |
| 鮮度管理(最終確認日・主な出典・更新されやすい項目) | front matter は**拡張しない**(CLAUDE.md がキーを列挙しているため)。既存規約の範囲で書式を固定する: ①「本文」冒頭に最終確認日の引用ブロック ②「参考資料」にアクセス日付きで主な出典 ③「TODO・未確認事項」内に `### 変わりやすい項目(定点観測)` を置き `TODO(要確認)` 書式で列挙(§8) |
| 事実と推測の区別 | 公式情報で確認した事実のみ断定形。未確認は「〜とされています(未確認)」+ `TODO(要確認)`。第三者記事のみが根拠の内容は本文に書かない(参考資料への掲載は可) |
| 優劣の扱い | ランキング・スコア・「最強」等の表現は使わない。**用途別の向き不向き**と条件で書く(比較表テンプレートに記入ルールとして明文化) |

## 2. 設計方針

章を **3 層**で構成します。鮮度リスク(製品仕様・料金の変化)を第 3 層と比較ページに閉じ込め、第 1〜2 層は長寿命な設計知識として書きます。

1. **概論**(2 本)— 分類の地図と選定の判断軸。ツールが入れ替わっても通用する内容
2. **横断テーマ**(5 本 + 比較 1 本)— 設定・プロンプト設計・セキュリティ・チーム導入・評価。ツール非依存の原則 + 具体例
3. **ツール別リファレンス**(8 本)— 共通テンプレートで事実を整理。最終確認日を必ず持つ

## 3. ディレクトリ構成案

```text
docs/
└── 08-coding-agents/                      # 新セクション(NN-section-name 規約)
    ├── README.md                          # 収録予定表(既存セクションと同形式)
    ├── coding-agents-overview.md          # 第 1 層: 分類と全体像
    ├── coding-agent-selection.md          # 第 1 層: 選定基準と使い分け
    ├── coding-agent-rules-and-config.md   # 第 2 層: ルールファイルと設定設計
    ├── coding-agent-prompting.md          # 第 2 層: 依頼(プロンプト)設計
    ├── coding-agent-security.md           # 第 2 層: 権限・秘密情報・破壊的操作
    ├── coding-agent-team-adoption.md      # 第 2 層: チーム導入とレビュー体制
    ├── coding-agent-evaluation.md         # 第 2 層: 評価方法
    ├── coding-agents-comparison.md        # 第 2 層: 比較表の正本(最後に執筆)
    ├── claude-code.md                     # 第 3 層: ツール別
    ├── openai-codex.md
    ├── gemini-cli-and-code-assist.md
    ├── github-copilot.md
    ├── cursor.md
    ├── windsurf.md
    ├── devin.md
    └── open-source-coding-agents.md       # OSS 系(Aider / Cline / Continue / OpenHands / Goose 等)俯瞰

templates/
├── tool-doc-template.md                   # 本章ツール別ページ用(作成済み)
└── tool-comparison-template.md            # 比較表用(作成済み)

research/coding-agents/                    # (任意・§13)執筆前調査メモの置き場。docs 規約の対象外
```

- ファイル名は docs/ 全体で一意(既存 45 ファイルと衝突なしを確認済み)
- 固有名詞も小文字ケバブケース(既存規約: `llm-as-a-judge.md` と同じ扱い)
- A-0 で [templates/doc-template.md](templates/doc-template.md) の `category` 列挙に `coding-agents` を追記する(既存ファイルへの変更はこれと README/ROADMAP 系の同期のみ)

## 4. ページ一覧(16 本 + セクション README)

| # | ファイル | 仮タイトル | level | 層 | 執筆フェーズ |
| --- | --- | --- | --- | --- | --- |
| 1 | `coding-agents-overview.md` | AI コーディングエージェントの分類と全体像 | basic | 概論 | A-1 |
| 2 | `coding-agent-selection.md` | コーディングエージェントの選定基準と使い分け | intermediate | 概論 | A-1 |
| 3 | `claude-code.md` | Claude Code | basic | ツール別 | A-2 |
| 4 | `openai-codex.md` | OpenAI Codex | basic | ツール別 | A-2 |
| 5 | `gemini-cli-and-code-assist.md` | Gemini CLI と Gemini Code Assist | basic | ツール別 | A-2 |
| 6 | `github-copilot.md` | GitHub Copilot | basic | ツール別 | A-3 |
| 7 | `cursor.md` | Cursor | basic | ツール別 | A-3 |
| 8 | `windsurf.md` | Windsurf | basic | ツール別 | A-3 |
| 9 | `devin.md` | Devin | basic | ツール別 | A-4 |
| 10 | `open-source-coding-agents.md` | オープンソースのコーディングエージェント | intermediate | ツール別 | A-4 |
| 11 | `coding-agent-rules-and-config.md` | ルールファイルと設定の設計 | intermediate | 横断 | A-5 |
| 12 | `coding-agent-prompting.md` | コーディングエージェントへの依頼設計 | basic | 横断 | A-5 |
| 13 | `coding-agent-security.md` | コーディングエージェントの権限とセキュリティ | intermediate | 横断 | A-6 |
| 14 | `coding-agent-team-adoption.md` | チーム導入とレビュー体制 | intermediate | 横断 | A-6 |
| 15 | `coding-agent-evaluation.md` | コーディングエージェントの評価 | advanced | 横断 | A-7 |
| 16 | `coding-agents-comparison.md` | 主要コーディングエージェント比較 | intermediate | 横断 | A-7(最後) |

front matter は `category: "coding-agents"`。tags は新設 `coding-agents` を基本とし、既存タグ(`mcp` / `sandboxing` / `prompt-injection` / `evaluation` / `cost` 等)を再利用します(新タグ乱造をしない)。

## 5. 各ページの設計

固定 H2(この記事の目的/対象読者/前提知識/本文/実務での注意点/関連トピック/参考資料/TODO・未確認事項)は全ページ共通のため、ここでは「目的・対象読者・主要トピック・本文の H3 案」だけを書きます。

### 5.1 概論(第 1 層)

#### coding-agents-overview.md — AI コーディングエージェントの分類と全体像

- **目的**: 乱立するツールを「提供形態 × 自律性」の 2 軸で整理し、この章を読み進める地図を持てるようになる
- **対象読者**: AI コーディング支援の導入を検討するエンジニア。コード補完は使ったことがあるがエージェント型は未経験の人
- **主要トピック**: コード補完とエージェントの違い(Agent ループとの接続)、提供形態 5 分類(§6)、1 ツールが複数形態を持つのが常態であること、トリガー面と実行場所の 2 軸整理
- **本文 H3 案**: 概要 / コード補完からコーディングエージェントへ / 提供形態による 5 分類 / 自律性と人の関与のスペクトラム / この章の読み方
- **関連**: [what-is-an-ai-agent.md](docs/01-concepts/what-is-an-ai-agent.md)、[agent-loop.md](docs/01-concepts/agent-loop.md)、[human-in-the-loop.md](docs/02-architecture/human-in-the-loop.md)

#### coding-agent-selection.md — 選定基準と使い分け

- **目的**: 自チームの制約(セキュリティ要件・リポジトリ規模・既存フロー・予算)から候補を絞り込む判断軸を持ち、選定プロセスを設計できるようになる
- **対象読者**: ツール選定の責任を持つテックリード・EM。個人利用から組織標準化を検討する人
- **主要トピック**: 判断軸(実行場所とデータ取り扱い/権限モデル/IDE・フロー適合/拡張性/チーム管理/料金体系)、用途→形態のマッピング、複数ツール併用パターン、乗り換えコスト(ルールファイルの互換性)
- **本文 H3 案**: 概要 / 選定の判断軸 / 用途から形態を選ぶ / 併用パターン / 選定プロセスの設計(トライアル → 評価 → 展開)
- **備考**: `coding-agents-comparison.md` への参照は A-7 完了までバッククォート表記とし、A-7 でリンク化(リンク切れ禁止規約のため)

### 5.2 横断テーマ(第 2 層)

#### coding-agent-rules-and-config.md — ルールファイルと設定の設計

- **目的**: プロジェクト規約をエージェントに伝えるルールファイル(AGENTS.md、CLAUDE.md、.cursor/rules 等)を設計・保守できるようになる
- **対象読者**: エージェント利用をリポジトリ規約として整備したい開発者
- **主要トピック**: 主要ルールファイルの種類と互換関係、何を書くか/書かないか(コンテキスト予算の観点)、モノレポでの階層化、ユーザー/プロジェクト/組織の設定 3 層、形骸化防止(CI 検査・定期見直し)
- **本文 H3 案**: 概要 / ルールファイルの種類と対応関係 / 内容設計(何を書くか) / 階層化とスコープ / 保守と形骸化防止
- **関連**: [context-engineering.md](docs/02-architecture/context-engineering.md)(ルールファイルはコンテキスト設計の一形態)

#### coding-agent-prompting.md — コーディングエージェントへの依頼設計

- **目的**: タスクの切り方・コンテキストの与え方・検証のさせ方を設計し、手戻りと暴走を減らせるようになる
- **対象読者**: エージェントを使い始めたが「思ったものが出てこない」段階の開発者
- **主要トピック**: 依頼の基本構造(目的・制約・完了条件)、タスク分割の粒度、探索させる指示と限定する指示の使い分け、計画モード・レビューの活用、失敗時の立て直し(会話継続かやり直しか)
- **本文 H3 案**: 概要 / 依頼の基本構造 / タスク分割と粒度 / コンテキストの与え方 / 検証と完了条件の設計 / うまくいかないときの立て直し
- **備考**: [agent-prompt-design.md](docs/03-implementation/agent-prompt-design.md)(エージェントを**作る**側のプロンプト設計)との役割の違いを冒頭で明示する

#### coding-agent-security.md — コーディングエージェントの権限とセキュリティ

- **目的**: エージェントに与える権限と事故防止策を、ツール非依存の原則として設計できるようになる
- **対象読者**: エージェント導入時のセキュリティレビューを行う開発者・セキュリティ担当
- **主要トピック**: 固有の脅威(取り込んだコンテンツ経由のプロンプトインジェクション → コマンド実行、秘密情報の露出・送信、破壊的コマンド、信頼できない MCP サーバー・拡張のサプライチェーン)、承認モデルの型(都度承認/許可リスト/サンドボックス+事後レビュー)、秘密情報管理(環境変数・マスキング・スコープ最小化)、ネットワーク境界、監査ログ
- **本文 H3 案**: 概要 / コーディングエージェント固有の脅威 / 権限モデルの設計 / 秘密情報の扱い / 破壊的操作への多層防御 / 監査とログ
- **関連**: [threat-model-overview.md](docs/06-security/threat-model-overview.md)、[prompt-injection.md](docs/06-security/prompt-injection.md)、[tool-permissions-and-sandboxing.md](docs/06-security/tool-permissions-and-sandboxing.md)、[data-exfiltration.md](docs/06-security/data-exfiltration.md)

#### coding-agent-team-adoption.md — チーム導入とレビュー体制

- **目的**: 個人利用から組織導入へ広げる際のガバナンス・レビュー体制・教育・コスト管理を設計できるようになる
- **対象読者**: EM・テックリード・開発生産性チーム
- **主要トピック**: 導入ステップ(パイロット → ガイドライン → 展開)、AI 生成コードのレビュー体制(責任の所在は変わらないこと、レビュー観点の変化、AI 関与の表示規約)、利用ポリシー(許可ツール・禁止データ・ライセンス/知財)、コストと利用状況の可視化、教育とオンボーディング、効果測定の入口(詳細は evaluation へ)
- **本文 H3 案**: 概要 / 導入ステップの設計 / レビュー体制と責任 / 利用ポリシーの策定 / コストと利用状況の管理 / 教育とオンボーディング
- **関連**: [cost-management.md](docs/05-operations/cost-management.md)、[human-in-the-loop.md](docs/02-architecture/human-in-the-loop.md)

#### coding-agent-evaluation.md — コーディングエージェントの評価

- **目的**: 公開ベンチマークの限界を理解し、自社のタスク・コードベースでの評価を設計できるようになる
- **対象読者**: ツール選定・更改の意思決定に評価データを使いたいテックリード
- **主要トピック**: 公開ベンチマーク(SWE-bench 系等)の読み方と限界(リーク・タスク分布の偏り・ハーネス依存)、社内評価の設計(代表タスクセット・受け入れ基準・時間とコストの計測)、パイロット/A-B 設計、モデル更新への追従(定点再評価)
- **本文 H3 案**: 概要 / 公開ベンチマークの読み方と限界 / 社内評価タスクの設計 / 導入効果の測定 / 継続的な再評価
- **関連**: [agent-evaluation-basics.md](docs/04-evaluation/agent-evaluation-basics.md)、[versioning-and-model-updates.md](docs/05-operations/versioning-and-model-updates.md)

#### coding-agents-comparison.md — 主要コーディングエージェント比較

- **目的**: 用途別の向き不向きを一覧できる**比較の正本**。各ツールページの要約集約であり、優劣は付けない
- **対象読者**: 候補を 2〜3 に絞りたい選定担当者
- **主要トピック**: [templates/tool-comparison-template.md](templates/tool-comparison-template.md) の表 A〜E(提供形態/実行環境と権限/機能/導入・契約/用途別の向き不向き)
- **本文 H3 案**: 概要と読み方(凡例・鮮度の注意) / 提供形態マトリクス / 実行環境・権限・セキュリティ / 機能比較 / 導入・契約 / 用途別の向き不向き
- **備考**: 章内で最も鮮度リスクが高いページ。全表に「最終確認日」列を持ち、**全ツールページ完成後(A-7)に執筆**する

### 5.3 ツール別リファレンス(第 3 層)

8 本すべて [templates/tool-doc-template.md](templates/tool-doc-template.md) に従い、本文 H3 は共通(概要/提供形態と実行環境/リポジトリ理解・編集・実行の仕組み/設定ファイルとカスタマイズ/権限管理とセキュリティ/外部連携/チーム導入と提供プラン/代表的なユースケースと向き不向き)。ここでは各ページの特記事項のみ示します。

| ページ | 特記事項(執筆時の固有論点) |
| --- | --- |
| `claude-code.md` | 提供面が多い(CLI / IDE 拡張 / Web / GitHub Actions / Agent SDK)ため「同じエージェントの別の面」として整理。ルールファイル(CLAUDE.md)・フック・サブエージェント・スキル・MCP・権限モード。**本ライブラリ自体が Claude Code で執筆されている旨を冒頭に注記**(中立性の担保) |
| `openai-codex.md` | CLI(OSS)/ IDE 拡張 / クラウド(ChatGPT 統合)/ コードレビューの製品構成整理が主眼。AGENTS.md、サンドボックスと承認モード |
| `gemini-cli-and-code-assist.md` | Gemini CLI(OSS の CLI)と Gemini Code Assist(IDE・GitHub PR レビュー)の**関係の整理**が読者の最大の混乱点。無料枠の位置づけ。Jules(非同期クラウド型)はここで概説するか独立ページか → §13 |
| `github-copilot.md` | 補完 / チャット / エージェントモード / コーディングエージェント(Issue 割当 → PR)/ コードレビューと機能面が多層。組織管理・ポリシー制御・データ学習利用の設定。GitHub エコシステム前提という向き不向き |
| `cursor.md` | 専用 IDE(VS Code フォーク)という形態の含意(移行コスト・拡張互換)。Tab 補完・Agent・バックグラウンドエージェント・PR レビュー。.cursor/rules。コードベースインデックスの仕組みと大規模リポジトリでの挙動(要裏取り) |
| `windsurf.md` | 専用 IDE。Cascade。提供体制の変化(2025 年の買収報道)があったため、**執筆時点の提供元・製品方針の裏取りを最優先**(TODO を厚めに) |
| `devin.md` | クラウド完全自律型の代表。Slack / Linear / GitHub からの委任、並列実行、API。人の関与点の設計(委任に向くタスクの条件)。「同僚として扱う」型の運用論 |
| `open-source-coding-agents.md` | Aider / Cline / Continue / OpenHands / Goose / opencode 等を 1 ページで俯瞰(個別詳細ページは作らない)。OSS を選ぶ動機(データ主権・カスタマイズ・API 従量のコスト構造)と自己運用の負担。個別の網羅より「OSS 系という選択肢の評価軸」を主とする |

## 6. ツール分類(暫定 — 執筆前に裏取り必須)

> **TODO(要確認):** 以下の分類マトリクスは執筆者の 2026 年 1 月時点の知識に基づく暫定整理です。A-2〜A-4 の各執筆前に、§7 のチェックリストで各ツールの公式情報を裏取りして更新してください(最終確認: 2026-07)。

### 分類の定義

| 分類 | 定義 | 代表例(暫定) |
| --- | --- | --- |
| ターミナル型 | 開発者のシェル上で動く対話型 CLI。ローカル実行で既存ツールチェーンに直結 | Claude Code(CLI)、Codex CLI、Gemini CLI、Aider、Goose |
| IDE 統合型 | 既存 IDE の拡張、または専用 IDE。エディタ文脈(開いているファイル・選択範囲)を活用 | GitHub Copilot、Cursor、Windsurf、Gemini Code Assist、Cline、Continue |
| GitHub / Issue / PR 連携型 | Issue 割当・PR コメント・レビュー依頼をトリガーに動く | Copilot コーディングエージェント、Claude Code GitHub Actions、Gemini Code Assist(PR レビュー)、Devin(Slack / Linear 連携) |
| クラウド実行型 | ベンダー管理のサンドボックスで非同期・並列にタスクを実行 | Devin、Codex(クラウド)、Claude Code on the web、Jules、Cursor バックグラウンドエージェント |
| オープンソース・拡張可能型 | コードが公開されている、または拡張機構(MCP・フック・SDK)を持つ | OSS: Codex CLI、Gemini CLI、Aider、Cline、Continue、OpenHands、Goose / 拡張機構: Claude Code(フック・MCP・Agent SDK) |

**分類上の注意(overview に明記する)**: この 5 分類は排他的ではなく、主要ツールは複数の形態を持つのが常態です。正確には「**トリガー面**(CLI / IDE / Issue・PR)」と「**実行場所**(ローカル / ベンダークラウド / CI)」の 2 軸で捉え、5 分類は入口の整理として使います。

### 提供形態マトリクス(暫定)

凡例: ○ = 提供あり / △ = 限定的・一部 / — = なし / ? = 未確認。**全セル要裏取り**。

| ツール | 提供元 | CLI | IDE 拡張 | 専用 IDE | クラウド実行 | GitHub/PR 連携 | API・SDK | OSS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Code | Anthropic | ○ | ○ | — | ○ | ○ | ○(Agent SDK) | —(拡張機構あり) |
| OpenAI Codex | OpenAI | ○ | ○ | — | ○ | ○ | ? | △(CLI のみ) |
| Gemini CLI | Google | ○ | — | — | — | △(Actions 連携?) | ? | ○ |
| Gemini Code Assist | Google | — | ○ | — | — | ○(PR レビュー) | — | — |
| Jules | Google | — | — | — | ○ | ○ | ? | — |
| GitHub Copilot | GitHub | ○? | ○ | — | ○(coding agent) | ○ | ? | — |
| Cursor | Anysphere | ○ | — | ○ | ○ | ○? | ? | — |
| Windsurf | Cognition? | ? | ? | ○ | ? | ? | ? | — |
| Devin | Cognition | — | ? | — | ○ | ○ | ○ | — |
| Aider | OSS コミュニティ | ○ | — | — | — | — | △ | ○ |
| Cline | Cline | — | ○ | — | — | — | ? | ○ |
| Continue | Continue | ○? | ○ | — | ? | ? | ? | ○ |
| OpenHands | All Hands AI | △ | — | — | ○ | ○? | ○? | ○ |
| Goose | Block | ○ | — | — | — | — | ○(拡張) | ○ |

## 7. 調査チェックリスト(ツール共通)

各ツールページの執筆前に、以下 12 項目を公式情報で確認します。結果は `research/coding-agents/<tool-name>.md`(§13)に記録してから執筆に入ります。

| # | 項目 | 確認する内容 |
| --- | --- | --- |
| 1 | 実行環境 | ローカル / ベンダークラウド / CI のどこで動くか。対応 OS。クラウド実行の場合の隔離単位(コンテナ・VM)と永続性 |
| 2 | 対応 IDE / CLI | 公式対応 IDE の一覧。CLI の有無。専用 IDE か既存 IDE の拡張か |
| 3 | リポジトリ理解 | インデックス方式(埋め込み等の事前索引)か、オンデマンド検索(grep 系)か。大規模リポジトリ・モノレポでの制約 |
| 4 | ファイル編集 | 差分の適用方式、複数ファイル編集、変更のプレビューとロールバック手段 |
| 5 | コマンド実行 | シェル実行の可否、テスト実行、実行前確認の仕様、バックグラウンド実行 |
| 6 | MCP・外部ツール連携 | MCP クライアント対応(トランスポート種別)、プラグイン / フック機構、CI 連携 |
| 7 | 設定ファイル | ルールファイルの名称・場所・階層(ユーザー / プロジェクト / 組織)、チームでの共有方法、AGENTS.md 等の互換 |
| 8 | 権限管理 | 承認モードの種類、許可 / 拒否リスト、自動承認の範囲、危険操作の既定動作 |
| 9 | セキュリティ | サンドボックス方式、ネットワーク制御、秘密情報のマスク、データ保持・**学習利用ポリシー(既定とオプトアウト)**、コンプライアンス認証 |
| 10 | チーム導入機能 | 組織アカウント、SSO、ポリシーの集中管理、監査ログ、シート管理 |
| 11 | 料金・利用制限 | プラン名と課金単位(シート / 従量 / クレジット)、無料枠、レート制限。**金額は本文に転記せず、参照先 URL + 確認日を記録** |
| 12 | 代表的なユースケース | 公式が想定する用途。コミュニティで定着した用途(事実と評判を区別して記録) |

**情報源の優先順位**: ① 公式ドキュメント → ② 公式リリースノート / changelog → ③ 料金ページ・利用規約・プライバシー / トラストセンター文書 → ④ 公式リポジトリ(OSS の場合)→ ⑤ ベンダー公式ブログ → ⑥ 第三者記事(補助。**単独では断定の根拠にしない**)

**記録様式**(research メモの 1 行): `項目 | 確認した事実 | 出典 URL | 確認日(YYYY-MM-DD) | 確度(公式明記 / 公式から推測 / 第三者)`

## 8. 執筆テンプレートと鮮度管理の書式

ツール別ページは [templates/tool-doc-template.md](templates/tool-doc-template.md) を使用します(doc-template.md の固定 H2 を継承し、本文 H3 と鮮度管理の書式を追加で固定)。横断ページ・概論は従来どおり [templates/doc-template.md](templates/doc-template.md) を使用します。

ユーザー要件「最終確認日・主な出典・更新が必要になりやすい項目」は、既存規約を変えずに次の 3 点セットで満たします(全ツール別ページ + 比較ページで必須):

1. **最終確認日** — `## 本文` の直下に置く引用ブロック:

   ```markdown
   > **最終確認日:** 2026-07-05 — 本記事の製品仕様・提供形態はこの日付時点の公式情報に基づきます。主な出典は「参考資料」を参照してください。
   ```

2. **主な出典** — `## 参考資料` に公式ドキュメント・料金ページ・セキュリティ / プライバシー文書を必ず含め、既存規約どおり全リンクに `(アクセス日: YYYY-MM-DD)` を付ける
3. **更新が必要になりやすい項目** — `## TODO・未確認事項` 内に `### 変わりやすい項目(定点観測)` を置き、料金・モデル・対応 IDE・ベータ機能などを `TODO(要確認)` 書式で列挙する(既存の全文検索による棚卸しにそのまま乗る)

## 9. 比較表テンプレート

[templates/tool-comparison-template.md](templates/tool-comparison-template.md) に、`coding-agents-comparison.md` で使う 5 表と記入ルールを定義しました。

| 表 | 内容 | 主な列 |
| --- | --- | --- |
| A | 提供形態マトリクス | CLI / IDE 拡張 / 専用 IDE / クラウド実行 / GitHub・PR 連携 / API・SDK / OSS / 最終確認日 |
| B | 実行環境・権限・セキュリティ | 実行場所 / サンドボックス / 承認モデル / 秘密情報の扱い / 学習利用の既定 / 最終確認日 |
| C | 機能 | リポジトリ理解の方式 / 編集の適用方式 / コマンド実行 / MCP / ルールファイル / 拡張機構 / 最終確認日 |
| D | 導入・契約 | プラン体系(名称のみ) / 無料枠 / チーム管理(SSO・ポリシー) / 料金参照先 URL / 最終確認日 |
| E | 用途別の向き不向き | ユースケース / 向いている形態・ツールと理由 / 注意が要る条件 |

**記入ルール(テンプレートに明文化済み)**: 優劣記号(◎ 等)・スコア・ランキングは使わない / 全セルは公式情報に基づき、未確認セルは `?` として TODO 登録 / 条件・例外は備考で補う / 表 E は「どちらが良いか」ではなく「この用途ならこの形態が向く(理由)」の形で書く。

## 10. タスク分割(ROADMAP 追記案)

承認後、以下を ROADMAP.md に追記します。1 セッション 1〜3 ファイルの原則を維持し、各執筆タスクの前に対応する調査タスク(§11)を完了させます。

### Phase A: AI コーディングエージェント章(08-coding-agents)

| タスク | 内容 | 成果物 | ステータス |
| --- | --- | --- | --- |
| A-0 | 章スケルトン(セクション README、ROADMAP・ルート README・doc-template の category・website 反映 §12) | `08-coding-agents/README.md` ほか同期一式 | 未着手 |
| A-1 | 分類と全体像 + 選定基準 | `coding-agents-overview.md`, `coding-agent-selection.md` | 未着手 |
| A-2 | ツール別: Claude Code / OpenAI Codex / Gemini | `claude-code.md`, `openai-codex.md`, `gemini-cli-and-code-assist.md` | 未着手 |
| A-3 | ツール別: GitHub Copilot / Cursor / Windsurf | `github-copilot.md`, `cursor.md`, `windsurf.md` | 未着手 |
| A-4 | ツール別: Devin / OSS 系俯瞰 | `devin.md`, `open-source-coding-agents.md` | 未着手 |
| A-5 | ルールファイルと設定 + 依頼設計 | `coding-agent-rules-and-config.md`, `coding-agent-prompting.md` | 未着手 |
| A-6 | セキュリティ + チーム導入 | `coding-agent-security.md`, `coding-agent-team-adoption.md` | 未着手 |
| A-7 | 評価 + 比較表(全ツールページ完了後) | `coding-agent-evaluation.md`, `coding-agents-comparison.md` | 未着手 |
| A-R | フェーズレビュー(published 化、比較表と各ページの整合、learning-roadmap への組み込み、GLOSSARY、website 反映確認) | — | 未着手 |

## 11. Codex へ依頼するためのタスク一覧

執筆(Claude 担当想定)の前段となる**調査タスク**を Codex に委譲できる形で定義します。調査メモは docs 規約の対象外とし、`research/coding-agents/` に置きます(§13 で要判断)。

| ID | 依頼内容 | 出力先 |
| --- | --- | --- |
| C-R1 | Claude Code の公式情報調査(チェックリスト 12 項目) | `research/coding-agents/claude-code.md` |
| C-R2 | OpenAI Codex(CLI / IDE / クラウド / コードレビュー)の調査 | `research/coding-agents/openai-codex.md` |
| C-R3 | Gemini CLI・Gemini Code Assist・Jules の製品構成と関係の調査 | `research/coding-agents/gemini.md` |
| C-R4 | GitHub Copilot(補完 / チャット / エージェントモード / coding agent / コードレビュー)の調査 | `research/coding-agents/github-copilot.md` |
| C-R5 | Cursor の調査(インデックス方式・バックグラウンドエージェントを重点) | `research/coding-agents/cursor.md` |
| C-R6 | Windsurf の調査(**現在の提供元・製品継続性を最優先で確認**) | `research/coding-agents/windsurf.md` |
| C-R7 | Devin の調査(連携面・API・料金体系の枠組み) | `research/coding-agents/devin.md` |
| C-R8 | OSS 系(Aider / Cline / Continue / OpenHands / Goose / opencode)の一括調査 | `research/coding-agents/open-source.md` |
| C-R9 | 横断: 各ツールの料金ページ URL・プラン名・課金単位の一覧化(金額は記録するが本文転記しない前提) | `research/coding-agents/pricing-index.md` |
| C-R10 | 横断: 各ツールのデータ取り扱い・学習利用ポリシー・トラストセンター文書の一覧化 | `research/coding-agents/data-handling-index.md` |

**Codex への依頼プロンプト(コピペ用テンプレート)**:

```text
あなたはテクニカルリサーチャーです。リポジトリ ai-agent-library の
CODING-AGENTS-PLAN.md の §7「調査チェックリスト」に従い、<ツール名> を調査してください。

制約:
- 一次情報のみを根拠とする(公式ドキュメント・公式リリースノート・料金ページ・
  利用規約/プライバシー文書・公式リポジトリ)。第三者記事は補助とし、根拠にしない
- 各事実に出典 URL と確認日(YYYY-MM-DD)を付ける
- 公式情報で確認できない項目は「未確認」と明記し、推測する場合は推測と分かる形で書く
- 結果は research/coding-agents/<tool-name>.md に、チェックリスト 12 項目の見出しで保存する
- docs/ 配下および既存ファイルは一切変更しない
```

執筆まで Codex に依頼する場合は、上記に加えて「[templates/tool-doc-template.md](templates/tool-doc-template.md) に完全準拠」「CLAUDE.md の最重要ルール(1 セッション 3 ファイルまで、同期更新義務)に従う」を制約に含めてください。

## 12. website への影響(A-0 / A-R で対応)

sync スクリプトは docs/ のセクションを自動検出するため、対応は最小限です。

| 対応 | 箇所 | タイミング |
| --- | --- | --- |
| セクション表示名の追加(`'coding-agents': '08. コーディングエージェント'`) | `website/scripts/sync-content.mjs` の `SECTION_TITLES`(51 行付近) | A-0 |
| docs ランディングへの 1 行追加 | `website/content-src/index.mdx` | A-0 |
| 依存マップへのノード・エッジ追加(learning-roadmap.md の Mermaid 更新と**同時に**) | `website/components/roadmap/dependency-graph.jsx` | A-R |
| サイドバー・sections.json・タグページ・検索への反映 | 自動(sync + ビルド) | — |

## 13. 判断事項の記録と TODO

1. **章番号**(確定 2026-07-05): `08-coding-agents` として追加。07 への挿入(以降繰り下げ)は既存ファイルのリネーム影響(リンク・website)が大きいため不採用
2. **Jules の扱い**(確定 2026-07-05): `gemini-cli-and-code-assist.md` 内で概説する。独立ページは作らない
3. **research/ ディレクトリ**(確定 2026-07-05): `research/coding-agents/` を新設し **git 管理**する(出典・確認日の記録自体に価値があるため)。A-0 で README を作成済み
4. **GLOSSARY 追加候補**(A-1 以降で確定): コーディングエージェント(coding agent)、ルールファイル(rules file)、バックグラウンドエージェント(background agent)。既存の MCP・サンドボックス・Human-in-the-Loop は再利用
5. 執筆前の裏取り TODO:

> **TODO(要確認):** §6 の分類マトリクス全セルを各ツールの公式ドキュメントで裏取りする(A-2〜A-4 の各執筆前。最終確認: 2026-07)

> **TODO(要確認):** Windsurf の現在の提供元(Cognition による 2025 年買収後の体制)と製品継続性を公式情報で確認する(最終確認: 2026-07)

> **TODO(要確認):** 各ツールの 2026-07 時点の正式製品名・プラン名(改称が頻繁なため、執筆直前に公式サイトで確認)(最終確認: 2026-07)

## 14. 拡張計画: Phase B — 実践・コスト最適化・自動化(設計案)

> **ステータス: 承認・実施済み(2026-07-06)。** 案 1(横断 2 本 + ツール別実践 3 本)・対象 3 ツール・`-in-practice` 命名で確定し、全 5 本を執筆・公開済み。追加調査 C-R11〜C-R13 は `research/coding-agents/*-practice.md` に記録。進捗の正本は [ROADMAP.md](ROADMAP.md) の Phase B 表。

### 14.1 目的とスコープ

Phase A の章は「選定と安全な導入」を主眼としたため、各ツールページは判断材料(提供形態・権限・データ・契約)に絞っています。Phase B では、ユーザー要望に基づき **Claude Code / OpenAI Codex / GitHub Copilot の 3 ツール**を対象に、次の 3 領域を深掘りします。

1. **多岐にわたる機能説明** — 選定ページでは列挙にとどめた機能(スキル・サブエージェント・フック・非対話実行・並列実行など)の使いどころ
2. **コスト削減手法** — 従量・クレジット型の消費構造の理解と、品質を落とさず消費を減らす操作・設計
3. **業務効率化手法** — 対話利用の次の段階(委任・CI 組み込み・定期実行・並列化)の定番パターン

### 14.2 構成方針(案 1 を推奨)

| 案 | 構成 | 評価 |
| --- | --- | --- |
| **案 1(推奨)** | **横断 2 本 + ツール別実践 3 本の計 5 本を新設** | 原則(長寿命)とツール固有手順(鮮度リスク)を分離できる。既存の「横断はツール非依存・ツール別に鮮度を閉じ込める」設計と一貫 |
| 案 2 | ツール別実践 3 本のみ(コスト・効率化を各ページ内に完結) | ページ数は少ないが、3 ページで同じ原則(コンテキスト管理=コスト管理など)を重複記述することになる |
| 案 3 | 既存ツールページ(claude-code.md 等)を増補 | 新規ファイルなしだが、選定ページが操作ガイドと混ざって肥大化し、両方の読者体験が悪化するため不採用 |

**重複防止の境界(案 1 の前提)**: 選定情報(プラン・データ取り扱い)は既存ツールページが正 / 依頼文の一般論は `coding-agent-prompting.md` が正 / 組織ポリシーは `coding-agent-team-adoption.md` が正 / 「作る側」のコストは `05-operations/cost-management.md` が正。新ページは重複部分をリンクで参照します。

### 14.3 新設ページ一覧(案 1)

| # | ファイル | 仮タイトル | level | 層 |
| --- | --- | --- | --- | --- |
| 17 | `coding-agent-cost-optimization.md` | コーディングエージェントのコスト最適化 | intermediate | 横断 |
| 18 | `coding-agent-automation-patterns.md` | 自動化・業務効率化パターン | intermediate | 横断 |
| 19 | `claude-code-in-practice.md` | Claude Code 実践ガイド | intermediate | ツール別 |
| 20 | `openai-codex-in-practice.md` | OpenAI Codex 実践ガイド | intermediate | ツール別 |
| 21 | `github-copilot-in-practice.md` | GitHub Copilot 実践ガイド | intermediate | ツール別 |

### 14.4 各ページの設計(目的・主要トピック・見出し案)

#### coding-agent-cost-optimization.md — コスト最適化(横断)

- **目的**: 従量・クレジット型の消費構造を理解し、品質を落とさずに消費を減らす判断ができる
- **本文 H3 案**: 概要(何にコストがかかるか: 入力トークン支配・エージェントループの反復) / 課金モデル別の最適化方針(シート・従量・クレジット・クォータ) / コンテキスト管理 = コスト管理(セッションの仕切り直し・コンパクション・不要ファイルの除外・ルールファイル肥大の代償) / モデルの使い分け(タスク難易度と単価のマッチング) / 並列・自律実行の消費制御(暴走対策・支出上限・自動スリープ) / 測定と可視化(利用ダッシュボード・単価の読み方)
- **関連**: [コスト管理](../05-operations/cost-management.md)(作る側)、[コンテキストエンジニアリング](../02-architecture/context-engineering.md)

#### coding-agent-automation-patterns.md — 自動化・業務効率化パターン(横断)

- **目的**: 「対話 → 委任 → 自動化」の段階を設計し、定型タスクをエージェントに移せるようになる
- **本文 H3 案**: 概要(自動化の 3 段階と向くタスクの条件) / 定番パターン集(PR 自動レビュー・Issue トリアージ・依存更新・テスト補強・ドキュメント生成・リリースノート) / 非対話実行と CI 組み込み(headless / exec / print モード) / 定期実行(スケジュールセッション・Routines・Automations) / 並列化(git worktree・クラウド並列委任) / 自動化の失敗設計(冪等性・通知・人手ゲート・コスト上限)
- **関連**: [権限とセキュリティ](coding-agent-security.md)(CI 権限)、[評価](coding-agent-evaluation.md)(自動化の品質監視)

#### claude-code-in-practice.md — Claude Code 実践ガイド

- **機能深掘り**: スキル(カスタムコマンド)・サブエージェント・フック・プラグインの使い分け、plan モード、`/rewind`、worktree 並列、headless(`-p`)、auto memory、Web / モバイルへのセッション引き継ぎ
- **コスト削減**: `/usage`・`/context` による可視化、コンパクションの制御、`/model` によるモデル切替、サブエージェント委譲によるコンテキスト節約、プロンプトキャッシュを意識したルール構成、使用クレジットの月次上限
- **業務効率化**: CLAUDE.md の失敗駆動育成、スキルによるチーム標準配布、GitHub Actions・Slack 連携、Routines による定期タスク

#### openai-codex-in-practice.md — OpenAI Codex 実践ガイド

- **機能深掘り**: ローカル(CLI / IDE)とクラウドの使い分け・引き継ぎ、`codex exec`、`/review`、デスクトップアプリの worktree 並列、AGENTS.md の階層運用、サブエージェント・スキル
- **コスト削減**: 5 時間ウィンドウとクレジットの消費構造、モデル選択(高速系サブエージェントの活用)、クラウド委任とローカルの単価差の考え方
- **業務効率化**: GitHub コードレビューの自動化(レビューガイドライン)、Slack / Linear からの委任、SDK・GitHub Action による自動化

#### github-copilot-in-practice.md — GitHub Copilot 実践ガイド

- **機能深掘り**: 補完 / Chat / agent mode / cloud agent / code review / CLI の使い分けの実際、custom instructions・prompt files・Agent Skills・Spaces・Memory の活用
- **コスト削減**: AI Credits の消費構造(補完は Credits 非消費 = 無料側の機能を使い切る)、モデル選択とレート、管理者の予算制御、自動レビューの帰属(PR 作成者)を踏まえた運用
- **業務効率化**: Issue → cloud agent → PR の運用設計、code review の前段化、Agentic workflows、サードパーティエージェント統合(GitHub をエージェント基盤にする構成)

### 14.5 追加調査タスク(Codex 委譲可)

Phase A の調査メモは「選定判断」観点のため、実践・コスト観点の追加調査を各執筆前に行います。

| ID | 内容 | 出力先 |
| --- | --- | --- |
| C-R11 | Claude Code: 機能深掘り(スキル・フック・サブエージェント・headless)と公式ベストプラクティス・コストレバーの調査 | `research/coding-agents/claude-code-practice.md` |
| C-R12 | OpenAI Codex: 同上(exec・クラウド並列・レビュー運用・クレジット消費) | `research/coding-agents/openai-codex-practice.md` |
| C-R13 | GitHub Copilot: 同上(customization 機構・cloud agent 運用・AI Credits 消費) | `research/coding-agents/github-copilot-practice.md` |

### 14.6 タスク分割(ROADMAP 追記案)

| タスク | 内容 | 成果物 |
| --- | --- | --- |
| B-1 | 横断 2 本(コスト最適化・自動化パターン) | #17, #18 |
| B-2 | Claude Code 実践ガイド(C-R11 反映) | #19 |
| B-3 | OpenAI Codex 実践ガイド(C-R12 反映) | #20 |
| B-4 | GitHub Copilot 実践ガイド(C-R13 反映) | #21 |
| B-R | フェーズレビュー(既存 21 本との相互リンク・比較表からの導線・README / GLOSSARY / website 反映・published 化) | — |

### 14.7 未確定事項(ユーザー判断待ち)

1. **構成**: 案 1(横断 2 + ツール別 3)でよいか
2. **対象ツール**: 指定の 3 ツールのみでよいか(Cursor / Gemini / Devin の実践ガイドは需要が出たら追加できる構成にしておく)
3. **ファイル名**: ツール別実践ページの命名 `<tool>-in-practice.md` 案(代替: `<tool>-usage-guide.md`)
4. **GLOSSARY 候補**(執筆時確定): ヘッドレス実行(headless)、コンパクション(compaction)など
