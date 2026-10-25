# 全文検索の正規化索引

## 作業契約

- 目的: [IOS-15](../../plans/engineering/ios-app-completion.md)のうち、検索のたびに全記事を正規化する処理を、読込snapshotごとの不変索引へ移す。
- 許可根拠: ユーザーのTODO優先度順の自律実装・commit・PR・main統合の依頼。実機確認は未完了として継続する。
- 基準: PR #258の0.2.10（12）。今回の版は0.2.11（13）で、既定3記事と記事・保存schemaを維持する。
- 所有: 担当workerはModelsと新SearchIndexTests、親はStore・一覧の接続、Xcode登録、追加Store回帰、文書・検証・Git統合。他者の変更を戻さない。
- 終了条件: 正規化・AND条件・結果順序と改訂時の整合を確認し、Mac・SDK compile・Hosted・実機を分けて記録する。
- 適用: [共通契約](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[iOS手順](../../../ios/README.md)。

## 索引と切替

title・summary・category・search_textを既存と同じ日本語・幅・大小文字・濁点等の正規化で一度だけ変換し、snapshotと一緒に保持する。queryも一覧の絞り込み呼出ごとに一度だけ正規化する。章・タグ・難易度・しおりとのANDと呼出側の順序を保つ。

索引は読込・取り込み・同梱版選択のbackground処理で構築し、本文・学習情報と同じ一括公開へ含める。失敗時は正常な旧版を保持する。同IDの別内容や索引にない記事を受け取った場合は元の正規化検索へ戻り、古い索引の文字列で誤判定しない。既存の索引を渡さない呼出も利用できる。ディスクcacheや永続schemaは追加しない。

## 検証と性能の境界

MacのFoundation回帰7件と、実Storeの読込→不正import→同IDの新版→同梱版復帰→再試行を加えた最終8件が成功した。実199記事・15queryはlegacy入口・索引なしの新filter・索引ありの3方式すべてで、一致記事IDと順序のdigestが一致した。最終Xcode16.2・Simulator SDK18.2では単体117件・UI9件のbuild-for-testingが成功した。全117件を実行した結果ではない。

同じMac CLI harnessの参考値は次のとおり。検証済みmanifestを直接decodeした別processを順に実行し、各queryの初回とwarm5回を測った。コンパイラーはCLT Swift5.8.1、最適化は-O・whole-module-optimizationである。

| 項目 | 索引なしの新filter | 索引あり |
| --- | --- | --- |
| softmaxのwarm中央値 | 188.861167ms | 26.745334ms |
| 同warm範囲 | 187.744〜236.844375ms | 25.881125〜27.601709ms |
| process最大RSS | 17,776,640bytes | 19,365,888bytes |

索引構築の1標本は175.289458ms。索引ありだけはquery前の全正規化でICU等も暖まるため、各方式のfirst queryをcold起動同士の比較に使わない。旧動作と等価なlegacy入口の参考値も保存したが、別の旧app binaryを使った比較ではない。開発作業によるCPU変動があり、別途測定した約160msやlegacyの約386msから改善倍率を算出しない。RSSはmanifest decodeと90検索を含むprocess全体の高水位で、cache単体の容量やiOS appのメモリではない。

起動時間、UIKitの画像・描画、入力遅延、cold disk、実機・VoiceOver、性能の受入目標は未確認で、IOS-15全体は未完了とする。lockfile依存をnpm ci --ignore-scriptsで準備し、共通check722件中707成功・15skip・失敗0と文書・リンク等の検査が成功した。npm監査はlow3・moderate2、high/critical0で、自動修正は行っていない。最終headのHosted通常/全記事試験とReleaseも別途取得する。[JSON](ios-normalized-search-index.json)にソース・rawのSHAと実行面を記録する。
