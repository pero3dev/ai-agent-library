# 読書記録の破損と明示復旧の候補

2026-10-27。基準は `f5e6221b7dd01132ff76d36e993b13047b15e24c`。私有候補を準備した段階で、統合・実SDK・Hosted・画面受入は未完了である。機械可読の範囲と検証は[同名JSON](ios-reading-state-recovery.json)に残す。

## 目的と所有範囲

[IOS-22](../../plans/engineering/ios-app-completion.md)のうち、破損した読書記録を黙って空集合へ置き換え、次の閲覧操作で原データを失う経路を防ぐ。[ReadingStore](../../../ios/AILibrary/Sources/ReadingStore.swift)、[LibraryStore](../../../ios/AILibrary/Sources/LibraryStore.swift)、[一覧画面](../../../ios/AILibrary/Sources/LibraryView.swift)、[既存XCTest](../../../ios/AILibraryTests/LibraryCoreTests.swift)だけを実装対象とする。他者の編集を戻さず、固定mainを基準に準備した。ユーザー承認済みのiOS TODO自律実施の内側で、原データ保全と利用者による明示復旧を扱う。外部操作は0件である。

## 変更と保全

しおり配列・記事別位置・位置内の旧フィールドを独立に読み、正常な要素と他記事の記録を残す。破損を検知したら元の保存keyを変更せず、一覧で案内する。今回の操作はメモリに残り、明示復旧を選ぶまで永続化されないことを表示する。

復旧操作は、元Dataが変わっていないこと、固定の同namespace退避keyが空であること、退避後に同processのUserDefaults読み戻し一致を確認する。diskへの永続化や電源断の耐障害性を保証する検査ではない。退避を確認してから、読めた記録と今回の操作を保存する。退避直後に元keyを再確認し、既存退避・退避失敗・元データ変更時は上書きせず案内する。復旧状態の保存確認に失敗した場合も原Dataの退避を残す。退避は1keyで既存値を上書きせず、自動削除もしない。

読み込み前のData上限は1MiBで、超過または非Dataは解析・退避コピーせず原keyを保護して案内する。正常な旧JSON、既存anchor、通常の保存方法、専用テストsuiteの分離は保つ。新しいネットワーク・署名・配信・権利・クラウドの動作は追加しない。

## 検証と残件

最終候補のSwift 4ファイルに `swiftc -frontend -parse` を実行して成功した。これは構文解析であり、型検査・SDK build・XCTest実行ではない。既存テスト本文を削除・変更せず12件を追加し、混在要素、部分field、今回の操作、明示復旧、固定退避、書込/readback失敗、復旧中の元key変更、入力上限、名前空間、正常旧JSON、Storeの通知を検査する候補とした。optional anchorの将来版・不正値は従来どおり独立にfallbackし、正常なlegacy記録の保存を止めない。anchorモデルと通常の読書操作は変更していない。

この私有作業では依存導入・コンテンツ生成・大きな出力・新module cache・SDK build/test・ネット/API・Git変更を行っていない。Rootによる独立最終レビューとHostedでの実SDK compile／実XCTestが必要である。確認の取消、案内、復旧後再起動の画面受入と、実機・VoiceOverは未実施。実機確認はユーザー指定によりスキップし、成功とは扱わない。記事改名・削除等の移行とIOS-22全体は未完了で、TODOの完了数は変更しない。

## 採択候補の入口同期と版番号

2026-10-27、同じ基準mainに対する別の採択候補として、計画・iOS手順・実施記録索引へ短い案内を追加した。実装4ファイルは独立レビュー済みの凍結候補から変更せず、この記録の上記内容と初回検証事実も保持した。アプリのDebug／Release両設定で `MARKETING_VERSION` を0.2.19から0.2.20へ、`CURRENT_PROJECT_VERSION` を21から22へ更新する。他のPBX設定、署名、UI、コンテンツ、TODOの32行と完了12件は変更しない。

追加同期の検証は既存依存のMarkdownlintによる入口3文書と本記録、JSON解析、版番号だけのPBX差分、既存文と凍結候補の保持照合に限定する。結果は同名JSONの採択候補節に残す。新SDK・実XCTest・UI・実機確認、Swift構文解析の再実行、ネット/API、Git変更は行っていない。新しいmainへの統合とHosted実行は未実施で、そのSHA・runは未確定である。IOS-22全体は未完了を維持する。
