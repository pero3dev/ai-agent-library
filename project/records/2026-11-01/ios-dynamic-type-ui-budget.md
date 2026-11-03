# 専用Dynamic Type UI試験の工程配分候補

## 状態と対象

Source1の私有提案です。公開PR #320のhead `5643218b0ab189f5726a12aacf1c3b2331973e03` の専用 `.github/workflows/ios-reader-dynamic-type.yml` を、Rootの固定した読み取り専用Git helperで取得しました。入力SHA-256は `87c0559c0f3a1b0fcdcbb4f58035fc23208f343dc0b7a8ad6355c6445453900e` です。公開・CI実行・main採用は行っていません。PR #321とCoreDocsの後の実採用mainへ通常の手順で結び直し、最終候補の独立レビューと新headの検証を行う必要があります。

## 根拠

Source12の保存結果では、約420秒のxcodebuild command枠にcase開始前の229.164秒が含まれました。UITestRunner起動呼出から戻りまでは152.973秒でした。caseの最後のイベント189.10秒から外側終了までは約3.33秒で、A5起動の長時間停止やfont/layout不具合を証明していません。現行Dynamic caseの完走所要時間は未測定です。

default→accessibility5→defaultのmethod内3回に、共通setUpの1回を加え、完成までに計4回Appを起動します。旧回転caseの成功211.3665秒と今回の準備229.164秒を加えた440.531秒は、異なるrun/caseを使った配分比較です。Dynamic完走の測定下限・推定所要時間・製品性能値として採用しません。今回のcommand枠内で未完了だった事実と、720秒が十分かは未確認であることを分けて扱います。

## 最小変更

専用Dynamic workflowの共有UI stageと、その1回のxcodebuild commandを420→720秒にし、当該stepだけ8→13分にします。job43分は保持します。旧回転workflow・App・UI method・PBX・CoreDocsは変更しません。

selector、exact-one Passed gate、正規UUID隔離suite、R25/R24/R01の可視性、しおり、保存offsetの許容、finite positive stride、A5の1.25倍超、default復帰の±1pt、Continue後の補正gesture禁止、個別wait・gesture上限・通常quiescenceを保持します。content/buildの共有上限、inventory read30秒とstage90/180秒、read-only timeoutの既存限定retry、所有UUIDのcleanup監査・保持容量も保持します。新しいwarmup、UI retry、cross-process clockやadmission guardは追加しません。

## 配分の限界

宣言step capの合計は42→47分となり、47分≠job43分です。workflowのコメントをこの値へ同期します。単純なstep合計からcleanupの実行完了を保証できません。

driverのstage cap合計は変更後1930秒です。checkout/setup/prepareのstep cap300秒とupload2回120秒を加えると2350秒（39分10秒）で、job43分との差は230秒（3分50秒）です。これはwrapper・runner overheadを含めるための配分であり、厳密なcleanup保証や製品SLOではありません。stage内の同期command残余制限の外にも、Node起動・fs処理・action初期化などの時間があります。

UI後の全step cap8分とUI step13分を予約する計画では、UI開始をjob経過22分までに置く算術になります。この候補に時刻計測・開始制限・残時間予約のadmission guardは実装していません。開始時刻や余裕の厳密保証は未検証であり、Rootがこの限界を独立レビューで評価します。

720秒は限定した将来の試行配分です。十分性・必要最小値・分位・性能基準は主張しません。timeout、途中までのassert成功やcleanupだけの成功を受入にしません。exact-headの全job成功、strict1の完走成功、所有Simulatorのcleanupと必要な結果出力を引き続き要求します。

## 検証と後続

このSource1は私有のtext proposalです。Rootによるstatic inverse確認、YAML parse、抽出JSの構文検査、必要な共通検査、最終payloadの独立レビュー、新headのHosted実行は未実施です。2つのliteralだけを写す新規試験は追加しません。既存Source12・元の失敗・保存診断は変更せず保持します。同じheadの3回目の再実行とは扱いません。

通常App、実システムSettings/live文字サイズ変更、VoiceOver、実機、性能、IOS-11/25全体とTODO32行／完了14行の受入は変更しません。実機確認はユーザーの指示どおり未完了としてスキップします。旧Source12の準備・失敗とこの新配分案を区別します。
