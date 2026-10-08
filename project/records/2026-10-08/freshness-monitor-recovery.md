# Issue #220 — 未完了観測の再開と公開記録

2026-10-08（日本時間）。[Issue #220](https://github.com/pero3dev/ai-agent-library/issues/220)の依頼に従い、最新の[ROADMAP](../../../ROADMAP.md)、[運用手順](../../../freshness-automation.md)、[freshness-maintenance](../../../.agents/skills/freshness-maintenance/SKILL.md)を照合して限定観測を再開しました。今回の成果は3系統の部分観測であり、16系統の宣言範囲の完了記録は引き続きありません。

記事7本と観測manifestのマージ・main CI・Pages・公開本文確認を完了しました。ROADMAP要約と本記録はPR #223で同期し、その最終公開証拠は[Issueの進捗コメント](https://github.com/pero3dev/ai-agent-library/issues/220#issuecomment-6044524598)へ保存します。

## 目的と開始時の照合

既存checkpoint・PRを先に照合し、一次資料で確認した事実訂正と再試行が必要な項目を分けて保存します。所有範囲は選定3系統の既存記事・research、注目事項、専用manifest、および実施記録と公開台帳です。検証・終了条件は記事の独立レビュー、明示検査、PRの必須CI、マージとPages、実GitHub監視を確認して、未確認を完了へ換算せず次回へ渡すことです。ユーザーは2026-10-08にCI成功後のマージと、記事・台帳の公開までの継続を承認しました。既存のレビュー・CI・公開条件を維持します。

開始時mainは `4c72c1a651bd01cc4034e0c10b1dbaeec63c46da`、作業差分なしでした。ローカルcheckpoint・lock・完了stateはなく、open PRもありませんでした。[既存PR #60](https://github.com/pero3dev/ai-agent-library/pull/60)のマージと過去の公開manifestを照合しました。失われた完了日を推定で復元せず、新しいrun `20261007t173132543z-fc61a4ee` に実観測だけを保存しました。

再開時は[記事PR #221](https://github.com/pero3dev/ai-agent-library/pull/221)、[進捗PR #223](https://github.com/pero3dev/ai-agent-library/pull/223)、既存checkpointと分離した依存修復PR #222を先に照合しました。最終記事baseは `08e12dd2619a3493d2396cf8452889898aeff059` です。開始時baselineと旧監視のheadを後続mainへ書き換えず、別欄で記録しました。

## 今回の確認範囲

| 系統 | 一次資料と結び付いた範囲 | 未確認の範囲 |
| --- | --- | --- |
| coding-agents | 登録28記事中4記事の特定主張。Copilotの3期日、Continueの保守方針・非アーカイブ属性、Codex2記事の認証方式別モデルとcredits | 他24記事、Copilotの将来期日後の実施、preview・料金の全条件、Continueのサポート保証、実課金・絶対利用枠 |
| models-prompting | 登録41記事中4記事のモデル仕様・料金・提供条件とeffort経路。3社のrelease notes・deprecations・pricing計9面を取得し、Sonnet5.5のeffort条件とキャッシュ料金を独立再取得 | 他37記事、全提供経路や実API、Cyberの実停止。旧期間の確認日を系統完了日として更新しません |
| compliance | 登録6記事を読み、規制記事1記事の特定主張を一次資料へ照合 | 他5記事は本文・参照・TODOの読取のみ。施行・最終化・取得失敗した公文書などは再試行待ち |

26観測をchanged 10、unchanged 8、unverifiable 6、failed 2へ分類しました。7記事と9件のresearchへ確認済みの訂正と根拠を同期しました。モデルの価格条件、発表・将来の適用予定・実施確認を区別し、publishedを維持しています。法的適用判断・ライセンス解釈・セキュリティ推奨の変更は含みません。[記事PRのmanifest](../../../research/freshness-runs/20261007t173132543z-fc61a4ee.json)が根拠と実取得時刻の正本であり、軽量観測へ同じ内容を重複exportしません。

Sonnet5.5のターンごとのeffort変更は `thinking.type=adaptive` が条件です。独立再取得した料金表とPrompt caching節ではcache readが入力$2/MTokに対して$0.10/MTok（0.05x）で一致し、記事の既定0.1xへの例外として同期しました。元取得時の$0.20/$0.10の不一致は履歴として残し、価格改定の発生日や実課金を確認済みにはしていません。再取得時刻はeffortが2026-10-08T01:27:34Z、pricingが2026-10-08T01:29:04Zです。

`coverage=[]` と `completed_systems=[]` を維持しました。未選定13系統には今回の観測や完了日を付けていません。記事パス別の確認範囲と未観測一覧は[JSON](freshness-monitor-recovery.json)に残します。

## 検証と公開

対応Node 24.19で追加訂正を含む記事本文・根拠の `npm run check` が成功しました。単体523件中520成功・3skip、Markdown・記事・リンク・前提知識・TODO集計・ハーネス・配置・Git形式を検査しました。以前のWindows sandbox失敗はsymlink fixtureのEPERM/ENOENTであり、検査を弱めず必要な権限で同じチェックを通しました。実API・実端末は未検証です。

記事PR #221は最終head `805cea16cfcd96448fa9bfbf0263fdc357492f08`、独立レビューapproved / low、digest `f949a5b63ae416ae58bce673efa9b7c7d8c6a0004ab2c614516c65f76b9df08f` を照合し、freshness-policyと[必須11 CI](https://github.com/pero3dev/ai-agent-library/actions/runs/37716531648)が成功しました。[main CI初回](https://github.com/pero3dev/ai-agent-library/actions/runs/37717877003/attempts/1)は既存の目次再読込1件が失敗（ブラウザ660成功・5skip）し、Pages未公開でした。同じSHAで失敗ジョブだけを再実行し、attempt 2では検査成功後もdeployジョブとdeploymentのAPI状態がin_progressのままで公開を認定できず、deployジョブを再実行しました。テストや閾値を変更せずattempt 3の成功を確認しました。実merge `11275ba37fb26177aaabed8c3dcb3e7ca655d03c` の[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/37717877003)・Pages deployment 6926303669 が成功し、7ページすべてでHTTP 200と必須の本文文字列を確認しました。公開URL・確認時刻・文字列はJSONへ記録しました。

[依存修復PR #222](https://github.com/pero3dev/ai-agent-library/pull/222)はheadの必須11 CI成功後にmerge `863cb74b2c641bd20731d1b3a6b8ff4d3aefa823` へ入りましたが、[そのmain CI](https://github.com/pero3dev/ai-agent-library/actions/runs/37712461493)は新しいNext.js High advisoryで失敗しました。そのhead成功をmain公開の成功には換算していません。

[後続修復PR #238](https://github.com/pero3dev/ai-agent-library/pull/238)はNext 16.3.6から同一系列16.3.8へ限定し、付属env/SWC以外を更新していません。監査High/Critical/Moderate各0、既存Low 8、隔離サイト84単体・232 HTML/230ルートのクリーンビルドが成功しました。独立読取レビューlowと必須11 CI成功後にmerge `08e12dd2619a3493d2396cf8452889898aeff059` へ入り、[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/37715354722)・Pages deployment 6925561686・公開到達を確認しました。PR #222の修復内容もこの後続mainに含まれます。

最終記事レビューではEU条文の再取得が転送・取得制限のため失敗し、欧州委員会概要の高リスク2期限だけを独立再確認しました。Article 111(4)・113の全本文を今回再取得済みとは扱わず、個別案件への法的適用も未検証です。

公開台帳はコミット済みmanifestから集計します。記事公開後のmainで通常PR #223のROADMAP要約を同期し、本記録の最終merge・CI・Pages証拠は上記のIssueコメントへ追記します。記録自身の未来merge SHAを埋めるために循環した更新は行いません。

## 残件と次回の操作

Sonnet5.5の料金整合確認 `models-prompting-sonnet55-cache-pricing-20261008` は今回の独立再取得で解消し、`resolved_pending_ids` に記録しました。従来の未解決11項目に、最終レビュー追補のHaiku 5.5公開・仕様/価格/提供経路の限定再確認を新ID `models-prompting-haiku55-release-20261008` で追加しました。checkpointの未解決pendingは12項目です。追補の取得UTCは未測定のためmanifestへ推測で追加せず、次回実UTC付きで[release notes](https://platform.claude.com/docs/en/release-notes/overview)を再取得します。元pricing取得時点の履歴も維持します。原IDがあるContinue項目は `coding-continue-support-20260917` のまま引き継ぎます。原公開manifestにIDがない旧項目は、今回の追跡用新IDに `recovered` を付け、過去の原IDとは扱いません。再試行日・根拠・理由は[JSON](freshness-monitor-recovery.json)に保存します。

- 2026-10-11以降: Continueの公式FAQ回答または継続サポート告知と、Haiku 5.5の公開告知・仕様/価格/提供経路を再取得します。
- 2026-10-14以降: Cyber実停止、PPC施行政令・正式公募、EU整合規格の官報引用、California本文、FTC最終化、Commerce/NTIA、Colorado実施・最終化、DOJ裁判判断を一次資料で再確認します。
- 2026-10-27以降: Coloradoの10月26日期日後の受付終了・審理延長を確認します。Copilotの10月19日・22日、その他モデルの将来期日はROADMAPの注目事項に沿って実施・延期を確認します。

未選定の過去残件も残します。ベンチマークの `benchmarks-tb4-numerical-cost-20260917` は費用包含範囲・単価・欠測集計が未解決であり、次のbenchmarks runで原IDを復元します。Robin / AI co-scientistの独立追試、EU Annex I採択原文・官報・発効、AWS Sustainabilityの実画面移行は今回未観測です。[旧9月28日記録](../../../research/freshness-runs/20260927t222509029z-952c90ea.json)と[旧9月21日記録](../../../research/freshness-runs/20260920t222658728z-922c2745.json)を上書きしません。

## 監視と完了条件

[10月5日の実schedule監視](https://github.com/pero3dev/ai-agent-library/actions/runs/37250941225)はmain `4c72c1a651bd01cc4034e0c10b1dbaeec63c46da` で成功し、16系統の完了記録なしを通知していました。指定されたクライアントtask ID2件のローカル登録と設定を読み取りで確認したところ、該当登録0件・設定ディレクトリなしでした。これは指定IDの不在の証拠であり、別ID・別環境の登録や観測遅延の原因を確定しません。実クライアントのScheduled起動と通知の到達は未検証です。

[前回の実workflow_dispatch dry-run](https://github.com/pero3dev/ai-agent-library/actions/runs/37667955241)はmain `4c72c1a651bd01cc4034e0c10b1dbaeec63c46da` で成功し、`attention_systems=16 existing_tracking_issue=220 dry_run=true` を実ログで確認しました。Issueへの書き込みなしで、未公開観測の混入がないことと16系統の検知を確認しました。記事manifest公開後のmainで[実監視](https://github.com/pero3dev/ai-agent-library/actions/runs/37721945709)を再実行し、`attention_systems=16 existing_tracking_issue=220 dry_run=false` とIssue本文更新・OPENを確認しました。台帳PR公開後の最終照合はIssueコメントに記録します。旧scheduleとdry-runのheadを最終baseへ置き換えません。

16系統すべてが宣言範囲のverified coverageを持ち、目標周期内のcurrentになることがIssue #220のClose条件です。今回の部分観測ではcurrent 0・unknown 16のままで、条件を満たしません。Issue #220はopenを継続します。記事・台帳の公開と監視再実行を完了しても、部分観測だけで系統完了やIssueのCloseへ進めません。
