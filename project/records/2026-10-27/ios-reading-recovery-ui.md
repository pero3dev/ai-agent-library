# 読書記録の復旧を確認するUI回帰の準備

[読書記録の破損保全と明示復旧](ios-reading-state-recovery.md)を公開UIから検査する、未採用の試験候補を準備した。基準はeab `eabf1a67ed6ceb0cd9e7bd2e20ba5bcb413020fa`／tree `740bbbfa73f1b850f7864c961ba78ab3ecb476d5`で、準備時点に確認されたmain `76d57595b52eb54b92ac188e3cdcd330c18aa116`も同じtreeである。新ファイルの不存在は確認済みだが、公開前のfresh before blobとmain採用は後段で別に束縛する。詳細は[JSON](ios-reading-recovery-ui.json)に記録する。

seedはDEBUGの既存隔離suite経路で、追加flag `AILIBRARY_UI_TEST_READING_RECOVERY=partial-v1`の完全一致、UUID形式のsuite suffix、空のnamed persistent domainが揃った場合だけ、ReadingStore作成前に固定57-byte Dataを一度保存する。有効なしおりと壊れたsiblingを実decoderへ渡す方式で、再launch時の非空domainは再seedしない。既存domainの初期化・削除・上書き、standard defaultsやReleaseへのseed、期待本文の注入、validator迂回、driverによるuser Data操作は加えない。

技術変更は[App起動](../../../ios/AILibrary/Sources/AILibraryApp.swift)、[共通UI test base](../../../ios/AILibraryUITests/NativeReaderUITests.swift)、[新Recovery class](../../../ios/AILibraryUITests/ReadingRecoveryUITests.swift)、[PBX登録](../../../ios/AILibrary.xcodeproj/project.pbxproj)、[Native CI](../../../.github/workflows/ios-native.yml)の5ファイルである。default falseの起動前hookで二重launchを避け、新classの2 caseだけがseedを要求する。将来のNative選択は既存2件＋新2件の4件で、現在のFull22件、別候補のCopy23件、Dedicated F/Rと単体の選択・既存待機上限は保持する。これらはsource宣言数であり、新しい実行件数ではない。

cancelのcaseは、partial案内と読めたAgentループのしおりを確認し、確認dialogをcancelした後も、同じsuiteで再起動した後も案内と既存しおりが残ることを試す。confirmのcaseは、復旧前にTool Useのしおりを公開UIから追加し、confirmと同suite再起動後に既存・今回追加の両方のしおりが残ることを試す。本文は通常packageとvalidatorを経る既存helperで確認し、案内消失は全issue共通の警告文も対象にする。実際のdialog・再起動動作は未確認である。

実施済みはSwift frontendの構文parse 3回・計5ファイル選択、固定DataのJSON確認と構造保持、最終5ファイルの独立レビューまでである。限定変更を逆適用すると既存4ファイルのeab全bytesが復元され、標準／Release経路、既存helpers・case、Full／Copy／Dedicatedの範囲を保持した。技術manifestのSHA-256は`495f05471f69d748036772276db39e6b67168db16fa104a067b9bcd687be0f20`、独立レビュー票は`8f7c61ded268cab6c918ecde19910b1ec0d92a521c71ac23e22447120fa9a369`。構文parseと静的レビューをSDK型検査や実XCTest成功として扱わない。

実SDK・実UI、新current run、actualmainへの機能採用は未実施で、JSONではnullを保持する。2 caseはしおり2種のUI保持を対象とし、読書位置、backupの生bytes、耐電断・disk永続保証、VoiceOver・実機とIOS-22全体は未受入である。技術5と本記録2は別commitを想定し、fresh main binding、最終literal・独立レビューと新headの通常CI／実UI確認は後続作業に残す。本記録作業ではsource・他記録・索引本体を変更せず、SDK・API・Git操作を行っていない。

## 最初のCI実行とボタン取得の見直し

最初の公開head `3cb328dd87ac3542db9c704456fabb0a8e06f38f`では、[Native run 40508046124](https://github.com/pero3dev/ai-agent-library/actions/runs/40508046124)の単体165件は2 skip・失敗0、従来のUI2件は成功した。新しいRecovery2件はともに記事件数の待機を通過した後、復旧ボタンの最初の取得で失敗した。確認dialog、取消し、復旧後の再起動としおり保持には到達していない。タイムアウト後の対象はexists=falseだったが、seedの実行結果と実AX階層は未確認で、原因は確定していない。

同じheadの[SDK 26 unsigned archive run 40508046209](https://github.com/pero3dev/ai-agent-library/actions/runs/40508046209)は成功した。これはビルド互換性の結果で、Recovery操作や実機の成功を示さない。観測票のSHA-256は`59dd453b312243f914b88c6c3f7225630cd2a871289eb695e30dd9deb0f423c5`。

再検査候補では新classの1ファイルだけを変更し、復旧操作の存在・実行・不在の3箇所を、画面の公開Button名「読み取れる記録で復旧」の完全一致queryへ揃えた。存在時は一意であることを追加で要求し、従来の画面内hittable、最大8回のスクロール、待機上限、partial案内と共通警告、確認・取消し、同suite再起動、既存・今回追加のしおりの条件を保つ。seedと製品側の復旧処理は変更しない。

修正ファイルは4,964 bytes、SHA-256 `0354bf0f407f6f283e6430dca9cdd10285cc374f50b8497a5df48529ad30a716`。構文parse1回と最小差分の静的レビューを行ったが、この修正の実SDK・実UI効果は新headのCI待ちである。上段の未実施・nullは初回準備時点の記録として保持し、初回の失敗を修正後の成功に置き換えない。

## 確認Sheet内に操作を限定する再検査候補

公開head `0d7b0a2cb789eb75dc79851438c0235e01f7a31a`では、[Native40513391169](https://github.com/pero3dev/ai-agent-library/actions/runs/40513391169)の単体165件・2 skip・失敗0と既存UI2件が成功した。新Recovery2件は復旧ボタンの一意性、partial案内と共通警告、確認dialogのタイトル・原データ退避message、confirmの操作可能判定まで進んだ。その後、画面全体の「キャンセル」がライブラリのNavigationBarと確認Sheetの2箇所に一致し、frame取得で失敗した。dialog内の取消し／confirm、終了、再起動後のしおり保持は未到達である。

同headの[SDK2640513391463](https://github.com/pero3dev/ai-agent-library/actions/runs/40513391463)は成功した。独立観測票SHA-256は `0657155f0bf3803a41c5431af0367b3ef5d7c070881986d51645d047e8e7fd42`。実Sparse AX treeのlibrary NavigationBar配下と、復旧タイトルをlabelに持つSheet配下に「キャンセル」があった。

新候補は公開タイトルに完全一致するSheetを一意に要求し、その内部でタイトル・messageと、一意なconfirm・cancel Buttonを確認して操作する。終了待機にはSheet不在も要求する。タイトル5秒、操作可能判定15秒、終了10秒、案内・しおり・同suite再起動の条件は保つ。製品の画面とseedは変更しない。修正1ファイルは5,713 bytes・SHA-256 `a5c820737f11cf6dc1f520bc662668270ff96070d89fa0f2813055b764a92681`。Swift構文parse1回と独立静的レビューまで完了し、新SDK・実UI効果は未確認である。

別系統の[iOS26.5 run40513391433](https://github.com/pero3dev/ai-agent-library/actions/runs/40513391433)では、既存2件のうち目次→自己注意の見出しへの待機が1件失敗した。timeout後の逐次geometry snapshotでは対象が画面内・hittableだったが、待機中の成立や内部原因は証明しない。今回はRuntime26の処理・待機・判定を変更せず、新headで別に確認する。geometry票SHA-256は `e39a17de8402b1c2129a1a4c0374dedd30c1bde7e35c33c0e18b49de26b1e9f2`。過去の失敗を保持し、実機・VoiceOver・読書位置・backup生bytesとIOS-22全体は未完了である。

## 採用89とmainc1新push checkpoint（2026-10-28）

上段の「未採用」「未実施」とJSONのnullは、各準備・再検査時点のsnapshotとして保持しています。この追記では、採用したPR #283のhead89と、統合後のmainc1の新pushを別の証拠として記録します。過去の失敗を成功へ書き換えず、新Driverや製品全体の受入にも補完しません。

### 採用したPR #283の実測とReady確認

採用headは`89a32389678d5b752f5b550553b42f32274c6fcc`、treeは`a1487b7072d090ba25f8944a9b94c3234a308350`です。代表3記事packageと別fixture4を使う[Native40519707888](https://github.com/pero3dev/ai-agent-library/actions/runs/40519707888)では、新Recovery2件を含むraw UI4件が失敗0・410.029秒で成功し、単体165件は2 skip・失敗0でした。cancelは120.422秒、confirmは136.750秒です。各caseの2 launch、Sheet内の一意な操作、取消し後の案内保持、確認後の案内消失、同suite再起動後の旧Agentループと今回追加したTool UseのしおりのUI条件を、当該headの個別Passed・公開操作列・source assertionで確認しました。rawのsuite値やbackupの生bytesを直接読んだ受入ではありません。

同headの[SDK2640519708024](https://github.com/pero3dev/ai-agent-library/actions/runs/40519708024)はunsigned archive互換性の検査に成功しました。[Runtime2640519708263](https://github.com/pero3dev/ai-agent-library/actions/runs/40519708263)の既存2件は失敗0・258.131秒、[Full40519707922](https://github.com/pero3dev/ai-agent-library/actions/runs/40519707922)の22件は失敗0・1324.692秒でした。Full22件はNative2・Published14・geometry6で、新Recovery2件は含みません。Full Releaseは199記事・音声1本・625ファイル・36958860B、revision `e3530249c3e21f9a77e79e08f93123997551d02845a8624c8d89b4d13c9bfbbd`です。以前の0d7 Runtime失敗の内部原因や、待機中のgeometryが確定したという意味ではありません。

最終Ready票ではDraft解除後の必須11件をすべてsuccessとして照合しました。最新の[harness-policy40528047932](https://github.com/pero3dev/ai-agent-library/actions/runs/40528047932)と[freshness-policy40528047872](https://github.com/pero3dev/ai-agent-library/actions/runs/40528047872)も採用head89で成功しています。Ready票SHA-256は`45a0f5d6c16ef512d6c63570b639ad7d34f880e5a6db9c5697ddc09f88bbd812`です。最終scope review `419cde2ba2b0aba5ee276c906a2013f8cf4d56d83c13e40629548607daf55e9a`と、通常保護下の統合proof `562b4a6024c7fc5326b847cd4c5a809798ea5fc0b17a884be744e96974593b42`を結び付けています。

[PR #283](https://github.com/pero3dev/ai-agent-library/pull/283)は通常の保護ルールでsquashされ、実mainは`c1e89ad994e424d1cb572802f118a82a42899bea`、親は`76d57595b52eb54b92ac188e3cdcd330c18aa116`、treeは採用89と同じです。2770件のmode/type/blobが採用89と一致し、管理者例外や保護変更はありません。これは読書記録復旧UIの作業単位の採用です。

### Dedicatedの失敗と別Driver作業の境界

同じ親89の[Dedicated40519707868](https://github.com/pero3dev/ai-agent-library/actions/runs/40519707868)では、Fの指定1件は成功、Rの指定1件は失敗し、xcodebuildはexit65・timeoutなしでした。7時点のinstalled App配列が一致しても、RのAppはlive collectorと同じdata containerを使う新PID16161から`Dead`配下のbundleを参照し、記事1件の欠損を報告しました。内部機序は未確定で、本文完了後の52B sentinelも未確認です。Dedicated全体を成功にはしていません。

F/Rで追加seedの書込みが有効でないことと、変更したUITest bundleがXcodeの挙動へ一切影響しないという因果の証明は区別します。独立scope reviewは、未変更だったDriver3を別の作業単位として扱い、失敗を開示したまま復旧UIを採用する境界を確認したものです。[Driver修正PR #284](https://github.com/pero3dev/ai-agent-library/pull/284)のdestination artifact構成は別workflowの確認対象です。本checkpointではその実効果・F/R受入・main採用を未確認として残し、親89やmainc1の正常系で置き換えません。

### mainc1の新pushを独立に確認

採用後の新pushはhead/main c1、attempt1です。PR時点の件数やRelease値を使わず、各runのAPI結果と新しいRAMログから確認しました。凍結manifestのSHA-256は`10d8b8a7e9285b9e682135e6d8381345bc516ab0eea3e3eece8d0e45fbe118fe`です。

| 系統 | 新run | 実測範囲 |
| --- | --- | --- |
| Common | [40528422874](https://github.com/pero3dev/ai-agent-library/actions/runs/40528422874) | deployを含む10 jobsが成功。PRの必須11 policiesや公開画面の独立受入とは別です |
| Native | [40528422662](https://github.com/pero3dev/ai-agent-library/actions/runs/40528422662) | 代表3記事と別fixture4。raw UI4件成功・277.996秒。単体165件・2 skip・失敗0 |
| Full | [40528422694](https://github.com/pero3dev/ai-agent-library/actions/runs/40528422694) | 全199記事。raw UI22件成功・1109.326秒。単体165件・2 skip・失敗0 |

新NativeのRecovery取消しは74.945秒、確認は103.842秒で成功し、各2 launchと再起動後の案内・しおりの公開UI条件をcurrent c1のsource assertionと照合しました。取消し後は案内と旧しおり、確認後は案内消失と旧・今回追加の両しおりを確認しています。初回launch内のnested terminateと、明示的な再起動helperのterminateを分け、raw suite値、backupの生bytes、読書位置精度の受入にはしていません。

新Native Releaseは3記事・音声1本・140ファイル・2577102B、revision `994189bffc65ef21782058280f5f8d9aabae72dbfc63a42e832ac99a177bec56`です。新Full Releaseは199記事・音声1本・625ファイル・36958884B、revision `0c7170913db012fff41c0e14a9b62b64f6173b8e24e207e8f06af4964de5d7fa`です。両方のTestContent除外を確認し、profileと生成値を分離しています。親89とのbyte同一性は主張しません。AppIconはbuilt file/CAR metadataの検査までです。

最終c1/event=push一覧にはこの3runだけがあり、新SDK26・Runtime26・Dedicatedのpush実行はありません。PR89やPR284の別runから補完していません。CommonのPages deploy成功も、公開画面を独立に読んだ受入ではありません。この追記作成でAPI/GET・SDK・UI・Node試験を実行せず、許可されたimmutable Git readerと凍結小票だけを読みました。

### 継続する未受入

旧記録、Coreの過去の性能値、実機、VoiceOver、読書位置精度、backupの生bytes、耐電断・disk永続保証、オフライン・import・同一process再試行等を今回の成功へ付け替えません。IOS-22全体と新Driverの効果は未完了です。private public9の他6記録は変更せず、本記録2本と対応する索引paragraphの更新案だけを後続のdocs commitへ渡します。
