# Full単体失敗後のSimulator inventoryを残す候補

2026-10-29。Fullの単体工程がexit70で止まると、後続UI工程のinventoryへ到達せず、同じ実行環境の状態を判断する材料が残らない。この候補は、失敗した単体工程の直後に同じjob／VMで2つのinventoryを採取する。現在のFull成功を欠陥と扱わず、旧exit70の原因は未確認として保持する。

自分用iOSアプリの継続した自律作業依頼に基づく。所有範囲は[workflow](../../../.github/workflows/ios-published-candidate.yml)・[collector](../../../ios/tests/capture-simulator-unit-failure.mjs)・[fixture検査](../../../tests/unit/ios-simulator-unit-failure.test.mjs)、本記録2本と索引・計画の7ファイルである。新しい契約・課金・配布・ローカルOS導入は含めない。全体の残件は[完成計画](../../plans/engineering/ios-app-completion.md)で追跡する。

## 元の検査結果を保持する実行条件

既存単体stepへ`native_units`というIDを付け、その直後に診断stepを追加する。条件は`failure()`・非cancel・当該stepの`outcome == 'failure'`である。元の単体stepの`set -euo pipefail`、xcodebuildの引数・iPhone16／OS18.5・destination120秒・対象AILibraryTests・teeと出力先を保持する。IDと診断1stepを除くと、元workflowの全25,561Bへ戻る。

診断stepだけに`continue-on-error`と外側2分を付ける。診断の終了値で元単体のfailureを成功へ書き換えない。正常・skip・cancel時はhelperも保存先やprobeを作らない。job50分、後続のUI・Release・cleanup、既存always-uploadと90日保持は同じである。

## 採取と保存の範囲

| 項目 | 制御 |
| --- | --- |
| 読取1 | `xcrun simctl list runtimes --json`を1回 |
| 読取2 | `xcrun simctl list devices --json`を1回。unavailableも含む |
| command上限 | 各30秒。stdoutとstderrの合計raw1MiBで停止判定し、保持arenaも1MiB |
| 共有上限 | 75秒。残時間でcommandのtimerを切り詰める |
| 次の読取 | 最初の失敗後も残時間がある非cancel時だけ開始。既知の取消・期限後は開始しない |

保存先は既存evidence配下の固定名`unit-failure-inventory`を新規作成する。canonicalな親のidentityを各書込みで確かめ、symlink・既存出力・外部path・不正名を拒否し、`O_EXCL`／`O_NOFOLLOW`でleafを上書きしない。子環境は限定した値だけを渡し、killの対象は自らspawnしたprocess groupに限る。新たなboot・reset・delete・download・clone・migrateや、単体検査の再実行は行わない。

未知stdout・stderr・binary・不正UTF8・未終端bytesを予算内で保持し、全観測rawと保持bytesの件数・SHA、未保持量を区別する。commandのcode・signal・spawn error・cap・timeoutの範囲・cancelを分け、小receiptとtailを残す。JSON判定はstdoutをstrict UTF8で読み、runtimes配列／devices objectというtop-level shapeまでを確認する。`captured`はこの2読取のcode0とshapeの成立を表し、row全体の完全検証ではない。未知stderrやそのbinaryも保持したまま共存しうる。

toolchainは既存environment.logを最大64KiBで読み、hashまたは明示したerrorを残す。新しいversion commandや環境変数の全量収集は追加しない。raw最大2MiBと小receiptを既存artifactの保持範囲へ載せ、資産・App・大量traceを追跡記録へ複製しない。

timerはevent loopやfilesystemの停止、OSの強制終了を含むhard wall-clockやreceipt保存を保証しない。観測は単体失敗後のsnapshotであり、失敗前の状態や旧exit70の原因を復元した証拠ではない。toolchain参照にerrorがあっても、それをinventoryのcode0で解消済みとは扱わない。

## 確認した範囲と未確認

production helperをfixture subprocessで試す15件は全成功・exit0、最終TAPの報告durationは1149.011041msだった。通常時の非発火、固定2読取、非zero・JSON／UTF8不正・未知stderr／binary、容量・command／共有期限、cancel・spawn error、保存先・上書き拒否、元exit70とteeのpipefailを確認した。構文2ファイル、限定したYAML条件と全byte逆変換、actionlint1.7.12もexit0である。shellcheck／pyflakesは無効で、その外部検査は未実施とする。

Source3は独立レビューでP1／P2が0件だった。無編集copyを7ファイル候補へ持ち込み、詳細hashと区分を[機械可読記録](ios-full-core-failure-inventory.json)へ残す。Node reporterを初回補助harnessが誤認して明示TAPで再実行した1回と、その後の私有YAML helperのmodule／namespace訂正を保持する。Source不変後のhelper訂正には成功済みNode・構文結果を再利用し、補助recipeの失敗を製品・fixtureの失敗へ読み替えない。

実simctl・SDK・端末・新headのHostedは、この私有準備では実行していない。将来の正常Hostedが成功しても、失敗時採取経路を確認済みとはしない。自然な単体失敗時の有用性、旧destinationの原因、実機・VoiceOver・最低OS全体とIOS-15全体は未確認である。iOS17の取得・容量監視や、本文の可視待ちの修正・検証は別単位とする。

## コミットと通常統合の区切り

作者baseは採用済みmain `da46832f6b289536fc67e76ba0511bce07bd0e41`／tree `fa448a166306fef9f6ab26953bb080a36806b236`の2,807パスである。Source3だけの候補は2,809パス。本記録2本と索引2本を加えた7ファイル候補は私有準備で、最新mainへの最終結合を先取りしない。

作業は、Source3と記録の準備、最新mainとの全tree照合・共通検査・候補7の独立レビュー、検証済み単位のcommit／Draft PR、新headの通常CI、Ready後の必須検査・通常保護のmain統合、反映後のCI確認に区切る。共通検査・最終main結合・7ファイルの最終レビューと外部操作は提出工程の後続である。失敗を人為的に起こす実Hostedは未実施のまま残す。

App0.2.23（25）、TODO32行・完了13行を保持する。実機確認はユーザー指定により未完了として進め、追加課金・配布・契約やローカルOS導入へ作業範囲を広げない。
