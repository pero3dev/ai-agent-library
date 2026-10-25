# 旧snapshotと更新失敗時の保持契約の回帰

## 作業契約

- 目的: IOS-21の容量管理へ進む前に、既存の保存処理で守るべき旧版・現行版・読書記録を実repositoryで検査する。
- 基準: PR #263 head1570335f0ec65de09935872401e00fdf828f20b7。版0.2.14（16）を保つ。
- 所有: LibraryCoreTestsの追加3件、開発手順・TODO・本記録と索引。既存119件と他者の差分を戻さない。
- 許可根拠: ユーザーのiOS TODO自律実装・段階的commit/PR/通常main統合の依頼。実機の未確認を残す方針を継承する。
- 終了条件: 私有Mac実行・SDK compile・独立レビューを照合し、最終headのHosted単体で3件を実行する。
- 規約: [AGENTS](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[開発手順](../../../CONTRIBUTING.md)。

## 追加した3件

A→B→Cの本文・revision固有PNGを持つ実パッケージをimportし、全切替後も保持した旧snapshotから本文とassetを再読する。UIの画像cache検査ではなく、実disk URLと本文の参照先・bytesを独立した期待値と照合する。全版を現在のpolicyで保持する実装に対する回帰である。

正常な孤立stagingと未参照UUID版を配置し、Storeのloadとretryが現行pointerを優先することを確認する。全regular-file bytes、versions直下の名前、読書記録Dataを比較して、勝手な選択・削除・改変を検出する。

pointer writerへfileWriteOutOfSpaceを注入し、完全destinationの配置・検証後に失敗したことを確認する。失敗試行だけが取り除かれ、旧版2本・既存の孤立版・現行pointerと本文・asset・読書記録のbytesが保たれることを検査する。実ディスクを満杯にする試験ではない。

## 検証と境界

private rootで現在のproduction7ソースをbytecopyして実moduleをcompileし、新3件をMac XCTestで実行した。3成功・0失敗・0skip。CLI抽出の末尾属性と一時path aliasの初回harnessエラーは製品の不具合や検証成功と区別して保存した。

追加だけの候補を独立レビューで照合後にLibraryCoreTestsだけへ反映した。元の全method順序と119件を保ち、全app Sources・PBX・既存UI3ソース・版は不変。Xcode16.2/SDK18.2でunit122・機能UI10・performance1を含むbuild-for-testingが成功し、actual unit binary内の新3件も確認した。これはcompileであり、iOS上の122件の実行成功ではない。共通checkも749件中734成功・15skip・失敗0を確認した。

iOS/Hostedの新3件実行、実ENOSPC・kill・cleanup・snapshot pin/lease・処理排他・容量の受入目標は未確認である。UserDefaults等の私有suiteと一時rootだけを用い、通常の読書記録・iPhone・共有生成物は変更していない。削除機能・自動整理・保持数・独立配信は実装しない。[JSON](ios-storage-retention-regression.json)で段階とsource SHAを追跡する。
