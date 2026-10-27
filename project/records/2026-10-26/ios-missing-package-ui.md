# 同梱記事が欠けた場合と正常版への更新のUI回帰

2026-10-26に準備した試験を、2026-10-27のCore統合後のmain `f5e6221b7dd01132ff76d36e993b13047b15e24c`（tree `fb717f389c8a94a27c942d59673fb9d762bfd683`）へ接続する候補である。Appは0.2.19（21）。実アプリのコードと通常の回帰ケースを保ち、専用の[workflow](../../../.github/workflows/ios-missing-package-ui.yml)と[FailureReaderUITests](../../../ios/AILibraryUITests/FailureReaderUITests.swift)を追加する。現在は私有準備・静的検査までで、新しい実SDKビルド・インストール・UI実行は未確認である。

## 目的と作業範囲

ユーザーの自律実装・commit・PR・通常main統合の依頼に基づく。所有は上記workflow、テストSwift、PBX構成、同名JSONと本記録、project索引と完成版TODOの7パスである。PBXはUIテストへのファイル登録に必要な2オブジェクトと2参照だけを加える。既存App・UIケース・CI・版番号・署名設定を維持する。

[構造化記録](ios-missing-package-ui.json)の既存フィールドは、固定したprivate準備時点のsnapshotである。`root_proposed_integration`へ現在の入力・提案範囲を追加し、過去の未採用状態を新しい成功へ書き換えない。前提mainの新push CIは[共通](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841890)・[Native](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841894)・[全記事](https://github.com/pero3dev/ai-agent-library/actions/runs/40443841889)の3系統で成功した。最終差分の独立レビュー、新headでの必要CIと実F/Rを確認してから通常squashを判断する。

## 二つの確認段階

1. **F: 初期データの欠損**。生成した代表版の正規native JSONを1本だけ取り除き、実際に不完全なアプリを専用Simulatorへ入れる。「コンテンツを読み込めません」と一覧不一致の理由が表示され、本文と正常件数が表示されないこと、再試行後も前面でエラーと再試行操作が保たれることを確認する。
2. **R: 正常版への更新**。取り除いたファイルを正しいbytes・modeへ戻し、全同梱物のinventoryを再照合する。アンインストールせず明示的に正常版を上書きし、保存しておいた固定sentinelのbytes・SHAが更新前後と通常本文ケース後にも残ることを確認する。既存の代表3記事の本文ケースも実行する。

Rは別の正常インストール段階である。壊れたファイルを直した同じプロセスで再試行が成功すること、XCTestが自動で再インストールすること、アンインストールによる復旧は前提にしない。

## 検査と実行の境界

固定sourceから単体153メソッド、通常UI22（機能16＋pure geometry6）、専用性能1、新しいFailure1の宣言・選択範囲を静的に照合した。この件数は新しい実行結果ではない。過去89基線の単体152等はJSONの履歴に保持する。今回の入力ではApp・既存構成を保ち、非所有のmode・type・blobと、PBX追加を逆に除いた元bytesが一致することを確認する。

専用jobは公開リポジトリの標準macos-15、Xcode16.4、iOS18.5／iPhone16の所有Simulator1台を使う。署名・秘密情報・Store操作は含めない。job60分、step合計55分、cleanup4分・driver210秒の上限を維持し、実xctestrun・selector・UUID・OS・install・F/R・sentinel・cleanupを別々に監査する。初回Hostedの結果とartifactは後続の実施記録へ残す。

## 残件と終了条件

前提Core mainの新push CIは成功した。この候補の最終checkpoint差分の独立レビュー・新head実SDK・実F/Rは未完了である。新headの必要チェックと完了ログを照合し、失敗やskipを成功へ変えずに記録する。main統合時も実merge SHA・message・tree・新main検査を確認する。

更新前後の実際のしおり・読書位置の維持は未確認であり、今回のRが直接証明するのはアプリが読み込まない専用確認ファイルの保持である。同じプロセス内での修復後再試行、import picker、初回オフライン、旧記録移行、記事なしroute、最大文字・VoiceOver・実機、IOS-18／25全体は未完了である。ユーザー指定により追加実機確認は未完了のまま省略する。TODOは32行・完了12行を保つ。課金・契約・配布用署名・公開方式・Store申請はこの変更へ含めない。
