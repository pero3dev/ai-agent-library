# 全記事一覧が使えるまでの性能観測基盤

## 作業契約

- 目的: IOS-15の起動性能を実アプリで測る入口を整え、測定方法と実測値を照合できる証拠を残す。
- 基準: PR #261 head bc353013ec84b202e78beeeae7396395aaac1ae0。版0.2.14（16）。
- 所有: 専用Swift UIケース・性能workflow・exporter・Node回帰、PBX登録と全記事機能workflow、開発手順・TODO・本記録。分担する他者の変更を戻さない。
- 許可根拠: ユーザーのiOS TODO自律実装と段階的commit・PR・通常main統合の依頼。実機の未確認はスキップして残す。
- 終了条件: 静的・SDK検証と独立レビューを経て初回Hostedを実行し、実出力のClock識別子・単位と標本数を照合する。今回の目標値は未採択。
- 規約: [AGENTS](../../../AGENTS.md)、[Git規約](../../../harness/git-rules.md)、[開発手順](../../../CONTRIBUTING.md)。

## 測定する操作

専用のfresh Hosted runnerで標準全記事生成・独立原文件数・実Debug同梱版の全SHAを監査し、専用performanceケースだけを実行する。起動要求の直前から、正確な全記事件数と学習ガイドの存在確認までをXCTClockMetricで測る。終了処理は範囲外とし、warm-up1回を破棄して3回を記録する。実行blockが計4回あることも検査する。

本文と検索索引・学習索引の非同期読込が完了した画面を確認するため、first frameだけの起動metricとは別である。UI自動操作・AX同期を含み、事前のパッケージ監査でファイルcacheも温まる。disk cold・初回インストール・Release・実機・CPU・メモリ・入力遅延・スクロール・画像decodeは測らず、参考値と製品SLOを混同しない。

## 出力と拒否

専用jobはcontents read、固定actions、新規runner、無署名で動く。機能UIはNativeReaderUITestsとPublishedReaderUITestsの10件を別jobで維持する。専用runner設定や独立件数が欠けたperformanceケースは失敗する。

exporterは実際の唯一のtest ID、一覧と詳細の実行結果、legacyの同じIDと型付きmeasurementを照合する。初期版は生CSVを保存するだけだった。追加guardは生CSVを保持したまま、実5列・1行とtypedの順序付き3値・秒平均を厳密に照合する。型付きの3標本・unitを別根拠として保持し、欠測・非数・異なるIDをゼロで補わない。

初期段階はClock契約を未採択にし、標本を得てもpendingと非ゼロ終了を保った。初回の生出力を独立レビューで照合後、実際のClock識別子・表示名・秒単位を検査する契約を追加した。新headのHosted結果は別に確認する。

## 検証と残件

Swift単独型検査、workflowのactionlint・YAML・Bash・埋込Node、全target SDK compileを確認した。単体119件・機能UI10件・performance1件はコンパイル対象であり、ローカルで実行していない。独立レビューで見つかったexporterの出力ファイルsymlinkと入力衝突は、専用の新規出力directoryと排他的な一度だけの書込へ統一して修正した。catchでも再準備・上書きしない。確認済みのmodern Passedとlegacy Successの一致だけを受理する。旧版の破壊と修正版の入力bytes保持を私有fixtureで照合し、追加27件を含む共通check749件中734成功・15skip・失敗0を確認した。修正後の独立再レビューでも元の破壊条件で入力保持と27件成功を確認し、この2点を解消した。最終treeとHostedの確認は別に追跡する。

前提PR #258の検索中の操作メニューは、head a03901c0の全記事run40186338703でUI8成功・1失敗となり、別途画面の診断を続けている。今回の測定ケースを追加する前の失敗であり、機能UIの成功とは扱わない。既存のselector/assertionを削らず修正後に再検査する。

初回のClock型・単位と生3標本は次節で確認した。新headのHosted・性能目標・実機等は未完了。通常UserDefaults・既存取り込み版・共有3/4記事の資産とユーザーのiPhoneは変更していない。新たな権限・秘密情報・有料サービス・契約や公開申請は含めない。[JSON](ios-published-readiness-observation.json)にsourceと検証の段階を保存する。

## 検索中の操作選択をシートへ移行

全幅化したhead a03901c0でも全記事run40186338703は単体109件中107成功・2private入力skip、UI8成功・1失敗でReleaseへ進まなかった。filtered Menuを押した後の既存識別子library-bundled-contentが表示されなかった。実touchは(55.3,358.4)、15.65秒後の内側Menu boundsは{40,363,313,26}であり、瞬間boundsやUIKitの機構までは断定しない。

filtered入口を通常Buttonにし、明示的な閉じる付きのSwiftUI操作一覧sheetへ移した。既存の4操作はラベル・識別子・guardを共用し、選択を保留してsheetのonDismiss後にだけ元の操作を実行する。toolbar Menuは直接実行を保つ。検索・タグ等を維持し、固定delay・yieldや既存テストのselector/assertion削減は入れない。

累積0.2.14のapp-only SDK compileは成功したが、各正確なbranch headの動作成功ではない。新sheetのHosted、import/about/専用記事、0件・最大文字・VoiceOver・実機は未確認として保持する。過去の全幅化とSDKの記録は当時の段階であり、本修正の成功証拠へ読み替えない。

## 初回の実Clock出力とCSV照合

head e8032494のrun40188893652で専用case1件は成功し、4 invocation中warm-up1回を破棄して3標本を取得した。exporterは契約nullの設計どおりpending/非ゼロとなり、初回workflow全体は失敗である。JSON・CSV・raw log・xcresult添付でClock識別子com.apple.dt.XCTMetric_Clock.time.monotonic、表示名Clock Monotonic Time、単位s、全199記事と学習guideの確認を独立に照合した。

3値は13.72942072・15.904793718・11.233647974秒、中央値13.72942072秒。Debug SimulatorでUI操作/AX同期を含み、事前監査でcacheが温まった取引の参考値であり、appのcold起動・実機・製品目標ではない。XCTest既定のbaseline0や10percent等は予算へ採用しない。

実CSV247bytesは5quoted columns・1rowで末尾newlineが無く、3値がtyped原順と一致した。mean13.622620804秒と印字13.6226208秒の差4e-9は最終小数位の半刻み5e-8以内である。新guardはBigInt十進演算でこの丸めだけを許し、epsilon0とする。宛先/構成・unit・順序・欠測・別metric等は拒否する。export manifestのcsv.csvと実csvの差は観測として保持し、filenameを無検査pathへ使わない。

追加source2はNode36件と独立レビュー、保存済rawをprivate doubleでCLIへ再生する出口0の照合を通した。元入力SHAは不変で、新測定・新head Hosted成功ではない。SDK署名guard7件も含むworkspace共通checkは765件中750成功・15skip・失敗0であり、PR262だけのexactなruntime検証と混同しない。
