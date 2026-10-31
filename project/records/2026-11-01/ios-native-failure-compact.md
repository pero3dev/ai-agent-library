# Native UI失敗添付の小規模保存候補

2026-11-01。IOS-25の診断を進める私有候補である。全量のxcresultに加え、失敗した1ケースの既知画像と固定テキストだけを取得する。通常のUI判定・App・保存処理は変えない。

## 目的と変更範囲

PR321のhead546で、Native artifactは157,057,734 byteだった。必要な失敗画像は309,634 byte、固定contextは114 byteで、全文を保存せずに添付IDを特定できた。この経路をCIに置き、診断の取得量を小さくする。

所有候補は[Native workflow](../../../.github/workflows/ios-native.yml)、[Node collector](../../../ios/tests/native-failure-attachments.mjs)、[Python guard](../../../ios/tests/native-failure-export.py)、[単体試験](../../../tests/unit/ios-native-failure-attachments.test.mjs)、この記録2本と索引追加文である。元のUI run・selector・40分job上限、全量artifactのaction・path・90日保持を保つ。全量uploadの後に、UI outcomeがfailureの場合だけ非blockingの診断を実行する。

## 選別と保存の契約

LegacyのrootからtestsRefを読み、Native3件とPR321で予定するReadingRecovery5件の中で実際にFailureとなった1ケースを選ぶ。複数失敗は省略件数を明示する。取得したsummaryのrootがActionTestSummary型・Failure・選択済みidentifierの完全一致であることを確認してから、既知name・UTI・payloadSize・opaque referenceで、PNG1枚と対応するcontext／geometry／hierarchyだけを固定名でexportする。動画・未知の画像名・別suiteへは広げない。

75秒は子の開始と結果の受入に使う共通期限であり、同期preflightや終了確認までのOS強制runtimeを示さない。外側には2分の工程上限を置く。

raw metadataは1呼出1MiB以下、子呼出最大7回、各15秒以下・75秒の共通期限内で残時間を制限する。呼出直前にpermitを取得し、期限切れ後はspawnしない。書き出すファイルはPNG1MiB、hierarchy128KiB、geometry8KiB、context2KiB以下とし、manifestと部分出力を含む所有出力全体を2MiB以下にする。生metadataをartifactへ丸ごと複製しない。

Python guardは、固定Apple utilityの実行と読取だけを許すdeny-default sandboxを使う。exportのときだけ固定1ファイルへの直接書込みを許し、RLIMIT_FSIZEとcore dump禁止を設定する。directory export・wildcard出力・mach lookup・process-fork・network許可へのfallbackはしない。Appleのatomic temporary write等が必要でこの条件に合わなければ、診断は未完了とする。

Node親は専用process group、bounded stdout／stderrと期限を管理する。終了を証明できない子の出力は閉じず、移動・削除しない。leader終了後の遅いgroup signalも行わない。closeが到着しない場合は子の期限で所有pipeを破棄して待機を打ち切り、quiescence未確認として後続exportとcompact公開を拒否する。実fileのsize・PNG magic／UTF-8・SHA・inodeを確認し、閉じたmanifestを書き終えた後だけworkflowのclosed markerを出す。compact uploadはこのmarkerがあるときだけ行う。

`collected`は選んだケースの診断が取得できた意味であり、UI合格ではない。他の失敗や既知textの省略はpartial、未知schema・上限超過・export失敗・終了未確認はincompleteとする。全量upload自体の成功／失敗もbindingに分けて残し、常に取得成功とは仮定しない。追加のライブAX・Simulator・端末・providerへの問い合わせは行わない。画像やhierarchyには表示文字が含まれ、匿名化の保証ではない。既存public CI・隔離fixture・個人アカウントを使わない範囲に限定する。

## 確認と残件

旧Code4の静的レビューで、summaryと選択ケースの結合不足、leader終了後のclose待機が無期限となる2件のP2が見つかった。旧候補と判定は保持し、このrevision2で照合と期限による待機打切りを追加した。不一致summaryはexport0件、exit後close未着はkill0件・pipe破棄・quiescence false、稼働中close未着は所有groupへのkill1回・quiescence falseを期待するfixtureを加えた。この修正を含む37 fixtureのRoot実行結果は後述する。修正の最終独立レビューとHostedでの受入は未確認である。

revision2のCode4はPython ASTとworkflowの正逆全文が一致した。RootによるNode構文確認では、YAML・workflow内JavaScript1本・独立Node source2本がすべてexit0だった。最初の二重sandbox起動はsandbox_applyがexit71となり、Nodeの試験実行は0件だった。この失敗記録を保持したうえで、ネットワークを拒否した隔離環境で37 fixtureを実行し、37成功・失敗0・skip0を確認した。fixtureはmetadata／CLIの制御callback・fake childと、小さい自己所有ファイル・symlinkの読取を扱い、実SDKや実UIを動かす試験ではない。

Rootの独立したローカル16.2定数probeでは、既知PNGを最小sandboxでexportし、309,634 byteと元SHAが一致した。no-writeのroot query、別outpath拒否、1024 byteのRLIMITでSIGXFSZとなることも確認された。これらの旧結果と限界は保持する。

続いてRootは、保存済みのhead546のxcresultを候補のcollector engine・executeGuard・Python helperへ渡し、明示したローカルIO adapterで実際のqueryと固定2添付のexportを行った。5呼出すべてがexit0・quiescence確認済みとなり、選ばれた失敗ケースのidentifierが一致した。PNG309,634 byte・SHA256 `44cfddd5d2540526c6e3da5e2fdf29b57ca10034cc14c1934849c11be1d77c33`、context114 byte・SHA256 `698b0fd1922c51b15b6498afbcf5461b866724c0d0b40b502f64710d2055fea7`を取得した。engineの経過時間は約18.364秒で、入力1,013ファイル・2,480,876 byteのhash・inode・link数は前後で保たれた。

この試行の`collected`は、過去に失敗した1ケースの診断をローカルで取得できた意味である。productionIOのHosted16.4 preflight、production event binding、Hosted workflow、SDKコンパイル、ライブAX・Simulator・実機、元のUIケースの合格を確認したものではない。RootのIO adapterを用いた結果を、そのままproduction entry全体の受入に読み替えない。

最終独立レビュー、実parentへの結合と共通検査、Hosted16.4の実compact内容・容量・full artifact／主失敗の保持は未確認である。実機・署名・配布の検証ではなく、TODO32行・完了14行とIOS-25全体の未完了を維持する。
