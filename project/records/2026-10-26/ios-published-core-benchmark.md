# 全記事Coreのhost観測と再現CLI — 2026-10-26

IOS-15のうち、全記事検証・検索索引の構築・索引検索をmacOSのFoundation/CryptoKit CLIで分けて観測した。[専用手順](../../../ios/tests/core-performance.md)と`npm run ios:benchmark:core -- --run ...`を追加する。通常の`npm run check`は既存の`tests/unit/*.test.mjs`で新3ファイル・26件のNode fixtureを含み、Swift/SDKやcorpus実測は明示CLIのままにする。App・version・PBX・CI workflowは変更しない。

## 実入口と対象

基線は不変の`b79c0a3f6b76a7603077b0a30a07cdecb94cda93`。凍結v4のshell/Node `--run`入口から、Xcode16.2（16C5032a）・実compiler Swift6.0.3をSwift5 mode、`-O -whole-module-optimization`、MacSDK15.2、`arm64-apple-macosx14.0`へ明示して1回compileした。SDKのrequested/resolved pathとmetadata、compiler argvを[JSON記録](ios-published-core-benchmark.json)に残す。

保存済みlocal corpusはrevision`555aef0f0acbfc5388ea8f925ef73905bdef39de2e7275768058be8d3bb86deb`、199記事・625 listed SHA files＋manifestの626ファイル・422PNG・37,744,971bytes。正本のpublished独立件数199と、全19 processの実消費199を区別して照合した。再生成・コピーせず、前後と各sampleの全identityが一致した。Hostedの別容量profile、[旧15 query観測](../2026-10-25/ios-normalized-search-index.md)や先行private wrapperの採択済み観測は今回の統計に混ぜない。

## 境界と結果

`validation`は`ContentValidator.validate`だけ、`index-construction`はmanifest decode後の`LibrarySearchIndex`だけ、`indexed-filter`は事前構築済み索引を使うliteral16 queryの1 batchを測る。各scenarioはfresh processでwarm-up1回を捨て、5回を記録した。別correctness process1回を含めraw19を保持する。query_resultsを持つのはoracle1＋construction/filter12の13 processで、validation6は持たない。indexed ordered IDsとproduction uncached filterの比較はoracleで行い、12 processのdigestをoracleへ照合した。

表は実v4 CLIだけのmonotonic wall秒とprocess RSS中央値である。

| Scenario | Wall中央値s | Wall最小–最大s | RSS中央値bytes |
| --- | --- | --- | --- |
| `published-core.validation.v1` | 0.910576666 | 0.896286041–0.950008167 | 139,345,920 |
| `published-core.index-construction.v1` | 0.165776833 | 0.160706500–0.169882833 | 21,757,952 |
| `published-core.indexed-filter.v1` | 0.364712583 | 0.359628792–0.373177792 | 21,708,800 |

RSSはDarwin `getrusage(RUSAGE_SELF).ru_maxrss`のbytesで、計測後・JSON出力前probeまでのhost process高水位である。manifest/runtime・保持したindex/results・計測後digestを含み、constructionは計測後のquery batchも含む。全lifetime peak、索引単体の差分容量やiOS appメモリではない。raw19の原UTF-8・SHA、identity、5標本・warm-upと最小/最大/rangeをJSONへ残す。p95・SLO・速度向上率・受入予算の合否は作らない。

## 環境と停止・cleanup

CLIはowned0700tempを出力先内に作り、子へPATH＋controlled TMPDIRだけを渡す。compile driverと全19 PIDでTMPDIR到達、HOME・外側sentinel等の非伝達、owner/modeを実観測し、CLI自身のcontext削除と自己所有cache/lockのcleanupを確認した。別outer guardは共通O_EXCL lock、開始空き3.8e9・floor3.2e9、private cache/TMP/output256MiB、180秒、sampled owned-tree RSS1.5GiBを扱う。global freefloorも別監視し、filesystem sandboxとはしない。resource stopとSIGKILL fallbackはなかった。

compiler・各CLI子の1MiB出力制限はrunnerのpipe上限による。外guardの旧compile-file監視先は実CLIと異なるため、その直接監視が働いたとは扱わない。保存されたcompiler.stderrは0bytesで、compiler stdoutは個別保存していない。旧guardのmanifest形式誤比較はCLI/Swift/compile/metric0で停止し、旧source・receipt・rawを保持した。正schemaのbytes/SHA unit後に承認された継続が、今回の初回実CLIである。

## 検証と残件

rawの独立レビューは、凍結75ファイル・CLI8/production4・raw19・13 query-bearing/6 validation・統計・cleanupを限定条件付きで承認した。review JSONのSHAは`548884e4517e6fa1ca586780c94123db9d4c372d76c832c766e9361f9411cf27`で、詳細scopeをJSONに記録する。reviewerはlive corpusの再hash、削除済みbinaryの再hash、未保存resource/environment streamの再計算を行っていない。資源値はnominal0.1秒sleepと走査を含む当該実行receiptで、瞬間最大や正確100ms間隔ではない。guardの42.34秒はcleanup前、記録時刻の全幅は42.368769秒で、製品の操作遅延とはしない。

Node fixture26件、identity・raw19・範囲の再計算、前後corpus、code/query/toolchain/PID/environmentの照合を確認した。旧freezeと準備済み入力を変更せず、integration準備でSDKや測定を再実行していない。通常CIと共通npm checkは最終headの別検証であり、ここで成功済みとは扱わない。

ユーザー指定により今回の新たな実機・VoiceOver確認は省略し未実施とした。XCTest・iOS・SwiftUI・Simulator・launchClockの実行ではなく、入力から表示まで、scroll/画像decode、iOS appメモリ、受入予算は残る。IOS-15のcheckboxは未完了のまま維持する。

## 最新main同期の準備と旧観測の境界

この同期準備の入力は明示source commit `08bdb36fd1d8bc83b6fa6bbf4a96e5acbeefb8b7` / tree `fc061c8f2d62846bf2273602361f6852a4b0f2ae`。上のb79基線・raw19process/記録15・統計・失敗履歴は旧観測として全bytesを保持する。最新Models/NativeDocument/ContentValidator/ReadingStoreの4SHAはJSONのcurrent_main_sync_snapshotへ別snapshotとして記録し、LibraryCoreTestsを含めない。最新sourceのCLI結果は未観測、IOS-15と予算採択は未完了である。

後日の通常同期commitはfirst-parent577bae、additional-parentにrootが確認した実mainを指定し、forceしない。新CLIは別guard（free>=3.8e9B、private<=256MiB、process-tree RSS<=1.5GiB、全体180秒）で後日1回だけとし、ここでは実行0・再試行0。App/PBX/workflows・P1/Iconを含む全非対象は実mainから保持し、最終payloadの別人レビューとexact-head CIを残す。
