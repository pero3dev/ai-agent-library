# 長文の固定区間スクロールをClockで観測する候補

2026-10-30追記: [Draft PR #304](https://github.com/pero3dev/ai-agent-library/pull/304)の初回head`5ee42249a6243b4a89231ff33b00ca4a06fd29d7`は、実main6bfをbaseとする8パス／2815ファイルの候補で、main未採用である。実test merge`b9e8afa13fd0d681cc9a6aa0cf4544a951169d53`と全2815 mode/blob・treeb81de0cの一致を確認した。初回の手動長文probeはClock開始前に失敗し、完全protocol0・typed Clock標本／CSVなし。下部の提出前記録は当時の履歴であり、「dispatch未実施」等を現在へ読み替えない。

## 初回Draftと手動probeの結果

2026-10-29 21:20:00 UTCのAPI保存時点で、PRの8系統は6成功・2失敗、別の手動長文も失敗で全終了した。失敗は起動ClockのexportとDedicatedである。既知11検査の成功は20:54:06 UTCのDraft／preReady時点で、Ready・計測成功・将来headの検査ではない。

| 実行 | 確認できた範囲と未到達 |
| --- | --- |
| 起動Clock run40950051081／job123715442159 | 選択1ケースは41.825秒で成功。その後、Mac Bash3.2のnounset下で空の`protocol_args`配列を展開して失敗し、Node exporterへ未到達。typed summary／CSVなし |
| 手動長文 run40950354834／job123716530622 | 実head5ee・scenario`long-article-bounded-scroll`を結合した初回1件は89.792秒でcode60。記事を開く準備の最終行wait、Clock前で停止。完全protocol0・typed／CSVなし |
| Dedicated run40950051190／job123715442627 | Fは180秒でSIGKILL、stdout863Bにcase開始／結果がなく実XCTest結果は不明。別Rはtypedで正確に1件成功、cleanup成功。Fの原因は未確定 |

手動長文の条件には`row.label == title`はなく、合成labelの長さを不一致原因にはしない。初回precheckの成功は「swipeなし」とloop制御からの推論で、Bool自体の実記録ではない。最終callbackのBool・return時刻・inflightは不明である。75,799,362Bの長文artifactは取得していない。Dedicatedは小さいZIP432,471B／219membersだけをRootが一度取得し、F前の一時的なbrowser download表示は後でbrowser successとなっており、F原因には結び付けない。ログ本文や識別情報をこの記録へ複製せず、hashを[JSON](ios-long-scroll-clock.json)へ残す。

## 次のfollowup候補と採用条件

Bash2候補は常に必須引数を持つ`export_args`へ組み替え、長文だけ`--protocol-log`を追加する。実Mac Bash3.2の起動／検索／長文はbefore exit `[1,1,0]`、after `[0,0,0]`で、長文の正確なargvは同一だった。Node58／58は14.351秒で成功し、syntax／actionlintは0（外部ShellCheck・Pyflakes無効）。初回の私有検証は既存corpusの配置不足でimport停止し、Sourceを変えず正確なblobを補ってから成功した。独立Source2レビューはP1／P2なし。これらはargv fixtureとsynthetic／mockの結果で、新head Hosted export成功ではない。

Root共通1186件中1171成功・15skip・失敗／cancel0、npm0・47.843秒はtree`44f71272b67800a14adee5a22f391ab83b768413`のBash2 overlayだけで、Swift行wait診断や今回の記録を含む最終候補には転用しない。別workerのPublishedPerformance準備行waitだけを観測するSource1は凍結済みで、SHA`276efbf6…`・証跡`67b01265…`、構文0／0.688秒・出力0を保存した。固定scenario／fixtureID、既存Boolとmonotonic境界、NSLock・last8・inflightを新prefix`AILIBRARY_LONG_SCROLL_PREPARATION`＋半角spaceで1行を出し、prefixと改行込み8192B以内とする。他3つの準備waitの既定helper、非throwing条件の1回評価と最大12回precheck、Clock protocolを保持する。RootのSDK18.2／arm64 iOS17／Swift5によるUI5ファイル（overlay1）の型検査は0／8.029秒・stdout／stderr0だった。実XCTest・Clock実行ではなく、Source1とBash2のCode3統合は独立レビューでP1／P2なし（証跡`fc30a6f9…`）となった。これはコード範囲の受入で、実UI・Clock・最終8パスの文書レビューとは分ける。診断の追加AXはなく、15秒・8/12/18/16上限、predicate、Clock区間・完全protocol・typed／CSV条件、元の失敗を変えず、待機延長・条件緩和・追加tapは行わない。

RootのCode3＋早期Doc2の統合共通検査はtree`da812dbff7497ff67668250a638f25c0e66643d0`／2815で、1186件中1171成功・15skip・失敗／cancel0、npm0・47.312秒だった。5eeの全2815ファイルに5パスだけを重ねた実結果で、Source3は同一bytesを保つ。検査時の記録は旧候補`b2e1592e…`で、今回の最終追記は独立レビュー・共通結果・現況を反映する記録2パスだけのmetadata差分である。最終treeへ共通検査を再実行したとは扱わず、文書とmetadataだけを限定確認する。

followupは既存PR #304の1 commitへまとめる最終私有候補で、5変更パス（Bash2・性能行wait1・記録2）、累積は元の8パス、新規pathなしとする。Code3のSDK・独立レビュー・統合共通までは完了し、全Source8の最終独立レビュー後、通常のDraft更新と新headの必要CI、正確な`long-article-bounded-scroll`の手動1回へ進める。新headは未作成で、旧headの成功を移さない。1件成功・4完了invocations・typed Clock3標本とraw／CSV3値・head／入力結合が揃い、通常の必要gateを満たすまでmain採用としない。FPS・hitch・純描画・p95・Release実機・製品SLOの受入ではない。

通常継続は本人の自分用完成・自律実施・通常commit／PR／mainの既存許可に基づく。この私有単位は記録2本だけで、Source・indices・完成計画・外部APIを変更しない。App0.2.23（25）・製品31blobとcheckpoint303を保持し、TODO32行／完了13行・IOS-15未完了、署名期限・実機／VoiceOver・未採用PR #301の最低OS47未受入を維持する。main303反映後の1成功・2失敗と、別のNative／Recovery／PublishedReader私有診断は別履歴で、この性能followupの解決・採用範囲に含めない。

## 提出前の初回準備記録（履歴）

以下はPR #304作成・初回probeより前の準備snapshotである。Node57・SDK・旧共通tree7321の結果と当時の未実施・予定を、現在の結果に置き換えず保持する。

2026-10-30の準備記録。IOS-15のうち、既存の起動・検索ClockとTransformer先頭本文のAppMemoryでは未観測だった長文スクロールに、明示選択する1ケースを追加する。test／計測基盤の変更で、製品の高速化や性能基準の採択、版上げではない。現時点で実Hostedスクロール・実4 invocations・Clock3標本は未実施である。

### 基準と所有範囲

元の作者baseはPR #303の文書候補`e7465413b44aa9509659f2e882783730d3467d99`で、通常統合した実main `6bfa82b621027a482348c9edc2c1e568405dc4bf`（parent ca595）へ結び直した。両者の全2813ファイルのmode／blobとtree`32d79138c0e0ca71f88aec561e1e762a656c75b0`が一致し、Source4の元blobはCa・作者・実mainで同一だった。これはPR #303の採用であり、このSource8や計測結果のmain採用ではない。元の準備履歴とSource4レビューは保持する。

所有は`PublishedPerformanceUITests.swift`・`ios-performance.yml`・`export-performance.mjs`・対応Node試験の凍結Source4、実施記録MD／JSON新規2、索引2の計8パス。Source4は無編集でコピーし、PR #303で採用した[自分用候補チェックポイント](ios-personal-use-candidate-checkpoint.md)と旧索引段落を保つ。App0.2.23（25）・PBX・製品の保存処理・本人データを変更せず、[完成版TODO](../../plans/engineering/ios-app-completion.md)の32行／完了13行とIOS-15未完了を維持する。

### 固定する操作と入力

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

### 取り出す値と受入の境界

既存の`XCTClockMetric`を手動start／stopで使用し、warm-up1＋記録3を設定する。4回の完了を要求するprotocolと、型付きsummaryの3標本を別々に検査する。新ケースで実際にこのinvocation数になるかは未確認である。値はDebug iPhone16／iOS18.5 Simulatorのgesture・idle・AX確認込みの秒であり、FPS・hitch・frame時間・純描画・画像decode・CPU・メモリ・Release実機・p95・製品SLOを測るものではない。

最大8KiBのprotocolをconsoleへ完全な1行で1回出し、xcresult添付も保つ。scrollだけ`--protocol-log`を要求し、16MiB以下のUTF-8ログをbounded fd readする。欠落・重複・途中行・順序・型・上限・workload／context違いは失敗する。入力は通常single-link fileだけで、symlink／hardlink・他入力とのalias・所有出力との重複を拒否する。保存は既存のfreshな所有ディレクトリへの排他的書込を保つ。

既採択のClock識別子・秒単位・Xcode16.4のCSV書式を使い、1件のPassed caseと、3つのtyped Double／CSV3値の順序・値・平均の丸めを厳密照合する。これは書式の校正を再利用するもので、旧launchの値をscrollの性能基線へ移さない。自動発火はlaunchのまま、searchは従来どおり明示選択、memory実装とFullのselectorは保持し、通常Fullへ同操作を追加しない。job40分・exporterのxcresulttool呼出60秒・JSON16MiB／CSV8MiBなどの上限も変えない。

### 準備済みの検証と後続

既存44＋追加13のNode **57/57**は初回17.053656834秒で成功し、syntax2・YAML・actionlintも成功した。Nodeはsynthetic protocol／typed summary／CSVと所有mock xcrunを使い、実SDK・Simulatorを実行していない。Source4独立レビューはP1／P2なしで私有候補を受入れた。RootのiOS18.2 SDK・arm64 iOS17／Swift5によるUI試験ソース5ファイル（overlay1）の型検査はexit0・10.021秒、stdout／stderr0で、実XCTest・スクロール計測ではない。保存証跡を再利用し、ここではSource／Node／SDK検査を繰り返さない。識別hashと範囲は[小さなJSON](ios-long-scroll-clock.json)に記録する。

Rootの共通検査は、e746がまだ文書候補だった時点の準備tree `7321a5877096a0916238c650f0a3c78eeab2cdb8`／2815で、1185件中1170成功・15skip・失敗／cancel0、npm exit0・46.507秒だった。全parent treeの一致を確認して実mainへ再基準化し、Source4を変えずに利用する。この最終追記は実main・共通結果・現況の文書4パスだけで、最終tree自体に共通検査を再実行したとは扱わない。文書とmetadataは限定検査し、最終8パスの独立レビューは後続とする。

PR #303のCommon・NativeはAPI上成功し、Fullは発火しなかった。Nativeの終了20:10:28 UTCはmerge20:10:19 UTCより後で、統合前の成功証拠に読み替えない。main反映後CIは別監視であり、この記録では完了を断定しない。

次はSource8を1 commit／独立PRへ提出し、必要CIと実probeを確認してから通常main統合を判断する。Rootは既存のGitHub Run workflowフォームに到達できることを確認したが、dispatchはまだ行っていない。PR作成後のbranchと正確な`long-article-bounded-scroll`を照合して1回実行する予定で、実run／checkout／contextのheadとtest source hash、1件のcase成功・4 protocol invocations・Clock3標本とraw／typed／CSV3値を確認する。実測と必要CIが揃うまではSource8のmain採用を断定しない。認証・scenario選択等の制約で実行できなければ未実施を残し、別の実行面や通常発火scopeを追加しない。

外部操作の根拠は本人の自分用完成・自律継続・通常commit／PR／mainの既存許可で、この私有準備ではGitHub・共有Sourceを変更していない。最終8パスのレビュー・必要CI・実Hostedと製品性能の受入は後続である。共通検査は上記の準備treeに対する保存結果の範囲である。署名期限・実機上書き・VoiceOver等の未受入、未採用PR #301のUI493行の失敗はチェックポイントへ残し、この新しい計測で解決したとは扱わない。
