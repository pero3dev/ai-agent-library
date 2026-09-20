# GitHub 紹介ページの改善

## 目的と作業契約

- 目的: 初めて訪れる読者に、学習範囲・実用性・公開サイトの使い勝手・保守の仕組みを伝える。
- 依頼: 2026-09-20、提示した 7 案すべてを完了まで自律的に進める指示を受領。README・画像制作、GitHub の About / Website / Topics / social preview、branch / PR / CI / merge / 公開確認を対象に含む。
- 元 HEAD: `19aa46ef4acaef9affe1275c6f6c08525e52d8a5`。開始時は main、差分なし。origin は public の `pero3dev/ai-agent-library`。open PR なし。
- 作業 branch: `docs/github-showcase`。
- 所有パス: `README.md`、`assets/readme/`、この記録、`project/README.md`。再現用スクリプトが必要なら `scripts/` の今回専用ファイル。
- 分担: README、学習マップを別担当へ委任。画像・スクリーンショット・作業記録・検証・公開操作は主担当。
- 適用規約: `AGENTS.md`、`CONTRIBUTING.md`、`harness/git-rules.md`、`harness/git-conventions.json`、`project/README.md`。
- 検証: `npm ci`、`npm run check`、紹介する Python mock 実行、画像・README の視覚確認、独立レビュー、Git 形式検査、GitHub CI、merge 後の README・設定・公開確認。
- 終了条件: 7 案の成果物が main と GitHub の紹介設定へ反映され、上記確認の証拠と未実施範囲が残っている。
- 外部操作の許可根拠: 前ターンの 7 案（GitHub 設定を含む）に対するユーザーの「全て完了するまで自律的に作業を進めてください」。有料 API・新規課金は対象外。

## 開始時の確認

- ローカル main と取得した origin/main は一致。
- About の description / homepage / topics は未設定。
- 他の worktree は音声制作・定期最新化等の用途で存在し、今回の対象外。
- 記事本文やサイト機能は変更せず、既存成果の紹介を改善する。

## 実施と検証

| 案 | 成果物・状態 |
| --- | --- |
| 1. 冒頭を表紙にする | README の表紙・コピー・件数・主要導線を再構成。内蔵 imagegen で [hero](../../../assets/readme/hero.png) を制作 |
| 2. 学習領域を 1 枚にする | [学習マップ SVG](../../../assets/readme/learning-map.svg) と PNG。全 16 章を 4 領域に整理 |
| 3. サイトの実物を見せる | 公開サイトのトップ・検索・依存マップ・音声プレーヤーを撮影 |
| 4. 看板記事を厳選する | 初学者 3 本・実務 3 本と Workflow / Agent の設計判断表 |
| 5. すぐ試せる入口 | structured-output の Python 標準ライブラリだけの mock 手順・実出力 |
| 6. 品質管理を見せる | 実 CI バッジ・独立レビュー手順・定期更新・最近の変更と根拠記録への導線 |
| 7. GitHub 紹介を統一 | About / Website / Topics は反映・再取得確認済み。Social preview は画像準備済み、ブラウザログイン待ち |

- 公開記事 199 本は front matter、16 章はディレクトリ、Python 6 件はサンプル一覧で確認。
- structured-output の `--mock` を実行し、不正な priority の拒否 → 再試行 → 検証成功を確認。実 API は使っていない。
- `npm ci` と `npm run check` は成功。FFmpeg 実統合試験 1 件は環境変数 / PATH 不足で skip（今回の画像・README 変更とは無関係）。
- 最終 README / 素材案内の編集後、Markdown lint・記事規約（215 files）・相対リンク（291 files / 5,214 links）を再確認して成功。
- 学習マップは Chromium 描画を目視確認。800px 相当の表示で文字の領域外はみ出し 0、章番号 00〜15 が各 1 回。
- 公開サイトは Codex 内ブラウザーで検索結果・依存マップ・音声プレーヤーを確認。音声は 0:29 までの短い再生と一時停止を確認した範囲で、全編音質や iPhone 実機検証を意味しない。
- 表紙・共有画像は 1280 × 640、987,029 bytes。プロンプトと更新方法は[画像の案内](../../../assets/readme/README.md)に保存。
- 独立レビュー、PR、GitHub CI、マージ・公開の結果は確定後に追記する。

## GitHub 設定

2026-09-20 に CLI で以下を反映し、再取得して一致を確認。

- About: `AI Agentを理解から設計・実装・評価・運用まで学ぶ日本語ライブラリ。199記事・16章、APIキー不要のモック対応Pythonサンプル、検索・依存マップ・音声学習を収録。`
- Website: <https://pero3dev.github.io/ai-agent-library/>
- Topics: `agentic-ai`, `ai-agents`, `documentation`, `japanese`, `learning-resources`, `llm`, `mcp`, `prompt-engineering`, `python`, `rag`。
- Social preview: [アップロード用 PNG](../../../assets/readme/social-preview.png) を準備。ブラウザーの GitHub 認証が必要で、ログインはユーザーへ依頼済み。認証情報は取得・保存しない。
