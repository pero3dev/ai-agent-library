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

MacのFoundation回帰7件と、実Storeの読込→不正import→同IDの新版→同梱版復帰→再試行を加えた最終8件が成功した。実199記事・15queryはlegacy入口・索引なしの新filter・索引ありの3方式すべてで、一致記事IDと順序のdigestが一致した。画面修正前head865a85d2のXcode16.2・Simulator SDK18.2では単体117件・UI9件のbuild-for-testingが成功した。全117件を実行した結果ではない。

同じMac CLI harnessの参考値は次のとおり。検証済みmanifestを直接decodeした別processを順に実行し、各queryの初回とwarm5回を測った。コンパイラーはCLT Swift5.8.1、最適化は-O・whole-module-optimizationである。

| 項目 | 索引なしの新filter | 索引あり |
| --- | --- | --- |
| softmaxのwarm中央値 | 188.861167ms | 26.745334ms |
| 同warm範囲 | 187.744〜236.844375ms | 25.881125〜27.601709ms |
| process最大RSS | 17,776,640bytes | 19,365,888bytes |

索引構築の1標本は175.289458ms。索引ありだけはquery前の全正規化でICU等も暖まるため、各方式のfirst queryをcold起動同士の比較に使わない。旧動作と等価なlegacy入口の参考値も保存したが、別の旧app binaryを使った比較ではない。開発作業によるCPU変動があり、別途測定した約160msやlegacyの約386msから改善倍率を算出しない。RSSはmanifest decodeと90検索を含むprocess全体の高水位で、cache単体の容量やiOS appのメモリではない。

起動時間、UIKitの画像・描画、入力遅延、cold disk、実機・VoiceOver、性能の受入目標は未確認で、IOS-15全体は未完了とする。lockfile依存をnpm ci --ignore-scriptsで準備し、共通check722件中707成功・15skip・失敗0と文書・リンク等の検査が成功した。npm監査はlow3・moderate2、high/critical0で、自動修正は行っていない。最終headのHosted通常/全記事試験とReleaseも別途取得する。[JSON](ios-normalized-search-index.json)にソース・rawのSHAと実行面を記録する。

前提の[同梱版切替](ios-bundled-content-activation.md)で検索中の操作入口が見つからないUI失敗を確認し、同じLibraryView修正を取り込んだ。検索索引・Mac8件・15query等価性のコードは変えず、上記SDK117/9はこの画面修正前として保持する。既存UI9件を弱めず、修正後の正確なheadのHosted/Releaseを再取得する。

## 検索中の操作行のタップ範囲

修正前head50a93331の全記事run40182710048は単体109件中107成功・2private入力skip、UI8成功・新規1件失敗でRelease未実施だった。操作行は表示されtapも送られたが、画像ではmenuが開かなかった。AXの外行は{20,354,353,44}、内側Menuは{40,363,139.7,26}で、記録されたtouch down/upの{196.5,376}は外行内・内側範囲外だった。内部routingの原因断定はせず、この不一致を狭い修正の根拠にする。

filtered Menuのラベルを全幅にし、Rectangleのhit領域を指定した。操作内容・guard・既存9件と章候補の追加1件のselector/assertionは変えない。累積app-only SDK buildは成功したが、各正確なbranch headのUI/Release成功を示さない。専用ローカルSimulatorによる診断は初期化中の容量不足でテスト前に中止し、作業で作った端末だけ停止・削除して不在を検証した。実機・既存Simulator・通常記録は操作せず、Hostedで再実行する。

## 検索中の操作選択をシートへ移行

全幅化したhead a03901c0でも全記事run40186338703は単体109件中107成功・2private入力skip、UI8成功・1失敗でReleaseへ進まなかった。filtered Menuを押した後の既存識別子library-bundled-contentが表示されなかった。実touchは(55.3,358.4)、15.65秒後の内側Menu boundsは{40,363,313,26}であり、瞬間boundsやUIKitの機構までは断定しない。

filtered入口を通常Buttonにし、明示的な閉じる付きのSwiftUI操作一覧sheetへ移した。既存の4操作はラベル・識別子・guardを共用し、選択を保留してsheetのonDismiss後にだけ元の操作を実行する。toolbar Menuは直接実行を保つ。検索・タグ等を維持し、固定delay・yieldや既存テストのselector/assertion削減は入れない。

累積0.2.14のapp-only SDK compileは成功したが、各正確なbranch headの動作成功ではない。新sheetのHosted、import/about/専用記事、0件・最大文字・VoiceOver・実機は未確認として保持する。過去の全幅化とSDKの記録は当時の段階であり、本修正の成功証拠へ読み替えない。
