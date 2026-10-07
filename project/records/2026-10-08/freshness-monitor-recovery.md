# Issue #220 — 未完了観測の再開と公開記録

2026-10-08（日本時間）。[Issue #220](https://github.com/pero3dev/ai-agent-library/issues/220)の依頼に従い、最新の[ROADMAP](../../../ROADMAP.md)、[運用手順](../../../freshness-automation.md)、[freshness-maintenance](../../../.agents/skills/freshness-maintenance/SKILL.md)を照合して限定観測を再開した。今回の成果は3系統の部分観測であり、16系統の宣言範囲の完了記録は引き続きない。

## 目的と開始時の照合

既存checkpoint・PRを先に照合し、一次資料で確認した事実訂正と再試行が必要な項目を分けて保存する。所有範囲は選定3系統の既存記事・research、注目事項、専用manifest、およびこの実施記録と公開台帳である。検証・終了条件は記事の独立レビュー、明示検査、PRの必須CI、マージとPages、実GitHub監視を確認して、未確認を完了へ換算せず次回へ渡すこととした。外部操作はユーザーが依頼したfreshness-maintenanceの通常運用に基づく。

開始時mainは `4c72c1a651bd01cc4034e0c10b1dbaeec63c46da`、作業差分なし。ローカルcheckpoint・lock・完了stateはなく、open PRもなかった。[既存PR #60](https://github.com/pero3dev/ai-agent-library/pull/60)のマージと過去の公開manifestを照合した。失われた完了日を推定で復元せず、新しいrun `20261007t173132543z-fc61a4ee` に実観測だけを保存した。

## 今回の確認範囲

| 系統 | 一次資料と結び付いた範囲 | 未確認の範囲 |
| --- | --- | --- |
| coding-agents | 登録28記事中4記事の特定主張。Copilotの3期日、Continueの保守方針・非アーカイブ属性、Codex2記事の認証方式別モデルとcredits | 他24記事、Copilotの将来期日後の実施、preview・料金の全条件、Continueのサポート保証、実課金・絶対利用枠 |
| models-prompting | 登録41記事中4記事のモデル仕様・料金・提供条件とeffort経路。3社のrelease notes・deprecations・pricing計9面を取得 | 他37記事、全提供経路や実API、Cyberの実停止。旧期間の確認日を系統完了日として更新しない |
| compliance | 登録6記事を読み、規制記事1記事の特定主張を一次資料へ照合 | 他5記事は本文・参照・TODOの読取のみ。施行・最終化・取得失敗した公文書などは再試行待ち |

25観測をchanged 9、unchanged 8、unverifiable 6、failed 2へ分類した。7記事には確認済みの訂正だけを反映した。モデルの価格条件、発表・将来の適用予定・実施確認を区別し、publishedを維持した。法的適用判断・ライセンス解釈・セキュリティ推奨の変更は含まない。[記事PRのmanifest](https://github.com/pero3dev/ai-agent-library/blob/52814f7a79ba4c746a0038c1d0afcae16bb56df2/research/freshness-runs/20261007t173132543z-fc61a4ee.json)が根拠と実取得時刻の正本であり、軽量観測へ同じ内容を重複exportしない。

`coverage=[]` と `completed_systems=[]` を維持した。未選定13系統には今回の観測や完了日を付けていない。記事パス別の確認範囲と未観測一覧は[JSON](freshness-monitor-recovery.json)に残す。

## 検証と公開

`npm ci` と対応Node 24.19による `npm run check` が成功した。単体523件中520成功・3skip、Markdown・記事・リンク・前提知識・TODO集計・ハーネス・配置・Git形式を検査した。最初のWindows sandbox実行はシンボリックリンクfixtureのEPERM/ENOENTで失敗し、同じ検査を必要な権限で実行し直した。実API・実端末は未検証である。

[記事PR #221](https://github.com/pero3dev/ai-agent-library/pull/221)は最終treeの独立レビューapproved / low、指摘0件。最終freshness-policy・harness-policyも成功した。[実CI](https://github.com/pero3dev/ai-agent-library/actions/runs/37665893911)では必須8件が成功したが、build・Chromium音声・WebKit音声が既存サイト依存のHigh監査で停止した。PRは未マージであり、今回の記事・部分観測はmain/Pagesへ未反映である。

[分離した依存修復draft PR #222](https://github.com/pero3dev/ai-agent-library/pull/222)はsharp 0.35.5とsource-map-js 1.2.2だけを固定する。High/Critical 0、サイト単体84件、公開相当のクリーンビルド232 HTML・230ルートは成功した。依存更新は通常の最新化自動マージから除外されるため、マージ判断待ちとして保存する。

公開台帳はコミット済みmainの集計が正本である。未マージの観測日をROADMAPへ先に反映しない。記事PRのマージ・main CI・Pages・公開本文確認後に台帳の区画を更新する。

## 残件と次回の操作

選定系統のpendingは12項目を維持し、原IDがあるContinue項目は `coding-continue-support-20260917` のまま引き継いだ。原公開manifestにIDがない旧項目は、今回の追跡用新IDに `recovered` を付け、過去の原IDとは扱わない。再試行日・根拠・理由は[JSON](freshness-monitor-recovery.json)に保存した。

- 2026-10-11以降: Continueの公式FAQ回答または継続サポート告知を再取得する。
- 2026-10-14以降: 公式Sonnet5.5キャッシュ料金の表と説明節の整合、Cyber実停止、PPC施行政令・正式公募、EU整合規格の官報引用、California本文、FTC最終化、Commerce/NTIA、Colorado実施・最終化、DOJ裁判判断を一次資料で再確認する。
- 2026-10-27以降: Coloradoの10月26日期日後の受付終了・審理延長を確認する。Copilotの10月19日・22日、その他モデルの将来期日はROADMAPの注目事項に沿って実施・延期を確認する。

未選定の過去残件も残す。ベンチマークの `benchmarks-tb4-numerical-cost-20260917` は費用包含範囲・単価・欠測集計が未解決であり、次のbenchmarks runで原IDを復元する。Robin / AI co-scientistの独立追試、EU Annex I採択原文・官報・発効、AWS Sustainabilityの実画面移行は今回未観測である。[旧9月28日記録](../../../research/freshness-runs/20260927t222509029z-952c90ea.json)と[旧9月21日記録](../../../research/freshness-runs/20260920t222658728z-922c2745.json)を上書きしない。

## 監視と完了条件

[10月5日の実schedule監視](https://github.com/pero3dev/ai-agent-library/actions/runs/37250941225)は成功し、同じmainから16系統の完了記録なしを通知していた。指定されたクライアントtask ID2件のローカル登録と設定を読み取りで確認したところ、該当登録0件・設定ディレクトリなしだった。これは指定IDの不在の証拠であり、別ID・別環境の登録や観測遅延の原因を確定しない。実クライアントのScheduled起動と通知の到達は未検証である。

[実workflow_dispatchのdry-run](https://github.com/pero3dev/ai-agent-library/actions/runs/37667955241)はmain `4c72c1a`で成功し、`attention_systems=16 existing_tracking_issue=220 dry_run=true`を実ログで確認した。Issueへの書き込みなしで、未公開観測の混入がないことと16系統の検知を確認した。記事・台帳の公開後は更新後のmainで再実行し、Issue本文と照合する。16系統すべてが宣言範囲のverified coverageを持ち、目標周期内のcurrentになることがIssueのClose条件である。今回の部分観測では条件を満たさないため、Issue #220をopenのまま継続する。
