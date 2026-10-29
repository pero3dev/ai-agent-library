# iOS17試行の実測に基づく時間予算

2026-10-30。自分用iOSアプリの自律実装・小さなcommitとPR・通常保護main統合を進める依頼に基づく。所有範囲は専用workflow・driver・既存Node検査と、本記録2本・索引・完成計画の7ファイルである。実機操作は未完了のまま進める許可を引き継ぎ、新規の契約・課金・配布・OS導入は含めない。

## 実際に時間切れとなった工程

[初回一覧回復の候補](ios17-initial-runtime-query-recovery.md)を含むhead `07e435aed97e808612d8d0874bced12b10dcf6ad`の[初回Pilot](https://github.com/pero3dev/ai-agent-library/actions/runs/40924687976/attempts/1)（job `123626931531`）では、functionalのintentがfull480,000msを割り当て、480.821751秒でSIGKILL／`command-or-shared-deadline`となった。resource failureはfalse、cancelはnull、cleanupはowned-device-deleted、全体は1,153.493635秒だった。共有残量の実値は保存されていないが、intentは短縮された値ではなく8分の全量である。

保持された末尾はUI試験の検索欄操作に到達し、UI内部時刻91.99秒まで続いている。stdout全434,743byteのうち末尾だけが証跡に残るため、開始前の失敗とも、46単体検査の完了とも断定しない。xcresultの型付き結果を取得する前に停止しており、期待47件は未受入である。39GiB制限の資源違反は記録されなかったが、使用量のpeakや将来の容量保証は得ていない。

初回runtime一覧は28.439144秒でexit 0となり、新しい初回回復経路は実行されなかった。postbootの一覧は75.384397秒で停止し、従来のfresh読取が15.363857秒で成功した。起動待ち201.561259秒、download110.098303秒、代表生成72.660729秒、fixture生成56.069736秒、package検査2本38.564984秒などが先行した。新たな認証・同意・runtime削除は行っていない。

## 次の1回に限る予算

functionalの上限を8分から10分、共有作業上限を19分から23分へ変更する。準備の実測約11分に試行10分と後処理のactual-info15秒・結果取得60秒を加えた22.25分を切り上げた予算であり、10分で成功する実測や製品の性能目標ではない。cleanup2分は保持し、従来と同じ余白構造でworkflowのprobeを22分から26分、jobを25分から29分へ合わせる。

共有deadlineによる各commandの残量制限、取消・first-stop、exact17.0／21A328と所有device、47件の完全一致・全Passed、free2GiB／総owned logical39GiB、出力・証拠上限とcleanupの判定は保持する。生成器・UI手順・selector・assert・再試行条件には広げない。新しい時間で再び未完了なら、原因と未受入をDraftに残し、自用候補のチェックポイント等を優先する。上限の反復変更は予定しない。

## 確認と統合の区切り

変更はdriverの2数値、workflowの2数値、既存検査が確認する予算metadataの期待値1箇所である。初回は旧19分の期待値だけが失敗した記録を保持し、assertを残したまま23分へ同期した。旧89件の識別子と他の検査は保持し、最終Node89件は全成功（fail／skip／cancel0、wall2.619秒）、構文とactionlintもexit 0だった。actionlintの外部shellcheck／pyflakesは無効にしている。各置換の逆変換で元ファイル全byteへ戻る。

Source3の独立レビューはP1／P2なしで受け入れられた。全2,828パスの候補で共通検査は1,261件中1,246成功・15skip・失敗0（npm exit 0、wall41.491秒）だった。同じ検証済みlockfileと準備済み依存を再利用した。以後の記録だけの変更は文書・形式の限定検査と最終独立レビューで確認し、Source検査やSDKを繰り返さない。App0.2.23（25）・保存形式・provider、TODO32行／完了13行と全rowは変更しない。同じheadのRuntime26既存2件は各1開始・1成功だったが、iOS17の受入へ転用しない。[完成計画](../../plans/engineering/ios-app-completion.md)の実機上書き・VoiceOver・最低OS全体・Release性能等は未完了を保持する。

作者baseは07e、tree `e8306e4ae6154d6c455021ebe2d0ceaec03a401b`・2,826パスで、mainca595を含む。既存5変更・新記録2本の1commitとして既存[Draft PR #301](https://github.com/pero3dev/ai-agent-library/pull/301)へ通常FFで追加し、新headの必要CIと実47件を確認する。成功時もReady後の最新必須11・最終metadata、通常保護main統合と反映後CIを区切る。旧headの再実行・追加Draft置換・admin例外は行わない。取得元とdigestは[機械可読記録](ios17-measured-time-budget.json)に残す。
