# 保存記事版の参照保持と解放の会計

作成日: 2026-10-30。状態: **提出候補**。公開parentは先行単位を通常統合した実main `d321bc1a83fe7d17c0217718c4923499d1f9feb2`。既存候補のbefore3がこのparentと一致することを確認した。IOS-21は未完了、TODOは14/32を維持する。

## 目的と作業契約

表示や非同期読取が使う保存記事版を、将来の容量管理で見失わないため、取得と解放を数える基盤を追加する。所有範囲は`Models.swift`、`ContentRepository.swift`、`LibraryCoreTests.swift`、`ios/AILibrary.xcodeproj/project.pbxproj`、この記録と同名JSON、`project/README.md`、[完成版TODO](../../plans/engineering/ios-app-completion.md)の8パスとする。[共通契約](../../../AGENTS.md)と[運用文書の規約](../../../harness/writing-rules.md#調査記録と運用文書)を適用する。

ユーザーの残りTODOの自律実施・小単位のcommitと通常PR/main統合の依頼を許可根拠とする。実機確認は未完了としてスキップできる。先行単位の通常統合後に所有差分を採用し、別PRで共通検査・独立レビュー・必要CIを確認する。

## 実装する範囲

検証済みcurrentのloadと、pointer確定後のinstall戻り値に共有tokenを付ける。Snapshotの値コピーは同じ取得を共有し、独立loadは別の取得になる。最後の参照の解放時に、threadを問わず同期した会計を減らす。既存document読取もtokenの利用期間内に置く。

保存先の字句pathとUUID世代をキーにし、同じrevisionの別世代を区別する。会計は参考情報であり、0件でも削除してよい根拠にはならない。既存の検証・copy・atomic pointer・rollback・全世代保持を維持し、記事版や読書記録を削除しない。

## 確認済みと未実施

元のca595基準候補3本は、現parentのbefore3とmode/blob・全バイトが一致した。旧LibraryCoreTests全文261,286Bをprefixとして保持する。PR310の追加4件を含む現行の単体249件へ新9件を加えるため、予定総数は258件である。実discoveryや成功数ではない。同一候補の独立静的レビューはP1/P2指摘なしだった。

旧SDKの成功は当時の入力だけの履歴として残す。本文位置修正後の現行App16ソースに候補を重ね、iPhone SDK18.2・iOS17ターゲットでApp module生成22.022秒、LibraryCoreTests型検査5.318秒、各exit 0を新たに確認した。実17入力が今回の候補と全バイト一致することも照合した。macOS14のCoreSmoke compile/link成功は旧6入力の範囲に限り、これらをXCTest実行やiOS17上の受入とは扱わない。

新9件は値コピー、独立load、世代・保存先の分離、親取消後のdetached読取、失敗時の会計と保存bytes、unmanagedの除外、Repositoryを越える保持、background解放を対象とする。最終headのiOS実XCTest、共通検査、必要CIと通常main統合は未確認である。

新9件はmacOS上でも実行し、9件成功・skip0・失敗0を確認した。Core5ソースと追加extension全文19,129B、必要な既存fixture補助9,038Bをバイト照合し、私有harnessのclass定義とrunnerを分けた。非同期2件とMainActorの本文を変えず、実discovery・実行した一意9件をrawへ照合した。私有HOME・preferences・TMPDIRと90秒上限の範囲で、全工程19.381秒だった。iOS上の全258件、UI・VoiceOver・実機、GC安全性の受入とは区別する。

## 後続の容量管理と候補版への影響

削除にはcurrent/last-good、同じ保存先の処理排他、active staging、実体とalias、画像cache・拡大画像の遅延読取、整理上限の保護を別途実装・確認する。今回だけでGC安全性や容量改善を主張しない。

Appの識別を0.2.25（27）へ進め、署名とTeamは保持する。Modelsが変わるため、cb66のCore性能観測を新sourceの成功へ転用しない。既存の署名済み0.2.23（25）候補との入力同値も引き継がず、新候補のbuild・署名・実機受入は別に扱う。
