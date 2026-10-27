# 読書記録の復旧を確認するUI回帰の準備

[読書記録の破損保全と明示復旧](ios-reading-state-recovery.md)を公開UIから検査する、未採用の試験候補を準備した。基準はeab `eabf1a67ed6ceb0cd9e7bd2e20ba5bcb413020fa`／tree `740bbbfa73f1b850f7864c961ba78ab3ecb476d5`で、準備時点に確認されたmain `76d57595b52eb54b92ac188e3cdcd330c18aa116`も同じtreeである。新ファイルの不存在は確認済みだが、公開前のfresh before blobとmain採用は後段で別に束縛する。詳細は[JSON](ios-reading-recovery-ui.json)に記録する。

seedはDEBUGの既存隔離suite経路で、追加flag `AILIBRARY_UI_TEST_READING_RECOVERY=partial-v1`の完全一致、UUID形式のsuite suffix、空のnamed persistent domainが揃った場合だけ、ReadingStore作成前に固定57-byte Dataを一度保存する。有効なしおりと壊れたsiblingを実decoderへ渡す方式で、再launch時の非空domainは再seedしない。既存domainの初期化・削除・上書き、standard defaultsやReleaseへのseed、期待本文の注入、validator迂回、driverによるuser Data操作は加えない。

技術変更は[App起動](../../../ios/AILibrary/Sources/AILibraryApp.swift)、[共通UI test base](../../../ios/AILibraryUITests/NativeReaderUITests.swift)、[新Recovery class](../../../ios/AILibraryUITests/ReadingRecoveryUITests.swift)、[PBX登録](../../../ios/AILibrary.xcodeproj/project.pbxproj)、[Native CI](../../../.github/workflows/ios-native.yml)の5ファイルである。default falseの起動前hookで二重launchを避け、新classの2 caseだけがseedを要求する。将来のNative選択は既存2件＋新2件の4件で、現在のFull22件、別候補のCopy23件、Dedicated F/Rと単体の選択・既存待機上限は保持する。これらはsource宣言数であり、新しい実行件数ではない。

cancelのcaseは、partial案内と読めたAgentループのしおりを確認し、確認dialogをcancelした後も、同じsuiteで再起動した後も案内と既存しおりが残ることを試す。confirmのcaseは、復旧前にTool Useのしおりを公開UIから追加し、confirmと同suite再起動後に既存・今回追加の両方のしおりが残ることを試す。本文は通常packageとvalidatorを経る既存helperで確認し、案内消失は全issue共通の警告文も対象にする。実際のdialog・再起動動作は未確認である。

実施済みはSwift frontendの構文parse 3回・計5ファイル選択、固定DataのJSON確認と構造保持、最終5ファイルの独立レビューまでである。限定変更を逆適用すると既存4ファイルのeab全bytesが復元され、標準／Release経路、既存helpers・case、Full／Copy／Dedicatedの範囲を保持した。技術manifestのSHA-256は`495f05471f69d748036772276db39e6b67168db16fa104a067b9bcd687be0f20`、独立レビュー票は`8f7c61ded268cab6c918ecde19910b1ec0d92a521c71ac23e22447120fa9a369`。構文parseと静的レビューをSDK型検査や実XCTest成功として扱わない。

実SDK・実UI、新current run、actualmainへの機能採用は未実施で、JSONではnullを保持する。2 caseはしおり2種のUI保持を対象とし、読書位置、backupの生bytes、耐電断・disk永続保証、VoiceOver・実機とIOS-22全体は未受入である。技術5と本記録2は別commitを想定し、fresh main binding、最終literal・独立レビューと新headの通常CI／実UI確認は後続作業に残す。本記録作業ではsource・他記録・索引本体を変更せず、SDK・API・Git操作を行っていない。
