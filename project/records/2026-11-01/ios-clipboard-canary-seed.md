# 全記事Bのクリップボード準備の回復候補

2026-11-01の私有候補。PR321のUI前処理で観測した2種類の時間切れを区別し、同じcanary設定だけを一度追加できるようにする。新候補は未実行・未公開で、後続で実mainへ結び直す。

## 作業契約

目的は、全記事BのUI前に既知bytesを同じ検証済みSimulatorへ設定する処理の限定回復である。対象は[Full workflow](../../../.github/workflows/ios-published-candidate.yml)、[専用helper](../../../ios/tests/clipboard-canary-seed.mjs)、[Node fixture](../../../tests/unit/ios-clipboard-canary-seed.test.mjs)と記録2本で、索引文は別途用意する。

ユーザーの自律実施依頼とRootのseed限定設計を根拠にする。App・PBX・記事・保存形式は変更しない。他者の変更と先行候補を保持する。作成者はPythonによるデータ照合と私有ファイル作成だけを行い、Node・Git・API・SDK・Simulatorを実行しない。新出力2MiB以内・空き64MiB以上を守る。

## 観測した失敗

[PR321初回のFull B](https://github.com/pero3dev/ai-agent-library/actions/runs/41210390660/job/124563982260)は、UI前の`simctl pbcopy`がNodeの`ETIMEDOUT`で停止した。観測はexit null・SIGKILL・error code ETIMEDOUT・`spawnSync xcrun ETIMEDOUT`である。Rootの照合済みartifactとconsoleに基づく旧履歴として保持する。

[6d32のFull B](https://github.com/pero3dev/ai-agent-library/actions/runs/41225191269/job/124607761176)は、同じ前処理がexit 60・signal null・error nullで停止した。Rootが84,203バイトのartifact全体のSHAを照合し、seed intent・exit・165バイトのstderrを照合した。stderrは`NSPOSIXErrorDomain`のcode 60と`Operation timed out`を示す。NodeのETIMEDOUTとは別の形であり、既存のETIMEDOUT限定候補が扱うとは主張しない。起動完了記録はあるが、基盤内部の原因は未解決である。このjobではUI0件、実374バイトコピーとReleaseには未到達だった。

## 候補の変更と境界

回復対象はcontent-copy側のseedだけである。初回結果が既存のNode timeoutの全条件、または新たに観測したPOSIX timeoutの全条件へ厳密一致した場合だけ、`seed-timeout-retry-1`を一度追加する。POSIX側は数値のexit 60、signal・error・error codeがすべてnull、stderr全文が観測した165バイトの文面へ一致する必要がある。単なるexit 60、別domain、部分的なtimeout文、欠落や改行差、別のsignalやerrorを対象にしない。成功のexit 0は通常の一回成功として受け入れ、追加しない。

既存のB専用callbackへ最大512バイトの`stderr_text`を加える。Bufferでない値と上限超過はnullにし、分類対象にしない。raw stderrは従来の別ファイルへ保持する。試行のreceiptは別名にし、初回を上書きしない。

同じrun・attempt・nonceから生成したcanaryを一度退避し、同じ検証済みUUIDと同じbytesを各試行へ渡す。pasteboardの通知回数やchange countの同一性を保証するものではない。追加する場合も各呼出30秒以内、seed二回の設定上限60秒以内で、単調時計の残り時間へclampする。intent保存後にfresh permitを一度取得し、FS書込みを挟まずspawnする旧P2修正を保つ。期限切れなら保存済みintentを残してspawnせず、二回目の失敗後に三回目を作らない。OSやNodeの終了処理まで含む独立した強制壁時計上限とは扱わない。今回の失敗で回復できたという実測もない。

reading-state側の元の一回のseed、既存のrun二本、後続`pbpaste`の90秒と完全一致、実コード374バイトとSHA・貼付け先、固定Full26件、job50分と全step上限を維持する。実UI操作、`pbpaste`、製品のコピー操作へ追加試行を広げない。

## 検証と終了条件

旧Code3はcontrolled mock22件成功後、intent保存とspawnの境界にP2が見つかった。旧票・旧packetを保持し採用しない。revision2でfresh permitへ修正し、独立静的レビューはP1/P2とも0件、Rootによる24件は24成功・失敗0・skip0だった。これらは旧Code3だけの結果である。

本候補の作成者はPythonで、workflowの全逆変換、先行候補からstderr欄だけが追加されたこと、元run二本・A側・全step/job上限・比較処理・spawn直前permitの保持を照合した。新32ケースは定義のみで未実行である。元24ケースの定義と期限テストを保ち、POSIX成功回復、厳密な全条件、stderr差異、混在する二回失敗、実B callbackのreceiptと後続比較、A側の単一失敗を追加した。

Rootの新32件・構文・YAML・共通検査、Code3と記録の独立レビュー、実mainへの結合、最終headのHosted B8・実コピー374・Releaseと必要CI、通常main統合と実main push確認が残る。実機・VoiceOver・provider・製品性能とTODO32行・14完了を変更しない。

## 保存済みRoot32試験と既存レビューを反映した追補

前節までの「新32件は未実行」とJSONの従来値は、Code3候補を封印した時点の履歴として保持する。その後Rootが同じCode3で制御試験32件を実行し、32成功・失敗0・skip0・cancel0・exit0を確認した。stdoutのSHA256は`c22fa0af08420a48ce79a5df86037b12491f86e7eb0a2fbe9df01e1f09ad6ba7`、stderrは0バイトである。TAP報告のdurationは188.636125msで、準備や工程全体のwalltimeではない。

試験はVM・fake callbackと時計を使う制御環境で、保存intentにはネットワーク拒否、heap64MiB、concurrency1が記録されている。実`simctl`・OS子process・実際の追加seed・Hosted・SDK・完全共通検査を実行した証拠ではない。保存済み構文結果ではYAML parse、抽出したinline JavaScript5本、独立module2本がすべてexit0だった。workflow driverの実行やactionlintの成功とは区別する。この追補の作成者は結果をデータとして読み、試験や構文検査を再実行していない。

既存の独立レビューはP1／P2とも0件で、SHA256は`b10596f1238f192f7ce8909e4dc449e66202afb3dabce371ba4f1565cdd709d2`である。対象は変わらないCode3、封印時の記録2本と文章案、および保存済みRoot32／構文結果の追補だった。レビュー担当による実OSの独立再現を示さず、今回新たに追記したDoc2と将来の実parent結合をレビュー済みとも扱わない。新しいDoc2・索引と最終結合のレビューは後続に残す。

候補の意味と上限は変えない。対象はB側のUI前seedだけで、既知のNode ETIMEDOUTの全条件、または数値exit60・signal／error／error codeすべてnull・観測したApple stderr165バイト全文の一致だけを初回の追加試行条件にする。同じ検証済みUUIDと同じcanary bytes、最大2回・各30秒・共有60秒、intent保存後からspawn直前のfresh permitを保つ。一般のexit60や一部のtimeout文へ広げず、実OSの終了処理まで含む強制walltime保証は追加しない。A側の一回のseed、後続pbpasteと完全一致、実UIの374バイト比較・固定Full26と全既存上限も保つ。

6dのBでUI前に実際の準備失敗を観測した事実と、後続9310のBが候補を導入せず8件・実374バイト一致・Release監査を成功した事実は別である。後者の監査は199記事・音声1・625ファイルとテストcontent除外を確認したというRootの報告に基づく。9310の成功は、この候補が必須だったことや、追加試行が有効だったことを示さない。根本原因と新候補のHostedでの回復効果は未確定のままとする。

workflow・helper・unitのCode3は全bytesとSHA／blob参照を保持し、この追補ではコピーも変更もしない。新候補の実parentは未設定、Hosted B8／実コピー374／Releaseと必要CI、通常main統合と実main push受入も未実施・未受入である。Rootはこの別TODOを新しい実mainへ結合する際、対象workflowのbefore bytesと全非所有差分を改めて確認する。App・PBX・content・実機・VoiceOver・provider・製品性能とTODO32行14完了を変更しない。

## 実mainCCの単回Node timeoutと、同じCode3の初回結合

2026-11-01追記。PR321の通常squash後の実main `cc268c4a76f09434f27bbc841e3b9ca776ea566e`、tree `91b1b70a56ddbd518178f1d300ec1df20777647a` の[Full初回push実行](https://github.com/pero3dev/ai-agent-library/actions/runs/41316098352)で、Bは本文UIより前のcanary seedが停止した。既存mainは厳密なseed1回だけで、今回のbounded helperは未導入だった。UI starts／resultsは0、374-byte内容のequalityと成功markerは未到達、Releaseはskipのまま保持する。元PRのB8や他区画の成功を、このmainpushのB受入へ代用しない。

Rootが検証したsmall artifact13087259257は45 entry、ZIP83,253 byte・SHA256 `3e7c6aa497b9d2a487a4c6334dfc4a446bded16ab05069f52e0f6c5f4c0d1b47`、headCC／run41316098352／attempt1に結び付く。作者もreceipt・ZIP・抽出memberの実bytes／SHAを読取照合した。intentは`xcrun simctl pbcopy`・UUID `141DD5FC-FF1D-429C-B43E-1323E1915FDE`・timeout30,000ms、exit sidecarはexit_code=null、signal=SIGKILL、error=`spawnSync xcrun ETIMEDOUT`、stdout／stderr各0 byteである。sidecarにerror_codeはなく、raw836,054 byte・SHA256 `e419e4b3a562950106c96e98cc8908ce28297658334ed206b7fe8177f82718a2` の7449行code=ETIMEDOUT、7450行errno=-60を別根拠にする。7481行の同codeは同一error再表示であり、2試行と数えない。Node errno=-60をApple process exit60へ読み替えず、今回のfull tupleと旧POSIX60観測を混同しない。

今回採用する候補Code3はmanifest `4a6ae36eab1913756c7d6b63811aa63fc73cae6952374f83028e8b163b59013a` の既存bytesそのままである。新しいclassifier変更は行わない。Bの既知canary seedだけを、同じ検証済みUUID・不変の既知bytesへ最大2回、各30秒以下・一つのmonotonic60秒枠で実行できる。初回が今回の厳密なNode tuple、または別過去観測のApple exit60／signal・error・error_codeが全null／165-byte stderr全文一致の場合にだけ追加1回を許す。intent保存後・spawn直前のfresh permitと残時間を保ち、枠不足・別失敗・2回目失敗はそのまま失敗する。OSの厳密な終了時刻や、必ず復帰する効果を保証しない。

2つのA側run関数と通常strict seed、後続pbpaste90秒、一つの実374-byte内容の比較、UIと固定Full26の判定・全工程上限・cleanupは変更しない。UIやassertion、外部job全体のretryを追加せず、現CCの失敗と外部再試行0を保持する。新helper／unitの2パスは現CCに存在せず、このSource7で初めて導入する私有候補である。

同じCode3の保存済みRoot32件は32成功・skip／fail0、YAML／inline5／module2構文と既存IRのP1/P2なしを限定scopeで引き継ぐ。作者は正しい保存resultとCode manifest一致・IRを読取照合し、Node・SDK・実simctl・新実試験は実行していない。制御callback／clockの成功は新Hostedや実OS retryの成功ではなく、新Source7の文書・current graphの独立レビューと実CIは未受入である。

実parentCCの全2857mode/blobへfresh結合し、helper2と記録2の新規4件を含む2861を予測する。索引は現CCからSeed段落だけを追加し、Core/FallbackとPR321受入Doc10はまだ反映しない。通常Code3→Docs4の別2commit、最終形式・独立レビュー・新headの共通／FullA18・B8・374-byte実一致・Release・必要CIと通常main採用は後続である。Common9成功・Native／Aの進行は別区画のfreeze状態で、Bの欠落を補わない。App0.2.28（30）、TODO32行14完了、実機・VoiceOver・provider・性能等の未完了は維持する。

## PR322初回CIと通常main36採用の受入

freeze UTC `2026-11-01T15:52:51Z`。前節までとJSONの既存全値は、それぞれの候補を封印した時点の履歴として保持する。その後の[PR322](https://github.com/pero3dev/ai-agent-library/pull/322)は、source `ad034650cbdb193f199761d6e5a8d8bd74e7ab35`・tree `04efdb8f21e896a39b5f68be597e9ad98e085db2` の全6workflowが初回成功し、通常squashで実main `36bec68537d741492f942c076469bb06d177f69a` に2026-11-01T15:39:01Zに採用された。親はCCの1件だけで、全2861mode/blob・actual squash本文・公式票とmanaged cleanをread-onlyでfresh照合した。実mainへの採用は確認したが、この文書候補自体の採用ではない。

初回sourceのNative単体278件は276成功・2skip・失敗0、Native UI8件は全成功で書き出し取消の追加caseは175.396秒だった。FullはA18＋B8の固定26件が重複・欠落なく成功した。共通Node1289件はLinux1273成功・16skip、FullAのmacOS1274成功・15skip、いずれも失敗0。追加Seed32件は双方とも32成功・skip0であり、既存platform skipと混同しない。R26の実3件／12段階、欠損・復旧13段階、SDK26 unsigned Archiveと必須11も保存済み結果の範囲で成功した。新たなローカルNode・SDK・UI試験を実行した結果ではない。

Rootが別途取得した公式small artifactは50,631バイト、SHA256 `d0c531791a996a5355b6d0ce127368d8fdbaad5ec351f64833e9029be95742f2`、source ad0／run41318885484／attempt1に結び付く。既存ZIPと選択memberの実bytes／SHAを作者もread-onlyで照合した。既知canaryは78バイト・SHA256 `876b5ca10f96a8ca99388c6967a8fdf85fb88ae10824999aee549568839921dc`、UUID `141DD5FC-FF1D-429C-B43E-1323E1915FDE` で、初回`seed`がexit0・signal/error/error_codeすべてnullで成功した。追加retry用receiptは存在せず、実seed1回・追加OS retry0回である。実コードのコピーは一つの374バイト内容、SHA256 `e29cb525957fb4bd72350927aa1cf47659da4aef9964ecbf0d43edb4dfe2cee8` が独立比較に一致し、console成功markerは1回。374件の試験を意味しない。BのReleaseでは199記事・音声1本のmetadata・625ファイル・TestContent不在とicon metadataを確認した。

Ready最終epoch15:37:11Z後に作成・開始されたfresh policy2件の成功も確認した。保存runのcreated/run_startedは双方15:37:13Zである。元CC mainpushの単回Node ETIMEDOUT／exitnull／SIGKILL、B UI0・374-byte一致とRelease未到達は履歴として残し、初回成功したPR322で上書きしない。今回のHosted初回成功は、32制御試験が扱う追加retry分岐の実OS救済効果を示さない。根本原因解消やOSの終了時刻保証も主張しない。

この追補のfreeze UTC `2026-11-01T15:52:51Z` では、新main36 pushはRootから報告された進行中のsnapshotとしてpending・未受入に固定し、作者はその後の実行を観測していない。PR322の成功で新mainpush受入を代用せず、後続結果は別追補へ記録する。Bの最大2回／各30秒／共有60秒・同じUUID／bytes・fresh permit、A側2runのstrict seed、pbpaste90秒・374-byte一致・固定Full26と既存上限は不変更である。実OS retryの回復効果、実機・VoiceOver・provider・製品性能とIOS-22/25全体は未完了、App0.2.28（30）・TODO32行14完了を維持する。新Doc12の形式・独立レビュー・必要CIと通常採用はRootが別途確認する。
