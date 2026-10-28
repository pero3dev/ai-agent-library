# main49: App起動から全記事数・学習ガイド確認までのClock観測

## 対象と計測境界

[run40577263200](https://github.com/pero3dev/ai-agent-library/actions/runs/40577263200) / job122446924405、attempt1の実測です。`workflow_dispatch`で固定したmain `49c2780943ddef0d2e5769d7b620b72fd8a043ab`、tree `8cfcea67aa39785900d4893137bb559a61efe5a9`、App0.2.20（22）のDebugを、Xcode16.4（16F6）・iPhone16 Simulator / iOS18.5で実行しました。Source3と実checkoutは別の凍結票で照合済みです。

`PublishedPerformanceUITests/testLaunchToPublishedReadiness()`のClockは、`app.launch()`直前から、記事数ラベルの存在と値`全199記事`、`library-learning-guide`ボタンの存在を確認するまでを測ります。終了処理は計測の外です。UI自動操作・アクセシビリティの待機を含み、事前のファイル監査でcacheも温まります。画像の初回表示やガイドの実操作までを独立確認した値ではありません。

## 3標本とCSVの照合

型付きmetricとCSVを対応させ、同じdevice UUIDを確認しました。1ケースはPassed、記録値は次の3件です。warm-up1回・計4回の呼出しはSourceの設定とPassed assertionに基づきます。`Published-readiness-measurement-protocol`添付の本文は未読です。

| 標本 | Clock秒（rawの十進表記） |
| --- | --- |
| 1 | `7.020270305` |
| 2 | `6.532122296000001` |
| 3 | `9.211471599000001` |

最小は6.532122296000001秒、中央値は7.020270305秒、最大は9.211471599000001秒です。JavaScriptのbinary64で各標本を3で割り、元の順に加算した平均は7.5879547333333335秒、CSVの平均印字は7.587954733秒でした。raw tokenを十進有理数として平均した値とCSVとの差は正確に`1000002 / 3000000000000000`秒（約0.000000000333334秒）で、CSVの最終小数位の半刻み0.0000000005秒より小さく、丸めと整合します。binary64平均・十進有理平均・CSVを同じ精度の値とは扱いません。

## 証跡と確認範囲

[artifact12768059508](https://github.com/pero3dev/ai-agent-library/actions/runs/40577263200/artifacts/12768059508)の圧縮233139B全体をSHA-256 `a8943948c5e1860aafb8688e8a206851341331dca222d7da569f693c5a1f4ef5`と照合しました。index63件からcontext、型付きsummary・raw tree/details/legacy3件、抽出commandsとCSVの計9memberを選び、CRCとSHAを確認しました。選択展開量は123317B、未選択payloadとそのCRCは未確認です。raw ZIP・xcresult・画像は保存せず、この文書化でも再取得・新しいSDKや試験の実行は行っていません。正確なGET日時は凍結票にないため推測で補いません。

| 凍結入力 | SHA-256 |
| --- | --- |
| 選択読取と観測値 | `51e25ab2ec360edea7723f7cda45e930e912ea4db60565378aeecf0b97173a8e` |
| Source3・実checkout照合 | `1fd0e4fd0c33bdc96b746f8d70a039387d982cd9ad3d46bedf0831d5f3139b81` |
| 終端run/job/artifact metadata | `e17e2986c7b0f808fc066d7a1c42205b128898fb9b9936f9dd642cc6d018737d` |
| 7pinの結合と逆変換 | `75aedbb955a47b6887732dd1b23af86b8a456c20b46a175881ce59bbd3563790` |
| v2 readerの独立レビュー | `fd36eac7bbf60dc768a5e0a3737c6c53b0cc3af7326ca3ea05a3edc8dfab0215` |

[従来の観測基盤](../2026-10-25/ios-published-readiness-observation.md)と、[workflow](../../../.github/workflows/ios-performance.yml)・[exporter](../../../ios/tests/export-performance.mjs)・[専用UIケース](../../../ios/AILibraryUITests/PublishedPerformanceUITests.swift)を起点にします。この結果は指定SourceのApp計測で、過去のCore CLI19process・15sampleとは対象が異なります。両者を同じ性能の再測定や改善率として比較しません。

## 残る受入

disk cold・初回インストール・Release・実機の起動、p95、CPU/RSS・検索・スクロール、性能予算の合否は未受入です。contextの`hw.memsize=7516192768`Bはhostの容量であり、AppのRSSではありません。単一run・3標本の結果を、新しいmainやCopy/Audio候補、iOS全体の受入へ広げません。既存IOS-15とTODO32行・完了12行を変更せず、IOS-18・23・25等を新たに完了にはしません。

提出時の独立レビュー、mainへの統合と共通CIは対応するPRで追跡します。ここに記録した計測値は固定したmain49の結果です。
