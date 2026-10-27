# 現行CoreのHosted観測結果

> **時点の注記:** 本票の「現行」「main」は、凍結採取したCodeSource b39／Workflow 9bと、Core実装をmain f5eへ反映した当時のsnapshotを指す。追記準備時点の[Reading PR #282](https://github.com/pero3dev/ai-agent-library/pull/282)（91b1、0.2.20（22））はSource4を変更する未採用・未測定の候補であり、性能値をその版へ転用しない。旧本文の時点を保ち、差分を末尾に追記する。

2026-10-27の[実行40435420627](https://github.com/pero3dev/ai-agent-library/actions/runs/40435420627)は、現行の本番4ソースを使うmacOS host上のCore観測として成功した。1回のCore compileと19個のfresh benchmark processを完了し、correctness、15標本、識別子、入力の固定、資源と後片付けを独立に照合した。iOS Full UIの受入とmain統合は別に追跡し、本記録の公開採用は準備中とする。数値とSHAの詳細は[JSON](ios-core-hosted-observation.json)に保存する。

## 作業契約

- 目的: 現行Coreの実観測を保存し、実アプリの性能受入・目標採択と分けて評価する。
- 所有: このMarkdownと対になるJSON。本作業ではproject索引・TODO・共有sourceを変更しない。
- 許可根拠: ユーザーのiOS TODO自律実装・通常CI/PR/main統合の依頼。物理受入の未完了を残し、Store・契約・有料利用・保護例外を含めない。
- 規約: [AGENTS](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[実施記録の索引](../../README.md)、[Core計測契約](../../../ios/tests/core-performance.md)。
- 終了条件: このprivate draftの最終独立レビュー、Rootの最終payload/main binding、共通check、通常main mergeとmain CIは後続作業として残す。

## 実行識別子と環境

- CodeSourceSHA: `b39eeff4647336124a39e218205cd8dd85fc1819`、tree `58674564c75d8a6fb932f67f28aaabd04faf8ef6`。[PR #273](https://github.com/pero3dev/ai-agent-library/pull/273)のb39段階を固定した。
- WorkflowSHA: `9b07fb8898236518d44047e2300cbd5aeef105d2`、tree `584a403f8d0d71d957e546f4f20a514376aece95`。親は`34196601a88bc864fed6caac05a88d0119e68a05`。
- 実行: workflow_dispatchのrun `40435420627`、job `121962814903`、attempt 1。
- 公開repositoryの標準`macos-15` Hosted runnerを、一時never-merge branch `codex/ios-core-current-cli-pilot`から1回だけ起動した。

CodeSourceとWorkflowのhead/treeを別に取得した。Source b39は旧Core headとmain `08bdb36fd1d8bc83b6fa6bbf4a96e5acbeefb8b7`を通常同期したcommitである。最終main merge SHAは未確定で、JSONではnullを保持する。

実hostはmacOS 15.7.9 / arm64、Xcode 16.4 build 16F6、macOS SDK 15.5、Node v24.20.0。Core compileはApple Swift 6.1.2、Swift language mode 5、target `arm64-apple-macosx14.0`、`-O -whole-module-optimization`を明示した。

## 入力の生成・監査と標本

lockfileを監査してからlifecycle scriptを無効にして依存を導入し、固定依存のbrowserを準備した。標準全記事生成の結果は199記事・626ファイル（manifestを除くSHA対象625）・PNG 422個・40,079,084 bytes。原文の独立監査と実`ContentValidator`のhost consumer監査が成功した。consumer監査のcompileとcompilerのversion照会は、Core用compile1回と区別する。

固定Core8、本番4ソース、query、生成・監査の相対import closure 9ファイルを、immutable b39の照合結果へ結び付けた。`LibraryCoreTests`は本番4ソースに含めない。626ファイルのhash一覧とsourceをCLIの前後で固定し、`after-freeze`も不変を報告した。corpus revisionは`fcdc7b13e2bc40bfcadf09467e419c96c46640ed4e5aadc41b9bbdefdff5a801`、manifest SHA-256は`0d64b53ad215fa45c8c282dc7a473a7825a9e6b71b6dad805652724b22a7079b`、corpus SHA-256は`a920754bb25e4cffbb16a595e879152758217648ee8e303b90b402ca9a44d417`である。

検証済みalias/shellと等価なdirect Node呼出しを1回実行した。固定runnerのCore compile1回後、oracle 1回と、3 phaseそれぞれwarm-up 1回・記録5回の合計19プロセスを起動し、PIDの一意性とraw recordを確認した。記録標本は15件。16 queryの結果件数と順序付きID digestを照合し、`ordered-indexed-equals-production-uncached`を確認した。

独立監査はartifact内の全hash一覧・監査票・pre/post sealを照合した。Content本体はartifactの対象外であり、独立監査側で別途downloadして全bytesを再hashしたわけではない。

## 再計算した記述統計

wall timeの単位は秒。表は小数9桁で表示し、JSONに再計算した数値を保持する。indexed-filterは16 query batchのシナリオで、1 queryのUI入力遅延ではない。

| Phase | 記録数 | Median秒 | Min秒 | Max秒 | Range秒 |
| --- | ---: | ---: | ---: | ---: | ---: |
| validation | 5 | 1.278779500 | 1.177558250 | 1.595180000 | 0.417621750 |
| index-construction | 5 | 0.193492792 | 0.162874167 | 0.207374292 | 0.044500125 |
| indexed-filter | 5 | 0.403305625 | 0.344635000 | 0.437675541 | 0.093040541 |

self RSSはDarwin `getrusage(RUSAGE_SELF).ru_maxrss`のbytes。fresh host process全体のhigh-waterで、setupと計時後digest等も含む。wall timeと同じ区間のallocation量ではない。

| Phase | Median bytes | Min bytes | Max bytes | Range bytes |
| --- | ---: | ---: | ---: | ---: |
| validation | 76,103,680 | 75,825,152 | 76,333,056 | 507,904 |
| index-construction | 19,398,656 | 19,120,128 | 19,415,040 | 294,912 |
| indexed-filter | 19,464,192 | 19,136,512 | 19,529,728 | 393,216 |

各統計はraw5標本から独立に再計算して一致した。corpus hash照合等でfile cacheが温まる条件であり、disk-cold・初回起動を示さない。5標本からp95、製品SLO、性能予算を採択しない。

## 資源と所有物の後片付け

Core guardの実区間は44.298秒。開始freeは44,231,319,552 bytes、最小観測freeは44,231,208,960 bytes、private領域のpeakは割当35,344,384 bytes・logical 33,444,637 bytes、owned process-treeのpeak RSSは527,155,200 bytesだった。start free 3.8 GB、floor 3.2 GB、private出力/cache 256 MiB、owned-tree RSS 1.5 GiB、180秒の上限内で、resource abortはなかった。

このenvelopeは0.1秒間隔の観測であり、未観測の瞬間最大値を保証しない。owned-tree RSSとbenchmarkのself RSSも区別する。準備のContentやnode_modules等はprivate出力/cache 256 MiBの対象外である。

22件の子process環境観測を照合し、direct NodeのPIDとprivate context owner PIDの一致、0700 directoryと0600 owner marker、制御された`PATH`・`TMPDIR`を確認した。終了時には既知のowned process groupが全て不在で、private context、module cache、外側tmp、記録済みSHAの実行ファイルを除去し、所有するinode/tokenのlockを解放した。runner lossやhard cancel時のcleanup/uploadまで保証する記録ではない。

## 証跡と構成検証の履歴

[artifact 12703637286](https://github.com/pero3dev/ai-agent-library/actions/runs/40435420627/artifacts/12703637286)は`NEVER-MERGE-core-current-cli-40435420627-1`、ZIP 96,944 bytes、55 entries、展開後428,712 bytes。SHA-256は`19af73c49852e5c99656eabdf58195ddd4e30f427d6677cc715939c1c0999861`。run/head/attemptとsizeを取得前に照合し、RAM内でSHA、path/type、CRC、entry size、stage inventoryを検査した。stageは8 MiB以内でcompleteだった。監査時の取得上限はZIP 16 MiB・展開20 MiB・512 entriesで、生ZIP・raw log・Contentをローカル保存しなかった。

artifactは30日保持で、APIの期限は2026-11-26T01:59:42Z。期限後の取得を保証せず、公開記録には本要約と小さな識別metadataを残す。

先行head `34196601a88bc864fed6caac05a88d0119e68a05`の[push run 40434339855](https://github.com/pero3dev/ai-agent-library/actions/runs/40434339855)は、job-level envの`runner.temp`をGitHubの定義検証が拒否し、job 0・dispatch 0・Core CLI 0で停止した。[GitHubのcontext availability](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability)を確認し、同じ出力先をStage stepのenvとUpload stepのwithへ移す通常append commit `9b07fb8`を作った。修正後の最初のactual dispatchが本観測の1回である。

## iOS Full UIと未完了の受入

同じPR #273のb39段階はDraft・未マージで、別の[Full run 40433197643 / job 121955591491](https://github.com/pero3dev/ai-agent-library/actions/runs/40433197643/job/121955591491)は失敗した。API headはb39、実PR merge checkoutは`c3ec8039ab07c21e2eedc86ee231a00e64452531`、親の順序はmain 08b・b39で、treeは本観測のCodeSource treeと一致する。単体は153件中151成功・2skip、UI suiteは22件が全て終了して21成功・1失敗だった（functional app 16件中15成功・1失敗、pure geometry 6成功）。

Debug appの全記事監査は199記事・625 SHA検証で成功した。Debug corpusは40,079,066 bytes、revision `d3148b66b8c05e5f1e3e4c563e08af958e67de47c83011cb96d0597bb5eb195c`で、Core観測の40,079,084 bytes・revisionとは別である。件数の一致をbundleのbyte同一性に読み替えない。FullのRelease段階はskipだった。

失敗した`PublishedReaderUITests.testCancelContentFolderPickerPreservesFiltersAndReadingAndAllowsMoreActions`は97.456秒で終了した。初期TOC・しおり・保存baselineの再起動・filter/query・More Actions/importの後、cancel前の15秒predicate内でremote AX snapshot解決が`Interrupted by waiter`となった。b39のline633は`bar.frame`と`app.frame`を同じstatementで読むため、どちらのgetterかは未確定。cancel tap、cancel後のassertion、後続About、後段の再起動には達していない。App・infra・flakeの原因は未確定で、後続helper修正のCI成功を本記録では主張しない。

[旧b79の観測](../2026-10-26/ios-published-core-benchmark.md)（[b39固定URL](https://github.com/pero3dev/ai-agent-library/blob/b39eeff4647336124a39e218205cd8dd85fc1819/project/records/2026-10-26/ios-published-core-benchmark.md)）はlocal Xcode 16.2 / SDK 15.2の履歴である。今回のHosted Xcode 16.4 / SDK 15.5とは別profileとして保持し、値の比較・差分・予算化は行わない。

このCore結果だけで実iOS app、Simulator UI、実機、VoiceOver、最低iOS 17、起動・入力・scroll・画像decodeの性能を受入済みにしない。最終recordの独立レビュー、Rootの最終payload/main binding、共通check、通常main mergeとmain CI、索引/TODOの同期はこのprivate draft段階では未実施で、merge SHAはnullのまま保持する。

## 保存証跡の再取得時刻と復元手順

公開記録の取得日時を補うため、同じ既存artifactをRAM内へ再取得した。対象はrun `40435420627`、artifact `12703637286`で、96,944 bytes・SHA-256 `19af73c49852e5c99656eabdf58195ddd4e30f427d6677cc715939c1c0999861`の同じZIPである。これは保存済み証跡の読み直しで、Core CLIやCIを新たに実行した観測ではない。初回監査の取得時刻を復元した値として扱わない。

| 時刻の意味 | UTC |
| --- | --- |
| API上のartifact作成・更新 | 2026-10-27T01:59:44Z |
| 公開記録用の再取得開始 | 2026-10-27T02:42:58.866095Z |
| RAMでのbytes読取完了 | 2026-10-27T02:42:59.010609Z |
| ZIP検証完了 | 2026-10-27T02:42:59.013396Z |
| API上の保存期限 | 2026-11-26T01:59:42Z |

再取得の日時はclient UTCで取得した実値で、APIの作成・更新日時と区別する。55 regular files・展開428,712 bytesのpath/type、CRC、sizeと各entryのSHA-256を確認した。再取得票のSHA-256は`8102a5694f26f4ec97580af3efe2e1f7bb4dc54d7f4ae855439b2ebdbf6db4a4`。この再取得票はZIP取得・同一性の根拠であり、本文の統計やCore8照合を再実行したという根拠には使わない。55件のentry inventoryと再取得の範囲はJSONの`artifact.reacquisition`・`artifact.restoration`に保持する。

1. 保存期限前に[公開runページ](https://github.com/pero3dev/ai-agent-library/actions/runs/40435420627)でartifact名`NEVER-MERGE-core-current-cli-40435420627-1`とIDを照合し、GitHubのartifact UI、接続済みGitHub tool、認証済みGitHub APIのいずれかで同じartifactを取得する。認証情報や一時署名付きURLを記録しない。
2. ZIPが96,944 bytesで上記SHA-256と一致することを確認する。展開保存せずRAMで55 entries・428,712 bytes、全CRC、相対path、symlink・特殊file・重複の不在を検査し、各entryのSHA-256をJSONの`artifact.restoration.entry_hash_inventory`と照合する。
3. ZIP内の`run-config.json`、`dispatch-context.json`、`input-manifest.json`、`results/identity.json`、`results/summary.json`、`results/02-validation-recorded-1.json`、`host-capture.json`、`guard-proof.json`、`after-freeze.json`、`artifact-inventory.json`を相対pathで直接読み、必要なJSONを復元する。
4. artifactが期限切れ・削除済みで別途保管した原本がなければ、生証跡は復元できない。追跡済みの本要約とhashだけからrawを再構成することはできない。benchmarkの新規実行は別の観測として記録し、このartifactの復元とは分ける。

## 2026-10-27のCore実装のmain反映

上記の「未確定」「null」「private draft」「後続helper修正のCIを主張しない」は、この観測票を準備した時点の履歴として保持する。本節とJSONの`current_adoption_checkpoint`を、後から確認した統合状況として区別する。元の測定値、CodeSource b39、Workflow 9b、取得時刻、失敗したb39 Fullを変更した記録ではない。

[PR #273](https://github.com/pero3dev/ai-agent-library/pull/273)のCore CLIとpicker専用test helperは、保護された通常squashでmain `f5e6221b7dd01132ff76d36e993b13047b15e24c`へ反映した。treeは`fb717f389c8a94a27c942d59673fb9d762bfd683`、親は`08bdb36fd1d8bc83b6fa6bbf4a96e5acbeefb8b7`の1つで、最終PR head `5d6507b8748e6bb35afce29df5984f71e4e320e8`と同じtreeである。raw squash messageは4,866 bytes、SHA-256 `61e1368f9f2741bd0ca0e4862a15bbf8e0cdfe1cf118f897b88c74ce21749073`で、指定した件名・canonical本文と一致した。管理者例外、force、保護設定の変更はない。

最終5dの[全記事回帰](https://github.com/pero3dev/ai-agent-library/actions/runs/40438767229)は単体151成功・2skip、全22case成功（機能16＝Native2＋Published14、pure geometry6）、Release199記事・625hashとfixture不在の監査に成功した。旧b39の失敗を成功へ置き換えず、今回の1回の成功からremote AX障害の原因やhelperの速度改善を断定しない。main反映後は同じtreeでも別の実行として、新pushの[共通CI](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841890)・[Native](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841894)・[全記事回帰](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841889)が、head f5e、push／attempt 1で成功した。Native／Fullの実checkoutもf5eと確認した。共通CIはdeployを含む10job成功で、公開画面の独立した再確認とは分ける。Nativeは単体151成功・2skip、代表UI2件、Release3記事・140hash・2,577,102 bytesとfixture不在の監査に成功した。NativeのDebug任意icon診断はpartial／errors 1で、必須primary監査の成功と区別する。任意診断の詳細receiptは取得しておらず、原因は未確定である。Native Releaseの任意診断はerrors 0、必須primary監査も成功した。Fullは単体151成功・2skip、全22case成功（機能16＋pure geometry6）、Release199記事・625hash・36,958,898 bytesとfixture不在に成功した。FullのDebug／Release任意icon診断はcaptured／errors 0、必須primary監査も成功した。SDK26 ArchiveとiOS26.5のworkflowにはpush triggerがないため、新しいmain実行は発火していない。最終5d PR上の成功をmainで再実行した結果として扱わない。

本番Source4と固定Core8はb39・5d・実main f5eで全bytesが一致した。ただし、Hosted測定はCodeSource b39／Workflow 9bで実行した1回だけであり、5dやf5e上で再実行した結果へ付け替えない。[旧b79基線](../2026-10-26/ios-published-core-benchmark.md)も全raw・統計を履歴として維持し、異なるprofileとの性能比較は行わない。

観測票v2の取得日時・復元手順は独立レビューで確認済みで、そのreceipt SHA-256は`18cb128193d83e99e1853fb18576ed5441785ab4512c0a6fbdcf13171c1f54a3`である。raw監査receipt `4cbaf1f30f71781e50ffa034c1c5d5d052a41fd25b73c35b78602534f504064b`、再取得receipt `8102a5694f26f4ec97580af3efe2e1f7bb4dc54d7f4ae855439b2ebdbf6db4a4`と役割を分ける。本節・索引・TODOへの追加は別の文書候補であり、最終差分の独立レビュー・payload確認・共通検査・文書PRのmain統合は未実施である。

この文書候補は本記録のMarkdown／JSON、project索引、iOS手順、完成版TODOの5ファイルだけを対象にする。TODOは全32行・完了12行を保持し、IOS-15を未完了とする。199記事のCore検証・索引構築・16 query batchの実観測を部分進捗とし、appの初回起動・入力遅延・長文scroll・画像decode、最低iOS17・実機・VoiceOver、p95・性能予算・配布の受入は残す。

## 凍結時点と後続Reading draftの区別

この追記は、上記の観測値・取得事実・CI結果を後続ソースの結果へ更新するものではない。表題と旧本文の「現行」「main」「本番Source4の一致」は、CodeSource `b39eeff4647336124a39e218205cd8dd85fc1819`／Workflow `9b07fb8898236518d44047e2300cbd5aeef105d2`で凍結採取した1回の観測、および後から確認したCore実装のmain `f5e6221b7dd01132ff76d36e993b13047b15e24c`反映時点の履歴を指す。旧JSONの測定値と`source_inputs`・`current_adoption_checkpoint`をそのまま保持する。

本候補の準備時点でRootが報告したactual mainはf5eであり、PR #281のb6と[Reading PR #282](https://github.com/pero3dev/ai-agent-library/pull/282)の91b1はDraftの後続候補である。ここで比較したReading候補はhead `91b1ed803c20410919e15d562abae9fa2b189ec5`、tree `12498ede4d2b9092e95216f28f8de0529603d247`に固定する。PBXのDebug／Releaseは0.2.20（22）であり、採用済みmainや新しい性能測定を表さない。

immutable f5eと91b1を読み取りで比較すると、本番Source4のうち`ReadingStore.swift`だけが13,235 bytes／SHA-256 `89eb397a25391fca4ece786438bc2b3dac2eda0933006f587769ab5b0551c5c9`から19,641 bytes／`8874792f1fc346b8c2bf465301780f1cc01a55d808a6ef0ce7fa8d9344aaf1f7`へ変わる。他の3ファイルと固定Core8の8ファイルは全bytesが一致する。mode/typeも12ファイルとも同一である。比較の全path・size・SHAとGit entryをJSONの`historical_snapshot_context`に保存する。

Core8が同じでも本番入力4ソース全体は同一ではないため、91b1では旧Source4-identical gateはfalseとなる。このReading変更がそのままmainへ採用されても、旧19process・15標本・median・correctnessを0.2.20（22）の測定結果へ付け替えない。b39／f5eの歴史結果を無効化するという意味でもない。19processの再実行・追加測定は行っていない。

旧conditional 6aの文書payloadは、base tree `6a21a27d531525cf7d6310b07f4207ed155e5aeb`を期待する私有準備物である。b6のtree `779480ca0111484af87dbc4dabcf7009854216af`や91b1のtreeとは異なり、新しいmainへそのまま適用してはならない。実mainが確定した後に、fresh SHA/tree、所有before blobと全非所有tuple、採択されたSource4との差を照合し、異なるbaseなら拒否して文脈とpayloadを再束縛する必要がある。本追記で新sourceの採択・新main bindingは行わず、JSONの`future_actualmain`と`newperformance`はnullのままにする。索引・TODO・iOS READMEの同期はRootの後続作業へ分ける。

## 診断候補5ebのSource4との差

前節の91b1や当時のmainに関する記述は、その準備時点の履歴として保持する。ここでは後続の[PR #282](https://github.com/pero3dev/ai-agent-library/pull/282)の診断候補head `5eb7914dfe90fabbc543d96e45f77f805babb1cf`、tree `729691189a8dfc4c7929f1af90c54a56d7f50248`を比較文脈として固定する。採択済みactualmainへのbindingは行っていない。

immutable f5eと5ebの本番Source4を読み取りで比較すると、`ReadingStore.swift`は13,235から19,641 bytes、`ContentValidator.swift`は7,794から13,784 bytesへ変わる。`Models.swift`と`NativeDocument.swift`は同じbytesで、4ファイルのmode/typeは同一である。全path・size・SHA-256・Git blobはJSONの`diagnostic_5eb_context`に保存する。この比較は新しいSource4の採択や性能測定ではない。

旧19 process・15標本と全数値は、CodeSource b39／Workflow 9bで凍結採取した1回の観測のまま保持する。f5eから変わった5eb／0.2.20（22）の新しい性能結果へ付け替えず、新測定の値はnullとする。IOS-15全体、appの初回起動・入力・長文scroll・画像decode、最低iOS17・実機・VoiceOver、p95・性能予算の受入は未完了である。

この5ファイルは独立レビュー前の私有文脈候補で、公開用のwhole-file payloadではない。索引3ファイルは5ebのCore案内への限定追加であり、Reading・Featureを含むその他のbytesと全32行・完了12行のTODOを保持する。別作業中の新Reading段落も保持するため、後でactualmainを確定し、その時点の索引へCore案内だけを機械的にspliceして再照合する必要がある。Source4／測定の新規採択、actualmain binding、公開、benchmark・SDK・tests・APIの新規実行はいずれも行っていない。

## main76の新push3検査を別に確認したcheckpoint

2026-10-27追記。既存本文・JSONの準備時点、失敗、未完了表記を保持し、実装main `76d57595b52eb54b92ac188e3cdcd330c18aa116`／tree `740bbbfa73f1b850f7864c961ba78ab3ecb476d5` の新push結果を別節に残す。[Common40505124647](https://github.com/pero3dev/ai-agent-library/actions/runs/40505124647)・[Native40505124651](https://github.com/pero3dev/ai-agent-library/actions/runs/40505124651)・[Full40505124612](https://github.com/pero3dev/ai-agent-library/actions/runs/40505124612)は各attempt1、event pushで成功した。PRの成功やtree一致から新runの成功を補ったものではない。

Commonはdeployを含む10job成功であり、公開画面の独立受入は行っていない。Nativeは単体165件・skip2・失敗0／25.028秒、追加12件は各開始1回・pass1回、通常UI2件・失敗0／126.591秒を新ログで確認した。Fullは一意なraw UI22caseが全pass・失敗0／1247.392秒、単体165件・skip2・失敗0／21.277秒だった。これらのXCTest集計時間をAppの起動・入力・scrollやp95の性能値とは扱わない。

Fullのpicker取消caseは146.419秒でpassし、`AILibraryFolderPicker` prefixは0行だった。失敗時JSONの8KiB上限・lastPredicate／postAXの実収集は未発火・未確認のままである。FullのRelease consumerは199記事・1音声・625ファイル・36,958,905B・TestContent不在で成功し、revisionは `11ba5a273030495cec8e95a6aa64964441c9b06a1fe9853165e7de98616e4e78`、必須primary icon監査も成功した。これは同じFull runの値であり、Nativeの未取得数値やPR eabの生成bytes／revisionへ代入せず、PRとの全bundle byte等価も主張しない。32,257,705BのFull artifactは未取得で、宣言digestを実bytesのSHA・CRC検証へ読み替えない。

main76の新push一覧はCommon・Native・Fullの3系統で、SDK26・Runtime26・Dedicatedの新pushはない。旧PR上の専用F/R・SDK等は別のsnapshotとして保持する。Common／Native観測票SHA-256は `6a8d4b0781a1540db78cc4b74f23a0ee4c428e00e2cf75d3bb57100fd5634f0d`、Full票は `e2f9ab82cb1fbbf1e2fa8745690d9c87e5100bda74a42985a41a4c19c919183a` である。同名JSONの `main76_postmerge_ci_checkpoint_20261027` にscopeと各receiptのSHAを残す。

旧19process・15標本とその統計はCodeSource b39／Workflow 9bの凍結観測のまま保持し、変更されたReadingStore／ContentValidatorを含むmain76のApp0.2.20（22）へ転用しない。新しいCore性能測定・Source4測定の移行採択は行わず、IOS-15、App・実機・VoiceOver・最低iOS17・p95・性能予算は未完了とする。TODO32行・完了12行を保持する。この文書payloadのactualmain bindingと公開はRootの後段であり、今回の私有追記でbenchmark・SDK・生成・test・依存導入・API／Git／共有変更は行っていない。
