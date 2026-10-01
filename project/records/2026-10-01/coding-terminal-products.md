# P2: Claude Code・Codex・Gemini系の製品境界

## 作業契約と方針

- 次単位はClaude Code・OpenAI Codex・Gemini CLIとCode Assistの3記事。入口・実行・推論送信の場所を分け、設定と権限、連携と契約の境界を図にする。Google系は独立した製品を一つの機能差として扱わない。
- 原文の表・コード・例・リンク・製品別確認日・透明性注記とTODOを保持する。所有は専用モデルと本文対応・SVG・遅延包装・登録とMDX許可・固有試験、本記録とproject索引・引き継ぎ。
- 前単位マージ後の最新mainから通常PRを提出し、前単位の公開表示後にマージする。通常PR・必須CI・squash・既存Pagesはユーザー許可済み。サブエージェント・任意独立レビュー・追加台帳・大量証跡を省く。公開後は表示確認のみ。

| 記事 | 主要論点の割当 | 保持する境界 |
| --- | --- | --- |
| Claude Code | 同じエンジンの複数面・Remote Control・管理VMと自社runner・推論送信、検索とLSP・編集チェックポイントと外部作用・承認、CLAUDE.mdとAGENTS共有・規約とmanaged強制・承認モードとサンドボックス、MCP／hook／CI／SDK・組織配布と監査・認証と枠・用途とOS／モデル制約 | self-hostは推論のオンプレミス化ではない。巻戻しで外部作用を消さない。既定モードを全認証へ固定せず、原文の確認時点を保持する |
| Codex | モデル名と製品名・複数面・ローカルとcloudの2フェーズ・gitとworktree、階層指示と合計読込上限・設定信頼・requirements・拡張、ファイル／承認・旧設定とprofile・ネットワークとproxyの適用範囲・Auto-review、MCP／review／SDK・認証別モデルと退役・契約枠とAPI・管理と用途 | 承認不要を安全保証としない。ローカルコマンドのproxyを全連携へ適用しない。ChatGPT側のモデル退役をAPI側へ一律適用しない。未確認のcloud機能を補完しない |
| Gemini系 | CLI／Code Assist／Julesと個人経路再編・Antigravity、実行場所と推論・オンデマンド／組織索引／Julesの計画承認、異なるルールと設定・承認と隔離・API Paid／Unpaidと地域／課金条件、MCP／Actions／API・組織管理とJulesの制約・適合用途 | OSSや請求ゼロだけで学習利用を判定しない。製品ごとに契約と設定を確認。提供終了・preview・未確認事項の時点を保持する |

2026-10-01、OpenAI Docsスキルと原文を参照し、[Codexの権限](https://learn.chatgpt.com/docs/permissions)、[承認と境界](https://learn.chatgpt.com/docs/agent-approvals-security)、[Claudeの自社実行基盤](https://code.claude.com/docs/en/self-hosted-environments)、[承認モード](https://code.claude.com/docs/en/permission-modes)、[Google個人経路の再編](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals)、[Gemini APIのデータ条件](https://ai.google.dev/gemini-api/terms)、[Julesの実行](https://jules.google/docs)を確認した。変動する既定条件・提供プランの現在値を固定せず、原文の製品別確認日と資料を保つ。

## 実装・検証

9図47段階を実装。操作と実行・推論の場所、規約と強制・承認、認証と契約・データ条件を本文へ対応させた。実行先、通信とproxy、課金と地域の条件を切り替え、境界の違いを追える。3記事全原文ASTを保持し、表・例・リンク・確認日と未確認事項を削らない。`docs/`差分なし。

- rootとwebsiteの`npm ci`成功。共通487成功・3skip、サイト単体500成功。原文全保持とMDX許可・拒否、自社実行と外部推論、通信とproxyの4条件、APIの課金と地域の4条件を検査。未知のデータ条件は判定を拒否。
- 静的ビルド223ルート・230 HTML、対象ブラウザ11検査が成功。全47段階と全選択肢の1440px明色／390px暗色、同期・前後・シーク・拡大、3記事のJS無効、1280×720の再生停止と印刷を確認。
- 9図のPC表示またはSVGを目視。操作ラベルの折返しを整え、最終ビルドとブラウザ11検査が成功。修正後の2図も目視した。

文書・リンク・Markdown・差分検査も成功。

## 公開と後続

PR #79のマージ後の最新main（6765b2c132d0278ca50b644aad367cd4d435e76c）から提出する。通常PR・必須CI・squash・main CIとPages・公開表示は未実施。結果はPR本文へ追記する。次はCursor・Windsurf（Devin Desktop）・Devinの3記事。P2残りとP3〜P5は未完了。
