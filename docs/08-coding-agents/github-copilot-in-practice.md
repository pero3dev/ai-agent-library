---
title: "GitHub Copilot 実践ガイド"
category: "coding-agents"
level: "intermediate"
status: "published"
last_updated: "2026-07-06"
tags: ["coding-agents", "cost-management", "prompt-caching"]
---

# GitHub Copilot 実践ガイド

## この記事の目的

GitHub Copilot の機能群(補完 / Chat / agent mode / cloud agent / code review / CLI)をタスクに応じて使い分け、AI Credits の消費を管理しながら業務を効率化できるようになります。製品の選定判断は [GitHub Copilot](github-copilot.md) が正で、本記事は「導入済みの人が使いこなす」段階を扱います。

## 対象読者

- Copilot を補完・チャット中心に使っており、エージェント機能と自動化を活用したいエンジニア
- AI Credits の消費と予算を管理する立場の管理者・テックリード

## 前提知識

- [GitHub Copilot](github-copilot.md) — 機能群の全体像・権限・データ取り扱い
- [コーディングエージェントのコスト最適化](coding-agent-cost-optimization.md) / [自動化・業務効率化パターン](coding-agent-automation-patterns.md) — ツール非依存の原則

## 本文

> **最終確認日:** 2026-07-06 — 本記事の機能・消費の仕様はこの日付時点の公式ドキュメントに基づきます。単価・付与量は特に変わりやすいため、必ず公式ページ(参考資料)で最新値を確認してください。

### タスク別の機能の使い分け

公式に「タスクに合う AI ツールの選び方」のガイドがあり、**開発フェーズ × 制御の強さ**で整理できます。

| タスク | 使う機能 | 制御の強さ |
| --- | --- | --- |
| 計画・技術選定 | Chat(ask)、cloud agent(リポジトリ調査 → 実装計画の作成) | 人が判断 |
| 打鍵中の支援 | 補完・Next edit suggestions | 常時人が採否 |
| 対象を絞った編集 | Chat の edit モード(対象ファイルと承認を人が握る) | 人が細かく制御 |
| 反復作業・複数ステップ | agent モード(IDE 内で計画 → 実行 → 反復) | 節目で承認 |
| Issue 単位の委任 | cloud agent(非同期で PR 化) | 事後レビュー |
| レビュー | code review(IDE / PR) | 人のレビューの前段 |

**cloud agent の「向く / 向かないタスク」は公式が明記しています**。向くのは well-defined でスコープが明確な Issue(バグ修正・テストカバレッジ改善・ドキュメント更新・技術的負債)。向かないのは ①リポジトリ横断の知識が要る広範なリファクタリング ②本番クリティカル・セキュリティ・個人情報・認証に関わる変更 ③要件が曖昧なタスク ④自分の学習が目的のタスク、の 4 類型です。この線引きは委任の判断基準としてそのまま使えます。

CLI では、複雑な複数ファイル変更に **plan モード**(「具体的な計画を与えられたモデルは成功率が上がる」と公式明記)、付随的・長時間のタスクには **`/delegate`**(CLI から cloud agent への委譲)が使えます。

### カスタマイズ機構の実践

- **custom instructions は機能ごとに対応が異なります**。`.github/copilot-instructions.md` は全機能対応ですが、パス別の `.instructions.md` は IDE・CLI 向けで GitHub.com 上の Chat には効かない、`CLAUDE.md` / `GEMINI.md` を読むのは cloud agent のみ、など対応マトリクスが公式にあります。「置いたのに効かない」の大半はこの対応差です
- **code review はベースブランチ側の指示を使います**(PR ブランチ側ではない)。レビュー観点の変更が既存 PR に効かない理由もこれです
- **prompt files**(`.github/prompts/*.prompt.md`)は再利用プロンプトを `/名前` で呼び出す仕組み、**Agent Skills**(`.github/skills/` 等)は手順 + スクリプトのパッケージで cloud agent・code review・CLI が読み込みます。「同じ依頼を繰り返している」ものから順にスキル化します
- **custom agents**(`.github/agents/*.md`)は cloud agent の特化版を定義でき、組織リポジトリ(`.github`)で全社配布もできます。Issue 割当時・API からも指定可能です
- **Copilot Spaces** はコンテキストの束ね方に特性があります: リポジトリ添付は検索で関連部分のみ取得(大規模向き)、**ファイル添付は毎クエリ全文が載る**(常に参照させたい少数ファイル向き)。この差は精度と消費の両方に効きます
- **Copilot Memory**(preview)はリポジトリの事実と個人の嗜好を記憶し、cloud agent・code review・CLI で共有されます(未使用の記憶は自動削除されます。保持期間は 2026-07 時点で 28 日)

### コスト削減: AI Credits の構造とレバー

**構造の理解が先です**(2026-07 時点): 消費は「トークン量 × モデル別単価」で AI Credits に換算されます。注意点が 3 つあります。

1. **「モデル乗数」は旧制度(プレミアムリクエスト)の概念で、現行の AI Credits には適用されません**。乗数表を前提にした古い情報に注意してください
2. **補完と Next edit suggestions は Credits を消費しません**(有料プランで無制限)。「無料側の機能を使い切る」のが第一のレバーです
3. **cloud agent と code review は AI Credits に加えて GitHub Actions 分も消費します**(二重消費)。IDE 内の agent モードは Credits のみです

公式チュートリアル「Optimizing your AI usage」の主な削減策は次のとおりです。

- **計画は強いモデル、実装は安いモデル** — フェーズ間でセッションを分けます。モデルの単価はカテゴリ間で桁が変わるほど違います(2026-07 時点で両端およそ数十倍)。定型作業(リファクタ・整形・ドキュメント)は軽量モデルで十分と公式が明記しています
- **auto model selection で割引** — 自動モデル選択の利用には割引(2026-07 時点で 10%)があります
- **キャッシュを壊さない** — キャッシュ済みトークンは入力単価の 10% です(2026-07 時点)。ただし**セッション途中のモデル切替・reasoning level やツール構成の変更・長時間放置後の復帰**でキャッシュは無効化されます。「タスクが変わったらモデルを切り替える」のではなく「**セッションを分けてから切り替える**」のが消費面の正解です
- **コンテキスト衛生** — タスク切替時の `/new`・`/clear`、CLI の `/compact`、`/context` での内訳確認
- **指示ファイルの整備自体が削減策** — リポジトリ構造を custom instructions に書いておくと、エージェントの探索的なファイル読み(入力トークン)が減ります。cloud agent では `copilot-setup-steps.yml` による依存の事前インストールが「環境構築の試行錯誤」の消費を削ります
- **ツールセットを絞る** — ツール定義もトークンを消費します。タスクに関係あるものだけ有効化します

**付与と予算の構造**: 個人プランは base + flex の二層、組織は請求単位でのプール制(個人別割当ではない)で、**繰越はなく毎月 UTC 月初にリセット**されます(契約体系の全体は [GitHub Copilot](github-copilot.md) と公式料金ページを参照)。予算は 4 階層(ユーザー / コストセンター / 組織 / エンタープライズ)あり、**ユーザーレベル予算(ULB)だけは常にハードストップ**です。複数予算が重なる場合は「残枠が最少の予算が先に効く」ルールです。測定は AI usage ダッシュボード・CSV エクスポート(公式が予算サイズ決定の一次資料と位置づけ)・課金 usage API を使い、導入効果測定には別系統の usage metrics API を使います。

### 業務効率化・自動化

- **Issue → cloud agent の運用**: 良いタスク定義の 3 要素は「問題の明確な記述・受け入れ基準・変更対象ファイルの方向付け」です(公式明記)。PR への修正依頼は 1 件ずつ送らず「Start a review」でまとめて送ると、エージェントがまとめて対応します。REST / GraphQL API から Issue 割当・タスク起動もでき(Business / Enterprise、user-to-server トークン限定)、custom agent・モデルの指定も可能です
- **automations**: Agents タブからスケジュール(hourly / daily / weekly)またはイベント(Issue 作成・PR オープン / 同期)で cloud agent を定型起動できます。**消費は automation の作成者に課金**され、**write 権限のないユーザー起因のイベントは既定で無視**されます(プロンプトインジェクション対策と公式明記)。対象は private / internal リポジトリのみです
- **code review の自動化**: ブランチ ruleset で「Copilot レビューの自動リクエスト」を設定します(組織レベルでパターン包含 / 除外可)。draft PR のレビュー(人のレビュー前の早期発見)、レビュー強度(effort level。Medium は消費増と公式明記)のオプションがあります
- **Agentic Workflows**(preview): Markdown(frontmatter + 自然言語指示)で定義し GitHub Actions として実行する上位機能です。エンジンを選択でき(Copilot / Claude / Codex / Gemini)、**read-only 既定 + 宣言した safe-outputs 経由でのみ書き込み**という安全モデルと、実行あたりの Credits 上限(既定値あり)を備えます。CLI を素の Actions で回すより、このガードレール込みの機構が公式推奨です

## 実務での注意点

### アンチパターン

- **旧「プレミアムリクエスト・モデル乗数」の知識で消費を見積もる** — 現行の AI Credits には乗数は適用されません。→ トークン × モデル単価の現行制度で見積もり、単価は公式ページで確認します
- **全タスクを最上位モデルで回す** — 単価差はカテゴリ間で桁違いです。→ 計画 = 強いモデル / 実装・定型 = 軽量モデルで分け、auto model selection も検討します
- **セッション途中でモデル・設定を頻繁に切り替える** — キャッシュが無効化され、割高な非キャッシュ入力に戻ります。→ タスクの切れ目でセッションを分けてから切り替えます
- **予算設定なしで組織プールを開放する** — プール枯渇後の従量は上限なしで累積しえます。→ ULB(ハードストップ)+ 組織予算 + 超過時ポリシーを導入時に設定します
- **曖昧な Issue を cloud agent に割り当てる** — 公式の「向かないタスク」4 類型に該当し、Actions 分と Credits を浪費します。→ タスク定義 3 要素を満たす Issue に分割してから割り当てます

### チェックリスト

- [ ] タスク別の機能使い分け(edit / agent / cloud agent / review)をチームで共有したか
- [ ] custom instructions の機能別対応差(GitHub.com Chat・code review のベースブランチ参照)を理解して配置したか
- [ ] 無料側の機能(補完・Next edit suggestions)を最大活用しているか
- [ ] モデル使い分けの目安(計画 = 強 / 実装 = 軽量)とセッション分割の習慣があるか
- [ ] ULB・組織予算・超過時ポリシーを設定し、AI usage ダッシュボードを定期確認しているか
- [ ] automations(作成者課金)と自動 code review(PR 作成者帰属)の消費先の違い、および Actions 分との二重消費を把握しているか

## 関連トピック

- [GitHub Copilot](github-copilot.md) — 機能群・権限・データ取り扱い(選定判断の正)
- [コーディングエージェントのコスト最適化](coding-agent-cost-optimization.md) — ツール非依存のコスト原則
- [自動化・業務効率化パターン](coding-agent-automation-patterns.md) — 自動化の設計原則
- [ルールファイルと設定の設計](coding-agent-rules-and-config.md) — custom instructions の内容設計

## 参考資料

- [Choosing the right AI tool(GitHub Docs)](https://docs.github.com/en/copilot/concepts/ai-tools) — タスク別の機能選択(アクセス日: 2026-07-06)
- [Get the best results from cloud agent](https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results) — 向く / 向かないタスクとタスク定義(アクセス日: 2026-07-06)
- [Optimizing your AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage) — 公式のコスト削減チュートリアル(アクセス日: 2026-07-06)
- [Models and pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing) — モデル別単価の一次情報(アクセス日: 2026-07-06)
- [Budgets for usage-based billing](https://docs.github.com/en/copilot/concepts/billing/budgets-for-usage-based-billing) — 予算 4 階層と ULB(アクセス日: 2026-07-06)
- [About GitHub Agentic Workflows](https://docs.github.com/en/copilot/concepts/agents/about-github-agentic-workflows) — safe-outputs 型の自動化(アクセス日: 2026-07-06)
- [Custom instructions support(対応マトリクス)](https://docs.github.com/en/copilot/reference/custom-instructions-support) — 機能別の指示ファイル対応(アクセス日: 2026-07-06)

## TODO・未確認事項

- code review の effort level に High があるか、custom agents でのモデル指定可否、cloud agent タスク完了の Webhook 通知、automations の実行回数上限は確認できていません(未確認)

### 変わりやすい項目(定点観測)

> **TODO(要確認):** モデル別単価・プラン別 Credits 付与量(base + flex)・auto model selection の割引率・キャッシュ単価比率を公式ページ(models-and-pricing)で確認する(本文には 2026-07 時点の相対関係のみ記載。最終確認: 2026-07)

> **TODO(要確認):** preview 機能(automations・Agentic Workflows・custom agents の対応 IDE・Copilot Memory)のステータスと仕様変化を Changelog で確認する(最終確認: 2026-07)
