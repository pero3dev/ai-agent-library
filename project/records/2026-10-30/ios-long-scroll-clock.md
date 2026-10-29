# 長文の固定区間スクロールをClockで観測する候補

2026-10-30の準備記録。IOS-15のうち、既存の起動・検索ClockとTransformer先頭本文のAppMemoryでは未観測だった長文スクロールに、明示選択する1ケースを追加する。test／計測基盤の変更で、製品の高速化や性能基準の採択、版上げではない。現時点で実Hostedスクロール・実4 invocations・Clock3標本は未実施である。

## 基準と所有範囲

元の作者baseはPR #303の文書候補`e7465413b44aa9509659f2e882783730d3467d99`で、通常統合した実main `6bfa82b621027a482348c9edc2c1e568405dc4bf`（parent ca595）へ結び直した。両者の全2813ファイルのmode／blobとtree`32d79138c0e0ca71f88aec561e1e762a656c75b0`が一致し、Source4の元blobはCa・作者・実mainで同一だった。これはPR #303の採用であり、このSource8や計測結果のmain採用ではない。元の準備履歴とSource4レビューは保持する。

所有は`PublishedPerformanceUITests.swift`・`ios-performance.yml`・`export-performance.mjs`・対応Node試験の凍結Source4、実施記録MD／JSON新規2、索引2の計8パス。Source4は無編集でコピーし、PR #303で採用した[自分用候補チェックポイント](ios-personal-use-candidate-checkpoint.md)と旧索引段落を保つ。App0.2.23（25）・PBX・製品の保存処理・本人データを変更せず、[完成版TODO](../../plans/engineering/ios-app-completion.md)の32行／完了13行とIOS-15未完了を維持する。

## 固定する操作と入力

| 項目 | 契約 |
| --- | --- |
| scenario／case | `long-article-bounded-scroll`／`testLongArticleBoundedScroll` |
| 記事 | `03-implementation/openai-prompting`、OpenAI長文ガイド |
| 開始／終了 | 「メッセージ構造と指示階層」→「長文・長コンテキスト」。終了IDは`長文長コンテキスト` |
| 準備 | 同じ試験suiteで終了・再起動し、全記事・ガイド・正確な記事行を確認して目次から開始へ戻す。計測外 |
| 開始条件 | 一意な前面readerで開始見出しが完全可視かつ上端から0〜64pt。終了見出しはまだ完全可視ではない |
| 計測中 | viewport内のx0.50、y0.80→0.40の縦dragだけを最大16回。検索・目次・再初期化を行わない |
| 終了条件 | 固定の終了見出しとlabelが初めて完全可視になった時点。未到達・reader曖昧・不正viewportは失敗 |
| 各回の記録 | 実drag数・順序・開始／終了offset・可視witness。固定pixel距離や全回同じdrag数は保証しない |

Runnerの`expected_source_sha256`は固定宣言で、Appから読んだ実runtime値ではない。期待値は`d81e7f0984464c530d0b8bbdd8fbfffea6c1e398f037ae2f2133f053dce5a45f`。workflowは既存の原文／実package監査後、実Debug bundleのmanifest・documentと原文bytesを読み、原文SHA、document hashとmanifest.files、article/title/path、一意で順序どおりの見出しを照合してcontextへ保存する。原文が変わっていれば失敗し、期待値を自動で緩めない。

## 取り出す値と受入の境界

既存の`XCTClockMetric`を手動start／stopで使用し、warm-up1＋記録3を設定する。4回の完了を要求するprotocolと、型付きsummaryの3標本を別々に検査する。新ケースで実際にこのinvocation数になるかは未確認である。値はDebug iPhone16／iOS18.5 Simulatorのgesture・idle・AX確認込みの秒であり、FPS・hitch・frame時間・純描画・画像decode・CPU・メモリ・Release実機・p95・製品SLOを測るものではない。

最大8KiBのprotocolをconsoleへ完全な1行で1回出し、xcresult添付も保つ。scrollだけ`--protocol-log`を要求し、16MiB以下のUTF-8ログをbounded fd readする。欠落・重複・途中行・順序・型・上限・workload／context違いは失敗する。入力は通常single-link fileだけで、symlink／hardlink・他入力とのalias・所有出力との重複を拒否する。保存は既存のfreshな所有ディレクトリへの排他的書込を保つ。

既採択のClock識別子・秒単位・Xcode16.4のCSV書式を使い、1件のPassed caseと、3つのtyped Double／CSV3値の順序・値・平均の丸めを厳密照合する。これは書式の校正を再利用するもので、旧launchの値をscrollの性能基線へ移さない。自動発火はlaunchのまま、searchは従来どおり明示選択、memory実装とFullのselectorは保持し、通常Fullへ同操作を追加しない。job40分・exporterのxcresulttool呼出60秒・JSON16MiB／CSV8MiBなどの上限も変えない。

## 準備済みの検証と後続

既存44＋追加13のNode **57/57**は初回17.053656834秒で成功し、syntax2・YAML・actionlintも成功した。Nodeはsynthetic protocol／typed summary／CSVと所有mock xcrunを使い、実SDK・Simulatorを実行していない。Source4独立レビューはP1／P2なしで私有候補を受入れた。RootのiOS18.2 SDK・arm64 iOS17／Swift5によるUI試験ソース5ファイル（overlay1）の型検査はexit0・10.021秒、stdout／stderr0で、実XCTest・スクロール計測ではない。保存証跡を再利用し、ここではSource／Node／SDK検査を繰り返さない。識別hashと範囲は[小さなJSON](ios-long-scroll-clock.json)に記録する。

Rootの共通検査は、e746がまだ文書候補だった時点の準備tree `7321a5877096a0916238c650f0a3c78eeab2cdb8`／2815で、1185件中1170成功・15skip・失敗／cancel0、npm exit0・46.507秒だった。全parent treeの一致を確認して実mainへ再基準化し、Source4を変えずに利用する。この最終追記は実main・共通結果・現況の文書4パスだけで、最終tree自体に共通検査を再実行したとは扱わない。文書とmetadataは限定検査し、最終8パスの独立レビューは後続とする。

PR #303のCommon・NativeはAPI上成功し、Fullは発火しなかった。Nativeの終了20:10:28 UTCはmerge20:10:19 UTCより後で、統合前の成功証拠に読み替えない。main反映後CIは別監視であり、この記録では完了を断定しない。

次はSource8を1 commit／独立PRへ提出し、必要CIと実probeを確認してから通常main統合を判断する。Rootは既存のGitHub Run workflowフォームに到達できることを確認したが、dispatchはまだ行っていない。PR作成後のbranchと正確な`long-article-bounded-scroll`を照合して1回実行する予定で、実run／checkout／contextのheadとtest source hash、1件のcase成功・4 protocol invocations・Clock3標本とraw／typed／CSV3値を確認する。実測と必要CIが揃うまではSource8のmain採用を断定しない。認証・scenario選択等の制約で実行できなければ未実施を残し、別の実行面や通常発火scopeを追加しない。

外部操作の根拠は本人の自分用完成・自律継続・通常commit／PR／mainの既存許可で、この私有準備ではGitHub・共有Sourceを変更していない。最終8パスのレビュー・必要CI・実Hostedと製品性能の受入は後続である。共通検査は上記の準備treeに対する保存結果の範囲である。署名期限・実機上書き・VoiceOver等の未受入、未採用PR #301のUI493行の失敗はチェックポイントへ残し、この新しい計測で解決したとは扱わない。
