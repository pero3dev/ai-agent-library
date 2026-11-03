# 初期読み込み失敗と利用できない記事からの復旧

## 作業契約

- 目的: [IOS-18](../../plans/engineering/ios-app-completion.md)のうち、初期読み込み失敗と存在しない記事への遷移が空白・検索0件へ紛れる経路を修正する。
- 許可根拠: ユーザーのTODO優先度順の自律実装とcommit・PR・main統合の依頼。実機操作が必要な部分は未完了で記録する。
- 基準: 章・難易度の絞り込みPR #250。通常3記事・fixture専用画面と既存の保存版・同梱fallbackを維持する。
- 所有: 実装担当はLibraryStore・LibraryView・LibraryCoreTestsの3ファイル。親は版0.2.7（9）、README・計画・記録とGit統合を担当する。他者の変更を戻さない。
- 検証・終了条件: 実packageの破損・修復・再試行とimport失敗で、snapshot・エラー・しおり・読書位置・正常版pointerを確認する。SDK compile、非UI実行、iOS XCTest、実画面を分け、独立レビュー後に専用PRへ保存する。
- 適用: [共通契約](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[iOS手順](../../../ios/README.md)。

## 実装

初期読み込み用の`loadError`を更新失敗のalertから分け、snapshotがない場合は理由と「再試行」を表示する。再試行は既存のRepositoryへ戻り、成功load・importで初期エラーを消す。失敗中にしおりや読書記録を書き換えず、通常の検索0件とは区別する。

navigationの対象記事がsnapshotにない場合は「記事を利用できません」と「記事一覧へ戻る」を表示する。独立レビューでは、初期失敗中の不正importでも「現在のコンテンツを利用できます」と案内する既存文言を指摘し、snapshotがない場合は未読込・別のフォルダ・再試行の案内へ修正した。正常版がある場合の案内とrollbackを維持する。

## 検証と残件

新規XCTest2件を追加した。1件目は実private packageを破損させ、初期失敗・再失敗後に修復し、同じStoreでの再試行成功と保存bytes不変を確認する。2件目は初期失敗中の不正import、正規importによる復帰、その後の不正更新拒否を順に検査し、snapshot・error・alert・保存領域・正常版pointerを照合する。

最終のXcode 16.2・iPhoneSimulator18.2 build-for-testingと通常CoreSmoke（3記事・音声1本・140ファイル）が成功した。同じ新規2メソッドを抽出し、実LibraryStore・ContentRepositoryと実packageを使ったmacOSの非UI検査でも成功した。独立した再レビューで指摘解消と凍結SHA・検証証跡の一致を確認した。

Simulatorの新起動と実機操作は行っていない。iOS XCTest本体、再試行と一覧へ戻る実画面、最大文字・VoiceOverは未確認で、IOS-18全体を完了としない。[JSON](ios-load-recovery.json)へ実行面を区別して保存する。
