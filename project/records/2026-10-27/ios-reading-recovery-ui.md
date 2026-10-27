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
